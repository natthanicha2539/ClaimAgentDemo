/* ============================================================
   menu-claim-entry-category.js
   แจ้งเคลม: เลือกเคลมลูกค้า/โรงพยาบาล และส่งตรวจสอบ รพ.วางบิล
   ============================================================ */
(function () {
  "use strict";

  const CUSTOMER = "customer";
  const HOSPITAL = "hospital";
  const MEDICAL_COVERAGE = "ค่ารักษา";
  const EXPENSE_REASONS = ["ข้อยกเว้นเฉพาะบุคคล", "รายการยาไม่เข้าเงื่อนไขความคุ้มครอง", "เป็นข้อยกเว้นกรมธรรม์", "เกินสิทธิ์ความคุ้มครอง", "รายการเวชภัณฑ์ไม่เข้าเงื่อนไขความคุ้มครอง", "รายการยาไม่สัมพันธ์กับการรักษาพยาบาลครั้งนี้", "ไม่เข้าเงื่อนไขความคุ้มครอง", "ไม่อยู่ในความคุ้มครอง", "อื่นๆ"];
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

  function renumberClaimSections() {
    const stack = document.querySelector("#claimEntryPage .claim-option-stack");
    if (!stack) return;
    Array.from(stack.querySelectorAll(":scope > section .step-dot")).forEach(function (dot, index) {
      dot.textContent = String(index + 1);
    });
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
        if (current.subType !== "IPD" && current.hospitalEntry) {
          delete current.hospitalEntry.ipdDays;
          delete current.hospitalEntry.icuDays;
          delete current.hospitalEntry.totalStayDays;
        }
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
        <select id="claimHospitalSelect" class="claim-standard-field mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-[17px] font-medium text-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" aria-describedby="claimHospitalError">
          ${hospitalOptionsMarkup(selected)}
        </select>
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
    if (!select) return true;
    state().hospitalName = select.value;
    select.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
      error.classList.add("hidden");
    }
    return true;
  }

  function selectedSymptom() {
    const source = state().row || {};
    const mode = document.querySelector('input[name="symptomMode"]:checked')?.value;
    if (mode === "other") return document.getElementById("symptomOtherNote")?.value || source.chiefComplaint || "-";
    return document.getElementById("symptomSelect")?.value || source.chiefComplaint || "-";
  }

  function hospitalClaimAmount() {
    const current = state();
    if (isHospitalClaim()) return expenseTotals().receipt;
    return parseAmount(current.phIpdTransferTotal || current.transferAmount || document.getElementById("transferAmount")?.value || 0);
  }

  function expenseRows() {
    const entry = state().hospitalEntry ||= {};
    if (!Array.isArray(entry.expenseRows)) {
      entry.expenseRows = [{ item: "", receipt: entry.expenseAmount || "", discount: "", uncovered: "", reason: "", note: "" }];
    }
    return entry.expenseRows;
  }

  function hasExpenseData(row) {
    return ["item", "receipt", "discount", "uncovered", "reason", "note"].some(function (field) {
      return String(row[field] ?? "").trim() !== "";
    });
  }

  function expenseTotals() {
    const cents = function (value) { return Math.max(0, Math.round(parseAmount(value) * 100)); };
    const total = expenseRows().reduce(function (sum, row) {
      const receipt = cents(row.receipt);
      const discount = cents(row.discount);
      const uncovered = cents(row.uncovered);
      sum.receipt += receipt;
      sum.discount += discount;
      sum.uncovered += uncovered;
      sum.eligible += Math.max(0, receipt - discount - uncovered);
      return sum;
    }, { receipt: 0, discount: 0, uncovered: 0, eligible: 0 });
    return Object.fromEntries(Object.entries(total).map(function ([key, value]) { return [key, value / 100]; }));
  }

  function expenseRowMarkup(row, index) {
    const input = function (field, label, type, extra) {
      return `<input data-expense-index="${index}" data-expense-field="${field}" aria-label="${label} รายการที่ ${index + 1}" type="${type}" ${type === "number" ? 'min="0" step="0.01" inputmode="decimal"' : ""} value="${escapeHtml(row[field] || "")}" ${extra || ""}>`;
    };
    return `<tr>
      <td>${input("item", "รายการค่ารักษา", "text", 'placeholder="ระบุรายการค่ารักษา" aria-required="true"')}</td>
      <td>${input("receipt", "ยอดเงินตามใบเสร็จ", "number", 'aria-required="true"')}</td>
      <td>${input("discount", "ส่วนลด", "number")}</td>
      <td>${input("uncovered", "ยอดเงินไม่คุ้มครอง", "number")}</td>
      <td><select data-expense-index="${index}" data-expense-field="reason" aria-label="สาเหตุไม่คุ้มครอง รายการที่ ${index + 1}"><option value="">-</option>${EXPENSE_REASONS.map(function (option) { return `<option value="${escapeHtml(option)}" ${row.reason === option ? "selected" : ""}>${escapeHtml(option)}</option>`; }).join("")}</select></td>
      <td class="hospital-expense-entitlement" data-expense-eligible="${index}">${money(Math.max(0, parseAmount(row.receipt) - parseAmount(row.discount) - parseAmount(row.uncovered)))}</td>
      <td>${input("note", "หมายเหตุ", "text", 'placeholder="หมายเหตุ"')}</td>
      <td><button type="button" class="hospital-expense-remove" data-expense-remove="${index}" aria-label="ลบรายการค่ารักษาที่ ${index + 1}"><span class="material-icons-round" aria-hidden="true">delete_outline</span></button></td>
    </tr>`;
  }

  function updateExpenseTotals(content) {
    const totals = expenseTotals();
    const entry = state().hospitalEntry;
    entry.expenseAmount = totals.receipt ? totals.receipt.toFixed(2) : "";
    for (const key of ["receipt", "discount", "uncovered", "eligible"]) {
      content.querySelectorAll(`[data-expense-total="${key}"]`).forEach(function (node) { node.textContent = money(totals[key]); });
    }
    expenseRows().forEach(function (row, index) {
      const eligible = Math.max(0, parseAmount(row.receipt) - parseAmount(row.discount) - parseAmount(row.uncovered));
      const cell = content.querySelector(`[data-expense-eligible="${index}"]`);
      if (cell) cell.textContent = money(eligible);
    });
  }

  function addExpenseFiles(files) {
    const accepted = Array.from(files || []).filter(function (file) { return /\.(pdf|jpe?g|png)$/i.test(file.name); });
    const entry = state().hospitalEntry ||= {};
    entry.expenseFiles ||= [];
    entry.expenseFiles.push(...accepted);
    refreshExpenseFiles(document.getElementById("paymentContent"));
    if (accepted.length !== Array.from(files || []).length) {
      const error = document.getElementById("hospitalEntryExpenseError");
      if (error) error.textContent = "รองรับเฉพาะไฟล์ PDF, JPG, JPEG และ PNG";
    }
  }

  function refreshExpenseFiles(content) {
    const list = content?.querySelector("[data-expense-files]");
    if (!list) return;
    list.innerHTML = (state().hospitalEntry?.expenseFiles || []).map(function (file, index) {
      return `<li><span class="material-icons-round" aria-hidden="true">attach_file</span><span>${escapeHtml(file.name)}</span><button type="button" data-expense-file-remove="${index}" aria-label="นำไฟล์ ${escapeHtml(file.name)} ออก">นำออก</button></li>`;
    }).join("");
  }

  function refreshExpenseRows(content) {
    if (!content) return;
    const indexed = expenseRows().map(function (row, index) { return { row, index }; });
    const preliminary = indexed.filter(function (item) { return item.row.kind !== "additional"; });
    const additional = indexed.filter(function (item) { return item.row.kind === "additional"; });
    const preliminaryBody = content.querySelector("[data-expense-preliminary]");
    if (preliminaryBody) preliminaryBody.innerHTML = preliminary.map(function (item) { return expenseRowMarkup(item.row, item.index); }).join("");
    const preliminaryCount = content.querySelector("[data-expense-preliminary-count]");
    if (preliminaryCount) preliminaryCount.textContent = `${preliminary.length} รายการ`;
    const additionalCount = content.querySelector("[data-expense-additional-count]");
    if (additionalCount) additionalCount.textContent = additional.length ? `${additional.length} รายการ` : "กรณีไม่มีรายการค่าใช้จ่าย กรุณาเลือกหมวดและเพิ่มรายการลงในตาราง";
    const additionalBody = content.querySelector("[data-expense-additional-table]");
    if (additionalBody) {
      const head = content.querySelector("[data-expense-preliminary-table] thead")?.outerHTML || "";
      additionalBody.innerHTML = additional.length ? `<div class="hospital-entry-expense-table-wrap"><table class="hospital-entry-expense-table">${head}<tbody>${additional.map(function (item) { return expenseRowMarkup(item.row, item.index); }).join("")}</tbody></table></div>` : "";
    }
    updateExpenseTotals(content);
  }

  function setHospitalPaymentHeading() {
    document.getElementById("paymentPage")?.classList.add("hospital-entry-payment-mode");
    const title = document.getElementById("pageTitle");
    if (title) title.textContent = "แจ้งเคลม รพ. - " + currentProduct();
    const subtitle = document.getElementById("pageSubtitle");
    if (subtitle) subtitle.textContent = "บันทึกเคลม/ค้นหาผู้เอาประกัน";
  }

  function additionalExpensePickerMarkup() {
    const tree = window.getClaimlineAdditionalTreeByTreatment?.(state().subType || "OPD") || [];
    return `<div class="hospital-expense-picker" data-expense-picker hidden>
      <div class="hospital-expense-picker-grid">
        <div class="hospital-expense-tree">
          <label class="hospital-expense-search"><span class="sr-only">ค้นหารายการค่ารักษา</span><input type="search" data-expense-search placeholder="ค้นหารายการค่ารักษา เช่น ยา , ค่าแพทย์ , ค่าห้อง"><span class="material-icons-round" aria-hidden="true">search</span></label>
          <div class="hospital-expense-tree-list" data-expense-tree>${tree.map(function (main) { return `<div class="hospital-expense-main" data-expense-main>
            <button type="button" class="hospital-expense-tree-toggle" data-expense-main-toggle aria-expanded="false"><span class="hospital-expense-tree-label"><span class="material-icons-round hospital-expense-tree-icon" aria-hidden="true">category</span>หมวด : ${escapeHtml(main.main)}</span><span class="material-icons-round" aria-hidden="true">expand_more</span></button>
            <div class="hospital-expense-main-body" data-expense-main-body hidden>${main.subs.map(function (sub) { return `<div class="hospital-expense-sub" data-expense-sub>
              <button type="button" class="hospital-expense-tree-toggle hospital-expense-sub-toggle" data-expense-sub-toggle aria-expanded="false"><span>${escapeHtml(sub.sub)}</span><span class="material-icons-round" aria-hidden="true">expand_more</span></button>
              <div class="hospital-expense-sub-body" data-expense-sub-body hidden>${sub.items.map(function (item) { return `<button type="button" class="hospital-expense-item" data-expense-tree-item data-expense-label="${escapeHtml(`${item.code} ${item.desc}`)}" data-expense-search-text="${escapeHtml(item.search)}"><b>${escapeHtml(item.code)}</b><span>${escapeHtml(item.desc)}</span></button>`; }).join("")}</div>
            </div>`; }).join("")}</div>
          </div>`; }).join("")}</div><p class="hospital-expense-no-results" data-expense-no-results hidden>ไม่พบรายการค่ารักษาที่ค้นหา</p>
        </div>
        <div class="hospital-expense-picker-form"><strong>รายการค่ารักษาที่เลือก</strong>
          <input type="text" data-expense-selected readonly placeholder="ยังไม่ได้เลือกรายการ — เลือกจากรายการทางซ้าย" aria-label="รายการค่ารักษาที่เลือก">
          <input type="number" min="0" step="0.01" inputmode="decimal" data-expense-new-receipt placeholder="ยอดเงินตามใบเสร็จ" aria-label="ยอดเงินตามใบเสร็จ" disabled>
          <div class="hospital-expense-picker-pair"><input type="number" min="0" step="0.01" inputmode="decimal" data-expense-new-discount placeholder="ส่วนลด" aria-label="ส่วนลด" disabled><input type="number" min="0" step="0.01" inputmode="decimal" data-expense-new-uncovered placeholder="ยอดไม่คุ้มครอง" aria-label="ยอดไม่คุ้มครอง" disabled></div>
          <select data-expense-new-reason aria-label="สาเหตุไม่คุ้มครอง" disabled><option value="">สาเหตุไม่คุ้มครอง</option>${EXPENSE_REASONS.map(function (reason) { return `<option value="${escapeHtml(reason)}">${escapeHtml(reason)}</option>`; }).join("")}</select>
          <textarea data-expense-new-note rows="2" placeholder="หมายเหตุ" aria-label="หมายเหตุ" disabled></textarea>
          <button type="button" data-expense-confirm-add disabled><span class="material-icons-round" aria-hidden="true">add_box</span>เพิ่มลงในตาราง</button>
        </div>
      </div>
    </div>`;
  }

  function resetAdditionalExpensePicker(content) {
    const picker = content?.querySelector("[data-expense-picker]");
    if (!picker) return;
    picker.querySelectorAll("[data-expense-tree-item]").forEach(function (button) { button.classList.remove("is-selected"); });
    picker.querySelectorAll("[data-expense-selected], [data-expense-new-receipt], [data-expense-new-discount], [data-expense-new-uncovered], [data-expense-new-reason], [data-expense-new-note]").forEach(function (control) { control.value = ""; });
    picker.querySelectorAll("[data-expense-new-receipt], [data-expense-new-discount], [data-expense-new-uncovered], [data-expense-new-reason], [data-expense-new-note], [data-expense-confirm-add]").forEach(function (control) { control.disabled = true; });
  }

  function filterAdditionalExpenseTree(content, query) {
    const search = String(query || "").trim().toLowerCase();
    let hasMatch = false;
    content.querySelectorAll("[data-expense-main]").forEach(function (main) {
      let mainMatches = false;
      main.querySelectorAll("[data-expense-sub]").forEach(function (sub) {
        let subMatches = false;
        sub.querySelectorAll("[data-expense-tree-item]").forEach(function (item) {
          const match = !search || (item.dataset.expenseSearchText || "").includes(search);
          item.hidden = !match;
          subMatches ||= match;
        });
        sub.hidden = !subMatches;
        sub.querySelector("[data-expense-sub-body]").hidden = !search || !subMatches;
        sub.querySelector("[data-expense-sub-toggle]").setAttribute("aria-expanded", String(Boolean(search && subMatches)));
        mainMatches ||= subMatches;
      });
      main.hidden = !mainMatches;
      hasMatch ||= mainMatches;
      main.querySelector("[data-expense-main-body]").hidden = !search || !mainMatches;
      main.querySelector("[data-expense-main-toggle]").setAttribute("aria-expanded", String(Boolean(search && mainMatches)));
    });
    const noResults = content.querySelector("[data-expense-no-results]");
    if (noResults) noResults.hidden = hasMatch;
  }

  function renderHospitalExpenseStep() {
    window.renderHospitalClaimEntryStep?.("payStepper", 2);
    document.getElementById("paymentPage")?.classList.remove("ph-confirm-page");
    document.getElementById("paymentPage")?.classList.remove("hospital-entry-step3-mode");
    setHospitalPaymentHeading();
    const current = state();
    current.hospitalEntry ||= {};
    const title = document.getElementById("paymentTitle");
    if (title) title.innerHTML = '<span class="material-icons-round text-brand-700" aria-hidden="true">receipt_long</span>รายละเอียดค่าใช้จ่าย';
    const content = document.getElementById("paymentContent");
    const entry = current.hospitalEntry;
    const rows = expenseRows();
    const totals = expenseTotals();
    const preliminaryRows = rows.map(function (row, index) { return { row, index }; }).filter(function (item) { return item.row.kind !== "additional"; });
    const additionalRows = rows.map(function (row, index) { return { row, index }; }).filter(function (item) { return item.row.kind === "additional"; });
    const expenseTableHead = '<thead><tr><th scope="col">รายการค่ารักษา</th><th scope="col">ยอดเงินตามใบเสร็จ</th><th scope="col">ส่วนลด</th><th scope="col">ยอดเงินไม่คุ้มครอง</th><th scope="col">สาเหตุไม่คุ้มครอง</th><th scope="col">สิทธิ์เบิก</th><th scope="col">หมายเหตุ</th><th scope="col">ลบ</th></tr></thead>';
    if (content) content.innerHTML = `<div class="hospital-entry-review-page hospital-expense-page">
      <section class="hospital-entry-review-panel" aria-labelledby="hospitalOcrHeading">
        <h3 id="hospitalOcrHeading" class="hospital-entry-review-head"><span class="material-icons-round" aria-hidden="true">document_scanner</span>OCR ในใบสั่งค่ารักษา</h3>
        <div class="hospital-expense-upload-body"><div class="hospital-expense-upload-label"><span class="material-icons-round" aria-hidden="true">attach_file</span><div><strong>ใบสั่งค่ารักษา / ใบเสร็จรับเงิน</strong><small>รองรับ PDF, JPG, JPEG, PNG และเอกสารหลายหน้า</small></div></div>
          <div class="hospital-expense-dropzone" data-expense-dropzone><span class="material-icons-round" aria-hidden="true">cloud_upload</span><strong>ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลดใบสั่งค่ารักษา</strong><button type="button" data-expense-upload>เลือกไฟล์</button><input type="file" data-expense-file-input accept=".pdf,.jpg,.jpeg,.png,image/*" multiple hidden></div>
          <p class="hospital-expense-upload-hint">หลังแนบไฟล์ โปรดกรอกรายการค่ารักษาในตารางด้านล่าง</p>
          <ul class="hospital-expense-files" data-expense-files aria-label="ไฟล์ใบสั่งค่ารักษาที่แนบ">${(entry.expenseFiles || []).map(function (file, index) { return `<li><span class="material-icons-round" aria-hidden="true">attach_file</span><span>${escapeHtml(file.name)}</span><button type="button" data-expense-file-remove="${index}" aria-label="นำไฟล์ ${escapeHtml(file.name)} ออก">นำออก</button></li>`; }).join("")}</ul>
        </div>
      </section>
      <section class="hospital-entry-review-panel" aria-labelledby="hospitalExpenseHeading">
        <h3 id="hospitalExpenseHeading" class="hospital-entry-review-head"><span class="material-icons-round" aria-hidden="true">note_add</span>รายการค่าใช้จ่าย</h3>
        <div class="hospital-expense-section-body"><div class="hospital-expense-card cc-ref-prelim-card"><div class="hospital-expense-card-title"><strong>รายการค่ารักษา(เบื้องต้น)</strong><span data-expense-preliminary-count>${preliminaryRows.length} รายการ</span></div>
          <div class="hospital-entry-expense-table-wrap"><table class="hospital-entry-expense-table" data-expense-preliminary-table>${expenseTableHead}<tbody data-expense-preliminary>${preliminaryRows.map(function (item) { return expenseRowMarkup(item.row, item.index); }).join("")}</tbody></table></div>
          <div class="hospital-expense-summary"><h4><span class="material-icons-round" aria-hidden="true">request_quote</span>สรุปยอดเงิน</h4><div class="hospital-expense-summary-grid">
            <div><span>ยอดเงินตามใบเสร็จรวม :</span><strong><span data-expense-total="receipt">${money(totals.receipt)}</span> <small>บาท</small></strong></div>
            <div><span>ส่วนลดรวม :</span><strong><span data-expense-total="discount">${money(totals.discount)}</span> <small>บาท</small></strong></div>
            <div><span>ยอดไม่คุ้มครองรวม :</span><strong><span data-expense-total="uncovered">${money(totals.uncovered)}</span> <small>บาท</small></strong></div>
            <div class="is-eligible"><span>สิทธิ์เบิกรวม :</span><strong><span data-expense-total="eligible">${money(totals.eligible)}</span> <small>บาท</small></strong></div>
          </div></div>
          <label class="hospital-expense-insurance"><input type="checkbox" data-expense-insurance ${entry.insuranceExcess ? "checked" : ""}><span>เป็นส่วนเกินจากบริษัทประกัน</span></label></div>
          <div class="hospital-expense-additional cc-ref-additional-card"><div class="hospital-expense-additional-head"><div><strong>รายการค่ารักษาเพิ่มเติม</strong><small data-expense-additional-count>${additionalRows.length ? `${additionalRows.length} รายการ` : "กรณีไม่มีรายการค่าใช้จ่าย กรุณาเลือกหมวดและเพิ่มรายการลงในตาราง"}</small></div><button type="button" data-expense-add aria-expanded="false"><span class="material-icons-round" aria-hidden="true">chevron_right</span>เพิ่มรายการค่ารักษา</button></div><div data-expense-picker-slot></div><div data-expense-additional-table>${additionalRows.length ? `<div class="hospital-entry-expense-table-wrap"><table class="hospital-entry-expense-table">${expenseTableHead}<tbody>${additionalRows.map(function (item) { return expenseRowMarkup(item.row, item.index); }).join("")}</tbody></table></div>` : ""}</div></div>
          <small id="hospitalEntryExpenseError" class="hospital-expense-error" role="alert"></small>
        </div>
      </section>
    </div>`;
    if (content) content.oninput = function (event) {
      if (event.target.matches("[data-expense-search]")) {
        filterAdditionalExpenseTree(content, event.target.value);
        return;
      }
      const index = Number(event.target.dataset?.expenseIndex);
      const field = event.target.dataset?.expenseField;
      if (!field || !expenseRows()[index]) return;
      expenseRows()[index][field] = event.target.value;
      event.target.removeAttribute("aria-invalid");
      const error = content.querySelector("#hospitalEntryExpenseError");
      if (error) error.textContent = "";
      updateExpenseTotals(content);
    };
    if (content) content.onchange = function (event) {
      if (event.target.matches("[data-expense-file-input]")) {
        addExpenseFiles(event.target.files);
      } else if (event.target.matches("[data-expense-insurance]")) entry.insuranceExcess = event.target.checked;
      else if (event.target.dataset?.expenseField) {
        const row = expenseRows()[Number(event.target.dataset.expenseIndex)];
        if (row) row[event.target.dataset.expenseField] = event.target.value;
      }
    };
    if (content) content.onclick = function (event) {
      const upload = event.target.closest("[data-expense-upload]");
      const add = event.target.closest("[data-expense-add]");
      const mainToggle = event.target.closest("[data-expense-main-toggle]");
      const subToggle = event.target.closest("[data-expense-sub-toggle]");
      const treeItem = event.target.closest("[data-expense-tree-item]");
      const confirmAdd = event.target.closest("[data-expense-confirm-add]");
      const remove = event.target.closest("[data-expense-remove]");
      const fileRemove = event.target.closest("[data-expense-file-remove]");
      if (add) {
        const slot = content.querySelector("[data-expense-picker-slot]");
        if (!slot.firstElementChild) slot.innerHTML = additionalExpensePickerMarkup();
        const picker = slot.querySelector("[data-expense-picker]");
        picker.hidden = !picker.hidden;
        add.setAttribute("aria-expanded", String(!picker.hidden));
        add.innerHTML = picker.hidden
          ? '<span class="material-icons-round" aria-hidden="true">chevron_right</span>เพิ่มรายการค่ารักษา'
          : '<span class="material-icons-round" aria-hidden="true">remove_circle_outline</span>ซ่อน';
        if (!picker.hidden) { resetAdditionalExpensePicker(content); filterAdditionalExpenseTree(content, ""); picker.querySelector("[data-expense-search]").value = ""; }
        return;
      }
      if (mainToggle) {
        const main = mainToggle.closest("[data-expense-main]");
        const body = main.querySelector("[data-expense-main-body]");
        body.hidden = !body.hidden;
        mainToggle.setAttribute("aria-expanded", String(!body.hidden));
        return;
      }
      if (subToggle) {
        const sub = subToggle.closest("[data-expense-sub]");
        const body = sub.querySelector("[data-expense-sub-body]");
        body.hidden = !body.hidden;
        subToggle.setAttribute("aria-expanded", String(!body.hidden));
        return;
      }
      if (treeItem) {
        const selected = content.querySelector("[data-expense-selected]");
        const wasSelected = treeItem.classList.contains("is-selected");
        resetAdditionalExpensePicker(content);
        if (!wasSelected) {
          treeItem.classList.add("is-selected");
          selected.value = treeItem.dataset.expenseLabel || "";
          content.querySelectorAll("[data-expense-new-receipt], [data-expense-new-discount], [data-expense-new-uncovered], [data-expense-new-reason], [data-expense-new-note], [data-expense-confirm-add]").forEach(function (control) { control.disabled = false; });
        }
        return;
      }
      if (confirmAdd) {
        const item = content.querySelector("[data-expense-selected]")?.value || "";
        if (!item) return;
        const value = function (field) { return content.querySelector(`[data-expense-new-${field}]`)?.value || ""; };
        rows.push({ kind: "additional", item, receipt: value("receipt"), discount: value("discount"), uncovered: value("uncovered"), reason: value("reason"), note: value("note") });
        refreshExpenseRows(content);
        resetAdditionalExpensePicker(content);
        return;
      }
      if (upload) content.querySelector("[data-expense-file-input]")?.click();
      else if (!event.target.matches("[data-expense-file-input]") && event.target.closest("[data-expense-dropzone]")) content.querySelector("[data-expense-file-input]")?.click();
      if (remove) { rows.splice(Number(remove.dataset.expenseRemove), 1); if (!rows.length) rows.push({ item: "", receipt: "", discount: "", uncovered: "", reason: "", note: "" }); refreshExpenseRows(content); }
      if (fileRemove) { entry.expenseFiles.splice(Number(fileRemove.dataset.expenseFileRemove), 1); refreshExpenseFiles(content); }
    };
    const dropzone = content?.querySelector("[data-expense-dropzone]");
    dropzone?.addEventListener("dragover", function (event) { event.preventDefault(); dropzone.classList.add("is-dragging"); });
    dropzone?.addEventListener("dragleave", function () { dropzone.classList.remove("is-dragging"); });
    dropzone?.addEventListener("drop", function (event) { event.preventDefault(); addExpenseFiles(event.dataTransfer?.files); });
    const back = document.getElementById("paymentBackBtn");
    if (back) back.onclick = window.showClaimEntryPage;
    const button = document.getElementById("primaryActionBtn");
    if (button) {
      button.textContent = "ถัดไป";
      button.onclick = function () {
        current.hospitalEntry.expenseAmount = expenseTotals().receipt.toFixed(2);
        renderHospitalConfirmation();
      };
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderHospitalConfirmation(preserveScroll = false) {
    window.renderHospitalClaimEntryStep?.("payStepper", 3);
    setHospitalPaymentHeading();
    const current = state();
    const amount = hospitalClaimAmount();
    const totals = expenseTotals();
    const rows = expenseRows().filter(hasExpenseData);
    const entry = current.hospitalEntry || {};
    const billedAmount = Math.max(0, totals.receipt - totals.discount);
    const stay = current.subType === "IPD" ? stayDays(current) : null;
    const stayText = function (days) { return stay ? String(days) : "-"; };
    const documentLine = function (key, label, files) {
      const count = Array.isArray(files) ? files.length : 0;
      return `<tr><td class="hospital-step3-center">-</td><th scope="row">${label}</th><td class="hospital-step3-center"><button type="button" class="hospital-step3-scan-button" data-step3-scan="${key}" aria-label="สแกนเอกสาร ${label}">สแกนเอกสาร</button></td><td class="hospital-step3-center">${count}</td><td class="hospital-step3-center"><button type="button" class="hospital-step3-view-button" data-step3-view="${key}" aria-label="ดูรายละเอียด ${label}" aria-controls="hospital-step3-details-${key}" aria-expanded="false" title="ดูรายละเอียด"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr><tr id="hospital-step3-details-${key}" class="hospital-step3-document-details" data-step3-document-details="${key}" hidden><td colspan="5">${count ? `<ul>${files.map(function (file) { const name = escapeHtml(file?.name || file?.fileName || "-"); return `<li><span class="material-icons-round" aria-hidden="true">attach_file</span><span>${name}</span></li>`; }).join("")}</ul>` : "ยังไม่ได้แนบเอกสาร"}</td></tr>`;
    };
    const dateValue = function (value) {
      const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : value || "-";
    };
    const detail = function (label, value, wide) {
      return `<div class="hospital-step3-detail${wide ? " is-wide" : ""}"><dt>${label} :</dt><dd>${escapeHtml(value || "-")}</dd></div>`;
    };
    current.transferAmount = amount;
    document.getElementById("paymentPage")?.classList.remove("ph-confirm-page");
    document.getElementById("paymentPage")?.classList.add("hospital-entry-step3-mode");
    const title = document.getElementById("paymentTitle");
    if (title) title.innerHTML = '<span class="material-icons-round text-brand-700" aria-hidden="true">fact_check</span>สรุปรายการเคลม';
    const content = document.getElementById("paymentContent");
    if (content) {
      content.innerHTML = `
        <div class="hospital-step3-page">
          <section class="hospital-step3-shell" aria-labelledby="hospitalConfirmHeading">
            <h3 id="hospitalConfirmHeading" class="hospital-step3-title">สรุปรายการ</h3>
            <div class="hospital-step3-body">
              <section class="hospital-step3-card" aria-labelledby="hospitalStep3DetailHeading"><h4 id="hospitalStep3DetailHeading" class="hospital-step3-card-title">รายละเอียดเคลม</h4>
                <dl class="hospital-step3-details">
                  ${detail("เหตุของการเคลม", current.incidentCause)}${detail("ประเภทความคุ้มครอง", MEDICAL_COVERAGE)}${detail("ประเภทการรักษา", current.subType)}${detail("วันที่แจ้งเคลม", dateValue(current.claimDates?.received))}${detail("วันที่เกิดเหตุ", dateValue(current.claimDates?.incident))}
                  ${detail("เวลาที่เกิดเหตุ", entry.incidentTime)}${detail("วันที่เข้า รพ.", dateValue(current.claimDates?.admit))}${detail("เวลาที่เข้า รพ.", entry.admitTime)}${detail("วันที่ออก รพ.", dateValue(current.claimDates?.discharge))}${detail("เวลาที่ออก รพ.", entry.dischargeTime)}
                  ${detail("สถานพยาบาล", current.hospitalName, true)}${detail("อาการสำคัญ", entry.chiefComplaint, true)}
                  ${detail("คำวินิจฉัย 1", entry.diagnosis1, true)}${detail("คำวินิจฉัย 2", entry.diagnosis2, true)}${detail("คำวินิจฉัย 3", entry.diagnosis3, true)}
                  ${entry.medicalDescription ? detail("รายละเอียดการเจ็บป่วย/การบาดเจ็บ", entry.medicalDescription, true) : ""}${detail("หมายเหตุ", entry.note, true)}
                </dl>
                ${current.subType === "IPD" ? `<div class="claim-step3-stay-summary" aria-label="สรุปจำนวนวันนอน"><div class="claim-step3-stay-title"><span class="material-icons-round" aria-hidden="true">bed</span><div><strong>สรุปจำนวนวันนอน</strong><span>IPD</span></div></div><div class="claim-step3-stay-grid"><div class="claim-step3-stay-item ipd"><span>จำนวนวันนอน IPD</span><strong>${stayText(stay?.ipdDays)}</strong>${stay ? "<small>วัน</small>" : ""}</div><div class="claim-step3-stay-item icu"><span>จำนวนวันนอน ICU</span><strong>${stayText(stay?.icuDays)}</strong>${stay ? "<small>วัน</small>" : ""}</div><div class="claim-step3-stay-item total"><span>จำนวนวันนอนรวม</span><strong>${stayText(stay?.totalStayDays)}</strong>${stay ? "<small>วัน</small>" : ""}</div></div></div>` : ""}
              </section>
              <section class="hospital-step3-card" aria-labelledby="hospitalStep3DocumentsHeading"><h4 id="hospitalStep3DocumentsHeading"><span class="material-icons-round" aria-hidden="true">subject</span>สแกนเอกสาร</h4>
                <div class="hospital-step3-table-wrap"><table class="hospital-step3-table hospital-step3-documents"><thead><tr><th scope="col">รหัสเอกสาร</th><th scope="col">ประเภทเอกสาร</th><th scope="col">สแกนเอกสาร</th><th scope="col">จำนวนเอกสาร</th><th scope="col">รายละเอียด</th></tr></thead><tbody>${documentLine("documents", "เอกสารประกอบการพิจารณาเคลม", entry.documents)}${entry.expenseFiles?.length ? documentLine("expenseFiles", "ใบสั่งค่ารักษา / ใบเสร็จรับเงิน", entry.expenseFiles) : ""}</tbody></table></div><input type="file" data-step3-file-input="documents" accept=".pdf,.doc,.docx,image/*" multiple hidden><input type="file" data-step3-file-input="expenseFiles" accept=".pdf,.jpg,.jpeg,.png,image/*" multiple hidden>
              </section>
              <section class="hospital-step3-card" aria-labelledby="hospitalStep3ExpensesHeading"><h4 id="hospitalStep3ExpensesHeading">รายการค่ารักษา</h4>
                <div class="hospital-step3-table-wrap"><table class="hospital-step3-table hospital-step3-expenses"><thead><tr><th scope="col">รายการ</th><th scope="col">รายการเบิก</th><th scope="col">สิทธิ์เบิกตามความคุ้มครอง</th><th scope="col">ส่วนเกินสิทธิ์</th></tr></thead><tbody>${rows.length ? rows.map(function (item) { return `<tr><th scope="row">${escapeHtml(item.item || "-")}</th><td>${money(Math.max(0, parseAmount(item.receipt) - parseAmount(item.discount)))}</td><td>${money(Math.max(0, parseAmount(item.receipt) - parseAmount(item.discount) - parseAmount(item.uncovered)))}</td><td>${money(item.uncovered)}</td></tr>`; }).join("") : '<tr class="hospital-step3-empty"><td colspan="4">ยังไม่มีรายการค่ารักษา</td></tr>'}<tr class="hospital-step3-total"><th scope="row">รวม :</th><td>${money(billedAmount)}</td><td>${money(totals.eligible)}</td><td>${money(totals.uncovered)}</td></tr></tbody></table></div>
              </section>
              <div class="hospital-step3-bottom"><section class="hospital-step3-compensation" aria-labelledby="hospitalStep3CompHeading"><div class="hospital-step3-compensation-head"><h4 id="hospitalStep3CompHeading">สรุปค่าชดเชย</h4><p>ข้อมูลสำหรับพิจารณาการจ่ายค่าชดเชย</p></div><div class="hospital-step3-compensation-body"><div class="hospital-step3-summary-line"><span>ค่าชดเชยรวม</span><strong>0.00 บาท</strong></div><div class="hospital-step3-summary-line"><span>ค่าชดเชย (รวมในสิทธิ์ความคุ้มครอง)</span><strong>0.00 บาท</strong></div><label class="hospital-step3-compensation-choice"><input type="checkbox" disabled><span><strong>โอนค่าชดเชยรวมกับค่ารักษา</strong><small>หากเลือก ระบบจะรวมค่าชดเชยเข้ากับยอดค่ารักษา และไม่ต้องใช้บัญชีรับเงินค่าชดเชยแยก</small></span></label><div class="hospital-step3-compensation-total"><span>ค่าชดเชยคงเหลือ (โอนให้ลูกค้า)</span><strong>0.00 บาท</strong></div><div class="hospital-step3-account"><strong>บัญชีรับเงินค่าชดเชย</strong><p>ไม่มีข้อมูลบัญชีรับเงินค่าชดเชยสำหรับเคลมนี้</p></div></div></section>
                <section class="hospital-step3-card hospital-step3-hospital-summary" aria-labelledby="hospitalStep3HospitalHeading"><h4 id="hospitalStep3HospitalHeading">สรุปค่าใช้จ่ายโรงพยาบาล</h4><div class="hospital-step3-summary-line"><span>ยอดเงินรวมตามใบเสร็จ</span><strong>${money(totals.receipt)}</strong></div><div class="hospital-step3-summary-line"><span>ค่าใช้จ่ายทั้งหมดสุทธิ</span><strong>${money(billedAmount)}</strong></div><div class="hospital-step3-summary-line"><span>สิทธิ์ความคุ้มครอง</span><strong>${money(totals.eligible)}</strong></div><div class="hospital-step3-summary-line"><span>ค่าชดเชย (รวมในสิทธิ์ความคุ้มครอง)</span><strong>0.00</strong></div><div class="hospital-step3-hospital-bill"><span>สิทธิ์โรงพยาบาลตั้งเบิกกับบริษัท</span><strong>${money(totals.eligible)}</strong></div><div class="hospital-step3-customer-excess"><span>ส่วนเกิน (ลูกค้าจ่าย)</span><strong>${money(totals.uncovered)}</strong></div></section></div>
            </div>
          </section>
        </div>`;
    }
    if (content) {
      content.onclick = function (event) {
        const scan = event.target.closest("[data-step3-scan]");
        const view = event.target.closest("[data-step3-view]");
        if (scan) content.querySelector(`[data-step3-file-input="${scan.dataset.step3Scan}"]`)?.click();
        if (view) {
          const details = content.querySelector(`[data-step3-document-details="${view.dataset.step3View}"]`);
          if (details) { details.hidden = !details.hidden; view.setAttribute("aria-expanded", String(!details.hidden)); }
        }
      };
      content.onchange = function (event) {
        const input = event.target.closest("[data-step3-file-input]");
        if (!input || !input.files?.length) return;
        const key = input.dataset.step3FileInput;
        entry[key] ||= [];
        entry[key].push(...Array.from(input.files));
        renderHospitalConfirmation(true);
      };
    }
    const button = document.getElementById("primaryActionBtn");
    if (button) {
      button.innerHTML = '<span class="material-icons-round align-middle" aria-hidden="true">fact_check</span> ส่งตรวจสอบ';
      button.onclick = window.submitHospitalClaimForBillingReview;
    }
    const back = document.getElementById("paymentBackBtn");
    if (back) back.onclick = renderHospitalExpenseStep;
    if (!preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
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
    if (current.subType === "IPD") {
      const entry = current.hospitalEntry || {};
      const ipdDays = Number(entry.ipdDays);
      const icuDays = Number(entry.icuDays);
      return { ipdDays, icuDays, totalStayDays: ipdDays + icuDays };
    }
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

  function getHospitalBillingRows() {
    try {
      return typeof hospitalBillingRows !== "undefined" && Array.isArray(hospitalBillingRows)
        ? hospitalBillingRows
        : [];
    } catch (_error) {
      return [];
    }
  }

  function buildHospitalConsiderationRecordFromClaimEntry(current) {
    const sourceState = current || state();
    const source = sourceState.paPrimaryRow || sourceState.row || {};
    const entry = sourceState.hospitalEntry || {};
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
    const prefix = product === "PA" ? "CLPA" : "CL";
    const usedClaimCodes = new Set(rows.map(function (item) { return item.claimCode; }).concat(
      getHospitalBillingRows().map(function (item) { return item.claimNo; })
    ));
    let nextNumber = 401;
    let nextClaimCode = `${prefix}${bangkokParts.year}${bangkokParts.month}${String(nextNumber).padStart(6, "0")}`;
    while (usedClaimCodes.has(nextClaimCode)) {
      nextNumber += 1;
      nextClaimCode = `${prefix}${bangkokParts.year}${bangkokParts.month}${String(nextNumber).padStart(6, "0")}`;
    }
    const claimCode = sourceState.createdHospitalConsiderationClaimCode || nextClaimCode;
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
      claimNoticeDate: sourceState.claimDates?.received || "",
      incidentDate: sourceState.claimDates?.incident || source.incidentDate || "",
      incidentTime: entry.incidentTime || "",
      admitDate: sourceState.claimDates?.admit || source.admitDate || "",
      admitTime: entry.admitTime || "",
      dischargeDate: sourceState.claimDates?.discharge || source.dischargeDate || "",
      dischargeTime: entry.dischargeTime || "",
      ipdDays: stay.ipdDays,
      icuDays: stay.icuDays,
      totalStayDays: stay.totalStayDays,
      chiefComplaint: entry.chiefComplaint || selectedSymptom(),
      diagnosis: entry.diagnosis1 || source.diagnosis || source.diagnosis1 || "-",
      diagnosis1: entry.diagnosis1 || source.diagnosis1 || source.diagnosis || "-",
      diagnosis2: entry.diagnosis2 || "-",
      diagnosis3: entry.diagnosis3 || "-",
      medicalDescription: entry.medicalDescription || "",
      note: entry.note || "",
      isPhysicalTherapy: entry.isPhysicalTherapy === true,
      medicalNecessity: entry.isPhysicalTherapy ? entry.medicalNecessity || null : null,
      trafficAccident: {
        isTrafficAccident: entry.isTrafficAccident || "",
        vehicle: entry.vehicle || "",
        vehicleOther: entry.vehicleOther || "",
        casualty: entry.casualty || "",
        poroboExcess: entry.poroboExcess || "",
        noPoroboReason: entry.noPoroboReason || ""
      },
      hn: entry.hn || "",
      considerationDetails: entry.considerationDetails || "",
      doctorLicense: entry.doctorLicense || "",
      doctorName: entry.doctorName || "",
      isContinuous: sourceState.isContinuous === true,
      previousClaimNo: sourceState.continuousClaim?.claimNo || source.previousClaimNo || "",
      previousCaseNo: sourceState.continuousCaseNo || source.previousCaseNo || "",
      previousServiceDate: sourceState.continuousClaim?.incidentDate || source.previousServiceDate || "",
      scannedDocuments: { ...(sourceState.scanned || {}) },
      attachedDocuments: (entry.documents || []).map(function (file) { return { name: file.name, size: file.size, type: file.type }; }),
      expenseDocuments: (entry.expenseFiles || []).map(function (file) { return { name: file.name, size: file.size, type: file.type }; }),
      expenseItems: (entry.expenseRows || []).filter(hasExpenseData).map(function (item) { return { ...item }; }),
      expenseTotals: expenseTotals(),
      insuranceExcess: entry.insuranceExcess === true
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

  let hospitalSubmitPending = false;
  let hospitalSubmitReturnFocus = null;

  function submittedHospitalBillingRow() {
    const claimCode = state().hospitalBillingSubmissionClaimCode;
    return claimCode ? getHospitalBillingRows().find(function (row) {
      return row.sourceKey === `claim-entry-hospital:${claimCode}`;
    }) : null;
  }

  function closeHospitalSubmitModal(restoreFocus = true) {
    const modal = document.getElementById("claimModal");
    if (!modal?.querySelector("[data-hospital-submit-dialog]")) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.removeEventListener("keydown", hospitalSubmitKeydown);
    if (restoreFocus && hospitalSubmitReturnFocus?.isConnected) hospitalSubmitReturnFocus.focus();
    hospitalSubmitReturnFocus = null;
  }

  function hospitalSubmitKeydown(event) {
    const dialog = document.querySelector("#claimModal [data-hospital-submit-dialog]");
    if (!dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeHospitalSubmitModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialog.querySelectorAll("button:not([disabled])"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openHospitalSubmitModal(html, focusSelector) {
    const modal = document.getElementById("claimModal");
    const box = document.getElementById("claimModalBox");
    if (!modal || !box) return;
    if (modal.classList.contains("hidden") || !modal.querySelector("[data-hospital-submit-dialog]")) {
      hospitalSubmitReturnFocus = document.activeElement;
    }
    box.className = "hospital-submit-modal-box w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl";
    box.innerHTML = html;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.removeEventListener("keydown", hospitalSubmitKeydown);
    modal.addEventListener("keydown", hospitalSubmitKeydown);
    box.querySelector(focusSelector)?.focus();
  }

  function showHospitalSubmitSuccess(row) {
    if (!row) return;
    openHospitalSubmitModal(`
      <section class="hospital-submit-dialog is-success" data-hospital-submit-dialog role="dialog" aria-modal="true" aria-labelledby="hospitalSubmitSuccessTitle">
        <div class="hospital-submit-head">
          <span class="hospital-submit-icon is-success" aria-hidden="true"><span class="material-icons-round">check_circle</span></span>
          <div><h3 id="hospitalSubmitSuccessTitle">ทำรายการสำเร็จ</h3></div>
          <button type="button" class="hospital-submit-close" data-hospital-submit-close aria-label="ปิดหน้าต่าง"><span class="material-icons-round" aria-hidden="true">close</span></button>
        </div>
        <div class="hospital-submit-body hospital-submit-success-body">
          <span class="hospital-submit-success-mark" aria-hidden="true"><span class="material-icons-round">check</span></span>
          <h3>ทำรายการสำเร็จ</h3>
          <p class="hospital-submit-success-description">ส่งรายการไปยัง ตรวจสอบ รพ.วางบิล แล้ว</p>
          <dl class="hospital-submit-details">
            <div><dt>เลขที่เคลม</dt><dd>${escapeHtml(row.claimNo)}</dd></div>
            <div><dt>เลขที่เคส</dt><dd>${escapeHtml(row.caseNo)}</dd></div>
            <div><dt>สถานะ</dt><dd><span class="hospital-submit-status">${escapeHtml(row.status)}</span></dd></div>
          </dl>
          <div class="hospital-submit-actions"><button type="button" class="hospital-submit-secondary" data-hospital-submit-close>ปิด</button><button type="button" class="hospital-submit-primary" data-hospital-submit-go>ไปหน้าตรวจสอบ รพ.วางบิล</button></div>
        </div>
      </section>`, "[data-hospital-submit-go]");
    const box = document.getElementById("claimModalBox");
    box.querySelectorAll("[data-hospital-submit-close]").forEach(function (button) {
      button.addEventListener("click", function () { closeHospitalSubmitModal(); });
    });
    box.querySelector("[data-hospital-submit-go]")?.addEventListener("click", function () {
      closeHospitalSubmitModal(false);
      window.showBillingHospitalPage?.();
      const heading = document.getElementById("pageTitle");
      if (heading) { heading.tabIndex = -1; heading.focus(); }
    });
  }

  function confirmHospitalSubmission() {
    if (hospitalSubmitPending || !isHospitalClaim()) return;
    const button = document.querySelector("#claimModal [data-hospital-submit-confirm]");
    const error = document.querySelector("#claimModal [data-hospital-submit-error]");
    hospitalSubmitPending = true;
    if (button) button.disabled = true;
    if (error) { error.hidden = true; error.textContent = ""; }
    try {
      const record = buildHospitalConsiderationRecordFromClaimEntry(state());
      const row = window.registerHospitalBillingClaimEntry?.(record);
      if (!row?.claimNo || !row?.caseNo) throw new Error("ไม่สามารถลงทะเบียนรายการได้");
      state().hospitalBillingSubmissionClaimCode = row.claimNo;
      showHospitalSubmitSuccess(row);
    } catch (_error) {
      if (error) {
        error.textContent = "ส่งตรวจสอบไม่สำเร็จ กรุณาลองยืนยันทำรายการอีกครั้ง";
        error.hidden = false;
      }
      if (button) { button.disabled = false; button.focus(); }
    } finally {
      hospitalSubmitPending = false;
    }
  }

  window.submitHospitalClaimForBillingReview = function () {
    if (!isHospitalClaim()) return;
    const submitted = submittedHospitalBillingRow();
    if (submitted) { showHospitalSubmitSuccess(submitted); return; }
    const current = state();
    const source = current.paPrimaryRow || current.row || {};
    const hospital = current.hospitalName || source.hospital || "-";
    openHospitalSubmitModal(`
      <section class="hospital-submit-dialog is-confirm" data-hospital-submit-dialog role="dialog" aria-modal="true" aria-labelledby="hospitalSubmitConfirmTitle" aria-describedby="hospitalSubmitConfirmDescription">
        <div class="hospital-submit-head">
          <span class="hospital-submit-icon" aria-hidden="true"><span class="material-icons-round">fact_check</span></span>
          <div><h3 id="hospitalSubmitConfirmTitle">ยืนยันทำรายการ</h3></div>
          <button type="button" class="hospital-submit-close" data-hospital-submit-close aria-label="ปิดหน้าต่าง"><span class="material-icons-round" aria-hidden="true">close</span></button>
        </div>
        <div class="hospital-submit-body">
          <dl class="hospital-submit-details">
            <div><dt>ผู้เอาประกัน</dt><dd>${escapeHtml(source.name || "-")}</dd></div>
            <div><dt>สถานพยาบาล</dt><dd>${escapeHtml(hospital)}</dd></div>
          </dl>
          <div class="hospital-submit-treatment">
            <span class="hospital-submit-treatment-icon" aria-hidden="true"><span class="material-icons-round">medical_services</span></span>
            <dl><div><dt>ประเภทการรักษา</dt><dd>${escapeHtml(current.subType || "-")}</dd></div></dl>
            <dl class="hospital-submit-amount"><div><dt>ค่าใช้จ่ายทั้งหมดสุทธิ</dt><dd>${escapeHtml(money(Math.max(0, expenseTotals().receipt - expenseTotals().discount)))} บาท</dd></div></dl>
          </div>
          <div class="hospital-submit-destination"><span class="material-icons-round" aria-hidden="true">info</span><span><span id="hospitalSubmitConfirmDescription">กรุณาตรวจสอบข้อมูลก่อนส่งตรวจสอบ</span><br>รายการนี้จะถูกส่งไป ตรวจสอบ รพ.วางบิล</span></div>
          <p class="hospital-submit-error" data-hospital-submit-error role="alert" hidden></p>
          <div class="hospital-submit-actions"><button type="button" class="hospital-submit-secondary" data-hospital-submit-close>ยกเลิก</button><button type="button" class="hospital-submit-primary" data-hospital-submit-confirm>ยืนยันทำรายการ</button></div>
        </div>
      </section>`, "[data-hospital-submit-close]");
    const box = document.getElementById("claimModalBox");
    box.querySelectorAll("[data-hospital-submit-close]").forEach(function (button) {
      button.addEventListener("click", function () { closeHospitalSubmitModal(); });
    });
    box.querySelector("[data-hospital-submit-confirm]")?.addEventListener("click", confirmHospitalSubmission);
  };
  window.submitHospitalClaimForConsideration = window.submitHospitalClaimForBillingReview;

  window.buildHospitalConsiderationRecordFromClaimEntry = buildHospitalConsiderationRecordFromClaimEntry;
  window.syncClaimEntryToHospitalConsideration = syncClaimEntryToHospitalConsideration;
  window.validateHospitalClaimFacility = validateHospitalFacility;

  const originalRenderClaimEntry = window.renderClaimEntry;
  if (typeof originalRenderClaimEntry === "function") {
    assignGlobal("renderClaimEntry", function () {
      ensureStateDefaults();
      if (isHospitalClaim()) state().coverageType = MEDICAL_COVERAGE;
      const result = originalRenderClaimEntry.apply(this, arguments);
      renumberClaimSections();
      return result;
    });
  }

  const originalRenderSelections = window.renderClaimSelectionControls;
  if (typeof originalRenderSelections === "function") {
    assignGlobal("renderClaimSelectionControls", function () {
      ensureStateDefaults();
      if (isHospitalClaim()) state().coverageType = MEDICAL_COVERAGE;
      const result = originalRenderSelections.apply(this, arguments);
      renumberClaimSections();
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
      window.renderHospitalClaimEntryForm?.();
      return result;
    });
  }

  const originalValidateHospital = window.validateRequiredHospital;
  assignGlobal("validateRequiredHospital", function (shouldFocus) {
    if (isHospitalClaim()) {
      return validateHospitalFacility(false);
    }
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
      if (isHospitalClaim()) return renderHospitalExpenseStep();
      document.getElementById("paymentPage")?.classList.remove("hospital-entry-payment-mode");
      document.getElementById("paymentPage")?.classList.remove("hospital-entry-step3-mode");
      const step = document.getElementById("payStepper");
      if (step) { step.classList.add("hidden"); step.innerHTML = ""; }
      return originalRenderPayment.apply(this, arguments);
    });
  }

  const originalShowPaymentPage = window.showPaymentPage;
  if (typeof originalShowPaymentPage === "function") {
    assignGlobal("showPaymentPage", function () {
      if (!isHospitalClaim()) return originalShowPaymentPage.apply(this, arguments);
      window.showClaimPage?.("paymentPage", "แจ้งเคลม รพ. - " + currentProduct(), "บันทึกเคลม/ค้นหาผู้เอาประกัน");
      renderHospitalExpenseStep();
    });
  }

  let openingHospitalClaimEntry = false;

  const originalShowClaimEntryPage = window.showClaimEntryPage;
  if (typeof originalShowClaimEntryPage === "function") {
    assignGlobal("showClaimEntryPage", function () {
      if (!isHospitalClaim()) return originalShowClaimEntryPage.apply(this, arguments);
      window.showClaimPage?.("claimEntryPage", "แจ้งเคลม รพ. - " + currentProduct(), "บันทึกเคลม/ค้นหาผู้เอาประกัน");
      window.renderClaimEntry?.();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  const originalReset = window.resetClaimEntryState;
  if (typeof originalReset === "function") {
    assignGlobal("resetClaimEntryState", function () {
      const result = originalReset.apply(this, arguments);
      const current = ensureStateDefaults();
      current.claimCategory = openingHospitalClaimEntry ? HOSPITAL : CUSTOMER;
      if (openingHospitalClaimEntry) {
        current.coverageType = MEDICAL_COVERAGE;
        current.claimDates = {};
      }
      current.hospitalName = "";
      current.hospitalEntry = {};
      current.createdHospitalConsiderationClaimCode = "";
      current.hospitalBillingSubmissionClaimCode = "";
      return result;
    });
  }

  const originalOpenClaimEntry = window.openClaimEntry;
  if (typeof originalOpenClaimEntry === "function") {
    assignGlobal("openClaimEntry", function () {
      ensureStateDefaults().claimCategory = openingHospitalClaimEntry ? HOSPITAL : CUSTOMER;
      const result = originalOpenClaimEntry.apply(this, arguments);
      if (openingHospitalClaimEntry) window.renderClaimEntry?.();
      document.getElementById("claimCategorySection")?.remove();
      renumberClaimSections();
      return result;
    });
  }

  window.openHospitalClaimEntry = function (index) {
    if (typeof window.openClaimEntry !== "function") return;
    openingHospitalClaimEntry = true;
    try {
      window.openClaimEntry(index);
    } finally {
      openingHospitalClaimEntry = false;
    }
  };

  const originalOpenContinuous = window.openContinuousClaimEntry;
  if (typeof originalOpenContinuous === "function") {
    assignGlobal("openContinuousClaimEntry", function () {
      const current = ensureStateDefaults();
      current.claimCategory = CUSTOMER;
      current.hospitalName = "";
      current.createdHospitalConsiderationClaimCode = "";
      current.hospitalBillingSubmissionClaimCode = "";
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
    document.getElementById("claimCategorySection")?.remove();
    renumberClaimSections();
    // Earlier late patches also install DOM-ready wrappers; install this route last.
    setTimeout(installHospitalConsiderationRouting, 0);
  }, { once: true });
  if (document.readyState !== "loading") setTimeout(installHospitalConsiderationRouting, 0);
})();
