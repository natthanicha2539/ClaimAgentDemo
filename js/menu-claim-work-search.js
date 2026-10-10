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
  let viewMode = "demo";

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

  function money(value) {
    if (value === undefined || value === null || value === "") return "—";
    const number = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(number) ? number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  }

  function statusClass(status) {
    if (/ปฏิเสธ/.test(String(status))) return "rejected";
    if (/ยกเลิก/.test(String(status))) return "cancelled";
    if (status === "Close") return "closed";
    if (status === "Re-Open") return "reopened";
    if (status === "Open") return "open";
    if (/อนุมัติ/.test(String(status))) return "active";
    return "pending";
  }

  function claimCategory(claim) {
    return claim.category || "เคลมลูกค้า";
  }

  function categoryLabel(claim) {
    return claimCategory(claim) === "Death&Disability" ? "Death & Disability" : claimCategory(claim);
  }

  function renderMockOptions() {
    const category = byId("cwsMockCategory")?.value || "all";
    const selector = byId("cwsMockCase");
    if (!selector) return;
    const options = data().claims.filter(claim => category === "all" || claimCategory(claim) === category)
      .map(claim => `<option value="${escapeHtml(claim.cl)}">${escapeHtml(`${categoryLabel(claim)} · ${claim.cl} · ${claim.care} · ${claim.status} · ${money(claim.claimed)} บาท`)}</option>`).join("");
    setMarkup(selector, `<option value="">เลือกกรณี Mockup</option>${options}`);
    byId("cwsOpenMockCase").disabled = true;
  }

  function mount() {
    if (mounted) return byId(SURFACE_ID);
    const page = byId(PAGE_ID);
    if (!page) return null;
    Array.from(page.children).forEach(child => child.classList.add("claim-record-search-legacy"));

    const modeBar = document.createElement("div");
    modeBar.id = "cwsModeBar";
    modeBar.className = "cws-mode-bar";
    modeBar.hidden = true;
    setMarkup(modeBar, `<div class="cws-mode-intro"><span class="cws-mode-intro-icon material-icons-round" aria-hidden="true">manage_search</span><div><h2 id="cwsPageTitle">ค้นหารายการเคลม</h2><p>เลือกมุมมองและค้นหาข้อมูลเคลมที่ต้องการ</p></div></div><div class="cws-mode-switch" role="group" aria-label="เลือกมุมมองค้นหารายการเคลม">
      <button id="cwsDemoMode" type="button" aria-pressed="true"><span class="material-icons-round" aria-hidden="true">science</span>เปิดมุมมอง Demo</button>
      <button id="cwsLiveMode" type="button" aria-pressed="false"><span class="material-icons-round" aria-hidden="true">manage_search</span>มุมมองใช้งานจริง</button>
    </div><p id="cwsModeNote" class="cws-mode-note" role="note"></p>`);
    page.prepend(modeBar);

    const surface = document.createElement("section");
    surface.id = SURFACE_ID;
    surface.hidden = true;
    surface.setAttribute("aria-labelledby", "cwsPageTitle");
    setMarkup(surface, `
      <section class="cws-card" aria-labelledby="cwsSearchTitle">
        <header class="cws-card-head">
          <div class="cws-card-title"><span class="cws-card-title-icon"><span class="material-icons-round">search</span></span><div><h3 id="cwsSearchTitle">เงื่อนไขการค้นหา</h3><p>เลือกประเภทคำค้นหา แล้วระบุข้อมูลเพื่อค้นหารายการเคลม</p></div></div>
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
            <div class="cws-demo-head"><div><span class="cws-demo-eyebrow">ข้อมูล Demo</span><h4>ลองดูเคลมตัวอย่าง</h4><p>เลือกประเภทเคลมและรายการที่ต้องการเปิดดู</p></div></div>
            <div class="cws-principle-tip">
              <button id="cwsPrincipleTipButton" type="button" aria-label="หลักการแสดงผล" aria-describedby="cwsPrincipleTooltip"><span class="material-icons-round" aria-hidden="true">info</span></button>
              <span id="cwsPrincipleTooltip" class="cws-principle-tooltip" role="tooltip"><strong>หลักการแสดงผล:</strong> เลขที่ CL / Case แสดงระดับ Claim · ข้อมูลผู้เอาประกันแสดงระดับ Policy/Application และต้องเลือกกรมธรรม์ก่อนดู Claim History</span>
            </div>
            <div class="cws-mock-picker" aria-label="เลือกกรณี Mockup">
              <div class="cws-mock-field"><label for="cwsMockCategory">ประเภทเคลม</label><select id="cwsMockCategory" class="cws-control"><option value="all">ทุกประเภท</option><option value="เคลมลูกค้า">เคลมลูกค้า</option><option value="เคลมโรงพยาบาล">เคลมโรงพยาบาล</option><option value="Death&Disability">Death &amp; Disability</option></select></div>
              <div class="cws-mock-field"><label for="cwsMockCase">กรณีตัวอย่าง</label><select id="cwsMockCase" class="cws-control"></select></div>
              <button id="cwsOpenMockCase" class="cws-btn secondary" type="button" disabled>ดูรายละเอียดตัวอย่าง</button>
            </div>
            <details class="cws-extra-examples"><summary id="cwsQuickExamplesTitle">ตัวอย่างการค้นหาอื่น</summary><div class="cws-demo-set" aria-labelledby="cwsQuickExamplesTitle">
              ${(data().quickExamples || []).map(item => `<button class="cws-demo-chip" type="button" data-cws-example-type="${escapeHtml(item.type)}" data-cws-example-query="${escapeHtml(item.query)}"${item.academicYear ? ` data-cws-example-year="${escapeHtml(item.academicYear)}"` : ""}>${escapeHtml(item.label)}</button>`).join("")}
            </div></details>
            <div id="cwsMockOnlyNote" class="cws-mock-note" role="note">
              <span class="material-icons-round" aria-hidden="true">science</span>
              <span><strong>หมายเหตุ:</strong> ตัวเลือกนี้ใช้แสดงข้อมูล Mock เพื่อทดสอบเท่านั้น ไม่มีผลต่อข้อมูลเคลมจริงหรือการทำรายการ</span>
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
    renderMockOptions();
    initAcademicYears();
    mounted = true;
    return surface;
  }

  function bindStaticEvents() {
    byId("cwsDemoMode").addEventListener("click", () => setViewMode("demo"));
    byId("cwsLiveMode").addEventListener("click", () => setViewMode("live"));
    byId("cwsMockCategory").addEventListener("change", renderMockOptions);
    byId("cwsMockCase").addEventListener("change", event => { byId("cwsOpenMockCase").disabled = !event.target.value; });
    byId("cwsOpenMockCase").addEventListener("click", () => {
      const claimNo = byId("cwsMockCase").value;
      if (claimNo && selectQuickExample("CL", claimNo)) openClaimDetail(claimNo);
    });
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
    byId("cwsResultSubtitle").hidden = false;
    byId("cwsResultSubtitle").textContent = "ผลลัพธ์จะแสดงหลังจากค้นหา";
    byId("cwsDynamicResult").replaceChildren();
  }

  function setSummary(count, unit, subtitle, hint) {
    byId("cwsEmptyState").hidden = true;
    byId("cwsResultSummary").hidden = false;
    byId("cwsResultCount").textContent = `${count} ${unit}`;
    byId("cwsResultHint").textContent = hint || "";
    byId("cwsResultHint").hidden = !hint;
    byId("cwsResultSubtitle").textContent = subtitle || "";
    byId("cwsResultSubtitle").hidden = !subtitle;
  }

  function renderNoResult(query) {
    byId("cwsEmptyState").hidden = true;
    byId("cwsResultSummary").hidden = true;
    byId("cwsResultSubtitle").hidden = false;
    byId("cwsResultSubtitle").textContent = "ไม่พบข้อมูลที่ตรงกับเงื่อนไข";
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-no-result"><span class="material-icons-round">search_off</span><div><strong>ไม่พบผลการค้นหา</strong><p>ไม่พบข้อมูลสำหรับ “${escapeHtml(query)}” กรุณาตรวจสอบประเภทคำค้นหาและข้อมูลอีกครั้ง</p></div></div>`);
  }

  function personForClaim(claim) {
    return data().people.find(person => person.id === claim.personId);
  }

  function renderClaims(rows) {
    setSummary(rows.length, "รายการ", "", "");
    setMarkup(byId("cwsDynamicResult"), `<div class="cws-table-wrap"><table class="cws-table"><thead><tr><th>Claim No.</th><th>Case No.</th><th>ผู้เอาประกัน</th><th>เลขกรมธรรม์</th><th>ผลิตภัณฑ์</th><th>ประเภทเคลม</th><th>ประเภทการรักษา / สินไหม</th><th>โรงพยาบาล / ผู้รับผลประโยชน์</th><th>สถานะเคลม</th><th class="amount">ยอดเบิก (บาท)</th><th class="amount">จ่ายจริง (บาท)</th><th>Action</th></tr></thead><tbody>${rows.map(row => {
      const person = personForClaim(row);
      const lifecycle = window.ClaimAgentClaimLifecycle.display(row);
      return `<tr><td class="mono">${escapeHtml(row.cl)}</td><td class="mono">${escapeHtml(row.caseNo)}</td><td>${escapeHtml(person ? fullName(person) : "-")}</td><td class="mono">${escapeHtml(row.policy)}</td><td>${productPill(row.product)}</td><td>${escapeHtml(categoryLabel(row))}</td><td><span class="cws-care">${escapeHtml(row.care)}</span></td><td>${escapeHtml(row.beneficiary || row.hospital)}</td><td><span class="cws-status ${statusClass(lifecycle)}">${escapeHtml(lifecycle)}</span></td><td class="amount">${money(row.claimed)}</td><td class="amount">${money(row.paid)}</td><td><button class="cws-view-btn cws-view-icon-btn" type="button" data-cws-view-claim="${escapeHtml(row.cl)}" onclick="ClaimWorkSearch.openClaimDetail(this.dataset.cwsViewClaim)" aria-label="ดูรายละเอียดเคลม ${escapeHtml(row.cl)}" title="ดูรายละเอียดเคลม"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr>`;
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

  function mockClaimDetail(claim, person, policy) {
    claim = { ...claim, ...(data().claimDetails?.[claim.cl] || {}) };
    const category = claimCategory(claim);
    const hospital = category === "เคลมโรงพยาบาล";
    const death = category === "Death&Disability";
    const organLoss = death && /สูญเสียอวัยวะ/.test(claim.care || "");
    const money = value => Number(String(value).replace(/,/g, ""));
    const [claimDay, claimMonth, claimYear] = String(claim.createDate || "").slice(0, 10).split("/").map(Number);
    const [birthDay, birthMonth, birthYear] = String(person.birthDate || "").split("/").map(Number);
    const ageAtClaim = claimYear && birthYear ? `${claimYear - birthYear - (claimMonth < birthMonth || claimMonth === birthMonth && claimDay < birthDay ? 1 : 0)} ปี` : undefined;
    const claimed = money(claim.claimed), paid = money(claim.paid);
    const approved = claim.status === "อนุมัติ", rejected = claim.status === "ปฏิเสธ";
    const decided = approved || rejected;
    const addDays = (value, days, time) => {
      const [day, month, year] = value.slice(0, 10).split("/").map(Number);
      const date = new Date(year - 543, month - 1, day + days);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear() + 543} ${time}`;
    };
    const reviewer = "06418 - พิมพ์ชนก สุวรรณสุข";
    const operator = "06590 - ณัฏฐณิชา โตรักษา";
    const decisionDate = decided ? addDays(claim.createDate, claim.care === "IPD" || death ? 3 : 1, "14:20:50") : undefined;
    const missingDocument = claim.status === "รอเอกสาร";
    const incidentTime = claim.incidentTime || "09:00";
    const admissionDate = claim.admitDate || (claim.care === "IPD" ? claim.incidentDate : claim.createDate.slice(0, 10));
    const dischargeDate = claim.dischargeDate || (claim.care === "IPD" ? addDays(admissionDate, claim.ipdDays || 2, "00:00").slice(0, 10) : admissionDate);
    const documentsCompleteDate = !missingDocument && (decided || claim.status === "รอพิจารณา") ? addDays(claim.createDate, death || claim.care === "IPD" ? 2 : 1, "00:00").slice(0, 10) : undefined;
    const reason = approved ? organLoss ? "แพทย์รับรองการสูญเสียอวัยวะถาวร และพิจารณาผลประโยชน์ตามตารางของแผนตัวอย่าง" : death ? "ผลพิจารณาสินไหมและสิทธิ์ผู้รับผลประโยชน์ครบถ้วนตามกรมธรรม์" : "เอกสารครบถ้วนและรายการรักษาอยู่ในความคุ้มครองตามกรมธรรม์" : rejected ? death ? "เหตุที่แจ้งไม่เข้าเงื่อนไขผลประโยชน์กรณีเสียชีวิตหรือทุพพลภาพ" : "รายการรักษาที่แจ้งไม่เข้าเงื่อนไขความคุ้มครองของกรมธรรม์" : missingDocument ? "รอใบรับรองแพทย์เพื่อประกอบการพิจารณา" : "อยู่ระหว่างตรวจสอบเอกสารและสิทธิ์ตามกรมธรรม์";
    const phCustomer = !death && !hospital && claim.product === "PH";
    const documentTypes = organLoss ? ["ใบรับรองแพทย์ระบุการสูญเสียอวัยวะ", "รายงานการรักษาและหัตถการ", "ผลตรวจประกอบการประเมิน", "บันทึกเหตุอุบัติเหตุ", "สำเนาบัตรประชาชนผู้เอาประกัน", "สำเนาหน้าบัญชีผู้รับผลประโยชน์"] : death ? [claim.care === "เสียชีวิต" ? "ใบมรณบัตร" : "ใบรับรองความทุพพลภาพ", "แบบเรียกร้องสินไหม", "สำเนาบัตรประชาชนผู้รับผลประโยชน์", "สำเนาหน้าบัญชีผู้รับผลประโยชน์"] : hospital ? ["ใบแจ้งหนี้โรงพยาบาล", ...(missingDocument ? [] : ["ใบรับรองแพทย์"]), "สรุปค่ารักษาพยาบาล", "แบบเรียกร้องค่าสินไหม"] : phCustomer ? ["เอกสารประกอบการพิจารณาเคลม(OCR)", "เอกสารประกอบการพิจารณาเคลม"] : ["ใบเสร็จรับเงิน", ...(missingDocument ? [] : ["ใบรับรองแพทย์"]), "แบบแจ้งอุบัติเหตุนักเรียน", "สำเนาหน้าบัญชีธนาคาร"];
    const documents = documentTypes.map((type, index) => ({
      name: `${type}_${claim.cl}.pdf`, type, uploadDate: addDays(claim.createDate, organLoss ? 2 : claim.care === "IPD" ? 2 : 1, `${organLoss ? "13" : "09"}:${String(10 + index).padStart(2, "0")}:00`), user: operator, mockPreview: true,
      ...(phCustomer && index === 0 ? { previewOptions: ["บัตรประชาชน", "ใบรับรองแพทย์", "ใบเสร็จ"].map((name, optionIndex) => ({
        type: name, name: `${name}_${claim.cl}.pdf`, preview: { reference: `${claim.caseNo}-OCR${optionIndex + 1}`, documentDate: claim.incidentDate, subject: name === "บัตรประชาชน" ? `ข้อมูลผู้เอาประกัน ${fullName(person)}` : name === "ใบรับรองแพทย์" ? claim.complaint : `ค่ารักษาพยาบาล ${claim.claimed} บาท` }
      })) } : {}),
      preview: { reference: `${claim.caseNo}-D${index + 1}`, documentDate: organLoss && index < 3 ? claim.organLoss.assessmentDate : claim.incidentDate, subject: organLoss ? [claim.organLoss.medicalFinding, `รายงานการรักษา ${claim.organLoss.level} ณ ${claim.organLoss.certifyingHospital}`, `ผลประเมินการสูญเสียถาวรโดย ${claim.organLoss.assessor}`, `เหตุอุบัติเหตุจราจรเมื่อ ${claim.incidentDate} · ${claim.complaint}`, `ยืนยันตัวตนผู้เอาประกัน ${fullName(person)}`, `บัญชีรับเงินในนาม ${claim.beneficiary}`][index] : death ? `${claim.care} · ผู้รับผลประโยชน์ ${claim.beneficiary} · วงเงินเรียกร้อง ${claim.claimed} บาท` : type === "ใบรับรองแพทย์" ? claim.complaint : /ใบเสร็จ|ใบแจ้งหนี้/.test(type) ? `ค่ารักษาพยาบาล ${claim.claimed} บาท` : type === "สำเนาหน้าบัญชีธนาคาร" ? `บัญชีรับเงินในนาม ${fullName(person)}` : `คำร้องสำหรับ ${claim.cl}` }
    }));
    const financial = { receipt: claim.claimed, benefit: approved ? claim.paid : rejected ? "0.00" : undefined, discount: decided ? "0.00" : undefined, nonCovered: decided ? (claimed - paid).toFixed(2) : undefined, nplExgratia: decided ? "0.00" : undefined, approvedNet: decided ? claim.paid : undefined, transfer: claim.paid };
    const policyPaid = data().claims.filter(item => item.policy === policy.policy).reduce((total, item) => total + money(item.paid), 0);
    const coverageItems = organLoss ? [
      { kind: "group", name: "ความคุ้มครองกรณีสูญเสียอวัยวะ" },
      { name: "วงเงินผลประโยชน์สูญเสียอวัยวะตามแผน", condition: "วงเงินสูงสุดตามแผนตัวอย่าง", maximum: money(policy.benefitLimit).toLocaleString("en-US"), maxCount: "1", unit: "ต่อเหตุ" },
      { name: claim.organLoss.level, condition: `${claim.organLoss.benefitPercent}% ของวงเงินผลประโยชน์สูงสุด`, maximum: claim.organLoss.approvedAmount, maxCount: "1", unit: "ต่อเหตุ" }
    ] : [
      { kind: "group", name: death ? "ความคุ้มครองกรณีเสียชีวิต / ทุพพลภาพ" : claim.product === "PA" ? "ความคุ้มครองกรณีอุบัติเหตุ" : "ความคุ้มครองค่ารักษาพยาบาล" },
      { name: death ? `สินไหมกรณี${claim.care}` : "วงเงินค่ารักษาพยาบาลรวมตามแผน", coverage: `${money(policy.benefitLimit).toLocaleString("en-US")}/กรมธรรม์`, maximum: money(policy.benefitLimit).toLocaleString("en-US"), maxCount: death ? "1" : "—", unit: death ? "ต่อเหตุ" : "ตลอดระยะเวลากรมธรรม์", condition: death ? "ต่อเหตุ" : "วงเงินรวมทุกประเภทการรักษา", remaining: Math.max(0, money(policy.benefitLimit) - policyPaid).toLocaleString("en-US") }
    ];
    const activities = [{ title: "รับแจ้งเคลม", status: "รับรายการแล้ว", date: claim.createDate, detail: claim.caseNo, icon: "description" }];
    if (organLoss) activities.push({ title: "รับผลประเมินการสูญเสียอวัยวะ", status: "รับรองผลแล้ว", date: claim.organLoss.assessmentDate, detail: `${claim.organLoss.assessor} · ${claim.organLoss.level}`, icon: "medical_information" });
    activities.push({ title: "รับเอกสารประกอบ", status: missingDocument ? "รอเอกสารเพิ่มเติม" : "รับเอกสารแล้ว", date: documents.at(-1).uploadDate, detail: `${documents.length} เอกสาร`, icon: "folder_open" });
    if (decided) activities.push({ title: "บันทึกผลการพิจารณา", status: claim.status, date: decisionDate, detail: `${reviewer} · ${reason}`, icon: "fact_check" });
    const transferTitle = death ? "โอนเงินให้ผู้รับผลประโยชน์" : hospital ? "โอนเงินโรงพยาบาล" : "โอนเงินให้ลูกค้า";
    const transferStage = death ? "beneficiary-transfer" : hospital ? "hospital-transfer" : "customer-transfer";
    const paymentEvents = paid > 0 ? [
      { stage: transferStage, title: transferTitle, amount: claim.paid, status: "โอนสำเร็จ", date: addDays(claim.createDate, 5, "10:25:00"), reference: `${hospital ? "HCG" : "CPG"}-${claim.cl.slice(2)}` },
      ...(!hospital ? [{ stage: "fund-disbursement", title: "ตั้งเบิกกองทุน", amount: claim.paid, status: "ตั้งเบิกสำเร็จ", date: addDays(claim.createDate, 6, "11:15:00"), reference: `FND-${claim.cl.slice(2)}` }] : []),
      { stage: "insurer-receipt", title: "รับเงินจาก บ.ประกัน", amount: claim.paid, status: "รับชำระสำเร็จ", date: addDays(claim.createDate, 8, "14:30:00"), reference: `INS-${claim.cl.slice(2)}` }
    ] : [];
    paymentEvents.forEach(event => activities.push({ title: event.title, status: event.status, date: event.date, detail: `${event.amount} บาท · ${event.reference}`, icon: "account_balance_wallet" }));
    return {
      mock: true, claimCategory: category, beneficiary: claim.beneficiary, organLoss: organLoss ? claim.organLoss : undefined, appId: policy.appId, plan: policy.plan, idCard: person.nationalId, dob: person.birthDate, age: ageAtClaim, phone: person.phone, start: policy.start, effectiveDate: policy.effectiveDate, end: policy.end, appStatus: policy.status, branch: claim.branch || "สำนักงานใหญ่", insuredType: claim.insuredType || policy.insuredType, studentCard: policy.card, school: policy.school === "-" ? undefined : policy.school,
      schoolData: claim.schoolData || policy.schoolData,
      isPhysicalTherapy: claim.isPhysicalTherapy ?? false, medicalNecessity: claim.medicalNecessity,
      trafficAccident: claim.trafficAccident || { isTrafficAccident: false },
      cause: claim.cause, coverage: claim.coverage || (hospital ? "ค่ารักษา" : death ? claim.care : undefined), documentsCompleteDate: claim.documentsCompleteDate || documentsCompleteDate,
      deathCause: claim.deathCause, disabilityCause: claim.disabilityCause, deathDate: claim.deathDate, receivedDocumentsDate: claim.receivedDocumentsDate || (death ? claim.createDate.slice(0, 10) : undefined),
      medicalNote: claim.medicalNote, optionalNote: claim.optionalNote, additionalDetail: claim.additionalDetail,
      hn: claim.hn, doctorLicenseNo: claim.doctorLicenseNo, doctorName: claim.doctorName,
      isContinuous: claim.isContinuous ?? false, previousClaimNo: claim.previousClaimNo, previousCaseNo: claim.previousCaseNo, previousServiceDate: claim.previousServiceDate,
      incidentTime, admitDate: admissionDate, admitTime: claim.admitTime || "09:30", dischargeDate, dischargeTime: claim.dischargeTime || (claim.care === "IPD" ? "11:00" : "12:00"),
      ipdDays: claim.ipdDays, icuDays: claim.icuDays, totalDays: claim.totalDays, diagnosis1: claim.diagnosis1, diagnosis2: claim.diagnosis2, diagnosis3: claim.diagnosis3,
      statusReason: reason, statusDetail: decided ? `พิจารณาโดย ${reviewer} เมื่อ ${decisionDate}` : reason,
      decision: {
        result: claim.status, date: decisionDate, user: decided ? reviewer : undefined,
        reason: rejected ? "ไม่มีความคุ้มครอง" : missingDocument ? "เอกสารไม่ครบถ้วน" : undefined,
        detail: rejected || missingDocument ? reason : undefined,
        note: approved ? `อนุมัติ ${claim.paid} บาท จากยอดเรียกร้อง ${claim.claimed} บาท · ${reason}${organLoss ? ` · อัตราผลประโยชน์ตัวอย่าง ${claim.organLoss.benefitPercent}%` : ""}` : undefined
      },
      paymentStatus: paid > 0 ? "โอนสำเร็จ" : approved ? "รอดำเนินการโอนเงิน" : "", financial,
      expenses: [{ item: organLoss ? claim.organLoss.level : death ? `สินไหมกรณี${claim.care}` : hospital ? "ค่ารักษาพยาบาลตามใบแจ้งหนี้" : "ค่ารักษาพยาบาลตามใบเสร็จ", receipt: claim.claimed, benefit: decided ? claim.paid : undefined, discount: decided ? "0.00" : undefined, nonCovered: decided ? (claimed - paid).toFixed(2) : undefined, approved: decided ? claim.paid : undefined, nplExgratia: decided ? "0.00" : undefined, note: decided ? reason : "รอผลการพิจารณา" }],
      documents, activities, coverageItems, memos: [{ code: `M-${claim.cl.slice(-4)}`, user: operator, date: claim.createDate, type: "บันทึกการรับเคลม", message: missingDocument ? "แจ้งขอใบรับรองแพทย์เพิ่มเติม" : rejected ? `รับเรื่อง ${claim.cl} และแจ้งให้ตรวจสอบเงื่อนไขความคุ้มครอง` : `รับเรื่องและเอกสารสำหรับ ${claim.cl}` }, ...(organLoss ? [{ code: `M-${claim.cl.slice(-4)}-02`, user: reviewer, date: claim.organLoss.assessmentDate, type: "บันทึกผลประเมิน", message: `ตรวจใบรับรองแพทย์และผลประเมิน ${claim.organLoss.level} · พิจารณาตามอัตราผลประโยชน์ตัวอย่าง ${claim.organLoss.benefitPercent}%` }] : [])],
      paymentEvents
    };
  }

  function historyRows(person, policy) {
    return data().claims.filter(claim => claim.personId === person.id && claim.policy === policy.policy).map(claim => ({
      createDate: claim.createDate,
      claimNo: claim.cl,
      caseNo: claim.caseNo,
      policyNo: claim.policy,
      name: fullName(person),
      product: claim.product,
      claimType: claim.care,
      claimCategory: claimCategory(claim),
      beneficiary: claim.beneficiary,
      claimStatus: claim.status,
      hospital: claim.hospital,
      chiefComplaint: claim.complaint,
      incidentDate: claim.incidentDate,
      status: window.ClaimAgentClaimLifecycle.display(claim),
      claimAmount: claim.claimed,
      paidAmount: claim.paid,
      claimWorkSearchSource: true,
      opdCount: claim.opdCount,
      note: `${claim.care} · ${claim.hospital}`,
      ...mockClaimDetail(claim, person, policy)
    }));
  }

  function insuredDetailRow(person, policy) {
    return {
      name: fullName(person), idCard: person.nationalId, passport: person.passport, phone: person.phone, dob: person.birthDate,
      appStatus: policy.status, appId: policy.appId, policyNo: policy.policy, policyAge: "1 ปี 2 เดือน", start: policy.start, effectiveDate: policy.effectiveDate,
      end: policy.cancel === "-" ? policy.end : policy.cancel, plan: policy.plan, product: policy.product,
      school: policy.school, schoolData: policy.schoolData, insuredType: policy.insuredType, studentRef: policy.card, claimHistory: []
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
    setViewMode(viewMode);
    if (!options?.preserve && viewMode === "demo") resetAll();
    byId("cwsModeBar").hidden = false;
    const pageTitle = byId("pageTitle");
    const pageSubtitle = byId("pageSubtitle");
    if (pageTitle) pageTitle.textContent = "ค้นหารายการเคลม";
    if (pageSubtitle) pageSubtitle.textContent = "งานเคลม / ค้นหาเคลม";
    document.title = "ค้นหารายการเคลม | ClaimAgent";
  }

  function deactivate() {
    const page = byId(PAGE_ID);
    page?.classList.remove("claim-work-search-active");
    page?.classList.remove("claim-work-search-live");
    const surface = byId(SURFACE_ID);
    if (surface) surface.hidden = true;
    const modeBar = byId("cwsModeBar");
    if (modeBar) modeBar.hidden = true;
    byId("claimSearchInsuredDetailPage")?.classList.remove("claim-work-search-history");
    restoreClaimHistoryShell();
  }

  function setViewMode(nextMode) {
    const page = byId(PAGE_ID);
    const surface = byId(SURFACE_ID);
    if (!page || !surface || !["demo", "live"].includes(nextMode)) return;
    viewMode = nextMode;
    const demo = nextMode === "demo";
    page.classList.toggle("claim-work-search-active", demo);
    page.classList.toggle("claim-work-search-live", !demo);
    surface.hidden = !demo;
    byId("cwsDemoMode").setAttribute("aria-pressed", String(demo));
    byId("cwsLiveMode").setAttribute("aria-pressed", String(!demo));
    byId("cwsModeNote").textContent = demo
      ? "ข้อมูล Demo ใช้สำหรับทดลองค้นหาและดูรายละเอียดเคลม"
      : "มุมมองใช้งานจริงใช้หน้าค้นหาเดิมของระบบ · ข้อมูลในเวอร์ชันตัวอย่างนี้ยังเป็นข้อมูลจำลอง";
    const sectionTitle = byId("claimSearchSectionTitle");
    if (sectionTitle && !demo) sectionTitle.textContent = "ค้นหารายการเคลม";
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
