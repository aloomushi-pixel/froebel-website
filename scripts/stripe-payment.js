/* ============================================
   FROEBEL — Stripe Payment Module (Test Mode)
   ============================================ */

// Stripe Test Public Key — replace with live key for production
const STRIPE_PUBLIC_KEY = 'pk_test_51Demo1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno';

// Pricing (MXN)
const PRICING = {
    inscription: {
        regular: 7000,
        early: 3500,
        description: 'Inscripción Anual 2026-2027'
    },
    monthly: {
        base: 3800,
        plus: 6200,
        description: 'Mensualidad'
    }
};

let stripe = null;
let elements = null;
let cardElement = null;

/* === INITIALIZE STRIPE === */
function initStripe() {
    if (typeof Stripe === 'undefined') {
        console.warn('Stripe.js not loaded');
        return false;
    }
    stripe = Stripe(STRIPE_PUBLIC_KEY);
    return true;
}

/* === MOUNT CARD ELEMENT === */
function mountCardElement(containerId) {
    if (!stripe) {
        if (!initStripe()) return false;
    }

    elements = stripe.elements({
        locale: 'es',
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
    });

    const style = {
        base: {
            fontSize: '16px',
            fontFamily: '"Inter", sans-serif',
            color: '#2d3436',
            '::placeholder': { color: '#949ea3' },
            padding: '12px'
        },
        invalid: {
            color: '#e17055',
            iconColor: '#e17055'
        }
    };

    cardElement = elements.create('card', { style, hidePostalCode: true });
    cardElement.mount(`#${containerId}`);

    // Listen for errors
    cardElement.on('change', (event) => {
        const errorEl = document.getElementById('card-errors');
        if (errorEl) {
            errorEl.textContent = event.error ? event.error.message : '';
            errorEl.style.display = event.error ? 'block' : 'none';
        }
    });

    return true;
}

/* === SIMULATE PAYMENT (Test Mode) === */
async function processPayment(amount, description, enrollmentId) {
    // In a real implementation, you'd call your Edge Function to create a PaymentIntent
    // For now, we simulate the payment flow

    if (!stripe || !cardElement) {
        return simulatePayment(amount, description, enrollmentId);
    }

    try {
        // Simulate creating a PaymentIntent via Edge Function
        const paymentIntentId = 'pi_simulated_' + Date.now();

        // Record payment in Supabase
        const payment = await createPaymentRecord({
            enrollment_id: enrollmentId,
            payment_type: 'inscription',
            amount: amount,
            currency: 'MXN',
            status: 'completed',
            payment_method: 'card',
            stripe_payment_intent_id: paymentIntentId,
            description: description,
            paid_at: new Date().toISOString()
        });

        return { success: true, payment, paymentIntentId };
    } catch (error) {
        console.error('Payment error:', error);
        return { success: false, error: error.message };
    }
}

/* === SIMULATE PAYMENT (for demo) === */
async function simulatePayment(amount, description, enrollmentId) {
    // Simulate a 2-second processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentIntentId = 'pi_sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Record in Supabase
    const payment = await createPaymentRecord({
        enrollment_id: enrollmentId,
        payment_type: 'inscription',
        amount: amount,
        currency: 'MXN',
        status: 'completed',
        payment_method: 'card',
        stripe_payment_intent_id: paymentIntentId,
        description: description,
        paid_at: new Date().toISOString()
    });

    return { success: true, payment, paymentIntentId };
}

/* === SIMULATE TRANSFER PAYMENT === */
async function processTransferPayment(amount, description, enrollmentId, referenceNumber) {
    const payment = await createPaymentRecord({
        enrollment_id: enrollmentId,
        payment_type: 'inscription',
        amount: amount,
        currency: 'MXN',
        status: 'pending',
        payment_method: 'transfer',
        description: `${description} — Ref: ${referenceNumber}`,
    });

    return { success: true, payment };
}

/* === SETUP RECURRING SUBSCRIPTION (Simulated) === */
async function setupRecurringPayment(enrollmentId, plan, guardianEmail) {
    const subscriptionId = 'sub_sim_' + Date.now();
    const monthlyAmount = plan === 'plus' ? PRICING.monthly.plus : PRICING.monthly.base;

    // Update enrollment with subscription info
    await updateEnrollment(enrollmentId, {
        stripe_customer_id: 'cus_sim_' + Date.now(),
        stripe_subscription_id: subscriptionId
    });

    // Create first monthly payment record
    await createPaymentRecord({
        enrollment_id: enrollmentId,
        payment_type: 'monthly',
        amount: monthlyAmount,
        currency: 'MXN',
        status: 'pending',
        payment_method: 'card',
        stripe_invoice_id: 'inv_sim_' + Date.now(),
        description: `Mensualidad ${plan === 'plus' ? 'Plus' : 'Base'} — Septiembre 2026`
    });

    return { subscriptionId, monthlyAmount };
}

/* === GET INSCRIPTION PRICE === */
function getInscriptionPrice(isEarlyBird = true) {
    return isEarlyBird ? PRICING.inscription.early : PRICING.inscription.regular;
}

/* === GET MONTHLY PRICE === */
function getMonthlyPrice(plan) {
    return plan === 'plus' ? PRICING.monthly.plus : PRICING.monthly.base;
}

/* === FORMAT PRICE === */
function formatPrice(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(amount);
}
