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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory (now configured below)

// Configure Multer for in-memory file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit per file
    },
});

// Helper to format HTML emails
const createEmailTemplate = (title, data) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="background-color: #0d47a1; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0;">${title}</h2>
    </div>
    <div style="background-color: #f5f7fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e1e4e8;">
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(data).map(([key, value]) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 40%;">${key}:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${value || '-'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  </div>
`;

const createAutoReplyTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #0d47a1;">¡Hola, ${name}!</h2>
    <p>Hemos recibido tu información exitosamente. Nos pondremos en contacto contigo muy pronto para darle seguimiento a tu solicitud.</p>
    <p>Atentamente,<br><strong>Colegio Federico Froebel</strong></p>
  </div>
`;

// --- API ENDPOINTS ---

/**
 * Handle Contact Form Submissions
 */
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        }

        if (!process.env.RESEND_API_KEY || !DESTINATION_EMAIL) {
            console.warn("Faltan variables de entorno RESEND_API_KEY o DESTINATION_EMAIL");
            return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
        }

        const htmlContent = createEmailTemplate('Nuevo Mensaje de Contacto', {
            'Nombre': name,
            'Correo': email,
            'Teléfono': phone,
            'Mensaje': message
        });

        const { data, error } = await resend.emails.send({
            from: 'Colegio Froebel Web <info@froebelinstituto.com.mx>',
            to: [DESTINATION_EMAIL],
            subject: `Nuevo mensaje de contacto de: ${name}`,
            html: htmlContent,
            reply_to: email
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Send confirmation email to the user
        await resend.emails.send({
            from: 'Colegio Froebel <info@froebelinstituto.com.mx>',
            to: [email],
            subject: 'Recibimos tu mensaje - Colegio Federico Froebel',
            html: createAutoReplyTemplate(name)
        });

        res.status(200).json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * Handle Enrollment Form Submissions (Includes File Uploads)
 */
app.post('/api/enroll', upload.any(), async (req, res) => {
    try {
        // req.body contains text fields, req.files contains uploaded files
        const enrollmentData = req.body;
        const files = req.files || [];

        if (!process.env.RESEND_API_KEY || !DESTINATION_EMAIL) {
            console.warn("Faltan variables de entorno RESEND_API_KEY o DESTINATION_EMAIL");
            return res.status(500).json({ error: 'Configuración de servidor incompleta.' });
        }

        // Parse nested objects if they were sent as JSON strings
        let student = {};
        let guardian = {};
        let payment = {};

        try {
            student = JSON.parse(enrollmentData.student || '{}');
            guardian = JSON.parse(enrollmentData.guardian || '{}');
            payment = JSON.parse(enrollmentData.payment || '{}');
        } catch (e) {
            console.error("Error parsing enrollment JSON data", e);
        }

        const htmlContent = createEmailTemplate('Nueva Solicitud de Inscripción', {
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
            'Archivos Adjuntos': `${files.length} documento(s)`
        });

        // Format attachments for Resend
        const attachments = files.map(file => ({
            filename: file.originalname,
            content: file.buffer,
        }));

        const { data, error } = await resend.emails.send({
            from: 'Colegio Froebel Inscripciones <info@froebelinstituto.com.mx>',
            to: [DESTINATION_EMAIL],
            subject: `Inscripción: ${student.full_name || 'Nuevo Alumno'}`,
            html: htmlContent,
            reply_to: guardian.email || DESTINATION_EMAIL,
            attachments: attachments
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Send confirmation email to the parent/guardian
        if (guardian.email) {
            await resend.emails.send({
                from: 'Colegio Froebel <info@froebelinstituto.com.mx>',
                to: [guardian.email],
                subject: 'Recibimos tu solicitud de inscripción - Colegio Federico Froebel',
                html: createAutoReplyTemplate(guardian.full_name || 'Familia')
            });
        }

        res.status(200).json({ success: true, message: 'Inscripción enviada exitosamente' });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la inscripción' });
    }
});

// Serve static files from the current directory (since server is now inside website/)
app.use(express.static(__dirname, { extensions: ['html', 'htm'] }));

// ... (other routes remain same, like /api/contact)

// Fallback route to serve index.html for unknown routes (SPA behavior if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
