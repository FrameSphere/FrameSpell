/**
 * Plan Management Modal Handler
 * Nutzt window.PRICING_CONFIG (pricing-config.js), wenn verfügbar.
 * Läuft auch ohne PRICING_CONFIG (graceful degradation).
 */
(function () {
  // ── Fallback-Config wenn pricing-config.js noch nicht geladen ist ───────────
  const PC = window.PRICING_CONFIG || {
    plans: {
      free:         { name: 'Kostenlos',    requestsPerMinute: 20,  priceMonthly: 0    },
      professional: { name: 'Professional', requestsPerMinute: 100, priceMonthly: 29   },
      enterprise:   { name: 'Enterprise',   requestsPerMinute: Infinity, priceMonthly: null },
    },
    getPlan(key) { return this.plans[key] || this.plans.free; },
    getRequestsLabel(plan) {
      if (plan.requestsPerMinute === Infinity) return 'Unbegrenzt';
      return `${plan.requestsPerMinute} Anfragen/Min`;
    },
    isPaid(type) { return type === 'professional' || type === 'enterprise'; },
  };

  const planModal      = document.getElementById('plan-modal');
  const managePlanBtn  = document.getElementById('manage-plan-btn');
  const planModalClose = document.getElementById('plan-modal-close');

  if (managePlanBtn) {
    managePlanBtn.addEventListener('click', () => {
      updatePlanModal();
      if (typeof showElement === 'function') showElement(planModal);
    });
  }

  if (planModalClose) {
    planModalClose.addEventListener('click', () => {
      if (typeof hideElement === 'function') hideElement(planModal);
    });
  }

  if (planModal) {
    planModal.addEventListener('click', (e) => {
      if (e.target === planModal || e.target.classList.contains('modal-backdrop')) {
        if (typeof hideElement === 'function') hideElement(planModal);
      }
    });
  }

  // ── Modal aktualisieren ─────────────────────────────────────────────────────
  function updatePlanModal() {
    // currentUser ist eine globale Variable aus app.js
    const user = window.currentUser;
    if (!user) return;
    const subType = user.subscription_type || 'free';
    const isPaid = subType === 'professional' || subType === 'enterprise';

    const freeEl       = document.getElementById('modal-free-current');
    const proEl        = document.getElementById('modal-pro-current');
    const enterpriseEl = document.getElementById('modal-enterprise-current');

    if (freeEl)       freeEl.style.display       = subType === 'free'         ? 'flex' : 'none';
    if (proEl)        proEl.style.display         = subType === 'professional' ? 'flex' : 'none';
    if (enterpriseEl) enterpriseEl.style.display  = subType === 'enterprise'   ? 'flex' : 'none';

    const downgradeFreeBtn = document.getElementById('modal-downgrade-free');
    const upgradeProBtn    = document.getElementById('modal-upgrade-pro');

    if (downgradeFreeBtn) downgradeFreeBtn.style.display = subType !== 'free'         ? 'block' : 'none';
    if (upgradeProBtn)    upgradeProBtn.style.display    = subType === 'professional'  ? 'none'  : 'block';

    // Billing Portal Row – nur für zahlende Kunden
    const billingPortalRow = document.getElementById('billing-portal-row');
    if (billingPortalRow) billingPortalRow.style.display = isPaid ? 'block' : 'none';
  }

  // ── Kompaktanzeige im Dashboard aktualisieren ───────────────────────────────
  function updateCompactPlanDisplay() {
    const user = window.currentUser;
    if (!user) return;
    const subType = user.subscription_type || 'free';

    try {
      const plan = PC.getPlan(subType);

      const nameEl    = document.getElementById('current-plan-name');
      const limitEl   = document.getElementById('plan-limit-display');
      const costEl    = document.getElementById('plan-cost-display');
      const billingEl = document.getElementById('billing-info-compact');

      if (nameEl)  nameEl.textContent  = plan.name;
      if (limitEl) limitEl.textContent = PC.getRequestsLabel(plan);

      const priceText = plan.priceMonthly === 0
        ? '€0/Monat'
        : plan.priceMonthly == null
          ? 'Auf Anfrage'
          : `€${plan.priceMonthly}/Monat`;
      if (costEl) costEl.textContent = priceText;

      if (billingEl) {
        billingEl.style.display = PC.isPaid(subType) ? 'flex' : 'none';
        if (PC.isPaid(subType)) {
          const nextBilling = new Date();
          nextBilling.setDate(nextBilling.getDate() + 30);
          const dateEl = document.getElementById('next-billing-date-compact');
          if (dateEl) {
            dateEl.textContent = nextBilling.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
          }
        }
      }
    } catch (err) {
      console.warn('plan-modal: updateCompactPlanDisplay error', err);
    }
  }

  // ── Buttons ─────────────────────────────────────────────────────────────────
  document.getElementById('modal-upgrade-pro')?.addEventListener('click', () => {
    if (typeof hideElement === 'function') hideElement(planModal);
    window.location.href = 'payment.html';
  });

  document.getElementById('modal-contact-enterprise')?.addEventListener('click', () => {
    if (typeof hideElement === 'function') hideElement(planModal);
    if (typeof showToast === 'function') showToast('Enterprise-Kontakt: support@framespell.de', 'info');
  });

  document.getElementById('modal-downgrade-free')?.addEventListener('click', () => {
    if (!confirm('Möchten Sie wirklich auf den kostenlosen Plan zurückkehren?\nIhre Professional-Vorteile gehen am Ende des Abrechnungszeitraums verloren.')) return;
    if (typeof hideElement === 'function') hideElement(planModal);
    if (typeof showToast === 'function') showToast('Downgrade geplant für Ende des Abrechnungszeitraums', 'success');
    // TODO: Backend-API-Call für Stripe-Kündigung
  });

  // ── Hook in globales updateUI ───────────────────────────────────────────────
  const originalUpdateUI = window.updateUI;
  window.updateUI = function () {
    if (typeof originalUpdateUI === 'function') originalUpdateUI();
    try { updateCompactPlanDisplay(); } catch (_) {}
  };

  // ── Init ────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    try { updateCompactPlanDisplay(); } catch (_) {}
  });
})();
