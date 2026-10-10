/* งานเคลม > ค้นหาเคลม: isolated mock data derived from the approved v14 reference. */
(function () {
  "use strict";

  const schools = {
    demonstration: {
      appId: "APP-SCH-6900142", address: "99/12 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400",
      contact: "นางสาวกัญญาภัค ศรีประเสริฐ", position: "เจ้าหน้าที่งานประกันนักเรียน",
      contactId: "1-1011-00000-01-1", phone: "02-278-4615 ต่อ 204",
      bank: "ธนาคารกรุงไทย", account: "006-0-00001-0", accountName: "โรงเรียนสาธิตวิทยา"
    },
    kindergarten: {
      appId: "APP-SCH-6900208", address: "28/5 ถนนประชาราษฎร์ ตำบลสวนใหญ่ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000",
      contact: "นางสาวมณีรัตน์ ใจดี", position: "หัวหน้างานธุรการและประกันอุบัติเหตุ",
      contactId: "1-1204-00000-02-2", phone: "02-968-3147 ต่อ 103",
      bank: "ธนาคารออมสิน", account: "020-0-00002-0", accountName: "โรงเรียนอนุบาลเมือง"
    },
    newTown: {
      appId: "APP-SCH-6900316", address: "145 ถนนช้างคลาน ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50100",
      contact: "นายสิรวิชญ์ พงษ์พิพัฒน์", position: "ครูผู้ประสานงานสวัสดิการนักเรียน",
      contactId: "1-5001-00000-03-3", phone: "053-275-842 ต่อ 112",
      bank: "ธนาคารกรุงไทย", account: "511-0-00003-0", accountName: "โรงเรียนเมืองใหม่"
    }
  };

  const data = {
    people: [
      {
        id: "P001", prefix: "นาย", first: "กิตติพงศ์", last: "วัฒนชัย",
        nationalId: "1103700123456", passport: "GTH-889900", phone: "081-233-4444", birthDate: "19/10/2535",
        policies: [
          { appId: "APP6210007812", policy: "PH6210007812", card: "HC-6210007812", plan: "PH Plus 5", product: "PH", benefitLimit: 100000, status: "อนุมัติกรมธรรม์", start: "01/01/2568", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 4 },
          { appId: "APP6901018891", policy: "PA6901018891", card: "STD-6901018891", plan: "PA School Plus", product: "PA", benefitLimit: 30000, status: "อนุมัติกรมธรรม์", start: "15/05/2569", effectiveDate: "15/05/2569", end: "14/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนสาธิตวิทยา", schoolData: schools.demonstration, insuredType: "บุคลากรสถานศึกษา", academicYear: 2569, claims: 2 },
          { appId: "APP6900011223", policy: "PA6900011223", card: "STD-6900098765", plan: "PA Student Max", product: "PA", benefitLimit: 30000, status: "อนุมัติกรมธรรม์", start: "01/06/2569", effectiveDate: "01/06/2569", end: "31/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนอนุบาลเมือง", schoolData: schools.kindergarten, insuredType: "บุคลากรสถานศึกษา", academicYear: 2569, claims: 1 }
        ]
      },
      {
        id: "P002", prefix: "นาย", first: "ธนกฤต", last: "ศรีสุวรรณ",
        nationalId: "1101700001234", passport: "PP-SC1234", phone: "089-741-2236", birthDate: "04/03/2530",
        policies: [
          { appId: "APP6900022001", policy: "PH6900022001", card: "HC-6900022001", plan: "PH Standard", product: "PH", benefitLimit: 100000, status: "อนุมัติกรมธรรม์", start: "01/02/2569", end: "31/01/2570", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 3 }
        ]
      },
      {
        id: "P003", prefix: "นาย", first: "ธนกฤต", last: "ศรีสุวรรณ",
        nationalId: "1101700005678", passport: "PP-SC5678", phone: "092-115-4789", birthDate: "22/08/2537",
        policies: [
          { appId: "APP6900033001", policy: "PA6900033001", card: "STD-6900033001", plan: "PA Student Care", product: "PA", benefitLimit: 30000, status: "อนุมัติกรมธรรม์", start: "10/05/2569", effectiveDate: "10/05/2569", end: "09/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนเมืองใหม่", schoolData: schools.newTown, insuredType: "บุคลากรสถานศึกษา", academicYear: 2569, claims: 2 },
          { appId: "APP6900033002", policy: "PH6900033002", card: "HC-6900033002", plan: "PH Smart", product: "PH", benefitLimit: 50000, status: "ยกเลิก", start: "01/01/2569", end: "31/08/2569", cancel: "31/08/2569", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 1 }
        ]
      },
      {
        id: "P004", prefix: "นางสาว", first: "ศิริพร", last: "กาญจนกิจ",
        nationalId: "1101700456789", passport: "PP-HOSP6789", phone: "086-241-6688", birthDate: "12/12/2529",
        policies: [
          { appId: "APP6900044001", policy: "PH6900044001", card: "HC-6900044001", plan: "PH Hospital Plus", product: "PH", benefitLimit: 100000, status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 3 }
        ]
      },
      {
        id: "P005", prefix: "นาย", first: "วรเมธ", last: "โชติกุล",
        nationalId: "1101700789012", passport: "PP-DD9012", phone: "081-551-7890", birthDate: "05/01/2527",
        policies: [
          { appId: "APP6900055001", policy: "PH6900055001", card: "HC-6900055001", plan: "PH Life & Disability", product: "PH", benefitLimit: 300000, status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 2 }
        ]
      },
      {
        id: "P006", prefix: "นาย", first: "ธนภัทร", last: "สกุลไทย",
        nationalId: "1101700345678", passport: "PP-DD5678", phone: "082-457-3355", birthDate: "20/06/2526",
        policies: [
          { appId: "APP6900066001", policy: "PH6900066001", card: "HC-6900066001", plan: "PH Life & Disability", product: "PH", benefitLimit: 500000, status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 1 }
        ]
      },
      {
        id: "P007", prefix: "นางสาว", first: "วิภาวดี", last: "ทองนาค",
        nationalId: "1101700567890", passport: "PP-DD7890", phone: "087-663-2040", birthDate: "02/04/2532",
        policies: [
          { appId: "APP6900077001", policy: "PH6900077001", card: "HC-6900077001", plan: "PH Life & Disability", product: "PH", benefitLimit: 500000, status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 1 }
        ]
      },
      {
        id: "P008", prefix: "นางสาว", first: "อรทัย", last: "ธนวัฒน์",
        nationalId: "1101700884215", passport: "PP-DD4215", phone: "089-428-6731", birthDate: "15/09/2531",
        policies: [
          { appId: "APP6900088001", policy: "PH6900088001", card: "HC-6900088001", plan: "PH Life & Disability", product: "PH", benefitLimit: 200000, status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 1 }
        ]
      }
    ],
    quickExamples: [
      { type: "CL", query: "CL6900001234", label: "CL" },
      { type: "CASE", query: "CASE6900005678", label: "Case" },
      { type: "NATIONAL_ID", query: "1103700123456", label: "บัตรประชาชน" },
      { type: "PASSPORT", query: "GTH-889900", label: "Passport/GCode" },
      { type: "APP_ID", query: "APP6900011223", label: "AppID" },
      { type: "STUDENT_CARD", query: "STD-6900098765", label: "บัตรนักเรียน" },
      { type: "NAME", query: "ธนกฤต ศรีสุวรรณ", label: "ชื่อซ้ำ" },
      { type: "SCHOOL", query: "โรงเรียนสาธิตวิทยา", academicYear: "2569", label: "สถานศึกษา" },
      { type: "CL", query: "CL6900002201", label: "CL อนุมัติ" },
      { type: "CL", query: "CL6900002202", label: "CL รอเอกสาร" },
      { type: "CL", query: "CL6900002204", label: "CL ปฏิเสธ" },
      { type: "CL", query: "CL6900008805", label: "CL สูญเสียอวัยวะ" },
      { type: "NAME", query: "กิตติพงศ์ วัฒนชัย", label: "ชื่อ 3 กรมธรรม์" },
      { type: "SCHOOL", query: "โรงเรียนเมืองใหม่", academicYear: "2569", label: "สถานศึกษาอีกแห่ง" }
    ],
    claims: [
      { cl: "CL6900001234", caseNo: "CASE6900005678", personId: "P001", policy: "PA6901018891", product: "PA", care: "OPD", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", status: "รอพิจารณา", createDate: "17/06/2569 13:15:38", incidentDate: "17/06/2569", complaint: "ปวดศีรษะ", claimed: "300.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900001235", caseNo: "CASE6900005679", personId: "P001", policy: "PA6901018891", product: "PA", care: "OPD", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", status: "อยู่ระหว่างดำเนินการ", lifecycleStatus: "Re-Open", createDate: "10/06/2569 14:29:43", incidentDate: "10/06/2569", complaint: "หกล้ม ลื่น สะดุด", claimed: "700.00", paid: "0.00", opdCount: "2" },
      { cl: "CL6900002201", caseNo: "CASE6900006201", personId: "P001", policy: "PH6210007812", product: "PH", care: "IPD", hospital: "โรงพยาบาลพญาไท 2", status: "อนุมัติ", createDate: "01/02/2569 14:42:24", incidentDate: "01/02/2569", complaint: "ไข้และปวดท้อง", claimed: "18,450.00", paid: "17,800.00", opdCount: "-" },
      { cl: "CL6900002202", caseNo: "CASE6900006202", personId: "P001", policy: "PH6210007812", product: "PH", care: "OPD", hospital: "โรงพยาบาลพญาไท 2", status: "รอเอกสาร", createDate: "20/12/2568 15:47:27", incidentDate: "20/12/2568", complaint: "ปวดขา", claimed: "2,140.90", paid: "0.00", opdCount: "1", isPhysicalTherapy: true, medicalNecessity: "RESTORING_MOBILITY" },
      { cl: "CL6900002203", caseNo: "CASE6900006203", personId: "P001", policy: "PH6210007812", product: "PH", care: "Day Case Surgery", hospital: "โรงพยาบาลพญาไท 2", status: "อนุมัติ", createDate: "08/11/2568 10:12:16", incidentDate: "08/11/2568", complaint: "ผ่าตัดเล็กแบบ Day Case", claimed: "12,800.00", paid: "12,500.00", opdCount: "-" },
      { cl: "CL6900002204", caseNo: "CASE6900006204", personId: "P001", policy: "PH6210007812", product: "PH", care: "OPD", hospital: "โรงพยาบาลพญาไท 2", status: "ปฏิเสธ", createDate: "02/10/2568 09:20:11", incidentDate: "02/10/2568", complaint: "ติดตามอาการ", claimed: "1,250.00", paid: "0.00", opdCount: "2" },
      { cl: "CL6900003301", caseNo: "CASE6900007301", personId: "P001", policy: "PA6900011223", product: "PA", care: "OPD", hospital: "โรงพยาบาลเกษมราษฎร์", status: "อนุมัติ", createDate: "12/07/2569 11:05:42", incidentDate: "12/07/2569", complaint: "บาดเจ็บจากกีฬา", claimed: "550.00", paid: "550.00", opdCount: "1" },
      { cl: "CL6900004401", caseNo: "CASE6900008401", personId: "P002", policy: "PH6900022001", product: "PH", care: "OPD", hospital: "โรงพยาบาลบางปะกอก 9", status: "รอพิจารณา", createDate: "14/07/2569 08:45:10", incidentDate: "13/07/2569", complaint: "มีไข้ ไอ และเจ็บคอ", claimed: "1,050.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900004402", caseNo: "CASE6900008402", personId: "P002", policy: "PH6900022001", product: "PH", care: "IPD", hospital: "โรงพยาบาลบางปะกอก 9", status: "อนุมัติ", createDate: "02/06/2569 13:20:14", incidentDate: "01/06/2569", complaint: "ไข้สูงและหายใจเหนื่อย", claimed: "22,800.00", paid: "21,500.00", opdCount: "-" },
      { cl: "CL6900004403", caseNo: "CASE6900008403", personId: "P002", policy: "PH6900022001", product: "PH", care: "Day Case Surgery", hospital: "โรงพยาบาลบางปะกอก 9", status: "รอเอกสาร", createDate: "18/04/2569 09:35:22", incidentDate: "18/04/2569", complaint: "ผ่าตัดก้อนเนื้อขนาดเล็ก", claimed: "14,600.00", paid: "0.00", opdCount: "-" },
      { cl: "CL6900005501", caseNo: "CASE6900009501", personId: "P003", policy: "PA6900033001", product: "PA", care: "OPD", hospital: "โรงพยาบาลนครธน", status: "อยู่ระหว่างดำเนินการ", createDate: "15/07/2569 10:18:32", incidentDate: "14/07/2569", complaint: "ข้อเท้าพลิกจากกีฬา", claimed: "900.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900005502", caseNo: "CASE6900009502", personId: "P003", policy: "PA6900033001", product: "PA", care: "IPD", hospital: "โรงพยาบาลนครธน", status: "อนุมัติ", createDate: "21/06/2569 16:08:45", incidentDate: "20/06/2569", complaint: "แขนซ้ายหักจากอุบัติเหตุจราจร", claimed: "28,400.00", paid: "27,900.00", opdCount: "-", trafficAccident: { isTrafficAccident: true, vehicleType: "motorcycle", casualtyStatus: "passenger", poroboExcess: "yes" } },
      { cl: "CL6900006601", caseNo: "CASE6900010601", personId: "P003", policy: "PH6900033002", product: "PH", care: "OPD", hospital: "โรงพยาบาลนครธน", status: "ปฏิเสธ", createDate: "20/08/2569 11:42:10", incidentDate: "19/08/2569", complaint: "ปวดศีรษะและมีไข้", claimed: "1,400.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900007701", caseNo: "CASE6900011701", personId: "P004", policy: "PH6900044001", product: "PH", category: "เคลมโรงพยาบาล", care: "IPD", hospital: "โรงพยาบาลพญาไท 2", status: "อนุมัติ", createDate: "06/08/2569 09:20:00", incidentDate: "04/08/2569", complaint: "ปอดอักเสบ เข้ารับการรักษาแบบผู้ป่วยใน", claimed: "35,600.00", paid: "34,200.00", opdCount: "-" },
      { cl: "CL6900007702", caseNo: "CASE6900011702", personId: "P004", policy: "PH6900044001", product: "PH", category: "เคลมโรงพยาบาล", care: "OPD", hospital: "โรงพยาบาลพญาไท 2", status: "รอเอกสาร", createDate: "14/09/2569 10:15:00", incidentDate: "14/09/2569", complaint: "เวียนศีรษะและอ่อนเพลีย", claimed: "2,850.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900007703", caseNo: "CASE6900011703", personId: "P004", policy: "PH6900044001", product: "PH", category: "เคลมโรงพยาบาล", care: "Day Case Surgery", hospital: "โรงพยาบาลพญาไท 2", status: "ปฏิเสธ", createDate: "22/09/2569 11:00:00", incidentDate: "21/09/2569", complaint: "ผ่าตัดหัตถการแบบ Day Case", claimed: "18,900.00", paid: "0.00", opdCount: "-", isPhysicalTherapy: true, medicalNecessity: "POST_INJURY_POST_SURGICAL_REHAB" },
      { cl: "CL6900008801", caseNo: "CASE6900012801", personId: "P006", policy: "PH6900066001", product: "PH", category: "Death&Disability", care: "เสียชีวิต", hospital: "-", beneficiary: "นางสาวมณีรัตน์ สกุลไทย", status: "อนุมัติ", createDate: "03/07/2569 09:45:00", incidentDate: "01/07/2569", complaint: "เสียชีวิตจากอุบัติเหตุทางถนน", claimed: "500,000.00", paid: "500,000.00", opdCount: "-" },
      { cl: "CL6900008802", caseNo: "CASE6900012802", personId: "P005", policy: "PH6900055001", product: "PH", category: "Death&Disability", care: "ทุพพลภาพถาวร", hospital: "-", beneficiary: "นายวรเมธ โชติกุล", status: "รอพิจารณา", createDate: "12/08/2569 10:20:00", incidentDate: "10/08/2569", complaint: "ทุพพลภาพถาวรจากอุบัติเหตุ", claimed: "300,000.00", paid: "0.00", opdCount: "-" },
      { cl: "CL6900008803", caseNo: "CASE6900012803", personId: "P007", policy: "PH6900077001", product: "PH", category: "Death&Disability", care: "เสียชีวิต", hospital: "-", beneficiary: "นายภาคิน ทองนาค", status: "ปฏิเสธ", createDate: "18/06/2569 13:30:00", incidentDate: "16/06/2569", complaint: "คำขอสินไหมกรณีเสียชีวิตที่ไม่เข้าเงื่อนไข", claimed: "500,000.00", paid: "0.00", opdCount: "-" },
      { cl: "CL6900008804", caseNo: "CASE6900012804", personId: "P005", policy: "PH6900055001", product: "PH", category: "Death&Disability", care: "ทุพพลภาพถาวร", hospital: "-", beneficiary: "นายวรเมธ โชติกุล", status: "อนุมัติ", createDate: "28/09/2569 09:00:00", incidentDate: "26/09/2569", complaint: "ทุพพลภาพถาวรสิ้นเชิงจากอุบัติเหตุ", claimed: "300,000.00", paid: "300,000.00", opdCount: "-" },
      { cl: "CL6900008805", caseNo: "CASE6900012805", personId: "P008", policy: "PH6900088001", product: "PH", category: "Death&Disability", care: "สูญเสียอวัยวะ", hospital: "โรงพยาบาลพระรามเก้า", beneficiary: "นางสาวอรทัย ธนวัฒน์", status: "อนุมัติ", createDate: "08/09/2569 10:15:00", incidentDate: "07/09/2569", complaint: "สูญเสียมือซ้ายระดับข้อมือจากอุบัติเหตุจราจร", claimed: "120,000.00", paid: "120,000.00", opdCount: "-", organLoss: { organ: "มือ", side: "ซ้าย", level: "สูญเสียมือซ้ายตั้งแต่ข้อมือ", permanence: "ถาวร", medicalFinding: "แพทย์รับรองการสูญเสียมือซ้ายระดับข้อมือจากอุบัติเหตุ", certifyingHospital: "โรงพยาบาลพระรามเก้า", assessmentDate: "10/09/2569 11:20:00", assessor: "นพ.ปกรณ์ วัฒนกิจ", maximumBenefit: "200,000.00", benefitPercent: 60, approvedAmount: "120,000.00", priorOrganLossClaim: "ไม่มี" } }
    ]
  };

  // Record-owned clinical examples for the read-only claim detail page. Keep
  // these tied to Claim No. so a value from one claim never appears in another.
  data.claimDetails = {
    CL6900001234: { cause: "อุบัติเหตุ", coverage: "ค่ารักษา", diagnosis1: "R51.9 : Headache, unspecified", medicalNote: "ตรวจอาการปวดศีรษะหลังเกิดเหตุและให้ยาตามอาการ", incidentTime: "11:20", admitTime: "12:20", dischargeTime: "13:00" },
    CL6900001235: { cause: "อุบัติเหตุ", coverage: "ค่ารักษา", diagnosis1: "S80.0 : Contusion of knee", medicalNote: "ตรวจรอยฟกช้ำบริเวณเข่าและนัดติดตามอาการ", incidentTime: "09:15" },
    CL6900002201: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "A09 : Infectious gastroenteritis and colitis, unspecified", diagnosis2: "E86 : Volume depletion", medicalNote: "รับไว้รักษาเพื่อให้สารน้ำและติดตามภาวะขาดน้ำ", incidentTime: "07:30", admitTime: "10:05", ipdDays: 2, icuDays: 0, totalDays: 2 },
    CL6900002202: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "M79.6 : Pain in limb", medicalNote: "ประเมินอาการปวดขาและความจำเป็นในการกายภาพบำบัด", incidentTime: "10:40", admitTime: "11:10", optionalNote: "รอใบรับรองแพทย์ประกอบการพิจารณา" },
    CL6900002203: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "L72.0 : Epidermal cyst", medicalNote: "ผ่าตัดก้อนผิวหนังขนาดเล็กและสังเกตอาการก่อนกลับบ้าน", incidentTime: "07:50", admitTime: "09:00", dischargeTime: "16:30" },
    CL6900002204: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "Z09.9 : Follow-up examination after treatment", medicalNote: "ตรวจติดตามอาการหลังการรักษาเดิม", incidentTime: "08:30", admitTime: "09:15", optionalNote: "ตรวจเงื่อนไขความคุ้มครองของรายการติดตามอาการ" },
    CL6900003301: { cause: "อุบัติเหตุ", coverage: "ค่ารักษา", diagnosis1: "S93.4 : Sprain of ankle", medicalNote: "ตรวจข้อเท้าและพันผ้ายืดหลังบาดเจ็บจากกีฬา", incidentTime: "09:40", admitTime: "10:30" },
    CL6900004401: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "J06.9 : Acute upper respiratory infection, unspecified", medicalNote: "ตรวจอาการไข้ ไอ และเจ็บคอ ให้ยาตามอาการ", incidentTime: "20:30", admitTime: "08:30" },
    CL6900004402: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "J18.9 : Pneumonia, unspecified", diagnosis2: "R06.0 : Dyspnoea", medicalNote: "รับไว้รักษาและติดตามการหายใจ", incidentTime: "18:20", admitTime: "20:10", ipdDays: 2, icuDays: 0, totalDays: 2 },
    CL6900004403: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "D17.9 : Benign lipomatous neoplasm, unspecified", medicalNote: "เตรียมผ่าตัดก้อนเนื้อขนาดเล็กแบบ Day Case", incidentTime: "07:15", admitTime: "08:00", dischargeTime: "17:00", optionalNote: "รอเอกสารประกอบการผ่าตัด" },
    CL6900005501: { cause: "อุบัติเหตุ", coverage: "ค่ารักษา", diagnosis1: "S93.4 : Sprain of ankle", medicalNote: "ตรวจข้อเท้าพลิกจากกีฬาและให้คำแนะนำการพักใช้งาน", incidentTime: "16:35", admitTime: "09:30" },
    CL6900005502: { cause: "อุบัติเหตุ", coverage: "ค่ารักษา", diagnosis1: "S52.5 : Fracture of lower end of radius", medicalNote: "รับไว้รักษากระดูกแขนซ้ายหักจากอุบัติเหตุจราจร", incidentTime: "19:10", admitDate: "20/06/2569", admitTime: "20:00", ipdDays: 2, icuDays: 0, totalDays: 2 },
    CL6900006601: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "R51.9 : Headache, unspecified", diagnosis2: "R50.9 : Fever, unspecified", medicalNote: "ตรวจอาการปวดศีรษะและไข้", incidentTime: "15:10", admitTime: "16:00", optionalNote: "ผลพิจารณาตัวอย่างระบุไม่เข้าเงื่อนไขความคุ้มครองของรายการนี้" },
    CL6900007701: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "J18.9 : Pneumonia, unspecified", medicalNote: "รับไว้รักษาโรคปอดอักเสบและติดตามผลการตอบสนองต่อยา", incidentTime: "18:45", admitDate: "04/08/2569", admitTime: "20:00", ipdDays: 2, icuDays: 0, totalDays: 2 },
    CL6900007702: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "R42 : Dizziness and giddiness", medicalNote: "ตรวจอาการเวียนศีรษะและอ่อนเพลีย", incidentTime: "08:25", admitTime: "09:10", optionalNote: "รอใบรับรองแพทย์ฉบับสมบูรณ์" },
    CL6900007703: { cause: "เจ็บป่วย", coverage: "ค่ารักษา", diagnosis1: "L72.0 : Epidermal cyst", medicalNote: "ประเมินข้อบ่งชี้ของหัตถการและการฟื้นฟูหลังผ่าตัด", incidentTime: "07:20", admitTime: "08:20", dischargeTime: "16:10", optionalNote: "ผลพิจารณาตัวอย่างไม่อนุมัติรายการนี้" },
    CL6900008801: { cause: "อุบัติเหตุ", coverage: "เสียชีวิต", deathCause: "อุบัติเหตุทางถนน", deathDate: "01/07/2569", diagnosis1: "T07 : Unspecified multiple injuries", optionalNote: "ตรวจสิทธิ์ผู้รับผลประโยชน์ตามกรมธรรม์" },
    CL6900008802: { cause: "อุบัติเหตุ", coverage: "ทุพพลภาพถาวร", disabilityCause: "อุบัติเหตุ", diagnosis1: "S14.1 : Other and unspecified injuries of cervical spinal cord", optionalNote: "รอผลประเมินความทุพพลภาพถาวร" },
    CL6900008803: { cause: "เจ็บป่วย", coverage: "เสียชีวิต", deathCause: "โรคภัยไข้เจ็บ", deathDate: "16/06/2569", diagnosis1: "I46.9 : Cardiac arrest, unspecified", optionalNote: "ตรวจเงื่อนไขผลประโยชน์กรณีเสียชีวิต" },
    CL6900008804: { cause: "อุบัติเหตุ", coverage: "ทุพพลภาพถาวร", disabilityCause: "อุบัติเหตุ", diagnosis1: "S14.1 : Other and unspecified injuries of cervical spinal cord", optionalNote: "ผลประเมินตัวอย่างระบุทุพพลภาพถาวรสิ้นเชิง" },
    CL6900008805: { cause: "อุบัติเหตุ", coverage: "สูญเสียอวัยวะ", disabilityCause: "อุบัติเหตุจราจร", diagnosis1: "S68.4 : Traumatic amputation of hand at wrist level", optionalNote: "พิจารณาตามอัตราผลประโยชน์ 60% ของวงเงินสูญเสียอวัยวะ" }
  };

  window.claimWorkSearchMock = Object.freeze(data);
})();
