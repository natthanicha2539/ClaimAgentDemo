/* พิจารณาเคลม > เคลมโรงพยาบาล > ประวัติการทำรายการ: การ์ดและรายละเอียด */
(function () {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const page = () => document.querySelector('#considerHospitalOpdFullPage:not(.hidden), #considerHospitalOpdHalfPage:not(.hidden)');
  const clean = value => String(value || '').replace(/\s+/g,' ').trim();
  let lastFocus = null;
  let observer = null;
  let observedList = null;
  let queued = false;

  function close(restoreFocus=true) {
    document.getElementById('hhdDialog')?.remove();
    document.removeEventListener('keydown', onKey);
    if(restoreFocus && lastFocus?.isConnected) lastFocus.focus();
  }
  function onKey(event) {
    if(event.key==='Escape') {close();return;}
    if(event.key!=='Tab') return;
    const nodes=Array.from(document.querySelectorAll('#hhdDialog button'));
    if(!nodes.length) return;
    if(event.shiftKey && document.activeElement===nodes[0]) {event.preventDefault();nodes.at(-1).focus();}
    else if(!event.shiftKey && document.activeElement===nodes.at(-1)) {event.preventDefault();nodes[0].focus();}
  }
  function decisionCard(card) { return /^บันทึกผลพิจารณา(?: ครั้งที่ \d+)?$/.test(clean(card.querySelector('.timeline-title')?.textContent)); }
  function action(card, selector) {return card.querySelector(selector);}
  function open(card, trigger) {
    const editIndex=card?.dataset.hceDetailIndex ?? card?.querySelector('[data-hce-detail]')?.dataset.hceDetail;
    if(editIndex!==undefined){window.openHospitalClaimEditHistoryDetail?.(Number(editIndex));return;}
    const surface=page(), item=window.currentConsiderHospitalRow;
    if(!surface || !item || !card) return;
    lastFocus=trigger;
    close(false);
    const titleNode=card.querySelector('.timeline-title');
    const title=(clean(titleNode?.textContent) + (titleNode?.dataset.hhdSuffix || '')).trim() || 'รายละเอียดรายการ';
    const summary=clean(card.querySelector('.timeline-meta .timeline-sub')?.textContent);
    const date=clean(card.querySelector('.timeline-date')?.textContent) || '—';
    const actor=clean(card.querySelector('.timeline-date-block .timeline-sub')?.textContent) || '—';
    const status=clean(card.querySelector('.timeline-status')?.textContent);
    const decision=decisionCard(card);
    const hasChanges=!!(action(card,'[data-hcr-detail]') || action(card,'[data-hce-detail]'));
    const tone=/ปฏิเสธ|ไม่อนุมัติ|ยกเลิก/.test(status)?'rejected':/อนุมัติ|สำเร็จ/.test(status)?'approved':'pending';
    const body=decision
      ? `<section class="hhd-decision ${tone}"><span class="material-icons-round" aria-hidden="true">${tone==='approved'?'task_alt':tone==='rejected'?'cancel':'fact_check'}</span><div><small>ผลการพิจารณา</small><strong>${esc(status || '—')}</strong><p>ผลการพิจารณาที่บันทึกไว้</p></div></section>${hasChanges?'<button type="button" class="hhd-changes" data-hhd-changes>ดูค่าที่แก้ไขในครั้งนี้</button>':''}<footer><button type="button" class="hhd-primary" data-hhd-reconsider>พิจารณาใหม่อีกครั้ง</button><button type="button" class="hhd-secondary" data-hhd-edit>แก้ไขข้อมูลเคลม</button></footer>`
      : `<section class="hhd-summary"><span class="material-icons-round" aria-hidden="true">${/โอน|ชำระ/.test(title)?'payments':/ร่าง/.test(title)?'edit_document':'description'}</span><div><small>รายละเอียดรายการ</small><strong>${esc(title)}</strong><p>${esc(summary || '—')}</p></div></section>${hasChanges?'<footer><button type="button" class="hhd-secondary" data-hhd-changes>ดูค่าที่แก้ไข</button></footer>':''}`;
    const layer=document.createElement('div');layer.id='hhdDialog';layer.className='hhd-overlay';layer.__sourceCard=card;
    layer.innerHTML=`<div class="hhd-dialog${decision?' hhd-decision-dialog':''}" role="dialog" aria-modal="true" aria-labelledby="hhdDialogTitle"><header class="hhd-dialog-head"><div class="hhd-heading"><span>ประวัติการทำรายการ</span><h2 id="hhdDialogTitle">${esc(title)}</h2></div><button type="button" class="hhd-close" data-hhd-close aria-label="ปิดรายละเอียด"><span class="material-icons-round" aria-hidden="true">close</span></button><dl class="hhd-meta"><div><dt>วันเวลาทำรายการ</dt><dd>${esc(date)}</dd></div><div><dt>ผู้ทำรายการ</dt><dd>${esc(actor)}</dd></div><div><dt>เลข CL</dt><dd>${esc(item.claimCode || item.claimNo || '—')}</dd></div><div><dt>เลข Case</dt><dd>${esc(item.caseNo || '—')}</dd></div></dl></header><div class="hhd-dialog-body">${body}</div></div>`;
    document.body.append(layer);
    layer.querySelector('[data-hhd-close]')?.focus();
    document.addEventListener('keydown',onKey);
    layer.addEventListener('click',event => {
      if(event.target===layer || event.target.closest('[data-hhd-close]')) {close();return;}
      if(event.target.closest('[data-hhd-edit]')) {close(false);window.openHospitalClaimEditFromHistory?.();return;}
      if(event.target.closest('[data-hhd-reconsider]')) {close(false);window.openHospitalReconsiderFromHistory?.();return;}
      if(event.target.closest('[data-hhd-changes]')) {
        const reconsider=card.querySelector('[data-hcr-detail]');
        const edit=card.querySelector('[data-hce-detail]');
        close(false);
        if(reconsider) window.openHospitalReconsiderHistoryDetail?.(Number(reconsider.dataset.hcrDetail));
        else if(edit) window.openHospitalClaimEditHistoryDetail?.(Number(edit.dataset.hceDetail));
      }
    });
  }
  function enhance() {
    queued=false;
    const surface=page(), list=surface?.querySelector('[data-hospital-pane="transactions"] .timeline-modern');
    if(!list) return;
    if(observedList!==list) {observer?.disconnect();observedList=list;observer=new MutationObserver(schedule);observer.observe(list,{childList:true});}
    const cards=Array.from(list.querySelectorAll('.timeline-card'));
    let decisionNumber=cards.filter(decisionCard).length;
    cards.forEach(card => {
      if(!card.dataset.hhdEnhanced) {
        card.dataset.hhdEnhanced='true';
        const button=document.createElement('button');button.type='button';button.className='hhd-detail-link';button.dataset.hhdDetail='';button.innerHTML='ดูรายละเอียด <span aria-hidden="true">→</span>';
        button.addEventListener('click',event => {event.preventDefault();open(card,button);});
        card.querySelector('.timeline-right')?.append(button);
      }
      const title=card.querySelector('.timeline-title');
      if(decisionCard(card) && title) {
        const suffix=/ครั้งที่ \d+/.test(clean(title.textContent))?'':` ครั้งที่ ${decisionNumber}`;
        decisionNumber--;
        if(title.dataset.hhdSuffix!==suffix) title.dataset.hhdSuffix=suffix;
      }
      const dot=card.closest('.timeline-row')?.querySelector('.timeline-dot .material-icons-round');
      if(dot) {
        const icon=decisionCard(card)?'fact_check':/โอน|ชำระ/.test(title?.textContent||'')?'payments':/ร่าง/.test(title?.textContent||'')?'edit_document':/เคส/.test(title?.textContent||'')?'folder_open':'description';
        if(dot.textContent!==icon) dot.textContent=icon;
      }
    });
    const pane=surface.querySelector('[data-hospital-pane="transactions"]');
    if(pane && !pane.classList.contains('hhd-history')) pane.classList.add('hhd-history');
    const pill=pane?.querySelector('.hospital-count-pill');
    const count=`${cards.length} รายการ`;
    if(pill && pill.textContent!==count) pill.textContent=count;
  }
  function schedule() {if(queued)return;queued=true;queueMicrotask(enhance);}
  ['openConsiderHospitalRow','setHospitalMainTab'].forEach(name => {const previous=window[name];if(typeof previous!=='function')return;window[name]=function () {const result=previous.apply(this,arguments);schedule();return result;};});
  ['considerHospitalOpdFullPage','considerHospitalOpdHalfPage'].forEach(id => {
    const surface=document.getElementById(id);
    if(surface) new MutationObserver(schedule).observe(surface,{attributes:true,attributeFilter:['class'],childList:true});
  });
  schedule();
})();
