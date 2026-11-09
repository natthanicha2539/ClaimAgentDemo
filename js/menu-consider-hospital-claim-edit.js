/* พิจารณาเคลม > เคลมโรงพยาบาล > ประวัติการทำรายการ > แก้ไขข้อมูลเคลม (session demo) */
(function () {
  'use strict';

  const saved = new Map();
  const demoActor = '06590 - ณัฏฐณิชา โตรักษา';
  let nativeActive = null;
  const nativeLocks = new Map();
  const suppressedViews = new Map();
  const names = {
    cause:'เหตุของการเคลม', coverage:'ประเภทความคุ้มครอง', treatment:'ประเภทการรักษา',
    reported:'วันที่แจ้ง', complete:'วันที่เอกสารครบ', incident:'วันที่เกิดเหตุ', incidentTime:'เวลาที่เกิดเหตุ',
    hospital:'สถานพยาบาล', symptom:'อาการสำคัญ', diagnosis1:'การวินิจฉัย 1', diagnosis2:'การวินิจฉัย 2',
    diagnosis3:'การวินิจฉัย 3', diagnosis4:'การวินิจฉัย 4', diagnosis5:'การวินิจฉัย 5', diagnosis6:'การวินิจฉัย 6', injury:'รายละเอียดการเจ็บป่วย/การบาดเจ็บ', note:'หมายเหตุ(ถ้ามี)', hn:'HN', additionalDetail:'รายละเอียดเพิ่มเติม',
    physical:'เป็นการกายภาพบำบัด', necessity:'ความจำเป็นทางการแพทย์', traffic:'เป็นอุบัติเหตุจากการจราจร',
    vehicle:'ประเภทยานพาหนะ', vehicleOther:'โปรดระบุประเภทยานพาหนะ', casualty:'ผู้ขับขี่ หรือ ผู้โดยสาร',
    porobo:'เป็นส่วนเกิน พ.ร.บ.', poroboReason:'สาเหตุที่ไม่ใช้ พ.ร.บ.',
    excess:'เป็นส่วนเกินจากบริษัทประกัน', insurer:'บริษัทประกัน', files:'สแกนเอกสาร',license:'เลขใบประกอบวิชาชีพเวชกรรม',doctorName:'แพทย์(ชื่อ-สกุล)'
  };
  const coreFields = ['cause','coverage','treatment','reported','complete','incident','incidentTime','hospital','symptom','diagnosis1','diagnosis2','diagnosis3','diagnosis4','diagnosis5','diagnosis6','injury','hn','additionalDetail'];
  const allFields = [...coreFields,'physical','necessity','traffic','vehicle','vehicleOther','casualty','porobo','poroboReason','excess','insurer','license','doctorName'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const activePage = () => document.querySelector('#considerHospitalOpdFullPage:not(.hidden), #considerHospitalOpdHalfPage:not(.hidden)');
  const currentRow = () => window.currentConsiderHospitalRow || null;
  const claimKey = row => String(row?.claimCode || row?.claimNo || '') + '|' + String(row?.caseNo || '');
  const normalized = value => String(value || '').replace(/\*/g,'').replace(/\s+/g,'').trim();
  const dateValue = value => {
    const raw = String(value || '').trim();
    const thai = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return thai ? `${Number(thai[3])-543}-${thai[2]}-${thai[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  };
  const displayDate = value => {const iso=dateValue(value), match=iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?`${match[3]}/${match[2]}/${Number(match[1])+543}`:value||'';};
  const showValue = value => value === true ? 'ใช่' : value === false ? 'ไม่ใช่' : value == null || value === '' ? '—' : String(value);
  const showChangeValue = (change,side) => {
    const value=change[side],id=change.key || Object.keys(names).find(key=>names[key]===change.label);
    if(['reported','complete','incident'].includes(id))return showValue(displayDate(value));
    if(id==='necessity' && value){
      const item=window.CLAIM_AGENT_MEDICAL_NECESSITY?.[value];
      return item?.thai ? item.thai+(item.english?' ('+item.english+')':'') : showValue(value);
    }
    const options={motorcycle:'มอเตอร์ไซค์',car:'รถยนต์',other:'อื่นๆ',driver:'ผู้ขับขี่',passenger:'ผู้โดยสาร',yes:'ใช่',no:'ไม่ใช่'};
    return showValue(options[value] ?? value);
  };
  const comparableValue = (id,value) => ['reported','complete','incident'].includes(id) ? dateValue(value) : typeof value === 'boolean' ? value : String(value ?? '').trim();
  const changedFields = (before,after) => allFields.filter(id => comparableValue(id,before[id]) !== comparableValue(id,after[id]))
    .map(id => ({key:id,label:names[id],before:before[id],after:after[id]}));

  function claimPane(page) { return page?.querySelector('[data-hospital-pane="claim"]'); }
  function stepOne(page) { return page?.querySelector('#hfStepPane1, #hhStepPane1'); }
  function formControl(page, label) {
    const target = normalized(label);
    return Array.from(stepOne(page)?.querySelectorAll('.treatment-detail-actual label') || [])
      .find(node => normalized(node.querySelector(':scope > div')?.textContent) === target)
      ?.querySelector('input,select,textarea') || null;
  }
  function getFormValue(page, label) { return formControl(page,label)?.value || ''; }
  function currentFormValue(page,label,fallback='') { const control=formControl(page,label);return control ? control.value : fallback; }
  function medicalControl(page,label) {return Array.from(stepOne(page)?.querySelectorAll('.hospital-medical-info-section label')||[]).find(node=>normalized(node.querySelector(':scope > div')?.textContent)===normalized(label))?.querySelector('input,textarea,select')||null;}
  function doctorControl(page,label) {return Array.from(stepOne(page)?.querySelectorAll('.hospital-doctor-section label')||[]).find(node=>normalized(node.querySelector(':scope > div')?.textContent)===normalized(label))?.querySelector('input')||null;}
  function readDocuments(page) {
    const table = Array.from(stepOne(page)?.querySelectorAll('table') || []).find(node =>
      /รายการเอกสาร|ประเภทเอกสาร/.test(node.querySelector('thead')?.textContent || ''));
    return Array.from(table?.querySelectorAll('tbody tr') || []).map((tr,index) => {
      const cells = tr.querySelectorAll('td');
      const headers=Array.from(table.querySelectorAll('thead th'), th => normalized(th.textContent));
      const codeAt=headers.findIndex(value => value.includes('รหัสเอกสาร'));
      const typeAt=headers.findIndex(value => value.includes('ประเภทเอกสาร') || value.includes('รายการเอกสาร'));
      const countAt=headers.findIndex(value => value.includes('จำนวนเอกสาร'));
      return {code:codeAt>=0 ? cells[codeAt]?.textContent.trim() || '' : '',
        name:cells[typeAt>=0 ? typeAt : 0]?.textContent.trim() || `เอกสาร ${index+1}`,
        count:Number((cells[countAt>=0 ? countAt : 2]?.textContent || '').replace(/[^\d]/g,'')) || 0};
    });
  }
  function baseline(page,row) {
    const choice = window.hospitalClaimSelectionState || {};
    const traffic = window.__getHospitalTrafficAccidentState?.(page) || {};
    const prefix = page.id === 'considerHospitalOpdFullPage' ? 'hf' : 'hh';
    const box = page.querySelector('#'+prefix+'InsuranceExcessStep2Box');
    const excess = box?.querySelector('#'+prefix+'InsuranceExcessStep2Checkbox');
    const model = {
      cause:choice.cause || row.claimCause || '', coverage:choice.coverage || 'ค่ารักษา', treatment:choice.treatment || row.treatmentType || 'OPD',
      reported:dateValue(currentFormValue(page,'วันที่แจ้ง',row.claimDate)),
      complete:dateValue(currentFormValue(page,'วันที่เอกสารครบ',row.documentCompleteDate)),
      incident:dateValue(currentFormValue(page,'วันที่เกิดเหตุ',row.incidentDate)),
      incidentTime:currentFormValue(page,'เวลาที่เกิดเหตุ',row.incidentTime || ''),
      hospital:currentFormValue(page,'สถานพยาบาล',row.hospital || ''),
      symptom:currentFormValue(page,'อาการสำคัญ(ChiefComplaint)',row.chiefComplaint || ''),
      diagnosis1:currentFormValue(page,'การวินิจฉัย1(Diagnosis1)',row.diagnosis1 || ''),
      diagnosis2:currentFormValue(page,'การวินิจฉัย2(Diagnosis2)',row.diagnosis2 || ''),
      diagnosis3:currentFormValue(page,'การวินิจฉัย3(Diagnosis3)',row.diagnosis3 || ''),
      diagnosis4:currentFormValue(page,'การวินิจฉัย4(Diagnosis4)',row.diagnosis4 || ''),
      diagnosis5:currentFormValue(page,'การวินิจฉัย5(Diagnosis5)',row.diagnosis5 || ''),
      diagnosis6:currentFormValue(page,'การวินิจฉัย6(Diagnosis6)',row.diagnosis6 || ''),
      injury:currentFormValue(page,'รายละเอียดการเจ็บป่วย/การบาดเจ็บ',row.medicalNote || ''),
      note:currentFormValue(page,'หมายเหตุ(ถ้ามี)',row.optionalNote || ''),
      hn:medicalControl(page,'HN')?.value ?? row.hn ?? '',
      additionalDetail:medicalControl(page,'รายละเอียดเพิ่มเติม')?.value ?? row.additionalDetail ?? '',
      physical:page.querySelector('[data-physical-therapy="hospital"] [data-physical-therapy-checkbox]')?.checked ?? !!row.isPhysicalTherapy,
      necessity:page.querySelector('[data-physical-therapy="hospital"] [data-physical-therapy-select]')?.value ?? row.medicalNecessity ?? '',
      traffic:traffic.isTrafficAccident === 'yes', vehicle:traffic.vehicle || '', vehicleOther:traffic.vehicleOther || '',
      casualty:traffic.casualty || '', porobo:traffic.poroboExcess || '', poroboReason:traffic.noPoroboReason || '',
      excess:excess ? excess.checked : !!row.insuranceExcess,
      insurer:box?.querySelector('#'+prefix+'InsuranceExcessCompanyStep2')?.value ?? row.insuranceCompany ?? '',
      license:doctorControl(page,names.license)?.value ?? row.doctorLicense ?? '',
      doctorName:doctorControl(page,names.doctorName)?.value ?? row.doctorName ?? '',
      documents:readDocuments(page), files:[]
    };
    if(!model.physical)model.necessity='';
    if(!model.traffic){model.vehicle='';model.vehicleOther='';model.casualty='';model.porobo='';model.poroboReason='';}
    else {if(model.vehicle!=='other')model.vehicleOther='';if(model.porobo!=='no')model.poroboReason='';}
    if(!model.excess)model.insurer='';
    return model;
  }
  function field(id,value,type='text') {
    const displayed = type === 'date' ? dateValue(value) : value;
    return `<label class="hce-field"><span>${esc(names[id])}</span><input data-hce-field="${id}" type="${type}" value="${esc(displayed)}"></label>`;
  }
  function select(id,value,options,locked=false) {
    const list = [...new Set([value,...options].filter(Boolean))];
    const labels={motorcycle:'มอเตอร์ไซค์',car:'รถยนต์',other:'อื่นๆ',driver:'ผู้ขับขี่',passenger:'ผู้โดยสาร',yes:'ใช่',no:'ไม่ใช่'};
    const placeholder=locked ? '' : `<option value=""${!value?' selected':''}>--- โปรดระบุ ---</option>`;
    return `<label class="hce-field"><span>${esc(names[id])}</span><select data-hce-field="${id}"${locked ? ' disabled aria-disabled="true"' : ''}>${placeholder}${list.map(item => `<option value="${esc(item)}"${item===value?' selected':''}>${esc(labels[item] || item)}</option>`).join('')}</select></label>`;
  }
  function radioGroup(id,value,options) {
    const labels={motorcycle:'มอเตอร์ไซค์',car:'รถยนต์',other:'อื่นๆ',driver:'ผู้ขับขี่',passenger:'ผู้โดยสาร',yes:'ใช่',no:'ไม่ใช่'};
    const list=[...new Set([value,...options].filter(Boolean))];
    return `<fieldset class="hce-radio-group"><legend>${esc(names[id])} <span aria-hidden="true">*</span></legend>${list.map(item => `<label><input type="radio" name="hce-${id}" data-hce-field="${id}" value="${esc(item)}"${item===value?' checked':''}>${esc(labels[item] || item)}</label>`).join('')}</fieldset>`;
  }
  function checkbox(id,checked) { return `<label class="hce-check"><input data-hce-field="${id}" type="checkbox"${checked?' checked':''}><span>${esc(names[id])}</span></label>`; }
  function documentsHtml(model) {
    const rows = model.documents || [];
    const shown=rows.length ? rows : [{code:'',name:'เอกสารประกอบการพิจารณาเคลม',count:0}];
    return `<div class="hce-doc-wrap"><table class="hce-doc-table"><thead><tr><th>รหัสเอกสาร</th><th>ประเภทเอกสาร</th><th>สแกนเอกสาร</th><th>จำนวนเอกสาร</th><th>รายละเอียด</th></tr></thead><tbody>${shown.map((item,index) => `<tr><td>${esc(item.code || '—')}</td><td>${esc(item.name)}</td><td><button type="button" class="hce-scan-button" data-hce-scan>สแกนเอกสาร</button></td><td data-hce-doc-count="${index}">${item.count + (model.files || []).length}</td><td><button type="button" class="hce-view-button" data-hce-view="${index}" aria-label="ดูรายละเอียด ${esc(item.name)}" aria-expanded="false" title="ดูรายละเอียด"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr><tr class="hce-doc-details" data-hce-doc-details="${index}" hidden><td colspan="5"><strong>เอกสารเดิม</strong> ${esc(item.name)} (${item.count} ฉบับ)<ul data-hce-file-list>${(model.files || []).map(file => `<li>${esc(file.name)}</li>`).join('')}</ul></td></tr>`).join('')}</tbody></table></div><input data-hce-files type="file" accept=".pdf,.doc,.docx,image/*" multiple hidden>`;
  }
  function editorHtml(model) {
    const medical = window.CLAIM_AGENT_MEDICAL_NECESSITY || {};
    return `<section class="hce-editor" data-hce-editor><header><span class="material-icons-round" aria-hidden="true">edit_note</span><div><h2>แก้ไขข้อมูลเคลม</h2></div></header>
      <div class="hce-body"><div class="hce-group"><h3>ข้อมูลการเคลม</h3><div class="hce-grid">
        ${select('cause',model.cause,['เจ็บป่วย','อุบัติเหตุ'])}${select('coverage','ค่ารักษา',['ค่ารักษา'],true)}${select('treatment',model.treatment,['OPD','IPD','Day Case Surgery'])}
        ${field('reported',model.reported,'date')}${field('complete',model.complete,'date')}${field('incident',model.incident,'date')}${field('incidentTime',model.incidentTime,'time')}
        ${field('hospital',model.hospital)}${field('symptom',model.symptom)}${field('diagnosis1',model.diagnosis1)}${field('diagnosis2',model.diagnosis2)}${field('diagnosis3',model.diagnosis3)}
        ${field('injury',model.injury)}${field('note',model.note)}</div></div>
        <div class="hce-group hce-reference-card hce-physical-card"><div class="hce-reference-head"><span class="material-icons-round" aria-hidden="true">accessibility_new</span><div><h3>ข้อมูลกายภาพบำบัด</h3><p>ข้อมูลประกอบการพิจารณารายการรักษา</p></div></div><div class="hce-reference-body">${checkbox('physical',model.physical)}<div data-hce-physical-detail><label class="hce-field"><span>ความจำเป็นทางการแพทย์ <b class="hce-required" aria-hidden="true">*</b></span><select data-hce-field="necessity"><option value="">เลือกความจำเป็นทางการแพทย์</option>${Object.entries(medical).map(([key,item]) => `<option value="${esc(key)}"${model.necessity===key?' selected':''}>${esc(item.thai)}${item.english ? ` (${esc(item.english)})` : ''}</option>`).join('')}</select></label><div class="hce-necessity-helper" data-hce-necessity-helper hidden><span class="material-icons-round" aria-hidden="true">info</span><span data-hce-necessity-description></span></div></div></div></div>
        <div class="hce-group hce-reference-card hce-traffic-card"><div class="hce-reference-head"><span class="material-icons-round" aria-hidden="true">directions_car</span><div><h3>ข้อมูลอุบัติเหตุจากการจราจร</h3><p>ข้อมูลประกอบการพิจารณาสิทธิ์จากอุบัติเหตุทางถนน</p></div></div><div class="hce-reference-body"><fieldset class="hce-traffic-choice"><legend>เป็นอุบัติเหตุจากการจราจร <span aria-hidden="true">*</span></legend><label><input type="radio" name="hceTraffic" data-hce-field="traffic" value="yes"${model.traffic?' checked':''}> ใช่</label><label><input type="radio" name="hceTraffic" data-hce-field="traffic" value="no"${!model.traffic?' checked':''}> ไม่ใช่</label></fieldset><div class="hce-traffic-columns" data-hce-traffic-detail>
          <div class="hce-traffic-column">${radioGroup('vehicle',model.vehicle,['motorcycle','car','other'])}${field('vehicleOther',model.vehicleOther)}</div><div class="hce-traffic-column">${radioGroup('casualty',model.casualty,['driver','passenger'])}<div class="hce-traffic-reminder" data-hce-traffic-reminder hidden><span class="material-icons-round" aria-hidden="true">info</span><span>กรุณาตรวจสอบผลตรวจแอลกอฮอล์ประกอบการพิจารณาเคลม</span></div></div><div class="hce-traffic-column">${radioGroup('porobo',model.porobo,['yes','no'])}${field('poroboReason',model.poroboReason)}</div></div></div></div>
        <div class="hce-group hce-reference-card hce-doc-card"><div class="hce-doc-heading"><span class="material-icons-round" aria-hidden="true">subject</span><h3>สแกนเอกสาร</h3></div>${documentsHtml(model)}</div>
        <div class="hce-group"><h3>ส่วนเกินจากบริษัทประกัน</h3>${checkbox('excess',model.excess)}${select('insurer',model.insurer,['วิริยะประกันภัย','กรุงเทพประกันภัย','เมืองไทยประกันชีวิต','ไทยประกันชีวิต','อลิอันซ์ อยุธยา','เอไอเอ'])}</div>
        <p class="hce-error" data-hce-error role="alert" hidden></p></div>
      <footer><button type="button" data-hce-cancel>ยกเลิกการแก้ไข</button><button type="button" data-hce-save>บันทึกการแก้ไข</button></footer></section>`;
  }
  function syncConditional(editor) {
    const active = id => id==='traffic' ? editor.querySelector('[data-hce-field="traffic"]:checked')?.value==='yes' : !!editor.querySelector(`[data-hce-field="${id}"]`)?.checked;
    editor.querySelector('[data-hce-physical-detail]').hidden = !active('physical');
    editor.querySelector('[data-hce-traffic-detail]').hidden = !active('traffic');
    editor.querySelector('[data-hce-field="necessity"]').disabled = !active('physical');
    const necessity=editor.querySelector('[data-hce-field="necessity"]').value;
    const medical=window.CLAIM_AGENT_MEDICAL_NECESSITY || {};
    const helper=editor.querySelector('[data-hce-necessity-helper]');
    helper.hidden=!active('physical') || !medical[necessity]?.description;
    editor.querySelector('[data-hce-necessity-description]').textContent=medical[necessity]?.description || '';
    ['vehicle','vehicleOther','casualty','porobo','poroboReason'].forEach(id => { editor.querySelectorAll(`[data-hce-field="${id}"]`).forEach(control => {control.disabled = !active('traffic');}); });
    editor.querySelector('[data-hce-field="vehicleOther"]').closest('label').hidden = !active('traffic') || editor.querySelector('[data-hce-field="vehicle"]:checked')?.value !== 'other';
    editor.querySelector('[data-hce-field="poroboReason"]').closest('label').hidden = !active('traffic') || editor.querySelector('[data-hce-field="porobo"]:checked')?.value !== 'no';
    editor.querySelector('[data-hce-traffic-reminder]').hidden = !active('traffic') || editor.querySelector('[data-hce-field="casualty"]:checked')?.value !== 'driver';
    editor.querySelector('[data-hce-field="insurer"]').disabled = !active('excess');
    editor.querySelector('[data-hce-field="insurer"]').closest('label').hidden = !active('excess');
  }
  function readEditor(editor, before) {
    const after = {...before};
    allFields.forEach(id => {
      const field = editor.querySelector(`[data-hce-field="${id}"]`);
      if (id === 'coverage') { after[id]='ค่ารักษา'; return; }
      if (id === 'traffic') { after[id]=editor.querySelector('[data-hce-field="traffic"]:checked')?.value==='yes'; return; }
      if (['vehicle','casualty','porobo'].includes(id)) { after[id]=editor.querySelector(`[data-hce-field="${id}"]:checked`)?.value || ''; return; }
      after[id] = field?.type === 'checkbox' ? !!field.checked : (field?.value || '').trim();
    });
    if (!after.physical) after.necessity='';
    if (!after.traffic) ['vehicle','vehicleOther','casualty','porobo','poroboReason'].forEach(id => { after[id]=''; });
    if (after.traffic && after.vehicle !== 'other') after.vehicleOther='';
    if (after.traffic && after.porobo !== 'no') after.poroboReason='';
    if (!after.excess) after.insurer='';
    return after;
  }
  function applyToRow(row,after) {
    row.claimCause=after.cause; row.treatmentType=after.treatment;
    row.claimType=after.treatment==='OPD' ? (/Full/i.test(row.claimType||'') ? 'OPD Full' : 'OPD Half') : after.treatment;
    Object.assign(row,{claimDate:after.reported,documentCompleteDate:after.complete,incidentDate:after.incident,incidentTime:after.incidentTime,
      hospital:after.hospital,chiefComplaint:after.symptom,diagnosis1:after.diagnosis1,diagnosis2:after.diagnosis2,diagnosis3:after.diagnosis3,diagnosis4:after.diagnosis4,diagnosis5:after.diagnosis5,diagnosis6:after.diagnosis6,
      medicalNote:after.injury,optionalNote:after.note,hn:after.hn,additionalDetail:after.additionalDetail,isPhysicalTherapy:after.physical,medicalNecessity:after.necessity || null,
      insuranceExcess:after.excess,insuranceCompany:after.insurer,doctorLicense:after.license,doctorName:after.doctorName});
    row.trafficAccident={isTrafficAccident:after.traffic,vehicle:after.vehicle,vehicleOther:after.vehicleOther,
      casualty:after.casualty,poroboExcess:after.porobo,noPoroboReason:after.poroboReason};
    const detail=row.claimDetailMock;
    if(detail && typeof detail==='object') Object.assign(detail,{incidentDateTime:{date:after.incident,time:after.incidentTime},hospitalName:after.hospital,
      chiefComplaint:after.symptom,diagnosis1:after.diagnosis1,diagnosis2:after.diagnosis2,diagnosis3:after.diagnosis3,diagnosis4:after.diagnosis4,diagnosis5:after.diagnosis5,diagnosis6:after.diagnosis6,
      medicalNote:after.injury,optionalNote:after.note,hn:after.hn,additionalDetail:after.additionalDetail,doctorLicense:after.license,doctorName:after.doctorName});
  }
  function applyToForm(page,values) {
    const mapping={reported:'วันที่แจ้ง',complete:'วันที่เอกสารครบ',incident:'วันที่เกิดเหตุ',incidentTime:'เวลาที่เกิดเหตุ',
      hospital:'สถานพยาบาล',symptom:'อาการสำคัญ(ChiefComplaint)',diagnosis1:'การวินิจฉัย1(Diagnosis1)',
      diagnosis2:'การวินิจฉัย2(Diagnosis2)',diagnosis3:'การวินิจฉัย3(Diagnosis3)',diagnosis4:'การวินิจฉัย4(Diagnosis4)',diagnosis5:'การวินิจฉัย5(Diagnosis5)',diagnosis6:'การวินิจฉัย6(Diagnosis6)',injury:'รายละเอียดการเจ็บป่วย/การบาดเจ็บ',note:'หมายเหตุ(ถ้ามี)'};
    Object.entries(mapping).forEach(([id,label]) => {
      const control=formControl(page,label); if(!control) return;
      if(control.tagName==='SELECT' && !Array.from(control.options).some(option => option.value===values[id])) control.add(new Option(values[id],values[id]));
      control.value=control.classList.contains('global-be-date-display')?displayDate(values[id]):values[id]||'';
    });
    [['license',names.license],['doctorName',names.doctorName]].forEach(([id,label])=>{const control=doctorControl(page,label);if(control)control.value=values[id]||'';});
    [['hn','HN'],['additionalDetail','รายละเอียดเพิ่มเติม']].forEach(([id,label])=>{const control=medicalControl(page,label);if(control)control.value=values[id]||'';});
    const physical=page.querySelector('[data-physical-therapy="hospital"]');
    if(physical){const checkbox=physical.querySelector('[data-physical-therapy-checkbox]'),select=physical.querySelector('[data-physical-therapy-select]');if(checkbox)checkbox.checked=!!values.physical;if(select)select.value=values.necessity||'';physical.querySelector('[data-physical-therapy-editor]')?.toggleAttribute('hidden',!values.physical);}
    const prefix=page.id==='considerHospitalOpdFullPage' ? 'hf' : 'hh';
    const check=page.querySelector('#'+prefix+'InsuranceExcessStep2Checkbox');
    if(check) { check.checked=!!values.excess; window.toggleHospitalInsuranceExcessStep2?.(prefix); }
    const company=page.querySelector('#'+prefix+'InsuranceExcessCompanyStep2');
    if(company) company.value=values.insurer || '';
    window.__setHospitalTrafficAccidentState?.(page,{isTrafficAccident:values.traffic?'yes':'no',vehicle:values.vehicle,
      vehicleOther:values.vehicleOther,casualty:values.casualty,poroboExcess:values.porobo,noPoroboReason:values.poroboReason});
  }
  function closeEditor(toHistory=true) {
    const page=activePage();
    page?.querySelector('[data-hce-editor]')?.remove();
    page?.querySelector('[data-hce-native-banner]')?.remove();
    page?.querySelectorAll('[data-hce-native-actions],[data-hce-native-files-wrap]').forEach(node=>node.remove());
    page?.querySelector('[data-hce-reason-section]')?.remove();
    page?.classList.remove('hce-active');
    nativeActive=null;
    suppressedViews.forEach((display,node)=>{if(!node.isConnected)return;if(display.value)node.style.setProperty('display',display.value,display.priority);else node.style.removeProperty('display');});
    suppressedViews.clear();
    nativeLocks.forEach((state,control)=>{if(!control.isConnected)return;control.disabled=state.disabled;control.readOnly=state.readOnly;if(state.tabIndex===null)control.removeAttribute('tabindex');else control.setAttribute('tabindex',state.tabIndex);if(state.ariaDisabled===null)control.removeAttribute('aria-disabled');else control.setAttribute('aria-disabled',state.ariaDisabled);});
    nativeLocks.clear();
    if(toHistory) window.setHospitalMainTab?.('transactions');
  }
  function nativeAllowed(page,control) {
    if(control.closest('[data-hce-native-actions],[data-hce-native-banner],[data-hce-native-files-wrap],[data-hce-reason-section]')) return true;
    if(control.matches('[data-claim-choice="cause"],[data-claim-choice="coverage"],[data-claim-choice="treatment"]')) return true;
    if(control.matches('[data-physical-therapy-checkbox]'))return true;
    if(control.matches('[data-physical-therapy-select]'))return !!page.querySelector('[data-physical-therapy="hospital"] [data-physical-therapy-checkbox]')?.checked;
    if(control.closest('[data-hospital-traffic-accident]') && control.matches('input,select,textarea')){
      const state=window.__getHospitalTrafficAccidentState?.(page)||{};
      if(control.closest('[data-traffic-group="accident"]'))return true;
      if(state.isTrafficAccident!=='yes')return false;
      if(control.id?.endsWith('TrafficVehicleOther'))return state.vehicle==='other';
      if(control.id?.endsWith('TrafficNoPoroboReason'))return state.poroboExcess==='no';
      return true;
    }
    if(control.closest('.hospital-doctor-section') && control.matches('input')) return true;
    if(control.closest('.hospital-medical-info-section') && ['HN','รายละเอียดเพิ่มเติม'].some(label=>medicalControl(page,label)===control)) return true;
    if(control.matches('[id$="InsuranceExcessStep2Checkbox"]'))return true;
    if(control.matches('[id$="InsuranceExcessCompanyStep2"]'))return !!page.querySelector(`#${control.id.slice(0,2)}InsuranceExcessStep2Checkbox`)?.checked;
    if(control.closest('.treatment-detail-actual label') && control.matches('input,select,textarea')) {
      return ['วันที่แจ้ง','วันที่เอกสารครบ','วันที่เกิดเหตุ','เวลาที่เกิดเหตุ','สถานพยาบาล','อาการสำคัญ(ChiefComplaint)','การวินิจฉัย1(Diagnosis1)','การวินิจฉัย2(Diagnosis2)','การวินิจฉัย3(Diagnosis3)','การวินิจฉัย4(Diagnosis4)','การวินิจฉัย5(Diagnosis5)','การวินิจฉัย6(Diagnosis6)','รายละเอียดการเจ็บป่วย/การบาดเจ็บ'].some(label=>{const visible=formControl(page,label);return visible===control || visible?._beDisplay===control || visible?.closest('.global-be-date-wrap')?.querySelector('.global-be-date-native')===control;});
    }
    return control.tagName==='BUTTON' && /^(กลับ|ถัดไป|สแกนเอกสาร)$/.test(String(control.textContent||'').replace(/arrow_back|arrow_forward|scanner/g,'').trim());
  }
  function gateNative(page) {
    if(!nativeActive || !page) return;
    page.querySelectorAll('.hospital-claim-content input,.hospital-claim-content select,.hospital-claim-content textarea,.hospital-claim-content button').forEach(control=>{
      if(!nativeLocks.has(control))nativeLocks.set(control,{disabled:control.disabled,readOnly:control.readOnly,tabIndex:control.getAttribute('tabindex'),ariaDisabled:control.getAttribute('aria-disabled')});
      const allowed=nativeAllowed(page,control);
      if(control.disabled===allowed)control.disabled=!allowed;
      if(allowed && control.matches('input,textarea') && control.readOnly)control.readOnly=false;
      if(control.getAttribute('aria-disabled')!==String(!allowed))control.setAttribute('aria-disabled',String(!allowed));
    });
  }
  function suppressOriginalUI(page) {
    if(!nativeActive || !page)return;
    page.querySelectorAll('#hfStepPane1 .customer-decision-section,#hfStepPane2 .customer-decision-section,#hfStepPane3 .customer-decision-section,#hhStepPane1 .customer-decision-section,#hhStepPane2 .customer-decision-section,#hhStepPane3 .customer-decision-section,#hfStepPane1 .cc-ref-decision-wrap,#hfStepPane2 .cc-ref-decision-wrap,#hfStepPane3 .cc-ref-decision-wrap,#hhStepPane1 .cc-ref-decision-wrap,#hhStepPane2 .cc-ref-decision-wrap,#hhStepPane3 .cc-ref-decision-wrap,#hfStepPane1 .cc-ref-actionbar,#hfStepPane2 .cc-ref-actionbar,#hfStepPane3 .cc-ref-actionbar,#hhStepPane1 .cc-ref-actionbar,#hhStepPane2 .cc-ref-actionbar,#hhStepPane3 .cc-ref-actionbar').forEach(node=>{
      if(!suppressedViews.has(node))suppressedViews.set(node,{value:node.style.getPropertyValue('display'),priority:node.style.getPropertyPriority('display')});
      if(node.style.getPropertyValue('display')!=='none')node.style.setProperty('display','none','important');
    });
  }
  function syncTreatmentFields(page) {
    if(!nativeActive || !page)return;
    const prefix=page.id==='considerHospitalOpdHalfPage'?'hh':'hf';
    const treatment=window.hospitalClaimSelectionState?.treatment ?? currentRow()?.treatmentType ?? '';
    const hasStay=/IPD|Day\s*Case/i.test(treatment);
    const documentHint=page.querySelector('.hospital-step1-document-check > .mt-2');
    const hint=`ตรวจสอบเอกสารประกอบการพิจารณาเคลม ${treatment==='OPD' ? (page.id==='considerHospitalOpdHalfPage'?'OPD Half':'OPD Full') : treatment}`;
    if(documentHint && documentHint.textContent!==hint)documentHint.textContent=hint;
    let stay=page.querySelector(`#${prefix}StaySection`);
    if(hasStay && !stay && typeof window.renderHospitalTreatmentDetail==='function'){
      const holder=document.createElement('div');
      holder.innerHTML=window.renderHospitalTreatmentDetail(currentRow()||{},prefix==='hf'?'full':'half');
      stay=holder.querySelector(`#${prefix}StaySection`);
      if(stay)page.querySelector(`#${prefix}DischargeTime`)?.closest('label')?.after(stay);
    }
    if(!stay)return;
    stay.classList.toggle('hidden',!hasStay);
    stay.setAttribute('aria-hidden',String(!hasStay));
    const label=stay.querySelector(`#${prefix}IpdDaysLabel`);
    const stayLabel=/IPD/i.test(treatment)?'จำนวนวัน IPD <span class="req-star">*</span>':'จำนวนวัน IPD <span class="claim-ipd-stay-optional">ไม่บังคับ</span>';
    if(label && label.innerHTML!==stayLabel)label.innerHTML=stayLabel;
  }
  function installNative(page) {
    if(!nativeActive || !page)return;
    page.querySelector('[data-hce-native-banner]')?.remove();
    const prefix=page.id==='considerHospitalOpdHalfPage'?'hh':'hf';
    const documentSection=Array.from(page.querySelectorAll(`#${prefix}StepPane1 .rounded-xl`)).reverse().find(node=>node.querySelector('table thead') && /สแกนเอกสาร/.test(node.querySelector('table thead').textContent));
    if(documentSection && !documentSection.querySelector('[data-hce-native-files-wrap]')){const wrap=document.createElement('div');wrap.dataset.hceNativeFilesWrap='';wrap.hidden=true;wrap.innerHTML='<input type="file" data-hce-native-files accept=".pdf,.doc,.docx,image/*" multiple>';documentSection.append(wrap);}
    if(documentSection && !page.querySelector('[data-hce-reason-section]')) {
      const section=document.createElement('section');section.className='hce-reason-section';section.dataset.hceReasonSection='';
      section.innerHTML='<div class="hce-reason-heading"><span class="material-icons-round" aria-hidden="true">edit_note</span><div><h3>แก้ไขข้อมูลเคลม</h3><p>แก้ไขได้เฉพาะฟิลด์ที่กำหนดใน บันทึกข้อมูลเคลม</p></div></div><label for="hceNativeReason">เหตุผลการแก้ไข <span aria-hidden="true">*</span></label><textarea id="hceNativeReason" data-hce-reason-input rows="3" aria-required="true"></textarea><p data-hce-reason-error role="alert" hidden></p><p data-hce-native-error role="alert" hidden></p><div class="hce-native-actions" data-hce-native-actions><button type="button" data-hce-native-cancel>ยกเลิกการแก้ไข</button><button type="button" data-hce-native-next>ถัดไป</button><button type="button" data-hce-native-save>บันทึกการแก้ไข</button></div>';
      documentSection.after(section);
    }
    [2,3].forEach(step=>{const pane=page.querySelector(`#${prefix}StepPane${step}`);if(!pane||pane.querySelector('[data-hce-native-actions]'))return;const bar=document.createElement('div');bar.className='hce-native-actions';bar.dataset.hceNativeActions='';bar.innerHTML=`<button type="button" data-hce-native-cancel>ยกเลิกการแก้ไข</button><button type="button" data-hce-native-back>กลับ</button>${step<3?'<button type="button" data-hce-native-next>ถัดไป</button>':''}<button type="button" data-hce-native-save>บันทึกการแก้ไข</button>`;pane.append(bar);});
    syncTreatmentFields(page);
    suppressOriginalUI(page);
    gateNative(page);
  }
  function readNative(page,before) {
    const after={...before};
    const selection=window.hospitalClaimSelectionState||{};
    after.cause=selection.cause ?? before.cause;after.coverage=selection.coverage || before.coverage;after.treatment=selection.treatment ?? before.treatment;
    const mapping={reported:'วันที่แจ้ง',complete:'วันที่เอกสารครบ',incident:'วันที่เกิดเหตุ',incidentTime:'เวลาที่เกิดเหตุ',hospital:'สถานพยาบาล',symptom:'อาการสำคัญ(ChiefComplaint)',diagnosis1:'การวินิจฉัย1(Diagnosis1)',diagnosis2:'การวินิจฉัย2(Diagnosis2)',diagnosis3:'การวินิจฉัย3(Diagnosis3)',diagnosis4:'การวินิจฉัย4(Diagnosis4)',diagnosis5:'การวินิจฉัย5(Diagnosis5)',diagnosis6:'การวินิจฉัย6(Diagnosis6)',injury:'รายละเอียดการเจ็บป่วย/การบาดเจ็บ'};
    Object.entries(mapping).forEach(([id,label])=>{const control=formControl(page,label);if(control)after[id]=['reported','complete','incident'].includes(id)?dateValue(control.value):control.value.trim();});
    const hn=medicalControl(page,'HN'),additional=medicalControl(page,'รายละเอียดเพิ่มเติม');
    const license=doctorControl(page,names.license),doctor=doctorControl(page,names.doctorName);
    if(hn)after.hn=hn.value.trim();if(additional)after.additionalDetail=additional.value.trim();
    if(license)after.license=license.value.trim();if(doctor)after.doctorName=doctor.value.trim();
    const physical=page.querySelector('[data-physical-therapy="hospital"]');
    const physicalCheck=physical?.querySelector('[data-physical-therapy-checkbox]');
    if(physicalCheck)after.physical=physicalCheck.checked;
    if(after.physical){const necessity=physical?.querySelector('[data-physical-therapy-select]');if(necessity)after.necessity=necessity.value;}else after.necessity='';
    const traffic=window.__getHospitalTrafficAccidentState?.(page);
    if(traffic){
      after.traffic=traffic.isTrafficAccident==='yes';
      after.vehicle=after.traffic?traffic.vehicle||'':'';
      after.vehicleOther=after.traffic&&after.vehicle==='other'?traffic.vehicleOther||'':'';
      after.casualty=after.traffic?traffic.casualty||'':'';
      after.porobo=after.traffic?traffic.poroboExcess||'':'';
      after.poroboReason=after.traffic&&after.porobo==='no'?traffic.noPoroboReason||'':'';
    }
    const prefix=page.id==='considerHospitalOpdHalfPage'?'hh':'hf';
    const excess=page.querySelector(`#${prefix}InsuranceExcessStep2Checkbox`);
    if(excess)after.excess=excess.checked;
    if(after.excess){const insurer=page.querySelector(`#${prefix}InsuranceExcessCompanyStep2`);if(insurer)after.insurer=insurer.value;}else after.insurer='';
    return after;
  }
  function nativeError(message,control) {const target=activePage()?.querySelector('[data-hce-native-error]');if(target){target.textContent=message;target.hidden=false;}control?.focus();}
  function openEditor() {
    const page=activePage(), row=currentRow();
    if(!page || !row) return;
    closeEditor(false);
    const key=claimKey(row);
    window.setHospitalMainTab?.('claim');
    const model=saved.get(key)?.values||baseline(page,row);
    nativeActive={key,before:structuredClone(model),files:[]};
    page.classList.add('hce-active');
    if(page.id==='considerHospitalOpdHalfPage')window.setHospitalHalfStep?.(1);else window.setHospitalFullStep?.(1);
    installNative(page);
    claimPane(page)?.scrollIntoView({block:'start'});
  }
  function timeLabel(date) { return new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date); }
  function renderHistory() {
    const page=activePage(), row=currentRow(); if(!page || !row) return;
    const pane=page.querySelector('[data-hospital-pane="transactions"]'), list=pane?.querySelector('.timeline-modern'); if(!list) return;
    list.querySelectorAll('[data-hce-history]').forEach(node => node.remove());
    const decision=Array.from(list.querySelectorAll('.timeline-card')).find(card => normalized(card.querySelector('.timeline-title')?.textContent)==='บันทึกผลพิจารณา');
    if(decision && !decision.querySelector('[data-hce-start]')) {
      const button=document.createElement('button'); button.type='button'; button.dataset.hceStart='true'; button.className='hce-history-action'; button.textContent='แก้ไขข้อมูลเคลม';
      decision.querySelector('.timeline-right')?.append(button);
    }
    const events=saved.get(claimKey(row))?.events || [];
    events.forEach((event,index) => {
      const reverseIndex=events.length-1-index;
      const item=document.createElement('div'); item.className='timeline-row'; item.dataset.hceHistory=String(index);
      item.innerHTML=`<div class="timeline-dot blue"><span class="material-icons-round">edit_note</span></div><div class="timeline-card" data-hce-detail-index="${reverseIndex}"><div class="timeline-date-block"><div><span class="timeline-date">${esc(timeLabel(event.at))}</span><div class="timeline-sub">${esc(event.actor || demoActor)}</div></div></div><div class="timeline-meta"><div class="timeline-title">แก้ไขข้อมูลเคลม</div><div class="timeline-sub">เปลี่ยน ${event.changes.length} ฟิลด์</div></div><div class="timeline-right"><span class="timeline-status">แก้ไขแล้ว</span><button type="button" class="hce-history-action" data-hce-detail="${reverseIndex}">ดูรายละเอียด</button></div></div>`;
      list.prepend(item);
    });
    const count=pane.querySelector('.hospital-count-pill'); if(count) count.textContent=list.querySelectorAll('.timeline-row').length+' รายการ';
  }
  function showDetail(index) {
    const row=currentRow(), events=saved.get(claimKey(row))?.events || [];
    const event=events.slice().reverse()[index]; if(!event) return;
    document.getElementById('hceDialog')?.remove();
    const layer=document.createElement('div'); layer.id='hceDialog'; layer.className='hce-overlay';
    layer.innerHTML=`<div class="hce-dialog hce-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="hceDialogTitle"><header><div class="hce-detail-heading"><span>ประวัติการทำรายการ</span><h2 id="hceDialogTitle">แก้ไขข้อมูลเคลม</h2></div><button type="button" data-hce-close aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button><dl class="hce-detail-meta"><div><dt>วันเวลาทำรายการ</dt><dd>${esc(timeLabel(event.at))} น.</dd></div><div><dt>ผู้ทำรายการ</dt><dd>${esc(event.actor || demoActor)}</dd></div><div><dt>เลข CL</dt><dd>${esc(row.claimCode || row.claimNo || '—')}</dd></div><div><dt>เลข Case</dt><dd>${esc(row.caseNo || '—')}</dd></div></dl></header><div class="hce-detail-body"><div class="hce-detail-section-head"><h3>ข้อมูลที่แก้ไข</h3><span>${event.changes.length} รายการ</span></div><div class="hce-table-wrap"><table><thead><tr><th>ข้อมูล</th><th>ก่อนแก้ไข</th><th>หลังแก้ไข</th></tr></thead><tbody>${event.changes.map(change => `<tr><td>${esc(change.label)}</td><td>${esc(showChangeValue(change,'before'))}</td><td>${esc(showChangeValue(change,'after'))}</td></tr>`).join('')}</tbody></table></div><section class="hce-detail-reason"><h3>เหตุผลการแก้ไข</h3><p>${esc(event.reason || '—')}</p></section></div></div>`;
    document.body.append(layer);
  }
  function saveEditor(form) {
    const page=activePage(), row=currentRow(), key=claimKey(row); if(!page || !row || key!==form.dataset.claimKey) return;
    const before=form.__hceModel, after=readEditor(form,before), files=form.__hceFiles || [];
    const error=form.querySelector('[data-hce-error]');
    if(!after.cause || !after.treatment || (after.physical && !after.necessity) ||
      (after.traffic && (!after.vehicle || !after.casualty || !after.porobo ||
        (after.vehicle==='other' && !after.vehicleOther) || (after.porobo==='no' && !after.poroboReason))) ||
      (after.excess && !after.insurer)) {
      error.textContent='กรุณาระบุข้อมูลที่เลือกให้ครบถ้วน'; error.hidden=false; return;
    }
    const changes=changedFields(before,after);
    const oldFiles=before.files || [], newFiles=files.slice(oldFiles.length);
    if(newFiles.length) changes.push({label:names.files,before:oldFiles.map(file => file.name).join(', ') || '—',after:files.map(file => file.name).join(', ')});
    if(!changes.length) { error.textContent='กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์หรือเลือกเอกสาร'; error.hidden=false; return; }
    after.documents=before.documents; after.files=files;
    const prior=saved.get(key), events=[...(prior?.events || []),{at:new Date(),changes,actor:demoActor}];
    saved.set(key,{values:after,events});
    applyToRow(row,after);
    closeEditor(false);
    window.openConsiderHospitalRow?.(row);
    const reopened=activePage(); if(reopened) applyToForm(reopened,after);
    window.setHospitalMainTab?.('transactions');
    renderHistory();
  }
  function saveNative() {
    const page=activePage(),row=currentRow();if(!page||!row||!nativeActive||claimKey(row)!==nativeActive.key)return;
    const before=nativeActive.before,after=readNative(page,before);
    const reasonInput=page.querySelector('[data-hce-reason-input]'),reason=reasonInput?.value.trim()||'';
    const reasonError=page.querySelector('[data-hce-reason-error]');if(reasonError)reasonError.hidden=true;
    if(!reason){if(reasonError){reasonError.textContent='กรุณาระบุเหตุผลการแก้ไข';reasonError.hidden=false;}reasonInput?.focus();return;}
    if(!after.cause||!after.coverage||!after.treatment){nativeError('กรุณาเลือกเหตุของการเคลม ประเภทความคุ้มครอง และประเภทการรักษา');return;}
    if(!after.license||!after.doctorName||
      (after.physical&&!after.necessity)||(after.traffic&&(!after.vehicle||!after.casualty||!after.porobo||
      (after.vehicle==='other'&&!after.vehicleOther)||(after.porobo==='no'&&!after.poroboReason)))||(after.excess&&!after.insurer)){
      nativeError('กรุณาระบุข้อมูลที่เลือกให้ครบถ้วน');return;
    }
    const changes=changedFields(before,after);
    const files=nativeActive.files;
    if(files.length)changes.push({label:names.files,before:(before.files||[]).map(file=>file.name).join(', ')||'—',after:[...(before.files||[]),...files].map(file=>file.name).join(', ')});
    if(!changes.length){nativeError('ยังไม่มีข้อมูลที่เปลี่ยน กรุณาแก้ไขอย่างน้อยหนึ่งฟิลด์');return;}
    after.documents=before.documents;after.files=[...(before.files||[]),...files];
    const key=nativeActive.key,prior=saved.get(key);saved.set(key,{values:after,events:[...(prior?.events||[]),{at:new Date(),changes,reason,actor:demoActor}]});
    applyToRow(row,after);closeEditor(false);
    window.openConsiderHospitalRow?.(row);
    const reopened=activePage();if(reopened)applyToForm(reopened,after);
    window.setHospitalMainTab?.('transactions');renderHistory();
  }
  window.openHospitalClaimEditFromHistory = openEditor;
  window.openHospitalClaimEditHistoryDetail = showDetail;
  const originalChoice=window.toggleHospitalClaimChoice;
  if(typeof originalChoice==='function')window.toggleHospitalClaimChoice=function(button){
    if(nativeActive && button?.dataset?.claimChoice==='cause' && button.dataset.claimValue!==window.hospitalClaimSelectionState?.cause){
      window.hospitalClaimSelectionState.treatment='';
    }
    return originalChoice.apply(this,arguments);
  };
  const originalOpen=window.openConsiderHospitalRow;
  if(typeof originalOpen==='function') window.openConsiderHospitalRow=function () {
    closeEditor(false);
    const result=originalOpen.apply(this,arguments);
    const page=activePage(), row=currentRow(), values=saved.get(claimKey(row))?.values;
    if(page && values) applyToForm(page,values);
    renderHistory();
    return result;
  };
  const originalTab=window.setHospitalMainTab;
  if(typeof originalTab==='function') window.setHospitalMainTab=function (tab) {
    const result=originalTab.apply(this,arguments);
    if(tab==='transactions') renderHistory();
    return result;
  };
  ['setHospitalFullStep','setHospitalHalfStep'].forEach(name => {
    const previous=window[name];
    if(typeof previous!=='function') return;
    window[name]=function () { const result=previous.apply(this,arguments); const page=activePage(), values=saved.get(claimKey(currentRow()))?.values; if(page && values && !nativeActive) applyToForm(page,values); if(nativeActive)installNative(page); return result; };
  });
  document.addEventListener('click',event=>{
    if(!nativeActive)return;
    const cancel=event.target.closest('[data-hce-native-cancel]');
    if(cancel){const row=currentRow();closeEditor(false);window.openConsiderHospitalRow?.(row);window.setHospitalMainTab?.('transactions');return;}
    const navigation=event.target.closest('[data-hce-native-next],[data-hce-native-back]');
    if(navigation){const page=activePage(),prefix=page?.id==='considerHospitalOpdHalfPage'?'hh':'hf';const step=Number(navigation.closest('[id$="StepPane1"],[id$="StepPane2"],[id$="StepPane3"]')?.id.match(/(\d)$/)?.[1]||1);const target=step+(navigation.hasAttribute('data-hce-native-next')?1:-1);if(prefix==='hh')window.setHospitalHalfStep?.(target);else window.setHospitalFullStep?.(target);return;}
    if(event.target.closest('[data-hce-native-save]')){saveNative();return;}
    if(event.target.closest('[data-claim-choice="treatment"]')){syncTreatmentFields(activePage());gateNative(activePage());return;}
    const scan=event.target.closest('button');
    if(scan && /^สแกนเอกสาร$/.test(scan.textContent.replace(/scanner/g,'').trim()) && activePage()?.contains(scan)){event.preventDefault();event.stopPropagation();activePage()?.querySelector('[data-hce-native-files]')?.click();}
  },true);
  document.addEventListener('change',event=>{if(!nativeActive)return;const page=activePage();if(!page?.contains(event.target))return;
    if(event.target.matches('[data-hce-native-files]')){nativeActive.files.push(...Array.from(event.target.files||[]));const table=event.target.closest('[data-hce-native-files-wrap]')?.parentElement?.querySelector('table');const countCell=table?.querySelector('tbody tr td:nth-child(4)');if(countCell)countCell.textContent=String((nativeActive.before.documents?.[0]?.count||0)+nativeActive.files.length);event.target.value='';}
    if(event.target.matches('[data-physical-therapy-checkbox]'))page.querySelector('[data-physical-therapy="hospital"] [data-physical-therapy-editor]')?.toggleAttribute('hidden',!event.target.checked);
    if(event.target.matches('[data-physical-therapy-checkbox],[data-hospital-traffic-accident] input,[id$="InsuranceExcessStep2Checkbox"]'))queueMicrotask(()=>{if(nativeActive && page.isConnected)gateNative(page);});
  });
  let nativeRefresh=false;
  new MutationObserver(mutations=>{if(!nativeActive||nativeRefresh||!mutations.some(item=>item.addedNodes.length||item.removedNodes.length))return;nativeRefresh=true;requestAnimationFrame(()=>{nativeRefresh=false;if(nativeActive)installNative(activePage());});}).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(mutations=>{if(!nativeActive || !mutations.some(item=>item.target.matches?.('.customer-decision-section,.cc-ref-decision-wrap,.cc-ref-actionbar')))return;suppressOriginalUI(activePage());}).observe(document.body,{attributes:true,attributeFilter:['style'],subtree:true});
  document.addEventListener('click',event => {
    if(event.target.closest('[data-hce-start]')) { openEditor(); return; }
    if(event.target.closest('[data-hce-cancel]')) { closeEditor(); return; }
    const save=event.target.closest('[data-hce-save]'); if(save) { saveEditor(save.closest('[data-hce-editor]')); return; }
    const detail=event.target.closest('[data-hce-detail]'); if(detail) { showDetail(Number(detail.dataset.hceDetail)); return; }
    const scan=event.target.closest('[data-hce-scan]'); if(scan) { scan.closest('[data-hce-editor]')?.querySelector('[data-hce-files]')?.click(); return; }
    const view=event.target.closest('[data-hce-view]'); if(view) { const details=view.closest('tr')?.nextElementSibling; if(details?.matches('[data-hce-doc-details]')) { details.hidden=!details.hidden; view.setAttribute('aria-expanded',String(!details.hidden)); } return; }
    if(event.target.closest('[data-hce-close], #hceDialog') && (event.target===document.getElementById('hceDialog') || event.target.closest('[data-hce-close]'))) document.getElementById('hceDialog')?.remove();
  });
  document.addEventListener('change',event => {
    const form=event.target.closest?.('[data-hce-editor]'); if(!form) return;
    if(event.target.matches('[data-hce-files]')) {
      form.__hceFiles.push(...Array.from(event.target.files || []));
      form.querySelectorAll('[data-hce-file-list]').forEach(list => { list.innerHTML=form.__hceFiles.map(file => `<li>${esc(file.name)}</li>`).join(''); });
      form.querySelectorAll('[data-hce-doc-count]').forEach((cell,index) => { cell.textContent=(form.__hceModel.documents[index]?.count || 0)+form.__hceFiles.length; });
      event.target.value='';
    } else syncConditional(form);
  });
})();
