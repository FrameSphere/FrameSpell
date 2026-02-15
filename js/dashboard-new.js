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

// Open Dashboard
function openDashboardNew() {
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
        
        // Start auto-refresh (every 5 seconds)
        if (window.dashboardRefreshInterval) {
            clearInterval(window.dashboardRefreshInterval);
        }
        
        window.dashboardRefreshInterval = setInterval(() => {
            if (currentUser && authToken) {
                loadUserProfile().then(() => {
                    updateDashboardUI();
                }).catch(err => {
                    console.error('Error refreshing dashboard:', err);
                });
            }
        }, 5000);
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
        
        // Stop auto-refresh
        if (window.dashboardRefreshInterval) {
            clearInterval(window.dashboardRefreshInterval);
            window.dashboardRefreshInterval = null;
        }
    }
}

// Switch Page
function switchToPage(pageName) {
    // Update tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageName) {
            tab.classList.add('active');
        }
    });
    
    // Update pages
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

// Load Profile Data
function loadProfileData() {
    if (!currentUser) return;
    
    // Personal Information
    const profileEmail = document.getElementById('profile-email');
    const profileStatus = document.getElementById('profile-status');
    const profileJoined = document.getElementById('profile-joined');
    const profileUserId = document.getElementById('profile-user-id');
    
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileStatus) {
        // Map subscription types to display names
        const subscriptionNames = {
            'free': 'Kostenlos',
            'professional': 'Professional',
            'enterprise': 'Enterprise'
        };
        const displayName = subscriptionNames[currentUser.subscription_type] || 'Kostenlos';
        profileStatus.textContent = displayName;
        profileStatus.className = 'status-badge clickable ' + (currentUser.subscription_type !== 'free' ? 'premium' : 'free');
        profileStatus.style.cursor = 'pointer';
        profileStatus.title = 'Klicken Sie hier, um Ihr Abo zu upgraden';
    }
    if (profileJoined) {
        const joinDate = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('de-DE') : '-';
        profileJoined.textContent = joinDate;
    }
    if (profileUserId) profileUserId.textContent = currentUser.id || '-';
    
    // Statistics
    const totalRequests = document.getElementById('profile-total-requests');
    const requestsToday = document.getElementById('profile-requests-today');
    const totalCost = document.getElementById('profile-total-cost');
    
    if (totalRequests) totalRequests.textContent = currentUser.total_requests || '0';
    if (requestsToday) requestsToday.textContent = currentUser.tokens_used_today || '0';
    
    if (totalCost) {
        const cost = Math.max(0, (currentUser.total_requests || 0) - (currentUser.tokens_used_today || 0)) * 0.009;
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
}

