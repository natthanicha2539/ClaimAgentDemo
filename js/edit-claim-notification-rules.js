/* Supported customer-claim choices for the session-only edit notification flow. */
(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.claimAgentEditNotificationRules = rules;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Mirrors the active customer Claim Entry cause/coverage/treatment matrix.
  // The current PA demo policies expose accident benefits only.
  const options = {
    PH: {
      'เจ็บป่วย': {
        'ค่ารักษา': ['OPD', 'IPD', 'Day Case Surgery'],
        'ค่าชดเชย(ใหญ่)': ['IPD']
      },
      'อุบัติเหตุ': {
        'ค่ารักษา': ['OPD', 'IPD'],
        'ค่าชดเชย(ใหญ่)': ['OPD', 'IPD']
      }
    },
    PA: {
      'อุบัติเหตุ': {
        'ค่ารักษา': ['OPD', 'IPD'],
        'ค่าชดเชย': ['OPD', 'IPD']
      }
    }
  };

  function causes(product) {
    return Object.keys(options[product] || {});
  }

  function coverages(product, cause) {
    return Object.keys(options[product]?.[cause] || {});
  }

  function treatments(product, cause, coverage) {
    return [...(options[product]?.[cause]?.[coverage] || [])];
  }

  function reconcile(product, selection) {
    const cause = causes(product).includes(selection.cause) ? selection.cause : '';
    const coverage = coverages(product, cause).includes(selection.coverage) ? selection.coverage : '';
    const allowedTreatments = treatments(product, cause, coverage);
    const treatment = allowedTreatments.includes(selection.treatment)
      ? selection.treatment
      : product === 'PH' && cause === 'เจ็บป่วย' && coverage === 'ค่าชดเชย(ใหญ่)' ? 'IPD' : '';
    return { cause, coverage, treatment };
  }

  function invalidField(product, selection) {
    if (!causes(product).includes(selection.cause)) return 'Cause';
    if (!coverages(product, selection.cause).includes(selection.coverage)) return 'Coverage';
    if (!treatments(product, selection.cause, selection.coverage).includes(selection.treatment)) return 'Treatment';
    return '';
  }

  function searchRecords(records, field, query) {
    const key = { claim: 'id', case: 'caseNo', ref: 'refNo', insured: 'insured', place: 'place' }[field];
    if (!key) return [];
    const needle = String(query || '').trim().toLocaleLowerCase('th-TH');
    return records.filter(row => !needle || String(row[key] || '').toLocaleLowerCase('th-TH').includes(needle));
  }

  function updatedRecord(row, selection, requester, time) {
    const invalid = invalidField(row.product, selection);
    if (invalid) throw new Error(`Invalid claim ${invalid}`);
    if (!requester) throw new Error('Requester is required');
    const detail = [selection.cause, selection.coverage, selection.treatment].join(' / ');
    return {
      ...row,
      cause: selection.cause,
      coverage: selection.coverage,
      treatment: selection.treatment,
      requester,
      editHistory: [...(row.editHistory || []), { detail, time }]
    };
  }

  return Object.freeze({ causes, coverages, treatments, reconcile, invalidField, searchRecords, updatedRecord });
});
