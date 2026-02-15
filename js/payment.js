// Payment Page JavaScript
const API_BASE_URL = 'http://localhost:8000';

// Get auth token
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Plan configuration
const PLANS = {
    monthly: {
        name: 'Professional - Monatlich',
        cycle: 'Monatlich',
        price: 29.00, // Endpreis inkl. MwSt.
        priceId: 'price_monthly', // This will be sent to backend which replaces it with actual Stripe Price ID
        interval: 'month'
    },
    yearly: {
        name: 'Professional - Jährlich',
        cycle: 'Jährlich',
        price: 290.00, // Endpreis inkl. MwSt.
        priceId: 'price_yearly', // This will be sent to backend which replaces it with actual Stripe Price ID
        interval: 'year'
    }
};

let selectedPlan = 'monthly';

// DOM Elements
const elements = {
    billingToggle: document.getElementById('billing-toggle'),
    monthlyLabel: document.getElementById('monthly-label'),
    yearlyLabel: document.getElementById('yearly-label'),
    planMonthly: document.getElementById('plan-monthly'),
    planYearly: document.getElementById('plan-yearly'),
    summaryPlan: document.getElementById('summary-plan'),
    summaryCycle: document.getElementById('summary-cycle'),
    summaryPrice: document.getElementById('summary-price'),
    summaryTax: document.getElementById('summary-tax'),
    summaryTotal: document.getElementById('summary-total'),
    checkoutButton: document.getElementById('checkout-button'),
    loadingSpinner: document.getElementById('loading-spinner'),
    toastContainer: document.getElementById('toast-container')
};

// Utility Functions
function showLoading() {
    elements.loadingSpinner?.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingSpinner?.classList.add('hidden');
}

function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div>${message}</div>`;
    
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Update summary based on selected plan
function updateSummary() {
    const plan = PLANS[selectedPlan];
    const totalPrice = plan.price; // Endpreis inkl. MwSt.
    
    // Berechne die enthaltene MwSt. rückwärts (für Anzeigezwecke)
    const netPrice = totalPrice / 1.19;
    const includedTax = totalPrice - netPrice;
    
    elements.summaryPlan.textContent = plan.name;
    elements.summaryCycle.textContent = plan.cycle;
    elements.summaryPrice.textContent = `€${totalPrice.toFixed(2)}`;
    
    // Zeige an, dass MwSt. bereits enthalten ist
    elements.summaryTax.textContent = `€${includedTax.toFixed(2)} (enthalten)`;
    elements.summaryTotal.textContent = `€${totalPrice.toFixed(2)}`;
}

// Toggle billing cycle
function toggleBilling() {
    const isYearly = elements.billingToggle.classList.contains('active');
    
    if (isYearly) {
        // Switch to monthly
        elements.billingToggle.classList.remove('active');
        elements.monthlyLabel.classList.add('active');
        elements.yearlyLabel.classList.remove('active');
        elements.planMonthly.classList.add('selected');
        elements.planYearly.classList.remove('selected');
        selectedPlan = 'monthly';
    } else {
        // Switch to yearly
        elements.billingToggle.classList.add('active');
        elements.monthlyLabel.classList.remove('active');
        elements.yearlyLabel.classList.add('active');
        elements.planMonthly.classList.remove('selected');
        elements.planYearly.classList.add('selected');
        selectedPlan = 'yearly';
    }
    
    updateSummary();
}

// Select plan directly
function selectPlan(plan) {
    selectedPlan = plan;
    
    // Update UI
    document.querySelectorAll('.plan-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    if (plan === 'monthly') {
        elements.planMonthly.classList.add('selected');
        elements.billingToggle.classList.remove('active');
        elements.monthlyLabel.classList.add('active');
        elements.yearlyLabel.classList.remove('active');
    } else {
        elements.planYearly.classList.add('selected');
        elements.billingToggle.classList.add('active');
        elements.monthlyLabel.classList.remove('active');
        elements.yearlyLabel.classList.add('active');
    }
    
    updateSummary();
}

// Create Stripe Checkout Session
async function createCheckoutSession() {
    if (!authToken) {
        showToast('Bitte melden Sie sich zuerst an', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    showLoading();
    elements.checkoutButton.disabled = true;
    
    try {
        const plan = PLANS[selectedPlan];
        
        const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                price_id: plan.priceId,
                subscription_type: 'professional'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Fehler beim Erstellen der Checkout-Session');
        }
        
        const data = await response.json();
        
        // Redirect to Stripe Checkout
        if (data.checkout_url) {
            window.location.href = data.checkout_url;
        } else {
            throw new Error('Keine Checkout-URL erhalten');
        }
        
    } catch (error) {
        console.error('Checkout Error:', error);
        showToast(error.message || 'Fehler beim Starten der Zahlung', 'error');
        elements.checkoutButton.disabled = false;
        hideLoading();
    }
}

// Check if user is logged in
async function checkAuth() {
    if (!authToken) {
        showToast('Bitte melden Sie sich zuerst an', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Nicht authentifiziert');
        }
        
        currentUser = await response.json();
        
        // Check if user already has professional subscription
        if (currentUser.subscription_type === 'professional') {
            showToast('Sie haben bereits ein Professional-Abo', 'info');
            setTimeout(() => {
                window.location.href = 'index.html#dashboard';
            }, 2000);
            return;
        }
        
        // Check if user is enterprise
        if (currentUser.subscription_type === 'enterprise') {
            showToast('Sie haben bereits ein Enterprise-Abo', 'info');
            setTimeout(() => {
                window.location.href = 'index.html#dashboard';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Auth Error:', error);
        showToast('Bitte melden Sie sich an', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Event Listeners
function setupEventListeners() {
    // Billing toggle
    elements.billingToggle?.addEventListener('click', toggleBilling);
    
    // Plan selection
    elements.planMonthly?.addEventListener('click', () => selectPlan('monthly'));
    elements.planYearly?.addEventListener('click', () => selectPlan('yearly'));
    
    // Checkout button
    elements.checkoutButton?.addEventListener('click', createCheckoutSession);
}

// Initialize
function init() {
    setupEventListeners();
    updateSummary();
    checkAuth();
}

// Start
document.addEventListener('DOMContentLoaded', init);