// Load Usage Data
function loadUsageData() {
    if (!currentUser) return;
    
    const usageTodayCount = document.getElementById('usage-today-count');
    const usageRemainingCount = document.getElementById('usage-remaining-count');
    const usageTodayCost = document.getElementById('usage-today-cost');
    const usagePercentage = document.getElementById('usage-percentage');
    const usageProgressFill = document.getElementById('usage-progress-fill');
    
    const tokensUsedToday = currentUser.tokens_used_today || 0;
    
    // Calculate limit based on subscription
    let rateLimit = 20;
    let costPerToken = 0.009;
    
    if (currentUser.subscription_type === 'professional') {
        rateLimit = 100;
        costPerToken = 0.005;
    } else if (currentUser.subscription_type === 'enterprise') {
        rateLimit = 999999;
        costPerToken = 0;
    }
    
    const remaining = Math.max(0, rateLimit - tokensUsedToday);
    const cost = Math.max(0, tokensUsedToday - rateLimit) * costPerToken;
    const percentage = (tokensUsedToday / rateLimit) * 100;
    
    if (usageTodayCount) usageTodayCount.textContent = tokensUsedToday;
    if (usageRemainingCount) usageRemainingCount.textContent = remaining;
    if (usageTodayCost) usageTodayCost.textContent = `€${cost.toFixed(2)}`;
    if (usagePercentage) usagePercentage.textContent = `${Math.min(percentage, 100).toFixed(0)}%`;
    if (usageProgressFill) usageProgressFill.style.width = `${Math.min(percentage, 100)}%`;
    
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
    
    // Month statistics (simplified - should be fetched from backend)
    const monthTotalRequests = document.getElementById('month-total-requests');
    const monthFreeRequests = document.getElementById('month-free-requests');
    const monthPaidRequests = document.getElementById('month-paid-requests');
    const monthTotalCost = document.getElementById('month-total-cost');
    
    const totalRequests = currentUser.total_requests || 0;
    const freeRequests = Math.min(totalRequests, rateLimit);
    const paidRequests = Math.max(0, totalRequests - rateLimit);
    const monthCost = paidRequests * costPerToken;
    
    if (monthTotalRequests) monthTotalRequests.textContent = totalRequests;
    if (monthFreeRequests) monthFreeRequests.textContent = freeRequests;
    if (monthPaidRequests) monthPaidRequests.textContent = paidRequests;
    if (monthTotalCost) monthTotalCost.textContent = `€${monthCost.toFixed(2)}`;
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
    const languageNames = {
        'de': 'Deutsch',
        'en': 'Englisch',
        'es': 'Spanisch',
        'fr': 'Französisch'
    };
    
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
    
    apiKeyInput.select();
    apiKeyInput.setSelectionRange(0, 99999);
    
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
        showToast('API Key erfolgreich regeneriert!', 'success');
    } catch (error) {
        showToast(error.message || 'Fehler beim Regenerieren', 'error');
    } finally {
        hideLoading();
    }
}

// Run Usage Test
async function runUsageTest() {
    const testText = document.getElementById('usage-test-text');
    const testLanguage = document.getElementById('usage-test-language');
    const testOutput = document.getElementById('usage-test-output');
    const testResult = document.getElementById('usage-test-result');
    const testTime = document.getElementById('usage-test-time');
    const testStatus = document.getElementById('usage-test-status');
    
    if (!testText || !testText.value.trim()) {
        showToast('Bitte geben Sie einen Text ein', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const result = await spellcheck(testText.value.trim(), testLanguage.value, false);
        
        if (testResult) testResult.textContent = result.corrected_text;
        if (testTime) testTime.textContent = result.actual_processing_time;
        if (testStatus) {
            testStatus.textContent = 'Erfolgreich';
            testStatus.className = 'success';
        }
        
        if (testOutput) {
            testOutput.classList.remove('hidden');
        }
        
        await loadUserProfile();
        loadUsageData();
        
        showToast('Test erfolgreich!', 'success');
        
    } catch (error) {
        if (testResult) testResult.textContent = 'Fehler: ' + error.message;
        if (testStatus) {
            testStatus.textContent = 'Fehler';
            testStatus.className = 'error';
        }
        if (testOutput) {
            testOutput.classList.remove('hidden');
        }
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
                openDashboardNew();
                
                if (href === '#profile') switchToPage('profile');
                else if (href === '#api-keys') switchToPage('api-keys');
                else if (href === '#usage') switchToPage('usage');
            });
        }
    });
    
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser && authToken) {
                openDashboardNew();
            } else {
                showElement(elements.registerModal);
            }
        });
    }
}

// Settings Management
function initSettingsHandlers() {
    const allowPaidCheckbox = document.getElementById('allow-paid-requests');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    const autoUpgradeCheckbox = document.getElementById('auto-upgrade');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Load saved settings
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        if (allowPaidCheckbox) allowPaidCheckbox.checked = settings.allowPaidRequests !== false;
        if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = settings.emailNotifications !== false;
        if (autoUpgradeCheckbox) autoUpgradeCheckbox.checked = settings.autoUpgrade === true;
    }

    // Save settings
    async function saveSettings() {
        const settings = {
            allowPaidRequests: allowPaidCheckbox?.checked,
            emailNotifications: emailNotificationsCheckbox?.checked,
            autoUpgrade: autoUpgradeCheckbox?.checked
        };

        // Save to localStorage (später: Backend API Call)
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // TODO: API Call zum Backend
        // await apiRequest('/settings', {
        //     method: 'PUT',
        //     body: JSON.stringify(settings)
        // });

        showToast('Einstellungen gespeichert!', 'success');
    }

    // Event Listeners
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Auto-save on toggle change
    [allowPaidCheckbox, emailNotificationsCheckbox, autoUpgradeCheckbox].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                // Visual feedback
                const settingItem = checkbox.closest('.setting-item');
                settingItem.style.background = 'rgba(99, 102, 241, 0.1)';
                setTimeout(() => {
                    settingItem.style.background = '';
                }, 300);
            });
        }
    });

    // Load settings on init
    loadSettings();
}

