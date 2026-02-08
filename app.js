// API Base URL - anpassen je nach Backend-Setup
const API_BASE_URL = window.API_CONFIG?.BASE_URL || 'http://localhost:8000';
console.log('🚀 API URL:', API_BASE_URL);

// State Management
let currentUser = null;
let authToken = null;
let demoAttempts = 3;

// DOM Elements
const elements = {
    // Navigation
    navAuth: document.getElementById('nav-auth'),
    navUser: document.getElementById('nav-user'),
    userEmail: document.getElementById('user-email'),
    userMenuBtn: document.getElementById('user-menu-btn'),
    userDropdown: document.getElementById('user-dropdown'),
    
    // Buttons
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    tryDemoBtn: document.getElementById('try-demo-btn'),
    getStartedBtn: document.getElementById('get-started-btn'),
    
    // Modals
    loginModal: document.getElementById('login-modal'),
    registerModal: document.getElementById('register-modal'),
    loginModalClose: document.getElementById('login-modal-close'),
    registerModalClose: document.getElementById('register-modal-close'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Demo Section
    demoText: document.getElementById('demo-text'),
    demoLanguage: document.getElementById('demo-language'),
    demoCheckBtn: document.getElementById('demo-check-btn'),
    demoOutput: document.getElementById('demo-output'),
    demoResult: document.getElementById('demo-result'),
    demoCorrections: document.getElementById('demo-corrections'),
    demoTime: document.getElementById('demo-time'),
    demoAttempts: document.getElementById('demo-attempts'),
    
    // Dashboard
    dashboard: document.getElementById('dashboard'),
    mainContent: document.querySelector('.main-content'),
    profileEmail: document.getElementById('profile-email'),
    profileStatus: document.getElementById('profile-status'),
    apiKeyValue: document.getElementById('api-key-value'),
    copyApiKey: document.getElementById('copy-api-key'),
    regenerateApiKey: document.getElementById('regenerate-api-key'),
    usageToday: document.getElementById('usage-today'),
    usageRemaining: document.getElementById('usage-remaining'),
    usageCost: document.getElementById('usage-cost'),
    usageChartFill: document.getElementById('usage-chart-fill'),
    
    // API Testing
    testText: document.getElementById('test-text'),
    testLanguage: document.getElementById('test-language'),
    testApiBtn: document.getElementById('test-api-btn'),
    testOutput: document.getElementById('test-output'),
    testResult: document.getElementById('test-result'),
    testTime: document.getElementById('test-time'),
    testStatus: document.getElementById('test-status'),
    
    // Loading and Toasts
    loadingSpinner: document.getElementById('loading-spinner'),
    toastContainer: document.getElementById('toast-container')
};

// Utility Functions
function showElement(element) {
    if (element) {
        element.classList.remove('hidden');
    } else {
        console.warn('showElement: Element not found');
    }
}

function hideElement(element) {
    if (element) {
        element.classList.add('hidden');
    } else {
        console.warn('hideElement: Element not found');
    }
}

function toggleElement(element) {
    if (element) {
        element.classList.toggle('hidden');
    } else {
        console.warn('toggleElement: Element not found');
    }
}

function showLoading() {
    showElement(elements.loadingSpinner);
}

function hideLoading() {
    hideElement(elements.loadingSpinner);
}

function showToast(message, type = 'info') {
    if (!elements.toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>${message}</div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        
        console.log('API Response:', response.status, data);
        
        if (!response.ok) {
            const errorMsg = data.error || data.detail || data.message || JSON.stringify(data) || 'API request failed';
            throw new Error(errorMsg);
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

async function login(email, password) {
    const response = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    
    const data = response.data || response;
    authToken = data.token || data.access_token;
    localStorage.setItem('authToken', authToken);
    
    currentUser = data.user;
    updateUI();
    showToast('Erfolgreich angemeldet!', 'success');
    
    return data;
}

async function register(email, password) {
    const response = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    
    const data = response.data || response;
    authToken = data.token || data.access_token;
    localStorage.setItem('authToken', authToken);
    
    currentUser = data.user;
    updateUI();
    showToast('Registrierung erfolgreich!', 'success');
    
    return data;
}

async function loadUserProfile() {
    const response = await apiRequest('/me');
    const data = response.data || response;
    currentUser = data;
    updateUI();
    return data;
}

async function spellcheck(text, language = 'de', isDemo = false) {
    const startTime = Date.now();
    
    // Demo: Registriere temporären User oder zeige Warnung
    if (isDemo) {
        showToast('Demo erfordert Registrierung. Bitte melden Sie sich an!', 'warning');
        setTimeout(() => showElement(elements.registerModal), 1000);
        throw new Error('Demo requires authentication');
    }
    
    const response = await apiRequest('/spellcheck', {
        method: 'POST',
        body: JSON.stringify({ text, language }),
    });
    
    const data = response.data || response;
    const processingTime = Date.now() - startTime;
    
    return { 
        corrected_text: data.corrected, 
        original: text,
        actual_processing_time: processingTime,
        tokens_used: data.tokens_used 
    };
}

async function regenerateApiKey() {
    const data = await apiRequest('/generate-api-key', {
        method: 'POST',
    });
    
    currentUser.api_key = data.api_key;
    updateUI();
    showToast('API Key erfolgreich regeneriert!', 'success');
    
    return data;
}

async function upgradePlan(planType) {
    const data = await apiRequest('/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify({ plan_type: planType }),
    });
    
    // Update current user data
    await loadUserProfile();
    showToast(`Erfolgreich auf ${planType} Plan upgegradet!`, 'success');
    
    return data;
}

// UI Update Functions
function updateUI() {
    if (currentUser && authToken) {
        // Show user navigation
        hideElement(elements.navAuth);
        showElement(elements.navUser);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = currentUser.email;
        }
        
        // Update profile info
        if (elements.profileEmail) {
            elements.profileEmail.textContent = currentUser.email;
        }
        if (elements.profileStatus) {
            // Map subscription types to display names
            const subscriptionNames = {
                'free': 'Kostenlos',
                'professional': 'Professional',
                'enterprise': 'Enterprise'
            };
            const displayName = subscriptionNames[currentUser.subscription_type] || 'Kostenlos';
            elements.profileStatus.textContent = displayName;
            elements.profileStatus.className = `status-badge clickable ${currentUser.subscription_type !== 'free' ? 'premium' : ''}`;
            elements.profileStatus.style.cursor = 'pointer';
        }
        
        // Update API key
        if (elements.apiKeyValue) {
            elements.apiKeyValue.textContent = currentUser.api_key || 'Nicht verfügbar';
        }
        
        // Update usage stats
        if (elements.usageToday) {
            elements.usageToday.textContent = currentUser.tokens_used_today || 0;
        }
        if (elements.usageRemaining) {
            // Calculate limit based on subscription
            let rateLimit = 20;
            if (currentUser.subscription_type === 'professional') {
                rateLimit = 100;
            } else if (currentUser.subscription_type === 'enterprise') {
                rateLimit = 999999;
            }
            
            const remaining = Math.max(0, rateLimit - (currentUser.tokens_used_today || 0));
            elements.usageRemaining.textContent = remaining;
        }
        if (elements.usageChartFill) {
            // Calculate percentage based on subscription
            let rateLimit = 20;
            if (currentUser.subscription_type === 'professional') {
                rateLimit = 100;
            } else if (currentUser.subscription_type === 'enterprise') {
                rateLimit = 1; // To show 100% but it's unlimited
            }
            
            const usagePercentage = ((currentUser.tokens_used_today || 0) / rateLimit) * 100;
            elements.usageChartFill.style.width = `${Math.min(usagePercentage, 100)}%`;
            
            // Update progress note text
            const progressNote = document.getElementById('progress-note-text');
            if (progressNote) {
                if (currentUser.subscription_type === 'professional') {
                    progressNote.textContent = 'Basierend auf 100 Anfragen pro Minute (Professional)';
                } else if (currentUser.subscription_type === 'enterprise') {
                    progressNote.textContent = 'Unbegrenzte Anfragen (Enterprise)';
                } else {
                    progressNote.textContent = 'Basierend auf 20 kostenlosen Anfragen pro Minute';
                }
            }
        }
        
        // Show monthly subscription cost only
        if (elements.usageCost) {
            let monthlyCost = 0;
            
            if (currentUser.subscription_type === 'professional') {
                monthlyCost = 29; // €29/Monat inkl. MwSt.
            } else if (currentUser.subscription_type === 'enterprise') {
                monthlyCost = 290; // €290/Monat inkl. MwSt.
            }
            
            elements.usageCost.textContent = `€${monthlyCost.toFixed(2)}`;
        }
        
    } else {
        // Show auth navigation
        showElement(elements.navAuth);
        hideElement(elements.navUser);
    }
}

function showDashboard() {
    if (!currentUser || !authToken) {
        showElement(elements.registerModal);
        return;
    }
    
    // Hauptinhalt verstecken
    if (elements.mainContent) {
        elements.mainContent.style.display = 'none';
        elements.mainContent.style.visibility = 'hidden';
    }
    
    // Dashboard anzeigen
    if (elements.dashboard) {
        elements.dashboard.classList.remove('hidden');
        elements.dashboard.style.display = 'block';
        elements.dashboard.style.visibility = 'visible';
        elements.dashboard.style.opacity = '1';
        elements.dashboard.style.position = 'fixed';
        elements.dashboard.style.top = '0';
        elements.dashboard.style.left = '0';
        elements.dashboard.style.width = '100vw';
        elements.dashboard.style.height = '100vh';
        elements.dashboard.style.zIndex = '1001';
        elements.dashboard.style.background = 'var(--background)';
    }
    
    // Navigation cleanup
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (elements.userDropdown) {
        elements.userDropdown.classList.remove('show');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Start auto-refresh for usage stats (every 5 seconds)
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    
    window.dashboardRefreshInterval = setInterval(() => {
        if (currentUser && authToken && !elements.dashboard?.classList.contains('hidden')) {
            loadUserProfile().catch(err => {
                console.error('Error refreshing dashboard:', err);
            });
        }
    }, 5000); // Refresh every 5 seconds
}

function showMainContent() {
    // Show main content and hide dashboard
    if (elements.mainContent) {
        elements.mainContent.style.display = 'block';
    }
    if (elements.dashboard) {
        elements.dashboard.style.display = 'none';
        elements.dashboard.classList.add('hidden');
    }
    
    // Stop auto-refresh when leaving dashboard
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
        window.dashboardRefreshInterval = null;
    }
    
    // Update navigation active state based on current scroll position
    setTimeout(() => {
        updateActiveNavLink();
    }, 100);
}

function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        // After scrolling, update active link will be triggered by scroll event
    }
}

