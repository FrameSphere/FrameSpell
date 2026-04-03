/**
 * Payment Page JavaScript
 * Nutzt window.API_CONFIG (config.js) und window.PRICING_CONFIG (pricing-config.js)
 * Beide Dateien MÜSSEN vor diesem Script geladen sein.
 */

const API_BASE_URL = (window.API_CONFIG && window.API_CONFIG.BASE_URL)
  ? window.API_CONFIG.BASE_URL
  : 'https://rechtschreibe-api.karol-paschek.workers.dev';

const PC = window.PRICING_CONFIG;
const proPlan = PC.plans.professional;

// Auth
let authToken   = localStorage.getItem('authToken');
let currentUser = null;

// Aktuell ausgewählter Zyklus
let selectedCycle = 'monthly'; // 'monthly' | 'yearly'

// ── DOM-Elemente ─────────────────────────────────────────────
const el = {
  billingToggle:  document.getElementById('billing-toggle'),
  monthlyLabel:   document.getElementById('monthly-label'),
  yearlyLabel:    document.getElementById('yearly-label'),
  planMonthly:    document.getElementById('plan-monthly'),
  planYearly:     document.getElementById('plan-yearly'),
  summaryPlan:    document.getElementById('summary-plan'),
  summaryCycle:   document.getElementById('summary-cycle'),
  summaryPrice:   document.getElementById('summary-price'),
  summaryTax:     document.getElementById('summary-tax'),
  summaryTotal:   document.getElementById('summary-total'),
  checkoutButton: document.getElementById('checkout-button'),
  loadingSpinner: document.getElementById('loading-spinner'),
  toastContainer: document.getElementById('toast-container'),
};

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  if (!el.toastContainer) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div>${msg}</div>`;
  el.toastContainer.appendChild(t);
  setTimeout(() => t.classList.add('show'), 100);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ── Loading ───────────────────────────────────────────────────
function showLoading() { el.loadingSpinner?.classList.remove('hidden'); }
function hideLoading() { el.loadingSpinner?.classList.add('hidden');    }

// ── Summary aktualisieren ─────────────────────────────────────
function updateSummary() {
  const isYearly  = selectedCycle === 'yearly';
  const totalPrice = isYearly ? proPlan.priceYearly : proPlan.priceMonthly;
  const netPrice  = totalPrice / 1.19;
  const tax       = totalPrice - netPrice;

  const cycleName = isYearly ? 'Jährlich' : 'Monatlich';
  const planName  = `${proPlan.name} – ${cycleName}`;

  if (el.summaryPlan)  el.summaryPlan.textContent  = planName;
  if (el.summaryCycle) el.summaryCycle.textContent = cycleName;
  if (el.summaryPrice) el.summaryPrice.textContent = `€${totalPrice.toFixed(2)}`;
  if (el.summaryTax)   el.summaryTax.textContent   = `€${tax.toFixed(2)} (enthalten)`;
  if (el.summaryTotal) el.summaryTotal.textContent  = `€${totalPrice.toFixed(2)}`;
}

// ── Toggle-Funktion ────────────────────────────────────────────
function setCycle(cycle) {
  selectedCycle = cycle;
  const yearly  = cycle === 'yearly';

  el.billingToggle?.classList.toggle('active', yearly);
  el.monthlyLabel?.classList.toggle('active', !yearly);
  el.yearlyLabel?.classList.toggle('active',  yearly);
  el.planMonthly?.classList.toggle('selected', !yearly);
  el.planYearly?.classList.toggle('selected',  yearly);

  updateSummary();
}

// ── Stripe Checkout erstellen ──────────────────────────────────
async function createCheckoutSession() {
  if (!authToken) {
    showToast('Bitte melden Sie sich zuerst an', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    return;
  }

  showLoading();
  el.checkoutButton.disabled = true;

  try {
    const priceId = selectedCycle === 'yearly'
      ? proPlan.stripePriceIdYearly
      : proPlan.stripePriceIdMonthly;

    const response = await fetch(`${API_BASE_URL}/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        price_id:          priceId,
        subscription_type: 'professional',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen der Checkout-Session');
    }

    const data = await response.json();

    if (data.data?.checkout_url) {
      window.location.href = data.data.checkout_url;
    } else {
      throw new Error('Keine Checkout-URL erhalten');
    }

  } catch (error) {
    console.error('Checkout Error:', error);
    showToast(error.message || 'Fehler beim Starten der Zahlung', 'error');
    el.checkoutButton.disabled = false;
    hideLoading();
  }
}

// ── Auth prüfen ────────────────────────────────────────────────
async function checkAuth() {
  if (!authToken) {
    showToast('Bitte melden Sie sich zuerst an', 'warning');
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (!response.ok) throw new Error('Nicht authentifiziert');

    const json    = await response.json();
    currentUser   = json.data;

    if (currentUser.subscription_type === 'professional') {
      showToast('Sie haben bereits ein Professional-Abo', 'info');
      setTimeout(() => { window.location.href = 'index.html#dashboard'; }, 2000);
    } else if (currentUser.subscription_type === 'enterprise') {
      showToast('Sie haben bereits ein Enterprise-Abo', 'info');
      setTimeout(() => { window.location.href = 'index.html#dashboard'; }, 2000);
    }
  } catch (error) {
    console.error('Auth Error:', error);
    showToast('Bitte melden Sie sich an', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
  }
}

// ── Event Listener ─────────────────────────────────────────────
function setupEventListeners() {
  el.billingToggle?.addEventListener('click', () => setCycle(selectedCycle === 'monthly' ? 'yearly' : 'monthly'));
  el.planMonthly?.addEventListener('click',   () => setCycle('monthly'));
  el.planYearly?.addEventListener('click',    () => setCycle('yearly'));
  el.checkoutButton?.addEventListener('click', createCheckoutSession);
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  updateSummary();
  checkAuth();
});
