/* ============================================
   FROEBEL — Enrollment Wizard (5-Step)
   ============================================ */

const WIZARD_STEPS = [
  { id: 'student', title: 'Cotiza y Aparta', icon: '👶' },
  { id: 'guardian', title: 'Datos del Tutor', icon: '👨‍👩‍👧' },
  { id: 'documents', title: 'Documentos (Opcional)', icon: '📄' },
  { id: 'confirmation', title: 'Confirmación', icon: '✅' }
];

const REQUIRED_DOCUMENTS = [
  { type: 'acta_nacimiento', label: 'Acta de Nacimiento', required: false },
  { type: 'curp', label: 'CURP del alumno', required: false },
  { type: 'cartilla_vacunacion', label: 'Cartilla de Vacunación', required: false },
  { type: 'foto_alumno', label: 'Foto reciente del alumno', required: false },
  { type: 'comprobante_domicilio', label: 'Comprobante de domicilio', required: false },
  { type: 'identificacion_tutor', label: 'INE del tutor', required: false }
];

let currentStep = 0;
let wizardData = {
  student: {},
  guardian: {},
  documents: [],
  payment: {},
  enrollment: null
};

/* === RENDER WIZARD === */
function renderWizard() {
  const container = document.getElementById('enrollment-wizard');
  if (!container) return;

  container.innerHTML = `
    <div class="wizard">
      <div class="wizard__progress">
        ${WIZARD_STEPS.map((step, i) => `
          <div class="wizard__step ${i === currentStep ? 'wizard__step--active' : ''} ${i < currentStep ? 'wizard__step--done' : ''}" data-step="${i}">
            <div class="wizard__step-circle">
              ${i < currentStep ? '✓' : step.icon}
            </div>
            <span class="wizard__step-label">${step.title}</span>
          </div>
          ${i < WIZARD_STEPS.length - 1 ? '<div class="wizard__step-line ' + (i < currentStep ? 'wizard__step-line--done' : '') + '"></div>' : ''}
        `).join('')}
      </div>

      <div class="wizard__body" id="wizard-body">
        ${renderCurrentStep()}
      </div>

      <div class="wizard__footer" id="wizard-footer">
        ${renderFooter()}
      </div>
    </div>
  `;

  attachStepListeners();
}

/* === RENDER CURRENT STEP === */
function renderCurrentStep() {
  switch (currentStep) {
    case 0: return renderStudentStep();
    case 1: return renderGuardianStep();
    case 2: return renderDocumentsStep();
    case 3: return renderConfirmationStep();
    default: return '';
  }
}