// Event Handlers
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showToast('Bitte alle Felder ausfüllen', 'error');
        return;
    }
    
    showLoading();
    
    login(email, password)
        .then(() => {
            hideElement(elements.loginModal);
            elements.loginForm.reset();
            // Nach Login zum neuen Dashboard wechseln
            setTimeout(() => {
                showDashboard();
            }, 500);
        })
        .catch((error) => {
            showToast(error.message || 'Anmeldung fehlgeschlagen', 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    if (!email || !password || !passwordConfirm) {
        showToast('Bitte alle Felder ausfüllen', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showToast('Passwörter stimmen nicht überein', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Passwort muss mindestens 6 Zeichen haben', 'error');
        return;
    }
    
    showLoading();
    
    register(email, password)
        .then(() => {
            hideElement(elements.registerModal);
            elements.registerForm.reset();
            // Nach Registrierung zum neuen Dashboard wechseln
            setTimeout(() => {
                showDashboard();
            }, 500);
        })
        .catch((error) => {
            showToast(error.message || 'Registrierung fehlgeschlagen', 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    updateUI();
    showMainContent();
    showToast('Erfolgreich abgemeldet', 'success');
}

// Fügen Sie diese Funktionen zu Ihrem app.js hinzu:

// Dashboard navigation erweitern
function initDashboardNavigation() {
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const href = e.target.getAttribute('href');
            if (href === '#profile') {
                e.preventDefault();
                showDashboardSection('profile');
            } else if (href === '#api-keys') {
                e.preventDefault();
                showDashboardSection('api-keys');
            } else if (href === '#usage') {
                e.preventDefault();
                showDashboardSection('usage');
            }
        });
    });
}

// Dashboard Sektion anzeigen
function showDashboardSection(section) {
    // Dashboard anzeigen
    showDashboard();
    
    // Alle Sektionen verstecken
    document.querySelectorAll('.dashboard-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Spezifische Sektion anzeigen
    switch(section) {
        case 'profile':
            document.getElementById('profile-section')?.style.setProperty('display', 'block');
            break;
        case 'api-keys':
            document.getElementById('api-key-section')?.style.setProperty('display', 'block');
            // API Key Manager initialisieren falls nicht bereits geschehen
            if (!window.apiKeyManager) {
                initAPIKeyManager();
            }
            break;
        case 'usage':
            document.getElementById('usage-section')?.style.setProperty('display', 'block');
            break;
    }
}

// API Key Manager initialisieren
function initAPIKeyManager() {
    window.apiKeyManager = new APIKeyManager();
    
    // Language selection Events
    document.querySelectorAll('.language-card[data-available="true"]').forEach(card => {
        card.addEventListener('click', handleLanguageSelection);
    });
    
    // API Key action Events
    document.getElementById('create-key-btn')?.addEventListener('click', createAPIKey);
    document.getElementById('regenerate-key-btn')?.addEventListener('click', regenerateAPIKey);
    document.getElementById('delete-key-btn')?.addEventListener('click', deleteAPIKey);
    document.getElementById('copy-key-btn')?.addEventListener('click', copyAPIKey);
}

// Language Selection Handler
function handleLanguageSelection(e) {
    const card = e.currentTarget;
    const language = card.dataset.lang;
    const available = card.dataset.available === 'true';
    
    if (!available) return;
    
    // Update UI
    document.querySelectorAll('.language-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    // Show language info
    const languageNames = {
        'de': 'Deutsch',
        'en': 'Englisch',
        'es': 'Spanisch',
        'fr': 'Französisch'
    };
    
    document.getElementById('selected-lang-name').textContent = languageNames[language];
    document.getElementById('selected-language-info').classList.remove('hidden');
    document.getElementById('current-lang-display').textContent = languageNames[language];
    document.getElementById('api-key-management').classList.remove('hidden');
    
    // Set selected language
    window.selectedLanguage = language;
    
    // Check if API key exists
    checkExistingAPIKey(language);
}

// Check for existing API key
async function checkExistingAPIKey(language) {
    try {
        const response = await fetch('/api/user-language-keys', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.api_keys && data.api_keys[language]) {
                showExistingKey(language, data.api_keys[language], data.usage_stats[language]);
            } else {
                showNoKeyState();
            }
        }
    } catch (error) {
        console.error('Error checking API keys:', error);
        showNoKeyState();
    }
}

// Show states
function showNoKeyState() {
    document.getElementById('no-key-state').classList.remove('hidden');
    document.getElementById('existing-key-state').classList.add('hidden');
}

function showExistingKey(language, apiKey, stats) {
    document.getElementById('no-key-state').classList.add('hidden');
    document.getElementById('existing-key-state').classList.remove('hidden');
    document.getElementById('current-api-key').value = apiKey;
    
    // Update usage stats
    if (stats) {
        document.getElementById('usage-today').textContent = stats.today || 0;
        document.getElementById('usage-remaining').textContent = stats.remaining || 20;
        document.getElementById('usage-cost').textContent = `€${(stats.cost || 0).toFixed(2)}`;
    }
}

// API Key Actions
async function createAPIKey() {
    if (!window.selectedLanguage) return;
    
    try {
        const response = await fetch('/api/create-language-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                language: window.selectedLanguage
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showExistingKey(window.selectedLanguage, data.api_key, {});
            showToast('API Key erfolgreich erstellt!', 'success');
        } else {
            const error = await response.json();
            showToast(error.detail || 'Fehler beim Erstellen', 'error');
        }
    } catch (error) {
        console.error('Error creating API key:', error);
        showToast('Fehler beim Erstellen des API Keys', 'error');
    }
}

async function regenerateAPIKey() {
    if (!window.selectedLanguage) return;
    if (!confirm('Alten API Key ungültig machen?')) return;
    
    try {
        const response = await fetch('/api/regenerate-language-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                language: window.selectedLanguage
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('current-api-key').value = data.api_key;
            showToast('API Key erfolgreich regeneriert!', 'success');
        } else {
            const error = await response.json();
            showToast(error.detail || 'Fehler beim Regenerieren', 'error');
        }
    } catch (error) {
        console.error('Error regenerating API key:', error);
        showToast('Fehler beim Regenerieren', 'error');
    }
}

async function deleteAPIKey() {
    if (!window.selectedLanguage) return;
    if (!confirm('API Key wirklich löschen?')) return;
    
    try {
        const response = await fetch('/api/delete-language-key', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                language: window.selectedLanguage
            })
        });
        
        if (response.ok) {
            showNoKeyState();
            showToast('API Key gelöscht!', 'success');
        } else {
            const error = await response.json();
            showToast(error.detail || 'Fehler beim Löschen', 'error');
        }
    } catch (error) {
        console.error('Error deleting API key:', error);
        showToast('Fehler beim Löschen', 'error');
    }
}

function copyAPIKey() {
    const keyField = document.getElementById('current-api-key');
    keyField.select();
    keyField.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(keyField.value).then(() => {
        showToast('API Key kopiert!', 'success');
    });
}

// API Key Manager Class (minimale Version)
class APIKeyManager {
    constructor() {
        this.selectedLanguage = null;
        this.apiKeys = {};
    }
}

// Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', () => {
    // Ihre bestehende Initialisierung...
    
    // Neue Dashboard Navigation hinzufügen
    initDashboardNavigation();
});

