/* ============================================
   FROEBEL — Supabase Client
   ============================================ */

const SUPABASE_URL = 'https://qijjoaukavhezdihpqfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpampvYXVrYXZoZXpkaWhwcWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDIzMjMsImV4cCI6MjA4NDg3ODMyM30.35dXePpdqKUpZVj95SfWnHsumZ7cnNoay2oE_i2Q2BM';

// Initialize Supabase client (using CDN)
let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

/* === GUARDIAN OPERATIONS === */
async function createGuardian(data) {
    const sb = getSupabase();
    const { data: guardian, error } = await sb
        .from('froebel_guardians')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return guardian;
}

/* === STUDENT OPERATIONS === */
async function createStudent(data) {
    const sb = getSupabase();
    const { data: student, error } = await sb
        .from('froebel_students')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return student;
}

/* === ENROLLMENT OPERATIONS === */
async function createEnrollment(data) {
    const sb = getSupabase();
    const { data: enrollment, error } = await sb
        .from('froebel_enrollments')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return enrollment;
}

async function getEnrollment(id) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from('froebel_enrollments')
        .select(`
      *,
      froebel_students(*),
      froebel_guardians(*),
      froebel_documents(*),
      froebel_payments(*)
    `)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

async function updateEnrollment(id, updates) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from('froebel_enrollments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/* === DOCUMENT OPERATIONS === */
async function uploadDocument(enrollmentId, file, documentType) {
    const sb = getSupabase();
    const ext = file.name.split('.').pop();
    const filePath = `${enrollmentId}/${documentType}_${Date.now()}.${ext}`;

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await sb.storage
        .from('student-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    if (uploadError) throw uploadError;

    // Save document record
    const { data: doc, error: docError } = await sb
        .from('froebel_documents')
        .insert({
            enrollment_id: enrollmentId,
            document_type: documentType,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
        })
        .select()
        .single();
    if (docError) throw docError;
    return doc;
}

/* === PAYMENT OPERATIONS === */
async function createPaymentRecord(data) {
    const sb = getSupabase();
    const { data: payment, error } = await sb
        .from('froebel_payments')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return payment;
}

async function updatePayment(id, updates) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from('froebel_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/* === ADMIN OPERATIONS === */
async function adminLogin(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function adminLogout() {
    const sb = getSupabase();
    await sb.auth.signOut();
}

async function getAdminSession() {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    return session;
}

async function listEnrollments(status = null) {
    const sb = getSupabase();
    let query = sb
        .from('froebel_enrollments')
        .select(`
      *,
      froebel_students(full_name, date_of_birth),
      froebel_guardians(full_name, email, phone),
      froebel_documents(id, document_type, status),
      froebel_payments(id, payment_type, amount, status)
    `)
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function approveEnrollment(id, notes = '') {
    return updateEnrollment(id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin',
        admin_notes: notes
    });
}

async function rejectEnrollment(id, reason) {
    return updateEnrollment(id, {
        status: 'rejected',
        rejected_reason: reason,
        admin_notes: reason
    });
}
