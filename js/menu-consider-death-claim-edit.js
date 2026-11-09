/* พิจารณาเคลม > Death & Disability > แก้ไขข้อมูลเคลม (ข้อมูลเดโมใน session) */
(function () {
  'use strict';
  const records = new Map();
  const saved = new Map();
  const documentStore = new Map();
  const financialStore = new Map();
  const organStore = new Map();
  let activeDraft = null;
  const common = [
    ['cause','เหตุของการเคลม','cause'], ['coverage','ประเภทความคุ้มครอง','coverage'],
    ['deathReason','สาเหตุการเสียชีวิต','death-reason'], ['disabilityReason','สาเหตุการทุพพลภาพ/สูญเสียอวัยวะ','disability-reason'],
    ['recipient','ผู้รับเอกสาร','service'], ['provider','ผู้ให้บริการ','service'], ['owner','เจ้าของรถ','service'],
    ['incident','วันที่เกิดเหตุ','date'], ['death','วันที่เสียชีวิต','date'], ['reported','วันที่รับแจ้ง','date'], ['complete','วันที่เอกสารครบ','date'],
    ['deathPlace','สถานที่เสียชีวิต','death-place'], ['deathOtherPlace','ระบุสถานที่เสียชีวิต','text'],
    ['hospital','สถานพยาบาล','hospital'], ['symptom','อาการสำคัญ','text'],
    ['diagnosis1','การวินิจฉัย 1','diagnosis'], ['diagnosis2','การวินิจฉัย 2','diagnosis'], ['diagnosis3','การวินิจฉัย 3','diagnosis'],
    ['injury','รายละเอียดการเจ็บป่วย/การบาดเจ็บ','textarea']
  ];
  const requiredFields = new Set(['deathReason','disabilityReason','recipient','provider','owner','incident','death','reported','complete','symptom','diagnosis1']);
  const fullRowFields = new Set(['symptom','diagnosis1','diagnosis2','diagnosis3','injury']);
  const displayLabels = {diagnosis1:'การวินิจฉัย 1',diagnosis2:'การวินิจฉัย 2 (diagnosis 2)',diagnosis3:'การวินิจฉัย 3 (diagnosis 3)'};
  const aliases = {reported:['วันที่รับแจ้ง','วันที่รับเอกสาร'],hospital:['สถานพยาบาล','โรงพยาบาล'],deathOtherPlace:['ระบุสถานที่เสียชีวิต','โปรดระบุ'],diagnosis1:['การวินิจฉัย 1','คำวินิจฉัย 1'],diagnosis2:['การวินิจฉัย 2','คำวินิจฉัย 2'],diagnosis3:['การวินิจฉัย 3','คำวินิจฉัย 3']};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const page = () => document.getElementById('considerDeathDetailPage');
  const rowFor = code => (window.considerationDeathRows || []).find(row => row.claimCode === code);
  const claimCode = () => page()?.querySelector('#ddClaimCodeValue')?.textContent.trim() || '';
  const key = () => claimCode()+'|'+(page()?.querySelector('#ddCaseCodeValue')?.textContent.trim() || '');
  const coverage = () => page()?.querySelector('#ddCoverageTypeValue')?.textContent.trim() || '';
  const fields = () => common;
  const organChoices = [
    ['hand','มือ','pan_tool','แขน/มือ ตั้งแต่ข้อมือขึ้นไป'],['foot','เท้า','footprint','ขา/เท้า ตั้งแต่ข้อเท้าขึ้นไป'],
    ['eye','ตา','visibility','การสูญเสียการมองเห็น'],['ear','หู','hearing','การสูญเสียการได้ยินหรือใบหู'],
    ['finger','นิ้วมือ','back_hand','ระบุนิ้วและจำนวนข้อ'],['toe','นิ้วเท้า','footprint','ระบุนิ้วและจำนวนข้อ'],
    ['hand_foot','มือ + เท้า','pan_tool','มือหนึ่งข้างและเท้าหนึ่งข้าง'],['hand_eye','มือ + ตา','pan_tool','มือหนึ่งข้างและสายตาหนึ่งข้าง'],
    ['foot_eye','เท้า + ตา','footprint','เท้าหนึ่งข้างและสายตาหนึ่งข้าง'],['permanent_disability','ทุพพลภาพถาวร','accessible','ทุพพลภาพถาวรโดยสิ้นเชิง'],
    ['partial_disability','ทุพพลภาพบางส่วน','directions_walk','สูญเสียสมรรถภาพบางส่วน'],['exgratia','Exgratia','payments','พิจารณาจ่ายตามดุลยพินิจ']
  ];
  const organFingerNames = {finger:['นิ้วหัวแม่มือ','นิ้วชี้','นิ้วกลาง','นิ้วนาง','นิ้วก้อย'],toe:['นิ้วหัวแม่เท้า','นิ้วชี้','นิ้วกลาง','นิ้วนาง','นิ้วก้อย']};
  const organParts = {hand_foot:['มือ','เท้า'],hand_eye:['มือ','ตา'],foot_eye:['เท้า','ตา']};
  const organIcon = icon => `<span class="${icon === 'footprint' ? 'material-symbols-outlined' : 'material-icons-round'}" aria-hidden="true">${icon}</span>`;
  const organChoiceIcons = (id,icon) => (id === 'hand_foot' ? ['pan_tool','footprint'] : id === 'hand_eye' ? ['pan_tool','visibility'] : id === 'foot_eye' ? ['footprint','visibility'] : [icon]).map((name,index) => `${index ? '<b aria-hidden="true">+</b>' : ''}<span class="ddce-organ-choice-icon">${organIcon(name)}</span>`).join('');
  function organRuleHtml(key, side) {
    if (typeof DISABILITY_BENEFIT_RULES === 'undefined') return '';
    if (['hand','foot','eye','ear'].includes(key) && !side) return '';
    const label = organChoices.find(([id]) => id === key)?.[1];
    const quantity = ['hand','foot','eye','ear'].includes(key) ? (side === 'ทั้งสองข้าง' ? '2 ข้าง' : '1 ข้าง') : 'ไม่ต้องระบุ';
    const rule = DISABILITY_BENEFIT_RULES.find(item => item.organ === label && item.quantity === quantity && item.joints === 'ไม่ต้องระบุ');
    return rule ? `<div class="ddce-organ-rule" data-ddce-organ-rule><strong>${esc(rule.description)}</strong><span>${Number(rule.percent)}% ของจำนวนเงินเอาประกันภัย</span></div>` : '';
  }
  const organClone = items => JSON.parse(JSON.stringify(items || []));
  function readOrganItems() {
    if (organStore.has(key())) return organClone(organStore.get(key()));
    if (coverage() !== 'ทุพพลภาพ/สูญเสียอวัยวะ') return [];
    return Array.from(page()?.querySelectorAll('#ddExpenseGrid tbody tr') || []).map(tr => {
      const cells = Array.from(tr.cells || [], cell => cell.textContent.trim());
      const description = `${cells[0] || ''} ${cells[1] || ''}`;
      const inferred = /ทุพพลภาพถาวรบางส่วน|สูญเสียสมรรถภาพ/.test(description) ? 'partial_disability'
        : /นิ้วเท้า/.test(description) ? 'toe' : /นิ้วมือ|นิ้วชี้|นิ้วหัวแม่มือ|นิ้วกลาง|นิ้วนาง|นิ้วก้อย/.test(description) ? 'finger'
        : /การได้ยิน|ใบหู|หู/.test(description) ? 'ear' : /การมองเห็น|สายตา|ตา/.test(description) ? 'eye'
        : /มือ|แขน/.test(description) ? 'hand' : /เท้า|ขา/.test(description) ? 'foot'
        : /ทุพพลภาพ/.test(description) ? 'permanent_disability' : '';
      const choice = organChoices.find(([id,label]) => id === inferred || label === cells[0]);
      if (!choice) return null;
      const side = ['ซ้าย','ขวา','ทั้งสองข้าง'].find(value => (cells[1] || '').includes(value)) || '';
      const item = {key:choice[0],label:choice[1],side,amount:amount(cells[2]),uncoveredAmount:amount(cells[3]),uncoveredReason:cells[4] === '-' ? '' : cells[4] || '',note:cells[5] === '-' ? '' : cells[5] || '',legacyDetail:cells[1] || ''};
      if (organFingerNames[item.key]) {
        const finger = organFingerNames[item.key].find(name => description.includes(name)) || organFingerNames[item.key][0];
        const group = side === 'ซ้าย' ? 'left' : 'right';
        item.fingers = {[group]:{[finger]:{selected:true,joints:1,amount:item.amount}}};
      }
      return item;
    }).filter(Boolean);
  }
  function organSummary(item) {
    const fingerText = Object.entries(item.fingers || {}).flatMap(([side, fingers]) => Object.entries(fingers).filter(([,data]) => data.selected).map(([name,data]) => `${name} ${data.joints} ข้อ (${side === 'left' ? 'ซ้าย' : 'ขวา'})`));
    return [item.label,item.side || Object.entries(item.comboSides || {}).map(([part,side]) => `${part} ${side}`).join(' · '),fingerText.join(' · ') || item.legacyDetail,money(item.amount)+' บาท',amount(item.uncoveredAmount) ? `ไม่คุ้มครอง ${money(item.uncoveredAmount)} บาท` : '',item.uncoveredReason,item.note ? `หมายเหตุ: ${item.note}` : ''].filter(Boolean).join(' · ');
  }
  function renderOrganSection(form) {
    const panel = form.querySelector('[data-ddce-organ-section]');
    if (!panel || !activeDraft) return;
    const items = activeDraft.organItems;
    panel.innerHTML = `<div class="ddce-organ-head"><div><h3>เลือกอวัยวะที่สูญเสีย <span>(เลือกได้มากกว่า 1 รายการ)</span></h3><p>คลิกเลือกอวัยวะที่สูญเสีย แล้วกรอกรายละเอียดใน Modal</p></div><span class="ddce-organ-count"><span class="material-icons-round" aria-hidden="true">done_all</span>เลือกแล้ว ${items.length} รายการ</span></div><div class="ddce-organ-grid">${organChoices.map(([id,label,icon,desc]) => { const selected=items.some(item => item.key === id); return `<button type="button" class="ddce-organ-choice${selected ? ' selected' : ''}" data-ddce-organ-open="${id}" aria-pressed="${selected}"><span class="ddce-organ-choice-icons">${organChoiceIcons(id,icon)}</span><strong>${label}</strong><small>${desc}</small>${selected ? '<span class="ddce-organ-selected">เลือกแล้ว</span>' : ''}</button>`; }).join('')}</div><div class="ddce-organ-summary"><h4><span class="material-icons-round" aria-hidden="true">summarize</span>รายการอวัยวะที่เลือก</h4>${items.length ? items.map(item => { const choice=organChoices.find(([id]) => id === item.key); const summary=organSummary(item).slice(item.label.length).replace(/^ · /,''); return `<div class="ddce-organ-summary-row"><span class="ddce-organ-summary-icon">${organIcon(choice?.[2] || 'accessible')}</span><span class="ddce-organ-summary-text"><strong>${esc(item.label)}</strong><small>${esc(summary)}</small></span><span class="ddce-organ-summary-actions"><button type="button" data-ddce-organ-open="${esc(item.key)}">แก้ไข</button><button type="button" data-ddce-organ-remove="${esc(item.key)}">ลบ</button></span></div>`; }).join('') : '<p>ยังไม่ได้เลือกอวัยวะ</p>'}</div><div class="ddce-organ-total">ยอดเบิกรวม : <strong>${money(items.reduce((sum,item) => sum + amount(item.amount),0))} บาท</strong></div>`;
    if (form.querySelector('[data-ddce-field="coverage"]')?.value === 'ทุพพลภาพ/สูญเสียอวัยวะ') {
      const total = items.reduce((sum,item) => sum + amount(item.amount),0);
      activeDraft.financial.transfer = total;
      const transferInput = form.querySelector('[data-ddce-transfer]');
      if (transferInput) transferInput.value = money(total);
      const beneficiaryTotal = form.querySelector('[data-ddce-beneficiary-total]');
      if (beneficiaryTotal) beneficiaryTotal.textContent = money(total);
      if (activeDraft.financial.beneficiaries.length === 1) {
        activeDraft.financial.beneficiaries[0].amount = total;
        const beneficiaryInput = form.querySelector('[data-ddce-beneficiary-field="amount"]');
        if (beneficiaryInput) beneficiaryInput.value = money(total);
        const beneficiarySummary = form.querySelector('[data-ddce-summary="amount"]');
        if (beneficiarySummary) beneficiarySummary.textContent = money(total);
      }
    }
  }
  function renderOrganModal(form) {
    const modal = form.querySelector('[data-ddce-organ-modal]');
    const draft = activeDraft?.organModal;
    if (!modal || !draft) return;
    const choice = organChoices.find(([id]) => id === draft.key);
    const parts = organParts[draft.key] || [];
    const sideOptions = ['ซ้าย','ขวา','ทั้งสองข้าง'];
    const sideButtons = (selected, part) => `<div class="ddce-organ-side-buttons" role="group" aria-label="${part ? `${part} · ` : ''}ข้างที่สูญเสีย">${sideOptions.map(side => `<button type="button" data-ddce-organ-side="${side}"${part ? ` data-ddce-organ-side-part="${part}"` : ''} aria-pressed="${selected === side}">${side}</button>`).join('')}</div>`;
    const sides = parts.length ? `<div class="ddce-organ-combo-sides">${parts.map(part => `<div class="ddce-organ-combo-side"><strong>${part}</strong>${sideButtons(draft.comboSides?.[part] || '',part)}</div>`).join('')}</div>` : ['hand','foot','eye','ear'].includes(draft.key) ? sideButtons(draft.side || '') : '';
    const fingers = organFingerNames[draft.key] ? `<div class="ddce-organ-fingers">${['left','right'].map(side => `<fieldset><legend>ข้าง${side === 'left' ? 'ซ้าย' : 'ขวา'}</legend>${organFingerNames[draft.key].map(name => { const data = draft.fingers?.[side]?.[name] || {}; return `<div class="ddce-organ-finger"><label><input type="checkbox" data-ddce-organ-finger="${side}|${name}"${data.selected ? ' checked' : ''}>${name}</label><label>จำนวนข้อ<input type="number" min="1" max="3" value="${data.joints || 1}" data-ddce-organ-joints="${side}|${name}"></label><label>ยอดเบิก${name}<input inputmode="decimal" value="${esc(data.amount || '')}" data-ddce-organ-finger-amount="${side}|${name}"></label></div>`; }).join('')}</fieldset>`).join('')}</div>` : '';
    modal.hidden = false;
    modal.innerHTML = `<div class="ddce-organ-dialog${fingers ? ' is-finger' : ''}" role="dialog" aria-modal="true" aria-labelledby="ddceOrganModalTitle"><div class="ddce-organ-dialog-head"><span class="ddce-organ-header-icon">${organIcon(choice?.[2] || 'accessible')}</span><div><h3 id="ddceOrganModalTitle">2 ระบุรายละเอียดการสูญเสีย</h3><p>กรอกรายละเอียดการสูญเสียแต่ละส่วนที่เลือก</p></div><button type="button" data-ddce-organ-close aria-label="ปิด">×</button></div><div class="ddce-organ-dialog-body"><div class="ddce-organ-detail-card"><div class="ddce-organ-detail-title"><span class="ddce-organ-header-icon">${organIcon(choice?.[2] || 'accessible')}</span>${esc(choice?.[1] || '')}</div>${fingers || `<div class="ddce-organ-top-row">${sides ? `<div class="ddce-organ-side-field"><span>ข้างที่สูญเสีย :</span>${sides}</div>` : ''}<label><span>${draft.key === 'exgratia' ? 'จำนวนเงิน Exgratia' : 'ยอดเบิก'} <b class="ddce-required">*</b></span><input data-ddce-organ-field="amount" inputmode="decimal" placeholder="ระบุยอดเบิก" value="${esc(draft.amount || '')}"></label></div>`}${fingers ? `<label class="ddce-organ-finger-total"><span>ยอดเบิก <b class="ddce-required">*</b></span><input data-ddce-organ-field="amount" inputmode="decimal" value="${esc(draft.amount || '')}"></label>` : ''}<div data-ddce-organ-rule-wrap>${organRuleHtml(draft.key,draft.side || '')}</div><div class="ddce-organ-grid"><label>ยอดไม่คุ้มครอง<input data-ddce-organ-field="uncoveredAmount" inputmode="decimal" value="${esc(draft.uncoveredAmount || '')}"></label><label>สาเหตุไม่คุ้มครอง<select data-ddce-organ-field="uncoveredReason">${['','ไม่เข้าเงื่อนไขความคุ้มครอง','เกินวงเงิน','เอกสารไม่ครบ'].map(value => `<option value="${value}"${draft.uncoveredReason === value ? ' selected' : ''}>${value || 'สาเหตุไม่คุ้มครอง'}</option>`).join('')}</select></label>${draft.key === 'exgratia' ? `<label><span>ช่องทางการหัก <b class="ddce-required">*</b></span><select data-ddce-organ-field="exgratiaDeductSource">${['','แต้มผู้แทน','เงินผู้แทน','แต้มสาขา','เงินสาขา','ส่วนกลาง'].map(value => `<option value="${value}"${draft.exgratiaDeductSource === value ? ' selected' : ''}>${value || '--- โปรดระบุ ---'}</option>`).join('')}</select></label><label>รายละเอียดเพิ่มเติม<input data-ddce-organ-field="exgratiaDeductDetail" value="${esc(draft.exgratiaDeductDetail || '')}"></label>` : ''}<label class="ddce-wide">หมายเหตุ<textarea data-ddce-organ-field="note" rows="3">${esc(draft.note || '')}</textarea></label></div><div class="ddce-organ-modal-total">ยอดเงินตามใบเสร็จรวม : <strong data-ddce-organ-live-total>${money(draft.amount)}</strong> บาท</div><p data-ddce-organ-error role="alert" hidden></p><div class="ddce-organ-dialog-actions">${draft.existing ? '<button type="button" data-ddce-organ-delete>ลบรายการ</button>' : ''}<button type="button" data-ddce-organ-close>ยกเลิก</button><button type="button" data-ddce-organ-save>บันทึก</button></div></div></div></div>`;
    modal.querySelector('[data-ddce-organ-field="amount"]')?.focus();
  }
  function openOrganModal(form, id) {
    const old = activeDraft.organItems.find(item => item.key === id);
    activeDraft.organModal = old ? organClone([old])[0] : {key:id,label:organChoices.find(([key]) => key === id)?.[1] || '',side:'',comboSides:{},fingers:{},amount:'',uncoveredAmount:'',uncoveredReason:'',note:''};
    activeDraft.organModal.existing = Boolean(old);
    renderOrganModal(form);
  }
  function closeOrganModal(form) { activeDraft.organModal = null; const modal = form.querySelector('[data-ddce-organ-modal]'); if (modal) { modal.hidden=true; modal.replaceChildren(); } }
  function saveOrganModal(form) {
    const modal = form.querySelector('[data-ddce-organ-modal]');
    const draft = activeDraft.organModal;
    modal.querySelectorAll('[data-ddce-organ-field]').forEach(input => { draft[input.dataset.ddceOrganField] = input.value.trim(); });
    draft.side = modal.querySelector('[data-ddce-organ-side]:not([data-ddce-organ-side-part])[aria-pressed="true"]')?.dataset.ddceOrganSide || '';
    draft.comboSides = Object.fromEntries(Array.from(modal.querySelectorAll('.ddce-organ-combo-side'), card => [card.querySelector('strong').textContent,card.querySelector('[data-ddce-organ-side][aria-pressed="true"]')?.dataset.ddceOrganSide || '']));
    draft.fingers = {};
    modal.querySelectorAll('[data-ddce-organ-finger]').forEach(input => {
      const [side,name] = input.dataset.ddceOrganFinger.split('|');
      draft.fingers[side] ||= {};
      draft.fingers[side][name] = {selected:input.checked,joints:Number(modal.querySelector(`[data-ddce-organ-joints="${side}|${name}"]`)?.value || 1),amount:modal.querySelector(`[data-ddce-organ-finger-amount="${side}|${name}"]`)?.value.trim() || ''};
    });
    const error = modal.querySelector('[data-ddce-organ-error]');
    const fail = (message,selector) => { error.hidden=false; error.textContent=message; modal.querySelector(selector)?.focus(); };
    if (['hand','foot','eye','ear'].includes(draft.key) && !draft.side) return fail('กรุณาระบุข้างที่สูญเสีย','[data-ddce-organ-side]');
    const missingPart = (organParts[draft.key] || []).find(part => !draft.comboSides[part]);
    if (missingPart) return fail(`กรุณาระบุข้างที่สูญเสียของ${missingPart}`,'[data-ddce-organ-side-part]');
    if (organFingerNames[draft.key] && !Object.values(draft.fingers).some(group => Object.values(group).some(item => item.selected))) return fail('กรุณาเลือกนิ้วที่สูญเสียอย่างน้อย 1 รายการ','[data-ddce-organ-finger]');
    if (organFingerNames[draft.key] && Object.values(draft.fingers).some(group => Object.values(group).some(item => item.selected && amount(item.amount) <= 0))) return fail('กรุณาระบุยอดเบิกของนิ้วที่เลือกมากกว่า 0 บาท','[data-ddce-organ-finger-amount]');
    if (amount(draft.amount) <= 0) return fail(draft.key === 'exgratia' ? 'กรุณาระบุจำนวนเงิน Exgratia มากกว่า 0 บาท' : 'กรุณาระบุยอดเบิกมากกว่า 0 บาท','[data-ddce-organ-field="amount"]');
    if (amount(draft.uncoveredAmount) > amount(draft.amount)) return fail('ยอดไม่คุ้มครองต้องไม่เกินยอดเบิก','[data-ddce-organ-field="uncoveredAmount"]');
    if (amount(draft.uncoveredAmount) > 0 && !draft.uncoveredReason) return fail('กรุณาระบุสาเหตุไม่คุ้มครอง','[data-ddce-organ-field="uncoveredReason"]');
    if (draft.key === 'exgratia' && !draft.exgratiaDeductSource) return fail('กรุณาระบุช่องทางการหัก','[data-ddce-organ-field="exgratiaDeductSource"]');
    draft.amount = amount(draft.amount);
    draft.uncoveredAmount = amount(draft.uncoveredAmount);
    delete draft.existing;
    const index = activeDraft.organItems.findIndex(item => item.key === draft.key);
    if (index >= 0) activeDraft.organItems[index] = draft;
    else activeDraft.organItems.push(draft);
    closeOrganModal(form);
    renderOrganSection(form);
  }
  function applyOrganItems() {
    const items = organStore.get(key());
    if (!items || coverage() !== 'ทุพพลภาพ/สูญเสียอวัยวะ') return;
    setValue('organLoss','รายละเอียดการสูญเสียอวัยวะ',items.map(organSummary).join(' / '));
    const expense = page()?.querySelector('#ddExpenseGrid');
    const body = expense?.querySelector('tbody');
    if (body) body.innerHTML = items.map(item => `<tr><td>${esc(item.label)}</td><td>${esc([item.side || Object.entries(item.comboSides || {}).map(([part,side]) => `${part} ${side}`).join(' · '),item.legacyDetail].filter(Boolean).join(' · ') || '—')}</td><td>${money(item.amount)}</td><td>${amount(item.uncoveredAmount) ? money(item.uncoveredAmount) : '—'}</td><td>${esc(item.uncoveredReason || '—')}</td><td>${esc(item.note || '—')}</td></tr>`).join('');
    const total = expense?.querySelector('tfoot td');
    if (total) total.textContent = `ยอดเงินตามใบเสร็จรวม : ${money(items.reduce((sum,item) => sum + amount(item.amount),0))}`;
  }
  function detailRow(names) {
    return Array.from(page()?.querySelectorAll('#ddClaimDetailGrid > div') || []).find(node => names.includes(node.querySelector('.dd-field-label')?.textContent.replace(/\s*:\s*$/,'').trim()));
  }
  function currentValue(id, label) {
    return (aliases[id] || [label]).map(name => detailRow([name])?.querySelector('.dd-field-value')?.textContent.trim() || '').find(value => value && value !== '-' && value !== '—') || '';
  }
  function setValue(id, label, value) {
    let row = detailRow(aliases[id] || [label]);
    if (!row) {
      if (!value) return;
      row = document.createElement('div');
      row.innerHTML = '<div class="dd-field-label"></div><div class="dd-field-value"></div>';
      page()?.querySelector('#ddClaimDetailGrid')?.append(row);
    }
    row.querySelector('.dd-field-label').textContent = label+' :';
    row.querySelector('.dd-field-value').textContent = value || '-';
  }
  function toIso(value) {
    const m = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? `${Number(m[3])-543}-${m[2]}-${m[1]}` : '';
  }
  function toThai(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${Number(m[1])+543}` : '';
  }
  function readValues() {
    if (saved.has(key())) return saved.get(key());
    const values = Object.fromEntries(fields().map(([id,label]) => [id,currentValue(id,label)]));
    if (values.deathPlace === 'เสียชีวิตที่บ้าน') values.deathPlace = 'ที่บ้าน';
    if (values.deathPlace && !['ที่บ้าน','สถานพยาบาล','อื่นๆ'].includes(values.deathPlace)) values.deathPlace = '';
    if (!values.deathPlace && coverage() === 'เสียชีวิต') {
      const record = window.considerDeathPlaceByClaim?.[claimCode()];
      values.deathPlace = record?.deathPlace || '';
    }
    if (!values.deathOtherPlace && values.deathPlace === 'อื่นๆ') {
      values.deathOtherPlace = window.considerDeathPlaceByClaim?.[claimCode()]?.deathPlaceOther || '';
    }
    return values;
  }
  const money = value => (Number(String(value || '').replace(/,/g, '').replace(/[^\d.]/g, '')) || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const amount = value => Number(String(value || '').replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const normalizeBenefit = value => String(value || '').replace(/\s+/g,'').replace(/[()（）]/g,'').replace(/กรณี/g,'');
  function coverageBenefits(values) {
    const product = rowFor(claimCode())?.product || 'PH';
    const reason = values.coverage === 'เสียชีวิต' ? values.deathReason : values.disabilityReason;
    if (typeof CASETYPE_BENEFIT_ROWS === 'undefined' || typeof benefits === 'undefined' || !reason) return [];
    return CASETYPE_BENEFIT_ROWS.filter(item => item.product === product && item.incident === values.cause && item.coverage === values.coverage && item.subType === reason).map(item => {
      const match = (benefits[product] || []).find(benefit => normalizeBenefit(benefit[1]) === normalizeBenefit(item.detail));
      const limit = match ? amount(match[4] || match[3]) : 0;
      return {name:item.detail,rate:match?.[2] || '',limit,icon:match?.[0] || 'verified_user'};
    });
  }
  function renderCoverageBenefits(form) {
    const target = form.querySelector('[data-ddce-coverage-benefits]');
    if (!target) return;
    const values = {
      cause:form.querySelector('[data-ddce-field="cause"]')?.value || '',
      coverage:form.querySelector('[data-ddce-field="coverage"]')?.value || '',
      deathReason:form.querySelector('[data-ddce-field="deathReason"]')?.value || '',
      disabilityReason:form.querySelector('[data-ddce-field="disabilityReason"]')?.value || ''
    };
    const rows = coverageBenefits(values);
    const total = rows.reduce((sum,item) => sum + item.limit,0);
    target.innerHTML = `<div class="benefit-summary-shell compact-benefit-summary"><div class="benefit-summary-head"><h4 class="benefit-summary-title"><span class="material-icons-round text-brand-700" aria-hidden="true">verified_user</span>รายละเอียดความคุ้มครอง</h4><span class="benefit-summary-plan">แผน : ${esc(page()?.querySelector('#ddPlanPill')?.textContent.replace(/^แผน\s*:\s*/,'').trim() || '662')}</span></div>${rows.length ? `<div class="benefit-summary-grid">${rows.map(item => `<article class="benefit-item-card excel-style"><div class="benefit-item-row"><span class="benefit-item-icon"><span class="material-icons-round" aria-hidden="true">${esc(item.icon)}</span></span><div class="benefit-item-content"><h5 class="benefit-item-title">${esc(item.name)}</h5><div class="benefit-detail-line"><span class="rate">${esc(item.rate)}</span><span class="divider">|</span><span class="total">คุ้มครองสูงสุด ${money(item.limit)} บาท</span></div></div></div></article>`).join('')}</div><p class="ddce-coverage-total">ความคุ้มครองรวม <strong>${money(total)} บาท</strong></p>` : '<div class="benefit-summary-empty">กรุณาเลือกเหตุของการเคลม ประเภทความคุ้มครอง และสาเหตุให้ครบถ้วน</div>'}</div>`;
  }
  function beneficiaryValue(box,label) {
    const item = Array.from(box.querySelectorAll('.dd-detail-grid > div')).find(node => node.querySelector('.dd-field-label')?.textContent.includes(label));
    return item?.querySelector('.dd-field-value')?.textContent.trim() || '';
  }
  function setBeneficiaryValue(box,label,value) {
    const item = Array.from(box.querySelectorAll('.dd-detail-grid > div')).find(node => node.querySelector('.dd-field-label')?.textContent.includes(label));
    if (item?.querySelector('.dd-field-value')) item.querySelector('.dd-field-value').textContent = value || '-';
  }
  function readBeneficiaries() {
    return Array.from(page()?.querySelectorAll('.dd-beneficiary-box') || []).map((box,index) => {
      const accountLine = beneficiaryValue(box,'บัญชีรับสินไหม');
      const match = accountLine.match(/^(.+?)\s+(\d[\d-]*)\s+(.+)$/);
      return {index:index+1,relation:beneficiaryValue(box,'ความสัมพันธ์'),idNo:beneficiaryValue(box,'เลขบัตรประชาชน'),name:beneficiaryValue(box,'ชื่อ-นามสกุล'),phone:beneficiaryValue(box,'เบอร์โทรศัพท์'),bank:match?.[1] || '',accountNo:match?.[2] || '',accountName:match?.[3] || '',amount:amount(beneficiaryValue(box,'จำนวนเงิน'))};
    });
  }
  function readFinancial() {
    const stored = financialStore.get(key());
    if (stored) return structuredClone(stored);
    const expenseTotal = page()?.querySelector('#ddExpenseGrid tfoot td, #ddExpenseGrid .dd-entry-expense-total-value');
    const transfer = amount(expenseTotal?.textContent || page()?.querySelector('#ddPayTotal')?.textContent);
    const beneficiaries = readBeneficiaries();
    if (beneficiaries.length === 1) beneficiaries[0].amount = transfer;
    return {transfer,beneficiaries,cash:structuredClone(window.ddTransferAccountByClaim?.[claimCode()] || null)};
  }
  function beneficiaryForm(item) {
    const control = (name,label,value,type='text') => `<label><span>${label}</span><input type="${type}" data-ddce-beneficiary="${item.index}" data-ddce-beneficiary-field="${name}" value="${esc(value)}"></label>`;
    const summary = (id,label,value) => `<div><span>${label} :</span><strong data-ddce-summary="${id}">${esc(value || '—')}</strong></div>`;
    return `<div class="ddce-beneficiary-card" data-ddce-beneficiary-card="${item.index}"><div class="ddce-beneficiary-card-head"><div><h4>ผู้รับผลประโยชน์ ลำดับที่ ${item.index}</h4><span class="ddce-source-chip">ข้อมูลจากระบบ</span></div><button type="button" class="ddce-outline-button" data-ddce-beneficiary-toggle="${item.index}" aria-haspopup="dialog"><span class="material-icons-round" aria-hidden="true">edit</span>แก้ไขข้อมูล</button></div><div class="ddce-beneficiary-summary" data-ddce-beneficiary-summary>${summary('relation','ความสัมพันธ์',item.relation)}${summary('idNo','เลขบัตรประชาชน',item.idNo)}${summary('name','ชื่อ-นามสกุล',item.name)}${summary('phone','เบอร์โทรศัพท์',item.phone)}${summary('account','บัญชีรับสินไหม',[item.bank,item.accountNo,item.accountName].filter(Boolean).join(' '))}${summary('amount','จำนวนเงิน',money(item.amount))}</div><div class="ddce-beneficiary-editor" data-ddce-beneficiary-editor hidden><div class="ddce-grid">${control('relation','ความสัมพันธ์',item.relation)}${control('idNo','เลขบัตรประชาชน',item.idNo)}${control('name','ชื่อ-นามสกุล',item.name)}${control('phone','เบอร์โทรศัพท์',item.phone)}${control('bank','ธนาคาร',item.bank)}${control('accountNo','เลขที่บัญชี',item.accountNo)}${control('accountName','ชื่อบัญชี',item.accountName)}${control('amount','จำนวนเงิน',money(item.amount),'text')}</div></div></div>`;
  }
  const beneficiaryRelations = ['มารดา','บิดา','คู่สมรส','บุตร','ญาติ','ผู้ปกครอง','อื่นๆ'];
  const beneficiaryTitles = ['นาย','นาง','นางสาว','ด.ช.','ด.ญ.'];
  const beneficiaryBanks = ['กรุงไทย','ไทยพาณิชย์','กสิกรไทย','กรุงเทพ','กรุงศรีอยุธยา','ทหารไทยธนชาต','ออมสิน'];
  function beneficiaryOptions(values,current) {
    return ['',...current && !values.includes(current) ? [current] : [],...values].map(value => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(value || '--- โปรดระบุ ---')}</option>`).join('');
  }
  function splitBeneficiaryName(value) {
    const full = String(value || '').trim();
    const prefix = [...beneficiaryTitles].sort((a,b) => b.length-a.length).find(item => full.startsWith(item)) || '';
    const words = full.slice(prefix.length).trim().split(/\s+/).filter(Boolean);
    return {prefix,firstName:words[0] || '',lastName:words.slice(1).join(' ')};
  }
  function beneficiaryCardMask(value) {
    const digits = String(value || '').replace(/\D/g,'').slice(0,13);
    return digits.length === 13 ? `${digits[0]}-${digits.slice(1,5)}-${digits.slice(5,10)}-${digits.slice(10,12)}-${digits[12]}` : String(value || '');
  }
  function openBeneficiaryModal(form,index) {
    const card = form.querySelector(`[data-ddce-beneficiary-card="${index}"]`);
    if (!card) return;
    const value = name => card.querySelector(`[data-ddce-beneficiary-field="${name}"]`)?.value.trim() || '';
    const name = splitBeneficiaryName(value('name'));
    const field = (id,label,content,width='col-6',help='') => `<div class="death-form-field ${width}"><label for="ddceBeneficiary${id}">${label} <span class="req">*</span></label>${content}${help ? `<div class="death-form-help">${help}</div>` : ''}</div>`;
    const input = (id,value,extra='') => `<input id="ddceBeneficiary${id}" data-ddce-modal-field="${id}" value="${esc(value)}" ${extra}>`;
    const select = (id,values,value) => `<select id="ddceBeneficiary${id}" data-ddce-modal-field="${id}">${beneficiaryOptions(values,value)}</select>`;
    showModal(`<div class="death-modal-shell death-beneficiary-modal ddce-beneficiary-dialog" id="ddceBeneficiaryModal" role="dialog" aria-modal="true" aria-labelledby="ddceBeneficiaryTitle"><div class="death-modal-head"><div class="death-modal-title-wrap"><div class="death-modal-title-icon"><span class="material-icons-round" aria-hidden="true">diversity_3</span></div><div><div class="death-modal-title" id="ddceBeneficiaryTitle">แก้ไขข้อมูลผู้รับผลประโยชน์</div><div class="death-modal-subtitle">ปรับข้อมูลผู้รับผลประโยชน์ บัญชีรับสินไหม และจำนวนเงินให้ถูกต้องก่อนบันทึก</div></div></div><button type="button" class="death-modal-close" data-ddce-modal-close aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button></div><div class="death-modal-body"><div class="death-modal-overview"><div class="death-modal-overview-item"><div class="death-modal-overview-icon"><span class="material-icons-round" aria-hidden="true">shield</span></div><div><div class="death-modal-overview-label">ผู้รับผลประโยชน์</div><div class="death-modal-overview-value">ลำดับที่ ${index} <span class="death-modal-pill">ข้อมูลจากระบบ</span></div></div></div><div class="death-modal-overview-item"><div class="death-modal-overview-icon"><span class="material-icons-round" aria-hidden="true">description</span></div><div><div class="death-modal-overview-label">เลขที่ CL</div><div class="death-modal-overview-value">${esc(claimCode())}</div></div></div><div class="death-modal-overview-item"><div class="death-modal-overview-icon"><span class="material-icons-round" aria-hidden="true">person</span></div><div><div class="death-modal-overview-label">ชื่อผู้เอาประกัน</div><div class="death-modal-overview-value">${esc(page()?.querySelector('#ddInsuredName')?.textContent.trim() || '—')}</div></div></div></div><div class="death-form-grid"><div class="death-form-row"><div class="death-form-row-icon"><span class="material-icons-round" aria-hidden="true">family_restroom</span></div><div class="death-form-fields">${field('relation','ความสัมพันธ์',select('relation',beneficiaryRelations,value('relation')))}${field('idNo','เลขบัตรประชาชน',input('idNo',beneficiaryCardMask(value('idNo')),'inputmode="numeric" maxlength="17"'),'col-6','รูปแบบ Text Mask CardID: 0-0000-00000-00-0')}</div></div><div class="death-form-row"><div class="death-form-row-icon"><span class="material-icons-round" aria-hidden="true">person</span></div><div class="death-form-fields">${field('prefix','คำนำหน้าชื่อ',select('prefix',beneficiaryTitles,name.prefix),'col-3')}${field('firstName','ชื่อ',input('firstName',name.firstName),'col-4')}${field('lastName','นามสกุล',input('lastName',name.lastName),'col-5')}</div></div><div class="death-form-row"><div class="death-form-row-icon"><span class="material-icons-round" aria-hidden="true">call</span></div><div class="death-form-fields">${field('phone','เบอร์โทรศัพท์',input('phone',value('phone')))}</div></div><div class="death-form-row"><div class="death-form-row-icon"><span class="material-icons-round" aria-hidden="true">account_balance</span></div><div class="death-form-fields">${field('bank','ธนาคาร',select('bank',beneficiaryBanks,value('bank')),'col-4')}${field('accountNo','เลขที่บัญชี',input('accountNo',value('accountNo')),'col-4')}${field('accountName','ชื่อบัญชี',input('accountName',value('accountName')),'col-4')}</div></div><div class="death-form-row"><div class="death-form-row-icon"><span class="material-icons-round" aria-hidden="true">paid</span></div><div class="death-form-fields">${field('amount','จำนวนเงิน',input('amount',money(value('amount')),'inputmode="decimal"'))}</div></div></div><p class="ddce-modal-error" data-ddce-modal-error role="alert" hidden></p><div class="death-modal-actions"><button type="button" class="death-btn-secondary" data-ddce-modal-close>ยกเลิก</button><button type="button" class="death-btn-primary green" data-ddce-modal-save><span class="material-icons-round" aria-hidden="true">save</span>บันทึกข้อมูล</button></div></div></div>`,'max-w-3xl');
    const modal = document.getElementById('ddceBeneficiaryModal');
    modal?.addEventListener('click',event => {
      if (event.target.closest('[data-ddce-modal-close]')) { closeModal(); card.querySelector('[data-ddce-beneficiary-toggle]')?.focus(); }
      if (event.target.closest('[data-ddce-modal-save]')) saveBeneficiaryModal(form,card,modal,index);
    });
    modal?.querySelector('[data-ddce-modal-field="relation"]')?.focus();
  }
  function saveBeneficiaryModal(form,card,modal,index) {
    const value = name => modal.querySelector(`[data-ddce-modal-field="${name}"]`)?.value.trim() || '';
    const names = ['relation','idNo','prefix','firstName','lastName','phone','bank','accountNo','accountName','amount'];
    const missing = names.find(name => !value(name) || name === 'amount' && amount(value(name)) <= 0);
    const error = modal.querySelector('[data-ddce-modal-error]');
    if (missing) { error.hidden=false; error.textContent='กรุณากรอกข้อมูลผู้รับผลประโยชน์ให้ครบถ้วน'; modal.querySelector(`[data-ddce-modal-field="${missing}"]`)?.focus(); return; }
    const result = {index,relation:value('relation'),idNo:value('idNo').replace(/\D/g,''),name:`${value('prefix')}${value('firstName')} ${value('lastName')}`,phone:value('phone'),bank:value('bank'),accountNo:value('accountNo'),accountName:value('accountName'),amount:amount(value('amount'))};
    for (const [name,next] of Object.entries(result)) {
      if (name === 'index') continue;
      const control = card.querySelector(`[data-ddce-beneficiary-field="${name}"]`);
      if (!control) continue;
      control.value = name === 'amount' ? money(next) : next;
      control.dispatchEvent(new Event('input',{bubbles:true}));
    }
    const draft = activeDraft?.financial.beneficiaries.find(item => item.index === index);
    if (draft) Object.assign(draft,result);
    closeModal();
    card.querySelector('[data-ddce-beneficiary-toggle]')?.focus();
  }
  function cashForm(cash) {
    const data = cash || {};
    const control = (name,label,value) => `<label><span>${label}</span><input data-ddce-cash-field="${name}" value="${esc(value || '')}"></label>`;
    return `<input type="checkbox" data-ddce-cash-enabled${cash ? ' checked' : ''} hidden><div class="ddce-grid ddce-cash-fields" data-ddce-cash-fields${cash ? '' : ' hidden'}>${control('reason','เหตุผลการเปลี่ยนบัญชี',data.reason)}${control('bank','ธนาคาร',data.bank)}${control('accountNo','เลขที่บัญชี',data.accountNo)}${control('accountName','ชื่อบัญชี',data.accountName)}${control('receiverPrefix','คำนำหน้าชื่อผู้รับ',data.receiverPrefix)}${control('receiverFirstName','ชื่อผู้รับ',data.receiverFirstName)}${control('receiverLastName','นามสกุลผู้รับ',data.receiverLastName)}</div>`;
  }
  const cashModalFields = {
    reason:'ddChangeReasonModern',bank:'ddChangeBankModern',accountNo:'ddChangeAccountNoModern',accountName:'ddChangeAccountNameModern',
    receiverPrefix:'ddChangeReceiverPrefixModern',receiverFirstName:'ddChangeReceiverFirstNameModern',receiverLastName:'ddChangeReceiverLastNameModern'
  };
  function openCashModal(form) {
    if (typeof window.showDdChangeAccountModal !== 'function') return;
    const trigger = form.querySelector('[data-ddce-cash-toggle]');
    window.showDdChangeAccountModal({mode:'edit'});
    const modal = document.querySelector('#claimModal .death-change-account-modal');
    if (!modal) return;
    const title = modal.querySelector('.death-modal-title');
    if (title) title.textContent = 'เปลี่ยนบัญชีปลายทางการโอนเงิน';
    const subtitle = modal.querySelector('.death-modal-subtitle');
    if (subtitle) subtitle.textContent = 'กรุณากรอกข้อมูลบัญชีปลายทางใหม่ให้ครบถ้วนก่อนบันทึก';
    const total = modal.querySelector('.death-modal-overview-value.amount');
    if (total) total.textContent = `${money(form.querySelector('[data-ddce-beneficiary-total]')?.textContent)} บาท`;
    const primary = modal.querySelector('.death-btn-primary');
    if (primary) primary.innerHTML = '<span class="material-icons-round" aria-hidden="true">save</span>บันทึกการเปลี่ยนบัญชี';
    for (const [name,id] of Object.entries(cashModalFields)) {
      const source = form.querySelector(`[data-ddce-cash-field="${name}"]`);
      const field = document.getElementById(id);
      if (field) field.value = source?.value || '';
    }
    const close = () => { closeModal(); trigger?.focus(); };
    modal.querySelectorAll('.death-modal-close,.death-btn-secondary').forEach(button => {
      button.removeAttribute('onclick');
      button.onclick = null;
      button.addEventListener('click',close);
    });
    if (primary) {
      primary.removeAttribute('onclick');
      primary.onclick = null;
      primary.addEventListener('click',() => {
        const cash = Object.fromEntries(Object.entries(cashModalFields).map(([name,id]) => [name,document.getElementById(id)?.value.trim() || '']));
        const missing = Object.entries(cashModalFields).find(([name]) => !cash[name]);
        if (missing) {
          const hint = modal.querySelector('#deathChangeSaveHint');
          if (hint) { hint.textContent='กรุณากรอกข้อมูลการเปลี่ยนบัญชีให้ครบถ้วน'; hint.classList.add('show','is-error'); hint.setAttribute('role','alert'); }
          document.getElementById(missing[1])?.focus();
          return;
        }
        form.querySelector('[data-ddce-cash-enabled]').checked = true;
        for (const [name,value] of Object.entries(cash)) {
          const field = form.querySelector(`[data-ddce-cash-field="${name}"]`);
          if (field) field.value = value;
        }
        activeDraft.financial.cash = cash;
        trigger?.setAttribute('aria-pressed','true');
        close();
      });
    }
  }
  function applyFinancial(data) {
    if (!data) return;
    const boxes = Array.from(page()?.querySelectorAll('.dd-beneficiary-box') || []);
    data.beneficiaries.forEach((item,index) => {
      const box = boxes[index];
      if (!box) return;
      setBeneficiaryValue(box,'ความสัมพันธ์',item.relation);
      setBeneficiaryValue(box,'เลขบัตรประชาชน',item.idNo);
      setBeneficiaryValue(box,'ชื่อ-นามสกุล',item.name);
      setBeneficiaryValue(box,'เบอร์โทรศัพท์',item.phone);
      setBeneficiaryValue(box,'บัญชีรับสินไหม',[item.bank,item.accountNo,item.accountName].filter(Boolean).join(' '));
      setBeneficiaryValue(box,'จำนวนเงิน',money(item.amount));
    });
    const total = page()?.querySelector('#ddPayTotal');
    if (total) total.textContent = `จำนวนเงินโอนรวม : ${money(data.transfer)} บาท`;
    const expenseTotal = page()?.querySelector('.dd-entry-expense-total-value');
    if (expenseTotal) expenseTotal.textContent = `THB ${money(data.transfer)}`;
    const expenseAmount = page()?.querySelectorAll('.dd-entry-expense-amount');
    if (expenseAmount?.length === 1) expenseAmount[0].textContent = `${money(data.transfer)} บาท`;
  }
  function documentSection() {
    return Array.from(page()?.querySelectorAll('#ddTabClaim .dd-section') || []).find(section => section.querySelector('.dd-doc-title')?.textContent.includes('สแกนเอกสาร'));
  }
  function readDocuments() {
    return Array.from(documentSection()?.querySelectorAll('table tbody tr') || []).map(row => {
      const cells = row.querySelectorAll('td');
      return {code:cells[0]?.textContent.trim() || '',name:cells[1]?.textContent.trim() || '',count:Number(cells[3]?.textContent.trim() || 0) || 0,files:[]};
    }).filter(item => item.code || item.name);
  }
  function documentsForClaim() {
    return (documentStore.get(key()) || readDocuments()).map(item => ({...item,files:[...(item.files || [])]}));
  }
  function documentRows(items) {
    return items.length ? items.map((item,index) => `<tr><td>${esc(item.code || '—')}</td><td>${esc(item.name || '—')}</td><td><button type="button" class="ddce-scan" data-ddce-scan="${index}"><span class="material-icons-round" aria-hidden="true">document_scanner</span>สแกนเอกสาร</button></td><td class="ddce-count">${item.count}</td><td><button type="button" class="ddce-doc-view" data-ddce-doc-view="${index}" aria-label="ดูรายละเอียดเอกสาร ${esc(item.name)}"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr>`).join('') : '<tr><td colspan="5" class="ddce-doc-empty">ยังไม่มีรายการเอกสารเดิม</td></tr>';
  }
  function renderDraftDocuments() {
    const form = page()?.querySelector('#ddClaimEditForm');
    if (form && activeDraft) form.querySelector('[data-ddce-doc-body]').innerHTML = documentRows(activeDraft.documents);
  }
  function applySavedDocuments() {
    const items = documentStore.get(key()), section = documentSection();
    if (!items || !section) return;
    const body = section.querySelector('table tbody');
    if (!body) return;
    body.innerHTML = items.map(item => `<tr><td class="text-center">${esc(item.code || '—')}</td><td>${esc(item.name || '—')}</td><td class="text-center">สแกนแล้ว</td><td class="text-center">${item.count}</td><td class="text-center">${esc(item.files.map(file => file.name).join(', ') || 'เอกสารเดิม')}</td></tr>`).join('');
  }
  function serviceOptions(id, value) {
    const source = {recipient:'claimDocumentRecipient',provider:'claimServiceProvider',owner:'claimVehicleOwner'}[id];
    const options = Array.from(document.getElementById(source)?.options || [], option => option.value).filter(Boolean);
    if (!value && id !== 'owner') value = options[0] || '';
    if (value && !options.includes(value)) options.unshift(value);
    return ['<option value="">--- โปรดระบุ ---</option>',...options.map(option => `<option value="${esc(option)}"${option === value ? ' selected' : ''}>${esc(option)}</option>`)].join('');
  }
  function deathHospitalOptions(value) {
    const options = Array.from(document.getElementById('claimHospitalSelect')?.options || [], option => option.value).filter(Boolean);
    if (!options.length) options.push('โรงพยาบาลมะการักษ์','โรงพยาบาลวิภารามพัฒนาการ','โรงพยาบาลสมิติเวช สุขุมวิท','โรงพยาบาลพระรามเก้า','โรงพยาบาลตัวอย่าง');
    if (value && !options.includes(value)) options.unshift(value);
    return '<option value="">--- เลือกโรงพยาบาล ---</option>' + options.map(option => `<option value="${esc(option)}"${option === value ? ' selected' : ''}>${esc(option)}</option>`).join('');
  }
  function options(values,value) {
    const items = value && !values.includes(value) ? [value,...values] : values;
    return '<option value="">--- โปรดระบุ ---</option>'+items.map(item => `<option value="${esc(item)}"${item === value ? ' selected' : ''}>${esc(item)}</option>`).join('');
  }
  function syncCoverageFields(form) {
    const type = form.querySelector('[data-ddce-field="coverage"]')?.value || '';
    form.querySelectorAll('[data-ddce-condition]').forEach(item => { item.hidden = item.dataset.ddceCondition !== type; });
    const transferSection = form.querySelector('[data-ddce-transfer-section]');
    if (transferSection) transferSection.hidden = type === 'ทุพพลภาพ/สูญเสียอวัยวะ';
    const place = form.querySelector('[data-ddce-field="deathPlace"]')?.value || '';
    const hospital = form.querySelector('[data-ddce-field="hospital"]')?.closest('label');
    if (hospital) hospital.hidden = !(type === 'ทุพพลภาพ/สูญเสียอวัยวะ' || (type === 'เสียชีวิต' && place === 'สถานพยาบาล'));
    const other = form.querySelector('[data-ddce-field="deathOtherPlace"]')?.closest('label');
    if (other) other.hidden = type !== 'เสียชีวิต' || place !== 'อื่นๆ';
    const otherInput = form.querySelector('[data-ddce-field="deathOtherPlace"]');
    if (otherInput) otherInput.required = type === 'เสียชีวิต' && place === 'อื่นๆ';
    renderCoverageBenefits(form);
  }
  const choiceSets = {
    cause:[['เจ็บป่วย','healing','การเจ็บป่วยหรือโรคทั่วไป'],['อุบัติเหตุ','directions_run','เหตุการณ์อุบัติเหตุ']],
    coverage:[['ทุพพลภาพ/สูญเสียอวัยวะ','accessible','สาเหตุการทุพพลภาพ/สูญเสียอวัยวะ'],['เสียชีวิต','local_florist','สาเหตุการเสียชีวิต']],
    deathReason:[['อุบัติเหตุทั่วไป',''],['ขับขี่/โดยสารจักรยานยนต์',''],['ฆาตกรรม',''],['โรคทั่วไป','']],
    disabilityReason:[['อุบัติเหตุทั่วไป',''],['ขับขี่/โดยสารจักรยานยนต์',''],['ฆาตกรรม','']]
  };
  function availableChoices(id,cause) {
    const choices = choiceSets[id] || [];
    if (id === 'coverage' && cause === 'เจ็บป่วย') return choices.filter(([value]) => value !== 'ทุพพลภาพ/สูญเสียอวัยวะ');
    if (id === 'deathReason' && cause === 'เจ็บป่วย') return choices.filter(([value]) => value === 'โรคทั่วไป');
    if (id === 'deathReason' && cause === 'อุบัติเหตุ') return choices.filter(([value]) => value !== 'โรคทั่วไป');
    return choices;
  }
  function choiceButtons(id,choices,value) {
    return choices.map(([text,icon,,display]) => `<button type="button" class="ddce-choice${text === value ? ' active' : ''}" data-ddce-choice="${id}" data-ddce-value="${esc(text)}" aria-pressed="${text === value}">${icon ? `<span class="ddce-choice-icon material-icons-round" aria-hidden="true">${icon}</span>` : ''}<span class="ddce-choice-copy"><strong>${esc(display || text)}</strong></span></button>`).join('');
  }
  function refreshChoice(form,id,cause) {
    const select = form.querySelector(`[data-ddce-field="${id}"]`);
    if (!select) return;
    const choices = availableChoices(id,cause);
    const current = select.value;
    const next = choices.some(([value]) => value === current) ? current : choices.length === 1 ? choices[0][0] : '';
    select.innerHTML = options(choices.map(([value]) => value),next);
    select.value = next;
    form.querySelector(`.ddce-choice-options-${id}`).innerHTML = choiceButtons(id,choices,next);
  }
  function placeControl(value, otherValue) {
    const choices = ['ที่บ้าน','สถานพยาบาล','อื่นๆ'];
    return `<div class="ddce-place-field" data-ddce-condition="เสียชีวิต"><strong>สถานที่เสียชีวิต<b class="ddce-required" aria-hidden="true">*</b></strong><div class="ddce-place-choices" role="group" aria-label="สถานที่เสียชีวิต">${choices.map(item => `<button type="button" class="ddce-place-choice${item === value ? ' active' : ''}" data-ddce-place="${esc(item)}" aria-pressed="${item === value}">${esc(item)}</button>`).join('')}</div><select data-ddce-field="deathPlace" aria-label="สถานที่เสียชีวิต" hidden>${options(choices,value)}</select><label class="ddce-place-other"${value === 'อื่นๆ' ? '' : ' hidden'}><span>ระบุสถานที่เสียชีวิต<b class="ddce-required" aria-hidden="true">*</b></span><input data-ddce-field="deathOtherPlace" value="${esc(otherValue)}" placeholder="ระบุสถานที่เสียชีวิต"${value === 'อื่นๆ' ? ' required' : ''}></label></div>`;
  }
  function choiceControl(id,label,value) {
    const number = id === 'cause' ? 1 : id === 'coverage' ? 2 : 3;
    const displayLabel = ['deathReason','disabilityReason'].includes(id) && rowFor(claimCode())?.product === 'PA' ? 'สาเหตุของการเกิดเหตุ' : label;
    const condition = id === 'deathReason' ? 'เสียชีวิต' : id === 'disabilityReason' ? 'ทุพพลภาพ/สูญเสียอวัยวะ' : '';
    const choices = availableChoices(id,activeDraft?.values.cause || '');
    const values = choices.map(([text]) => text);
    const selected = value && !values.includes(value) ? [[value,''],...choices] : choices;
    const cards = choiceButtons(id,selected,value);
    return `<div class="ddce-choice-section"${condition ? ` data-ddce-condition="${esc(condition)}"` : ''}><div class="ddce-choice-title"><span class="ddce-choice-number">${number}</span><strong>${esc(displayLabel)}<b class="ddce-required" aria-hidden="true">*</b></strong></div><select data-ddce-field="${id}" aria-label="${esc(displayLabel)}" hidden>${options(selected.map(([text]) => text),value)}</select><div class="ddce-choice-options ddce-choice-options-${id}" role="group" aria-label="${esc(displayLabel)}">${cards}</div></div>`;
  }
  function control([id,label,type], value) {
    if (id === 'deathPlace') return placeControl(value,activeDraft?.values.deathOtherPlace || '');
    if (id === 'deathOtherPlace') return '';
    if (choiceSets[id]) return choiceControl(id,label,value);
    const attribute = `data-ddce-field="${id}"`;
    const title = `<span>${esc(displayLabels[id] || label)}${requiredFields.has(id) || id === 'hospital' ? '<b class="ddce-required" aria-hidden="true">*</b>' : ''}${id === 'diagnosis1' ? ' (diagnosis 1)' : ''}</span>`;
    const condition = ['deathReason','death','deathOtherPlace'].includes(id) ? 'เสียชีวิต' : id === 'disabilityReason' ? 'ทุพพลภาพ/สูญเสียอวัยวะ' : '';
    const rowClass = `${fullRowFields.has(id) || type === 'textarea' ? 'ddce-wide ' : ''}${condition ? 'ddce-conditional' : ''}`.trim();
    const start = `<label${rowClass ? ` class="${rowClass}"` : ''}${condition ? ` data-ddce-condition="${esc(condition)}"` : ''}>${title}`;
    if (type === 'service') return `${start}<select ${attribute}>${serviceOptions(id,value)}</select></label>`;
    if (type === 'hospital') return `${start}<select ${attribute}>${deathHospitalOptions(value)}</select></label>`;
    if (type === 'diagnosis') return `<label class="ddce-wide" data-ddce-diagnosis-row="${id}"${id !== 'diagnosis1' && !value ? ' hidden' : ''}>${title}<select ${attribute}${id === 'diagnosis1' ? ' required' : ''}>${options(['S06.0 Concussion'],value)}</select></label>`;
    if (type === 'textarea') return `${start}<textarea ${attribute} rows="3">${esc(value)}</textarea></label>`;
    return `${start}<input ${attribute} type="${type === 'date' ? 'date' : 'text'}" value="${esc(type === 'date' ? toIso(value) : value)}"${id === 'symptom' ? ' required' : ''}></label>`;
  }
  function leave() { page()?.classList.remove('ddce-active'); page()?.querySelector('#ddClaimEditForm')?.remove(); activeDraft=null; }
  function openEditor(code) {
    const row = rowFor(code);
    if (!row || row.status !== 'รอแก้ไข') return;
    window.showConsiderDeathDetail?.(code);
    window.setDeathMainTab?.('claim');
    leave();
    const type = coverage();
    if (!['เสียชีวิต','ทุพพลภาพ/สูญเสียอวัยวะ'].includes(type)) return;
    const values = readValues();
    activeDraft = {claimKey:key(),values,documents:documentsForClaim(),financial:readFinancial(),organItems:readOrganItems(),organModal:null,scanIndex:0};
    const section = document.createElement('section');
    section.id = 'ddClaimEditForm';
    section.className = 'dd-section ddce-card';
    const basics = new Set(['cause','coverage','deathReason','disabilityReason']);
    section.innerHTML = `<div class="ddce-header"><span class="material-icons-round" aria-hidden="true">edit_note</span><div><h2>แก้ไขข้อมูลเคลม</h2><p>ตรวจสอบข้อมูลเดิมและแก้ไขฟิลด์ที่กำหนด</p></div></div>
      <div class="ddce-group ddce-option-group"><div class="ddce-choice-stack">${fields().filter(field => basics.has(field[0])).map(field => control(field,values[field[0]] || '')).join('')}</div></div>
      <div class="ddce-group"><h3>ข้อมูลผู้ให้บริการ</h3><div class="ddce-grid">${fields().filter(field => field[2] === 'service').map(field => control(field,values[field[0]] || '')).join('')}</div></div>
      <div class="ddce-group"><h3>ข้อมูลเหตุการณ์และการรักษา</h3><div class="ddce-grid">${fields().filter(field => !basics.has(field[0]) && field[2] !== 'service').map(field => control(field,values[field[0]] || '')).join('')}</div><button type="button" class="ddce-outline-button ddce-add-diagnosis" data-ddce-add-diagnosis${values.diagnosis2 && values.diagnosis3 ? ' hidden' : ''}>+ เพิ่มการวินิจฉัย</button></div>
      <div class="ddce-group ddce-organ-section" data-ddce-organ-section data-ddce-condition="ทุพพลภาพ/สูญเสียอวัยวะ"></div>
      <div class="ddce-group"><h3>สแกนเอกสาร</h3><div class="ddce-document-table-wrap"><table class="ddce-document-table"><thead><tr><th>รหัสเอกสาร</th><th>ประเภทเอกสาร</th><th>สแกนเอกสาร</th><th>จำนวนเอกสาร</th><th>รายละเอียด</th></tr></thead><tbody data-ddce-doc-body>${documentRows(activeDraft.documents)}</tbody></table></div><input type="file" data-ddce-files multiple hidden></div>
      <div class="ddce-group ddce-coverage-group" data-ddce-coverage-benefits></div>
      <div class="ddce-group" data-ddce-transfer-section><h3>จำนวนเงินที่ต้องการโอน</h3><div class="ddce-grid"><label><span>จำนวนเงินที่ต้องการโอน</span><input data-ddce-transfer inputmode="decimal" value="${money(activeDraft.financial.transfer)}"></label></div><p class="ddce-help">ยอดรวมต้องเท่ากับจำนวนเงินของผู้รับผลประโยชน์ทุกราย</p></div>
      <div class="ddce-group ddce-beneficiary-group"><div class="ddce-beneficiary-head"><h3>ผู้รับผลประโยชน์</h3><button type="button" class="ddce-outline-button" data-ddce-cash-toggle aria-haspopup="dialog" aria-pressed="${Boolean(activeDraft.financial.cash)}"><span class="material-icons-round" aria-hidden="true">account_balance_wallet</span>เงินสดมอบหน้างาน</button></div>${activeDraft.financial.beneficiaries.map(beneficiaryForm).join('')}<div class="ddce-beneficiary-total">จำนวนเงินโอนรวม : <strong data-ddce-beneficiary-total>${money(activeDraft.financial.transfer)}</strong> บาท</div><div class="ddce-cash-panel" data-ddce-cash-panel hidden><h4>เงินสดมอบหน้างาน</h4>${cashForm(activeDraft.financial.cash)}</div></div>
      <p class="ddce-form-error" data-ddce-error role="alert" hidden></p><div class="ddce-actions"><button type="button" data-ddce-cancel>ยกเลิก</button><button type="button" data-ddce-save>บันทึกการแก้ไข</button></div><div class="ddce-organ-modal" data-ddce-organ-modal hidden></div>`;
    page()?.querySelector('#ddTabClaim')?.prepend(section);
    page()?.classList.add('ddce-active');
    syncCoverageFields(section);
    renderOrganSection(section);
    section.addEventListener('click', event => {
      const organSide = event.target.closest('[data-ddce-organ-side]');
      if (organSide) {
        organSide.parentElement.querySelectorAll('[data-ddce-organ-side]').forEach(button => button.setAttribute('aria-pressed',String(button === organSide)));
        if (!organSide.dataset.ddceOrganSidePart) section.querySelector('[data-ddce-organ-rule-wrap]').innerHTML = organRuleHtml(activeDraft.organModal.key,organSide.dataset.ddceOrganSide);
        return;
      }
      const organRemove = event.target.closest('[data-ddce-organ-remove]');
      if (organRemove) { activeDraft.organItems=activeDraft.organItems.filter(item => item.key !== organRemove.dataset.ddceOrganRemove); renderOrganSection(section); return; }
      const organOpen = event.target.closest('[data-ddce-organ-open]');
      if (organOpen) { openOrganModal(section,organOpen.dataset.ddceOrganOpen); return; }
      if (event.target.closest('[data-ddce-organ-close]')) { closeOrganModal(section); return; }
      if (event.target.closest('[data-ddce-organ-delete]')) { activeDraft.organItems=activeDraft.organItems.filter(item => item.key !== activeDraft.organModal?.key); closeOrganModal(section); renderOrganSection(section); return; }
      if (event.target.closest('[data-ddce-organ-save]')) { saveOrganModal(section); return; }
      const choice = event.target.closest('[data-ddce-choice]');
      if (choice) {
        const id = choice.dataset.ddceChoice;
        section.querySelector(`[data-ddce-field="${id}"]`).value = choice.dataset.ddceValue;
        section.querySelectorAll(`[data-ddce-choice="${id}"]`).forEach(button => {
          const active = button === choice;
          button.classList.toggle('active',active);
          button.setAttribute('aria-pressed',String(active));
        });
        if (id === 'cause') {
          refreshChoice(section,'coverage',choice.dataset.ddceValue);
          refreshChoice(section,'deathReason',choice.dataset.ddceValue);
          refreshChoice(section,'disabilityReason',choice.dataset.ddceValue);
        }
        if (id === 'coverage' || id === 'cause') {
          syncCoverageFields(section);
          if (section.querySelector('[data-ddce-field="coverage"]')?.value === 'ทุพพลภาพ/สูญเสียอวัยวะ') renderOrganSection(section);
        }
        if (id === 'deathReason' || id === 'disabilityReason') renderCoverageBenefits(section);
        return;
      }
      const place = event.target.closest('[data-ddce-place]');
      if (place) {
        section.querySelector('[data-ddce-field="deathPlace"]').value = place.dataset.ddcePlace;
        section.querySelectorAll('[data-ddce-place]').forEach(button => {
          const active = button === place;
          button.classList.toggle('active',active);
          button.setAttribute('aria-pressed',String(active));
        });
        syncCoverageFields(section);
        return;
      }
      const addDiagnosis = event.target.closest('[data-ddce-add-diagnosis]');
      if (addDiagnosis) {
        const next = section.querySelector('[data-ddce-diagnosis-row][hidden]');
        if (next) { next.hidden = false; next.querySelector('select')?.focus(); }
        addDiagnosis.hidden = !section.querySelector('[data-ddce-diagnosis-row][hidden]');
        return;
      }
      const edit = event.target.closest('[data-ddce-beneficiary-toggle]');
      if (edit) {
        openBeneficiaryModal(section,Number(edit.dataset.ddceBeneficiaryToggle));
        return;
      }
      const cashButton = event.target.closest('[data-ddce-cash-toggle]');
      if (cashButton) {
        openCashModal(section);
        return;
      }
    });
    section.addEventListener('keydown', event => { if (event.key === 'Escape' && activeDraft?.organModal) closeOrganModal(section); });
    section.addEventListener('input', event => {
      if (event.target.matches('[data-ddce-organ-field="amount"]')) {
        const total = section.querySelector('[data-ddce-organ-live-total]');
        if (total) total.textContent = money(amount(event.target.value));
      }
      const input = event.target.closest('[data-ddce-beneficiary-field]');
      if (!input) return;
      const card = input.closest('[data-ddce-beneficiary-card]');
      const field = input.dataset.ddceBeneficiaryField;
      const summaryField = ['bank','accountNo','accountName'].includes(field) ? 'account' : field;
      const summary = card?.querySelector(`[data-ddce-summary="${summaryField}"]`);
      if (!summary) return;
      summary.textContent = summaryField === 'account'
        ? ['bank','accountNo','accountName'].map(id => card.querySelector(`[data-ddce-beneficiary-field="${id}"]`)?.value.trim()).filter(Boolean).join(' ') || '—'
        : summaryField === 'amount' ? money(input.value) : input.value.trim() || '—';
    });
    section.querySelector('[data-ddce-transfer]')?.addEventListener('input', event => {
      const beneficiaries = section.querySelectorAll('[data-ddce-beneficiary-field="amount"]');
      if (beneficiaries.length === 1) {
        beneficiaries[0].value = event.target.value;
        beneficiaries[0].dispatchEvent(new Event('input',{bubbles:true}));
      }
      section.querySelector('[data-ddce-beneficiary-total]').textContent = money(event.target.value);
    });
    section.querySelector('[data-ddce-files]').addEventListener('change', event => {
      const files = Array.from(event.target.files || []);
      const item = activeDraft?.documents[activeDraft.scanIndex];
      if (!item || !files.length) return;
      item.files.push(...files);
      item.count += files.length;
      renderDraftDocuments();
      event.target.value='';
    });
    section.scrollIntoView({block:'start'});
  }
  function saveEdit() {
    const form = page()?.querySelector('#ddClaimEditForm');
    if (!form) return;
    const code = claimCode(), row = rowFor(code);
    if (!row || row.status !== 'รอแก้ไข') return;
    const error = form.querySelector('[data-ddce-error]');
    const before = readValues();
    const beforeFinancial = readFinancial();
    const after = Object.fromEntries(fields().map(([id,,type]) => {
      const value = form.querySelector(`[data-ddce-field="${id}"]`)?.value.trim() || '';
      return [id,type === 'date' ? toThai(value) : value];
    }));
    if (!after.cause || !after.coverage) {
      const missing = !after.cause ? 'cause' : 'coverage';
      error.hidden=false;
      error.textContent=`กรุณาเลือก${missing === 'cause' ? 'เหตุของการเคลม' : 'ประเภทความคุ้มครอง'}`;
      form.querySelector(`[data-ddce-choice="${missing}"]`)?.focus();
      return;
    }
    for (const [id,label] of [['recipient','ผู้รับเอกสาร'],['provider','ผู้ให้บริการ'],['owner','เจ้าของรถ']]) {
      if (after[id]) continue;
      error.hidden=false; error.textContent=`กรุณาระบุ${label}`; form.querySelector(`[data-ddce-field="${id}"]`)?.focus(); return;
    }
    for (const [id,label] of [['incident','วันที่เกิดเหตุ'],['reported','วันที่รับแจ้ง'],['complete','วันที่เอกสารครบ'],...(after.coverage === 'เสียชีวิต' ? [['death','วันที่เสียชีวิต']] : [])]) {
      if (after[id]) continue;
      error.hidden=false; error.textContent=`กรุณาระบุ${label}`; form.querySelector(`[data-ddce-field="${id}"]`)?.focus(); return;
    }
    for (const [id,label] of [['symptom','อาการสำคัญ'],['diagnosis1','การวินิจฉัย 1']]) {
      if (after[id]) continue;
      error.hidden=false; error.textContent=`กรุณาระบุ${label}`; form.querySelector(`[data-ddce-field="${id}"]`)?.focus(); return;
    }
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    if (form.querySelector('[data-ddce-field="incident"]')?.value > todayIso) {
      error.hidden=false; error.textContent='รบกวนตรวจสอบวันที่เกิดเหตุ'; form.querySelector('[data-ddce-field="incident"]')?.focus(); return;
    }
    if (after.coverage === 'เสียชีวิต') {
      after.disabilityReason = '';
      if (!after.deathReason) { error.hidden=false; error.textContent='กรุณาระบุสาเหตุการเสียชีวิต'; form.querySelector('[data-ddce-choice="deathReason"]')?.focus(); return; }
      if (!after.deathPlace) { error.hidden=false; error.textContent='กรุณาระบุสถานที่เสียชีวิต'; form.querySelector('[data-ddce-place]')?.focus(); return; }
      if (after.deathPlace === 'สถานพยาบาล' && !after.hospital) { error.hidden=false; error.textContent='กรุณาระบุสถานพยาบาล'; form.querySelector('[data-ddce-field="hospital"]')?.focus(); return; }
      if (after.deathPlace === 'อื่นๆ' && !after.deathOtherPlace) { error.hidden=false; error.textContent='กรุณาระบุสถานที่เสียชีวิต'; form.querySelector('[data-ddce-field="deathOtherPlace"]')?.focus(); return; }
      if (after.deathPlace !== 'อื่นๆ') after.deathOtherPlace = '';
      if (form.querySelector('[data-ddce-field="death"]')?.value < form.querySelector('[data-ddce-field="incident"]')?.value) { error.hidden=false; error.textContent='รบกวนตรวจสอบวันที่เสียชีวิต'; form.querySelector('[data-ddce-field="death"]')?.focus(); return; }
    } else {
      after.deathReason = '';
      after.death = '';
      after.deathPlace = '';
      after.deathOtherPlace = '';
      if (after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ' && !after.disabilityReason) {
        error.hidden=false; error.textContent='กรุณาระบุสาเหตุการทุพพลภาพ/สูญเสียอวัยวะ'; form.querySelector('[data-ddce-choice="disabilityReason"]')?.focus(); return;
      }
      if (after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ' && !after.hospital) { error.hidden=false; error.textContent='กรุณาระบุสถานพยาบาล'; form.querySelector('[data-ddce-field="hospital"]')?.focus(); return; }
      if (after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ' && !activeDraft.organItems.length) { error.hidden=false; error.textContent='กรุณาเลือกรายละเอียดการสูญเสียอวัยวะอย่างน้อย 1 รายการ'; form.querySelector('[data-ddce-organ-open]')?.focus(); return; }
    }
    const beneficiaryFields = [['relation','ความสัมพันธ์'],['idNo','เลขบัตรประชาชน'],['name','ชื่อ-นามสกุล'],['phone','เบอร์โทรศัพท์'],['bank','ธนาคาร'],['accountNo','เลขที่บัญชี'],['accountName','ชื่อบัญชี'],['amount','จำนวนเงิน']];
    const beneficiaries = beforeFinancial.beneficiaries.map(item => {
      const next = {...item};
      beneficiaryFields.forEach(([id]) => {
        const value = form.querySelector(`[data-ddce-beneficiary="${item.index}"][data-ddce-beneficiary-field="${id}"]`)?.value.trim() || '';
        next[id] = id === 'amount' ? amount(value) : value;
      });
      return next;
    });
    const cashEnabled = form.querySelector('[data-ddce-cash-enabled]')?.checked;
    const cashKeys = ['reason','bank','accountNo','accountName','receiverPrefix','receiverFirstName','receiverLastName'];
    const cash = cashEnabled ? Object.fromEntries(cashKeys.map(id => [id,form.querySelector(`[data-ddce-cash-field="${id}"]`)?.value.trim() || ''])) : null;
    const afterFinancial = {transfer:after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ' ? activeDraft.organItems.reduce((sum,item) => sum + amount(item.amount),0) : amount(form.querySelector('[data-ddce-transfer]')?.value),beneficiaries,cash};
    const financialChanged = JSON.stringify(beforeFinancial) !== JSON.stringify(afterFinancial);
    const benefitRows = coverageBenefits(after);
    const coverageLimit = benefitRows.reduce((sum,item) => sum + item.limit,0);
    if (!coverageLimit) {
      error.hidden=false; error.textContent='ไม่พบวงเงินความคุ้มครองสำหรับข้อมูลเคลมที่เลือก'; form.querySelector('[data-ddce-coverage-benefits]')?.scrollIntoView({block:'center'}); return;
    }
    if (Math.round(afterFinancial.transfer*100) > Math.round(coverageLimit*100)) {
      error.hidden=false; error.textContent=`จำนวนเงินที่ต้องการโอนต้องไม่เกินความคุ้มครอง ${money(coverageLimit)} บาท`; form.querySelector('[data-ddce-transfer]')?.focus(); return;
    }
    if (financialChanged && (!afterFinancial.transfer || beneficiaries.some(item => !item.name || !item.bank || !item.accountNo || item.amount <= 0))) {
      error.hidden=false; error.textContent='กรุณาตรวจสอบจำนวนเงินที่ต้องการโอนและข้อมูลผู้รับผลประโยชน์'; return;
    }
    if (financialChanged && Math.round(beneficiaries.reduce((sum,item) => sum+item.amount,0)*100) !== Math.round(afterFinancial.transfer*100)) {
      error.hidden=false; error.textContent='จำนวนเงินที่ต้องการโอนต้องเท่ากับยอดรวมของผู้รับผลประโยชน์'; return;
    }
    if (financialChanged && cash && cashKeys.some(id => !cash[id])) {
      error.hidden=false; error.textContent='กรุณากรอกข้อมูลเงินสดมอบหน้างานให้ครบถ้วน'; form.querySelector(`[data-ddce-cash-field="${cashKeys.find(id => !cash[id])}"]`)?.focus(); return;
    }
    const changes = fields().filter(([id]) => (before[id] || '') !== (after[id] || '')).map(([id,label]) => ({label,before:before[id] || '—',after:after[id] || '—'}));
    const beforeOrgans = readOrganItems();
    const afterOrgans = after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ' ? activeDraft.organItems : [];
    if (JSON.stringify(beforeOrgans) !== JSON.stringify(afterOrgans)) changes.push({label:'รายละเอียดการสูญเสียอวัยวะ',before:beforeOrgans.map(organSummary).join(' / ') || '—',after:afterOrgans.map(organSummary).join(' / ') || '—'});
    if (Math.round(beforeFinancial.transfer*100) !== Math.round(afterFinancial.transfer*100)) changes.push({label:'จำนวนเงินที่ต้องการโอน',before:money(beforeFinancial.transfer)+' บาท',after:money(afterFinancial.transfer)+' บาท'});
    beneficiaries.forEach((item,index) => beneficiaryFields.forEach(([id,label]) => {
      const previous = beforeFinancial.beneficiaries[index]?.[id];
      const next = item[id];
      if (String(previous || '') !== String(next || '')) changes.push({label:`ผู้รับผลประโยชน์ ลำดับที่ ${item.index} · ${label}`,before:id === 'amount' ? money(previous)+' บาท' : previous || '—',after:id === 'amount' ? money(next)+' บาท' : next || '—'});
    }));
    if (Boolean(beforeFinancial.cash) !== Boolean(cash)) changes.push({label:'เงินสดมอบหน้างาน',before:beforeFinancial.cash ? 'มีข้อมูล' : 'ไม่มีข้อมูล',after:cash ? 'มีข้อมูล' : 'ไม่มีข้อมูล'});
    if (cash) cashKeys.forEach(id => { if ((beforeFinancial.cash?.[id] || '') !== cash[id]) changes.push({label:'เงินสดมอบหน้างาน · '+({reason:'เหตุผลการเปลี่ยนบัญชี',bank:'ธนาคาร',accountNo:'เลขที่บัญชี',accountName:'ชื่อบัญชี',receiverPrefix:'คำนำหน้าชื่อผู้รับ',receiverFirstName:'ชื่อผู้รับ',receiverLastName:'นามสกุลผู้รับ'}[id]),before:beforeFinancial.cash?.[id] || '—',after:cash[id] || '—'}); });
    const originalDocuments = documentStore.get(key()) || readDocuments();
    const nextDocuments = activeDraft?.documents || [];
    nextDocuments.forEach((item,index) => {
      if (item.count === (originalDocuments[index]?.count || 0) && !item.files.length) return;
      changes.push({label:'สแกนเอกสาร · '+(item.name || item.code),before:String(originalDocuments[index]?.count || 0)+' ฉบับ',after:String(item.count)+' ฉบับ'+(item.files.length ? ' · '+item.files.map(file => file.name).join(', ') : '')});
    });
    if (!changes.length) { error.hidden=false; error.textContent='กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์หรือเลือกเอกสาร'; return; }
    const editKey = key();
    saved.set(editKey,after);
    if (after.coverage === 'ทุพพลภาพ/สูญเสียอวัยวะ') organStore.set(editKey,organClone(afterOrgans));
    if (after.coverage === 'เสียชีวิต') {
      window.considerDeathPlaceByClaim ||= Object.create(null);
      window.considerDeathPlaceByClaim[code] = {
        ...(window.considerDeathPlaceByClaim[code] || {}),
        deathPlace:after.deathPlace,
        deathHospital:after.deathPlace === 'สถานพยาบาล' ? after.hospital : '',
        deathPlaceOther:after.deathPlace === 'อื่นๆ' ? after.deathOtherPlace : ''
      };
    }
    financialStore.set(editKey,structuredClone(afterFinancial));
    if (window.ddTransferAccountByClaim) {
      if (cash) window.ddTransferAccountByClaim[code] = cash;
      else delete window.ddTransferAccountByClaim[code];
    }
    documentStore.set(editKey,nextDocuments.map(item => ({...item,files:[...item.files]})));
    fields().forEach(([id,label]) => setValue(id,label,after[id]));
    applyOrganItems();
    applyFinancial(afterFinancial);
    applySavedDocuments();
    if (!records.has(editKey)) records.set(editKey,[]);
    records.get(editKey).push({id:'dd-claim-edit-'+Date.now(),kind:'edit',stamp:new Date().toISOString(),changes});
    row.status='รอตรวจสอบการแก้ไข';
    if (financialChanged) row.amount=money(afterFinancial.transfer);
    row.statusClass='review';
    row.statusReason='รอตรวจสอบข้อมูลเคลมที่แก้ไข';
    row.statusDetail='บันทึกการแก้ไขข้อมูลเคลมแล้ว';
    leave();
    window.renderConsiderDeathTable?.();
    window.refreshDeathClaimTransactionHistory?.();
    window.showConsiderDeathPage?.();
    window.setConsiderDeathStatusFilter?.('รอตรวจสอบการแก้ไข');
  }
  window.getDeathClaimEditEvents = editKey => records.get(editKey) || [];
  const originalRender = window.renderConsiderDeathTable;
  if (typeof originalRender === 'function') window.renderConsiderDeathTable = function () {
    const result = originalRender.apply(this,arguments);
    document.querySelectorAll('#considerDeathTableBody tr').forEach(tr => {
      const code = tr.cells?.[1]?.textContent.trim();
      const row = rowFor(code);
      if (row?.status !== 'รอแก้ไข') return;
      const actions = tr.cells?.[7]?.querySelector('div');
      if (actions && !actions.querySelector('[data-ddce-open]')) {
        actions.querySelector('.dd-consider-btn')?.remove();
        const view = actions.querySelector('.tt-action.view');
        if (view) {
          view.classList.add('ddce-icon-action');
          view.dataset.ddceView=code;
          view.dataset.tooltip='ดูรายละเอียด';
          view.setAttribute('aria-label','ดูรายละเอียด '+code);
          view.removeAttribute('title');
        }
        const button = document.createElement('button');
        button.type='button'; button.className='ddce-icon-action ddce-list-edit'; button.dataset.ddceOpen=code;
        button.dataset.tooltip='แก้ไข'; button.setAttribute('aria-label','แก้ไขข้อมูลเคลม '+code);
        button.innerHTML='<span class="material-icons-round" aria-hidden="true">edit</span>';
        actions.prepend(button);
      }
    });
    return result;
  };
  const originalOpen = window.showConsiderDeathDetail;
  if (typeof originalOpen === 'function') window.showConsiderDeathDetail = function () {
    leave();
    page()?.classList.remove('ddce-view-only');
    const result = originalOpen.apply(this,arguments);
    const editKey = key();
    const values = saved.get(editKey);
    if (values) fields().forEach(([id,label]) => setValue(id,label,values[id]));
    applyOrganItems();
    const financial = financialStore.get(editKey);
    if (financial) {
      applyFinancial(financial);
      window.setTimeout(() => {
        if (key() === editKey && !page()?.classList.contains('ddce-active')) applyFinancial(financial);
      }, 180);
    }
    applySavedDocuments();
    return result;
  };
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-ddce-open]');
    if (button) { openEditor(button.dataset.ddceOpen); return; }
    const view = event.target.closest?.('[data-ddce-view]');
    if (view) { window.showConsiderDeathDetail?.(view.dataset.ddceView); page()?.classList.add('ddce-view-only'); return; }
    const scan = event.target.closest?.('[data-ddce-scan]');
    if (scan && activeDraft) { activeDraft.scanIndex=Number(scan.dataset.ddceScan); page()?.querySelector('#ddClaimEditForm [data-ddce-files]')?.click(); return; }
    const docView = event.target.closest?.('[data-ddce-doc-view]');
    if (docView && activeDraft) {
      const item = activeDraft.documents[Number(docView.dataset.ddceDocView)];
      if (!item) return;
      const row = docView.closest('tr');
      if (row?.nextElementSibling?.matches('.ddce-doc-detail')) { row.nextElementSibling.remove(); return; }
      const detail = document.createElement('tr');
      detail.className='ddce-doc-detail';
      detail.innerHTML='<td colspan="5"><strong>'+esc(item.name)+'</strong> · '+item.count+' ฉบับ'+(item.files.length ? '<br>ไฟล์ที่เลือก: '+esc(item.files.map(file => file.name).join(', ')) : '<br>เอกสารเดิมจากข้อมูลเคลม')+'</td>';
      row?.after(detail);
      return;
    }
    if (event.target.closest?.('[data-ddce-cancel]')) { leave(); window.showConsiderDeathPage?.(); return; }
    if (event.target.closest?.('[data-ddce-save]')) saveEdit();
  });
  window.renderConsiderDeathTable?.();
})();
