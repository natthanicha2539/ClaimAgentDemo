(function installCustomerTransferEligibilityCheck(){
  'use strict';

  const ERROR_ID = 'customerTransferEligibilityError';
  const parseAmount = value => {
    const amount = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(amount) ? amount : 0;
  };
  const formatAmount = value => parseAmount(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function removeError(){
    document.getElementById(ERROR_ID)?.remove();
  }

  function showError(data, difference){
    const page = document.getElementById('considerCustomerDetailPage');
    const pane = page?.querySelector('#ccStepPane2');
    const host = pane?.querySelector('.cc-ref-step2-shell') || pane;
    if(!host) return;

    let alert = document.getElementById(ERROR_ID);
    if(!alert){
      alert = document.createElement('div');
      alert.id = ERROR_ID;
      alert.className = 'mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700';
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.tabIndex = -1;
      host.insertBefore(alert, host.firstChild);
    }
    alert.innerHTML = `สิทธิ์เบิกต้องเท่ากับยอดที่โอน กรุณาตรวจสอบข้อมูลก่อนดำเนินการต่อ`+
      `<div class="mt-1 font-medium">สิทธิ์เบิก ${formatAmount(data.eligible)} บาท · ยอดที่โอน ${formatAmount(data.transfer)} บาท`+
      ` (ส่วนต่าง ${formatAmount(difference)} บาท)</div>`;

    if(Number(window.currentCustomerStep || 1) !== 2 && typeof window.setCustomerStep === 'function'){
      window.setCustomerStep(2);
    }
    requestAnimationFrame(() => {
      const visibleAlert = document.getElementById(ERROR_ID);
      visibleAlert?.scrollIntoView({behavior: 'smooth', block: 'center'});
      visibleAlert?.focus({preventScroll: true});
    });
  }

  window.validateCustomerTransferEntitlementMatch = function(){
    const data = typeof window.getCustomerTransferSummaryData === 'function'
      ? window.getCustomerTransferSummaryData()
      : null;
    if(!data || !Number.isFinite(Number(data.eligible)) || !Number.isFinite(Number(data.transfer))) return true;

    const eligibleCents = Math.round(parseAmount(data.eligible) * 100);
    const transferCents = Math.round(parseAmount(data.transfer) * 100);
    if(eligibleCents === transferCents){
      removeError();
      return true;
    }

    showError(data, Math.abs(eligibleCents - transferCents) / 100);
    return false;
  };

  const previousSetCustomerStep = window.setCustomerStep;
  if(typeof previousSetCustomerStep === 'function' && !previousSetCustomerStep.__transferEligibilityGuard){
    const guardedSetCustomerStep = function(step){
      if(Number(step) === 3 && Number(window.currentCustomerStep || 1) === 2 && !window.validateCustomerTransferEntitlementMatch()) return false;
      if(Number(step) === 1) removeError();
      return previousSetCustomerStep.apply(this, arguments);
    };
    guardedSetCustomerStep.__transferEligibilityGuard = true;
    window.setCustomerStep = guardedSetCustomerStep;
  }

  const previousOpenApprove = window.openCustomerApproveConfirmModal;
  if(typeof previousOpenApprove === 'function'){
    window.openCustomerApproveConfirmModal = function(){
      if(!window.validateCustomerTransferEntitlementMatch()) return false;
      return previousOpenApprove.apply(this, arguments);
    };
  }

  const previousConfirmApprove = window.confirmCustomerApprove;
  if(typeof previousConfirmApprove === 'function'){
    window.confirmCustomerApprove = function(){
      if(!window.validateCustomerTransferEntitlementMatch()){
        window.closeCustomerApproveConfirmModal?.();
        return false;
      }
      return previousConfirmApprove.apply(this, arguments);
    };
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#considerCustomerDetailPage #ccStepPane3 button');
    if(!button || !/อนุมัติ/.test(String(button.textContent || ''))) return;
    if(window.validateCustomerTransferEntitlementMatch()) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);
})();
