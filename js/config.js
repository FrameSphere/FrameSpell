// API Configuration für Cloudflare Workers Backend
// Diese Datei MUSS VOR app.js geladen werden!

(function () {
    var WORKER_DIRECT = 'https://rechtschreibe-api.karol-paschek.workers.dev';

    var isPagesDomain = (
        window.location.hostname === 'framespell.pages.dev' ||
        window.location.hostname.endsWith('.framespell.pages.dev')
    );

    window.API_CONFIG = {
        // Reguläre API-Calls: auf Pages über /api proxied (saubere URL)
        BASE_URL: isPagesDomain
            ? (window.location.origin + '/api')
            : WORKER_DIRECT,

        // OAuth: IMMER direkt zum Worker – Redirects müssen vom Browser
        // nativ gefolgt werden, nicht server-seitig durch den Proxy.
        OAUTH_BASE_URL: WORKER_DIRECT,

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

    console.log('✅ API Config loaded:', window.API_CONFIG.BASE_URL,
                '| OAuth direct:', window.API_CONFIG.OAUTH_BASE_URL);
})();
