/* ============================================================
   Death & Disability consideration status mock data
   Adds realistic list/detail examples without changing API contracts.
   ============================================================ */
(function () {
  "use strict";

  if (typeof considerationDeathRows === "undefined" || !Array.isArray(considerationDeathRows)) return;

  var statusExamples = {
    CL6906000104: {
      amount: "120,000.00",
      statusReason: "รายการเคลมและเอกสารประกอบครบถ้วน พร้อมเข้าสู่การพิจารณา",
      statusDetail: "ตรวจสอบใบมรณบัตร หนังสือรับรองแพทย์ และข้อมูลผู้รับผลประโยชน์แล้ว"
    },
    CL6906000082: {
      status: "อยู่ระหว่างการทำรายการ",
      statusClass: "progress",
      amount: "70,000.00",
      statusReason: "เจ้าหน้าที่กำลังบันทึกผลประโยชน์กรณีทุพพลภาพ",
      statusDetail: "ตรวจสอบอัตราผลประโยชน์การสูญเสียมือขวาและนิ้วหัวแม่มือกับตารางกรมธรรม์"
    },
    CL6906000095: {
      amount: "80,000.00",
      statusReason: "ข้อมูลวันที่สิ้นสุดการรักษาไม่ตรงกับหนังสือรับรองแพทย์",
      statusDetail: "ส่งกลับให้สาขาระนองแก้ไขวันที่สิ้นสุดการรักษา และแนบผลประเมินการสูญเสียสมรรถภาพฉบับลงนาม"
    },
    CLPA6906000112: {
      amount: "100,000.00",
      statusReason: "เหตุเสียชีวิตเข้าข้อยกเว้นความคุ้มครองตามเงื่อนไขกรมธรรม์",
      statusDetail: "ผลตรวจแอลกอฮอล์เกินเกณฑ์ที่กำหนด และมีบันทึกพนักงานสอบสวนประกอบการพิจารณา"
    },
    CLPA6906000113: {
      amount: "80,000.00"
    }
  };

  considerationDeathRows.forEach(function (row) {
    if (statusExamples[row.claimCode]) Object.assign(row, statusExamples[row.claimCode]);
  });

  var additionalRows = [
    {
      date: "27/10/2569 09:14:22", claimCode: "CLPA6906000121", branch: "กรุงเทพมหานคร",
      name: "นายตัวอย่าง ใจดี", product: "PA", plan: "ชดเชย+สุขภาพ",
      status: "รอแก้ไข", statusClass: "edit", amount: "100,000.00",
      statusReason: "ข้อมูลสถานที่เสียชีวิตไม่ตรงกับเอกสารโรงพยาบาล",
      statusDetail: "รอแก้ไขสถานที่เสียชีวิตและการวินิจฉัยจากเอกสารโรงพยาบาล"
    },
    {
      date: "27/10/2569 09:28:05", claimCode: "CL6906000122", branch: "ขอนแก่น",
      name: "นางสาวตัวอย่าง แสงทอง", product: "PH", plan: "662",
      status: "รอแก้ไข", statusClass: "edit", amount: "200,000.00",
      statusReason: "วันที่เสียชีวิตไม่ตรงกับใบมรณบัตร",
      statusDetail: "รอแก้ไขวันที่เสียชีวิตและวันที่เอกสารครบก่อนพิจารณาอีกครั้ง"
    },
    {
      date: "27/10/2569 10:03:17", claimCode: "CL6906000123", branch: "เชียงราย",
      name: "นายตัวอย่าง ภูผา", product: "PH", plan: "661",
      status: "รอแก้ไข", statusClass: "edit", amount: "75,000.00",
      statusReason: "ผลวินิจฉัยการสูญเสียการได้ยินยังไม่ตรงกับใบรับรองแพทย์",
      statusDetail: "รอแก้ไขการวินิจฉัยและรายละเอียดการสูญเสียการได้ยิน"
    },
    {
      date: "27/10/2569 10:35:49", claimCode: "CLPA6906000124", branch: "ชลบุรี",
      name: "นางสาวตัวอย่าง รุ่งเรือง", product: "PA", plan: "เลือกสิทธิ์+สุขภาพ",
      status: "รอแก้ไข", statusClass: "edit", amount: "150,000.00",
      statusReason: "ข้อมูลวันที่รับแจ้งและสถานพยาบาลต้องแก้ไข",
      statusDetail: "รอปรับวันที่รับแจ้งและชื่อสถานพยาบาลให้ตรงกับเอกสารต้นทาง"
    },
    {
      date: "28/10/2569 08:42:11", claimCode: "CL6906000125", branch: "นนทบุรี",
      name: "นายตัวอย่าง นที", product: "PH", plan: "662",
      status: "รอพิจารณา", statusClass: "wait", amount: "300,000.00",
      statusReason: "รับเอกสารกรณีเสียชีวิตที่บ้านครบแล้ว",
      statusDetail: "รอพิจารณาความคุ้มครองและผลประโยชน์กรณีเสียชีวิต"
    },
    {
      date: "28/10/2569 09:06:34", claimCode: "CLPA6906000126", branch: "ภูเก็ต",
      name: "นางสาวตัวอย่าง ปาริชาติ", product: "PA", plan: "ชดเชย+สุขภาพ",
      status: "รอพิจารณา", statusClass: "wait", amount: "120,000.00",
      statusReason: "รับเอกสารอุบัติเหตุและรายงานการเสียชีวิตครบแล้ว",
      statusDetail: "รอพิจารณาผลประโยชน์กรณีเสียชีวิตจากอุบัติเหตุ"
    },
    {
      date: "28/10/2569 09:27:08", claimCode: "CL6906000127", branch: "อุดรธานี",
      name: "นายตัวอย่าง วรพล", product: "PH", plan: "661",
      status: "รอพิจารณา", statusClass: "wait", amount: "90,000.00",
      statusReason: "ได้รับผลประเมินการสูญเสียการมองเห็นถาวรครบแล้ว",
      statusDetail: "รอพิจารณาระดับการสูญเสียสมรรถภาพและวงเงินตามกรมธรรม์"
    },
    {
      date: "28/10/2569 09:48:55", claimCode: "CLPA6906000128", branch: "สงขลา",
      name: "นางสาวตัวอย่าง ปลายฟ้า", product: "PA", plan: "เลือกสิทธิ์+สุขภาพ",
      status: "รอพิจารณา", statusClass: "wait", amount: "60,000.00",
      statusReason: "เอกสารอุบัติเหตุและใบรับรองแพทย์ครบถ้วน",
      statusDetail: "รอพิจารณาผลประโยชน์กรณีสูญเสียนิ้วมือ"
    },
    {
      date: "25/08/2569 10:22:41",
      claimCode: "CL6906000077",
      branch: "เชียงใหม่",
      name: "นางสาวกัญญาณัฐ อินทร์แก้ว",
      product: "PH",
      status: "รอตรวจสอบการแก้ไข",
      statusClass: "review",
      amount: "60,000.00",
      statusReason: "ได้รับผลตรวจการได้ยินและหนังสือรับรองแพทย์ฉบับแก้ไขแล้ว",
      statusDetail: "รอผู้พิจารณาตรวจสอบระดับการสูญเสียการได้ยินถาวร และวันที่เริ่มมีภาวะทุพพลภาพ"
    },
    {
      date: "25/08/2569 11:08:16",
      claimCode: "CLPA6906000069",
      branch: "นครราชสีมา",
      name: "เด็กหญิงณิชารีย์ วัฒนสุข",
      product: "PA",
      plan: "เลือกสิทธิ์+สุขภาพ",
      status: "ยกเลิก",
      statusClass: "cancel",
      amount: "100,000.00",
      statusReason: "ผู้แจ้งเคลมขอยกเลิกรายการเพื่อรวบรวมเอกสารจากหน่วยงานราชการ",
      statusDetail: "ยกเลิกก่อนบันทึกผลพิจารณา โดยยังไม่มีการสร้างรายการโอนเงิน สามารถแจ้งเคลมใหม่เมื่อเอกสารครบ"
    }
  ];

  additionalRows.forEach(function (row) {
    if (!considerationDeathRows.some(function (item) { return item.claimCode === row.claimCode; })) {
      considerationDeathRows.push(row);
    }
  });

  window.considerationDeathRows = considerationDeathRows;

  function detailHtml(config) {
    return '<div><div class="dd-field-label">ประเภทการเคลม :</div><div class="dd-field-value">เคลมลูกค้า</div></div>' +
      '<div><div class="dd-field-label">เหตุของการเคลม :</div><div class="dd-field-value">' + config.cause + '</div></div>' +
      '<div><div class="dd-field-label">ประเภทความคุ้มครอง :</div><div id="ddCoverageTypeValue" class="dd-field-value">' + config.coverage + '</div></div>' +
      optionalField('ผู้รับเอกสาร', config.recipient) +
      optionalField('ผู้ให้บริการ', config.provider) +
      optionalField('เจ้าของรถ', config.owner) +
      optionalField('สาเหตุการเสียชีวิต', config.coverage === 'เสียชีวิต' ? config.deathReason : '') +
      '<div><div class="dd-field-label">สาเหตุการเสียชีวิต/ทุพพลภาพ :</div><div class="dd-field-value">' + config.incident + '</div></div>' +
      '<div><div class="dd-field-label">วันที่เกิดเหตุ :</div><div class="dd-field-value">' + config.incidentDate + '</div></div>' +
      optionalField('วันที่เสียชีวิต', config.deathDate) +
      optionalField('สถานที่เกิดเหตุ', config.incidentPlace) +
      '<div><div class="dd-field-label">วันที่รับเอกสาร :</div><div class="dd-field-value">' + config.receivedDate + '</div></div>' +
      '<div><div class="dd-field-label">วันที่เอกสารครบ :</div><div class="dd-field-value">' + config.completeDate + '</div></div>' +
      '<div><div class="dd-field-label">สถานพยาบาล :</div><div class="dd-field-value">' + config.hospital + '</div></div>' +
      '<div class="dd-field-span"><div class="dd-field-label">อาการสำคัญ :</div><div class="dd-field-value">' + config.symptom + '</div></div>' +
      '<div class="dd-field-span"><div class="dd-field-label">คำวินิจฉัย 1 :</div><div class="dd-field-value">' + config.diagnosis + '</div></div>' +
      '<div><div class="dd-field-label">คำวินิจฉัย 2 :</div><div class="dd-field-value">' + (config.diagnosis2 || '-') + '</div></div>' +
      '<div class="dd-diag3-row"><div class="dd-field-label">คำวินิจฉัย 3 :</div><div class="dd-field-value">' + (config.diagnosis3 || '-') + '</div></div>' +
      optionalField('รายละเอียดการเจ็บป่วย/การบาดเจ็บ', config.injuryDetail) +
      '<div class="dd-field-span"><div class="dd-field-label">หมายเหตุ :</div><div class="dd-field-value">' + config.note + '</div></div>';
  }

  function optionalField(label, value) {
    return value ? '<div><div class="dd-field-label">' + label + ' :</div><div class="dd-field-value">' + value + '</div></div>' : '';
  }

  function expenseHtml(config) {
    return '<div><table class="dd-mini-table"><thead><tr><th>รายการ</th><th>รายละเอียด</th><th>ยอดเบิก</th><th>ยอดไม่คุ้มครอง</th><th>สาเหตุไม่คุ้มครอง</th><th>หมายเหตุ</th></tr></thead>' +
      '<tbody><tr><td>' + config.item + '</td><td>' + config.itemDetail + '</td><td>' + config.claimAmount + '</td><td>' + config.uncovered + '</td><td>' + config.uncoveredReason + '</td><td>' + config.expenseNote + '</td></tr></tbody>' +
      '<tfoot><tr><td colspan="6" class="text-right">ยอดเงินตามใบเสร็จรวม : ' + config.claimAmount + '</td></tr></tfoot></table></div>' +
      '<aside class="dd-benefit-card"><div class="dd-benefit-title"><span class="material-icons-round">shield</span>สรุปความคุ้มครอง</div>' +
      '<div class="dd-benefit-row"><span>ทุนประกัน</span><strong>' + config.sumAssured + ' บาท</strong></div>' +
      '<div class="dd-benefit-row"><span>ยอดเรียกร้อง</span><strong>' + config.claimAmount + ' บาท</strong></div>' +
      '<div class="dd-benefit-row"><span>ยอดที่พิจารณาจ่าย</span><strong>' + config.payAmount + ' บาท</strong></div></aside>';
  }

  function registerDetail(claimCode, config) {
    if (typeof considerDeathDetailMockups === "undefined") return;
    if (config.deathPlace) {
      window.considerDeathPlaceByClaim = window.considerDeathPlaceByClaim || {};
      window.considerDeathPlaceByClaim[claimCode] = {
        deathPlace: config.deathPlace,
        deathHospital: config.deathHospital || "",
        deathPlaceOther: config.deathPlaceOther || "",
        note: config.note || ""
      };
    }
    considerDeathDetailMockups[claimCode] = {
      meta: { updateDate: config.updateDate, branch: config.branch },
      claim: { claimCode: claimCode, caseCode: config.caseCode },
      insured: {
        name: config.name,
        idCard: config.idCard,
        appId: config.appId,
        phone: config.phone,
        status: "มีผลคุ้มครอง",
        plan: "แผน : " + config.plan
      },
      detailHtml: detailHtml(config),
      expenseHtml: expenseHtml(config),
      payTotal: "จำนวนเงินโอนรวม : " + config.claimAmount + " บาท"
    };
  }

  registerDetail("CL6906000095", {
    updateDate: "17/06/2569 14:29:43", branch: "ระนอง", caseCode: "CC6906000095",
    name: "นางวิมลพร พงษ์พัฒน์เปรียน", idCard: "3850200147291", appId: "0012439", phone: "089-614-7285", plan: "662",
    cause: "อุบัติเหตุ", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "พลัดตกจากที่สูง", incidentDate: "12/06/2569", receivedDate: "14/06/2569", completeDate: "-",
    hospital: "โรงพยาบาลระนอง", symptom: "กระดูกสันหลังบาดเจ็บและขาซ้ายอ่อนแรงหลังพลัดตกจากบันได",
    diagnosis: "S34.1 : Other injury of lumbar spinal cord | ไขสันหลังส่วนเอวได้รับบาดเจ็บ", note: "รอแก้ไขวันที่สิ้นสุดการรักษาและเอกสารประเมินสมรรถภาพ",
    item: "ผลประโยชน์ทุพพลภาพถาวรบางส่วน", itemDetail: "ขาซ้ายสูญเสียสมรรถภาพ 40%", claimAmount: "80,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอเอกสารฉบับแก้ไข", sumAssured: "200,000.00", payAmount: "80,000.00"
  });

  registerDetail("CLPA6906000121", {
    updateDate: "27/10/2569 09:14:22", branch: "กรุงเทพมหานคร", caseCode: "CCPA6906000121",
    name: "นายตัวอย่าง ใจดี", idCard: "-", appId: "DEMO-PA-0121", phone: "-", plan: "ชดเชย+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", deathReason: "อุบัติเหตุทั่วไป", incident: "อุบัติเหตุทางถนน", incidentDate: "20/10/2569", deathDate: "21/10/2569", incidentPlace: "ถนนในเขตบางเขน กรุงเทพมหานคร", deathPlace: "สถานพยาบาล", deathHospital: "โรงพยาบาลภูมิพลอดุลยเดช",
    receivedDate: "23/10/2569", completeDate: "26/10/2569", recipient: "ผู้ให้บริการ (Walk in)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลภูมิพลอดุลยเดช", symptom: "บาดเจ็บศีรษะรุนแรงหลังอุบัติเหตุทางถนน",
    diagnosis: "S06.9 : การบาดเจ็บภายในกะโหลกศีรษะ", diagnosis2: "S27.3 : การบาดเจ็บของปอด", injuryDetail: "นำส่งโรงพยาบาลหลังเกิดเหตุและเสียชีวิตระหว่างรักษา",
    note: "รอตรวจสอบสถานที่เสียชีวิตจากเอกสารโรงพยาบาล", item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "อุบัติเหตุทางถนน",
    claimAmount: "100,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอแก้ไขข้อมูลเคลม", sumAssured: "100,000.00", payAmount: "0.00"
  });

  registerDetail("CL6906000122", {
    updateDate: "27/10/2569 09:28:05", branch: "ขอนแก่น", caseCode: "CC6906000122",
    name: "นางสาวตัวอย่าง แสงทอง", idCard: "-", appId: "DEMO-PH-0122", phone: "-", plan: "662",
    cause: "เจ็บป่วย", coverage: "เสียชีวิต", deathReason: "โรคทั่วไป", incident: "ภาวะแทรกซ้อนจากโรคหัวใจ", incidentDate: "14/10/2569", deathDate: "18/10/2569", incidentPlace: "บ้านพัก อำเภอเมืองขอนแก่น", deathPlace: "ที่บ้าน",
    receivedDate: "21/10/2569", completeDate: "25/10/2569", recipient: "ผู้ให้บริการ (Walk Out)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลขอนแก่น", symptom: "เจ็บแน่นหน้าอกและหายใจลำบาก",
    diagnosis: "I21.9 : กล้ามเนื้อหัวใจตายเฉียบพลัน", diagnosis2: "I50.9 : ภาวะหัวใจล้มเหลว", injuryDetail: "เข้ารับการรักษาฉุกเฉินก่อนเสียชีวิต",
    note: "รอแก้ไขวันที่เสียชีวิตให้ตรงใบมรณบัตร", item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "เจ็บป่วย",
    claimAmount: "200,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอแก้ไขข้อมูลเคลม", sumAssured: "200,000.00", payAmount: "0.00"
  });

  registerDetail("CL6906000123", {
    updateDate: "27/10/2569 10:03:17", branch: "เชียงราย", caseCode: "CC6906000123",
    name: "นายตัวอย่าง ภูผา", idCard: "-", appId: "DEMO-PH-0123", phone: "-", plan: "661",
    cause: "เจ็บป่วย", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "สูญเสียการได้ยินถาวร", incidentDate: "04/10/2569",
    receivedDate: "12/10/2569", completeDate: "24/10/2569", recipient: "ผู้ให้บริการ (Walk in)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลเชียงรายประชานุเคราะห์", symptom: "การได้ยินหูซ้ายลดลงต่อเนื่อง",
    diagnosis: "H91.92 : การสูญเสียการได้ยินหูซ้าย", diagnosis2: "H93.1 : เสียงรบกวนในหู", injuryDetail: "ผลตรวจการได้ยินระบุการสูญเสียการได้ยินถาวรหูซ้าย",
    note: "รอแก้ไขผลวินิจฉัยให้ตรงกับหนังสือรับรองแพทย์", item: "ผลประโยชน์สูญเสียการได้ยิน", itemDetail: "หูซ้ายหนึ่งข้าง",
    claimAmount: "75,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอแก้ไขข้อมูลเคลม", sumAssured: "150,000.00", payAmount: "0.00"
  });

  registerDetail("CLPA6906000124", {
    updateDate: "27/10/2569 10:35:49", branch: "ชลบุรี", caseCode: "CCPA6906000124",
    name: "นางสาวตัวอย่าง รุ่งเรือง", idCard: "-", appId: "DEMO-PA-0124", phone: "-", plan: "เลือกสิทธิ์+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "นิ้วมือขวาสูญเสียจากอุบัติเหตุ", incidentDate: "09/10/2569",
    receivedDate: "13/10/2569", completeDate: "24/10/2569", recipient: "ผู้ให้บริการ (Walk Out)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลชลบุรี", symptom: "บาดเจ็บมือขวาและสูญเสียนิ้วชี้",
    diagnosis: "S68.1 : นิ้วมือขาดจากอุบัติเหตุ", diagnosis2: "S61.4 : แผลเปิดหลายแห่งของมือ", injuryDetail: "สูญเสียนิ้วชี้ขวาหนึ่งนิ้วและรักษาแผลผ่าตัดต่อเนื่อง",
    note: "รอแก้ไขวันที่รับแจ้งและชื่อสถานพยาบาล", item: "ผลประโยชน์สูญเสียอวัยวะ", itemDetail: "นิ้วชี้ขวา",
    claimAmount: "150,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอแก้ไขข้อมูลเคลม", sumAssured: "300,000.00", payAmount: "0.00"
  });

  registerDetail("CL6906000125", {
    updateDate: "28/10/2569 08:42:11", branch: "นนทบุรี", caseCode: "CC6906000125",
    name: "นายตัวอย่าง นที", idCard: "-", appId: "DEMO-PH-0125", phone: "-", plan: "662",
    cause: "เจ็บป่วย", coverage: "เสียชีวิต", deathReason: "โรคทั่วไป", incident: "ภาวะแทรกซ้อนจากโรคปอด", incidentDate: "20/10/2569", deathDate: "23/10/2569", deathPlace: "ที่บ้าน",
    receivedDate: "25/10/2569", completeDate: "27/10/2569", recipient: "ผู้ให้บริการ (Walk in)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลพระนั่งเกล้า", symptom: "หายใจลำบากและอ่อนเพลียต่อเนื่อง",
    diagnosis: "J44.9 : โรคปอดอุดกั้นเรื้อรัง", diagnosis2: "J18.9 : ปอดอักเสบ", injuryDetail: "ติดตามการรักษาที่โรงพยาบาลก่อนเสียชีวิตที่บ้าน",
    note: "เอกสารกรณีเสียชีวิตที่บ้านครบถ้วน", item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "เจ็บป่วย",
    claimAmount: "300,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอพิจารณา", sumAssured: "300,000.00", payAmount: "0.00"
  });

  registerDetail("CLPA6906000126", {
    updateDate: "28/10/2569 09:06:34", branch: "ภูเก็ต", caseCode: "CCPA6906000126",
    name: "นางสาวตัวอย่าง ปาริชาติ", idCard: "-", appId: "DEMO-PA-0126", phone: "-", plan: "ชดเชย+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", deathReason: "อุบัติเหตุทั่วไป", incident: "อุบัติเหตุทางน้ำ", incidentDate: "22/10/2569", deathDate: "22/10/2569", deathPlace: "อื่นๆ", deathPlaceOther: "บริเวณชายหาด จังหวัดภูเก็ต",
    receivedDate: "25/10/2569", completeDate: "27/10/2569", recipient: "ผู้ให้บริการ (Walk Out)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลวชิระภูเก็ต", symptom: "หมดสติหลังประสบอุบัติเหตุทางน้ำ",
    diagnosis: "T75.1 : ภาวะจมน้ำ", injuryDetail: "ได้รับการช่วยเหลือ ณ จุดเกิดเหตุและนำส่งโรงพยาบาล",
    note: "รอพิจารณาผลประโยชน์ตามรายงานอุบัติเหตุ", item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "อุบัติเหตุทางน้ำ",
    claimAmount: "120,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอพิจารณา", sumAssured: "120,000.00", payAmount: "0.00"
  });

  registerDetail("CL6906000127", {
    updateDate: "28/10/2569 09:27:08", branch: "อุดรธานี", caseCode: "CC6906000127",
    name: "นายตัวอย่าง วรพล", idCard: "-", appId: "DEMO-PH-0127", phone: "-", plan: "661",
    cause: "เจ็บป่วย", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "สูญเสียการมองเห็นถาวร", incidentDate: "13/10/2569",
    receivedDate: "19/10/2569", completeDate: "27/10/2569", recipient: "ผู้ให้บริการ (Walk in)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลอุดรธานี", symptom: "การมองเห็นตาขวาลดลงอย่างต่อเนื่อง",
    diagnosis: "H54.4 : ตาบอดข้างเดียว", diagnosis2: "H33.0 : จอตาหลุดลอก", injuryDetail: "ผลตรวจจักษุแพทย์ระบุการสูญเสียการมองเห็นถาวรข้างขวา",
    note: "ได้รับผลประเมินจากจักษุแพทย์แล้ว", item: "ผลประโยชน์สูญเสียการมองเห็น", itemDetail: "ตาขวาหนึ่งข้าง",
    claimAmount: "90,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอพิจารณา", sumAssured: "180,000.00", payAmount: "0.00"
  });

  registerDetail("CLPA6906000128", {
    updateDate: "28/10/2569 09:48:55", branch: "สงขลา", caseCode: "CCPA6906000128",
    name: "นางสาวตัวอย่าง ปลายฟ้า", idCard: "-", appId: "DEMO-PA-0128", phone: "-", plan: "เลือกสิทธิ์+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "นิ้วมือซ้ายสูญเสียจากอุบัติเหตุ", incidentDate: "18/10/2569",
    receivedDate: "22/10/2569", completeDate: "27/10/2569", recipient: "ผู้ให้บริการ (Walk Out)", provider: "ผู้ให้บริการ (Walk in)", owner: "000 - คุณสำนักงาน",
    hospital: "โรงพยาบาลหาดใหญ่", symptom: "บาดเจ็บมือซ้ายและสูญเสียนิ้วก้อย",
    diagnosis: "S68.1 : นิ้วมือขาดจากอุบัติเหตุ", diagnosis2: "S61.4 : แผลเปิดที่มือ", injuryDetail: "สูญเสียนิ้วก้อยซ้ายหนึ่งนิ้วและได้รับการรักษาแผลผ่าตัด",
    note: "ใบรับรองแพทย์และรายงานอุบัติเหตุครบถ้วน", item: "ผลประโยชน์สูญเสียอวัยวะ", itemDetail: "นิ้วก้อยซ้าย",
    claimAmount: "60,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอพิจารณา", sumAssured: "150,000.00", payAmount: "0.00"
  });

  registerDetail("CLPA6906000112", {
    updateDate: "17/06/2569 14:42:24", branch: "สุพรรณบุรี", caseCode: "CCPA6906000112",
    name: "เด็กชายธนภัทร สถานนท์", idCard: "1729900836412", appId: "PA001112", phone: "081-735-4092", plan: "ชดเชย+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", deathReason: "ขับขี่/โดยสารจักรยานยนต์", incident: "อุบัติเหตุรถจักรยานยนต์", incidentDate: "09/06/2569", receivedDate: "12/06/2569", completeDate: "16/06/2569",
    hospital: "โรงพยาบาลเจ้าพระยายมราช", symptom: "ได้รับบาดเจ็บรุนแรงจากอุบัติเหตุจราจรและเสียชีวิต",
    diagnosis: "S06.9 : Intracranial injury, unspecified | การบาดเจ็บภายในกะโหลกศีรษะ", note: "พิจารณาร่วมกับรายงานพนักงานสอบสวนและผลตรวจแอลกอฮอล์",
    item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "อุบัติเหตุรถจักรยานยนต์", claimAmount: "100,000.00", uncovered: "100,000.00", uncoveredReason: "เข้าข้อยกเว้นกรมธรรม์", expenseNote: "ปฏิเสธการจ่ายสินไหม", sumAssured: "100,000.00", payAmount: "0.00"
  });

  registerDetail("CL6906000077", {
    updateDate: "25/08/2569 10:22:41", branch: "เชียงใหม่", caseCode: "CC6906000077",
    name: "นางสาวกัญญาณัฐ อินทร์แก้ว", idCard: "1509901246815", appId: "0012377", phone: "086-241-9087", plan: "661",
    cause: "เจ็บป่วย", coverage: "ทุพพลภาพ/สูญเสียอวัยวะ", incident: "สูญเสียการได้ยินถาวร", incidentDate: "03/06/2569", receivedDate: "08/06/2569", completeDate: "24/08/2569",
    hospital: "โรงพยาบาลมหาราชนครเชียงใหม่", symptom: "การได้ยินหูขวาลดลงรุนแรงและไม่ตอบสนองต่อการรักษา",
    diagnosis: "H91.91 : Unspecified hearing loss, right ear | สูญเสียการได้ยินหูขวา", note: "ได้รับผลตรวจ Audiogram และหนังสือรับรองแพทย์ฉบับแก้ไขแล้ว",
    item: "ผลประโยชน์สูญเสียการได้ยิน", itemDetail: "หูขวาหนึ่งข้าง", claimAmount: "60,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "รอตรวจสอบการแก้ไข", sumAssured: "200,000.00", payAmount: "60,000.00"
  });

  registerDetail("CLPA6906000069", {
    updateDate: "25/08/2569 11:08:16", branch: "นครราชสีมา", caseCode: "CCPA6906000069",
    name: "เด็กหญิงณิชารีย์ วัฒนสุข", idCard: "1309901765204", appId: "PA001069", phone: "093-847-2501", plan: "เลือกสิทธิ์+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", deathReason: "อุบัติเหตุทั่วไป", incident: "อุบัติเหตุทางน้ำ", incidentDate: "18/08/2569", receivedDate: "20/08/2569", completeDate: "-",
    hospital: "โรงพยาบาลมหาราชนครราชสีมา", symptom: "หมดสติจากอุบัติเหตุทางน้ำและเสียชีวิตภายหลังนำส่งโรงพยาบาล",
    diagnosis: "T75.1 : Unspecified effects of drowning and nonfatal submersion | ภาวะจมน้ำ", note: "ผู้แจ้งเคลมขอยกเลิกเพื่อรวบรวมรายงานการชันสูตรและเอกสารราชการ",
    item: "ผลประโยชน์กรณีเสียชีวิต", itemDetail: "อุบัติเหตุทางน้ำ", claimAmount: "100,000.00", uncovered: "-", uncoveredReason: "-", expenseNote: "ยกเลิกก่อนพิจารณา", sumAssured: "100,000.00", payAmount: "0.00"
  });

  var orderedStatuses = [
    ["รอพิจารณา", "receipt_long", "status-wait"],
    ["อยู่ระหว่างการทำรายการ", "hourglass_top", "status-progress"],
    ["รอแก้ไข", "edit_note", "status-edit"],
    ["รอตรวจสอบการแก้ไข", "fact_check", "status-review"],
    ["ปฏิเสธ", "block", "status-reject"],
    ["ยกเลิก", "cancel", "status-cancel"],
    ["อนุมัติ", "check_circle", "status-approve"]
  ];

  function countStatus(status) {
    return considerationDeathRows.filter(function (row) { return row.status === status; }).length;
  }

  function syncDeathStatusUi() {
    var page = document.getElementById("considerDeathPage");
    if (!page) return;
    var total = page.querySelector(".dd-main-total");
    if (total) total.textContent = considerationDeathRows.length;
    var strip = page.querySelector(".dd-stat-strip");
    if (strip) {
      strip.innerHTML = orderedStatuses.map(function (item) {
        return '<div class="dd-stat-item"><span class="dd-stat-icon material-icons-round">' + item[1] + '</span><div class="dd-stat-label">' + item[0] + '</div><div class="dd-stat-value">' + countStatus(item[0]) + '</div><div class="dd-stat-line"></div></div>';
      }).join("");
    }
    var buttons = page.querySelector(".dd-status-filter-buttons");
    if (buttons) {
      buttons.innerHTML = '<button type="button" class="dd-status-filter-btn active" data-status="all" onclick="setConsiderDeathStatusFilter(\'all\')">ทั้งหมด</button>' +
        orderedStatuses.map(function (item) {
          return '<button type="button" class="dd-status-filter-btn ' + item[2] + '" data-status="' + item[0] + '" onclick="setConsiderDeathStatusFilter(\'' + item[0] + '\')">' + item[0] + '</button>';
        }).join("");
    }
    if (typeof renderConsiderDeathTable === "function") renderConsiderDeathTable();
  }

  var originalShowDeathPage = window.showConsiderDeathPage;
  if (typeof originalShowDeathPage === "function") {
    window.showConsiderDeathPage = function () {
      var result = originalShowDeathPage.apply(this, arguments);
      syncDeathStatusUi();
      return result;
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncDeathStatusUi);
  else syncDeathStatusUi();
})();