/* === STEP 1: STUDENT DATA === */
function renderStudentStep() {
  const s = wizardData.student;
  const g = wizardData.guardian || {};
  return `
    <div class="wizard__section fade-in visible">
      <div id="wizard-express-top-bar" style="margin-bottom:1.15rem;padding:1rem 1.15rem;background:linear-gradient(135deg,#f0fdf4,#eff6ff);border:2px solid #86efac;border-radius:14px;display:flex;flex-direction:column;gap:0.65rem;">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.5rem;font-size:0.9rem;color:#1e3a8a;">
          <div>
            <strong>🧮 Cotización en Vivo 2026-2027:</strong>
            <span id="wizard-live-quote-text">Colegiatura <strong>$3,600 MXN/mes</strong> (Pronto Pago) · Inscripción anticipada desde <strong>$3,375 MXN (-25%)</strong></span>
          </div>
          <span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:0.76rem;font-weight:700;">✓ SEP RVOE 09050141 · Sin documentos hoy</span>
        </div>
        <div id="wizard-quick-grade-pills" style="display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center;">
          <span style="font-size:0.76rem;font-weight:700;color:#166534;">Elige en 1 clic:</span>
          <button type="button" onclick="quickSelectWizardOption('program','maternal')" style="padding:4px 10px;border-radius:999px;border:1px solid #86efac;background:#ffffff;color:#166534;font-size:0.76rem;font-weight:700;cursor:pointer;">🍼 Maternal (1-3a)</button>
          <button type="button" onclick="quickSelectWizardOption('program','preescolar_1')" style="padding:4px 10px;border-radius:999px;border:1px solid #86efac;background:#ffffff;color:#166534;font-size:0.76rem;font-weight:700;cursor:pointer;">🌻 Kínder 1 (3a)</button>
          <button type="button" onclick="quickSelectWizardOption('program','preescolar_2')" style="padding:4px 10px;border-radius:999px;border:1px solid #86efac;background:#ffffff;color:#166534;font-size:0.76rem;font-weight:700;cursor:pointer;">🧠 Kínder 2 (4a)</button>
          <button type="button" onclick="quickSelectWizardOption('program','preescolar_3')" style="padding:4px 10px;border-radius:999px;border:1px solid #86efac;background:#ffffff;color:#166534;font-size:0.76rem;font-weight:700;cursor:pointer;">🎓 Kínder 3 (5a)</button>
          <button type="button" onclick="quickSelectWizardOption('estancia','completa_18h')" style="padding:4px 10px;border-radius:999px;border:1px solid #fde047;background:#fef9c3;color:#854d0e;font-size:0.76rem;font-weight:700;cursor:pointer;">🍽️ +Estancia 18:00h (+$1,900)</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
          <button type="button" id="wizard-wa-top-btn" onclick="sendWizardToWhatsApp()" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:0.45rem;padding:0.75rem 1rem;border-radius:999px;border:none;background:#16a34a;color:#ffffff;font-size:0.92rem;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.28);">
            💬 Enviar esta Cotización o Agendar Visita por WhatsApp (1 clic · sin llenar todo)
          </button>
        </div>
      </div>

      <h2 class="wizard__title" style="font-size:1.3rem;">Calcula tu Mensualidad y Aparta Lugar en 15 Segundos</h2>
      <p class="wizard__desc" style="margin-bottom:0.9rem;">Ajusta el programa y horario para ver tu colegiatura exacta. Para apartar lugar en línea deja solo nombre y WhatsApp (sin subir documentos hoy).</p>

      <div id="wizard-express-success" style="display:none;margin-bottom:1rem;padding:1rem;background:#dcfce7;border:2px solid #16a34a;border-radius:12px;color:#14532d;font-size:0.92rem;font-weight:600;"></div>

      <div class="wizard__form-grid">
        <div class="wizard__field">
          <label for="s-program">1. Programa / Grado de interés *</label>
          <select id="s-program" required onchange="onWizardCalculatorChange()">
            <option value="">Seleccionar programa</option>
            <option value="maternal" ${s.program === 'maternal' ? 'selected' : ''}>Maternal Bilingüe (1 a 3 años)</option>
            <option value="preescolar_1" ${s.program === 'preescolar_1' ? 'selected' : ''}>Kínder 1 / Preescolar 1 (3 a 4 años)</option>
            <option value="preescolar_2" ${s.program === 'preescolar_2' ? 'selected' : ''}>Kínder 2 / Preescolar 2 (4 a 5 años)</option>
            <option value="preescolar_3" ${s.program === 'preescolar_3' ? 'selected' : ''}>Kínder 3 / Preescolar 3 (5 a 6 años)</option>
          </select>
        </div>

        <div class="wizard__field">
          <label for="s-plan">2. Modalidad de colegiatura</label>
          <select id="s-plan" onchange="onWizardCalculatorChange()">
            <option value="pronto_pago" ${s.plan === 'pronto_pago' || !s.plan ? 'selected' : ''}>Pronto Pago — $3,600/mes (primeros 10 días)</option>
            <option value="normal" ${s.plan === 'normal' ? 'selected' : ''}>Mensual Normal — $4,000/mes</option>
            <option value="anual" ${s.plan === 'anual' ? 'selected' : ''}>Pago Anual — $40,480 (8% desc. · ahorra $3,520)</option>
          </select>
        </div>

        <div class="wizard__field">
          <label for="s-estancia">3. Horario Extendido y Comedor (Opcional)</label>
          <select id="s-estancia" onchange="onWizardCalculatorChange()">
            <option value="ninguna" ${!s.estancia || s.estancia === 'ninguna' ? 'selected' : ''}>Horario Escolar Base (08:30 a 14:00 hrs — $0 extra)</option>
            <option value="parcial_16h" ${s.estancia === 'parcial_16h' ? 'selected' : ''}>Estancia Parcial + Comedor 3 Tiempos (hasta 16:00 hrs — +$1,400/mes)</option>
            <option value="completa_18h" ${s.estancia === 'completa_18h' ? 'selected' : ''}>Estancia Completa + Comedor + Talleres (hasta 18:00 hrs — +$1,900/mes)</option>
          </select>
        </div>

        <div class="wizard__field">
          <label for="s-name">4. Nombre del alumno/a (o del tutor) *</label>
          <input type="text" id="s-name" value="${s.full_name || ''}" required placeholder="Ej: Mateo Hernández">
        </div>

        <div class="wizard__field">
          <label for="s-parent-phone">5. Tu WhatsApp o teléfono celular *</label>
          <input type="tel" id="s-parent-phone" value="${g.phone || s.parent_phone || ''}" required placeholder="Ej: 55 1234 5678">
        </div>

        <div class="wizard__field">
          <label for="s-dob">6. Fecha de nacimiento (calcula su grado SEP automáticamente)</label>
          <input type="date" id="s-dob" value="${s.date_of_birth || ''}" min="2019-01-01" max="2026-12-31" onchange="onWizardDobChange()">
          <div id="s-dob-grade-hint" style="display:none;margin-top:6px;padding:6px 10px;border-radius:8px;background:#f0fdf4;border:1px solid #86efac;color:#14532d;font-size:0.78rem;font-weight:700;line-height:1.35;"></div>
        </div>
      </div>

      <details id="wizard-optional-medical" style="margin-top:1rem;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:0.75rem 1rem;">
        <summary style="font-weight:700;color:#1e3a8a;cursor:pointer;font-size:0.88rem;">➕ Agregar CURP, tipo de sangre y alergias ahora (Opcional — puedes entregarlos después)</summary>
        <div class="wizard__form-grid" style="margin-top:0.85rem;">
          <div class="wizard__field">
            <label for="s-gender">Género</label>
            <select id="s-gender">
              <option value="">Seleccionar</option>
              <option value="M" ${s.gender === 'M' ? 'selected' : ''}>Masculino</option>
              <option value="F" ${s.gender === 'F' ? 'selected' : ''}>Femenino</option>
              <option value="Otro" ${s.gender === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>

          <div class="wizard__field">
            <label for="s-curp">CURP del alumno</label>
            <input type="text" id="s-curp" value="${s.curp || ''}" placeholder="18 caracteres (opcional)" maxlength="18" style="text-transform:uppercase;">
          </div>

          <div class="wizard__field">
            <label for="s-blood">Tipo de sangre</label>
            <select id="s-blood">
              <option value="">Seleccionar</option>
              <option value="A+" ${s.blood_type === 'A+' ? 'selected' : ''}>A+</option>
              <option value="A-" ${s.blood_type === 'A-' ? 'selected' : ''}>A-</option>
              <option value="B+" ${s.blood_type === 'B+' ? 'selected' : ''}>B+</option>
              <option value="B-" ${s.blood_type === 'B-' ? 'selected' : ''}>B-</option>
              <option value="AB+" ${s.blood_type === 'AB+' ? 'selected' : ''}>AB+</option>
              <option value="AB-" ${s.blood_type === 'AB-' ? 'selected' : ''}>AB-</option>
              <option value="O+" ${s.blood_type === 'O+' ? 'selected' : ''}>O+</option>
              <option value="O-" ${s.blood_type === 'O-' ? 'selected' : ''}>O-</option>
            </select>
          </div>

          <div class="wizard__field wizard__field--full">
            <label for="s-allergies">Alergias o condiciones médicas</label>
            <textarea id="s-allergies" rows="2" placeholder="Describe cualquier alergia, medicamento o condición importante">${s.allergies || ''}</textarea>
          </div>

          <div class="wizard__field wizard__field--full">
            <label for="s-notes">Notas adicionales</label>
            <textarea id="s-notes" rows="2" placeholder="Escuela anterior, necesidades especiales, etc.">${s.medical_notes || ''}</textarea>
          </div>
        </div>
      </details>
    </div>
  `;
}

