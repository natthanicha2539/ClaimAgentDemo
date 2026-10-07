/* ============================================================
   Claim Monitor product filter
   Uses the existing claimMonitorRows model without normalization.
   ============================================================ */
(function () {
  "use strict";

  const byId = id => document.getElementById(id);

  function getContext() {
    return {
      product: byId("claimContextProduct")?.value || ""
    };
  }

  function matchesContext(row, context = getContext()) {
    if (context.product && row.product !== context.product) return false;
    return true;
  }

  function reset() {
    const product = byId("claimContextProduct");
    if (product) product.value = "";
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

  byId("claimClearBtn")?.addEventListener("click", reset);

  window.ClaimMonitorContextFilters = Object.freeze({
    getContext,
    matchesContext,
    reset
  });
})();