async function handleDemoSpellcheck() {
    if (demoAttempts <= 0) {
        showToast('Keine Demo-Versuche mehr übrig. Bitte registrieren Sie sich.', 'warning');
        return;
    }
    
    const text = elements.demoText.value.trim();
    const language = elements.demoLanguage.value;
    
    if (!text) {
        showToast('Bitte geben Sie einen Text ein', 'error');
        return;
    }
    
    showLoading();
    elements.demoCheckBtn.disabled = true;
    
    try {
        const result = await spellcheck(text, language, true);
        
        // Update attempts
        demoAttempts--;
        elements.demoAttempts.textContent = demoAttempts;
        
        // Show results
        elements.demoResult.textContent = result.corrected_text;
        elements.demoTime.textContent = result.actual_processing_time;
        
        // Show corrections
        if (result.corrections_made && result.corrections_made.length > 0) {
            const correctionsHtml = result.corrections_made.map(correction => 
                `<div class="correction-item">
                    <strong>Korrektur:</strong> "${correction.original}" → "${correction.corrected}"
                    <span class="correction-type">(${correction.type})</span>
                </div>`
            ).join('');
            elements.demoCorrections.innerHTML = `<h5>Korrekturen:</h5>${correctionsHtml}`;
        } else {
            elements.demoCorrections.innerHTML = '<p style="color: var(--success);">✓ Keine Korrekturen erforderlich</p>';
        }
        
        showElement(elements.demoOutput);
        
        if (demoAttempts === 0) {
            elements.demoCheckBtn.textContent = 'Demo-Limit erreicht';
            elements.demoCheckBtn.disabled = true;
        }
        
    } catch (error) {
        showToast(error.message || 'Fehler beim Korrigieren', 'error');
    } finally {
        hideLoading();
        if (demoAttempts > 0) {
            elements.demoCheckBtn.disabled = false;
        }
    }
}

