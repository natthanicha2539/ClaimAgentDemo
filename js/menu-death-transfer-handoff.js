/* Death & Disability approval -> session-only customer transfer tracking. */
(function () {
  'use strict';

  const rows = window.deathTransferPendingRows = Array.isArray(window.deathTransferPendingRows)
    ? window.deathTransferPendingRows : [];
  const beneficiaryMocks = {
    CL6906000104: { relation: 'มารดา', idNo: '4953523518631', name: 'นางณัชชา วรวุฒิอนุกุล', phone: '091-2223344', bank: 'กรุงไทย', account: '18210001122', amount: 120000 },
    CL6906000082: { relation: 'ผู้เอาประกัน', idNo: '3101702456781', name: 'นายวีรัตน์ แสนวงศ์', phone: '089-552-1788', bank: 'กสิกรไทย', account: '049-2-771305', amount: 70000 },
    CL6906000095: { relation: 'คู่สมรส', idNo: '3951007284164', name: 'นางสาวสุภาวดี พงษ์พัฒน์เปรียน', phone: '086-238-1154', bank: 'ไทยพาณิชย์', account: '408-2-904712', amount: 120000 },
    CLPA6906000112: { relation: 'มารดา', idNo: '3420901167354', name: 'นางอรพรรณ สถานนท์', phone: '081-714-2069', bank: 'กรุงไทย', account: '621-0-452198', amount: 120000 },
    CLPA6906000113: { relation: 'ผู้เอาประกัน', idNo: '1103701123456', name: 'นางสาววิญา ศรีโกศล', phone: '086-445-7721', bank: 'กรุงเทพ', account: '198-4-702318', amount: 80000 }
  };
  if (typeof considerationDeathRows !== 'undefined') {
    considerationDeathRows.forEach(row => {
      if (beneficiaryMocks[row.claimCode]) row.amount = Number(beneficiaryMocks[row.claimCode].amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
  }
  const money = value => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const amount = value => Number(String(value || '').replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const pad = value => String(value).padStart(2, '0');
  const nowText = date => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() + 543} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  function claimInfo() {
    const claimNo = document.getElementById('ddClaimCodeValue')?.textContent?.trim() || '';
    const caseNo = document.getElementById('ddCaseCodeValue')?.textContent?.trim() || claimNo.replace(/^CLPA/, 'CCPA').replace(/^CL/, 'CC');
    return {
      claimNo, caseNo,
      insured: document.getElementById('ddInsuredName')?.textContent?.trim() || '',
      product: claimNo.startsWith('CLPA') ? 'PA' : 'PH',
      branch: document.getElementById('ddMetaBranch')?.textContent?.trim() || 'กรุงเทพมหานคร'
    };
  }

  function field(box, needle) {
    const item = Array.from(box.querySelectorAll('.dd-detail-grid > div'))
      .find(element => element.querySelector('.dd-field-label')?.textContent?.includes(needle));
    return item?.querySelector('.dd-field-value') || null;
  }

  function readBeneficiaries() {
    const changed = document.getElementById('ddTransferAccountDetail');
    const replacement = changed && !changed.classList.contains('hidden');
    const replacementName = document.getElementById('ddTransferReceiverText')?.textContent?.trim() || '';
    const replacementAccount = document.getElementById('ddTransferBankText')?.textContent?.trim() || '';
    return Array.from(document.querySelectorAll('#considerDeathDetailPage .dd-beneficiary-box')).map((box, index) => {
      const accountLine = field(box, 'บัญชีรับสินไหม')?.textContent?.trim() || '';
      const selectedAccount = replacement && index === 0 ? replacementAccount : accountLine;
      const bankMatch = selectedAccount.match(/^(.+?)(?:\s+\([^)]*\))?\s+(\d[\d-]*)\s+(.+)$/);
      return {
        index: index + 1,
        relation: field(box, 'ความสัมพันธ์')?.textContent?.trim() || '',
        name: replacement && index === 0 ? replacementName : field(box, 'ชื่อ-นามสกุล')?.textContent?.trim() || '',
        bank: bankMatch?.[1]?.trim() || '',
        account: bankMatch?.[2]?.trim() || '',
        amount: amount(field(box, 'จำนวนเงิน')?.textContent)
      };
    });
  }

  function showError(message) {
    if (typeof showModal !== 'function') return;
    showModal(`<div class="p-6 text-center"><span class="material-icons-round text-4xl text-red-600" aria-hidden="true">error_outline</span><h3 class="mt-2 text-xl font-extrabold text-slate-800">ยังส่งรายการโอนไม่ได้</h3><p class="mt-2 text-slate-600">${esc(message)}</p><button type="button" onclick="closeModal()" class="mt-5 h-11 rounded-lg bg-brand-600 px-8 font-bold text-white">กลับไปแก้ไข</button></div>`, 'max-w-md');
  }

  function nextReference(date) {
    const prefix = `CPG${String(date.getFullYear() + 543).slice(-2)}${pad(date.getMonth() + 1)}`;
    const used = new Set([...rows, ...(typeof transferTrackingRows !== 'undefined' ? transferTrackingRows : [])].map(row => row.refNo));
    for (let sequence = 900001; sequence < 1000000; sequence += 1) {
      const reference = `${prefix}${sequence}`;
      if (!used.has(reference)) return reference;
    }
    throw new Error('ไม่มีเลขที่รายการโอนว่างสำหรับ Mockup');
  }

  function extendDateRange(date) {
    const from = document.getElementById('transferDateFrom');
    const to = document.getElementById('transferDateTo');
    const today = isoDate(date);
    if (from && (!from.value || from.value > today)) from.value = today;
    if (to && (!to.value || to.value < today)) to.value = today;
    window.refreshBuddhistDatepickers?.();
  }

  function syncApprovedClaim() {
    const claim = claimInfo();
    const beneficiaries = readBeneficiaries();
    const displayedTotal = amount(document.getElementById('ddPayTotal')?.textContent);
    const sum = beneficiaries.reduce((total, item) => total + item.amount, 0);
    if (!claim.claimNo || !claim.insured || !beneficiaries.length) {
      showError('ไม่พบข้อมูลเคลมหรือผู้รับผลประโยชน์ กรุณาตรวจสอบก่อนยืนยัน');
      return null;
    }
    if (beneficiaries.some(item => !item.name || !item.relation || !item.bank || !item.account || item.amount <= 0)) {
      showError('กรุณาตรวจสอบชื่อ ความสัมพันธ์ บัญชี และยอดเงินของผู้รับผลประโยชน์ทุกราย');
      return null;
    }
    if (Math.round(sum * 100) !== Math.round(displayedTotal * 100)) {
      showError(`ยอดผู้รับผลประโยชน์รวม ${money(sum)} บาท ไม่ตรงกับยอดโอนรวม ${money(displayedTotal)} บาท`);
      return null;
    }

    const date = new Date();
    const created = nowText(date);
    const activeKeys = new Set();
    const saved = beneficiaries.map(item => {
      const sourceKey = `death:${claim.claimNo}:${item.index}`;
      activeKeys.add(sourceKey);
      const previousIndex = rows.findIndex(row => row.sourceKey === sourceKey);
      const previous = previousIndex >= 0 ? rows[previousIndex] : null;
      const refNo = previous?.refNo || nextReference(date);
      const row = {
        sourceKey, refNo, claimNo: claim.claimNo, caseNo: claim.caseNo,
        created: previous?.created || created, notifyDate: '-', transferDate: '-',
        insured: claim.insured, school: '', product: claim.product, claimType: 'Death&Disability',
        amount: item.amount, status: 'รอโอนเงิน', statusKey: 'wait', statusFilter: 'pending',
        bank: item.bank, account: item.account, payee: item.name,
        payeeRelation: item.relation, recipient: item.name,
        recipientCaption: `${item.relation} · ผู้รับผลประโยชน์ลำดับที่ ${item.index}`,
        branch: claim.branch, canEdit: false, canPay: true, transferKind: 'Death&Disability',
        beneficiaries: [{
          relation: item.relation, name: item.name,
          bank: `${item.bank} ${item.account} ${item.name}`,
          amount: item.amount,
          note: `ผู้รับผลประโยชน์ลำดับที่ ${item.index} · ${item.relation}`
        }],
        claims: [{ claimNo: claim.claimNo, caseNo: claim.caseNo, insured: claim.insured, amount: item.amount, product: claim.product }]
      };
      if (previousIndex >= 0) rows.splice(previousIndex, 1);
      rows.unshift(row);
      return row;
    });
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (rows[index].sourceKey?.startsWith(`death:${claim.claimNo}:`) && !activeKeys.has(rows[index].sourceKey)) rows.splice(index, 1);
    }
    extendDateRange(date);
    return { claim, rows: saved, total: sum };
  }

  window.openDeathTransfersInTracking = function () {
    closeModal();
    showTransferTrackingPage();
    setTransferTrackingType('customer');
    resetTransferTrackingFilters();
  };

  function showSaved(saved) {
    const count = saved.rows.length;
    showModal(`<div class="p-6 text-center"><div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white"><span class="material-icons-round !text-4xl" aria-hidden="true">check</span></div><h3 class="mt-3 text-2xl font-extrabold text-green-700">บันทึกผลพิจารณาสำเร็จ</h3><p class="mt-2 text-slate-600">ส่ง ${count} รายการตามรายผู้รับผลประโยชน์ไปที่ติดตามการโอนเงินแล้ว สถานะรอโอนเงิน</p><div class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-left text-sm text-slate-700"><strong>${esc(saved.claim.claimNo)}</strong> · ยอดรวม ${money(saved.total)} บาท<br>${saved.rows.map(row => `${esc(row.refNo)} — ${esc(row.payee)} ${money(row.amount)} บาท`).join('<br>')}</div><div class="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onclick="closeModal()" class="h-11 rounded-lg border border-slate-300 px-6 font-bold text-slate-700">ปิด</button><button type="button" onclick="openDeathTransfersInTracking()" class="h-11 rounded-lg bg-brand-600 px-6 font-bold text-white">ดูรายการโอนเงิน</button></div></div>`, 'max-w-lg');
  }

  const originalConfirm = window.confirmDdDecisionSave;
  window.confirmDdDecisionSave = function () {
    const decision = document.querySelector('#ddDecisionSection .dd-decision-btn.active')?.dataset.decision;
    if (decision !== 'approve') return originalConfirm?.apply(this, arguments);
    const saved = syncApprovedClaim();
    if (saved) showSaved(saved);
  };

  const originalShow = window.showConsiderDeathDetail;
  window.showConsiderDeathDetail = function (claimCode) {
    const result = originalShow?.apply(this, arguments);
    const claim = claimCode || document.getElementById('ddClaimCodeValue')?.textContent?.trim() || '';
    const mock = beneficiaryMocks[claim];
    if (!mock) return result;
    const box = document.querySelector('#considerDeathDetailPage .dd-beneficiary-box');
    if (!box) return result;
    box.querySelector('.dd-beneficiary-head strong').textContent = 'ผู้รับผลประโยชน์ ลำดับที่ 1';
    const update = (needle, value) => { const target = field(box, needle); if (target) target.textContent = value; };
    update('ความสัมพันธ์', mock.relation);
    update('เลขบัตรประชาชน', mock.idNo);
    update('ชื่อ-นามสกุล', mock.name);
    update('เบอร์โทรศัพท์', mock.phone);
    update('บัญชีรับสินไหม', `${mock.bank} ${mock.account} ${mock.name}`);
    update('จำนวนเงิน', money(mock.amount));
    document.getElementById('ddPayTotal').textContent = `จำนวนเงินโอนรวม : ${money(mock.amount)} บาท`;
    document.getElementById('ddClaimCodeValue').textContent = claim;
    document.getElementById('ddCaseCodeValue').textContent = claim.replace(/^CLPA/, 'CCPA').replace(/^CL/, 'CC');
    document.getElementById('ddTransferAccountDetail')?.classList.add('hidden');
    document.querySelectorAll('#ddDecisionSection .dd-decision-btn.active').forEach(button => button.classList.remove('active'));
    const dynamic = document.getElementById('ddDecisionDynamicFields');
    if (dynamic) { dynamic.classList.add('hidden'); dynamic.innerHTML = ''; }
    return result;
  };
})();
