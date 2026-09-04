/* ============================================================
   menu-billing-hospital-review.js
   วางบิลเคลม > เคลมโรงพยาบาล > ตรวจสอบรายการวางบิล
   แยกออกมาจาก index.html เดิม (5 script block ตามลำดับที่รันจริง)
   ห้ามสลับลำดับ 5 ส่วนนี้ เพราะส่วนท้ายเป็น patch ที่ override ฟังก์ชันจากส่วนต้น
   ============================================================ */

/* ---- core module: render step 1-4 ของหน้าตรวจสอบรายการวางบิลโรงพยาบาล (เดิมอยู่บรรทัด 34300-35009) ---- */
/* Override: วางบิลเคลม > เคลมโรงพยาบาล > ตรวจสอบรายการวางบิล (new clean flow) */
(function(){
  const REVIEW_PAGE_ID = 'billingHospitalReviewPage';
  const money = (value) => Number(String(value || 0).replace(/,/g,'') || 0).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
  const num = (value) => Number(String(value || 0).replace(/,/g,'') || 0);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const billingExpenseMaster = [
    '1.1.1 ยาแผนปัจจุบัน - ยาอันตราย',
    '1.1.2 ยาแผนปัจจุบัน - ยาควบคุมพิเศษ',
    '1.1.3 ยาแผนปัจจุบัน - ยาสามัญประจำบ้าน',
    '1.1.4 ยาแผนปัจจุบัน - ยาใช้ภายนอก',
    '1.1.5 ยาแผนปัจจุบัน - ยาใช้เฉพาะที่',
    '1.1.6 ยาแผนปัจจุบัน - ยาฉีด',
    '1.1.7 ยาแผนปัจจุบัน - วัคซีน',
    '1.1.8 ยาแผนปัจจุบัน - สารน้ำทางหลอดเลือด',
    '1.1.9 สารอาหารทางหลอดเลือด',
    '1.2.1 เวชภัณฑ์และอุปกรณ์ทางการแพทย์',
    '1.3.1 ค่าตรวจทางห้องปฏิบัติการ',
    '1.4.1 ค่าตรวจวินิจฉัยทางรังสี / Imaging',
    '1.5.1 ค่าแพทย์ตรวจรักษา',
    '1.6.1 ค่าห้องและค่าอาหารผู้ป่วยใน',
    '1.7.1 ค่าบริการพยาบาล'
  ];

  const billingNonCoverageReasons = [
    'เป็นโรคยกเว้น',
    'อยู่ในระยะเวลารอคอย',
    'ตัวยาไม่คุ้มครอง',
    'เป็นข้อยกเว้นของกรมธรรม์',
    'เกินสิทธิ์ความคุ้มครอง',
    'เวชภัณฑ์ไม่คุ้มครอง',
    'ปฏิเสธโดยบริษัทรับประกัน'
  ];

  function formatBillingCaseNo(bill,rowId){
    const existing = String(bill?.caseNo || '').trim().toUpperCase();
    if(/^CC\d{10}$/.test(existing)) return existing;
    const rawDate = String(bill?.sentDate || '').trim();
    const dateParts = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const currentBuddhistYear = new Date().getFullYear() + 543;
    const year = dateParts ? dateParts[3] : String(currentBuddhistYear);
    const month = dateParts ? dateParts[2] : String(new Date().getMonth() + 1);
    const runningSource = String(bill?.hospitalBillNo || rowId || '').replace(/\D/g,'') || '1';
    return `CC${String(year).slice(-2)}${String(month).padStart(2,'0')}${runningSource.slice(-6).padStart(6,'0')}`;
  }

  function normalizeBillingExpenseReasons(expenses){
    return (expenses || []).map(row => {
      const uncovered = num(row.uncovered);
      let reason = uncovered > 0 && billingNonCoverageReasons.includes(row.reason) ? row.reason : '';
      if (uncovered > 0 && !reason) {
        const item = String(row.item || '');
        if (/ยา/.test(item)) reason = 'ตัวยาไม่คุ้มครอง';
        else if (/เวชภัณฑ์|อุปกรณ์/.test(item)) reason = 'เวชภัณฑ์ไม่คุ้มครอง';
        else reason = 'เกินสิทธิ์ความคุ้มครอง';
      }
      return {...row, uncovered, reason};
    });
  }

  const billingReviewCases = {
    HB001: {
      bill: { billNo:'HB690700501', hospitalBillNo:'PB0000000001', sentDate:'09/07/2569', claimCode:'CL690700501', hospital:'โรงพยาบาลกรุงเทพ', province:'กรุงเทพมหานคร', claimType:'OPD Full', status:'รอตรวจสอบ', billAmount:42850 },
      decisionAmounts: { totalExpense:42850, hospitalCompanyRight:41750 },
      billingAmounts: { endBillDiscount:0, netBillableAmount:41750 },
      insuranceExcess: { enabled:false, company:'' },
      insured: { name:'นางสาวกัญญาพัชร จิตต์มงคล', idCard:'1103700987456', appId:'APP690700501', phone:'089-452-1188', appStatus:'ปกติ', age:'7 ปี 6 เดือน', coverageStart:'01/06/2569', coverageEnd:'31/05/2570', plan:'PH Silver' },
      claim: { cause:'เจ็บป่วย', coverage:'ค่ารักษา', treatment:'OPD', symptomDate:'09/07/2569', incidentDate:'09/07/2569', incidentTime:'08:30', admitDate:'09/07/2569', admitTime:'09:15', dischargeDate:'09/07/2569', dischargeTime:'12:40', hospital:'โรงพยาบาลกรุงเทพ', chiefComplaint:'ไข้ ไอ เจ็บคอ ปวดเมื่อย และอ่อนเพลีย 2 วัน', diagnosis1:'J02.9 : Acute pharyngitis, unspecified', diagnosis2:'R50.9 : Fever, unspecified', diagnosis3:'-', note:'OPD Full มีรายการตรวจและให้สารน้ำ' },
      medical: { hn:'HN690700501', vn:'VN690709001', an:'-', ud:'ไม่มี', diagnosis:'Acute pharyngitis with fever', lab:'CBC, Influenza test, Chest X-ray', treatmentMethod:'ให้ยาลดไข้ ยาฆ่าเชื้อ และ IV Fluid', procedure:'ไม่ใช่', ipdDays:0, icuDays:0, doctorLicense:'45123', doctor:'นพ.ปกรณ์ วัฒนเวช' },
      expenses: [
        { item:'1.5.1 ค่าแพทย์ตรวจรักษา', claim:1200, discount:0, uncovered:0, reason:'', note:'ตรวจโดยแพทย์อายุรกรรม' },
        { item:'1.8.1 ค่าสังเกตอาการ / ห้องฉุกเฉิน', claim:6500, discount:350, uncovered:0, reason:'', note:'Observation room' },
        { item:'1.3.1 ค่าตรวจทางห้องปฏิบัติการ', claim:9800, discount:0, uncovered:0, reason:'', note:'CBC, Influenza test' },
        { item:'1.4.1 ค่าตรวจวินิจฉัยทางรังสี / Imaging', claim:7200, discount:0, uncovered:0, reason:'', note:'Chest X-ray' },
        { item:'1.1.1 ยาแผนปัจจุบัน - ยาอันตราย', claim:8450, discount:0, uncovered:500, reason:'ยาบางรายการนอกบัญชี', note:'เวชภัณฑ์บางรายการ' },
        { item:'1.1.8 ยาแผนปัจจุบัน - สารน้ำทางหลอดเลือด', claim:3200, discount:0, uncovered:0, reason:'', note:'ให้น้ำเกลือและยาฉีด' },
        { item:'1.9.1 ค่าบริการสถานพยาบาล', claim:6500, discount:0, uncovered:250, reason:'บริการส่วนเกิน', note:'ค่าบริการเวชระเบียน' }
      ],
      docs: [
        { code:'DOC-HB501-01', type:'แบบฟอร์ม A', file:'form_a_cl690700501.pdf', count:1, result:'ผ่าน', note:'ข้อมูลครบถ้วน' },
        { code:'DOC-HB501-02', type:'แบบฟอร์ม B', file:'form_b_cl690700501.pdf', count:1, result:'ผ่าน', note:'ตรงกับข้อมูลแจ้งเคลม' },
        { code:'DOC-HB501-03', type:'ใบแจ้งหนี้', file:'invoice_501.pdf', count:1, result:'ผ่าน', note:'ยอดตรงกับหน้าวางบิล' },
        { code:'DOC-HB501-04', type:'รายละเอียดใบแจ้งหนี้', file:'invoice_detail_501.pdf', count:1, result:'ผ่าน', note:'แยกรายการครบ' },
        { code:'DOC-HB501-05', type:'ผลการตรวจ LAB / X-ray', file:'lab_xray_501.pdf', count:1, result:'ผ่าน', note:'ผลตรวจประกอบการวินิจฉัยครบถ้วน' },
        { code:'DOC-HB501-06', type:'เอกสารอื่นๆ', file:'other_501.pdf', count:0, result:'รอตรวจ', note:'' }
      ]
    },
    HB002: {
      bill: { billNo:'HB690700518', hospitalBillNo:'PB0000000002', sentDate:'09/07/2569', claimCode:'CL690700518', hospital:'โรงพยาบาลเปาโล รังสิต', province:'ปทุมธานี', claimType:'IPD', status:'รอตรวจสอบ', billAmount:66700 },
      decisionAmounts: { totalExpense:66700, hospitalCompanyRight:64850 },
      billingAmounts: { endBillDiscount:0, netBillableAmount:64850 },
      insuranceExcess: { enabled:true, company:'กรุงเทพประกันภัย' },
      insured: { name:'นายวิษณุ สุขเกษม', idCard:'1210401256789', appId:'APP690700518', phone:'095-661-2743', appStatus:'ปกติ', age:'32 ปี 4 เดือน', coverageStart:'01/01/2569', coverageEnd:'31/12/2569', plan:'PH Gold' },
      claim: { cause:'เจ็บป่วย', coverage:'ค่ารักษา', treatment:'IPD', symptomDate:'02/07/2569', incidentDate:'02/07/2569', incidentTime:'21:20', admitDate:'02/07/2569', admitTime:'22:10', dischargeDate:'05/07/2569', dischargeTime:'11:00', hospital:'โรงพยาบาลเปาโล รังสิต', chiefComplaint:'ปวดท้อง คลื่นไส้ อาเจียน ถ่ายเหลว มีภาวะขาดน้ำ', diagnosis1:'A09 : Infectious gastroenteritis and colitis, unspecified', diagnosis2:'E86 : Volume depletion', diagnosis3:'-', note:'นอนรักษาในโรงพยาบาล 3 คืน' },
      medical: { hn:'HN690700518', vn:'VN690709118', an:'AN690700518', ud:'ไม่มี', diagnosis:'Acute gastroenteritis with dehydration', lab:'CBC, Electrolyte, Stool exam, IV hydration', treatmentMethod:'Admit ให้สารน้ำ ยาปฏิชีวนะ และติดตาม Electrolyte', procedure:'ไม่ใช่', ipdDays:3, icuDays:1, doctorLicense:'38901', doctor:'นพ.ธนกฤต รัตนเวช' },
      expenses: [
        { item:'1.6.1 ค่าห้องและค่าอาหารผู้ป่วยใน', claim:18000, discount:1000, uncovered:0, reason:'', note:'3 คืน @ 6,000' },
        { item:'1.7.1 ค่าบริการพยาบาล', claim:6500, discount:0, uncovered:0, reason:'', note:'ดูแลผู้ป่วยใน' },
        { item:'1.5.2 ค่าแพทย์เยี่ยมไข้', claim:4200, discount:0, uncovered:0, reason:'', note:'3 วัน' },
        { item:'1.1.1 ยาแผนปัจจุบัน - ยาอันตราย', claim:13200, discount:0, uncovered:350, reason:'บางรายการนอกบัญชี', note:'มียานอกบัญชีบางรายการ' },
        { item:'1.3.1 ค่าตรวจทางห้องปฏิบัติการ', claim:7800, discount:0, uncovered:0, reason:'', note:'CBC, Electrolyte, Stool exam' },
        { item:'1.2.1 เวชภัณฑ์และอุปกรณ์ทางการแพทย์', claim:6800, discount:0, uncovered:500, reason:'บางรายการนอกเงื่อนไข', note:'อุปกรณ์เฉพาะทาง' },
        { item:'1.4.2 ค่าตรวจวินิจฉัยทางรังสี / Ultrasound', claim:3200, discount:0, uncovered:0, reason:'', note:'วินิจฉัยประกอบ' },
        { item:'1.6.2 ค่าห้องผู้ป่วยวิกฤต ICU', claim:7000, discount:0, uncovered:0, reason:'', note:'1 คืน' }
      ],
      docs: [
        { code:'DOC-HB518-01', type:'แบบฟอร์ม A', file:'form_a_cl690700518.pdf', count:1, result:'ผ่าน', note:'ครบถ้วน' },
        { code:'DOC-HB518-02', type:'แบบฟอร์ม B', file:'form_b_cl690700518.pdf', count:1, result:'ผ่าน', note:'มีลายเซ็นแพทย์' },
        { code:'DOC-HB518-03', type:'ใบแจ้งหนี้', file:'invoice_518.pdf', count:1, result:'ผ่าน', note:'ยอดตรง' },
        { code:'DOC-HB518-04', type:'รายละเอียดใบแจ้งหนี้', file:'invoice_detail_518.pdf', count:1, result:'ผ่าน', note:'แยกรายการครบ' },
        { code:'DOC-HB518-05', type:'Discharge Summary', file:'discharge_518.pdf', count:1, result:'ผ่าน', note:'ระบุวัน Admit/Discharge' },
        { code:'DOC-HB518-06', type:'ผลการตรวจ LAB / X-ray', file:'lab_518.pdf', count:1, result:'ผ่าน', note:'ผลตรวจครบและสัมพันธ์กับ Diagnosis' }
      ]
    },
    HB003: {
      bill: { billNo:'HB690700522', hospitalBillNo:'PB0000000003', sentDate:'08/07/2569', claimCode:'CL690700522', hospital:'โรงพยาบาลเกษมราษฎร์ ประชาชื่น', province:'กรุงเทพมหานคร', claimType:'OPD Half', status:'รอตรวจสอบ', billAmount:12400 },
      product:'PA',
      decisionAmounts: { totalExpense:12400, hospitalCompanyRight:11000 },
      billingAmounts: { endBillDiscount:0, netBillableAmount:11000 },
      insuranceExcess: { enabled:false, company:'' },
      insured: { name:'นางสาวสุภัสรา วงศ์อนันต์', idCard:'1101702458891', appId:'APP690700522', phone:'082-119-5528', appStatus:'ปกติ', age:'16 ปี 8 เดือน', coverageStart:'01/05/2569', coverageEnd:'30/04/2570', plan:'PA Student' },
      claim: { cause:'เจ็บป่วย', coverage:'ค่ารักษา', treatment:'OPD', symptomDate:'08/07/2569', incidentDate:'08/07/2569', incidentTime:'07:20', admitDate:'08/07/2569', admitTime:'08:15', dischargeDate:'08/07/2569', dischargeTime:'10:05', hospital:'โรงพยาบาลเกษมราษฎร์ ประชาชื่น', chiefComplaint:'คัดจมูก ไอ จาม และมีน้ำมูกใสต่อเนื่อง 3 วัน', diagnosis1:'J30.4 : Allergic rhinitis, unspecified', diagnosis2:'R05 : Cough', diagnosis3:'-', note:'รับการตรวจรักษาแบบผู้ป่วยนอกและรับยากลับบ้าน' },
      medical: { hn:'HN690700522', vn:'VN690708522', an:'-', ud:'ภูมิแพ้อากาศ', diagnosis:'Allergic rhinitis with cough', lab:'CBC และตรวจสารก่อภูมิแพ้เบื้องต้น', treatmentMethod:'พ่นจมูก ให้ยาแก้แพ้และยาบรรเทาอาการ', procedure:'ไม่ใช่', ipdDays:0, icuDays:0, doctorLicense:'52784', doctor:'พญ.ณิชาภา วัฒนกุล' },
      expenses: [
        { item:'1.5.1 ค่าแพทย์ตรวจรักษา', claim:800, discount:0, uncovered:0, reason:'', note:'ตรวจโดยแพทย์เฉพาะทาง' },
        { item:'1.9.1 ค่าบริการสถานพยาบาล', claim:900, discount:0, uncovered:0, reason:'', note:'ค่าบริการ OPD' },
        { item:'1.3.1 ค่าตรวจทางห้องปฏิบัติการ', claim:2500, discount:0, uncovered:0, reason:'', note:'CBC และ Allergy screening' },
        { item:'1.1.1 ยาแผนปัจจุบัน - ยาอันตราย', claim:6200, discount:400, uncovered:600, reason:'ตัวยาไม่คุ้มครอง', note:'มียานอกบัญชีบางรายการ' },
        { item:'1.4.1 ค่าตรวจวินิจฉัยทางรังสี / Imaging', claim:2000, discount:0, uncovered:400, reason:'เกินสิทธิ์ความคุ้มครอง', note:'ตรวจประกอบการวินิจฉัย' }
      ],
      docs: [
        { code:'DOC-HB522-01', type:'แบบฟอร์ม A', file:'form_a_cl690700522.pdf', count:1, result:'ผ่าน', note:'ข้อมูลและลายเซ็นครบถ้วน' },
        { code:'DOC-HB522-02', type:'แบบฟอร์ม B', file:'-', count:0, result:'', note:'' },
        { code:'DOC-HB522-03', type:'ใบแจ้งหนี้', file:'invoice_522.pdf', count:1, result:'ผ่าน', note:'ยอดตรงกับรายการวางบิล' },
        { code:'DOC-HB522-04', type:'รายละเอียดใบแจ้งหนี้', file:'invoice_detail_522.pdf', count:2, result:'ผ่าน', note:'รายละเอียดค่าใช้จ่ายครบ 2 หน้า' },
        { code:'DOC-HB522-05', type:'ผลการตรวจ LAB / X-ray', file:'lab_522.pdf', count:1, result:'ผ่าน', note:'ผลตรวจครบถ้วน' },
        { code:'DOC-HB522-06', type:'เอกสารอื่นๆ', file:'-', count:0, result:'', note:'' },
        { code:'DOC-HB522-07', type:'บัตรประชาชน', file:'-', count:0, result:'', note:'' },
        { code:'DOC-HB522-08', type:'ชุดรวมเอกสาร', file:'-', count:0, result:'', note:'' }
      ]
    },
    HB004: {
      bill: { billNo:'HB690700537', hospitalBillNo:'PB0000000004', sentDate:'08/07/2569', claimCode:'CL690700537', hospital:'โรงพยาบาลสินแพทย์', province:'กรุงเทพมหานคร', claimType:'Day Case Surgery', status:'รอตรวจสอบ', billAmount:36700 },
      product:'PH',
      decisionAmounts: { totalExpense:36700, hospitalCompanyRight:35000 },
      billingAmounts: { endBillDiscount:0, netBillableAmount:35000 },
      insuranceExcess: { enabled:false, company:'' },
      insured: { name:'นายภาคภูมิ ธนะวรากุล', idCard:'1103702459941', appId:'APP690700537', phone:'086-774-2031', appStatus:'ปกติ', age:'38 ปี 2 เดือน', coverageStart:'01/01/2569', coverageEnd:'31/12/2569', plan:'PH Executive' },
      claim: { cause:'เจ็บป่วย', coverage:'ค่ารักษา', treatment:'Day Case Surgery', symptomDate:'06/07/2569', incidentDate:'06/07/2569', incidentTime:'08:00', admitDate:'06/07/2569', admitTime:'07:30', dischargeDate:'06/07/2569', dischargeTime:'17:45', hospital:'โรงพยาบาลสินแพทย์', chiefComplaint:'มีก้อนซีสต์บริเวณหลัง โตขึ้นและมีอาการเจ็บ', diagnosis1:'L72.3 : Sebaceous cyst', diagnosis2:'-', diagnosis3:'-', note:'ผ่าตัดนำก้อนซีสต์ออกแบบ Day Case และกลับบ้านในวันเดียวกัน' },
      medical: { hn:'HN690700537', vn:'VN690706537', an:'DC690700537', ud:'ไม่มี', diagnosis:'Sebaceous cyst at upper back', lab:'CBC, Coagulation profile และผลชิ้นเนื้อ', treatmentMethod:'Excision of sebaceous cyst under local anesthesia', procedure:'ใช่', ipdDays:0, icuDays:0, doctorLicense:'41872', doctor:'นพ.กิตติศักดิ์ พงศ์ไพศาล' },
      expenses: [
        { item:'1.5.3 ค่าแพทย์ผ่าตัด', claim:12000, discount:0, uncovered:0, reason:'', note:'Excision procedure' },
        { item:'1.8.2 ค่าห้องผ่าตัด', claim:8000, discount:500, uncovered:0, reason:'', note:'ห้องผ่าตัด Day Case' },
        { item:'1.1.1 ยาแผนปัจจุบัน - ยาอันตราย', claim:6500, discount:0, uncovered:300, reason:'ตัวยาไม่คุ้มครอง', note:'ยากลับบ้านบางรายการ' },
        { item:'1.2.1 เวชภัณฑ์และอุปกรณ์ทางการแพทย์', claim:5200, discount:200, uncovered:700, reason:'เวชภัณฑ์ไม่คุ้มครอง', note:'อุปกรณ์ใช้ครั้งเดียว' },
        { item:'1.3.2 ค่าตรวจชิ้นเนื้อ', claim:3000, discount:0, uncovered:0, reason:'', note:'Pathology' },
        { item:'1.9.1 ค่าบริการสถานพยาบาล', claim:2000, discount:0, uncovered:0, reason:'', note:'ค่าบริการ Day Case' }
      ],
      docs: [
        { code:'DOC-HB537-01', type:'แบบฟอร์ม A', file:'form_a_cl690700537.pdf', count:1, result:'ผ่าน', note:'ข้อมูลครบถ้วน' },
        { code:'DOC-HB537-02', type:'แบบฟอร์ม B', file:'form_b_cl690700537.pdf', count:1, result:'ผ่าน', note:'แพทย์ลงนามครบถ้วน' },
        { code:'DOC-HB537-03', type:'ใบแจ้งหนี้', file:'invoice_537.pdf', count:1, result:'ผ่าน', note:'ยอดตรงกับรายการวางบิล' },
        { code:'DOC-HB537-04', type:'รายละเอียดใบแจ้งหนี้', file:'invoice_detail_537.pdf', count:2, result:'ผ่าน', note:'รายละเอียดค่าใช้จ่ายครบ' },
        { code:'DOC-HB537-05', type:'ผลการตรวจ LAB / X-ray', file:'pathology_537.pdf', count:1, result:'ผ่าน', note:'มีผลตรวจและผลชิ้นเนื้อ' },
        { code:'DOC-HB537-06', type:'เอกสารอื่นๆ', file:'-', count:0, result:'', note:'' },
        { code:'DOC-HB537-07', type:'บัตรประชาชน', file:'idcard_537.pdf', count:1, result:'ผ่าน', note:'สำเนาถูกต้อง' },
        { code:'DOC-HB537-08', type:'ชุดรวมเอกสาร', file:'-', count:0, result:'', note:'' }
      ]
    }
  };

  function makeFallbackCase(row){
    const type = row?.claimType || 'OPD Half';
    const base = JSON.parse(JSON.stringify(billingReviewCases.HB001));
    const runningDigits = String(row?.id || '').replace(/\D/g,'') || '1';
    base.bill = { billNo: `HB-${row?.id || 'NEW'}`, hospitalBillNo:`PB${runningDigits.slice(-10).padStart(10,'0')}`, sentDate: row?.sentDate || '09/07/2569', claimCode: row?.claimNo || 'CL690700000', hospital: row?.hospital || 'โรงพยาบาลตัวอย่าง', province:'กรุงเทพมหานคร', claimType:type, status:'รอตรวจสอบ', billAmount: row?.amount || 12400 };
    const previousTotal = num(row?.decisionTotal ?? row?.totalExpense ?? base.bill.billAmount);
    const previousRight = num(row?.approvedAmount ?? row?.hospitalCompanyRight ?? row?.consideredAmount ?? previousTotal);
    base.decisionAmounts = { totalExpense:previousTotal, hospitalCompanyRight:Math.min(previousTotal,Math.max(0,previousRight)) };
    base.billingAmounts = { endBillDiscount:0, netBillableAmount:base.decisionAmounts.hospitalCompanyRight };
    base.insuranceExcess = { enabled:false, company:'' };
    base.claim.treatment = /IPD/i.test(type) ? 'IPD' : (/Day/i.test(type) ? 'Day Case Surgery' : 'OPD');
    base.claim.hospital = base.bill.hospital;
    base.claim.incidentDate = row?.treatmentDate || base.bill.sentDate;
    base.claim.symptomDate = base.claim.incidentDate;
    base.claim.admitDate = base.claim.incidentDate;
    base.claim.dischargeDate = base.claim.incidentDate;
    base.product = row?.product || base.product || (String(base.bill.claimCode).toUpperCase().startsWith('CLPA') ? 'PA' : 'PH');
    base.insured.name = row?.insuredName || 'นางสาวสุภาวดี ทดสอบระบบ';
    base.insured.idCard = row?.idCard || base.insured.idCard;
    base.docs = (base.docs || []).map((doc,index) => {
      const count = Number(doc.count || 0);
      const waiting = /รอแก้ไข/.test(String(row?.status || '')) && count > 0 && index === 4;
      const suffix = String(index + 1).padStart(2,'0');
      return {...doc, code:`DOC-${row?.id || 'NEW'}-${suffix}`, file:count > 0 ? `document_${String(base.bill.claimCode).toLowerCase()}_${suffix}.pdf` : '-', result:count > 0 ? (waiting ? 'รอเอกสารเพิ่มเติม' : 'ผ่าน') : '', note:waiting ? 'รอเอกสารฉบับแก้ไขจากโรงพยาบาล' : (count > 0 ? 'ตรวจสอบเอกสารแล้ว' : '')};
    });
    return base;
  }

  let currentBillingReview = JSON.parse(JSON.stringify(billingReviewCases.HB001));
  let currentReviewStep = 1;

  function ensureReviewPage(){
    let page = document.getElementById(REVIEW_PAGE_ID);
    if (!page) {
      page = document.createElement('section');
      page.id = REVIEW_PAGE_ID;
      page.className = 'page hidden px-1 py-2 lg:px-1 lg:py-3 xl:px-1 xl:py-4';
      const anchor = document.getElementById('billingClaimPage');
      (anchor?.parentElement || document.querySelector('main') || document.body).appendChild(page);
    }
    return page;
  }

  function getDeep(path){
    return path.split('.').reduce((o,k)=>o?.[k], currentBillingReview);
  }
  function setDeep(path, value){
    const keys = path.split('.');
    let obj = currentBillingReview;
    keys.slice(0,-1).forEach(k => obj = obj[k]);
    obj[keys[keys.length-1]] = value;
  }

  function ensureBillingMedicalFields(){
    currentBillingReview.medical = currentBillingReview.medical || {};
    if(currentBillingReview.medical.admitIndication == null) currentBillingReview.medical.admitIndication = 'มีข้อบ่งชี้ต้องนอนรักษาในโรงพยาบาล';
    if(currentBillingReview.medical.additionalDetail == null) currentBillingReview.medical.additionalDetail = '';
    if(currentBillingReview.medical.procedure == null) currentBillingReview.medical.procedure = 'ไม่ใช่';
  }
  window.setBillingProcedure = function(value){
    ensureBillingMedicalFields();
    currentBillingReview.medical.procedure = value;
    renderPage();
  };

  function field(label, path, type='text', span=''){
    return `<label class="${span}"><div class="mb-1 text-sm font-bold text-slate-500">${label}</div><input data-review-field="${path}" type="${type}" value="${esc(getDeep(path))}" class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-lg font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"></label>`;
  }
  function textarea(label, path, span=''){
    return `<label class="${span}"><div class="mb-1 text-sm font-bold text-slate-500">${label}</div><textarea data-review-field="${path}" class="min-h-[88px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg font-semibold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">${esc(getDeep(path))}</textarea></label>`;
  }

  function selectCard(group, value, label, icon){
    const selected = getDeep(group) === value;
    return `<button type="button" data-review-choice="${group}" onclick="setReviewChoice('${group}','${value}')" class="billing-review-choice claim-compact-option ${selected ? 'is-selected' : ''}">
      <span class="claim-compact-icon"><span class="material-icons-round">${icon}</span></span>
      <span class="claim-compact-label">${label}</span>
      <span class="material-icons-round ${selected ? 'claim-compact-check' : 'claim-compact-radio'}">${selected ? 'check_circle' : 'radio_button_unchecked'}</span>
    </button>`;
  }

  function claimTypeClass(type){
    const t = String(type || '');
    if (t.includes('Half')) return 'border-amber-400 bg-amber-50 text-amber-700';
    if (t.includes('Full')) return 'border-emerald-400 bg-emerald-50 text-emerald-700';
    return 'border-brand-500 bg-brand-50 text-brand-700';
  }

  function firstSystemAmount(){
    for(const value of arguments){
      if(value === undefined || value === null || value === '') continue;
      const parsed = num(value);
      if(Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }

  function totals(){
    const rows = currentBillingReview.expenses || [];
    const claim = rows.reduce((s,r)=>s+num(r.claim),0);
    const discount = rows.reduce((s,r)=>s+num(r.discount),0);
    const uncovered = rows.reduce((s,r)=>s+num(r.uncovered),0);
    const calculatedRight = Math.max(0, claim - discount - uncovered);
    const decision = currentBillingReview.decisionAmounts || currentBillingReview.decision || currentBillingReview.consideration || currentBillingReview.approval || {};
    const total = Math.max(0, firstSystemAmount(
      decision.hospitalClaimableAmount,
      decision.hospitalBillableAmount,
      decision.hospitalCompanyRight,
      decision.approvedAmount,
      currentBillingReview.bill?.approvedAmount,
      calculatedRight
    ));
    const ssEndDiscount = Math.max(0, num(currentBillingReview.bill?.ssEndDiscount));
    const net = Math.max(0, total - ssEndDiscount);
    return { claim, discount, uncovered, total, ssEndDiscount, net };
  }

  function decisionSummaryAmounts(){
    const t = totals();
    const decision = currentBillingReview.decisionAmounts || currentBillingReview.decision || currentBillingReview.consideration || currentBillingReview.approval || {};
    return {
      totalExpense: Math.max(0, firstSystemAmount(
        decision.totalExpense,
        decision.totalExpenses,
        decision.expenseTotal,
        currentBillingReview.bill?.totalExpense,
        t.claim
      )),
      hospitalCompanyRight: t.total
    };
  }

  let currentBillingMainTab = 'claim';

  function billingSharedRow(){
    const c = currentBillingReview;
    const claimCode = c.bill?.claimCode || '';
    return {
      name:c.insured?.name,
      idCard:c.insured?.idCard,
      appId:c.insured?.appId,
      phone:c.insured?.phone,
      appStatus:c.insured?.appStatus,
      policyAge:c.insured?.age,
      coverageStart:c.insured?.coverageStart,
      coverageEnd:c.insured?.coverageEnd,
      plan:c.insured?.plan,
      product:c.product || c.bill?.product || (String(claimCode).toUpperCase().startsWith('CLPA') ? 'PA' : 'PH'),
      claimCode,
      caseNo:c.bill?.caseNo || c.bill?.billNo,
      hospitalBillNo:c.bill?.hospitalBillNo,
      claimDate:c.bill?.sentDate,
      hospital:c.bill?.hospital,
      province:c.bill?.province,
      claimStatus:c.bill?.status,
      claimType:c.bill?.claimType
    };
  }

  function renderHeader(){
    const row = billingSharedRow();
    const insured = typeof window.renderSharedHospitalInsured === 'function' ? window.renderSharedHospitalInsured(row) : '';
    const claimMeta = typeof window.renderSharedHospitalClaimMeta === 'function' ? window.renderSharedHospitalClaimMeta(row, row.claimType) : '';
    let tabs = typeof window.renderSharedHospitalTabs === 'function' ? window.renderSharedHospitalTabs(row) : '';
    tabs = tabs
      .replaceAll('data-hospital-main-tab', 'data-billing-hospital-tab')
      .replaceAll('setHospitalMainTab(', 'setBillingHospitalMainTab(')
      .replace('เมนูข้อมูลเคลมโรงพยาบาล', 'เมนูตรวจสอบรายการวางบิลโรงพยาบาล');
    return `${insured}${claimMeta}${tabs}`;
  }

  function iconBox(icon){ return `<div class="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><span class="material-icons-round">${icon}</span></div>`; }
  function whiteIconBox(icon){ return `<div class="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><span class="material-icons-round">${icon}</span></div>`; }
  function topBox(icon,label,path,white=false){
    return `<div class="flex items-center gap-3 p-4 md:border-r border-slate-200">${white ? whiteIconBox(icon) : iconBox(icon)}<div><div class="text-sm font-bold text-slate-500">${label}</div><div class="text-xl font-extrabold text-brand-700">${esc(getDeep(path))}</div></div></div>`;
  }
  function stepBtn(step,label){
    const active = currentReviewStep === step;
    return `<button type="button" onclick="setBillingReviewStep(${step})" class="customer-review-step ${active ? 'active' : ''}"><span class="step-dot inline-grid h-9 w-9 place-items-center rounded-full ${active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500'} text-sm font-extrabold">${step}</span><span>${label}</span></button>`;
  }
  function renderStepNavigation(){
    return `<div class="hospital-step-grid">${stepBtn(1,'บันทึกข้อมูลเคลม')}${stepBtn(2,'รายละเอียดค่าใช้จ่าย')}${stepBtn(3,'สรุปรายการเคลม')}</div>`;
  }

  function renderBillingSecondaryPanes(){
    const row = billingSharedRow();
    const tabs = ['transactions','coverage','claimHistory'];
    if(window.shouldShowClaimPaymentTab?.(row)) tabs.push('payment');
    tabs.push('memo');
    return tabs.map(tab => {
      let html = typeof window.renderSharedHospitalReviewPane === 'function' ? window.renderSharedHospitalReviewPane(tab) : '';
      return html
        .replaceAll('data-hospital-pane', 'data-billing-hospital-pane')
        .replaceAll('hospital-main-pane', 'billing-hospital-main-pane')
        .replaceAll('hospitalMemoTableBody', 'billingHospitalMemoTableBody')
        .replaceAll("addSharedReviewMemo('hospital')", "addSharedReviewMemo('billingHospital')");
    }).join('');
  }

  function renderStep1(){
    ensureBillingMedicalFields();
    return `<div class="rounded-xl border border-slate-200 bg-white"><div class="border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700">บันทึกข้อมูลเคลม</div><div class="space-y-5 p-4">
      <div class="rounded-xl border border-slate-200 p-4"><div class="mb-3 text-lg font-extrabold text-brand-700">ข้อมูลการแจ้งเคลม</div>
        <div class="space-y-4">
          <div class="claim-compact-sections">
            <div class="claim-compact-row"><div class="claim-compact-title">เหตุของการเคลม</div><div class="claim-compact-options">${selectCard('claim.cause','เจ็บป่วย','เจ็บป่วย','favorite')}${selectCard('claim.cause','อุบัติเหตุ','อุบัติเหตุ','snowboarding')}</div></div>
            <div class="claim-compact-row"><div class="claim-compact-title">ประเภทความคุ้มครอง</div><div class="claim-compact-options">${selectCard('claim.coverage','ค่ารักษา','ค่ารักษา','medication')}${selectCard('claim.coverage','ค่าชดเชย','ค่าชดเชย','payments')}${selectCard('claim.coverage','ทุพพลภาพ/สูญเสียอวัยวะ','ทุพพลภาพ/สูญเสียอวัยวะ','accessible')}${selectCard('claim.coverage','เสียชีวิต','เสียชีวิต','local_hospital')}</div></div>
            <div class="claim-compact-row"><div class="claim-compact-title">ประเภทการรักษา</div><div class="claim-compact-options">${selectCard('claim.treatment','OPD','OPD','medical_services')}${selectCard('claim.treatment','IPD','IPD','bed')}${selectCard('claim.treatment','Day Case Surgery','Day Case Surgery','local_hospital')}</div></div>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">${field('วันที่เริ่มอาการ <span class="text-red-500">*</span>','claim.symptomDate')}${field('วันที่เกิดเหตุ <span class="text-red-500">*</span>','claim.incidentDate')}${field('เวลาที่เกิดเหตุ <span class="text-red-500">*</span>','claim.incidentTime','time')}${field('วันที่เข้า รพ. <span class="text-red-500">*</span>','claim.admitDate')}${field('เวลาที่เข้า รพ. <span class="text-red-500">*</span>','claim.admitTime','time')}${field('วันที่ออก รพ. <span class="text-red-500">*</span>','claim.dischargeDate')}${field('เวลาที่ออก รพ. <span class="text-red-500">*</span>','claim.dischargeTime','time')}${field('สถานพยาบาล <span class="text-red-500">*</span>','claim.hospital','text','md:col-span-2 xl:col-span-4')}${textarea('อาการสำคัญ (Chief Complaint) <span class="text-red-500">*</span>','claim.chiefComplaint','md:col-span-2 xl:col-span-4')}${field('การวินิจฉัย 1 (Diagnosis1) <span class="text-red-500">*</span>','claim.diagnosis1','text','md:col-span-2 xl:col-span-4')}${field('การวินิจฉัย 2 (Diagnosis2)','claim.diagnosis2','text','md:col-span-2')}${field('การวินิจฉัย 3 (Diagnosis3)','claim.diagnosis3','text','md:col-span-2')}${textarea('รายละเอียดเพิ่มเติม','claim.note','md:col-span-2 xl:col-span-4')}</div>
        </div>
      </div>
      <div class="rounded-xl border border-slate-200 p-4" data-collapsible-section>
        <div class="mb-3 flex items-center justify-between"><div class="text-lg font-extrabold text-brand-700">ข้อมูลการเข้ารับการรักษา</div><button type="button" onclick="toggleClaimSubSection(this)" class="grid h-6 w-6 place-items-center rounded bg-brand-500 text-white"><span class="material-icons-round !text-sm">remove</span></button></div>
        <div data-collapsible-body class="grid gap-2.5 md:grid-cols-2">
          ${field('HN <span class="text-red-500">*</span>','medical.hn')}
          ${field('VN <span class="text-red-500">*</span>','medical.vn')}
          ${currentBillingReview.claim.treatment === 'IPD' ? field('AN','medical.an') : ''}
          ${field('โรคประจำตัว (U/D)','medical.ud','text','md:col-span-2')}
          ${currentBillingReview.claim.treatment === 'IPD' ? field('ข้อบ่งชี้การ Admit <span class="text-red-500">*</span>','medical.admitIndication','text','md:col-span-2') : ''}
          ${currentBillingReview.claim.treatment === 'IPD' ? field('วิธีการรักษาพยาบาล <span class="text-red-500">*</span>','medical.treatmentMethod','text','md:col-span-2') : ''}
          ${field('วินิจฉัยการเจ็บป่วย <span class="text-red-500">*</span>','medical.diagnosis','text','md:col-span-2')}
          ${textarea('ผลการตรวจ LAB, EKG, X-ray และอื่นๆ','medical.lab','md:col-span-2')}
          ${textarea('รายละเอียดเพิ่มเติม','medical.additionalDetail','md:col-span-2')}
          <div class="md:col-span-2"><div class="mb-1 text-sm font-bold text-slate-500">มีการทำหัตถการหรือไม่ <span class="text-red-500">*</span></div><div class="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white"><button type="button" onclick="setBillingProcedure('ใช่')" class="min-w-28 px-6 py-2.5 text-lg font-extrabold ${currentBillingReview.medical.procedure==='ใช่'?'bg-brand-50 text-brand-700':'text-slate-600'}">ใช่</button><button type="button" onclick="setBillingProcedure('ไม่ใช่')" class="min-w-28 border-l border-slate-300 px-6 py-2.5 text-lg font-extrabold ${currentBillingReview.medical.procedure==='ไม่ใช่'?'bg-brand-50 text-brand-700':'text-slate-600'}">ไม่ใช่</button></div></div>
        </div>
      </div>
      <div class="rounded-xl border border-slate-200 p-4" data-collapsible-section>
        <div class="mb-3 flex items-center justify-between"><div class="text-lg font-extrabold text-brand-700">แพทย์เจ้าของไข้</div><button type="button" onclick="toggleClaimSubSection(this)" class="grid h-6 w-6 place-items-center rounded bg-brand-500 text-white"><span class="material-icons-round !text-sm">remove</span></button></div>
        <div data-collapsible-body class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${field('เลขใบประกอบวิชาชีพเวชกรรม <span class="text-red-500">*</span>','medical.doctorLicense')}${field('แพทย์ (ชื่อ-สกุล) <span class="text-red-500">*</span>','medical.doctor')}</div>
      </div>
      ${renderBillingDocumentCheck()}
    </div></div>${footerBtns()}`;
  }

  function renderStep2(){
    return `<div class="rounded-xl border border-slate-200 bg-white"><div class="border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700">เอกสารแนบจากโรงพยาบาล</div><div class="p-4">
      <div class="overflow-x-auto rounded-2xl border border-slate-200"><table class="min-w-[1180px] w-full border-collapse text-left"><thead class="bg-brand-600 text-white"><tr><th class="px-4 py-3">รหัสเอกสาร</th><th class="px-4 py-3">ประเภทเอกสาร</th><th class="px-4 py-3">ชื่อไฟล์</th><th class="px-4 py-3 text-center">จำนวน</th><th class="px-4 py-3 text-center">ผลการตรวจ</th><th class="px-4 py-3">หมายเหตุ</th><th class="px-4 py-3 text-center">ดำเนินการ</th></tr></thead><tbody id="billingReviewDocRows">${renderDocRows()}</tbody></table></div>
      <div class="mt-3 flex justify-end"><button type="button" onclick="addBillingReviewDoc()" class="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 font-bold text-brand-700"><span class="material-icons-round !text-lg">add</span>เพิ่มเอกสาร</button></div>
    </div></div>${footerBtns()}`;
  }

  function renderBillingDocumentCheck(){
    return `<div class="rounded-xl border border-slate-200 bg-white p-4 billing-doc-check-section">
      <div class="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-700"><span class="material-icons-round">fact_check</span>ตรวจสอบเอกสาร</div>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[980px] border-collapse text-sm billing-doc-check-table">
          <thead class="bg-brand-600 text-white"><tr>
            <th class="px-3 py-2 text-left">รายการเอกสาร</th>
            <th class="px-3 py-2 text-center">ค้นหาเอกสาร</th>
            <th class="px-3 py-2 text-center">จำนวนเอกสาร</th>
            <th class="px-3 py-2 text-center">รายละเอียด</th>
            <th class="px-3 py-2 text-center">ผลการตรวจ</th>
            <th class="px-3 py-2 text-left">หมายเหตุ</th>
          </tr></thead>
          <tbody id="billingReviewDocRows">${renderDocRows()}</tbody>
        </table>
      </div>
    </div>`;
  }

  function renderDocRows(){
    return currentBillingReview.docs.map((d,i)=>{
      const state = d.result === 'ผ่าน' ? 'pass' : d.result === 'ไม่ผ่าน' ? 'fail' : d.result === 'รอเอกสารเพิ่มเติม' ? 'wait' : '';
      const button = (value,label,klass) => `<button type="button" onclick="setBillingDocResult(${i},'${value}')" class="billing-doc-result ${klass} ${state===klass?'active':''}">${label}</button>`;
      return `<tr class="border-b border-slate-200 bg-white hover:bg-brand-50/40">
        <td class="px-3 py-3 align-middle"><div class="font-extrabold text-slate-700">${esc(d.type)}</div><div class="mt-0.5 text-xs font-semibold text-slate-400">${esc(d.code)}</div></td>
        <td class="px-3 py-3 text-center align-middle"><button type="button" onclick="mockScanDoc(${i})" class="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-brand-600 px-4 font-bold text-white hover:bg-brand-700"><span class="material-icons-round !text-base">search</span>ค้นหาเอกสาร</button></td>
        <td class="px-3 py-3 text-center align-middle"><span class="inline-grid h-8 min-w-8 place-items-center rounded-full bg-slate-100 px-2 font-extrabold text-slate-700">${Number(d.count||0)}</span></td>
        <td class="px-3 py-3 text-center align-middle"><button type="button" onclick="previewBillingDocument(${i})" title="ดูรายละเอียด" class="mx-auto grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-700 hover:bg-brand-600 hover:text-white"><span class="material-icons-round">visibility</span></button></td>
        <td class="px-3 py-3 align-middle"><div class="flex flex-wrap items-center justify-center gap-2">${button('ผ่าน','ผ่าน','pass')}${button('ไม่ผ่าน','ไม่ผ่าน','fail')}${button('รอเอกสารเพิ่มเติม','รอเอกสารเพิ่มเติม','wait')}</div></td>
        <td class="px-3 py-3 align-middle"><input value="${esc(d.note)}" onchange="updateDoc(${i},'note',this.value)" class="h-10 w-full min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" placeholder="ระบุหมายเหตุ"></td>
      </tr>`;
    }).join('');
  }


  function renderBillingAdditionalExpensePanel(){
    const renderer = window.renderClaimlineAdditionalPanel;
    if (typeof renderer !== 'function') {
      return `<section class="cc-ref-card cc-ref-additional-card mt-4"><div class="ce-medical-only-note">ไม่สามารถโหลดรายการค่ารักษาเพิ่มเติมได้ กรุณารีเฟรชหน้าจอ</div></section>`;
    }
    const html = renderer(currentBillingReview?.claim?.treatment || 'IPD')
      .replaceAll('customerAdditionalPanel','billingAdditionalPanel')
      .replaceAll('customerAdditionalSearchInput','billingAdditionalSearchInput')
      .replaceAll('customerAdditionalTreeList','billingAdditionalTreeList')
      .replaceAll('customerSelectedAdditionalItem','billingSelectedAdditionalItem')
      .replaceAll('customerAdditionalReceiptAmount','billingAdditionalReceiptAmount')
      .replaceAll('customerAdditionalClaimAmount','billingAdditionalClaimAmount')
      .replaceAll('customerAdditionalDiscount','billingAdditionalDiscount')
      .replaceAll('customerAdditionalUncovered','billingAdditionalUncovered')
      .replaceAll('customerAdditionalReason','billingAdditionalReason')
      .replaceAll('customerAdditionalNote','billingAdditionalNote')
      .replaceAll('customerAdditionalAddBtn','billingAdditionalAddBtn')
      .replaceAll('toggleCustomerAdditionalMain','toggleBillingAdditionalMain')
      .replaceAll('toggleCustomerAdditionalSub','toggleBillingAdditionalSub')
      .replaceAll('selectCustomerAdditionalItem','selectBillingAdditionalItem')
      .replaceAll('filterCustomerAdditionalItems','filterBillingAdditionalItems')
      .replaceAll('addCustomerAdditionalItemToTable','addBillingAdditionalItemToTable')
      .replaceAll('ce-main-','bill-main-');
    return `<section class="cc-ref-card cc-ref-additional-card mt-4"><div class="cc-ref-additional-head"><div><div class="cc-ref-card-title">รายการค่ารักษาเพิ่มเติม</div><div class="cc-ref-desc">กรณีไม่มีรายการค่าใช้จ่าย กรุณาเลือกหมวดและเพิ่มรายการลงในตาราง</div></div><button id="billingAdditionalToggleBtn" type="button" onclick="toggleBillingAdditionalPanel()" class="cc-ref-outline-btn"><span class="material-icons-round">chevron_right</span>เพิ่มรายการค่ารักษา</button></div>${html}</section>`;
  }
  window.toggleBillingAdditionalPanel=function(){const p=document.getElementById('billingAdditionalPanel'),b=document.getElementById('billingAdditionalToggleBtn');if(!p||!b)return;const o=p.classList.contains('hidden');if(o){window.resetAdditionalEntryForm('billing');}p.classList.toggle('hidden',!o);if(!o){window.resetAdditionalEntryForm('billing');}b.innerHTML=o?'<span class="material-icons-round">expand_less</span>ปิดรายการค่ารักษา':'<span class="material-icons-round">chevron_right</span>เพิ่มรายการค่ารักษา';};
  window.toggleBillingAdditionalMain=function(id){const p=document.getElementById('billingAdditionalTreeList'),x=document.getElementById(id);if(!p||!x)return;const o=x.classList.contains('hidden');p.querySelectorAll('.cc-ref-main-body').forEach(e=>e.classList.add('hidden'));p.querySelectorAll('.ce-main-arrow').forEach(e=>e.innerHTML='<span class="material-icons-round">expand_more</span>');p.querySelectorAll('.cc-ref-sub-body').forEach(e=>e.classList.add('hidden'));if(o){x.classList.remove('hidden');const a=document.getElementById(id+'-arrow');if(a)a.innerHTML='<span class="material-icons-round">expand_less</span>';}};
  window.toggleBillingAdditionalSub=function(id){const x=document.getElementById(id);if(!x)return;const p=x.closest('.cc-ref-main-body'),o=x.classList.contains('hidden');p?.querySelectorAll('.cc-ref-sub-body').forEach(e=>e.classList.add('hidden'));if(o){x.classList.remove('hidden');const a=document.getElementById(id+'-arrow');if(a)a.innerHTML='<span class="material-icons-round">expand_less</span>';}};
  window.selectBillingAdditionalItem=function(btn){
    if(!btn)return;
    const input=document.getElementById('billingSelectedAdditionalItem');
    const label=btn?.dataset?.label||'';
    const isSameSelected=btn.classList.contains('active') && input?.value===label;
    if(isSameSelected){
      window.resetAdditionalEntryForm('billing');
      return;
    }
    if(input?.value){
      ['billingAdditionalReceiptAmount','billingAdditionalClaimAmount','billingAdditionalDiscount','billingAdditionalUncovered','billingAdditionalNote'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      const reason=document.getElementById('billingAdditionalReason');
      if(reason)reason.selectedIndex=0;
    }
    document.querySelectorAll('#billingAdditionalTreeList .ce-item-btn').forEach(e=>e.classList.remove('active'));
    btn.classList.add('active');
    if(input)input.value=label;
    window.toggleAdditionalEntryFields('billing',!!label);
  };
  window.filterBillingAdditionalItems=function(v){const k=String(v||'').trim().toLowerCase();document.querySelectorAll('#billingAdditionalTreeList [data-main-card]').forEach(m=>{let mv=false;m.querySelectorAll('[data-sub-card]').forEach(sub=>{let sv=false;sub.querySelectorAll('.ce-item-btn').forEach(it=>{const ok=!k||String(it.dataset.search||'').includes(k);it.style.display=ok?'':'none';if(ok)sv=true;});sub.style.display=sv?'':'none';if(sv)mv=true;});m.style.display=mv?'':'none';if(k&&mv)m.querySelector('.cc-ref-main-body')?.classList.remove('hidden');});};
  window.addBillingAdditionalItemToTable=function(){const item=document.getElementById('billingSelectedAdditionalItem')?.value?.trim();if(!item){alert('กรุณาเลือกรายการค่ารักษาก่อนเพิ่มลงในตาราง');return;}if(currentBillingReview.expenses.some(r=>r.item===item)){alert('รายการค่ารักษานี้มีอยู่ในตารางแล้ว');return;}currentBillingReview.expenses.push({item,receipt:num(document.getElementById('billingAdditionalReceiptAmount')?.value),claim:num(document.getElementById('billingAdditionalClaimAmount')?.value),discount:num(document.getElementById('billingAdditionalDiscount')?.value),uncovered:num(document.getElementById('billingAdditionalUncovered')?.value),reason:document.getElementById('billingAdditionalReason')?.value||'',note:document.getElementById('billingAdditionalNote')?.value||''});window.resetAdditionalEntryForm('billing');renderPage();setTimeout(()=>{const rows=document.querySelectorAll('#billingReviewExpenseRows tr');rows[rows.length-1]?.scrollIntoView({behavior:'smooth',block:'center'});},30);};

  function renderStep3(){
    const t = totals();
    const decisionAmounts = decisionSummaryAmounts();
    return `<div class="rounded-xl border border-slate-200 bg-white"><div class="border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700">รายการค่าใช้จ่าย</div><div class="space-y-4 p-4">
      <div class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><div class="flex flex-wrap items-center gap-2"><span class="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-brand-700">ประเภทความคุ้มครอง : ${esc(currentBillingReview.claim.coverage)}</span><span class="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-brand-700">ประเภทการรักษา : ${esc(currentBillingReview.claim.treatment)}</span><span class="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-brand-700">จำนวนเงินวางบิล : ${money(currentBillingReview.bill.billAmount)} บาท</span></div></div>
      <div class="min-w-0"><div class="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div class="overflow-x-auto"><table class="w-full table-fixed border-collapse"><thead class="bg-slate-100 text-slate-600"><tr><th class="w-[22%] px-3 py-2 text-left">รายการค่าใช้จ่าย</th><th class="w-[11%] px-3 py-2 text-center">ยอดเบิก</th><th class="w-[11%] px-3 py-2 text-center">ส่วนลด</th><th class="w-[12%] px-3 py-2 text-center">ยอดไม่คุ้มครอง</th><th class="w-[17%] px-3 py-2 text-center">สาเหตุไม่คุ้มครอง</th><th class="w-[19%] px-3 py-2 text-center">หมายเหตุ</th><th class="w-[8%] px-3 py-2 text-center">ลบ</th></tr></thead><tbody id="billingReviewExpenseRows">${renderExpenseRows()}</tbody></table></div></div><div class="mt-3 text-sm font-semibold text-slate-400">สามารถเพิ่มรายการค่าใช้จ่ายและแก้ไขยอดเงินได้</div>${renderBillingAdditionalExpensePanel()}</div>
      <section class="cc-ref-summary-box billing-consideration-summary">
        <div class="cc-ref-summary-title"><span class="material-icons-round">request_quote</span><span>ยอดเงินตามการพิจารณา<small class="mt-1 block text-xs font-semibold text-slate-500">ยอดอ้างอิงจากผลการพิจารณาก่อนโรงพยาบาลยืนยันวางบิล</small></span></div>
        <div class="cc-ref-summary-grid">
          <div class="cc-ref-money-card"><div class="cc-ref-money-label">ค่าใช้จ่ายทั้งหมด :</div><div><span class="cc-ref-money-value">${money(decisionAmounts.totalExpense)}</span><span class="cc-ref-money-unit">บาท</span></div></div>
          <div class="cc-ref-transfer-stack"><div class="cc-ref-transfer-card blue"><span class="cc-ref-transfer-icon"><span class="material-icons-round">account_balance</span></span><span>สิทธิ์โรงพยาบาลตั้งเบิกกับบริษัท :</span><strong>${money(decisionAmounts.hospitalCompanyRight)}</strong><span>บาท</span></div></div>
        </div>
      </section>
      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div class="flex items-center gap-2 border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700"><span class="material-icons-round text-brand-700">price_check</span>ส่วนลดท้ายบิล</div>
        <div class="grid gap-4 p-4 md:grid-cols-3">
          <label><div class="mb-1 text-sm font-bold text-slate-500">ยอดรวม</div><div class="relative"><input id="billingEndDiscountTotal" value="${money(t.total)}" readonly class="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-14 text-right text-lg font-extrabold text-slate-700"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">บาท</span></div></label>
          <label><div class="mb-1 text-sm font-bold text-slate-500">ส่วนลด SS ท้ายบิล</div><div class="relative"><input id="billingSsEndDiscount" type="number" min="0" max="${t.total}" step="0.01" value="${t.ssEndDiscount}" oninput="updateBillingEndDiscount(this.value)" class="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-14 text-right text-lg font-extrabold text-orange-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">บาท</span></div></label>
          <label><div class="mb-1 text-sm font-bold text-slate-500">ยอดเบิกสุทธิ</div><div class="relative"><input id="billingNetBillableAmount" value="${money(t.net)}" readonly class="h-11 w-full rounded-lg border border-green-300 bg-green-50 px-3 pr-14 text-right text-xl font-extrabold text-green-700"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600">บาท</span></div></label>
        </div>
      </section>
    </div></div>${footerBtns()}`;
  }

  function summaryCard(label,value,icon,color,klass){
    return `<div class="rounded-xl border ${klass} p-4"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><span class="material-icons-round">${icon}</span></span><div><div class="text-sm font-bold text-slate-500">${label}</div><div class="text-3xl font-extrabold ${color}">${money(value)}</div></div></div></div>`;
  }

  function renderExpenseRows(){
    currentBillingReview.expenses = normalizeBillingExpenseReasons(currentBillingReview.expenses);
    return currentBillingReview.expenses.map((r,i)=>`<tr class="border-b border-slate-200 bg-white align-top hover:bg-brand-50/50">
      <td class="px-2 py-2"><select onchange="updateExpense(${i},'item',this.value)" class="h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700"><option value="">เลือกรายการค่าใช้จ่าย</option>${[r.item,...billingExpenseMaster].filter((v,idx,arr)=>v&&arr.indexOf(v)===idx).map(v=>`<option value="${esc(v)}" ${v===r.item?'selected':''}>${esc(v)}</option>`).join('')}</select></td>
      <td class="px-2 py-2"><input value="${money(r.claim)}" onchange="updateExpense(${i},'claim',this.value,true)" class="h-10 w-full rounded border border-slate-300 px-2 text-right text-sm font-bold text-slate-700"></td>
      <td class="px-2 py-2"><input value="${money(r.discount)}" onchange="updateExpense(${i},'discount',this.value,true)" class="h-10 w-full rounded border border-slate-300 px-2 text-right text-sm font-bold text-slate-700"></td>
      <td class="px-2 py-2"><input value="${money(r.uncovered)}" onchange="updateExpense(${i},'uncovered',this.value,true)" class="h-10 w-full rounded border border-slate-300 px-2 text-right text-sm font-bold text-slate-700"></td>
      <td class="px-2 py-2"><select onchange="updateExpense(${i},'reason',this.value)" class="h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700"><option value=""></option>${billingNonCoverageReasons.map(reason=>`<option value="${esc(reason)}" ${r.reason===reason?'selected':''}>${esc(reason)}</option>`).join('')}</select></td>
      <td class="px-2 py-2"><input value="${esc(r.note)}" onchange="updateExpense(${i},'note',this.value)" class="h-10 w-full rounded border border-slate-300 px-2 text-sm text-slate-700"></td>
      <td class="px-2 py-2 text-center"><button type="button" onclick="deleteExpense(${i})" class="mx-auto grid h-9 w-9 place-items-center rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"><span class="material-icons-round">delete</span></button></td>
    </tr>`).join('');
  }

  function renderStep4(){
    const t = totals();
    const docPass = currentBillingReview.docs.filter(d=>d.result==='ผ่าน').length;
    return `<div class="rounded-xl border border-slate-200 bg-white"><div class="border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700">สรุปรายการเคลม</div><div class="space-y-4 p-4">
      <div class="grid gap-4 xl:grid-cols-[1fr_360px]"><div class="rounded-xl border border-slate-200 p-4"><div class="mb-3 text-lg font-extrabold text-brand-700">สรุปข้อมูลเคลม</div><div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-lg">${summaryField('เลขที่ CL',currentBillingReview.bill.claimCode)}${summaryField('สถานพยาบาล',currentBillingReview.bill.hospital)}${summaryField('ประเภทความคุ้มครอง',currentBillingReview.claim.coverage)}${summaryField('ประเภทการรักษา',currentBillingReview.claim.treatment)}${summaryField('Diagnosis',currentBillingReview.claim.diagnosis1)}${summaryField('เอกสารผ่าน',`${docPass}/${currentBillingReview.docs.length} รายการ`)}</div></div><div class="rounded-xl border border-blue-100 bg-blue-50 p-4"><div class="mb-3 text-lg font-extrabold text-brand-700">สรุปยอด</div><div class="space-y-3 text-lg"><div class="flex justify-between"><span>ยอดวางบิล</span><strong>${money(currentBillingReview.bill.billAmount)}</strong></div><div class="flex justify-between"><span>ยอดเบิกทั้งหมด</span><strong>${money(t.claim)}</strong></div><div class="flex justify-between"><span>ส่วนลด</span><strong>${money(t.discount)}</strong></div><div class="flex justify-between"><span>ยอดไม่คุ้มครอง</span><strong class="text-red-600">${money(t.uncovered)}</strong></div><div class="flex justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-extrabold text-green-700"><span>ยอดตั้งเบิกสุทธิ</span><strong>${money(t.net)}</strong></div></div></div></div>
      <div class="rounded-xl border border-slate-200 p-4"><div class="mb-3 text-lg font-extrabold text-brand-700">ผลการตรวจสอบ</div><div class="grid gap-3 md:grid-cols-4"><button onclick="setReviewResult('ผ่าน')" class="review-result-btn rounded-xl border px-4 py-4 font-extrabold ${currentBillingReview.reviewResult==='ผ่าน'?'border-green-400 bg-green-50 text-green-700':'border-slate-200 bg-white text-slate-600'}"><span class="material-icons-round align-middle">check_circle</span> ผ่าน</button><button onclick="setReviewResult('รอแก้ไข')" class="review-result-btn rounded-xl border px-4 py-4 font-extrabold ${currentBillingReview.reviewResult==='รอแก้ไข'?'border-amber-400 bg-amber-50 text-amber-700':'border-slate-200 bg-white text-slate-600'}"><span class="material-icons-round align-middle">edit_note</span> รอแก้ไข</button><button onclick="setReviewResult('ปฏิเสธ')" class="review-result-btn rounded-xl border px-4 py-4 font-extrabold ${currentBillingReview.reviewResult==='ปฏิเสธ'?'border-rose-400 bg-rose-50 text-rose-700':'border-slate-200 bg-white text-slate-600'}"><span class="material-icons-round align-middle">block</span> ปฏิเสธ</button><button onclick="setReviewResult('ยกเลิก')" class="review-result-btn rounded-xl border px-4 py-4 font-extrabold ${currentBillingReview.reviewResult==='ยกเลิก'?'border-red-400 bg-red-50 text-red-700':'border-slate-200 bg-white text-slate-600'}"><span class="material-icons-round align-middle">cancel</span> ยกเลิก</button></div>${textarea('หมายเหตุผลการตรวจสอบ','reviewNote','mt-4')}</div>
    </div></div>${footerBtns(true)}`;
  }

  function summaryField(label,value){ return `<div><div class="text-sm font-bold text-slate-500">${label}</div><div class="font-extrabold text-brand-700">${esc(value)}</div></div>`; }

  function footerBtns(final=false){
    return `<div class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"><button type="button" onclick="backToHospitalBillingList()" class="claim-step-action-btn inline-flex h-11 items-center justify-center rounded-lg border border-brand-600 bg-white px-5 text-brand-700"><span class="material-icons-round mr-1">arrow_back</span>กลับ</button><div class="flex flex-wrap justify-end gap-3"><button type="button" onclick="saveBillingReviewDraft()" class="claim-step-action-btn inline-flex h-11 items-center justify-center rounded-lg border border-brand-600 bg-white px-5 text-brand-700"><span class="material-icons-round mr-1">save_as</span>บันทึกแบบร่าง</button>${currentReviewStep>1?`<button type="button" onclick="setBillingReviewStep(${currentReviewStep-1})" class="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-lg font-extrabold text-slate-700">ย้อนกลับ</button>`:''}${currentReviewStep<3?`<button type="button" onclick="setBillingReviewStep(${currentReviewStep+1})" class="inline-flex h-11 items-center justify-center rounded-lg bg-brand-700 px-5 text-lg font-extrabold text-white">ถัดไป<span class="material-icons-round ml-1">arrow_forward</span></button>`:`<button type="button" onclick="submitBillingReview()" class="claim-step-action-btn inline-flex h-11 items-center justify-center rounded-lg bg-green-600 px-5 text-white"><span class="material-icons-round mr-1">task_alt</span>ยืนยันผลตรวจสอบ</button>`}</div></div>`;
  }

  function renderPage(){
    const page = ensureReviewPage();
    const activeStep = currentReviewStep===1 ? renderStep1() : currentReviewStep===2 ? renderStep3() : renderStep4();
    page.innerHTML = `<div class="space-y-4">${renderHeader()}<div class="customer-tab-content billing-hospital-tab-content"><section class="customer-tab-pane active" data-billing-hospital-pane="claim"><div class="hospital-claim-content">${renderStepNavigation()}${activeStep}</div></section>${renderBillingSecondaryPanes()}</div></div>`;
    bindFields();
    window.setBillingHospitalMainTab(currentBillingMainTab);
    try { window.scrollTo({top:0, behavior:'smooth'}); } catch(e) {}
  }

  function bindFields(){
    ensureReviewPage().querySelectorAll('[data-review-field]').forEach(el => {
      el.addEventListener('input', () => setDeep(el.dataset.reviewField, el.value));
      el.addEventListener('change', () => setDeep(el.dataset.reviewField, el.value));
    });
  }

  function hideAllWorkflowPages(exceptId){
    const selectors = [
      '.page', '#claimMonitorPage', '#detailPage', '#considerPage', '#billingClaimPage', '#billingHospitalReviewPage',
      '#considerHospitalOpdHalfPage', '#considerHospitalOpdFullPage', ':is(#considerCustomerDetailPage,#considerHospitalOpdFullPage,#considerHospitalOpdHalfPage,#considerDeathDetailPage,#billingHospitalReviewPage)', '#considerDeathPage',
      '#transferTrackingPage', '#claimEntryPage', '#documentPage', '#ocrPage', '#paymentPage', '#claimCalcPage'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(function(el){
      if(!exceptId || el.id !== exceptId){
        el.classList.add('hidden');
        el.style.display = 'none';
        el.setAttribute('aria-hidden','true');
      }
    });
  }
  function showOnlyWorkflowPage(page){
    if(!page) return;
    hideAllWorkflowPages(page.id);
    page.classList.remove('hidden');
    page.style.removeProperty('display');
    page.setAttribute('aria-hidden','false');
  }

  window.__initializeBillingHospitalReviewState = function(rowId){
    const row = (window.hospitalBillingRows || (typeof hospitalBillingRows !== 'undefined' ? hospitalBillingRows : []) || []).find?.(r => r.id === rowId);
    currentBillingReview = JSON.parse(JSON.stringify(billingReviewCases[rowId] || makeFallbackCase(row)));
    currentBillingReview.bill = currentBillingReview.bill || {};
    currentBillingReview.bill.caseNo = formatBillingCaseNo(currentBillingReview.bill,rowId);
    currentBillingReview.product = currentBillingReview.product || row?.product || (String(currentBillingReview.bill?.claimCode || '').toUpperCase().startsWith('CLPA') ? 'PA' : 'PH');
    currentBillingReview.reviewResult = currentBillingReview.reviewResult || 'ผ่าน';
    currentBillingReview.reviewNote = currentBillingReview.reviewNote || 'ตรวจสอบเอกสารและรายการค่าใช้จ่ายแล้ว ข้อมูลครบถ้วน สามารถดำเนินการตั้งเบิกได้';
    currentReviewStep = 1;
    currentBillingMainTab = 'claim';
    return { row, review: currentBillingReview };
  };
  window.openHospitalBillingReview = function(rowId){
    window.__initializeBillingHospitalReviewState(rowId);
    const page = ensureReviewPage();
    showOnlyWorkflowPage(page);
    const title = document.getElementById('pageTitle');
    const sub = document.getElementById('pageSubtitle');
    if (title) title.textContent = 'ตรวจสอบรายการวางบิล';
    if (sub) sub.textContent = 'ตรวจสอบรายการวางบิล > เคลมโรงพยาบาล';
    try { setMenuActive?.('billing'); } catch(e) {}
    renderPage();
  };
  window.setBillingHospitalMainTab = function(tab){
    const page = document.getElementById(REVIEW_PAGE_ID);
    if(!page) return;
    const requested = tab || 'claim';
    currentBillingMainTab = requested === 'payment' && !window.shouldShowClaimPaymentTab?.(billingSharedRow()) ? 'claim' : requested;
    window.setSharedClaimMainTab(page, currentBillingMainTab, 'billingHospital');
  };
  window.setBillingReviewStep = function(step){ currentReviewStep = Number(step || 1); currentBillingMainTab = 'claim'; renderPage(); };
  window.setReviewChoice = function(path,value){ setDeep(path,value); if(path==='claim.coverage'){ resetExpensesByCoverage(false); } renderPage(); };
  window.updateDoc = function(i,k,v){ currentBillingReview.docs[i][k] = k==='count' ? Number(v||0) : v; };
  window.setBillingDocResult = function(i,value){ currentBillingReview.docs[i].result = value; renderPage(); };
  window.previewBillingDocument = function(i){ const d=currentBillingReview.docs[i]; alert(`รายละเอียดเอกสาร\nประเภท: ${d.type}\nชื่อไฟล์: ${d.file || '-'}\nจำนวน: ${d.count || 0}`); };
  window.addBillingReviewDoc = function(){ currentBillingReview.docs.push({code:'DOC-NEW', type:'เอกสารเพิ่มเติม', file:'new_document.pdf', count:1, result:'รอตรวจ', note:''}); renderPage(); };
  window.deleteDoc = function(i){ currentBillingReview.docs.splice(i,1); renderPage(); };
  window.mockScanDoc = function(i){ currentBillingReview.docs[i].count = Number(currentBillingReview.docs[i].count || 0) + 1; currentBillingReview.docs[i].result = 'ผ่าน'; currentBillingReview.docs[i].note = 'อัปโหลด/สแกนเอกสารเรียบร้อย'; renderPage(); };
  window.updateExpense = function(i,k,v,isMoney){
    const row = currentBillingReview.expenses[i];
    if (!row) return;
    row[k] = isMoney ? num(v) : v;
    if (k === 'uncovered' && num(row.uncovered) <= 0) row.reason = '';
    if (k === 'reason' && num(row.uncovered) <= 0) row.reason = '';
    renderPage();
  };
  window.updateBillingEndDiscount = function(value){
    currentBillingReview.bill = currentBillingReview.bill || {};
    currentBillingReview.bill.ssEndDiscount = Math.max(0, num(value));
    renderPage();
  };
  window.addBillingReviewExpense = function(event){
    try {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if (!currentBillingReview) return false;
      if (!Array.isArray(currentBillingReview.expenses)) currentBillingReview.expenses = [];
      const used = new Set(currentBillingReview.expenses.map(x => x.item));
      const nextItem = billingExpenseMaster.find(item => !used.has(item)) || billingExpenseMaster[0];
      currentBillingReview.expenses.push({item:nextItem, claim:0, discount:0, uncovered:0, reason:'', note:''});
      currentReviewStep = 2;
      renderPage();
      setTimeout(function(){
        const rows = document.querySelectorAll('#billingReviewExpenseRows tr');
        const last = rows[rows.length - 1];
        if(last){
          last.scrollIntoView({behavior:'smooth', block:'center'});
          const select = last.querySelector('select');
          if(select){ select.focus(); }
        }
      }, 30);
      return false;
    } catch (error) {
      console.error('addBillingReviewExpense failed', error);
      alert('ไม่สามารถเพิ่มรายการค่ารักษาได้ กรุณาลองใหม่อีกครั้ง');
      return false;
    }
  };
  window.deleteExpense = function(i){ currentBillingReview.expenses.splice(i,1); renderPage(); };
  window.resetExpensesByCoverage = function(refresh=true){
    const coverage = currentBillingReview.claim.coverage;
    const treatment = currentBillingReview.claim.treatment;
    if (coverage === 'ค่าชดเชย') {
      currentBillingReview.expenses = treatment === 'IPD'
        ? [{item:'ค่าชดเชยกรณีนอนโรงพยาบาล', claim:3600, discount:0, uncovered:0, reason:'', note:'1,200 บาท x 3 คืน'}]
        : [{item:'ค่าชดเชยผู้ป่วยนอก OPD', claim:800, discount:0, uncovered:0, reason:'', note:'เหมาจ่ายตามแผน'}];
    } else if (coverage === 'ค่ารักษา') {
      currentBillingReview.expenses = (billingReviewCases.HB001.expenses || []).map(x=>({...x}));
    } else {
      currentBillingReview.expenses = [{item:coverage, claim:currentBillingReview.bill.billAmount || 0, discount:0, uncovered:0, reason:'', note:'ยอดตามการแจ้งเคลม'}];
    }
    if(refresh) renderPage();
  };
  window.setReviewResult = function(result){ currentBillingReview.reviewResult = result; renderPage(); };
  window.saveBillingReviewDraft = function(){ alert('บันทึกแบบร่างรายการวางบิลเรียบร้อย'); };
  window.submitBillingReview = function(){ alert(`ยืนยันผลตรวจสอบรายการวางบิลเรียบร้อย\nผลตรวจสอบ: ${currentBillingReview.reviewResult}\nยอดตั้งเบิกสุทธิ: ${money(totals().net)} บาท`); };
  window.backToHospitalBillingList = function(){
    hideAllWorkflowPages();
    if (typeof showBillingClaimPage === 'function') {
      try { showBillingClaimPage('hospital'); } catch(e) {}
    }
    const billing = document.getElementById('billingClaimPage');
    if (billing) showOnlyWorkflowPage(billing);
    const title = document.getElementById('pageTitle');
    const sub = document.getElementById('pageSubtitle');
    if (title) title.textContent = 'วางบิลเคลม';
    if (sub) sub.textContent = 'วางบิลเคลม - เคลมโรงพยาบาล';
  };

  /* Emergency fix: keep only the stable billing review page flow.
     The previous late override reopened the hospital consider pages and could conflict with Step 2 rendering. */

  window.__getBillingHospitalReviewState = function(){ return currentBillingReview; };
  window.__getBillingHospitalSharedRow = function(){ return billingSharedRow(); };

})();

/* ---- billing-review-emergency-guard: กันหน้าขาวตอนเกิด error (เดิมอยู่บรรทัด 35034-35046) ---- */
(function(){
  window.addEventListener('error', function(){
    setTimeout(function(){
      var visible = document.querySelector('.page:not(.hidden), #billingClaimPage:not(.hidden), #billingHospitalReviewPage:not(.hidden)');
      if (!visible) {
        var page = document.getElementById('billingClaimPage') || document.querySelector('.page');
        if (page) page.classList.remove('hidden');
      }
    }, 0);
  });
})();

/* ---- hotfix: ปุ่มเพิ่มค่าใช้จ่ายให้กดได้เสมอหลัง rerender (เดิมอยู่บรรทัด 35072-35090) ---- */
/* Hotfix: Step 2 add-medical-expense button remains clickable after every rerender. */
(function(){
  if (window.__billingExpenseButtonHotfix) return;
  window.__billingExpenseButtonHotfix = true;
  document.addEventListener('click', function(event){
    const button = event.target.closest && event.target.closest('#billingAddMedicalExpenseBtn');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof window.addBillingReviewExpense === 'function') {
      window.addBillingReviewExpense();
    } else {
      console.error('addBillingReviewExpense is unavailable');
      alert('ระบบเพิ่มรายการยังไม่พร้อม กรุณาเปิด Step 2 ใหม่อีกครั้ง');
    }
  }, true);
})();

/* ---- billing-sidebar-navigation-state-fix (เดิมอยู่บรรทัด 35453-35503) ---- */
(function(){
  if(window.__billingSidebarNavigationStateFix) return;
  window.__billingSidebarNavigationStateFix = true;

  const pageSelectors = '.page, #claimMonitorPage, #detailPage, #considerPage, #billingClaimPage, #billingHospitalReviewPage, #considerHospitalOpdHalfPage, #considerHospitalOpdFullPage, :is(#considerCustomerDetailPage,#considerHospitalOpdFullPage,#considerHospitalOpdHalfPage,#considerDeathDetailPage,#billingHospitalReviewPage), #considerDeathPage';
  function activateOnly(id){
    document.querySelectorAll(pageSelectors).forEach(function(el){
      const active = el.id === id;
      el.classList.toggle('hidden', !active);
      if(active){
        el.style.removeProperty('display');
        el.setAttribute('aria-hidden','false');
      }else{
        el.style.removeProperty('display');
        el.setAttribute('aria-hidden','true');
      }
    });
  }

  function repairNavigation(targetId){
    const target = document.getElementById(targetId);
    if(!target) return;
    activateOnly(targetId);
    requestAnimationFrame(function(){
      target.classList.remove('hidden');
      target.style.removeProperty('display');
      target.setAttribute('aria-hidden','false');
    });
  }

  document.addEventListener('click', function(event){
    const menu = event.target.closest && event.target.closest('#submenuBillingCustomer, #submenuBillingHospital, #menuBilling, #submenuConsiderCustomer, #submenuConsiderHospital, #submenuConsiderDeath, #submenuNewClaim, #submenuTransferTracking, #menuEligibility, #menuCalc');
    if(!menu) return;
    setTimeout(function(){
      if(menu.id === 'submenuBillingCustomer' || menu.id === 'submenuBillingHospital' || menu.id === 'menuBilling') repairNavigation('billingClaimPage');
      else if(menu.id === 'submenuConsiderCustomer' || menu.id === 'submenuConsiderHospital') repairNavigation('considerPage');
      else if(menu.id === 'submenuConsiderDeath') repairNavigation('considerDeathPage');
      else if(menu.id === 'submenuNewClaim') repairNavigation('claimMonitorPage');
      else if(menu.id === 'submenuTransferTracking') repairNavigation('transferTrackingPage');
      else if(menu.id === 'menuEligibility') repairNavigation('monitorPage');
      else if(menu.id === 'menuCalc') repairNavigation('claimCalcPage');
    }, 0);
  }, true);

  /* Remove stale inline display:none left by the previous exclusive-page guard. */
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll(pageSelectors).forEach(function(el){ el.style.removeProperty('display'); });
  });
})();

/* ---- billing-hospital-source-of-truth-v6: patch ล่าสุดที่ override ฟังก์ชันด้านบนทั้งหมด (เดิมอยู่บรรทัด 63255-63707) ---- */
(function(){
  const pageId = 'billingHospitalReviewPage';
  const oldOpen = window.openHospitalBillingReview;
  const oldHospitalTab = window.setHospitalMainTab;
  const oldFullStep = window.setHospitalFullStep;
  const oldHalfStep = window.setHospitalHalfStep;
  const oldEndDiscount = window.updateBillingEndDiscount;
  const oldInsuranceExcessToggle = window.toggleHospitalInsuranceExcessStep2;
  let activeMode = 'full';

  function ensureBillingReviewPage(){
    let page = document.getElementById(pageId);
    if(!page){
      page = document.createElement('section');
      page.id = pageId;
      page.className = 'page hidden px-1 py-2 lg:px-1 lg:py-3 xl:px-1 xl:py-4';
      const anchor = document.getElementById('billingClaimPage');
      (anchor?.parentElement || document.querySelector('main') || document.body).appendChild(page);
    }
    return page;
  }

  function visibleBillingPage(){
    const page = document.getElementById(pageId);
    return page && !page.classList.contains('hidden') && page.style.display !== 'none' ? page : null;
  }
  function valueAt(source, path){
    return String(path).split('.').reduce((value, key) => value == null ? undefined : value[key], source);
  }
  function backendAmount(state, paths){
    for(const path of paths){
      const value = valueAt(state, path);
      if(value !== undefined && value !== null && value !== ''){
        const number = Number(String(value).replace(/,/g,''));
        if(Number.isFinite(number)) return number;
      }
    }
    return null;
  }
  function money(value){
    return value == null ? '-' : Number(value).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function billingState(){
    return typeof window.__getBillingHospitalReviewState === 'function' ? window.__getBillingHospitalReviewState() : null;
  }
  function normalizedTreatment(state){
    const value = String(state?.claim?.treatment || state?.bill?.claimType || '').trim();
    if(/Day\s*Case/i.test(value)) return 'Day Case Surgery';
    if(/IPD/i.test(value)) return 'IPD';
    return 'OPD';
  }
  function htmlDate(value){
    const raw = String(value || '').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(!match) return '';
    const year = Number(match[3]) > 2400 ? Number(match[3]) - 543 : Number(match[3]);
    return `${year}-${String(match[2]).padStart(2,'0')}-${String(match[1]).padStart(2,'0')}`;
  }
  function cleanLabel(value){
    return String(value || '').replace(/\*/g,'').replace(/\s+/g,' ').trim();
  }
  function setLabeledControl(pane,label,value){
    if(value === undefined || value === null) return;
    const expected = cleanLabel(label);
    const wrapper = Array.from(pane.querySelectorAll('label')).find(item => {
      const firstDiv = Array.from(item.children || []).find(child => child.tagName === 'DIV');
      return cleanLabel(firstDiv?.textContent).startsWith(expected);
    });
    const control = wrapper?.querySelector('input,select,textarea');
    if(!control) return;
    const text = String(value);
    if(control.tagName === 'SELECT' && !Array.from(control.options || []).some(option => option.value === text || option.textContent === text)){
      const option = document.createElement('option');
      option.value = text;
      option.textContent = text;
      control.appendChild(option);
    }
    control.value = text;
  }
  function applyBillingDocumentResult(row,result){
    const allowed = ['ผ่าน','ไม่ผ่าน','รอเอกสารเพิ่มเติม'];
    const value = allowed.includes(result) ? result : '';
    if(value) row.dataset.hospitalDocResult = value;
    else delete row.dataset.hospitalDocResult;
    row.querySelectorAll('.hospital-doc-result-btn').forEach(button => {
      const selected = value && button.dataset.docResult === value;
      button.classList.toggle('is-selected',!!selected);
      button.setAttribute('aria-pressed',selected ? 'true' : 'false');
    });
  }
  function normalizeBillingDocuments(pane,state){
    const docs = Array.isArray(state?.docs) ? state.docs : [];
    pane.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(header => cleanLabel(header.textContent));
      const resultIndex = headers.findIndex(value => value.includes('ผลการตรวจ'));
      const countIndex = headers.findIndex(value => value.includes('จำนวนเอกสาร'));
      const noteIndex = headers.findIndex(value => value.includes('หมายเหตุ'));
      if(resultIndex < 0) return;
      table.querySelectorAll('tbody tr').forEach((row,index) => {
        const name = cleanLabel(row.children[0]?.textContent);
        const doc = docs.find(item => cleanLabel(item.type || item.name) === name) || docs[index] || null;
        const count = Math.max(0,Number(doc?.count || 0));
        if(countIndex >= 0 && row.children[countIndex]){
          const countTarget = row.children[countIndex].querySelector('span') || row.children[countIndex];
          countTarget.textContent = String(count);
          countTarget.dataset.docCount = String(count);
        }
        const note = (noteIndex >= 0 ? row.children[noteIndex]?.querySelector('input,textarea') : null) || row.querySelector('td:last-child input,td:last-child textarea');
        if(note){
          note.value = doc?.note || '';
          note.dataset.hospitalDocNote = 'true';
          note.disabled = false;
          if(!note.dataset.billingDocBound){
            note.dataset.billingDocBound = 'true';
            note.addEventListener('input',function(){ if(doc) doc.note = this.value; });
          }
        }
        const normalizedResult = String(doc?.result || '').trim() === 'รอตรวจ' ? 'รอเอกสารเพิ่มเติม' : String(doc?.result || '').trim();
        const defaultResult = count > 0 ? (normalizedResult || 'ผ่าน') : normalizedResult;
        const buttons = Array.from(row.querySelectorAll('button')).filter(button => ['ผ่าน','ไม่ผ่าน','รอเอกสารเพิ่มเติม'].includes(cleanLabel(button.textContent)));
        buttons.forEach(button => {
          const result = cleanLabel(button.textContent);
          button.type = 'button';
          button.classList.add('hospital-doc-result-btn');
          button.dataset.docResult = result;
          button.removeAttribute('onclick');
          button.disabled = false;
          if(!button.dataset.billingDocBound){
            button.dataset.billingDocBound = 'true';
            button.addEventListener('click',function(){
              const next = row.dataset.hospitalDocResult === result ? '' : result;
              applyBillingDocumentResult(row,next);
              if(doc) doc.result = next;
            });
          }
        });
        row.dataset.hospitalDocRequired = count > 0 ? 'true' : 'false';
        applyBillingDocumentResult(row,defaultResult);
      });
    });
  }
  function normalizeBillingStep1(){
    const page = visibleBillingPage();
    const state = billingState();
    if(!page || !state) return;
    const prefix = activeMode === 'half' ? 'hh' : 'hf';
    const pane = page.querySelector(`#${prefix}StepPane1`);
    if(!pane) return;
    const claim = state.claim || {};
    const medical = state.medical || {};
    setLabeledControl(pane,'วันที่แจ้ง',htmlDate(state.bill?.sentDate));
    setLabeledControl(pane,'วันที่เอกสารครบ',htmlDate(claim.documentCompleteDate || state.bill?.sentDate));
    setLabeledControl(pane,'วันที่เกิดเหตุ',htmlDate(claim.incidentDate || claim.symptomDate));
    setLabeledControl(pane,'เวลาที่เกิดเหตุ',claim.incidentTime);
    const directValues = {
      [`${prefix}AdmitDate`]:htmlDate(claim.admitDate),
      [`${prefix}AdmitTime`]:claim.admitTime,
      [`${prefix}DischargeDate`]:htmlDate(claim.dischargeDate),
      [`${prefix}DischargeTime`]:claim.dischargeTime,
      [`${prefix}IpdDays`]:medical.ipdDays ?? 0,
      [`${prefix}IcuDays`]:medical.icuDays ?? 0,
      [`${prefix}TotalStayDays`]:Math.max(Number(medical.ipdDays || 0),Number(medical.icuDays || 0))
    };
    Object.entries(directValues).forEach(([id,value]) => { const element = pane.querySelector(`#${id}`); if(element && value !== undefined) element.value = String(value); });
    const totalStay = Math.max(Number(medical.ipdDays || 0),Number(medical.icuDays || 0));
    const displays = { [`${prefix}IpdDaysDisplay`]:medical.ipdDays ?? 0, [`${prefix}IcuDaysDisplay`]:medical.icuDays ?? 0, [`${prefix}TotalStayDaysDisplay`]:totalStay };
    Object.entries(displays).forEach(([id,value]) => { const element = pane.querySelector(`#${id}`); if(element) element.textContent = String(value); });
    setLabeledControl(pane,'สถานพยาบาล',claim.hospital || state.bill?.hospital);
    setLabeledControl(pane,'อาการสำคัญ(ChiefComplaint)',claim.chiefComplaint);
    setLabeledControl(pane,'การวินิจฉัย1(Diagnosis1)',claim.diagnosis1);
    setLabeledControl(pane,'การวินิจฉัย2(Diagnosis2)',claim.diagnosis2);
    setLabeledControl(pane,'การวินิจฉัย3(Diagnosis3)',claim.diagnosis3);
    setLabeledControl(pane,'รายละเอียด',claim.note);
    setLabeledControl(pane,'HN',medical.hn);
    setLabeledControl(pane,'VN',medical.vn);
    setLabeledControl(pane,'AN',medical.an);
    setLabeledControl(pane,'โรคประจำตัว (U/D)',medical.ud);
    setLabeledControl(pane,'ข้อบ่งชี้การ Admit',medical.admitIndication || (normalizedTreatment(state) === 'IPD' ? 'มีข้อบ่งชี้ต้องนอนรักษาในโรงพยาบาล' : ''));
    setLabeledControl(pane,'วิธีการรักษาพยาบาล',medical.treatmentMethod || medical.diagnosis);
    setLabeledControl(pane,'ผลการตรวจ LAB, EKG, X-ray และอื่นๆ',medical.lab);
    setLabeledControl(pane,'รายละเอียดเพิ่มเติม',medical.additionalDetail || '');
    setLabeledControl(pane,'เลขใบประกอบวิชาชีพเวชกรรม',medical.doctorLicense);
    setLabeledControl(pane,'แพทย์(ชื่อ-สกุล)',medical.doctor);
    const procedureLabel = Array.from(pane.querySelectorAll('div')).find(element => cleanLabel(element.textContent) === 'มีการทำหัตถการหรือไม่');
    const procedureWrap = procedureLabel?.parentElement;
    Array.from(procedureWrap?.querySelectorAll('button') || []).forEach(button => {
      const selected = cleanLabel(button.textContent) === String(medical.procedure || 'ไม่ใช่');
      button.classList.toggle('bg-brand-50',selected);
      button.classList.toggle('text-brand-700',selected);
      button.disabled = true;
    });
    normalizeBillingDocuments(pane,state);
    pane.querySelectorAll('input,select,textarea').forEach(field => {
      const isDocNote = field.matches('[data-hospital-doc-note]');
      const isContinuous = field.matches('.continuous-claim-modal-trigger,[data-continuous-claim-modal="true"]') || /ContinuousClaimCheckbox$/i.test(field.id || '');
      const isDecision = !!field.closest('#customerDecisionSection,.customer-decision-section,.dd-decision-dynamic');
      field.disabled = !(isDocNote || isContinuous || isDecision);
      if(isContinuous) field.dataset.hospitalContinuousEditable = 'true';
      field.setAttribute('aria-disabled',field.disabled ? 'true' : 'false');
    });
    pane.querySelectorAll('#customerClaimSelectionBlock button,[data-claim-choice],.claim-treatment-btn').forEach(button => {
      button.disabled = true;
      button.setAttribute('aria-disabled','true');
    });
    pane.dataset.billingClaimReadonly = 'true';
  }
  function normalizeBillingLayout(){
    const page = visibleBillingPage();
    if(!page) return;
    page.querySelectorAll('button').forEach(button => {
      if(!cleanLabel(button.textContent).includes('อัปโหลดใบแจ้งค่ารักษา')) return;
      const uploadRow = button.closest('.cc-ref-upload-row');
      if(uploadRow && uploadRow.querySelectorAll('button').length === 1) uploadRow.remove();
      else button.remove();
    });
    page.querySelectorAll('table').forEach(table => {
      const parent = table.parentElement;
      if(parent?.matches?.('.overflow-x-auto,.cc-ref-table-wrap,.hospital-table-scroll,.coverage-table-wrap,.payment-table-wrap,.billing-runtime-table-scroll')) return;
      const shell = document.createElement('div');
      shell.className = 'billing-runtime-table-scroll';
      table.before(shell);
      shell.appendChild(table);
    });
    page.querySelectorAll('input,select,textarea,button').forEach(control => {
      control.style.maxWidth = '100%';
      control.style.boxSizing = 'border-box';
    });
    normalizeBillingStep1();
    normalizeBillingInsuranceExcess();
  }
  function normalizeBillingInsuranceExcess(){
    const page = visibleBillingPage();
    const state = billingState();
    if(!page || !state) return;
    const saved = state.insuranceExcess || {};
    page.querySelectorAll('.hospital-insurance-excess-box').forEach(box => {
      const checkbox = box.querySelector('.hospital-insurance-excess-check');
      const select = box.querySelector('.hospital-insurance-excess-select');
      const desc = box.querySelector('.hospital-insurance-excess-desc');
      if(!checkbox || !select) return;
      if(desc) desc.textContent = 'เลือกเมื่อโรงพยาบาลส่งยอดส่วนเกินจากบริษัทประกันอื่นมาให้สยามสไมล์พิจารณาต่อ';
      checkbox.checked = !!saved.enabled;
      select.disabled = !checkbox.checked;
      if(saved.company && Array.from(select.options || []).some(option => option.value === saved.company || option.textContent === saved.company)) select.value = saved.company;
      box.classList.toggle('is-disabled',!checkbox.checked);
      if(!select.dataset.billingInsuranceBound){
        select.dataset.billingInsuranceBound = 'true';
        select.addEventListener('change',function(){
          state.insuranceExcess = state.insuranceExcess || {};
          state.insuranceExcess.company = this.value;
        });
      }
    });
  }
  function billingRow(){
    const shared = typeof window.__getBillingHospitalSharedRow === 'function' ? window.__getBillingHospitalSharedRow() : {};
    const state = billingState() || {};
    return {
      ...shared,
      claimNo:shared.claimCode || state.bill?.claimCode,
      claimType:state.bill?.claimType || shared.claimType,
      treatmentType:state.claim?.treatment || state.bill?.claimType,
      claimCause:state.claim?.cause,
      diagnosis:state.claim?.diagnosis1,
      chiefComplaint:state.claim?.chiefComplaint,
      isContinuous:!!state.claim?.isContinuous,
      previousClaimNo:state.claim?.previousClaimNo,
      previousServiceDate:state.claim?.previousServiceDate
    };
  }
  function billingStep2Sections(){
    const state = billingState() || {};
    const totalExpense = backendAmount(state,[
      'decisionAmounts.totalExpense','decision.totalExpense','consideration.totalExpense',
      'approval.totalExpense','bill.totalExpense'
    ]);
    const hospitalRight = backendAmount(state,[
      'decisionAmounts.hospitalCompanyRight','decision.hospitalCompanyRight',
      'consideration.hospitalCompanyRight','approval.hospitalCompanyRight',
      'decisionAmounts.hospitalBillableAmount','bill.approvedAmount'
    ]);
    const endDiscount = backendAmount(state,[
      'billingAmounts.endBillDiscount','bill.ssEndDiscount','bill.endBillDiscount'
    ]);
    const backendNetBillable = backendAmount(state,[
      'billingAmounts.netBillableAmount','bill.netBillableAmount','bill.netAmount'
    ]);
    const expenseRows = Array.isArray(state.expenses) ? state.expenses : [];
    const calculatedRight = expenseRows.reduce((sum,row) => {
      const claim = Number(String(row?.claim ?? 0).replace(/,/g,'')) || 0;
      const discount = Number(String(row?.discount ?? 0).replace(/,/g,'')) || 0;
      const uncovered = Number(String(row?.uncovered ?? 0).replace(/,/g,'')) || 0;
      return sum + Math.max(0,claim - discount - uncovered);
    },0);
    const initialDiscount = Math.max(0,endDiscount || 0);
    const billableTotal = Math.max(0,hospitalRight ?? (backendNetBillable == null ? calculatedRight : backendNetBillable + initialDiscount));
    const safeDiscount = Math.min(initialDiscount,billableTotal);
    const netBillable = Math.max(0,billableTotal - safeDiscount);
    return `<div data-billing-step2-extra="true" class="space-y-4">
      <section class="cc-ref-summary-box billing-consideration-summary">
        <div class="cc-ref-summary-title"><span class="material-icons-round">request_quote</span>ยอดเงินตามการพิจารณา</div>
        <div class="cc-ref-summary-grid">
          <div class="cc-ref-money-card"><div class="cc-ref-money-label">ค่าใช้จ่ายทั้งหมด :</div><div><span class="cc-ref-money-value">${money(totalExpense)}</span>${totalExpense == null ? '' : '<span class="cc-ref-money-unit">บาท</span>'}</div></div>
          <div class="cc-ref-transfer-stack"><div class="cc-ref-transfer-card blue"><span class="cc-ref-transfer-icon"><span class="material-icons-round">account_balance</span></span><span>สิทธิ์โรงพยาบาลตั้งเบิกกับบริษัท :</span><strong>${money(hospitalRight)}</strong>${hospitalRight == null ? '' : '<span>บาท</span>'}</div></div>
        </div>
      </section>
      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white" data-billing-end-discount="true">
        <div class="flex items-center gap-2 border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-xl font-extrabold text-slate-700"><span class="material-icons-round text-brand-700">price_check</span><span><strong>ส่วนลดท้ายบิล</strong><small class="mt-1 block text-sm font-semibold text-slate-500">สรุปรายละเอียดส่วนลดและยอดเบิกสุทธิ</small></span></div>
        <div class="billing-end-discount-grid p-4">
          <label class="billing-end-discount-field"><div class="mb-1 text-sm font-bold text-slate-500">ยอดรวม</div><div class="billing-end-discount-control"><input id="billingEndDiscountTotal" value="${money(billableTotal)}" data-billing-total="${billableTotal}" readonly class="h-11 rounded-lg border border-blue-200 bg-blue-50 px-3 pr-14 text-right text-lg font-extrabold text-brand-700"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">บาท</span></div></label>
          <span class="billing-end-discount-operator" aria-hidden="true">−</span>
          <label class="billing-end-discount-field"><div class="mb-1 text-sm font-bold text-slate-500">ส่วนลด SS ท้ายบิล</div><div class="billing-end-discount-control"><input id="billingSsEndDiscount" type="number" min="0" max="${billableTotal}" step="0.01" value="${safeDiscount}" oninput="updateBillingEndDiscount(this.value)" class="h-11 rounded-lg border border-orange-200 bg-orange-50/40 px-3 pr-14 text-right text-lg font-extrabold text-orange-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">บาท</span></div></label>
          <span class="billing-end-discount-operator" aria-hidden="true">=</span>
          <label class="billing-end-discount-field"><div class="mb-1 text-sm font-bold text-green-700">ยอดเบิกสุทธิ</div><div class="billing-end-discount-control"><input id="billingNetBillableAmount" value="${money(netBillable)}" readonly class="h-11 rounded-lg border border-green-300 bg-green-50 px-3 pr-14 text-right text-xl font-extrabold text-green-700"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600">บาท</span></div></label>
        </div>
        <div class="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"><span class="material-icons-round mr-1 align-middle text-blue-400">info</span>ยอดเบิกสุทธิ คือ จำนวนเงินที่สามารถเบิกจ่ายได้หลังหักส่วนลดท้ายบิล</div>
      </section>
    </div>`;
  }
  function enhanceBillingStep2(){
    const page = visibleBillingPage();
    if(!page) return;
    const prefix = activeMode === 'half' ? 'hh' : 'hf';
    const pane = page.querySelector(`#${prefix}StepPane2`);
    if(!pane || pane.querySelector('[data-billing-step2-extra="true"]')) return;
    const holder = document.createElement('div');
    holder.innerHTML = billingStep2Sections();
    const extra = holder.firstElementChild;
    const insuranceExcess = pane.querySelector('.hospital-insurance-excess-box');
    const decision = pane.querySelector('.cc-ref-decision-wrap, #customerDecisionSection');
    const action = pane.querySelector('.cc-ref-actionbar, .customer-step1-footer, .flex.flex-col.gap-3.pt-2');
    const anchor = insuranceExcess || decision || action;
    if(anchor) anchor.before(extra); else pane.appendChild(extra);
  }
  function renderFromConsiderationSource(){
    const page = ensureBillingReviewPage();
    if(!page || typeof window.__renderHospitalConsiderationSource !== 'function') return false;
    const state = billingState() || {};
    const row = billingRow();
    const claimType = String(row.claimType || row.treatmentType || '');
    activeMode = (/IPD|Day\s*Case|Full/i.test(claimType)) ? 'full' : 'half';
    window.hospitalClaimSelectionState = {
      cause:String(state.claim?.cause || 'เจ็บป่วย'),
      coverage:'ค่ารักษา',
      treatment:normalizedTreatment(state)
    };
    window.currentConsiderHospitalRow = row;
    window.currentConsiderHospitalKind = activeMode;
    window.__hospitalConsiderMode = claimType;
    ['considerHospitalOpdFullPage','considerHospitalOpdHalfPage'].forEach(id => {
      const consideration = document.getElementById(id);
      if(consideration){ consideration.classList.add('hidden'); consideration.innerHTML = ''; }
    });
    page.innerHTML = window.__renderHospitalConsiderationSource(activeMode,row)
      .replaceAll("showConsiderationPage('hospital')","backToHospitalBillingList()")
      .replaceAll('บันทึกข้อมูลเคลม - เคลมโรงพยาบาล','ตรวจสอบรายการวางบิล - เคลมโรงพยาบาล');
    page.classList.remove('hidden');
    page.style.removeProperty('display');
    page.setAttribute('aria-hidden','false');
    const setter = activeMode === 'half' ? oldHalfStep : oldFullStep;
    if(typeof setter === 'function') setter(1);
    window.setHospitalMainTab('claim');
    normalizeBillingLayout();
    return true;
  }
  window.openHospitalBillingReview = function(rowId){
    if(typeof window.__initializeBillingHospitalReviewState === 'function') window.__initializeBillingHospitalReviewState(rowId);
    else if(typeof oldOpen === 'function') oldOpen(rowId);
    const page = ensureBillingReviewPage();
    if(page){
      document.querySelectorAll('.page, #claimMonitorPage, #detailPage, #considerPage, #billingClaimPage, #considerHospitalOpdFullPage, #considerHospitalOpdHalfPage').forEach(el => {
        if(el !== page){ el.classList.add('hidden'); el.style.display = 'none'; el.setAttribute('aria-hidden','true'); }
      });
      page.classList.remove('hidden'); page.style.removeProperty('display'); page.setAttribute('aria-hidden','false');
    }
    renderFromConsiderationSource();
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    if(title) title.textContent = 'ตรวจสอบรายการวางบิล';
    if(subtitle) subtitle.textContent = 'ตรวจสอบรายการวางบิล > เคลมโรงพยาบาล';
    setTimeout(normalizeBillingLayout,0);
  };
  window.setHospitalMainTab = function(tab){
    const page = visibleBillingPage();
    if(page){
      const requested = tab || 'claim';
      const safeTab = requested === 'payment' && !window.shouldShowClaimPaymentTab?.(billingRow()) ? 'claim' : requested;
      if(typeof window.setSharedClaimMainTab === 'function') window.setSharedClaimMainTab(page,safeTab,'hospital');
      setTimeout(normalizeBillingLayout,0);
      return;
    }
    if(typeof oldHospitalTab === 'function') return oldHospitalTab(tab);
  };
  window.setHospitalFullStep = function(step){
    const result = typeof oldFullStep === 'function' ? oldFullStep(step) : undefined;
    if(visibleBillingPage() && Number(step) === 2) setTimeout(enhanceBillingStep2,0);
    if(visibleBillingPage()) setTimeout(normalizeBillingLayout,0);
    return result;
  };
  window.setHospitalHalfStep = function(step){
    const result = typeof oldHalfStep === 'function' ? oldHalfStep(step) : undefined;
    if(visibleBillingPage() && Number(step) === 2) setTimeout(enhanceBillingStep2,0);
    if(visibleBillingPage()) setTimeout(normalizeBillingLayout,0);
    return result;
  };
  window.updateBillingEndDiscount = function(value){
    const state = billingState();
    if(!state){
      if(typeof oldEndDiscount === 'function') return oldEndDiscount(value);
      return;
    }
    const totalInput = document.getElementById('billingEndDiscountTotal');
    const parsedTotal = Number(totalInput?.dataset?.billingTotal ?? String(totalInput?.value || '').replace(/,/g,''));
    const total = Number.isFinite(parsedTotal) ? Math.max(0,parsedTotal) : 0;
    const raw = String(value ?? '').trim();
    const parsedDiscount = raw === '' ? 0 : Number(raw.replace(/,/g,''));
    const discount = Math.min(total,Math.max(0,Number.isFinite(parsedDiscount) ? parsedDiscount : 0));
    state.bill = state.bill || {};
    state.billingAmounts = state.billingAmounts || {};
    state.bill.ssEndDiscount = discount;
    state.bill.endBillDiscount = discount;
    state.bill.netBillableAmount = Math.max(0,total - discount);
    state.bill.netAmount = state.bill.netBillableAmount;
    state.billingAmounts.endBillDiscount = discount;
    state.billingAmounts.netBillableAmount = state.bill.netBillableAmount;
    const discountInput = document.getElementById('billingSsEndDiscount');
    if(discountInput && (parsedDiscount < 0 || parsedDiscount > total || !Number.isFinite(parsedDiscount))) discountInput.value = String(discount);
    const netInput = document.getElementById('billingNetBillableAmount');
    if(netInput) netInput.value = money(state.bill.netBillableAmount);
  };
  window.toggleHospitalInsuranceExcessStep2 = function(prefix){
    if(typeof oldInsuranceExcessToggle === 'function') oldInsuranceExcessToggle(prefix);
    const page = visibleBillingPage();
    const state = billingState();
    if(!page || !state) return;
    const checkbox = page.querySelector(`#${prefix}InsuranceExcessStep2Checkbox`);
    const select = page.querySelector(`#${prefix}InsuranceExcessCompanyStep2`);
    const box = page.querySelector(`#${prefix}InsuranceExcessStep2Box`);
    const enabled = !!checkbox?.checked;
    state.insuranceExcess = state.insuranceExcess || {};
    state.insuranceExcess.enabled = enabled;
    if(enabled && select?.value) state.insuranceExcess.company = select.value;
    if(!enabled) state.insuranceExcess.company = '';
    if(select){
      select.disabled = !enabled;
      if(!enabled) select.value = '';
    }
    if(box) box.classList.toggle('is-disabled',!enabled);
  };
})();

