/* ============================================
   FROEBEL — Enrollment Wizard (5-Step)
   ============================================ */

const WIZARD_STEPS = [
  { id: 'student', title: 'Datos del Alumno', icon: '👶' },
  { id: 'guardian', title: 'Datos del Tutor', icon: '👨‍👩‍👧' },
  { id: 'documents', title: 'Documentos', icon: '📄' },
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
  return `
    <div class="wizard__section fade-in visible">
      <h2 class="wizard__title">Datos del Alumno</h2>
      <p class="wizard__desc">Ingresa la información de tu hijo/a para iniciar el proceso de inscripción.</p>

      <div class="wizard__form-grid">
        <div class="wizard__field">
          <label for="s-name">Nombre completo del alumno *</label>
          <input type="text" id="s-name" value="${s.full_name || ''}" required placeholder="Nombre(s) y Apellidos">
        </div>

        <div class="wizard__field">
          <label for="s-dob">Fecha de nacimiento *</label>
          <input type="date" id="s-dob" value="${s.date_of_birth || ''}" required>
        </div>

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
          <input type="text" id="s-curp" value="${s.curp || ''}" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase;">
        </div>

        <div class="wizard__field">
          <label for="s-program">Programa *</label>
          <select id="s-program" required>
            <option value="">Seleccionar programa</option>
            <option value="maternal" ${s.program === 'maternal' ? 'selected' : ''}>Maternal (1-3 años)</option>
            <option value="preescolar_1" ${s.program === 'preescolar_1' ? 'selected' : ''}>Preescolar 1 (3-4 años)</option>
            <option value="preescolar_2" ${s.program === 'preescolar_2' ? 'selected' : ''}>Preescolar 2 (4-5 años)</option>
            <option value="preescolar_3" ${s.program === 'preescolar_3' ? 'selected' : ''}>Preescolar 3 (5-6 años)</option>
          </select>
        </div>

        <div class="wizard__field">
          <label for="s-plan">Modalidad de pago *</label>
          <select id="s-plan" required>
            <option value="pronto_pago" ${s.plan === 'pronto_pago' || !s.plan ? 'selected' : ''}>Pronto Pago — $3,600/mes (primeros 10 días)</option>
            <option value="normal" ${s.plan === 'normal' ? 'selected' : ''}>Mensual Normal — $4,000/mes</option>
            <option value="anual" ${s.plan === 'anual' ? 'selected' : ''}>Pago Anual — $40,480 (8% desc.)</option>
          </select>
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
          <label for="g-address">Dirección</label>
          <input type="text" id="g-address" value="${g.address || ''}" placeholder="Calle, número, colonia, CP">
        </div>

        <div class="wizard__field">
          <label for="g-emergency-name">Contacto de emergencia *</label>
          <input type="text" id="g-emergency-name" value="${g.emergency_contact_name || ''}" required placeholder="Nombre del contacto">
        </div>

        <div class="wizard__field">
          <label for="g-emergency-phone">Teléfono de emergencia *</label>
          <input type="tel" id="g-emergency-phone" value="${g.emergency_contact_phone || ''}" required placeholder="55 9876 5432">
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
  const plan = s.plan || 'base';

  return `
    <div class="wizard__section wizard__section--confirmation fade-in visible">
      <div class="wizard__confirm-icon">🎉</div>
      <h2 class="wizard__title">¡Inscripción Recibida!</h2>
      <p class="wizard__desc">Hemos recibido la solicitud de inscripción. Nuestro equipo revisará los documentos y te contactaremos pronto.</p>

      <div class="wizard__confirm-card">
        <div class="wizard__confirm-status">
          <span class="wizard__status-badge wizard__status-badge--pending">⏳ Pendiente de revisión</span>
        </div>
        <div class="wizard__confirm-grid">
          <div>
            <h4>Alumno</h4>
            <p><strong>${s.full_name || ''}</strong></p>
            <p>${s.program ? s.program.replace('_', ' ') : ''} — ${plan === 'anual' ? 'Pago Anual' : plan === 'normal' ? 'Mensual Normal' : 'Pronto Pago'}</p>
          </div>
          <div>
            <h4>Tutor</h4>
            <p><strong>${g.full_name || ''}</strong></p>
            <p>${g.email || ''}</p>
            <p>${g.phone || ''}</p>
          </div>
        </div>
        <div class="wizard__confirm-footer">
          <p>📧 Recibirás una confirmación por correo a <strong>${g.email || ''}</strong></p>
          <p>📱 También te contactaremos por WhatsApp al <strong>${g.phone || ''}</strong></p>
        </div>
      </div>

      <div class="wizard__confirm-next">
        <h3>¿Qué sigue?</h3>
        <div class="wizard__confirm-steps">
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">1</span>
            <div>
              <strong>Revisión de documentos</strong>
              <p>Nuestro equipo verificará los documentos subidos (1-2 días hábiles).</p>
            </div>
          </div>
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">2</span>
            <div>
              <strong>Aprobación</strong>
              <p>Recibirás un correo de confirmación con los datos de acceso.</p>
            </div>
          </div>
          <div class="wizard__confirm-step">
            <span class="wizard__confirm-num">3</span>
            <div>
              <strong>¡Bienvenidos!</strong>
              <p>Tu hijo/a comienza su aventura Froebel en septiembre 2026.</p>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:var(--space-8);">
        <a href="index.html" class="btn btn--primary">Volver al Inicio</a>
        <a href="https://wa.me/525554148872?text=Hola%2C%20acabo%20de%20completar%20mi%20inscripción%20en%20línea" class="btn btn--secondary" target="_blank" rel="noopener">
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  `;
}

/* === FOOTER NAVIGATION === */
function renderFooter() {
  if (currentStep === 3) return '';
  return `
    <div class="wizard__nav">
      ${currentStep > 0 ? '<button class="btn btn--secondary" onclick="prevStep()">← Anterior</button>' : '<div></div>'}
      ${currentStep < 2 ? '<button class="btn btn--primary" onclick="nextStep()">Siguiente →</button>' : ''}
      ${currentStep === 2 ? '<button class="btn btn--primary btn--lg wizard__pay-btn" onclick="submitEnrollment()" id="pay-button">✅ Finalizar Inscripción</button>' : ''}
    </div>
  `;
}

/* === NAVIGATION === */
async function nextStep() {
  if (!validateCurrentStep()) return;
  saveCurrentStepData();

  currentStep++;
  renderWizard();

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
  const dob = document.getElementById('s-dob')?.value;
  const program = document.getElementById('s-program')?.value;

  if (!name) return showError('Ingresa el nombre del alumno');
  if (!dob) return showError('Ingresa la fecha de nacimiento');
  if (!program) return showError('Selecciona un programa');
  return true;
}

function validateGuardianStep() {
  const name = document.getElementById('g-name')?.value?.trim();
  const email = document.getElementById('g-email')?.value?.trim();
  const phone = document.getElementById('g-phone')?.value?.trim();
  const emergName = document.getElementById('g-emergency-name')?.value?.trim();
  const emergPhone = document.getElementById('g-emergency-phone')?.value?.trim();

  if (!name) return showError('Ingresa tu nombre');
  if (!email || !email.includes('@')) return showError('Ingresa un correo electrónico válido');
  if (!phone) return showError('Ingresa tu teléfono');
  if (!emergName) return showError('Ingresa el nombre del contacto de emergencia');
  if (!emergPhone) return showError('Ingresa el teléfono de emergencia');
  return true;
}

function validateDocumentsStep() {
  // Document validation removed as per business requirements to allow enrollment without all documents.
  return true;
}

/* === SAVE STEP DATA === */
function saveCurrentStepData() {
  switch (currentStep) {
    case 0:
      wizardData.student = {
        full_name: document.getElementById('s-name')?.value?.trim() || '',
        date_of_birth: document.getElementById('s-dob')?.value || '',
        gender: document.getElementById('s-gender')?.value || '',
        curp: document.getElementById('s-curp')?.value?.toUpperCase() || '',
        program: document.getElementById('s-program')?.value || '',
        plan: document.getElementById('s-plan')?.value || 'base',
        blood_type: document.getElementById('s-blood')?.value || '',
        allergies: document.getElementById('s-allergies')?.value?.trim() || '',
        medical_notes: document.getElementById('s-notes')?.value?.trim() || ''
      };
      break;
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

function attachStepListeners() {
  // Focus input styling
  document.querySelectorAll('.wizard__field input, .wizard__field select, .wizard__field textarea').forEach(el => {
    el.addEventListener('focus', () => el.closest('.wizard__field')?.classList.add('wizard__field--focused'));
    el.addEventListener('blur', () => el.closest('.wizard__field')?.classList.remove('wizard__field--focused'));
  });
}

/* === OPEN WIZARD (Hot Button) === */
function openEnrollmentWizard() {
  const wizardSection = document.getElementById('wizard-section');
  if (wizardSection) {
    wizardSection.style.display = 'block';
    currentStep = 0;
    wizardData = { student: {}, guardian: {}, documents: [], payment: {}, enrollment: null };
    renderWizard();
    wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* === INIT ON LOAD === */
document.addEventListener('DOMContentLoaded', () => {
  // If wizard container exists, check for auto-open via URL param
  const params = new URLSearchParams(window.location.search);
  if (params.has('inscribir')) {
    openEnrollmentWizard();
  }
});
