/* Linked hospital consideration and billing status examples for the static demo. */
(function () {
  'use strict';

  const examples = [
    {
      claimCode: 'CL6910000501', caseNo: 'CC6910000501-01', billId: 'HB-STATUS-501',
      name: 'นายตัวอย่าง ปฏิเสธ', hospital: 'โรงพยาบาลพระรามเก้า',
      diagnosis: 'J06.9 : Acute upper respiratory infection | การติดเชื้อทางเดินหายใจส่วนบน',
      chiefComplaint: 'มีไข้ ไอ และเจ็บคอ', amount: '4,250.00',
      considerationStatus: 'ปฏิเสธ', billingStatus: 'ปฏิเสธ',
      note: 'ตัวอย่างรายการที่ปฏิเสธการพิจารณา',
      statusHistory: [
        {date:'15/10/2569 10:30', actor:'เจ้าหน้าที่ตัวอย่าง', action:'ปฏิเสธ', detail:'บันทึกผลปฏิเสธรายการเคลม', status:'ปฏิเสธ'}
      ]
    },
    {
      claimCode: 'CL6910000502', caseNo: 'CC6910000502-01', billId: 'HB-STATUS-502',
      name: 'นางสาวตัวอย่าง ยกเลิก', hospital: 'โรงพยาบาลกรุงเทพ',
      diagnosis: 'K29.7 : Gastritis, unspecified | กระเพาะอาหารอักเสบ',
      chiefComplaint: 'ปวดท้องและคลื่นไส้', amount: '6,800.00',
      considerationStatus: 'ยกเลิก', billingStatus: 'ยกเลิก',
      note: 'ตัวอย่างรายการที่ยกเลิก',
      statusHistory: [
        {date:'15/10/2569 11:20', actor:'เจ้าหน้าที่ตัวอย่าง', action:'ยกเลิก', detail:'บันทึกการยกเลิกรายการเคลม', status:'ยกเลิก'}
      ]
    },
    {
      claimCode: 'CL6910000503', caseNo: 'CC6910000503-01', billId: 'HB-STATUS-503',
      name: 'นายตัวอย่าง ส่งกลับ', hospital: 'โรงพยาบาลพญาไท 2',
      diagnosis: 'J18.9 : Pneumonia, unspecified | ปอดอักเสบ',
      chiefComplaint: 'มีไข้สูงและหายใจเหนื่อย', amount: '18,500.00',
      considerationStatus: 'รอพิจารณา', billingStatus: 'รอตรวจสอบ', previousDecision: 'ปฏิเสธ', previousClaimStatus: 'Close',
      note: 'สถานพยาบาลส่งผลตรวจเพิ่มเติมเพื่อขอพิจารณารายการเดิมอีกครั้ง',
      previousRejection: {
        at: '15/10/2569 13:40',
        actor: 'เจ้าหน้าที่พิจารณา DEMO-01',
        reason: 'เอกสารประกอบการวินิจฉัยไม่ครบถ้วน',
        detail: 'การพิจารณาครั้งก่อนยังไม่มีผลเอกซเรย์ปอดประกอบการวินิจฉัยปอดอักเสบ จึงบันทึกผลปฏิเสธไว้ก่อน'
      },
      statusHistory: [
        {date:'15/10/2569 13:40', actor:'เจ้าหน้าที่พิจารณา DEMO-01', action:'ปฏิเสธ', detail:'เอกสารประกอบการวินิจฉัยไม่ครบถ้วน: ยังไม่มีผลเอกซเรย์ปอด', status:'ปฏิเสธ'},
        {date:'16/10/2569 09:15', actor:'เจ้าหน้าที่รับเรื่อง DEMO-02', action:'ส่งกลับมาพิจารณาอีกครั้ง', detail:'ได้รับผลเอกซเรย์ปอดเพิ่มเติมและส่งรายการเดิมกลับเข้าคิว', status:'รอพิจารณา'}
      ]
    },
    {
      claimCode: 'CL6910000504', caseNo: 'CC6910000504-01', billId: 'HB-STATUS-504',
      name: 'นางสาวตัวอย่าง ส่งกลับหลังยกเลิก', hospital: 'โรงพยาบาลสมิติเวชสุขุมวิท',
      diagnosis: 'K35.8 : Acute appendicitis, other and unspecified | ไส้ติ่งอักเสบเฉียบพลัน',
      chiefComplaint: 'ปวดท้องด้านขวาล่าง', amount: '12,700.00',
      considerationStatus: 'รอพิจารณา', billingStatus: 'รอตรวจสอบ', previousDecision: 'ยกเลิก', previousClaimStatus: 'Open',
      note: 'สถานพยาบาลแก้ไขวันที่เข้ารักษาและส่งรายการเดิมกลับมาพิจารณาใหม่',
      previousCancellation: {
        at: '15/10/2569 14:10',
        actor: 'เจ้าหน้าที่พิจารณา DEMO-03',
        reason: 'วันที่เข้ารักษาในเอกสารไม่ตรงกัน',
        detail: 'วันที่เข้ารักษาในใบแจ้งหนี้ไม่ตรงกับข้อมูลรับบริการ จึงยกเลิกรายการเดิมเพื่อรอเอกสารที่แก้ไข'
      },
      statusHistory: [
        {date:'15/10/2569 14:10', actor:'เจ้าหน้าที่พิจารณา DEMO-03', action:'ยกเลิก', detail:'วันที่เข้ารักษาในใบแจ้งหนี้ไม่ตรงกับข้อมูลรับบริการ', status:'ยกเลิก'},
        {date:'16/10/2569 10:05', actor:'เจ้าหน้าที่รับเรื่อง DEMO-04', action:'ส่งกลับมาพิจารณาอีกครั้ง', detail:'ได้รับใบแจ้งหนี้ฉบับแก้ไขและส่งรายการเดิมกลับเข้าคิว', status:'รอพิจารณา'}
      ]
    }
  ];

  function currentClaimStatus(example) {
    if (example.previousDecision) {
      return ['Close', 'Closed'].includes(example.previousClaimStatus) ? 'Re-Open' : 'Open';
    }
    return example.considerationStatus === 'รอพิจารณา' ? 'Open' : 'Close';
  }

  examples.forEach((example, index) => {
    const common = {
      __hospitalStatusMock: true,
      claimCode: example.claimCode,
      caseNo: example.caseNo,
      hospital: example.hospital,
      province: 'กรุงเทพมหานคร',
      name: example.name,
      claimType: 'IPD',
      treatmentType: 'IPD',
      product: 'PH',
      amount: example.amount,
      claimCause: 'เจ็บป่วย',
      coverageType: 'ค่ารักษา',
      claimStatus: currentClaimStatus(example),
      previousClaimStatus: example.previousClaimStatus,
      date: '16/10/2569 09:20:00',
      admitDate: '14/10/2569',
      dischargeDate: '15/10/2569',
      ipdDays: 1, icuDays: 0, totalStayDays: 1,
      diagnosis: example.diagnosis,
      diagnosis1: example.diagnosis,
      chiefComplaint: example.chiefComplaint,
      note: example.note,
      hn: `HN6910050${index + 1}`,
      vn: `VN6910050${index + 1}`,
      an: `AN6910050${index + 1}`,
      previousDecision: example.previousDecision,
      previousRejection: example.previousRejection,
      previousCancellation: example.previousCancellation,
      statusHistory: example.statusHistory
    };
    if (typeof considerationHospitalRows !== 'undefined' &&
        !considerationHospitalRows.some(row => row.claimCode === example.claimCode)) {
      considerationHospitalRows.push({...common, itemStatus:example.considerationStatus});
    }
    if (typeof hospitalBillingRows !== 'undefined' &&
        !hospitalBillingRows.some(row => row.claimNo === example.claimCode)) {
      hospitalBillingRows.push({
        ...common,
        id:example.billId,
        claimNo:example.claimCode,
        insuredName:example.name,
        sentDate:'16/10/2569',
        treatmentDate:'15/10/2569',
        status:example.billingStatus,
        statusHistory:example.statusHistory.map((event, eventIndex) =>
          example.previousDecision && eventIndex === example.statusHistory.length - 1
            ? {...event, status:example.billingStatus}
            : {...event}),
        idCard:'-',
        appId:`APP6910050${index + 1}`,
        plan:'PH',
        amount:Number(example.amount.replace(/,/g, ''))
      });
    }
  });
})();
