/* หน้าแรก: announcements in the existing vanilla ClaimAgent shell. */
(function () {
  'use strict';
  const root = document.getElementById('homeAnnouncementsPage');
  if (!root) return;
  // Claim detail routes use the legacy hideClaimPages() list. Register Home so
  // those routes do not leave it visible above the physical/traffic sections.
  try {
    if (typeof claimPages !== 'undefined' && Array.isArray(claimPages) && !claimPages.includes(root.id)) claimPages.push(root.id);
  } catch (error) { console.warn('[ClaimAgent Home] Unable to register page navigation', error); }
  let project = Array.isArray(window.CLAIM_AGENT_PROJECT_ANNOUNCEMENTS) ? window.CLAIM_AGENT_PROJECT_ANNOUNCEMENTS : [];
  const STORAGE = 'claimagent.home.announcements.v1';
  const DISPLAY = 'claimagent.home.sections.v1';
  // A view switch is not authorization; the Project editor is available only on the loopback server.
  let adminView = new URLSearchParams(location.search).get('claimAgentDeveloperDemo') === '1';
  let projectWritable = false;
  let projectVersion = null;
  const sections = { maintenance: true, pinned: true, schedule: true, overview: false };
  let local = [];
  let tab = 'updates';
  let adminFilter = 'draft';
  let adminVisibleCount = 8;
  let modalReturn = null;
  let currentModal = null;
  let imageValue = '';
  let imageLoading = false;
  let deleteId = '';
  let toastTimer = 0;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const labels = { maintenance: 'สรุปการปิดระบบ', pinned: 'ประกาศสำคัญ', schedule: 'รายละเอียดและกำหนดการ', overview: 'ภาพรวมประกาศ' };
  const types = ['อัปเดตระบบ', 'ปิดระบบเพื่อบำรุงรักษา', 'ข่าวสารทั่วไป'];
  const noticeKinds = ['แจ้งรายละเอียดการอัพเดท', 'กำหนดการปิดระบบ'];
  const noticeKindOf = (item) => item.noticeKind || (item.type === types[1] ? noticeKinds[1] : item.type === types[2] ? 'ข่าวสารทั่วไป' : noticeKinds[0]);
  const statuses = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'];
  const publication = ['ฉบับร่าง', 'เผยแพร่แล้ว'];
  const isMaintenance = (item) => item.type === types[1];
  const isOpen = (item) => ['รอดำเนินการ', 'กำลังดำเนินการ'].includes(item.workStatus);
  const itemTime = (item) => new Date(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(item.startAt || '') ? `${item.startAt}:00+07:00` : item.startAt || '').getTime();
  const dateText = (value) => {
    if (!value) return 'ไม่ระบุเวลา';
    const d = new Date(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value) ? `${value}:00+07:00` : value);
    return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  };
  function lineDate(value) {
    const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(value || '');
    if (!match) return 'โปรดระบุวันที่';
    const day = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00+07:00`);
    const weekday = new Intl.DateTimeFormat('th-TH', { weekday: 'long', timeZone: 'Asia/Bangkok' }).format(day);
    return `${weekday} ที่ ${match[3]}/${match[2]}/${String((Number(match[1]) + 543) % 100).padStart(2, '0')}`;
  }
  function lineTime(start, end) {
    const first = /T(\d\d:\d\d)/.exec(start || '');
    const last = /T(\d\d:\d\d)/.exec(end || '');
    if (!first) return 'โปรดระบุเวลาเริ่มต้น';
    if (!last) return `${first[1]} น. เป็นต้นไป (ยังไม่ระบุเวลาเปิดระบบ)`;
    const endDay = start.slice(0, 10) === end.slice(0, 10) ? '' : `${end.slice(8, 10)}/${end.slice(5, 7)}/${String((Number(end.slice(0, 4)) + 543) % 100).padStart(2, '0')} `;
    return `${first[1]} – ${endDay}${last[1]} น.`;
  }
  function lineMessage(item) {
    const details = String(item.details || '').trim();
    if (/เรียน\s+สาขาและพนักงานทุกท่าน/.test(details)) return details; // Legacy full-message records.
    const reason = details ? (/^เนื่องจาก/.test(details) ? details : `เนื่องจาก${details}`) : 'เนื่องจาก[ระบุเหตุผลการปิดระบบ]';
    const impact = String(item.impact || '').trim() || 'ขอให้ทุกท่าน งดใช้งานในช่วงเวลาดังกล่าว';
    const recipient = String(item.recipient || '').trim() || 'สาขาและพนักงานทุกท่าน';
    const apology = String(item.apology || '').trim() || 'ขออภัยในความไม่สะดวก';
    const sender = String(item.sender || '').trim() || 'ฝ่ายพัฒนาระบบ';
    return `📢 ${item.title || 'แจ้งปิดการใช้งานทุกระบบ'}\n\nเรียน ${recipient}\n\n📅 ${lineDate(item.startAt)}\n⏰ เวลา ${lineTime(item.startAt, item.endAt)}\n${reason}\n\n📌 ${impact} 🙏\n\n${apology}\n\nขอแสดงความนับถือ\n${sender}`;
  }
  function readStorage() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE) || '[]'); local = Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string') : []; }
    catch (_) { local = []; }
    try { const value = JSON.parse(localStorage.getItem(DISPLAY) || '{}'); Object.keys(sections).forEach((key) => { if (typeof value[key] === 'boolean') sections[key] = value[key]; }); }
    catch (_) { /* defaults */ }
  }
  function allItems() {
    const items = new Map();
    local.forEach((item) => items.set(item.id, item));
    project.forEach((item) => items.set(item.id, item)); // Project file always wins on collisions.
    return Array.from(items.values()).filter((item) => adminView || item.publicationStatus === 'เผยแพร่แล้ว');
  }
  function showToast(message, error) {
    let toast = $('caToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'caToast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); document.body.appendChild(toast); }
    toast.className = 'ca-toast' + (error ? ' error' : ''); toast.textContent = message;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.remove(), 5500);
  }
  function saveLocal(next) {
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); local = next; return true; }
    catch (error) { showToast(error && error.name === 'QuotaExceededError' ? 'พื้นที่จัดเก็บในเบราว์เซอร์เต็ม กรุณาลดขนาดรูปหรือลบข้อมูลทดลอง' : 'บันทึกข้อมูลในเบราว์เซอร์ไม่สำเร็จ', true); return false; }
  }
  function saveSections() {
    try { localStorage.setItem(DISPLAY, JSON.stringify(sections)); }
    catch (_) { showToast('จำการตั้งค่าการแสดงผลในเบราว์เซอร์ไม่ได้', true); }
  }
  function itemMarkup(item, actions) {
    const image = validImage(item.image) ? `<img class="ca-item-thumb" src="${esc(item.image)}" alt="ภาพประกอบ ${esc(item.title)}">` : '';
    const isLocal = local.some((row) => row.id === item.id) && !project.some((record) => record.id === item.id);
    const meta = (adminView
      ? [isLocal ? 'ในเบราว์เซอร์นี้' : 'ไฟล์ Project', item.system, dateText(item.startAt)]
      : [noticeKindOf(item), item.system, `${isMaintenance(item) ? 'เริ่มปิดระบบ' : item.type === types[2] ? 'วันที่ประกาศ' : 'วันที่อัปเดต'} ${dateText(item.startAt)}`, isMaintenance(item) && item.endAt ? `เปิดระบบ ${dateText(item.endAt)}` : ''])
      .filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join('');
    const statusTone = item.workStatus === 'เสร็จสิ้น' ? 'done' : item.workStatus === 'ยกเลิก' ? 'cancelled' : item.workStatus === 'รอดำเนินการ' ? 'waiting' : 'progress';
    const status = `<span class="ca-item-status ca-item-status--${statusTone}">${esc(item.workStatus)}</span>`;
    const draft = adminView && adminFilter === 'all' && item.publicationStatus === 'ฉบับร่าง' ? '<span class="ca-item-draft">ฉบับร่าง</span>' : '';
    const summary = item.type === types[1] ? (item.impact || item.details) : item.details;
    const editLabel = noticeKindOf(item) === noticeKinds[1] ? 'ปรับกำหนดการ' : 'แก้ไขประกาศ';
    const controls = actions === 'project' ? projectWritable ? `<div class="ca-row-actions"><button class="ca-btn" type="button" data-ca-edit="${esc(item.id)}">${editLabel}</button><button class="ca-btn danger" type="button" data-ca-delete="${esc(item.id)}">ลบ</button></div>` : '' : actions ? `<div class="ca-row-actions"><button class="ca-btn" type="button" data-ca-pin="${esc(item.id)}">${item.pinned ? 'ถอนหมุด' : 'ปักหมุด'}</button><button class="ca-btn" type="button" data-ca-edit="${esc(item.id)}">${editLabel}</button><button class="ca-btn danger" type="button" data-ca-delete="${esc(item.id)}">ลบ</button></div>` : '';
    return `<article class="ca-item ${isMaintenance(item) ? 'ca-item--maintenance' : ''}"><div class="ca-item-main"><div class="ca-item-heading"><button class="ca-item-title" type="button" data-ca-detail="${esc(item.id)}">${esc(item.title)}</button>${status}</div><p class="ca-item-summary">${esc(String(summary || '').slice(0, adminView ? 110 : 180))}</p><div class="ca-item-footer"><div class="ca-item-meta">${meta}${draft}</div>${controls}</div></div>${image}</article>`;
  }
  function validImage(value) { return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value); }
  function render() {
    const list = allItems();
    const pinned = list.filter((item) => item.pinned);
    const maintenance = list.filter((item) => isMaintenance(item) && isOpen(item));
    const updates = list.filter((item) => item.type === types[0]);
    const history = list.filter((item) => isMaintenance(item) && !isOpen(item));
    const news = list.filter((item) => item.type === types[2]);
    const featured = maintenance.slice().sort((a, b) => (a.workStatus === 'กำลังดำเนินการ' ? 0 : 1) - (b.workStatus === 'กำลังดำเนินการ' ? 0 : 1) || itemTime(a) - itemTime(b))[0];
    const localCount = list.filter((item) => local.some((row) => row.id === item.id) && !project.some((record) => record.id === item.id)).length;
    const systems = Array.from(new Set(list.map((item) => item.system).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'));
    const old = { q: $('caSearch')?.value || '', system: $('caSystem')?.value || '', status: $('caStatus')?.value || '' };
    const viewSwitch = `<div class="ca-view-switch" role="group" aria-label="มุมมองประกาศ"><button id="caUserView" type="button" aria-pressed="${!adminView}">มุมมองผู้ใช้งาน</button><button id="caAdminView" type="button" aria-pressed="${adminView}">มุมมองผู้ดูแล</button></div>`;
    const displayControl = `<div class="ca-display-wrap"><button class="ca-btn" id="caDisplay" type="button" aria-expanded="false" aria-controls="caDisplayMenu">การแสดงผล <span aria-hidden="true">⌄</span></button><div class="ca-display-menu" id="caDisplayMenu" hidden>${Object.keys(sections).map((key) => `<label><input type="checkbox" data-ca-section="${key}" ${sections[key] ? 'checked' : ''}>${labels[key]}</label>`).join('')}<button type="button" class="ca-btn" id="caShowAll">แสดงทั้งหมด</button></div></div>`;
    const actions = adminView ? `<button class="ca-btn primary" id="caAdd" type="button"><span aria-hidden="true">＋</span> ${projectWritable ? 'เพิ่มประกาศถาวร' : 'เพิ่มประกาศทดลอง'}</button>` : displayControl;
    const note = adminView ? (projectWritable ? 'รายการถาวรบันทึกในไฟล์ Project · รายการทดลองบันทึกในเบราว์เซอร์นี้' : 'รายการถาวรแก้ไขได้เมื่อเปิดผ่านเซิร์ฟเวอร์ Project') : 'แสดงเฉพาะประกาศที่เผยแพร่แล้ว';
    const oldAdminQuery = $('caAdminSearch')?.value || '';
    const draftCount = list.filter((item) => item.publicationStatus === 'ฉบับร่าง').length;
    const publishedCount = list.filter((item) => item.publicationStatus === 'เผยแพร่แล้ว').length;
    root.innerHTML = `<div class="ca-shell"><div class="ca-topline"><span class="ca-topline-brand"><span class="ca-topline-mark" aria-hidden="true"></span> CLAIMAGENT / ศูนย์ประกาศ</span>${viewSwitch}</div><div class="ca-hero"><div class="ca-hero-top"><div class="ca-hero-copy"><span class="ca-eyebrow">${adminView ? 'พื้นที่จัดการประกาศ' : 'ข้อมูลที่ควรรู้ก่อนเริ่มงาน'}</span><h1 id="caHomeTitle">ประกาศ<span class="ca-title-accent">และกำหนดการ</span></h1><p>${adminView ? 'เตรียมข้อความ กำหนดเวลา และตรวจรายการก่อนเผยแพร่' : 'ดูช่วงเวลาปิดระบบและสิ่งที่เปลี่ยนใน ClaimAgent ได้ในที่เดียว'}</p></div><div class="ca-header-actions">${actions}</div></div><div class="ca-hero-bottom"><span class="ca-hero-pulse" aria-hidden="true"></span><span>${adminView ? `${draftCount} ฉบับร่าง · ${publishedCount} เผยแพร่แล้ว` : maintenance.length ? `${maintenance.length} ประกาศเกี่ยวกับการปิดระบบที่ต้องทราบ` : 'ไม่มีกำหนดปิดระบบที่เผยแพร่ในขณะนี้'}</span></div></div>
      <p class="ca-note"><span class="ca-note-dot" aria-hidden="true"></span>${note}</p>
      ${!adminView && sections.maintenance && featured ? `<section class="ca-feature" aria-labelledby="caFeatureTitle"><div class="ca-feature-head"><div><span class="ca-section-label">สิ่งที่ต้องเตรียมพร้อม</span><h2 id="caFeatureTitle">${esc(noticeKindOf(featured))}</h2></div><div class="ca-feature-actions"><span class="ca-count">${maintenance.length} รายการ</span><button id="caHideMaintenance" class="ca-feature-hide" type="button" title="ซ่อนสรุปกำหนดปิดระบบในเบราว์เซอร์นี้">ซ่อนส่วนนี้</button></div></div><div class="ca-feature-body"><div class="ca-feature-time"><span>เริ่มปิดระบบ</span><strong>${esc(dateText(featured.startAt))}</strong><span>คาดว่าเปิดระบบ</span><strong>${esc(featured.endAt ? dateText(featured.endAt) : 'ยังไม่ระบุเวลาเปิดระบบ')}</strong></div><div class="ca-feature-info"><span class="ca-feature-system">${esc(featured.system)}</span><h3>${esc(featured.title)}</h3><p>${esc(featured.impact || featured.details)}</p><button class="ca-feature-link" type="button" data-ca-detail="${esc(featured.id)}">ดูรายละเอียดและผลกระทบ <span aria-hidden="true">→</span></button></div></div></section>` : ''}
      ${adminView ? `<section class="ca-card ca-admin-card" id="caManageSection"><div class="ca-section-head"><div><span class="ca-section-label">รายการทั้งหมด ${list.length} รายการ</span><h2>จัดการประกาศ</h2><p>เลือกรายการเพื่ออ่านหรือปรับกำหนดการ</p></div></div><div class="ca-admin-toolbar"><div class="ca-admin-filters" role="group" aria-label="สถานะการเผยแพร่"><button id="caAdminDraft" type="button" aria-pressed="${adminFilter === 'draft'}">ฉบับร่าง <span>${draftCount}</span></button><button id="caAdminPublished" type="button" aria-pressed="${adminFilter === 'published'}">เผยแพร่แล้ว <span>${publishedCount}</span></button><button id="caAdminAll" type="button" aria-pressed="${adminFilter === 'all'}">ทั้งหมด <span>${list.length}</span></button></div><div class="ca-admin-search"><label for="caAdminSearch" class="sr-only">ค้นหาประกาศในมุมมองผู้ดูแล</label><input id="caAdminSearch" type="search" placeholder="ค้นหาหัวข้อหรือระบบ" value="${esc(oldAdminQuery)}"><button id="caAdminClear" type="button" aria-label="ล้างคำค้นหาผู้ดูแล" ${oldAdminQuery ? '' : 'hidden'}>×</button></div></div><div id="caAdminList" class="ca-list"></div></section>` : ''}
      <section class="ca-card ca-pinned-card" id="caPinnedSection" ${!adminView && sections.pinned && pinned.length ? '' : 'hidden'}><div class="ca-section-head"><h2>ประกาศสำคัญ</h2><span class="ca-count">${pinned.length} รายการ</span></div><div class="ca-pinned">${pinned.map((item) => itemMarkup(item, false)).join('')}</div></section>
      <section class="ca-card ca-schedule-card" id="caScheduleSection" ${!adminView && sections.schedule ? '' : 'hidden'}><div class="ca-section-head"><div><span class="ca-section-label">รายการประกาศ</span><h2>รายละเอียดและกำหนดการ</h2><p>เลือกประเภทที่ต้องการ แล้วเปิดรายการเพื่ออ่านรายละเอียดทั้งหมด</p></div></div><div class="ca-tabs" role="tablist" aria-label="รายการประกาศ"><button id="caScheduleTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'schedule'}">ปิดระบบ <span>${maintenance.length}</span></button><button id="caUpdatesTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'updates'}">อัปเดตระบบ <span>${updates.length}</span></button><button id="caHistoryTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'history'}">ปิดระบบย้อนหลัง <span>${history.length}</span></button><button id="caNewsTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'news'}">ข่าวสาร <span>${news.length}</span></button></div><div class="ca-filters"><label class="ca-search-label"><span class="sr-only">ค้นหาประกาศ</span><span class="ca-search-wrap"><input id="caSearch" type="search" placeholder="ค้นหาหัวข้อหรือรายละเอียด" value="${esc(old.q)}"><button id="caClear" type="button" aria-label="ล้างคำค้นหา" ${old.q ? '' : 'hidden'}>×</button></span></label><label>ระบบ<select id="caSystem"><option value="">ทุกระบบ</option>${systems.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label>สถานะ<select id="caStatus"><option value="">ทุกสถานะ</option>${statuses.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label></div><div id="caList" class="ca-list" role="tabpanel"></div></section>
      <section class="ca-card ca-overview-card" id="caOverviewSection" ${!adminView && sections.overview ? '' : 'hidden'}><details class="ca-overview"><summary>ภาพรวมประกาศ <span aria-hidden="true">⌄</span></summary><div class="ca-overview-grid"><span>ประกาศปิดระบบ <strong>${maintenance.length}</strong> รายการ</span><span>อัปเดตระบบ <strong>${updates.length}</strong> รายการ</span><span>ปิดระบบย้อนหลัง <strong>${history.length}</strong> รายการ</span></div></details></section></div>`;
    $('caSystem').value = old.system; $('caStatus').value = old.status;
    renderList();
    if (adminView) renderAdminList();
  }
  function renderAdminList() {
    const target = $('caAdminList');
    if (!target) return;
    const query = ($('caAdminSearch')?.value || '').trim().toLocaleLowerCase('th');
    $('caAdminClear').hidden = !query;
    const items = allItems().filter((item) => (adminFilter === 'all' || item.publicationStatus === (adminFilter === 'draft' ? 'ฉบับร่าง' : 'เผยแพร่แล้ว')) && (!query || `${item.title} ${item.system} ${item.details}`.toLocaleLowerCase('th').includes(query))).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    target.innerHTML = items.length ? `${items.slice(0, adminVisibleCount).map((item) => itemMarkup(item, project.some((record) => record.id === item.id) ? 'project' : true)).join('')}${items.length > adminVisibleCount ? `<div class="ca-list-more"><span>แสดง ${adminVisibleCount} จาก ${items.length} รายการ</span><button id="caAdminMore" class="ca-btn" type="button">แสดงเพิ่มเติม</button></div>` : ''}` : `<div class="ca-empty"><span class="ca-empty-mark" aria-hidden="true">⌕</span><strong>${query ? 'ไม่พบประกาศที่ตรงกับคำค้นหา' : 'ไม่มีรายการในหมวดนี้'}</strong><span>${query ? 'ลองค้นด้วยหัวข้อหรือชื่อระบบอื่น' : 'เปลี่ยนหมวดเพื่อดูประกาศสถานะอื่น'}</span></div>`;
  }
  function renderList() {
    const q = ($('caSearch')?.value || '').trim().toLocaleLowerCase('th');
    const system = $('caSystem')?.value || '';
    const status = $('caStatus')?.value || '';
    const items = allItems().filter((item) => {
      const inTab = tab === 'schedule' ? isMaintenance(item) && isOpen(item) : tab === 'history' ? isMaintenance(item) && !isOpen(item) : tab === 'news' ? item.type === types[2] : item.type === types[0];
      return inTab && (!q || `${item.title} ${item.system} ${item.details} ${item.impact}`.toLocaleLowerCase('th').includes(q)) && (!system || item.system === system) && (!status || item.workStatus === status);
    }).sort((a, b) => tab === 'schedule' ? itemTime(a) - itemTime(b) : String(b.startAt || b.createdAt).localeCompare(String(a.startAt || a.createdAt)));
    $('caList').setAttribute('aria-labelledby', { schedule: 'caScheduleTab', updates: 'caUpdatesTab', history: 'caHistoryTab', news: 'caNewsTab' }[tab]);
    $('caList').innerHTML = items.length ? items.map((item) => itemMarkup(item, false)).join('') : `<div class="ca-empty"><span class="ca-empty-mark" aria-hidden="true">—</span><strong>${q || system || status ? 'ไม่พบประกาศที่ตรงกับการค้นหา' : { schedule: 'ยังไม่มีประกาศเกี่ยวกับการปิดระบบ', updates: 'ยังไม่มีรายละเอียดการอัปเดตระบบ', history: 'ยังไม่มีประวัติการปิดระบบ', news: 'ยังไม่มีข่าวสาร' }[tab]}</strong><span>${q || system || status ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เมื่อมีประกาศในหมวดนี้ รายการจะแสดงที่นี่'}</span></div>`;
    $('caClear').hidden = !q;
  }
  function openModal(body, title, footer, wide) {
    closeModal(); modalReturn = document.activeElement;
    const overlay = document.createElement('div'); overlay.className = 'ca-overlay'; overlay.id = 'caOverlay';
    overlay.innerHTML = `<div class="ca-modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="caModalTitle"><div class="ca-modal-head"><h2 id="caModalTitle">${esc(title)}</h2><button type="button" class="ca-btn" data-ca-close aria-label="ปิด Dialog">×</button></div><div class="ca-modal-body">${body}</div><div class="ca-modal-foot">${footer}</div></div>`;
    document.body.appendChild(overlay); currentModal = overlay;
    document.querySelector('body > div.min-h-screen')?.setAttribute('inert', '');
    overlay.querySelector('[data-ca-close]').focus();
    overlay.addEventListener('click', (event) => { if (event.target === overlay || event.target.closest('[data-ca-close]')) closeModal(); });
  }
  function closeModal() { if (currentModal) { currentModal.remove(); currentModal = null; document.querySelector('body > div.min-h-screen')?.removeAttribute('inert'); modalReturn?.focus(); modalReturn = null; } }
  function field(label, name, control, full, help) { return `<label class="ca-field ${full ? 'full' : ''}">${label}${control}${help ? `<span class="ca-field-help" id="caHelp-${name}">${help}</span>` : ''}<span class="ca-field-error" id="caError-${name}" data-error="${name}"></span></label>`; }
  function options(values, selected) { return values.map((value) => `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(value)}</option>`).join(''); }
  function openForm(item, persistToProject = false) {
    if (persistToProject && !projectWritable) { showToast('เปิดผ่านเซิร์ฟเวอร์ Project บนเครื่องนี้เพื่อแก้ไขประกาศถาวร', true); return; }
    if (item && project.some((record) => record.id === item.id) && !persistToProject) return;
    imageValue = validImage(item?.image) ? item.image : '';
    const val = (key) => esc(item?.[key] || '');
    const startValue = val('startAt');
    const kindChoices = item?.type === types[2] ? noticeKinds.concat('ข่าวสารทั่วไป') : noticeKinds;
    const existingKind = item ? noticeKindOf(item) : noticeKinds[1];
    const selectedKind = kindChoices.includes(existingKind) ? existingKind : noticeKinds[1];
    const form = `<form id="caForm" class="ca-compose" novalidate>
      <div class="ca-compose-top"><div><span class="ca-compose-kicker">${item ? 'แก้ไขประกาศ' : 'เพิ่มประกาศ'}</span><p>เลือกประเภท → กรอกข้อมูลสำคัญ → บันทึกประกาศ</p></div><span class="ca-compose-storage">${persistToProject ? 'ไฟล์ Project บนเครื่องนี้' : 'ข้อมูลทดลองในเบราว์เซอร์นี้'}</span></div>
      <div class="ca-compose-layout"><div class="ca-compose-fields">
        <section class="ca-compose-card" aria-labelledby="caFormContentTitle"><div class="ca-form-section-head"><div><h3 id="caFormContentTitle">ข้อมูลที่ต้องแจ้ง</h3><p>ช่องที่มี * จำเป็นต้องระบุ</p></div></div><div class="ca-form-grid">
          <fieldset class="ca-kind-picker full"><legend>ประเภทประกาศ *</legend><div class="ca-kind-options">${kindChoices.map((kind) => `<label class="ca-kind-option"><input type="radio" name="noticeKind" value="${esc(kind)}" ${kind === selectedKind ? 'checked' : ''}><span><strong>${esc(kind)}</strong><small>${kind === noticeKinds[0] ? 'บอกผู้ใช้งานว่าระบบเปลี่ยนอะไร' : kind === noticeKinds[1] ? 'แจ้งช่วงเวลาปิดระบบล่วงหน้า' : 'แก้ไขรายการข่าวสารเดิม'}</small></span></label>`).join('')}</div></fieldset>
          <input type="hidden" name="type" value="${esc(item?.type || types[1])}">
          ${field('หัวข้อประกาศ *', 'title', `<input name="title" maxlength="160" placeholder="เช่น แจ้งปิดการใช้งานทุกระบบ" value="${val('title')}">`, true)}
          <p id="caKindGuide" class="ca-kind-guide full"></p>
          <div class="ca-maintenance-only ca-form-grid full ca-compose-time">
            ${field('วันและเวลาเริ่มปิดระบบ *', 'startAt', `<input type="datetime-local" name="startAt" value="${startValue}">`, false, 'เวลาในประเทศไทย')}
            ${field('วันและเวลาเปิดระบบ', 'endAt', `<input type="datetime-local" name="endAt" value="${val('endAt')}">`, false, 'ต้องอยู่หลังเวลาเริ่มต้น')}
          </div>
          ${field('เหตุผล / รายละเอียด *', 'details', `<textarea name="details" placeholder="เช่น ฝ่ายพัฒนาระบบมีการย้าย Server ของระบบทั้งหมด">${val('details')}</textarea>`, true, 'ประกาศปิดระบบจะเติม “เนื่องจาก” ในตัวอย่างข้อความให้อัตโนมัติ')}
          ${field('สิ่งที่ขอให้ผู้ใช้งานทำ / ผลกระทบ', 'impact', `<textarea name="impact" placeholder="เช่น ขอให้ทุกท่าน งดใช้งานในช่วงเวลาดังกล่าว">${val('impact')}</textarea>`, true, 'จำเป็นสำหรับประกาศปิดระบบ')}
          <div class="ca-compose-meta full">
            ${field('ระบบที่เกี่ยวข้อง *', 'system', `<input name="system" maxlength="100" value="${val('system') || 'ClaimAgent'}">`, false)}
            <div class="ca-generic-time">${field('วันที่และเวลาอัพเดท', 'genericStartAt', `<input type="datetime-local" name="genericStartAt" value="${startValue}">`, false, persistToProject ? 'จำเป็นสำหรับประกาศถาวร' : 'เว้นว่างได้สำหรับข้อมูลทดลอง')}</div>
          </div>
        </div></section>
        <details class="ca-compose-settings ca-compose-message-options ca-schedule-only"><summary><span><strong>ผู้รับและคำลงท้าย</strong><small>ใช้ข้อความมาตรฐานไว้แล้ว ปรับได้เมื่อจำเป็น</small></span><span aria-hidden="true">⌄</span></summary><div class="ca-compose-settings-body ca-form-grid">
          ${field('ผู้รับข้อความ', 'recipient', `<input name="recipient" maxlength="160" value="${val('recipient') || 'สาขาและพนักงานทุกท่าน'}">`, true, 'ข้อความจะแสดงหลังคำว่า “เรียน”')}
          <div class="ca-maintenance-only ca-field full">${field('ข้อความขออภัย', 'apology', `<input name="apology" maxlength="240" value="${val('apology') || 'ขออภัยในความไม่สะดวก'}">`, true)}</div>
          ${field('ผู้ลงชื่อ', 'sender', `<input name="sender" maxlength="160" value="${val('sender') || 'ฝ่ายพัฒนาระบบ'}">`, true)}
        </div></details>
        <details class="ca-compose-settings"><summary><span><strong>ตัวเลือกเพิ่มเติม</strong><small>การแสดงผล ปักหมุด และรูปภาพ</small></span><span aria-hidden="true">⌄</span></summary><div class="ca-compose-settings-body ca-form-grid">
          ${field('สถานะการเผยแพร่ *', 'publicationStatus', `<select name="publicationStatus" ${persistToProject ? 'disabled' : ''}>${options(publication, item?.publicationStatus || publication[0])}</select>`, true, persistToProject ? 'ประกาศถาวรเปลี่ยนสถานะผ่านกระบวนการเผยแพร่ของ Project เท่านั้น' : 'สถานะนี้ใช้กับข้อมูลทดลองในเบราว์เซอร์นี้เท่านั้น')}
          <label class="ca-check ca-field full"><input type="checkbox" name="pinned" ${item?.pinned ? 'checked' : ''}><span>ปักหมุดประกาศ<small class="ca-field-help">แสดงในส่วนประกาศสำคัญ${persistToProject ? '' : 'ของเบราว์เซอร์นี้'}</small></span></label>
          <div class="ca-field full"><label for="caImage">รูปภาพประกอบ</label><input id="caImage" name="image" type="file" accept="image/jpeg,image/png,image/webp"><span class="ca-field-help" id="caHelp-image">ไม่บังคับ; รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB</span><div id="caImagePreview" class="ca-image-preview"></div><span class="ca-field-error" id="caError-image" data-error="image"></span></div>
        </div></details>
      </div><aside id="caLinePreview" class="ca-compose-preview" aria-label="ตัวอย่างข้อความ LINE"><div class="ca-compose-preview-head"><div><span class="ca-compose-preview-dot" aria-hidden="true"></span><strong>ตัวอย่างข้อความ LINE</strong><small>อัปเดตตามข้อมูลที่กรอก</small></div><button id="caCopyLine" class="ca-btn" type="button">คัดลอก</button></div><div class="ca-compose-preview-body"><pre id="caLineText"></pre></div><p class="ca-compose-preview-tip">ตรวจข้อความและเวลาจริงก่อนส่งใน LINE</p></aside></div>
      <p class="ca-form-note">${persistToProject ? 'บันทึกแล้วข้อมูลจะเปลี่ยนในไฟล์ Project บนเครื่องนี้ โดยยังคงสถานะการเผยแพร่เดิม' : 'การเลือก “เผยแพร่แล้ว” ในฟอร์มทดลองนี้ไม่ได้เผยแพร่ประกาศให้ผู้ใช้อื่นเห็น'}</p>
    </form>`;
    openModal(form, item ? noticeKindOf(item) === noticeKinds[1] ? 'ปรับกำหนดการ' : 'แก้ไขประกาศ' : 'เพิ่มประกาศ', '<button type="button" class="ca-btn" data-ca-close>ยกเลิก</button><button type="submit" form="caForm" class="ca-btn primary">บันทึกประกาศ</button>', true);
    const updateLinePreview = () => {
      if ($('caLinePreview').hidden) return;
      const fields = $('caForm').elements;
      $('caLineText').textContent = lineMessage({ title: fields.title.value, recipient: fields.recipient.value, startAt: fields.startAt.value, endAt: fields.endAt.value, details: fields.details.value, impact: fields.impact.value, apology: fields.apology.value, sender: fields.sender.value });
    };
    const updateTypeGuide = () => {
      const kind = $('caForm').querySelector('[name="noticeKind"]:checked').value;
      const schedule = kind === noticeKinds[1];
      const maintenance = schedule;
      $('caForm').elements.type.value = maintenance ? types[1] : kind === 'ข่าวสารทั่วไป' ? types[2] : types[0];
      $('caForm').classList.toggle('ca-compose--generic', !maintenance);
      $('caKindGuide').textContent = kind === noticeKinds[0] ? 'สรุปรายละเอียดที่เปลี่ยนและผลต่อการใช้งาน' : schedule ? 'ระบุช่วงเวลาปิดและเปิดระบบ พร้อมสิ่งที่ผู้ใช้งานต้องเตรียม' : 'ระบุเนื้อหาข่าวสารที่ต้องการแจ้ง';
      $('caLinePreview').hidden = !schedule;
      $('caForm').querySelectorAll('.ca-schedule-only').forEach((node) => { node.hidden = !schedule; });
      $('caForm').elements.endAt.closest('label').firstChild.textContent = schedule ? 'วันและเวลาเปิดระบบ *' : 'วันและเวลาเปิดระบบ';
      $('caForm').elements.genericStartAt.closest('label').firstChild.textContent = kind === noticeKinds[0] ? 'วันที่และเวลาอัพเดท' : kind === 'ข่าวสารทั่วไป' ? 'วันที่และเวลาประกาศ' : 'วันที่และเวลาเริ่มต้น';
      $('caForm').elements.details.closest('label').firstChild.textContent = kind === noticeKinds[0] ? 'รายละเอียดการอัพเดท *' : schedule ? 'เหตุผลการปิดระบบ *' : 'รายละเอียดข่าวสาร *';
      $('caForm').elements.impact.closest('label').firstChild.textContent = maintenance ? 'สิ่งที่ขอให้ผู้ใช้งานทำ *' : 'ผลต่อผู้ใช้งาน';
      $('caHelp-details').textContent = maintenance ? 'ข้อความตัวอย่างจะเติม “เนื่องจาก” ให้อัตโนมัติ' : 'อธิบายข้อมูลสำคัญให้ผู้ใช้งานเข้าใจ';
      $('caHelp-impact').textContent = maintenance ? 'ระบุสิ่งที่ควรทำในช่วงปิดระบบ' : 'ระบุเมื่อการเปลี่ยนแปลงมีผลต่อผู้ใช้งาน';
      $('caForm').querySelectorAll('.ca-maintenance-only').forEach((node) => { node.hidden = !maintenance; });
      $('caForm').querySelectorAll('.ca-generic-time').forEach((node) => { node.hidden = maintenance; });
      const genericTime = $('caForm').elements.genericStartAt;
      if (maintenance && genericTime.value && !$('caForm').elements.startAt.value) $('caForm').elements.startAt.value = genericTime.value;
      if (!maintenance && $('caForm').elements.startAt.value) genericTime.value = $('caForm').elements.startAt.value;
      updateLinePreview();
    };
    $('caForm').querySelectorAll('[name="noticeKind"]').forEach((control) => control.addEventListener('change', updateTypeGuide));
    $('caForm').addEventListener('input', updateLinePreview);
    $('caForm').addEventListener('change', updateLinePreview);
    $('caCopyLine').addEventListener('click', () => copyLineText($('caLineText').textContent));
    updateTypeGuide();
    $('caForm').querySelectorAll('[name]').forEach((control) => {
      const name = control.name;
      if (name === 'pinned' || name === 'image' || name === 'noticeKind' || name === 'type') return;
      control.setAttribute('aria-describedby', `${$('caHelp-' + name) ? `caHelp-${name} ` : ''}caError-${name}`);
    });
    updateImagePreview();
    $('caImage').addEventListener('change', async (event) => {
      const file = event.target.files[0]; if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('image', 'เลือกไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB'); event.target.value = ''; return; }
      const formModal = currentModal;
      imageLoading = true; formModal.querySelector('[form="caForm"]').disabled = true;
      try { const resized = await resizeImage(file); if (currentModal === formModal) { imageValue = resized; setError('image', ''); updateImagePreview(); } }
      catch (_) { if (currentModal === formModal) setError('image', 'ไม่สามารถอ่านรูปภาพนี้ได้'); }
      finally { imageLoading = false; formModal.querySelector('[form="caForm"]')?.removeAttribute('disabled'); }
    });
    $('caForm').addEventListener('submit', (event) => { event.preventDefault(); submitForm(item, persistToProject); });
  }
  function updateImagePreview() { const target = $('caImagePreview'); if (target) target.innerHTML = imageValue ? `<img src="${esc(imageValue)}" alt="ตัวอย่างรูปภาพประกอบ"><button type="button" class="ca-btn" id="caRemoveImage">ลบรูป</button>` : ''; $('caRemoveImage')?.addEventListener('click', () => { imageValue = ''; $('caImage').value = ''; updateImagePreview(); }); }
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); const scale = Math.min(1, 1280 / image.width, 1280 / image.height); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/webp', 0.78)); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); }; image.src = url;
    });
  }
  function setError(name, message) { const target = currentModal?.querySelector(`[data-error="${name}"]`); if (target) { target.textContent = message; const control = target.parentElement.querySelector('input,select,textarea'); control?.setAttribute('aria-invalid', message ? 'true' : 'false'); } }
  async function submitForm(item, persistToProject = false) {
    if (imageLoading) { showToast('กรุณารอให้ย่อรูปภาพเสร็จก่อนบันทึก', true); return; }
    const form = $('caForm'), fd = new FormData(form);
    const data = Object.fromEntries(['title','system','type','noticeKind','details','impact','startAt','endAt','publicationStatus','recipient','apology','sender'].map((key) => [key, String(fd.get(key) || '').trim()]));
    if (data.type !== types[1]) { data.startAt = String(fd.get('genericStartAt') || '').trim(); data.endAt = ''; }
    data.workStatus = item?.workStatus || statuses[0];
    if (persistToProject) data.publicationStatus = item?.publicationStatus || 'ฉบับร่าง';
    data.pinned = fd.has('pinned'); data.image = imageValue;
    let first = null; const invalid = (key, message) => { setError(key, message); if (!first) first = form.elements[key]; };
    const requiredMessages = { title: 'กรุณาระบุหัวข้อประกาศ', system: 'กรุณาระบุระบบที่เกี่ยวข้อง', details: data.type === types[1] ? 'กรุณาระบุเหตุผลการปิดระบบ' : 'กรุณาระบุรายละเอียดการอัปเดต' };
    Object.keys(requiredMessages).forEach((key) => { setError(key, ''); if (!data[key]) invalid(key, requiredMessages[key]); });
    ['startAt','endAt','impact'].forEach((key) => setError(key, ''));
    if (data.type === types[1] && !data.impact) invalid('impact', 'กรุณาระบุสิ่งที่ขอให้ผู้ใช้งานทำ');
    if (data.type === types[1] && !data.startAt) invalid('startAt', 'กรุณาระบุเวลาเริ่มปิดระบบ');
    if (data.noticeKind === noticeKinds[1] && !data.endAt) invalid('endAt', 'กำหนดการปิดระบบต้องระบุเวลาเปิดระบบ');
    if (data.type !== types[1] && !data.startAt && persistToProject) invalid('genericStartAt', 'ประกาศถาวรต้องระบุเวลาเริ่มต้น');
    if (data.endAt && !data.startAt) invalid('startAt', 'กรุณาระบุเวลาเริ่มต้น');

    if (data.startAt && data.endAt && new Date(data.endAt).getTime() <= new Date(data.startAt).getTime()) invalid('endAt', 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
    if (first) { first.closest('details')?.setAttribute('open', ''); first.focus(); first.scrollIntoView({ block: 'center' }); return; }
    if (persistToProject) {
      if (form.dataset.saving) return;
      form.dataset.saving = '1';
      const saveButton = currentModal.querySelector('[form="caForm"]'); saveButton.disabled = true;
      try {
        const endpoint = item ? `/api/project-announcements/${encodeURIComponent(item.id)}` : '/api/project-announcements';
        const response = await fetch(endpoint, { method: item ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', 'If-Match': String(projectVersion) }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'บันทึกประกาศถาวรไม่สำเร็จ');
        project = result.announcements;
        projectVersion = result.version;
        window.CLAIM_AGENT_PROJECT_ANNOUNCEMENTS = project;
        window.CLAIM_AGENT_BUILD = Object.freeze({ version: String(result.version), updatedAt: result.updatedAt });
        if ($('claimAgentBuildVersion')) $('claimAgentBuildVersion').textContent = String(result.version);
        if ($('claimAgentBuildUpdated')) $('claimAgentBuildUpdated').textContent = result.updatedAt;
        closeModal(); render(); showToast(item ? 'แก้ไขประกาศถาวรใน Project แล้ว' : 'เพิ่มประกาศถาวรใน Project แล้ว');
      } catch (error) { showToast(error.message || 'บันทึกประกาศถาวรไม่สำเร็จ', true); }
      finally { delete form.dataset.saving; saveButton.disabled = false; }
      return;
    }
    const id = item?.id || (window.crypto?.randomUUID ? `local-${crypto.randomUUID()}` : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const next = local.filter((row) => row.id !== id).concat({ ...data, id, createdAt: item?.createdAt || new Date().toISOString() });
    if (!saveLocal(next)) return;
    closeModal(); render(); showToast(item ? 'บันทึกการแก้ไขประกาศในเบราว์เซอร์แล้ว' : 'เพิ่มประกาศในเบราว์เซอร์แล้ว');
  }
  function openDetail(item) {
    const parts = [`<div class="ca-detail-meta"><span>${esc(noticeKindOf(item))}</span><span>${esc(item.system)}</span><span>${esc(item.workStatus)}</span></div>`, isMaintenance(item) ? `<div class="ca-detail-schedule"><div><span>เริ่มปิดระบบ</span><strong>${esc(dateText(item.startAt))}</strong></div><div><span>คาดว่าเปิดระบบ</span><strong>${esc(item.endAt ? dateText(item.endAt) : 'ยังไม่ระบุเวลาเปิดระบบ')}</strong></div></div>` : `<p class="ca-detail-date">${item.type === types[2] ? 'วันที่ประกาศ' : 'วันที่อัปเดต'} ${esc(dateText(item.startAt))}</p>`, item.impact ? `<section class="ca-detail-impact"><h3>ผลกระทบต่อผู้ใช้งาน</h3><p>${esc(item.impact)}</p></section>` : '', `<section class="ca-detail-content"><h3>${isMaintenance(item) ? 'รายละเอียดกำหนดการ' : item.type === types[2] ? 'รายละเอียดข่าวสาร' : 'รายละเอียดการอัปเดต'}</h3><p>${esc(item.details)}</p></section>`, validImage(item.image) ? `<img class="ca-detail-image" src="${esc(item.image)}" alt="ภาพประกอบ ${esc(item.title)}">` : ''];
    openModal(parts.join(''), item.title, `${noticeKindOf(item) === noticeKinds[1] ? '<button type="button" class="ca-btn" id="caCopyDetailLine">คัดลอกข้อความแจ้ง LINE</button>' : ''}<button type="button" class="ca-btn primary" data-ca-close>ปิด</button>`);
    $('caCopyDetailLine')?.addEventListener('click', () => copyLineText(lineMessage(item)));
  }
  async function copyLineText(source) {
    const value = typeof source === 'string' ? source : source.value;
    let temporaryField = null;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const field = typeof source === 'string' ? document.createElement('textarea') : source;
        if (typeof source === 'string') { temporaryField = field; field.value = value; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); }
        field.select();
        if (!document.execCommand('copy')) throw new Error('copy failed');
      }
      showToast('คัดลอกข้อความสำหรับ LINE แล้ว');
    } catch (_) { showToast('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง', true); }
    finally { temporaryField?.remove(); }
  }
  function confirmDelete(item, persistToProject = false) {
    deleteId = item.id;
    const locationText = persistToProject ? 'ไฟล์ Project บนเครื่องนี้' : 'ข้อมูลทดลองในเบราว์เซอร์นี้';
    openModal(`<p>ลบประกาศ “${esc(item.title)}” ออกจาก${locationText}?</p><p class="ca-delete-note">${persistToProject ? 'รายการนี้จะถูกนำออกจากไฟล์ประกาศถาวรและหน้าแรก' : 'รายการนี้จะถูกนำออกจากเบราว์เซอร์นี้'}</p>`, 'ยืนยันการลบประกาศ', '<button type="button" class="ca-btn" data-ca-close>ยกเลิก</button><button type="button" class="ca-btn danger" id="caConfirmDelete">ลบประกาศ</button>');
    $('caConfirmDelete').addEventListener('click', async () => {
      if (!persistToProject) {
        if (saveLocal(local.filter((row) => row.id !== deleteId))) { closeModal(); render(); showToast('ลบประกาศในเบราว์เซอร์แล้ว'); }
        return;
      }
      if (!projectWritable) return;
      const button = $('caConfirmDelete');
      button.disabled = true;
      try {
        const response = await fetch(`/api/project-announcements/${encodeURIComponent(deleteId)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'If-Match': String(projectVersion) }, body: '{}' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'ลบประกาศถาวรไม่สำเร็จ');
        project = result.announcements;
        projectVersion = result.version;
        window.CLAIM_AGENT_PROJECT_ANNOUNCEMENTS = project;
        window.CLAIM_AGENT_BUILD = Object.freeze({ version: String(result.version), updatedAt: result.updatedAt });
        if ($('claimAgentBuildVersion')) $('claimAgentBuildVersion').textContent = String(result.version);
        if ($('claimAgentBuildUpdated')) $('claimAgentBuildUpdated').textContent = result.updatedAt;
        closeModal(); render(); showToast('ลบประกาศถาวรใน Project แล้ว');
      } catch (error) { button.disabled = false; showToast(error.message || 'ลบประกาศถาวรไม่สำเร็จ', true); }
    });
  }
  root.addEventListener('click', (event) => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.id === 'caUserView' || target.id === 'caAdminView') { adminView = target.id === 'caAdminView'; render(); $(target.id)?.focus(); }
    else if (target.id === 'caAdd' && adminView) openForm(null, projectWritable);
    else if (target.id === 'caDisplay') { const menu = $('caDisplayMenu'); menu.hidden = !menu.hidden; target.setAttribute('aria-expanded', String(!menu.hidden)); }
    else if (target.id === 'caShowAll') { Object.keys(sections).forEach((key) => { sections[key] = true; }); saveSections(); render(); }
    else if (target.id === 'caHideMaintenance') { sections.maintenance = false; saveSections(); render(); showToast('ซ่อนสรุปกำหนดปิดระบบในเบราว์เซอร์นี้แล้ว'); }
    else if (['caAdminDraft', 'caAdminPublished', 'caAdminAll'].includes(target.id)) { adminFilter = { caAdminDraft: 'draft', caAdminPublished: 'published', caAdminAll: 'all' }[target.id]; adminVisibleCount = 8; render(); $(target.id)?.focus(); }
    else if (target.id === 'caAdminClear') { $('caAdminSearch').value = ''; renderAdminList(); $('caAdminSearch').focus(); }
    else if (target.id === 'caAdminMore') { adminVisibleCount += 8; renderAdminList(); }
    else if (['caScheduleTab', 'caUpdatesTab', 'caHistoryTab', 'caNewsTab'].includes(target.id)) { tab = { caScheduleTab: 'schedule', caUpdatesTab: 'updates', caHistoryTab: 'history', caNewsTab: 'news' }[target.id]; render(); }
    else if (target.id === 'caClear') { $('caSearch').value = ''; renderList(); $('caSearch').focus(); }
    else if (target.dataset.caDetail) { const item = allItems().find((row) => row.id === target.dataset.caDetail); if (item) openDetail(item); }
    else if (adminView && target.dataset.caEdit) { const item = allItems().find((row) => row.id === target.dataset.caEdit); if (item) openForm(item, project.some((record) => record.id === item.id)); }
    else if (adminView && target.dataset.caDelete) { const item = allItems().find((row) => row.id === target.dataset.caDelete); if (item) confirmDelete(item, project.some((record) => record.id === item.id)); }
    else if (adminView && target.dataset.caPin) { const item = local.find((row) => row.id === target.dataset.caPin); if (item && saveLocal(local.map((row) => row.id === item.id ? { ...row, pinned: !row.pinned } : row))) { render(); showToast(item.pinned ? 'ถอนหมุดประกาศแล้ว' : 'ปักหมุดประกาศแล้ว'); } }
  });
  root.addEventListener('change', (event) => { const key = event.target.dataset.caSection; if (key && key in sections) { sections[key] = event.target.checked; saveSections(); if (key === 'maintenance') render(); else { const id = { pinned: 'caPinnedSection', schedule: 'caScheduleSection', overview: 'caOverviewSection' }[key]; $(id).hidden = !sections[key] || (key === 'pinned' && !allItems().some((item) => item.pinned)); } } else if (['caSystem','caStatus'].includes(event.target.id)) renderList(); });
  root.addEventListener('input', (event) => { if (event.isComposing) return; if (event.target.id === 'caSearch') renderList(); else if (event.target.id === 'caAdminSearch') { adminVisibleCount = 8; renderAdminList(); } });
  root.addEventListener('keydown', (event) => {
    if (!event.target.classList?.contains('ca-tab') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const ids = ['caScheduleTab', 'caUpdatesTab', 'caHistoryTab', 'caNewsTab'];
    const index = ids.indexOf(event.target.id);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
    event.preventDefault();
    $(ids[next])?.click();
  });
  document.addEventListener('click', (event) => { const menu = $('caDisplayMenu'); if (menu && !menu.hidden && !event.target.closest('.ca-display-wrap')) { menu.hidden = true; $('caDisplay')?.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !currentModal && $('caDisplayMenu') && !$('caDisplayMenu').hidden) { $('caDisplayMenu').hidden = true; $('caDisplay')?.setAttribute('aria-expanded', 'false'); $('caDisplay')?.focus(); return; } if (!currentModal) return; if (event.key === 'Escape') { event.preventDefault(); closeModal(); } if (event.key === 'Tab') { const focusables = Array.from(currentModal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter((el) => el.offsetParent !== null); const first = focusables[0], last = focusables[focusables.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } });
  function showHome() { if (typeof window.claimMoneyShowPage === 'function') window.claimMoneyShowPage('homeAnnouncementsPage', 'หน้าแรก', 'ประกาศและกำหนดการ'); else { document.querySelectorAll('main .page').forEach((page) => page.classList.add('hidden')); root.classList.remove('hidden'); $('pageTitle').textContent = 'หน้าแรก'; $('pageSubtitle').textContent = 'ประกาศและกำหนดการ'; } render(); }
  $('menuHome')?.addEventListener('click', showHome);
  window.showClaimAgentHomePage = showHome;
  async function checkProjectEditor() {
    if (location.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(location.hostname)) return;
    try {
      const response = await fetch('/api/project-announcements', { cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      if (!Array.isArray(result.announcements) || !Number.isInteger(result.version)) return;
      project = result.announcements;
      projectVersion = result.version;
      window.CLAIM_AGENT_PROJECT_ANNOUNCEMENTS = project;
      projectWritable = true;
      render();
    } catch (_) { /* Static demo keeps local editing available. */ }
  }
  readStorage(); showHome(); checkProjectEditor();
})();
