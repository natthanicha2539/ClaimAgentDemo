/* งานเคลม > ค้นหาเคลม > ดูรายละเอียด: isolated, read-only MUI surface. */
(function () {
  'use strict';
  const pageId = 'customerClaimReadOnlyPage';
  let root, dependencies, request = 0;
  const sourceBase = new URL('.', document.currentScript.src);
  const originalRecord = window.openClaimRecordDetail;
  const originalHistory = window.openClaimSearchHistoryModal;
  const present = v => v !== undefined && v !== null && v !== '';
  const first = (...values) => values.find(present);
  const text = v => present(v) ? String(v) : '—';
  const amount = v => {
    if (!present(v)) return '—';
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  };
  const tone = value => /ไม่สำเร็จ|ไม่อนุมัติ|ปฏิเสธ|error|failed|rejected/i.test(value || '') ? 'error' : /รอ|warning|NPL|Exgratia/i.test(value || '') ? 'warning' : /อนุมัติ|สำเร็จ|ครบถ้วน|approved|success/i.test(value || '') ? 'success' : 'default';
  const transferStatus = value => {
    const status = String(value || '').trim();
    if (/ไม่สำเร็จ|ล้มเหลว|failed/i.test(status)) return 'โอนไม่สำเร็จ';
    if (/สำเร็จ|จ่ายแล้ว|โอนแล้ว|completed|paid/i.test(status)) return 'โอนสำเร็จ';
    if (/รอโอน(?:เงิน)?$/.test(status)) return 'รอโอน';
    if (/รอ|ดำเนินการ|ยังไม่จ่าย/.test(status)) return 'รอดำเนินการโอนเงิน';
    return '—';
  };
  const disbursementStatus = value => {
    const status = String(value || '').trim();
    if (/รับชำระสำเร็จ|รับเงินแล้ว|รับชำระแล้ว/.test(status)) return 'รับชำระสำเร็จ';
    if (/ตั้งเบิกสำเร็จ|ตั้งเบิกแล้ว/.test(status)) return 'ตั้งเบิกสำเร็จ';
    if (/รอตั้งเบิก/.test(status)) return 'รอตั้งเบิก';
    return '';
  };
  const mainTabs = [
    ['claim', 'ข้อมูลเคลม', 'description'],
    ['activity', 'ประวัติการทำรายการ', 'history'],
    ['coverage', 'ความคุ้มครอง', 'verified_user'],
    ['history', 'ประวัติการเคลม', 'folder_open'],
    ['memo', 'บันทึกข้อความ', 'sticky_note_2'],
    ['payment', 'รายละเอียดการจ่ายเงิน', 'account_balance_wallet']
  ];
  const hospitalClaim = value => /โรงพยาบาล|hospital/i.test(String(value || ''));
  const deathClaim = value => /Death\s*&\s*Disability|เสียชีวิต|ทุพพลภาพ|สูญเสียอวัยวะ/i.test(String(value || ''));
  const yesNo = value => value === true || /^(?:yes|true|1|ใช่)$/i.test(String(value ?? '').trim()) ? 'ใช่' : value === false || /^(?:no|false|0|ไม่|ไม่ใช่)$/i.test(String(value ?? '').trim()) ? 'ไม่ใช่' : undefined;
  const datePart = value => present(value) ? String(value).trim().split(/[T\s]/)[0] : undefined;
  const timePart = value => present(value) ? String(value).trim().match(/(?:T|\s)(\d{1,2}:\d{2})(?::\d{2})?/)?.[1] : undefined;
  const medicalNecessityLabels = {
    PAIN_MANAGEMENT: 'การบรรเทาและลดอาการปวด (Pain Management)',
    RESTORING_MOBILITY: 'การเพิ่มและฟื้นฟูการเคลื่อนไหว (Restoring Mobility & Range of Motion)',
    POST_INJURY_POST_SURGICAL_REHAB: 'การฟื้นฟูผู้ป่วยหลังการบาดเจ็บหรือผ่าตัด (Post-injury & Post-surgical Rehabilitation)'
  };
  function loadScript(name) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/' + name, sourceBase).href;
      s.onload = resolve;
      s.onerror = () => { s.remove(); reject(new Error('โหลดส่วนแสดงผลไม่สำเร็จ')); };
      document.head.appendChild(s);
    });
  }
  function ready() {
    if (!dependencies) dependencies = (async () => {
      if (!window.React) await loadScript('react.production.min.js');
      if (!window.ReactDOM) await loadScript('react-dom.production.min.js');
      if (!window.MaterialUI) await loadScript('material-ui.production.min.js');
    })().catch(e => { dependencies = null; throw e; });
    return dependencies;
  }
  function page() {
    let node = document.getElementById(pageId);
    if (!node) {
      node = document.createElement('section');
      node.id = pageId;
      node.className = 'page hidden';
      document.getElementById('claimSearchPage').parentElement.appendChild(node);
      if (typeof claimPages !== 'undefined' && !claimPages.includes(pageId)) claimPages.push(pageId);
      const style = document.createElement('link');
      style.rel = 'stylesheet'; style.href = new URL('../css/customer-claim-detail.css', sourceBase).href;
      document.head.appendChild(style);
    }
    return node;
  }
  function normalize(record, insured, history) {
    const c = { ...record, ...(record.claimDetail || {}) };
    const f = record.financial || {};
    const dateTime = (date, time) => present(date) ? [date, time].filter(present).join(' ') : undefined;
    return {
      ...c,
      incidentDate: dateTime(c.incidentDate, c.incidentTime),
      admitDate: dateTime(c.admitDate, c.admitTime),
      dischargeDate: dateTime(c.dischargeDate, c.dischargeTime),
      insured, schoolData: record.schoolData || insured.schoolData || {},
      product: first(record.product, insured.product, typeof claimRecordProduct !== 'undefined' ? claimRecordProduct : ''),
      name: first(record.name, insured.name), claimNo: first(record.claimNo, record.cl),
      appId: first(record.appId, insured.appId), plan: first(record.plan, insured.plan),
      claimStatus: first(record.claimStatus, history ? record.status : undefined),
      notifiedDate: first(c.notifiedDate, record.createDate, record.date),
      decision: typeof record.decision === 'object' ? record.decision : { result: record.decision },
      paymentStatus: first(record.paymentStatus, history ? undefined : record.status),
      financial: { ...f, receipt: first(f.receipt, record.claimAmount), approvedNet: first(f.approvedNet, record.approvedNet), transfer: first(f.transfer, record.transferAmount, history ? record.paidAmount : record.amount) },
      school: first(record.school, insured.school),
      documents: Array.isArray(record.documents) ? record.documents : [],
      expenses: Array.isArray(record.expenses) ? record.expenses : [],
      ipdCompensation: Array.isArray(record.ipdCompensation) ? record.ipdCompensation : []
    };
  }
  // Presentation-only mock enrichment for legacy demo records. Never writes to source rows.
  function mockDetail(d, record) {
    if (record.financial || record.expenses || record.documents) return d;
    const pa = d.product === 'PA';
    const state = first(record.itemStatus, d.claimStatus);
    if (/รอ|ปฏิเสธ|ยกเลิก|ดำเนินการ/.test(String(state || ''))) {
      const rejected = state === 'ปฏิเสธ';
      const decided = rejected || state === 'ยกเลิก';
      const baseDate = first(d.notifiedDate, '22/08/2569 10:00:23');
      return {
        ...d, mock: true, claimStatus: state, paymentStatus: 'ยังไม่จ่าย',
        effectiveDate: pa ? first(d.effectiveDate, d.insured.effectiveDate, d.start, d.insured.start, '01/01/2569') : d.effectiveDate,
        financial: { receipt: first(record.claimAmount, record.amount), approvedNet: decided ? 0 : undefined, transfer: 0 },
        decision: { result: state, date: decided ? first(record.decisionDate, baseDate) : undefined, user: decided ? first(record.reviewer, '06418 - พิมพ์ชนก สุวรรณสุข') : undefined, reason: decided ? first(record.statusReason, d.statusReason) : undefined },
        expenses: [], documents: [], ipdCompensation: []
      };
    }
    const moneyValue = Number(String(first(d.financial.transfer, pa ? 1850 : 24850)).replace(/,/g, ''));
    const approved = Number.isFinite(moneyValue) && moneyValue > 0 ? moneyValue : (pa ? 1850 : 24850);
    const inferredTreatment = !pa && approved >= 5000 ? 'IPD' : 'OPD';
    const treatment = first(d.claimType, d.treatmentType, inferredTreatment);
    const ipd = treatment === 'IPD';
    const nonCovered = pa ? 150 : 250;
    const discount = pa ? 100 : 200;
    const exgratia = approved >= 1000 ? 100 : 0;
    const benefit = approved - exgratia;
    const receipt = approved + nonCovered + discount;
    const day = String(first(d.notifiedDate, '22/08/2569')).split(' ')[0];
    const dateAt = time => day + ' ' + time;
    const [reportDay, reportMonth, reportYear] = day.split('/').map(Number);
    const discharge = new Date(reportYear - 543, reportMonth - 1, reportDay + (ipd ? 2 : 0));
    const dischargeDay = `${String(discharge.getDate()).padStart(2,'0')}/${String(discharge.getMonth()+1).padStart(2,'0')}/${discharge.getFullYear()+543}`;
    const completedAt = time => dischargeDay + ' ' + time;
    const age = reportYear - (pa ? 2555 : 2534) - (reportMonth < 5 || (reportMonth === 5 && reportDay < 15) ? 1 : 0);
    const failed = /ไม่สำเร็จ/.test(d.paymentStatus || '');
    const pending = /รอ|ดำเนินการ/.test(d.paymentStatus || '');
    const caseNo = first(d.caseNo, text(d.claimNo).replace(/^CL(?:PA)?/, 'CC'));
    const base = Math.round(benefit * .45 * 100) / 100;
    const doctor = Math.round(benefit * .2 * 100) / 100;
    const other = Math.round((benefit - base - doctor) * 100) / 100;
    const expenses = [
      { item: 'ค่ายาและเวชภัณฑ์', receipt: base + discount, benefit: base, discount, nonCovered: 0, approved: base, nplExgratia: 0, note: 'ตามรายการใบเสร็จ' },
      { item: 'ค่าตรวจรักษาโดยแพทย์', receipt: doctor, benefit: doctor, discount: 0, nonCovered: 0, approved: doctor, nplExgratia: 0, note: 'ไม่เกินวงเงินตามแผน' },
      { item: ipd ? 'ค่าห้อง อาหาร และการพยาบาล' : 'ค่าบริการทางการแพทย์', receipt: other, benefit: other, discount: 0, nonCovered: 0, approved: other, nplExgratia: 0, note: ipd ? 'พักรักษาตัว 2 วัน' : 'ทำแผลและค่าบริการผู้ป่วยนอก' },
      { item: 'เวชภัณฑ์นอกเงื่อนไขกรมธรรม์', receipt: nonCovered + exgratia, benefit: 0, discount: 0, nonCovered, approved: exgratia, nplExgratia: exgratia, note: exgratia ? 'อนุมัติ Exgratia บางส่วน' : 'ไม่อยู่ในความคุ้มครอง' }
    ];
    return {
      ...d, mock: true, caseNo,
      plan: first(d.plan, pa ? 'PA Student 30,000' : '621'),
      appId: first(d.appId, pa ? '69012888' : '014890'),
      claimStatus: first(d.claimStatus, 'Close'),
      school: pa ? first(d.school, 'โรงเรียนวัฒนาศึกษา') : undefined,
      branch: 'กรุงเทพมหานคร',
      idCard: first(d.idCard, d.id, d.insured.idCard, '1-XXXX-XXXXX-42-8'),
      dob: first(d.dob, d.insured.dob, pa ? '15/05/2555' : '15/05/2534'), age: first(d.age, d.insured.age, age + ' ปี'),
      phone: first(d.phone, d.insured.phone, '081-XXX-4521'), start: first(d.start, d.insured.start, '01/01/2569'), effectiveDate: pa ? first(d.effectiveDate, d.insured.effectiveDate, d.start, d.insured.start, '01/01/2569') : d.effectiveDate, end: first(d.end, d.insured.end, '31/12/2569'), appStatus: 'มีผลคุ้มครอง',
      insuredType: pa ? 'นักเรียน / นักศึกษา' : undefined, studentCard: pa ? first(d.studentCard, d.insured.studentCard, 'ST6900142') : undefined,
      schoolData: pa ? { appId: 'PA69001288', address: '128 ถนนประชาราษฎร์ แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800', contact: 'นางสาวปาริชาติ วัฒนกุล', position: 'ครูผู้ประสานงานประกันอุบัติเหตุ', contactId: '1-XXXX-XXXXX-65-2', phone: '02-XXX-1842 ต่อ 105', bank: 'ธนาคารกรุงไทย', account: 'XXX-X-45123-X', accountName: first(d.school, 'โรงเรียนวัฒนาศึกษา'), insurer: 'บริษัทประกันภัยตัวอย่าง จำกัด (มหาชน)', planType: 'อุบัติเหตุกลุ่มนักเรียน • ค่ารักษา 30,000 บาท/ครั้ง', status: 'มีผลคุ้มครอง', ...d.schoolData } : {},
      financial: { receipt, benefit, discount, nonCovered, nplExgratia: exgratia, approvedNet: approved, transfer: failed || pending ? 0 : approved },
      paymentStatus: first(d.paymentStatus, 'โอนสำเร็จ'),
      decision: { result: 'อนุมัติ', date: ipd ? (() => { const [dd,mm,yy] = day.split('/').map(Number); const v = new Date(yy - 543, mm - 1, dd + 2); return `${String(v.getDate()).padStart(2,'0')}/${String(v.getMonth()+1).padStart(2,'0')}/${v.getFullYear()+543} 14:20:50`; })() : dateAt('14:20:50'), user: '06590 - ณัฏฐณิชา โตรักษา', reason: 'เหตุและการรักษาอยู่ในช่วงความคุ้มครอง เอกสารประกอบครบถ้วน', note: 'ตรวจสอบใบเสร็จ ใบรับรองแพทย์ และข้อมูลผู้เอาประกันแล้ว', specialCondition: `ไม่คุ้มครองเวชภัณฑ์ส่วนเกิน ${amount(nonCovered)} บาท`, nplExgratiaReason: exgratia ? 'อนุมัติ Exgratia สำหรับเวชภัณฑ์จำเป็นประกอบการรักษา 100.00 บาท ตามผลพิจารณาตัวอย่าง' : 'ไม่มีการอนุมัติ NPL / Exgratia' },
      expenses,
      ipdCompensation: ipd ? [{ item: 'ค่าชดเชยรายวัน (แสดงแยกจากค่ารักษา)', days: 2, rate: 0, benefit: 0, approved: 0, note: 'แผนตัวอย่างนี้ไม่มีผลประโยชน์ค่าชดเชยรายวัน' }] : [],
      documents: (pa || hospitalClaim(d.claimCategory) || deathClaim(d.claimCategory) ? ['ใบเสร็จรับเงิน', 'ใบรับรองแพทย์', pa ? 'แบบแจ้งอุบัติเหตุนักเรียน' : 'แบบเรียกร้องค่าสินไหม', 'สำเนาหน้าบัญชีธนาคาร'] : ['เอกสารประกอบการพิจารณาเคลม(OCR)', 'เอกสารประกอบการพิจารณาเคลม']).map((name, i) => ({
        name: name + '.pdf', type: name, uploadDate: completedAt('13:' + (10+i) + ':00'), user: '06590 - ณัฏฐณิชา โตรักษา', status: 'ครบถ้วน', note: i < 2 ? 'ข้อมูลตรงกับรายการเคลม' : 'ตรวจสอบโดยเจ้าหน้าที่', mockPreview: true,
        ...(!pa && !hospitalClaim(d.claimCategory) && !deathClaim(d.claimCategory) && i === 0 ? { previewOptions: ['บัตรประชาชน', 'ใบรับรองแพทย์', 'ใบเสร็จ'].map((type, optionIndex) => ({ type, name: type + '.pdf', preview: { reference: first(d.caseNo, d.claimNo) + '-OCR' + (optionIndex + 1), documentDate: d.incidentDate, subject: type === 'บัตรประชาชน' ? 'ข้อมูลผู้เอาประกัน ' + text(d.name) : type === 'ใบรับรองแพทย์' ? 'เอกสารประกอบการวินิจฉัยและรักษา' : 'ค่ารักษาพยาบาล ' + amount(receipt) + ' บาท' } })) } : {})
      }))
    };
  }
  function reconcileSearchClaim(d, record, insured) {
    if (!record.claimWorkSearchSource) return d;
    if (record.financial && record.decision) return d;
    const paid = Number(String(record.paidAmount ?? '').replace(/,/g, ''));
    const hasPayment = Number.isFinite(paid) && paid > 0;
    return {
      ...d,
      name: first(record.name, insured.name),
      policyNo: first(record.policyNo, insured.policyNo),
      claimStatus: record.claimStatus,
      notifiedDate: record.createDate,
      chiefComplaint: record.chiefComplaint,
      incidentDate: record.incidentDate,
      appStatus: insured.appStatus,
      studentCard: insured.studentRef,
      paymentStatus: hasPayment ? 'จ่ายแล้ว' : 'ยังไม่จ่าย',
      financial: {
        receipt: record.claimAmount,
        approvedNet: record.claimStatus === 'อนุมัติ' ? record.paidAmount : undefined,
        transfer: record.paidAmount
      },
      decision: { result: record.claimStatus },
      expenses: [],
      ipdCompensation: []
    };
  }
  // Read-only demo fallback based on the coverage rows in the consideration pages.
  // Keep record-owned coverageItems/coverages when they are supplied.
  function considerationCoverageMock(isDeath, isHospital, claimType) {
    const organLoss = /ทุพพลภาพ|สูญเสียอวัยวะ/.test(String(claimType || ''));
    const rows = isDeath ? organLoss ? [
      ['ผลประโยชน์ทุพพลภาพ/สูญเสียอวัยวะ', 'สูญเสียมือขวาตั้งแต่ข้อมือ', '100,000.00', 'สูงสุด 1 ครั้ง', 'บาท'],
      ['ผลประโยชน์เพิ่มเติม', 'นิ้วหัวแม่มือขวา 1 ข้อ', '10,000.00', 'สูงสุด 1 ครั้ง', 'บาท']
    ] : [
      ['ผลประโยชน์กรณีเสียชีวิต', 'ขับขี่/โดยสารจักรยานยนต์', '120,000.00', 'สูงสุด 1 ครั้ง', 'บาท'],
      ['ทุนประกันเพิ่มเติม', 'ภัยสาธารณะ / MC', '—', 'ตามกรมธรรม์', '—']
    ] : [
      ['group', 'ความคุ้มครองกรณีเป็นผู้ป่วยใน (IPD)'],
      ['การดูแลโดยแพทย์ (ค่าแพทย์เยี่ยมไข้ ผู้ป่วยใน)', '700/วัน', '31,500', '45 วัน', 'ต่อครั้ง'],
      ['การรักษาโดยการผ่าตัด', '50,000/ครั้ง', '50,000', '', 'ต่อครั้ง ต่อโรค'],
      ['ค่ารักษาพยาบาล และค่าบริการทั่วไป', '15,000/ครั้ง', '15,000', '', 'ต่อครั้ง ต่อโรค'],
      ['ค่าห้องค่าอาหาร และการพยาบาลผู้ป่วยปกติ', '1,700/วัน', '76,500', '45 วัน', 'ต่อครั้ง'],
      ['ค่าห้องค่าอาหาร และการพยาบาลผู้ป่วยหนัก ICU', '5,000/วัน', '150,000', '30 วัน', 'ต่อครั้ง'],
      ['group', 'ความคุ้มครองกรณีเป็นผู้ป่วยนอก (OPD)'],
      ['ค่ารักษาพยาบาล จากโรคภัยไข้เจ็บ กรณีผู้ป่วยนอก OPD แบบเหมาจ่าย', '700/ครั้ง', '700', '9 ครั้ง', 'ต่อปี'],
      ['ค่ารักษาพยาบาลจากอุบัติเหตุ กรณีผู้ป่วยนอก OPD แบบเหมาจ่าย', '5,000/ครั้ง', '5,000', '', 'ต่อครั้ง ต่อโรค'],
      ['group', 'สิทธิพิเศษ ค่าชดเชย'],
      ['ค่าชดเชยผู้ป่วยใน ห้อง ICU (คืนละ)', '5,000/คืน', '150,000', '30 วัน', 'ต่อครั้ง ต่อโรค'],
      ['ค่าชดเชยผู้ป่วยใน ห้องปกติ (คืนละ)', '1,800/คืน', '81,000', '45 วัน', 'ต่อครั้ง'],
      ['ค่าชดเชยผู้ป่วยใน', '400/คืน', '40,000', '100 วัน', 'ต่อครั้ง ต่อโรค']
    ];
    if (!isHospital && !isDeath) rows.push(
      ['group', 'ความคุ้มครองการเสียชีวิต'],
      ['(อบ.2) กรณีเสียชีวิต สูญเสียอวัยวะ สายตา และทุพพลภาพ', '200,000/ครั้ง', '200,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['(อบ.2) การขับขี่ หรือโดยสารรถจักรยานยนต์', '100,000/ครั้ง', '100,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['(อบ.2) การถูกฆาตกรรม หรือ ถูกทำร้ายร่างกาย', '100,000/ครั้ง', '100,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['กรณีเสียชีวิตจากโรคภัยไข้เจ็บที่นอกเหนือจากอุบัติเหตุ (ค่าปลงศพ)', '30,000/ครั้ง', '30,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['group', 'สูญเสียอวัยวะ จากอุบัติเหตุทั่วไป'],
      ['สูญเสียอวัยวะ (อุบัติเหตุทั่วไป)', '200,000/ครั้ง', '200,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['สูญเสียอวัยวะ (อุบัติเหตุรถจักรยานยนต์)', '100,000/ครั้ง', '100,000', '1', 'ต่อครั้ง ต่อโรค'],
      ['group', 'หมวดอื่น ๆ (ไม่คุ้มครอง)'],
      ['ค่าบริการอื่น ๆ / ค่าใช้จ่ายอื่นที่ไม่ใช่การรักษาพยาบาล', '0', '', '', '']
    );
    return rows.map(row => row[0] === 'group' ? { kind: 'group', name: row[1] } : {
      name: row[0], coverage: row[1], maximum: row[2], maxCount: row[3], unit: row[4]
    });
  }
  function render(d, goBack, relatedClaims = []) {
    const h = React.createElement;
    const { ThemeProvider, createTheme, Box, Typography, Button, Chip, Stack, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } = MaterialUI;
    const theme = createTheme({
      typography: { fontFamily: 'var(--ui-font, Sarabun, sans-serif)', fontSize: 16 },
      palette: { primary: { main: '#1458d6' }, success: { main: '#15925c' }, warning: { main: '#b66b08' }, error: { main: '#d63f53' }, text: { primary: '#10243e', secondary: '#6d7d90' } },
      shape: { borderRadius: 14 },
      components: { MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none' } } }, MuiTableCell: { styleOverrides: { root: { fontFamily: 'var(--ui-font, Sarabun, sans-serif)', fontSize: 16, padding: '12px 15px', borderBottom: '1px solid #e7eef6' }, head: { fontWeight: 700, background: '#eef5fb', color: '#365a7d', whiteSpace: 'nowrap' } } } }
    });
    const badge = value => h(Chip, { label: text(value), color: tone(value), size: 'small', sx: { fontWeight: 600, maxWidth: '100%', height: 'auto', minHeight: 26, '& .MuiChip-label': { whiteSpace: 'normal', py: .3 } } });
    const fields = (items, extra) => h(Box, { component: 'dl', className: 'ccro-fields', sx: extra }, items.map(([label, value, color, money]) => h(Box, { key: label, className: /อาการสำคัญ|คำวินิจฉัย|รายละเอียด|เหตุผล|หมายเหตุ|เงื่อนไขพิเศษ|ที่อยู่/.test(label) ? 'ccro-field-wide' : undefined, sx: { minWidth: 0 } },
      h(Typography, { component: 'dt', variant: 'caption', color: 'text.secondary' }, label),
      h(Typography, { component: 'dd', sx: { m: 0, mt: .5, fontWeight: 500, overflowWrap: 'anywhere', color: color || 'text.primary', ...(money ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } : {}) } }, money ? amount(value) : text(value))
    )));
    const sectionSubtitles = { claim: deathClaim(d.claimCategory) ? 'เหตุการณ์ ประเภทความคุ้มครอง และการวินิจฉัย' : 'เหตุการณ์ การรักษา และการวินิจฉัย', insured: 'ข้อมูลบุคคลและกรมธรรม์ที่ใช้พิจารณา', school: 'ข้อมูลสถานศึกษาและผู้ประสานงาน', financial: 'ยอดเรียกร้อง สิทธิประโยชน์ และยอดอนุมัติ', expenses: deathClaim(d.claimCategory) ? 'ยอดเรียกร้องและผลพิจารณาสินไหม' : 'รายละเอียดค่ารักษาและผลการพิจารณารายการ', docs: 'เอกสารที่ใช้ประกอบการพิจารณาเคลม', decision: 'ข้อสรุป เหตุผล และเงื่อนไขการพิจารณา' };
    function DetailSection({ id, title, icon, body }) {
      const [expanded, setExpanded] = React.useState(['claim', 'financial', 'expenses', 'decision'].includes(id));
      return h(Box, { component: 'section', id: 'ccro-' + id, className: 'ccro-section', 'aria-labelledby': 'ccro-heading-' + id },
        h(Box, { className: 'ccro-section-head' },
          h('span', { className: 'material-icons-round ccro-section-icon', 'aria-hidden': true }, icon),
          h(Box, { className: 'ccro-section-heading' }, h(Typography, { component: 'h2', id: 'ccro-heading-' + id }, title), h(Typography, { component: 'p' }, sectionSubtitles[id])),
          h(Button, { className: 'ccro-section-toggle', size: 'small', 'aria-expanded': expanded, 'aria-controls': 'ccro-body-' + id, onClick: () => setExpanded(value => !value), endIcon: h('span', { className: 'material-icons-round', 'aria-hidden': true }, expanded ? 'expand_less' : 'expand_more') }, expanded ? 'ซ่อน' : 'แสดง')),
        h(Box, { id: 'ccro-body-' + id, className: 'ccro-section-body', hidden: !expanded }, body));
    }
    const section = (id, title, icon, body) => h(DetailSection, { key: id, id, title, icon, body });
    const table = (label, headers, rows, monetary = [], colors = {}, options = {}) => h(TableContainer, { tabIndex: 0, role: 'region', 'aria-label': label, className: options.className, sx: { overflowX: 'auto', border: '1px solid #e2eaf1', borderRadius: 1 } }, h(Table, { size: 'small', sx: { minWidth: options.minWidth || 850 } },
      h('caption', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } }, label),
      h(TableHead, null, h(TableRow, null, headers.map((label, i) => h(TableCell, { key: i, scope: 'col', align: monetary.includes(i) ? 'right' : 'left' }, label)))),
      h(TableBody, null, rows.length ? rows.map((row, ri) => h(TableRow, { key: ri }, row.map((v, i) => h(TableCell, { key: i, align: monetary.includes(i) ? 'right' : 'left', sx: { color: colors[i], minWidth: i === 0 ? 180 : undefined, fontVariantNumeric: 'tabular-nums', whiteSpace: monetary.includes(i) ? 'nowrap' : undefined } }, monetary.includes(i) ? amount(v) : React.isValidElement(v) ? v : text(v))))) : h(TableRow, null, h(TableCell, { colSpan: headers.length, align: 'left', sx: { py: 4, color: 'text.secondary' } }, h(Box, { component: 'span', sx: { position: 'sticky', left: 16, display: 'inline-block' } }, 'ไม่มีข้อมูล') )))));
    const a = d.insured, s = d.schoolData, f = d.financial, decision = d.decision || {}, pa = d.product === 'PA';
    const decisionResult = first(decision.result, d.decisionResult);
    const decisionState = String(first(decisionResult, d.claimStatus, '')).trim();
    const decisionRejected = /ปฏิเสธ|ไม่อนุมัติ/.test(decisionState);
    const decisionApproved = /อนุมัติ/.test(decisionState) && !decisionRejected;
    const heroTransferStatus = decisionRejected || /ยกเลิก/.test(decisionState) || (!decisionApproved && /^(?:ยังไม่จ่าย)?$/.test(String(d.paymentStatus || '').trim())) ? '—' : transferStatus(d.paymentStatus);
    const decisionFinal = (decisionApproved || decisionRejected || /ยกเลิก/.test(decisionState)) && !/รอ|กำลัง/.test(decisionState);
    const decisionMeta = decisionFinal ? [['วันที่พิจารณา', first(decision.date, d.decisionDate)], ['ผู้พิจารณา', first(decision.user, d.reviewer)]] : [];
    const decisionDetails = decisionRejected ? [
      ['สาเหตุการปฏิเสธ', first(decision.reason, d.statusReason)], ['รายละเอียดการปฏิเสธ', first(decision.detail, decision.note)]
    ] : /ยกเลิก/.test(decisionState) ? [
      ['สาเหตุการยกเลิก', first(decision.reason, d.statusReason)], ['รายละเอียดการยกเลิก', first(decision.detail, decision.note)]
    ] : /รอเอกสาร/.test(decisionState) ? [
      ['สาเหตุรอเอกสาร', first(decision.reason, d.statusReason)], ['รายละเอียดเอกสารที่ต้องการ', first(decision.detail, decision.requestedDocuments)]
    ] : /รอแก้ไข|รอตรวจสอบการแก้ไข/.test(decisionState) ? [
      ['สาเหตุรอแก้ไข', first(decision.reason, d.statusReason)], ['รายละเอียดการรอแก้ไข', decision.detail]
    ] : decisionApproved ? [
      ...(deathClaim(first(d.claimCategory, d.category, d.claimSource)) && present(decision.note) ? [['หมายเหตุการอนุมัติ', decision.note]] : []),
      ...(present(decision.specialCondition) ? [['เงื่อนไขพิเศษ', decision.specialCondition]] : []),
      ...(present(decision.nplExgratiaReason) && !/ไม่มีการอนุมัติ/.test(decision.nplExgratiaReason) ? [['เหตุผล NPL / Exgratia', decision.nplExgratiaReason, 'warning.main']] : [])
    ] : [['หมายเหตุ', first(decision.note, decision.reason, d.statusReason)]];
    const deathExpenseRows = d.expenses.map(x => [x.item, x.receipt, x.benefit, x.nonCovered, x.approved, x.note]);
    if (d.mock && d.expenses.length) deathExpenseRows.push(['รวมสินไหม', f.receipt, f.benefit, f.nonCovered, f.approvedNet, 'รวมรายการ']);
    const safeUrl = value => { try { const u = new URL(value, location.href); return ['http:', 'https:', 'blob:'].includes(u.protocol) && value ? u.href : undefined; } catch (_) { return undefined; } };
    function DocumentPreview({ doc }) {
      const [view, setView] = React.useState('closed');
      const [selected, setSelected] = React.useState(null);
      const [zoom, setZoom] = React.useState(1);
      const options = Array.isArray(doc.previewOptions) ? doc.previewOptions : [];
      const previewDoc = selected || doc;
      const fileUrl = safeUrl(first(previewDoc.previewUrl, previewDoc.url));
      const fileIsPdf = /pdf/i.test(String(previewDoc.mimeType || previewDoc.type || '')) || /\.pdf(?:$|\?)/i.test(fileUrl || '');
      const close = () => { setView('closed'); setSelected(null); setZoom(1); };
      const docType = String(previewDoc.type || 'เอกสารประกอบการพิจารณาเคลม');
      const isId = /บัตรประชาชน/.test(docType);
      const idForBeneficiary = isId && /ผู้รับผลประโยชน์/.test(docType);
      const isMedical = /ใบรับรองแพทย์/.test(docType);
      const isReceipt = /ใบเสร็จ|ใบแจ้งหนี้/.test(docType);
      const isDeathDoc = /ใบมรณบัตร|ทุพพลภาพ|สูญเสียอวัยวะ/.test(docType);
      const issueDate = first(previewDoc.preview?.documentDate, d.incidentDate, doc.uploadDate);
      const reference = first(previewDoc.preview?.reference, d.caseNo, d.claimNo);
      const subject = first(previewDoc.preview?.subject, d.chiefComplaint, d.detail);
      const paperField = (label, value) => h(Box, { className: 'ccro-preview-field', key: label }, h(Typography, { component: 'span' }, label), h(Typography, { component: 'strong' }, text(value)));
      const paperHeader = h(Box, { className: 'ccro-preview-paper-header' },
        h(Box, { className: 'ccro-preview-emblem', 'aria-hidden': true }, h('span', { className: 'material-icons-round' }, isId ? 'account_box' : isMedical || isReceipt ? 'local_hospital' : 'description')),
        h(Box, { className: 'ccro-preview-heading' }, h(Typography, { component: 'small' }, isId ? 'THAILAND · IDENTITY CARD' : isMedical || isReceipt ? 'เอกสารสถานพยาบาล' : 'เอกสารประกอบการพิจารณาเคลม'), h(Typography, { component: 'h3' }, isMedical || isReceipt ? text(d.hospital) : docType)),
        h(Box, { className: 'ccro-preview-paper-number' }, h(Typography, { component: 'small' }, 'เลขที่เอกสาร'), h(Typography, { component: 'strong' }, text(reference))));
      const paperTitle = h(Box, { className: 'ccro-preview-document-title' }, h(Typography, { component: 'h4' }, docType), h(Typography, { component: 'span' }, 'วันที่เอกสาร ' + text(issueDate)));
      const idBody = h(Box, { className: 'ccro-preview-id-layout' },
        h(Box, { className: 'ccro-preview-portrait', 'aria-label': 'ภาพบุคคลตัวอย่าง' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'person')),
        h(Box, { className: 'ccro-preview-id-fields' }, paperField('ชื่อ–สกุล', idForBeneficiary ? d.beneficiary : d.name), paperField('เลขประจำตัวประชาชน', idForBeneficiary ? undefined : first(d.idCard, d.insured?.idCard, d.insured?.id)), paperField('วันเดือนปีเกิด', idForBeneficiary ? undefined : first(d.dob, d.insured?.dob)), paperField('เอกสารประกอบเคลมเลขที่', d.claimNo)));
      const medicalBody = h(React.Fragment, null,
        h(Box, { className: 'ccro-preview-paper-grid' }, paperField('ชื่อผู้ป่วย', d.name), paperField('วันที่เข้ารับการรักษา', first(d.admitDate, d.incidentDate)), paperField('ประเภทการรักษา', d.claimType), paperField('เลขที่เคลมอ้างอิง', d.claimNo), d.organLoss && paperField('ระดับการสูญเสีย', d.organLoss.level), d.organLoss && paperField('แพทย์ผู้รับรอง', d.organLoss.assessor)),
        h(Box, { className: 'ccro-preview-paper-section' }, h(Typography, { component: 'h5' }, 'รายละเอียดการตรวจรักษา'), h(Typography, { component: 'p' }, text(subject))),
        h(Box, { className: 'ccro-preview-paper-section' }, h(Typography, { component: 'h5' }, 'คำวินิจฉัย'), h(Typography, { component: 'p' }, text(first(d.diagnosis1, d.chiefComplaint))), h(Typography, { component: 'p' }, 'เอกสารฉบับนี้จัดทำขึ้นเพื่อประกอบการพิจารณาเคลมตามข้อมูลตัวอย่าง')));
      const receiptBody = h(React.Fragment, null,
        h(Box, { className: 'ccro-preview-paper-grid' }, paperField('ผู้รับบริการ', d.name), paperField('วันที่รับบริการ', first(d.incidentDate, issueDate)), paperField('Claim No.', d.claimNo), paperField('Case No.', d.caseNo)),
        h('table', { className: 'ccro-preview-receipt-table' }, h('thead', null, h('tr', null, h('th', null, 'รายการ'), h('th', null, 'จำนวนเงิน (บาท)'))), h('tbody', null,
          h('tr', null, h('td', null, isReceipt && /ใบแจ้งหนี้/.test(docType) ? 'ค่ารักษาพยาบาลตามใบแจ้งหนี้' : 'ค่ารักษาพยาบาลตามใบเสร็จ'), h('td', null, amount(f.receipt))),
          h('tr', { className: 'ccro-preview-receipt-total' }, h('td', null, 'รวมทั้งสิ้น'), h('td', null, amount(f.receipt))))));
      const genericBody = h(React.Fragment, null,
        h(Box, { className: 'ccro-preview-paper-grid' }, paperField('เลขที่เคลม', d.claimNo), paperField('เลขที่ Case', d.caseNo), paperField('ผู้เอาประกัน', d.name), paperField(deathClaim(d.claimCategory) ? 'ผู้รับผลประโยชน์' : 'สถานพยาบาล', deathClaim(d.claimCategory) ? d.beneficiary : d.hospital), d.organLoss && paperField('ระดับการสูญเสีย', d.organLoss.level), d.organLoss && paperField('วันที่รับรองผล', d.organLoss.assessmentDate)),
        h(Box, { className: 'ccro-preview-paper-section' }, h(Typography, { component: 'h5' }, isDeathDoc ? 'รายละเอียดเหตุการณ์และสิทธิประโยชน์' : 'รายละเอียดเอกสาร'), h(Typography, { component: 'p' }, text(subject))),
        h(Box, { className: 'ccro-preview-paper-section' }, h(Typography, { component: 'h5' }, 'ใช้ประกอบการพิจารณา'), h(Typography, { component: 'p' }, 'เอกสารตัวอย่างสำหรับรายการเคลม ' + text(d.claimNo))));
      const paperFooter = h(Box, { className: 'ccro-preview-paper-footer' }, h(Box, null, h(Typography, { component: 'span' }, 'ตรวจสอบเอกสารโดย'), h(Typography, { component: 'strong' }, 'เจ้าหน้าที่ผู้รับเรื่อง')), h(Box, null, h(Typography, { component: 'span' }, 'วันที่บันทึก'), h(Typography, { component: 'strong' }, text(doc.uploadDate))));
      const icon = name => /แพทย์/.test(name) ? 'medical_information' : /เสร็จ|แจ้งหนี้/.test(name) ? 'receipt_long' : /บัตร/.test(name) ? 'badge' : 'description';
      const selection = h(Box, { className: 'tdr-document-chooser-body' }, h(Box, { className: 'tdr-document-list' }, options.map((option, index) =>
        h(Button, { key: index, className: 'tdr-document-category', autoFocus: index === 0, onClick: () => { setSelected(option); setZoom(1); setView('preview'); } },
          h('span', { className: 'tdr-document-category-icon material-icons-round', 'aria-hidden': true }, icon(option.type)),
          h('span', { className: 'tdr-document-category-name' }, option.type),
          h('span', { className: 'tdr-document-chip' }, '1 ไฟล์'),
          h('span', { className: 'tdr-document-chevron material-icons-round', 'aria-hidden': true }, 'chevron_right')))));
      const mockSheet = h(Box, { className: 'ccro-preview-stage' },
        h(Box, { className: 'ccro-preview-stage-note' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'info_outline'), 'เอกสารตัวอย่างสำหรับตรวจสอบหน้าจอ ไม่มีผลทางกฎหมาย'),
        h(Box, { className: 'ccro-preview-paper', role: 'document', 'aria-label': 'ตัวอย่าง' + docType, style: { zoom } },
          h('span', { className: 'ccro-preview-watermark', 'aria-hidden': true }, 'ตัวอย่าง'), paperHeader, paperTitle,
          isId ? idBody : isMedical ? medicalBody : isReceipt ? receiptBody : genericBody, paperFooter));
      const preview = fileUrl ? fileIsPdf ? h('iframe', { className: 'tdr-document-file', src: fileUrl, title: text(previewDoc.name || docType), style: { transform: `scale(${zoom})` } }) : h('img', { className: 'tdr-document-file', src: fileUrl, alt: text(previewDoc.name || docType), style: { transform: `scale(${zoom})` } }) : mockSheet;
      const viewerHead = h(Box, { className: 'tdr-document-dialog-head' },
        h('span', { className: 'tdr-document-head-icon material-icons-round', 'aria-hidden': true }, view === 'select' ? 'folder_open' : 'description'),
        h(Box, { className: 'tdr-document-title-wrap' }, h('span', { className: 'tdr-document-eyebrow' }, 'เอกสารประกอบการเคลม'), h(Typography, { component: 'h4', id: 'ccro-preview-title' }, view === 'select' ? 'เลือกประเภทเอกสาร' : docType), view === 'preview' && h('span', { className: 'tdr-document-preview-count' }, '1 ไฟล์ · ไฟล์ปัจจุบัน 1')),
        h(Button, { className: 'tdr-document-icon-btn', onClick: close, 'aria-label': 'ปิด' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'close')));
      const viewerToolbar = h(Box, { className: 'tdr-document-toolbar' },
        options.length > 0 && h(Button, { className: 'tdr-document-text-btn', onClick: () => { setSelected(null); setZoom(1); setView('select'); } }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'arrow_back'), 'เลือกประเภทเอกสาร'),
        h(Box, { className: 'tdr-document-toolbar-spacer' }),
        h(Button, { className: 'tdr-document-icon-btn', onClick: () => setZoom(value => Math.max(.5, value - .25)), disabled: zoom <= .5, 'aria-label': 'ย่อ' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'zoom_out')),
        h('span', { className: 'tdr-document-zoom-label' }, Math.round(zoom * 100) + '%'),
        h(Button, { className: 'tdr-document-icon-btn', onClick: () => setZoom(value => Math.min(2, value + .25)), disabled: zoom >= 2, 'aria-label': 'ขยาย' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'zoom_in')),
        h(Button, { className: 'tdr-document-text-btn tdr-document-save-btn', component: fileUrl ? 'a' : 'button', href: fileUrl || undefined, download: fileUrl ? text(previewDoc.name || doc.name || docType) : undefined, disabled: !fileUrl, title: fileUrl ? 'ดาวน์โหลดเอกสาร' : 'ข้อมูลตัวอย่างไม่มีไฟล์สำหรับดาวน์โหลด', 'aria-label': fileUrl ? 'ดาวน์โหลดเอกสาร' : 'ดาวน์โหลดเอกสาร (ไม่มีไฟล์ตัวอย่าง)' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'file_download'), h('span', null, 'ดาวน์โหลด')));
      const viewerPager = h(Box, { className: 'tdr-document-pager' },
        h(Button, { className: 'tdr-document-text-btn', disabled: true }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'chevron_left'), 'ก่อนหน้า'),
        h('span', null, '1 / 1'),
        h(Button, { className: 'tdr-document-text-btn', disabled: true }, 'ถัดไป', h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'chevron_right')));
      const viewerLayout = h(Box, { className: 'tdr-document-preview-layout' },
        h(Box, { component: 'aside', className: 'tdr-document-thumbnails', 'aria-label': 'รายการไฟล์เอกสาร' },
          h(Box, { className: 'tdr-document-thumb active', 'aria-current': 'true' }, h('span', { className: 'tdr-document-thumb-art' }, fileUrl && !fileIsPdf ? h('img', { src: fileUrl, alt: '' }) : h('span', { className: 'material-icons-round', 'aria-hidden': true }, fileIsPdf ? 'picture_as_pdf' : 'description')), h('span', { className: 'tdr-document-thumb-label' }, text(previewDoc.name || doc.name || docType)))),
        h(Box, { className: 'tdr-document-stage-wrap' }, h(Box, { className: 'tdr-document-stage' }, preview), viewerPager));
      return h(React.Fragment, null,
        h(Button, { size: 'small', variant: 'outlined', onClick: () => { setZoom(1); setView(options.length ? 'select' : 'preview'); } }, 'ดูเอกสาร'),
        h(MaterialUI.Dialog, { open: view !== 'closed', onClose: close, maxWidth: false, className: 'ccro-preview-dialog', 'aria-labelledby': 'ccro-preview-title', container: document.getElementById(pageId), PaperProps: { className: 'tdr-document-dialog ccro-viewer-paper ' + (view === 'select' ? 'tdr-document-chooser' : 'tdr-document-preview') } },
          viewerHead, view === 'select' ? selection : h(React.Fragment, null, viewerToolbar, viewerLayout)));
    }
    const documentAction = x => {
      const url = safeUrl(first(x.previewUrl, x.url));
      return x.mockPreview || url ? h(DocumentPreview, { doc: x }) : h(Typography, { variant: 'caption', color: 'text.secondary' }, 'ไม่มีไฟล์สำหรับดู');
    };
    const docRows = d.documents.map(x => [x.name, x.type, x.uploadDate, x.user, documentAction(x)]);
    const documentCards = h(Box, { className: 'ccro-document-cards', role: 'list', 'aria-label': 'เอกสารประกอบการเคลม' }, d.documents.length ? d.documents.map((doc, index) => h(Box, { component: 'article', role: 'listitem', className: 'ccro-document-card', key: index },
      h(Box, { className: 'ccro-document-card-head' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'description'), h(Box, null, h(Typography, { component: 'h3' }, text(doc.name)), h(Typography, { component: 'span' }, text(doc.type)))),
      h(Box, { className: 'ccro-document-card-meta' }, h(Box, null, h(Typography, { component: 'small' }, 'วันที่อัปโหลด'), h(Typography, { component: 'strong' }, text(doc.uploadDate))), h(Box, null, h(Typography, { component: 'small' }, 'ผู้อัปโหลด'), h(Typography, { component: 'strong' }, text(doc.user)))),
      h(Box, { className: 'ccro-document-card-action' }, documentAction(doc))
    )) : h(Typography, { className: 'ccro-document-empty' }, 'ไม่มีข้อมูล'));
    const isHospital = hospitalClaim(first(d.claimCategory, d.category, d.claimSource));
    const isDeath = deathClaim(first(d.claimCategory, d.category, d.claimSource));
    const physicalTherapy = yesNo(first(d.isPhysicalTherapy, d.physicalTherapy?.isPhysicalTherapy));
    const necessity = first(d.medicalNecessity, d.physicalTherapy?.medicalNecessity);
    const traffic = first(d.trafficAccident, d.trafficAccidentInfo, d.roadAccident);
    const trafficStatus = yesNo(first(traffic?.isTrafficAccident, d.isTrafficAccident, traffic?.trafficAccident, typeof traffic === 'boolean' ? traffic : undefined));
    const trafficVehicle = first(traffic?.vehicleType, traffic?.trafficVehicleType, traffic?.vehicle);
    const trafficVehicleLabel = /^(?:motorcycle|motorbike)$/i.test(String(trafficVehicle || '')) ? 'มอเตอร์ไซค์' : /^car$/i.test(String(trafficVehicle || '')) ? 'รถยนต์' : /^other$/i.test(String(trafficVehicle || '')) ? 'อื่นๆ' : trafficVehicle;
    const trafficCasualty = first(traffic?.casualtyStatus, traffic?.injuredStatus, traffic?.riderStatus, traffic?.casualty);
    const trafficCasualtyLabel = /^driver$/i.test(String(trafficCasualty || '')) ? 'ผู้ขับขี่' : /^passenger$/i.test(String(trafficCasualty || '')) ? 'ผู้โดยสาร' : trafficCasualty;
    const poroboExcess = yesNo(first(traffic?.poroboExcess, traffic?.isPoroboExcess, traffic?.motorActExcess));
    const isOrganLoss = !!d.organLoss || /สูญเสียอวัยวะ/.test(String(first(d.claimType, d.coverage, '')));
    const continuous = yesNo(first(d.isContinuous, d.continuousClaim));
    const incidentDate = first(d.incidentDate, d.incidentDateTime?.date);
    const admitDate = first(d.admitDate, d.hospitalInDateTime?.date);
    const dischargeDate = first(d.dischargeDate, d.hospitalOutDateTime?.date);
    const treatment = String(first(d.claimType, d.treatmentType, '') || '');
    const isDisability = isOrganLoss || /ทุพพลภาพ/.test(treatment);
    const showStay = /IPD|Day\s*Case/i.test(treatment);
    const claimFields = isDeath ? [
      ['ประเภทการเคลม', first(d.claimChannel, 'เคลมลูกค้า')],
      ['เหตุของการเคลม', first(d.cause, d.claimCause)],
      ['ประเภทความคุ้มครอง', first(d.coverage, d.coverageType, d.claimType)],
      [isDisability ? 'สาเหตุการทุพพลภาพ/สูญเสียอวัยวะ' : 'สาเหตุการเสียชีวิต', isDisability ? first(d.disabilityCause, d.lossCause) : d.deathCause],
      ['วันที่เกิดเหตุ', datePart(incidentDate)],
      ...(!isOrganLoss && /เสียชีวิต/.test(treatment) ? [['วันที่เสียชีวิต', datePart(d.deathDate)]] : []),
      ['วันที่รับเอกสาร', datePart(first(d.receivedDocumentsDate, d.documentReceivedDate))],
      ['วันที่เอกสารครบ', datePart(d.documentsCompleteDate)],
      ['สถานพยาบาล', d.hospital],
      ['อาการสำคัญ', d.chiefComplaint],
      ['คำวินิจฉัย 1', d.diagnosis1], ['คำวินิจฉัย 2', d.diagnosis2], ['คำวินิจฉัย 3', d.diagnosis3],
      ['หมายเหตุ', d.optionalNote]
    ] : [
      ['เป็นเคลมต่อเนื่อง', continuous],
      ['เหตุของการเคลม', first(d.cause, d.claimCause)],
      ['ประเภทความคุ้มครอง', first(d.coverage, d.coverageType)],
      ['ประเภทการรักษา', d.claimType],
      ['วันที่แจ้ง', datePart(d.notifiedDate)], ['วันที่เอกสารครบ', datePart(d.documentsCompleteDate)],
      ['วันที่เกิดเหตุ', datePart(incidentDate)], ['เวลาที่เกิดเหตุ', first(d.incidentTime, d.incidentDateTime?.time, timePart(incidentDate))],
      ['สถานพยาบาล', d.hospital],
      ['อาการสำคัญ(ChiefComplaint)', d.chiefComplaint],
      ['การวินิจฉัย1(Diagnosis1)', d.diagnosis1], ['การวินิจฉัย2(Diagnosis2)', d.diagnosis2], ['การวินิจฉัย3(Diagnosis3)', d.diagnosis3],
      ['วันที่เข้า รพ.', datePart(admitDate)], ['เวลาที่เข้า รพ.', first(d.admitTime, d.hospitalInDateTime?.time, timePart(admitDate))],
      ['วันที่ออก รพ.', datePart(dischargeDate)], ['เวลาที่ออก รพ.', first(d.dischargeTime, d.hospitalOutDateTime?.time, timePart(dischargeDate))]
    ];
    const expenseNumber = value => {
      const number = Number(String(value ?? '').replace(/,/g, ''));
      return Number.isFinite(number) ? number : 0;
    };
    const treatmentNames = /IPD/i.test(String(d.claimType || '')) ? [
      'การดูแลโดยแพทย์ (ค่าแพทย์เยี่ยมไข้ ผู้ป่วยใน)',
      'การรักษาโดยการผ่าตัด',
      'ค่ารักษาพยาบาล และค่าบริการทั่วไป',
      'ค่าห้องค่าอาหาร และการพยาบาลผู้ป่วยปกติ',
      'ค่าห้องค่าอาหาร และการพยาบาลผู้ป่วยหนัก ICU',
      'ค่าชดเชยการนอนรักษาพยาบาลสูงสุด (ต่อโรค ต่อครั้ง)'
    ] : ['ค่ารักษาพยาบาล จากโรคภัยไข้เจ็บ กรณีผู้ป่วยนอก OPD แบบเหมาจ่าย'];
    const treatmentBuckets = treatmentNames.map(name => ({ name, receipt: 0, benefit: 0, excess: 0 }));
    d.expenses.forEach(item => {
      const name = String(item.item || '');
      const index = treatmentBuckets.length === 1 ? 0 : /ชดเชย/.test(name) ? 5 : /ICU|ผู้ป่วยหนัก/.test(name) ? 4 : /ห้อง|อาหาร|พยาบาล/.test(name) ? 3 : /ผ่าตัด|ศัลย|หัตถการ/.test(name) ? 1 : /แพทย์|วิสัญญี/.test(name) ? 0 : 2;
      const bucket = treatmentBuckets[index];
      const receipt = expenseNumber(item.receipt);
      const benefit = expenseNumber(first(item.benefit, item.approved));
      bucket.receipt += receipt;
      bucket.benefit += benefit;
      bucket.excess += Math.max(0, receipt - benefit);
    });
    if (!d.expenses.length && expenseNumber(f.receipt) > 0) {
      const receipt = expenseNumber(f.receipt);
      const benefit = expenseNumber(first(f.benefit, f.approvedNet));
      treatmentBuckets.push({ name: 'รายการที่ยังไม่มีการแจกแจง', receipt, benefit, excess: Math.max(0, receipt - benefit) });
    }
    const treatmentTotals = treatmentBuckets.reduce((total, row) => ({ receipt: total.receipt + row.receipt, benefit: total.benefit + row.benefit, excess: total.excess + row.excess }), { receipt: 0, benefit: 0, excess: 0 });
    const compensationTotal = d.ipdCompensation.reduce((sum, row) => sum + expenseNumber(first(row.claimed, row.receipt, present(row.rate) && present(row.days) ? expenseNumber(row.rate) * expenseNumber(row.days) : undefined, row.benefit, row.approved)), 0);
    const compensationCovered = d.ipdCompensation.reduce((sum, row) => sum + expenseNumber(first(row.benefit, row.approved)), 0);
    const combineCompensation = Boolean(first(d.combineCompensation, f.combineCompensation));
    const compensationRemaining = combineCompensation ? 0 : compensationCovered;
    const discountTotal = expenseNumber(present(f.discount) ? f.discount : d.expenses.reduce((sum, row) => sum + expenseNumber(row.discount), 0));
    const nonCoveredTotal = expenseNumber(present(f.nonCovered) ? f.nonCovered : d.expenses.reduce((sum, row) => sum + expenseNumber(row.nonCovered), 0));
    const hospitalNet = Math.max(0, expenseNumber(first(f.receipt, treatmentTotals.receipt)) - discountTotal - nonCoveredTotal);
    const hospitalCoverage = expenseNumber(first(f.benefit, treatmentTotals.benefit));
    const hospitalReimbursement = Math.max(0, hospitalCoverage - compensationCovered);
    const summaryLine = (label, value) => h(Box, { className: 'ccro-expense-summary-line', key: label }, h(Typography, { component: 'span' }, label), h(Typography, { component: 'strong' }, amount(value)));
    const medicalExpenseOverview = h(Box, { className: 'ccro-medical-expenses' },
      table('รายการค่ารักษา', ['รายการ', 'รายการเบิก', 'สิทธิ์เบิกตามความคุ้มครอง', 'ส่วนเกินสิทธิ์'], [...treatmentBuckets.map(row => [row.name, row.receipt, row.benefit, row.excess]), ['รวม :', treatmentTotals.receipt, treatmentTotals.benefit, treatmentTotals.excess]], [1, 2, 3], {}, { className: 'ccro-treatment-table', minWidth: 700 }));
    const medicalFinancialSummary = h(Box, { className: 'ccro-expense-summary-grid' },
        h(Box, { className: 'ccro-expense-summary-card' }, h(Typography, { component: 'h3' }, 'สรุปค่าชดเชย'),
          h('label', { className: 'ccro-compensation-choice' }, h('input', { type: 'checkbox', checked: combineCompensation, disabled: true, readOnly: true }), 'โอนค่าชดเชยรวมกับค่ารักษา'),
          summaryLine('ค่าชดเชยรวม', compensationTotal), summaryLine('ค่าชดเชย (รวมในสิทธิ์ความคุ้มครอง)', compensationCovered),
          h(Box, { className: 'ccro-expense-summary-result is-success' }, 'ค่าชดเชยคงเหลือ (โอนให้ลูกค้า) ', amount(compensationRemaining))),
        h(Box, { className: 'ccro-expense-summary-card' }, h(Typography, { component: 'h3' }, 'สรุปค่าใช้จ่ายโรงพยาบาล'),
          summaryLine(isHospital ? 'ยอดเงินรวมตามใบแจ้งหนี้' : 'ยอดเงินรวมตามใบเสร็จ', first(f.receipt, treatmentTotals.receipt)), summaryLine('ค่าใช้จ่ายทั้งหมดสุทธิ', hospitalNet), summaryLine('สิทธิ์ความคุ้มครอง', hospitalCoverage), summaryLine('ค่าชดเชย (รวมในสิทธิ์ความคุ้มครอง)', compensationCovered),
          h(Box, { className: 'ccro-expense-summary-result is-primary' }, 'สิทธิ์โรงพยาบาลตั้งเบิกกับบริษัท ', amount(hospitalReimbursement)),
          h(Box, { className: 'ccro-expense-summary-result is-error' }, 'ค่าชดเชยคงเหลือ (โอนให้ลูกค้า) ', amount(compensationRemaining))));
    const claimCategoryLabel = isDeath ? 'Death & Disability' : isHospital ? 'เคลมโรงพยาบาล' : 'เคลมลูกค้า';
    const financialEvents = Array.isArray(d.paymentEvents) ? d.paymentEvents : Array.isArray(d.paymentHistory) ? d.paymentHistory : [];
    const fundEvent = financialEvents.find(item => item.stage === 'fund-disbursement');
    const receiptEvent = financialEvents.find(item => item.stage === 'insurer-receipt');
    const fundStatus = isHospital ? '—' :
      (receiptEvent && /สำเร็จ|รับเงินแล้ว|รับชำระแล้ว/.test(String(receiptEvent.status || '')) ? 'รับชำระสำเร็จ' : '') ||
      disbursementStatus(fundEvent?.status) ||
      disbursementStatus(d.fundStatus) ||
      (decisionApproved ? 'รอตั้งเบิก' : '—');
    const quickItems = [['calendar_month', 'วันที่แจ้งเคลม', d.notifiedDate], ['fact_check', 'วันที่พิจารณา', first(decision.date, d.decisionDate)], ['person_outline', 'ผู้พิจารณา', first(decision.user, d.reviewer)], isDeath ? ['group', 'ผู้รับผลประโยชน์', d.beneficiary] : ['local_hospital', 'โรงพยาบาล', d.hospital], isDeath ? ['event', 'วันที่เกิดเหตุ', d.incidentDate] : ['location_on', 'สาขาเมื่อเคลม', d.branch]];
    const stayItems = [['จำนวนวัน IPD', first(d.ipdDays, d.stayDays?.ipd), 'ipd'], ['จำนวนวัน ICU', first(d.icuDays, d.stayDays?.icu), 'icu'], ['จำนวนวันนอน', first(d.totalDays, d.totalStayDays, d.stayDays?.total), 'total']];
    const staySummary = h(Box, { component: 'section', className: 'ccro-stay-summary', 'aria-label': 'สรุปจำนวนวันนอน' },
      h(Box, { className: 'ccro-stay-head' }, h('span', { className: 'material-icons-round ccro-stay-icon', 'aria-hidden': true }, 'bed'),
        h(Box, null, h(Typography, { component: 'h3' }, 'สรุปจำนวนวันนอน'), h(Typography, { component: 'p' }, text(d.claimType)))),
      h(Box, { className: 'ccro-stay-grid' }, stayItems.map(([label, value, status]) => h(Box, { className: 'ccro-stay-card is-' + status, key: label },
        h(Typography, { component: 'span' }, label), h(Typography, { component: 'strong' }, present(value) ? text(value) + ' วัน' : '—')))));
    const refItems = [['receipt_long', 'Claim No.', d.claimNo], ['description', 'Case No.', d.caseNo]];
    const referenceCards = refItems.map(([icon, label, value]) => h(Box, { className: 'ccro-reference-card', key: label },
      h('span', { className: 'material-icons-round ccro-reference-icon', 'aria-hidden': true }, icon),
      h(Box, { className: 'ccro-reference-copy' }, h(Typography, { component: 'span' }, label), h(Typography, { component: 'strong' }, text(value)))));
    const empty = message => h(Box, { className: 'ccro-tab-empty', role: 'status' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'info_outline'), h(Typography, null, message));
    const tabPanel = (key, icon, title, subtitle, body, meta) => h(Box, { component: 'section', id: 'ccro-panel-' + key, role: 'tabpanel', 'aria-labelledby': 'ccro-tab-' + key, className: 'ccro-tab-panel', hidden: true },
      h(Paper, { className: 'ccro-tab-card customer-panel-modern', variant: 'outlined' },
        h(Box, { className: 'ccro-tab-card-head' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, icon), h(Box, { className: 'ccro-tab-card-title' }, h(Typography, { component: 'h2' }, title), h(Typography, { component: 'p' }, subtitle)), meta && h('span', { className: 'ccro-tab-meta' }, meta)),
        h(Box, { className: 'ccro-tab-card-body' }, body)));
    const selectTab = (key, focusTab = false) => {
      const node = document.getElementById(pageId);
      node?.querySelectorAll('.ccro-main-tab').forEach(button => {
        const active = button.dataset.tab === key;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active && focusTab) button.focus();
      });
      node?.querySelectorAll('.ccro-tab-panel').forEach(panel => { panel.hidden = panel.id !== 'ccro-panel-' + key; });
    };
    const onTabKeyDown = event => {
      const keys = mainTabs.map(([key]) => key);
      const current = keys.indexOf(event.currentTarget.dataset.tab);
      const next = event.key === 'ArrowRight' ? (current + 1) % keys.length : event.key === 'ArrowLeft' ? (current - 1 + keys.length) % keys.length : event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      selectTab(keys[next], true);
    };
    const activitySource = Array.isArray(d.activities) ? d.activities : Array.isArray(d.transactionHistory) ? d.transactionHistory : [];
    const activityRows = activitySource.length ? activitySource : [
      ...(present(d.claimStatus) ? [{ title: 'สถานะปัจจุบัน', status: d.claimStatus, date: first(decision.date, d.decisionDate), detail: d.claimNo, icon: 'fact_check' }] : []),
      { title: 'สร้างรายการเคลม', date: d.notifiedDate, detail: d.claimNo, icon: 'description' }
    ];
    const activities = h(Box, { className: 'ccro-activity-list timeline-modern' }, activityRows.map((item, index) => h(Box, { className: 'ccro-activity-item timeline-row', key: index },
      h('span', { className: 'ccro-activity-dot timeline-dot material-icons-round', 'aria-hidden': true }, text(item.icon || 'history')),
      h(Box, { className: 'ccro-activity-content timeline-card' },
        h(Box, { className: 'ccro-activity-date timeline-date-block' }, h('span', { className: 'timeline-date' }, text(item.date))),
        h(Box, { className: 'ccro-activity-meta timeline-meta' }, h(Typography, { component: 'strong', className: 'timeline-title' }, text(item.title || item.action)), h(Typography, { component: 'span', className: 'timeline-sub' }, text(first(item.detail, item.note)))),
        h(Box, { className: 'ccro-activity-status timeline-right' }, present(item.status) && badge(item.status))))));
    const suppliedCoverage = Array.isArray(d.coverageItems) ? d.coverageItems : Array.isArray(d.coverages) ? d.coverages : [];
    const useConsiderationMock = !suppliedCoverage.length;
    const coverageSource = useConsiderationMock ? considerationCoverageMock(isDeath, isHospital, first(d.claimType, d.coverage, d.care)) : suppliedCoverage;
    const coverageHeaders = isHospital && !useConsiderationMock ? ['รายละเอียดความคุ้มครอง', 'ความคุ้มครอง', 'คุ้มครองสูงสุด', 'เงื่อนไข', 'วงเงินคงเหลือ'] : isDeath ? ['รายละเอียดความคุ้มครอง', 'เงื่อนไข / รายการ', 'คุ้มครอง(สูงสุด)', 'จำนวนสูงสุด', 'หน่วย'] : ['รายละเอียดความคุ้มครอง', 'ความคุ้มครอง', 'คุ้มครอง(สูงสุด)', 'จำนวนสูงสุด', 'หน่วย'];
    const coverageCells = item => isHospital && !useConsiderationMock ? [first(item.name, item.description, item.benefit), first(item.coverage, item.limit), first(item.maximum, item.maxAmount), item.condition, first(item.remaining, item.balance)] : isDeath ? [first(item.name, item.description, item.benefit), first(item.condition, item.coverage, item.limit), first(item.maximum, item.maxAmount), first(item.maxCount, item.count), item.unit] : [first(item.name, item.description, item.benefit), first(item.coverage, item.limit), first(item.maximum, item.maxAmount), first(item.maxCount, item.count), item.unit];
    const coverageRows = coverageSource.map((item, index) => {
      if (item.kind === 'group' || item.group === true) {
        return h('tr', { key: index, className: 'coverage-group-row' }, h('th', { colSpan: 5, scope: 'rowgroup' }, text(item.name)));
      }
      const cells = coverageCells(item).map((value, cellIndex) => h('td', { key: cellIndex }, text(value)));
      return h('tr', { key: index }, cells);
    });
    const coverageBody = h(React.Fragment, null,
      useConsiderationMock ? h('p', { className: 'ccro-coverage-mock-note' }, 'ข้อมูลความคุ้มครองตัวอย่างจากหน้าพิจารณาเคลม ใช้สำหรับดูรูปแบบเท่านั้น') : null,
      h(Box, { className: 'ccro-coverage-table coverage-table-wrap', tabIndex: 0, role: 'region', 'aria-label': 'รายการความคุ้มครอง' },
        h('table', { className: 'ccro-review-table coverage-table' },
          h('thead', null, h('tr', null, coverageHeaders.map((label, index) => h('th', { key: index, scope: 'col' }, label)))),
          h('tbody', null, coverageRows))));
    const sourceClaims = relatedClaims.length ? relatedClaims : Array.isArray(d.claimHistory) ? d.claimHistory : [];
    const claims = sourceClaims.some(item => first(item.claimNo, item.cl) === d.claimNo) ? sourceClaims : [d, ...sourceClaims];
    const claimRows = claims.map(item => [first(item.claimNo, item.cl), first(item.claimType, item.treatmentType), item.hospital, item.incidentDate, badge(window.ClaimAgentClaimLifecycle.display(item)), first(item.claimAmount, item.financial?.receipt), first(item.paidAmount, item.financial?.transfer)]);
    const historyBody = h(Box, { className: 'ccro-claim-history' }, h(Box, { className: 'ccro-tab-count' }, claims.length + ' รายการภายใต้ผู้เอาประกัน/กรมธรรม์ที่เลือก'), table('ประวัติการเคลม', ['Claim No.', 'ประเภทการรักษา', 'โรงพยาบาล', 'วันที่เกิดเหตุ', 'สถานะเคลม', 'ยอดเบิก', 'จ่ายจริง'], claimRows, [5, 6], {}, { className: 'ccro-claim-history-table', minWidth: 980 }));
    const memoSource = Array.isArray(d.memos) ? d.memos : [];
    function MemoTab() {
      const [filter, setFilter] = React.useState('');
      const types = [...new Set(memoSource.map(item => first(item.type, item.category)).filter(present))];
      const filtered = filter ? memoSource.filter(item => first(item.type, item.category) === filter) : memoSource;
      const rows = filtered.map(item => [first(item.code, item.id), first(item.user, item.author), first(item.date, item.createdAt), h('span', { className: 'ccro-memo-type' }, text(first(item.type, item.category))), first(item.message, item.text)]);
      return h(Box, { className: 'ccro-memo-content' },
        h(Box, { className: 'ccro-memo-toolbar' },
          h('label', { className: 'ccro-memo-filter' }, 'ตัวกรอง', h('select', { value: filter, onChange: event => setFilter(event.target.value) }, h('option', { value: '' }, 'ทั้งหมด'), types.map(type => h('option', { key: type, value: type }, type)))),
          h('span', { className: 'ccro-memo-count' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'sticky_note_2'), filtered.length + ' รายการ')),
        table('บันทึกข้อความ', ['Code', 'ผู้ทำรายการ', 'วันที่บันทึก', 'ประเภทการบันทึก', 'ข้อความ'], rows, [], {}, { className: 'ccro-memo-table', minWidth: 980 }));
    }
    const memoBody = h(MemoTab);
    const paymentSource = financialEvents;
    const stages = isHospital ? [['hospital-transfer', 'โอนเงินโรงพยาบาล', 'local_hospital'], ['insurer-receipt', 'รับเงินจาก บ.ประกัน', 'account_balance']] : isDeath ? [['beneficiary-transfer', 'โอนเงินให้ผู้รับผลประโยชน์', 'account_balance_wallet'], ['fund-disbursement', 'ตั้งเบิกกองทุน', 'savings'], ['insurer-receipt', 'รับเงินจาก บ.ประกัน', 'account_balance']] : [['customer-transfer', 'โอนเงินให้ลูกค้า', 'account_balance_wallet'], ['fund-disbursement', 'ตั้งเบิกกองทุน', 'savings'], ['insurer-receipt', 'รับเงินจาก บ.ประกัน', 'account_balance']];
    const paidTransfer = Number(String(f.transfer ?? '').replace(/,/g, '')) > 0 && heroTransferStatus === 'โอนสำเร็จ';
    const paymentRows = (paymentSource.length ? paymentSource : paidTransfer ? [{ stage: stages[0][0], title: stages[0][1], amount: f.transfer, status: d.paymentStatus, date: first(d.transferDate, d.paidDate), reference: first(d.transferReference, d.cpgNo, d.hcgNo) }] : []).map(item => ({ ...item, status: /-transfer$/.test(item.stage) ? transferStatus(item.status) : item.stage === 'fund-disbursement' ? disbursementStatus(item.status) || item.status : item.stage === 'insurer-receipt' ? disbursementStatus(item.status) || item.status : item.status }));
    const paymentBody = h(React.Fragment, null,
      h(Box, { className: 'ccro-payment-stages' }, stages.map(([key, label, icon], index) => {
        const event = paymentRows.find(item => item.stage === key);
        return h(Box, { className: 'ccro-payment-stage', key }, h(Box, { className: 'ccro-payment-stage-top' }, h('span', { className: 'ccro-payment-stage-icon material-icons-round', 'aria-hidden': true }, icon), h(Typography, { component: 'small' }, 'ขั้นตอน ' + (index + 1))), h(Typography, { component: 'h3' }, label), h(Typography, { component: 'strong' }, event ? present(event.amount) ? amount(event.amount) + ' บาท' : 'ยังไม่มีจำนวนเงิน' : 'ยังไม่มีข้อมูล'), h(Typography, { component: 'span' }, event ? text(event.status) : 'ยังไม่มีรายการชำระเงิน'));
      })),
      paymentRows.length ? h(Box, { className: 'ccro-payment-table' }, table('รายการชำระเงินของเคลม', ['ขั้นตอน', 'วันที่ทำรายการ', 'เลขอ้างอิง', 'จำนวนเงิน (บาท)', 'สถานะ'], paymentRows.map(item => [first(item.title, stages.find(stage => stage[0] === item.stage)?.[1], item.stage), item.date, item.reference, item.amount, badge(item.status)]), [3])) : empty('ยังไม่มีรายการชำระเงินสำหรับเคลมนี้'));
    root.render(h(ThemeProvider, { theme }, h(Box, { className: 'ccro-shell' + (isDeath ? ' is-death' : '') },
      h(Box, { className: 'ccro-backline' }, h(Button, { onClick: goBack, className: 'ccro-back-btn', startIcon: h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'arrow_back') }, 'กลับหน้ารายการเคลม'), h(Box, { className: 'ccro-page-heading' }, h(Typography, { component: 'h2' }, 'รายละเอียดเคลม'), h(Typography, { component: 'p' }, 'ตรวจสอบข้อมูลผู้เอาประกัน การรักษา การเงิน และผลพิจารณา'))),
      h(Box, { component: 'section', className: 'ccro-hero', 'aria-label': 'สรุป' + claimCategoryLabel },
        h(Box, { className: 'ccro-identity' },
          h(Stack, { direction: 'row', gap: 1, flexWrap: 'wrap', sx: { mb: 1 } }, [d.product, d.claimType, present(d.plan) ? 'แผน : ' + d.plan : 'แผน : —'].filter(present).map((v, i) => h(Chip, { key: i, label: v, size: 'small', sx: { color: '#fff', border: '1px solid #ffffff55', background: '#ffffff18' } }))),
          h(Typography, { component: 'h1', sx: { fontSize: { xs: 22, md: 28 }, fontWeight: 600, lineHeight: 1.4 } }, text(d.name)),
          pa && h(Box, { className: 'ccro-school-highlight' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'school'), h(Box, null, h(Typography, { component: 'small' }, 'สถานศึกษา · PA'), h(Typography, { component: 'strong' }, text(d.school)))),
          h(Box, { className: 'ccro-hero-meta' }, h(Typography, { component: 'span' }, 'Application ID'), h(Typography, { component: 'b' }, text(d.appId))),
          h(Box, { className: 'ccro-hero-status' }, h(Chip, { label: 'ประเภทเคลม: ' + claimCategoryLabel, size: 'small' }), h(Chip, { label: 'สถานะเคลม: ' + window.ClaimAgentClaimLifecycle.display(d), size: 'small' }))
        ),
        h(Box, { className: 'ccro-total' }, h(Typography, { fontSize: 13 }, 'ยอดอนุมัติสุทธิ (THB)'), h(Typography, { className: 'ccro-approved', sx: { fontSize: { xs: 32, md: 38 }, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.5 } }, amount(f.approvedNet)),
          h(Stack, { className: 'ccro-hero-metrics', direction: 'column', gap: 1 },
            h(Box, { className: 'ccro-hero-metric' }, h(Typography, { variant: 'caption', display: 'block' }, 'ผลการพิจารณา'), badge(decisionResult)),
            h(Box, { className: 'ccro-hero-metric' }, h(Typography, { variant: 'caption', display: 'block' }, 'สถานะการโอนเงิน'), badge(heroTransferStatus)),
            h(Box, { className: 'ccro-hero-metric' }, h(Typography, { variant: 'caption', display: 'block' }, 'สถานะการตั้งเบิก'), badge(fundStatus)))
        )
      ),
      h(Box, { component: 'section', className: 'ccro-reference-bar', 'aria-label': 'เลขอ้างอิงเคลม' }, referenceCards),
      h(Box, { component: 'div', className: 'ccro-nav', role: 'tablist', 'aria-label': 'รายละเอียดเคลม' }, mainTabs.map(([key, label], index) => h(Button, { key, id: 'ccro-tab-' + key, className: 'ccro-main-tab' + (index === 0 ? ' is-active' : ''), role: 'tab', 'data-tab': key, 'aria-selected': index === 0 ? 'true' : 'false', 'aria-controls': 'ccro-panel-' + key, tabIndex: index === 0 ? 0 : -1, onClick: () => selectTab(key), onKeyDown: onTabKeyDown }, label))),
      h(Box, { component: 'section', id: 'ccro-panel-claim', role: 'tabpanel', 'aria-labelledby': 'ccro-tab-claim', className: 'ccro-tab-panel' },
      h(Paper, { variant: 'outlined', className: 'ccro-quick' }, h(Box, { className: 'ccro-quick-grid' }, quickItems.map(([icon, label, value]) => h(Box, { className: 'ccro-quick-item', key: label }, h('span', { className: 'material-icons-round ccro-quick-icon', 'aria-hidden': true }, icon), h(Box, null, h(Typography, { component: 'small' }, label), h(Typography, { component: 'strong' }, text(value))))))),
      h(Box, { className: 'ccro-claim-layout' },
      h(Paper, { variant: 'outlined', className: 'ccro-sections' },
        section('claim', 'ข้อมูลเคลม', 'description', h(Box, { className: 'ccro-treatment-layout' },
          fields(claimFields),
          !isDeath && h(Box, { className: 'ccro-hospital-fields' },
            showStay && staySummary,
            fields([['รายละเอียดการเจ็บป่วย/การบาดเจ็บ', d.medicalNote], ['หมายเหตุ(ถ้ามี)', d.optionalNote]])),
          !isDeath && physicalTherapy && h(Box, { className: 'ccro-claim-subgroup' },
            h(Typography, { component: 'h3' }, 'ข้อมูลกายภาพบำบัด'),
            fields([
              ['เป็นการกายภาพบำบัด', physicalTherapy],
              ...(physicalTherapy === 'ใช่' ? [['ความจำเป็นทางการแพทย์', first(medicalNecessityLabels[necessity], necessity)]] : [])
            ])),
          !isDeath && trafficStatus && h(Box, { className: 'ccro-claim-subgroup' },
            h(Typography, { component: 'h3' }, 'ข้อมูลอุบัติเหตุจากการจราจร'),
            fields([
              ['เป็นอุบัติเหตุจากการจราจร', trafficStatus],
              ...(trafficStatus === 'ใช่' ? [
                ['ประเภทยานพาหนะ', trafficVehicleLabel],
                ...(/^(?:other|อื่นๆ?)$/i.test(String(trafficVehicle || '')) ? [['โปรดระบุ', first(traffic?.vehicleOther, traffic?.vehicleTypeOther)]] : []),
                ['ผู้ขับขี่ หรือ ผู้โดยสาร', trafficCasualtyLabel],
                ['เป็นส่วนเกิน พ.ร.บ.', poroboExcess],
                ...(poroboExcess === 'ไม่ใช่' ? [['โปรดระบุสาเหตุที่ไม่ใช้ พ.ร.บ.', first(traffic?.noPoroboReason, traffic?.poroboReason, traffic?.motorActUnusedReason)]] : [])
              ] : [])
            ]))
        )),
        section('insured', 'ข้อมูลผู้เอาประกัน', 'person', fields([
          ['ชื่อ–สกุล', d.name], ['เลขบัตรประชาชน', first(d.idCard, d.id, a.idCard, a.id)],
          ...(!pa ? [['วันเกิด', first(d.dob, a.dob)], ['อายุ', first(d.age, a.age)], ['เบอร์โทรศัพท์', first(d.phone, a.phone)], ['Application ID', d.appId], ...(present(d.policyNo) ? [['เลขกรมธรรม์', d.policyNo]] : []), ['แผน', d.plan]] : []),
          ['วันที่เริ่มคุ้มครอง', first(d.start, a.start)],
          ...(pa ? [['วันที่มีผลคุ้มครอง', first(d.effectiveDate, a.effectiveDate)]] : []),
          ['วันที่สิ้นสุดความคุ้มครอง', first(d.end, a.end)], ['สถานะผู้เอาประกัน', first(d.appStatus, a.appStatus)],
          ...(pa ? [['ประเภทผู้เอาประกัน', first(d.insuredType, a.insuredType)], ['เลขบัตรประกันนักเรียน', first(d.studentCard, a.studentCard)]] : [])
        ])),
        pa && section('school', 'ข้อมูลสถานศึกษา', 'school', fields([
          ['ชื่อสถานศึกษา', d.school], ['Application ID สถานศึกษา', s.appId], ['ที่อยู่', s.address], ['ผู้ติดต่อ', s.contact], ['ตำแหน่ง', s.position], ['เลขบัตรประชาชนผู้ติดต่อ', s.contactId], ['เบอร์โทรศัพท์', s.phone], ['ธนาคาร', s.bank], ['เลขบัญชี', s.account], ['ชื่อบัญชี', s.accountName]
        ])),
        section('expenses', isDeath ? 'รายละเอียดสินไหม' : 'รายการค่ารักษา', 'receipt_long', isDeath ? table('รายละเอียดสินไหม', ['รายการ', 'ยอดเรียกร้อง', 'สิทธิประโยชน์', 'ไม่คุ้มครอง', 'อนุมัติ', 'หมายเหตุ'], deathExpenseRows, [1, 2, 3, 4], { 3: 'error.main', 4: 'success.main' }) : medicalExpenseOverview),
        section('docs', 'เอกสารประกอบการเคลม', 'folder_open', h(React.Fragment, null, table('เอกสารประกอบการเคลม', ['ชื่อเอกสาร', 'ประเภท', 'วันที่อัปโหลด', 'ผู้อัปโหลด', 'ดูเอกสาร'], docRows, [], {}, { className: 'ccro-document-table', minWidth: 700 }), documentCards)),
        section('decision', 'ผลการพิจารณา', 'fact_check', h(React.Fragment, null, h(Box, { sx: { mb: 2 } }, badge(decisionResult)), fields([...decisionMeta, ...decisionDetails])))
      ),
      h(Box, { component: 'aside', className: 'ccro-financial-column' },
        section('financial', 'สรุปการเงิน', 'account_balance_wallet', isDeath ? fields([
          ['ยอดอนุมัติสุทธิ', f.approvedNet, 'success.main', true], [isDeath ? 'ยอดเรียกร้องสินไหม' : isHospital ? 'ยอดตามใบแจ้งหนี้' : 'ยอดตามใบเสร็จ', f.receipt, null, true], ['สิทธิประโยชน์', f.benefit, null, true], ...(isDeath ? [['ส่วนที่ไม่คุ้มครอง', f.nonCovered, 'error.main', true]] : [['ส่วนลด', f.discount, null, true], ['ส่วนที่ไม่คุ้มครอง', f.nonCovered, 'error.main', true], ['NPL / Exgratia', f.nplExgratia, 'warning.main', true]]), ['ยอดโอนเงิน', f.transfer, null, true]
        ]) : medicalFinancialSummary)
      ))),
      tabPanel('activity', 'history', 'ประวัติการทำรายการ', 'ลำดับเหตุการณ์ของเคลมที่มีข้อมูลบันทึกไว้', activities, activityRows.length + ' รายการ'),
      tabPanel('coverage', 'verified_user', 'รายการความคุ้มครอง', 'ข้อมูลกรมธรรม์และสิทธิประโยชน์ที่มีในรายการนี้', coverageBody, d.product),
      tabPanel('history', 'folder_open', 'ประวัติการเคลม', 'เคลมภายใต้ผู้เอาประกันและกรมธรรม์ที่เลือก', historyBody, claims.length + ' รายการ'),
      tabPanel('memo', 'sticky_note_2', 'บันทึกข้อความ', 'ข้อความประกอบการทำรายการเคลม', memoBody, memoSource.length + ' รายการ'),
      tabPanel('payment', 'account_balance_wallet', 'รายละเอียดการจ่ายเงิน', 'ข้อมูลการชำระเงินของเคลมตามลำดับขั้นตอน', paymentBody)
    )));
  }
  async function open(record, insured, history, relatedClaims = []) {
    const node = page(), token = ++request;
    const previous = Array.from(document.querySelectorAll('.page:not(.hidden)'));
    const oldTitle = pageTitle.textContent, oldSubtitle = pageSubtitle.textContent;
    const focus = document.activeElement;
    const oldDocumentTitle = document.title;
    const scroll = window.scrollY;
    const back = () => {
      request++;
      node.classList.add('hidden');
      previous.forEach(p => p.classList.remove('hidden'));
      pageTitle.textContent = oldTitle; pageSubtitle.textContent = oldSubtitle; document.title = oldDocumentTitle;
      window.scrollTo(0, scroll); focus?.focus({ preventScroll: true });
    };
    previous.forEach(p => p.classList.add('hidden'));
    node.classList.remove('hidden');
    const category = deathClaim(first(record.claimCategory, record.category, record.claimSource)) ? 'Death & Disability' : hospitalClaim(first(record.claimCategory, record.category, record.claimSource)) ? 'เคลมโรงพยาบาล' : 'เคลมลูกค้า';
    pageTitle.textContent = 'รายละเอียด' + (category === 'Death & Disability' ? ' ' : '') + category;
    pageSubtitle.textContent = 'งานเคลม / ค้นหาเคลม / ดูรายละเอียด';
    document.title = pageTitle.textContent + ' | ClaimAgent';
    if (!root) {
      const loading = document.createElement('p');
      loading.setAttribute('role', 'status');
      loading.style.padding = '24px';
      loading.textContent = 'กำลังโหลดรายละเอียดเคลม…';
      node.replaceChildren(loading);
    }
    window.scrollTo(0, 0);
    try {
      await ready();
      if (token !== request || node.classList.contains('hidden')) return;
      if (!root) { node.replaceChildren(); root = ReactDOM.createRoot(node); }
      render(reconcileSearchClaim(mockDetail(normalize(record, insured || {}, history), record), record, insured || {}), back, relatedClaims);
    } catch (e) {
      node.replaceChildren(); root = null;
      const message = document.createElement('p'); message.setAttribute('role', 'alert'); message.textContent = 'โหลดส่วนแสดงผลไม่สำเร็จ กรุณาลองอีกครั้ง';
      const retry = document.createElement('button'); retry.textContent = 'ลองอีกครั้ง'; retry.onclick = () => { back(); open(record, insured, history); };
      const cancel = document.createElement('button'); cancel.textContent = 'กลับ'; cancel.onclick = back;
      node.append(message, retry, cancel);
    }
  }
  window.openClaimRecordDetail = function (index) {
    if (typeof claimRecordSearchSource === 'undefined' || claimRecordSearchSource !== 'topMenu') return originalRecord.apply(this, arguments);
    const record = claimRecordCurrentRows[index];
    if (!record) return;
    const product = first(record.product, claimRecordProduct);
    const insured = typeof getClaimSearchInsuredRows === 'function' ? getClaimSearchInsuredRows(product).find(x => record.appId && x.appId === record.appId) : null;
    return open({ ...record, product }, insured, false, Array.isArray(insured?.claimHistory) ? insured.claimHistory : []);
  };
  window.openClaimSearchHistoryModal = function (index, mode) {
    if (mode === 'edit' || claimRecordSearchSource !== 'topMenu') return originalHistory.apply(this, arguments);
    const record = claimSearchInsuredCurrentHistoryRows[index];
    if (record && claimSearchInsuredCurrentRow) return open(record, claimSearchInsuredCurrentRow, true, claimSearchInsuredCurrentHistoryRows);
  };
})();
