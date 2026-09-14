/* ============================================================
   menu-hospital-claim-step1-decision-doc-reset.js
   เคลมโรงพยาบาล: ปรับผลพิจารณา + ล้างผลตรวจเมื่อเอกสารเปลี่ยน
   ============================================================ */
(function () {
  "use strict";

  const PAGE_SELECTOR = "#considerHospitalOpdHalfPage,#considerHospitalOpdFullPage,#billingHospitalReviewPage";
  const STEP_SELECTOR = "#hhStepPane1,#hhStepPane2,#hhStepPane3,#hfStepPane1,#hfStepPane2,#hfStepPane3";
  const STEP1_SELECTOR = "#hhStepPane1,#hfStepPane1";
  const RESULT_VALUES = ["ผ่าน", "ไม่ผ่าน", "รอเอกสารเพิ่มเติม"];
  const SCAN_SELECTOR = ".customer-scan-btn,.opd-half-search-doc-btn,[data-v123-scan],[data-hospital-doc-scan],[data-scan-doc],button[onclick^='mockScanDoc']";
  const COUNT_SELECTOR = "[data-doc-count],.opd-half-doc-count";

  let scheduled = false;
  const billingResetDocIndexes = new Set();

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function pageOf(node) {
    return node?.closest?.(PAGE_SELECTOR) || null;
  }

  function stepPaneOf(node) {
    return node?.closest?.(STEP_SELECTOR) || null;
  }

  function rowOf(node) {
    return node?.closest?.("tr") || null;
  }

  function isHospitalStep1Row(row) {
    return !!row && !!row.closest(PAGE_SELECTOR) && (
      !!row.closest(STEP1_SELECTOR) ||
      !!row.closest("#billingReviewDocRows,.billing-doc-check-section")
    );
  }

  function mapShortResult(value) {
    const raw = clean(value);
    if (RESULT_VALUES.includes(raw)) return raw;
    if (raw === "pass") return "ผ่าน";
    if (raw === "fail") return "ไม่ผ่าน";
    if (raw === "wait" || raw === "more") return "รอเอกสารเพิ่มเติม";
    return raw;
  }

  function resultButtons(row) {
    if (!row) return [];
    return Array.from(row.querySelectorAll("button")).filter(button => {
      const value = mapShortResult(button.dataset.docResult || button.dataset.v123DocResult || button.dataset.scanResultBtn || clean(button.textContent));
      return RESULT_VALUES.includes(value) || button.classList.contains("hospital-doc-result-btn") || button.classList.contains("opd-half-doc-result-btn");
    });
  }

  function clearResultButtonVisual(button) {
    button.classList.remove(
      "is-selected",
      "selected",
      "active",
      "pass",
      "fail",
      "more",
      "bg-emerald-50",
      "border-emerald-300",
      "text-emerald-700",
      "bg-rose-50",
      "border-rose-300",
      "text-rose-700",
      "bg-amber-50",
      "border-amber-300",
      "text-amber-700",
      "shadow-sm"
    );
    button.classList.add("bg-white", "border-slate-200", "text-slate-500");
    button.setAttribute("aria-pressed", "false");
  }

  function dispatchHospitalDocChanged(row) {
    if (!row) return;
    row.dispatchEvent(new CustomEvent("hospital-doc-result-reset", { bubbles: true }));
    row.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clearHospitalDocResult(row) {
    if (!isHospitalStep1Row(row)) return;
    delete row.dataset.hospitalDocResult;
    row.removeAttribute("data-hospital-doc-result");
    resultButtons(row).forEach(clearResultButtonVisual);
    dispatchHospitalDocChanged(row);
  }

  function billingDocIndex(row) {
    const body = row?.closest?.("#billingReviewDocRows");
    if (!body) return -1;
    return Array.from(body.querySelectorAll("tr")).indexOf(row);
  }

  function clearBillingResetRows(root) {
    const page = root?.matches?.("#billingHospitalReviewPage") ? root : document.getElementById("billingHospitalReviewPage");
    if (!page || !billingResetDocIndexes.size) return;
    page.querySelectorAll("#billingReviewDocRows tr").forEach((row, index) => {
      if (!billingResetDocIndexes.has(index)) return;
      clearHospitalDocResult(row);
    });
  }

  function markCountValue(countEl) {
    if (!countEl) return;
    countEl.dataset.previousDocCount = clean(countEl.textContent || countEl.value);
  }

  function normalizeDecisionSection(section) {
    if (!section || !section.closest(PAGE_SELECTOR)) return;

    const title = section.querySelector(".customer-panel-title,.dd-doc-title");
    if (
      title &&
      clean(title.textContent).includes("ผลการพิจารณา") &&
      (title.dataset.hospitalDecisionTitleNormalized !== "true" ||
        !clean(title.textContent).includes("แจ้งผลการพิจารณาโรงพยาบาล"))
    ) {
      const icon = title.querySelector(".material-icons-round,.material-symbols-outlined");
      title.textContent = "";
      if (icon) title.appendChild(icon);
      title.appendChild(document.createTextNode("แจ้งผลการพิจารณาโรงพยาบาล"));
      title.dataset.hospitalDecisionTitleNormalized = "true";
    }

    section.querySelectorAll('.dd-decision-btn[data-decision="edit"]').forEach(button => {
      if (
        button.dataset.hospitalDecisionEditNormalized === "true" &&
        clean(button.textContent).includes("แจ้งแก้ไข")
      ) {
        button.title = "แจ้งแก้ไข";
        return;
      }
      const icon = button.querySelector(".material-icons-round,.material-symbols-outlined");
      button.textContent = "";
      if (icon) button.appendChild(icon);
      button.appendChild(document.createTextNode("แจ้งแก้ไข"));
      button.title = "แจ้งแก้ไข";
      button.dataset.hospitalDecisionEditNormalized = "true";
    });

    section.querySelectorAll('.dd-decision-btn[data-decision="cancel"]').forEach(button => {
      const active = button.classList.contains("active") || button.getAttribute("aria-pressed") === "true";
      button.remove();
      if (active) clearCancelDecisionState();
    });
  }

  function removeDraftButtons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll?.("#billingHospitalReviewPage button").forEach(button => {
      const text = clean(button.textContent);
      const onclick = button.getAttribute("onclick") || "";
      if (text.includes("บันทึกแบบร่าง") || onclick.includes("saveBillingReviewDraft")) button.remove();
    });
  }

  function clearCancelDecisionState() {
    if (window.customerDecisionState?.type === "cancel") window.customerDecisionState.type = "";
    if (window.hospitalDecisionState?.type === "cancel") window.hospitalDecisionState.type = "";
  }

  function normalizeDecisions(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches?.(".customer-decision-section,.dd-section")) normalizeDecisionSection(scope);
    scope.querySelectorAll(`${PAGE_SELECTOR} .customer-decision-section,${PAGE_SELECTOR} .dd-section`).forEach(section => {
      if (section.querySelector(".dd-decision-btn[data-decision]")) normalizeDecisionSection(section);
    });
    clearCancelDecisionState();
  }

  function markCounts(root) {
    const scope = root && root.querySelectorAll ? root : document;
    if (scope.matches?.(COUNT_SELECTOR)) markCountValue(scope);
    scope.querySelectorAll?.(COUNT_SELECTOR).forEach(markCountValue);
  }

  function normalizeAll() {
    normalizeDecisions(document);
    markCounts(document);
    clearBillingResetRows(document);
    removeDraftButtons(document);
  }

  function scheduleNormalize() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      normalizeAll();
    });
  }

  document.addEventListener("click", function (event) {
    const resultButton = event.target?.closest?.(".hospital-doc-result-btn,.opd-half-doc-result-btn,[data-v123-doc-result],[data-doc-result]");
    if (resultButton && resultButton.closest("#billingHospitalReviewPage")) {
      const index = billingDocIndex(rowOf(resultButton));
      if (index >= 0) billingResetDocIndexes.delete(index);
      return;
    }
    if (resultButton && resultButton.closest(STEP1_SELECTOR)) return;

    const scanButton = event.target?.closest?.(SCAN_SELECTOR);
    const row = rowOf(scanButton);
    if (!isHospitalStep1Row(row)) return;

    setTimeout(function () {
      clearHospitalDocResult(row);
      scheduleNormalize();
    }, 0);
  }, true);

  document.addEventListener("change", function (event) {
    const target = event.target;
    if (!target || !target.closest?.(STEP1_SELECTOR)) return;
    if (target.closest(".hospital-doc-result-btn,.opd-half-doc-result-btn,[data-v123-doc-result],[data-doc-result]")) return;

    const row = rowOf(target);
    if (!isHospitalStep1Row(row)) return;
    if (target.matches("input[type='file'],[data-doc-count],.opd-half-doc-count,[data-hospital-doc-file],[data-hospital-doc-count]")) {
      clearHospitalDocResult(row);
      scheduleNormalize();
    }
  }, true);

  const observer = new MutationObserver(function (mutations) {
    let shouldNormalize = false;

    mutations.forEach(mutation => {
      if (mutation.type === "childList") {
        shouldNormalize = shouldNormalize || Array.from(mutation.addedNodes || []).some(node => {
          if (node.nodeType !== 1) return false;
          return !!pageOf(node) || !!node.querySelector?.(PAGE_SELECTOR) || !!stepPaneOf(node) || !!node.querySelector?.(STEP_SELECTOR);
        });
      }

      if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        const countEl = parent?.closest?.(COUNT_SELECTOR);
        const row = rowOf(countEl);
        if (!isHospitalStep1Row(row) || !countEl) return;

        const previous = countEl.dataset.previousDocCount || "";
        const current = clean(countEl.textContent || countEl.value);
        if (previous !== current) {
          clearHospitalDocResult(row);
          markCountValue(countEl);
        }
      }

      if (mutation.type === "attributes") {
        const target = mutation.target;
        if (target.matches?.(COUNT_SELECTOR)) {
          const row = rowOf(target);
          if (isHospitalStep1Row(row)) {
            const previous = target.dataset.previousDocCount || "";
            const current = clean(target.textContent || target.value);
            if (previous !== current) clearHospitalDocResult(row);
            markCountValue(target);
          }
        }
        if (target.matches?.(".dd-decision-btn[data-decision],.customer-panel-title,.dd-doc-title")) {
          shouldNormalize = true;
        }
      }
    });

    if (shouldNormalize) scheduleNormalize();
  });

  function wrapNavigation(name) {
    const previous = window[name];
    if (typeof previous !== "function" || previous.__hospitalStep1DecisionDocReset) return;
    const wrapped = function () {
      const result = previous.apply(this, arguments);
      scheduleNormalize();
      setTimeout(normalizeAll, 40);
      return result;
    };
    wrapped.__hospitalStep1DecisionDocReset = true;
    window[name] = wrapped;
    try { eval(name + "=wrapped"); } catch (_e) {}
  }

  function wrapBillingMockScan() {
    const previous = window.mockScanDoc;
    if (typeof previous !== "function" || previous.__hospitalStep1DecisionDocReset) return;
    const wrapped = function (index) {
      const result = previous.apply(this, arguments);
      const numericIndex = Number(index);
      if (Number.isFinite(numericIndex)) billingResetDocIndexes.add(numericIndex);
      const state = typeof window.__getBillingHospitalReviewState === "function" ? window.__getBillingHospitalReviewState() : null;
      const doc = state?.docs?.[numericIndex];
      if (doc) doc.result = "__reset__";
      if (typeof window.setBillingReviewStep === "function") {
        window.setBillingReviewStep(1);
      } else {
        scheduleNormalize();
        setTimeout(normalizeAll, 40);
      }
      return result;
    };
    wrapped.__hospitalStep1DecisionDocReset = true;
    window.mockScanDoc = wrapped;
    try { eval("mockScanDoc=wrapped"); } catch (_e) {}
  }

  function wrapBillingAddDoc() {
    const previous = window.addBillingReviewDoc;
    if (typeof previous !== "function" || previous.__hospitalStep1DecisionDocReset) return;
    const wrapped = function () {
      const result = previous.apply(this, arguments);
      const state = typeof window.__getBillingHospitalReviewState === "function" ? window.__getBillingHospitalReviewState() : null;
      const index = Array.isArray(state?.docs) ? state.docs.length - 1 : -1;
      if (index >= 0) {
        billingResetDocIndexes.add(index);
        state.docs[index].result = "__reset__";
      }
      if (typeof window.setBillingReviewStep === "function") window.setBillingReviewStep(1);
      else {
        scheduleNormalize();
        setTimeout(normalizeAll, 40);
      }
      return result;
    };
    wrapped.__hospitalStep1DecisionDocReset = true;
    window.addBillingReviewDoc = wrapped;
    try { eval("addBillingReviewDoc=wrapped"); } catch (_e) {}
  }

  function start() {
    normalizeAll();
    wrapNavigation("setHospitalFullStep");
    wrapNavigation("setHospitalHalfStep");
    wrapNavigation("openConsiderHospitalRow");
    wrapNavigation("openHospitalBillingReview");
    wrapNavigation("setBillingReviewStep");
    wrapBillingMockScan();
    wrapBillingAddDoc();
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "aria-pressed", "data-hospital-doc-result", "data-doc-count", "value"]
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();

