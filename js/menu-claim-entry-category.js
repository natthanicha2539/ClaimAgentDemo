/* ============================================================
   menu-claim-entry-category.js
   แจ้งเคลม: เลือกเคลมลูกค้า/โรงพยาบาล และส่งคิวพิจารณา รพ.
   ============================================================ */
(function () {
  "use strict";

  const CUSTOMER = "customer";
  const HOSPITAL = "hospital";
  const MEDICAL_COVERAGE = "ค่ารักษา";
  const HOSPITALS = [
    "โรงพยาบาลมะการักษ์",
    "โรงพยาบาลกรุงเทพ",
    "โรงพยาบาลวิภารามพัฒนาการ",
    "โรงพยาบาลพญาไท 2",
    "โรงพยาบาลสมิติเวช สุขุมวิท",
    "โรงพยาบาลพระรามเก้า",
    "โรงพยาบาลบำรุงราษฎร์",
    "โรงพยาบาลนนทเวช",
    "โรงพยาบาลเกษมราษฎร์ ประชาชื่น",
    "โรงพยาบาลตัวอย่าง"
  ];

  function state() {
    return window.claimState || {};
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseAmount(value) {
    if (typeof window.parseMoney === "function") return Number(window.parseMoney(value || 0)) || 0;
    return Number(String(value || 0).replace(/,/g, "")) || 0;
  }

  function money(value) {
    if (typeof window.formatMoney === "function") return window.formatMoney(parseAmount(value));
    return parseAmount(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function currentProduct() {
    const row = state().paPrimaryRow || state().row || {};
    return String(row.product || "PH").toUpperCase() === "PA" ? "PA" : "PH";
  }

  function isHospitalClaim() {
    return state().claimCategory === HOSPITAL;
  }

  function ensureStateDefaults() {
    const current = state();
    if (!current.claimCategory) current.claimCategory = CUSTOMER;
    if (typeof current.hospitalName !== "string") current.hospitalName = "";
    if (typeof current.createdHospitalConsiderationClaimCode !== "string") {
      current.createdHospitalConsiderationClaimCode = "";
    }
    return current;
  }

  function assignGlobal(name, value) {
    window[name] = value;
    try {
      window.eval(name + " = window['" + name + "']");
    } catch (_error) {}
  }

  function claimCategoryMarkup() {
    return `
      <section id="claimCategorySection" class="claim-option-section claim-category-section rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div class="claim-option-title mb-3 flex items-center gap-2">
          <span class="step-dot grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-base font-extrabold text-white">1</span>
          <span class="step-title text-xl font-extrabold text-slate-700">ประเภทเคลม<span class="text-danger">*</span></span>
        </div>
        <div class="claim-category-options" role="radiogroup" aria-label="ประเภทเคลม">
          <label class="choice-card claim-category-card" data-claim-category-card="${CUSTOMER}">
            <input class="sr-only claim-category-input" type="radio" name="claimCategory" value="${CUSTOMER}">
            <div class="flex items-center gap-3">
              <span class="choice-icon"><span class="material-icons-round" aria-hidden="true">person</span></span>
              <span class="choice-title-sm font-extrabold text-slate-700">เคลมลูกค้า</span>
            </div>
          </label>
          <label class="choice-card claim-category-card" data-claim-category-card="${HOSPITAL}">
            <input class="sr-only claim-category-input" type="radio" name="claimCategory" value="${HOSPITAL}">
            <div class="flex items-center gap-3">
              <span class="choice-icon"><span class="material-icons-round" aria-hidden="true">local_hospital</span></span>
              <span class="choice-title-sm font-extrabold text-slate-700">เคลมโรงพยาบาล</span>
            </div>
          </label>
        </div>
      </section>`;
  }

  function ensureCategorySection() {
    const incident = document.getElementById("incidentCauseRadios");
    const firstSection = incident?.closest("section");
    if (!firstSection) return null;
    let section = document.getElementById("claimCategorySection");
    if (!section) {
      firstSection.insertAdjacentHTML("beforebegin", claimCategoryMarkup());
      section = document.getElementById("claimCategorySection");
    }
    if (section && !section.dataset.bound) {
      section.dataset.bound = "true";
      section.addEventListener("change", function (event) {
        const input = event.target.closest(".claim-category-input");
        if (!input || !input.checked) return;
        changeClaimCategory(input.value);
      });
    }
    syncCategoryCards();
    renumberClaimSections();
    return section;
  }

  function syncCategoryCards() {
    const selected = ensureStateDefaults().claimCategory;
    document.querySelectorAll("#claimCategorySection .claim-category-input").forEach(function (input) {
      const cardValue = input.closest(".claim-category-card")?.dataset.claimCategoryCard;
      if (cardValue) input.value = cardValue;
      input.checked = input.value === selected;
      input.closest(".claim-category-card")?.classList.toggle("active", input.checked);
      const title = input.closest(".claim-category-card")?.querySelector(".choice-title-sm");
      title?.classList.toggle("text-brand-700", input.checked);
      title?.classList.toggle("text-slate-700", !input.checked);
    });
  }

  function renumberClaimSections() {
    const stack = document.querySelector("#claimEntryPage .claim-option-stack");
    if (!stack) return;
    Array.from(stack.querySelectorAll(":scope > section .step-dot")).forEach(function (dot, index) {
      dot.textContent = String(index + 1);
    });
  }

  function clearConditionalClaimState(nextCategory) {
    const current = state();
    current.claimCategory = nextCategory;
    current.coverageType = nextCategory === HOSPITAL ? MEDICAL_COVERAGE : "";
    current.claimType = "";
    current.subType = "";
    current.hospitalMode = nextCategory === HOSPITAL ? "specified" : "";
    current.hospitalName = "";
    current.transferAmount = "";
    current.phIpdAmounts = {};
    current.phIpdTransferTotal = 0;
    current.deathExtras = [];
    current.paDeathAmounts = {};
    current.scanned = { idcard: false, receipt: false, medcert: false, other: false };
    current.createdConsiderationClaimCode = "";
    current.createdHospitalConsiderationClaimCode = "";
  }

  function changeClaimCategory(value) {
    const next = value === HOSPITAL ? HOSPITAL : CUSTOMER;
    if (state().claimCategory === next) return;
    clearConditionalClaimState(next);
    if (typeof window.clearClaimSelectionValidation === "function") window.clearClaimSelectionValidation();
    if (typeof window.renderClaimEntry === "function") window.renderClaimEntry();
  }

  function renderLockedCoverage() {
    const box = document.getElementById("coverageTypeRadios");
    if (!box) return;
    state().coverageType = MEDICAL_COVERAGE;
    box.innerHTML = `
      <label class="choice-card active hospital-coverage-locked md:col-span-2 xl:col-span-4" aria-disabled="true">
        <input class="sr-only" type="radio" name="coverageType" value="${MEDICAL_COVERAGE}" checked disabled>
        <div class="flex items-center gap-3">
          <span class="choice-icon"><span class="material-icons-round" aria-hidden="true">medical_services</span></span>
          <div>
            <div class="choice-title-sm text-2xl font-extrabold text-brand-700">ค่ารักษา</div>
            <div class="choice-desc-sm text-base font-semibold text-slate-500">กำหนดอัตโนมัติสำหรับเคลมโรงพยาบาล</div>
          </div>
        </div>
      </label>`;
  }

  function hospitalTreatmentOptions() {
    const options = ["OPD", "IPD"];
    if (currentProduct() === "PH") options.push("Day Case Surgery");
    return options;
  }

  function renderHospitalTreatments() {
    const current = state();
    const title = document.getElementById("claimSubTitle");
    const box = document.getElementById("claimSubRadios");
    if (!box) return;
    if (title) title.innerHTML = `ประเภทการรักษา<span class="text-danger">*</span>`;

    if (!current.incidentCause) {
      current.subType = "";
      current.claimType = "";
      box.innerHTML = '<div class="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-3 text-xl font-bold text-slate-400">กรุณาเลือกเหตุของการเคลมก่อน</div>';
      return;
    }

    const allowed = hospitalTreatmentOptions();
    if (!allowed.includes(current.subType)) {
      current.subType = "";
      current.claimType = "";
    }
    box.innerHTML = allowed.map(function (value) {
      const active = current.subType === value;
      return `<label class="cursor-pointer rounded-xl border px-5 py-3 text-xl font-extrabold shadow-sm transition ${active ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50"}">
        <input class="sr-only hospital-treatment-input" type="radio" name="claimSub" value="${value}" ${active ? "checked" : ""}>
        ${value}
      </label>`;
    }).join("");

    box.querySelectorAll(".hospital-treatment-input").forEach(function (input) {
      input.addEventListener("change", function (event) {
        if (!event.target.checked) return;
        if (typeof window.clearClaimSelectionValidation === "function") window.clearClaimSelectionValidation();
        current.subType = event.target.value;
        current.claimType = event.target.value;
        current.scanned = { idcard: false, receipt: false, medcert: false, other: false };
        if (typeof window.renderClaimEntry === "function") window.renderClaimEntry();
      });
    });
  }

  function hospitalOptionsMarkup(selected) {
    const values = HOSPITALS.slice();
    if (selected && !values.includes(selected)) values.unshift(selected);
    return '<option value="">--- เลือกโรงพยาบาล ---</option>' + values.map(function (name) {
      return `<option value="${escapeHtml(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`;
    }).join("");
  }

  function renderHospitalFacility() {
    const host = document.getElementById("hospitalFields");
    if (!host) return;
    const selected = state().hospitalName || "";
    host.innerHTML = `
      <label class="hospital-facility-field md:col-span-3" for="claimHospitalSelect">
        <span class="text-lg font-bold text-slate-500">สถานพยาบาล<span class="text-danger">*</span></span>
        <select id="claimHospitalSelect" class="claim-standard-field mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-[17px] font-medium text-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" aria-describedby="claimHospitalHelp claimHospitalError">
          ${hospitalOptionsMarkup(selected)}
        </select>
        <span id="claimHospitalHelp" class="hospital-facility-help"><span class="hospital-facility-help-icon material-icons-round" aria-hidden="true">info</span><span>ข้อมูลนี้จะถูกส่งไปยังคิวพิจารณาเคลมโรงพยาบาล</span></span>
        <span id="claimHospitalError" class="hospital-facility-error hidden" role="alert" aria-live="polite"></span>
      </label>`;
    document.getElementById("claimHospitalSelect")?.addEventListener("change", function (event) {
      state().hospitalName = event.target.value;
      validateHospitalFacility(false);
    });
  }

  function validateHospitalFacility(shouldFocus) {
    if (!isHospitalClaim()) return true;
    const select = document.getElementById("claimHospitalSelect");
    const error = document.getElementById("claimHospitalError");
    if (!select) return false;
    const invalid = !String(select.value || state().hospitalName || "").trim();
    select.setAttribute("aria-invalid", String(invalid));
    if (error) {
      error.textContent = invalid ? "กรุณาเลือกสถานพยาบาลก่อนดำเนินการต่อ" : "";
      error.classList.toggle("hidden", !invalid);
    }
    if (!invalid) state().hospitalName = select.value;
    if (invalid && shouldFocus) {
      select.scrollIntoView({ behavior: "smooth", block: "center" });
      select.focus({ preventScroll: true });
    }
    return !invalid;
  }

  function selectedSymptom() {
    const source = state().row || {};
    const mode = document.querySelector('input[name="symptomMode"]:checked')?.value;
    if (mode === "other") return document.getElementById("symptomOtherNote")?.value || source.chiefComplaint || "-";
    return document.getElementById("symptomSelect")?.value || source.chiefComplaint || "-";
  }

  function hospitalClaimAmount() {
    const current = state();
    return parseAmount(current.phIpdTransferTotal || current.transferAmount || document.getElementById("transferAmount")?.value || 0);
  }

  function renderHospitalConfirmation() {
    const current = state();
    const row = current.paPrimaryRow || current.row || {};
    const amount = hospitalClaimAmount();
    current.transferAmount = amount;
    document.getElementById("paymentPage")?.classList.remove("ph-confirm-page");
    const title = document.getElementById("paymentTitle");
    if (title) title.innerHTML = '<span class="material-icons-round text-brand-700" aria-hidden="true">fact_check</span>ยืนยันข้อมูลเคลมโรงพยาบาล';
    const content = document.getElementById("paymentContent");
    if (content) {
      content.innerHTML = `
        <div class="space-y-4">
          <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card" aria-labelledby="hospitalConfirmHeading">
            <header class="border-l-4 border-brand-500 bg-brand-50 px-5 py-3">
              <h3 id="hospitalConfirmHeading" class="flex items-center gap-2 text-2xl font-extrabold text-slate-800"><span class="material-icons-round text-brand-700" aria-hidden="true">local_hospital</span>ข้อมูลเคลมโรงพยาบาล</h3>
            </header>
            <div class="hospital-confirm-summary-grid">
              <div class="hospital-confirm-summary-item"><div class="hospital-confirm-label">Application ID</div><div class="hospital-confirm-value is-primary">${escapeHtml(row.appId || "-")}</div></div>
              <div class="hospital-confirm-summary-item is-wide"><div class="hospital-confirm-label">ชื่อผู้เอาประกัน</div><div class="hospital-confirm-value">${escapeHtml(row.name || "-")}</div></div>
              <div class="hospital-confirm-summary-item"><div class="hospital-confirm-label">ประเภทเคลม</div><div class="hospital-confirm-value">เคลมโรงพยาบาล</div></div>
              <div class="hospital-confirm-summary-item"><div class="hospital-confirm-label">เหตุของการเคลม</div><div class="hospital-confirm-value">${escapeHtml(current.incidentCause || "-")}</div></div>
              <div class="hospital-confirm-summary-item"><div class="hospital-confirm-label">ประเภทความคุ้มครอง</div><div class="hospital-confirm-value">${MEDICAL_COVERAGE}</div></div>
              <div class="hospital-confirm-summary-item"><div class="hospital-confirm-label">ประเภทการรักษา</div><div class="hospital-confirm-value is-primary">${escapeHtml(current.subType || "-")}</div></div>
              <div class="hospital-confirm-summary-item is-wide"><div class="hospital-confirm-label">สถานพยาบาล</div><div class="hospital-confirm-value">${escapeHtml(current.hospitalName || "-")}</div></div>
              <div class="hospital-confirm-summary-item is-full"><div class="hospital-confirm-label">ยอดเคลม</div><div class="hospital-confirm-value is-primary">${money(amount)} บาท</div></div>
            </div>
          </section>
          <div class="hospital-confirm-note"><span class="material-icons-round" aria-hidden="true">info</span><span>เมื่อกด “ส่งตรวจสอบ” ระบบจะสร้างเลขที่ Claim/Case และส่งรายการไปยังหน้าพิจารณาเคลมโรงพยาบาล โดยยังไม่มีการโอนเงิน</span></div>
        </div>`;
    }
    const button = document.getElementById("primaryActionBtn");
    if (button) {
      button.innerHTML = '<span class="material-icons-round align-middle" aria-hidden="true">fact_check</span> ส่งตรวจสอบ';
      button.onclick = window.submitHospitalClaimForConsideration;
    }
  }

  function formatSavedDate(date) {
    if (typeof window.formatSavedClaimDateTime === "function") return window.formatSavedClaimDateTime(date);
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date).reduce(function (result, part) {
      result[part.type] = part.value;
      return result;
    }, {});
    return `${parts.day}/${parts.month}/${Number(parts.year) + 543} ${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function stayDays(current) {
    const source = current.row || {};
    const admitValue = current.claimDates?.admit || source.admitDate;
    const dischargeValue = current.claimDates?.discharge || source.dischargeDate;
    const admit = admitValue ? new Date(`${admitValue}T00:00:00`) : null;
    const discharge = dischargeValue ? new Date(`${dischargeValue}T00:00:00`) : null;
    const difference = admit && discharge && !Number.isNaN(admit.getTime()) && !Number.isNaN(discharge.getTime())
      ? Math.max(0, Math.round((discharge - admit) / 86400000))
      : 0;
    const ipdDays = Math.max(0, Number(source.ipdDays ?? current.ipdDays ?? difference) || 0);
    const icuDays = Math.max(0, Number(source.icuDays ?? current.icuDays ?? 0) || 0);
    return { ipdDays, icuDays, totalStayDays: Math.max(0, Number(source.totalStayDays ?? current.totalStayDays ?? (ipdDays + icuDays)) || 0) };
  }

  function getHospitalConsiderationRows() {
    try {
      return typeof considerationHospitalRows !== "undefined" && Array.isArray(considerationHospitalRows)
        ? considerationHospitalRows
        : [];
    } catch (_error) {
      return [];
    }
  }

  function buildHospitalConsiderationRecordFromClaimEntry(current) {
    const sourceState = current || state();
    const source = sourceState.paPrimaryRow || sourceState.row || {};
    const rows = getHospitalConsiderationRows();
    const product = currentProduct();
    const treatment = sourceState.subType || "OPD";
    const now = new Date();
    const bangkokParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "2-digit",
      month: "2-digit"
    }).formatToParts(now).reduce(function (result, part) {
      result[part.type] = part.value;
      return result;
    }, {});
    const dynamicCount = rows.filter(function (item) { return item.source === "claim-entry-hospital"; }).length;
    const sequence = String(401 + dynamicCount).padStart(6, "0");
    const prefix = product === "PA" ? "CLPA" : "CL";
    const claimCode = sourceState.createdHospitalConsiderationClaimCode || `${prefix}${bangkokParts.year}${bangkokParts.month}${sequence}`;
    sourceState.createdHospitalConsiderationClaimCode = claimCode;
    const caseCode = (claimCode.startsWith("CLPA") ? claimCode.replace(/^CLPA/, "CCPA") : claimCode.replace(/^CL/, "CC")) + "-01";
    const amount = hospitalClaimAmount();
    const stay = stayDays(sourceState);
    const claimType = treatment === "OPD" ? "OPD Half" : treatment;
    const hospitalName = sourceState.hospitalName || source.hospital || "-";
    const provinceMap = {
      "โรงพยาบาลมะการักษ์": "กาญจนบุรี",
      "โรงพยาบาลนนทเวช": "นนทบุรี"
    };
    return {
      sourceKey: `claim-entry-hospital:${claimCode}`,
      source: "claim-entry-hospital",
      claimCategory: "เคลมโรงพยาบาล",
      date: formatSavedDate(now),
      claimCode,
      caseNo: caseCode,
      hospital: hospitalName,
      province: source.province || provinceMap[hospitalName] || "-",
      name: source.name || "-",
      idCard: source.idCard || "-",
      appId: source.appId || "-",
      phone: source.phone || "-",
      school: source.school || "-",
      plan: source.plan || "-",
      product,
      amount: money(amount),
      hospitalOpdAmount: claimType === "OPD Half" ? money(amount) : undefined,
      itemStatus: "รอพิจารณา",
      claimStatus: "Open",
      claimCause: sourceState.incidentCause || source.claimCause || "-",
      coverageType: MEDICAL_COVERAGE,
      claimType,
      treatmentType: treatment,
      sourceTreatmentType: treatment,
      incidentDate: sourceState.claimDates?.incident || source.incidentDate || "",
      incidentTime: source.incidentTime || "09:00",
      admitDate: sourceState.claimDates?.admit || source.admitDate || "",
      admitTime: source.admitTime || "10:00",
      dischargeDate: sourceState.claimDates?.discharge || source.dischargeDate || "",
      dischargeTime: source.dischargeTime || "11:00",
      ipdDays: stay.ipdDays,
      icuDays: stay.icuDays,
      totalStayDays: stay.totalStayDays,
      chiefComplaint: selectedSymptom(),
      diagnosis: source.diagnosis || source.diagnosis1 || "-",
      diagnosis1: source.diagnosis1 || source.diagnosis || "-",
      diagnosis2: source.diagnosis2 || "-",
      diagnosis3: source.diagnosis3 || "-",
      note: source.note || "ข้อมูลจากการแจ้งเคลมโรงพยาบาล",
      isContinuous: sourceState.isContinuous === true,
      previousClaimNo: sourceState.continuousClaim?.claimNo || source.previousClaimNo || "",
      previousCaseNo: sourceState.continuousCaseNo || source.previousCaseNo || "",
      previousServiceDate: sourceState.continuousClaim?.incidentDate || source.previousServiceDate || "",
      scannedDocuments: { ...(sourceState.scanned || {}) }
    };
  }

  function syncClaimEntryToHospitalConsideration() {
    if (!isHospitalClaim()) return null;
    const rows = getHospitalConsiderationRows();
    if (!rows.length && typeof considerationHospitalRows === "undefined") return null;
    const record = buildHospitalConsiderationRecordFromClaimEntry(state());
    const existingIndex = rows.findIndex(function (item) { return item.sourceKey === record.sourceKey; });
    if (existingIndex >= 0) rows.splice(existingIndex, 1, record);
    else rows.unshift(record);
    return record;
  }

  function hospitalSuccessMarkup(record) {
    return `
      <div class="p-8 text-center">
        <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-600 text-white"><span class="material-icons-round !text-5xl" aria-hidden="true">check</span></div>
        <h3 class="mt-4 text-2xl font-extrabold text-success">แจ้งเคลมเรียบร้อยแล้ว</h3>
        <p class="mt-2 text-lg text-slate-600">ระบบส่งข้อมูลไปยังหน้าพิจารณาเคลมโรงพยาบาลแล้ว</p>
        <div class="mx-auto mt-5 max-w-md rounded-xl bg-slate-50 p-4 text-left shadow-soft ring-1 ring-slate-200">
          <p class="border-b border-slate-200 pb-3 font-bold text-success"><span class="material-icons-round align-middle" aria-hidden="true">description</span> เลขที่เคลม : <b>${escapeHtml(record.claimCode)}</b></p>
          <p class="pt-3 font-bold text-brand-700"><span class="material-icons-round align-middle" aria-hidden="true">badge</span> เลขที่ Case : <b>${escapeHtml(record.caseNo)}</b></p>
        </div>
        <button type="button" onclick="closeHospitalClaimSuccess()" class="mt-6 h-11 rounded-lg bg-brand-600 px-10 text-lg font-bold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200">ปิด</button>
      </div>`;
  }

  window.submitHospitalClaimForConsideration = function () {
    if (!isHospitalClaim() || !validateHospitalFacility(true)) return;
    const record = syncClaimEntryToHospitalConsideration();
    if (!record) return;
    if (typeof window.showModal === "function") window.showModal(hospitalSuccessMarkup(record), "max-w-lg");
  };

  window.closeHospitalClaimSuccess = function () {
    if (typeof window.closeModal === "function") window.closeModal();
    if (typeof window.showClaimMonitor === "function") window.showClaimMonitor();
  };

  window.buildHospitalConsiderationRecordFromClaimEntry = buildHospitalConsiderationRecordFromClaimEntry;
  window.syncClaimEntryToHospitalConsideration = syncClaimEntryToHospitalConsideration;
  window.validateHospitalClaimFacility = validateHospitalFacility;

  const originalRenderClaimEntry = window.renderClaimEntry;
  if (typeof originalRenderClaimEntry === "function") {
    assignGlobal("renderClaimEntry", function () {
      ensureStateDefaults();
      if (isHospitalClaim()) state().coverageType = MEDICAL_COVERAGE;
      const result = originalRenderClaimEntry.apply(this, arguments);
      ensureCategorySection();
      return result;
    });
  }

  const originalRenderSelections = window.renderClaimSelectionControls;
  if (typeof originalRenderSelections === "function") {
    assignGlobal("renderClaimSelectionControls", function () {
      ensureStateDefaults();
      if (isHospitalClaim()) state().coverageType = MEDICAL_COVERAGE;
      const result = originalRenderSelections.apply(this, arguments);
      ensureCategorySection();
      if (isHospitalClaim()) renderLockedCoverage();
      return result;
    });
  }

  const originalRenderDynamic = window.renderClaimDynamicFields;
  if (typeof originalRenderDynamic === "function") {
    assignGlobal("renderClaimDynamicFields", function () {
      ensureStateDefaults();
      if (isHospitalClaim()) state().coverageType = MEDICAL_COVERAGE;
      const result = originalRenderDynamic.apply(this, arguments);
      if (isHospitalClaim()) {
        state().coverageType = MEDICAL_COVERAGE;
        renderHospitalTreatments();
        renderHospitalFacility();
      }
      return result;
    });
  }

  const originalValidateHospital = window.validateRequiredHospital;
  assignGlobal("validateRequiredHospital", function (shouldFocus) {
    if (isHospitalClaim()) return validateHospitalFacility(Boolean(shouldFocus));
    return typeof originalValidateHospital === "function" ? originalValidateHospital.apply(this, arguments) : true;
  });

  const originalValidateTransferAmount = window.validateTransferAmountByCoverage;
  if (typeof originalValidateTransferAmount === "function") {
    assignGlobal("validateTransferAmountByCoverage", function () {
      // เคลมโรงพยาบาลบันทึกยอดเพื่อพิจารณาเท่านั้น จึงไม่มีขั้นตอน NPL/โอนเงิน
      if (isHospitalClaim()) {
        state().transferAmount = hospitalClaimAmount();
        state().nplAmount = 0;
        return true;
      }
      return originalValidateTransferAmount.apply(this, arguments);
    });
  }

  const originalRenderPayment = window.renderPaymentPage;
  if (typeof originalRenderPayment === "function") {
    assignGlobal("renderPaymentPage", function () {
      if (isHospitalClaim()) return renderHospitalConfirmation();
      return originalRenderPayment.apply(this, arguments);
    });
  }

  const originalReset = window.resetClaimEntryState;
  if (typeof originalReset === "function") {
    assignGlobal("resetClaimEntryState", function () {
      const result = originalReset.apply(this, arguments);
      const current = ensureStateDefaults();
      current.claimCategory = CUSTOMER;
      current.hospitalName = "";
      current.createdHospitalConsiderationClaimCode = "";
      return result;
    });
  }

  const originalOpenClaimEntry = window.openClaimEntry;
  if (typeof originalOpenClaimEntry === "function") {
    assignGlobal("openClaimEntry", function () {
      const result = originalOpenClaimEntry.apply(this, arguments);
      ensureStateDefaults().claimCategory = CUSTOMER;
      syncCategoryCards();
      requestAnimationFrame(syncCategoryCards);
      setTimeout(syncCategoryCards, 0);
      return result;
    });
  }

  const originalOpenContinuous = window.openContinuousClaimEntry;
  if (typeof originalOpenContinuous === "function") {
    assignGlobal("openContinuousClaimEntry", function () {
      const current = ensureStateDefaults();
      current.claimCategory = CUSTOMER;
      current.hospitalName = "";
      current.createdHospitalConsiderationClaimCode = "";
      return originalOpenContinuous.apply(this, arguments);
    });
  }

  function installHospitalConsiderationRouting() {
    const originalOpenHospitalConsideration = window.openConsiderHospitalRow;
    if (typeof originalOpenHospitalConsideration !== "function" || originalOpenHospitalConsideration.__claimEntryCategoryRouting) return;
    const routedOpenHospitalConsideration = function (index) {
      const rows = getHospitalConsiderationRows();
      const row = index && typeof index === "object" ? index : (rows[index] || rows[0]);
      if (row?.source === "claim-entry-hospital" && row.sourceTreatmentType) {
        row.treatmentType = row.sourceTreatmentType;
        row.claimType = row.sourceTreatmentType === "OPD" ? "OPD Half" : row.sourceTreatmentType;
      }
      const result = originalOpenHospitalConsideration.apply(this, arguments);
      if (row?.source !== "claim-entry-hospital") return result;

      const useFullRenderer = /IPD|Day\s*Case(?:\s*Surgery)?/i.test(String(row.claimType || row.treatmentType || ""));
      const targetId = useFullRenderer ? "considerHospitalOpdFullPage" : "considerHospitalOpdHalfPage";
      if (!document.getElementById(targetId)?.classList.contains("hidden")) return result;

      window.currentConsiderHospitalRow = row;
      window.currentConsiderHospitalKind = useFullRenderer ? "full" : "half";
      window.hospitalClaimSelectionState = {
        cause: row.claimCause || (row.product === "PA" ? "อุบัติเหตุ" : "เจ็บป่วย"),
        coverage: MEDICAL_COVERAGE,
        treatment: row.treatmentType || (useFullRenderer ? "IPD" : "OPD")
      };
      const renderer = useFullRenderer ? window.showConsiderHospitalOpdFullPage : window.showConsiderHospitalOpdHalfPage;
      if (typeof renderer === "function") renderer(row);
      return result;
    };
    routedOpenHospitalConsideration.__claimEntryCategoryRouting = true;
    assignGlobal("openConsiderHospitalRow", routedOpenHospitalConsideration);

    const originalShowConsideration = window.showConsiderationPage;
    if (typeof originalShowConsideration === "function" && !originalShowConsideration.__claimEntryCategoryOrder) {
      const orderedShowConsideration = function (tab) {
        const result = originalShowConsideration.apply(this, arguments);
        if (tab === "hospital") {
          const rows = getHospitalConsiderationRows();
          const createdRows = rows.filter(function (row) { return row?.source === "claim-entry-hospital"; });
          if (createdRows.length) {
            const remainingRows = rows.filter(function (row) { return row?.source !== "claim-entry-hospital"; });
            rows.splice(0, rows.length, ...createdRows, ...remainingRows);
            if (typeof window.renderConsiderationTable === "function") window.renderConsiderationTable();
          }
        }
        return result;
      };
      orderedShowConsideration.__claimEntryCategoryOrder = true;
      assignGlobal("showConsiderationPage", orderedShowConsideration);
    }
  }

  ensureStateDefaults();
  document.addEventListener("DOMContentLoaded", function () {
    ensureCategorySection();
    // Earlier late patches also install DOM-ready wrappers; install this route last.
    setTimeout(installHospitalConsiderationRouting, 0);
  }, { once: true });
  if (document.readyState !== "loading") setTimeout(installHospitalConsiderationRouting, 0);
})();
