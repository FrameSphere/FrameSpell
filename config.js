// API Configuration für Cloudflare Workers Backend
// WICHTIG: Setze hier deine Worker URL ein!

const API_BASE_URL = 'https:// rechtschreibe-api.karol-paschek.workers.dev';

// Oder bei Custom Domain:
// const API_BASE_URL = 'https://api.deine-domain.com';

window.API_CONFIG = {
  BASE_URL: API_BASE_URL,
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
