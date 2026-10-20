/* แจ้งเคลม > รายละเอียดการตรวจสอบสิทธิ์: Day Case Surgery IPD note. */
(function () {
  'use strict';

  const procedures = [
    'การสลายนิ่ว',
    'การตรวจเส้นเลือดหัวใจโดยการฉีดสี',
    'การผ่าตัดต้อกระจด',
    'การผ่าตัดโดยการส่องกล้อง',
    'การตรวจโดยการส่องกล้อง',
    'การผ่าตัด หรือเจาะไซนัส',
    'การตัดก้อนเนื้อที่เต้านม',
    'การตัดชิ้นเนื้อจากกระดูก',
    'การตัด (Amputation) นิ้วมือหรือนิ้วเท้า',
    'การเจาะตับ',
    'การเจาะไขกระดูก',
    'การเจาะช่องเยื่อหุ้มไขสันหลัง',
    'การเจาะช่องเยื่อหุ้มปอด',
    'การเจาะช่องเยื่อบุช่องท้อง',
    'การขูดมดลูก',
    'การตัดชิ้นเนื้อจากปากมดลูก',
    "การรักษา Bartholin's Cyst",
    'การรักษาโรคด้วยรังสีแกมม่า'
  ];

  const host = document.getElementById('benefitList');
  if (!host) return;

  const popover = document.createElement('aside');
  popover.id = 'eligibilityDayCaseIpdNote';
  popover.className = 'eligibility-day-case-note';
  popover.setAttribute('role', 'note');
  popover.hidden = true;
  popover.innerHTML = `
    <div class="eligibility-day-case-note-head">
      <div class="eligibility-day-case-note-heading">
        <span class="eligibility-day-case-note-kicker">DAY CASE SURGERY · IPD</span>
        <strong>หมายเหตุค่าชดเชย IPD</strong>
      </div>
      <span class="material-icons-round eligibility-day-case-note-head-icon" aria-hidden="true">medical_services</span>
    </div>
    <div class="eligibility-day-case-note-body" tabindex="0" aria-label="รายการผ่าตัดหรือหัตถการที่ได้รับค่าชดเชยรายวัน">
      <div class="eligibility-day-case-note-summary">
        <p class="eligibility-day-case-note-intro">ค่าชดเชยรายวัน 1 วัน สำหรับการตรวจรักษาโดยการผ่าตัดหรือหัตถการ ดังนี้</p>
      </div>
      <div class="eligibility-day-case-note-list-head"><span>รายการผ่าตัดและหัตถการ</span><span>18 รายการ</span></div>
      <ol>${procedures.map(item => `<li>${item}</li>`).join('')}</ol>
    </div>`;
  document.body.appendChild(popover);

  let trigger = null;
  let closeTimer = null;

  function cancelClose() {
    clearTimeout(closeTimer);
    closeTimer = null;
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
    cancelClose();
    if (trigger && trigger !== button) trigger.setAttribute('aria-expanded', 'false');
    trigger = button;
    trigger.setAttribute('aria-expanded', 'true');
    popover.hidden = false;
    position();
  }

  function decorate() {
    const context = host.querySelector('.eligibility-benefit-context');
    const dayCase = context?.textContent.includes('Day Case Surgery');
    if (trigger && (!dayCase || !trigger.isConnected)) close();
    if (!dayCase) return;
    const heading = [...host.querySelectorAll('article h4')]
      .find(node => node.textContent.trim() === 'ค่าชดเชย IPD');
    if (!heading || heading.parentElement.querySelector('.eligibility-day-case-note-trigger')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'eligibility-day-case-note-trigger';
    button.setAttribute('aria-label', 'หมายเหตุค่าชดเชย IPD สำหรับ Day Case Surgery');
    button.setAttribute('aria-controls', popover.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span class="material-icons-round" aria-hidden="true">info</span><span>หมายเหตุ</span>';
    heading.insertAdjacentElement('afterend', button);
    button.addEventListener('mouseenter', () => open(button));
    button.addEventListener('mouseleave', scheduleClose);
    button.addEventListener('focus', () => open(button));
    button.addEventListener('blur', scheduleClose);
    button.addEventListener('click', () => open(button));
  }

  popover.addEventListener('mouseenter', cancelClose);
  popover.addEventListener('mouseleave', scheduleClose);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popover.hidden) {
      const returnFocus = trigger;
      close();
      returnFocus?.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!popover.hidden && !popover.contains(event.target) && event.target !== trigger) close();
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  new MutationObserver(decorate).observe(host, { childList: true, subtree: true });
  decorate();
})();
