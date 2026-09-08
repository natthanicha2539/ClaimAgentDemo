/* ============================================================
   menu-hospital-claim-traffic-accident.js
   ข้อมูลอุบัติเหตุจากการจราจร > Step 1
   - พิจารณาเคลมโรงพยาบาล / วางบิลโรงพยาบาล: มีค่าเริ่มต้นและอ่านอย่างเดียว
   - พิจารณาเคลมลูกค้า: เริ่มต้นว่างและเลือกได้
   - ตัดผลการตรวจ/หมายเหตุและ validation ของเอกสาร
   ============================================================ */
(function () {
  "use strict";

  const PAGE_SELECTOR = "#considerHospitalOpdHalfPage,#considerHospitalOpdFullPage,#billingHospitalReviewPage,#considerCustomerDetailPage";
  const STEP1_SELECTOR = "#hhStepPane1,#hfStepPane1,#ccStepPane1";
  const stateByClaim = new Map();
  let scheduled = false;

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function currentClaimKey(page) {
    const row = sourceRow(page);
    const mode = page.id === "considerCustomerDetailPage" ? "customer" :
      page.id === "billingHospitalReviewPage" ? "billing" :
      page.id === "considerHospitalOpdFullPage" ? "full" : "half";
    return mode + ":" + clean(
      row.claimCode || row.claimNo || row.caseNo || row.id ||
      row.claim?.claimCode || row.claim?.claimNo || row.bill?.claimCode || "current"
    );
  }

  function sourceRow(page) {
    if (page.id === "considerCustomerDetailPage") return window.currentConsiderCustomerRow || {};
    if (page.id === "billingHospitalReviewPage" && typeof window.__getBillingHospitalReviewState === "function") {
      return window.__getBillingHospitalReviewState() || window.currentConsiderHospitalRow || {};
    }
    return window.currentConsiderHospitalRow || {};
  }

  function isEditablePage(page) {
    return page.id === "considerCustomerDetailPage";
  }

  function sourceValue(row, keys, fallback) {
    const sources = [
      row.trafficAccident,
      row.trafficAccidentInfo,
      row.roadAccident,
      row.claim?.trafficAccident,
      row.claim?.trafficAccidentInfo,
      row.claim?.roadAccident,
      row.claim,
      row
    ];
    for (const source of sources) {
      if (!source) continue;
      for (const key of keys) {
        if (source[key] != null && clean(source[key])) return clean(source[key]);
      }
    }
    return fallback;
  }

  function normalizeVehicle(value) {
    if (/มอเตอร์ไซค์|motorcycle|motorbike/i.test(value)) return "motorcycle";
    if (/รถยนต์|car|automobile/i.test(value)) return "car";
    if (/อื่น|other/i.test(value)) return "other";
    return "motorcycle";
  }

  function normalizeCasualty(value) {
    if (/ผู้โดยสาร|passenger/i.test(value)) return "passenger";
    return "driver";
  }

  function normalizePorobo(value) {
    if (/^(ไม่|ไม่ใช่|no|false|0)$/i.test(value)) return "no";
    return "yes";
  }

  function stateFor(page) {
    const key = currentClaimKey(page);
    if (!stateByClaim.has(key)) {
      const row = sourceRow(page);
      const editable = isEditablePage(page);
      stateByClaim.set(key, {
        vehicle: editable ? "" : normalizeVehicle(sourceValue(row, ["vehicleType", "trafficVehicleType"], "motorcycle")),
        vehicleOther: editable ? "" : sourceValue(row, ["vehicleOther", "vehicleTypeOther"], ""),
        casualty: editable ? "" : normalizeCasualty(sourceValue(row, ["casualtyStatus", "injuredStatus", "riderStatus"], "driver")),
        poroboExcess: editable ? "" : normalizePorobo(sourceValue(row, ["poroboExcess", "isPoroboExcess", "motorActExcess"], "yes")),
        noPoroboReason: editable ? "" : sourceValue(row, ["noPoroboReason", "poroboReason", "motorActUnusedReason"], ""),
        attempted: false
      });
    }
    return stateByClaim.get(key);
  }

  function pagePrefix(page) {
    if (page.id === "considerCustomerDetailPage") return "cc";
    if (page.id === "billingHospitalReviewPage") return "bh";
    return page.id === "considerHospitalOpdFullPage" ? "hf" : "hh";
  }

  function appendRequired(legend, text) {
    legend.appendChild(document.createTextNode(text + " "));
    const star = create("span", "hospital-traffic-required", "*");
    star.setAttribute("aria-hidden", "true");
    legend.appendChild(star);
  }

  function radioOption(name, value, labelText, checked, describedBy, editable) {
    const label = create("label", "hospital-traffic-option");
    const input = create("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.checked = checked;
    input.required = true;
    input.dataset.hospitalTrafficEditable = "true";
    input.disabled = !editable;
    input.setAttribute("aria-disabled", editable ? "false" : "true");
    if (describedBy) input.setAttribute("aria-describedby", describedBy);
    label.appendChild(input);
    label.appendChild(document.createTextNode(labelText));
    return label;
  }

  function errorSlot(id) {
    const error = create("div", "hospital-traffic-error");
    error.id = id;
    error.setAttribute("aria-live", "polite");
    return error;
  }

  function conditionalTextField(id, labelText, value, multiline, editable) {
    const wrap = create("div", "hospital-traffic-conditional");
    const label = create("label", "hospital-traffic-label");
    label.htmlFor = id;
    appendRequired(label, labelText);
    const field = create(multiline ? "textarea" : "input", multiline ? "hospital-traffic-textarea" : "hospital-traffic-input");
    field.id = id;
    field.name = id;
    field.value = value;
    field.placeholder = labelText;
    field.required = true;
    field.dataset.hospitalTrafficEditable = "true";
    field.disabled = !editable;
    field.setAttribute("aria-disabled", editable ? "false" : "true");
    field.setAttribute("aria-describedby", id + "Error");
    if (multiline) field.rows = 3;
    wrap.append(label, field, errorSlot(id + "Error"));
    return wrap;
  }

  function buildSection(page) {
    const state = stateFor(page);
    const prefix = pagePrefix(page);
    const editable = isEditablePage(page);
    const section = create("section", "hospital-traffic-section");
    section.dataset.hospitalTrafficAccident = "true";
    section.setAttribute("aria-labelledby", prefix + "TrafficTitle");

    const head = create("div", "hospital-traffic-head");
    const titleWrap = create("div", "hospital-traffic-title-wrap");
    const iconWrap = create("span", "hospital-traffic-title-icon");
    iconWrap.appendChild(create("span", "material-icons-round", "directions_car"));
    const titleCopy = create("div");
    const title = create("h3", "hospital-traffic-title", "ข้อมูลอุบัติเหตุจากการจราจร");
    title.id = prefix + "TrafficTitle";
    titleCopy.append(title, create("p", "hospital-traffic-subtitle", "ข้อมูลประกอบการพิจารณาสิทธิ์จากอุบัติเหตุทางถนน"));
    titleWrap.append(iconWrap, titleCopy);
    head.append(titleWrap);

    const summary = create("div", "hospital-traffic-summary");
    summary.setAttribute("role", "alert");
    summary.tabIndex = -1;
    summary.hidden = true;

    const body = create("div", "hospital-traffic-body");

    const vehicleGroup = create("fieldset", "hospital-traffic-group");
    vehicleGroup.dataset.trafficGroup = "vehicle";
    const vehicleLegend = create("legend");
    appendRequired(vehicleLegend, "ประเภทยานพาหนะ");
    const vehicleErrorId = prefix + "TrafficVehicleError";
    const vehicleOptions = create("div", "hospital-traffic-options");
    vehicleOptions.append(
      radioOption(prefix + "TrafficVehicle", "motorcycle", "มอเตอร์ไซค์", state.vehicle === "motorcycle", vehicleErrorId, editable),
      radioOption(prefix + "TrafficVehicle", "car", "รถยนต์", state.vehicle === "car", vehicleErrorId, editable),
      radioOption(prefix + "TrafficVehicle", "other", "อื่นๆ", state.vehicle === "other", vehicleErrorId, editable)
    );
    const vehicleOther = conditionalTextField(prefix + "TrafficVehicleOther", "โปรดระบุ", state.vehicleOther, false, editable);
    vehicleOther.hidden = state.vehicle !== "other";
    vehicleGroup.append(vehicleLegend, vehicleOptions, vehicleOther, errorSlot(vehicleErrorId));

    const casualtyGroup = create("fieldset", "hospital-traffic-group");
    casualtyGroup.dataset.trafficGroup = "casualty";
    const casualtyLegend = create("legend");
    appendRequired(casualtyLegend, "ผู้ขับขี่ หรือ ผู้โดยสาร");
    const casualtyErrorId = prefix + "TrafficCasualtyError";
    const casualtyOptions = create("div", "hospital-traffic-options");
    casualtyOptions.append(
      radioOption(prefix + "TrafficCasualty", "driver", "ผู้ขับขี่", state.casualty === "driver", casualtyErrorId, editable),
      radioOption(prefix + "TrafficCasualty", "passenger", "ผู้โดยสาร", state.casualty === "passenger", casualtyErrorId, editable)
    );
    const reminder = create("div", "hospital-traffic-reminder");
    reminder.setAttribute("role", "status");
    reminder.append(
      create("span", "material-icons-round", "info"),
      create("span", "", "กรุณาตรวจสอบผลตรวจแอลกอฮอล์ประกอบการพิจารณาเคลม")
    );
    reminder.hidden = state.casualty !== "driver";
    casualtyGroup.append(casualtyLegend, casualtyOptions, reminder, errorSlot(casualtyErrorId));

    const poroboGroup = create("fieldset", "hospital-traffic-group");
    poroboGroup.dataset.trafficGroup = "porobo";
    const poroboLegend = create("legend");
    appendRequired(poroboLegend, "เป็นส่วนเกิน พ.ร.บ.");
    const poroboErrorId = prefix + "TrafficPoroboError";
    const poroboOptions = create("div", "hospital-traffic-options");
    poroboOptions.append(
      radioOption(prefix + "TrafficPorobo", "yes", "ใช่", state.poroboExcess === "yes", poroboErrorId, editable),
      radioOption(prefix + "TrafficPorobo", "no", "ไม่ใช่", state.poroboExcess === "no", poroboErrorId, editable)
    );
    const noPoroboReason = conditionalTextField(prefix + "TrafficNoPoroboReason", "โปรดระบุสาเหตุที่ไม่ใช้ พ.ร.บ.", state.noPoroboReason, true, editable);
    noPoroboReason.hidden = state.poroboExcess !== "no";
    poroboGroup.append(poroboLegend, poroboOptions, noPoroboReason, errorSlot(poroboErrorId));

    body.append(vehicleGroup, casualtyGroup, poroboGroup);
    section.append(head, summary, body);
    bindSection(page, section, state);
    return section;
  }

  function selectedValue(section, suffix) {
    return section.querySelector('input[name$="' + suffix + '"]:checked')?.value || "";
  }

  function setError(target, message) {
    if (!target) return;
    target.textContent = message || "";
  }

  function clearInvalid(field) {
    if (!field) return;
    field.setAttribute("aria-invalid", "false");
    const describedBy = field.getAttribute("aria-describedby");
    if (describedBy) setError(document.getElementById(describedBy), "");
  }

  function bindSection(page, section, state) {
    section.addEventListener("change", function (event) {
      const field = event.target;
      if (!field.matches("input[type='radio']")) return;
      const name = field.name;

      if (name.endsWith("TrafficVehicle")) {
        state.vehicle = field.value;
        const otherWrap = section.querySelector("#" + pagePrefix(page) + "TrafficVehicleOther")?.parentElement;
        if (state.vehicle !== "other") {
          state.vehicleOther = "";
          const other = section.querySelector("#" + pagePrefix(page) + "TrafficVehicleOther");
          if (other) other.value = "";
          clearInvalid(other);
        }
        if (otherWrap) otherWrap.hidden = state.vehicle !== "other";
      } else if (name.endsWith("TrafficCasualty")) {
        state.casualty = field.value;
        const reminder = section.querySelector(".hospital-traffic-reminder");
        if (reminder) reminder.hidden = state.casualty !== "driver";
      } else if (name.endsWith("TrafficPorobo")) {
        state.poroboExcess = field.value;
        const reason = section.querySelector("#" + pagePrefix(page) + "TrafficNoPoroboReason");
        if (state.poroboExcess !== "no") {
          state.noPoroboReason = "";
          if (reason) reason.value = "";
          clearInvalid(reason);
        }
        if (reason?.parentElement) reason.parentElement.hidden = state.poroboExcess !== "no";
      }

      const group = field.closest(".hospital-traffic-group");
      group?.classList.remove("is-invalid");
      const error = group?.querySelector(":scope > .hospital-traffic-error");
      setError(error, "");
      field.closest(".hospital-traffic-options")?.querySelectorAll("input").forEach(input => input.setAttribute("aria-invalid", "false"));
    });

    section.addEventListener("input", function (event) {
      const field = event.target;
      if (field.id.endsWith("TrafficVehicleOther")) state.vehicleOther = field.value;
      if (field.id.endsWith("TrafficNoPoroboReason")) state.noPoroboReason = field.value;
      if (clean(field.value)) clearInvalid(field);
    });
  }

  function validateTraffic(page, shouldFocus) {
    const section = page?.querySelector("[data-hospital-traffic-accident]");
    if (!section) return true;
    if (!isEditablePage(page)) return true;
    const state = stateFor(page);
    state.attempted = true;
    const prefix = pagePrefix(page);
    const invalid = [];

    function validateGroup(key, value, message) {
      const group = section.querySelector('[data-traffic-group="' + key + '"]');
      const inputs = group ? Array.from(group.querySelectorAll("input[type='radio']")) : [];
      const error = group?.querySelector(":scope > .hospital-traffic-error");
      const failed = !value;
      group?.classList.toggle("is-invalid", failed);
      inputs.forEach(input => input.setAttribute("aria-invalid", failed ? "true" : "false"));
      setError(error, failed ? message : "");
      if (failed && inputs[0]) invalid.push(inputs[0]);
    }

    function validateConditional(id, required, message) {
      const field = section.querySelector("#" + id);
      const failed = required && !clean(field?.value);
      if (field) field.setAttribute("aria-invalid", failed ? "true" : "false");
      setError(document.getElementById(id + "Error"), failed ? message : "");
      if (failed && field) invalid.push(field);
    }

    validateGroup("vehicle", state.vehicle, "กรุณาเลือกประเภทยานพาหนะ");
    validateConditional(prefix + "TrafficVehicleOther", state.vehicle === "other", "กรุณาระบุประเภทยานพาหนะ");
    validateGroup("casualty", state.casualty, "กรุณาเลือกสถานะผู้ประสบเหตุ");
    validateGroup("porobo", state.poroboExcess, "กรุณาระบุว่าเป็นส่วนเกิน พ.ร.บ. หรือไม่");
    validateConditional(prefix + "TrafficNoPoroboReason", state.poroboExcess === "no", "กรุณาระบุสาเหตุที่ไม่ใช้ พ.ร.บ.");

    const summary = section.querySelector(".hospital-traffic-summary");
    summary.hidden = invalid.length === 0;
    summary.textContent = invalid.length ? "กรุณากรอกข้อมูลอุบัติเหตุจากการจราจรที่จำเป็นให้ครบถ้วนก่อนดำเนินการต่อ" : "";
    if (invalid.length && shouldFocus) {
      invalid[0].focus({ preventScroll: true });
      invalid[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return invalid.length === 0;
  }

  function removeDocumentReviewColumns(page) {
    const pane = page.querySelector(STEP1_SELECTOR);
    if (!pane) return;
    pane.querySelectorAll("table").forEach(function (table) {
      const headers = Array.from(table.querySelectorAll("thead th"));
      const headerLabels = headers.map(function (header) { return clean(header.textContent); });
      const isDocumentCheckTable = headerLabels.some(function (label) { return label.includes("รายการเอกสาร"); }) &&
        headerLabels.some(function (label) { return label.includes("ผลการตรวจ"); });
      if (!isDocumentCheckTable) return;
      const indexes = headers.reduce(function (result, header, index) {
        const label = clean(header.textContent);
        if (label.includes("ผลการตรวจ") || label === "หมายเหตุ") result.push(index);
        return result;
      }, []);
      if (!indexes.length) return;
      indexes.sort(function (a, b) { return b - a; });
      table.querySelectorAll("tr").forEach(function (row) {
        indexes.forEach(function (index) {
          if (row.children[index]) row.children[index].remove();
        });
        row.removeAttribute("data-hospital-doc-result");
        row.removeAttribute("data-hospital-doc-required");
        row.classList.remove("hospital-doc-row-invalid");
      });
      table.classList.add("hospital-doc-table-compact");
      table.dataset.documentValidationRemoved = "true";
    });
  }

  function releaseDocumentApprovalGuard(page) {
    const row = window.currentConsiderHospitalRow || {};
    const key = clean(row.claimCode || row.claimNo || row.caseNo || row.id || "current");
    const snapshots = window.__hospitalDocValidationSnapshotV10;
    if (snapshots && typeof snapshots.delete === "function") snapshots.delete(key);
    page.querySelectorAll('[data-hospital-approve-guard="true"],[data-final-approve-rule="true"]').forEach(function (button) {
      button.removeAttribute("data-hospital-approve-guard");
      button.removeAttribute("data-final-approve-rule");
      button.removeAttribute("aria-disabled");
      if (!button.dataset.hospitalApproveCompleted && !button.dataset.hospitalApproveCompletedV249) button.disabled = false;
      if (/ผลการตรวจ|เอกสารต้อง/.test(button.title || "")) button.title = "อนุมัติรายการ";
    });
  }

  function syncTrafficFieldMode(page) {
    const editable = isEditablePage(page);
    page.querySelectorAll("[data-hospital-traffic-editable='true']").forEach(function (field) {
      field.disabled = !editable;
      if (editable) field.removeAttribute("disabled");
      else field.setAttribute("disabled", "");
      field.setAttribute("aria-disabled", editable ? "false" : "true");
    });
  }

  function actionLabel(button) {
    return clean(button?.textContent).replace(/arrow_forward|save/g, "").trim();
  }

  function normalizeStep2ActionOrder(page) {
    const prefix = pagePrefix(page);
    const pane = page.querySelector(prefix === "hf" ? "#hfStepPane2" : "#hhStepPane2");
    if (!pane) return;
    const buttons = Array.from(pane.querySelectorAll("button"));
    const nextButton = buttons.find(function (button) { return actionLabel(button) === "ถัดไป"; });
    const saveButton = buttons.find(function (button) {
      const label = actionLabel(button);
      return label === "ยืนยันบันทึกผลพิจารณา" || label === "บันทึกผลพิจารณา";
    });
    if (!nextButton || !saveButton || nextButton.parentElement !== saveButton.parentElement) return;
    if (saveButton.nextElementSibling !== nextButton) nextButton.parentElement.insertBefore(saveButton, nextButton);
    nextButton.dataset.hospitalStep2ActionOrder = "after-decision-save";
    saveButton.dataset.hospitalStep2ActionOrder = "before-next";
  }

  function hydratePage(page) {
    const pane = page.querySelector(STEP1_SELECTOR);
    if (!pane) return;
    let section = pane.querySelector("[data-hospital-traffic-accident]");
    if (!section) {
      const details = pane.querySelector(".treatment-detail-actual");
      section = buildSection(page);
      if (details?.parentNode) details.parentNode.insertBefore(section, details.nextSibling);
      else pane.prepend(section);
    }
    syncTrafficFieldMode(page);
    if (page.id === "considerHospitalOpdHalfPage" || page.id === "considerHospitalOpdFullPage") {
      removeDocumentReviewColumns(page);
      releaseDocumentApprovalGuard(page);
      normalizeStep2ActionOrder(page);
    }
  }

  function hydrateAll() {
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

  function isVisible(element) {
    return !!element && !element.classList.contains("hidden") && getComputedStyle(element).display !== "none";
  }

  function pageForPrefix(prefix) {
    if (prefix === "cc") return document.getElementById("considerCustomerDetailPage");
    return document.getElementById(prefix === "hf" ? "considerHospitalOpdFullPage" : "considerHospitalOpdHalfPage");
  }

  function wrapNavigation(name, prefix) {
    const previous = window[name];
    if (typeof previous !== "function" || previous.__hospitalTrafficAccidentWrapped) return;
    const wrapped = function (step) {
      const page = pageForPrefix(prefix);
      const paneSelector = prefix === "hf" ? "#hfStepPane1" : prefix === "cc" ? "#ccStepPane1" : "#hhStepPane1";
      const pane = page?.querySelector(paneSelector);
      if (Number(step) === 2 && isVisible(pane) && !validateTraffic(page, true)) return false;
      const result = previous.apply(this, arguments);
      scheduleHydrate();
      setTimeout(hydrateAll, 40);
      setTimeout(hydrateAll, 160);
      return result;
    };
    wrapped.__hospitalTrafficAccidentWrapped = true;
    window[name] = wrapped;
    try { eval(name + "=wrapped"); } catch (_e) {}
  }

  function isStep1Action(button) {
    if (!button?.closest?.(STEP1_SELECTOR)) return false;
    const label = actionLabel(button);
    return label === "ถัดไป" || label === "ยืนยันบันทึกผลพิจารณา" || label === "บันทึกผลพิจารณา";
  }

  window.addEventListener("click", function (event) {
    const button = event.target?.closest?.("button");
    if (!isStep1Action(button)) return;
    const page = button.closest(PAGE_SELECTOR);
    if (!page || validateTraffic(page, true)) return;
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
    wrapNavigation("setHospitalFullStep", "hf");
    wrapNavigation("setHospitalHalfStep", "hh");
    wrapNavigation("setCustomerStep", "cc");
    const open = window.openConsiderHospitalRow;
    if (typeof open === "function" && !open.__hospitalTrafficAccidentWrapped) {
      const wrappedOpen = function () {
        const result = open.apply(this, arguments);
        scheduleHydrate();
        setTimeout(hydrateAll, 60);
        return result;
      };
      wrappedOpen.__hospitalTrafficAccidentWrapped = true;
      window.openConsiderHospitalRow = wrappedOpen;
      try { eval("openConsiderHospitalRow=wrappedOpen"); } catch (_e) {}
    }
    const openBilling = window.openHospitalBillingReview;
    if (typeof openBilling === "function" && !openBilling.__hospitalTrafficAccidentWrapped) {
      const wrappedBillingOpen = function () {
        const result = openBilling.apply(this, arguments);
        scheduleHydrate();
        setTimeout(hydrateAll, 60);
        return result;
      };
      wrappedBillingOpen.__hospitalTrafficAccidentWrapped = true;
      window.openHospitalBillingReview = wrappedBillingOpen;
      try { eval("openHospitalBillingReview=wrappedBillingOpen"); } catch (_e) {}
    }
    const openCustomer = window.openConsiderCustomerRow;
    if (typeof openCustomer === "function" && !openCustomer.__hospitalTrafficAccidentWrapped) {
      const wrappedCustomerOpen = function () {
        const result = openCustomer.apply(this, arguments);
        scheduleHydrate();
        setTimeout(hydrateAll, 60);
        return result;
      };
      wrappedCustomerOpen.__hospitalTrafficAccidentWrapped = true;
      window.openConsiderCustomerRow = wrappedCustomerOpen;
      try { eval("openConsiderCustomerRow=wrappedCustomerOpen"); } catch (_e) {}
    }
    observer.observe(document.body, { subtree: true, childList: true });
    hydrateAll();
  }

  window.validateHospitalTrafficAccident = validateTraffic;
  window.__getHospitalTrafficAccidentState = function (page) {
    const target = typeof page === "string" ? document.querySelector(page) : page;
    return target ? { ...stateFor(target) } : null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
