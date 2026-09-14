(function () {
  'use strict';

  var STEP3_PANE_IDS = ['ccStepPane3', 'hfStepPane3', 'hhStepPane3'];
  var STEP_FUNCTIONS = ['setCustomerStep', 'setHospitalFullStep', 'setHospitalHalfStep'];
  var TARGET_TEXT = 'สิทธิ์เบิกตามความคุ้มครอง';

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, '').trim();
  }

  function updateTreatmentTableHeading(pane) {
    if (!pane) return 0;

    var changed = 0;
    pane.querySelectorAll('table').forEach(function (table) {
      var headers = Array.prototype.slice.call(table.querySelectorAll('thead th'));

      headers.forEach(function (header, index) {
        var currentText = normalizeText(header.textContent);
        var previousText = index > 0 ? normalizeText(headers[index - 1].textContent) : '';

        if (
          previousText === 'รายการเบิก' &&
          (currentText === 'สิทธิเบิก' || currentText === 'สิทธิ์เบิก')
        ) {
          header.textContent = TARGET_TEXT;
          header.setAttribute('data-claim-step3-wording', 'coverage-entitlement');
          changed += 1;
        }
      });
    });

    return changed;
  }

  function applyStep3Wording() {
    return STEP3_PANE_IDS.reduce(function (total, paneId) {
      return total + updateTreatmentTableHeading(document.getElementById(paneId));
    }, 0);
  }

  function wrapStepFunction(name) {
    var original = window[name];
    if (typeof original !== 'function' || original.__claimStep3WordingWrapped) return;

    function wrappedStepFunction() {
      var result = original.apply(this, arguments);
      applyStep3Wording();
      window.requestAnimationFrame(applyStep3Wording);
      return result;
    }

    wrappedStepFunction.__claimStep3WordingWrapped = true;
    wrappedStepFunction.__claimStep3WordingOriginal = original;
    window[name] = wrappedStepFunction;
  }

  STEP_FUNCTIONS.forEach(wrapStepFunction);

  try { setCustomerStep = window.setCustomerStep; } catch (error) {}
  try { setHospitalFullStep = window.setHospitalFullStep; } catch (error) {}
  try { setHospitalHalfStep = window.setHospitalHalfStep; } catch (error) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStep3Wording, { once: true });
  } else {
    applyStep3Wording();
  }

  window.ClaimConsiderStep3Wording = Object.freeze({
    apply: applyStep3Wording,
    targetText: TARGET_TEXT
  });
})();
