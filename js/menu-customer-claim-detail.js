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
  const tone = value => /ไม่สำเร็จ|ปฏิเสธ|error|failed|rejected/i.test(value || '') ? 'error' : /รอ|warning|NPL|Exgratia/i.test(value || '') ? 'warning' : /อนุมัติ|สำเร็จ|ครบถ้วน|approved|success/i.test(value || '') ? 'success' : 'default';
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
      claimType: treatment, claimStatus: first(d.claimStatus, 'Close'),
      school: pa ? first(d.school, 'โรงเรียนวัฒนาศึกษา') : undefined,
      hospital: first(d.hospital, 'โรงพยาบาลสินแพทย์'), branch: 'กรุงเทพมหานคร',
      cause: pa ? 'อุบัติเหตุ' : 'เจ็บป่วย', coverage: 'ค่ารักษาพยาบาล',
      notifiedDate: dateAt('10:00:23'), documentsCompleteDate: completedAt('13:15:08'),
      incidentDate: dateAt('08:30'), admitDate: dateAt('09:10'),
      dischargeDate: ipd ? (() => { const [dd,mm,yy] = day.split('/').map(Number); const v = new Date(yy - 543, mm - 1, dd + 2); return `${String(v.getDate()).padStart(2,'0')}/${String(v.getMonth()+1).padStart(2,'0')}/${v.getFullYear()+543} 10:30`; })() : dateAt('10:30'),
      ipdDays: ipd ? 2 : 0, icuDays: 0, totalDays: ipd ? 2 : 0,
      chiefComplaint: pa ? 'หกล้มขณะเล่นกีฬา มีแผลถลอกบริเวณเข่าขวา' : 'ปวดท้อง ถ่ายเหลว คลื่นไส้ อาเจียนก่อนมาโรงพยาบาล 6 ชั่วโมง',
      diagnosis1: pa ? 'S80.0 — Contusion of knee / ฟกช้ำบริเวณเข่า' : 'A09 — Gastroenteritis / กระเพาะและลำไส้อักเสบ',
      diagnosis2: pa ? 'S80.8 — Superficial injury of lower leg / แผลถลอกบริเวณขา' : 'E86 — Volume depletion / ภาวะขาดน้ำ', diagnosis3: 'ไม่มีการวินิจฉัยเพิ่มเติม',
      detail: pa ? 'ลื่นล้มบริเวณสนามกีฬาของสถานศึกษา แพทย์ล้างแผล ให้ยา และแนะนำการดูแลแผล นัดติดตามอาการตามความเหมาะสม' : (ipd ? 'แพทย์ให้สารน้ำทางหลอดเลือดและยาตามอาการ พักรักษาตัว 2 วัน อาการดีขึ้นก่อนจำหน่าย' : 'รับการรักษาแบบผู้ป่วยนอก ให้ยาและสารน้ำ อาการดีขึ้น แพทย์อนุญาตให้กลับบ้าน'),
      idCard: first(d.idCard, d.id, d.insured.idCard, '1-XXXX-XXXXX-42-8'),
      dob: first(d.dob, d.insured.dob, pa ? '15/05/2555' : '15/05/2534'), age: first(d.age, d.insured.age, age + ' ปี'),
      phone: first(d.phone, d.insured.phone, '081-XXX-4521'), start: first(d.start, d.insured.start, '01/01/2569'), end: first(d.end, d.insured.end, '31/12/2569'), appStatus: 'มีผลคุ้มครอง',
      insuredType: pa ? 'นักเรียน / นักศึกษา' : undefined, studentCard: pa ? first(d.studentCard, d.insured.studentCard, 'ST6900142') : undefined,
      schoolData: pa ? { appId: 'PA69001288', address: '128 ถนนประชาราษฎร์ แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800', contact: 'นางสาวปาริชาติ วัฒนกุล', position: 'ครูผู้ประสานงานประกันอุบัติเหตุ', contactId: '1-XXXX-XXXXX-65-2', phone: '02-XXX-1842 ต่อ 105', bank: 'ธนาคารกรุงไทย', account: 'XXX-X-45123-X', accountName: first(d.school, 'โรงเรียนวัฒนาศึกษา'), insurer: 'บริษัทประกันภัยตัวอย่าง จำกัด (มหาชน)', planType: 'อุบัติเหตุกลุ่มนักเรียน • ค่ารักษา 30,000 บาท/ครั้ง', status: 'มีผลคุ้มครอง', ...d.schoolData } : {},
      financial: { receipt, benefit, discount, nonCovered, nplExgratia: exgratia, approvedNet: approved, transfer: failed || pending ? 0 : approved },
      paymentStatus: first(d.paymentStatus, 'โอนสำเร็จ'),
      decision: { result: 'อนุมัติ', date: ipd ? (() => { const [dd,mm,yy] = day.split('/').map(Number); const v = new Date(yy - 543, mm - 1, dd + 2); return `${String(v.getDate()).padStart(2,'0')}/${String(v.getMonth()+1).padStart(2,'0')}/${v.getFullYear()+543} 14:20:50`; })() : dateAt('14:20:50'), user: '06590 - ณัฏฐณิชา โตรักษา', reason: 'เหตุและการรักษาอยู่ในช่วงความคุ้มครอง เอกสารประกอบครบถ้วน', note: 'ตรวจสอบใบเสร็จ ใบรับรองแพทย์ และข้อมูลผู้เอาประกันแล้ว', specialCondition: `ไม่คุ้มครองเวชภัณฑ์ส่วนเกิน ${amount(nonCovered)} บาท`, nplExgratiaReason: exgratia ? 'อนุมัติ Exgratia สำหรับเวชภัณฑ์จำเป็นประกอบการรักษา 100.00 บาท ตามผลพิจารณาตัวอย่าง' : 'ไม่มีการอนุมัติ NPL / Exgratia' },
      expenses,
      ipdCompensation: ipd ? [{ item: 'ค่าชดเชยรายวัน (แสดงแยกจากค่ารักษา)', days: 2, rate: 0, benefit: 0, approved: 0, note: 'แผนตัวอย่างนี้ไม่มีผลประโยชน์ค่าชดเชยรายวัน' }] : [],
      documents: ['ใบเสร็จรับเงิน', 'ใบรับรองแพทย์', pa ? 'แบบแจ้งอุบัติเหตุนักเรียน' : 'แบบเรียกร้องค่าสินไหม', 'สำเนาหน้าบัญชีธนาคาร'].map((name, i) => ({ name: name + '.pdf', type: name, uploadDate: completedAt('13:' + (10+i) + ':00'), user: '06590 - ณัฏฐณิชา โตรักษา', ocr: i < 2 ? 'ตรวจสอบแล้ว' : 'ไม่ต้องตรวจ OCR', status: 'ครบถ้วน', note: i < 2 ? 'ข้อมูลตรงกับรายการเคลม' : 'ตรวจสอบโดยเจ้าหน้าที่', mockPreview: true }))
    };
  }
  function render(d, goBack) {
    const h = React.createElement;
    const { ThemeProvider, createTheme, Box, Typography, Button, Chip, Stack, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } = MaterialUI;
    const theme = createTheme({
      typography: { fontFamily: 'var(--ui-font, Sarabun, sans-serif)', fontSize: 14 },
      palette: { primary: { main: '#1458d6' }, success: { main: '#15925c' }, warning: { main: '#b66b08' }, error: { main: '#d63f53' }, text: { primary: '#10243e', secondary: '#6d7d90' } },
      shape: { borderRadius: 14 },
      components: { MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none' } } }, MuiTableCell: { styleOverrides: { root: { fontFamily: 'var(--ui-font, Sarabun, sans-serif)', fontSize: 14, padding: '12px 15px', borderBottom: '1px solid #e7eef6' }, head: { fontWeight: 700, background: '#eef5fb', color: '#365a7d', whiteSpace: 'nowrap' } } } }
    });
    const badge = value => h(Chip, { label: text(value), color: tone(value), size: 'small', sx: { fontWeight: 600, maxWidth: '100%', height: 'auto', minHeight: 26, '& .MuiChip-label': { whiteSpace: 'normal', py: .3 } } });
    const fields = (items, extra) => h(Box, { component: 'dl', className: 'ccro-fields', sx: extra }, items.map(([label, value, color, money]) => h(Box, { key: label, className: /อาการสำคัญ|คำวินิจฉัย|รายละเอียด|เหตุผล|หมายเหตุ|เงื่อนไขพิเศษ|ที่อยู่/.test(label) ? 'ccro-field-wide' : undefined, sx: { minWidth: 0 } },
      h(Typography, { component: 'dt', variant: 'caption', color: 'text.secondary' }, label),
      h(Typography, { component: 'dd', sx: { m: 0, mt: .5, fontWeight: 500, overflowWrap: 'anywhere', color: color || 'text.primary', ...(money ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } : {}) } }, money ? amount(value) : text(value))
    )));
    const sectionSubtitles = { claim: 'เหตุการณ์ การรักษา และการวินิจฉัย', insured: 'ข้อมูลบุคคลและกรมธรรม์ที่ใช้พิจารณา', school: 'ข้อมูลสถานศึกษาและผู้ประสานงาน', financial: 'ยอดเรียกร้อง สิทธิประโยชน์ และยอดอนุมัติ', expenses: 'รายละเอียดค่ารักษาและผลการพิจารณารายการ', docs: 'เอกสารที่ใช้ประกอบการพิจารณาเคลม', decision: 'ข้อสรุป เหตุผล และเงื่อนไขการพิจารณา' };
    const section = (id, title, icon, body) => h(Box, { component: 'section', id: 'ccro-' + id, className: 'ccro-section', 'aria-labelledby': 'ccro-heading-' + id },
      h(Box, { className: 'ccro-section-head' }, h('span', { className: 'material-icons-round ccro-section-icon', 'aria-hidden': true }, icon), h(Box, null, h(Typography, { component: 'h2', id: 'ccro-heading-' + id }, title), h(Typography, { component: 'p' }, sectionSubtitles[id]))), h(Box, { className: 'ccro-section-body' }, body));
    const table = (label, headers, rows, monetary = [], colors = {}) => h(TableContainer, { tabIndex: 0, role: 'region', 'aria-label': label, sx: { overflowX: 'auto', border: '1px solid #e2eaf1', borderRadius: 1 } }, h(Table, { size: 'small', sx: { minWidth: 850 } },
      h('caption', { style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } }, label),
      h(TableHead, null, h(TableRow, null, headers.map((label, i) => h(TableCell, { key: i, scope: 'col', align: monetary.includes(i) ? 'right' : 'left' }, label)))),
      h(TableBody, null, rows.length ? rows.map((row, ri) => h(TableRow, { key: ri }, row.map((v, i) => h(TableCell, { key: i, align: monetary.includes(i) ? 'right' : 'left', sx: { color: colors[i], minWidth: i === 0 ? 180 : undefined, fontVariantNumeric: 'tabular-nums', whiteSpace: monetary.includes(i) ? 'nowrap' : undefined } }, monetary.includes(i) ? amount(v) : React.isValidElement(v) ? v : text(v))))) : h(TableRow, null, h(TableCell, { colSpan: headers.length, align: 'left', sx: { py: 4, color: 'text.secondary' } }, h(Box, { component: 'span', sx: { position: 'sticky', left: 16, display: 'inline-block' } }, 'ไม่มีข้อมูล') )))));
    const a = d.insured, s = d.schoolData, f = d.financial, decision = d.decision || {}, pa = d.product === 'PA';
    const decisionResult = first(decision.result, d.decisionResult);
    const expenseRows = d.expenses.map(x => [x.item, x.receipt, x.benefit, x.discount, x.nonCovered, x.approved, x.nplExgratia, x.note]);
    if (d.mock) expenseRows.push(['รวมค่ารักษาพยาบาล', f.receipt, f.benefit, f.discount, f.nonCovered, f.approvedNet, f.nplExgratia, 'รวม Exgratia ในยอดอนุมัติแล้ว']);
    const safeUrl = value => { try { const u = new URL(value, location.href); return ['http:', 'https:', 'blob:'].includes(u.protocol) && value ? u.href : undefined; } catch (_) { return undefined; } };
    function MockPreview({ doc }) {
      const [opened, setOpened] = React.useState(false);
      return h(React.Fragment, null,
        h(Button, { size: 'small', variant: 'outlined', onClick: () => setOpened(true) }, 'ดูเอกสาร'),
        h(MaterialUI.Dialog, { open: opened, onClose: () => setOpened(false), fullWidth: true, maxWidth: 'sm', 'aria-labelledby': 'ccro-preview-title', container: document.getElementById(pageId) },
          h(MaterialUI.DialogTitle, { id: 'ccro-preview-title' }, doc.type),
          h(MaterialUI.DialogContent, { dividers: true },
            h(Typography, { variant: 'caption', color: 'text.secondary' }, 'ตัวอย่างเอกสาร • สำหรับแสดงหน้าจอเท่านั้น'),
            h(Box, { sx: { mt: 2, p: 3, border: '1px solid #dce5ee', borderRadius: 1 } },
              h(Typography, { fontWeight: 700, sx: { mb: 2 } }, doc.type),
              fields([['ผู้เอาประกัน', d.name], ['เลขที่เคลม', d.claimNo], ['สถานพยาบาล', d.hospital], ['วันที่เอกสาร', doc.uploadDate]]),
              h(Typography, { sx: { mt: 3, lineHeight: 1.8 } }, doc.type === 'ใบเสร็จรับเงิน' ? 'ยอดค่ารักษาพยาบาลรวม ' + amount(d.financial.receipt) + ' บาท รายละเอียดตรงกับตารางค่าใช้จ่ายของเคลมนี้' : doc.type === 'ใบรับรองแพทย์' ? d.chiefComplaint + ' • ' + d.diagnosis1 : 'ตรวจสอบชื่อผู้เอาประกัน เลขที่อ้างอิง และข้อมูลประกอบการเรียกร้องแล้ว'))),
          h(MaterialUI.DialogActions, null, h(Button, { onClick: () => setOpened(false) }, 'ปิด'))));
    }
    const docRows = d.documents.map(x => {
      const url = safeUrl(first(x.previewUrl, x.url));
      return [x.name, x.type, x.uploadDate, x.user, x.ocr, badge(x.status), x.note, x.mockPreview ? h(MockPreview, { doc: x }) : url ? h(Button, { component: 'a', href: url, target: '_blank', rel: 'noopener noreferrer', size: 'small', 'aria-label': 'ดูเอกสาร ' + text(x.name) + ' (เปิดแท็บใหม่)' }, 'ดู / Preview ↗') : h(Typography, { variant: 'caption', color: 'text.secondary' }, 'ไม่มีไฟล์สำหรับดู')];
    });
    const navigation = [['claim', 'ข้อมูลเคลม'], ['insured', 'ผู้เอาประกัน'], ...(pa ? [['school', 'สถานศึกษา']] : []), ['financial', 'การเงิน'], ['expenses', 'ค่าใช้จ่าย'], ['docs', 'เอกสาร'], ['decision', 'ผลพิจารณา']];
    const contextItems = [['inventory_2', 'ผลิตภัณฑ์', d.product], ['person', 'ประเภทเคลม', 'เคลมลูกค้า'], ['medical_services', 'ประเภทการรักษา', d.claimType], ['schedule', 'สถานะ', d.claimStatus]];
    const quickItems = [['calendar_month', 'วันที่แจ้งเคลม', d.notifiedDate], ['fact_check', 'วันที่พิจารณา', first(decision.date, d.decisionDate)], ['person_outline', 'ผู้พิจารณา', first(decision.user, d.reviewer)], ['local_hospital', 'โรงพยาบาล', d.hospital], ['location_on', 'สาขา', d.branch]];
    const refItems = [['receipt_long', 'Claim No.', d.claimNo], ['description', 'Case No.', d.caseNo], ['badge', 'Application ID', d.appId]];
    root.render(h(ThemeProvider, { theme }, h(Box, { className: 'ccro-shell' },
      h(Box, { className: 'ccro-backline' }, h(Button, { onClick: goBack, className: 'ccro-back-btn', startIcon: h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'arrow_back') }, 'กลับหน้ารายการเคลม'), h(Box, { className: 'ccro-page-heading' }, h(Typography, { component: 'h2' }, 'รายละเอียดเคลม'), h(Typography, { component: 'p' }, 'ตรวจสอบข้อมูลผู้เอาประกัน การรักษา การเงิน และผลพิจารณา'))),
      h(Paper, { variant: 'outlined', className: 'ccro-contextbar' }, h(Box, { className: 'ccro-context-intro' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'tune'), h(Box, null, h(Typography, { component: 'strong' }, 'บริบทของรายการที่เลือก'), h(Typography, { component: 'span' }, 'ข้อมูลมาจาก Claim ที่เลือกในหน้าค้นหา'))), h(Box, { className: 'ccro-context-items' }, contextItems.map(([icon, label, value]) => h(Box, { className: 'ccro-context-item', key: label }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, icon), h(Box, null, h(Typography, { component: 'small' }, label), h(Typography, { component: 'b' }, text(value))))))),
      d.mock && h(Box, { className: 'ccro-mock-alert', role: 'note' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'visibility'), h(Box, null, h(Typography, { component: 'strong' }, 'Mockup · ข้อมูลตัวอย่าง · อ่านอย่างเดียว'), h(Typography, { component: 'span' }, 'ข้อมูลนี้ใช้สำหรับตรวจสอบหน้าจอและผลลัพธ์เท่านั้น ไม่มีผลต่อการอนุมัติหรือการโอนเงิน'))),
      h(Box, { component: 'section', className: 'ccro-hero', 'aria-label': 'สรุปเคลมลูกค้า' },
        h(Box, { className: 'ccro-identity' },
          h(Stack, { direction: 'row', gap: 1, flexWrap: 'wrap', sx: { mb: 1 } }, [d.product, d.claimType, present(d.plan) ? 'แผน : ' + d.plan : 'แผน : —'].filter(present).map((v, i) => h(Chip, { key: i, label: v, size: 'small', sx: { color: '#fff', border: '1px solid #ffffff55', background: '#ffffff18' } }))),
          h(Typography, { component: 'h1', sx: { fontSize: { xs: 22, md: 28 }, fontWeight: 600, lineHeight: 1.4 } }, text(d.name)),
          pa && h(Box, { className: 'ccro-school-highlight' }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, 'school'), h(Box, null, h(Typography, { component: 'small' }, 'สถานศึกษา · PA'), h(Typography, { component: 'strong' }, text(d.school))))
        ),
        h(Box, { className: 'ccro-total' }, h(Typography, { fontSize: 13 }, 'ยอดอนุมัติสุทธิ (THB)'), h(Typography, { className: 'ccro-approved', sx: { fontSize: { xs: 32, md: 38 }, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.5 } }, amount(f.approvedNet)),
          h(Stack, { direction: 'row', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }, h(Box, null, h(Typography, { variant: 'caption', display: 'block' }, 'ผลพิจารณา'), badge(decisionResult)), h(Box, null, h(Typography, { variant: 'caption', display: 'block' }, 'สถานะการชำระเงิน'), badge(d.paymentStatus)))
        ),
        h(Box, { className: 'ccro-refs' }, h(Box, { className: 'ccro-ref-list' }, refItems.map(([icon, label, value]) => h(Box, { className: 'ccro-ref-item', key: label }, h('span', { className: 'material-icons-round', 'aria-hidden': true }, icon), h(Typography, { component: 'span' }, label), h(Typography, { component: 'b' }, text(value))))), h(Box, { className: 'ccro-hero-status' }, h(Chip, { label: 'ประเภทเคลม: เคลมลูกค้า', size: 'small' }), h(Chip, { label: 'สถานะเคลม: ' + text(d.claimStatus), size: 'small' })))
      ),
      h(Paper, { variant: 'outlined', className: 'ccro-quick' }, h(Box, { className: 'ccro-quick-grid' }, quickItems.map(([icon, label, value]) => h(Box, { className: 'ccro-quick-item', key: label }, h('span', { className: 'material-icons-round ccro-quick-icon', 'aria-hidden': true }, icon), h(Box, null, h(Typography, { component: 'small' }, label), h(Typography, { component: 'strong' }, text(value))))))),
      h(Box, { component: 'nav', className: 'ccro-nav', 'aria-label': 'ส่วนรายละเอียดเคลม' }, navigation.map(([id, label], index) => h(Button, { key: id, component: 'a', href: '#ccro-' + id, className: 'ccro-nav-link' + (index === 0 ? ' is-active' : ''), startIcon: h('span', { className: 'material-icons-round', 'aria-hidden': true }, ({ claim:'description', insured:'person', school:'school', financial:'account_balance_wallet', expenses:'receipt_long', docs:'folder_open', decision:'fact_check' })[id]), onClick: e => { e.preventDefault(); e.currentTarget.parentElement.querySelectorAll('.ccro-nav-link').forEach(item => item.classList.remove('is-active')); e.currentTarget.classList.add('is-active'); document.getElementById('ccro-' + id).scrollIntoView({ block: 'start' }); } }, label))),
      h(Paper, { variant: 'outlined', className: 'ccro-sections' },
        section('claim', 'ข้อมูลเคลม', 'description', fields([
          ['เหตุของการเคลม', first(d.cause, d.claimCause)], ['ประเภทความคุ้มครอง', first(d.coverage, d.coverageType)], ['ประเภทการรักษา OPD / IPD / DayCase', d.claimType], ['วันที่แจ้งเคลม', d.notifiedDate], ['วันที่เอกสารครบ', d.documentsCompleteDate], ['วัน / เวลาเกิดเหตุ', d.incidentDate], ['วัน / เวลาเข้าโรงพยาบาล', d.admitDate], ['วัน / เวลาออกโรงพยาบาล', d.dischargeDate], ['จำนวนวัน IPD', d.ipdDays], ['จำนวนวัน ICU', d.icuDays], ['จำนวนวันรวม', d.totalDays], ['อาการสำคัญ (Chief Complaint)', d.chiefComplaint], ['คำวินิจฉัย 1', d.diagnosis1], ['คำวินิจฉัย 2', d.diagnosis2], ['คำวินิจฉัย 3', d.diagnosis3], ['รายละเอียด', first(d.detail, d.note)]
        ])),
        section('insured', 'ข้อมูลผู้เอาประกัน', 'person', fields([
          ['ชื่อ–สกุล', d.name], ['เลขบัตรประชาชน', first(d.idCard, d.id, a.idCard, a.id)], ['วันเกิด', first(d.dob, a.dob)], ['อายุ', first(d.age, a.age)], ['เบอร์โทรศัพท์', first(d.phone, a.phone)], ['Application ID', d.appId], ['แผน', d.plan], ['วันที่เริ่มคุ้มครอง', first(d.start, a.start)], ['วันที่สิ้นสุดความคุ้มครอง', first(d.end, a.end)], ['สถานะผู้เอาประกัน', first(d.appStatus, a.appStatus)], ...(pa ? [['ประเภทผู้เอาประกัน', first(d.insuredType, a.insuredType)], ['เลขบัตรประกันนักเรียน', first(d.studentCard, a.studentCard)]] : [])
        ])),
        pa && section('school', 'ข้อมูลสถานศึกษา', 'school', fields([
          ['ชื่อสถานศึกษา', d.school], ['Application ID สถานศึกษา', s.appId], ['ที่อยู่', s.address], ['ผู้ติดต่อ', s.contact], ['ตำแหน่ง', s.position], ['เลขบัตรประชาชนผู้ติดต่อ', s.contactId], ['เบอร์โทรศัพท์', s.phone], ['ธนาคาร', s.bank], ['เลขบัญชี', s.account], ['ชื่อบัญชี', s.accountName], ['บริษัทประกัน', s.insurer], ['ประเภทแผน', s.planType], ['สถานะสถานศึกษา', s.status]
        ])),
        section('financial', 'สรุปการเงิน', 'account_balance_wallet', fields([
          ['ยอดตามใบเสร็จ', f.receipt, null, true], ['สิทธิประโยชน์', f.benefit, null, true], ['ส่วนลด', f.discount, null, true], ['ส่วนที่ไม่คุ้มครอง', f.nonCovered, 'error.main', true], ['NPL / Exgratia', f.nplExgratia, 'warning.main', true], ['ยอดอนุมัติสุทธิ', f.approvedNet, 'success.main', true], ['ยอดโอนเงิน', f.transfer, null, true]
        ])),
        section('expenses', 'รายละเอียดค่าใช้จ่าย', 'receipt_long', h(React.Fragment, null,
          table('รายละเอียดค่าใช้จ่าย', ['รายการ', 'ใบเสร็จ', 'สิทธิประโยชน์', 'ส่วนลด', 'ไม่คุ้มครอง', 'อนุมัติ', 'NPL / Exgratia', 'หมายเหตุ'], expenseRows, [1, 2, 3, 4, 5, 6], { 4: 'error.main', 5: 'success.main', 6: 'warning.main' }),
          (d.claimType === 'IPD' || d.ipdCompensation.length > 0) && h(Box, { sx: { mt: 3 } }, h(Typography, { component: 'h3', fontWeight: 600, sx: { mb: 1 } }, 'ค่าชดเชย IPD'), table('ค่าชดเชย IPD', ['รายการ', 'จำนวนวัน', 'อัตราต่อวัน', 'สิทธิประโยชน์', 'อนุมัติ', 'หมายเหตุ'], d.ipdCompensation.map(x => [x.item, x.days, x.rate, x.benefit, x.approved, x.note]), [2, 3, 4], { 4: 'success.main' }))
        )),
        section('docs', 'เอกสารประกอบการเคลม', 'folder_open', table('เอกสารประกอบการเคลม', ['ชื่อเอกสาร', 'ประเภท', 'วันที่อัปโหลด', 'ผู้อัปโหลด', 'OCR', 'สถานะ', 'หมายเหตุ', 'ดูเอกสาร'], docRows)),
        section('decision', 'ผลการพิจารณา', 'fact_check', h(React.Fragment, null, h(Box, { sx: { mb: 2 } }, badge(decisionResult)), fields([
          ['วันที่พิจารณา', first(decision.date, d.decisionDate)], ['ผู้พิจารณา', first(decision.user, d.reviewer)], ['เหตุผล', decision.reason], ['หมายเหตุ', decision.note], ['เงื่อนไขพิเศษ', decision.specialCondition], ['เหตุผล NPL / Exgratia', decision.nplExgratiaReason, 'warning.main']
        ])))
      )
    )));
  }
  async function open(record, insured, history) {
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
    pageTitle.textContent = 'รายละเอียดเคลมลูกค้า';
    pageSubtitle.textContent = 'งานเคลม / ค้นหาเคลม / ดูรายละเอียด';
    document.title = 'รายละเอียดเคลมลูกค้า | ClaimAgent';
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
      render(mockDetail(normalize(record, insured || {}, history), record), back);
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
    return open({ ...record, product }, insured, false);
  };
  window.openClaimSearchHistoryModal = function (index, mode) {
    if (mode === 'edit' || claimRecordSearchSource !== 'topMenu') return originalHistory.apply(this, arguments);
    const record = claimSearchInsuredCurrentHistoryRows[index];
    if (record && claimSearchInsuredCurrentRow) return open(record, claimSearchInsuredCurrentRow, true);
  };
})();
