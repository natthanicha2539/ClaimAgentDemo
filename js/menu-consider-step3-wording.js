(function () {
  'use strict';

  var STEP3_PANE_IDS = ['ccStepPane3', 'hfStepPane3', 'hhStepPane3'];
  var STEP_FUNCTIONS = ['setCustomerStep', 'setHospitalFullStep', 'setHospitalHalfStep'];
  var TARGET_TEXT = 'สิทธิ์เบิกตามความคุ้มครอง';
  var HOSPITAL_SUMMARY_TITLE = 'สรุปค่าใช้จ่ายโรงพยาบาล';
  var RECEIPT_TOTAL_LABEL = 'ยอดเงินรวมตามใบเสร็จ';
  var NET_EXPENSE_LABEL = 'ค่าใช้จ่ายทั้งหมดสุทธิ';

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, '').trim();
  }

  function parseMoney(value) {
    var parsed = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function directChildByTag(row, tagNames) {
    return Array.prototype.slice.call(row && row.children || []).find(function (child) {
      return tagNames.indexOf(child.tagName) >= 0;
    }) || null;
  }

  function findSummaryCard(pane) {
    if (!pane) return null;

    var title = Array.prototype.slice.call(pane.querySelectorAll('div,h2,h3,h4,span')).find(function (node) {
      return normalizeText(node.textContent) === normalizeText(HOSPITAL_SUMMARY_TITLE);
    });

    return title && (
      title.closest('.step3-hospital-expense-card,.rounded-xl.border') ||
      title.parentElement
    );
  }

  function findSummaryRow(card, labels) {
    if (!card) return null;
    var normalizedLabels = labels.map(normalizeText);

    return Array.prototype.slice.call(card.querySelectorAll('[data-claim-step3-receipt-total],.flex.justify-between,div')).find(function (row) {
      var label = directChildByTag(row, ['SPAN']);
      var value = directChildByTag(row, ['STRONG', 'B']);
      return label && value && normalizedLabels.indexOf(normalizeText(label.textContent)) >= 0;
    }) || null;
  }

  function owningPage(pane) {
    return pane && pane.closest(
      '#considerCustomerDetailPage,#considerHospitalOpdFullPage,' +
      '#considerHospitalOpdHalfPage,#billingHospitalReviewPage'
    );
  }

  function matchingStep2Pane(step3Pane) {
    if (!step3Pane) return null;
    var step2Id = String(step3Pane.id || '').replace(/StepPane3$/, 'StepPane2');
    if (!step2Id || step2Id === step3Pane.id) return null;

    var page = owningPage(step3Pane);
    return page && page.querySelector('#' + step2Id) || document.getElementById(step2Id);
  }

  function headerIndex(table, label) {
    return Array.prototype.slice.call(table.querySelectorAll('thead th')).findIndex(function (header) {
      return normalizeText(header.textContent).indexOf(normalizeText(label)) >= 0;
    });
  }

  function receiptTotalFromTable(step2Pane) {
    if (!step2Pane) return null;

    var table = Array.prototype.slice.call(step2Pane.querySelectorAll('table')).find(function (candidate) {
      return headerIndex(candidate, 'ยอดเงินตามใบเสร็จ') >= 0;
    });
    if (!table) return null;

    var receiptIndex = headerIndex(table, 'ยอดเงินตามใบเสร็จ');
    var foundValueCell = false;
    var total = Array.prototype.slice.call(table.querySelectorAll('tbody tr')).reduce(function (sum, row) {
      var cell = row.children && row.children[receiptIndex];
      if (!cell || cell.hasAttribute('colspan')) return sum;

      var control = cell.querySelector('input,select,textarea');
      var rawValue = control ? control.value : cell.textContent;
      if (control || /\d/.test(String(rawValue || ''))) foundValueCell = true;
      return sum + parseMoney(rawValue);
    }, 0);

    return foundValueCell ? total : null;
  }

  function receiptTotalFromSummary(step2Pane) {
    if (!step2Pane) return null;
    if (step2Pane.dataset && step2Pane.dataset.autoSumReceipt !== undefined) {
      return parseMoney(step2Pane.dataset.autoSumReceipt);
    }

    var explicit = step2Pane.querySelector('#customerSummaryReceiptTotal');
    if (explicit) return parseMoney(explicit.textContent);

    var label = Array.prototype.slice.call(step2Pane.querySelectorAll('span,div')).find(function (node) {
      return normalizeText(node.textContent) === normalizeText('ยอดเงินตามใบเสร็จรวม');
    });
    if (!label) return null;

    var row = label.parentElement;
    var value = row && row.querySelector('strong,b,.cc-ref-money-value');
    return value ? parseMoney(value.textContent) : null;
  }

  function currentReceiptTotal(step3Pane) {
    var step2Pane = matchingStep2Pane(step3Pane);
    var tableTotal = receiptTotalFromTable(step2Pane);
    return tableTotal == null ? (receiptTotalFromSummary(step2Pane) || 0) : tableTotal;
  }

  function updateHospitalExpenseSummary(pane) {
    var card = findSummaryCard(pane);
    if (!card) return 0;

    var expenseRow = findSummaryRow(card, ['ค่าใช้จ่ายทั้งหมด', NET_EXPENSE_LABEL]);
    if (!expenseRow) return 0;

    var expenseLabel = directChildByTag(expenseRow, ['SPAN']);
    if (expenseLabel) {
      expenseLabel.textContent = NET_EXPENSE_LABEL;
      expenseLabel.setAttribute('data-claim-step3-wording', 'net-expense');
    }

    var receiptRows = Array.prototype.slice.call(card.querySelectorAll('[data-claim-step3-receipt-total]'));
    var receiptRow = receiptRows.shift() || null;
    receiptRows.forEach(function (duplicate) { duplicate.remove(); });

    if (!receiptRow) {
      receiptRow = expenseRow.cloneNode(true);
      receiptRow.setAttribute('data-claim-step3-receipt-total', 'true');
      expenseRow.parentNode.insertBefore(receiptRow, expenseRow);
    }

    var receiptLabel = directChildByTag(receiptRow, ['SPAN']);
    var receiptValue = directChildByTag(receiptRow, ['STRONG', 'B']);
    if (receiptLabel) receiptLabel.textContent = RECEIPT_TOTAL_LABEL;
    if (receiptValue) receiptValue.textContent = formatMoney(currentReceiptTotal(pane));

    return 1;
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
      var panes = document.querySelectorAll('#' + paneId);
      return total + Array.prototype.slice.call(panes).reduce(function (paneTotal, pane) {
        return paneTotal + updateTreatmentTableHeading(pane) + updateHospitalExpenseSummary(pane);
      }, 0);
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