/* === STEP 2: GUARDIAN DATA === */
function renderGuardianStep() {
  const g = wizardData.guardian;
  return `
    <div class="wizard__section fade-in visible">
      <h2 class="wizard__title">Datos del Tutor</h2>
      <p class="wizard__desc">Información del padre, madre o tutor responsable.</p>

      <div class="wizard__form-grid">
        <div class="wizard__field">
          <label for="g-name">Nombre completo *</label>
          <input type="text" id="g-name" value="${g.full_name || ''}" required placeholder="Nombre(s) y Apellidos">
        </div>

        <div class="wizard__field">
          <label for="g-email">Correo electrónico *</label>
          <input type="email" id="g-email" value="${g.email || ''}" required placeholder="correo@ejemplo.com">
        </div>

        <div class="wizard__field">
          <label for="g-phone">Teléfono celular *</label>
          <input type="tel" id="g-phone" value="${g.phone || ''}" required placeholder="55 1234 5678">
        </div>

        <div class="wizard__field">
          <label for="g-whatsapp">WhatsApp (si es diferente)</label>
          <input type="tel" id="g-whatsapp" value="${g.whatsapp || ''}" placeholder="Dejar vacío si es el mismo">
        </div>

        <div class="wizard__field">
          <label for="g-relation">Parentesco</label>
          <select id="g-relation">
            <option value="Madre/Padre" ${g.relationship === 'Madre/Padre' || !g.relationship ? 'selected' : ''}>Madre/Padre</option>
            <option value="Abuelo/a" ${g.relationship === 'Abuelo/a' ? 'selected' : ''}>Abuelo/a</option>
            <option value="Tutor legal" ${g.relationship === 'Tutor legal' ? 'selected' : ''}>Tutor legal</option>
            <option value="Otro" ${g.relationship === 'Otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>

        <div class="wizard__field wizard__field--full">
          <label for="g-address">Dirección (opcional)</label>
          <input type="text" id="g-address" value="${g.address || ''}" placeholder="Calle, número, colonia, CP">
        </div>

        <div class="wizard__field">
          <label for="g-emergency-name">Contacto de emergencia (opcional)</label>
          <input type="text" id="g-emergency-name" value="${g.emergency_contact_name || ''}" placeholder="Nombre del contacto">
        </div>

        <div class="wizard__field">
          <label for="g-emergency-phone">Teléfono de emergencia (opcional)</label>
          <input type="tel" id="g-emergency-phone" value="${g.emergency_contact_phone || ''}" placeholder="55 9876 5432">
        </div>
      </div>
    </div>
  `;
}

