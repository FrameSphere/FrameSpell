// Dashboard New System - JavaScript (Production Version)

// State Management
let dashboardState = {
    currentPage: 'profile',
    selectedLanguage: 'de',
    userData: null
};

// Initialize Dashboard
function initializeDashboard() {
    setupDashboardEventListeners();
    
    if (currentUser && authToken) {
        loadDashboardData();
    }
}

// Setup Event Listeners
function setupDashboardEventListeners() {
    // Close button
    const closeBtn = document.getElementById('close-dashboard-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDashboardNew);
    }
    
    // Tab navigation
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const page = tab.dataset.page;
            switchToPage(page);
        });
    });
    
    // Language selection
    document.querySelectorAll('.language-card:not(.disabled)').forEach(card => {
        card.addEventListener('click', () => {
            selectLanguage(card.dataset.lang);
        });
    });
    
    // API Key actions
    const copyKeyBtn = document.getElementById('copy-api-key-btn');
    if (copyKeyBtn) {
        copyKeyBtn.addEventListener('click', copyApiKeyToClipboard);
    }
    
    const regenerateKeyBtn = document.getElementById('regenerate-api-key-btn');
    if (regenerateKeyBtn) {
        regenerateKeyBtn.addEventListener('click', regenerateApiKeyAction);
    }
    
    // Quick actions
    const testApiQuickBtn = document.getElementById('test-api-quick-btn');
    if (testApiQuickBtn) {
        testApiQuickBtn.addEventListener('click', () => switchToPage('usage'));
    }
    
    // Usage tester
    const usageTestBtn = document.getElementById('usage-test-btn');
    if (usageTestBtn) {
        usageTestBtn.addEventListener('click', runUsageTest);
    }
}

// ── Open Dashboard ────────────────────────────────────────────────────────────
// Race-condition fix: authToken = source of truth.
// currentUser may still be loading (async) – wait if needed.
async function openDashboardNew() {
    const storedToken = localStorage.getItem('authToken');
    
    // No token at all → not logged in
    if (!storedToken && !authToken) {
        showToast('Bitte melden Sie sich zuerst an', 'error');
        showElement(elements.loginModal);
        return;
    }
    
    // Ensure module-level authToken is set from localStorage
    if (!authToken && storedToken) {
        authToken = storedToken;
    }
    
    // If currentUser is not loaded yet, load it now
    if (!currentUser) {
        try {
            await loadUserProfile();
        } catch (err) {
            console.error('Dashboard auth check failed:', err);
            showToast('Anmeldung fehlgeschlagen – bitte erneut anmelden', 'error');
            showElement(elements.loginModal);
            return;
        }
    }
    
    // Final check after loading
    if (!currentUser || !authToken) {
        showToast('Bitte melden Sie sich zuerst an', 'error');
        showElement(elements.loginModal);
        return;
    }
    
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const mainContent = document.querySelector('.main-content');
    
    if (dashboardWrapper && mainContent) {
        mainContent.style.display = 'none';
        dashboardWrapper.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadDashboardData();
        
        // Fallback-Poll (30s) für Usage-Updates, primär via /spellcheck-Antworten
        if (typeof startUsagePolling === 'function') startUsagePolling();
    }
}

// Close Dashboard
function closeDashboardNew() {
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const mainContent = document.querySelector('.main-content');
    
    if (dashboardWrapper && mainContent) {
        dashboardWrapper.classList.remove('active');
        mainContent.style.display = 'block';
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (typeof stopUsagePolling === 'function') stopUsagePolling();
    }
}

// Switch Page
function switchToPage(pageName) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageName) {
            tab.classList.add('active');
        }
    });
    
    document.querySelectorAll('.dashboard-page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        dashboardState.currentPage = pageName;
        loadPageData(pageName);
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    if (!currentUser) {
        await loadUserProfile();
    }
    
    if (currentUser) {
        updateDashboardUI();
    }
}

// Load Page Data
function loadPageData(pageName) {
    switch(pageName) {
        case 'profile':
            loadProfileData();
            break;
        case 'api-keys':
            loadApiKeysData();
            break;
        case 'usage':
            loadUsageData();
            break;
    }
}

// Update Dashboard UI
function updateDashboardUI() {
    if (!currentUser) return;
    
    const userEmailEl = document.getElementById('dashboard-user-email');
    if (userEmailEl) {
        userEmailEl.textContent = currentUser.email;
    }
    
    loadProfileData();
    loadApiKeysData();
    loadUsageData();
}

