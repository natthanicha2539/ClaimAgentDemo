/* ============================================================
   แจ้งเคลม > ติดตามการโอนเงิน > รายละเอียดการแจ้งเคลม
   Tab interaction and mock history panels (private module state).
   ============================================================ */
(function () {
  'use strict';

  const TAB_KEYS = ['claim', 'activity', 'transfer', 'settlement'];
  let currentRow = null;

  function escapeHtml(value) {
    return String(value == null ? '-' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatBaht(value) {
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function addDays(value, days, time) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return '-';
    let year = Number(match[3]);
    if (year > 2400) year -= 543;
    const date = new Date(year, Number(match[2]) - 1, Number(match[1]));
    date.setDate(date.getDate() + days);
    const pad = number => String(number).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear() + 543} ${time}`;
  }

  function getMockCaseNo(row) {
    const suffix = String(row.claimNo || '').replace(/\D/g, '').slice(-9);
    return `CC${suffix || '000000000'}`;
  }

  function getFundRequestNo(row) {
    const suffix = String(row.refNo || '').replace(/\D/g, '').slice(-9);
    return `FND${suffix || '000000000'}`;
  }

  function statusTone(row) {
    if (row.statusKey === 'success') return 'success';
    if (row.statusKey === 'fail') return 'danger';
    return 'pending';
  }

  function timelineItem(icon, title, description, date, tone) {
    return `
      <li class="tdr-history-step ${escapeHtml(tone || '')}">
        <span class="tdr-history-marker" aria-hidden="true"><span class="material-icons-round">${escapeHtml(icon)}</span></span>
        <div class="tdr-history-step-body">
          <div class="tdr-history-step-head">
            <strong>${escapeHtml(title)}</strong>
            <time>${escapeHtml(date)}</time>
          </div>
          <p>${escapeHtml(description)}</p>
        </div>
      </li>`;
  }

  function panelHeader(icon, eyebrow, title, description, badge) {
    return `
      <header class="tdr-history-header">
        <span class="tdr-history-header-icon" aria-hidden="true"><span class="material-icons-round">${escapeHtml(icon)}</span></span>
        <div>
          <span class="tdr-history-eyebrow">${escapeHtml(eyebrow)}</span>
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(description)}</p>
        </div>
        ${badge ? `<span class="tdr-history-badge ${escapeHtml(badge.tone)}">${escapeHtml(badge.text)}</span>` : ''}
      </header>`;
  }

  function renderActivity(row) {
    const panel = document.getElementById('tdrPanelActivity');
    if (!panel) return;
    const finalTitle = row.statusKey === 'success' ? 'ยืนยันผลการโอนสำเร็จ' : row.statusKey === 'fail' ? 'ธนาคารแจ้งผลโอนไม่สำเร็จ' : 'รอผลการโอนจากธนาคาร';
    const finalDescription = row.statusKey === 'success'
      ? `ระบบบันทึกผลการโอนให้ ${row.payee}`
      : row.statusKey === 'fail'
        ? 'ระบบได้รับผลการโอนและเปิดให้แก้ไขข้อมูลบัญชี'
        : 'รายการยังอยู่ในกระบวนการติดตามผลการโอน';
    const finalDate = row.transferDate && row.transferDate !== '-' ? row.transferDate : 'กำลังดำเนินการ';
    panel.innerHTML = `
      <div class="tdr-history-shell">
        ${panelHeader('history', 'ACTIVITY LOG', 'ลำดับการทำรายการ', `ติดตามการดำเนินงานของ ${row.refNo} ตั้งแต่รับแจ้งจนถึงสถานะล่าสุด`)}
        <ol class="tdr-history-timeline">
          ${timelineItem('post_add', 'สร้างรายการแจ้งเคลม', `รับข้อมูลเคลม ${row.claimNo} เข้าสู่ระบบ`, row.created, 'success')}
          ${timelineItem('verified_user', 'ตรวจสอบข้อมูลผู้รับสินไหม', `ยืนยันผู้รับสินไหมและบัญชี ${row.bank} ••••${String(row.account || '').replace(/\D/g, '').slice(-4)}`, row.notifyDate || row.created, 'success')}
          ${timelineItem('send', 'ส่งคำสั่งโอนเงิน', `ส่งรายการยอด ${formatBaht(row.amount)} บาท ไปยังธนาคาร`, row.notifyDate || '-', 'success')}
          ${timelineItem(row.statusKey === 'fail' ? 'error' : row.statusKey === 'success' ? 'check_circle' : 'schedule', finalTitle, finalDescription, finalDate, statusTone(row))}
        </ol>
      </div>`;
  }

  function renderTransfer(row) {
    const panel = document.getElementById('tdrPanelTransfer');
    if (!panel) return;
    const resultText = row.statusKey === 'success' ? 'ธนาคารยืนยันการโอนเงินสำเร็จ' : row.statusKey === 'fail' ? 'ธนาคารปฏิเสธรายการโอน' : 'กำลังรอผลตอบกลับจากธนาคาร';
    panel.innerHTML = `
      <div class="tdr-history-shell">
        ${panelHeader('account_balance', 'TRANSFER HISTORY', 'ประวัติการโอนเงิน', 'แสดงบัญชีปลายทาง ยอดเงิน และผลการโอนล่าสุด', { text: row.status, tone: statusTone(row) })}
        <div class="tdr-history-overview">
          <div><span>ผู้รับเงิน</span><strong>${escapeHtml(row.payee)}</strong></div>
          <div><span>บัญชีปลายทาง</span><strong>${escapeHtml(row.bank)} ${escapeHtml(row.account)}</strong></div>
          <div class="is-amount"><span>ยอดโอน</span><strong>${formatBaht(row.amount)} บาท</strong></div>
        </div>
        <ol class="tdr-history-timeline is-compact">
          ${timelineItem('receipt_long', 'สร้างคำสั่งโอน', `เลขที่รายการ ${row.refNo}`, row.created, 'success')}
          ${timelineItem('outbox', 'ส่งข้อมูลไปธนาคาร', `บัญชีปลายทาง ••••${String(row.account || '').replace(/\D/g, '').slice(-4)}`, row.notifyDate || '-', 'success')}
          ${timelineItem(row.statusKey === 'fail' ? 'error' : row.statusKey === 'success' ? 'task_alt' : 'hourglass_top', 'ผลการโอนเงิน', resultText, row.transferDate && row.transferDate !== '-' ? row.transferDate : 'รอผล', statusTone(row))}
        </ol>
      </div>`;
  }

  function renderSettlement(row) {
    const panel = document.getElementById('tdrPanelSettlement');
    if (!panel) return;
    const submittedAt = addDays(row.created, 1, '09:15:00');
    const reimbursedAt = addDays(row.created, 5, '14:30:00');
    panel.innerHTML = `
      <div class="tdr-history-shell">
        ${panelHeader('savings', 'FUND SETTLEMENT', 'ประวัติการตัดจ่าย', 'รายการตั้งเบิกกองทุนและผลการจ่ายเงินคืนสำหรับเคสนี้', { text: 'จ่ายเงินคืนแล้ว', tone: 'success' })}
        <div class="tdr-settlement-summary">
          <div class="tdr-settlement-id">
            <span class="material-icons-round" aria-hidden="true">verified</span>
            <div><span>เลขที่ตั้งเบิกกองทุน</span><strong>${escapeHtml(getFundRequestNo(row))}</strong></div>
          </div>
          <div><span>Claim / Case</span><strong>${escapeHtml(row.claimNo)} / ${escapeHtml(getMockCaseNo(row))}</strong></div>
          <div class="is-amount"><span>ยอดตัดจ่าย</span><strong>${formatBaht(row.amount)} บาท</strong></div>
        </div>
        <ol class="tdr-history-timeline is-compact">
          ${timelineItem('upload_file', 'ส่งตั้งเบิกกองทุน', `ส่งยอด ${formatBaht(row.amount)} บาท เข้าระบบกองทุน`, submittedAt, 'success')}
          ${timelineItem('paid', 'กองทุนจ่ายเงินคืนเคสนี้เรียบร้อย', `รับเงินคืนครบตามยอดตั้งเบิก อ้างอิง ${getFundRequestNo(row)}`, reimbursedAt, 'success')}
        </ol>
        <div class="tdr-settlement-note"><span class="material-icons-round" aria-hidden="true">info</span><span>ข้อมูลในแท็บนี้เป็น Mock Data สำหรับแสดง Flow การตัดจ่ายใน Demo</span></div>
      </div>`;
  }

  function activateTab(key, shouldFocus) {
    if (!TAB_KEYS.includes(key)) return;
    document.querySelectorAll('#transferClaimDetailPage [data-tdr-tab]').forEach(button => {
      const active = button.dataset.tdrTab === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && shouldFocus) button.focus();
    });
    document.querySelectorAll('#transferClaimDetailPage [data-tdr-panel]').forEach(panel => {
      const active = panel.dataset.tdrPanel === key;
      panel.classList.toggle('hidden', !active);
      panel.hidden = !active;
    });
  }

  function handleTabKeydown(event) {
    const button = event.target.closest('[data-tdr-tab]');
    if (!button) return;
    const currentIndex = TAB_KEYS.indexOf(button.dataset.tdrTab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TAB_KEYS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TAB_KEYS.length - 1;
    else return;
    event.preventDefault();
    activateTab(TAB_KEYS[nextIndex], true);
  }

  function bindTabs() {
    const tabList = document.querySelector('#transferClaimDetailPage .tdr-tabs');
    if (!tabList || tabList.dataset.bound === 'true') return;
    tabList.dataset.bound = 'true';
    tabList.addEventListener('click', event => {
      const button = event.target.closest('[data-tdr-tab]');
      if (button) activateTab(button.dataset.tdrTab, false);
    });
    tabList.addEventListener('keydown', handleTabKeydown);
  }

  document.addEventListener('claimagent:transfer-detail-opened', event => {
    currentRow = event.detail && event.detail.row ? { ...event.detail.row } : null;
    if (!currentRow) return;
    renderActivity(currentRow);
    renderTransfer(currentRow);
    renderSettlement(currentRow);
    activateTab('claim', false);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindTabs);
  else bindTabs();
})();