async function handleApiTest() {
    if (!currentUser || !authToken) {
        showToast('Bitte melden Sie sich an', 'error');
        return;
    }
    
    const text = elements.testText.value.trim();
    const language = elements.testLanguage.value;
    
    if (!text) {
        showToast('Bitte geben Sie einen Text ein', 'error');
        return;
    }
    
    showLoading();
    elements.testApiBtn.disabled = true;
    
    try {
        const result = await spellcheck(text, language, false);
        
        // Show results
        elements.testResult.textContent = result.corrected_text;
        elements.testTime.textContent = result.actual_processing_time;
        elements.testStatus.textContent = 'Erfolgreich';
        elements.testStatus.style.color = 'var(--success)';
        
        showElement(elements.testOutput);
        
        // Refresh user profile to update usage stats
        await loadUserProfile();
        
    } catch (error) {
        elements.testResult.textContent = 'Fehler: ' + error.message;
        elements.testTime.textContent = '-';
        elements.testStatus.textContent = 'Fehler';
        elements.testStatus.style.color = 'var(--error)';
        showElement(elements.testOutput);
        
        showToast(error.message || 'Fehler beim API-Test', 'error');
    } finally {
        hideLoading();
        elements.testApiBtn.disabled = false;
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('In Zwischenablage kopiert!', 'success');
        }).catch(() => {
            showToast('Kopieren fehlgeschlagen', 'error');
        });
    } else {
        // Fallback für ältere Browser
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('In Zwischenablage kopiert!', 'success');
        } catch (err) {
            showToast('Kopieren fehlgeschlagen', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Event Listeners
function setupEventListeners() {
    // Modal controls
    elements.loginBtn?.addEventListener('click', () => showElement(elements.loginModal));
    elements.registerBtn?.addEventListener('click', () => showElement(elements.registerModal));
    elements.loginModalClose?.addEventListener('click', () => hideElement(elements.loginModal));
    elements.registerModalClose?.addEventListener('click', () => hideElement(elements.registerModal));
    
    // Modal backdrop clicks
    elements.loginModal?.addEventListener('click', (e) => {
        if (e.target === elements.loginModal || e.target.classList.contains('modal-backdrop')) {
            hideElement(elements.loginModal);
        }
    });
    
    elements.registerModal?.addEventListener('click', (e) => {
        if (e.target === elements.registerModal || e.target.classList.contains('modal-backdrop')) {
            hideElement(elements.registerModal);
        }
    });
    
    // Form submissions
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    
    // Modal switching
    document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideElement(elements.loginModal);
        showElement(elements.registerModal);
    });
    
    document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideElement(elements.registerModal);
        showElement(elements.loginModal);
    });
    
    // User menu
    elements.userMenuBtn?.addEventListener('click', () => {
        elements.userDropdown?.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.userMenuBtn?.contains(e.target)) {
            elements.userDropdown?.classList.remove('show');
        }
    });
    
    // Logout
    elements.logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Navigation
    elements.tryDemoBtn?.addEventListener('click', () => scrollToSection('#demo'));
    elements.getStartedBtn?.addEventListener('click', () => {
        if (currentUser) {
            showDashboard();
        } else {
            showElement(elements.registerModal);
        }
    });
    
    // Demo functionality
    elements.demoCheckBtn?.addEventListener('click', handleDemoSpellcheck);
    
    // Dashboard navigation - Korrigierte Version
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.currentTarget.getAttribute('href');
            
            if (href === '#profile' || href === '#api-keys' || href === '#usage') {
                showDashboard();
            }
        });
    });
    
    // Zusätzlicher Event-Listener für "Jetzt starten" Button
    elements.getStartedBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (currentUser && authToken) {
            showDashboard();
        } else {
            showElement(elements.registerModal);
        }
    });
    // API key management
    elements.copyApiKey?.addEventListener('click', () => {
        if (currentUser?.api_key) {
            copyToClipboard(currentUser.api_key);
        }
    });
    
    elements.regenerateApiKey?.addEventListener('click', async () => {
        if (confirm('Möchten Sie wirklich einen neuen API Key generieren? Der alte wird ungültig.')) {
            try {
                showLoading();
                await regenerateApiKey();
            } catch (error) {
                showToast(error.message || 'Fehler beim Generieren des API Keys', 'error');
            } finally {
                hideLoading();
            }
        }
    });
    
    // API testing
    elements.testApiBtn?.addEventListener('click', handleApiTest);
    
    // Pricing buttons
    document.getElementById('pricing-free-btn')?.addEventListener('click', () => {
        if (currentUser && authToken) {
            showToast('Sie nutzen bereits den kostenlosen Plan', 'info');
        } else {
            showElement(elements.registerModal);
        }
    });
    
    document.getElementById('pricing-pro-btn')?.addEventListener('click', () => {
        if (!currentUser || !authToken) {
            showElement(elements.registerModal);
            showToast('Bitte registrieren Sie sich zuerst', 'info');
            return;
        }
        
        // Check if already professional
        if (currentUser.subscription_type === 'professional') {
            showToast('Sie haben bereits den Professional Plan', 'info');
            return;
        }
        
        // Weiterleitung zur Payment-Seite
        window.location.href = 'payment.html';
    });
    
    document.getElementById('pricing-enterprise-btn')?.addEventListener('click', () => {
        // Enterprise requires contact - show modal or toast
        showToast('Für Enterprise-Lösungen kontaktieren Sie uns bitte: support@rechtschreibe-api.de', 'info');
    });
    
    // Profile status badge click - link to pricing
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'profile-status') {
            // Close dashboard and scroll to pricing
            showMainContent();
            setTimeout(() => {
                scrollToSection('#pricing');
            }, 300);
        }
    });
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href === '#home') {
                e.preventDefault();
                showMainContent();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Active class will be set by updateActiveNavLink after scroll
            } else if (href.startsWith('#')) {
                // Smooth scroll to sections
                e.preventDefault();
                showMainContent();
                scrollToSection(href);
                // Active class will be set by updateActiveNavLink after scroll
            }
        });
    });
    
    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#register') {
                e.preventDefault();
                showElement(elements.registerModal);
            } else if (href === '#login') {
                e.preventDefault();
                showElement(elements.loginModal);
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals
        if (e.key === 'Escape') {
            hideElement(elements.loginModal);
            hideElement(elements.registerModal);
            elements.userDropdown?.classList.remove('show');
        }
    });
}

