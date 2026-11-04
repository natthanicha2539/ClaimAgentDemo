/* Claim lifecycle label shared by claim search and read-only claim detail. */
(function () {
  'use strict';

  function explicitStatus(value) {
    const normalized = String(value || '').trim().replace(/[\s_]+/g, '-').toLowerCase();
    if (/^re-?open$/.test(normalized)) return 'Re-Open';
    if (normalized === 'open') return 'Open';
    if (normalized === 'close' || normalized === 'closed') return 'Close';
    return null;
  }

  function display(row) {
    const record = row || {};
    for (const value of [record.lifecycleStatus, record.claimLifecycleStatus, record.status, record.claimStatus]) {
      const status = explicitStatus(value);
      if (status) return status;
    }
    const decision = String(record.decision?.result || record.decisionStatus || record.claimStatus || record.status || '').trim();
    return /อนุมัติ|ปฏิเสธ|ยกเลิก/i.test(decision) ? 'Close' : 'Open';
  }

  window.ClaimAgentClaimLifecycle = Object.freeze({ display });
})();