/* Keep hospital decision reason fields scoped to the clicked/visible section.
   Legacy renderers write the same reason select IDs into every decision section,
   which can make validation or native select focus hit a hidden duplicate. */
(function () {
  "use strict";

  const PAGE_SELECTOR = "#considerHospitalOpdHalfPage,#considerHospitalOpdFullPage,#billingHospitalReviewPage";
  const STEP_SELECTOR = "#hhStepPane1,#hhStepPane2,#hhStepPane3,#hfStepPane1,#hfStepPane2,#hfStepPane3";

  const reasons = {
    waitdocs: ["เอกสารไม่ครบถ้วน", "ขอเอกสารประกอบเพิ่มเติม", "เอกสารไม่ชัดเจน", "เอกสารไม่ตรงกับข้อมูลเคลม", "รอเอกสารจากผู้เอาประกัน"],
    edit: ["บันทึกข้อมูลในระบบไม่ถูกต้อง", "บันทึกยอดเงินในระบบไม่ถูกต้อง", "ข้อมูลผู้เอาประกันไม่ถูกต้อง", "ข้อมูลการรักษาไม่ถูกต้อง", "ไม่มีไฟล์สแกน", "อนุมัติบางส่วน"],
    reject: ["อยู่ในระยะรอคอย", "เป็นข้อยกเว้นของกรมธรรม์", "เป็นโรคยกเว้นของกรมธรรม์", "ไม่มีความคุ้มครอง", "เต็มสิทธิ์ความคุ้มครอง", "เกินระยะเวลาดำเนินการ"],
    cancel: ["ผู้เอาประกันขอยกเลิกเคลม", "โรงพยาบาลยกเลิกรายการ", "แจ้งเคลมซ้ำ", "บันทึกข้อมูลผิดรายการ", "ไม่ประสงค์ดำเนินการต่อ"]
  };

  const configs = {
    waitdocs: {
      icon: "hourglass_top",
      title: "รอเอกสาร",
      chip: "ขอเอกสารเพิ่มเติม",
      reasonId: "ccWaitDocReason",
      reasonLabel: "สาเหตุรอเอกสาร",
      detailId: "ccWaitDocDetail",
      detailLabel: "รายละเอียดเอกสารที่ต้องการ",
      detailPlaceholder: "ระบุรายละเอียดเอกสารที่ต้องการเพิ่มเติม"
    },
    edit: {
      icon: "edit_note",
      title: "รอแก้ไข",
      chip: "ขอแก้ไขข้อมูล",
      reasonId: "ccEditReason",
      reasonLabel: "สาเหตุรอแก้ไข",
      detailId: "ccEditDetail",
      detailLabel: "รายละเอียดการรอแก้ไข",
      detailPlaceholder: "ระบุรายละเอียดการรอแก้ไข"
    },
    reject: {
      icon: "block",
      title: "ปฏิเสธ",
      chip: "ปิดผลเป็นปฏิเสธ",
      reasonId: "ccRejectReason",
      reasonLabel: "สาเหตุการปฏิเสธ",
      detailId: "ccRejectDetail",
      detailLabel: "รายละเอียดการปฏิเสธ",
      detailPlaceholder: "ระบุรายละเอียดการปฏิเสธ",
      extra: '<div class="dd-document-request-box"><div class="dd-document-request-title"><span class="material-icons-round">upload_file</span>เอกสารประกอบการปฏิเสธ</div><table class="dd-document-request-table"><thead><tr><th>ประเภทเอกสาร</th><th>สแกนเอกสาร</th><th>จำนวนเอกสาร</th><th>รายละเอียด</th></tr></thead><tbody><tr><td>เอกสารประกอบการปฏิเสธ</td><td><button type="button" class="dd-small-action-btn"><span class="material-icons-round">document_scanner</span>สแกนเอกสาร</button></td><td>0</td><td><button type="button" class="tt-action view"><span class="material-icons-round">visibility</span></button></td></tr></tbody></table></div>'
    }
  };

  let lastHospitalDecisionSection = null;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[ch] || ch));
  }

  function optionList(items) {
    return '<option value="">กรุณาเลือกสาเหตุ</option>' + (items || []).map(item => {
      const value = escapeHtml(item);
      return `<option value="${value}">${value}</option>`;
    }).join("");
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.classList?.contains("hidden")) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    return !el.parentElement || isVisible(el.parentElement);
  }

  function currentHospitalPage() {
    return Array.from(document.querySelectorAll(PAGE_SELECTOR)).find(isVisible) || null;
  }

  function dynamicTargets(page) {
    return Array.from(page?.querySelectorAll(".customerDecisionDynamicFields,#customerDecisionDynamicFields,.dd-decision-dynamic") || []);
  }

  function clearDynamicTarget(target) {
    target.classList.add("hidden");
    target.innerHTML = "";
  }

  function targetForDecision(page, type) {
    if (
      lastHospitalDecisionSection &&
      lastHospitalDecisionSection.isConnected &&
      lastHospitalDecisionSection.closest(PAGE_SELECTOR) === page
    ) {
      const direct = lastHospitalDecisionSection.querySelector(".customerDecisionDynamicFields,#customerDecisionDynamicFields,.dd-decision-dynamic");
      if (direct) return direct;
    }

    const activeSection = Array.from(page?.querySelectorAll(".customer-decision-section,.dd-section") || []).find(section => {
      if (!section.querySelector(`.dd-decision-btn[data-decision="${type}"]`)) return false;
      return isVisible(section) || isVisible(section.closest(STEP_SELECTOR));
    });
    return activeSection?.querySelector(".customerDecisionDynamicFields,#customerDecisionDynamicFields,.dd-decision-dynamic") ||
      dynamicTargets(page).find(isVisible) ||
      dynamicTargets(page)[0] ||
      null;
  }

  function fieldHtml(type) {
    const cfg = configs[type];
    if (!cfg) return "";
    return '<div class="dd-decision-form-card">'
      + '<div class="dd-decision-form-head"><div class="dd-decision-form-title"><span class="material-icons-round">' + cfg.icon + "</span>" + cfg.title + '</div><span class="dd-decision-form-chip">' + cfg.chip + "</span></div>"
      + '<div class="dd-decision-form-body">'
      + '<div class="dd-fieldset-modern"><label for="' + cfg.reasonId + '">' + cfg.reasonLabel + ' <span class="req">*</span></label><select id="' + cfg.reasonId + '" class="dd-select-modern" data-hospital-decision-editable="true">' + optionList(reasons[type]) + "</select></div>"
      + '<div class="dd-fieldset-modern"><label for="' + cfg.detailId + '">' + cfg.detailLabel + '</label><textarea id="' + cfg.detailId + '" class="dd-textarea-modern" data-hospital-decision-editable="true" placeholder="' + cfg.detailPlaceholder + '"></textarea></div>'
      + (cfg.extra || "")
      + "</div></div>";
  }

  function syncPressed(page, type) {
    page?.querySelectorAll(".customer-decision-section .dd-decision-btn[data-decision],#customerDecisionSection .dd-decision-btn[data-decision]").forEach(button => {
      const active = !!type && button.dataset.decision === type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderHospitalFields(type) {
    const page = currentHospitalPage();
    if (!page) return false;

    syncPressed(page, type);
    const cfg = configs[type];
    const target = cfg ? targetForDecision(page, type) : null;

    dynamicTargets(page).forEach(fieldTarget => {
      if (fieldTarget !== target) clearDynamicTarget(fieldTarget);
    });

    if (!target || !cfg) return true;
    target.classList.remove("hidden");
    target.innerHTML = fieldHtml(type);
    target.querySelectorAll("select,textarea,input").forEach(field => {
      field.disabled = false;
      field.removeAttribute("disabled");
      field.removeAttribute("aria-disabled");
      field.dataset.hospitalDecisionEditable = "true";
    });
    return true;
  }

  function isHospitalDecisionClick(button) {
    return !!button?.closest?.(PAGE_SELECTOR) && !!button.closest(".customer-decision-section,.dd-section");
  }

  document.addEventListener("click", function (event) {
    const button = event.target?.closest?.(".dd-decision-btn[data-decision]");
    if (isHospitalDecisionClick(button)) lastHospitalDecisionSection = button.closest(".customer-decision-section,.dd-section");
  }, true);

  function install() {
    const previousSelect = window.selectCustomerDecision;
    const previousSync = window.syncCustomerDecisionUI;

    window.syncCustomerDecisionUI = function () {
      const page = currentHospitalPage();
      if (page && renderHospitalFields(clean(window.customerDecisionState?.type))) return;
      if (typeof previousSync === "function") return previousSync.apply(this, arguments);
    };

    window.selectCustomerDecision = function (type) {
      const clicked = clean(type);
      const page = currentHospitalPage();
      if (!page || !lastHospitalDecisionSection?.closest?.(PAGE_SELECTOR)) {
        return typeof previousSelect === "function" ? previousSelect.apply(this, arguments) : undefined;
      }

      const current = clean(window.customerDecisionState?.type);
      const next = current === clicked ? "" : clicked;
      window.customerDecisionState = { ...(window.customerDecisionState || {}), type: next };
      renderHospitalFields(next);

      try {
        if (typeof window.syncHospitalDecisionSaveButtonsV281 === "function") window.syncHospitalDecisionSaveButtonsV281();
        if (typeof window.enableHospitalDecisionSaveButtons === "function") window.enableHospitalDecisionSaveButtons();
        if (typeof window.syncHospitalDecisionSaveButtons === "function") window.syncHospitalDecisionSaveButtons();
      } catch (_e) {}
      return undefined;
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
