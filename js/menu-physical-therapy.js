(function () {
  "use strict";

  if (window.__claimAgentPhysicalTherapyV1) return;
  window.__claimAgentPhysicalTherapyV1 = true;

  const PAGE_SELECTOR = "#considerCustomerDetailPage,#considerHospitalOpdHalfPage,#considerHospitalOpdFullPage,#billingHospitalReviewPage";
  const STEP1_SELECTOR = "#ccStepPane1,#hhStepPane1,#hfStepPane1";
  const MEDICAL_NECESSITY = Object.freeze({
    PAIN_MANAGEMENT: Object.freeze({
      thai: "การบรรเทาและลดอาการปวด",
      english: "Pain Management",
      description: "การใช้เครื่องมือทางกายภาพบำบัด เช่น อัลตร้าซาวด์ / คลื่นช็อกเวฟ / เลเซอร์"
    }),
    RESTORING_MOBILITY: Object.freeze({
      thai: "การเพิ่มและฟื้นฟูการเคลื่อนไหว",
      english: "Restoring Mobility & Range of Motion",
      description: "การใช้เครื่องมือทางกายภาพบำบัด เช่น อัลตร้าซาวด์ / คลื่นช็อกเวฟ / เลเซอร์ เพื่อช่วยเพิ่มหรือฟื้นฟูช่วงการเคลื่อนไหว"
    }),
    POST_INJURY_POST_SURGICAL_REHAB: Object.freeze({
      thai: "การฟื้นฟูผู้ป่วยหลังการบาดเจ็บหรือผ่าตัด",
      english: "Post-injury & Post-surgical Rehabilitation",
      description: "การทำกายภาพบำบัดเพื่อฟื้นฟูสมรรถภาพหลังการบาดเจ็บหรือหลังการผ่าตัด"
    })
  });
  const MOCK_SEQUENCE = [
    { isPhysicalTherapy: true, medicalNecessity: "PAIN_MANAGEMENT" },
    { isPhysicalTherapy: false, medicalNecessity: null },
    { isPhysicalTherapy: true, medicalNecessity: "RESTORING_MOBILITY" },
    { isPhysicalTherapy: true, medicalNecessity: "POST_INJURY_POST_SURGICAL_REHAB" },
    { isPhysicalTherapy: false, medicalNecessity: null }
  ];
  let scheduled = false;

  function isValidNecessity(value) {
    return Object.prototype.hasOwnProperty.call(MEDICAL_NECESSITY, value);
  }

  function normalizeRecord(record, fallback) {
    const target = record && typeof record === "object" ? record : {};
    const source = fallback || { isPhysicalTherapy: false, medicalNecessity: null };
    if (typeof target.isPhysicalTherapy !== "boolean") target.isPhysicalTherapy = !!source.isPhysicalTherapy;
    if (!target.isPhysicalTherapy) target.medicalNecessity = null;
    else if (!isValidNecessity(target.medicalNecessity)) {
      target.medicalNecessity = isValidNecessity(source.medicalNecessity) ? source.medicalNecessity : null;
    }
    return target;
  }

  function applyMockData() {
    try {
      if (typeof considerationHospitalRows !== "undefined" && Array.isArray(considerationHospitalRows)) {
        considerationHospitalRows.forEach(function (row, index) {
          if (row?.source === "claim-entry-hospital") normalizeRecord(row);
          else {
            const mock = MOCK_SEQUENCE[index % MOCK_SEQUENCE.length];
            row.isPhysicalTherapy = mock.isPhysicalTherapy;
            row.medicalNecessity = mock.medicalNecessity;
          }
        });
      }
    } catch (_error) {}
    try {
      if (typeof hospitalBillingRows !== "undefined" && Array.isArray(hospitalBillingRows)) {
        hospitalBillingRows.forEach(function (row, index) {
          const mock = MOCK_SEQUENCE[index % MOCK_SEQUENCE.length];
          row.isPhysicalTherapy = mock.isPhysicalTherapy;
          row.medicalNecessity = mock.medicalNecessity;
        });
      }
    } catch (_error) {}
  }

  function currentRecord(page) {
    if (!page) return {};
    if (page.id === "considerCustomerDetailPage") return normalizeRecord(window.currentConsiderCustomerRow);
    if (page.id === "billingHospitalReviewPage") {
      const review = typeof window.__getBillingHospitalReviewState === "function" ? window.__getBillingHospitalReviewState() : {};
      return normalizeRecord(review);
    }
    return normalizeRecord(window.currentConsiderHospitalRow);
  }

  function create(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function buildHeading() {
    const heading = create("div", "physical-therapy-heading");
    const iconWrap = create("span", "physical-therapy-heading-icon");
    const icon = create("span", "material-icons-round", "accessibility_new");
    icon.setAttribute("aria-hidden", "true");
    iconWrap.appendChild(icon);
    const copy = create("div");
    copy.append(
      create("h3", "physical-therapy-title", "ข้อมูลกายภาพบำบัด"),
      create("p", "physical-therapy-subtitle", "ข้อมูลประกอบการพิจารณารายการรักษา")
    );
    heading.append(iconWrap, copy);
    return heading;
  }

  function setError(section, message) {
    const select = section.querySelector("[data-physical-therapy-select]");
    const error = section.querySelector("[data-physical-therapy-error]");
    if (!select || !error) return;
    const invalid = !!message;
    select.setAttribute("aria-invalid", String(invalid));
    error.textContent = message || "";
    error.hidden = !invalid;
  }

  function updateCustomerSection(section, record) {
    const checkbox = section.querySelector("[data-physical-therapy-checkbox]");
    const editor = section.querySelector("[data-physical-therapy-editor]");
    const select = section.querySelector("[data-physical-therapy-select]");
    const helper = section.querySelector("[data-physical-therapy-helper]");
    const active = !!checkbox.checked;
    record.isPhysicalTherapy = active;
    editor.hidden = !active;
    if (!active) {
      record.medicalNecessity = null;
      select.value = "";
      helper.hidden = true;
      helper.querySelector("span:last-child").textContent = "";
      setError(section, "");
      return;
    }
    record.medicalNecessity = isValidNecessity(select.value) ? select.value : null;
    const meta = MEDICAL_NECESSITY[record.medicalNecessity];
    helper.hidden = !meta;
    helper.querySelector("span:last-child").textContent = meta ? meta.description : "";
    if (meta) setError(section, "");
  }

  function buildCustomerSection(record, mode, pageId) {
    const editable = mode === "customer";
    const section = create("section", "physical-therapy-section");
    section.dataset.physicalTherapy = mode;
    section.appendChild(buildHeading());

    const checkboxLabel = create("label", "physical-therapy-checkbox-label");
    const checkbox = create("input", "physical-therapy-checkbox");
    checkbox.type = "checkbox";
    checkbox.checked = !!record.isPhysicalTherapy;
    checkbox.disabled = !editable;
    checkbox.dataset.physicalTherapyCheckbox = "true";
    checkboxLabel.append(checkbox, create("span", "", editable || record.isPhysicalTherapy ? "เป็นการกายภาพบำบัด" : "ไม่เป็นการกายภาพบำบัด"));

    const editor = create("div", "physical-therapy-editor");
    editor.dataset.physicalTherapyEditor = "true";
    editor.hidden = !record.isPhysicalTherapy;
    const fieldPrefix = mode === "customer" ? "customer" : pageId.replace(/Page$/, "");
    const selectId = fieldPrefix + "MedicalNecessity";
    const errorId = fieldPrefix + "MedicalNecessityError";
    const helperId = fieldPrefix + "MedicalNecessityHelper";
    const label = create("label", "physical-therapy-label");
    label.htmlFor = selectId;
    label.append("ความจำเป็นทางการแพทย์ ", create("span", "physical-therapy-required", "*"));
    const select = create("select", "physical-therapy-select");
    select.id = selectId;
    select.disabled = !editable;
    select.dataset.physicalTherapySelect = "true";
    select.setAttribute("aria-describedby", errorId + " " + helperId);
    select.setAttribute("aria-invalid", "false");
    const placeholder = create("option", "", "เลือกความจำเป็นทางการแพทย์");
    placeholder.value = "";
    select.appendChild(placeholder);
    Object.keys(MEDICAL_NECESSITY).forEach(function (key) {
      const meta = MEDICAL_NECESSITY[key];
      const option = create("option", "", meta.thai + " (" + meta.english + ")");
      option.value = key;
      select.appendChild(option);
    });
    select.value = isValidNecessity(record.medicalNecessity) ? record.medicalNecessity : "";
    const error = create("div", "physical-therapy-error");
    error.id = errorId;
    error.dataset.physicalTherapyError = "true";
    error.setAttribute("role", "alert");
    error.hidden = true;
    const helper = create("div", "physical-therapy-helper");
    helper.id = helperId;
    helper.dataset.physicalTherapyHelper = "true";
    const helperIcon = create("span", "material-icons-round", "info");
    helperIcon.setAttribute("aria-hidden", "true");
    helper.append(helperIcon, create("span", ""));
    const currentMeta = MEDICAL_NECESSITY[select.value];
    helper.hidden = !currentMeta;
    helper.lastElementChild.textContent = currentMeta ? currentMeta.description : "";
    editor.append(label, select, error, helper);
    section.append(checkboxLabel, editor);

    if (editable) {
      checkbox.addEventListener("change", function () { updateCustomerSection(section, record); });
      select.addEventListener("change", function () { updateCustomerSection(section, record); });
    }
    return section;
  }

  function hydratePage(page) {
    const pane = page.querySelector(STEP1_SELECTOR);
    if (!pane) return;
    const record = currentRecord(page);
    const mode = page.id === "considerCustomerDetailPage" ? "customer" : page.id === "billingHospitalReviewPage" ? "billing" : "hospital";
    const recordKey = String(record.claimCode || record.claimNo || record.bill?.claimCode || record.id || mode);
    const existing = pane.querySelector("[data-physical-therapy]");
    if (existing?.dataset.physicalTherapyRecordKey === recordKey) return;
    const section = buildCustomerSection(record, mode, page.id);
    section.dataset.physicalTherapyRecordKey = recordKey;
    if (existing) {
      existing.replaceWith(section);
      return;
    }
    const details = pane.querySelector(".treatment-detail-actual");
    const traffic = pane.querySelector("[data-hospital-traffic-accident]");
    if (traffic?.parentNode) traffic.parentNode.insertBefore(section, traffic);
    else if (details?.parentNode) details.parentNode.insertBefore(section, details.nextSibling);
    else pane.prepend(section);
  }

  function hydrateAll() {
    applyMockData();
    document.querySelectorAll(PAGE_SELECTOR).forEach(hydratePage);
  }

  function scheduleHydrate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      hydrateAll();
    });
  }

  function validateCustomer(focusInvalid) {
    const page = document.getElementById("considerCustomerDetailPage");
    const section = page?.querySelector("[data-physical-therapy='customer']");
    if (!section) return true;
    const record = currentRecord(page);
    const checkbox = section.querySelector("[data-physical-therapy-checkbox]");
    const select = section.querySelector("[data-physical-therapy-select]");
    if (!checkbox.checked) {
      record.isPhysicalTherapy = false;
      record.medicalNecessity = null;
      setError(section, "");
      return true;
    }
    record.isPhysicalTherapy = true;
    record.medicalNecessity = isValidNecessity(select.value) ? select.value : null;
    if (record.medicalNecessity) {
      setError(section, "");
      return true;
    }
    setError(section, "กรุณาเลือกความจำเป็นทางการแพทย์");
    if (focusInvalid !== false) {
      select.scrollIntoView({ behavior: "smooth", block: "center" });
      try { select.focus({ preventScroll: true }); } catch (_error) { select.focus(); }
    }
    return false;
  }

  function isVisible(element) {
    return !!element && !element.classList.contains("hidden") && getComputedStyle(element).display !== "none";
  }

  function wrapNavigation() {
    const previous = window.setCustomerStep;
    if (typeof previous !== "function" || previous.__physicalTherapyWrapped) return;
    const wrapped = function (step) {
      const pane = document.getElementById("ccStepPane1");
      if (Number(step) === 2 && isVisible(pane) && !validateCustomer(true)) return false;
      const result = previous.apply(this, arguments);
      scheduleHydrate();
      return result;
    };
    wrapped.__physicalTherapyWrapped = true;
    window.setCustomerStep = wrapped;
    try { eval("setCustomerStep=wrapped"); } catch (_error) {}
  }

  function wrapOpen(name) {
    const previous = window[name];
    if (typeof previous !== "function" || previous.__physicalTherapyWrapped) return;
    const wrapped = function () {
      const result = previous.apply(this, arguments);
      scheduleHydrate();
      setTimeout(hydrateAll, 60);
      return result;
    };
    wrapped.__physicalTherapyWrapped = true;
    window[name] = wrapped;
    try { eval(name + "=wrapped"); } catch (_error) {}
  }

  function wrapBillingInitialization() {
    const previous = window.__initializeBillingHospitalReviewState;
    if (typeof previous !== "function" || previous.__physicalTherapyWrapped) return;
    const wrapped = function () {
      const result = previous.apply(this, arguments);
      const row = result?.row || {};
      const review = result?.review || (typeof window.__getBillingHospitalReviewState === "function" ? window.__getBillingHospitalReviewState() : {});
      normalizeRecord(row);
      if (review && typeof review === "object") {
        review.isPhysicalTherapy = !!row.isPhysicalTherapy;
        review.medicalNecessity = review.isPhysicalTherapy && isValidNecessity(row.medicalNecessity) ? row.medicalNecessity : null;
      }
      return result;
    };
    wrapped.__physicalTherapyWrapped = true;
    window.__initializeBillingHospitalReviewState = wrapped;
  }

  window.addEventListener("click", function (event) {
    const button = event.target?.closest?.("#considerCustomerDetailPage #ccStepPane1 button");
    if (!button || !/ถัดไป|ยืนยันบันทึกผลพิจารณา|บันทึกผลพิจารณา/.test(String(button.textContent || ""))) return;
    if (validateCustomer(true)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  const observer = new MutationObserver(function (mutations) {
    const relevant = mutations.some(function (mutation) {
      const target = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
      if (target?.closest?.(PAGE_SELECTOR)) return true;
      return Array.from(mutation.addedNodes || []).some(function (node) {
        return node.nodeType === 1 && (node.matches?.(PAGE_SELECTOR) || node.querySelector?.(PAGE_SELECTOR));
      });
    });
    if (relevant) scheduleHydrate();
  });

  function start() {
    applyMockData();
    wrapBillingInitialization();
    wrapNavigation();
    wrapOpen("openConsiderCustomerRow");
    wrapOpen("openConsiderHospitalRow");
    wrapOpen("openHospitalBillingReview");
    observer.observe(document.body, { subtree: true, childList: true });
    hydrateAll();
  }

  window.CLAIM_AGENT_MEDICAL_NECESSITY = MEDICAL_NECESSITY;
  window.validateCustomerPhysicalTherapy = validateCustomer;
  window.__getPhysicalTherapyState = function (pageOrSelector) {
    const page = typeof pageOrSelector === "string" ? document.querySelector(pageOrSelector) : pageOrSelector;
    const record = currentRecord(page);
    return { isPhysicalTherapy: !!record.isPhysicalTherapy, medicalNecessity: record.medicalNecessity || null };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
