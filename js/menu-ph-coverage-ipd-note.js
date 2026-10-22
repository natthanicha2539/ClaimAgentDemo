/* PH coverage tabs: show the shared 18-item IPD compensation note. */
(function () {
  'use strict';

  const reference = document.getElementById('eligibilityDayCaseIpdNote');
  if (!reference) return;
  const popup = reference.cloneNode(true);
  popup.id = 'phCoverageIpdNote';
  popup.hidden = true;
  popup.querySelector('.eligibility-day-case-note-kicker').textContent = 'PH · ความคุ้มครอง';
  popup.querySelector('.eligibility-day-case-note-intro').textContent = 'รายการผ่าตัดและหัตถการที่เกี่ยวข้องกับหมายเหตุค่าชดเชย IPD มีดังนี้';
  document.body.appendChild(popup);

  const targets = [
    ['claimSearchInsuredDetailPage', '#csdCoverageContent', () => document.getElementById('csdCoverageContent')?.dataset.product],
    ['considerCustomerDetailPage', '#customerTabCoverage', () => window.currentConsiderCustomerRow?.product],
    ['considerHospitalOpdFullPage', '[data-hospital-pane="coverage"]', () => window.currentConsiderHospitalRow?.product],
    ['considerHospitalOpdHalfPage', '[data-hospital-pane="coverage"]', () => window.currentConsiderHospitalRow?.product],
    ['billingHospitalReviewPage', '[data-hospital-pane="coverage"]', () => window.__getBillingHospitalSharedRow?.()?.product],
    ['customerClaimReadOnlyPage', '#ccro-panel-coverage', () => document.getElementById('customerClaimReadOnlyPage')?.dataset.product]
  ];
  const names = new Set([
    'ค่าชดเชยการนอนรักษาพยาบาลเป็นผู้ป่วยใน',
    'ค่าชดเชยการนอนโรงพยาบาล',
    'ค่าชดเชยผู้ป่วยใน'
  ]);
  let trigger = null;
  let closeTimer = 0;
  let scheduled = false;
  let restoringFocus = false;

  function close() {
    clearTimeout(closeTimer);
    popup.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    trigger = null;
  }
  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (popup.matches(':hover') || trigger?.matches(':hover') ||
          popup.contains(document.activeElement) || trigger === document.activeElement) return;
      close();
    }, 150);
  }
  function position() {
    if (!trigger || popup.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(640, window.innerWidth - 24);
    popup.style.width = `${width}px`;
    popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const height = popup.getBoundingClientRect().height;
    const below = window.innerHeight - rect.bottom;
    const top = below >= Math.min(height, 260) || below >= rect.top
      ? rect.bottom + 10 : rect.top - height - 10;
    popup.style.top = `${Math.max(12, Math.min(top, window.innerHeight - height - 12))}px`;
  }
  function open(button) {
    if (button.closest('.page')?.classList.contains('hidden')) return;
    clearTimeout(closeTimer);
    if (trigger && trigger !== button) trigger.setAttribute('aria-expanded', 'false');
    trigger = button;
    button.setAttribute('aria-expanded', 'true');
    popup.hidden = false;
    position();
  }
  function decorate() {
    scheduled = false;
    if (trigger && (!trigger.isConnected || trigger.closest('.page')?.classList.contains('hidden'))) close();
    for (const [rootId, panelSelector, getProduct] of targets) {
      const root = document.getElementById(rootId);
      const panel = root?.querySelector(panelSelector);
      if (!panel) continue;
      const isPH = String(getProduct() || '').toUpperCase() === 'PH';
      panel.querySelectorAll('.ph-coverage-ipd-note-trigger').forEach(button => {
        if (isPH) return;
        if (trigger === button) close();
        button.remove();
      });
      if (!isPH) continue;
      panel.querySelectorAll('tbody tr').forEach(row => {
        const cell = row.querySelector('td:first-child');
        if (!cell || !names.has(cell.textContent.trim()) || cell.querySelector('.ph-coverage-ipd-note-trigger')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ph-coverage-ipd-note-trigger';
        button.setAttribute('aria-label', 'หมายเหตุค่าชดเชย IPD 18 รายการ');
        button.setAttribute('aria-controls', popup.id);
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '<span class="material-icons-round" aria-hidden="true">info</span>';
        cell.appendChild(button);
        button.addEventListener('mouseenter', () => open(button));
        button.addEventListener('mouseleave', scheduleClose);
        button.addEventListener('focus', () => { if (!restoringFocus) open(button); });
        button.addEventListener('blur', scheduleClose);
        button.addEventListener('click', () => open(button));
      });
    }
  }
  function queueDecorate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(decorate);
  }
  popup.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  popup.addEventListener('mouseleave', scheduleClose);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || popup.hidden) return;
    const button = trigger;
    close();
    restoringFocus = true;
    button?.focus({ preventScroll: true });
    restoringFocus = false;
  });
  document.addEventListener('pointerdown', event => {
    if (!popup.hidden && !popup.contains(event.target) && !trigger?.contains(event.target)) close();
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  new MutationObserver(queueDecorate).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-product'] });
  queueDecorate();
})();
