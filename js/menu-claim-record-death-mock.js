/* แจ้งเคลม > ค้นหาการแจ้งเคลม: session-only Death Claim detail example. */
(function () {
  'use strict';

  const deathClaim = Object.freeze({
    cpg: 'CPG6910009051', cl: 'CL6910009051', caseNo: 'CC69109051',
    date: '10/10/2569 09:30:00', name: 'นายสมชาย ตัวอย่าง',
    id: '1-XXXX-XXXXX-51-1', passport: '', appId: 'APP6910009051',
    product: 'PH', plan: 'PH Life & Disability',
    coverageStart: '01/01/2569', coverageEnd: '31/12/2569',
    province: 'กรุงเทพมหานคร', amount: '500,000.00', status: 'รอโอน',
    transferDate: '-', claimType: 'Death Claim',
    incidentDate: '09/10/2569', deathDate: '09/10/2569',
    documentReceivedAt: '10/10/2569', documentCompletedAt: '10/10/2569',
    cause: 'อุบัติเหตุ', deathPlace: 'สถานพยาบาล', deathHospital: 'โรงพยาบาลพระรามเก้า',
    note: 'ญาติแจ้งว่าเสียชีวิตระหว่างเข้ารับการรักษา',
    complaint: 'เสียชีวิตจากอุบัติเหตุทางถนน',
    diagnosis: 'T07 : การบาดเจ็บหลายตำแหน่ง',
    beneficiaries: Object.freeze([
      Object.freeze({ name: 'นางสาวมณีรัตน์ ตัวอย่าง', relation: 'คู่สมรส', id: '1-XXXX-XXXXX-52-2', phone: '08X-XXX-9051', bank: 'ธนาคารกรุงไทย', account: 'XXX-X-09051-X', amount: '300,000.00' }),
      Object.freeze({ name: 'นายธนกร ตัวอย่าง', relation: 'บุตร', id: '1-XXXX-XXXXX-53-3', phone: '08X-XXX-9052', bank: 'ธนาคารกสิกรไทย', account: 'XXX-X-09052-X', amount: '200,000.00' })
    ])
  });
  const homeClaim = Object.freeze({
    ...deathClaim, cpg:'CPG6910009052', cl:'CL6910009052', caseNo:'CC69109052',
    date:'11/10/2569 10:15:00', name:'นางวิไล ตัวอย่าง', id:'1-XXXX-XXXXX-56-6', appId:'APP6910009052',
    amount:'200,000.00', cause:'เจ็บป่วย', deathPlace:'ที่บ้าน', deathHospital:'',
    complaint:'เสียชีวิตที่บ้าน', diagnosis:'—', note:'ผู้แจ้งระบุว่าเสียชีวิตที่บ้าน',
    beneficiaries:Object.freeze([Object.freeze({name:'นายศุภชัย ตัวอย่าง',relation:'บุตร',id:'1-XXXX-XXXXX-54-4',phone:'08X-XXX-9053',bank:'ธนาคารกรุงไทย',account:'XXX-X-09053-X',amount:'200,000.00'})])
  });
  const otherPlaceClaim = Object.freeze({
    ...deathClaim, cpg:'CPG6910009053', cl:'CL6910009053', caseNo:'CC69109053',
    date:'12/10/2569 11:20:00', name:'นายประทีป ตัวอย่าง', id:'1-XXXX-XXXXX-57-7', appId:'APP6910009053',
    amount:'300,000.00', deathPlace:'อื่นๆ', deathHospital:'', deathPlaceOther:'บ้านพักญาติ จังหวัดนนทบุรี',
    complaint:'เสียชีวิตนอกสถานพยาบาล', diagnosis:'—', note:'ผู้แจ้งระบุสถานที่เสียชีวิตเพิ่มเติม',
    beneficiaries:Object.freeze([Object.freeze({name:'นางสาวกมล ตัวอย่าง',relation:'บุตร',id:'1-XXXX-XXXXX-55-5',phone:'08X-XXX-9054',bank:'ธนาคารกสิกรไทย',account:'XXX-X-09054-X',amount:'300,000.00'})])
  });
  const manyBeneficiariesClaim = Object.freeze({
    ...deathClaim, cpg:'CPG6910009054', cl:'CL6910009054', caseNo:'CC69109054',
    date:'13/10/2569 14:10:00', name:'นายอนันต์ ตัวอย่าง', id:'1-XXXX-XXXXX-58-8', appId:'APP6910009054',
    beneficiaries:Object.freeze([
      Object.freeze({name:'นางสาวพิมพ์ใจ ตัวอย่าง',relation:'คู่สมรส',id:'1-XXXX-XXXXX-59-9',phone:'08X-XXX-9055',bank:'ธนาคารกรุงไทย',account:'XXX-X-09055-X',amount:'200,000.00'}),
      Object.freeze({name:'นายกิตติ ตัวอย่าง',relation:'บุตร',id:'1-XXXX-XXXXX-60-0',phone:'08X-XXX-9056',bank:'ธนาคารกสิกรไทย',account:'XXX-X-09056-X',amount:'125,000.00'}),
      Object.freeze({name:'นางสาวลดา ตัวอย่าง',relation:'บุตร',id:'1-XXXX-XXXXX-61-1',phone:'08X-XXX-9057',bank:'ธนาคารกรุงเทพ',account:'XXX-X-09057-X',amount:'100,000.00'}),
      Object.freeze({name:'นายประเสริฐ ตัวอย่าง',relation:'บิดา',id:'1-XXXX-XXXXX-62-2',phone:'08X-XXX-9058',bank:'ธนาคารไทยพาณิชย์',account:'XXX-X-09058-X',amount:'75,000.00'})
    ])
  });
  window.claimRecordDeathMockRows = [deathClaim, homeClaim, otherPlaceClaim, manyBeneficiariesClaim];

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function placeFields(record) {
    const place = String(record.deathPlace || '').trim();
    if (place === 'สถานพยาบาล' || place === 'โรงพยาบาล') return [['สถานที่เสียชีวิต', 'สถานพยาบาล'], ['โรงพยาบาล', record.deathHospital || record.hospital || '—']];
    if (place === 'ที่บ้าน') return [['สถานที่เสียชีวิต', 'เสียชีวิตที่บ้าน']];
    if (place === 'อื่นๆ' || place === 'อื่น ๆ') return [['สถานที่เสียชีวิต', 'อื่นๆ'], ['ระบุสถานที่เสียชีวิต', record.deathPlaceOther || record.otherDeathPlace || '—']];
    return [['สถานที่เสียชีวิต', '—']];
  }
  function renderBeneficiaries(record) {
    const grid = document.getElementById('crdDeathBeneficiaryGrid');
    if (!grid) return;
    const people = Array.isArray(record.beneficiaries) ? record.beneficiaries : (record.beneficiary ? [record.beneficiary] : []);
    const amounts = people.map(person => String(person.amount || '').trim()).map(value => value ? Number(value.replace(/,/g, '')) : NaN);
    const hasTotal = people.length > 0 && amounts.every(amount => Number.isFinite(amount) && amount >= 0);
    const totalAmount = hasTotal ? amounts.reduce((sum, amount) => sum + amount, 0) : 0;
    const total = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('crdDeathBeneficiaryCount').innerHTML = `<div class="crd-death-beneficiary-overview-title"><span class="material-icons-round" aria-hidden="true">groups</span><div><small>ข้อมูล Death Claim</small><strong>ผู้รับผลประโยชน์</strong></div></div><div class="crd-death-beneficiary-overview-stat"><small>จำนวนทั้งหมด</small><strong>${people.length} คน</strong></div>${hasTotal ? `<div class="crd-death-beneficiary-overview-stat crd-death-beneficiary-overview-total"><small>ยอดรวมผู้รับผลประโยชน์</small><strong>${escapeHtml(total)} <span>บาท</span></strong></div>` : ''}`;
    const tab = document.getElementById('crdTabButtonBeneficiary');
    if (tab) tab.setAttribute('aria-label', `ผู้รับผลประโยชน์ ${people.length} คน`);
    grid.innerHTML = people.length ? people.map((person, index) => {
      return `<article class="crd-death-beneficiary" role="listitem">
        <div class="crd-death-beneficiary-head">
          <span class="crd-death-beneficiary-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div class="crd-death-beneficiary-identity"><small>ผู้รับผลประโยชน์ลำดับที่ ${index + 1}</small><h3>${escapeHtml(person.name || '—')}</h3><span class="crd-death-beneficiary-relation">${escapeHtml(person.relation || '—')}</span></div>
          <div class="crd-death-beneficiary-amount"><span>จำนวนเงิน</span><strong>${escapeHtml(person.amount || '—')}${person.amount ? ' บาท' : ''}</strong></div>
        </div>
        <dl><div><dt>เลขบัตรประชาชน</dt><dd>${escapeHtml(person.id || '—')}</dd></div><div><dt>เบอร์โทรศัพท์</dt><dd>${escapeHtml(person.phone || '—')}</dd></div><div><dt>บัญชีรับสินไหม</dt><dd>${escapeHtml([person.bank, person.account].filter(Boolean).join(' ') || '—')}</dd></div></dl>
      </article>`;
    }).join('') : '<p class="crd-death-beneficiary-empty">ยังไม่มีข้อมูลผู้รับผลประโยชน์</p>';
  }

  function ensureBeneficiaryTab() {
    const tabList = document.querySelector('#claimRecordPhDetailPage .crd-tabs');
    const claimTab = document.getElementById('crdTabButtonClaim');
    const claimPanel = document.getElementById('crdTabClaim');
    if (!tabList || !claimTab || !claimPanel) return;
    if (document.getElementById('crdTabButtonBeneficiary')) return;
    const tab = document.createElement('button');
    tab.id = 'crdTabButtonBeneficiary';
    tab.type = 'button';
    tab.className = 'crd-tab hidden';
    tab.dataset.crdTab = 'beneficiary';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', 'crdTabBeneficiary');
    tab.tabIndex = -1;
    tab.hidden = true;
    tab.textContent = 'ผู้รับผลประโยชน์';
    tab.addEventListener('click', () => window.switchClaimRecordDetailTab('beneficiary'));
    claimTab.insertAdjacentElement('afterend', tab);
    const panel = document.createElement('div');
    panel.id = 'crdTabBeneficiary';
    panel.className = 'crd-tab-panel hidden';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.hidden = true;
    panel.innerHTML = '<div id="crdDeathBeneficiaryCount" class="crd-death-beneficiary-count"></div><div id="crdDeathBeneficiaryGrid" class="crd-death-beneficiaries" role="list" aria-label="รายชื่อผู้รับผลประโยชน์"></div>';
    claimPanel.insertAdjacentElement('afterend', panel);
  }

  function showBeneficiaryTab(show) {
    const tab = document.getElementById('crdTabButtonBeneficiary');
    const payeeCard = document.getElementById('crdBeneficiaryGrid')?.closest('.crd-card');
    if (tab) { tab.hidden = !show; tab.classList.toggle('hidden', !show); }
    if (payeeCard) { payeeCard.hidden = show; payeeCard.classList.toggle('hidden', show); }
    if (!show) {
      const panel = document.getElementById('crdTabBeneficiary');
      if (panel) { panel.hidden = true; panel.classList.add('hidden'); }
      document.getElementById('crdDeathBeneficiaryGrid')?.replaceChildren();
    }
  }

  function ensureDeathSection() {
    let section = document.getElementById('claimRecordDeathSection');
    if (section) return section;
    const beneficiaryCard = document.getElementById('crdBeneficiaryGrid')?.closest('.crd-card');
    if (!beneficiaryCard) return null;
    section = document.createElement('section');
    section.id = 'claimRecordDeathSection';
    section.className = 'crd-card crd-death-card mt-4 hidden';
    beneficiaryCard.insertAdjacentElement('afterend', section);
    return section;
  }

  function renderDeathSection(record) {
    const section = ensureDeathSection();
    if (!section) return;
    const fields = [
      ['ประเภทการเคลม', 'Death Claim'],
      ['เหตุของการเคลม', record.cause],
      ['ประเภทความคุ้มครอง', 'เสียชีวิต'],
      ...placeFields(record),
      ['วันที่เกิดเหตุ', record.incidentDate],
      ['วันที่เสียชีวิต', record.deathDate],
      ['วันที่รับเอกสาร', record.documentReceivedAt],
      ['วันที่เอกสารครบ', record.documentCompletedAt],
      ['อาการสำคัญ', record.complaint],
      ['คำวินิจฉัย 1', record.diagnosis],
      ['หมายเหตุ', record.note],
      ['ผลการพิจารณา', 'อนุมัติ']
    ];
    section.innerHTML = `<div class="crd-section-head"><span class="material-icons-round" aria-hidden="true">healing</span>ข้อมูลเคลม Death Claim <span class="crd-death-demo-tag">ข้อมูลตัวอย่าง</span></div>
      <div class="crd-death-summary"><div><span>เลขที่ CL</span><strong>${escapeHtml(record.cl)}</strong></div><div><span>เลขที่ Case</span><strong>${escapeHtml(record.caseNo)}</strong></div><div><span>สินไหมที่อนุมัติ</span><strong>${escapeHtml(record.amount)} บาท</strong></div></div>
      <div class="crd-death-grid">${fields.map(([label, value]) => `<div class="crd-death-field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></div>`).join('')}</div>`;
    section.classList.remove('hidden');
  }

  function deathPayload(record) {
    return {
      subtitle: 'แจ้งเคลม / ค้นหาการแจ้งเคลม / ดูรายละเอียด Death Claim',
      info: [
        { icon: 'description', label: 'เลขที่ CPG', value: record.cpg, accent: true },
        { icon: 'badge', label: 'ผู้แจ้งเคลม', value: 'เจ้าหน้าที่ตัวอย่าง', accent: true },
        { icon: 'location_on', label: 'สาขาเมื่อเคลม', value: record.province, accent: true },
        { icon: 'sync', label: 'สถานะการโอน', value: record.status },
        { icon: 'calendar_month', label: 'วันที่โอนเงิน', value: '-', accent: true },
        { icon: 'payments', label: 'จำนวนเงินโอนรวม', value: record.amount, accent: true }
      ],
      holder: [['AppID', record.appId], ['ชื่อผู้ถือกรมธรรม์', record.name]],
      beneficiary: [],
      claimTable: [{ cl: record.cl, caseNo: record.caseNo, name: record.name,
        accidentDate: record.incidentDate, admitDate: '-', dischargeDate: '-',
        claimInfo: `${record.cause || '—'} / เสียชีวิต / Death Claim`, amount: record.amount }],
      history: [
        { time: record.date, title: 'รับแจ้ง Death Claim', desc: `บันทึกรายการ ${record.cl} (ข้อมูลตัวอย่าง)` },
        { time: record.date, title: 'อนุมัติสินไหม', desc: `อนุมัติสินไหม ${record.amount} บาท (ข้อมูลตัวอย่าง)` }
      ],
      transfers: [['เลข CPG', record.cpg], ['เลข CL', record.cl], ['ยอดโอน', `${record.amount} บาท`], ['สถานะล่าสุด', record.status]],
      deduct: [['ยอดโอนสุทธิ', `${record.amount} บาท`], ['ยอดตัดจ่าย', '0.00 บาท'], ['วันที่ตัดจ่าย', '-']]
    };
  }

  function addQuickExample() {
    const form = document.getElementById('claimRecordSearchForm');
    if (!form || document.getElementById('claimRecordDeathExample')) return;
    const examples = document.createElement('div');
    examples.className = 'crd-death-examples';
    [[deathClaim,'Death Claim · โรงพยาบาล / ผู้รับ 2 คน'],[homeClaim,'Death Claim · ที่บ้าน'],[otherPlaceClaim,'Death Claim · อื่นๆ'],[manyBeneficiariesClaim,'Death Claim · ผู้รับ 4 คน']].forEach(([record,label],index) => {
      const button = document.createElement('button');
      button.id = index === 0 ? 'claimRecordDeathExample' : `claimRecordDeathExample${index+1}`;
      button.type = 'button';
      button.className = 'crd-death-example';
      button.innerHTML = `<span class="material-icons-round" aria-hidden="true">favorite</span>${label}<span class="material-icons-round" aria-hidden="true">arrow_forward</span>`;
      button.addEventListener('click', () => {
        selectClaimRecordProduct('PH');
        document.getElementById('claimRecordSearchType').value = 'เลขที่ CL';
        document.getElementById('claimRecordKeyword').value = record.cl;
        searchClaimRecords();
        document.getElementById('claimRecordResultSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      examples.appendChild(button);
    });
    form.appendChild(examples);
  }

  function bind() {
    ensureBeneficiaryTab();
    const originalSwitchTab = window.switchClaimRecordDetailTab;
    if (typeof originalSwitchTab === 'function') window.switchClaimRecordDetailTab = function (tab) {
      if (tab === 'beneficiary') {
        if (document.getElementById('crdTabButtonBeneficiary')?.hidden) return;
        document.querySelectorAll('#claimRecordPhDetailPage .crd-tab').forEach(button => {
          const active = button.dataset.crdTab === tab;
          button.classList.toggle('active', active);
          button.setAttribute('aria-selected', String(active));
          button.tabIndex = active ? 0 : -1;
        });
        ['Claim', 'History', 'Transfer', 'Deduct', 'Beneficiary'].forEach(key => {
          const panel = document.getElementById(`crdTab${key}`);
          if (panel) { panel.hidden = key !== 'Beneficiary'; panel.classList.toggle('hidden', key !== 'Beneficiary'); }
        });
        return;
      }
      const result = originalSwitchTab.apply(this, arguments);
      const panel = document.getElementById('crdTabBeneficiary');
      if (panel) { panel.hidden = true; panel.classList.add('hidden'); }
      return result;
    };
    window.claimRecordDeathMock = {
      renderDetail(record) {
        const section = ensureDeathSection();
        section?.classList.add('hidden');
        document.getElementById('claimRecordPhDetailPage')?.classList.add('crd-death-detail');
        renderClaimRecordDetailPage(deathPayload(record));
        showBeneficiaryTab(true);
        window.switchClaimRecordDetailTab('claim');
        renderBeneficiaries(record);
        renderDeathSection(record);
      },
      placeFields,
      resetDetail() {
        ensureDeathSection()?.classList.add('hidden');
        document.getElementById('claimRecordPhDetailPage')?.classList.remove('crd-death-detail');
        showBeneficiaryTab(false);
        window.switchClaimRecordDetailTab('claim');
      }
    };
    document.addEventListener('claimagent:record-detail-opened', event => {
      if (!String(event.detail?.payload?.subtitle || '').includes('Death Claim') &&
          document.getElementById('claimRecordPhDetailPage')?.classList.contains('crd-death-detail')) {
        window.claimRecordDeathMock.resetDetail();
      }
    });
    document.getElementById('crdTabClaim')?.addEventListener('click', event => {
      if (!document.getElementById('claimRecordPhDetailPage')?.classList.contains('crd-death-detail')) return;
      if (!event.target.closest('.crd-action-btn.doc')) return;
      const message = document.getElementById('crdClaimActionMessage');
      if (!message) return;
      message.textContent = 'ดูเอกสารแนบสำหรับ Death Claim เป็นตัวอย่างปุ่มใน Mockup ยังไม่มีเอกสารจริง';
      message.classList.remove('hidden');
    });
    addQuickExample();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
