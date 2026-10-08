/* จัดการข้อมูลแจ้งเคลม > แก้ไขการแจ้งเคลม — session-only demonstration. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value == null ? '-' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const amount = value => Number(value || 0).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
  const rules = window.claimAgentEditNotificationRules;
  const choiceIcons = {'เจ็บป่วย':'healing','อุบัติเหตุ':'directions_run','ค่ารักษา':'medical_services','ค่าชดเชย':'payments','ค่าชดเชย(ใหญ่)':'payments','OPD':'medical_services','IPD':'hotel','Day Case Surgery':'local_hospital'};
  const records = [
    {id:'CL690700428',caseNo:'CC69070428-01',refNo:'CPG690700104',product:'PH',insured:'นางสาวพิมพ์นภา ศรีสุข',holder:'นางสาวพิมพ์นภา ศรีสุข',appId:'9909999',place:'โรงพยาบาลพระราม 9',branch:'กรุงเทพมหานคร',status:'โอนสำเร็จ',amount:8450,cause:'เจ็บป่วย',coverage:'ค่ารักษา',treatment:'IPD',requester:'08135 - นายณัฐภูมิ กองเพ็ง',eventDate:'04/07/2569',admitDate:'04/07/2569',dischargeDate:'09/07/2569',createdAt:'10/07/2569 10:12',transferAt:'10/07/2569 15:42',settledAt:'15/07/2569 14:30',bank:'กรุงไทย •••• 0800',payee:'นางสาวพิมพ์นภา ศรีสุข',contact:'091-xxx-4455'},
    {id:'CLPA690800139',caseNo:'CC69080139-01',refNo:'CPG690800139',product:'PA',insured:'เด็กหญิงปวันรัตน์ ธรรมใจ',holder:'นายวิชัย ธรรมใจ',appId:'PA6910524',place:'โรงเรียนสาธิตมหาวิทยาลัยเชียงใหม่',branch:'เชียงใหม่',status:'รอโอนเงิน',amount:3400,cause:'อุบัติเหตุ',coverage:'ค่ารักษา',treatment:'OPD',requester:'08142 - นางสาววราภรณ์ วัฒนะ',eventDate:'21/08/2569',admitDate:'21/08/2569',dischargeDate:'21/08/2569',createdAt:'23/08/2569 09:18',transferAt:'',settledAt:'',bank:'กสิกรไทย •••• 9186',payee:'นายวิชัย ธรรมใจ',contact:'08x-xxx-6201'},
    {id:'CL690800221',caseNo:'CC69080221-02',refNo:'HCG690800021',product:'PH',insured:'นายจิรายุ ทองดี',holder:'นายจิรายุ ทองดี',appId:'9814286',place:'โรงพยาบาลศิริเวช สายไหม',branch:'กรุงเทพมหานคร',status:'โอนไม่สำเร็จ',amount:44700,cause:'เจ็บป่วย',coverage:'ค่ารักษา',treatment:'OPD',requester:'08201 - นายกิตติศักดิ์ แสงทอง',eventDate:'22/08/2569',admitDate:'22/08/2569',dischargeDate:'22/08/2569',createdAt:'25/08/2569 10:53',transferAt:'25/08/2569 11:22',settledAt:'',bank:'กรุงเทพ •••• 5420',payee:'บจก. ศิริเวช สายไหม',contact:'02-xxx-7020'},
    {id:'CL690800224',caseNo:'CC69080224-01',refNo:'HCG690800024',product:'PH',insured:'นายปกรณ์ วัฒนา',holder:'นายปกรณ์ วัฒนา',appId:'9841102',place:'โรงพยาบาลพระราม 9',branch:'สำนักงานใหญ่',status:'รอโอนเงิน',amount:85000,cause:'เจ็บป่วย',coverage:'ค่ารักษา',treatment:'IPD',requester:'08135 - นายณัฐภูมิ กองเพ็ง',eventDate:'19/08/2569',admitDate:'19/08/2569',dischargeDate:'24/08/2569',createdAt:'25/08/2569 13:15',transferAt:'',settledAt:'',bank:'กสิกรไทย •••• 4210',payee:'บจก. โรงพยาบาลพระราม 9',contact:'02-xxx-7000'},
    {id:'CL690800233',caseNo:'CC69080233-01',refNo:'CPG690800145',product:'PH',insured:'นางสาวสุภาวดี บัวแก้ว',holder:'นางสาวสุภาวดี บัวแก้ว',appId:'9709598',place:'โรงพยาบาลพญาไท 3',branch:'นนทบุรี',status:'อยู่ระหว่างการโอน',amount:21600,cause:'อุบัติเหตุ',coverage:'ค่าชดเชย(ใหญ่)',treatment:'IPD',requester:'08142 - นางสาววราภรณ์ วัฒนะ',eventDate:'20/08/2569',admitDate:'20/08/2569',dischargeDate:'22/08/2569',createdAt:'26/08/2569 11:10',transferAt:'',settledAt:'',bank:'ไทยพาณิชย์ •••• 3347',payee:'นางสาวสุภาวดี บัวแก้ว',contact:'08x-xxx-4570'},
    {id:'CLPA690800219',caseNo:'CC69080219-01',refNo:'HCG690800019',product:'PA',insured:'เด็กหญิงรินรดา แสงทอง',holder:'นางพรทิพย์ แสงทอง',appId:'PA6907812',place:'โรงพยาบาลเกษมราษฎร์ ประชาชื่น',branch:'นนทบุรี',status:'โอนไม่สำเร็จ',amount:26400,cause:'อุบัติเหตุ',coverage:'ค่ารักษา',treatment:'IPD',requester:'08201 - นายกิตติศักดิ์ แสงทอง',eventDate:'20/08/2569',admitDate:'20/08/2569',dischargeDate:'21/08/2569',createdAt:'23/08/2569 14:18',transferAt:'23/08/2569 14:49',settledAt:'',bank:'กรุงศรีอยุธยา •••• 2190',payee:'โรงพยาบาลเกษมราษฎร์ ประชาชื่น',contact:'02-xxx-7138'},
    {id:'CLPA690900310',caseNo:'CC69090310-01',refNo:'CPG690900310',product:'PA',insured:'เด็กชายภาคิน อินทร์แก้ว',holder:'นายธนกฤต อินทร์แก้ว',appId:'PA6911183',place:'โรงเรียนเทศบาลวัดกลาง',branch:'ขอนแก่น',status:'โอนสำเร็จ',amount:1200,cause:'อุบัติเหตุ',coverage:'ค่าชดเชย',treatment:'OPD',requester:'08142 - นางสาววราภรณ์ วัฒนะ',eventDate:'12/09/2569',admitDate:'12/09/2569',dischargeDate:'12/09/2569',createdAt:'13/09/2569 10:25',transferAt:'15/09/2569 14:10',settledAt:'18/09/2569 11:45',bank:'ธนาคารออมสิน •••• 6204',payee:'นายธนกฤต อินทร์แก้ว',contact:'08x-xxx-4026'}
  ];
  const state = {query:'', field:'claim', selectedId:null, activeTab:'claim', lastTrigger:null};
  function dataLabel(row){return [row.treatment,row.cause,row.coverage].filter(Boolean).join(' | ')}
  function activateMenu(){const submenu=$('claimDataManagementSubmenu');submenu?.classList.remove('hidden');$('menuClaimDataManagement')?.setAttribute('aria-expanded','true');document.querySelectorAll('#claimDataManagementSubmenu button').forEach(button=>{button.classList.remove('bg-white/15','font-bold','text-white');button.classList.add('font-semibold','text-white/75')});$('submenuEditClaimNotification')?.classList.add('bg-white/15','font-bold','text-white');$('submenuEditClaimNotification')?.classList.remove('font-semibold','text-white/75')}
  function showPage(id,title){if(typeof window.claimMoneyShowPage==='function')window.claimMoneyShowPage(id,title,'จัดการข้อมูลแจ้งเคลม / แก้ไขการแจ้งเคลม');else{document.querySelectorAll('.page').forEach(page=>page.classList.add('hidden'));$(id)?.classList.remove('hidden')}activateMenu()}
  function hideDetail(){state.selectedId=null;$('editClaimNotificationDetailPage').classList.add('hidden')}
  function showMonitor(){if($('ecnEditModal')?.open)$('ecnEditModal').close();hideDetail();resetSearchFeedback();showPage('editClaimNotificationPage','แก้ไขการแจ้งเคลม')}
  function matchingRows(){return rules.searchRecords(records,state.field,state.query)}
  function statusTone(status){return status==='โอนสำเร็จ'?'success':status==='โอนไม่สำเร็จ'?'danger':'pending'}
  function renderSamples(){
    const list = $('ecnSampleList');
    if (!list) return;
    list.innerHTML = records.map(row => `
      <button type="button" class="ecn-sample" data-ecn-sample="${escapeHtml(row.id)}" aria-label="เลือกเลข CL ${escapeHtml(row.id)}">${escapeHtml(row.id)}</button>`).join('');
  }
  function resetSearchFeedback(){
    $('ecnSearchError').classList.add('hidden');
    $('ecnMatchPicker').classList.add('hidden');
    $('ecnMatchSelect').innerHTML='<option value="">เลือกเลข CL</option>';
  }
  function search(){
    hideDetail();resetSearchFeedback();
    state.field=$('ecnSearchType').value;
    state.query=$('ecnClaimNo').value.trim();
    const rows=matchingRows();
    if(!rows.length){$('ecnSearchError').classList.remove('hidden');return}
    if(rows.length===1){openDetail(rows[0].id);return}
    $('ecnMatchCount').textContent=`พบ ${rows.length} รายการ · เลือกเลข CL ที่ต้องการดู`;
    $('ecnMatchSelect').innerHTML='<option value="">เลือกเลข CL</option>'+rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.id)}</option>`).join('');
    $('ecnMatchPicker').classList.remove('hidden');
    $('ecnMatchSelect').focus();
  }
  function field(label,value){return `<div class="ecn-data-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`}
  function historyHeader(icon,title,description){return `<div class="ecn-history-head"><span class="ecn-history-icon"><span class="material-icons-round" aria-hidden="true">${icon}</span></span><div><h3>${title}</h3><p>${description}</p></div></div>`}
  function historyItem(icon,title,description,time,tone){return `<li class="ecn-history-item ${tone||''}"><span class="ecn-history-marker"><span class="material-icons-round" aria-hidden="true">${icon}</span></span><div><strong>${title}</strong><p>${description}</p></div><time>${escapeHtml(time||'รอดำเนินการ')}</time></li>`}
  function renderHistories(row){$('ecnPanelActivity').innerHTML=historyHeader('history','ประวัติการทำรายการ',`ลำดับการดำเนินงานของ ${escapeHtml(row.id)}`)+`<ol class="ecn-history-list">${historyItem('post_add','รับแจ้งเคลม',`บันทึก ${escapeHtml(dataLabel(row))}`,row.createdAt,'success')}${historyItem('fact_check','ตรวจสอบข้อมูล','ตรวจสอบผู้เอาประกันและข้อมูลเคลมแล้ว',row.createdAt,'success')}${historyItem(row.status==='โอนสำเร็จ'?'check_circle':'schedule',row.status,'ติดตามสถานะการโอนเงินของรายการ',row.transferAt,statusTone(row.status))}${(row.editHistory||[]).map(item=>historyItem('edit_note','แก้ไขข้อมูลเคลม',escapeHtml(item.detail),item.time,'success')).join('')}</ol>`;$('ecnPanelTransfer').innerHTML=historyHeader('account_balance','ประวัติการโอนเงิน','บัญชีปลายทาง ยอดเงิน และผลการโอนล่าสุด')+`<div class="ecn-history-facts">${field('เลขที่การโอน',row.refNo)}${field('ผู้รับเงิน',row.payee)}${field('บัญชีปลายทาง',row.bank)}${field('ยอดโอน',amount(row.amount)+' บาท')}</div><ol class="ecn-history-list">${historyItem('receipt_long','สร้างรายการโอน',`เลขอ้างอิง ${escapeHtml(row.refNo)}`,row.createdAt,'success')}${historyItem(row.status==='โอนสำเร็จ'?'task_alt':row.status==='โอนไม่สำเร็จ'?'error':'hourglass_top',row.status,'ผลการโอนตามข้อมูลตัวอย่าง',row.transferAt,statusTone(row.status))}</ol>`;$('ecnPanelSettlement').innerHTML=historyHeader('savings','ประวัติการตัดจ่าย','ยอดตัดจ่ายและวันที่ทำรายการ')+`<div class="ecn-history-facts">${field('ยอดโอนสุทธิ',amount(row.amount)+' บาท')}${field('ยอดตัดจ่าย',row.settledAt?amount(row.amount)+' บาท':'-')}${field('วันที่ตัดจ่าย',row.settledAt||'-')}</div>${row.settledAt?`<ol class="ecn-history-list">${historyItem('paid','ตัดจ่ายเรียบร้อย','บันทึกยอดตัดจ่ายตามรายการโอน',row.settledAt,'success')}</ol>`:'<p class="ecn-history-empty">ยังไม่มีรายการตัดจ่ายสำหรับเคลมนี้</p>'}`}
  function selected(){return records.find(row=>row.id===state.selectedId)}
  function renderDetail(){const row=selected();if(!row)return;$('ecnDetailHeading').textContent=row.id;$('ecnDetailSubtitle').textContent=`${row.insured}  ·  ${row.caseNo}`;$('ecnDetailStatus').textContent=row.status;$('ecnDetailStatus').className=`ecn-status ${statusTone(row.status)}`;$('ecnOverview').innerHTML=[field('เลขที่การโอน',row.refNo),field('ผู้ร้องขอ',row.requester),field('สาขา',row.branch),field('สถานะการโอน',row.status),field('วันที่โอนเงิน',row.transferAt||'-'),field('จำนวนเงินโอนรวม',amount(row.amount)+' บาท')].join('');$('ecnPolicy').innerHTML=field('AppID',row.appId)+field('ชื่อผู้ถือกรมธรรม์',row.holder)+field('ผลิตภัณฑ์',row.product);$('ecnPayee').innerHTML=field('ผู้รับสินไหม',row.payee)+field('บัญชีรับสินไหม',row.bank)+field('ติดต่อ',row.contact);$('ecnClaimBody').innerHTML=`<tr><td data-label="เลขที่ CL">${escapeHtml(row.id)}</td><td data-label="เลขที่ Case">${escapeHtml(row.caseNo)}</td><td data-label="ผู้เอาประกัน">${escapeHtml(row.insured)}</td><td data-label="วันที่เกิดเหตุ">${escapeHtml(row.eventDate)}</td><td data-label="วันที่เข้า รพ.">${escapeHtml(row.admitDate)}</td><td data-label="วันที่ออก รพ.">${escapeHtml(row.dischargeDate)}</td><td data-label="ข้อมูลเคลม" class="ecn-claim-data-main"><span class="ecn-claim-text">${escapeHtml(dataLabel(row))}</span></td><td data-label="จำนวนเงิน" class="ecn-money">${amount(row.amount)}</td><td data-label="ดำเนินการ"><button id="ecnEditBtn" type="button" class="ecn-edit-action" aria-label="แก้ไขข้อมูลเคลม ${escapeHtml(row.id)}"><span class="material-icons-round" aria-hidden="true">edit</span><span class="ecn-edit-tooltip" aria-hidden="true">แก้ไขข้อมูลเคลม</span></button></td></tr>`;renderHistories(row);activateTab('claim');$('ecnSaveNotice').classList.add('hidden')}
  function openDetail(id){if(!records.some(row=>row.id===id))return;state.selectedId=id;renderDetail();const detail=$('editClaimNotificationDetailPage');detail.classList.remove('hidden');detail.scrollIntoView({block:'start'});}
  function activateTab(key,focus){state.activeTab=key;document.querySelectorAll('#editClaimNotificationDetailPage [data-ecn-tab]').forEach(button=>{const active=button.dataset.ecnTab===key;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus()});['claim','activity','transfer','settlement'].forEach(name=>{$('ecnPanel'+name[0].toUpperCase()+name.slice(1)).hidden=name!==key})}
  function choiceValue(key){return document.querySelector(`#ecn${key} input:checked`)?.value||''}
  function renderChoices(key,options,selectedValue){
    $("ecn"+key).innerHTML=options.map(value=>`<label class="ecn-choice${value===selectedValue?' is-selected':''}"><input type="radio" name="ecn${key}Choice" value="${escapeHtml(value)}"${value===selectedValue?' checked':''}><span class="material-icons-round ecn-choice-icon" aria-hidden="true">${choiceIcons[value]||'check_circle'}</span><span class="ecn-choice-text">${escapeHtml(value)}</span><span class="material-icons-round ecn-choice-check" aria-hidden="true">check_circle</span></label>`).join('');
  }
  function refreshTreatment(preferred){
    const row=selected();
    if(!row)return;
    const selection=rules.reconcile(row.product,{cause:choiceValue('Cause'),coverage:choiceValue('Coverage'),treatment:preferred});
    renderChoices('Treatment',rules.treatments(row.product,selection.cause,selection.coverage),selection.treatment);
  }
  function refreshCoverage(){
    const row=selected();
    if(!row)return;
    const cause=choiceValue('Cause');
    const previousCoverage=choiceValue('Coverage');
    const previousTreatment=choiceValue('Treatment');
    const options=rules.coverages(row.product,cause);
    renderChoices('Coverage',options,options.includes(previousCoverage)?previousCoverage:'');
    refreshTreatment(previousTreatment);
  }
  function clearChoiceError(key){
    const group=$('ecn'+key),message=$('ecn'+key+'Error');
    group.removeAttribute('aria-invalid');group.removeAttribute('aria-describedby');
    message.textContent='';message.classList.add('hidden');
  }
  function openModal(trigger){
    const row=selected();if(!row)return;
    state.lastTrigger=trigger;
    $('ecnModalSummary').innerHTML=`<div><span>เลขที่ CL</span><strong>${escapeHtml(row.id)}</strong></div><div><span>เลขที่ Case</span><strong>${escapeHtml(row.caseNo)}</strong></div><div><span>ผู้เอาประกัน</span><strong>${escapeHtml(row.insured)}</strong></div>`;
    $('ecnCoverageProductHint').textContent=row.product;
    renderChoices('Cause',rules.causes(row.product),row.cause);
    renderChoices('Coverage',rules.coverages(row.product,row.cause),row.coverage);
    refreshTreatment(row.treatment);
    $('ecnRequester').value=row.requester;
    $('ecnModalError').classList.add('hidden');
    ['Cause','Coverage','Treatment'].forEach(clearChoiceError);
    $('ecnRequester').removeAttribute('aria-invalid');$('ecnRequester').removeAttribute('aria-describedby');
    $('ecnEditModal').classList.remove('hidden');$('ecnEditModal').showModal();
    $('ecnCause input:checked')?.focus();
  }
  function save(){
    const row=selected();if(!row)return;
    const cause=choiceValue('Cause'),coverage=choiceValue('Coverage'),treatment=choiceValue('Treatment'),requester=$('ecnRequester').value;
    const invalidKey=rules.invalidField(row.product,{cause,coverage,treatment});
    if(invalidKey||!requester){
      const messages={Cause:'กรุณาเลือกเหตุของการเคลมที่รองรับ',Coverage:'กรุณาเลือกประเภทความคุ้มครองที่รองรับ',Treatment:'กรุณาเลือกประเภทการรักษาที่รองรับ'};
      $('ecnModalError').textContent=messages[invalidKey]||'กรุณาเลือกผู้ร้องขอ';
      $('ecnModalError').classList.remove('hidden');
      if(invalidKey){
        const group=$('ecn'+invalidKey),message=$('ecn'+invalidKey+'Error');
        message.textContent=messages[invalidKey];message.classList.remove('hidden');
        group.setAttribute('aria-invalid','true');group.setAttribute('aria-describedby',message.id);
        group.querySelector('input')?.focus();
      }
      else{$('ecnRequester').setAttribute('aria-invalid','true');$('ecnRequester').setAttribute('aria-describedby','ecnModalError');$('ecnRequester').focus()}
      return;
    }
    ['Cause','Coverage','Treatment'].forEach(clearChoiceError);
    $('ecnRequester').removeAttribute('aria-invalid');$('ecnRequester').removeAttribute('aria-describedby');
    const time=new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    Object.assign(row,rules.updatedRecord(row,{cause,coverage,treatment},requester,time));
    state.lastTrigger=null;$('ecnEditModal').close();renderDetail();renderSamples();
    $('ecnSaveNotice').textContent=`บันทึกข้อมูลเคลม ${row.id} แล้ว (ข้อมูลตัวอย่างในหน้านี้)`;
    $('ecnSaveNotice').classList.remove('hidden');$('ecnSaveNotice').focus({preventScroll:true});
  }
  function init(){
    const monitor=$('editClaimNotificationPage');
    const main=document.querySelector('main');
    if(monitor&&main&&monitor.parentElement!==main)main.appendChild(monitor);
    $('submenuEditClaimNotification')?.addEventListener('click',()=>{
      state.query='';state.field='claim';
      $('ecnSearchType').value='claim';$('ecnClaimNo').value='';$('ecnClaimNo').placeholder='ระบุเลขที่ CL';
      renderSamples();showMonitor();
    });
    $('ecnSearchBtn')?.addEventListener('click',search);
    $('ecnClaimNo')?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing)search()});
    $('ecnClaimNo')?.addEventListener('input',()=>{$('ecnSearchError').classList.add('hidden')});
    $('ecnSearchType')?.addEventListener('change',()=>{
      hideDetail();resetSearchFeedback();state.field=$('ecnSearchType').value;state.query='';
      $('ecnClaimNo').value='';$('ecnClaimNo').placeholder='ระบุ'+$('ecnSearchType').selectedOptions[0].textContent;
    });
    $('ecnClearBtn')?.addEventListener('click',()=>{
      hideDetail();resetSearchFeedback();$('ecnSearchType').value='claim';$('ecnClaimNo').value='';$('ecnClaimNo').placeholder='ระบุเลขที่ CL';
      state.query='';state.field='claim';$('ecnClaimNo').focus();
    });
    $('ecnSampleList')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-ecn-sample]');if(!button)return;
      const row=records.find(item=>item.id===button.dataset.ecnSample);if(!row)return;
      $('ecnSearchType').value='claim';$('ecnClaimNo').placeholder='ระบุเลขที่ CL';$('ecnClaimNo').value=row.id;
      search();
    });
    $('ecnMatchSelect')?.addEventListener('change',event=>{
      if(event.target.value)openDetail(event.target.value);
      else hideDetail();
    });
    $('editClaimNotificationDetailPage')?.addEventListener('click',event=>{
      const button=event.target.closest('#ecnEditBtn');if(button)openModal(button);
      const tab=event.target.closest('[data-ecn-tab]');if(tab)activateTab(tab.dataset.ecnTab);
    });
    $('editClaimNotificationDetailPage')?.addEventListener('keydown',event=>{
      const tab=event.target.closest('[data-ecn-tab]');if(!tab)return;
      const keys=['claim','activity','transfer','settlement'];let index=keys.indexOf(tab.dataset.ecnTab);
      if(event.key==='ArrowRight')index=(index+1)%keys.length;
      else if(event.key==='ArrowLeft')index=(index+keys.length-1)%keys.length;
      else if(event.key==='Home')index=0;
      else if(event.key==='End')index=keys.length-1;
      else return;
      event.preventDefault();activateTab(keys[index],true);
    });
    ['Cause','Coverage','Treatment'].forEach(key=>$('ecn'+key)?.addEventListener('change',event=>{
      if(!event.target.matches('input[type=radio]'))return;
      $('ecn'+key).querySelectorAll('.ecn-choice').forEach(label=>label.classList.toggle('is-selected',label.querySelector('input').checked));
      ['Cause','Coverage','Treatment'].forEach(clearChoiceError);$('ecnModalError').classList.add('hidden');
      if(key==='Cause')refreshCoverage();else if(key==='Coverage')refreshTreatment(choiceValue('Treatment'));
    }));
    $('ecnCloseModal')?.addEventListener('click',()=>$('ecnEditModal').close());
    $('ecnCancelBtn')?.addEventListener('click',()=>$('ecnEditModal').close());
    $('ecnRequester')?.addEventListener('change',()=>{
      $('ecnRequester').removeAttribute('aria-invalid');$('ecnRequester').removeAttribute('aria-describedby');
      $('ecnModalError').classList.add('hidden');
    });
    $('ecnSaveBtn')?.addEventListener('click',save);
    $('ecnEditModal')?.addEventListener('click',event=>{if(event.target===$('ecnEditModal'))$('ecnEditModal').close()});
    $('ecnEditModal')?.addEventListener('close',()=>state.lastTrigger?.focus());
    renderSamples();resetSearchFeedback();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
