/* ============================================================
   งานเคลม > ค้นหาเคลม
   Scoped v14 search/result/policy flow; preserves the legacy
   แจ้งเคลม > ค้นหาการแจ้งเคลม surface on the shared page.
   ============================================================ */
(function () {
  "use strict";

  const PAGE_ID = "claimSearchPage";
  const SURFACE_ID = "claimWorkSearchSurface";
  const SEARCH_TYPES = {
    CL: { label: "เลขที่ CL", placeholder: "ระบุเลขที่ CL" },
    CASE: { label: "เลขที่ Case", placeholder: "ระบุเลขที่ Case" },
    NATIONAL_ID: { label: "เลขบัตรประชาชน", placeholder: "ระบุเลขบัตรประชาชน" },
    PASSPORT: { label: "เลข Passport / GCode", placeholder: "ระบุเลข Passport หรือ GCode" },
    APP_ID: { label: "AppID", placeholder: "ระบุ AppID" },
    STUDENT_CARD: { label: "เลขบัตรประกันนักเรียน", placeholder: "ระบุเลขบัตรประกันนักเรียน" },
    NAME: { label: "ชื่อ-สกุลผู้เอาประกัน", placeholder: "ระบุชื่อ-สกุลผู้เอาประกัน" },
    SCHOOL: { label: "ชื่อสถานศึกษา", placeholder: "ระบุชื่อสถานศึกษา" }
  };

  const originalTopSearch = window.showTopClaimSearchPage;
  const originalClaimRecordSearch = window.showClaimRecordSearchPage;
  const originalBackToSearch = window.backToClaimRecordSearch;
  let selectedPersonId = "";
  let selectedPolicyNo = "";
  let mounted = false;

  function data() {
    return window.claimWorkSearchMock || { people: [], claims: [] };
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function setMarkup(node, markup) {
    if (!node) return;
    node.replaceChildren();
    node.insertAdjacentHTML("afterbegin", markup);
  }

  function fullName(person) {
    return `${person.prefix || ""}${person.first || ""} ${person.last || ""}`.trim();
  }

  function maskId(value) {
    const text = String(value || "");
    return text ? `•••••••••${text.slice(-4)}` : "-";
  }

  function productPill(product) {
    return `<span class="cws-product ${String(product).toLowerCase()}">${escapeHtml(product)}</span>`;
  }

  function statusClass(status) {
    if (String(status).includes("อนุมัติ")) return "active";
    if (String(status).includes("ยกเลิก") || String(status).includes("ปฏิเสธ")) return "closed";
    return "pending";
  }

  function mount() {
    if (mounted) return byId(SURFACE_ID);
    const page = byId(PAGE_ID);
    if (!page) return null;
    Array.from(page.children).forEach(child => child.classList.add("claim-record-search-legacy"));

    const surface = document.createElement("section");
    surface.id = SURFACE_ID;
    surface.hidden = true;
    surface.setAttribute("aria-labelledby", "cwsPageTitle");
    setMarkup(surface, `
      <header class="cws-page-head">
        <div class="cws-title">
          <span class="cws-title-icon"><span class="material-icons-round">manage_search</span></span>
          <div><h2 id="cwsPageTitle">ค้นหารายการเคลม</h2><p>ค้นหาด้วยข้อมูลที่มี ระบบจะกำหนดรูปแบบผลลัพธ์ให้อัตโนมัติตามประเภทคำค้นหา</p></div>
        </div>
        <div class="cws-flow-note"><span class="material-icons-round">route</span><strong>Search Type</strong> เป็นตัวควบคุม Result Flow</div>
      </header>

      <section class="cws-card" aria-labelledby="cwsSearchTitle">
        <header class="cws-card-head">
          <div class="cws-card-title"><span class="cws-card-title-icon"><span class="material-icons-round">search</span></span><div><h3 id="cwsSearchTitle">เงื่อนไขการค้นหา</h3><p>เลือกประเภทคำค้นหา แล้วระบุข้อมูลที่ต้องการค้นหา</p></div></div>
        </header>
        <form id="cwsSearchForm" class="cws-card-body" novalidate>
          <div id="cwsSearchGrid" class="cws-search-grid">
            <div id="cwsTypeField" class="cws-field">
              <label for="cwsSearchType">ประเภทคำค้นหา <span class="cws-required">*</span></label>
              <select id="cwsSearchType" class="cws-control" aria-describedby="cwsTypeError">
                <option value="">เลือกประเภทคำค้นหา</option>
                ${Object.entries(SEARCH_TYPES).map(([value, item]) => `<option value="${value}">${item.label}</option>`).join("")}
              </select>
              <p id="cwsTypeError" class="cws-error">กรุณาเลือกประเภทคำค้นหา</p>
            </div>
            <div id="cwsAcademicYearField" class="cws-field" hidden>
              <label for="cwsAcademicYear">ปีการศึกษา <span class="cws-required">*</span></label>
              <select id="cwsAcademicYear" class="cws-control"></select>
            </div>
            <div id="cwsQueryField" class="cws-field">
              <label id="cwsQueryLabel" for="cwsSearchQuery">ข้อมูลที่ต้องการค้นหา <span class="cws-required">*</span></label>
              <div class="cws-input-wrap">
                <input id="cwsSearchQuery" class="cws-control" disabled autocomplete="off" placeholder="กรุณาเลือกประเภทคำค้นหาก่อน" aria-describedby="cwsQueryError">
                <button id="cwsClearQuery" class="cws-clear-query" type="button" aria-label="ล้างคำค้นหา" title="ล้างคำค้นหา" hidden><span class="material-icons-round">close</span></button>
              </div>
              <p id="cwsQueryError" class="cws-error">กรุณาระบุข้อมูลที่ต้องการค้นหา</p>
            </div>
            <div class="cws-actions">
              <button id="cwsResetButton" class="cws-btn secondary" type="button"><span class="material-icons-round">restart_alt</span>ล้างค่า</button>
              <button class="cws-btn primary" type="submit"><span class="material-icons-round">search</span>ค้นหา</button>
            </div>
          </div>
          <div class="cws-helper-line">
            <div class="cws-helper"><span class="material-icons-round">info</span><span><strong>หลักการแสดงผล:</strong> เลขที่ CL / Case แสดงระดับ Claim · ข้อมูลผู้เอาประกันแสดงระดับ Policy/Application และต้องเลือกกรมธรรม์ก่อนดู Claim History</span></div>
            <div class="cws-demo-set" aria-labelledby="cwsQuickExamplesTitle">
              <span id="cwsQuickExamplesTitle" class="cws-demo-label">Mock ทดลอง:</span>
              ${(data().quickExamples || []).map(item => `<button class="cws-demo-chip" type="button" data-cws-example-type="${escapeHtml(item.type)}" data-cws-example-query="${escapeHtml(item.query)}"${item.academicYear ? ` data-cws-example-year="${escapeHtml(item.academicYear)}"` : ""}>${escapeHtml(item.label)}</button>`).join("")}
            </div>
          </div>
        </form>
      </section>

      <section class="cws-card cws-result-card" aria-labelledby="cwsResultTitle">
        <header class="cws-card-head">
          <div class="cws-card-title"><span class="cws-card-title-icon"><span class="material-icons-round">fact_check</span></span><div><h3 id="cwsResultTitle">ผลการค้นหา</h3><p id="cwsResultSubtitle">ผลลัพธ์จะแสดงหลังจากค้นหา</p></div></div>
          <div id="cwsResultSummary" class="cws-summary" hidden><span id="cwsResultCount" class="cws-count">0 รายการ</span><span id="cwsResultHint" class="cws-hint"></span></div>
        </header>
        <div id="cwsEmptyState" class="cws-empty"><span class="cws-empty-icon"><span class="material-icons-round">manage_search</span></span><h4>ยังไม่มีผลการค้นหา</h4><p>เลือกประเภทคำค้นหาและระบุข้อมูลด้านบนเพื่อเริ่มค้นหา</p></div>
        <div id="cwsDynamicResult" aria-live="polite"></div>
      </section>`);
    page.appendChild(surface);
    bindStaticEvents();
    initAcademicYears();
    mounted = true;
    return surface;
  }

  function bindStaticEvents() {
    byId("cwsSearchType").addEventListener("change", updateQueryField);
    byId("cwsSearchQuery").addEventListener("input", event => {
      byId("cwsClearQuery").hidden = !event.target.value;
      clearInvalid(byId("cwsQueryField"), byId("cwsSearchQuery"));
    });
    byId("cwsSearchQuery").addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        runSearch();
      }
    });
    byId("cwsClearQuery").addEventListener("click", clearQuery);
    byId("cwsResetButton").addEventListener("click", resetAll);
    byId("cwsSearchForm").querySelectorAll("[data-cws-example-type]").forEach(button => {
      button.addEventListener("click", () => selectQuickExample(button.dataset.cwsExampleType, button.dataset.cwsExampleQuery, button.dataset.cwsExampleYear));
    });
    byId("cwsSearchForm").addEventListener("submit", event => {
      event.preventDefault();
      runSearch();
    });
  }

  function initAcademicYears() {
    const currentYear = new Date().getFullYear() + 543;
    setMarkup(byId("cwsAcademicYear"), [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
      .map(year => `<option value="${year}">${year}</option>`).join(""));
  }

  function selectQuickExample(typeValue, queryValue, academicYear) {
    if (!SEARCH_TYPES[typeValue] || !queryValue) return false;
    const type = byId("cwsSearchType");
    const query = byId("cwsSearchQuery");
    type.value = typeValue;
    updateQueryField();
    if (typeValue === "SCHOOL" && academicYear) byId("cwsAcademicYear").value = academicYear;
    query.value = queryValue;
    byId("cwsClearQuery").hidden = false;
    clearInvalid(byId("cwsTypeField"), type);
    clearInvalid(byId("cwsQueryField"), query);
    runSearch();
    return true;
  }

  function clearInvalid(field, control) {
    field?.classList.remove("invalid");
    control?.setAttribute("aria-invalid", "false");
  }

  function setInvalid(field, control, invalid) {
    field?.classList.toggle("invalid", invalid);
    control?.setAttribute("aria-invalid", String(invalid));
  }

  function updateQueryField() {
    const type = byId("cwsSearchType");
    const query = byId("cwsSearchQuery");
    const config = SEARCH_TYPES[type.value];
    const school = type.value === "SCHOOL";
    byId("cwsAcademicYearField").hidden = !school;
    byId("cwsSearchGrid").classList.toggle("school-mode", school);
    clearInvalid(byId("cwsTypeField"), type);
    clearInvalid(byId("cwsQueryField"), query);
    query.value = "";
    byId("cwsClearQuery").hidden = true;
    query.disabled = !config;
    query.placeholder = config ? config.placeholder : "กรุณาเลือกประเภทคำค้นหาก่อน";
    byId("cwsQueryLabel").textContent = config ? config.label : "ข้อมูลที่ต้องการค้นหา";
    byId("cwsQueryLabel").insertAdjacentHTML("beforeend", ' <span class="cws-required">*</span>');
    resetResult();
    if (config) query.focus();
  }

  function validate() {
    const type = byId("cwsSearchType");
    const query = byId("cwsSearchQuery");
    const typeMissing = !type.value;
    const queryMissing = !typeMissing && !query.value.trim();
    setInvalid(byId("cwsTypeField"), type, typeMissing);
    setInvalid(byId("cwsQueryField"), query, queryMissing);
    if (typeMissing) type.focus();
    else if (queryMissing) query.focus();
    return !typeMissing && !queryMissing;
  }

  function clearQuery() {
    const query = byId("cwsSearchQuery");
    query.value = "";
    byId("cwsClearQuery").hidden = true;
    clearInvalid(byId("cwsQueryField"), query);
    resetResult();
    query.focus();
  }

  function resetAll() {
    byId("cwsSearchType").value = "";
    byId("cwsSearchQuery").value = "";
    updateQueryField();
    byId("cwsSearchType").focus();
  }

  function resetResult() {
    selectedPersonId = "";
    selectedPolicyNo = "";
    byId("cwsEmptyState").hidden = false;
    byId("cwsResultSummary").hidden = true;
    byId("cwsResultSubtitle").textContent = "ผลลัพธ์จะแสดงหลังจากค้นหา";
    byId("cwsDynamicResult").replaceChildren();
  }

  function setSummary(count, unit, subtitle, hint) {
    byId("cwsEmptyState").hidden = true;
    byId("cwsResultSummary").hidden = false;
    byId("cwsResultCount").textContent = `${count} ${unit}`;
    byId("cwsResultHint").textContent = hint || "";
    byId("cwsResultSubtitle").textContent = subtitle;
  }

  function renderNoResult(query) {
    byId("cwsEmptyState").hidden = true;
    byId("cwsResultSummary").hidden = true;
    byId("cwsResultSubtitle").textContent = "ไม่พบข้อมูลที่ตรงกับเงื่อนไข";
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-no-result"><span class="material-icons-round">search_off</span><div><strong>ไม่พบผลการค้นหา</strong><p>ไม่พบข้อมูลสำหรับ “${escapeHtml(query)}” กรุณาตรวจสอบประเภทคำค้นหาและข้อมูลอีกครั้ง</p></div></div>`);
  }

  function personForClaim(claim) {
    return data().people.find(person => person.id === claim.personId);
  }

  function renderClaims(rows) {
    setSummary(rows.length, "รายการ", "รายการ Claim ที่ตรงกับคำค้นหา", "ระดับ Claim");
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-table-wrap"><table class="cws-table"><thead><tr><th>Claim No.</th><th>Case No.</th><th>ผู้เอาประกัน</th><th>เลขกรมธรรม์</th><th>ผลิตภัณฑ์</th><th>ประเภทการรักษา</th><th>โรงพยาบาล</th><th>สถานะเคลม</th><th>Action</th></tr></thead><tbody>${rows.map(row => {
      const person = personForClaim(row);
      return `<tr><td class="mono">${row.cl}</td><td class="mono">${row.caseNo}</td><td>${escapeHtml(person ? fullName(person) : "-")}</td><td class="mono">${row.policy}</td><td>${productPill(row.product)}</td><td><span class="cws-care">${escapeHtml(row.care)}</span></td><td>${escapeHtml(row.hospital)}</td><td><span class="cws-status ${statusClass(row.status)}">${escapeHtml(row.status)}</span></td><td><button class="cws-view-btn cws-view-icon-btn" type="button" data-cws-view-claim="${row.cl}" onclick="ClaimWorkSearch.openClaimDetail(this.dataset.cwsViewClaim)" aria-label="ดูรายละเอียดเคลม ${row.cl}" title="ดูรายละเอียดเคลม"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr>`;
    }).join("")}</tbody></table></div>`);
  }

  function selectPerson(personId, button) {
    byId("cwsDynamicResult").querySelectorAll("[data-cws-person]").forEach(item => item.classList.toggle("active", item === button));
    selectedPersonId = personId;
    selectedPolicyNo = "";
    renderPolicyArea(data().people.find(person => person.id === selectedPersonId), byId("cwsPolicyArea"), false);
  }

  function renderPeopleChooser(people) {
    setSummary(people.length, "บุคคล", "พบผู้เอาประกันชื่อเดียวกันมากกว่า 1 คน", "กรุณาเลือกกรมธรรม์ของบุคคลที่ต้องการ");
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-duplicate-note" role="status"><span class="material-icons-round">group</span><div><strong>พบผู้เอาประกันชื่อเดียวกัน ${people.length} คน</strong><span>ตรวจสอบเลขบัตรประชาชนและเลือกกรมธรรม์ของบุคคลที่ต้องการ</span></div></div><div class="cws-duplicate-results">${people.map(person => `<section class="cws-duplicate-person" aria-label="กรมธรรม์ของ ${escapeHtml(fullName(person))}"><div class="cws-person-banner"><span class="cws-avatar"><span class="material-icons-round">person</span></span><div><div class="cws-person-name">${escapeHtml(fullName(person))}</div><div class="cws-person-meta"><span>เลขบัตรประชาชน ${maskId(person.nationalId)}</span><span>Passport/GCode ${escapeHtml(person.passport)}</span></div></div><span class="cws-person-id">${person.id}</span></div><div class="cws-table-wrap"><table class="cws-table policy"><thead><tr><th class="center">เลือก</th><th>App ID</th><th>เลขบัตรประกัน</th><th>คำนำหน้า</th><th>ชื่อ</th><th>สกุล</th><th>แผน</th><th>ผลิตภัณฑ์</th><th>สถานะ</th><th>เริ่มคุ้มครอง</th><th>วันที่ยกเลิก</th><th>Insurance Company</th></tr></thead><tbody>${person.policies.map(policy => `<tr><td class="center"><input class="cws-policy-radio" type="radio" name="cwsDuplicatePolicySelect" value="${policy.policy}" data-person-id="${person.id}" aria-label="เลือก ${escapeHtml(fullName(person))} กรมธรรม์ ${policy.policy}"></td><td class="mono">${policy.appId}</td><td><span class="mono">${policy.card}</span>${policy.product === "PA" && policy.school !== "-" ? `<span class="cws-school-sub">${escapeHtml(policy.school)}</span>` : ""}</td><td>${person.prefix}</td><td>${person.first}</td><td>${person.last}</td><td>${escapeHtml(policy.plan)}</td><td>${productPill(policy.product)}</td><td><span class="cws-status ${statusClass(policy.status)}">${escapeHtml(policy.status)}</span></td><td>${policy.start}</td><td>${policy.cancel}</td><td>${escapeHtml(policy.insurer)}</td></tr>`).join("")}</tbody></table></div></section>`).join("")}</div><div class="cws-policy-action"><div class="cws-policy-copy"><strong id="cwsSelectedPolicyTitle">กรุณาเลือกกรมธรรม์</strong><span id="cwsSelectedPolicyText">เลือกผู้เอาประกันและกรมธรรม์ก่อนดูรายการเคลม</span></div><button id="cwsViewPolicyClaims" class="cws-btn primary cws-person-btn" type="button" disabled><span class="material-icons-round">history</span>ดูรายการเคลมทั้งหมดของกรมธรรม์นี้</button></div>`);
    byId("cwsDynamicResult").querySelectorAll(".cws-policy-radio").forEach(radio => radio.addEventListener("change", () => {
      const person = people.find(item => item.id === radio.dataset.personId);
      if (person) selectPolicy(person, person.policies, radio.value);
    }));
    byId("cwsViewPolicyClaims").addEventListener("click", openSelectedPolicyHistory);
  }

  function renderPolicyResults(person, policies, autoSelect) {
    selectedPersonId = person.id;
    selectedPolicyNo = autoSelect && policies.length === 1 ? policies[0].policy : "";
    setSummary(policies.length, "กรมธรรม์", "ข้อมูลผู้เอาประกันและรายการกรมธรรม์", policies.length > 1 ? "เลือกกรมธรรม์ที่ต้องการ" : "เลือกอัตโนมัติแล้ว");
    setMarkup(byId("cwsDynamicResult"), '<div id="cwsPolicyArea"></div>');
    renderPolicyArea(person, byId("cwsPolicyArea"), autoSelect, policies);
  }

  function renderPolicyArea(person, area, autoSelect, policySubset) {
    if (!person || !area) return;
    const policies = policySubset || person.policies;
    if (autoSelect && policies.length === 1) selectedPolicyNo = policies[0].policy;
    setMarkup(area, `<div class="cws-person-banner"><span class="cws-avatar"><span class="material-icons-round">person</span></span><div><div class="cws-person-name">${escapeHtml(fullName(person))}</div><div class="cws-person-meta"><span>เลขบัตรประชาชน ${maskId(person.nationalId)}</span><span>Passport/GCode ${escapeHtml(person.passport)}</span></div></div><span class="cws-person-id">${person.id}</span></div>
      <div class="cws-table-wrap"><table class="cws-table policy"><thead><tr><th class="center">เลือก</th><th>App ID</th><th>เลขบัตรประกัน</th><th>คำนำหน้า</th><th>ชื่อ</th><th>สกุล</th><th>แผน</th><th>ผลิตภัณฑ์</th><th>สถานะ</th><th>เริ่มคุ้มครอง</th><th>วันที่ยกเลิก</th><th>Insurance Company</th></tr></thead><tbody>${policies.map(policy => `<tr><td class="center"><input class="cws-policy-radio" type="radio" name="cwsPolicySelect" value="${policy.policy}" ${selectedPolicyNo === policy.policy ? "checked" : ""} aria-label="เลือกกรมธรรม์ ${policy.policy}"></td><td class="mono">${policy.appId}</td><td><span class="mono">${policy.card}</span>${policy.product === "PA" && policy.school !== "-" ? `<span class="cws-school-sub">${escapeHtml(policy.school)}</span>` : ""}</td><td>${person.prefix}</td><td>${person.first}</td><td>${person.last}</td><td>${escapeHtml(policy.plan)}</td><td>${productPill(policy.product)}</td><td><span class="cws-status ${statusClass(policy.status)}">${escapeHtml(policy.status)}</span></td><td>${policy.start}</td><td>${policy.cancel}</td><td>${escapeHtml(policy.insurer)}</td></tr>`).join("")}</tbody></table></div>
      <div class="cws-policy-action"><div class="cws-policy-copy"><strong id="cwsSelectedPolicyTitle">${selectedPolicyNo || "กรุณาเลือกกรมธรรม์"}</strong><span id="cwsSelectedPolicyText">${selectedPolicyNo ? selectedPolicySummary(policies.find(policy => policy.policy === selectedPolicyNo)) : "เลือกกรมธรรม์ก่อนดูรายการเคลม"}</span></div><button id="cwsViewPolicyClaims" class="cws-btn primary cws-person-btn" type="button" ${selectedPolicyNo ? "" : "disabled"}><span class="material-icons-round">history</span>ดูรายการเคลมทั้งหมดของกรมธรรม์นี้</button></div>`);
    area.querySelectorAll(".cws-policy-radio").forEach(radio => radio.addEventListener("change", () => selectPolicy(person, policies, radio.value)));
    byId("cwsViewPolicyClaims").addEventListener("click", openSelectedPolicyHistory);
  }

  function selectedPolicySummary(policy) {
    return policy ? `${policy.product} · ${policy.plan} · ${policy.claims} เคลม · แสดงเฉพาะ Claim ภายใต้กรมธรรม์นี้` : "";
  }

  function selectPolicy(person, policies, policyNo) {
    const policy = policies.find(item => item.policy === policyNo);
    if (!policy) return;
    selectedPersonId = person.id;
    selectedPolicyNo = policyNo;
    byId("cwsSelectedPolicyTitle").textContent = policy.policy;
    byId("cwsSelectedPolicyText").textContent = selectedPolicySummary(policy);
    byId("cwsViewPolicyClaims").disabled = false;
  }

  function renderSchoolResults(matches, query, academicYear) {
    if (!matches.length) return renderNoResult(`${query} · ปีการศึกษา ${academicYear}`);
    setSummary(matches.length, "กรมธรรม์", "ผลการค้นหาจากชื่อสถานศึกษา", `ปีการศึกษา ${academicYear}`);
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-school-note"><span class="material-icons-round">school</span><strong>${escapeHtml(query)}</strong><span>· ปีการศึกษา ${academicYear}</span></div><div class="cws-table-wrap"><table class="cws-table policy"><thead><tr><th class="center">เลือก</th><th>App ID</th><th>เลขบัตรประกัน</th><th>ผู้เอาประกัน</th><th>แผน</th><th>ผลิตภัณฑ์</th><th>สถานศึกษา</th><th>ปีการศึกษา</th><th>สถานะ</th><th>เริ่มคุ้มครอง</th><th>Insurance Company</th></tr></thead><tbody>${matches.map(({ person, policy }) => `<tr><td class="center"><input class="cws-policy-radio" type="radio" name="cwsSchoolPolicy" value="${policy.policy}" data-person-id="${person.id}" aria-label="เลือก ${fullName(person)} กรมธรรม์ ${policy.policy}"></td><td class="mono">${policy.appId}</td><td class="mono">${policy.card}</td><td>${escapeHtml(fullName(person))}</td><td>${escapeHtml(policy.plan)}</td><td>${productPill(policy.product)}</td><td>${escapeHtml(policy.school)}</td><td>${policy.academicYear}</td><td><span class="cws-status ${statusClass(policy.status)}">${escapeHtml(policy.status)}</span></td><td>${policy.start}</td><td>${escapeHtml(policy.insurer)}</td></tr>`).join("")}</tbody></table></div><div class="cws-policy-action"><div class="cws-policy-copy"><strong id="cwsSelectedPolicyTitle">กรุณาเลือกกรมธรรม์</strong><span id="cwsSelectedPolicyText">เลือกผู้เอาประกันและกรมธรรม์ก่อนดูรายการเคลม</span></div><button id="cwsViewPolicyClaims" class="cws-btn primary" type="button" disabled><span class="material-icons-round">history</span>ดูรายการเคลมทั้งหมดของกรมธรรม์นี้</button></div>`);
    byId("cwsDynamicResult").querySelectorAll(".cws-policy-radio").forEach(radio => radio.addEventListener("change", () => {
      const person = data().people.find(item => item.id === radio.dataset.personId);
      const policy = person?.policies.find(item => item.policy === radio.value);
      if (!person || !policy) return;
      selectedPersonId = person.id;
      selectedPolicyNo = policy.policy;
      byId("cwsSelectedPolicyTitle").textContent = policy.policy;
      byId("cwsSelectedPolicyText").textContent = `${policy.product} · ${policy.plan} · ${policy.claims} เคลม · ${policy.school}`;
      byId("cwsViewPolicyClaims").disabled = false;
    }));
    byId("cwsViewPolicyClaims").addEventListener("click", openSelectedPolicyHistory);
  }

  function historyRows(person, policy) {
    return data().claims.filter(claim => claim.personId === person.id && claim.policy === policy.policy).map((claim, index) => ({
      createDate: claim.createDate,
      claimNo: claim.cl,
      caseNo: claim.caseNo,
      product: claim.product,
      claimType: claim.care,
      claimStatus: claim.status,
      hospital: claim.hospital,
      chiefComplaint: claim.complaint,
      incidentDate: claim.incidentDate,
      status: claim.status === "อนุมัติ" ? (index === 0 ? "Open" : "Close") : claim.status === "ปฏิเสธ" ? "Close" : "Open",
      claimAmount: claim.claimed,
      paidAmount: claim.paid,
      opdCount: claim.opdCount,
      note: `${claim.care} · ${claim.hospital}`
    }));
  }

  function insuredDetailRow(person, policy) {
    return {
      name: fullName(person), idCard: person.nationalId, passport: person.passport, phone: person.phone,
      appStatus: policy.status, appId: policy.appId, policyAge: "1 ปี 2 เดือน", start: policy.start,
      end: policy.cancel === "-" ? policy.end : policy.cancel, plan: policy.plan, product: policy.product,
      school: policy.school, studentRef: policy.card, claimHistory: []
    };
  }

  function openSelectedPolicyHistory() {
    const person = data().people.find(item => item.id === selectedPersonId);
    const policy = person?.policies.find(item => item.policy === selectedPolicyNo);
    if (!person || !policy || typeof window.renderClaimSearchInsuredDetail !== "function") return false;
    const row = insuredDetailRow(person, policy);
    if (typeof claimRecordSelectedPerson !== "undefined") claimRecordSelectedPerson = row;
    byId("claimSearchInsuredDetailPage")?.classList.add("claim-work-search-history");
    const rows = historyRows(person, policy);
    window.renderClaimSearchInsuredDetail(row, rows);
    enhanceClaimHistoryPage(person, policy, rows);
    return true;
  }

  function enhanceClaimHistoryPage(person, policy, rows) {
    const page = byId("claimSearchInsuredDetailPage");
    const shell = page?.querySelector(".csd-shell");
    const backbar = shell?.querySelector(".csd-backbar");
    if (!page || !shell || !backbar) return;
    let heading = shell.querySelector(".cws-history-page-head");
    if (!heading) {
      heading = document.createElement("header");
      heading.className = "cws-history-page-head";
      shell.insertBefore(heading, shell.firstChild);
    }
    setMarkup(heading, `<div class="cws-history-title"><span class="cws-title-icon"><span class="material-icons-round">history</span></span><div><h2>รายการเคลมของผู้เอาประกัน</h2><p>ตรวจสอบประวัติการเคลมตามกรมธรรม์ที่เลือกจากหน้าค้นหาเคลม</p></div></div>`);
    heading.appendChild(backbar);
    heading.hidden = false;
    const sectionTitle = byId("csdPanelHistory")?.querySelector(".csd-section-title");
    if (sectionTitle) setMarkup(sectionTitle, `<div class="cws-history-panel-title"><span class="material-icons-round">history</span><div><strong>ประวัติการเคลม</strong><small>แสดงเฉพาะ Claim ภายใต้กรมธรรม์ ${escapeHtml(policy.policy)} ของ ${escapeHtml(fullName(person))}</small></div></div><span class="cws-history-count">${rows.length} เคลม</span>`);
    const appStatus = byId("csdAppStatus");
    if (appStatus) appStatus.dataset.statusTone = statusClass(policy.status);
    const pageTitle = byId("pageTitle");
    const pageSubtitle = byId("pageSubtitle");
    if (pageTitle) pageTitle.textContent = "รายการเคลมของผู้เอาประกัน";
    if (pageSubtitle) pageSubtitle.textContent = "งานเคลม / ค้นหาเคลม / รายการเคลม";
  }

  function restoreClaimHistoryShell() {
    const page = byId("claimSearchInsuredDetailPage");
    const shell = page?.querySelector(".csd-shell");
    const heading = shell?.querySelector(".cws-history-page-head");
    const backbar = heading?.querySelector(".csd-backbar");
    const profile = shell?.querySelector(".csd-profile-card");
    if (backbar) shell.insertBefore(backbar, profile || heading);
    if (heading) heading.hidden = true;
  }

  function openClaimDetail(claimNo) {
    const claim = data().claims.find(item => item.cl === claimNo);
    if (!claim) return false;
    const person = personForClaim(claim);
    const policy = person?.policies.find(item => item.policy === claim.policy);
    if (!person || !policy) return false;
    selectedPersonId = person.id;
    selectedPolicyNo = policy.policy;
    if (typeof claimRecordSearchSource !== "undefined") claimRecordSearchSource = "topMenu";
    const insured = insuredDetailRow(person, policy);
    const detailRows = historyRows(person, policy);
    const selectedHistoryIndex = detailRows.findIndex(item => item.claimNo === claim.cl);
    if (selectedHistoryIndex < 0) return false;
    if (typeof claimSearchInsuredCurrentRow !== "undefined") claimSearchInsuredCurrentRow = insured;
    if (typeof claimSearchInsuredCurrentHistoryRows !== "undefined") claimSearchInsuredCurrentHistoryRows = detailRows;
    return typeof window.openClaimSearchHistoryModal === "function" ? window.openClaimSearchHistoryModal(selectedHistoryIndex, "view") : false;
  }

  function runSearch() {
    if (!validate()) return false;
    const type = byId("cwsSearchType").value;
    const query = byId("cwsSearchQuery").value.trim();
    const needle = query.toLocaleLowerCase("th-TH");
    selectedPersonId = "";
    selectedPolicyNo = "";

    if (type === "CL" || type === "CASE") {
      const rows = data().claims.filter(claim => String(type === "CL" ? claim.cl : claim.caseNo).toLowerCase() === needle);
      return rows.length ? renderClaims(rows) : renderNoResult(query);
    }

    if (type === "SCHOOL") {
      const academicYear = byId("cwsAcademicYear").value;
      const matches = [];
      data().people.forEach(person => person.policies.forEach(policy => {
        if (policy.product === "PA" && policy.school !== "-" && String(policy.academicYear) === academicYear && policy.school.toLocaleLowerCase("th-TH").includes(needle)) matches.push({ person, policy });
      }));
      return renderSchoolResults(matches, query, academicYear);
    }

    let people = data().people.filter(person => {
      if (type === "NATIONAL_ID") return person.nationalId === query;
      if (type === "PASSPORT") return person.passport.toLowerCase() === needle;
      if (type === "APP_ID") return person.policies.some(policy => policy.appId.toLowerCase() === needle);
      if (type === "STUDENT_CARD") return person.policies.some(policy => policy.card.toLowerCase() === needle);
      if (type === "NAME") return `${person.first} ${person.last}`.toLocaleLowerCase("th-TH").includes(needle.replace(/^(นาย|นาง|นางสาว)\s*/, ""));
      return false;
    });
    if (!people.length) return renderNoResult(query);
    if (type === "NAME" && people.length > 1) return renderPeopleChooser(people);

    const person = people[0];
    if (type === "APP_ID") return renderPolicyResults(person, person.policies.filter(policy => policy.appId.toLowerCase() === needle), true);
    if (type === "STUDENT_CARD") return renderPolicyResults(person, person.policies.filter(policy => policy.card.toLowerCase() === needle), true);
    renderPolicyResults(person, person.policies, person.policies.length === 1);
    return true;
  }

  function activate(options) {
    const surface = mount();
    const page = byId(PAGE_ID);
    if (!surface || !page) return;
    page.classList.add("claim-work-search-active");
    surface.hidden = false;
    if (!options?.preserve) resetAll();
    const pageTitle = byId("pageTitle");
    const pageSubtitle = byId("pageSubtitle");
    if (pageTitle) pageTitle.textContent = "ค้นหารายการเคลม";
    if (pageSubtitle) pageSubtitle.textContent = "งานเคลม / ค้นหาเคลม";
    document.title = "ค้นหารายการเคลม | ClaimAgent";
  }

  function deactivate() {
    const page = byId(PAGE_ID);
    page?.classList.remove("claim-work-search-active");
    const surface = byId(SURFACE_ID);
    if (surface) surface.hidden = true;
    byId("claimSearchInsuredDetailPage")?.classList.remove("claim-work-search-history");
    restoreClaimHistoryShell();
  }

  const wrappedTopSearch = function () {
    const result = typeof originalTopSearch === "function" ? originalTopSearch.apply(this, arguments) : undefined;
    activate({ preserve: false });
    return result;
  };
  const wrappedClaimRecordSearch = function () {
    deactivate();
    return typeof originalClaimRecordSearch === "function" ? originalClaimRecordSearch.apply(this, arguments) : undefined;
  };
  const wrappedBackToSearch = function () {
    const result = typeof originalBackToSearch === "function" ? originalBackToSearch.apply(this, arguments) : undefined;
    if (typeof claimRecordSearchSource !== "undefined" && claimRecordSearchSource === "topMenu") activate({ preserve: true });
    return result;
  };

  window.showTopClaimSearchPage = wrappedTopSearch;
  window.showClaimRecordSearchPage = wrappedClaimRecordSearch;
  window.backToClaimRecordSearch = wrappedBackToSearch;
  window.ClaimWorkSearch = Object.freeze({ activate, deactivate, runSearch, reset: resetAll, selectPerson, selectQuickExample, openClaimDetail });
  try { eval("showTopClaimSearchPage=wrappedTopSearch"); } catch (_error) {}
  try { eval("showClaimRecordSearchPage=wrappedClaimRecordSearch"); } catch (_error) {}
  try { eval("backToClaimRecordSearch=wrappedBackToSearch"); } catch (_error) {}

  mount();
})();
