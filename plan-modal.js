// Plan Management Modal Handler
(function() {
    const planModal = document.getElementById('plan-modal');
    const managePlanBtn = document.getElementById('manage-plan-btn');
    const planModalClose = document.getElementById('plan-modal-close');
    
    // Open Modal
    if (managePlanBtn) {
        managePlanBtn.addEventListener('click', () => {
            updatePlanModal();
            showElement(planModal);
        });
    }
    
    // Close Modal
    if (planModalClose) {
        planModalClose.addEventListener('click', () => {
            hideElement(planModal);
        });
    }
    
    // Close on backdrop click
    if (planModal) {
        planModal.addEventListener('click', (e) => {
            if (e.target === planModal || e.target.classList.contains('modal-backdrop')) {
                hideElement(planModal);
            }
        });
    }
    
    // Update Modal based on current plan
    function updatePlanModal() {
        if (!currentUser) return;
        
        const subscriptionType = currentUser.subscription_type || 'free';
        
        // Show/hide current badges
        document.getElementById('modal-free-current').style.display = subscriptionType === 'free' ? 'flex' : 'none';
        document.getElementById('modal-pro-current').style.display = subscriptionType === 'professional' ? 'flex' : 'none';
        document.getElementById('modal-enterprise-current').style.display = subscriptionType === 'enterprise' ? 'flex' : 'none';
        
        // Show/hide buttons
        const downgradeFreeBtn = document.getElementById('modal-downgrade-free');
        const upgradeProBtn = document.getElementById('modal-upgrade-pro');
        
        if (downgradeFreeBtn) {
            downgradeFreeBtn.style.display = subscriptionType !== 'free' ? 'block' : 'none';
        }
        
        if (upgradeProBtn) {
            upgradeProBtn.style.display = subscriptionType === 'professional' ? 'none' : 'block';
        }
    }
    
    // Update Compact Panel
    function updateCompactPlanDisplay() {
        if (!currentUser) return;
        
        const subscriptionType = currentUser.subscription_type || 'free';
        const planData = {
            'free': {
                name: 'Kostenlos',
                limit: '20 Anfragen/Min',
                cost: '€0/Monat'
            },
            'professional': {
                name: 'Professional',
                limit: '100 Anfragen/Min',
                cost: '€29/Monat'
            },
            'enterprise': {
                name: 'Enterprise',
                limit: 'Unbegrenzt',
                cost: '€290/Monat'
            }
        };
        
        const plan = planData[subscriptionType] || planData['free'];
        
        // Update compact display
        const currentPlanName = document.getElementById('current-plan-name');
        const planLimitDisplay = document.getElementById('plan-limit-display');
        const planCostDisplay = document.getElementById('plan-cost-display');
        const billingInfoCompact = document.getElementById('billing-info-compact');
        
        if (currentPlanName) currentPlanName.textContent = plan.name;
        if (planLimitDisplay) planLimitDisplay.textContent = plan.limit;
        if (planCostDisplay) planCostDisplay.textContent = plan.cost;
        
        // Show billing info for paid plans
        if (billingInfoCompact) {
            billingInfoCompact.style.display = subscriptionType !== 'free' ? 'flex' : 'none';
            
            if (subscriptionType !== 'free') {
                const nextBilling = new Date();
                nextBilling.setDate(nextBilling.getDate() + 30);
                const nextBillingDateCompact = document.getElementById('next-billing-date-compact');
                if (nextBillingDateCompact) {
                    nextBillingDateCompact.textContent = nextBilling.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'short'
                    });
                }
            }
        }
    }
    
    // Button Event Handlers
    document.getElementById('modal-upgrade-pro')?.addEventListener('click', () => {
        hideElement(planModal);
        window.location.href = 'payment.html';
    });
    
    document.getElementById('modal-contact-enterprise')?.addEventListener('click', () => {
        hideElement(planModal);
        showToast('Enterprise-Kontakt: support@framespell.de', 'info');
    });
    
    document.getElementById('modal-downgrade-free')?.addEventListener('click', async () => {
        if (!confirm('Möchten Sie wirklich auf den kostenlosen Plan zurückkehren? Ihre Vorteile gehen am Ende des Abrechnungszeitraums verloren.')) {
            return;
        }
        
        hideElement(planModal);
        showToast('Downgrade geplant für Ende des Abrechnungszeitraums', 'success');
        
        // TODO: Backend API Call
    });
    
    // Hook into updateUI
    const originalUpdateUI = window.updateUI;
    window.updateUI = function() {
        if (originalUpdateUI) originalUpdateUI();
        updateCompactPlanDisplay();
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        updateCompactPlanDisplay();
    });
})();
