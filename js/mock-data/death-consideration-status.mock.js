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
      '<div><div class="dd-field-label">สาเหตุการเสียชีวิต/ทุพพลภาพ :</div><div class="dd-field-value">' + config.incident + '</div></div>' +
      '<div><div class="dd-field-label">วันที่เกิดเหตุ :</div><div class="dd-field-value">' + config.incidentDate + '</div></div>' +
      '<div><div class="dd-field-label">วันที่รับเอกสาร :</div><div class="dd-field-value">' + config.receivedDate + '</div></div>' +
      '<div><div class="dd-field-label">วันที่เอกสารครบ :</div><div class="dd-field-value">' + config.completeDate + '</div></div>' +
      '<div><div class="dd-field-label">สถานพยาบาล :</div><div class="dd-field-value">' + config.hospital + '</div></div>' +
      '<div class="dd-field-span"><div class="dd-field-label">อาการสำคัญ :</div><div class="dd-field-value">' + config.symptom + '</div></div>' +
      '<div class="dd-field-span"><div class="dd-field-label">คำวินิจฉัย 1 :</div><div class="dd-field-value">' + config.diagnosis + '</div></div>' +
      '<div><div class="dd-field-label">คำวินิจฉัย 2 :</div><div class="dd-field-value">-</div></div>' +
      '<div class="dd-diag3-row"><div class="dd-field-label">คำวินิจฉัย 3 :</div><div class="dd-field-value">-</div></div>' +
      '<div class="dd-field-span"><div class="dd-field-label">หมายเหตุ :</div><div class="dd-field-value">' + config.note + '</div></div>';
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
      payTotal: "จำนวนเงินโอนรวม : " + config.payAmount + " บาท"
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

  registerDetail("CLPA6906000112", {
    updateDate: "17/06/2569 14:42:24", branch: "สุพรรณบุรี", caseCode: "CCPA6906000112",
    name: "เด็กชายธนภัทร สถานนท์", idCard: "1729900836412", appId: "PA001112", phone: "081-735-4092", plan: "ชดเชย+สุขภาพ",
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", incident: "อุบัติเหตุรถจักรยานยนต์", incidentDate: "09/06/2569", receivedDate: "12/06/2569", completeDate: "16/06/2569",
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
    cause: "อุบัติเหตุ", coverage: "เสียชีวิต", incident: "อุบัติเหตุทางน้ำ", incidentDate: "18/08/2569", receivedDate: "20/08/2569", completeDate: "-",
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
