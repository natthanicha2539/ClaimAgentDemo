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
  const sections = { pinned: true, schedule: true, overview: true };
  let local = [];
  let tab = 'schedule';
  let modalReturn = null;
  let currentModal = null;
  let imageValue = '';
  let imageLoading = false;
  let deleteId = '';
  let toastTimer = 0;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const labels = { pinned: 'ประกาศสำคัญ', schedule: 'รายการกำหนดการและประวัติ', overview: 'ภาพรวมระบบ' };
  const types = ['อัปเดตระบบ', 'ปิดระบบเพื่อบำรุงรักษา', 'ข่าวสารทั่วไป'];
  const statuses = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'];
  const publication = ['ฉบับร่าง', 'เผยแพร่แล้ว'];
  const dateText = (value) => {
    if (!value) return 'ไม่ระบุเวลา';
    const d = new Date(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value) ? `${value}:00+07:00` : value);
    return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  };
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
    const meta = [isLocal ? 'ในเบราว์เซอร์นี้' : adminView ? 'ไฟล์ Project' : '', item.system, `เริ่ม ${dateText(item.startAt)}`]
      .filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join('');
    const statusTone = item.workStatus === 'เสร็จสิ้น' ? 'done' : item.workStatus === 'ยกเลิก' ? 'cancelled' : item.workStatus === 'รอดำเนินการ' ? 'waiting' : 'progress';
    const status = `<span class="ca-item-status ca-item-status--${statusTone}">${esc(item.workStatus)}</span>`;
    const draft = adminView && item.publicationStatus === 'ฉบับร่าง' ? '<span class="ca-item-draft">ฉบับร่าง</span>' : '';
    const summary = item.type === types[1] ? (item.impact || item.details) : item.details;
    const projectDisabled = projectWritable ? '' : 'disabled title="เปิดผ่านเซิร์ฟเวอร์ Project เพื่อจัดการประกาศถาวร"';
    const controls = actions === 'project' ? `<div class="ca-row-actions"><button class="ca-btn" type="button" data-ca-edit="${esc(item.id)}" ${projectDisabled}>แก้ไข</button><button class="ca-btn danger" type="button" data-ca-delete="${esc(item.id)}" ${projectDisabled}>ลบ</button></div>` : actions ? `<div class="ca-row-actions"><button class="ca-btn" type="button" data-ca-pin="${esc(item.id)}">${item.pinned ? 'ถอนหมุด' : 'ปักหมุด'}</button><button class="ca-btn" type="button" data-ca-edit="${esc(item.id)}">แก้ไข</button><button class="ca-btn danger" type="button" data-ca-delete="${esc(item.id)}">ลบ</button></div>` : '';
    return `<article class="ca-item"><div class="ca-item-main"><div class="ca-item-heading"><button class="ca-item-title" type="button" data-ca-detail="${esc(item.id)}">${esc(item.title)}</button>${status}</div><p class="ca-item-summary">${esc(String(summary || '').slice(0, 180))}</p><div class="ca-item-footer"><div class="ca-item-meta">${meta}${draft}</div>${controls}</div></div>${image}</article>`;
  }
  function validImage(value) { return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value); }
  function render() {
    const list = allItems();
    const pinned = list.filter((item) => item.pinned);
    const activeCount = list.filter((item) => ['รอดำเนินการ', 'กำลังดำเนินการ'].includes(item.workStatus)).length;
    const historyCount = list.filter((item) => item.type !== types[2] && ['เสร็จสิ้น', 'ยกเลิก'].includes(item.workStatus)).length;
    const localCount = list.filter((item) => local.some((row) => row.id === item.id) && !project.some((record) => record.id === item.id)).length;
    const systems = Array.from(new Set(list.map((item) => item.system).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'));
    const old = { q: $('caSearch')?.value || '', system: $('caSystem')?.value || '', type: $('caType')?.value || '', status: $('caStatus')?.value || '' };
    const viewSwitch = `<div class="ca-view-switch" role="group" aria-label="มุมมองประกาศ"><button id="caUserView" type="button" aria-pressed="${!adminView}">มุมมองผู้ใช้งาน</button><button id="caAdminView" type="button" aria-pressed="${adminView}">มุมมองผู้ดูแล</button></div>`;
    const displayControl = `<div class="ca-display-wrap"><button class="ca-btn" id="caDisplay" type="button" aria-expanded="false" aria-controls="caDisplayMenu">การแสดงผล <span aria-hidden="true">⌄</span></button><div class="ca-display-menu" id="caDisplayMenu" hidden>${Object.keys(sections).map((key) => `<label><input type="checkbox" data-ca-section="${key}" ${sections[key] ? 'checked' : ''}>${labels[key]}</label>`).join('')}<button type="button" class="ca-btn" id="caShowAll">แสดงทั้งหมด</button></div></div>`;
    const actions = adminView ? `<button class="ca-btn primary" id="caAdd" type="button"><span aria-hidden="true">＋</span> ${projectWritable ? 'เพิ่มประกาศถาวร' : 'เพิ่มประกาศทดลอง'}</button>` : displayControl;
    const note = adminView ? (projectWritable ? 'เพิ่ม แก้ไข หรือลบประกาศถาวรในไฟล์ Project บนเครื่องนี้ได้ ส่วนประกาศทดลองอยู่ในเบราว์เซอร์นี้' : 'เปิดผ่านเซิร์ฟเวอร์ Project บนเครื่องนี้เพื่อแก้ไขหรือลบประกาศถาวร') : 'มุมมองผู้ใช้งานแสดงเฉพาะประกาศที่เผยแพร่แล้ว ข้อมูลทดลองที่เผยแพร่จะแสดงเฉพาะเบราว์เซอร์นี้';
    const adminItems = list.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    root.innerHTML = `<div class="ca-shell">${viewSwitch}<div class="ca-hero"><div class="ca-hero-top"><div class="ca-hero-copy"><span class="ca-eyebrow">ศูนย์ข้อมูล ClaimAgent</span><h1 id="caHomeTitle">ประกาศและกำหนดการ</h1><p>${adminView ? 'จัดการเนื้อหาและตรวจประกาศก่อนเผยแพร่' : 'ติดตามสิ่งที่เปลี่ยนในระบบ และช่วงเวลาที่ควรทราบจากที่เดียว'}</p></div><div class="ca-header-actions">${actions}</div></div><div class="ca-hero-stats" aria-label="สรุปประกาศ"><div><strong>${activeCount}</strong><span>กำหนดการ</span></div><div><strong>${historyCount}</strong><span>ประวัติอัปเดต</span></div><div><strong>${localCount}</strong><span>ข้อมูลในเบราว์เซอร์นี้</span></div></div></div>
      <p class="ca-note"><span class="ca-note-dot" aria-hidden="true"></span>${note}</p>
      ${adminView ? `<section class="ca-card ca-admin-card" id="caManageSection"><div class="ca-section-head"><div><span class="ca-section-label">มุมมองผู้ดูแล</span><h2>จัดการประกาศ</h2><p>ประกาศถาวรและข้อมูลทดลองแสดงแยกแหล่งที่มา</p></div><span class="ca-count">${list.length} รายการ</span></div><div class="ca-list">${adminItems.length ? adminItems.map((item) => itemMarkup(item, project.some((record) => record.id === item.id) ? 'project' : true)).join('') : '<div class="ca-empty"><strong>ยังไม่มีประกาศ</strong><span>เพิ่มประกาศเพื่อเริ่มจัดการรายการ</span></div>'}</div></section>` : ''}
      <section class="ca-card ca-pinned-card" id="caPinnedSection" ${!adminView && sections.pinned && pinned.length ? '' : 'hidden'}><div class="ca-section-head"><h2>ประกาศสำคัญ</h2><span class="ca-count">${pinned.length} รายการ</span></div><div class="ca-pinned">${pinned.map((item) => itemMarkup(item, false)).join('')}</div></section>
      <section class="ca-card ca-schedule-card" id="caScheduleSection" ${!adminView && sections.schedule ? '' : 'hidden'}><div class="ca-section-head"><div><span class="ca-section-label">รายการประกาศ</span><h2>กำหนดการและประวัติ</h2><p>ค้นหาเรื่องที่เกี่ยวข้องกับการใช้งานของคุณ</p></div></div><div class="ca-tabs" role="tablist" aria-label="รายการประกาศ"><button id="caScheduleTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'schedule'}">กำหนดการ <span>${activeCount}</span></button><button id="caHistoryTab" class="ca-tab" type="button" role="tab" aria-selected="${tab === 'history'}">ประวัติการทำรายการ <span>${historyCount}</span></button></div><div class="ca-filters"><label class="ca-search-label"><span class="sr-only">ค้นหาประกาศ</span><span class="ca-search-wrap"><input id="caSearch" type="search" placeholder="ค้นหาหัวข้อหรือรายละเอียด" value="${esc(old.q)}"><button id="caClear" type="button" aria-label="ล้างคำค้นหา" ${old.q ? '' : 'hidden'}>×</button></span></label><label>ระบบ<select id="caSystem"><option value="">ทุกระบบ</option>${systems.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label>ประเภท<select id="caType"><option value="">ทุกประเภท</option>${types.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label><label>สถานะ<select id="caStatus"><option value="">ทุกสถานะ</option>${statuses.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></label></div><div id="caList" class="ca-list" role="tabpanel"></div></section>
      <section class="ca-card ca-overview-card" id="caOverviewSection" ${!adminView && sections.overview ? '' : 'hidden'}><details class="ca-overview"><summary>ภาพรวมระบบ <span aria-hidden="true">⌄</span></summary><div class="ca-overview-grid"><span>กำหนดการ <strong>${activeCount}</strong> รายการ</span><span>ประวัติอัปเดตและปิดระบบ <strong>${historyCount}</strong> รายการ</span></div></details></section></div>`;
    $('caSystem').value = old.system; $('caType').value = old.type; $('caStatus').value = old.status;
    renderList();
  }
  function renderList() {
    const q = ($('caSearch')?.value || '').trim().toLocaleLowerCase('th');
    const system = $('caSystem')?.value || '';
    const type = $('caType')?.value || '';
    const status = $('caStatus')?.value || '';
    const items = allItems().filter((item) => {
      const inTab = tab === 'schedule' ? ['รอดำเนินการ', 'กำลังดำเนินการ'].includes(item.workStatus) : item.type !== types[2] && ['เสร็จสิ้น', 'ยกเลิก'].includes(item.workStatus);
      return inTab && (!q || `${item.title} ${item.details} ${item.impact}`.toLocaleLowerCase('th').includes(q)) && (!system || item.system === system) && (!type || item.type === type) && (!status || item.workStatus === status);
    }).sort((a, b) => String(b.startAt || b.createdAt).localeCompare(String(a.startAt || a.createdAt)));
    $('caList').setAttribute('aria-labelledby', tab === 'schedule' ? 'caScheduleTab' : 'caHistoryTab');
    $('caList').innerHTML = items.length ? items.map((item) => itemMarkup(item, false)).join('') : `<div class="ca-empty"><span class="ca-empty-mark" aria-hidden="true">—</span><strong>${q || system || type || status ? 'ไม่พบประกาศที่ตรงกับการค้นหา' : tab === 'schedule' ? 'ยังไม่มีกำหนดการ' : 'ยังไม่มีประวัติการอัปเดตหรือปิดระบบ'}</strong><span>${q || system || type || status ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เมื่อมีประกาศในหมวดนี้ รายการจะแสดงที่นี่'}</span></div>`;
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
    const startValue = val('startAt') || (persistToProject ? new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 16) : '');
    const form = `<form id="caForm" novalidate>
      <p class="ca-form-intro"><strong>ข้อมูลประกาศ</strong><span>ช่องที่มี * จำเป็นต้องระบุ ${persistToProject ? 'ข้อมูลที่บันทึกจะอยู่ในไฟล์ Project บนเครื่องนี้' : 'ข้อมูลที่บันทึกจะอยู่เฉพาะเบราว์เซอร์นี้'}</span></p>
      <section class="ca-form-section" aria-labelledby="caFormContentTitle"><div class="ca-form-section-head"><h3 id="caFormContentTitle">เนื้อหาประกาศ</h3><p>สรุปสิ่งที่เปลี่ยนและผลต่อผู้ใช้งาน</p></div><div class="ca-form-grid">
        ${field('หัวข้อประกาศ *', 'title', `<input name="title" maxlength="160" placeholder="เช่น ปรับปรุงระบบเคลมโรงพยาบาล" value="${val('title')}">`, true, 'ใช้ชื่อสั้นที่บอกเรื่องสำคัญของประกาศ')}
        ${field('ระบบที่เกี่ยวข้อง *', 'system', `<input name="system" maxlength="100" value="${val('system') || 'ClaimAgent'}">`, false, 'ระบุชื่อระบบหรือเมนูที่ได้รับผลกระทบ')}
        ${field('ประเภทประกาศ *', 'type', `<select name="type">${options(types, item?.type || types[0])}</select>`, false, 'เลือกประเภทให้ตรงกับเนื้อหา')}
        ${field('รายละเอียดการอัปเดต *', 'details', `<textarea name="details" style="resize:none" placeholder="อธิบายสิ่งที่เปลี่ยนแปลงหรือกำหนดการที่ต้องทราบ">${val('details')}</textarea>`, true, 'อธิบายสิ่งที่เปลี่ยนแปลงและสิ่งที่ผู้ใช้ควรทราบ')}
        ${field('ผลกระทบต่อผู้ใช้งาน', 'impact', `<textarea name="impact" style="resize:none" placeholder="เช่น ไม่สามารถบันทึกเคลมได้ในช่วงเวลาที่ระบุ">${val('impact')}</textarea>`, true, 'จำเป็นสำหรับประกาศปิดระบบเพื่อบำรุงรักษา')}
      </div></section>
      <section class="ca-form-section" aria-labelledby="caFormScheduleTitle"><div class="ca-form-section-head"><h3 id="caFormScheduleTitle">กำหนดการ</h3><p>ระบุช่วงเวลาและสถานะการดำเนินงาน</p></div><div class="ca-form-grid">
        ${field('วันที่และเวลาเริ่มต้น', 'startAt', `<input type="datetime-local" name="startAt" value="${startValue}">`, false, persistToProject ? 'จำเป็นสำหรับประกาศถาวร; เวลาในประเทศไทย' : 'เวลาในประเทศไทย; จำเป็นสำหรับประกาศปิดระบบ')}
        ${field('วันที่และเวลาสิ้นสุด', 'endAt', `<input type="datetime-local" name="endAt" value="${val('endAt')}">`, false, 'หากระบุ ต้องอยู่หลังเวลาเริ่มต้น; จำเป็นสำหรับประกาศปิดระบบ')}
        ${field('สถานะการดำเนินงาน *', 'workStatus', `<select name="workStatus">${options(statuses, item?.workStatus || statuses[0])}</select>`, true, 'กำหนดว่ารายการอยู่ในกำหนดการหรือประวัติการทำรายการ')}
      </div></section>
      <section class="ca-form-section" aria-labelledby="caFormDisplayTitle"><div class="ca-form-section-head"><h3 id="caFormDisplayTitle">การแสดงผล</h3><p>กำหนดสถานะและภาพประกอบ</p></div><div class="ca-form-grid">
        ${field('สถานะการเผยแพร่ *', 'publicationStatus', `<select name="publicationStatus" ${persistToProject ? 'disabled' : ''}>${options(publication, item?.publicationStatus || publication[0])}</select>`, true, persistToProject ? 'ประกาศถาวรเปลี่ยนสถานะผ่านกระบวนการเผยแพร่ของ Project เท่านั้น' : 'สถานะนี้ใช้กับข้อมูลทดลองในเบราว์เซอร์นี้เท่านั้น')}
        <label class="ca-check ca-field full"><input type="checkbox" name="pinned" ${item?.pinned ? 'checked' : ''}><span>ปักหมุดประกาศ<small class="ca-field-help">แสดงรายการนี้ในส่วนประกาศสำคัญ${persistToProject ? '' : 'ของเบราว์เซอร์นี้'}</small></span></label>
        <div class="ca-field full"><label for="caImage">รูปภาพประกอบ</label><input id="caImage" name="image" type="file" accept="image/jpeg,image/png,image/webp"><span class="ca-field-help" id="caHelp-image">ไม่บังคับ; รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB</span><div id="caImagePreview" class="ca-image-preview"></div><span class="ca-field-error" id="caError-image" data-error="image"></span></div>
      </div></section>
      <p class="ca-form-note">${persistToProject ? 'บันทึกแล้วข้อมูลจะเปลี่ยนในไฟล์ Project บนเครื่องนี้ โดยยังคงสถานะการเผยแพร่เดิม' : 'การเลือก “เผยแพร่แล้ว” ในฟอร์มทดลองนี้ไม่ได้เผยแพร่ประกาศให้ผู้ใช้อื่นเห็น'}</p>
    </form>`;
    openModal(form, item ? 'แก้ไขประกาศ' : 'เพิ่มประกาศ', '<button type="button" class="ca-btn" data-ca-close>ยกเลิก</button><button type="submit" form="caForm" class="ca-btn primary">บันทึกประกาศ</button>', true);
    $('caForm').querySelectorAll('[name]').forEach((control) => {
      const name = control.name;
      if (name === 'pinned') return;
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
    const data = Object.fromEntries(['title','system','type','details','impact','startAt','endAt','workStatus','publicationStatus'].map((key) => [key, String(fd.get(key) || '').trim()]));
    if (persistToProject) data.publicationStatus = item?.publicationStatus || 'ฉบับร่าง';
    data.pinned = fd.has('pinned'); data.image = imageValue;
    let first = null; const invalid = (key, message) => { setError(key, message); if (!first) first = form.elements[key]; };
    const requiredMessages = { title: 'กรุณาระบุหัวข้อประกาศ', system: 'กรุณาระบุระบบที่เกี่ยวข้อง', details: 'กรุณาระบุรายละเอียดการอัปเดต' };
    Object.keys(requiredMessages).forEach((key) => { setError(key, ''); if (!data[key]) invalid(key, requiredMessages[key]); });
    ['startAt','endAt','impact'].forEach((key) => setError(key, ''));
    if (data.type === types[1] && !data.impact) invalid('impact', 'ประกาศปิดระบบต้องระบุผลกระทบ');
    if (data.type === types[1] && (!data.startAt || !data.endAt)) invalid(!data.startAt ? 'startAt' : 'endAt', 'ประกาศปิดระบบต้องระบุเวลาเริ่มต้นและสิ้นสุด');
    if (data.endAt && !data.startAt) invalid('startAt', 'กรุณาระบุเวลาเริ่มต้น');
    if (persistToProject && !data.startAt) invalid('startAt', 'ประกาศถาวรต้องระบุเวลาเริ่มต้น');
    if (data.startAt && data.endAt && new Date(data.endAt).getTime() <= new Date(data.startAt).getTime()) invalid('endAt', 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
    if (first) { first.focus(); first.scrollIntoView({ block: 'center' }); return; }
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
    const parts = [`<p><strong>ระบบ:</strong> ${esc(item.system)} · <strong>ประเภท:</strong> ${esc(item.type)}</p>`, `<p><strong>สถานะการดำเนินงาน:</strong> ${esc(item.workStatus)} · <strong>สถานะการเผยแพร่:</strong> ${esc(item.publicationStatus)}</p>`, `<p><strong>เริ่ม:</strong> ${esc(dateText(item.startAt))}${item.endAt ? ` · <strong>สิ้นสุด:</strong> ${esc(dateText(item.endAt))}` : ''}</p>`, `<h3>รายละเอียด</h3><p>${esc(item.details)}</p>`, item.impact ? `<h3>ผลกระทบต่อผู้ใช้งาน</h3><p>${esc(item.impact)}</p>` : '', validImage(item.image) ? `<img class="ca-detail-image" src="${esc(item.image)}" alt="ภาพประกอบ ${esc(item.title)}">` : ''];
    openModal(parts.join(''), item.title, '<button type="button" class="ca-btn primary" data-ca-close>ปิด</button>');
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
    else if (target.id === 'caScheduleTab' || target.id === 'caHistoryTab') { tab = target.id === 'caScheduleTab' ? 'schedule' : 'history'; render(); }
    else if (target.id === 'caClear') { $('caSearch').value = ''; renderList(); $('caSearch').focus(); }
    else if (target.dataset.caDetail) { const item = allItems().find((row) => row.id === target.dataset.caDetail); if (item) openDetail(item); }
    else if (adminView && target.dataset.caEdit) { const item = allItems().find((row) => row.id === target.dataset.caEdit); if (item) openForm(item, project.some((record) => record.id === item.id)); }
    else if (adminView && target.dataset.caDelete) { const item = allItems().find((row) => row.id === target.dataset.caDelete); if (item) confirmDelete(item, project.some((record) => record.id === item.id)); }
    else if (adminView && target.dataset.caPin) { const item = local.find((row) => row.id === target.dataset.caPin); if (item && saveLocal(local.map((row) => row.id === item.id ? { ...row, pinned: !row.pinned } : row))) { render(); showToast(item.pinned ? 'ถอนหมุดประกาศแล้ว' : 'ปักหมุดประกาศแล้ว'); } }
  });
  root.addEventListener('change', (event) => { const key = event.target.dataset.caSection; if (key && key in sections) { sections[key] = event.target.checked; saveSections(); const id = { pinned: 'caPinnedSection', schedule: 'caScheduleSection', overview: 'caOverviewSection' }[key]; $(id).hidden = !sections[key] || (key === 'pinned' && !allItems().some((item) => item.pinned)); } else if (['caSystem','caType','caStatus'].includes(event.target.id)) renderList(); });
  root.addEventListener('input', (event) => { if (event.target.id === 'caSearch' && !event.isComposing) renderList(); });
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
