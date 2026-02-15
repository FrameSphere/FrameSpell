// OAuth & Dashboard Integration - Consolidated Version
(function() {
    console.log('OAuth module loaded');
    
    // ===========================================
    // OAUTH HANDLERS
    // ===========================================
    
    // GitHub OAuth
    const githubLoginBtn = document.getElementById('oauth-github-login');
    const githubRegisterBtn = document.getElementById('oauth-github-register');
    
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => handleOAuthLogin('github'));
    }
    if (githubRegisterBtn) {
        githubRegisterBtn.addEventListener('click', () => handleOAuthRegister('github'));
    }
    
    // Google OAuth
    const googleLoginBtn = document.getElementById('oauth-google-login');
    const googleRegisterBtn = document.getElementById('oauth-google-register');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleOAuthLogin('google'));
    }
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', () => handleOAuthRegister('google'));
    }
    
    // FrameSphere OAuth
    const framesphereLoginBtn = document.getElementById('oauth-framesphere-login');
    const framesphereRegisterBtn = document.getElementById('oauth-framesphere-register');
    
    if (framesphereLoginBtn) {
        framesphereLoginBtn.addEventListener('click', () => handleOAuthLogin('framesphere'));
    }
    if (framesphereRegisterBtn) {
        framesphereRegisterBtn.addEventListener('click', () => handleOAuthRegister('framesphere'));
    }
    
    // OAuth Login Handler
    async function handleOAuthLogin(provider) {
        if (typeof showLoading === 'function') showLoading();
        
        try {
            if (provider === 'framesphere') {
                if (typeof showToast === 'function') {
                    showToast('FrameSphere OAuth wird bald verfügbar sein!', 'info');
                }
                if (typeof hideLoading === 'function') hideLoading();
                return;
            }
            
            // Redirect to OAuth endpoint
            const redirectUrl = `${window.API_CONFIG.BASE_URL}/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth-callback.html')}`;
            window.location.href = redirectUrl;
            
        } catch (error) {
            console.error('OAuth error:', error);
            if (typeof showToast === 'function') {
                showToast(`${provider} Anmeldung fehlgeschlagen`, 'error');
            }
            if (typeof hideLoading === 'function') hideLoading();
        }
    }
    
    // OAuth Register Handler (same as login for OAuth)
    function handleOAuthRegister(provider) {
        handleOAuthLogin(provider);
    }
    
    // ===========================================
    // USER-SPECIFIC SETTINGS STORAGE
    // ===========================================
    
    window.loadUserSettings = function() {
        if (!window.currentUser) return {};
        const settingsKey = `userSettings_${window.currentUser.id}`;
        return JSON.parse(localStorage.getItem(settingsKey) || '{}');
    };
    
    window.saveUserSettings = function(settings) {
        if (!window.currentUser) {
            console.error('No current user for settings');
            return;
        }
        const settingsKey = `userSettings_${window.currentUser.id}`;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    };
    
    // Setup settings save button
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const saveSettingsBtn = document.getElementById('save-settings-btn');
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', () => {
                    if (!window.currentUser) {
                        if (typeof showToast === 'function') {
                            showToast('Bitte melden Sie sich an', 'error');
                        }
                        return;
                    }
                    
                    const settings = {
                        allowPaidRequests: document.getElementById('allow-paid-requests')?.checked,
                        emailNotifications: document.getElementById('email-notifications')?.checked,
                        autoUpgrade: document.getElementById('auto-upgrade')?.checked
                    };
                    
                    window.saveUserSettings(settings);
                    if (typeof showToast === 'function') {
                        showToast('Einstellungen gespeichert!', 'success');
                    }
                });
            }
        }, 1000);
    });
    
    // ===========================================
    // OAUTH CALLBACK HANDLER
    // ===========================================
    
    window.handleOAuthCallback = function(token, userData) {
        console.log('OAuth Callback received:', { token: token.substring(0, 20) + '...', userData });
        
        // Setze authToken und currentUser
        window.authToken = token;
        window.currentUser = userData;
        localStorage.setItem('authToken', token);
        
        // Force-setze auch global
        try {
            eval('authToken = "' + token.replace(/"/g, '\\"') + '";');
            eval('currentUser = ' + JSON.stringify(userData) + ';');
        } catch (e) {
            console.log('Using window scope only');
        }
        
        // Close alle Modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Update UI
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        // Load user-specific settings
        const settings = window.loadUserSettings();
        const allowPaidCheckbox = document.getElementById('allow-paid-requests');
        const emailNotificationsCheckbox = document.getElementById('email-notifications');
        const autoUpgradeCheckbox = document.getElementById('auto-upgrade');
        
        if (allowPaidCheckbox) allowPaidCheckbox.checked = settings.allowPaidRequests !== false;
        if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = settings.emailNotifications !== false;
        if (autoUpgradeCheckbox) autoUpgradeCheckbox.checked = settings.autoUpgrade === true;
        
        // Open dashboard using the same method as normal login
        setTimeout(() => {
            if (typeof showDashboard === 'function') {
                showDashboard();
            } else if (typeof openDashboardNew === 'function') {
                openDashboardNew();
            } else {
                console.error('No dashboard function found');
            }
            
            if (typeof showToast === 'function') {
                showToast('Erfolgreich angemeldet!', 'success');
            }
        }, 300);
    };
    
    // ===========================================
    // OAUTH CALLBACK DETECTION
    // ===========================================
    
    function checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('oauth_token')) {
            const token = urlParams.get('oauth_token');
            const userDataStr = urlParams.get('user_data');
            
            if (token && userDataStr) {
                try {
                    const userData = JSON.parse(decodeURIComponent(userDataStr));
                    
                    console.log('OAuth detected, processing...');
                    
                    // Save immediately
                    window.authToken = token;
                    window.currentUser = userData;
                    localStorage.setItem('authToken', token);
                    
                    // Clean URL immediately
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // Wait for page to be fully loaded
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            setTimeout(() => window.handleOAuthCallback(token, userData), 800);
                        });
                    } else {
                        setTimeout(() => window.handleOAuthCallback(token, userData), 800);
                    }
                } catch (error) {
                    console.error('OAuth callback error:', error);
                    if (typeof showToast === 'function') {
                        showToast('OAuth Fehler: ' + error.message, 'error');
                    }
                }
            }
        }
    }
    
    // Check on load
    checkOAuthCallback();
    
    // Also check after DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkOAuthCallback);
    }
    
    console.log('OAuth module initialized');
})();
