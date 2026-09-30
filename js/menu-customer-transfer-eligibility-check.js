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

  function getEligibleAmount(fallback){
    const value = document.querySelector('#considerCustomerDetailPage #ccStepPane2 #customerSummaryEligibleTotal')?.textContent;
    if(value == null || !String(value).trim()) return parseAmount(fallback);
    return parseAmount(value);
  }

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
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.tabIndex = -1;
    }
    alert.className = data.isIpdMedical
      ? 'customer-transfer-eligibility-alert customer-transfer-eligibility-alert--ipd'
      : 'mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700';

    if(data.isIpdMedical){
      const messageText = data.hasIpdHalf5
        ? 'กรุณาตรวจสอบยอดเงินที่โอน จำนวนเงินโอนรวมต้องเท่ากับสิทธิ์เบิกรวม'
        : 'กรุณาตรวจสอบยอดเงินที่โอน จำนวนเงินโอนรวมต้องเท่ากับสิทธิ์เบิกรวม รวมกับค่าชดเชยผู้ป่วยใน';
      const existingMessage = alert.querySelector('.customer-transfer-eligibility-alert__message');
      if(existingMessage?.textContent !== messageText){
        const icon = document.createElement('span');
        icon.className = 'material-icons-round customer-transfer-eligibility-alert__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = 'warning_amber';

        const message = document.createElement('p');
        message.className = 'customer-transfer-eligibility-alert__message';
        message.textContent = messageText;
        alert.replaceChildren(icon, message);
      }
    }else{
    const title = document.createElement('div');
    const breakdown = document.createElement('div');
    breakdown.className = 'mt-1 font-medium';
    title.textContent = 'สิทธิ์เบิกต้องเท่ากับยอดที่โอน กรุณาตรวจสอบข้อมูลก่อนดำเนินการต่อ';
    breakdown.textContent = `สิทธิ์เบิก ${formatAmount(data.eligible)} บาท · ยอดที่โอน ${formatAmount(data.transfer)} บาท `+
      `(ส่วนต่าง ${formatAmount(difference)} บาท)`;
    alert.replaceChildren(title, breakdown);
    }

    const summary = Array.from(pane?.querySelectorAll('.cc-ref-prelim-card .cc-ref-summary-box') || [])
      .find(box => String(box.querySelector('.cc-ref-summary-title')?.textContent || '').replace(/\s+/g, ' ').includes('สรุปยอดเงิน'));
    if(summary) summary.after(alert);
    else if(alert.parentElement !== host) host.append(alert);

    if(Number(window.currentCustomerStep || 1) !== 2 && typeof window.setCustomerStep === 'function'){
      window.setCustomerStep(2);
    }
    if(data.focus !== false){
      requestAnimationFrame(() => {
        const visibleAlert = document.getElementById(ERROR_ID);
        visibleAlert?.scrollIntoView({behavior: 'smooth', block: 'center'});
        visibleAlert?.focus({preventScroll: true});
      });
    }
  }

  window.validateCustomerTransferEntitlementMatch = function(options = {}){
    const summary = typeof window.getCustomerTransferSummaryData === 'function'
      ? window.getCustomerTransferSummaryData()
      : null;
    if(!summary || !Number.isFinite(Number(summary.eligible)) || !Number.isFinite(Number(summary.transfer))) return true;

    const compensation = typeof window.getCustomerIpdMedicalCompensationData === 'function'
      ? window.getCustomerIpdMedicalCompensationData(window.currentConsiderCustomerRow || {})
      : {target:false, payableCompensation:0, valid:true};
    if(compensation.target && !compensation.valid){
      removeError();
      window.validateCustomerIpdMedicalCompensation?.(true);
      return false;
    }
    const settlement = typeof window.getCustomerMedicalExpenseSettlementData === 'function'
      ? window.getCustomerMedicalExpenseSettlementData()
      : null;
    const hasIpdHalf5 = compensation.target && settlement?.hasIpdHalf5 === true;
    const medicalNet = compensation.target && settlement
      ? settlement.eligibleTotal
      : getEligibleAmount(summary.eligible);
    const includedCompensation = compensation.target && !hasIpdHalf5
      ? compensation.payableCompensation
      : 0;
    const data = {
      ...summary,
      medicalNet,
      compensation:includedCompensation,
      eligible:compensation.target && settlement ? settlement.net : medicalNet + includedCompensation,
      isIpdMedical:compensation.target,
      hasIpdHalf5,
      focus:options.focus !== false
    };

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
      const result = previousSetCustomerStep.apply(this, arguments);
      if(Number(step) === 2 && Number(window.currentCustomerStep || 1) === 2){
        window.setTimeout(() => window.validateCustomerTransferEntitlementMatch({focus:false}), 0);
      }
      return result;
    };
    guardedSetCustomerStep.__transferEligibilityGuard = true;
    window.setCustomerStep = guardedSetCustomerStep;
  }

  let pendingLiveValidation = 0;
  function scheduleLiveValidation(){
    window.clearTimeout(pendingLiveValidation);
    pendingLiveValidation = window.setTimeout(() => {
      if(Number(window.currentCustomerStep || 1) === 2){
        window.validateCustomerTransferEntitlementMatch({focus:false});
      }
    }, 0);
  }
  document.addEventListener('input', event => {
    if(event.target?.closest?.('#considerCustomerDetailPage #ccStepPane2')) scheduleLiveValidation();
  }, true);
  document.addEventListener('change', event => {
    if(event.target?.closest?.('#considerCustomerDetailPage #ccStepPane2')) scheduleLiveValidation();
  }, true);
  document.addEventListener('click', event => {
    if(event.target?.closest?.('#considerCustomerDetailPage #ccStepPane2 button')) scheduleLiveValidation();
  }, true);

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
