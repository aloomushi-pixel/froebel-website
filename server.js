import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { Resend } from 'resend';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend safely
const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_MASTER_API_KEY || '';
const resend = resendKey ? new Resend(resendKey) : null;
const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL || 'info@froebelinstituto.com.mx';

// Pre-warm in-memory HTML & GEO document cache (eliminates disk stat/open/read TTFB overhead)
const MEMORY_DOC_CACHE = new Map();
function warmMemoryDocCache(dir, urlPrefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'assets', 'scripts', 'styles'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      warmMemoryDocCache(fullPath, `${urlPrefix}/${entry.name}`);
    } else if (
      (/\.(html|txt|xml|json)$/i.test(entry.name) && !/^package(-lock)?\.json$/i.test(entry.name)) ||
      entry.name.toLowerCase() === 'pricing.md'
    ) {
      const buf = fs.readFileSync(fullPath);
      const stat = fs.statSync(fullPath);
      const etag = `W/"${buf.length.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
      const ext = path.extname(entry.name).toLowerCase();
      const contentType =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.xml'
          ? 'application/xml; charset=utf-8'
          : ext === '.json'
          ? 'application/json; charset=utf-8'
          : ext === '.md'
          ? 'text/markdown; charset=utf-8'
          : 'text/plain; charset=utf-8';
      const routePath = `${urlPrefix}/${entry.name}`;
      const record = { buf, etag, contentType, isHtml: ext === '.html' };
      MEMORY_DOC_CACHE.set(routePath, record);
      if (entry.name === 'index.html') {
        MEMORY_DOC_CACHE.set(urlPrefix ? `${urlPrefix}/` : '/', record);
      } else if (ext === '.html' && !urlPrefix) {
        MEMORY_DOC_CACHE.set(`/${entry.name.slice(0, -5)}`, record);
      }
    }
  }
}
try {
  warmMemoryDocCache(__dirname);
} catch (err) {
  console.warn('Memory doc cache warm warning:', err.message);
}

// Middleware
app.disable('x-powered-by');
app.use(compression({ level: 6, threshold: 1024 }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Block sensitive server/config files from public HTTP access
const BLOCKED_PATTERNS = [
  /\.env/i,
  /\.gsc-credentials/i,
  /package(-lock)?\.json$/i,
  /server\.js$/i,
  /Dockerfile/i,
  /\.py$/i
];

app.use((req, res, next) => {
  if (BLOCKED_PATTERNS.some((rx) => rx.test(req.path))) {
    return res.status(404).end();
  }
  next();
});

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  },
});

const escapeHtml = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildAdminWhatsAppReplyUrl = (rawPhone, personName, contextLabel) => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const tenDigits = digits.length >= 10 ? digits.slice(-10) : '';
  if (tenDigits.length !== 10) return '';
  const cleanName = String(personName || 'familia').trim();
  const msg = `Hola ${cleanName}, te escribimos de Admisiones del Instituto Federico Froebel respecto a tu ${contextLabel}. ¿Cómo podemos ayudarte?`;
  return `https://wa.me/52${tenDigits}?text=${encodeURIComponent(msg)}`;
};

