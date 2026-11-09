/* พิจารณาเคลม > Death & Disability > ประวัติการทำรายการ */
(function () {
  'use strict';
  const histories = new Map();
  const savedFields = new Map();
  const actor = '06590 - ณัฏฐณิชา โตรักษา';
  let reconsidering = false;
  let activeClaim = '';
  let returnFocus = null;
  const resultLabels = {wait:'กำลังพิจารณา',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก',approve:'อนุมัติ'};
  const resultStatuses = {wait:'อยู่ระหว่างการทำรายการ',edit:'รอแก้ไข',reject:'ปฏิเสธ',cancel:'ยกเลิก',approve:'อนุมัติ'};
  const statusClasses = {wait:'progress',edit:'edit',reject:'reject',cancel:'cancel',approve:'approve'};
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));
  const timeLabel = stamp => stamp ? new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(stamp))+' น.' : '—';
  function thaiStamp(value) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    return match ? new Date(Number(match[3])-543,Number(match[2])-1,Number(match[1]),Number(match[4]),Number(match[5]),Number(match[6])).toISOString() : '';
  }
  function page() { return document.getElementById('considerDeathDetailPage'); }
  function rowFor(claimCode = activeClaim || page()?.querySelector('#ddClaimCodeValue')?.textContent.trim()) {
    return (window.considerationDeathRows || []).find(item => item.claimCode === claimCode);
  }
  function claimKey() {
    const claimNo = (page()?.querySelector('#ddClaimCodeValue')?.textContent || activeClaim).trim();
    const caseNo = page()?.querySelector('#ddCaseCodeValue')?.textContent.trim() || '';
    return claimNo + '|' + caseNo;
  }
  function coverage() { return (page()?.querySelector('#ddCoverageTypeValue')?.textContent || '').trim(); }
  function isDisability() { return coverage() === 'ทุพพลภาพ/สูญเสียอวัยวะ'; }
  function detailValue(label) {
    const nodes = Array.from(page()?.querySelectorAll('#ddClaimDetailGrid > div') || []);
    const row = nodes.find(node => node.querySelector('.dd-field-label')?.textContent.replace(/\s*:\s*$/, '').trim() === label);
    return row?.querySelector('.dd-field-value')?.textContent.trim() || '';
  }
  function setDetailValue(label, value) {
    const nodes = Array.from(page()?.querySelectorAll('#ddClaimDetailGrid > div') || []);
    const row = nodes.find(node => node.querySelector('.dd-field-label')?.textContent.replace(/\s*:\s*$/, '').trim() === label);
    if (row?.querySelector('.dd-field-value')) row.querySelector('.dd-field-value').textContent = value;
    else if (value) {
      const item = document.createElement('div');
      item.innerHTML = '<div class="dd-field-label">'+esc(label)+' :</div><div class="dd-field-value">'+esc(value)+'</div>';
      page()?.querySelector('#ddClaimDetailGrid')?.appendChild(item);
    }
  }
  function currentValues() {
    const values = savedFields.get(claimKey());
    if (values) return {...values};
    return {
      cause: detailValue('เหตุของการเคลม'),
      coverage: coverage(),
      treatment: detailValue('ประเภทการรักษา') || detailValue(isDisability() ? 'สาเหตุการทุพพลภาพ/สูญเสียอวัยวะ' : 'สาเหตุการเสียชีวิต'),
      loss: isDisability() ? (detailValue('รายละเอียดการสูญเสีย') || page()?.querySelector('#ddExpenseGrid tbody td:nth-child(2)')?.textContent.trim() || '') : ''
    };
  }
  function applyValues(values) {
    setDetailValue('เหตุของการเคลม', values.cause);
    setDetailValue('ประเภทความคุ้มครอง', values.coverage);
    setDetailValue('ประเภทการรักษา', values.treatment);
    if (isDisability()) setDetailValue('รายละเอียดการสูญเสีย', values.loss);
  }
  function decision() {
    return resultLabels[page()?.querySelector('#ddDecisionSection .dd-decision-btn.active')?.dataset.decision] || '';
  }
  function seedDecisionHistory() {
    const key = claimKey();
    if (histories.has(key)) return;
    const row = rowFor();
    if (!['รอแก้ไข','ปฏิเสธ','อนุมัติ'].includes(row?.status)) return;
    const stamp = thaiStamp(row.date) || new Date().toISOString();
    const values = currentValues();
    histories.set(key,[{id:'dd-decision-seed-'+row.claimCode,stamp,result:row.status,before:{...values},after:{...values}}]);
  }
  function renderPaidTransferWarning() {
    const section = page()?.querySelector('#ddDecisionSection');
    section?.querySelector('#ddrPaidTransferWarning')?.remove();
    if (!reconsidering || !section) return;
    const claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim();
    const transfers = (window.deathTransferPendingRows || []).filter(item =>
      item.claimNo === claimNo && (item.statusKey === 'success' || item.statusFilter === 'success' || item.status === 'โอนสำเร็จ')
    );
    if (!transfers.length) return;
    const amount = transfers.reduce((total, item) => total + (Number(String(item.amount || 0).replace(/,/g, '')) || 0), 0);
    const references = transfers.map(item => item.refNo).filter(Boolean).join(', ');
    const warning = document.createElement('div');
    warning.id = 'ddrPaidTransferWarning';
    warning.className = 'ddr-paid-transfer-warning';
    warning.setAttribute('role', 'alert');
    warning.innerHTML = `<span class="material-icons-round" aria-hidden="true">warning_amber</span><div><strong>เคลมนี้มีรายการโอนสำเร็จแล้ว</strong><p>จำนวนเงินที่โอนสำเร็จแล้ว ${esc(amount.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}))} บาท (${transfers.length} รายการ) กรุณาตรวจสอบยอดที่ยืนยันจ่ายและจำนวนเงินโอนก่อนยืนยันบันทึกผลพิจารณาใหม่</p>${references ? `<small>เลขอ้างอิงการโอน: ${esc(references)}</small>` : ''}</div>`;
    section.querySelector('.dd-doc-title')?.after(warning);
  }
  const money = value => Number(value || 0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
  const numericAmount = value => Number(String(value || '').replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  function transferReview(selected) {
    if (!reconsidering || !['approve','reject','cancel'].includes(selected)) return null;
    const claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim();
    const transfers = (window.deathTransferPendingRows || []).filter(item => item.claimNo === claimNo);
    const paid = transfers.filter(item => item.statusKey === 'success' || item.statusFilter === 'success' || item.status === 'โอนสำเร็จ');
    const pending = transfers.filter(item => item.statusFilter === 'pending');
    const paidAmount = paid.reduce((sum, item) => sum + numericAmount(item.amount), 0);
    const pendingAmount = pending.reduce((sum, item) => sum + numericAmount(item.amount), 0);
    const approvedAmount = numericAmount(page()?.querySelector('#ddPayTotal')?.textContent);
    const differenceCents = Math.round(approvedAmount * 100) - Math.round(paidAmount * 100);
    const difference = differenceCents / 100;
    const refs = paid.map(item => item.refNo).filter(Boolean).join(', ');
    const pendingRefs = pending.map(item => item.refNo).filter(Boolean).join(', ');
    if (selected === 'approve' && paid.length && pending.length) {
      const remaining = Math.max(0, difference);
      return {
        title:differenceCents > 0 ? 'คงยอดที่โอนสำเร็จและอัปเดตรายการรอโอน' : differenceCents === 0 ? 'ยอดใหม่เท่ากับยอดที่โอนสำเร็จแล้ว' : 'ยอดใหม่ต่ำกว่ายอดที่โอนสำเร็จแล้ว',
        description:differenceCents > 0 ? 'เมื่อยืนยัน ระบบจะคงรายการโอนสำเร็จเดิม ปรับยอดรายการรอโอนตามส่วนที่เหลือ แล้วบันทึกผลพิจารณาครั้งใหม่' : differenceCents === 0 ? 'เมื่อยืนยัน ระบบจะคงรายการโอนสำเร็จเดิม ยกเลิกรายการรอโอนที่เหลือ แล้วบันทึกผลพิจารณาครั้งใหม่' : 'เมื่อยืนยัน ระบบจะคงรายการโอนสำเร็จเดิม ยกเลิกรายการรอโอนที่เหลือ แล้วบันทึกผลพิจารณาครั้งใหม่ กรุณาติดตามคืนเงินส่วนที่จ่ายเกิน',
        rows:[['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],['ยอดที่โอนสำเร็จแล้ว',money(paidAmount)+' บาท'],['ยอดรอโอนเดิม',money(pendingAmount)+' บาท'],['ยอดรอโอนหลังยืนยัน',money(remaining)+' บาท'],...(differenceCents < 0 ? [['ยอดที่ต้องติดตามคืน',money(-difference)+' บาท']] : [])],
        reference:[refs,pendingRefs].filter(Boolean).join(', '),
        tone:differenceCents === 0 ? 'success' : differenceCents > 0 ? 'info' : 'warning',
        status:'โอนสำเร็จ + รอโอน',
        skipTransfer:true,
        reconcilePendingAmount:remaining
      };
    }
    if (selected === 'approve' && paid.length) {
      if (differenceCents > 0) return {title:'ยอดอนุมัติใหม่มากกว่ายอดที่โอนเงินสำเร็จแล้ว', description:'เมื่อยืนยันบันทึก ผลพิจารณาจะเปลี่ยนเป็นยอดใหม่ โดยไม่เปลี่ยนรายการโอนเดิม กรุณาตรวจสอบการจ่ายส่วนต่าง', rows:[['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],['ยอดที่โอนเงินสำเร็จแล้ว',money(paidAmount)+' บาท'],['ยอดเงินส่วนต่าง',money(difference)+' บาท']], reference:refs, status:'โอนสำเร็จ', skipTransfer:true};
      if (differenceCents < 0) return {title:'ยอดอนุมัติใหม่น้อยกว่ายอดที่โอนเงินสำเร็จแล้ว', description:'เมื่อยืนยันบันทึก ผลพิจารณาจะเปลี่ยนเป็นยอดใหม่ โดยไม่ดึงเงินคืนอัตโนมัติ กรุณาติดตามคืนเงิน', rows:[['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],['ยอดที่โอนเงินสำเร็จแล้ว',money(paidAmount)+' บาท'],['ยอดที่ต้องติดตามคืน',money(-difference)+' บาท']], reference:refs, status:'โอนสำเร็จ', skipTransfer:true};
      return {title:'ยอดอนุมัติใหม่เท่ากับยอดที่โอนเงินสำเร็จแล้ว', description:'เมื่อกด ยืนยันบันทึกต่อ ระบบจะบันทึกผลพิจารณาครั้งใหม่ โดยไม่เปลี่ยนรายการที่โอนสำเร็จ', rows:[['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],['ยอดที่โอนเงินสำเร็จแล้ว',money(paidAmount)+' บาท'],['ยอดส่วนต่าง','0.00 บาท']], reference:refs, status:'โอนสำเร็จ', tone:'success', skipTransfer:true};
    }
    if (selected === 'approve' && pending.length) {
      const pendingDifference = Math.round((approvedAmount - pendingAmount) * 100) / 100;
      return {
        title:'อัปเดตยอดเงินของรายการรอโอน',
        description:'เมื่อกด ยืนยันบันทึกต่อ ระบบจะอัปเดตยอดเงินของรายการรอโอนตามผลพิจารณาใหม่ แล้วบันทึกผลพิจารณาครั้งใหม่',
        rows:[
          ['จำนวนรายการรอโอน',pending.length+' รายการ'],
          ['ยอดรอโอนเดิม',money(pendingAmount)+' บาท'],
          ['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],
          ['ยอดส่วนต่าง',(pendingDifference > 0 ? '+' : pendingDifference < 0 ? '−' : '')+money(Math.abs(pendingDifference))+' บาท']
        ],
        reference:pendingRefs,
        tone:'info',
        status:'รอโอน'
      };
    }
    if (selected === 'approve') return {title:'ยังไม่มีรายการโอนสำหรับเคลมนี้',description:'เมื่อยืนยันผลอนุมัติ ระบบจะสร้างรายการรอโอน กรุณาตรวจสอบผู้รับผลประโยชน์และบัญชีก่อนดำเนินการ',rows:[['ยอดอนุมัติใหม่',money(approvedAmount)+' บาท'],['ยอดที่โอนเงินสำเร็จแล้ว','0.00 บาท']]};
    if (paid.length) return {title:'เคลมนี้โอนเงินสำเร็จแล้ว',description:'เมื่อยืนยันบันทึกผล'+(selected === 'cancel' ? 'ยกเลิก' : 'ปฏิเสธ')+' ระบบจะไม่ดึงเงินคืนอัตโนมัติ'+(pending.length ? ' และยกเลิกรายการรอโอนที่เหลือ' : '')+' กรุณาติดตามคืนเงิน',rows:[['ยอดที่โอนเงินสำเร็จแล้ว',money(paidAmount)+' บาท'],...(pending.length ? [['ยอดรอโอนที่จะยกเลิก',money(pendingAmount)+' บาท']] : []),['ยอดที่ต้องติดตามคืน',money(paidAmount)+' บาท']],reference:[refs,pendingRefs].filter(Boolean).join(', '),status:'โอนสำเร็จ'};
    if (pending.length) return {title:'มีรายการรอโอนที่จะถูกยกเลิก',description:'เมื่อยืนยันบันทึกผล'+(selected === 'cancel' ? 'ยกเลิก' : 'ปฏิเสธ')+' ระบบจะยกเลิกรายการรอโอนของเคลมนี้',rows:[['จำนวนรายการรอโอน',pending.length+' รายการ'],['ยอดรอโอนรวม',money(pendingAmount)+' บาท']],reference:pendingRefs,status:'รอโอน'};
    return null;
  }
  function showTransferReview(review, resultLabel, onConfirm) {
    document.getElementById('ddrConfirmDialog')?.remove();
    const focusTarget = document.activeElement;
    const layer = document.createElement('div');
    layer.id = 'ddrConfirmDialog';
    layer.className = 'ddr-confirm-overlay';
    const tone = review.tone === 'success' ? 'success' : review.tone === 'info' ? 'info' : 'warning';
    const resultTone = resultLabel === 'อนุมัติ' ? 'approved' : ['ปฏิเสธ','ยกเลิก'].includes(resultLabel) ? 'negative' : 'neutral';
    const claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim() || '—';
    layer.innerHTML = `<div class="ddr-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ddrConfirmTitle">
      <header class="ddr-confirm-head"><span class="ddr-confirm-icon material-icons-round" aria-hidden="true">fact_check</span><div><h2 id="ddrConfirmTitle">ผลพิจารณาครั้งใหม่</h2><p>ยืนยันบันทึกผลพิจารณา</p></div><button type="button" class="ddr-confirm-close" data-ddr-back aria-label="ปิดหน้าต่าง"><span class="material-icons-round" aria-hidden="true">close</span></button></header>
      <div class="ddr-confirm-body"><p>ตรวจสอบข้อมูลก่อนบันทึกผลพิจารณาครั้งใหม่ · ${esc(claimNo)}</p><div class="ddr-confirm-result is-${resultTone}"><span>ผลการพิจารณา</span><strong>${esc(resultLabel)}</strong></div>
      <section class="ddr-confirm-warning is-${tone}" role="${tone === 'success' ? 'status' : 'alert'}"><div class="ddr-confirm-warning-head"><span class="material-icons-round" aria-hidden="true">${tone === 'success' ? 'task_alt' : tone === 'info' ? 'sync' : 'warning_amber'}</span><div><h3>${esc(review.title)}</h3><p>${esc(review.description)}</p></div>${review.status ? `<span class="ddr-confirm-status">${esc(review.status)}</span>` : ''}</div><dl>${review.rows.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${review.reference ? `<small>เลขอ้างอิงการโอน: ${esc(review.reference)}</small>` : ''}</section>
      <div class="ddr-confirm-actions"><button type="button" data-ddr-back>กลับไปแก้ไข</button><button type="button" data-ddr-confirm>ยืนยันบันทึกต่อ</button></div></div></div>`;
    const close = () => { layer.remove(); focusTarget?.focus?.(); };
    let submitted = false;
    layer.addEventListener('click', event => {
      if (event.target === layer || event.target.closest('[data-ddr-back]')) close();
      if (event.target.closest('[data-ddr-confirm]') && !submitted) { submitted = true; layer.remove(); onConfirm(); }
    });
    layer.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.body.appendChild(layer);
    layer.querySelector('[data-ddr-confirm]')?.focus();
  }
  const demoCases = [
    {id:'none-approve',label:'ไม่มีรายการโอน · อนุมัติ',decision:'approve',state:'none'},
    {id:'pending-approve',label:'รอโอน · อนุมัติ',decision:'approve',state:'pending',offset:-20000},
    {id:'paid-equal',label:'โอนสำเร็จ · อนุมัติยอดเท่าเดิม',decision:'approve',state:'success',offset:0},
    {id:'paid-increase',label:'โอนสำเร็จ · อนุมัติยอดเพิ่ม',decision:'approve',state:'success',offset:-20000},
    {id:'paid-decrease',label:'โอนสำเร็จ · อนุมัติยอดลด',decision:'approve',state:'success',offset:20000},
    {id:'pending-reject',label:'รอโอน · ปฏิเสธ',decision:'reject',state:'pending',offset:0},
    {id:'pending-cancel',label:'รอโอน · ยกเลิก',decision:'cancel',state:'pending',offset:0},
    {id:'paid-reject',label:'โอนสำเร็จ · ปฏิเสธ',decision:'reject',state:'success',offset:0},
    {id:'paid-cancel',label:'โอนสำเร็จ · ยกเลิก',decision:'cancel',state:'success',offset:0},
    {id:'mixed-approve',label:'โอนสำเร็จ + รอโอน · อนุมัติ',decision:'approve',state:'mixed'},
    {id:'none-reject',label:'ไม่มีรายการโอน · ปฏิเสธ',decision:'reject',state:'none'},
    {id:'none-cancel',label:'ไม่มีรายการโอน · ยกเลิก',decision:'cancel',state:'none'}
  ];
  let demoSnapshot = null;
  let activeDemoCase = '';
  function restoreDemoRows(clear = true) {
    if (!demoSnapshot) return;
    const rows = window.deathTransferPendingRows || [];
    for (let index = rows.length - 1; index >= 0; index -= 1) if (rows[index].claimNo === demoSnapshot.claimNo) rows.splice(index, 1);
    demoSnapshot.items.forEach(item => rows.splice(Math.min(item.index, rows.length), 0, JSON.parse(JSON.stringify(item.row))));
    if (clear) { demoSnapshot = null; activeDemoCase = ''; }
  }
  function renderDemoPicker() {
    const section = page()?.querySelector('#ddDecisionSection');
    section?.querySelector('#ddrDemoScenarios')?.remove();
    if (!reconsidering || !section) return;
    const panel = document.createElement('div');
    panel.id = 'ddrDemoScenarios';
    panel.className = 'ddr-demo-scenarios';
    panel.innerHTML = `<div class="ddr-demo-head"><span class="material-icons-round" aria-hidden="true">science</span><div><strong>ตัวอย่างเงื่อนไขการโอนใน Demo</strong><p>เลือกข้อมูลตัวอย่างเพื่อดู Modal และลองยืนยันผลครั้งใหม่ของ CL นี้</p></div></div><div class="ddr-demo-controls"><label for="ddrDemoCaseSelect">กรณีตัวอย่าง</label><select id="ddrDemoCaseSelect"><option value="">เลือกกรณี</option>${demoCases.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select><button type="button" data-ddr-apply-sample>ใช้ข้อมูลตัวอย่าง</button><button type="button" data-ddr-reset-sample>คืนข้อมูลเดิม</button></div><p class="ddr-demo-state" aria-live="polite">${activeDemoCase ? 'กำลังแสดง: '+esc(demoCases.find(item => item.id === activeDemoCase)?.label || '') : 'ข้อมูลตัวอย่างใช้เฉพาะรอบนี้จนกว่าจะยืนยันหรือคืนข้อมูลเดิม'}</p>`;
    const title = section.querySelector('.dd-doc-title');
    if (title) title.after(panel); else section.prepend(panel);
    panel.querySelector('select').value = activeDemoCase;
  }
  function applyDemoCase(id) {
    const selected = demoCases.find(item => item.id === id);
    if (!reconsidering || !selected) return;
    const claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim();
    const rows = window.deathTransferPendingRows || [];
    if (!demoSnapshot || demoSnapshot.claimNo !== claimNo) {
      restoreDemoRows();
      demoSnapshot = {claimNo,items:rows.map((row,index) => row.claimNo === claimNo ? {index,row:JSON.parse(JSON.stringify(row))} : null).filter(Boolean)};
    }
    restoreDemoRows(false);
    for (let index = rows.length - 1; index >= 0; index -= 1) if (rows[index].claimNo === claimNo) rows.splice(index, 1);
    const approvedAmount = numericAmount(page()?.querySelector('#ddPayTotal')?.textContent);
    const change = selected.offset < 0 ? -Math.min(Math.abs(selected.offset), Math.max(0, approvedAmount / 2)) : selected.offset || 0;
    const previousAmount = Math.round((approvedAmount + change) * 100) / 100;
    if (selected.state !== 'none') {
      const paidAmount = selected.state === 'mixed' ? Math.round(approvedAmount * 50) / 100 : 0;
      const pendingAmount = selected.state === 'mixed' ? Math.round(approvedAmount * 25) / 100 : previousAmount;
      if (window.seedDeathReconsiderExampleTransfer?.(selected.state, pendingAmount, paidAmount) === false) {
        restoreDemoRows();
        renderPaidTransferWarning();
        renderDemoPicker();
        return;
      }
    }
    activeDemoCase = selected.id;
    window.selectDdDecision?.(selected.decision);
    renderPaidTransferWarning();
    renderDemoPicker();
  }
  function syncDecisionAccess() {
    const detailPage = page();
    detailPage?.classList.toggle('ddr-decision-locked', !reconsidering && (histories.get(claimKey()) || []).length > 0);
    detailPage?.classList.toggle('ddr-reconsidering', reconsidering);
    const chip = detailPage?.querySelector('.dd-title-chip');
    if (chip) {
      const label = reconsidering || rowFor()?.status === 'รอพิจารณา' ? 'พร้อมพิจารณา' : rowFor()?.status || 'พร้อมพิจารณา';
      chip.classList.toggle('is-edit-status', label === 'รอแก้ไข');
      chip.innerHTML = `<span class="material-icons-round" aria-hidden="true">${label === 'พร้อมพิจารณา' ? 'task_alt' : 'info'}</span>${esc(label)}`;
    }
    renderPaidTransferWarning();
    renderDemoPicker();
  }
  function selectResult(value) {
    page()?.querySelectorAll('#ddDecisionSection .dd-decision-btn').forEach(button => button.classList.remove('active'));
    page()?.querySelector('#ddDecisionDynamicFields')?.replaceChildren();
    page()?.querySelector('#ddDecisionDynamicFields')?.classList.add('hidden');
    if (!value) return;
    const button = Array.from(page()?.querySelectorAll('#ddDecisionSection .dd-decision-btn') || []).find(item => item.textContent.replace(/\s+/g, ' ').trim() === value);
    if (button) window.selectDdDecision?.(button.dataset.decision);
  }
  function historyEvents() {
    const key = claimKey(), claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim() || '';
    const stamp = thaiStamp(rowFor()?.date);
    const base = [
      ['รับรายการเคลมเข้าสู่ระบบ',`สร้างรายการ ${claimNo} โดย ${actor}`,'description'],
      ['ตรวจสอบข้อมูลผู้เอาประกัน','ตรวจสอบ AppID / เลขบัตรประชาชน / สถานะความคุ้มครองเรียบร้อย','person_search'],
      ['ตรวจสอบเอกสารประกอบ','ตรวจสอบเอกสารการเสียชีวิต/ทุพพลภาพ และข้อมูลผู้รับผลประโยชน์','fact_check'],
      ['อยู่ระหว่างพิจารณา','รอเจ้าหน้าที่บันทึกผลการพิจารณาและยืนยันจำนวนเงินจ่าย','pending_actions']
    ].map(([title,summary,icon],index) => ({id:`dd-base-${index}-${claimNo}`,kind:'base',title,summary,icon,stamp,actor}));
    const decisions = (histories.get(key) || []).map((item,index) => ({...item,kind:'decision',title:`บันทึกผลพิจารณา ครั้งที่ ${index+1}`,summary:`ผลการพิจารณา: ${item.result}`,status:item.result,icon:'fact_check',actor}));
    const edits = (window.getDeathClaimEditEvents?.(key) || []).map(item => ({...item,title:'แก้ไขข้อมูลเคลม',summary:`แก้ไข ${item.changes.length} รายการ`,status:'แก้ไขแล้ว',icon:'edit_note',actor}));
    return [...decisions,...edits,...base].sort((a,b) => Date.parse(b.stamp || 0)-Date.parse(a.stamp || 0));
  }
  function statusTone(status) {
    if (status === 'อนุมัติ') return 'approved';
    if (status === 'ปฏิเสธ') return 'rejected';
    if (status === 'ยกเลิก') return 'cancelled';
    if (['รอแก้ไข','กำลังพิจารณา'].includes(status)) return 'waiting';
    return 'info';
  }
  function renderHistory() {
    const tab = page()?.querySelector('#ddTabTransactions'), pane = tab?.querySelector('.customer-panel-modern-body');
    if (!pane) return;
    seedDecisionHistory();
    const items = historyEvents();
    tab.classList.add('cct-pane');
    const title = tab.querySelector('.customer-panel-modern-title');
    title?.querySelector('.ddr-count')?.remove();
    if (title) title.insertAdjacentHTML('beforeend',`<span class="cct-count ddr-count">${items.length} รายการ</span>`);
    pane.innerHTML = '<p class="cct-context">เรียงจากรายการล่าสุด</p><ol class="cct-list">'+items.map(item => {
      const tone = statusTone(item.status);
      return `<li class="cct-item" data-ddr-item="${esc(item.id)}"><span class="cct-mark ${item.kind} tone-${tone}" aria-hidden="true"><span class="material-icons-round">${esc(item.icon)}</span></span><article class="cct-card"><div class="cct-card-top"><div class="cct-main"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>${item.status ? `<span class="cct-status cct-status--${tone}">${esc(item.status)}</span>` : ''}</div><div class="cct-card-bottom"><div class="cct-card-meta"><span class="cct-date">${esc(timeLabel(item.stamp))}</span><span class="cct-actor">${esc(item.actor)}</span></div><button type="button" class="cct-detail-button" data-ddr-detail="${esc(item.id)}" aria-label="ดูรายละเอียด ${esc(item.title)}">ดูรายละเอียด<span class="material-icons-round" aria-hidden="true">arrow_forward</span></button></div></article></li>`;
    }).join('')+'</ol>';
  }
  function leaveReconsideration() {
    restoreDemoRows();
    reconsidering = false;
    syncDecisionAccess();
  }
  function showDetail(item, trigger) {
    returnFocus = trigger;
    document.getElementById('ddReconsiderDialog')?.remove();
    const layer = document.createElement('div');
    layer.id = 'ddReconsiderDialog';
    layer.className = 'cct-overlay';
    const changed = item.kind === 'decision' ? Object.keys(item.after).filter(key => item.before[key] !== item.after[key]).map(key => ({label:key,before:item.before[key],after:item.after[key]})) : item.kind === 'edit' ? item.changes : [];
    const labels = {cause:'เหตุของการเคลม',coverage:'ประเภทความคุ้มครอง',treatment:'ประเภทการรักษา',loss:'รายละเอียดการสูญเสีย'};
    const diff = changed.length ? `<section class="cct-section"><div class="cct-section-head"><h3>${item.kind === 'edit' ? 'ข้อมูลที่แก้ไข' : 'รายละเอียดผลพิจารณา'}</h3><span class="cct-change-count">${changed.length} รายการ</span></div><div class="cct-diff-table"><div class="cct-diff-columns"><span>ข้อมูล</span><span>ก่อนแก้ไข</span><span>หลังแก้ไข</span></div>${changed.map(change => `<div class="cct-diff-line"><span class="cct-diff-name">${esc(labels[change.label] || change.label)}</span><span class="cct-diff-before">${esc(change.before)}</span><span class="cct-diff-after">${esc(change.after)}</span></div>`).join('')}</div></section>` : '';
    const body = item.kind === 'decision'
      ? `<section class="cct-decision-hero ${statusTone(item.result) === 'approved' ? '' : statusTone(item.result) === 'rejected' ? 'rejected' : 'pending'}"><span class="material-icons-round" aria-hidden="true">${item.result === 'อนุมัติ' ? 'task_alt' : item.result === 'ปฏิเสธ' ? 'cancel' : 'fact_check'}</span><div><small>ผลการพิจารณา</small><strong>${esc(item.result)}</strong></div></section>${diff}<div class="cct-choice"><button type="button" class="cct-reconsider" data-ddr-reconsider>พิจารณาใหม่อีกครั้ง</button></div>`
      : item.kind === 'edit' ? diff : `<section class="cct-section"><div class="cct-section-head"><h3>${esc(item.title)}</h3></div><p class="ddr-detail-summary">${esc(item.summary)}</p></section>`;
    const claimNo = page()?.querySelector('#ddClaimCodeValue')?.textContent.trim() || '—';
    const caseNo = page()?.querySelector('#ddCaseCodeValue')?.textContent.trim() || '—';
    layer.innerHTML = `<div class="cct-dialog cct-dialog-${esc(item.kind)}" role="dialog" aria-modal="true" aria-labelledby="ddrDialogTitle"><header class="cct-dialog-head"><div class="cct-dialog-title-row"><div><span class="cct-kicker">ประวัติการทำรายการ</span><h2 id="ddrDialogTitle">${esc(item.title)}</h2></div></div><button type="button" class="cct-close" data-ddr-close aria-label="ปิดรายละเอียด"><span class="material-icons-round" aria-hidden="true">close</span></button><dl class="cct-dialog-meta"><div class="cct-meta-item"><dt>วันเวลาทำรายการ</dt><dd>${esc(timeLabel(item.stamp))}</dd></div><div class="cct-meta-item"><dt>ผู้ทำรายการ</dt><dd>${esc(item.actor)}</dd></div><div class="cct-meta-item"><dt>เลข CL</dt><dd>${esc(claimNo)}</dd></div><div class="cct-meta-item"><dt>เลข Case</dt><dd>${esc(caseNo)}</dd></div></dl></header><div class="cct-dialog-body">${body}</div></div>`;
    document.body.appendChild(layer);
    layer.querySelector('[data-ddr-close]')?.focus();
  }
  document.addEventListener('click', event => {
    const applySample = event.target.closest('[data-ddr-apply-sample]');
    if (applySample && page()?.contains(applySample)) {
      const select = page().querySelector('#ddrDemoCaseSelect');
      if (select?.value) applyDemoCase(select.value);
      else { page().querySelector('.ddr-demo-state').textContent = 'กรุณาเลือกกรณีตัวอย่าง'; select?.focus(); }
    }
    const resetSample = event.target.closest('[data-ddr-reset-sample]');
    if (resetSample && page()?.contains(resetSample)) {
      restoreDemoRows();
      selectResult('');
      renderPaidTransferWarning();
      renderDemoPicker();
    }
    const detail = event.target.closest('[data-ddr-detail]');
    if (detail && page()?.contains(detail)) {
      const item = historyEvents().find(record => record.id === detail.dataset.ddrDetail);
      if (item) showDetail(item, detail);
    }
    if (event.target.closest('[data-ddr-close]') || event.target.id === 'ddReconsiderDialog') { document.getElementById('ddReconsiderDialog')?.remove(); returnFocus?.focus(); }
    if (event.target.closest('[data-ddr-reconsider]')) {
      document.getElementById('ddReconsiderDialog')?.remove();
      reconsidering = true;
      page()?.classList.remove('ddce-view-only');
      window.setDeathMainTab?.('claim');
      selectResult('');
      syncDecisionAccess();
      page()?.scrollIntoView({block:'start'});
    }
    const view = event.target.closest('[data-ddr-view]');
    if (view) window.showConsiderDeathDetail?.(view.dataset.ddrView);
  });
  const originalRender = window.renderConsiderDeathTable;
  if (typeof originalRender === 'function') window.renderConsiderDeathTable = function () {
    const result = originalRender.apply(this, arguments);
    document.querySelectorAll('#considerDeathTableBody tr').forEach(tr => {
      const claimCode = tr.cells?.[1]?.textContent.trim();
      if (!['ยกเลิก', 'ปฏิเสธ', 'อนุมัติ'].includes(rowFor(claimCode)?.status)) return;
      tr.querySelector('.dd-consider-btn')?.remove();
      const view = tr.querySelector('.tt-action.view');
      if (view) {
        view.dataset.ddrView = claimCode;
        view.setAttribute('aria-label', 'ดูรายละเอียด ' + claimCode);
      }
    });
    return result;
  };
  const originalOpen = window.showConsiderDeathDetail;
  window.refreshDeathClaimTransactionHistory = renderHistory;
  if (typeof originalOpen === 'function') window.showConsiderDeathDetail = function (claimCode) {
    leaveReconsideration();
    activeClaim = claimCode || '';
    const result = originalOpen.apply(this, arguments);
    activeClaim = claimCode || page()?.querySelector('#ddClaimCodeValue')?.textContent.trim() || '';
    seedDecisionHistory();
    syncDecisionAccess();
    setTimeout(() => { const values = savedFields.get(claimKey()); if (values) applyValues(values); renderHistory(); syncDecisionAccess(); }, 60);
    return result;
  };
  const originalSave = window.confirmDdDecisionSave;
  if (typeof originalSave === 'function') window.confirmDdDecisionSave = function () {
    seedDecisionHistory();
    if (!reconsidering && (histories.get(claimKey()) || []).length) return false;
    const resultLabel = decision();
    if (!resultLabel) return originalSave.apply(this, arguments);
    const selected = page()?.querySelector('#ddDecisionSection .dd-decision-btn.active')?.dataset.decision;
    const review = transferReview(selected);
    if (review && selected === 'approve' && window.validateDeathApprovedClaim?.() === false) return false;
    const context = this;
    const args = arguments;
    if (review) {
      showTransferReview(review, resultLabel, () => commit(review));
      return false;
    }
    return commit(null);
    function commit(transfer) {
    const key = claimKey();
    const before = currentValues();
    const after = {...before};
    if (transfer?.skipTransfer) window.__ddrSkipTransferSync = true;
    let result;
    try { result = originalSave.apply(context, args); }
    finally { window.__ddrSkipTransferSync = false; }
    if (result === false) return false;
    const row = rowFor();
    if (transfer && Object.prototype.hasOwnProperty.call(transfer, 'reconcilePendingAmount')) {
      window.reconcileDeathPendingTransfers?.(row?.claimCode || page()?.querySelector('#ddClaimCodeValue')?.textContent.trim(), transfer.reconcilePendingAmount);
    }
    if (selected === 'reject' || selected === 'cancel') window.cancelPendingDeathTransfers?.(row?.claimCode || page()?.querySelector('#ddClaimCodeValue')?.textContent.trim());
    if (row) {
      row.status = resultStatuses[selected] || row.status;
      row.statusClass = statusClasses[selected] || row.statusClass;
      row.statusReason = '';
      row.statusDetail = '';
      window.renderConsiderDeathTable?.();
      window.ClaimStatusDetailCard?.insertClaimDetailCard(page(), row);
    }
    if (!histories.has(key)) histories.set(key, []);
    histories.get(key).push({id:'dd-decision-'+Date.now()+'-'+histories.get(key).length,stamp:new Date().toISOString(),result:resultLabel,before,after});
    savedFields.set(key, after);
    applyValues(after);
    demoSnapshot = null;
    activeDemoCase = '';
    leaveReconsideration();
    renderHistory();
    syncDecisionAccess();
    return result;
    }
  };
})();