// ── Helper: get rate limit for subscription type ───────────────────────────────
function getRateLimitForPlan(subscriptionType) {
    // Single source of truth: use PRICING_CONFIG if available, else fallback
    if (window.PRICING_CONFIG) {
        const plan = window.PRICING_CONFIG.getPlan(subscriptionType);
        const limit = plan.requestsPerMinute;
        return limit === Infinity ? 999999 : limit;
    }
    const limits = { free: 20, professional: 100, enterprise: 999999 };
    return limits[subscriptionType] || 20;
}

// Load Profile Data
function loadProfileData() {
    if (!currentUser) return;
    
    const profileEmail   = document.getElementById('profile-email');
    const profileStatus  = document.getElementById('profile-status');
    const profileJoined  = document.getElementById('profile-joined');
    const profileUserId  = document.getElementById('profile-user-id');
    
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileStatus) {
        const names = { free: 'Kostenlos', professional: 'Professional', enterprise: 'Enterprise' };
        profileStatus.textContent = names[currentUser.subscription_type] || 'Kostenlos';
        profileStatus.className = 'status-badge clickable ' + (currentUser.subscription_type !== 'free' ? 'premium' : 'free');
        profileStatus.style.cursor = 'pointer';
        profileStatus.title = 'Klicken Sie hier, um Ihr Abo zu upgraden';
    }
    if (profileJoined) {
        profileJoined.textContent = currentUser.created_at
            ? new Date(currentUser.created_at).toLocaleDateString('de-DE')
            : '-';
    }
    if (profileUserId) profileUserId.textContent = currentUser.id || '-';
    
    const totalRequests  = document.getElementById('profile-total-requests');
    const requestsToday  = document.getElementById('profile-requests-today');
    const totalCost      = document.getElementById('profile-total-cost');
    
    if (totalRequests) totalRequests.textContent = currentUser.total_requests || '0';
    if (requestsToday) requestsToday.textContent = currentUser.tokens_used_today || '0';
    if (totalCost) {
        const cost = Math.max(0, (currentUser.total_requests || 0) - 20) * 0.009;
        totalCost.textContent = `€${cost.toFixed(2)}`;
    }
}

// Load API Keys Data
function loadApiKeysData() {
    if (!currentUser) return;
    
    const currentApiKey = document.getElementById('current-api-key');
    if (currentApiKey && currentUser.api_key) {
        currentApiKey.value = currentUser.api_key;
    }
    
    // Update limits display based on plan
    const rateLimit = getRateLimitForPlan(currentUser.subscription_type);
    const limitValueEl = document.querySelector('.limit-value');
    if (limitValueEl && rateLimit !== 999999) {
        limitValueEl.textContent = rateLimit;
    }
}

// Usage-UI direkt aus rate_limit-Objekt aktualisieren (kein /me nötig)
function loadUsageDataFromRateLimit(rateLimit) {
    if (!rateLimit) return;
    
    const used      = rateLimit.used      || 0;
    const remaining = rateLimit.remaining || 0;
    const limit     = rateLimit.limit     || 20;
    const pct       = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    
    const usageTodayCount      = document.getElementById('usage-today-count');
    const usageRemainingCount  = document.getElementById('usage-remaining-count');
    const usagePercentage      = document.getElementById('usage-percentage');
    const usageProgressFill    = document.getElementById('usage-progress-fill');
    const profileRequestsToday = document.getElementById('profile-requests-today');
    
    if (usageTodayCount)      usageTodayCount.textContent      = used;
    if (usageRemainingCount)  usageRemainingCount.textContent  = remaining;
    if (usagePercentage)      usagePercentage.textContent      = `${pct.toFixed(0)}%`;
    if (usageProgressFill)    usageProgressFill.style.width    = `${pct}%`;
    if (profileRequestsToday) profileRequestsToday.textContent = used;
    
    if (rateLimit.resetAt && rateLimit.resetAt > Date.now() && used >= limit) {
        const secLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
        const progressNote = document.getElementById('progress-note-text');
        if (progressNote) progressNote.textContent = `Limit erreicht – Reset in ${secLeft}s`;
    }
}