// Initialization
function init() {
    // Check for saved auth token
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        loadUserProfile().catch(() => {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            authToken = null;
        });
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup pricing buttons after a small delay to ensure DOM is ready
    setTimeout(() => {
        const pricingProBtn = document.getElementById('pricing-pro-btn');
        if (pricingProBtn) {
            console.log('Pricing Pro Button found, attaching listener');
        } else {
            console.warn('Pricing Pro Button NOT found!');
        }
    }, 100);
    
    // Initial UI update
    updateUI();
    
    // Update demo attempts display
    if (elements.demoAttempts) {
        elements.demoAttempts.textContent = demoAttempts;
    }
    
    // Set initial active nav link after a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        updateActiveNavLink();
    }, 100);
}

// Throttle function to limit how often a function can be called
function throttle(func, wait) {
    let timeout;
    let lastCall = 0;
    
    return function executedFunction(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        
        // If enough time has passed, call immediately
        if (timeSinceLastCall >= wait) {
            lastCall = now;
            func(...args);
        } else {
            // Otherwise, schedule for later
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                lastCall = Date.now();
                func(...args);
            }, wait - timeSinceLastCall);
        }
    };
}

// Enhanced smooth scrolling behavior
function enhanceScrolling() {
    // Throttled version of updateActiveNavLink (50ms for snappy response)
    const throttledUpdate = throttle(updateActiveNavLink, 50);
    
    // Add scroll-based navbar styling and active link update
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        }
        
        // Update active navigation link based on scroll position
        throttledUpdate();
    });
    
    // Also update on window resize
    window.addEventListener('resize', throttle(() => {
        updateActiveNavLink();
    }, 150));
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    // Don't update if dashboard is visible
    if (elements.dashboard && !elements.dashboard.classList.contains('hidden')) {
        return;
    }
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (sections.length === 0 || navLinks.length === 0) {
        return; // No sections or links found
    }
    
    // Get current scroll position
    const scrollPosition = window.scrollY;
    const navbarHeight = 80; // Height of fixed navbar
    
    let currentSection = 'home'; // Default to home
    
    // Check if we're at the very top of the page
    if (scrollPosition < 100) {
        currentSection = 'home';
    } else {
        // Find which section we're currently in
        // We check from bottom to top to handle overlapping sections correctly
        const sectionsArray = Array.from(sections);
        
        for (let i = sectionsArray.length - 1; i >= 0; i--) {
            const section = sectionsArray[i];
            const sectionTop = section.offsetTop - navbarHeight - 100; // Offset for better UX
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop) {
                currentSection = sectionId;
                break;
            }
        }
    }
    
    // Update active class on nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Error handling for API connectivity
