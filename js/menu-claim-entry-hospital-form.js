/* บันทึกเคลม > ค้นหาผู้เอาประกัน > แจ้งเคลม รพ.: scoped entry fields. */
(function () {
  "use strict";

  const page = document.getElementById("claimEntryPage");
  if (!page) return;

  function state() { return window.claimState || {}; }
  function data() {
    const current = state();
    if (!current.hospitalEntry || typeof current.hospitalEntry !== "object") current.hospitalEntry = {};
    return current.hospitalEntry;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function field(label, key, options) {
    const opts = options || {};
    const required = opts.required ? '<span class="hospital-entry-required" aria-hidden="true">*</span>' : "";
    const value = escapeHtml(data()[key] || "");
    const id = "hospitalEntry" + key.charAt(0).toUpperCase() + key.slice(1);
    const choices = opts.choices ? [...opts.choices] : null;
    if (choices && value && !choices.includes(data()[key])) choices.unshift(data()[key]);
    const control = choices
      ? `<select id="${id}" data-hospital-entry="${key}" class="hospital-entry-control" aria-describedby="${id}Error" ${opts.required ? 'aria-required="true"' : ""}><option value="">--- เลือก ---</option>${choices.map(function (choice) { return `<option value="${escapeHtml(choice)}" ${data()[key] === choice ? "selected" : ""}>${escapeHtml(choice)}</option>`; }).join("")}</select>`
      : opts.multiline
      ? `<textarea id="${id}" data-hospital-entry="${key}" rows="3" class="hospital-entry-control" aria-describedby="${id}Error" ${opts.required ? 'aria-required="true"' : ""}>${value}</textarea>`
      : `<input id="${id}" data-hospital-entry="${key}" type="${opts.type || "text"}" value="${value}" class="hospital-entry-control" aria-describedby="${id}Error" ${opts.required ? 'aria-required="true"' : ""}>`;
    return `<label class="hospital-entry-field ${opts.wide ? "hospital-entry-wide" : ""}" for="${id}"><span>${label}${required}</span>${control}<small id="${id}Error" class="hospital-entry-error" role="alert"></small></label>`;
  }
  function heading(icon, title) {
    return `<header class="hospital-entry-section-head"><span class="material-icons-round" aria-hidden="true">${icon}</span><h3>${title}</h3></header>`;
  }
  function options(name, values) {
    return values.map(function (item) {
      return `<label class="hospital-traffic-option"><input type="radio" name="${name}" data-hospital-entry="${name}" value="${item[0]}" ${data()[name] === item[0] ? "checked" : ""}><span>${item[1]}</span></label>`;
    }).join("");
  }
  function trafficField(label, key, multiline) {
    const id = "hospitalEntry" + key.charAt(0).toUpperCase() + key.slice(1);
    const value = escapeHtml(data()[key] || "");
    const control = multiline
      ? `<textarea id="${id}" data-hospital-entry="${key}" class="hospital-traffic-textarea" rows="3" placeholder="${label}" aria-required="true" aria-describedby="${id}Error">${value}</textarea>`
      : `<input id="${id}" data-hospital-entry="${key}" class="hospital-traffic-input" type="text" value="${value}" placeholder="โปรดระบุ" aria-required="true" aria-describedby="${id}Error">`;
    return `<label class="hospital-traffic-conditional" for="${id}"><span class="hospital-traffic-label">${label}<span class="hospital-traffic-required" aria-hidden="true">*</span></span>${control}<small id="${id}Error" class="hospital-entry-error hospital-traffic-error" role="alert"></small></label>`;
  }
  function renderSections() {
    const documentBox = document.getElementById("documentInlineBox");
    if (!documentBox) return;
    let host = document.getElementById("hospitalEntrySections");
    if (!host) {
      host = document.createElement("div");
      host.id = "hospitalEntrySections";
      host.className = "hospital-entry-sections";
      documentBox.insertAdjacentElement("beforebegin", host);
    }
    const current = data();
    host.innerHTML = `
      <section class="hospital-entry-section" aria-labelledby="hospitalEntryPhysicalTitle">
        ${heading("accessibility_new", "ข้อมูลกายภาพบำบัด")}
        <div class="hospital-entry-section-body">
          <label class="hospital-entry-check"><input type="checkbox" data-hospital-entry="isPhysicalTherapy" ${current.isPhysicalTherapy ? "checked" : ""}>เป็นการกายภาพบำบัด</label>
          <label class="hospital-entry-field" id="hospitalEntryNecessityWrap" for="hospitalEntryMedicalNecessity"><span>ความจำเป็นทางการแพทย์<span class="hospital-entry-required" aria-hidden="true">*</span></span>
            <select id="hospitalEntryMedicalNecessity" data-hospital-entry="medicalNecessity" class="hospital-entry-control" aria-required="true" aria-describedby="hospitalEntryMedicalNecessityError">
              <option value="">--- เลือก ---</option>
              <option value="PAIN_MANAGEMENT" ${current.medicalNecessity === "PAIN_MANAGEMENT" ? "selected" : ""}>การบรรเทาและลดอาการปวด</option>
              <option value="RESTORING_MOBILITY" ${current.medicalNecessity === "RESTORING_MOBILITY" ? "selected" : ""}>การเพิ่มและฟื้นฟูการเคลื่อนไหว</option>
              <option value="POST_INJURY_POST_SURGICAL_REHAB" ${current.medicalNecessity === "POST_INJURY_POST_SURGICAL_REHAB" ? "selected" : ""}>การฟื้นฟูผู้ป่วยหลังการบาดเจ็บหรือผ่าตัด</option>
            </select><small id="hospitalEntryMedicalNecessityError" class="hospital-entry-error" role="alert"></small>
          </label>
        </div>
      </section>
      <section class="hospital-traffic-section hospital-entry-traffic-section" aria-labelledby="hospitalEntryTrafficTitle">
        <div class="hospital-traffic-head"><div class="hospital-traffic-title-wrap"><span class="hospital-traffic-title-icon"><span class="material-icons-round" aria-hidden="true">directions_car</span></span><div><h3 class="hospital-traffic-title" id="hospitalEntryTrafficTitle">ข้อมูลอุบัติเหตุจากการจราจร</h3><p class="hospital-traffic-subtitle">ข้อมูลประกอบการพิจารณาสิทธิ์จากอุบัติเหตุทางถนน</p></div></div></div>
        <fieldset class="hospital-traffic-filter" data-required-group="isTrafficAccident"><legend>เป็นอุบัติเหตุจากการจราจร <span class="hospital-traffic-required" aria-hidden="true">*</span></legend><div class="hospital-traffic-filter-options">${options("isTrafficAccident", [["yes", "ใช่"], ["no", "ไม่ใช่"]])}</div><small class="hospital-entry-error hospital-traffic-error" role="alert"></small></fieldset>
        <div id="hospitalEntryTrafficDetails" class="hospital-traffic-body">
          <fieldset class="hospital-traffic-group" data-required-group="vehicle"><legend>ประเภทยานพาหนะ <span class="hospital-traffic-required" aria-hidden="true">*</span></legend><div class="hospital-traffic-options">${options("vehicle", [["motorcycle", "มอเตอร์ไซค์"], ["car", "รถยนต์"], ["other", "อื่นๆ"]])}</div>${trafficField("โปรดระบุ", "vehicleOther", false)}<small class="hospital-entry-error hospital-traffic-error" role="alert"></small></fieldset>
          <fieldset class="hospital-traffic-group" data-required-group="casualty"><legend>ผู้ขับขี่ หรือ ผู้โดยสาร <span class="hospital-traffic-required" aria-hidden="true">*</span></legend><div class="hospital-traffic-options">${options("casualty", [["driver", "ผู้ขับขี่"], ["passenger", "ผู้โดยสาร"]])}</div><div class="hospital-traffic-reminder" role="status"><span class="material-icons-round" aria-hidden="true">info</span><span>กรุณาตรวจสอบผลตรวจแอลกอฮอล์ประกอบการพิจารณาเคลม</span></div><small class="hospital-entry-error hospital-traffic-error" role="alert"></small></fieldset>
          <fieldset class="hospital-traffic-group" data-required-group="poroboExcess"><legend>เป็นส่วนเกิน พ.ร.บ. <span class="hospital-traffic-required" aria-hidden="true">*</span></legend><div class="hospital-traffic-options">${options("poroboExcess", [["yes", "ใช่"], ["no", "ไม่ใช่"]])}</div>${trafficField("โปรดระบุสาเหตุที่ไม่ใช้ พ.ร.บ.", "noPoroboReason", true)}<small class="hospital-entry-error hospital-traffic-error" role="alert"></small></fieldset>
        </div>
      </section>
      <section class="hospital-entry-section" aria-labelledby="hospitalEntryConsiderationTitle">
        ${heading("fact_check", "ข้อมูลประกอบการพิจารณา")}
        <div class="hospital-entry-section-body hospital-entry-grid">
          ${field("HN", "hn", { required:true })}
          ${field("รายละเอียดเพิ่มเติม", "considerationDetails", { wide:true, multiline:true })}
        </div>
      </section>
      <section class="hospital-entry-section" aria-labelledby="hospitalEntryDoctorTitle">
        ${heading("medical_services", "แพทย์เจ้าของไข้")}
        <div class="hospital-entry-section-body hospital-entry-grid">
          ${field("เลขใบประกอบวิชาชีพเวชกรรม", "doctorLicense", { required:true })}
          ${field("แพทย์(ชื่อ-สกุล)", "doctorName", { required:true })}
        </div>
      </section>`;
    ["Physical", "Traffic", "Consideration", "Doctor"].forEach(function (name) {
      host.querySelector(`section[aria-labelledby="hospitalEntry${name}Title"] h3`).id = `hospitalEntry${name}Title`;
    });
    updateConditionalFields();
  }
  function updateConditionalFields() {
    const current = data();
    const necessity = document.getElementById("hospitalEntryNecessityWrap");
    const traffic = document.getElementById("hospitalEntryTrafficDetails");
    if (necessity) necessity.hidden = !current.isPhysicalTherapy;
    if (traffic) traffic.hidden = current.isTrafficAccident !== "yes";
    const other = document.getElementById("hospitalEntryVehicleOther")?.closest("label");
    const reason = document.getElementById("hospitalEntryNoPoroboReason")?.closest("label");
    const reminder = traffic?.querySelector(".hospital-traffic-reminder");
    if (other) other.hidden = current.vehicle !== "other";
    if (reason) reason.hidden = current.poroboExcess !== "no";
    if (reminder) reminder.hidden = current.isTrafficAccident !== "yes" || current.casualty !== "driver";
  }
  function stayNumber(value) {
    const raw = String(value ?? "").trim();
    if (!/^\d+$/.test(raw)) return null;
    const number = Number(raw);
    return Number.isSafeInteger(number) ? number : null;
  }
  function updateStayTotal() {
    const current = data();
    const ipd = stayNumber(current.ipdDays);
    const icu = stayNumber(current.icuDays);
    const total = ipd !== null && icu !== null && Number.isSafeInteger(ipd + icu) ? ipd + icu : null;
    current.totalStayDays = total === null ? "" : String(total);
    const output = document.getElementById("hospitalEntryTotalStayDays");
    if (output) output.value = current.totalStayDays;
    const displays = [
      ["hospitalEntryIpdDaysDisplay", ipd],
      ["hospitalEntryIcuDaysDisplay", icu],
      ["hospitalEntryTotalStayDaysDisplay", total]
    ];
    displays.forEach(function (item) {
      const display = document.getElementById(item[0]);
      if (display) display.textContent = item[1] === null ? "0" : String(item[1]);
    });
  }
  function renderStayFields() {
    const dateHost = document.getElementById("dateFields");
    if (!dateHost) return;
    let host = document.getElementById("hospitalEntryStayFields");
    if (state().subType !== "IPD") {
      host?.remove();
      delete data().ipdDays;
      delete data().icuDays;
      delete data().totalStayDays;
      return;
    }
    if (!host) {
      host = document.createElement("div");
      host.id = "hospitalEntryStayFields";
      host.className = "hospital-entry-stay-fields";
      dateHost.insertAdjacentElement("afterend", host);
    }
    const current = data();
    host.innerHTML = `
      <div class="claim-ipd-stay-summary-grid" aria-label="สรุปจำนวนวันนอน IPD">
        <div class="claim-ipd-stay-card ipd"><div class="claim-ipd-stay-card-top"><span class="claim-ipd-stay-icon"><span class="material-icons-round" aria-hidden="true">hotel</span></span><span class="claim-ipd-stay-chip">IPD</span></div><div id="hospitalEntryIpdDaysDisplay" class="claim-ipd-stay-number">0</div><div class="claim-ipd-stay-label">วัน IPD</div><div class="claim-ipd-stay-hint">จำนวนวันนอนรักษาในโรงพยาบาล</div></div>
        <div class="claim-ipd-stay-card icu"><div class="claim-ipd-stay-card-top"><span class="claim-ipd-stay-icon"><span class="material-icons-round" aria-hidden="true">medical_services</span></span><span class="claim-ipd-stay-chip">ICU</span></div><div id="hospitalEntryIcuDaysDisplay" class="claim-ipd-stay-number">0</div><div class="claim-ipd-stay-label">วัน ICU</div><div class="claim-ipd-stay-hint">จำนวนวันที่พักรักษาในหอผู้ป่วยวิกฤต</div></div>
        <div class="claim-ipd-stay-card total"><div class="claim-ipd-stay-card-top"><span class="claim-ipd-stay-icon"><span class="material-icons-round" aria-hidden="true">bedtime</span></span><span class="claim-ipd-stay-chip">รวม</span></div><div id="hospitalEntryTotalStayDaysDisplay" class="claim-ipd-stay-number">0</div><div class="claim-ipd-stay-label">วันที่นอน</div><div class="claim-ipd-stay-hint">จำนวนวันที่ใช้ประกอบการพิจารณา</div></div>
      </div>
      <div class="claim-ipd-stay-input-grid">
        <label class="hospital-entry-stay-field" for="hospitalEntryIpdDays"><span class="claim-ipd-stay-input-label">จำนวนวัน IPD <span class="hospital-entry-required" aria-hidden="true">*</span></span><input id="hospitalEntryIpdDays" data-hospital-entry="ipdDays" class="claim-ipd-stay-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(current.ipdDays ?? "")}" aria-label="จำนวนวันนอน IPD" aria-required="true" aria-describedby="hospitalEntryIpdDaysError"><small id="hospitalEntryIpdDaysError" class="hospital-entry-error" role="alert"></small></label>
        <label class="hospital-entry-stay-field" for="hospitalEntryIcuDays"><span class="claim-ipd-stay-input-label">จำนวนวัน ICU <span class="hospital-entry-required" aria-hidden="true">*</span></span><input id="hospitalEntryIcuDays" data-hospital-entry="icuDays" class="claim-ipd-stay-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(current.icuDays ?? "")}" aria-label="จำนวนวันนอน ICU" aria-required="true" aria-describedby="hospitalEntryIcuDaysError"><small id="hospitalEntryIcuDaysError" class="hospital-entry-error" role="alert"></small></label>
        <label class="hospital-entry-stay-field" for="hospitalEntryTotalStayDays"><span class="claim-ipd-stay-input-label">จำนวนวันนอน</span><input id="hospitalEntryTotalStayDays" class="claim-ipd-stay-input readonly" type="text" readonly aria-readonly="true" aria-label="จำนวนวันนอนรวม" value=""></label>
      </div>`;
    updateStayTotal();
  }
  function validateStayDays(shouldFocus) {
    if (state().subType !== "IPD") return true;
    let firstInvalid = null;
    ["IpdDays", "IcuDays"].forEach(function (name) {
      const control = document.getElementById("hospitalEntry" + name);
      if (!control) return;
      const invalid = stayNumber(control.value) === null;
      control.setAttribute("aria-invalid", String(invalid));
      const error = document.getElementById(control.id + "Error");
      if (error) error.textContent = invalid ? "กรุณาระบุจำนวนวันนอนเป็นตัวเลขจำนวนเต็ม ไม่มีทศนิยม" : "";
      if (invalid && !firstInvalid) firstInvalid = control;
    });
    updateStayTotal();
    if (firstInvalid && shouldFocus) {
      firstInvalid.scrollIntoView({ behavior:"smooth", block:"center" });
      firstInvalid.focus({ preventScroll:true });
    }
    return !firstInvalid;
  }
  function renderStep(targetId, active) {
    const host = document.getElementById(targetId);
    if (!host) return;
    host.classList.remove("hidden");
    host.innerHTML = `<nav class="hospital-entry-stepper" aria-label="ขั้นตอนการแจ้งเคลมโรงพยาบาล">${[
      "บันทึกข้อมูลเคลม", "รายละเอียดค่าใช้จ่าย", "สรุปรายการเคลม"
    ].map(function (label, index) {
      const current = index + 1 === active;
      return `<div class="hospital-entry-step${current ? " is-current" : ""}" ${current ? 'aria-current="step"' : ""}><span class="hospital-entry-step-dot">${index + 1}</span><span>${label}</span></div>`;
    }).join("")}</nav>`;
  }
  function render() {
    const hospital = state().claimCategory === "hospital";
    page.classList.toggle("hospital-entry-mode", hospital);
    if (!hospital) {
      document.getElementById("hospitalEntrySections")?.remove();
      const step = document.getElementById("claimStepper");
      if (step) { step.classList.add("hidden"); step.innerHTML = ""; }
      return;
    }
    renderStep("claimStepper", 1);
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "แจ้งเคลม รพ. - " + (state().row?.product || "PH");
    if (subtitle) subtitle.textContent = "บันทึกเคลม/ค้นหาผู้เอาประกัน";

    const dateHost = document.getElementById("dateFields");
    if (dateHost && typeof window.renderClaimDateField === "function") {
      const current = data();
      dateHost.innerHTML = [
        window.renderClaimDateField("received", "วันที่แจ้ง"),
        window.renderClaimDateField("incident", "วันที่เกิดเหตุ"),
        field("เวลาที่เกิดเหตุ", "incidentTime", { type:"time", required:true }),
        window.renderClaimDateField("admit", "วันที่เข้า รพ."),
        field("เวลาที่เข้า รพ.", "admitTime", { type:"time", required:true }),
        window.renderClaimDateField("discharge", "วันที่ออก รพ."),
        field("เวลาที่ออก รพ.", "dischargeTime", { type:"time", required:true })
      ].join("");
      if (!current.incidentTime) current.incidentTime = "";
    }
    renderStayFields();
    const diagnosis = document.getElementById("diagnosisFields");
    if (diagnosis) {
      diagnosis.classList.remove("hidden");
      diagnosis.innerHTML = `<div class="hospital-entry-grid">
        ${field("อาการสำคัญ", "chiefComplaint", { wide:true, required:true, choices:["0024:ไข้ + ปวดท้อง", "0150 : สุนัขกัด", "ปวดท้องเฉียบพลัน", "บาดเจ็บจากอุบัติเหตุ", "ติดตามอาการต่อเนื่อง"] })}
        ${field("การวินิจฉัย1(Diagnosis1)", "diagnosis1", { wide:true, required:true, choices:["A050 : Food-borne staphylococcal intoxication | อาหารเป็นพิษจากเชื้อสแตฟิโลคอคคัส", "W540 : Bitten or struck by dog: at home | ถูกสุนัขกัดหรือทำร้าย ที่บ้าน", "A01:Typhoid and paratyphoid fevers | ไข้รากสาดน้อย(ไทฟอยด์)และไข้รากสาดเทียม(พาราไทฟอยด์)"] })}
        ${field("การวินิจฉัย2(Diagnosis2)", "diagnosis2", { wide:true, choices:["A09:Other gastroenteritis and colitis of infectious and unspecified origin | ลำไส้อักเสบจากการติดเชื้อ", "S61:Open wound of wrist and hand | แผลเปิดบริเวณข้อมือและมือ"] })}
        ${field("การวินิจฉัย3(Diagnosis3)", "diagnosis3", { wide:true, choices:["R10:Abdominal and pelvic pain | ปวดท้องและอุ้งเชิงกราน", "Z09:Follow-up examination after treatment | ตรวจติดตามหลังการรักษา"] })}
        ${field("รายละเอียดการเจ็บป่วย/การบาดเจ็บ", "medicalDescription", { wide:true, multiline:true })}
        ${field("หมายเหตุ(ถ้ามี)", "note", { wide:true, multiline:true })}
      </div>`;
    }
    renderSections();
    const documentHeader = document.getElementById("documentInlineHeader");
    if (documentHeader) documentHeader.innerHTML = String(state().paPrimaryRow?.product || state().row?.product || "PH").toUpperCase() === "PH"
      ? '<h3 class="flex items-center gap-2 text-2xl font-extrabold"><span class="material-icons-round text-brand-700" aria-hidden="true">subject</span>สแกนเอกสาร</h3>'
      : '<h3 class="flex items-center gap-2 text-2xl font-extrabold"><span class="material-icons-round text-brand-700" aria-hidden="true">document_scanner</span>สแกนเอกสาร</h3>';
    renderDocument();
  }
  function renderDocument() {
    if (state().claimCategory !== "hospital") return;
    const content = document.getElementById("documentInlineContent");
    if (!content) return;
    const files = data().documents || [];
    state().scanned ||= {};
    state().scanned.other = files.length > 0;
    if (String(state().paPrimaryRow?.product || state().row?.product || "PH").toUpperCase() === "PH") {
      content.innerHTML = `<div class="hospital-entry-doc-check"><div class="hospital-entry-doc-table-wrap"><table class="hospital-entry-doc-table"><thead><tr><th scope="col">รายการเอกสาร</th><th scope="col">สแกนเอกสาร</th><th scope="col">จำนวนเอกสาร</th><th scope="col">รายละเอียด</th></tr></thead><tbody><tr><th scope="row">เอกสารประกอบการพิจารณา รพ.</th><td><button type="button" class="hospital-entry-doc-scan" data-hospital-document-scan><span class="material-icons-round" aria-hidden="true">scanner</span>สแกนเอกสาร</button></td><td><span class="hospital-entry-doc-count">${files.length}</span></td><td><button type="button" class="hospital-entry-doc-view" data-hospital-document-view aria-label="ดูรายละเอียดเอกสารประกอบการพิจารณา รพ." aria-controls="hospitalEntryDocumentDetails" aria-expanded="false" title="ดูรายละเอียด"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr><tr id="hospitalEntryDocumentDetails" class="hospital-entry-doc-details" hidden><td colspan="4">${files.length ? `<ul class="hospital-entry-file-list" aria-label="ไฟล์เอกสารที่แนบ">${files.map(function (file, index) { return `<li><span class="material-icons-round" aria-hidden="true">attach_file</span><span>${escapeHtml(file.name)}</span><button type="button" data-hospital-document-remove="${index}" aria-label="นำไฟล์ ${escapeHtml(file.name)} ออก">นำออก</button></li>`; }).join("")}</ul>` : "ยังไม่ได้แนบเอกสาร"}</td></tr></tbody></table></div><input type="file" data-hospital-document-input accept=".pdf,.doc,.docx,image/*" multiple hidden></div>`;
      return;
    }
    content.innerHTML = `<div class="hospital-entry-document"><span class="material-icons-round" aria-hidden="true">description</span><div><strong>เอกสารประกอบการพิจารณา</strong><span>${files.length ? `แนบแล้ว ${files.length} ไฟล์` : "ยังไม่ได้แนบเอกสาร"}</span></div><button type="button" data-hospital-document-scan>สแกนเอกสาร</button><input type="file" data-hospital-document-input accept=".pdf,.doc,.docx,image/*" multiple hidden></div>${files.length ? `<ul class="hospital-entry-file-list" aria-label="ไฟล์เอกสารที่แนบ">${files.map(function (file, index) { return `<li><span class="material-icons-round" aria-hidden="true">attach_file</span><span>${escapeHtml(file.name)}</span><button type="button" data-hospital-document-remove="${index}" aria-label="นำไฟล์ ${escapeHtml(file.name)} ออก">นำออก</button></li>`; }).join("")}</ul>` : ""}`;
  }
  function validate() {
    if (state().claimCategory !== "hospital") return true;
    let firstInvalid = null;
    function check(control, required) {
      if (!control) return;
      const invalid = required && !String(control.value || "").trim();
      control.setAttribute("aria-invalid", String(invalid));
      const error = document.getElementById(control.id + "Error");
      if (error) error.textContent = invalid ? "กรุณาระบุ" + control.closest("label")?.querySelector("span:first-child")?.textContent.replace(/\*$/, "") : "";
      if (invalid && !firstInvalid) firstInvalid = control;
    }
    ["IncidentTime", "AdmitTime", "DischargeTime", "ChiefComplaint", "Diagnosis1", "Hn", "DoctorLicense", "DoctorName"].forEach(function (name) {
      check(document.getElementById("hospitalEntry" + name), true);
    });
    check(document.getElementById("hospitalEntryMedicalNecessity"), Boolean(data().isPhysicalTherapy));
    function checkGroup(key, required) {
      const group = page.querySelector(`[data-required-group="${key}"]`);
      if (!group) return;
      const invalid = required && !data()[key];
      group.classList.toggle("is-invalid", invalid);
      const error = group.querySelector(":scope > .hospital-entry-error");
      if (error) error.textContent = invalid ? "กรุณาระบุ" + group.querySelector("legend")?.textContent.replace(/\*$/, "") : "";
      if (invalid && !firstInvalid) firstInvalid = group.querySelector("input");
    }
    checkGroup("isTrafficAccident", true);
    const traffic = data().isTrafficAccident === "yes";
    checkGroup("vehicle", traffic);
    check(document.getElementById("hospitalEntryVehicleOther"), traffic && data().vehicle === "other");
    checkGroup("casualty", traffic);
    checkGroup("poroboExcess", traffic);
    check(document.getElementById("hospitalEntryNoPoroboReason"), traffic && data().poroboExcess === "no");
    const stayValid = validateStayDays(false);
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior:"smooth", block:"center" });
      firstInvalid.focus({ preventScroll:true });
    }
    return !firstInvalid && stayValid;
  }
  page.addEventListener("input", function (event) {
    const key = event.target.dataset?.hospitalEntry;
    if (!key || event.target.type === "checkbox" || event.target.type === "radio") return;
    data()[key] = event.target.value;
    if (key === "ipdDays" || key === "icuDays") updateStayTotal();
    event.target.setAttribute("aria-invalid", "false");
    const error = document.getElementById(event.target.id + "Error");
    if (error) error.textContent = "";
  });
  page.addEventListener("change", function (event) {
    if (event.target.matches("[data-hospital-document-input]")) {
      const selected = Array.from(event.target.files || []);
      const files = data().documents ||= [];
      files.push(...selected);
      renderDocument();
      return;
    }
    const key = event.target.dataset?.hospitalEntry;
    if (!key) return;
    data()[key] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (event.target.type === "radio") {
      const group = event.target.closest("[data-required-group]");
      group?.classList.remove("is-invalid");
      const error = group?.querySelector(":scope > .hospital-entry-error");
      if (error) error.textContent = "";
    }
    updateConditionalFields();
  });
  page.addEventListener("click", function (event) {
    const scan = event.target.closest("[data-hospital-document-scan]");
    if (state().claimCategory === "hospital" && scan) {
      page.querySelector("[data-hospital-document-input]")?.click();
      return;
    }
    const view = event.target.closest("[data-hospital-document-view]");
    if (state().claimCategory === "hospital" && view) {
      const details = document.getElementById("hospitalEntryDocumentDetails");
      if (details) { details.hidden = !details.hidden; view.setAttribute("aria-expanded", String(!details.hidden)); }
      return;
    }
    const remove = event.target.closest("[data-hospital-document-remove]");
    if (state().claimCategory === "hospital" && remove) {
      data().documents?.splice(Number(remove.dataset.hospitalDocumentRemove), 1);
      renderDocument();
      return;
    }
    if (state().claimCategory !== "hospital" || !event.target.closest("#claimEntryNextBtn")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!validateStayDays(true)) return;
    window.showPaymentPage?.();
  }, true);
  window.renderHospitalClaimEntryForm = render;
  window.renderHospitalClaimEntryStep = renderStep;
  window.validateHospitalClaimEntryForm = validate;
})();