// Load Usage Data
function loadUsageData() {
    if (!currentUser) return;
    
    const tokensUsedToday = currentUser.tokens_used_today || 0;
    const rateLimit       = getRateLimitForPlan(currentUser.subscription_type);
    const remaining       = Math.max(0, rateLimit - tokensUsedToday);
    const pct             = rateLimit > 0 ? (tokensUsedToday / rateLimit) * 100 : 0;
    
    const usageTodayCount     = document.getElementById('usage-today-count');
    const usageRemainingCount = document.getElementById('usage-remaining-count');
    const usageTodayCost      = document.getElementById('usage-today-cost');
    const usagePercentage     = document.getElementById('usage-percentage');
    const usageProgressFill   = document.getElementById('usage-progress-fill');
    
    if (usageTodayCount)     usageTodayCount.textContent     = tokensUsedToday;
    if (usageRemainingCount) usageRemainingCount.textContent = remaining;
    if (usageTodayCost)      usageTodayCost.textContent      = '€0.00';
    if (usagePercentage)     usagePercentage.textContent     = `${Math.min(pct, 100).toFixed(0)}%`;
    if (usageProgressFill)   usageProgressFill.style.width   = `${Math.min(pct, 100)}%`;
    
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
    
    const totalRequests   = currentUser.total_requests || 0;
    const freeRequests    = Math.min(totalRequests, 20);
    const paidRequests    = Math.max(0, totalRequests - 20);
    
    const monthTotalEl  = document.getElementById('month-total-requests');
    const monthFreeEl   = document.getElementById('month-free-requests');
    const monthPaidEl   = document.getElementById('month-paid-requests');
    const monthCostEl   = document.getElementById('month-total-cost');
    
    if (monthTotalEl) monthTotalEl.textContent = totalRequests;
    if (monthFreeEl)  monthFreeEl.textContent  = freeRequests;
    if (monthPaidEl)  monthPaidEl.textContent  = paidRequests;
    if (monthCostEl)  monthCostEl.textContent  = '€0.00';
}

// Select Language
function selectLanguage(lang) {
    dashboardState.selectedLanguage = lang;
    
    document.querySelectorAll('.language-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.lang === lang) {
            card.classList.add('active');
        }
    });
    
    const selectedLanguageName = document.getElementById('selected-language-name');
    const languageNames = { de: 'Deutsch', en: 'Englisch', es: 'Spanisch', fr: 'Französisch' };
    if (selectedLanguageName) {
        selectedLanguageName.textContent = languageNames[lang] || lang;
    }
}

// Copy API Key to Clipboard
function copyApiKeyToClipboard() {
    const apiKeyInput = document.getElementById('current-api-key');
    if (!apiKeyInput || !apiKeyInput.value) {
        showToast('Kein API Key vorhanden', 'error');
        return;
    }
    
    navigator.clipboard.writeText(apiKeyInput.value).then(() => {
        showToast('API Key in Zwischenablage kopiert!', 'success');
    }).catch(() => {
        showToast('Kopieren fehlgeschlagen', 'error');
    });
}

// Regenerate API Key Action
async function regenerateApiKeyAction() {
    if (!confirm('Möchten Sie wirklich einen neuen API Key generieren? Der alte wird ungültig.')) {
        return;
    }
    
    try {
        showLoading();
        await regenerateApiKey();
        loadApiKeysData();
    } catch (error) {
        showToast(error.message || 'Fehler beim Regenerieren', 'error');
    } finally {
        hideLoading();
    }
}

// Run Usage Test
async function runUsageTest() {
    const testText     = document.getElementById('usage-test-text');
    const testLanguage = document.getElementById('usage-test-language');
    const testOutput   = document.getElementById('usage-test-output');
    const testResult   = document.getElementById('usage-test-result');
    const testTime     = document.getElementById('usage-test-time');
    const testStatus   = document.getElementById('usage-test-status');
    
    if (!testText || !testText.value.trim()) {
        showToast('Bitte geben Sie einen Text ein', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const result = await spellcheck(testText.value.trim(), testLanguage?.value || 'de', false);
        
        if (testResult) testResult.textContent = result.corrected_text;
        if (testTime)   testTime.textContent   = result.actual_processing_time;
        if (testStatus) { testStatus.textContent = 'Erfolgreich'; testStatus.className = 'success'; }
        if (testOutput) testOutput.classList.remove('hidden');
        
        // Usage direkt aus Spellcheck-Antwort aktualisieren
        if (result.rate_limit) {
            if (typeof updateUsageFromRateLimit === 'function') updateUsageFromRateLimit(result.rate_limit);
            loadUsageDataFromRateLimit(result.rate_limit);
        }
        
        showToast('Test erfolgreich!', 'success');
        
    } catch (error) {
        if (testResult) testResult.textContent = 'Fehler: ' + error.message;
        if (testStatus) { testStatus.textContent = 'Fehler'; testStatus.className = 'error'; }
        if (testOutput) testOutput.classList.remove('hidden');
        showToast(error.message || 'Test fehlgeschlagen', 'error');
    } finally {
        hideLoading();
    }
}

// Integrate with main app
function integrateNewDashboard() {
    window.showDashboard = openDashboardNew;
    
    document.querySelectorAll('.dropdown-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href === '#profile' || href === '#api-keys' || href === '#usage') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                openDashboardNew().then(() => {
                    if (href === '#profile')   switchToPage('profile');
                    else if (href === '#api-keys') switchToPage('api-keys');
                    else if (href === '#usage')    switchToPage('usage');
                });
            });
        }
    });
    
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        // Remove existing listeners by cloning
        const newBtn = getStartedBtn.cloneNode(true);
        getStartedBtn.parentNode.replaceChild(newBtn, getStartedBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            if (currentUser || token) {
                openDashboardNew();
            } else {
                showElement(elements.registerModal);
            }
        });
    }
}

