(function () {
  "use strict";

  function freezeList(items) {
    return Object.freeze(items.map(function (item) { return Object.freeze(item); }));
  }

  function makeRequest(data) {
    const request = Object.assign({
      claimType: "Hospital",
      caseStatus: "Re-Open",
      transferredAmount: 0,
      remainingBenefit: 0,
      requestReason: "โรงพยาบาลส่งข้อมูลค่ารักษาเพิ่มเติมหลังจากปิดยอดครั้งแรก",
      sourceRemark: "รับคำขอโอนเพิ่มจาก SmileConnect",
      latestApprover: "ยังไม่มีผู้พิจารณา"
    }, data);
    if (request.totalReceiptAmount == null) {
      request.totalReceiptAmount = Number(request.originalApproved || 0) + Number(request.requestedAmount || 0);
    }
    if (request.netExpenseAmount == null) {
      request.netExpenseAmount = Number(request.originalApproved || 0) + Number(request.requestedAmount || 0);
    }
    const approvableAmount = Math.min(request.requestedAmount || 0, request.remainingBenefit || 0);
    request.treatmentItems = freezeList(request.treatmentItems || [{
      name: "ค่ารักษาพยาบาลเพิ่มเติม",
      code: "ADD-" + request.requestId.slice(-4),
      receiptOld: request.originalApproved || 0,
      approvedOld: request.originalApproved || 0,
      requested: request.requestedAmount || 0,
      approveNow: approvableAmount,
      result: approvableAmount < request.requestedAmount ? "อยู่ในสิทธิ์บางส่วน" : "อยู่ในสิทธิ์",
      resultType: approvableAmount < request.requestedAmount ? "warning" : "success"
    }]);
    request.documents = freezeList(request.documents || [
      { name: "ใบแจ้งหนี้", fileName: request.requestId + "-invoice.pdf", count: 1, detail: "เอกสารจากโรงพยาบาล" },
      { name: "รายละเอียดใบแจ้งหนี้", fileName: request.requestId + "-billing-detail.pdf", count: 1, detail: "รายการค่ารักษาที่ขอเพิ่ม" },
      { name: "เอกสารประกอบเพิ่มเติม", fileName: request.requestId + "-supporting.pdf", count: 1, detail: "เอกสารประกอบการพิจารณา" }
    ]);
    return Object.freeze(request);
  }

  const requests = [
    makeRequest({
      requestId: "AT6909120034", refNo: "SC-ADD-690912-0034", claimNo: "CL6900012345", caseNo: "CC690001",
      insured: "นายกิตติพงศ์ วัฒนชัย", hospital: "โรงพยาบาลสินแพทย์ เสรีรักษ์", treatment: "IPD", plan: "PH Plus 1,000,000",
      receivedDate: "12/09/2569", receivedTime: "09:20", requestedAmount: 1250, originalApproved: 8450,
      totalReceiptAmount: 10200, netExpenseAmount: 9700,
      transferredAmount: 8450, remainingBenefit: 1550, status: "WAITING", latestApprover: "EMP01234 – ณัฐวดี มั่นคง",
      requestReason: "โรงพยาบาลส่งผลตรวจทางห้องปฏิบัติการและค่าพยาธิวิทยาเพิ่มเติมภายหลังจากปิดยอดครั้งแรก",
      sourceRemark: "รับคำขอผ่าน SmileConnect หลังจากโอนค่ารักษารอบแรกแล้ว",
      treatmentItems: [
        { name: "ค่าตรวจทางห้องปฏิบัติการ (Lab)", code: "LAB-001 · CBC / Blood Chemistry", receiptOld: 1200, approvedOld: 1200, requested: 750, approveNow: 650, result: "อยู่ในสิทธิ์", resultType: "success" },
        { name: "ค่าพยาธิวิทยา (Pathology)", code: "PATH-003 · Tissue Examination", receiptOld: 0, approvedOld: 0, requested: 500, approveNow: 350, result: "เกินสิทธิ์บางส่วน", resultType: "warning" }
      ]
    }),
    makeRequest({
      requestId: "AT6909120033", refNo: "SC-ADD-690912-0033", claimNo: "CLPA6900011022", caseNo: "CC690002",
      insured: "เด็กชายณัฐกรณ์ ศรีสวัสดิ์", hospital: "โรงพยาบาลเชียงรายประชานุเคราะห์", treatment: "IPD", plan: "PA Student 500,000",
      receivedDate: "12/09/2569", receivedTime: "08:45", requestedAmount: 4850, originalApproved: 12600,
      transferredAmount: 12600, remainingBenefit: 2200, status: "OVERDUE", latestApprover: "EMP00791 – พรรษา คงสุข"
    }),
    makeRequest({
      requestId: "AT6909110021", refNo: "SC-ADD-690911-0021", claimNo: "CL6900012315", caseNo: "CC690003",
      insured: "นางสาวพิมพ์ชนก ตั้งมั่น", hospital: "โรงพยาบาลเกษมราษฎร์ ประชาชื่น", treatment: "OPD Full", plan: "PH Smart OPD 50,000",
      receivedDate: "11/09/2569", receivedTime: "14:32", requestedAmount: 650, originalApproved: 1850,
      transferredAmount: 1850, remainingBenefit: 900, status: "WAITING", latestApprover: "EMP01108 – พิชญา รัตนกุล"
    }),
    makeRequest({
      requestId: "AT6909110018", refNo: "SC-ADD-690911-0018", claimNo: "CL6900017844", caseNo: "CC690004",
      insured: "นายภูริณัฐ แสงทอง", hospital: "โรงพยาบาลสินแพทย์ รามอินทรา", treatment: "Day Case", plan: "PH Surgery Day Care",
      receivedDate: "11/09/2569", receivedTime: "11:08", requestedAmount: 2000, originalApproved: 9400,
      transferredAmount: 9400, remainingBenefit: 4200, status: "WAITING", latestApprover: "EMP00952 – กฤษฎา ศรีบุญเรือง"
    }),
    makeRequest({
      requestId: "AT6909100094", refNo: "SC-ADD-690910-0094", claimNo: "CLPA6900010988", caseNo: "CC690005",
      insured: "เด็กหญิงกมลพร จันทร์สิงห์", hospital: "โรงพยาบาลศิริราช ปิยมหาราชการุณย์", treatment: "OPD Full", plan: "PA Student 300,000",
      receivedDate: "10/09/2569", receivedTime: "09:45", requestedAmount: 980, originalApproved: 3200,
      transferredAmount: 3200, remainingBenefit: 2100, status: "RETURN", latestApprover: "EMP01018 – อรทัย พงษ์พิพัฒน์"
    }),
    makeRequest({
      requestId: "AT6909090088", refNo: "SC-ADD-690909-0088", claimNo: "CL6900017650", caseNo: "CC690006",
      insured: "นางสาวชนากานต์ แก้วกาญจน์", hospital: "โรงพยาบาลกรุงเทพคริสเตียน", treatment: "OPD Half", plan: "PH Care 300,000",
      receivedDate: "09/09/2569", receivedTime: "16:10", requestedAmount: 720, originalApproved: 2750,
      transferredAmount: 2750, remainingBenefit: 1280, status: "APPROVED", latestApprover: "EMP00645 – วรัญญา มีสุข"
    }),
    makeRequest({
      requestId: "AT6909080075", refNo: "SC-ADD-690908-0075", claimNo: "CL6900017591", caseNo: "CC690007",
      insured: "นายธีรภัทร พัฒนกิจ", hospital: "โรงพยาบาลบำรุงราษฎร์ อินเตอร์เนชั่นแนล", treatment: "IPD", plan: "PH Premier 2,000,000",
      receivedDate: "08/09/2569", receivedTime: "13:05", requestedAmount: 6750, originalApproved: 38200,
      transferredAmount: 38200, remainingBenefit: 14600, status: "WAITING", latestApprover: "EMP00431 – ปรียานุช คำแสน"
    }),
    makeRequest({
      requestId: "AT6909050062", refNo: "SC-ADD-690905-0062", claimNo: "CLPA6900010452", caseNo: "CC690008",
      insured: "เด็กชายปิติภูมิ แสนวงศ์", hospital: "โรงพยาบาลมหาราชนครเชียงใหม่", treatment: "IPD", plan: "PA Student 500,000",
      receivedDate: "05/09/2569", receivedTime: "10:25", requestedAmount: 3400, originalApproved: 11800,
      transferredAmount: 11800, remainingBenefit: 5600, status: "OVERDUE", latestApprover: "EMP00802 – สุเมธ วัฒนะ"
    }),
    makeRequest({
      requestId: "AT6909020047", refNo: "SC-ADD-690902-0047", claimNo: "CL6900017018", caseNo: "CC690009",
      insured: "นางสาวอริสรา ตั้งใจ", hospital: "โรงพยาบาลสมิติเวช สุขุมวิท", treatment: "OPD Full", plan: "PH Smart OPD 100,000",
      receivedDate: "02/09/2569", receivedTime: "15:40", requestedAmount: 1100, originalApproved: 4900,
      transferredAmount: 4900, remainingBenefit: 3500, status: "APPROVED", latestApprover: "EMP00514 – ภัทรภรณ์ ชูใจ"
    }),
    makeRequest({
      requestId: "AT6908310039", refNo: "SC-ADD-690831-0039", claimNo: "CL6900016889", caseNo: "CC690010",
      insured: "นายณัฐพงษ์ รุ่งเรือง", hospital: "โรงพยาบาลพระรามเก้า", treatment: "Day Case", plan: "PH Surgery Plus",
      receivedDate: "31/08/2569", receivedTime: "12:15", requestedAmount: 2550, originalApproved: 8700,
      transferredAmount: 8700, remainingBenefit: 7400, status: "RETURN", latestApprover: "EMP01320 – ธนกฤต ภูมิใจ"
    }),
    makeRequest({
      requestId: "AT6908260026", refNo: "SC-ADD-690826-0026", claimNo: "CLPA6900009981", caseNo: "CC690011",
      insured: "เด็กหญิงวรัญญา นาคแก้ว", hospital: "โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย", treatment: "OPD Full", plan: "PA Student 300,000",
      receivedDate: "26/08/2569", receivedTime: "09:55", requestedAmount: 860, originalApproved: 2640,
      transferredAmount: 2640, remainingBenefit: 1940, status: "WAITING", latestApprover: "EMP00377 – กมลชนก ศรีทอง"
    }),
    makeRequest({
      requestId: "AT6908200014", refNo: "SC-ADD-690820-0014", claimNo: "CL6900016204", caseNo: "CC690012",
      insured: "นายพชรพล วิเศษชัย", hospital: "โรงพยาบาลกรุงเทพ สำนักงานใหญ่ ซอยศูนย์วิจัย", treatment: "IPD", plan: "PH Premier 1,000,000",
      receivedDate: "20/08/2569", receivedTime: "17:20", requestedAmount: 4200, originalApproved: 24600,
      transferredAmount: 24600, remainingBenefit: 9800, status: "APPROVED", latestApprover: "EMP00901 – สโรชา วิไลพร"
    })
  ];

  window.ClaimAgentHospitalAdditionalTransferMock = Object.freeze({
    requests: Object.freeze(requests.slice())
  });
})();
