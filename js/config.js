// API Configuration für Cloudflare Workers Backend
// Diese Datei MUSS VOR app.js geladen werden!

window.API_CONFIG = {
  BASE_URL: 'https://rechtschreibe-api.karol-paschek.workers.dev',
  ENDPOINTS: {
    HEALTH: '/health',
    REGISTER: '/register',
    LOGIN: '/login',
    ME: '/me',
    SPELLCHECK: '/spellcheck',
    USAGE: '/usage',
    CHECKOUT_CREATE: '/checkout/create',
  }
};

console.log('✅ API Config loaded:', window.API_CONFIG.BASE_URL);