const createEmailTemplate = (title, data, whatsappReplyUrl = '') => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="background-color: #0d47a1; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0;">${escapeHtml(title)}</h2>
    </div>
    <div style="background-color: #f5f7fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e1e4e8;">
      ${
        whatsappReplyUrl
          ? `<div style="margin-bottom: 16px;">
              <a href="${whatsappReplyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 11px 18px; border-radius: 999px; font-size: 14px;">📲 Responder al Tutor por WhatsApp en 1 Clic</a>
            </div>`
          : ''
      }
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(data)
          .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
          .map(
            ([key, value]) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 40%;">${escapeHtml(key)}:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapeHtml(value)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
  </div>
`;

const createAutoReplyTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #0d47a1;">¡Hola, ${escapeHtml(name)}!</h2>
    <p>Hemos recibido tu información exitosamente en <strong>Instituto Federico Froebel</strong> (San Juan de Aragón, Gustavo A. Madero). Nuestro equipo de admisiones se pondrá en contacto contigo muy pronto para darle seguimiento a tu solicitud.</p>
    <p>Si deseas atención inmediata por WhatsApp, escríbenos al <a href="https://wa.me/525554148872">55 5414 8872</a>.</p>
    <p>Atentamente,<br><strong>Instituto Federico Froebel</strong><br>Av. 521 No. 20, San Juan de Aragón I Secc, Gustavo A. Madero, CDMX</p>
  </div>
`;

// --- API ENDPOINTS ---

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!cleanName || (!hasValidEmail && !cleanPhone)) {
      return res.status(400).json({ error: 'Nombre y teléfono o correo válido son obligatorios' });
    }

    if (!resend) {
      console.warn('Falta variable de entorno RESEND_API_KEY');
      return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
    }

    const waReplyUrl = buildAdminWhatsAppReplyUrl(cleanPhone, cleanName, 'solicitud de informes / apartado');
    const htmlContent = createEmailTemplate(
      'Nuevo Mensaje / Pre-Registro — Instituto Federico Froebel',
      {
        Nombre: cleanName,
        'Teléfono / WhatsApp': cleanPhone || 'No proporcionado',
        Correo: hasValidEmail ? cleanEmail : 'No proporcionado',
        Mensaje: message || '-',
      },
      waReplyUrl
    );

    const emailPayload = {
      from: 'Instituto Federico Froebel Web <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Nuevo contacto / pre-registro de: ${cleanName}`,
      html: htmlContent,
    };
    if (hasValidEmail) {
      emailPayload.reply_to = cleanEmail;
    }

    const { error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (hasValidEmail) {
      await resend.emails.send({
        from: 'Instituto Federico Froebel <info@froebelinstituto.com.mx>',
        to: [cleanEmail],
        subject: 'Recibimos tu solicitud - Instituto Federico Froebel',
        html: createAutoReplyTemplate(cleanName),
      });
    }

    res.status(200).json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/enroll', upload.any(), async (req, res) => {
  try {
    const enrollmentData = req.body;
    const files = req.files || [];

    if (!resend) {
      console.warn('Falta variable de entorno RESEND_API_KEY');
      return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
    }

    let student = {};
    let guardian = {};
    let payment = {};

    try {
      student = JSON.parse(enrollmentData.student || '{}');
      guardian = JSON.parse(enrollmentData.guardian || '{}');
      payment = JSON.parse(enrollmentData.payment || '{}');
    } catch (e) {
      console.error('Error parsing enrollment JSON data', e);
    }

    const cleanGuardianEmail = typeof guardian.email === 'string' ? guardian.email.trim() : '';
    const hasValidGuardianEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanGuardianEmail);
    const programLabels = {
      maternal: 'Maternal Bilingüe (1 a 3 años · 08:30–13:30h)',
      preescolar_1: 'Kínder 1 / 1° Preescolar SEP (3 a 4 años · 08:30–14:00h)',
      preescolar_2: 'Kínder 2 / 2° Preescolar SEP (4 a 5 años · 08:30–14:00h)',
      preescolar_3: 'Kínder 3 / 3° Preescolar SEP (5 a 6 años · 08:30–14:00h)',
    };
    const planLabels = {
      pronto_pago: 'Pronto Pago ($3,600 MXN/mes · primeros 10 días)',
      normal: 'Mensual Normal ($4,000 MXN/mes)',
      anual: 'Pago Anual ($40,480 MXN · 8% de descuento)',
    };
    const estanciaLabels = {
      ninguna: 'Sin estancia (Horario escolar base)',
      parcial_16h: 'Estancia Parcial hasta 16:00h (+$1,400 MXN/mes)',
      completa_18h: 'Estancia Completa hasta 18:00h (+$1,900 MXN/mes)',
    };
    const baseMonthly = student.plan === 'normal' ? 4000 : 3600;
    const extraMonthly = student.estancia === 'parcial_16h' ? 1400 : student.estancia === 'completa_18h' ? 1900 : 0;
    const estimatedSummary =
      student.plan === 'anual'
        ? `$40,480 MXN anual${extraMonthly ? ` + $${extraMonthly.toLocaleString('es-MX')} MXN/mes de estancia` : ''}`
        : `$${(baseMonthly + extraMonthly).toLocaleString('es-MX')} MXN/mes integrado`;

    const primaryPhone = guardian.whatsapp || guardian.phone || student.parent_phone || '';
    const waReplyUrl = buildAdminWhatsAppReplyUrl(
      primaryPhone,
      guardian.full_name || student.full_name || 'familia',
      `solicitud de inscripción (${programLabels[student.program] || student.program || 'Ciclo 2026-2027'})`
    );

    const htmlContent = createEmailTemplate(
      'Nueva Solicitud de Inscripción — Instituto Federico Froebel',
      {
        'Tutor - Nombre': guardian.full_name || '-',
        'Tutor - Teléfono': guardian.phone || student.parent_phone || '-',
        'Tutor - WhatsApp': guardian.whatsapp || guardian.phone || student.parent_phone || '-',
        'Tutor - Correo': hasValidGuardianEmail ? cleanGuardianEmail : 'No proporcionado',
        'Tutor - Parentesco': guardian.relationship || '-',
        'Tutor - Domicilio': guardian.address,
        'Contacto de Emergencia':
          guardian.emergency_contact_name || guardian.emergency_contact_phone
            ? `${guardian.emergency_contact_name || ''} ${guardian.emergency_contact_phone ? `(${guardian.emergency_contact_phone})` : ''}`.trim()
            : undefined,
        'Alumno - Nombre': student.full_name || '-',
        'Alumno - Fecha de Nacimiento': student.date_of_birth || student.birth_date || '-',
        'Alumno - Género': student.gender,
        'Alumno - Programa SEP': programLabels[student.program] || student.program || '-',
        'Alumno - CURP': student.curp,
        'Alumno - Tipo de Sangre': student.blood_type,
        'Alumno - Alergias': student.allergies,
        'Alumno - Notas Médicas': student.medical_notes,
        'Plan de Colegiatura': planLabels[student.plan] || student.plan || '-',
        'Estancia / Comedor': estanciaLabels[student.estancia] || student.estancia || 'Sin estancia (Horario escolar base)',
        'Cotización Estimada': estimatedSummary,
        'Método de Pago': payment.method === 'acordar_despues' ? 'Acordar en dirección / posteriormente' : payment.method || '-',
        'Referencia de Transferencia': payment.transferRef,
        'Archivos Adjuntos': `${files.length} documento(s)`,
      },
      waReplyUrl
    );

    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const humanProgram = programLabels[student.program] ? programLabels[student.program].split(' (')[0] : student.program || 'Preescolar/Maternal';
    const enrollEmailPayload = {
      from: 'Instituto Federico Froebel Inscripciones <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Inscripción: ${student.full_name || 'Nuevo Alumno'} (${humanProgram})`,
      html: htmlContent,
      attachments,
    };
    if (hasValidGuardianEmail) {
      enrollEmailPayload.reply_to = cleanGuardianEmail;
    }

    const { error } = await resend.emails.send(enrollEmailPayload);

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (hasValidGuardianEmail) {
      await resend.emails.send({
        from: 'Instituto Federico Froebel <info@froebelinstituto.com.mx>',
        to: [cleanGuardianEmail],
        subject: 'Recibimos tu solicitud de inscripción - Instituto Federico Froebel',
        html: createAutoReplyTemplate(guardian.full_name || 'Familia'),
      });
    }

    res.status(200).json({ success: true, message: 'Inscripción enviada exitosamente' });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la inscripción' });
  }
});

