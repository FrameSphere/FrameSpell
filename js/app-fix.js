// API Base URL - wird aus config.js geladen
const API_BASE_URL = window.API_CONFIG?.BASE_URL || 'http://localhost:8000';

console.log('🚀 API URL:', API_BASE_URL);

// State Management
let currentUser = null;
let authToken = null;
let demoAttempts = 3;

// ... rest deiner app.js bleibt gleich
