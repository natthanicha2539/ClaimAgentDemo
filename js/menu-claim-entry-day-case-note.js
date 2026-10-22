/* แจ้งเคลม PH > Day Case Surgery: reuse the eligibility IPD note beside the benefit. */
(function () {
  'use strict';

  const host = document.getElementById('benefitSummary');
  const page = document.getElementById('claimEntryPage');
  const reference = document.getElementById('eligibilityDayCaseIpdNote');
  if (!host || !page || !reference) return;

  const popover = reference.cloneNode(true);
  popover.id = 'claimEntryDayCaseIpdNote';
  popover.hidden = true;
  document.body.appendChild(popover);

  let trigger = null;
  let closeTimer = 0;
  let restoringFocus = false;

  function eligible() {
    const claim = window.claimState || {};
    const product = String(claim.row?.product || claim.paPrimaryRow?.product || claim.product || 'PH').toUpperCase();
    return claim.claimCategory !== 'hospital' && product === 'PH' && claim.subType === 'Day Case Surgery';
  }

  function cancelClose() {
    clearTimeout(closeTimer);
    closeTimer = 0;
  }

  function close() {
    cancelClose();
    popover.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    trigger = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer = setTimeout(() => {
      if (popover.matches(':hover') || trigger?.matches(':hover') ||
          popover.contains(document.activeElement) || trigger === document.activeElement) return;
      close();
    }, 150);
  }

  function position() {
    if (!trigger || popover.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(640, window.innerWidth - 24);
    popover.style.width = `${width}px`;
    popover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const height = popover.getBoundingClientRect().height;
    const below = window.innerHeight - rect.bottom;
    const top = below >= Math.min(height, 260) || below >= rect.top
      ? rect.bottom + 10
      : rect.top - height - 10;
    popover.style.top = `${Math.max(12, Math.min(top, window.innerHeight - height - 12))}px`;
  }

  function open(button) {
    if (!eligible() || page.classList.contains('hidden')) return;
    cancelClose();
    trigger = button;
    trigger.setAttribute('aria-expanded', 'true');
    popover.hidden = false;
    position();
  }

  function decorate() {
    if (trigger && (!eligible() || !trigger.isConnected || page.classList.contains('hidden'))) close();
    const existing = host.querySelector('.claim-entry-day-case-note-trigger');
    if (!eligible()) {
      existing?.remove();
      return;
    }
    const heading = [...host.querySelectorAll('.benefit-item-card .benefit-item-title')]
      .find(node => ['ค่าชดเชย IPD', 'ค่าชดเชยการนอน'].includes(node.textContent.trim()));
    if (!heading || heading.parentElement.querySelector('.claim-entry-day-case-note-trigger')) return;
    heading.textContent = 'ค่าชดเชย IPD';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'claim-entry-day-case-note-trigger';
    button.setAttribute('aria-label', 'หมายเหตุค่าชดเชย IPD สำหรับ Day Case Surgery');
    button.setAttribute('aria-controls', popover.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span class="material-icons-round" aria-hidden="true">info</span>';
    heading.insertAdjacentElement('afterend', button);
    button.addEventListener('mouseenter', () => open(button));
    button.addEventListener('mouseleave', scheduleClose);
    button.addEventListener('focus', () => { if (!restoringFocus) open(button); });
    button.addEventListener('blur', scheduleClose);
    button.addEventListener('click', () => open(button));
  }

  popover.addEventListener('mouseenter', cancelClose);
  popover.addEventListener('mouseleave', scheduleClose);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || popover.hidden) return;
    const returnFocus = trigger;
    close();
    restoringFocus = true;
    returnFocus?.focus();
    restoringFocus = false;
  });
  document.addEventListener('pointerdown', event => {
    if (!popover.hidden && !popover.contains(event.target) && !trigger?.contains(event.target)) close();
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  new MutationObserver(decorate).observe(host, { childList:true, subtree:true });
  new MutationObserver(() => {
    if (page.classList.contains('hidden')) close();
  }).observe(page, { attributes:true, attributeFilter:['class'] });
  decorate();
})();
