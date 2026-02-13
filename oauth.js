// OAuth Handlers
(function() {
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
        showLoading();
        
        try {
            if (provider === 'framesphere') {
                // FrameSphere - Placeholder for now
                showToast('FrameSphere OAuth wird bald verfügbar sein!', 'info');
                hideLoading();
                return;
            }
            
            // Redirect to OAuth endpoint
            const redirectUrl = `${window.API_CONFIG.BASE_URL}/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(window.location.origin + '/oauth-callback.html')}`;
            window.location.href = redirectUrl;
            
        } catch (error) {
            console.error('OAuth error:', error);
            showToast(`${provider} Anmeldung fehlgeschlagen`, 'error');
            hideLoading();
        }
    }
    
    // OAuth Register Handler (same as login for OAuth)
    function handleOAuthRegister(provider) {
        handleOAuthLogin(provider);
    }
    
    // Handle OAuth Callback
    window.handleOAuthCallback = function(token, userData) {
        console.log('OAuth Callback:', { token, userData });
        
        // Setze authToken und currentUser ÜBERALL
        window.authToken = token;
        window.currentUser = userData;
        localStorage.setItem('authToken', token);
        
        // Force-setze die Variablen auch direkt (für app.js Scope)
        try {
            eval('authToken = "' + token.replace(/"/g, '\\"') + '";');
            eval('currentUser = ' + JSON.stringify(userData) + ';');
        } catch (e) {
            console.log('Could not set via eval, using window only');
        }
        
        // Close modals
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        if (loginModal) loginModal.classList.add('hidden');
        if (registerModal) registerModal.classList.add('hidden');
        
        // Update UI
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        // Show Dashboard direkt auf Profil-Seite
        const dashboardWrapper = document.getElementById('dashboard-wrapper');
        const mainContent = document.querySelector('.main-content');
        
        if (dashboardWrapper && mainContent) {
            mainContent.style.display = 'none';
            dashboardWrapper.classList.remove('hidden');
            dashboardWrapper.style.display = 'flex';
            
            // Zeige Profil-Seite
            document.querySelectorAll('.dashboard-page').forEach(page => {
                page.classList.remove('active');
            });
            document.querySelectorAll('.dashboard-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const profilePage = document.getElementById('page-profile');
            const profileTab = document.querySelector('[data-page="profile"]');
            
            if (profilePage) profilePage.classList.add('active');
            if (profileTab) profileTab.classList.add('active');
            
            // Re-initialisiere Dashboard Event Handlers
            if (typeof initDashboard === 'function') {
                initDashboard();
            }
            
            // Lade User-Daten ins Dashboard
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }
        
        showToast('Erfolgreich mit GitHub angemeldet!', 'success');
    };
    
    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('oauth_token')) {
        const token = urlParams.get('oauth_token');
        const userDataStr = urlParams.get('user_data');
        
        if (token && userDataStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userDataStr));
                handleOAuthCallback(token, userData);
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('OAuth callback error:', error);
                showToast('OAuth Fehler', 'error');
            }
        }
    }
})();
