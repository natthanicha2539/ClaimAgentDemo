/* พิจารณาเคลม > เคลมโรงพยาบาล > ประวัติการทำรายการ > พิจารณาใหม่อีกครั้ง */
(function () {
  'use strict';

  const records = new Map();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const page = () => document.querySelector('#considerHospitalOpdFullPage:not(.hidden), #considerHospitalOpdHalfPage:not(.hidden)');
  const row = () => window.currentConsiderHospitalRow;
  const key = item => `${item?.claimCode || item?.claimNo || ''}|${item?.caseNo || ''}`;
  const text = value => String(value || '').replace(/\s+/g, ' ').trim();
  const amount = value => {
    const raw=String(value ?? '').replace(/,/g,'').trim();
    return raw==='' ? 0 : Number(raw);
  };
  const money = value => Number(value || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const moneyFields = {receipt:'ยอดเงินตามใบเสร็จ',discount:'ส่วนลด',uncovered:'ยอดเงินไม่คุ้มครอง'};
  const paneId = surface => surface.id === 'considerHospitalOpdHalfPage' ? 'hhStepPane2' : 'hfStepPane2';
  const stamp = date => new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
  const decisions = {
    'รอเอกสาร': {label:'สาเหตุรอเอกสาร',detail:'รายละเอียดเอกสารที่ต้องการ',reasons:['เอกสารไม่ครบถ้วน','ขอเอกสารประกอบเพิ่มเติม','เอกสารไม่ชัดเจน','เอกสารไม่ตรงกับข้อมูลเคลม','รอเอกสารจากผู้เอาประกัน']},
    'รอแก้ไข': {label:'สาเหตุรอแก้ไข',detail:'รายละเอียดการรอแก้ไข',reasons:['บันทึกข้อมูลในระบบไม่ถูกต้อง','บันทึกยอดเงินในระบบไม่ถูกต้อง','ข้อมูลผู้เอาประกันไม่ถูกต้อง','ข้อมูลการรักษาไม่ถูกต้อง','ไม่มีไฟล์สแกน','อนุมัติบางส่วน']},
    'ปฏิเสธ': {label:'สาเหตุการปฏิเสธ',detail:'รายละเอียดการปฏิเสธ',reasons:['อยู่ในระยะรอคอย','เป็นข้อยกเว้นของกรมธรรม์','เป็นโรคยกเว้นของกรมธรรม์','ไม่มีความคุ้มครอง','เต็มสิทธิ์ความคุ้มครอง','เกินระยะเวลาดำเนินการ']},
    'ยกเลิก': {label:'สาเหตุการยกเลิก',detail:'รายละเอียดการยกเลิก',reasons:['ผู้เอาประกันขอยกเลิกเคลม','โรงพยาบาลยกเลิกรายการ','แจ้งเคลมซ้ำ','บันทึกข้อมูลผิดรายการ','ไม่ประสงค์ดำเนินการต่อ']}
  };
  const decisionLabels={waitdocs:'รอเอกสาร',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก'};
  const claimLabels={continuous:'เป็นเคลมต่อเนื่องจาก',admitDate:'วันที่เข้า รพ.',admitTime:'เวลาที่เข้า รพ.',dischargeDate:'วันที่ออก รพ.',dischargeTime:'เวลาที่ออก รพ.',ipdDays:'จำนวน IPD',icuDays:'จำนวน ICU'};
  let active=null;
  let restoring=false;
  const locked=new Map();
  function visibleStep(surface) {return surface.querySelector('#hfStepPane1:not(.hidden),#hfStepPane2:not(.hidden),#hfStepPane3:not(.hidden),#hhStepPane1:not(.hidden),#hhStepPane2:not(.hidden),#hhStepPane3:not(.hidden)');}
  function claimControls(surface) {
    const prefix=surface.id==='considerHospitalOpdHalfPage'?'hh':'hf';
    return {continuous:surface.querySelector(`#${prefix}ContinuousClaimCheckbox`),admitDate:surface.querySelector(`#${prefix}AdmitDate`),admitTime:surface.querySelector(`#${prefix}AdmitTime`),dischargeDate:surface.querySelector(`#${prefix}DischargeDate`),dischargeTime:surface.querySelector(`#${prefix}DischargeTime`),ipdDays:surface.querySelector(`#${prefix}IpdDays`),icuDays:surface.querySelector(`#${prefix}IcuDays`)};
  }
  function claimValues(surface) {const controls=claimControls(surface);return Object.fromEntries(Object.entries(controls).map(([id,control])=>[id,id==='continuous'?!!control?.checked:control?.value||'']));}
  function applyClaimValues(surface,values) {const controls=claimControls(surface);Object.entries(controls).forEach(([id,control])=>{if(!control)return;if(id==='continuous')control.checked=!!values[id];else control.value=values[id]||'';if(id==='ipdDays'||id==='icuDays')control.dispatchEvent(new Event('input',{bubbles:true}));});}
  function decisionFields(surface) {
    const pane=visibleStep(surface);
    return {reason:pane?.querySelector('.customerDecisionDynamicFields select[id$="Reason"]') || null,detail:pane?.querySelector('.customerDecisionDynamicFields textarea[id$="Detail"]') || null};
  }
  function restoreDecisionFields(surface) {
    if(!active) return;
    surface.querySelectorAll('.customerDecisionDynamicFields select[id$="Reason"]').forEach(select => {if(Array.from(select.options).some(option => option.value===active.reason)) select.value=active.reason;});
    surface.querySelectorAll('.customerDecisionDynamicFields textarea[id$="Detail"]').forEach(field => {field.value=active.detail;});
  }
  function showNativeError(message,field) {
    const error=page()?.querySelector('[data-hcr-native-error]');
    if(error) {error.textContent=message;error.hidden=false;}
    page()?.querySelectorAll('[data-hcr-field-error]').forEach(node=>node.remove());
    if(field && ['admitDate','admitTime','dischargeDate','dischargeTime'].some(id=>field===claimControls(page())[id])){
      const inline=document.createElement('p');inline.dataset.hcrFieldError='';inline.className='hcr-field-error';inline.textContent=message;
      field.after(inline);
    }
    field?.focus();
  }
  function isoDate(value) {
    const raw=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
    const match=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match?`${Number(match[3])>2400?Number(match[3])-543:match[3]}-${match[2]}-${match[1]}`:'';
  }
  function validateDates(surface) {
    const controls=claimControls(surface), values=claimValues(surface);
    const admit=isoDate(values.admitDate), discharge=isoDate(values.dischargeDate);
    if(!admit){showNativeError('กรุณาระบุวันที่เข้า รพ.',controls.admitDate);return false;}
    if(!values.admitTime){showNativeError('กรุณาระบุเวลาที่เข้า รพ.',controls.admitTime);return false;}
    if(!discharge){showNativeError('กรุณาระบุวันที่ออก รพ.',controls.dischargeDate);return false;}
    if(!values.dischargeTime){showNativeError('กรุณาระบุเวลาที่ออก รพ.',controls.dischargeTime);return false;}
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(admit>today){showNativeError('วันที่เข้า รพ. ต้องไม่เป็นวันในอนาคต',controls.admitDate);return false;}
    if(discharge<admit || (discharge===admit && values.dischargeTime && values.admitTime && values.dischargeTime<values.admitTime)){
      showNativeError('วันที่ออก รพ. ต้องไม่ก่อนวันที่เข้า รพ.',controls.dischargeDate);return false;
    }
    return true;
  }
  function isSaveButton(control) {return control.tagName==='BUTTON' && /ยืนยันบันทึกผลพิจารณา|^อนุมัติ$/.test(text(text(control.textContent).replace(/save|check_circle/g,'')));}
  function gate(surface) {
    if(!active || !surface) return;
    surface.querySelectorAll('.hospital-claim-content input,.hospital-claim-content select,.hospital-claim-content textarea,.hospital-claim-content button').forEach(control => {
      if(!locked.has(control)) locked.set(control,{disabled:control.disabled,readOnly:control.readOnly,tabIndex:control.getAttribute('tabindex')});
      const nativeSave=isSaveButton(control);
      if(nativeSave) control.dataset.hcrNativeSave='true';
      const nav=control.tagName==='BUTTON' && /^(กลับ|ถัดไป)$/.test(text(text(control.textContent).replace(/arrow_back|arrow_forward/g,'')));
      const decision=control.matches('.dd-decision-btn[data-decision]') || control.matches('.customerDecisionDynamicFields select,.customerDecisionDynamicFields textarea');
      const moneyControl=control.matches('[data-claimline-field="receipt"],[data-claimline-field="discount"],[data-claimline-field="uncovered"],[data-claimline-field="reason"]');
      const controls=Object.values(claimControls(surface));
      const claimControl=controls.includes(control) || controls.some(native=>native?._beDisplay===control) || control.id?.endsWith('ContinuousClaimSelectedDisplay');
      const allowed=nav || nativeSave || decision || moneyControl || claimControl;
      control.disabled=nativeSave || moneyControl || decision || claimControl ? false : locked.get(control).disabled || !allowed;
      if(moneyControl) {control.readOnly=false;if(control.getAttribute('tabindex')==='-1') control.removeAttribute('tabindex');}
      control.setAttribute('aria-disabled',String(control.disabled));
    });
    surface.querySelectorAll('[data-claim-choice="cause"],[data-claim-choice="coverage"],[data-claim-choice="treatment"]').forEach(control=>{
      control.disabled=true;control.setAttribute('aria-disabled','true');
    });
  }
  function clearGate() {
    locked.forEach((state,control) => {if(control.isConnected) {control.disabled=state.disabled;control.readOnly=state.readOnly;if(state.tabIndex===null) control.removeAttribute('tabindex');else control.setAttribute('tabindex',state.tabIndex);control.setAttribute('aria-disabled',String(state.disabled));delete control.dataset.hcrNativeSave;}});
    locked.clear();
  }
  function syncStayTotal(surface) {
    if(!active || !surface)return;
    const prefix=surface.id==='considerHospitalOpdHalfPage'?'hh':'hf';
    const stay=surface.querySelector(`#${prefix}StaySection`);if(!stay || stay.classList.contains('hidden'))return;
    const ipd=Number(surface.querySelector(`#${prefix}IpdDays`)?.value||0),icu=Number(surface.querySelector(`#${prefix}IcuDays`)?.value||0);
    if(!Number.isFinite(ipd)||!Number.isFinite(icu))return;
    const total=Math.max(0,ipd)+Math.max(0,icu);
    const input=surface.querySelector(`#${prefix}TotalStayDays`),display=surface.querySelector(`#${prefix}TotalStayDaysDisplay`);
    if(input)input.value=String(total);if(display)display.textContent=String(total);
  }
  function scheduleGate() {window.requestAnimationFrame(() => window.requestAnimationFrame(() => {if(active) gate(page());}));window.setTimeout(() => {if(active) gate(page());},80);}
  function expenseLines(surface) {
    const pane=surface.querySelector(`#${paneId(surface)}`);
    const lines=[];
    pane?.querySelectorAll('table').forEach(table => {
      const headings=Array.from(table.querySelectorAll('thead th'),cell => text(cell.textContent));
      const indexes=Object.fromEntries(Object.entries(moneyFields).map(([id,label]) => [id,headings.findIndex(heading => heading.includes(label))]));
      if(indexes.receipt<0 || indexes.discount<0 || indexes.uncovered<0) return;
      table.querySelectorAll('tbody tr').forEach(tr => {
        const cells=Array.from(tr.querySelectorAll('td'));
        const controls=Object.fromEntries(Object.entries(indexes).map(([id,index]) => [id,cells[index]?.querySelector('input')]));
        if(Object.values(controls).some(control => !control)) return;
        const name=text(cells[0]?.querySelector('select')?.value || cells[0]?.textContent) || `รายการที่ ${lines.length+1}`;
        const reason=tr.querySelector('[data-claimline-field="reason"]');
        lines.push({name,values:{...Object.fromEntries(Object.entries(controls).map(([id,control]) => [id,control.value.trim()])),reason:reason?.value.trim() || ''},reasons:Array.from(reason?.options || [],option => ({value:option.value,label:option.textContent.trim()}))});
      });
    });
    return lines;
  }
  function snapshot(surface,item) {
    const lastDecision=Array.isArray(item?.statusHistory) ? item.statusHistory.filter(event => text(event.action)==='บันทึกผลพิจารณา').at(-1) : null;
    const card=Array.from(surface.querySelectorAll('[data-hospital-pane="transactions"] .timeline-card')).find(node => text(node.querySelector('.timeline-title')?.textContent)==='บันทึกผลพิจารณา');
    return {decision:text(lastDecision?.status || card?.querySelector('.timeline-status')?.textContent || item?.itemStatus || 'อนุมัติ'),reason:text(lastDecision?.reason || item?.statusReason),detail:text(lastDecision?.detail || item?.statusDetail),lines:expenseLines(surface),claim:claimValues(surface)};
  }
  function differences(before,after) {
    const changes=[['decision','ผลการพิจารณา'],['reason','สาเหตุของผล'],['detail','รายละเอียดของผล']].filter(([id]) => (before[id] || '')!==(after[id] || '')).map(([id,label]) => ({label,before:before[id] || '—',after:after[id] || '—'}));
    Object.entries(claimLabels).forEach(([id,label])=>{if(before.claim?.[id]!==after.claim?.[id])changes.push({label,before:id==='continuous'?(before.claim?.[id]?'ใช่':'ไม่ใช่'):before.claim?.[id]||'—',after:id==='continuous'?(after.claim?.[id]?'ใช่':'ไม่ใช่'):after.claim?.[id]||'—'});});
    after.lines.forEach((line,index) => Object.entries(moneyFields).forEach(([id,label]) => {
      const prior=before.lines[index]?.values[id] || '';
      const latest=line.values[id] || '';
      if(Math.abs(amount(prior)-amount(latest))>.004) changes.push({label:`${line.name} · ${label}`,before:money(amount(prior)),after:money(amount(latest))});
    }));
    after.lines.forEach((line,index) => {const prior=before.lines[index]?.values.reason || '';if(prior!==line.values.reason) changes.push({label:`${line.name} · สาเหตุไม่คุ้มครอง`,before:prior || '—',after:line.values.reason || '—'});});
    return changes;
  }
  function totals(model) {
    const result={receipt:0,discount:0,uncovered:0};
    model.lines.forEach(line => Object.keys(result).forEach(id => {const value=amount(line.values[id]);if(Number.isFinite(value)) result[id]+=value;}));
    result.net=result.receipt-result.discount-result.uncovered;
    return result;
  }
  function amountControls(surface) {
    return Array.from(surface.querySelectorAll(`#${paneId(surface)} tbody tr`)).map(tr => Object.fromEntries([...Object.keys(moneyFields),'reason'].map(id => [id,tr.querySelector(`[data-claimline-field="${id}"]`)]))).filter(controls => Object.values(controls).every(Boolean));
  }
  function applyAmounts(surface,lines) {
    restoring=true;
    amountControls(surface).forEach((controls,index) => [...Object.keys(moneyFields),'reason'].forEach(id => {
      const next=lines[index]?.values[id];
      if(next===undefined || controls[id].value===next) return;
      controls[id].value=next;
      controls[id].dispatchEvent(new Event('input',{bubbles:true}));
      controls[id].dispatchEvent(new Event('change',{bubbles:true}));
    }));
    restoring=false;
  }
  function close(toHistory) {
    const surface=page();
    document.getElementById('hcrConfirmDialog')?.remove();
    surface?.querySelector('[data-hcr-native-banner]')?.remove();
    surface?.querySelectorAll('[data-hcr-native-actions]').forEach(node => node.remove());
    surface?.classList.remove('hcr-active');
    clearGate();
    active=null;
    window.customerDecisionState={...(window.customerDecisionState || {}),type:''};
    window.syncCustomerDecisionUI?.();
    if(toHistory) window.setHospitalMainTab?.('transactions');
  }
  function open() {
    const surface=page(), item=row();
    if(!surface || !item) return;
    if(surface.id==='considerHospitalOpdHalfPage') window.setHospitalHalfStep?.(2);
    else window.setHospitalFullStep?.(2);
    const model=records.get(key(item))?.current || snapshot(surface,item);
    close(false); window.setHospitalMainTab?.('claim');
    active={key:key(item),before:structuredClone(model),lines:structuredClone(model.lines),reason:'',detail:''};
    window.customerDecisionState={...(window.customerDecisionState || {}),type:''};
    window.syncCustomerDecisionUI?.();
    if(surface.id==='considerHospitalOpdHalfPage') window.setHospitalHalfStep?.(1);
    else window.setHospitalFullStep?.(1);
    const host=surface.querySelector('[data-hospital-pane="claim"]'); if(!host) return;
    const banner=document.createElement('div');banner.className='hcr-native-banner';banner.dataset.hcrNativeBanner='';
    const previousDecision=model.decision || '—';
    const previousTone=/ปฏิเสธ|ยกเลิก|ไม่อนุมัติ/.test(previousDecision)?'danger':/อนุมัติ/.test(previousDecision)?'success':'neutral';
    const previousIcon=previousTone==='success'?'check_circle':previousTone==='danger'?'cancel':'info';
    banner.innerHTML=`<span class="hcr-banner-icon" aria-hidden="true"><span class="material-icons-round">fact_check</span></span><div class="hcr-banner-copy"><strong>พิจารณาใหม่อีกครั้ง</strong><p>ตรวจสอบข้อมูลและเลือกผลการพิจารณาครั้งใหม่</p><p data-hcr-native-error role="alert" hidden></p></div><div class="hcr-banner-previous" data-tone="${previousTone}"><span class="hcr-previous-label">ผลการพิจารณาครั้งก่อน</span><strong><span class="material-icons-round" aria-hidden="true">${previousIcon}</span>${esc(previousDecision)}</strong></div>`;
    host.prepend(banner);surface.classList.add('hcr-active');gate(surface);scheduleGate();banner.scrollIntoView({block:'start'});
  }
  function save(approve=false) {
    const surface=page(), item=row(); if(!surface || !item || !active || active.key!==key(item)) return;
    const before=active.before;
    const fields=decisionFields(surface);
    const after={decision:approve?'อนุมัติ':decisionLabels[window.customerDecisionState?.type] || '',reason:approve?'':fields.reason?.value.trim() || active.reason,detail:approve?'':fields.detail?.value.trim() || active.detail,lines:expenseLines(surface),claim:claimValues(surface)};
    const error=surface.querySelector('[data-hcr-native-error]');if(error) error.hidden=true;
    if(!after.decision) {showNativeError('กรุณาเลือกผลการพิจารณา',surface.querySelector('.dd-decision-btn[data-decision]'));return;}
    if(decisions[after.decision] && !after.reason) {showNativeError(`กรุณาระบุ${decisions[after.decision].label}`,fields.reason);return;}
    if(!validateDates(surface))return;
    const treatment=window.hospitalClaimSelectionState?.treatment || item.treatmentType || '';
    if((/IPD/i.test(treatment) && after.claim.ipdDays==='') || ['ipdDays','icuDays'].some(id=>after.claim[id]!=='' && (!Number.isInteger(Number(after.claim[id]))||Number(after.claim[id])<0))){showNativeError('กรุณาตรวจสอบจำนวน IPD และจำนวน ICU',claimControls(surface).ipdDays);return;}
    if(!validateExpenses(surface,after.lines)) return;
    const changes=differences(before,after);
    if(!changes.length) {showNativeError('กรุณาเปลี่ยนผลการพิจารณาหรือยอดเงิน');return;}
    const changedAmounts=after.lines.flatMap((line,index)=>Object.entries(moneyFields).filter(([id])=>Math.abs(amount(line.values[id])-amount(before.lines[index]?.values[id]))>.004).map(([id,label])=>({name:line.name,label,before:amount(before.lines[index]?.values[id]),after:amount(line.values[id])})));
    active.pending={after,changes,changedAmounts};
    showConfirm(after,changedAmounts);
  }
  function showConfirm(after,changedAmounts) {
    document.getElementById('hcrConfirmDialog')?.remove();
    const layer=document.createElement('div');layer.id='hcrConfirmDialog';layer.className='hcr-overlay';
    const amountReview=changedAmounts.length?'<section class="hcr-amount-review" role="alert"><div class="hcr-amount-review-head"><span class="material-icons-round" aria-hidden="true">warning_amber</span><div><strong>โปรดตรวจสอบยอดเงิน เนื่องจากไม่ตรงกับการพิจารณาครั้งก่อน</strong><p>ยอดที่เปลี่ยน '+changedAmounts.length+' รายการ · สามารถยืนยันบันทึกต่อได้</p></div></div><div class="hcr-amount-review-list">'+changedAmounts.map(change=>'<div class="hcr-amount-review-item"><strong>'+esc(change.name)+' · '+esc(change.label)+'</strong><div class="hcr-amount-review-values"><div><span>ยอดเดิม</span><b>'+money(change.before)+' <small>บาท</small></b></div><span class="material-icons-round" aria-hidden="true">arrow_forward</span><div><span>ยอดใหม่</span><b>'+money(change.after)+' <small>บาท</small></b></div></div></div>').join('')+'</div></section>':'';
    layer.innerHTML=`<div class="hcr-dialog hcr-confirm" role="dialog" aria-modal="true" aria-labelledby="hcrConfirmTitle"><header><span class="hcr-confirm-icon material-icons-round" aria-hidden="true">fact_check</span><div class="hcr-confirm-heading"><h2 id="hcrConfirmTitle">ผลพิจารณาครั้งใหม่</h2><p>ยืนยันบันทึกผลพิจารณา</p></div><button type="button" data-hcr-confirm-close aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button></header><div class="hcr-confirm-body"><p class="hcr-confirm-intro">ตรวจสอบข้อมูลก่อนบันทึกผลพิจารณาครั้งใหม่</p><div class="hcr-confirm-result"><span>ผลการพิจารณา</span><strong>${esc(after.decision)}</strong></div>${amountReview}</div><footer><button type="button" data-hcr-confirm-close>${changedAmounts.length?'กลับไปแก้ไข':'ยกเลิก'}</button><button type="button" data-hcr-confirm-save>${changedAmounts.length?'ยืนยันบันทึกต่อ':'ยืนยัน'}</button></footer></div>`;
    document.body.append(layer);layer.querySelector('[data-hcr-confirm-save]')?.focus();
  }
  function commit() {
    const surface=page(),item=row(),pending=active?.pending;if(!surface||!item||!pending)return;
    active.pending=null;
    const {after,changes,changedAmounts}=pending,before=active.before;
    const moneyChanged=changedAmounts.length>0;
    const expenseChanged=moneyChanged || after.lines.some((line,index) => line.values.reason!==(before.lines[index]?.values.reason || ''));
    if(expenseChanged) applyAmounts(surface,after.lines);
    if(moneyChanged) item.amount=money(totals(after).net);
    const prior=records.get(key(item)) || {events:[]};
    prior.current=after; prior.events.push({at:new Date(),changes,decision:after.decision,reason:after.reason,detail:after.detail}); records.set(key(item),prior);
    item.itemStatus=after.decision;
    item.statusReason=after.reason;
    item.statusDetail=after.detail;
    if(after.claim.continuous!==before.claim.continuous)item.isContinuous=after.claim.continuous;
    if(after.claim.admitDate!==before.claim.admitDate)item.admitDate=after.claim.admitDate;
    if(after.claim.admitTime!==before.claim.admitTime)item.admitTime=after.claim.admitTime;
    if(after.claim.dischargeDate!==before.claim.dischargeDate)item.dischargeDate=after.claim.dischargeDate;
    if(after.claim.dischargeTime!==before.claim.dischargeTime)item.dischargeTime=after.claim.dischargeTime;
    if(after.claim.ipdDays!==before.claim.ipdDays)item.ipdDays=Number(after.claim.ipdDays)||0;
    if(after.claim.icuDays!==before.claim.icuDays)item.icuDays=Number(after.claim.icuDays)||0;
    if(after.claim.ipdDays!==before.claim.ipdDays||after.claim.icuDays!==before.claim.icuDays){item.totalStayDays=(item.ipdDays||0)+(item.icuDays||0);if(item.claimDetailMock?.stayDays)Object.assign(item.claimDetailMock.stayDays,{ipd:item.ipdDays||0,icu:item.icuDays||0,total:item.totalStayDays});}
    close(false); window.setHospitalMainTab?.('transactions'); renderHistory();
  }
  function validateExpenses(surface,lines) {
    for(const [index,line] of lines.entries()) {
      const values=Object.fromEntries(Object.keys(moneyFields).map(id => [id,amount(line.values[id])]));
      if(Object.values(values).some(value => !Number.isFinite(value) || value<0) || values.discount+values.uncovered>values.receipt+.004) {
        showNativeError(`กรุณาตรวจสอบยอดเงินรายการที่ ${index+1}`,amountControls(surface)[index]?.receipt);return false;
      }
      if(values.uncovered>0 && !line.values.reason) {showNativeError(`กรุณาเลือกสาเหตุไม่คุ้มครองรายการที่ ${index+1}`,amountControls(surface)[index]?.reason);return false;}
    }
    return true;
  }
  function renderHistory() {
    const surface=page(), item=row(), pane=surface?.querySelector('[data-hospital-pane="transactions"]'), list=pane?.querySelector('.timeline-modern');
    if(!list || !item) return;
    list.querySelectorAll('[data-hcr-history]').forEach(node => node.remove());
    const events=records.get(key(item))?.events || [];
    events.forEach((event,index) => {
      const node=document.createElement('div'); node.className='timeline-row'; node.dataset.hcrHistory=String(index);
      node.innerHTML=`<div class="timeline-dot green"><span class="material-icons-round">task_alt</span></div><div class="timeline-card"><div class="timeline-date-block"><div><span class="timeline-date">${esc(stamp(event.at))}</span><div class="timeline-sub">ข้อมูลเดโมใน session</div></div></div><div class="timeline-meta"><div class="timeline-title">บันทึกผลพิจารณา ครั้งที่ ${index+2}</div><div class="timeline-sub">${esc(event.reason || 'พิจารณาใหม่')} · เปลี่ยน ${event.changes.length} ฟิลด์</div></div><div class="timeline-right"><span class="timeline-status">${esc(event.decision)}</span><button type="button" class="hcr-history-action" data-hcr-detail="${index}">ดูรายละเอียด</button></div></div>`;
      list.prepend(node);
    });
    const count=pane.querySelector('.hospital-count-pill'); if(count) count.textContent=`${list.querySelectorAll('.timeline-row').length} รายการ`;
  }
  function detail(index) {
    const item=row(), event=records.get(key(item))?.events[index]; if(!event) return;
    document.getElementById('hcrDialog')?.remove();
    const layer=document.createElement('div'); layer.id='hcrDialog'; layer.className='hcr-overlay';
    layer.innerHTML=`<div class="hcr-dialog" role="dialog" aria-modal="true" aria-labelledby="hcrDialogTitle"><header><h2 id="hcrDialogTitle">ประวัติการทำรายการ · บันทึกผลพิจารณา ครั้งที่ ${index+2}</h2><button type="button" data-hcr-close aria-label="ปิด"><span class="material-icons-round">close</span></button></header><p>วันเวลาทำรายการ : ${esc(stamp(event.at))} น.<br>เลข CL : ${esc(item.claimCode || item.claimNo)}<br>เลข Case : ${esc(item.caseNo || '')}<br>ผลการพิจารณา : ${esc(event.decision)}</p><div class="hcr-table-wrap"><table><thead><tr><th>ข้อมูล</th><th>ก่อนแก้ไข</th><th>หลังแก้ไข</th></tr></thead><tbody>${event.changes.map(change => `<tr><td>${esc(change.label)}</td><td>${esc(change.before || '—')}</td><td>${esc(change.after || '—')}</td></tr>`).join('')}</tbody></table></div></div>`;
    document.body.append(layer);
  }
  window.openHospitalReconsiderFromHistory = open;
  window.openHospitalReconsiderHistoryDetail = detail;
  function restoreAmounts() {const surface=page(), current=active?.key===key(row()) ? active : records.get(key(row()))?.current;if(surface && current?.lines) applyAmounts(surface,current.lines);}
  const previousOpen=window.openConsiderHospitalRow;
  if(typeof previousOpen==='function') window.openConsiderHospitalRow=function () { const result=previousOpen.apply(this,arguments); restoreAmounts(); window.setTimeout(restoreAmounts,0); renderHistory(); return result; };
  const previousTab=window.setHospitalMainTab;
  if(typeof previousTab==='function') window.setHospitalMainTab=function () { const result=previousTab.apply(this,arguments); if(arguments[0]==='transactions') renderHistory(); return result; };
  ['setHospitalFullStep','setHospitalHalfStep'].forEach(name => {const previous=window[name];if(typeof previous==='function') window[name]=function () {const result=previous.apply(this,arguments);if(Number(arguments[0])===2) {restoreAmounts();window.setTimeout(restoreAmounts,0);window.setTimeout(restoreAmounts,100);}if(active) {restoreDecisionFields(page());gate(page());scheduleGate();}return result;};});
  window.addEventListener('click',event => {
    if(!active) return;
    const button=event.target.closest?.('.hospital-claim-content button');
    if(!button || !page()?.contains(button)) return;
    if(button.matches('[data-claim-choice="cause"],[data-claim-choice="coverage"],[data-claim-choice="treatment"]')){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();return;
    }
    const label=text(text(button.textContent).replace(/save|arrow_back|arrow_forward|check_circle/g,''));
    if(!/^(กลับ|ถัดไป|ยืนยันบันทึกผลพิจารณา|อนุมัติ)$/.test(label)) return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const surface=page(), step=Number(visibleStep(surface)?.id.match(/(\d)$/)?.[1] || 1);
    const go=target => surface.id==='considerHospitalOpdHalfPage' ? window.setHospitalHalfStep?.(target) : window.setHospitalFullStep?.(target);
    if(step===2) active.lines=structuredClone(expenseLines(surface));
    if(label==='กลับ') {if(step===1){applyAmounts(surface,active.before.lines);applyClaimValues(surface,active.before.claim);close(true);}else go(step-1);}
    else if(label==='ถัดไป') {if((step!==1 || validateDates(surface)) && (step!==2 || validateExpenses(surface,active.lines))) go(Math.min(step+1,3));}
    else save(label==='อนุมัติ');
  },true);
  document.addEventListener('click',event => {
    if(event.target.closest('[data-hcr-confirm-save]')){commit();return;}
    if(event.target.closest('[data-hcr-confirm-close]') || event.target.id==='hcrConfirmDialog'){document.getElementById('hcrConfirmDialog')?.remove();if(active)active.pending=null;visibleStep(page())?.querySelector('[data-hcr-native-save]')?.focus();return;}
    if(event.target.closest('[data-hcr-cancel]')) {const surface=page();if(active && surface){applyAmounts(surface,active.before.lines);applyClaimValues(surface,active.before.claim);}close(true);return;}
    const saveButton=event.target.closest('[data-hcr-save]'); if(saveButton) {save(saveButton.hasAttribute('data-hcr-approve'));return;}
    const detailButton=event.target.closest('[data-hcr-detail]'); if(detailButton) {detail(Number(detailButton.dataset.hcrDetail));return;}
    if(event.target.closest('[data-hcr-close]') || event.target.id==='hcrDialog') document.getElementById('hcrDialog')?.remove();
    if(active && event.target.closest?.('.dd-decision-btn[data-decision]')) window.setTimeout(() => {if(active){restoreDecisionFields(page());gate(page());scheduleGate();}},0);
  });
  document.addEventListener('change',event => {
    if(!active || restoring) return;
    const surface=page();if(!surface?.contains(event.target)) return;
    if(event.target.matches('.customerDecisionDynamicFields select[id$="Reason"]')) active.reason=event.target.value;
    if(event.target.matches('[data-claimline-field="reason"]')) active.lines=expenseLines(surface);
  });
  document.addEventListener('input',event => {if(!active || restoring) return;const surface=page();if(!surface?.contains(event.target)) return;if(event.target.matches('.customerDecisionDynamicFields textarea[id$="Detail"]')) active.detail=event.target.value;if(event.target.matches('[data-claimline-field="receipt"],[data-claimline-field="discount"],[data-claimline-field="uncovered"]')) active.lines=expenseLines(surface);if(/^(hf|hh)(IpdDays|IcuDays)$/.test(event.target.id||''))window.setTimeout(()=>syncStayTotal(surface),0);if(/^(hf|hh)(Admit|Discharge)(Date|Time)$/.test(event.target.id||''))surface.querySelectorAll('[data-hcr-field-error]').forEach(node=>node.remove());});
  let refreshQueued=false;
  new MutationObserver(mutations => {
    if(!active || refreshQueued || !mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) return;
    refreshQueued=true;
    window.requestAnimationFrame(() => {refreshQueued=false;if(!active)return;const surface=page();if(surface){gate(surface);scheduleGate();}});
  }).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(mutations=>{
    if(!active)return;
    mutations.forEach(mutation=>{
      const control=mutation.target;
      if(control.matches?.('[data-claim-choice="cause"],[data-claim-choice="coverage"],[data-claim-choice="treatment"]') && page()?.contains(control) && !control.disabled){
        control.disabled=true;control.setAttribute('aria-disabled','true');
      }
      if(control.tagName==='BUTTON' && page()?.contains(control) && isSaveButton(control) && control.disabled){
        control.disabled=false;control.setAttribute('aria-disabled','false');
      }
    });
  }).observe(document.body,{attributes:true,attributeFilter:['disabled'],subtree:true});
})();
