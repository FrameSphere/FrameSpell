/**
 * ============================================================
 *  PRICING CONFIG — SINGLE SOURCE OF TRUTH
 *  Alle Preise, Limits und Features sind hier zentral definiert.
 *  Andere Dateien importieren dieses Objekt.
 * ============================================================
 */
window.PRICING_CONFIG = {

  // ── Pläne ──────────────────────────────────────────────────
  plans: {
    free: {
      key:          'free',
      name:         'Kostenlos',
      description:  'Ideal zum Ausprobieren',
      priceMonthly: 0,
      priceYearly:  0,
      // Rate Limit (Anfragen pro Minute)
      requestsPerMinute: 20,
      // Allgemeine Features
      features: [
        '20 Anfragen pro Minute',
        'Rechtschreibkorrektur (Deutsch)',
        'REST-API-Zugang',
        'Community-Support',
      ],
      cta:          'Kostenlos starten',
      highlighted:  false,
    },

    professional: {
      key:          'professional',
      name:         'Professional',
      description:  'Für professionelle Nutzung',
      priceMonthly: 29,    // €29/Monat inkl. MwSt.
      priceYearly:  290,   // €290/Jahr inkl. MwSt. (≈ €24.17/Monat → 17% Ersparnis)
      priceYearlyPerMonth: 24.17,
      // Stripe Price IDs (Platzhalter — Backend mappt auf echte IDs aus Env-Vars)
      stripePriceIdMonthly: 'price_monthly',
      stripePriceIdYearly:  'price_yearly',
      // Rate Limit (Anfragen pro Minute)
      requestsPerMinute: 100,
      // Features
      features: [
        '100 Anfragen pro Minute (5× mehr)',
        'Rechtschreibkorrektur (alle verfügbaren Sprachen)',
        'Erweiterte API-Features',
        'Prioritäts-Support per E-Mail',
        'Detaillierte Nutzungsstatistiken',
        'Keine versteckten Gebühren',
        '30 Tage Geld-zurück-Garantie',
      ],
      highlights: [
        { icon: '⚡', text: '5× mehr Anfragen/Minute' },
        { icon: '🌍', text: 'Alle verfügbaren Sprachen' },
        { icon: '📊', text: 'Erweiterte Statistiken' },
        { icon: '💬', text: 'Prioritäts-Support' },
      ],
      cta:          'Jetzt upgraden',
      highlighted:  true,
    },

    enterprise: {
      key:          'enterprise',
      name:         'Enterprise',
      description:  'Für Teams und Unternehmen',
      priceMonthly: null,  // Preis auf Anfrage
      priceYearly:  null,
      requestsPerMinute: Infinity,
      features: [
        'Unbegrenzte Anfragen',
        'Alle Professional-Features',
        'Dedizierter Account Manager',
        'SLA & Uptime-Garantie',
        'Custom Integrationen',
        'Rechnungsstellung',
      ],
      cta:          'Kontakt aufnehmen',
      highlighted:  false,
    },
  },

  // ── Hilfsfunktionen ────────────────────────────────────────
  getPlan(key) {
    return this.plans[key] || this.plans.free;
  },

  formatPrice(cents, period = 'month') {
    if (cents == null) return 'Auf Anfrage';
    if (cents === 0) return 'Kostenlos';
    return `€${cents.toFixed ? cents.toFixed(0) : cents}`;
  },

  getRequestsLabel(plan) {
    if (plan.requestsPerMinute === Infinity) return 'Unbegrenzt';
    return `${plan.requestsPerMinute} Anfragen/Min`;
  },

  isPaid(subscriptionType) {
    return subscriptionType === 'professional' || subscriptionType === 'enterprise';
  },
};

console.log('✅ Pricing Config loaded');