// Canonical 301 Redirects for legacy .html URLs (prevents Google Search Console duplicate URLs)
const ROOT_CLEAN_SLUGS = new Set([
  '/nosotros',
  '/programas',
  '/inscripciones',
  '/contacto',
  '/maternal-bilingue-1-a-3-anos',
  '/preescolar-stem-3-a-6-anos',
  '/horario-extendido-y-comedor',
  '/instalaciones-y-seguridad',
]);

const LEGACY_ASSET_REDIRECTS = new Map([
  ['/assets/images/instalaciones-seguras-kinder-gam.jpg', '/assets/images/instalaciones-kinder-patio-juegos-gam.webp'],
  ['/assets/images/instalaciones-seguras-kinder-gam.webp', '/assets/images/instalaciones-kinder-patio-juegos-gam.webp'],
  ['/assets/images/aula-preescolar-metodo-froebel.jpg', '/assets/images/material-didactico-dones-froebel.webp'],
  ['/assets/images/aula-preescolar-metodo-froebel.webp', '/assets/images/material-didactico-dones-froebel.webp'],
  ['/assets/images/maternal-estimulacion-temprana-cdmx.jpg', '/assets/images/salon-maternal-bilingue-froebel.webp'],
  ['/assets/images/maternal-estimulacion-temprana-cdmx.webp', '/assets/images/salon-maternal-bilingue-froebel.webp'],
]);