function checkApiConnectivity() {
    fetch(`${API_BASE_URL}/health`)
        .then(response => response.json())
        .then(() => {})
        .catch(() => {});
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    init();
    enhanceScrolling();
    
    // Check API connectivity after a short delay
    setTimeout(checkApiConnectivity, 1000);
    
    // Initialize language selector for documentation
    initLanguageSelector();
});

// Language selector for documentation
function initLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const codeBlocks = document.querySelectorAll('.code-example-block');
    
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetLang = button.getAttribute('data-lang');
            
            // Update active button
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding code block
            codeBlocks.forEach(block => {
                if (block.getAttribute('data-lang') === targetLang) {
                    block.classList.add('active');
                } else {
                    block.classList.remove('active');
                }
            });
        });
    });
    
    // Initialize copy buttons
    const copyButtons = document.querySelectorAll('.copy-code-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            const codeBlock = document.querySelector(`.code-example-block[data-lang="${lang}"] .code-example code`);
            
            if (codeBlock) {
                const code = codeBlock.textContent;
                
                navigator.clipboard.writeText(code).then(() => {
                    // Change button text temporarily
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i> Kopiert!';
                    button.style.background = 'var(--success)';
                    button.style.borderColor = 'var(--success)';
                    button.style.color = 'white';
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.style.background = '';
                        button.style.borderColor = '';
                        button.style.color = '';
                    }, 2000);
                    
                    showToast('Code kopiert!', 'success');
                }).catch(err => {
                    console.error('Fehler beim Kopieren:', err);
                    showToast('Fehler beim Kopieren', 'error');
                });
            }
        });
    });
}

// Export functions for potential external use
window.RechtschreibeAPI = {
    login,
    register,
    spellcheck,
    showToast,
    currentUser: () => currentUser,
    authToken: () => authToken
};