// Settings Management
function initSettingsHandlers() {
    const allowPaidCheckbox         = document.getElementById('allow-paid-requests');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    const saveSettingsBtn           = document.getElementById('save-settings-btn');

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        if (allowPaidCheckbox)          allowPaidCheckbox.checked          = settings.allowPaidRequests !== false;
        if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = settings.emailNotifications !== false;
    }

    async function saveSettings() {
        const settings = {
            allowPaidRequests:    allowPaidCheckbox?.checked,
            emailNotifications:   emailNotificationsCheckbox?.checked,
        };
        localStorage.setItem('userSettings', JSON.stringify(settings));
        showToast('Einstellungen gespeichert!', 'success');
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    loadSettings();
}

// Plan Display (uses PRICING_CONFIG when available)
function updatePlanDisplay() {
    if (!currentUser) return;
    
    const subType  = currentUser.subscription_type || 'free';
    const names    = { free: 'Kostenlos', professional: 'Professional', enterprise: 'Enterprise' };
    const planName = names[subType] || 'Kostenlos';
    
    const currentPlanName = document.getElementById('current-plan-name');
    if (currentPlanName) currentPlanName.textContent = planName;
    
    const upgradeToProBtn    = document.getElementById('upgrade-to-pro-btn');
    const downgradeToFreeBtn = document.getElementById('downgrade-to-free-btn');
    
    if (upgradeToProBtn)    upgradeToProBtn.style.display    = subType === 'professional' ? 'none'  : 'block';
    if (downgradeToFreeBtn) downgradeToFreeBtn.style.display = subType !== 'free'        ? 'block' : 'none';
    
    const billingInfo = document.getElementById('billing-info');
    if (billingInfo) {
        billingInfo.style.display = subType !== 'free' ? 'flex' : 'none';
        const nextBilling     = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        const nextBillingDate = document.getElementById('next-billing-date');
        if (nextBillingDate) {
            nextBillingDate.textContent = nextBilling.toLocaleDateString('de-DE', {
                day: '2-digit', month: 'long', year: 'numeric',
            });
        }
    }
}

// Event Handlers for Plan Buttons
document.getElementById('upgrade-to-pro-btn')?.addEventListener('click', () => {
    window.location.href = 'payment.html';
});

document.getElementById('contact-enterprise-btn')?.addEventListener('click', () => {
    showToast('Enterprise-Kontakt: support@framespell.de', 'info');
});

document.getElementById('downgrade-to-free-btn')?.addEventListener('click', async () => {
    if (!confirm('Möchten Sie wirklich auf den kostenlosen Plan zurückkehren?')) return;
    showToast('Downgrade geplant. Änderung wird am Ende des Abrechnungszeitraums aktiv.', 'success');
});

// Hook updateUI to also update plan display
const originalUpdateUI_dash = typeof updateUI !== 'undefined' ? updateUI : null;
updateUI = function() {
    if (typeof originalUpdateUI_dash === 'function') originalUpdateUI_dash();
    try { updatePlanDisplay(); } catch (_) {}
};

// Initialize when dashboard is shown
document.addEventListener('DOMContentLoaded', () => {
    initSettingsHandlers();
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeDashboard();
        integrateNewDashboard();
    }, 500);
});

// Export
window.openDashboardNew   = openDashboardNew;
window.closeDashboardNew  = closeDashboardNew;
window.switchToPage       = switchToPage;