// Security & GEO AI-Discovery headers on all responses
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (/^\/(api(\/|$)|admin(\.html|\/|$))/i.test(req.path || '')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const p = req.path || '/';
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  if (LEGACY_ASSET_REDIRECTS.has(p)) {
    return res.redirect(301, LEGACY_ASSET_REDIRECTS.get(p) + qs);
  }
  if (p === '/index.html') {
    return res.redirect(301, '/' + qs);
  }
  if (p === '/blog' || p === '/blog/index.html') {
    return res.redirect(301, '/blog/' + qs);
  }
  if (p.startsWith('/blog/') && p !== '/blog/') {
    const rawPathOnly = req.url.split('?')[0];
    let decodedBlog = p;
    try {
      decodedBlog = decodeURIComponent(rawPathOnly);
    } catch {
      decodedBlog = rawPathOnly
        .replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\u00c3([\u00a0-\u00ff])/g, '$1');
    }
    let asciiBlog = decodedBlog
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\/+$/, '');
    if (
      asciiBlog === '/blog/por-que-mi-hijo-llora-al-dejarlo-en-kinder.html' ||
      asciiBlog === '/blog/por-que-mi-hijo-llora-al-dejarlo-en-kinder'
    ) {
      return res.redirect(301, '/blog/por-que-mi-hijo-llora-al-dejarlo-en-el-kinder.html' + qs);
    }
    const candidateHtml = asciiBlog.endsWith('.html') ? asciiBlog : `${asciiBlog}.html`;
    if (MEMORY_DOC_CACHE.has(candidateHtml) && rawPathOnly !== candidateHtml) {
      return res.redirect(301, candidateHtml + qs);
    }
  }
  if (p === '/colegio-cerca-de-mi' || p === '/colegio-cerca-de-mi/') {
    return res.redirect(301, '/contacto' + (qs || '#como-llegar'));
  }
  const geoMatch = p.match(/^(\/colegio-cerca-de-mi\/[^/]+)\/index\.html$/i);
  if (geoMatch) {
    return res.redirect(301, `${geoMatch[1]}/${qs}`);
  }
  const geoNoSlash = p.match(/^(\/colegio-cerca-de-mi\/(san-juan-de-aragon|romero-rubio|penon-de-los-banos|gertrudis-sanchez|nueva-tenochtitlan))$/i);
  if (geoNoSlash) {
    return res.redirect(301, `${geoNoSlash[1]}/${qs}`);
  }
  if (p.length > 1 && p.endsWith('/')) {
    const withoutSlash = p.slice(0, -1);
    if (ROOT_CLEAN_SLUGS.has(withoutSlash)) {
      return res.redirect(301, withoutSlash + qs);
    }
  }
  if (p.endsWith('.html')) {
    const withoutHtml = p.slice(0, -5);
    if (ROOT_CLEAN_SLUGS.has(withoutHtml)) {
      return res.redirect(301, withoutHtml + qs);
    }
  }
  next();
});

// Fast in-memory responder for HTML, Sitemap, Robots, LLMs & Version endpoints (<2ms TTFB)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const cached = MEMORY_DOC_CACHE.get(req.path || '/');
  if (!cached) return next();

  res.setHeader('Content-Type', cached.contentType);
  res.setHeader('ETag', cached.etag);
  if (cached.isHtml) {
    const canonicalPath = req.path || '/';
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.setHeader(
      'Link',
      `<https://froebelinstituto.com.mx${canonicalPath}>; rel="canonical", <https://froebelinstituto.com.mx/llms.txt>; rel="llms-txt", <https://froebelinstituto.com.mx/llms-full.txt>; rel="alternate"; type="text/markdown", <https://froebelinstituto.com.mx/pricing.md>; rel="alternate"; type="text/markdown"; title="Tarifas Oficiales 2026-2027"`
    );
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  if (req.headers['if-none-match'] === cached.etag) {
    return res.status(304).end();
  }
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  return res.status(200).send(cached.buf);
});

