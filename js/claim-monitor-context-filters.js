/* ============================================================
   Claim Monitor context filters
   Uses the existing claimMonitorRows model without normalization.
   ============================================================ */
(function () {
  "use strict";

  const CUSTOMER_CATEGORY = "เคลมลูกค้า";
  const HOSPITAL_CATEGORY = "เคลมโรงพยาบาล";
  const CUSTOMER_TREATMENTS = ["OPD", "IPD", "Day Case Surgery"];
  const HOSPITAL_TREATMENTS = ["OPD Half", "OPD Full", "IPD", "Day Case Surgery"];
  const CUSTOMER_STATUSES = ["รอพิจารณา", "รอเอกสาร", "รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "อยู่ระหว่างดำเนินการ"];
  const HOSPITAL_STATUSES = ["รอพิจารณา", "รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "อยู่ระหว่างดำเนินการ"];

  const byId = id => document.getElementById(id);
  const unique = values => [...new Set(values)];

  function optionMarkup(values) {
    return ['<option value="">ทั้งหมด</option>', ...values.map(value => `<option value="${value}">${value}</option>`)].join("");
  }

  function valuesForCategory(category) {
    if (category === CUSTOMER_CATEGORY) {
      return { treatments: CUSTOMER_TREATMENTS, statuses: CUSTOMER_STATUSES };
    }
    if (category === HOSPITAL_CATEGORY) {
      return { treatments: HOSPITAL_TREATMENTS, statuses: HOSPITAL_STATUSES };
    }
    return {
      treatments: unique([...CUSTOMER_TREATMENTS, ...HOSPITAL_TREATMENTS]),
      statuses: unique([...CUSTOMER_STATUSES, ...HOSPITAL_STATUSES])
    };
  }

  function replaceOptions(select, values) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = optionMarkup(values);
    select.value = values.includes(previous) ? previous : "";
  }

  function syncDependentOptions() {
    const category = byId("claimContextCategory")?.value || "";
    const values = valuesForCategory(category);
    replaceOptions(byId("claimContextTreatment"), values.treatments);
    replaceOptions(byId("claimContextStatus"), values.statuses);
  }

  function getContext() {
    return {
      product: byId("claimContextProduct")?.value || "",
      category: byId("claimContextCategory")?.value || "",
      treatment: byId("claimContextTreatment")?.value || "",
      status: byId("claimContextStatus")?.value || ""
    };
  }

  function matchesContext(row, context = getContext()) {
    if (context.product && row.product !== context.product) return false;
    if (context.category && row.claimCategory !== context.category) return false;
    // claimType is the existing discriminator for Hospital OPD Half / OPD Full.
    if (context.treatment && row.claimType !== context.treatment) return false;
    if (context.status && row.itemStatus !== context.status) return false;
    return true;
  }

  function reset() {
    ["claimContextProduct", "claimContextCategory"].forEach(id => {
      const control = byId(id);
      if (control) control.value = "";
    });
    syncDependentOptions();
    const treatment = byId("claimContextTreatment");
    const status = byId("claimContextStatus");
    if (treatment) treatment.value = "";
    if (status) status.value = "";
  }

  const previousFilter = window.filterClaimMonitorRows;
  if (typeof previousFilter === "function") {
    const contextFilter = function () {
      return previousFilter.apply(this, arguments).filter(row => matchesContext(row));
    };
    window.filterClaimMonitorRows = contextFilter;
    try { filterClaimMonitorRows = contextFilter; } catch (error) {}
  }

  const previousValidate = window.validateClaimMonitorSearch;
  if (typeof previousValidate === "function") {
    const contextValidation = function () {
      const input = byId("claimKeyword");
      if (input && input.value.trim() === "") {
        const error = byId("claimKeywordError");
        if (error) error.classList.add("hidden");
        input.classList.remove("border-red-400", "focus:border-red-500", "focus:ring-red-100");
        input.setAttribute("aria-invalid", "false");
        return true;
      }
      return previousValidate.apply(this, arguments);
    };
    window.validateClaimMonitorSearch = contextValidation;
    try { validateClaimMonitorSearch = contextValidation; } catch (error) {}
  }

  const previousShow = window.showClaimMonitor;
  if (typeof previousShow === "function") {
    const showWithContextReset = function (resetPage = true) {
      if (resetPage) reset();
      return previousShow.apply(this, arguments);
    };
    window.showClaimMonitor = showWithContextReset;
    try { showClaimMonitor = showWithContextReset; } catch (error) {}
  }

  byId("claimContextCategory")?.addEventListener("change", syncDependentOptions);
  byId("claimClearBtn")?.addEventListener("click", reset);
  syncDependentOptions();

  window.ClaimMonitorContextFilters = Object.freeze({
    getContext,
    matchesContext,
    reset,
    syncDependentOptions,
    valuesForCategory
  });
})();
