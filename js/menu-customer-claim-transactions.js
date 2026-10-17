/* พิจารณาเคลม > เคลมลูกค้า > บันทึกข้อมูลเคลม > ประวัติการทำรายการ */
(function () {
  'use strict';
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const actor = '06590 - ณัฏฐณิชา โตรักษา';
  const sampleDate = '2026-05-17T13:15:38+07:00';
  const decisions = [];
  const edits = [];
  const savedValues = new Map();
  const editableLabels = new Set(['วันที่แจ้ง','วันที่เอกสารครบ','วันที่เกิดเหตุ','เวลาที่เกิดเหตุ','สถานพยาบาล','อาการสำคัญ(ChiefComplaint)','การวินิจฉัย1(Diagnosis1)','การวินิจฉัย2(Diagnosis2)','การวินิจฉัย3(Diagnosis3)','รายละเอียดการเจ็บป่วย/การบาดเจ็บ','หมายเหตุ(ถ้ามี)']);
  const originalDisabled = new Map();
  let editing = null;
  let activeDraft = null;
  let openingDraft = false;
  let restoringDraft = false;
  let gateQueued = false;
  let lastFocus = null;

  function claim() {
    const row = window.currentConsiderCustomerRow || {};
    return {row, claimNo: String(row.claimCode || row.claimNo || 'CL6905000082'), caseNo: String(row.caseNo || 'CC6905000082')};
  }
  function timeLabel(stamp) {
    const date = new Date(stamp);
    if (!Number.isFinite(date.getTime())) return 'ไม่ระบุเวลา';
    return new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}).format(date) + ' น.';
  }
  function controlFields() {
    const page = document.getElementById('considerCustomerDetailPage');
    return Array.from(page?.querySelectorAll('#customerTabClaim input, #customerTabClaim select, #customerTabClaim textarea') || [])
      .filter(el => !['button','hidden','file'].includes(el.type) && (!['radio','checkbox'].includes(el.type) || el.checked))
      .map((el, index) => {
        const parent = el.closest('label') || el.parentElement;
        const label = (parent?.querySelector('label, .mb-1, .field-label')?.textContent || el.getAttribute('aria-label') || parent?.textContent || '').replace(/\s+/g,' ').trim().slice(0,85);
        return {index, label: label || el.name || el.id || `ข้อมูลรายการที่ ${index+1}`, value: el.type === 'checkbox' ? 'ใช่' : (el.value || '—')};
      }).filter(field => field.label && field.value !== '—');
  }
  function baseEvents() {
    const {claimNo, caseNo} = claim();
    return [
      {id:'edit-example', kind:'edit', title:'แก้ไขข้อมูลเคลม', stamp:'2026-08-19T10:24:00+07:00', actor, status:'แก้ไขแล้ว', summary:'ปรับข้อมูลการรักษาหลังตรวจสอบเอกสาร', before:{'สถานพยาบาล':'โรงพยาบาลกรุงเทพ','วันที่เข้ารักษา':'16/05/2569','การวินิจฉัย1(Diagnosis1)':'ไข้หวัด'}, after:{'สถานพยาบาล':'โรงพยาบาลกรุงเทพ','วันที่เข้ารักษา':'17/05/2569','การวินิจฉัย1(Diagnosis1)':'ไข้หวัดใหญ่'}, reason:'ตรวจสอบใบรับรองแพทย์ฉบับแก้ไขแล้วพบวันที่เข้ารักษาและผลวินิจฉัยที่ถูกต้อง'},
      {id:'decision-example', kind:'decision', title:'บันทึกผลพิจารณา ครั้งที่ 1', stamp:'2026-05-18T08:32:50+07:00', actor, status:'อนุมัติ', summary:'ผลการพิจารณาที่บันทึกในตัวอย่าง', fields:[{label:'ผลการพิจารณา',value:'อนุมัติ'},{label:'เลขที่ CL',value:claimNo}]},
      {id:'transfer-example', kind:'transfer', title:'แจ้งผลการโอนเงิน', stamp:'2026-05-17T13:15:45+07:00', actor, status:'โอนสำเร็จ', summary:'จำนวนเงิน 550.00 บาท', fields:[{label:'เลขที่ CL',value:claimNo},{label:'สถานะการโอนเงิน',value:'โอนสำเร็จ'},{label:'จำนวนเงิน',value:'550.00 บาท'}]},
      {id:'claim-example', kind:'claim', title:'สร้างรายการเคลม', stamp:sampleDate, actor, summary:claimNo, fields:[{label:'เลขที่ CL',value:claimNo},{label:'เลขที่ Case',value:caseNo}]},
      {id:'case-example', kind:'case', title:'สร้างรายการเคส', stamp:sampleDate, actor, summary:caseNo, fields:[{label:'เลขที่ Case',value:caseNo}]}
    ];
  }
  function events() {
    const rowIndex = Number(window.currentConsiderCustomerRowIndex || 0);
    const draftItems = (window.customerDraftHistory || []).filter(d => Number(d.rowIndex || 0) === rowIndex).map((d, i) => ({
      id:'draft-'+String(d.id || i), kind:'draft', title:'บันทึกแบบร่าง', stamp:d.savedAt || (d.date && d.time ? (() => { const m=String(d.date).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${Number(m[3])-543}-${m[2]}-${m[1]}T${String(d.time).match(/\d{2}:\d{2}/)?.[0] || '00:00'}:00+07:00` : ''; })() : ''), actor:d.user || actor,
      status:'แบบร่าง', summary:`Step ${d.step || 1} · ${d.stepLabel || 'บันทึกข้อมูลเคลม'}`, note:d.note || '', fields:d.detailFields || [{label:'เลขที่ CL',value:claim().claimNo},{label:'ขั้นตอนที่บันทึก',value:`Step ${d.step || 1} · ${d.stepLabel || 'บันทึกข้อมูลเคลม'}`},{label:'รายละเอียด',value:d.note || '—'}], legacy:!d.detailFields
    }));
    return baseEvents().concat(decisions.filter(d => d.rowIndex === rowIndex), edits.filter(d => d.rowIndex === rowIndex), draftItems)
      .sort((a,b) => Date.parse(b.stamp || 0)-Date.parse(a.stamp || 0) || String(b.id).localeCompare(String(a.id)));
  }
  function fieldList(fields) {
    if (!fields?.length) return '<p class="cct-empty">รายการตัวอย่างนี้ไม่มีภาพข้อมูล ณ เวลาที่บันทึก</p>';
    return '<dl class="cct-fields">'+fields.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')+'</dl>';
  }
  function statusTone(status) {
    const value = String(status || '');
    if (/ปฏิเสธ|ไม่อนุมัติ|โอนไม่สำเร็จ/.test(value)) return 'rejected';
    if (/ยกเลิก/.test(value)) return 'cancelled';
    if (/รอ/.test(value)) return 'waiting';
    if (/แบบร่าง/.test(value)) return 'draft';
    if (/อนุมัติ|โอนสำเร็จ|สำเร็จ/.test(value)) return 'approved';
    return 'info';
  }
  function detail(event) {
    if (event.kind === 'edit') {
      const labels = Array.from(new Set([...Object.keys(event.before),...Object.keys(event.after)]));
      const changed = labels.filter(label => event.before[label] !== event.after[label]);
      const unchanged = labels.filter(label => event.before[label] === event.after[label]);
      const row = label => `<div class="cct-diff-line"><span class="cct-diff-name">${esc(label)}</span><span class="cct-diff-before">${esc(event.before[label])}</span><span class="cct-diff-after">${esc(event.after[label])}</span></div>`;
      const unchangedDetails = unchanged.length ? `<details class="cct-unchanged"><summary>ข้อมูลที่ไม่เปลี่ยนแปลง ${unchanged.length} รายการ</summary><div class="cct-diff-table"><div class="cct-diff-columns"><span>ข้อมูล</span><span>ก่อนแก้ไข</span><span>หลังแก้ไข</span></div>${unchanged.map(row).join('')}</div></details>` : '';
      return `<section class="cct-section"><div class="cct-section-head"><h3>ข้อมูลที่แก้ไข</h3><span class="cct-change-count">${changed.length} รายการ</span></div>${changed.length ? `<div class="cct-diff-table"><div class="cct-diff-columns"><span>ข้อมูล</span><span>ก่อนแก้ไข</span><span>หลังแก้ไข</span></div>${changed.map(row).join('')}</div>` : '<p class="cct-empty">ไม่มีข้อมูลที่เปลี่ยนแปลง</p>'}${unchangedDetails}</section><section class="cct-reason"><strong>เหตุผลการแก้ไข</strong><p>${esc(event.reason)}</p></section>`;
    }
    const note = event.kind === 'draft' ? `<p class="cct-hint">${event.legacy ? 'รายการตัวอย่างเดิมมีเพียงข้อมูลสรุป ไม่มีภาพค่าฟอร์ม ณ เวลาบันทึก' : 'แสดงค่าที่เก็บไว้ขณะกด บันทึกแบบร่าง ในหน้าบันทึกข้อมูลเคลม'}</p>` : '';
    const action = event.kind === 'decision' ? '<div class="cct-choice"><button type="button" class="cct-reconsider" data-cct-reconsider>พิจารณาใหม่อีกครั้ง</button><button type="button" class="cct-edit-start" data-cct-edit-start>แก้ไขข้อมูลเคลม</button></div>' : '';
    if (event.kind === 'decision') {
      const decision = event.fields?.find(field => field.label === 'ผลการพิจารณา')?.value || event.status || '—';
      const tone = /ปฏิเสธ|ไม่อนุมัติ/.test(decision) ? 'rejected' : /อนุมัติ/.test(decision) ? 'approved' : 'pending';
      const remaining = event.fields?.filter(field => field.label !== 'ผลการพิจารณา') || [];
      return `<section class="cct-decision-hero ${tone}"><span class="material-icons-round" aria-hidden="true">${tone === 'approved' ? 'task_alt' : tone === 'rejected' ? 'cancel' : 'fact_check'}</span><div><small>ผลการพิจารณา</small><strong>${esc(decision)}</strong><p>${esc(event.summary)}</p></div></section><section class="cct-section"><div class="cct-section-head"><div><span class="cct-section-eyebrow">ข้อมูลที่บันทึก</span><h3>รายละเอียดผลพิจารณา</h3></div><span class="cct-change-count">${remaining.length} รายการ</span></div>${fieldList(remaining)}</section>${action}`;
    }
    return note + fieldList(event.fields) + action;
  }
  function close() {
    document.getElementById('cctDialog')?.remove();
    document.removeEventListener('keydown', onKey);
    lastFocus?.focus();
  }
  function onKey(event) {
    if (event.key === 'Escape') close();
    if (event.key !== 'Tab') return;
    const nodes = Array.from(document.querySelectorAll('#cctDialog button, #cctDialog summary'));
    if (!nodes.length) return;
    if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length-1].focus(); }
    else if (!event.shiftKey && document.activeElement === nodes[nodes.length-1]) { event.preventDefault(); nodes[0].focus(); }
  }
  function open(id, trigger) {
    const event = events().find(item => item.id === id);
    if (!event) return;
    if (event.kind === 'draft') {
      window.openCustomerDraftDetail?.(id.slice('draft-'.length));
      return;
    }
    lastFocus = trigger;
    close();
    lastFocus = trigger;
    const layer = document.createElement('div');
    layer.id = 'cctDialog';
    layer.className = 'cct-overlay';
    const {claimNo, caseNo} = claim();
    layer.innerHTML = `<div class="cct-dialog cct-dialog-${esc(event.kind)}" role="dialog" aria-modal="true" aria-labelledby="cctDialogTitle"><header class="cct-dialog-head"><div class="cct-dialog-title-row"><div><span class="cct-kicker">ประวัติการทำรายการ</span><h2 id="cctDialogTitle">${esc(event.title)}</h2></div><span class="cct-demo-label">ข้อมูลตัวอย่าง</span></div><button type="button" class="cct-close" data-cct-close aria-label="ปิดรายละเอียด"><span class="material-icons-round">close</span></button><div class="cct-dialog-meta"><span>${esc(timeLabel(event.stamp))}</span><span>${esc(event.actor)}</span><span>CL ${esc(claimNo)}</span><span>Case ${esc(caseNo)}</span></div></header><div class="cct-dialog-body">${detail(event)}</div></div>`;
    document.body.appendChild(layer);
    layer.querySelector('[data-cct-close]').focus();
    document.addEventListener('keydown', onKey);
    layer.addEventListener('click', e => {
      if (e.target === layer || e.target.closest('[data-cct-close]')) close();
      else if (e.target.closest('[data-cct-reconsider]')) { close(); leaveEditMode(); window.setCustomerMainTab?.('claim'); window.setCustomerStep?.(1); document.querySelector('#considerCustomerDetailPage .customer-review-tabs')?.scrollIntoView({block:'start'}); }
      else if (e.target.closest('[data-cct-edit-start]')) { close(); beginEditMode(); }
    });
  }
  function fieldLabel(field) {
    const label = field.closest('label');
    const text = label?.querySelector(':scope > div')?.textContent || label?.querySelector(':scope > span')?.textContent || label?.textContent || '';
    return text.replace(/\*/g,'').replace(/\s+/g,' ').trim();
  }
  function allowed(field) {
    if (field.closest('[data-cct-edit-toolbar]')) return true;
    if (field.closest('[data-physical-therapy="customer"], [data-hospital-traffic-accident]')) return true;
    return !!field.closest('.treatment-detail-actual') && editableLabels.has(fieldLabel(field));
  }
  function gateFields() {
    if (!editing) return;
    const pane = document.getElementById('ccStepPane1');
    if (!pane) return;
    const decisions = Array.from(pane.querySelectorAll('#customerDecisionSection, .customer-decision-section, .cc-ref-decision-wrap'));
    decisions.forEach(section => { section.dataset.cctReplacedDecision = 'true'; });
    const target = decisions.find(section => !section.parentElement?.closest('#customerDecisionSection, .customer-decision-section, .cc-ref-decision-wrap')) || pane.querySelector('.customer-step1-footer, .cc-ref-actionbar');
    if (editing.toolbar && target && editing.toolbar.nextElementSibling !== target) target.before(editing.toolbar);
    pane.querySelectorAll('.cc-ref-actionbar, .customer-step1-footer').forEach(row => { row.dataset.cctLegacyActions = 'true'; });
    pane.querySelectorAll('button.claim-step-action-btn').forEach(button => {
      const row = button.closest('.flex.flex-col.gap-3.pt-2');
      if (row) row.dataset.cctLegacyActions = 'true';
    });
    pane.querySelectorAll('input,select,textarea,button').forEach(field => {
      if (field.closest('[data-cct-edit-toolbar]')) return;
      if (!originalDisabled.has(field)) originalDisabled.set(field, field.disabled);
      field.disabled = !allowed(field);
      field.setAttribute('aria-disabled', field.disabled ? 'true' : 'false');
    });
    document.querySelectorAll('#considerCustomerDetailPage .customer-review-steps button, #considerCustomerDetailPage [data-customer-tab]:not([data-customer-tab="claim"])').forEach(button => {
      if (!originalDisabled.has(button)) originalDisabled.set(button, button.disabled);
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });
    if (editing.before) captureEditable().forEach((value, key) => { if (!editing.before.has(key)) editing.before.set(key, value); });
  }
  function scheduleGate() {
    if (!editing || gateQueued) return;
    gateQueued = true;
    requestAnimationFrame(() => { gateQueued = false; gateFields(); });
  }
  function fieldKey(field) {
    if (field.closest('[data-physical-therapy="customer"]')) return field.dataset.physicalTherapyCheckbox ? 'physical-therapy-flag' : 'physical-therapy-necessity';
    if (field.closest('[data-hospital-traffic-accident]')) return field.name || field.id;
    return 'claim-'+fieldLabel(field);
  }
  function fieldName(field) {
    if (field.closest('[data-physical-therapy="customer"]')) return field.dataset.physicalTherapyCheckbox ? 'ข้อมูลกายภาพบำบัด' : 'ความจำเป็นทางการแพทย์';
    if (field.closest('[data-hospital-traffic-accident]')) {
      const group = field.closest('fieldset')?.querySelector('legend')?.textContent?.replace(/\*/g,'').trim() || 'ข้อมูลอุบัติเหตุจากการจราจร';
      return field.closest('.hospital-traffic-conditional') ? `${group} · ${fieldLabel(field)}` : group;
    }
    return fieldLabel(field);
  }
  function captureEditable() {
    const map = new Map();
    document.querySelectorAll('#ccStepPane1 input, #ccStepPane1 select, #ccStepPane1 textarea').forEach(field => {
      if (!allowed(field) || field.closest('[data-cct-edit-toolbar]')) return;
      if ((field.type === 'radio' || field.type === 'checkbox') && !field.checked && field.type === 'radio') return;
      const key = fieldKey(field);
      if (!key) return;
      map.set(key, {label:fieldName(field), value:field.type === 'checkbox' ? (field.checked ? 'ใช่' : 'ไม่ใช่') : (field.value || '—')});
    });
    return map;
  }
  function applySavedValues(rowIndex) {
    const values = savedValues.get(rowIndex);
    if (!values || Number(window.currentConsiderCustomerRowIndex || 0) !== rowIndex) return;
    document.querySelectorAll('#ccStepPane1 input, #ccStepPane1 select, #ccStepPane1 textarea').forEach(field => {
      if (!allowed(field)) return;
      const saved = values.get(fieldKey(field));
      if (!saved) return;
      if (field.type === 'radio') field.checked = field.value === saved.value;
      else if (field.type === 'checkbox') field.checked = saved.value === 'ใช่';
      else field.value = saved.value === '—' ? '' : saved.value;
      if (field.closest('[data-physical-therapy="customer"], [data-hospital-traffic-accident]') && (field.type !== 'radio' || field.checked)) field.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }
  function leaveEditMode() {
    editing?.toolbar?.remove();
    document.querySelectorAll('#ccStepPane1 [data-cct-replaced-decision]').forEach(section => { delete section.dataset.cctReplacedDecision; });
    document.getElementById('considerCustomerDetailPage')?.classList.remove('cct-editing');
    originalDisabled.forEach((disabled, field) => { if (field.isConnected) { field.disabled = disabled; field.setAttribute('aria-disabled', disabled ? 'true' : 'false'); } });
    originalDisabled.clear();
    editing = null;
  }
  function cancelEditMode() {
    if (editing?.controls) {
      editing.controls.forEach(item => {
        if (!item.field.isConnected) return;
        item.field.value = item.value;
        item.field.checked = item.checked;
      });
      editing.controls.forEach(item => {
        if (!item.field.isConnected || (item.field.type === 'radio' && !item.checked)) return;
        item.field.dispatchEvent(new Event('change', {bubbles:true}));
      });
    }
    leaveEditMode();
  }
  function beginEditMode() {
    activeDraft = null;
    leaveEditMode();
    window.setCustomerMainTab?.('claim');
    window.setCustomerStep?.(1);
    const pane = document.getElementById('ccStepPane1');
    if (!pane) return;
    pane.closest('#considerCustomerDetailPage')?.classList.add('cct-editing');
    editing = {rowIndex:Number(window.currentConsiderCustomerRowIndex || 0), before:null, controls:null, toolbar:null};
    const toolbar = document.createElement('section');
    toolbar.className = 'cct-edit-toolbar';
    toolbar.dataset.cctEditToolbar = 'true';
    toolbar.innerHTML = '<div class="cct-edit-heading"><span class="material-icons-round" aria-hidden="true">edit_note</span><div><strong>แก้ไขข้อมูลเคลม</strong><p>แก้ไขได้เฉพาะฟิลด์ที่กำหนดใน บันทึกข้อมูลเคลม</p></div></div><label for="cctEditReason">เหตุผลการแก้ไข <span aria-hidden="true">*</span></label><textarea id="cctEditReason" rows="3" aria-describedby="cctEditError"></textarea><p id="cctEditError" role="alert" hidden></p><div class="cct-edit-actions"><button type="button" data-cct-cancel>ยกเลิกการแก้ไข</button><button type="button" data-cct-save>บันทึกการแก้ไข</button></div>';
    editing.toolbar = toolbar;
    gateFields();
    editing.before = captureEditable();
    editing.controls = Array.from(pane.querySelectorAll('input,select,textarea')).filter(allowed).map(field => ({field,value:field.value,checked:field.checked}));
    toolbar.scrollIntoView({block:'start'});
    toolbar.querySelector('textarea').focus({preventScroll:true});
  }
  function saveEdit() {
    if (!editing) return;
    const reason = document.getElementById('cctEditReason')?.value.trim() || '';
    const error = document.getElementById('cctEditError');
    if (!reason) { error.textContent='กรุณาระบุเหตุผลการแก้ไข'; error.hidden=false; document.getElementById('cctEditReason')?.focus(); return; }
    const after = captureEditable();
    const beforeValues = {}, afterValues = {};
    let changed = 0;
    new Set([...editing.before.keys(), ...after.keys()]).forEach(key => {
      const oldField = editing.before.get(key), newField = after.get(key);
      if (!oldField || !newField || oldField.value === newField.value) return;
      const label = newField.label || oldField.label;
      beforeValues[label] = oldField.value;
      afterValues[label] = newField.value;
      changed++;
    });
    if (!changed) { error.textContent='ยังไม่มีข้อมูลที่เปลี่ยน กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์'; error.hidden=false; return; }
    edits.push({id:'edit-'+Date.now(),kind:'edit',title:'แก้ไขข้อมูลเคลม',stamp:new Date().toISOString(),actor,status:'แก้ไขแล้ว',summary:`เปลี่ยน ${changed} ฟิลด์`,before:beforeValues,after:afterValues,reason,rowIndex:editing.rowIndex});
    savedValues.set(editing.rowIndex, after);
    leaveEditMode();
    window.refreshCustomerTransactionPane?.();
    window.setCustomerMainTab?.('transactions');
  }
  window.renderCustomerClaimTransactionPrototype = function () {
    const items = events();
    return `<section id="customerTabTransactions" class="customer-tab-pane cct-pane"><div class="customer-panel-modern"><div class="customer-panel-modern-title"><span class="material-icons-round">manage_history</span>ประวัติการทำรายการ<span class="cct-count">${items.length} รายการ</span></div><div class="customer-panel-modern-body"><p class="cct-context">ข้อมูลตัวอย่างของเคลมนี้ · เรียงจากรายการล่าสุด</p><ol class="cct-list">${items.map(item => `<li class="cct-item"><span class="cct-mark ${item.kind} ${item.status ? `tone-${statusTone(item.status)}` : ''}" aria-hidden="true"><span class="material-icons-round">${({draft:'save_as',decision:'fact_check',transfer:'payments',edit:'edit_note',claim:'description',case:'folder_open'})[item.kind]}</span></span><article class="cct-card"><div class="cct-card-top"><div class="cct-main"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>${item.status ? `<span class="cct-status cct-status--${statusTone(item.status)}">${esc(item.status)}</span>` : ''}</div><div class="cct-card-bottom"><div class="cct-card-meta"><span class="cct-date">${esc(timeLabel(item.stamp))}</span><span class="cct-actor">${esc(item.actor)}</span></div><button type="button" class="cct-detail-button" data-cct-id="${esc(item.id)}" aria-label="ดูรายละเอียด ${esc(item.title)}">ดูรายละเอียด<span class="material-icons-round" aria-hidden="true">arrow_forward</span></button></div></article></li>`).join('')}</ol></div></div></section>`;
  };
  document.addEventListener('click', e => {
    if (e.target.closest?.('[data-cct-cancel]')) { cancelEditMode(); return; }
    if (e.target.closest?.('[data-cct-save]')) { saveEdit(); return; }
    const button=e.target.closest?.('[data-cct-id]');
    if (button) { open(button.dataset.cctId, button); return; }
    const save=e.target.closest?.('#considerCustomerDetailPage button');
    if (!save || save.disabled || !save.textContent.replace(/\s+/g,' ').includes('ยืนยันบันทึกผลพิจารณา')) return;
    const result=String(window.customerDecisionState?.type || '').trim();
    if (!result) return;
    const labels={waitdocs:'รอเอกสาร',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก',approve:'อนุมัติ'};
    const rowIndex=Number(window.currentConsiderCustomerRowIndex || 0);
    const count=decisions.filter(item => item.rowIndex === rowIndex).length + 2;
    decisions.push({id:'decision-'+Date.now()+'-'+count, kind:'decision', rowIndex, title:'บันทึกผลพิจารณา ครั้งที่ '+count, stamp:new Date().toISOString(), actor, status:labels[result] || result, summary:'ข้อมูลที่บันทึกในหน้าบันทึกข้อมูลเคลม', fields:[{label:'ผลการพิจารณา',value:labels[result] || result},...controlFields()]});
    window.refreshCustomerTransactionPane?.();
  });
  function draftFieldEntries() {
    return ['ccStepPane1', 'ccStepPane2', 'ccStepPane3'].flatMap(paneId => {
      const pane = document.getElementById(paneId);
      return Array.from(pane?.querySelectorAll('input,select,textarea') || []).map((field, index) => ({field, paneId, index, key: `${paneId}|${field.id ? `#${field.id}` : field.name ? `${field.name}:${field.type}:${index}` : index}`}));
    });
  }
  function captureDraftFields() {
    return draftFieldEntries().filter(({field}) => field.type !== 'file').map(({field, paneId, index, key}) => ({paneId, index, key, value:field.value, checked:field.checked, type:field.type}));
  }
  function mergeDraftFields(previous, current) {
    const fields = new Map((previous || []).map(item => [item.key, item]));
    current.forEach(item => fields.set(item.key, item));
    return Array.from(fields.values());
  }
  function restoreDraftFields(snapshot, notify = false) {
    if (!Array.isArray(snapshot) || !snapshot.length) return;
    const current = draftFieldEntries();
    const byKey = new Map(current.map(entry => [entry.key, entry.field]));
    const changedChoices = [];
    const wasRestoring = restoringDraft;
    restoringDraft = true;
    snapshot.forEach(item => {
      const field = byKey.get(item.key) || current.find(entry => entry.paneId === item.paneId && entry.index === item.index && entry.field.type === item.type)?.field;
      if (!field || field.type === 'file') return;
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.checked !== !!item.checked && notify) changedChoices.push(field);
        field.checked = !!item.checked;
      } else {
        if (field.value !== (item.value ?? '') && notify && field.tagName === 'SELECT') changedChoices.push(field);
        field.value = item.value ?? '';
      }
    });
    if (notify) changedChoices.forEach(field => { if (field.isConnected) field.dispatchEvent(new Event('change', {bubbles:true})); });
    restoringDraft = wasRestoring;
  }
  function unlockDraftFields() {
    if (!activeDraft) return;
    document.getElementById('considerCustomerDetailPage')?.classList.add('cct-draft-editing');
    draftFieldEntries().forEach(({field}) => {
      if (field.type === 'hidden') return;
      field.disabled = false;
      field.readOnly = false;
      field.removeAttribute('aria-disabled');
      field.removeAttribute('aria-readonly');
    });
  }
  function showDraftBanner(item) {
    const pane = document.getElementById('customerTabClaim');
    if (!pane) return;
    const existing = pane.querySelector('.cct-draft-banner');
    if (existing?.dataset.draftId === item.id) {
      existing.querySelector('p').textContent = `${item.date} ${item.time} · ${item.stepLabel || 'บันทึกข้อมูลเคลม'}`;
      return;
    }
    existing?.remove();
    const banner = document.createElement('div');
    banner.className = 'cct-draft-banner';
    banner.dataset.draftId = item.id;
    banner.innerHTML = `<span class="material-icons-round" aria-hidden="true">edit_note</span><div><strong>กำลังแก้ไขข้อมูลจากบันทึกแบบร่าง</strong><p>${esc(item.date)} ${esc(item.time)} · ${esc(item.stepLabel || 'บันทึกข้อมูลเคลม')}${item.snapshotV2?.length ? '' : ' · รายการตัวอย่างเดิมไม่มีภาพค่าฟอร์ม ณ เวลาบันทึก'}</p></div>`;
    pane.prepend(banner);
  }
  function showDraftSavedToast() {
    document.getElementById('customerDraftToast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'customerDraftToast';
    toast.className = 'customer-draft-toast';
    toast.innerHTML = '<span class="material-icons-round" aria-hidden="true">check_circle</span><div>บันทึกการแก้ไขแบบร่างแล้ว</div>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }
  document.addEventListener('input', event => {
    if (activeDraft && !restoringDraft && event.target.closest?.('#customerTabClaim')) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
  }, true);
  document.addEventListener('change', event => {
    if (activeDraft && !restoringDraft && event.target.closest?.('#customerTabClaim')) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
  }, true);
  const originalStep = window.setCustomerStep;
  if (typeof originalStep === 'function') window.setCustomerStep = function () {
    if (activeDraft && !restoringDraft) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
    const result = originalStep.apply(this, arguments);
    if (activeDraft) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); requestAnimationFrame(() => { if (activeDraft) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); } }); }
    return result;
  };
  let draftRestoreQueued = false;
  new MutationObserver(mutations => {
    if (!activeDraft || draftRestoreQueued || !mutations.some(m => Array.from(m.addedNodes).some(node => node.nodeType === 1 && (node.closest?.('#customerTabClaim') || node.querySelector?.('#customerTabClaim'))))) return;
    draftRestoreQueued = true;
    requestAnimationFrame(() => { draftRestoreQueued = false; if (activeDraft) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); const draft = (window.customerDraftHistory || []).find(item => item.id === activeDraft.id); if (draft) showDraftBanner(draft); } });
  }).observe(document.body, {childList:true,subtree:true});
  new MutationObserver(mutations => {
    if (!editing && !document.getElementById('cctDialog')) return;
    if (mutations.some(m => Array.from(m.addedNodes).some(node => node.nodeType === 1 && (node.closest?.('#considerCustomerDetailPage') || node.querySelector?.('#ccStepPane1'))))) scheduleGate();
  }).observe(document.body, {childList:true,subtree:true});
  const originalSave = window.saveCustomerDraft;
  if (typeof originalSave === 'function') window.saveCustomerDraft = function () {
    const fields = controlFields();
    if (activeDraft) {
      const draft = (window.customerDraftHistory || []).find(item => item.id === activeDraft.id);
      if (!draft) { activeDraft = null; return; }
      activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
      const now = new Date();
      draft.snapshotV2 = activeDraft.snapshot;
      draft.detailFields = fields;
      draft.savedAt = now.toISOString();
      draft.date = new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok', day:'2-digit', month:'2-digit', year:'numeric'}).format(now);
      draft.time = new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok', hour:'2-digit', minute:'2-digit', hour12:false}).format(now) + ' น.';
      draft.step = Number(window.currentCustomerStep || 1);
      draft.stepLabel = ({1:'บันทึกข้อมูลเคลม',2:'รายละเอียดค่าใช้จ่าย',3:'สรุปรายการเคลม'})[draft.step] || 'บันทึกข้อมูลเคลม';
      window.refreshCustomerTransactionPane?.();
      showDraftBanner(draft);
      showDraftSavedToast();
      return;
    }
    const snapshot = captureDraftFields();
    const result = originalSave.apply(this, arguments);
    const draft = window.customerDraftHistory?.[0];
    if (draft) { draft.detailFields = fields; draft.snapshotV2 = snapshot; draft.savedAt = new Date().toISOString(); window.refreshCustomerTransactionPane?.(); }
    return result;
  };
  const originalOpen = window.openConsiderCustomerRow;
  if (typeof originalOpen === 'function') window.openConsiderCustomerRow = function (rowIndex) {
    if (!openingDraft) { activeDraft = null; document.getElementById('considerCustomerDetailPage')?.classList.remove('cct-draft-editing'); }
    cancelEditMode();
    const result = originalOpen.apply(this, arguments);
    const index = Number(rowIndex || 0);
    if (!openingDraft) { setTimeout(() => applySavedValues(index), 0); setTimeout(() => applySavedValues(index), 120); }
    return result;
  };
  window.openCustomerDraftDetail = function (id) {
    const draft = (window.customerDraftHistory || []).find(item => item.id === id);
    if (!draft) return;
    const index = Number.isFinite(Number(draft.rowIndex)) ? Number(draft.rowIndex) : Number(window.currentConsiderCustomerRowIndex || 0);
    activeDraft = null;
    openingDraft = true;
    try { window.openConsiderCustomerRow?.(index); }
    finally { openingDraft = false; }
    setTimeout(() => {
      window.setCustomerMainTab?.('claim');
      activeDraft = {id:draft.id, rowIndex:index, snapshot:Array.isArray(draft.snapshotV2) ? draft.snapshotV2.slice() : []};
      restoreDraftFields(activeDraft.snapshot, true);
      unlockDraftFields();
      restoringDraft = true;
      try { window.setCustomerStep?.(Number(draft.step || 1)); }
      finally { restoringDraft = false; }
      restoreDraftFields(activeDraft.snapshot);
      unlockDraftFields();
      showDraftBanner(draft);
      window.scrollTo({top:0,behavior:'smooth'});
      setTimeout(() => { if (activeDraft?.id === draft.id) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); } }, 120);
    }, 0);
  };
})();