/* === STEP 3: DOCUMENTS === */
function renderDocumentsStep() {
  return `
    <div class="wizard__section fade-in visible">
      <h2 class="wizard__title">Documentos</h2>
      <p class="wizard__desc">Sube los documentos requeridos. Formatos: PDF, JPG, PNG (máx. 10MB cada uno).</p>

      <div class="wizard__docs-grid">
        ${REQUIRED_DOCUMENTS.map(doc => {
    const uploaded = wizardData.documents.find(d => d.type === doc.type);
    return `
            <div class="wizard__doc-card ${uploaded ? 'wizard__doc-card--uploaded' : ''}" id="doc-${doc.type}">
              <div class="wizard__doc-icon">${uploaded ? '✅' : '📎'}</div>
              <div class="wizard__doc-info">
                <span class="wizard__doc-label">${doc.label} ${doc.required ? '*' : '(opcional)'}</span>
                <span class="wizard__doc-status">${uploaded ? uploaded.name : 'Sin subir'}</span>
              </div>
              <label class="wizard__doc-btn ${uploaded ? 'wizard__doc-btn--change' : ''}">
                ${uploaded ? 'Cambiar' : 'Subir'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" data-doc-type="${doc.type}" style="display:none;" onchange="handleFileSelect(this, '${doc.type}')">
              </label>
            </div>
          `;
  }).join('')}
      </div>

      <div class="wizard__note">
        <span>💡</span>
        <p>Todos los documentos son opcionales en este paso. Puedes completar tu inscripción ahora y entregar los documentos físicamente o por correo más adelante.</p>
      </div>
    </div>
  `;
}

/* === PAYMENT REMOVED === */

/* === STEP 4: CONFIRMATION === */
function renderConfirmationStep() {
  const s = wizardData.student;
  const g = wizardData.guardian;
  const plan = s.plan || 'pronto_pago';
  const estancia = s.estancia || 'ninguna';
  const cleanEmail = (g.email || '').trim();
  const docsCount = Array.isArray(wizardData.documents) ? wizardData.documents.length : 0;

  const progNames = {
    maternal: 'Maternal Bilingüe (1–3 años)',
    preescolar_1: 'Kínder 1 SEP (3–4 años)',
    preescolar_2: 'Kínder 2 SEP (4–5 años)',
    preescolar_3: 'Kínder 3 SEP (5–6 años)'
  };
  const planNames = {
    pronto_pago: 'Pronto Pago ($3,600/mes)',
    normal: 'Mensual Normal ($4,000/mes)',
    anual: 'Anualidad -8% ($40,480)'
  };
  const estanciaNames = {
    ninguna: 'Horario base escolar',
    parcial_16h: '+ Estancia 16:00h (+$1,400/mes)',
    completa_18h: '+ Estancia 18:00h (+$1,900/mes)'
  };

  const progLabel = progNames[s.program] || (s.program ? s.program.replace('_', ' ') : 'Por confirmar');
  const planLabel = planNames[plan] || 'Pronto Pago ($3,600/mes)';
  const estanciaLabel = estanciaNames[estancia] || 'Horario base escolar';
  const waConfirmMsg = encodeURIComponent(
    `Hola Instituto Froebel, acabo de enviar la solicitud de inscripción en línea para ${s.full_name || 'mi hijo/a'} (${progLabel}, ${planLabel}, ${estanciaLabel}).`
  );

  return `
    <div class="wizard__section wizard__section--confirmation fade-in visible">
      <div class="wizard__confirm-icon">🎉</div>
      <h2 class="wizard__title">¡Solicitud de Inscripción Recibida!</h2>
      <p class="wizard__desc">Hemos registrado los datos de tu pequeño/a. Nuestro equipo de admisiones te contactará a la brevedad para confirmar su lugar y agendar tu visita.</p>

      <div class="wizard__confirm-card">
        <div class="wizard__confirm-status">
          <span class="wizard__status-badge wizard__status-badge--pending">✅ Solicitud registrada · Ciclo 2026-2027</span>
        </div>
        <div class="wizard__confirm-grid">
          <div>
            <h4>Alumno y Modalidad</h4>
            <p><strong>${s.full_name || ''}</strong></p>
            <p>${progLabel}</p>
            <p style="font-size:0.85rem;color:var(--color-primary-dark);font-weight:600;">${planLabel} · ${estanciaLabel}</p>
          </div>
          <div>
            <h4>Tutor de Contacto</h4>
            <p><strong>${g.full_name || ''}</strong></p>
            <p>📱 ${g.phone || ''}</p>
            ${cleanEmail ? `<p>📧 ${cleanEmail}</p>` : ''}
          </div>
        </div>
        <div class="wizard__confirm-footer">
          <p>📱 Te escribiremos por WhatsApp o llamada al <strong>${g.phone || ''}</strong>.</p>
          ${cleanEmail ? `<p>📧 También enviamos copia de recepción a <strong>${cleanEmail}</strong>.</p>` : ''}
        </div>
      </div>

      <div class="wizard__confirm-next">
        <h3>¿Qué sigue?</h3>
        <div class="wizard__confirm-steps">
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">1</span>
            <div>
              <strong>Contacto de Admisiones</strong>
              <p>${docsCount > 0 ? `Revisaremos los ${docsCount} documento(s) adjuntos y confirmaremos tu cita en menos de 24 horas hábiles.` : 'Confirmaremos disponibilidad de grupo por WhatsApp; los documentos podrás entregarlos después en el plantel.'}</p>
            </div>
          </div>
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">2</span>
            <div>
              <strong>Recorrido y Evaluación Diagnóstica</strong>
              <p>Conocerás nuestras aulas, CCTV y enfermería en Av. 521 No. 20, San Juan de Aragón I Secc.</p>
            </div>
          </div>
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">3</span>
            <div>
              <strong>¡Bienvenidos a la Familia Froebel!</strong>
              <p>Tu hijo/a asegura su lugar en el Ciclo Escolar 2026-2027 (ingreso inmediato sujeto a cupo o reserva de ciclo).</p>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;margin-top:var(--space-8);">
        <a href="https://wa.me/525554148872?text=${waConfirmMsg}" class="btn btn--accent" target="_blank" rel="noopener noreferrer" style="font-weight:800;">
          💬 Confirmar ahora por WhatsApp →
        </a>
        <a href="/" class="btn btn--secondary">Volver al Inicio</a>
      </div>
    </div>
  `;
}

/* === FOOTER NAVIGATION === */
function renderFooter() {
  if (currentStep === 3) return '';
  return `
    <div class="wizard__nav" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;">
      <div>
        ${currentStep > 0 ? '<button type="button" class="btn btn--secondary" onclick="prevStep()">← Anterior</button>' : ''}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.65rem;align-items:center;justify-content:flex-end;">
        ${currentStep === 0 ? '<button type="button" class="btn btn--accent" id="wizard-express-save-btn" onclick="submitExpressPreRegistration()" style="font-weight:800;">⚡ Guardar Pre-Registro Rápido (15s)</button>' : ''}
        <button type="button" class="btn btn--secondary" id="wizard-wa-express-btn" onclick="sendWizardToWhatsApp()" style="border-color:#16a34a;color:#15803d;background:#f0fdf4;font-weight:700;">
          💬 Enviar por WhatsApp
        </button>
        ${currentStep < 2 ? '<button type="button" class="btn btn--primary" onclick="nextStep()">' + (currentStep === 0 ? 'Inscripción Completa →' : 'Siguiente →') + '</button>' : ''}
        ${currentStep === 2 ? '<button type="button" class="btn btn--primary btn--lg wizard__pay-btn" onclick="submitEnrollment()" id="pay-button">✅ Finalizar Inscripción</button>' : ''}
      </div>
    </div>
  `;
}

/* === LIVE QUOTE & EXPRESS WHATSAPP === */
function onWizardCalculatorChange() {
  trackWizardOpenOnce('Interacción con Calculadora de Colegiatura');
  updateWizardLiveQuote();
  if (window.FroebelUX && !isAutomatedCrawler()) {
    const progVal = document.getElementById('s-program')?.value || 'sin_programa';
    const estVal = document.getElementById('s-estancia')?.value || 'ninguna';
    window.FroebelUX.track('cta_click', {
      element_id: 'wizard_quote_calculator',
      element_text: `Cotizador: ${progVal} | ${estVal}`
    });
  }
}

function computeSepGradeFromDob(dobStr) {
  if (!dobStr || !/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) return null;
  const [y, m, d] = dobStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  // Official SEP cutoff for Ciclo Escolar 2026-2027: age completed by December 31, 2026
  const cutoffYear = 2026;
  const ageAtCutoff = cutoffYear - y;
  const approxMonthsAtSep2026 = (2026 - y) * 12 + (9 - m);
  if (approxMonthsAtSep2026 < 11) {
    return {
      code: '',
      message: 'ℹ️ En Maternal Bilingüe recibimos pequeños a partir de los 12 meses cumplidos. Escríbenos por WhatsApp para reservar cupo futuro.'
    };
  }
  if (ageAtCutoff <= 2) {
    return {
      code: 'maternal',
      message: '✅ Por edad SEP al 31-dic-2026 corresponde a Maternal Bilingüe (1 a 3 años · ratio 1:8).'
    };
  }
  if (ageAtCutoff === 3) {
    return {
      code: 'preescolar_1',
      message: '✅ Por corte oficial SEP (3 años al 31-dic-2026) corresponde a Kínder 1 (1° Preescolar SEP).'
    };
  }
  if (ageAtCutoff === 4) {
    return {
      code: 'preescolar_2',
      message: '✅ Por corte oficial SEP (4 años al 31-dic-2026) corresponde a Kínder 2 (2° Preescolar SEP).'
    };
  }
  if (ageAtCutoff === 5 || ageAtCutoff === 6) {
    return {
      code: 'preescolar_3',
      message: '✅ Por corte oficial SEP corresponde a Kínder 3 (3° Preescolar SEP · preparación lectoescritura).'
    };
  }
  return {
    code: '',
    message: 'ℹ️ Preescolar SEP comprende de 1 a 6 años. Si requieres orientación personalizada, envíanos WhatsApp en 1 clic.'
  };
}

function updateDobGradeHintUI(autoSelectProgram = false) {
  const dobEl = document.getElementById('s-dob');
  const hintEl = document.getElementById('s-dob-grade-hint');
  if (!dobEl || !hintEl) return null;
  const res = computeSepGradeFromDob(dobEl.value);
  if (!res) {
    hintEl.style.display = 'none';
    hintEl.textContent = '';
    return null;
  }
  hintEl.style.display = 'block';
  hintEl.textContent = res.message;
  if (autoSelectProgram && res.code) {
    const sel = document.getElementById('s-program');
    if (sel) {
      sel.value = res.code;
      wizardData.student.program = res.code;
    }
  }
  return res;
}

function onWizardDobChange() {
  trackWizardOpenOnce('Cálculo Automático de Grado SEP por Fecha de Nacimiento');
  const dobEl = document.getElementById('s-dob');
  if (dobEl) wizardData.student.date_of_birth = dobEl.value || '';
  const res = updateDobGradeHintUI(true);
  updateWizardLiveQuote();
  if (res && window.FroebelUX && !isAutomatedCrawler()) {
    window.FroebelUX.track('cta_click', {
      element_id: 'wizard_dob_autograde',
      element_text: `Auto-grado SEP: ${res.code || 'orientacion'}`
    });
  }
}

function quickSelectWizardOption(field, val) {
  if (field === 'program') {
    const sel = document.getElementById('s-program');
    if (sel) sel.value = val;
    wizardData.student.program = val;
  } else if (field === 'estancia') {
    const sel = document.getElementById('s-estancia');
    if (sel) {
      sel.value = sel.value === val ? 'ninguna' : val;
      wizardData.student.estancia = sel.value;
    }
  }
  onWizardCalculatorChange();
}

function updateWizardLiveQuote() {
  const quoteEl = document.getElementById('wizard-live-quote-text');
  if (!quoteEl) return;

  const progVal = document.getElementById('s-program')?.value || '';
  const planVal = document.getElementById('s-plan')?.value || 'pronto_pago';
  const estVal = document.getElementById('s-estancia')?.value || 'ninguna';

  const progMap = {
    maternal: 'Maternal Bilingüe (1-3 años)',
    preescolar_1: 'Kínder 1 SEP (3-4 años)',
    preescolar_2: 'Kínder 2 SEP (4-5 años)',
    preescolar_3: 'Kínder 3 SEP (5-6 años)'
  };
  const progShortMap = {
    maternal: 'Maternal Bilingüe',
    preescolar_1: 'Kínder 1 SEP',
    preescolar_2: 'Kínder 2 SEP',
    preescolar_3: 'Kínder 3 SEP'
  };
  const progLabel = progMap[progVal] || 'Maternal / Preescolar SEP';

  let baseCost = 3600;
  let planLabel = 'Pronto Pago';
  if (planVal === 'normal') {
    baseCost = 4000;
    planLabel = 'Mensual Normal';
  }

  let estCost = 0;
  let estLabel = progVal === 'maternal' ? '08:30–13:30h' : '08:30–14:00h';
  if (estVal === 'parcial_16h') {
    estCost = 1400;
    estLabel = 'con Estancia + Comedor hasta 16:00h';
  } else if (estVal === 'completa_18h') {
    estCost = 1900;
    estLabel = 'con Estancia + Comedor hasta 18:00h';
  }

  if (planVal === 'anual') {
    const estExtraText = estCost > 0 ? ` + $${estCost.toLocaleString('es-MX')}/mes (${estLabel})` : ` (${estLabel})`;
    quoteEl.innerHTML = `${progLabel}: <strong>$40,480 MXN/año</strong> (8% desc.)${estExtraText} · Inscripción desde <strong>$3,375 MXN</strong>`;
  } else {
    const totalMes = baseCost + estCost;
    quoteEl.innerHTML = `${progLabel}: <strong>$${totalMes.toLocaleString('es-MX')} MXN/mes</strong> (${planLabel} ${estLabel}) · Inscripción desde <strong>$3,375 MXN</strong>`;
  }

  const topWaBtn = document.getElementById('wizard-wa-top-btn');
  if (topWaBtn) {
    const shortName = progShortMap[progVal] || 'Lugar 2026-2027';
    topWaBtn.textContent = `💬 Apartar ${shortName} o Agendar Visita por WhatsApp (1 clic)`;
  }
}

async function submitExpressPreRegistration() {
  const name = document.getElementById('s-name')?.value?.trim() || '';
  const phone = document.getElementById('s-parent-phone')?.value?.trim() || '';
  const program = document.getElementById('s-program')?.value || '';
  if (!program) return showError('Selecciona el programa de interés');
  if (!name) return showError('Ingresa el nombre del alumno/a o tutor');
  if (!phone || phone.replace(/\D/g, '').length < 8) return showError('Ingresa un teléfono o WhatsApp válido (10 dígitos)');

  saveCurrentStepData();
  const btn = document.getElementById('wizard-express-save-btn');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Guardando pre-registro...';
  }

  const s = wizardData.student || {};
  const progMap = {
    maternal: 'Maternal Bilingüe (1 a 3 años)',
    preescolar_1: 'Kínder 1 SEP (3 a 4 años)',
    preescolar_2: 'Kínder 2 SEP (4 a 5 años)',
    preescolar_3: 'Kínder 3 SEP (5 a 6 años)'
  };
  const planMap = {
    pronto_pago: 'Pronto Pago ($3,600/mes)',
    normal: 'Mensual Normal ($4,000/mes)',
    anual: 'Pago Anual ($40,480/año)'
  };
  const estMap = {
    ninguna: 'Horario base (08:30 a 14:00 hrs)',
    parcial_16h: 'Estancia Parcial + Comedor hasta 16:00h (+$1,400/mes)',
    completa_18h: 'Estancia Completa + Comedor hasta 18:00h (+$1,900/mes)'
  };

  try {
    const msg = `Pre-registro rápido en línea — Programa: ${progMap[s.program] || s.program} | Plan: ${planMap[s.plan] || s.plan} | Horario: ${estMap[s.estancia] || s.estancia}${s.date_of_birth ? ' | Nac: ' + s.date_of_birth : ''}`;
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email: '', message: msg })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    if (window.FroebelUX) {
      window.FroebelUX.track('form_submit', {
        element_id: 'wizard_express_preregister',
        element_text: `Pre-registro rápido (${s.program || 'general'})`,
        parent_profile: s.program === 'maternal' ? 'maternal_1_a_3' : 'preescolar_3_a_6'
      });
    }

    const box = document.getElementById('wizard-express-success');
    if (box) {
      box.style.display = 'block';
      box.innerHTML = `✅ <strong>¡Pre-registro recibido para ${progMap[s.program] || 'tu pequeño/a'}!</strong> Nuestro equipo de admisiones te contactará al <strong>${phone}</strong>. ¿Deseas atención inmediata? <a href="#" onclick="sendWizardToWhatsApp();return false;" style="color:#15803d;text-decoration:underline;font-weight:800;">Confirmar ahora por WhatsApp →</a>`;
    }
    if (btn) {
      btn.textContent = '✅ ¡Pre-Registro Guardado!';
    }
  } catch (err) {
    showError('No se pudo guardar en línea. Por favor envíalo en 1 clic con el botón verde de WhatsApp.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

function sendWizardToWhatsApp() {
  trackWizardOpenOnce('Envío Express de Asistente a WhatsApp');
  if (currentStep === 0) {
    saveCurrentStepData();
  } else if (currentStep === 1) {
    saveCurrentStepData();
  }

  const s = wizardData.student || {};
  const g = wizardData.guardian || {};
  const progMap = {
    maternal: 'Maternal Bilingüe (1 a 3 años)',
    preescolar_1: 'Kínder 1 SEP (3 a 4 años)',
    preescolar_2: 'Kínder 2 SEP (4 a 5 años)',
    preescolar_3: 'Kínder 3 SEP (5 a 6 años)'
  };
  const planMap = {
    pronto_pago: 'Pronto Pago ($3,600/mes)',
    normal: 'Mensual Normal ($4,000/mes)',
    anual: 'Pago Anual ($40,480/año)'
  };
  const estMap = {
    ninguna: 'Horario base (08:30 a 14:00 hrs)',
    parcial_16h: 'Estancia Parcial + Comedor hasta 16:00 hrs (+$1,400/mes)',
    completa_18h: 'Estancia Completa + Comedor hasta 18:00 hrs (+$1,900/mes)'
  };

  const parts = ['Hola Instituto Federico Froebel, estoy en el asistente de inscripciones 2026-2027 y quiero atención por WhatsApp:'];
  if (s.full_name) parts.push(`• Alumno/a: ${s.full_name}`);
  if (s.date_of_birth) parts.push(`• Fecha de nacimiento: ${s.date_of_birth}`);
  parts.push(`• Programa: ${progMap[s.program] || 'Maternal / Preescolar (por confirmar)'}`);
  parts.push(`• Modalidad: ${planMap[s.plan] || 'Pronto Pago ($3,600/mes)'}`);
  parts.push(`• Horario: ${estMap[s.estancia] || 'Horario base (08:30 a 14:00 hrs)'}`);
  if (g.full_name) parts.push(`• Tutor: ${g.full_name} (${g.phone || ''})`);

  if (window.FroebelUX) {
    window.FroebelUX.track('whatsapp_click', {
      element_id: 'wa:wizard-express-quote',
      element_text: '💬 Enviar estos datos o Agendar por WhatsApp',
      parent_profile: s.program === 'maternal' ? 'maternal_1_a_3' : 'preescolar_3_a_6'
    });
  }

  const waUrl = `https://wa.me/525554148872?text=${encodeURIComponent(parts.join('\n'))}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/* === NAVIGATION === */
async function nextStep() {
  if (!validateCurrentStep()) return;
  saveCurrentStepData();

  currentStep++;
  renderWizard();
  if (window.FroebelUX) {
    window.FroebelUX.track('wizard_step', {
      element_id: 'wizard_step_' + currentStep,
      element_text: (WIZARD_STEPS[currentStep] && WIZARD_STEPS[currentStep].title) || ('Paso ' + (currentStep + 1)),
      parent_profile: wizardData.student && wizardData.student.program === 'maternal' ? 'maternal_1_a_3' : 'preescolar_3_a_6'
    });
  }

  window.scrollTo({ top: document.getElementById('enrollment-wizard').offsetTop - 100, behavior: 'smooth' });
}

function prevStep() {
  saveCurrentStepData();
  currentStep--;
  renderWizard();
  window.scrollTo({ top: document.getElementById('enrollment-wizard').offsetTop - 100, behavior: 'smooth' });
}

/* === VALIDATION === */
function validateCurrentStep() {
  switch (currentStep) {
    case 0: return validateStudentStep();
    case 1: return validateGuardianStep();
    case 2: return validateDocumentsStep();
    default: return true;
  }
}

function validateStudentStep() {
  const name = document.getElementById('s-name')?.value?.trim();
  const program = document.getElementById('s-program')?.value;

  if (!program) return showError('Selecciona un programa');
  if (!name) return showError('Ingresa el nombre del alumno/a');
  return true;
}

function validateGuardianStep() {
  const name = document.getElementById('g-name')?.value?.trim();
  const email = document.getElementById('g-email')?.value?.trim();
  const phone = document.getElementById('g-phone')?.value?.trim();

  if (!name) return showError('Ingresa tu nombre');
  if (!email || !email.includes('@')) return showError('Ingresa un correo electrónico válido');
  if (!phone) return showError('Ingresa tu teléfono');
  return true;
}

function validateDocumentsStep() {
  // Document validation removed as per business requirements to allow enrollment without all documents.
  return true;
}

/* === SAVE STEP DATA === */
function saveCurrentStepData() {
  switch (currentStep) {
    case 0: {
      const parentPhone = document.getElementById('s-parent-phone')?.value?.trim() || '';
      wizardData.student = {
        full_name: document.getElementById('s-name')?.value?.trim() || '',
        parent_phone: parentPhone,
        date_of_birth: document.getElementById('s-dob')?.value || '',
        gender: document.getElementById('s-gender')?.value || '',
        curp: document.getElementById('s-curp')?.value?.toUpperCase() || '',
        program: document.getElementById('s-program')?.value || '',
        plan: document.getElementById('s-plan')?.value || 'pronto_pago',
        estancia: document.getElementById('s-estancia')?.value || 'ninguna',
        blood_type: document.getElementById('s-blood')?.value || '',
        allergies: document.getElementById('s-allergies')?.value?.trim() || '',
        medical_notes: document.getElementById('s-notes')?.value?.trim() || ''
      };
      if (parentPhone && !wizardData.guardian.phone) {
        wizardData.guardian.phone = parentPhone;
      }
      break;
    }
    case 1:
      wizardData.guardian = {
        full_name: document.getElementById('g-name')?.value?.trim() || '',
        email: document.getElementById('g-email')?.value?.trim() || '',
        phone: document.getElementById('g-phone')?.value?.trim() || '',
        whatsapp: document.getElementById('g-whatsapp')?.value?.trim() || '',
        address: document.getElementById('g-address')?.value?.trim() || '',
        relationship: document.getElementById('g-relation')?.value || 'Madre/Padre',
        emergency_contact_name: document.getElementById('g-emergency-name')?.value?.trim() || '',
        emergency_contact_phone: document.getElementById('g-emergency-phone')?.value?.trim() || ''
      };
      break;
  }
}

/* === CREATE RECORDS IN SUPABASE (REMOVED) === */

/* === FILE UPLOAD === */
async function handleFileSelect(input, docType) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showError('El archivo es demasiado grande. Máximo 10MB.');
    return;
  }

  const card = document.getElementById(`doc-${docType}`);
  const statusEl = card.querySelector('.wizard__doc-status');

  // Update local state instead of uploading to Supabase immediately
  wizardData.documents = wizardData.documents.filter(d => d.type !== docType);
  wizardData.documents.push({ type: docType, name: file.name, file });

  card.classList.add('wizard__doc-card--uploaded');
  card.querySelector('.wizard__doc-icon').textContent = '✅';
  statusEl.textContent = file.name;
  card.querySelector('.wizard__doc-btn').textContent = 'Cambiar';
}

/* === PAYMENT METHODS REMOVED === */

async function submitEnrollment() {
  const payBtn = document.getElementById('pay-button');
  if (!payBtn) return;

  payBtn.disabled = true;
  payBtn.innerHTML = '<span class="wizard__spinner"></span> Procesando inscripción...';

  try {
    const formData = new FormData();
    formData.append('student', JSON.stringify(wizardData.student));
    formData.append('guardian', JSON.stringify(wizardData.guardian));
    formData.append('payment', JSON.stringify({ method: 'acordar_despues' }));

    // Append files dynamically
    wizardData.documents.forEach(doc => {
      formData.append('files', doc.file, doc.name);
    });

    const response = await fetch('/api/enroll', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      if (window.FroebelUX) {
        window.FroebelUX.track('form_submit', {
          element_id: 'wizard_enrollment_completed',
          element_text: 'Inscripción completada (' + ((wizardData.student && wizardData.student.program) || 'general') + ')',
          parent_profile: wizardData.student && wizardData.student.program === 'maternal' ? 'maternal_1_a_3' : 'preescolar_3_a_6'
        });
      }
      // Move to confirmation
      currentStep = 3;
      renderWizard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showError('Error al enviar: ' + (result.error || 'Intenta nuevamente más tarde.'));
      payBtn.disabled = false;
      payBtn.innerHTML = '✅ Finalizar Inscripción';
    }
  } catch (error) {
    console.error('API Error:', error);
    showError('Error de red al procesar la inscripción. Revisa tu conexión.');
    payBtn.disabled = false;
    payBtn.innerHTML = '✅ Finalizar Inscripción';
  }
}

/* === UI HELPERS === */
function showError(message) {
  let toast = document.getElementById('wizard-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wizard-toast';
    toast.className = 'wizard__toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'wizard__toast wizard__toast--error wizard__toast--visible';
  setTimeout(() => toast.classList.remove('wizard__toast--visible'), 5000);
  return false;
}

function showLoading(message) {
  let overlay = document.getElementById('wizard-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'wizard-loading';
    overlay.className = 'wizard__loading-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="wizard__loading-content"><div class="wizard__spinner wizard__spinner--lg"></div><p>${message}</p></div>`;
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('wizard-loading');
  if (overlay) overlay.style.display = 'none';
}

function isAutomatedCrawler() {
  const ua = navigator.userAgent || '';
  return /Googlebot|bingbot|Applebot|Slurp|DuckDuckBot|Baiduspider|YandexBot|GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Google-Extended|HeadlessChrome|Lighthouse/i.test(ua);
}

let wizardOpenedTracked = false;
function trackWizardOpenOnce(triggerLabel) {
  if (wizardOpenedTracked || isAutomatedCrawler()) return;
  wizardOpenedTracked = true;
  if (window.FroebelUX) {
    window.FroebelUX.track('wizard_open', {
      element_id: 'open_enrollment_wizard',
      element_text: triggerLabel || 'Abrir Proceso de Inscripción en Línea'
    });
  }
}

function attachStepListeners() {
  // Focus input styling & track first interaction with pre-rendered wizard
  document.querySelectorAll('.wizard__field input, .wizard__field select, .wizard__field textarea').forEach(el => {
    el.addEventListener('focus', () => {
      el.closest('.wizard__field')?.classList.add('wizard__field--focused');
      trackWizardOpenOnce('Interacción Directa con Paso 1 de Inscripción');
    });
    el.addEventListener('blur', () => el.closest('.wizard__field')?.classList.remove('wizard__field--focused'));
  });
  if (currentStep === 0) {
    updateDobGradeHintUI(false);
    updateWizardLiveQuote();
  }
}

function normalizeProgramCode(raw) {
  if (!raw) return '';
  const k = String(raw).trim().toLowerCase();
  const aliasMap = {
    maternal: 'maternal',
    maternal_bilingue: 'maternal',
    preescolar_1: 'preescolar_1',
    kinder1: 'preescolar_1',
    kinder_1: 'preescolar_1',
    k1: 'preescolar_1',
    preescolar_2: 'preescolar_2',
    kinder2: 'preescolar_2',
    kinder_2: 'preescolar_2',
    k2: 'preescolar_2',
    preescolar_3: 'preescolar_3',
    kinder3: 'preescolar_3',
    kinder_3: 'preescolar_3',
    k3: 'preescolar_3'
  };
  return aliasMap[k] || '';
}

/* === OPEN WIZARD (Hot Button) === */
function openEnrollmentWizard(preset) {
  const wizardSection = document.getElementById('wizard-section');
  if (wizardSection) {
    wizardSection.style.display = 'block';
    if (preset && typeof preset === 'object') {
      const normProg = normalizeProgramCode(preset.program);
      if (normProg) wizardData.student.program = normProg;
      if (preset.plan) wizardData.student.plan = preset.plan;
      if (preset.estancia) wizardData.student.estancia = preset.estancia;
      currentStep = 0;
      renderWizard();
    } else if (!document.querySelector('#enrollment-wizard .wizard')) {
      currentStep = 0;
      wizardData = { student: {}, guardian: {}, documents: [], payment: {}, enrollment: null };
      renderWizard();
    }
    trackWizardOpenOnce('Abrir Proceso de Inscripción en Línea');
    wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* === INIT ON LOAD === */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const qProgram = normalizeProgramCode(params.get('programa') || params.get('grado'));
  const qPlan = params.get('plan') || params.get('modalidad');
  const qEstancia = params.get('estancia');
  if (qProgram) {
    wizardData.student.program = qProgram;
  }
  if (qPlan && ['pronto_pago', 'normal', 'anual'].includes(qPlan)) {
    wizardData.student.plan = qPlan;
  }
  if (qEstancia && ['ninguna', 'parcial_16h', 'completa_18h'].includes(qEstancia)) {
    wizardData.student.estancia = qEstancia;
  }

  // Pre-render Step 1 on load so visitors scrolling down #pasos immediately see the interactive wizard
  const container = document.getElementById('enrollment-wizard');
  if (container && !container.querySelector('.wizard')) {
    renderWizard();
  }
  if ((params.has('inscribir') || qProgram || qPlan || qEstancia) && !isAutomatedCrawler()) {
    openEnrollmentWizard();
  }
});
