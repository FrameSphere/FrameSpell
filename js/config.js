// API Configuration für Cloudflare Workers Backend
// Diese Datei MUSS VOR app.js geladen werden!

// Wenn die Seite auf framespell.pages.dev läuft, leiten wir über die
// Pages-eigene /api-Route weiter (saubere URL, kein Worker-Name sichtbar).
// Im lokalen Dev oder auf anderen Domains wird der Worker direkt angesprochen.
(function () {
    var isPagesDomain = (
        window.location.hostname === 'framespell.pages.dev' ||
        window.location.hostname.endsWith('.framespell.pages.dev')
    );

    window.API_CONFIG = {
        BASE_URL: isPagesDomain
            ? (window.location.origin + '/api')
            : 'https://rechtschreibe-api.karol-paschek.workers.dev',
        ENDPOINTS: {
            HEALTH:          '/health',
            REGISTER:        '/register',
            LOGIN:           '/login',
            ME:              '/me',
            SPELLCHECK:      '/spellcheck',
            USAGE:           '/usage',
            CHECKOUT_CREATE: '/checkout/create',
        }
    };

    console.log('✅ API Config loaded:', window.API_CONFIG.BASE_URL);
})();
