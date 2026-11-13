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
    } else if (/\.(html|txt|xml|json)$/i.test(entry.name) && !/^package(-lock)?\.json$/i.test(entry.name)) {
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
          : 'text/plain; charset=utf-8';
      const routePath = `${urlPrefix}/${entry.name}`;
      const record = { buf, etag, contentType, isHtml: ext === '.html' };
      MEMORY_DOC_CACHE.set(routePath, record);
      if (entry.name === 'index.html') {
        MEMORY_DOC_CACHE.set(urlPrefix ? `${urlPrefix}/` : '/', record);
      } else if (ext === '.html') {
        MEMORY_DOC_CACHE.set(`${urlPrefix}/${entry.name.slice(0, -5)}`, record);
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

const createEmailTemplate = (title, data) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="background-color: #0d47a1; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0;">${title}</h2>
    </div>
    <div style="background-color: #f5f7fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e1e4e8;">
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(data)
          .map(
            ([key, value]) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 40%;">${key}:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${value || '-'}</td>
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
    <h2 style="color: #0d47a1;">¡Hola, ${name}!</h2>
    <p>Hemos recibido tu información exitosamente en <strong>Instituto Federico Froebel</strong> (San Juan de Aragón, Gustavo A. Madero). Nuestro equipo de admisiones se pondrá en contacto contigo muy pronto para darle seguimiento a tu solicitud.</p>
    <p>Si deseas atención inmediata por WhatsApp, escríbenos al <a href="https://wa.me/525554148872">55 5414 8872</a>.</p>
    <p>Atentamente,<br><strong>Instituto Federico Froebel</strong><br>Av. 521 No. 20, San Juan de Aragón I Secc, Gustavo A. Madero, CDMX</p>
  </div>
`;

// --- API ENDPOINTS ---

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!name || (!hasValidEmail && !cleanPhone)) {
      return res.status(400).json({ error: 'Nombre y teléfono o correo válido son obligatorios' });
    }

    if (!resend) {
      console.warn('Falta variable de entorno RESEND_API_KEY');
      return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
    }

    const htmlContent = createEmailTemplate('Nuevo Mensaje / Pre-Registro — Instituto Federico Froebel', {
      Nombre: name,
      Teléfono: cleanPhone || 'No proporcionado',
      Correo: hasValidEmail ? cleanEmail : 'No proporcionado',
      Mensaje: message,
    });

    const emailPayload = {
      from: 'Instituto Federico Froebel Web <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Nuevo contacto / pre-registro de: ${name}`,
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
        html: createAutoReplyTemplate(name),
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
    const estanciaLabels = {
      ninguna: 'Sin estancia (Horario base)',
      parcial_16h: 'Estancia Parcial hasta 16:00h (+$1,400/mes)',
      completa_18h: 'Estancia Completa hasta 18:00h (+$1,900/mes)',
    };

    const htmlContent = createEmailTemplate('Nueva Solicitud de Inscripción — Instituto Federico Froebel', {
      'Tutor - Nombre': guardian.full_name,
      'Tutor - Teléfono / WhatsApp': guardian.phone,
      'Tutor - Correo': hasValidGuardianEmail ? cleanGuardianEmail : 'No proporcionado',
      'Tutor - Parentesco': guardian.relationship,
      'Alumno - Nombre': student.full_name,
      'Alumno - Fecha de Nacimiento': student.birth_date,
      'Alumno - Programa': student.program,
      'Alumno - CURP': student.curp,
      'Plan de Colegiatura': student.plan,
      'Estancia / Comedor': estanciaLabels[student.estancia] || student.estancia || 'Sin estancia (Horario base)',
      'Método de Pago Seleccionado': payment.method,
      'Referencia de Transferencia': payment.transferRef,
      'Archivos Adjuntos': `${files.length} documento(s)`,
    });

    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const enrollEmailPayload = {
      from: 'Instituto Federico Froebel Inscripciones <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Inscripción: ${student.full_name || 'Nuevo Alumno'} (${student.program || 'Preescolar/Maternal'})`,
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
  if (p === '/blog/index.html') {
    return res.redirect(301, '/blog/' + qs);
  }
  if (p === '/colegio-cerca-de-mi' || p === '/colegio-cerca-de-mi/') {
    return res.redirect(301, '/contacto' + (qs || '#como-llegar'));
  }
  const geoMatch = p.match(/^(\/colegio-cerca-de-mi\/[^/]+)\/index\.html$/i);
  if (geoMatch) {
    return res.redirect(301, `${geoMatch[1]}/${qs}`);
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
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.setHeader(
      'Link',
      '<https://froebelinstituto.com.mx/llms.txt>; rel="llms-txt", <https://froebelinstituto.com.mx/llms-full.txt>; rel="alternate"; type="text/markdown"'
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
          '<https://froebelinstituto.com.mx/llms.txt>; rel="llms-txt", <https://froebelinstituto.com.mx/llms-full.txt>; rel="alternate"; type="text/markdown"'
        );
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

app.get('*', (req, res) => {
  const home = MEMORY_DOC_CACHE.get('/');
  if (home) {
    res.setHeader('Content-Type', home.contentType);
    return res.status(404).send(home.buf);
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => console.log(`Instituto Federico Froebel Server running on port ${port}`));
