/* Claim Detail mock catalog: Phase 2C (data only, Classic Script). */
(function () {
  "use strict";

  const base = {
    claimNo: "-", caseNo: "-", applicationId: "-", product: "PH", plan: "-",
    claimCategory: "เคลมลูกค้า", claimType: "OPD", treatmentType: "OPD", treatment: "OPD",
    claimStatus: "รอพิจารณา", decisionStatus: "ยังไม่มีผลพิจารณาสุดท้าย",
    approvedAmount: null, transferStatus: "ยังไม่สร้างรายการโอน",
    claimDate: "10/09/2569 09:00:00", decisionDate: "-",
    reviewer: "06590 - ณัฏฐณิชา โตรักษา",
    insuredName: "-", citizenId: "-", passport: "", studentRef: "",
    insuredStatus: "ปกติ", birthDate: "15/05/2539", gender: "ชาย", contact: "-",
    schoolInformation: null, schoolStatus: null,
    claimCause: "เจ็บป่วย", coverageType: "ค่ารักษา",
    incidentDateTime: { date: "2026-09-08", time: "09:30" },
    hospitalInDateTime: { date: "2026-09-08", time: "10:00" },
    hospitalOutDateTime: { date: "2026-09-08", time: "11:30" },
    hospitalName: "โรงพยาบาลมะการักษ์", hospitalProvince: "กาญจนบุรี",
    hn: "HN69090001", vn: "VN69090001", an: "", stayDays: { ipd: 0, icu: 0, total: 0 },
    diagnosis1: "R50.9 : Fever, unspecified", diagnosis2: "-", diagnosis3: "-",
    chiefComplaint: "มีไข้และอ่อนเพลีย", medicalNote: "ตรวจรักษาตามอาการ",
    trafficAccident: { isTrafficAccident: false, accidentDate: "-", accidentTime: "-", location: "-", vehicle: "-", policeStation: "-", reportNo: "-" },
    financial: { claimedAmount: "1,250.00", discountAmount: "0.00", nonCoveredAmount: "200.00", eligibleAmount: "1,050.00", approvedAmount: null },
    documents: [
      { code: "DOC-CLAIM-FORM", name: "แบบฟอร์มเรียกร้องสินไหม", status: "ได้รับเอกสารแล้ว", note: "-" },
      { code: "DOC-MEDICAL", name: "ใบรับรองแพทย์", status: "ได้รับเอกสารแล้ว", note: "-" }
    ],
    decision: { final: false, value: "", reason: "", note: "" },
    claimJourney: [
      { stage: "รับแจ้งเคลม", status: "เสร็จสิ้น", date: "10/09/2569 09:00:00" },
      { stage: "ตรวจสอบข้อมูล", status: "กำลังดำเนินการ", date: "10/09/2569 09:10:00" },
      { stage: "พิจารณาเคลม", status: "รอดำเนินการ", date: "-" }
    ]
  };

  const productOverrides = {
    PH: { schoolInformation: null, schoolStatus: null },
    PA: {
      claimCause: "อุบัติเหตุ", schoolStatus: "อนุมัติกรมธรรม์",
      schoolInformation: { name: "โรงเรียนทดสอบ Claim Monitor", coordinator: "ครูผู้ประสานงาน", coordinatorPhone: "081-234-5678" }
    }
  };

  const categoryOverrides = {
    "เคลมลูกค้า": { claimCategory: "เคลมลูกค้า", transferStatus: "ยังไม่สร้างรายการโอน" },
    "เคลมโรงพยาบาล": { claimCategory: "เคลมโรงพยาบาล", hospitalName: "โรงพยาบาลมะการักษ์", hospitalProvince: "กาญจนบุรี", transferStatus: "ยังไม่ตั้งหนี้โรงพยาบาล" }
  };

  const treatmentOverrides = {
    OPD: {
      treatment: "OPD", diagnosis1: "J06.9 : Acute upper respiratory infection, unspecified",
      chiefComplaint: "มีไข้ ไอ และเจ็บคอ", stayDays: { ipd: 0, icu: 0, total: 0 },
      financial: { claimedAmount: "1,250.00", nonCoveredAmount: "200.00", eligibleAmount: "1,050.00" }
    },
    IPD: {
      treatment: "IPD", an: "AN69090001", diagnosis1: "A09 : Infectious gastroenteritis and colitis, unspecified",
      diagnosis2: "E86 : Volume depletion", chiefComplaint: "ไข้สูง อาเจียน และมีภาวะขาดน้ำ",
      hospitalOutDateTime: { date: "2026-09-11", time: "11:30" }, stayDays: { ipd: 3, icu: 0, total: 3 },
      medicalNote: "รับไว้รักษา ให้สารน้ำ และติดตามอาการ 3 วัน",
      financial: { claimedAmount: "18,450.00", nonCoveredAmount: "650.00", eligibleAmount: "17,800.00" }
    },
    "Day Case Surgery": {
      treatment: "Day Case Surgery", diagnosis1: "L72 : Follicular cysts of skin and subcutaneous tissue",
      chiefComplaint: "เข้ารับการผ่าตัดเล็กแบบ Day Case", hospitalOutDateTime: { date: "2026-09-08", time: "17:00" },
      stayDays: { ipd: 0, icu: 0, total: 0 }, medicalNote: "กลับบ้านในวันเดียวกันหลังสังเกตอาการ",
      financial: { claimedAmount: "12,800.00", nonCoveredAmount: "300.00", eligibleAmount: "12,500.00" }
    },
    "OPD Half": {
      treatment: "OPD Half", diagnosis1: "R51 : Headache", chiefComplaint: "ปวดศีรษะและเวียนศีรษะ",
      financial: { claimedAmount: "550.00", nonCoveredAmount: "0.00", eligibleAmount: "550.00" }
    },
    "OPD Full": {
      treatment: "OPD Full", diagnosis1: "J02.9 : Acute pharyngitis, unspecified", diagnosis2: "R50.9 : Fever, unspecified",
      chiefComplaint: "ไข้ ไอ เจ็บคอ และอ่อนเพลีย",
      financial: { claimedAmount: "6,200.00", discountAmount: "200.00", nonCoveredAmount: "500.00", eligibleAmount: "5,500.00" }
    }
  };

  const statusOverrides = {
    "รอพิจารณา": { decisionStatus: "รอพิจารณา", approvedAmount: null, transferStatus: "ยังไม่สร้างรายการโอน", decision: { final: false, value: "", reason: "", note: "รอผู้พิจารณาตรวจสอบข้อมูล" } },
    "รอเอกสาร": {
      decisionStatus: "รอเอกสาร", approvedAmount: null, transferStatus: "ยังไม่สร้างรายการโอน",
      documents: [
        { code: "DOC-CLAIM-FORM", name: "แบบฟอร์มเรียกร้องสินไหม", status: "ได้รับเอกสารแล้ว", note: "-" },
        { code: "DOC-MEDICAL", name: "ใบรับรองแพทย์ฉบับสมบูรณ์", status: "รอเอกสาร", note: "กรุณาส่งฉบับที่มีลายเซ็นแพทย์" }
      ],
      decision: { final: false, value: "รอเอกสาร", reason: "เอกสารประกอบไม่ครบ", note: "รอใบรับรองแพทย์ฉบับสมบูรณ์" }
    },
    "รอแก้ไข": { decisionStatus: "รอแก้ไข", approvedAmount: null, transferStatus: "ยังไม่สร้างรายการโอน", decision: { final: false, value: "รอแก้ไข", reason: "ข้อมูลการรักษาไม่สอดคล้องกับเอกสาร", note: "ตรวจสอบวันที่รักษาและ Diagnosis อีกครั้ง" } },
    "ปฏิเสธ": { decisionStatus: "ปฏิเสธ", approvedAmount: 0, transferStatus: "ไม่มีรายการโอน", financial: { approvedAmount: "0.00" }, decisionDate: "10/09/2569 14:30:00", decision: { final: true, value: "ปฏิเสธ", reason: "ไม่เข้าเงื่อนไขความคุ้มครอง", note: "ตรวจสอบตามเงื่อนไขกรมธรรม์แล้ว" } },
    "ยกเลิก": { decisionStatus: "ยกเลิก", approvedAmount: 0, transferStatus: "ไม่มีรายการโอน", financial: { approvedAmount: "0.00" }, decisionDate: "10/09/2569 13:45:00", decision: { final: true, value: "ยกเลิก", reason: "ผู้แจ้งขอยกเลิกรายการ", note: "ยุติการพิจารณาตามคำขอ" } },
    "อยู่ระหว่างดำเนินการ": { decisionStatus: "อยู่ระหว่างดำเนินการ", approvedAmount: null, transferStatus: "รอผลพิจารณา", decision: { final: false, value: "", reason: "", note: "อยู่ระหว่างตรวจสอบรายละเอียดค่าใช้จ่าย" } },
    "อนุมัติ": { decisionStatus: "อนุมัติ", transferStatus: "โอนสำเร็จ", decisionDate: "11/09/2569 16:30:00", decision: { final: true, value: "อนุมัติ", reason: "เป็นไปตามสิทธิ์ความคุ้มครอง", note: "อนุมัติและโอนค่ารักษารอบก่อนหน้าแล้ว" } }
  };

  const contextRecords = [
    { appId: "HAT-AT6909120034", claimNo: "CL6900012345", caseNo: "CC690001", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "IPD", treatmentType: "IPD", itemStatus: "อนุมัติ", name: "นายกิตติพงศ์ วัฒนชัย", plan: "PH Plus 1,000,000", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", claimedAmount: 8450, approvedAmount: 8450 },
    { appId: "HAT-AT6909120033", claimNo: "CLPA6900011022", caseNo: "CC690002", product: "PA", claimCategory: "เคลมโรงพยาบาล", claimType: "IPD", treatmentType: "IPD", itemStatus: "อนุมัติ", name: "เด็กชายณัฐกรณ์ ศรีสวัสดิ์", plan: "PA Student 500,000", hospital: "โรงพยาบาลเชียงรายประชานุเคราะห์", claimedAmount: 12600, approvedAmount: 12600 },
    { appId: "HAT-AT6909110021", claimNo: "CL6900012315", caseNo: "CC690003", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "OPD Full", treatmentType: "OPD", itemStatus: "อนุมัติ", name: "นางสาวพิมพ์ชนก ตั้งมั่น", plan: "PH Smart OPD 50,000", hospital: "โรงพยาบาลเกษมราษฎร์ ประชาชื่น", claimedAmount: 1850, approvedAmount: 1850 },
    { appId: "HAT-AT6909110018", claimNo: "CL6900017844", caseNo: "CC690004", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "Day Case Surgery", treatmentType: "Day Case Surgery", itemStatus: "อนุมัติ", name: "นายภูริณัฐ แสงทอง", plan: "PH Surgery Day Care", hospital: "โรงพยาบาลสินแพทย์ รามอินทรา", claimedAmount: 9400, approvedAmount: 9400 },
    { appId: "HAT-AT6909100094", claimNo: "CLPA6900010988", caseNo: "CC690005", product: "PA", claimCategory: "เคลมโรงพยาบาล", claimType: "OPD Full", treatmentType: "OPD", itemStatus: "อนุมัติ", name: "เด็กหญิงกมลพร จันทร์สิงห์", plan: "PA Student 300,000", hospital: "โรงพยาบาลศิริราช ปิยมหาราชการุณย์", claimedAmount: 3200, approvedAmount: 3200 },
    { appId: "HAT-AT6909090088", claimNo: "CL6900017650", caseNo: "CC690006", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "OPD Half", treatmentType: "OPD", itemStatus: "อนุมัติ", name: "นางสาวชนากานต์ แก้วกาญจน์", plan: "PH Care 300,000", hospital: "โรงพยาบาลกรุงเทพคริสเตียน", claimedAmount: 2750, approvedAmount: 2750 },
    { appId: "HAT-AT6909080075", claimNo: "CL6900017591", caseNo: "CC690007", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "IPD", treatmentType: "IPD", itemStatus: "อนุมัติ", name: "นายธีรภัทร พัฒนกิจ", plan: "PH Premier 2,000,000", hospital: "โรงพยาบาลบำรุงราษฎร์ อินเตอร์เนชั่นแนล", claimedAmount: 38200, approvedAmount: 38200 },
    { appId: "HAT-AT6909050062", claimNo: "CLPA6900010452", caseNo: "CC690008", product: "PA", claimCategory: "เคลมโรงพยาบาล", claimType: "IPD", treatmentType: "IPD", itemStatus: "อนุมัติ", name: "เด็กชายปิติภูมิ แสนวงศ์", plan: "PA Student 500,000", hospital: "โรงพยาบาลมหาราชนครเชียงใหม่", claimedAmount: 11800, approvedAmount: 11800 },
    { appId: "HAT-AT6909020047", claimNo: "CL6900017018", caseNo: "CC690009", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "OPD Full", treatmentType: "OPD", itemStatus: "อนุมัติ", name: "นางสาวอริสรา ตั้งใจ", plan: "PH Smart OPD 100,000", hospital: "โรงพยาบาลสมิติเวช สุขุมวิท", claimedAmount: 4900, approvedAmount: 4900 },
    { appId: "HAT-AT6908310039", claimNo: "CL6900016889", caseNo: "CC690010", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "Day Case Surgery", treatmentType: "Day Case Surgery", itemStatus: "อนุมัติ", name: "นายณัฐพงษ์ รุ่งเรือง", plan: "PH Surgery Plus", hospital: "โรงพยาบาลพระรามเก้า", claimedAmount: 8700, approvedAmount: 8700 },
    { appId: "HAT-AT6908260026", claimNo: "CLPA6900009981", caseNo: "CC690011", product: "PA", claimCategory: "เคลมโรงพยาบาล", claimType: "OPD Full", treatmentType: "OPD", itemStatus: "อนุมัติ", name: "เด็กหญิงวรัญญา นาคแก้ว", plan: "PA Student 300,000", hospital: "โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย", claimedAmount: 2640, approvedAmount: 2640 },
    { appId: "HAT-AT6908200014", claimNo: "CL6900016204", caseNo: "CC690012", product: "PH", claimCategory: "เคลมโรงพยาบาล", claimType: "IPD", treatmentType: "IPD", itemStatus: "อนุมัติ", name: "นายพชรพล วิเศษชัย", plan: "PH Premier 1,000,000", hospital: "โรงพยาบาลกรุงเทพ สำนักงานใหญ่ ซอยศูนย์วิจัย", claimedAmount: 24600, approvedAmount: 24600 }
  ];

  window.claimDetailMockCatalog = Object.freeze({ base, productOverrides, categoryOverrides, treatmentOverrides, statusOverrides, contextRecords: Object.freeze(contextRecords) });
})();
