/* งานเคลม > ค้นหาเคลม: isolated mock data derived from the approved v14 reference. */
(function () {
  "use strict";

  const data = {
    people: [
      {
        id: "P001", prefix: "นาย", first: "กิตติพงศ์", last: "วัฒนชัย",
        nationalId: "1103700123456", passport: "GTH-889900", phone: "081-233-4444",
        policies: [
          { appId: "APP6210007812", policy: "PH6210007812", card: "HC-6210007812", plan: "PH Plus 5", product: "PH", status: "อนุมัติกรมธรรม์", start: "01/01/2569", end: "31/12/2569", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 4 },
          { appId: "APP6901018891", policy: "PA6901018891", card: "STD-6901018891", plan: "PA School Plus", product: "PA", status: "อนุมัติกรมธรรม์", start: "15/05/2569", end: "14/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนสาธิตวิทยา", academicYear: 2569, claims: 2 },
          { appId: "APP6900011223", policy: "PA6900011223", card: "STD-6900098765", plan: "PA Student Max", product: "PA", status: "อนุมัติกรมธรรม์", start: "01/06/2569", end: "31/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนอนุบาลเมือง", academicYear: 2569, claims: 1 }
        ]
      },
      {
        id: "P002", prefix: "นาย", first: "ธนกฤต", last: "ศรีสุวรรณ",
        nationalId: "1101700001234", passport: "PP-SC1234", phone: "089-741-2236",
        policies: [
          { appId: "APP6900022001", policy: "PH6900022001", card: "HC-6900022001", plan: "PH Standard", product: "PH", status: "อนุมัติกรมธรรม์", start: "01/02/2569", end: "31/01/2570", cancel: "-", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 3 }
        ]
      },
      {
        id: "P003", prefix: "นาย", first: "ธนกฤต", last: "ศรีสุวรรณ",
        nationalId: "1101700005678", passport: "PP-SC5678", phone: "092-115-4789",
        policies: [
          { appId: "APP6900033001", policy: "PA6900033001", card: "STD-6900033001", plan: "PA Student Care", product: "PA", status: "อนุมัติกรมธรรม์", start: "10/05/2569", end: "09/05/2570", cancel: "-", insurer: "บริษัท สไมล์ อินชัวรันส์ จำกัด", school: "โรงเรียนเมืองใหม่", academicYear: 2569, claims: 2 },
          { appId: "APP6900033002", policy: "PH6900033002", card: "HC-6900033002", plan: "PH Smart", product: "PH", status: "ยกเลิก", start: "01/01/2569", end: "31/08/2569", cancel: "31/08/2569", insurer: "บริษัท เอ บี ซี ประกันภัย จำกัด (มหาชน)", school: "-", academicYear: null, claims: 1 }
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
      { type: "NAME", query: "กิตติพงศ์ วัฒนชัย", label: "ชื่อ 3 กรมธรรม์" },
      { type: "SCHOOL", query: "โรงเรียนเมืองใหม่", academicYear: "2569", label: "สถานศึกษาอีกแห่ง" }
    ],
    claims: [
      { cl: "CL6900001234", caseNo: "CASE6900005678", personId: "P001", policy: "PA6901018891", product: "PA", care: "OPD", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", status: "รอพิจารณา", createDate: "17/06/2569 13:15:38", incidentDate: "17/06/2569", complaint: "ปวดศีรษะ", claimed: "300.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900001235", caseNo: "CASE6900005679", personId: "P001", policy: "PA6901018891", product: "PA", care: "OPD", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", status: "อยู่ระหว่างดำเนินการ", createDate: "10/03/2569 14:29:43", incidentDate: "10/03/2569", complaint: "หกล้ม ลื่น สะดุด", claimed: "700.00", paid: "0.00", opdCount: "2" },
      { cl: "CL6900002201", caseNo: "CASE6900006201", personId: "P001", policy: "PH6210007812", product: "PH", care: "IPD", hospital: "โรงพยาบาลพญาไท 2", status: "อนุมัติ", createDate: "01/02/2569 14:42:24", incidentDate: "01/02/2569", complaint: "ไข้และปวดท้อง", claimed: "18,450.00", paid: "17,800.00", opdCount: "-" },
      { cl: "CL6900002202", caseNo: "CASE6900006202", personId: "P001", policy: "PH6210007812", product: "PH", care: "OPD", hospital: "โรงพยาบาลพญาไท 2", status: "รอเอกสาร", createDate: "20/12/2568 15:47:27", incidentDate: "20/12/2568", complaint: "ปวดขา", claimed: "2,140.90", paid: "0.00", opdCount: "1" },
      { cl: "CL6900002203", caseNo: "CASE6900006203", personId: "P001", policy: "PH6210007812", product: "PH", care: "Day Case Surgery", hospital: "โรงพยาบาลพญาไท 2", status: "อนุมัติ", createDate: "08/11/2568 10:12:16", incidentDate: "08/11/2568", complaint: "ผ่าตัดเล็กแบบ Day Case", claimed: "12,800.00", paid: "12,500.00", opdCount: "-" },
      { cl: "CL6900002204", caseNo: "CASE6900006204", personId: "P001", policy: "PH6210007812", product: "PH", care: "OPD", hospital: "โรงพยาบาลพญาไท 2", status: "ปฏิเสธ", createDate: "02/10/2568 09:20:11", incidentDate: "02/10/2568", complaint: "ติดตามอาการ", claimed: "1,250.00", paid: "0.00", opdCount: "2" },
      { cl: "CL6900003301", caseNo: "CASE6900007301", personId: "P001", policy: "PA6900011223", product: "PA", care: "OPD", hospital: "โรงพยาบาลเกษมราษฎร์", status: "อนุมัติ", createDate: "12/07/2569 11:05:42", incidentDate: "12/07/2569", complaint: "บาดเจ็บจากกีฬา", claimed: "550.00", paid: "550.00", opdCount: "1" },
      { cl: "CL6900004401", caseNo: "CASE6900008401", personId: "P002", policy: "PH6900022001", product: "PH", care: "OPD", hospital: "โรงพยาบาลบางปะกอก 9", status: "รอพิจารณา", createDate: "14/07/2569 08:45:10", incidentDate: "13/07/2569", complaint: "มีไข้ ไอ และเจ็บคอ", claimed: "1,050.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900004402", caseNo: "CASE6900008402", personId: "P002", policy: "PH6900022001", product: "PH", care: "IPD", hospital: "โรงพยาบาลบางปะกอก 9", status: "อนุมัติ", createDate: "02/06/2569 13:20:14", incidentDate: "01/06/2569", complaint: "ไข้สูงและหายใจเหนื่อย", claimed: "22,800.00", paid: "21,500.00", opdCount: "-" },
      { cl: "CL6900004403", caseNo: "CASE6900008403", personId: "P002", policy: "PH6900022001", product: "PH", care: "Day Case Surgery", hospital: "โรงพยาบาลบางปะกอก 9", status: "รอเอกสาร", createDate: "18/04/2569 09:35:22", incidentDate: "18/04/2569", complaint: "ผ่าตัดก้อนเนื้อขนาดเล็ก", claimed: "14,600.00", paid: "0.00", opdCount: "-" },
      { cl: "CL6900005501", caseNo: "CASE6900009501", personId: "P003", policy: "PA6900033001", product: "PA", care: "OPD", hospital: "โรงพยาบาลนครธน", status: "อยู่ระหว่างดำเนินการ", createDate: "15/07/2569 10:18:32", incidentDate: "14/07/2569", complaint: "ข้อเท้าพลิกจากกีฬา", claimed: "900.00", paid: "0.00", opdCount: "1" },
      { cl: "CL6900005502", caseNo: "CASE6900009502", personId: "P003", policy: "PA6900033001", product: "PA", care: "IPD", hospital: "โรงพยาบาลนครธน", status: "อนุมัติ", createDate: "21/06/2569 16:08:45", incidentDate: "20/06/2569", complaint: "แขนซ้ายหักจากอุบัติเหตุ", claimed: "28,400.00", paid: "27,900.00", opdCount: "-" },
      { cl: "CL6900006601", caseNo: "CASE6900010601", personId: "P003", policy: "PH6900033002", product: "PH", care: "OPD", hospital: "โรงพยาบาลนครธน", status: "ปฏิเสธ", createDate: "20/08/2569 11:42:10", incidentDate: "19/08/2569", complaint: "ปวดศีรษะและมีไข้", claimed: "1,400.00", paid: "0.00", opdCount: "1" }
    ]
  };

  window.claimWorkSearchMock = Object.freeze(data);
})();
