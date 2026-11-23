/* พิจารณาเคลม > เคลมลูกค้า > บันทึกข้อมูลเคลม > ประวัติการทำรายการ */
(function () {
  'use strict';
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const actor = '06590 - ณัฏฐณิชา โตรักษา';
  const sampleDate = '2026-05-17T13:15:38+07:00';
  const decisions = [];
  const edits = [];
  const savedValues = new Map();
  const savedChoices = new Map();
  const savedInsurance = new Map();
  const savedDocuments = new Map();
  const editableLabels = new Set(['วันที่แจ้ง','วันที่เอกสารครบ','วันที่เกิดเหตุ','เวลาที่เกิดเหตุ','สถานพยาบาล','อาการสำคัญ(ChiefComplaint)','การวินิจฉัย1(Diagnosis1)','การวินิจฉัย2(Diagnosis2)','การวินิจฉัย3(Diagnosis3)','รายละเอียดการเจ็บป่วย/การบาดเจ็บ','หมายเหตุ(ถ้ามี)']);
  const originalDisabled = new Map();
  let editing = null;
  let activeDraft = null;
  let openingDraft = false;
  let restoringDraft = false;
  let gateQueued = false;
  let lastFocus = null;
  let reconsiderBaseline = null;
  const reconsiderLocks = new Map();
  const reconsiderValues = new Map();
  let reconsiderGateQueued = false;
  let successTimer = 0;

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
  function decisionFields(pane) {
    const occurrences = new Map();
    return Array.from(pane?.querySelectorAll('input, select, textarea') || []).map((el, index) => {
      if (['hidden','file'].includes(el.type) || (['radio','checkbox'].includes(el.type) && !el.checked)) return null;
      const parent = el.closest('label') || el.parentElement;
      const label = (parent?.querySelector('label, .mb-1, .field-label')?.textContent || el.getAttribute('aria-label') || parent?.textContent || '').replace(/\s+/g,' ').trim().slice(0,85);
      const baseKey = el.id ? '#'+el.id : el.name ? 'name:'+el.name : 'label:'+label+':'+el.type;
      const occurrence = occurrences.get(baseKey) || 0;
      occurrences.set(baseKey, occurrence + 1);
      return {
        key: baseKey+':'+occurrence,
        label: label || el.name || el.id || `ข้อมูลรายการที่ ${index+1}`,
        value: el.type === 'checkbox' ? 'ใช่' : (el.value || '—'),
        decision: !!el.closest('.customer-decision-section, #customerDecisionSection')
      };
    }).filter(field => field && field.value !== '—');
  }
  function captureReconsiderBaseline() {
    const rowIndex = Number(window.currentConsiderCustomerRowIndex || 0);
    const panes = new Map(['ccStepPane1','ccStepPane2','ccStepPane3'].map(id => {
      const pane = document.getElementById(id);
      return [id, new Map(decisionFields(pane).map(field => [field.key, field.value]))];
    }));
    const amounts = captureReconsiderAmounts();
    const amountLabels = new Map(expenseEntries().filter(entry => entry.monetary).map(entry => [entry.key, entry.label]));
    reconsiderBaseline = {rowIndex, claimKey:reconsiderKey(), panes, amounts, amountLabels, currentAmounts:new Map(amounts)};
    applyReconsiderGate();
  }
  function reconsiderKey() {
    const {claimNo, caseNo} = claim();
    return claimNo + '|' + caseNo;
  }
  function decisionAlreadySaved() {
    return decisions.some(item => item.claimKey === reconsiderKey());
  }
  function reconsideringCurrentClaim() {
    return reconsiderBaseline?.claimKey === reconsiderKey();
  }
  function isDecisionAction(button) {
    const label = String(button?.textContent || '').replace(/save|check_circle/g, '').replace(/\s+/g, ' ').trim();
    return label === 'ยืนยันบันทึกผลพิจารณา' || label === 'อนุมัติ';
  }
  function syncSavedDecisionActions() {
    const page = document.getElementById('considerCustomerDetailPage');
    if (!page) return;
    const locked = decisionAlreadySaved() && !reconsideringCurrentClaim();
    page.querySelectorAll('#ccStepPane1 button, #ccStepPane2 button, #ccStepPane3 button').forEach(button => {
      if (!isDecisionAction(button)) return;
      if (locked) {
        if (!button.disabled) button.dataset.cctSavedDecisionLock = 'true';
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        button.title = 'บันทึกผลพิจารณาแล้ว ให้เริ่มพิจารณาใหม่จากประวัติการทำรายการ';
      } else if (button.dataset.cctSavedDecisionLock === 'true') {
        button.disabled = false;
        button.setAttribute('aria-disabled', 'false');
        button.removeAttribute('title');
        delete button.dataset.cctSavedDecisionLock;
      }
    });
    const approve = Array.from(page.querySelectorAll('#ccStepPane3 button')).find(isDecisionAction);
    const existing = page.querySelector('#cctSavedDecisionNotice');
    if (locked && approve) {
      const notice = existing || document.createElement('p');
      notice.id = 'cctSavedDecisionNotice';
      notice.setAttribute('role', 'status');
      notice.className = 'mt-2 text-sm font-semibold text-amber-700';
      notice.textContent = 'บันทึกผลพิจารณาแล้ว หากต้องการอนุมัติ ให้ไปที่ ประวัติการทำรายการ > ดูรายละเอียด > พิจารณาใหม่อีกครั้ง';
      if (!existing) approve.closest('.flex.flex-col.gap-3.pt-2, .cc-ref-actionbar')?.appendChild(notice);
    } else existing?.remove();
  }
  function nonDeathCoverage() {
    return ['ค่ารักษา','ค่าชดเชย'].includes(String(window.customerClaimSelectionState?.coverage || claim().row.coverageType || '').trim());
  }
  function expenseEntries() {
    const tag = entry => {
      if (entry.field.dataset.cctAmountKey !== entry.key) entry.field.dataset.cctAmountKey = entry.key;
      return entry;
    };
    const compensation = document.querySelector('#ccStepPane2 .cc-ref-step2-shell[data-customer-coverage="ค่าชดเชย"]');
    if (compensation) {
      let editor = compensation.querySelector('[data-cct-compensation-editor]');
      if (!editor) {
        const calculated = compensation.querySelector('[data-cc-comp-calculated]')?.textContent || '0';
        const uncovered = compensation.querySelector('#customerCompensationUncovered')?.value || compensation.querySelector('[data-cc-comp-uncovered]')?.textContent || '0';
        const amount = value => String(value).replace(/[^\d.]/g, '') || '0';
        editor = document.createElement('section');
        editor.dataset.cctCompensationEditor = 'true';
        editor.className = 'cct-compensation-editor';
        editor.innerHTML = '<strong>ยอดเงินสำหรับพิจารณาใหม่</strong><div><label>ยอดเงินตามใบเสร็จ<input data-cct-comp-amount="receipt" inputmode="decimal" value="'+esc(amount(calculated))+'"></label><label>ส่วนลด<input data-cct-comp-amount="discount" inputmode="decimal" value="0.00"></label><label>ยอดไม่คุ้มครอง<input data-cct-comp-amount="uncovered" inputmode="decimal" value="'+esc(amount(uncovered))+'"></label><label>สาเหตุไม่คุ้มครอง<input data-cct-comp-amount="reason" value="'+esc(compensation.querySelector('#customerCompensationReason')?.value || '')+'"></label></div>';
        compensation.querySelector('.cc-ref-title-strip')?.after(editor);
      }
      return Array.from(editor.querySelectorAll('[data-cct-comp-amount]')).map(field => {
        const label = field.closest('label')?.textContent.trim() || '';
        return tag({key:'ค่าชดเชย|'+label,label:'ค่าชดเชย · '+label,field,monetary:field.dataset.cctCompAmount !== 'reason'});
      });
    }
    const headersByTable = new Map();
    return Array.from(document.querySelectorAll('#ccStepPane2 .cc-ref-prelim-table tbody tr')).flatMap((row, index) => {
      const item = row.querySelector('td')?.textContent?.trim() || 'รายการที่ ' + (index + 1);
      const table = row.closest('table');
      if (!headersByTable.has(table)) headersByTable.set(table, Array.from(table?.querySelectorAll('thead th') || [], heading => heading.textContent?.trim() || ''));
      const headers = headersByTable.get(table);
      return Array.from(row.querySelectorAll('td')).flatMap((cell, column) => {
        const header = headers[column] || '';
        const field = cell.querySelector('input, select');
        if (!field || !/^(ยอดเงินตามใบเสร็จ|ส่วนลด|ยอดเงินไม่คุ้มครอง|สาเหตุไม่คุ้มครอง)$/.test(header)) return [];
        return [tag({key: item + '|' + header, label: item + ' · ' + header, field, monetary: header !== 'สาเหตุไม่คุ้มครอง'})];
      });
    });
  }
  function captureReconsiderAmounts() {
    const stored = reconsiderValues.get(reconsiderKey());
    if (stored) return new Map(stored);
    const pane = document.getElementById('ccStepPane2');
    if (pane && !pane.querySelector('.cc-ref-prelim-table') && window.currentCustomerStep !== 2) {
      const current = Number(window.currentCustomerStep || 1);
      window.currentCustomerStep = 2;
      window.setCustomerStep?.(2);
      const values = new Map(expenseEntries().filter(entry => entry.monetary).map(entry => [entry.key, Number(String(entry.field.value || 0).replace(/,/g, '')) || 0]));
      window.setCustomerStep?.(current);
      return values;
    }
    return new Map(expenseEntries().filter(entry => entry.monetary).map(entry => [entry.key, Number(String(entry.field.value || 0).replace(/,/g, '')) || 0]));
  }
  function reconsiderAllowed(control, allowedExpenses) {
    if (control.closest('#customerDecisionSection, .customer-decision-section, .cc-ref-decision-wrap')) return true;
    if (control.closest('.customer-review-steps, .cc-ref-actionbar, .customer-step1-footer')) return true;
    if (control.matches('button') && control.classList.contains('claim-step-action-btn')) {
      const label = control.textContent.replace(/\s+/g, ' ').trim();
      if (/(กลับ|ถัดไป|ยืนยันบันทึกผลพิจารณา|อนุมัติ)/.test(label)) return true;
    }
    if (control.closest('#ccStepPane1')) {
      if (control.matches('#ccContinuousClaimCheckbox, #ccContinuousClaimSelectedDisplay, #ccAdmitDate, #ccAdmitTime, #ccDischargeDate, #ccDischargeTime')) return true;
      return false;
    }
    if (control.closest('#ccStepPane2')) return allowedExpenses.has(control);
    if (control.closest('#ccStepPane3')) return false;
    return false;
  }
  function applyReconsiderGate() {
    if (!reconsiderBaseline) return;
    const page = document.getElementById('considerCustomerDetailPage');
    if (!page) return;
    page.classList.add('cct-reconsidering');
    const allowedExpenses = new Set(expenseEntries().map(entry => entry.field));
    page.querySelectorAll('#ccStepPane1 input, #ccStepPane1 select, #ccStepPane1 textarea, #ccStepPane1 button, #ccStepPane2 input, #ccStepPane2 select, #ccStepPane2 textarea, #ccStepPane2 button, #ccStepPane3 input, #ccStepPane3 select, #ccStepPane3 textarea, #ccStepPane3 button').forEach(control => {
      if (!reconsiderLocks.has(control)) reconsiderLocks.set(control, control.disabled);
      const disabled = reconsiderLocks.get(control) || !reconsiderAllowed(control, allowedExpenses);
      if (control.disabled !== disabled) control.disabled = disabled;
      if (control.getAttribute('aria-disabled') !== String(disabled)) control.setAttribute('aria-disabled', String(disabled));
    });
  }
  function clearReconsiderGate() {
    reconsiderLocks.forEach((disabled, control) => { if (control.isConnected) { control.disabled = disabled; control.setAttribute('aria-disabled', String(disabled)); } });
    reconsiderLocks.clear();
    document.getElementById('considerCustomerDetailPage')?.classList.remove('cct-reconsidering');
    document.querySelector('#considerCustomerDetailPage [data-cct-reconsider-banner]')?.remove();
  }
  function showReconsiderBanner(previousDecision) {
    const page = document.getElementById('considerCustomerDetailPage');
    const tabs = page?.querySelector('.customer-review-tabcard');
    if (!tabs) return;
    page.querySelector('[data-cct-reconsider-banner]')?.remove();
    const decision = String(previousDecision || '—');
    const tone = /ปฏิเสธ|ยกเลิก|ไม่อนุมัติ/.test(decision) ? 'danger' : /อนุมัติ/.test(decision) ? 'success' : 'neutral';
    const icon = tone === 'success' ? 'check_circle' : tone === 'danger' ? 'cancel' : 'info';
    const banner = document.createElement('section');
    banner.className = 'cct-reconsider-banner';
    banner.dataset.cctReconsiderBanner = '';
    banner.innerHTML = `<span class="cct-reconsider-banner-icon material-icons-round" aria-hidden="true">fact_check</span><div class="cct-reconsider-banner-copy"><strong>พิจารณาใหม่อีกครั้ง</strong><p>ตรวจสอบข้อมูลและเลือกผลการพิจารณาครั้งใหม่</p></div><div class="cct-previous-decision" data-tone="${tone}"><span>ผลการพิจารณาครั้งก่อน</span><strong><span class="material-icons-round" aria-hidden="true">${icon}</span>${esc(decision)}</strong></div>`;
    tabs.insertAdjacentElement('afterend', banner);
  }
  function changedAmounts() {
    const before = reconsiderBaseline?.amounts || new Map();
    return Array.from(reconsiderBaseline?.currentAmounts || []).map(([key, newValue]) => {
      const oldValue = before.get(key);
      return oldValue === undefined || Math.abs(oldValue - newValue) < 0.005 ? null : {label: reconsiderBaseline.amountLabels.get(key) || key.replace('|', ' · '), before: oldValue, after: newValue};
    }).filter(Boolean);
  }
  function restoreReconsiderAmounts() {
    const values = reconsiderBaseline?.currentAmounts || reconsiderValues.get(reconsiderKey());
    if (!values) return;
    expenseEntries().forEach(entry => {
      if (!entry.monetary || !values.has(entry.key)) return;
      const value = Number(values.get(entry.key)).toFixed(2);
      if (entry.field.value === value) return;
      entry.field.value = value;
      entry.field.dispatchEvent(new Event('input', {bubbles:true}));
    });
  }
  function baseEvents() {
    const {claimNo, caseNo} = claim();
    return [
      {id:'edit-example', kind:'edit', title:'แก้ไขข้อมูลเคลม', stamp:'2026-08-19T10:24:00+07:00', actor, status:'แก้ไขแล้ว', summary:'ปรับข้อมูลการรักษาหลังตรวจสอบเอกสาร', before:{'สถานพยาบาล':'โรงพยาบาลกรุงเทพ','วันที่เข้ารักษา':'16/05/2569','การวินิจฉัย1(Diagnosis1)':'ไข้หวัด'}, after:{'สถานพยาบาล':'โรงพยาบาลกรุงเทพ','วันที่เข้ารักษา':'17/05/2569','การวินิจฉัย1(Diagnosis1)':'ไข้หวัดใหญ่'}, reason:'ตรวจสอบใบรับรองแพทย์ฉบับแก้ไขแล้วพบวันที่เข้ารักษาและผลวินิจฉัยที่ถูกต้อง'},
      {id:'decision-example', kind:'decision', title:'บันทึกผลพิจารณา ครั้งที่ 1', stamp:'2026-05-18T08:32:50+07:00', actor, status:'อนุมัติ', summary:'ผลการพิจารณาที่บันทึกไว้', fields:[{label:'ผลการพิจารณา',value:'อนุมัติ'}]},
      {id:'transfer-example', kind:'transfer', title:'แจ้งผลการโอนเงิน', stamp:'2026-05-17T13:15:45+07:00', actor, status:'โอนสำเร็จ', summary:'จำนวนเงิน 550.00 บาท', fields:[{label:'เลขที่ CL',value:claimNo},{label:'สถานะการโอนเงิน',value:'โอนสำเร็จ'},{label:'จำนวนเงิน',value:'550.00 บาท'}]},
      {id:'claim-example', kind:'claim', title:'สร้างรายการเคลม', stamp:sampleDate, actor, summary:claimNo, fields:[{label:'เลขที่ CL',value:claimNo},{label:'เลขที่ Case',value:caseNo}]},
      {id:'case-example', kind:'case', title:'สร้างรายการเคส', stamp:sampleDate, actor, summary:caseNo, fields:[{label:'เลขที่ Case',value:caseNo}]}
    ].filter(item => item.id !== 'edit-example' || claimNo === 'CL6905000082');
  }
  function events() {
    const rowIndex = Number(window.currentConsiderCustomerRowIndex || 0);
    const key = reconsiderKey();
    const draftItems = (window.customerDraftHistory || []).filter(d => Number(d.rowIndex || 0) === rowIndex).map((d, i) => ({
      id:'draft-'+String(d.id || i), kind:'draft', title:'บันทึกแบบร่าง', stamp:d.savedAt || (d.date && d.time ? (() => { const m=String(d.date).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${Number(m[3])-543}-${m[2]}-${m[1]}T${String(d.time).match(/\d{2}:\d{2}/)?.[0] || '00:00'}:00+07:00` : ''; })() : ''), actor:d.user || actor,
      status:'แบบร่าง', summary:`Step ${d.step || 1} · ${d.stepLabel || 'บันทึกข้อมูลเคลม'}`, note:d.note || '', fields:d.detailFields || [{label:'เลขที่ CL',value:claim().claimNo},{label:'ขั้นตอนที่บันทึก',value:`Step ${d.step || 1} · ${d.stepLabel || 'บันทึกข้อมูลเคลม'}`},{label:'รายละเอียด',value:d.note || '—'}], legacy:!d.detailFields
    }));
    return baseEvents().concat(decisions.filter(d => d.claimKey ? d.claimKey === key : d.rowIndex === rowIndex), edits.filter(d => d.claimKey === key), draftItems)
      .sort((a,b) => Date.parse(b.stamp || 0)-Date.parse(a.stamp || 0) || String(b.id).localeCompare(String(a.id)));
  }
  function fieldList(fields) {
    if (!fields?.length) return '<p class="cct-empty">รายการเดิมนี้ไม่มีภาพข้อมูล ณ เวลาที่บันทึก</p>';
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
      const row = label => `<div class="cct-diff-line"><span class="cct-diff-name">${esc(label)}</span><span class="cct-diff-before">${esc(event.before[label])}</span><span class="cct-diff-after">${esc(event.after[label])}</span></div>`;
      return `<section class="cct-section"><div class="cct-section-head"><h3>ข้อมูลที่แก้ไข</h3><span class="cct-change-count">${changed.length} รายการ</span></div>${changed.length ? `<div class="cct-diff-table"><div class="cct-diff-columns"><span>ข้อมูล</span><span>ก่อนแก้ไข</span><span>หลังแก้ไข</span></div>${changed.map(row).join('')}</div>` : '<p class="cct-empty">ไม่มีข้อมูลที่เปลี่ยนแปลง</p>'}</section><section class="cct-reason"><strong>เหตุผลการแก้ไข</strong><p>${esc(event.reason)}</p></section>`;
    }
    const note = event.kind === 'draft' ? `<p class="cct-hint">${event.legacy ? 'รายการตัวอย่างเดิมมีเพียงข้อมูลสรุป ไม่มีภาพค่าฟอร์ม ณ เวลาบันทึก' : 'แสดงค่าที่เก็บไว้ขณะกด บันทึกแบบร่าง ในหน้าบันทึกข้อมูลเคลม'}</p>` : '';
    const action = event.kind === 'decision' ? '<div class="cct-choice"><button type="button" class="cct-reconsider" data-cct-reconsider>พิจารณาใหม่อีกครั้ง</button>'+(nonDeathCoverage() ? '<button type="button" class="cct-edit-start" data-cct-edit-start>แก้ไขข้อมูลเคลม</button>' : '')+'</div>' : '';
    if (event.kind === 'decision') {
      const decision = event.fields?.find(field => field.label === 'ผลการพิจารณา')?.value || event.status || '—';
      const tone = /ปฏิเสธ|ไม่อนุมัติ/.test(decision) ? 'rejected' : /อนุมัติ/.test(decision) ? 'approved' : 'pending';
      const remaining = event.fields?.filter(field => field.label !== 'ผลการพิจารณา') || [];
      return `<section class="cct-decision-hero ${tone}"><span class="material-icons-round" aria-hidden="true">${tone === 'approved' ? 'task_alt' : tone === 'rejected' ? 'cancel' : 'fact_check'}</span><div><small>ผลการพิจารณา</small><strong>${esc(decision)}</strong><p>${esc(event.summary)}</p></div></section>${remaining.length ? `<section class="cct-section"><div class="cct-section-head"><div><span class="cct-section-eyebrow">ข้อมูลที่เปลี่ยนแปลง</span><h3>รายละเอียดผลพิจารณา</h3></div><span class="cct-change-count">${remaining.length} รายการ</span></div>${fieldList(remaining)}</section>` : ''}${action}`;
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
    layer.innerHTML = `<div class="cct-dialog cct-dialog-${esc(event.kind)}" role="dialog" aria-modal="true" aria-labelledby="cctDialogTitle"><header class="cct-dialog-head"><div class="cct-dialog-title-row"><div><span class="cct-kicker">ประวัติการทำรายการ</span><h2 id="cctDialogTitle">${esc(event.title)}</h2></div></div><button type="button" class="cct-close" data-cct-close aria-label="ปิดรายละเอียด"><span class="material-icons-round">close</span></button><dl class="cct-dialog-meta"><div class="cct-meta-item"><dt>วันเวลาทำรายการ</dt><dd>${esc(timeLabel(event.stamp))}</dd></div><div class="cct-meta-item"><dt>ผู้ทำรายการ</dt><dd>${esc(event.actor)}</dd></div><div class="cct-meta-item"><dt>เลข CL</dt><dd>${esc(claimNo)}</dd></div><div class="cct-meta-item"><dt>เลข Case</dt><dd>${esc(caseNo)}</dd></div></dl></header><div class="cct-dialog-body">${detail(event)}</div></div>`;
    document.body.appendChild(layer);
    layer.querySelector('[data-cct-close]').focus();
    document.addEventListener('keydown', onKey);
    layer.addEventListener('click', e => {
      if (e.target === layer || e.target.closest('[data-cct-close]')) close();
      else if (e.target.closest('[data-cct-reconsider]')) {
        close();
        leaveEditMode();
        document.querySelectorAll('#considerCustomerDetailPage [data-cct-decision-saved]').forEach(button => {
          button.disabled = false;
          button.removeAttribute('aria-disabled');
          delete button.dataset.cctDecisionSaved;
        });
        document.querySelectorAll('#considerCustomerDetailPage [data-cct-decision-message]').forEach(message => message.remove());
        window.customerDecisionState = { ...(window.customerDecisionState || {}), type: '' };
        window.syncCustomerDecisionUI?.();
        window.setCustomerMainTab?.('claim');
        window.setCustomerStep?.(1);
        captureReconsiderBaseline();
        showReconsiderBanner(event.fields?.find(field => field.label === 'ผลการพิจารณา')?.value || event.status);
        syncSavedDecisionActions();
        document.querySelector('#considerCustomerDetailPage .customer-review-tabs')?.scrollIntoView({block:'start'});
      }
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
    if (field.matches('[data-cct-document-input]') || isCustomerScanButton(field)) return documentRows().some(row => row.contains(field));
    if (field.matches('[data-claim-choice]')) {
      if (field.dataset.claimChoice === 'coverage') return ['ค่ารักษา','ค่าชดเชย'].includes(field.dataset.claimValue);
      return ['cause','treatment'].includes(field.dataset.claimChoice);
    }
    if (field.closest('[data-physical-therapy="customer"], [data-hospital-traffic-accident]')) return true;
    return !!field.closest('.treatment-detail-actual') && editableLabels.has(fieldLabel(field));
  }
  function insuranceFields() {
    return {checkbox:document.getElementById('ccInsuranceExcessCheckbox'), company:document.getElementById('ccInsuranceCompanySelect')};
  }
  function insuranceValue() {
    const {checkbox,company} = insuranceFields();
    return {checked:!!checkbox?.checked,company:company?.value || ''};
  }
  function ensureInsuranceField() {
    if (!editing) return;
    const pane = document.getElementById('ccStepPane2');
    if (!pane) return;
    let {checkbox,company} = insuranceFields();
    if (!checkbox) {
      const shell = pane.querySelector('.cc-ref-step2-shell');
      const section = document.createElement('section');
      section.className = 'cct-insurance-step2';
      section.innerHTML = '<label><input id="ccInsuranceExcessCheckbox" type="checkbox"><span>เป็นส่วนเกินจาก บ.ประกัน</span></label>';
      shell?.querySelector('.cc-ref-decision-wrap, .cc-ref-actionbar')?.before(section);
      checkbox = section.querySelector('input');
      company = null;
    }
    if (!checkbox) return;
    checkbox.checked = !!editing.insuranceCurrent.checked;
    if (company) {
      company.value = editing.insuranceCurrent.company || '';
      company.disabled = !checkbox.checked;
    }
  }
  function applySavedInsurance() {
    const values = savedInsurance.get(reconsiderKey());
    const {checkbox,company} = insuranceFields();
    if (!values || !checkbox) return;
    checkbox.checked = !!values.checked;
    if (company) { company.disabled = !checkbox.checked; company.value = checkbox.checked ? values.company || '' : ''; }
  }
  function documentRows() {
    const table = Array.from(document.querySelectorAll('#ccStepPane1 table')).find(item => {
      const headings = item.querySelector('thead')?.textContent || '';
      return headings.includes('ประเภทเอกสาร') && headings.includes('สแกนเอกสาร') && headings.includes('จำนวนเอกสาร');
    });
    return Array.from(table?.querySelectorAll('tbody tr') || []);
  }
  function isCustomerScanButton(field) {
    return field?.tagName === 'BUTTON' && field.textContent.replace(/\s+/g, ' ').trim() === 'สแกนเอกสาร';
  }
  function captureDocuments() {
    return new Map(documentRows().map((row, index) => [index, {
      label: row.cells[1]?.textContent?.trim() || `เอกสารรายการที่ ${index + 1}`,
      count: Number(row.cells[3]?.textContent?.trim()) || 0,
      names: []
    }]));
  }
  function applyDocumentCounts(values) {
    if (!values) return;
    documentRows().forEach((row, index) => {
      const item = values.get(index);
      if (!item) return;
      if (row.cells[3] && row.cells[3].textContent !== String(item.count)) row.cells[3].textContent = String(item.count);
      const scan = Array.from(row.querySelectorAll('button')).find(isCustomerScanButton);
      if (scan && item.names.length) scan.title = item.names.join(', ');
      else scan?.removeAttribute('title');
    });
  }
  function gateFields() {
    if (!editing) return;
    const pane = document.getElementById('ccStepPane1');
    if (!pane) return;
    applyDocumentCounts(editing.documentsCurrent);
    const step = Number(window.currentCustomerStep || 1);
    if (step === 2) ensureInsuranceField();
    const decisions = Array.from(pane.querySelectorAll('#customerDecisionSection, .customer-decision-section, .cc-ref-decision-wrap'));
    decisions.forEach(section => { section.dataset.cctReplacedDecision = 'true'; });
    const activePane = document.getElementById(step === 2 ? 'ccStepPane2' : 'ccStepPane1');
    const target = step === 2
      ? activePane?.querySelector('.cc-ref-decision-wrap, .cc-ref-actionbar')
      : decisions.find(section => !section.parentElement?.closest('#customerDecisionSection, .customer-decision-section, .cc-ref-decision-wrap')) || pane.querySelector('.customer-step1-footer, .cc-ref-actionbar');
    if (editing.toolbar && target && editing.toolbar.nextElementSibling !== target) target.before(editing.toolbar);
    editing.toolbar?.querySelector('[data-cct-next]')?.toggleAttribute('hidden',step !== 1);
    editing.toolbar?.querySelector('[data-cct-back]')?.toggleAttribute('hidden',step !== 2);
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
    document.querySelectorAll('#ccStepPane2 input, #ccStepPane2 select, #ccStepPane2 textarea, #ccStepPane2 button').forEach(field => {
      if (field.closest('[data-cct-edit-toolbar]')) return;
      if (!originalDisabled.has(field)) originalDisabled.set(field,field.disabled);
      const editable = field.id === 'ccInsuranceExcessCheckbox' || (field.id === 'ccInsuranceCompanySelect' && !!insuranceFields().checkbox?.checked);
      field.disabled = !editable;
      field.setAttribute('aria-disabled',String(field.disabled));
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
    const choices = window.customerClaimSelectionState || {};
    [['cause','เหตุของการเคลม'],['coverage','ประเภทความคุ้มครอง'],['treatment','ประเภทการรักษา']].forEach(([key,label]) => map.set('choice-'+key,{label,value:choices[key] || '—'}));
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
    const key = reconsiderKey();
    const values = savedValues.get(key);
    if (Number(window.currentConsiderCustomerRowIndex || 0) !== rowIndex) return;
    applySavedInsurance();
    applyDocumentCounts(savedDocuments.get(key));
    if (!values) return;
    const choices = savedChoices.get(key);
    if (choices) Object.entries(choices).forEach(([group, value]) => {
      if ((window.customerClaimSelectionState || {})[group] === value) return;
      const button = Array.from(document.querySelectorAll('#ccStepPane1 [data-claim-choice]')).find(item => item.dataset.claimChoice === group && item.dataset.claimValue === value);
      if (button) {
        const wasDisabled = button.disabled;
        button.disabled = false;
        window.toggleCustomerClaimChoice?.(button);
        if (button.isConnected) button.disabled = wasDisabled;
      }
    });
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
    document.querySelectorAll('#ccStepPane1 [data-cct-document-input]').forEach(input => input.remove());
    editing?.toolbar?.remove();
    document.querySelector('#ccStepPane2 .cct-insurance-step2')?.remove();
    document.querySelectorAll('#ccStepPane1 [data-cct-replaced-decision]').forEach(section => { delete section.dataset.cctReplacedDecision; });
    document.getElementById('considerCustomerDetailPage')?.classList.remove('cct-editing');
    originalDisabled.forEach((disabled, field) => { if (field.isConnected) { field.disabled = disabled; field.setAttribute('aria-disabled', disabled ? 'true' : 'false'); } });
    originalDisabled.clear();
    editing = null;
    applySavedInsurance();
  }
  function cancelEditMode() {
    if (editing?.documentsBefore) applyDocumentCounts(editing.documentsBefore);
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
    if (!nonDeathCoverage()) return;
    activeDraft = null;
    leaveEditMode();
    reconsiderBaseline = null;
    clearReconsiderGate();
    window.setCustomerMainTab?.('claim');
    window.setCustomerStep?.(1);
    const pane = document.getElementById('ccStepPane1');
    if (!pane) return;
    pane.closest('#considerCustomerDetailPage')?.classList.add('cct-editing');
    editing = {rowIndex:Number(window.currentConsiderCustomerRowIndex || 0), claimKey:reconsiderKey(), before:null, controls:null, toolbar:null, insuranceBefore:savedInsurance.get(reconsiderKey()) || insuranceValue(), insuranceCurrent:null, documentsBefore:savedDocuments.get(reconsiderKey()) || captureDocuments(), documentsCurrent:null};
    editing.insuranceCurrent = {...editing.insuranceBefore};
    editing.documentsCurrent = new Map(Array.from(editing.documentsBefore, ([index, item]) => [index, {...item, names:item.names.slice()}]));
    const toolbar = document.createElement('section');
    toolbar.className = 'cct-edit-toolbar';
    toolbar.dataset.cctEditToolbar = 'true';
    toolbar.innerHTML = '<div class="cct-edit-heading"><span class="material-icons-round" aria-hidden="true">edit_note</span><div><strong>แก้ไขข้อมูลเคลม</strong><p>แก้ไขได้เฉพาะฟิลด์ที่กำหนดใน บันทึกข้อมูลเคลม</p></div></div><label for="cctEditReason">เหตุผลการแก้ไข <span aria-hidden="true">*</span></label><textarea id="cctEditReason" rows="3" aria-describedby="cctEditError"></textarea><p id="cctEditError" role="alert" hidden></p><div class="cct-edit-actions"><button type="button" data-cct-cancel>ยกเลิกการแก้ไข</button><button type="button" data-cct-back hidden>กลับ</button><button type="button" data-cct-next>ถัดไป</button><button type="button" data-cct-save>บันทึกการแก้ไข</button></div>';
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
    const selection = window.customerClaimSelectionState || {};
    if (!selection.cause || !['ค่ารักษา','ค่าชดเชย'].includes(selection.coverage) || !selection.treatment) { error.textContent='กรุณาเลือกเหตุของการเคลม ประเภทความคุ้มครอง และประเภทการรักษา'; error.hidden=false; return; }
    const after = captureEditable();
    const insurance = editing.insuranceCurrent;
    const beforeInsurance = editing.insuranceBefore;
    const excessChanged = !!beforeInsurance.checked !== !!insurance.checked;
    const companyChanged = (beforeInsurance.company || '') !== (insurance.company || '');
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
    if (excessChanged) {
      beforeValues['เป็นส่วนเกินจาก บ.ประกัน'] = beforeInsurance.checked ? 'ใช่' : 'ไม่ใช่';
      afterValues['เป็นส่วนเกินจาก บ.ประกัน'] = insurance.checked ? 'ใช่' : 'ไม่ใช่';
      changed++;
    }
    if (companyChanged) {
      beforeValues['บริษัทประกัน'] = beforeInsurance.company || '—';
      afterValues['บริษัทประกัน'] = insurance.company || '—';
      changed++;
    }
    editing.documentsCurrent.forEach((item, index) => {
      const before = editing.documentsBefore.get(index);
      if (!before || before.count === item.count) return;
      const label = 'สแกนเอกสาร · ' + item.label;
      beforeValues[label] = before.count + ' เอกสาร';
      afterValues[label] = item.count + ' เอกสาร' + (item.names.length ? ' (' + item.names.join(', ') + ')' : '');
      changed++;
    });
    if (!changed) { error.textContent='ยังไม่มีข้อมูลที่เปลี่ยน กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์'; error.hidden=false; return; }
    edits.push({id:'edit-'+Date.now(),kind:'edit',title:'แก้ไขข้อมูลเคลม',stamp:new Date().toISOString(),actor,status:'แก้ไขแล้ว',summary:`เปลี่ยน ${changed} ฟิลด์`,before:beforeValues,after:afterValues,reason,rowIndex:editing.rowIndex,claimKey:editing.claimKey});
    savedValues.set(editing.claimKey, after);
    savedChoices.set(editing.claimKey,{...(window.customerClaimSelectionState || {})});
    savedInsurance.set(editing.claimKey,{...insurance});
    savedDocuments.set(editing.claimKey,new Map(Array.from(editing.documentsCurrent, ([index, item]) => [index, {...item, names:item.names.slice()}])));
    leaveEditMode();
    window.refreshCustomerTransactionPane?.();
    window.setCustomerMainTab?.('transactions');
  }
  window.renderCustomerClaimTransactionPrototype = function () {
    const items = events();
    return `<section id="customerTabTransactions" class="customer-tab-pane cct-pane"><div class="customer-panel-modern"><div class="customer-panel-modern-title"><span class="material-icons-round">manage_history</span>ประวัติการทำรายการ<span class="cct-count">${items.length} รายการ</span></div><div class="customer-panel-modern-body"><p class="cct-context">เรียงจากรายการล่าสุด</p><ol class="cct-list">${items.map(item => `<li class="cct-item"><span class="cct-mark ${item.kind} ${item.status ? `tone-${statusTone(item.status)}` : ''}" aria-hidden="true"><span class="material-icons-round">${({draft:'save_as',decision:'fact_check',transfer:'payments',edit:'edit_note',claim:'description',case:'folder_open'})[item.kind]}</span></span><article class="cct-card"><div class="cct-card-top"><div class="cct-main"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>${item.status ? `<span class="cct-status cct-status--${statusTone(item.status)}">${esc(item.status)}</span>` : ''}</div><div class="cct-card-bottom"><div class="cct-card-meta"><span class="cct-date">${esc(timeLabel(item.stamp))}</span><span class="cct-actor">${esc(item.actor)}</span></div><button type="button" class="cct-detail-button" data-cct-id="${esc(item.id)}" aria-label="ดูรายละเอียด ${esc(item.title)}">ดูรายละเอียด<span class="material-icons-round" aria-hidden="true">arrow_forward</span></button></div></article></li>`).join('')}</ol></div></div></section>`;
  };
  function decisionMessage(save, message, type = 'error') {
    const pane = save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3');
    let status = pane?.querySelector('[data-cct-decision-message]');
    if (!status) {
      status = document.createElement('p');
      status.dataset.cctDecisionMessage = 'true';
      save.closest('.customer-step1-footer, .cc-ref-actionbar, .flex.flex-col.gap-3.pt-2')?.before(status);
    }
    if (status) {
      status.setAttribute('role', type === 'success' ? 'status' : 'alert');
      status.className = 'mt-2 text-sm font-semibold '+(type === 'success' ? 'text-green-700' : 'text-red-600');
      status.textContent = message;
    }
  }
  function showDecisionSuccess() {
    document.getElementById('cctDecisionSuccess')?.remove();
    clearTimeout(successTimer);
    const toast = document.createElement('div');
    toast.id = 'cctDecisionSuccess';
    toast.className = 'cct-success-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="material-icons-round" aria-hidden="true">check_circle</span><span>บันทึกผลพิจารณาสำเร็จ</span>';
    document.body.appendChild(toast);
    successTimer = setTimeout(() => toast.remove(), 3500);
  }
  function confirmReconsiderDecision(save, decisionLabel, onConfirm) {
    if (document.getElementById('cctDecisionConfirm')) return;
    const layer = document.createElement('div');
    layer.id = 'cctDecisionConfirm';
    layer.className = 'cct-overlay';
    const amounts = changedAmounts();
    const money = value => Number(value).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
    const warning = amounts.length ? '<section class="cct-amount-warning" role="alert" aria-labelledby="cctAmountWarningTitle"><div class="cct-warning-head"><span class="material-icons-round" aria-hidden="true">warning_amber</span><div><strong id="cctAmountWarningTitle">โปรดตรวจสอบยอดเงิน เนื่องจากไม่ตรงกับการพิจารณาครั้งก่อน</strong><span>ยอดที่เปลี่ยน '+amounts.length+' รายการ · สามารถยืนยันบันทึกต่อได้</span></div></div><div class="cct-amount-list">'+amounts.map(item => '<div class="cct-amount-item"><span class="cct-amount-name">'+esc(item.label)+'</span><div class="cct-amount-values"><span><small>ยอดเดิม</small><strong>'+money(item.before)+' <em>บาท</em></strong></span><span class="material-icons-round cct-amount-arrow" aria-hidden="true">arrow_forward</span><span><small>ยอดใหม่</small><strong>'+money(item.after)+' <em>บาท</em></strong></span></div></div>').join('')+'</div></section>' : '';
    layer.innerHTML = '<div class="cct-dialog cct-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cctConfirmTitle" aria-describedby="cctConfirmDescription"><header class="cct-dialog-head"><span class="cct-confirm-symbol material-icons-round" aria-hidden="true">fact_check</span><div class="cct-confirm-heading"><span class="cct-confirm-eyebrow">ผลพิจารณาครั้งใหม่</span><h2 id="cctConfirmTitle">ยืนยันบันทึกผลพิจารณา</h2></div><button type="button" class="cct-close" data-cct-confirm-cancel aria-label="ปิดหน้าต่างยืนยัน"><span class="material-icons-round" aria-hidden="true">close</span></button></header><div class="cct-dialog-body"><p id="cctConfirmDescription">ตรวจสอบข้อมูลก่อนบันทึกผลพิจารณาครั้งใหม่</p><div class="cct-confirm-result"><span>ผลการพิจารณา</span><strong>'+esc(decisionLabel)+'</strong></div>'+warning+'<div class="cct-confirm-actions"><button type="button" data-cct-confirm-cancel>'+(amounts.length ? 'กลับไปแก้ไข' : 'ยกเลิก')+'</button><button type="button" data-cct-confirm-save>'+(amounts.length ? 'ยืนยันบันทึกต่อ' : 'ยืนยัน')+'</button></div></div></div>';
    const closeConfirm = (restoreFocus = true) => {
      document.removeEventListener('keydown', onConfirmKey);
      layer.remove();
      if (restoreFocus) save.focus();
    };
    const onConfirmKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeConfirm(); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(layer.querySelectorAll('button'));
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
    };
    layer.addEventListener('click', event => {
      if (event.target === layer || event.target.closest('[data-cct-confirm-cancel]')) { closeConfirm(); return; }
      if (!event.target.closest('[data-cct-confirm-save]')) return;
      closeConfirm(false);
      onConfirm();
      const pane = save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3');
      if (pane) { pane.setAttribute('tabindex', '-1'); pane.focus({preventScroll:true}); }
    });
    document.body.appendChild(layer);
    document.addEventListener('keydown', onConfirmKey);
    layer.querySelector('[data-cct-confirm-save]').focus();
  }
  function commitDecision(save, result, transientSuccess) {
    const pane=save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3');
    const labels={waitdocs:'รอเอกสาร',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก',approve:'อนุมัติ'};
    const rowIndex=Number(window.currentConsiderCustomerRowIndex || 0);
    const count=decisions.filter(item => item.claimKey ? item.claimKey === reconsiderKey() : item.rowIndex === rowIndex).length + 2;
    const baseline = reconsiderBaseline?.claimKey === reconsiderKey() ? reconsiderBaseline.panes.get(pane.id) : null;
    const changed = decisionFields(pane).filter(field => (pane.id === 'ccStepPane1' || field.decision) && (baseline ? baseline.get(field.key) !== field.value : field.decision));
    const amountChanges = reconsiderBaseline ? changedAmounts() : [];
    if (reconsiderBaseline) reconsiderValues.set(reconsiderKey(), new Map(reconsiderBaseline.currentAmounts));
    decisions.push({id:'decision-'+Date.now()+'-'+count, kind:'decision', rowIndex, claimKey:reconsiderKey(), title:'บันทึกผลพิจารณา ครั้งที่ '+count, stamp:new Date().toISOString(), actor, status:labels[result], summary:'ผลการพิจารณาที่บันทึกไว้', fields:[{label:'ผลการพิจารณา',value:labels[result]},...changed.map(({label,value}) => ({label,value})),...amountChanges.map(item => ({label:item.label,value:item.after.toFixed(2)+' บาท'}))]});
    reconsiderBaseline = null;
    clearReconsiderGate();
    window.refreshCustomerTransactionPane?.();
    save.dataset.cctDecisionSaved = 'true';
    save.disabled = true;
    save.setAttribute('aria-disabled', 'true');
    window.closeCustomerApproveConfirmModal?.();
    syncSavedDecisionActions();
    if (transientSuccess) {
      pane.querySelector('[data-cct-decision-message]')?.remove();
      showDecisionSuccess();
    } else decisionMessage(save, 'บันทึกผลพิจารณาสำเร็จ', 'success');
  }
  window.addEventListener('click', event => {
    const action = event.target.closest?.('#considerCustomerDetailPage #ccStepPane1 button, #considerCustomerDetailPage #ccStepPane2 button, #considerCustomerDetailPage #ccStepPane3 button');
    if (!action || !isDecisionAction(action) || !decisionAlreadySaved() || reconsideringCurrentClaim()) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    syncSavedDecisionActions();
  }, true);
  window.addEventListener('click', event => {
    if (!reconsiderBaseline || reconsiderBaseline.claimKey !== reconsiderKey()) return;
    const approve = event.target.closest?.('#considerCustomerDetailPage #ccStepPane3 button');
    if (!approve || approve.disabled || !/อนุมัติ/.test(approve.textContent.replace(/\s+/g, ' ').trim())) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    confirmReconsiderDecision(approve, 'อนุมัติ', () => commitDecision(approve, 'approve', true));
  }, true);
  document.addEventListener('click', e => {
    const scan = e.target.closest?.('#ccStepPane1 table button');
    if (scan && editing && isCustomerScanButton(scan)) {
      const row = scan.closest('tr');
      if (!row || documentRows().indexOf(row) < 0) return;
      e.preventDefault();
      let input = row.querySelector('[data-cct-document-input]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.hidden = true;
        input.dataset.cctDocumentInput = 'true';
        scan.after(input);
      }
      input.click();
      return;
    }
    if (e.target.closest?.('[data-cct-cancel]')) { const rowIndex=editing?.rowIndex; cancelEditMode(); if (rowIndex !== undefined) window.openConsiderCustomerRow?.(rowIndex); return; }
    if (e.target.closest?.('[data-cct-next]')) { window.setCustomerStep?.(2); return; }
    if (e.target.closest?.('[data-cct-back]')) { window.setCustomerStep?.(1); return; }
    if (e.target.closest?.('[data-cct-save]')) { saveEdit(); return; }
    const button=e.target.closest?.('[data-cct-id]');
    if (button) { open(button.dataset.cctId, button); return; }
    const save=e.target.closest?.('#considerCustomerDetailPage button');
    if (!save || save.disabled || !save.textContent.replace(/\s+/g,' ').includes('ยืนยันบันทึกผลพิจารณา')) return;
    if (!save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3')) return;
    const result=String(window.customerDecisionState?.type || '').trim();
    const labels={waitdocs:'รอเอกสาร',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก',approve:'อนุมัติ'};
    if (!labels[result]) {
      decisionMessage(save, 'กรุณาเลือกผลการพิจารณาก่อนบันทึก');
      save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3')?.querySelector('.dd-decision-btn[data-decision]')?.focus();
      return;
    }
    const reasonIds={waitdocs:'ccWaitDocReason',edit:'ccEditReason',reject:'ccRejectReason',cancel:'ccCancelReason'};
    const reasonLabels={waitdocs:'สาเหตุรอเอกสาร',edit:'สาเหตุรอแก้ไข',reject:'สาเหตุการปฏิเสธ',cancel:'สาเหตุการยกเลิก'};
    const pane=save.closest('#ccStepPane1, #ccStepPane2, #ccStepPane3');
    const reason=pane.querySelector('#'+reasonIds[result]);
    if (reason && !reason.value.trim()) {
      decisionMessage(save, 'กรุณาระบุ'+reasonLabels[result]+'ก่อนบันทึก');
      reason.focus();
      return;
    }
    const isReconsidering = reconsiderBaseline?.claimKey === reconsiderKey();
    if (isReconsidering) {
      pane.querySelector('[data-cct-decision-message]')?.remove();
      confirmReconsiderDecision(save, labels[result], () => commitDecision(save, result, true));
    } else commitDecision(save, result, false);
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
    if (reconsiderBaseline && event.target.closest?.('#ccStepPane2')) {
      const key = event.target.dataset?.cctAmountKey;
      if (key && reconsiderBaseline.amounts.has(key)) reconsiderBaseline.currentAmounts.set(key, Number(String(event.target.value || 0).replace(/,/g, '')) || 0);
    }
    if (activeDraft && !restoringDraft && event.target.closest?.('#customerTabClaim')) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
  }, true);
  document.addEventListener('change', event => {
    if (editing && event.target.matches?.('#ccStepPane1 [data-cct-document-input]')) {
      const row = event.target.closest('tr');
      const index = documentRows().indexOf(row);
      const files = Array.from(event.target.files || []);
      const current = editing.documentsCurrent.get(index);
      if (index >= 0 && current && files.length) {
        editing.documentsCurrent.set(index, {...current, count:current.count + files.length, names:current.names.concat(files.map(file => file.name))});
        applyDocumentCounts(editing.documentsCurrent);
        event.target.value = '';
      }
      return;
    }
    if (editing && event.target.closest?.('#ccStepPane2') && ['ccInsuranceExcessCheckbox','ccInsuranceCompanySelect'].includes(event.target.id)) {
      const {checkbox,company} = insuranceFields();
      editing.insuranceCurrent = {checked:!!checkbox?.checked,company:checkbox?.checked ? (company?.value || '') : ''};
      gateFields();
    }
    if (activeDraft && !restoringDraft && event.target.closest?.('#customerTabClaim')) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
  }, true);
  const originalStep = window.setCustomerStep;
  if (typeof originalStep === 'function') window.setCustomerStep = function () {
    if (activeDraft && !restoringDraft) activeDraft.snapshot = mergeDraftFields(activeDraft.snapshot, captureDraftFields());
    if (editing && Number(arguments[0]) === 2 && Number(window.currentCustomerStep || 1) === 1) window.currentCustomerStep = 2;
    if (reconsiderBaseline && Number(arguments[0]) > Number(window.currentCustomerStep || 1)) window.currentCustomerStep = Number(arguments[0]);
    const result = originalStep.apply(this, arguments);
    if (editing) gateFields();
    else if (Number(arguments[0]) === 2) applySavedInsurance();
    if (reconsiderBaseline) { restoreReconsiderAmounts(); applyReconsiderGate(); }
    if (activeDraft) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); requestAnimationFrame(() => { if (activeDraft) { restoreDraftFields(activeDraft.snapshot); unlockDraftFields(); } }); }
    syncSavedDecisionActions();
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
  new MutationObserver(mutations => {
    if (!reconsiderBaseline || reconsiderGateQueued) return;
    if (!mutations.some(m => Array.from(m.addedNodes).some(node => node.nodeType === 1 && (node.closest?.('#ccStepPane1, #ccStepPane2') || node.querySelector?.('#ccStepPane1, #ccStepPane2'))))) return;
    reconsiderGateQueued = true;
    requestAnimationFrame(() => { reconsiderGateQueued = false; if (reconsiderBaseline) applyReconsiderGate(); });
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
    reconsiderBaseline = null;
    clearReconsiderGate();
    if (!openingDraft) { activeDraft = null; document.getElementById('considerCustomerDetailPage')?.classList.remove('cct-draft-editing'); }
    cancelEditMode();
    const result = originalOpen.apply(this, arguments);
    const index = Number(rowIndex || 0);
    if (!openingDraft) { setTimeout(() => applySavedValues(index), 0); setTimeout(() => applySavedValues(index), 120); }
    syncSavedDecisionActions();
    requestAnimationFrame(syncSavedDecisionActions);
    return result;
  };
  const originalApproveModal = window.openCustomerApproveConfirmModal;
  if (typeof originalApproveModal === 'function') window.openCustomerApproveConfirmModal = function () {
    if (decisionAlreadySaved() && !reconsideringCurrentClaim()) { syncSavedDecisionActions(); return; }
    return originalApproveModal.apply(this, arguments);
  };
  const originalConfirmApprove = window.confirmCustomerApprove;
  if (typeof originalConfirmApprove === 'function') window.confirmCustomerApprove = function () {
    if (decisionAlreadySaved() && !reconsideringCurrentClaim()) { window.closeCustomerApproveConfirmModal?.(); syncSavedDecisionActions(); return; }
    return originalConfirmApprove.apply(this, arguments);
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
