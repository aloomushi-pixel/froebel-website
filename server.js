import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
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

// Middleware
app.use(compression());
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

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }

    if (!resend) {
      console.warn('Falta variable de entorno RESEND_API_KEY');
      return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
    }

    const htmlContent = createEmailTemplate('Nuevo Mensaje de Contacto — Instituto Federico Froebel', {
      Nombre: name,
      Correo: email,
      Teléfono: phone,
      Mensaje: message,
    });

    const { error } = await resend.emails.send({
      from: 'Instituto Federico Froebel Web <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Nuevo mensaje de contacto de: ${name}`,
      html: htmlContent,
      reply_to: email,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    await resend.emails.send({
      from: 'Instituto Federico Froebel <info@froebelinstituto.com.mx>',
      to: [email],
      subject: 'Recibimos tu mensaje - Instituto Federico Froebel',
      html: createAutoReplyTemplate(name),
    });

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

    const htmlContent = createEmailTemplate('Nueva Solicitud de Inscripción — Instituto Federico Froebel', {
      'Tutor - Nombre': guardian.full_name,
      'Tutor - Correo': guardian.email,
      'Tutor - Teléfono': guardian.phone,
      'Tutor - Parentesco': guardian.relationship,
      'Alumno - Nombre': student.full_name,
      'Alumno - Programa': student.program,
      'Alumno - CURP': student.curp,
      'Plan de Pago': student.plan,
      'Método de Pago Seleccionado': payment.method,
      'Referencia de Transferencia': payment.transferRef,
      'Archivos Adjuntos': `${files.length} documento(s)`,
    });

    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const { error } = await resend.emails.send({
      from: 'Instituto Federico Froebel Inscripciones <info@froebelinstituto.com.mx>',
      to: [DESTINATION_EMAIL],
      subject: `Inscripción: ${student.full_name || 'Nuevo Alumno'}`,
      html: htmlContent,
      reply_to: guardian.email || DESTINATION_EMAIL,
      attachments,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (guardian.email) {
      await resend.emails.send({
        from: 'Instituto Federico Froebel <info@froebelinstituto.com.mx>',
        to: [guardian.email],
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
  ['/assets/images/instalaciones-seguras-kinder-gam.jpg', '/assets/images/instalaciones-kinder-patio-juegos-gam.jpg'],
  ['/assets/images/aula-preescolar-metodo-froebel.jpg', '/assets/images/material-didactico-dones-froebel.jpg'],
  ['/assets/images/maternal-estimulacion-temprana-cdmx.jpg', '/assets/images/salon-maternal-bilingue-froebel.jpg'],
]);

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
  const geoMatch = p.match(/^(\/colegio-cerca-de-mi\/[^/]+)\/index\.html$/i);
  if (geoMatch) {
    return res.redirect(301, `${geoMatch[1]}/${qs}`);
  }
  if (p.endsWith('.html')) {
    const withoutHtml = p.slice(0, -5);
    if (ROOT_CLEAN_SLUGS.has(withoutHtml)) {
      return res.redirect(301, withoutHtml + qs);
    }
  }
  next();
});

// Static assets with smart caching and clean URL extension resolution
app.use(
  express.static(__dirname, {
    dotfiles: 'deny',
    extensions: ['html', 'htm'],
    setHeaders: (res, reqPath) => {
      if (reqPath.endsWith('.html') || reqPath.endsWith('.css') || reqPath.endsWith('.js') || reqPath.endsWith('.json') || reqPath.endsWith('.xml') || reqPath.endsWith('.txt')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => console.log(`Instituto Federico Froebel Server running on port ${port}`));
