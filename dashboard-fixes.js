// Dashboard Fixes for OAuth and Settings
(function() {
    // Fix 1: Export initDashboard function for OAuth callback
    window.initDashboard = function() {
        console.log('Re-initializing dashboard...');
        
        // Re-setup event listeners if function exists
        if (typeof setupDashboardEventListeners === 'function') {
            setupDashboardEventListeners();
        }
    };
    
    // Fix 2: Export loadDashboardData for OAuth callback  
    window.loadDashboardData = function() {
        console.log('Loading dashboard data...');
        
        // Call updateDashboardUI if it exists
        if (typeof updateDashboardUI === 'function') {
            updateDashboardUI();
        }
        
        // Load user-specific settings
        if (currentUser) {
            const settings = window.loadUserSettings();
            
            const allowPaidCheckbox = document.getElementById('allow-paid-requests');
            const emailNotificationsCheckbox = document.getElementById('email-notifications');
            const autoUpgradeCheckbox = document.getElementById('auto-upgrade');
            
            if (allowPaidCheckbox) allowPaidCheckbox.checked = settings.allowPaidRequests !== false;
            if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = settings.emailNotifications !== false;
            if (autoUpgradeCheckbox) autoUpgradeCheckbox.checked = settings.autoUpgrade === true;
        }
    };
    
    // Fix 3: User-specific settings storage
    window.loadUserSettings = function() {
        if (!currentUser) return {};
        
        const settingsKey = `userSettings_${currentUser.id}`;
        return JSON.parse(localStorage.getItem(settingsKey) || '{}');
    };
    
    window.saveUserSettings = function(settings) {
        if (!currentUser) {
            console.error('No current user');
            return;
        }
        
        const settingsKey = `userSettings_${currentUser.id}`;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    };
    
    // Fix 4: Override settings handlers to use user-specific storage
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const saveSettingsBtn = document.getElementById('save-settings-btn');
            
            if (saveSettingsBtn) {
                // Remove old listeners by cloning
                const newSaveBtn = saveSettingsBtn.cloneNode(true);
                saveSettingsBtn.parentNode.replaceChild(newSaveBtn, saveSettingsBtn);
                
                // Add new user-specific listener
                newSaveBtn.addEventListener('click', () => {
                    if (!currentUser) {
                        showToast('Bitte melden Sie sich an', 'error');
                        return;
                    }
                    
                    const settings = {
                        allowPaidRequests: document.getElementById('allow-paid-requests')?.checked,
                        emailNotifications: document.getElementById('email-notifications')?.checked,
                        autoUpgrade: document.getElementById('auto-upgrade')?.checked
                    };
                    
                    window.saveUserSettings(settings);
                    showToast('Einstellungen gespeichert!', 'success');
                });
            }
        }, 1000);
    });
})();