// Static assets with bfcache-friendly HTML revalidation, cached JS/CSS, and immutable media
app.use(
  express.static(__dirname, {
    dotfiles: 'deny',
    extensions: ['html', 'htm'],
    setHeaders: (res, reqPath) => {
      if (reqPath.endsWith('.html') || reqPath.endsWith('.htm')) {
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
        res.setHeader(
          'Link',
          '<https://froebelinstituto.com.mx/llms.txt>; rel="llms-txt", <https://froebelinstituto.com.mx/llms-full.txt>; rel="alternate"; type="text/markdown", <https://froebelinstituto.com.mx/pricing.md>; rel="alternate"; type="text/markdown"; title="Tarifas Oficiales 2026-2027"'
        );
      } else if (reqPath.endsWith('pricing.md')) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else if (reqPath.endsWith('.json') || reqPath.endsWith('.xml') || reqPath.endsWith('.txt')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else if (reqPath.endsWith('.js') || reqPath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="es-MX">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Página no encontrada (404) — Instituto Federico Froebel</title>
<style>
  :root{--color-primary:#1E40AF;--color-primary-dark:#1E3A8A;--color-bg:#F8FAFC;--color-text:#2d3436;--color-text-light:#636e72;--color-border:#dfe6e9;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--color-bg);color:var(--color-text);line-height:1.6;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;}
  main{max-width:620px;width:100%;background:#fff;border:1px solid var(--color-border);border-radius:18px;padding:32px 28px;box-shadow:0 12px 30px rgba(30,64,175,0.08);}
  .badge{display:inline-block;background:#EFF6FF;color:var(--color-primary-dark);font-weight:700;font-size:0.82rem;padding:4px 12px;border-radius:999px;margin-bottom:14px;}
  h1{font-size:1.7rem;line-height:1.22;margin-bottom:10px;color:var(--color-primary-dark);}
  p{font-size:1rem;color:var(--color-text-light);margin-bottom:18px;}
  .actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;}
  a.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 18px;border-radius:999px;font-weight:700;font-size:0.92rem;text-decoration:none;border:1px solid var(--color-primary);}
  a.primary{background:var(--color-primary);color:#fff;}
  a.secondary{background:#fff;color:var(--color-primary-dark);}
  a.wa{background:#16a34a;border-color:#16a34a;color:#fff;}
  .links{border-top:1px solid var(--color-border);padding-top:14px;font-size:0.9rem;display:flex;flex-wrap:wrap;gap:14px;}
  .links a{color:var(--color-primary);font-weight:600;text-decoration:none;}
</style>
</head>
<body>
<main>
  <span class="badge">Error 404 · Dirección no encontrada</span>
  <h1>Esta página no existe en el sitio del Instituto Federico Froebel</h1>
  <p>La URL solicitada pudo haber cambiado o contener un error tipográfico. Aquí tienes acceso directo a nuestras secciones principales en San Juan de Aragón I Secc, Gustavo A. Madero (SEP RVOE 09050141):</p>
  <div class="actions">
    <a class="btn primary" href="/">Ir al Inicio</a>
    <a class="btn secondary" href="/inscripciones">Costos e Inscripciones ($3,600/mes)</a>
    <a class="btn wa" href="https://wa.me/525554148872?text=Hola%20Instituto%20Froebel%2C%20busco%20informes%20de%20Maternal%20o%20K%C3%ADnder%20en%20GAM" target="_blank" rel="noopener noreferrer">WhatsApp: 55 5414 8872</a>
  </div>
  <nav class="links" aria-label="Accesos principales">
    <a href="/programas">Programas y Costos</a>
    <a href="/maternal-bilingue-1-a-3-anos">Maternal (1–3 años)</a>
    <a href="/preescolar-stem-3-a-6-anos">Kínder SEP (3–6 años)</a>
    <a href="/horario-extendido-y-comedor">Estancia hasta 18:00h</a>
    <a href="/contacto">Cómo Llegar</a>
    <a href="/blog/">Blog para Padres</a>
  </nav>
</main>
</body>
</html>`;

app.get('*', (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(NOT_FOUND_HTML);
});

app.listen(port, () => console.log(`Instituto Federico Froebel Server running on port ${port}`));
