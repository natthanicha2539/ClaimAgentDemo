/* Claim Entry recipient routing shared by PH and PA. */
(function () {
  "use strict";

  const WALK_OUT = "ผู้ให้บริการ (Walk Out)";
  const WALK_IN = "ผู้ให้บริการ (Walk in)";
  const PIVOT = "Pivot";
  const LOGIN_PROVIDER = "06590 - ณัฏฐณิชา โตรักษา";
  const OFFICE = "000 - คุณสำนักงาน";
  const RECIPIENTS = [WALK_OUT, WALK_IN, PIVOT];
  function state() {
    return window.claimState || null;
  }

  function ensureStateDefaults() {
    const current = state();
    if (!current) return null;
    if (!RECIPIENTS.includes(current.claimDocumentRecipient)) current.claimDocumentRecipient = WALK_OUT;
    if (typeof current.claimServiceProvider !== "string" || !current.claimServiceProvider) current.claimServiceProvider = LOGIN_PROVIDER;
    if (typeof current.claimVehicleOwner !== "string") current.claimVehicleOwner = "";
    if (typeof current.claimWalkOutVehicleOwner !== "string") current.claimWalkOutVehicleOwner = current.claimVehicleOwner;
    return current;
  }

  function setDisabled(select, disabled) {
    if (!select) return;
    select.disabled = disabled;
    select.setAttribute("aria-disabled", String(disabled));
    select.classList.toggle("bg-slate-100", disabled);
    select.classList.toggle("text-slate-500", disabled);
    select.classList.toggle("cursor-not-allowed", disabled);
  }

  function syncForm() {
    const current = ensureStateDefaults();
    if (!current) return;
    const recipient = document.getElementById("claimDocumentRecipient");
    const provider = document.getElementById("claimServiceProvider");
    const owner = document.getElementById("claimVehicleOwner");
    if (!recipient || !provider || !owner) return;

    recipient.value = current.claimDocumentRecipient;
    provider.value = current.claimServiceProvider;
    owner.value = current.claimVehicleOwner;

    const isPivot = current.claimDocumentRecipient === PIVOT;
    const isWalkOut = current.claimDocumentRecipient === WALK_OUT;
    setDisabled(provider, isPivot);
    setDisabled(owner, !isWalkOut);
    if (!isWalkOut || owner.value) setOwnerError(false);
  }

  function setOwnerError(visible) {
    const owner = document.getElementById("claimVehicleOwner");
    const error = document.getElementById("claimVehicleOwnerError");
    if (error) error.classList.toggle("hidden", !visible);
    if (owner) {
      if (visible) owner.setAttribute("aria-invalid", "true");
      else owner.removeAttribute("aria-invalid");
    }
  }

  function validateRequiredOwner() {
    const current = ensureStateDefaults();
    if (!current || current.claimDocumentRecipient !== WALK_OUT || current.claimVehicleOwner) {
      setOwnerError(false);
      return true;
    }
    setOwnerError(true);
    const owner = document.getElementById("claimVehicleOwner");
    owner?.scrollIntoView({ behavior:"smooth", block:"center" });
    owner?.focus();
    return false;
  }

  function resetRecipientState() {
    const current = state();
    if (!current) return;
    current.claimDocumentRecipient = WALK_OUT;
    current.claimServiceProvider = LOGIN_PROVIDER;
    current.claimVehicleOwner = "";
    current.claimWalkOutVehicleOwner = "";
    setOwnerError(false);
  }

  function onRecipientChange(value) {
    const current = ensureStateDefaults();
    if (!current) return;
    if (current.claimDocumentRecipient === WALK_OUT) {
      current.claimWalkOutVehicleOwner = current.claimVehicleOwner || OFFICE;
    }
    current.claimDocumentRecipient = RECIPIENTS.includes(value) ? value : WALK_OUT;
    current.claimServiceProvider = current.claimDocumentRecipient === PIVOT ? OFFICE : LOGIN_PROVIDER;
    current.claimVehicleOwner = current.claimDocumentRecipient === WALK_OUT
      ? current.claimWalkOutVehicleOwner
      : OFFICE;
    syncForm();
  }

  function attach() {
    const recipient = document.getElementById("claimDocumentRecipient");
    const provider = document.getElementById("claimServiceProvider");
    const owner = document.getElementById("claimVehicleOwner");
    if (!recipient || recipient.dataset.recipientRoutingBound === "1") return;
    recipient.dataset.recipientRoutingBound = "1";

    recipient.addEventListener("change", () => onRecipientChange(recipient.value));
    provider.addEventListener("change", () => {
      const current = ensureStateDefaults();
      if (current && current.claimDocumentRecipient !== PIVOT) current.claimServiceProvider = provider.value;
    });
    owner.addEventListener("change", () => {
      const current = ensureStateDefaults();
      if (!current || current.claimDocumentRecipient !== WALK_OUT) return;
      current.claimVehicleOwner = owner.value;
      current.claimWalkOutVehicleOwner = owner.value;
      setOwnerError(!owner.value);
    });

    ensureStateDefaults();
    syncForm();
  }

  function wrap(name, callback) {
    const original = window[name];
    if (typeof original !== "function" || original.__claimRecipientRouting) return;
    const wrapped = function () {
      const result = original.apply(this, arguments);
      callback();
      requestAnimationFrame(syncForm);
      setTimeout(syncForm, 0);
      return result;
    };
    wrapped.__claimRecipientRouting = true;
    window[name] = wrapped;
    try { window.eval(name + " = window[" + JSON.stringify(name) + "]"); } catch (_error) {}
  }

  function wrapValidation() {
    const name = "validateClaimEntryBeforeNext";
    const original = window[name];
    if (typeof original !== "function" || original.__claimRecipientOwnerValidation) return;
    const wrapped = function () {
      if (!validateRequiredOwner()) return;
      return original.apply(this, arguments);
    };
    wrapped.__claimRecipientOwnerValidation = true;
    window[name] = wrapped;
    try { window.eval(name + " = window[" + JSON.stringify(name) + "]"); } catch (_error) {}
  }

  function boot() {
    attach();
    wrap("resetClaimEntryState", resetRecipientState);
    wrap("openClaimEntry", resetRecipientState);
    wrap("openContinuousClaimEntry", resetRecipientState);
    wrap("showClaimEntryPage", function () { ensureStateDefaults(); });
    wrapValidation();
    syncForm();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  window.claimEntryRecipientRouting = { syncForm, resetRecipientState };
})();
