/* จัดการข้อมูลแจ้งเคลม > แก้ไขเคลมผิดคน. Uses the existing CWI visual vocabulary. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const rules = window.claimAgentWrongInsuredDomain;
  const state = { claim: null, candidate: null, selectedCandidate: null, snapshot: null, requestKey: null, modalTrigger: null, saving: false, searchGeneration: 0, candidateGeneration: 0, exampleGeneration: 0, exampleClaims: [] };
  const escapeHtml = value => String(value == null || value === '' ? '-' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const money = value => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateTime = value => value ? new Date(value).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) : '-';
  const runtime = () => window.claimAgentCwiRuntime;
  const actor = () => runtime()?.getActor?.() || null;
  const authorized = () => rules.canCorrect(actor());
  const field = (label, value) => `<div class="cwi-item"><div class="cwi-label">${escapeHtml(label)}</div><div class="cwi-value dark">${escapeHtml(value)}</div></div>`;
  const section = (icon, title, subtitle, body, extraClass = '') => `<article class="cwi-card${extraClass ? ` ${extraClass}` : ''}"><header class="cwi-card-head"><div class="cwi-head-left"><span class="cwi-head-icon"><span class="material-icons-round" aria-hidden="true">${icon}</span></span><div><h3 class="cwi-title">${title}</h3>${subtitle ? `<p class="cwi-subtitle">${subtitle}</p>` : ''}</div></div></header><div class="cwi-body">${body}</div></article>`;

  function setError(message) {
    $('cwiClaimNoError').textContent = message || '';
    $('cwiClaimNoError').classList.toggle('hidden', !message);
    $('cwiClaimNo').setAttribute('aria-invalid', String(Boolean(message)));
  }

  function exampleDescription(claim) {
    if (claim.status !== 'Open') return claim.status || 'สถานะไม่ใช่ Open';
    if (claim.claimType === 'DEATH') return 'เคลมเสียชีวิต';
    if (claim.claimType === 'DISABILITY') return 'เคลมทุพพลภาพ';
    if (claim.claimType === 'HOSPITAL') return 'เคลมโรงพยาบาล';
    if (claim.billed) return 'วางบิลแล้ว';
    if (claim.continuous || claim.cases?.length !== 1) return 'เคลมต่อเนื่อง';
    return `${claim.product || ''} · ทำรายการได้`;
  }

  function renderMockExamples() {
    const list = $('cwiMockExampleList');
    if (!list) return;
    list.replaceChildren();
    const type = $('cwiSearchType').value;
    for (const claim of state.exampleClaims) {
      const value = type === 'CC' ? claim.cases?.[0]?.number : claim.cl;
      if (!value) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cwi-mock-example';
      button.dataset.cwiExample = value;
      const code = document.createElement('strong');
      code.textContent = value;
      const description = document.createElement('span');
      description.textContent = exampleDescription(claim);
      button.append(code, description);
      list.appendChild(button);
    }
    $('cwiMockExamples').classList.toggle('hidden', !runtime()?.isMock || !list.childElementCount);
  }

  async function refreshMockExamples() {
    const source = runtime();
    const generation = ++state.exampleGeneration;
    if (!source?.isMock) {
      state.exampleClaims = [];
      renderMockExamples();
      return;
    }
    try {
      const snapshot = await source.getSnapshot();
      if (generation !== state.exampleGeneration || runtime() !== source) return;
      state.exampleClaims = Array.isArray(snapshot.claims) ? snapshot.claims : [];
      renderMockExamples();
    } catch (_) {
      if (generation !== state.exampleGeneration) return;
      state.exampleClaims = [];
      renderMockExamples();
    }
  }

  function reset() {
    state.searchGeneration++;
    state.candidateGeneration++;
    Object.assign(state, { claim: null, candidate: null, selectedCandidate: null, candidates: [], snapshot: null, requestKey: null, saving: false });
    $('cwiSearchType').value = 'CL';
    $('cwiClaimNo').value = '';
    $('cwiClaimNo').placeholder = 'ระบุเลข CL';
    setError('');
    renderMockExamples();
    $('cwiSearchResultArea').innerHTML = '';
    $('cwiSearchResultArea').classList.add('hidden');
    $('cwiInitialPrompt').classList.remove('hidden');
    $('cwiModalKeyword').value = '';
    $('cwiModalClear').classList.add('hidden');
    $('cwiSearchHead').innerHTML = '';
    $('cwiSearchBody').innerHTML = '';
    $('cwiResultCount').textContent = '0';
    $('cwiRangeText').textContent = '0 รายการ';
    $('cwiSelectedHint').textContent = 'กรุณาเลือกรายชื่อ 1 รายการ';
    $('cwiChooseBtn').disabled = true;
    $('cwiConfirmError').textContent = '';
    $('cwiConfirmError').classList.add('hidden');
    $('cwiSuccessDescription').textContent = '';
    $('cwiNewClaimNo').textContent = '';
    ['cwiSearchModal', 'cwiConfirmModal', 'cwiSuccessModal'].forEach(closeModal);
  }

  function guard() {
    const allow = authorized();
    const menu = $('submenuCorrectWrongInsured');
    if (menu) {
      menu.classList.toggle('hidden', !allow);
      menu.hidden = !allow;
      menu.disabled = !allow;
    }
    if (!allow) $('correctWrongInsuredPage')?.classList.add('hidden');
    return allow;
  }

  function show() {
    if (!guard()) return;
    const page = $('correctWrongInsuredPage');
    if (page && page.parentElement !== document.querySelector('main')) document.querySelector('main')?.appendChild(page);
    if (typeof window.claimMoneyShowPage === 'function') window.claimMoneyShowPage('correctWrongInsuredPage', 'แก้ไขเคลมผิดคน', 'จัดการข้อมูลแจ้งเคลม / แก้ไขเคลมผิดคน');
    else { document.querySelectorAll('.page').forEach(item => item.classList.add('hidden')); page?.classList.remove('hidden'); }
    $('claimDataManagementSubmenu')?.classList.remove('hidden');
    $('menuClaimDataManagement')?.setAttribute('aria-expanded', 'true');
    document.querySelectorAll('#claimDataManagementSubmenu button').forEach(button => { button.classList.remove('bg-white/15', 'font-bold'); button.classList.add('font-semibold'); });
    $('submenuCorrectWrongInsured')?.classList.add('bg-white/15', 'font-bold');
    reset();
    refreshMockExamples();
  }

  function oldClaimMarkup(claim) {
    const fact = (icon, label, value, detail = '') => `<div class="cwi-original-fact"><span class="cwi-original-fact-icon material-icons-round" aria-hidden="true">${icon}</span><div><span class="cwi-original-fact-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div></div>`;
    const claimInfo = [claim.cause, claim.benefitType, claim.treatment].filter(Boolean).join(' | ');
    const original = section('description', 'ข้อมูลเคลมเดิม', '', `
      <div class="cwi-original-hero">
        <div class="cwi-original-person"><span class="cwi-original-avatar material-icons-round" aria-hidden="true">person</span><div><span>ผู้เอาประกัน</span><strong>${escapeHtml(claim.insuredName)}</strong><small>เลขบัตรประชาชน : ${escapeHtml(claim.nationalId)}</small></div></div>
        <div class="cwi-original-profile">${[
          field('ApplicationID', claim.appId), field('สถานะ Application', claim.appStatus),
          field('ผลิตภัณฑ์', claim.product), field('แผน', claim.plan)
        ].join('')}</div>
      </div>
      <div class="cwi-original-grid">${[
        fact('event', 'วันที่เกิดเหตุ', claim.eventDate),
        fact('local_hospital', 'วันที่เข้าโรงพยาบาล', claim.admitDate),
        fact('event_available', 'วันที่ออกโรงพยาบาล', claim.dischargeDate),
        fact('payments', 'จำนวนเงินเคลม', `${money(claim.amount)} บาท`),
        fact('description', 'เลข CL', claim.cl),
        fact('badge', 'เลข CC', claim.cases[0].number),
        fact('article', 'ข้อมูลเคลม / Claim Information', claimInfo, claim.claimInformation),
        fact('autorenew', 'สถานะเคลม', claim.status),
        fact('calendar_today', 'วันที่แจ้ง', claim.notifiedAt),
        fact('place', 'สาขา', claim.branch),
        fact('contact_page', 'ผู้แจ้งเคลม', claim.notifier),
        fact('account_balance', 'ข้อมูลบัญชีรับสินไหม', `${claim.bank || '-'} · ${claim.accountNo || '-'}`, claim.accountName)
      ].join('')}</div>`, 'cwi-original-card');
    const school = claim.school ? section('school', 'ข้อมูลสถานศึกษา', '', `<div class="cwi-facts">${[
      field('ชื่อสถานศึกษา', claim.school.name), field('ที่อยู่', claim.school.address), field('ผู้ติดต่อประสาน', claim.school.contact),
      field('ตำแหน่ง', claim.school.position), field('เลขบัตรประชาชน / เลขอ้างอิง', claim.school.reference), field('เบอร์โทรศัพท์', claim.school.phone)
    ].join('')}</div>`) : '';
    return original + school;
  }

  function transactionsMarkup(snapshot, claim) {
    const info = rules.transferSummary(snapshot, claim);
    const row = item => `<tr><td>${escapeHtml(item.code)}</td><td>${escapeHtml(dateTime(item.at))}</td><td>${escapeHtml(item.type)}</td><td>${money(item.amount)}</td></tr>`;
    const table = list => `<div class="cwi-transfer-table-shell"><div class="soft-scroll cwi-transaction-scroll"><table class="cwi-transfer-table"><thead><tr><th>Transaction Code</th><th>วันที่ทำรายการ</th><th>ประเภทรายการ</th><th>จำนวนเงิน</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div></div>`;
    return section('swap_horiz', 'ข้อมูลรายละเอียดโอนย้าย', '', info.transfers.length || info.npl.length
      ? `${info.transfers.length ? table(info.transfers) : '<p class="cwi-muted">ไม่มี Transaction ที่ต้องรวมในยอดโอนย้าย</p>'}<div class="cwi-transfer-total"><span>ยอดโอนย้าย (ไม่รวม NPL)</span><strong>${money(info.total)} บาท</strong></div>${info.npl.length ? `<h4 class="cwi-subheading">รายการ NPL</h4>${table(info.npl)}` : ''}`
      : '<p class="cwi-muted">เคลมนี้ไม่มี Transaction และยังสามารถแก้ไขเคลมผิดคนได้</p>', 'cwi-transfer-section');
  }

  function insuredSearchMarkup(claim) {
    return section('person_search', 'ค้นหาผู้เอาประกัน (ที่ถูกต้อง)', `แสดงเฉพาะผลิตภัณฑ์ ${escapeHtml(claim.product)}`, `<div class="cwi-correct-search"><div class="cwi-field"><label for="cwiSearchBy">ค้นหาจาก <span class="cwi-req">*</span></label><select id="cwiSearchBy" class="cwi-select"><option value="nationalId">เลขบัตรประชาชน</option><option value="passport">Passport/G-Code</option><option value="appId">ApplicationID</option><option value="name">ชื่อ-นามสกุล (ผู้เอาประกัน)</option></select></div><div class="cwi-field"><label for="cwiKeyword">ระบุคำค้นหา <span class="cwi-req">*</span></label><input id="cwiKeyword" class="cwi-input" autocomplete="off" placeholder="ระบุเลขบัตรประชาชน"></div><button id="cwiOpenSearch" type="button" class="cwi-btn cwi-btn-primary"><span class="material-icons-round" aria-hidden="true">search</span>ค้นหา</button></div><p id="cwiInsuredError" class="cwi-claim-error hidden" role="alert"></p>`, 'cwi-insured-search-card');
  }

  function renderClaim() {
    if (!state.claim || !state.snapshot) return;
    $('cwiSearchResultArea').innerHTML = oldClaimMarkup(state.claim) + transactionsMarkup(state.snapshot, state.claim) + insuredSearchMarkup(state.claim) + '<div id="cwiCandidateArea"></div>';
    $('cwiInitialPrompt').classList.add('hidden');
    $('cwiSearchResultArea').classList.remove('hidden');
  }

  async function runClaimSearch() {
    if (!guard()) return;
    const generation = ++state.searchGeneration;
    const type = $('cwiSearchType').value;
    const search = rules.validateSearch(type, $('cwiClaimNo').value);
    if (search.error) { setError(search.error); $('cwiClaimNo').focus(); return; }
    $('cwiClaimNo').value = search.value;
    const snapshot = await runtime().getSnapshot();
    if (generation !== state.searchGeneration) return;
    const found = rules.claimEligibility(snapshot, type, search.value);
    if (found.error) {
      state.claim = state.candidate = state.snapshot = null;
      $('cwiSearchResultArea').classList.add('hidden');
      $('cwiInitialPrompt').classList.remove('hidden');
      setError(found.error);
      $('cwiClaimNo').focus();
      return;
    }
    setError('');
    Object.assign(state, { claim: found.claim, candidate: null, selectedCandidate: null, snapshot, requestKey: null });
    renderClaim();
  }

  function openModal(id, trigger) {
    state.modalTrigger = trigger || document.activeElement;
    $(id)?.classList.remove('hidden');
    $(id)?.querySelector('input, button')?.focus();
  }
  function closeModal(id) {
    $(id)?.classList.add('hidden');
    state.modalTrigger?.focus?.();
  }

  function candidateColumns() {
    const base = [ ['appId', 'ApplicationID'], ['name', 'ชื่อ-สกุลผู้เอาประกัน'], ['nationalId', 'เลขบัตรประชาชน'], ['coverageStart', 'วันที่เริ่มคุ้มครอง'] ];
    return state.claim.product === 'PH'
      ? [...base, ['coverageEnd', 'วันที่สิ้นสุดความคุ้มครอง'], ['appStatus', 'สถานะ Application']]
      : [...base, ['effectiveDate', 'วันที่มีผลคุ้มครอง'], ['coverageEnd', 'วันที่สิ้นสุดความคุ้มครอง'], ['planType', 'ประเภทแผน'], ['insuredType', 'ประเภทผู้เอาประกัน']];
  }

  function renderCandidates(items) {
    const columns = candidateColumns();
    $('cwiSearchHead').innerHTML = `<tr><th>เลือก</th>${columns.map(([,label]) => `<th>${label}</th>`).join('')}</tr>`;
    $('cwiSearchBody').innerHTML = items.map(person => `<tr data-cwi-app="${escapeHtml(person.appId)}" class="${state.selectedCandidate?.appId === person.appId ? 'selected' : ''}"><td data-label="เลือก"><input type="radio" name="cwiInsured" value="${escapeHtml(person.appId)}" aria-label="เลือก ${escapeHtml(person.name)}" ${state.selectedCandidate?.appId === person.appId ? 'checked' : ''}></td>${columns.map(([key,label]) => `<td data-label="${label}">${escapeHtml(person[key])}</td>`).join('')}</tr>`).join('');
    $('cwiResultCount').textContent = String(items.length);
    $('cwiRangeText').textContent = items.length ? `1-${items.length} จาก ${items.length}` : '0 รายการ';
    $('cwiSearchEmpty').classList.toggle('hidden', Boolean(items.length));
    $('cwiSearchEmpty').querySelector('h4').textContent = 'ไม่พบรายชื่อผู้เอาประกัน';
    $('cwiSearchEmpty').querySelector('p').textContent = 'ตรวจสอบคำค้นหาและค้นหาอีกครั้ง';
    $('cwiChooseBtn').disabled = !state.selectedCandidate;
    $('cwiSelectedHint').textContent = state.selectedCandidate ? `เลือกแล้ว: ${state.selectedCandidate.name}` : 'กรุณาเลือกรายชื่อ 1 รายการ';
  }

  function selectCandidate(appId) {
    state.selectedCandidate = (state.candidates || []).find(item => item.appId === appId) || null;
    $('cwiSearchBody').querySelectorAll('[data-cwi-app]').forEach(row => {
      const active = row.dataset.cwiApp === appId;
      row.classList.toggle('selected', active);
      row.querySelector('input[type="radio"]').checked = active;
    });
    $('cwiChooseBtn').disabled = !state.selectedCandidate;
    $('cwiSelectedHint').textContent = state.selectedCandidate ? `เลือกแล้ว: ${state.selectedCandidate.name}` : 'กรุณาเลือกรายชื่อ 1 รายการ';
  }

  async function filterCandidates() {
    if (!guard() || !state.claim) return;
    const generation = ++state.candidateGeneration;
    const q = $('cwiModalKeyword').value.trim();
    $('cwiModalClear').classList.toggle('hidden', !q);
    state.selectedCandidate = null;
    if (!q) { renderCandidates([]); $('cwiSearchEmpty').querySelector('h4').textContent = 'กรอกคำค้นหาเพื่อค้นหารายชื่อ'; return; }
    const items = await runtime().searchInsured(state.claim.product, $('cwiSearchBy').value, q);
    if (generation !== state.candidateGeneration) return;
    state.candidates = items.filter(person => person.product === state.claim.product && person.appId !== state.claim.appId);
    renderCandidates(state.candidates);
  }

  async function openSearch() {
    if (!guard() || !state.claim) return;
    const q = $('cwiKeyword').value.trim();
    if (!q) { $('cwiInsuredError').textContent = 'กรุณาระบุคำค้นหาผู้เอาประกัน'; $('cwiInsuredError').classList.remove('hidden'); $('cwiKeyword').focus(); return; }
    $('cwiInsuredError').classList.add('hidden');
    $('cwiModalKeyword').value = q;
    openModal('cwiSearchModal', $('cwiOpenSearch'));
    await filterCandidates();
    $('cwiModalKeyword').focus();
  }

  function coverageMarkup() {
    const candidate = state.candidate;
    const claim = state.claim;
    if (!candidate || !claim) return '';
    const productFields = claim.product === 'PH'
      ? [field('สถานะ Application', candidate.appStatus)]
      : [field('วันที่มีผลคุ้มครอง', candidate.effectiveDate), field('ประเภทแผน', candidate.planType), field('ประเภทผู้เอาประกัน', candidate.insuredType)];
    const selected = section('person', 'ข้อมูลผู้เอาประกันใหม่', '', `<div class="cwi-facts">${[
      field('ApplicationID', candidate.appId), field('ชื่อ-สกุลผู้เอาประกัน', candidate.name), field('เลขบัตรประชาชน', candidate.nationalId),
      field('วันที่เริ่มคุ้มครอง', candidate.coverageStart), field('วันที่สิ้นสุดความคุ้มครอง', candidate.coverageEnd), ...productFields
    ].join('')}</div>`);
    const result = rules.candidateEligibility(claim, candidate);
    const benefit = result.benefit;
    const coverage = section('verified_user', 'รายละเอียดความคุ้มครอง', '', benefit
      ? `<div class="cwi-facts">${[
          field('แผน', candidate.plan), field('Benefit ที่เกี่ยวข้อง', `${benefit.code} · ${benefit.type}`),
          field('วงเงินสิทธิ์ต่อครั้ง', `${money(benefit.perClaimLimit)} บาท`), field('วงเงินที่ใช้แล้ว', `${money(benefit.usedLimit)} บาท`),
          field('วงเงินคงเหลือ', `${money(benefit.remainingLimit)} บาท`), ...(benefit.remainingVisits == null ? [] : [field('จำนวนครั้งคงเหลือ', `${benefit.remainingVisits} ครั้ง`)])
        ].join('')}</div>${result.error ? `<p class="cwi-block-message" role="alert">${escapeHtml(result.error)}</p>` : '<p class="cwi-pass-message">ความคุ้มครองและวงเงินผ่านเงื่อนไข</p>'}`
      : '<p class="cwi-block-message" role="alert">ไม่พบความคุ้มครอง</p>');
    const form = section('edit_note', 'ข้อมูลสำหรับบันทึกการแก้ไข', '', `<div class="cwi-form-grid"><div class="cwi-field"><label for="cwiWrongRecorder">ผู้บันทึกเคลมผิด</label><input id="cwiWrongRecorder" class="cwi-input" value="${escapeHtml(claim.createdBy)}" readonly></div><div class="cwi-field"><label for="cwiReason">หมายเหตุการแก้ไข <span class="cwi-req">*</span></label><select id="cwiReason" class="cwi-select"><option value="">กรุณาเลือก</option><option value="บันทึกผู้เอาประกันผิดคน">บันทึกผู้เอาประกันผิดคน</option><option value="บันทึกผิดกรมธรรม์">บันทึกผิดกรมธรรม์</option></select></div><div class="cwi-field"><label for="cwiRemark">หมายเหตุเพิ่มเติม</label><textarea id="cwiRemark" class="cwi-textarea" rows="3" placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"></textarea></div></div><p id="cwiSaveError" class="cwi-claim-error hidden" role="alert"></p><div class="cwi-sticky-actions"><button id="cwiSaveBtn" type="button" class="cwi-btn cwi-btn-success" disabled>ตรวจสอบและบันทึก</button></div>`);
    return selected + coverage + form;
  }

  function updateSaveEligibility() {
    const button = $('cwiSaveBtn');
    if (!button) return;
    const reason = $('cwiReason')?.value;
    const result = state.claim && state.candidate ? rules.candidateEligibility(state.claim, state.candidate) : { error: 'กรุณาเลือกผู้เอาประกัน' };
    button.disabled = Boolean(result.error || !reason || state.saving || !authorized() || state.claim?.status !== 'Open');
  }

  function chooseCandidate() {
    if (!state.selectedCandidate || !state.claim || !guard()) return;
    state.candidate = state.selectedCandidate;
    state.requestKey = crypto.randomUUID();
    closeModal('cwiSearchModal');
    $('cwiCandidateArea').innerHTML = coverageMarkup();
    updateSaveEligibility();
    $('cwiCandidateArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function request() {
    return { oldCl: state.claim.cl, newAppId: state.candidate.appId, reason: $('cwiReason').value, note: $('cwiRemark').value.trim(), idempotencyKey: state.requestKey };
  }

  async function openConfirmation() {
    if (!guard() || !state.claim || !state.candidate) return;
    const pending = request();
    const snapshot = await runtime().getSnapshot();
    if (pending.idempotencyKey !== state.requestKey) return;
    const check = rules.correctionEligibility(snapshot, pending, actor());
    if (check.error) { $('cwiSaveError').textContent = check.error; $('cwiSaveError').classList.remove('hidden'); updateSaveEligibility(); return; }
    $('cwiSaveError').classList.add('hidden');
    $('cwiConfirmSummary').textContent = `ย้าย ${state.claim.cl} / ${state.claim.cases[0].number} ไปยัง ${state.candidate.name} (${state.candidate.appId}) แล้วปิดเคลมเดิม`;
    $('cwiConfirmError').classList.add('hidden');
    openModal('cwiConfirmModal', $('cwiSaveBtn'));
  }

  async function confirmCorrection() {
    if (state.saving || !guard() || !state.claim || !state.candidate) return;
    state.saving = true;
    const button = $('cwiConfirmBtn');
    button.disabled = true;
    try {
      const result = await runtime().commit(request(), actor());
      closeModal('cwiConfirmModal');
      $('cwiNewClaimNo').textContent = result.newCl;
      $('cwiSuccessDescription').textContent = `${runtime().isMock ? 'บันทึกในข้อมูลตัวอย่างของหน้านี้ · ' : ''}สร้าง ${result.newCl} / ${result.newCc} และปิด ${result.oldCl} / ${result.oldCc} แล้ว · Correction Reference ${result.reference} · ${dateTime(result.at)}`;
      openModal('cwiSuccessModal', $('cwiSaveBtn'));
      state.snapshot = await runtime().getSnapshot();
      if (runtime()?.isMock) { state.exampleClaims = state.snapshot.claims || []; renderMockExamples(); }
      state.claim = state.snapshot.claims.find(item => item.cl === result.oldCl);
      const created = state.snapshot.claims.find(item => item.cl === result.newCl);
      const creationEvent = created?.history?.at(-1);
      $('cwiCandidateArea').insertAdjacentHTML('beforeend', section('history', 'Audit / History', 'เคลมเดิมและเคลมใหม่ใช้ Correction Reference และเวลาเดียวกัน', `<div class="cwi-facts">${[
        field('Correction Reference', result.reference), field('วัน/เวลาแก้ไข', dateTime(result.at)),
        field('เคลมเดิม', `${result.oldCl} / ${result.oldCc} · Close`), field('เคลมใหม่', `${result.newCl} / ${result.newCc} · Open`),
        field('ผู้ทำรายการ', result.actor), field('ผู้บันทึกเคลมผิด', result.wrongRecorder),
        field('เหตุผล', result.reason), field('หมายเหตุ', result.note || '-'),
        field('Transaction ที่เชื่อมจากเคลมเดิม', (creationEvent?.transactionCodes || []).join(', ') || '-'),
        field('Document ที่เชื่อมจากเคลมเดิม', (creationEvent?.documentCodes || []).join(', ') || '-')
      ].join('')}</div>`));
      $('cwiSaveBtn').disabled = true;
    } catch (error) {
      $('cwiConfirmError').textContent = error.message || 'ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่';
      $('cwiConfirmError').classList.remove('hidden');
    } finally {
      state.saving = false;
      button.disabled = false;
    }
  }

  function handleModalKeys(event) {
    const modal = event.target.closest('.cwi-modal:not(.hidden)');
    if (!modal) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(modal.id); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')].filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  }

  function init() {
    const page = $('correctWrongInsuredPage');
    if (page && page.parentElement !== document.querySelector('main')) document.querySelector('main')?.appendChild(page);
    guard();
    window.addEventListener('claimagent:cwi-runtime-ready', () => { guard(); refreshMockExamples(); });
    $('submenuCorrectWrongInsured')?.addEventListener('click', show);
    $('cwiSearchType')?.addEventListener('change', () => { state.searchGeneration++; $('cwiClaimNo').placeholder = $('cwiSearchType').value === 'CC' ? 'ระบุเลข CC' : 'ระบุเลข CL'; setError(''); renderMockExamples(); });
    $('cwiClaimNo')?.addEventListener('input', () => { state.searchGeneration++; setError(''); });
    $('cwiClaimNo')?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) runClaimSearch(); });
    $('cwiClaimSearchBtn')?.addEventListener('click', runClaimSearch);
    $('cwiMockExampleList')?.addEventListener('click', event => {
      const button = event.target.closest('[data-cwi-example]');
      if (!button || !runtime()?.isMock) return;
      $('cwiClaimNo').value = button.dataset.cwiExample;
      setError('');
      runClaimSearch();
    });
    $('cwiClearBtn')?.addEventListener('click', reset);
    $('cwiSearchResultArea')?.addEventListener('click', event => { if (event.target.closest('#cwiOpenSearch')) openSearch(); if (event.target.closest('#cwiSaveBtn')) openConfirmation(); });
    $('cwiSearchResultArea')?.addEventListener('change', event => {
      if (event.target.id === 'cwiReason') updateSaveEligibility();
      if (event.target.id === 'cwiSearchBy') {
        const placeholders = { nationalId: 'ระบุเลขบัตรประชาชน', passport: 'ระบุ Passport/G-Code', appId: 'ระบุ ApplicationID', name: 'ระบุชื่อ-นามสกุลผู้เอาประกัน' };
        $('cwiKeyword').placeholder = placeholders[event.target.value] || 'ระบุคำค้นหา';
        $('cwiKeyword').value = '';
        $('cwiInsuredError').classList.add('hidden');
      }
    });
    $('cwiSearchResultArea')?.addEventListener('keydown', event => { if (event.target.id === 'cwiKeyword' && event.key === 'Enter' && !event.isComposing) openSearch(); });
    $('cwiModalSearchBtn')?.addEventListener('click', filterCandidates);
    $('cwiModalKeyword')?.addEventListener('input', () => { state.candidateGeneration++; $('cwiModalClear').classList.toggle('hidden', !$('cwiModalKeyword').value.trim()); });
    $('cwiModalKeyword')?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) filterCandidates(); });
    $('cwiModalClear')?.addEventListener('click', () => { $('cwiModalKeyword').value = ''; filterCandidates(); $('cwiModalKeyword').focus(); });
    $('cwiSearchBody')?.addEventListener('click', event => { const tr = event.target.closest('[data-cwi-app]'); if (tr) selectCandidate(tr.dataset.cwiApp); });
    $('cwiSearchBody')?.addEventListener('change', event => { const tr = event.target.closest('[data-cwi-app]'); if (tr) selectCandidate(tr.dataset.cwiApp); });
    $('cwiChooseBtn')?.addEventListener('click', chooseCandidate);
    $('cwiConfirmBtn')?.addEventListener('click', confirmCorrection);
    $('cwiCopyClaim')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText($('cwiNewClaimNo').textContent); } catch (_) {} });
    document.querySelectorAll('[data-cwi-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.cwiClose)));
    ['cwiSearchModal', 'cwiConfirmModal', 'cwiSuccessModal'].forEach(id => $(id)?.addEventListener('click', event => { if (event.target === $(id)) closeModal(id); }));
    document.addEventListener('keydown', handleModalKeys);
    const observer = new MutationObserver(() => { if (!authorized() && !page.classList.contains('hidden')) page.classList.add('hidden'); });
    observer.observe(page, { attributes: true, attributeFilter: ['class'] });
    refreshMockExamples();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