// Plan Management Functions
function updatePlanDisplay() {
    if (!currentUser) return;
    
    const subscriptionType = currentUser.subscription_type || 'free';
    const planName = {
        'free': 'Kostenlos',
        'professional': 'Professional',
        'enterprise': 'Enterprise'
    }[subscriptionType] || 'Kostenlos';
    
    // Update current plan badge
    const currentPlanName = document.getElementById('current-plan-name');
    if (currentPlanName) currentPlanName.textContent = planName;
    
    // Show/hide plan badges and buttons
    document.getElementById('free-current-badge')?.style.setProperty('display', subscriptionType === 'free' ? 'flex' : 'none');
    document.getElementById('pro-current-badge')?.style.setProperty('display', subscriptionType === 'professional' ? 'flex' : 'none');
    document.getElementById('enterprise-current-badge')?.style.setProperty('display', subscriptionType === 'enterprise' ? 'flex' : 'none');
    
    // Show/hide upgrade/downgrade buttons
    const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
    const downgradeToFreeBtn = document.getElementById('downgrade-to-free-btn');
    
    if (upgradeToProBtn) {
        upgradeToProBtn.style.display = subscriptionType === 'professional' ? 'none' : 'block';
    }
    
    if (downgradeToFreeBtn) {
        downgradeToFreeBtn.style.display = subscriptionType !== 'free' ? 'block' : 'none';
    }
    
    // Show billing info for paid plans
    const billingInfo = document.getElementById('billing-info');
    if (billingInfo) {
        billingInfo.style.display = subscriptionType !== 'free' ? 'flex' : 'none';
        
        // Calculate next billing date (30 days from now)
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        const nextBillingDate = document.getElementById('next-billing-date');
        if (nextBillingDate) {
            nextBillingDate.textContent = nextBilling.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
    }
}

// Event Handlers
document.getElementById('upgrade-to-pro-btn')?.addEventListener('click', () => {
    // Redirect to payment page
    window.location.href = 'payment.html';
});

document.getElementById('contact-enterprise-btn')?.addEventListener('click', () => {
    showToast('Enterprise-Kontakt: support@framespell.de', 'info');
    // Optional: Open modal with contact form
});

document.getElementById('downgrade-to-free-btn')?.addEventListener('click', async () => {
    if (!confirm('Möchten Sie wirklich auf den kostenlosen Plan zurückkehren? Ihre Professional-Vorteile gehen am Ende des Abrechnungszeitraums verloren.')) {
        return;
    }
    
    try {
        showLoading();
        
        // API Call zum Downgrade (Backend muss noch implementiert werden)
        // const response = await apiRequest('/downgrade', {
        //     method: 'POST',
        //     body: JSON.stringify({ plan: 'free' })
        // });
        
        // Temporär: Lokale Aktualisierung
        showToast('Downgrade geplant. Ihre Änderung wird am Ende des Abrechnungszeitraums aktiv.', 'success');
        
        // TODO: Backend implementieren für echtes Downgrade
        
    } catch (error) {
        showToast(error.message || 'Fehler beim Downgrade', 'error');
    } finally {
        hideLoading();
    }
});

// Update plan display when user data changes
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    updatePlanDisplay();
};

// Initialize when dashboard is shown
document.addEventListener('DOMContentLoaded', () => {
    initSettingsHandlers();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeDashboard();
        integrateNewDashboard();
    }, 500);
});

// Export functions
window.openDashboardNew = openDashboardNew;
window.closeDashboardNew = closeDashboardNew;
window.switchToPage = switchToPage;
