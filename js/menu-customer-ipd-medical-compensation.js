(function installCustomerIpdMedicalCompensation(){
  'use strict';

  const parseAmount = value => {
    const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };
  const formatAmount = value => parseAmount(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const suppliedNumber = (row, keys) => {
    for(const key of keys){
      const value = row?.[key];
      if(value === undefined || value === null || String(value).trim() === '') continue;
      const parsed = Number(String(value).replace(/,/g, '').trim());
      if(Number.isFinite(parsed)) return Math.max(0, parsed);
    }
    return null;
  };

  const ipdTransferItems = [
    ['IPD_Half_1', 'ค่าห้องปกติ'],
    ['IPD_Half_2', 'ค่าห้อง ICU'],
    ['IPD_Half_3', 'ค่ารักษาพยาบาล'],
    ['IPD_Half_4', 'ค่าดูแลโดยแพทย์'],
    ['IPD_Half_5', 'ค่าชดเชย IPD']
  ];

  function isIpdMedicalClaim(row){
    const selected = selection(row);
    const product = String(row?.product || window.currentConsiderCustomerRow?.product || 'PH').trim().toUpperCase();
    const coverage = String(row?.coverageType || row?.coverage || selected.coverage || '').trim();
    const treatment = String(row?.treatmentType || row?.claimType || selected.treatment || '').trim().toUpperCase();
    return product === 'PH' && coverage === 'ค่ารักษา' && treatment === 'IPD';
  }

  window.renderCustomerIpdTransferBreakdown = function(row = window.currentConsiderCustomerRow || {}){
    if(!isIpdMedicalClaim(row)) return '';
    const values = Array.isArray(row.ipdBenefitAmounts)
      ? row.ipdBenefitAmounts
      : Object.entries(row.ipdBenefitAmounts || {}).map(([code, amount]) => ({code, amount}));
    const byCode = new Map(values.map(item => [String(item?.code || ''), item?.amount]));
    const rows = ipdTransferItems.filter(([code]) => {
      const amount = Number(String(byCode.get(code) ?? '').replace(/,/g, '').trim());
      return Number.isFinite(amount) && amount > 0;
    });
    if(!rows.length) return '';
    return `<section class="customer-ipd-transfer-breakdown mt-3 overflow-hidden rounded-lg border border-brand-100 bg-white" aria-labelledby="customerIpdTransferBreakdownTitle">
      <div id="customerIpdTransferBreakdownTitle" class="cc-ref-title-strip"><span class="material-icons-round" aria-hidden="true">account_balance_wallet</span>รายละเอียดจำนวนเงินโอนตามสิทธิ์ความคุ้มครอง</div>
      <div class="customer-ipd-transfer-breakdown__list divide-y divide-slate-100" role="list">${rows.map(([code, label]) => `<div class="customer-ipd-transfer-breakdown__row flex items-center justify-between gap-3 px-3 py-2.5 text-sm" role="listitem" data-ipd-transfer-code="${code}"><span class="min-w-0"><span class="customer-ipd-transfer-breakdown__code mr-2 font-bold text-brand-700">${code}</span><span class="customer-ipd-transfer-breakdown__label text-slate-700">${label}</span></span><strong class="shrink-0 tabular-nums text-slate-900">${formatAmount(byCode.get(code))} บาท</strong></div>`).join('')}</div>
    </section>`;
  };

  function selection(row){
    if(typeof window.getConsiderClaimSelection === 'function') return window.getConsiderClaimSelection(row || {});
    return {
      coverage: window.customerClaimSelectionState?.coverage || row?.coverageType || '',
      treatment: window.customerClaimSelectionState?.treatment || row?.treatmentType || row?.claimType || ''
    };
  }

  function isTarget(row){
    const selected = selection(row);
    return String(selected.coverage || '').trim() === 'ค่ารักษา' && /(?:IPD|Day\s*Case(?:\s*Surgery)?)/i.test(String(selected.treatment || ''));
  }

  window.getCustomerIpdMedicalCompensationData = function(row = window.currentConsiderCustomerRow || {}){
    if(!isTarget(row)){
      return {target:false, days:0, dailyRate:0, calculatedAmount:0, benefitLimit:null, payableCompensation:0, valid:true, error:''};
    }

    const totalDaysInput = document.getElementById('ccTotalStayDays');
    const days = totalDaysInput
      ? parseAmount(totalDaysInput.value)
      : parseAmount(row.totalStayDays ?? row.totalDays);
    const coverageBenefit = typeof window.getCustomerCoverageBenefit === 'function'
      ? window.getCustomerCoverageBenefit('IPD_COMPENSATION', row)
      : null;
    const dailyRate = coverageBenefit
      ? parseAmount(coverageBenefit.dailyRate)
      : (suppliedNumber(row, ['compensationDailyRate','compDailyRate','dailyCompensation','compensationRate']) ?? 0);
    const benefitLimit = suppliedNumber(row, ['compensationRemainingBenefit','compensationBenefitLimit','compBenefitLimit']);
    const calculatedAmount = days * dailyRate;
    const payableCompensation = benefitLimit === null
      ? calculatedAmount
      : Math.min(calculatedAmount, benefitLimit);
    let error = '';
    if(days <= 0) error = 'ไม่พบจำนวนวันนอนรวม กรุณาตรวจสอบข้อมูลใน Step 1';
    else if(dailyRate <= 0) error = 'ไม่พบอัตราค่าชดเชยผู้ป่วยในตาม Benefit กรุณาตรวจสอบข้อมูลสิทธิ์ความคุ้มครอง';

    return {
      target:true,
      days,
      dailyRate,
      calculatedAmount,
      benefitLimit,
      rateSource:coverageBenefit?.source || 'claim-benefit',
      payableCompensation: error ? 0 : payableCompensation,
      valid:!error,
      error
    };
  };

  window.renderCustomerIpdMedicalCompensation = function(row = window.currentConsiderCustomerRow || {}){
    const data = window.getCustomerIpdMedicalCompensationData(row);
    if(!data.target) return '';
    const limitText = data.benefitLimit === null ? 'ไม่จำกัด' : `${formatAmount(data.benefitLimit)} บาท`;
    return `<section id="customerIpdMedicalCompensation" class="customer-ipd-medical-compensation" role="region" aria-labelledby="customerIpdMedicalCompensationTitle">
      <div id="customerIpdMedicalCompensationTitle" class="cc-ref-title-strip"><span class="material-icons-round" aria-hidden="true">bed</span>ค่าชดเชยผู้ป่วยใน (ตามสิทธิ์ความคุ้มครอง)</div>
      <div class="customer-ipd-medical-compensation-body cc-ref-summary-box">
        <div class="customer-ipd-medical-compensation-grid">
          <div class="customer-ipd-medical-compensation-item cc-ref-money-card"><div class="cc-ref-money-label">จำนวนวันนอนรวม</div><div><strong data-ipd-medical-days>${data.days} วัน</strong></div></div>
          <div class="customer-ipd-medical-compensation-item cc-ref-money-card"><div class="cc-ref-money-label">อัตราค่าชดเชยต่อวัน</div><div><strong data-ipd-medical-rate>${formatAmount(data.dailyRate)} บาท</strong></div></div>
          <div class="customer-ipd-medical-compensation-item cc-ref-money-card benefit-limit"><div class="cc-ref-money-label">วงเงินคงเหลือตามสิทธิ์</div><div><strong data-ipd-medical-limit>${limitText}</strong></div></div>
          <div class="customer-ipd-medical-compensation-item cc-ref-money-card payable"><div class="cc-ref-money-label">ค่าชดเชยผู้ป่วยใน</div><div><strong data-ipd-medical-payable>${formatAmount(data.payableCompensation)} บาท</strong></div></div>
        </div>
        <div class="customer-ipd-medical-compensation-note" role="note"><span class="material-icons-round" aria-hidden="true">info</span><span>เป็นการคำนวณจากระบบ โปรดตรวจสอบกับยอดเงินที่โอน</span></div>
        ${data.valid ? '' : `<div id="customerIpdMedicalCompensationError" class="customer-ipd-medical-compensation-error" role="alert" aria-live="assertive" tabindex="-1"><span class="material-icons-round" aria-hidden="true">error</span><span>${data.error}</span></div>`}
      </div>
    </section>`;
  };

  window.refreshCustomerIpdMedicalCompensation = function(){
    const current = document.getElementById('customerIpdMedicalCompensation');
    const html = window.renderCustomerIpdMedicalCompensation(window.currentConsiderCustomerRow || {});
    if(current && html) current.outerHTML = html;
    else if(current && !html) current.remove();
    return window.getCustomerIpdMedicalCompensationData(window.currentConsiderCustomerRow || {});
  };

  window.validateCustomerIpdMedicalCompensation = function(shouldFocus = true){
    const data = window.refreshCustomerIpdMedicalCompensation();
    if(!data.target || data.valid) return true;
    if(Number(window.currentCustomerStep || 1) !== 2 && typeof window.setCustomerStep === 'function') window.setCustomerStep(2);
    if(shouldFocus){
      requestAnimationFrame(() => {
        const error = document.getElementById('customerIpdMedicalCompensationError');
        error?.scrollIntoView({behavior:'smooth', block:'center'});
        error?.focus({preventScroll:true});
      });
    }
    return false;
  };

  document.addEventListener('input', event => {
    if(!event.target?.matches?.('#ccIpdDays,#ccIcuDays,#ccTotalStayDays')) return;
    setTimeout(() => {
      window.refreshCustomerIpdMedicalCompensation();
      window.recalculateCustomerExpenseSummary?.();
    }, 0);
  }, true);
})();
