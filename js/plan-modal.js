// Plan Management Modal Handler
// Nutzt window.PRICING_CONFIG (pricing-config.js muss vorher geladen sein)
(function () {
  const PC = window.PRICING_CONFIG;

  const planModal      = document.getElementById('plan-modal');
  const managePlanBtn  = document.getElementById('manage-plan-btn');
  const planModalClose = document.getElementById('plan-modal-close');

  if (managePlanBtn) {
    managePlanBtn.addEventListener('click', () => {
      updatePlanModal();
      showElement(planModal);
    });
  }

  if (planModalClose) {
    planModalClose.addEventListener('click', () => hideElement(planModal));
  }

  if (planModal) {
    planModal.addEventListener('click', (e) => {
      if (e.target === planModal || e.target.classList.contains('modal-backdrop')) {
        hideElement(planModal);
      }
    });
  }

  // ── Modal aktualisieren ─────────────────────────────────────
  function updatePlanModal() {
    if (!currentUser) return;
    const subType = currentUser.subscription_type || 'free';

    const freeCurrentEl       = document.getElementById('modal-free-current');
    const proCurrentEl        = document.getElementById('modal-pro-current');
    const enterpriseCurrentEl = document.getElementById('modal-enterprise-current');

    if (freeCurrentEl)       freeCurrentEl.style.display       = subType === 'free'         ? 'flex' : 'none';
    if (proCurrentEl)        proCurrentEl.style.display        = subType === 'professional' ? 'flex' : 'none';
    if (enterpriseCurrentEl) enterpriseCurrentEl.style.display = subType === 'enterprise'   ? 'flex' : 'none';

    const downgradeFreeBtn = document.getElementById('modal-downgrade-free');
    const upgradeProBtn    = document.getElementById('modal-upgrade-pro');

    if (downgradeFreeBtn) {
      downgradeFreeBtn.style.display = subType !== 'free' ? 'block' : 'none';
    }
    if (upgradeProBtn) {
      upgradeProBtn.style.display = subType === 'professional' ? 'none' : 'block';
    }
  }

  // ── Kompaktanzeige aktualisieren ────────────────────────────
  function updateCompactPlanDisplay() {
    if (!currentUser) return;
    const subType = currentUser.subscription_type || 'free';
    const plan    = PC.getPlan(subType);

    const currentPlanName    = document.getElementById('current-plan-name');
    const planLimitDisplay   = document.getElementById('plan-limit-display');
    const planCostDisplay    = document.getElementById('plan-cost-display');
    const billingInfoCompact = document.getElementById('billing-info-compact');

    if (currentPlanName)  currentPlanName.textContent  = plan.name;
    if (planLimitDisplay) planLimitDisplay.textContent  = PC.getRequestsLabel(plan);

    // Preisanzeige
    const priceText = plan.priceMonthly === 0
      ? '€0/Monat'
      : plan.priceMonthly == null
        ? 'Auf Anfrage'
        : `€${plan.priceMonthly}/Monat`;
    if (planCostDisplay) planCostDisplay.textContent = priceText;

    if (billingInfoCompact) {
      billingInfoCompact.style.display = PC.isPaid(subType) ? 'flex' : 'none';
      if (PC.isPaid(subType)) {
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        const nextBillingDateCompact = document.getElementById('next-billing-date-compact');
        if (nextBillingDateCompact) {
          nextBillingDateCompact.textContent = nextBilling.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'short',
          });
        }
      }
    }
  }

  // ── Buttons ──────────────────────────────────────────────────
  document.getElementById('modal-upgrade-pro')?.addEventListener('click', () => {
    hideElement(planModal);
    window.location.href = 'payment.html';
  });

  document.getElementById('modal-contact-enterprise')?.addEventListener('click', () => {
    hideElement(planModal);
    if (typeof showToast === 'function') {
      showToast('Enterprise-Kontakt: support@framespell.de', 'info');
    }
  });

  document.getElementById('modal-downgrade-free')?.addEventListener('click', async () => {
    if (!confirm('Möchten Sie wirklich auf den kostenlosen Plan zurückkehren?\nIhre Professional-Vorteile gehen am Ende des Abrechnungszeitraums verloren.')) return;
    hideElement(planModal);
    if (typeof showToast === 'function') {
      showToast('Downgrade geplant für Ende des Abrechnungszeitraums', 'success');
    }
    // TODO: Backend API Call für Stripe-Kündigung
  });

  // ── Hook in globales updateUI ───────────────────────────────
  const originalUpdateUI = window.updateUI;
  window.updateUI = function () {
    if (originalUpdateUI) originalUpdateUI();
    updateCompactPlanDisplay();
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateCompactPlanDisplay();
  });
})();
