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
    cause: 'อุบัติเหตุ', deathCause: 'อุบัติเหตุทางถนน',
    complaint: 'เสียชีวิตจากอุบัติเหตุทางถนน',
    diagnosis: 'T07 : การบาดเจ็บหลายตำแหน่ง',
    beneficiary: Object.freeze({ name: 'นางสาวมณีรัตน์ ตัวอย่าง', relation: 'คู่สมรส',
      id: '1-XXXX-XXXXX-52-2', phone: '08X-XXX-9051',
      bank: 'ธนาคารกรุงไทย', account: 'XXX-X-09051-X' })
  });
  window.claimRecordDeathMockRows = [deathClaim];

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

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
      ['สาเหตุการเสียชีวิต', record.deathCause],
      ['วันที่เกิดเหตุ', record.incidentDate],
      ['วันที่เสียชีวิต', record.deathDate],
      ['วันที่รับเอกสาร', record.documentReceivedAt],
      ['วันที่เอกสารครบ', record.documentCompletedAt],
      ['สถานพยาบาล', '-'],
      ['อาการสำคัญ', record.complaint],
      ['คำวินิจฉัย 1', record.diagnosis],
      ['ผลการพิจารณา', 'อนุมัติ']
    ];
    section.innerHTML = `<div class="crd-section-head"><span class="material-icons-round" aria-hidden="true">healing</span>ข้อมูลเคลม Death Claim <span class="crd-death-demo-tag">ข้อมูลตัวอย่าง</span></div>
      <div class="crd-death-summary"><div><span>เลขที่ CL</span><strong>${escapeHtml(record.cl)}</strong></div><div><span>เลขที่ Case</span><strong>${escapeHtml(record.caseNo)}</strong></div><div><span>สินไหมที่อนุมัติ</span><strong>${escapeHtml(record.amount)} บาท</strong></div></div>
      <div class="crd-death-grid">${fields.map(([label, value]) => `<div class="crd-death-field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></div>`).join('')}</div>`;
    section.classList.remove('hidden');
  }

  function deathPayload(record) {
    const beneficiary = record.beneficiary;
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
      beneficiary: [
        ['ผู้รับผลประโยชน์ ลำดับที่ 1', beneficiary.name],
        ['ความสัมพันธ์ผู้รับสินไหม', beneficiary.relation],
        ['เลขบัตรประชาชน', beneficiary.id],
        ['เบอร์โทรศัพท์', beneficiary.phone],
        ['บัญชีรับสินไหม', `${beneficiary.bank} ${beneficiary.account}`],
        ['จำนวนเงิน', `${record.amount} บาท`]
      ],
      claimTable: [{ cl: record.cl, caseNo: record.caseNo, name: record.name,
        accidentDate: record.incidentDate, admitDate: '-', dischargeDate: '-',
        claimInfo: 'อุบัติเหตุ / เสียชีวิต / Death Claim', amount: record.amount }],
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
    const button = document.createElement('button');
    button.id = 'claimRecordDeathExample';
    button.type = 'button';
    button.className = 'crd-death-example';
    button.innerHTML = '<span class="material-icons-round" aria-hidden="true">favorite</span>ลองดู Death Claim ตัวอย่าง <span class="material-icons-round" aria-hidden="true">arrow_forward</span>';
    button.addEventListener('click', () => {
      selectClaimRecordProduct('PH');
      document.getElementById('claimRecordSearchType').value = 'เลขที่ CL';
      document.getElementById('claimRecordKeyword').value = deathClaim.cl;
      searchClaimRecords();
      document.getElementById('claimRecordResultSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    form.appendChild(button);
  }

  function bind() {
    window.claimRecordDeathMock = {
      renderDetail(record) {
        const section = ensureDeathSection();
        section?.classList.add('hidden');
        document.getElementById('claimRecordPhDetailPage')?.classList.add('crd-death-detail');
        renderClaimRecordDetailPage(deathPayload(record));
        renderDeathSection(record);
      },
      resetDetail() {
        ensureDeathSection()?.classList.add('hidden');
        document.getElementById('claimRecordPhDetailPage')?.classList.remove('crd-death-detail');
      }
    };
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
