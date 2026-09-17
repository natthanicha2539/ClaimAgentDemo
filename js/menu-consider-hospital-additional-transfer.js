(function () {
  "use strict";

  const monitorPageId = "considerHospitalAdditionalTransferPage";
  const detailPageId = "considerHospitalAdditionalTransferDetailPage";
  const submenuId = "submenuConsiderHospitalAdditionalTransfer";
  const mountId = "hospitalAdditionalTransferMonitorMount";
  const detailMountId = "hospitalAdditionalTransferDetailMount";
  const pageSizeOptions = [5, 10, 20];
  const statusOptions = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "WAITING", label: "รอพิจารณา" },
    { value: "OVERDUE", label: "เกิน 24 ชม." },
    { value: "RETURN", label: "ส่งกลับแก้ไข" },
    { value: "APPROVED", label: "อนุมัติแล้ว" }
  ];
  const dateOptions = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "TODAY", label: "วันนี้" },
    { value: "7D", label: "7 วันล่าสุด" },
    { value: "30D", label: "30 วันล่าสุด" }
  ];
  const state = {
    draftSearch: "",
    draftStatus: "ALL",
    draftDate: "ALL",
    search: "",
    status: "ALL",
    date: "ALL",
    quickFilter: "ALL",
    page: 1,
    pageSize: 5,
    scrollY: 0,
    currentRequestId: null,
    decisionDrafts: Object.create(null),
    detailScrollByRequest: Object.create(null),
    heroStickyByRequest: Object.create(null)
  };

  function getRequests() {
    const dataset = window.ClaimAgentHospitalAdditionalTransferMock;
    return Array.isArray(dataset?.requests) ? dataset.requests : [];
  }

  function getPageScrollPosition(pageId) {
    const page = document.getElementById(pageId);
    return Math.max(Number(page?.scrollTop) || 0, Number(window.scrollY) || 0);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function deriveAdditionalTransferProduct(claimNo) {
    const normalized = String(claimNo || "").trim().toUpperCase();
    if (normalized.startsWith("CLPA")) return "PA";
    if (normalized.startsWith("CL")) return "PH";
    return "-";
  }

  function formatAdditionalTransferMoney(value) {
    return Number(value || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function parseAdditionalTransferThaiDate(dateValue, timeValue) {
    const dateParts = String(dateValue || "").split("/").map(Number);
    if (dateParts.length !== 3 || dateParts.some(function (part) { return !Number.isFinite(part); })) return null;
    const timeParts = String(timeValue || "00:00").split(":").map(Number);
    const year = dateParts[2] > 2400 ? dateParts[2] - 543 : dateParts[2];
    return new Date(year, dateParts[1] - 1, dateParts[0], timeParts[0] || 0, timeParts[1] || 0, 0, 0);
  }

  function matchesDateFilter(request) {
    if (state.date === "ALL") return true;
    const receivedAt = parseAdditionalTransferThaiDate(request.receivedDate, request.receivedTime);
    if (!receivedAt) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const receivedDay = new Date(receivedAt.getFullYear(), receivedAt.getMonth(), receivedAt.getDate());
    const dayDifference = Math.floor((today - receivedDay) / 86400000);
    if (state.date === "TODAY") return dayDifference === 0;
    if (state.date === "7D") return dayDifference >= 0 && dayDifference < 7;
    if (state.date === "30D") return dayDifference >= 0 && dayDifference < 30;
    return true;
  }

  function getStatusMeta(status) {
    if (status === "APPROVED") return { label: "อนุมัติแล้ว", icon: "check_circle", tone: "success" };
    if (status === "RETURN") return { label: "ส่งกลับแก้ไข", icon: "reply", tone: "danger" };
    if (status === "OVERDUE") return { label: "เกิน 24 ชม.", icon: "schedule", tone: "warning" };
    return { label: "รอพิจารณา", icon: "hourglass_top", tone: "pending" };
  }

  function getFilteredRequests() {
    const query = state.search.trim().toLocaleLowerCase("th-TH");
    return getRequests().filter(function (request) {
      const product = deriveAdditionalTransferProduct(request.claimNo);
      const searchableText = [request.requestId, request.refNo, request.claimNo, request.caseNo, request.insured, request.hospital, request.treatment, request.plan, product]
        .join(" ")
        .toLocaleLowerCase("th-TH");
      const matchesSearch = !query || searchableText.includes(query);
      const matchesStatus = state.status === "ALL" || request.status === state.status;
      return matchesSearch && matchesStatus && matchesDateFilter(request);
    });
  }

  function getStatusCounts() {
    return getRequests().reduce(function (counts, request) {
      counts.ALL += 1;
      if (Object.prototype.hasOwnProperty.call(counts, request.status)) counts[request.status] += 1;
      return counts;
    }, { ALL: 0, WAITING: 0, OVERDUE: 0, RETURN: 0, APPROVED: 0 });
  }

  function renderQuickFilters() {
    const counts = getStatusCounts();
    return statusOptions.map(function (option) {
      const active = state.quickFilter === option.value;
      return '<button type="button" class="hat-quick-filter' + (active ? " is-active" : "") + '" data-hat-quick-filter="' + option.value + '" aria-pressed="' + String(active) + '"><span>' + option.label + '</span><b>' + counts[option.value] + "</b></button>";
    }).join("");
  }

  function renderStatus(status) {
    const meta = getStatusMeta(status);
    return '<span class="hat-status-pill is-' + meta.tone + '"><span class="material-icons-round" aria-hidden="true">' + meta.icon + "</span>" + meta.label + "</span>";
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<tr><td colspan="7"><div class="hat-empty-state"><span class="material-icons-round" aria-hidden="true">search_off</span><strong>ไม่พบรายการ</strong><span>ลองเปลี่ยนคำค้นหาหรือตัวกรองแล้วค้นหาอีกครั้ง</span></div></td></tr>';
    }
    return rows.map(function (request) {
      const claimNo = escapeHtml(request.claimNo);
      const product = deriveAdditionalTransferProduct(request.claimNo);
      return '<tr data-request-id="' + escapeHtml(request.requestId) + '" data-hat-product="' + product + '">' +
        '<td class="hat-hospital-cell"><strong>' + escapeHtml(request.hospital) + "</strong></td>" +
        '<td class="hat-insured-cell"><strong>' + escapeHtml(request.insured) + '</strong><span>' + escapeHtml(request.plan) + "</span></td>" +
        '<td class="hat-claim-cell"><strong>' + claimNo + '</strong><span>' + escapeHtml(request.caseNo) + "</span></td>" +
        '<td class="hat-date-cell"><strong>' + escapeHtml(request.receivedDate) + '</strong><span>' + escapeHtml(request.receivedTime) + " น.</span></td>" +
        '<td class="hat-amount-cell"><strong>' + formatAdditionalTransferMoney(request.requestedAmount) + '</strong><span>บาท</span></td>' +
        "<td>" + renderStatus(request.status) + "</td>" +
        '<td data-column="action"><button type="button" class="hat-action-button action-icon-btn" data-hat-open-detail="' + escapeHtml(request.requestId) + '" aria-label="ดูรายละเอียด ' + claimNo + '" title="ดูรายละเอียด"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td>' +
      "</tr>";
    }).join("");
  }

  function renderPagination(totalRows, totalPages) {
    const start = totalRows ? ((state.page - 1) * state.pageSize) + 1 : 0;
    const end = Math.min(state.page * state.pageSize, totalRows);
    const pageButtons = Array.from({ length: totalPages }, function (_, index) {
      const pageNumber = index + 1;
      const active = pageNumber === state.page;
      return '<button type="button" class="hat-page-button' + (active ? " is-active" : "") + '" data-hat-page="' + pageNumber + '" aria-label="หน้า ' + pageNumber + '"' + (active ? ' aria-current="page"' : "") + ">" + pageNumber + "</button>";
    }).join("");
    return '<div class="hat-pagination-summary">แสดง ' + start + "–" + end + " จาก " + totalRows + " รายการ</div>" +
      '<div class="hat-pagination-controls"><label for="hatRowsPerPage">แถวต่อหน้า</label><select id="hatRowsPerPage" class="hat-control hat-page-size">' + pageSizeOptions.map(function (size) {
        return '<option value="' + size + '"' + (state.pageSize === size ? " selected" : "") + ">" + size + "</option>";
      }).join("") + '</select><button type="button" class="hat-page-button" data-hat-page-direction="previous" aria-label="หน้าก่อนหน้า"' + (state.page <= 1 ? " disabled" : "") + '><span class="material-icons-round" aria-hidden="true">chevron_left</span></button>' +
      pageButtons + '<button type="button" class="hat-page-button" data-hat-page-direction="next" aria-label="หน้าถัดไป"' + (state.page >= totalPages ? " disabled" : "") + '><span class="material-icons-round" aria-hidden="true">chevron_right</span></button></div>';
  }

  function renderMonitor() {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const filteredRequests = getFilteredRequests();
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const pageRows = filteredRequests.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    mount.innerHTML = '<section class="hat-monitor-card" aria-labelledby="hatMonitorCardTitle">' +
      '<div class="hat-monitor-card-header"><div><h3 id="hatMonitorCardTitle">คิวงานพิจารณาคำขอโอนเพิ่ม</h3><p>ค้นหาและกรองรายการที่โรงพยาบาลส่งเข้ามาเพื่อรอพิจารณา</p></div><span class="hat-result-count">' + filteredRequests.length + " รายการ</span></div>" +
      '<form id="hatMonitorFilterForm" class="hat-filter-panel" novalidate><div class="hat-filter-grid">' +
        '<label class="hat-field hat-search-field"><span>ค้นหา</span><div class="hat-search-control"><span class="material-icons-round" aria-hidden="true">search</span><input id="hatMonitorSearch" class="hat-control" type="search" autocomplete="off" value="' + escapeHtml(state.draftSearch) + '" placeholder="Claim No. / Case No. / ผู้เอาประกัน / โรงพยาบาล"><button type="button" class="hat-search-clear' + (state.draftSearch ? "" : " hidden") + '" aria-label="ล้างคำค้นหา"><span class="material-icons-round" aria-hidden="true">close</span></button></div></label>' +
        '<label class="hat-field"><span>สถานะ</span><select id="hatStatusFilter" class="hat-control">' + statusOptions.map(function (option) { return '<option value="' + option.value + '"' + (state.draftStatus === option.value ? " selected" : "") + ">" + option.label + "</option>"; }).join("") + "</select></label>" +
        '<label class="hat-field"><span>ช่วงวันที่รับคำขอ</span><select id="hatDateFilter" class="hat-control">' + dateOptions.map(function (option) { return '<option value="' + option.value + '"' + (state.draftDate === option.value ? " selected" : "") + ">" + option.label + "</option>"; }).join("") + "</select></label>" +
        '<div class="hat-filter-actions"><button type="submit" class="hat-button is-primary"><span class="material-icons-round" aria-hidden="true">search</span>ค้นหา</button><button type="button" class="hat-button is-reset" data-hat-reset><span class="material-icons-round" aria-hidden="true">refresh</span>ล้างตัวกรอง</button></div>' +
      '</div><div class="hat-quick-filter-wrap"><span class="hat-quick-filter-label"><span class="material-icons-round" aria-hidden="true">filter_alt</span>ตัวกรองด่วน</span><div class="hat-quick-filters" role="group" aria-label="ตัวกรองสถานะด่วน">' + renderQuickFilters() + "</div></div></form>" +
      '<div class="hat-table-summary"><span><span class="material-icons-round" aria-hidden="true">fact_check</span>รายการคำขอโอนเพิ่ม</span><span>ผลลัพธ์ ' + filteredRequests.length + " รายการ</span></div>" +
      '<div class="hat-table-shell overflow-x-auto soft-scroll"><table class="hat-monitor-table"><thead><tr><th>สถานพยาบาล</th><th>ผู้เอาประกัน</th><th>Claim / Case</th><th>วันที่รับคำขอ</th><th class="hat-align-right">ยอดขอโอนเพิ่ม</th><th>สถานะ</th><th data-column="action">Action</th></tr></thead><tbody>' + renderRows(pageRows) + "</tbody></table></div>" +
      '<div class="hat-pagination">' + renderPagination(filteredRequests.length, totalPages) + "</div></section>";

    bindMonitorEvents();
  }

  function applyFilters() {
    state.search = state.draftSearch;
    state.status = state.draftStatus;
    state.date = state.draftDate;
    state.quickFilter = state.status;
    state.page = 1;
    renderMonitor();
  }

  function resetFilters() {
    state.draftSearch = "";
    state.draftStatus = "ALL";
    state.draftDate = "ALL";
    state.search = "";
    state.status = "ALL";
    state.date = "ALL";
    state.quickFilter = "ALL";
    state.page = 1;
    renderMonitor();
  }

  function bindMonitorEvents() {
    const mount = document.getElementById(mountId);
    const form = document.getElementById("hatMonitorFilterForm");
    const search = document.getElementById("hatMonitorSearch");
    const status = document.getElementById("hatStatusFilter");
    const date = document.getElementById("hatDateFilter");
    if (!mount || !form || !search || !status || !date) return;

    search.addEventListener("input", function () {
      state.draftSearch = search.value;
      mount.querySelector(".hat-search-clear")?.classList.toggle("hidden", !state.draftSearch);
    });
    status.addEventListener("change", function () {
      state.draftStatus = status.value;
      state.quickFilter = status.value;
      mount.querySelectorAll("[data-hat-quick-filter]").forEach(function (button) {
        const active = button.dataset.hatQuickFilter === state.quickFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
    date.addEventListener("change", function () { state.draftDate = date.value; });
    form.addEventListener("submit", function (event) { event.preventDefault(); applyFilters(); });
    mount.querySelector("[data-hat-reset]")?.addEventListener("click", resetFilters);
    mount.querySelector(".hat-search-clear")?.addEventListener("click", function () {
      state.draftSearch = "";
      search.value = "";
      mount.querySelector(".hat-search-clear")?.classList.add("hidden");
      search.focus();
    });
    mount.querySelectorAll("[data-hat-quick-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.quickFilter = button.dataset.hatQuickFilter || "ALL";
        state.draftStatus = state.quickFilter;
        state.status = state.quickFilter;
        state.page = 1;
        renderMonitor();
      });
    });
    mount.querySelectorAll("[data-hat-page]").forEach(function (button) {
      button.addEventListener("click", function () { state.page = Number(button.dataset.hatPage) || 1; renderMonitor(); });
    });
    mount.querySelectorAll("[data-hat-page-direction]").forEach(function (button) {
      button.addEventListener("click", function () { state.page += button.dataset.hatPageDirection === "next" ? 1 : -1; renderMonitor(); });
    });
    document.getElementById("hatRowsPerPage")?.addEventListener("change", function (event) {
      state.pageSize = Number(event.target.value) || 5;
      state.page = 1;
      renderMonitor();
    });
    mount.querySelectorAll("[data-hat-open-detail]").forEach(function (button) {
      button.addEventListener("click", function () {
        openConsiderHospitalAdditionalTransferDetail(button.dataset.hatOpenDetail);
      });
    });
  }

  function parseAdditionalTransferMoney(value) {
    return Number(String(value || "0").replace(/,/g, "")) || 0;
  }

  function getAdditionalTransferReceiptTotal(request) {
    return Number(request.totalReceiptAmount ?? (Number(request.originalApproved || 0) + Number(request.requestedAmount || 0)));
  }

  function getAdditionalTransferNetExpense(request) {
    return Number(request.netExpenseAmount ?? getAdditionalTransferReceiptTotal(request));
  }

  function getCalculatedAdditionalTransferApproval(request) {
    return (request.treatmentItems || []).reduce(function (total, item) {
      return total + Number(item.approveNow || 0);
    }, 0);
  }

  function getDecisionDraft(request) {
    if (!state.decisionDrafts[request.requestId]) {
      const approvedAmount = getCalculatedAdditionalTransferApproval(request);
      state.decisionDrafts[request.requestId] = {
        decision: "approve",
        approvedAmount: formatAdditionalTransferMoney(approvedAmount),
        remark: "พิจารณาอนุมัติเพิ่ม " + formatAdditionalTransferMoney(approvedAmount) + " บาท จากยอดที่โรงพยาบาลขอเพิ่ม " + formatAdditionalTransferMoney(request.requestedAmount) + " บาท โดยตรวจสอบตามสิทธิ์คงเหลือและเอกสารเพิ่มเติมแล้ว"
      };
    }
    return state.decisionDrafts[request.requestId];
  }

  function renderDetailSectionHeader(icon, title, description, actionMarkup) {
    const descriptionMarkup = description ? "<p>" + description + "</p>" : "";
    return '<div class="hat-section-header"><div class="hat-section-title"><span class="hat-section-icon material-icons-round" aria-hidden="true">' + icon + '</span><div><h3>' + title + "</h3>" + descriptionMarkup + "</div></div>" + (actionMarkup || "") + "</div>";
  }

  function renderTreatmentItems(request) {
    return (request.treatmentItems || []).map(function (item) {
      const success = item.resultType === "success";
      const isNewItem = Number(item.receiptOld || 0) <= 0 && Number(item.approvedOld || 0) <= 0;
      const oldReceiptMarkup = isNewItem ? '<strong class="is-empty">—</strong><small>ไม่มีรายการเดิม</small>' : '<strong>' + formatAdditionalTransferMoney(item.receiptOld) + "</strong>";
      const oldBenefitMarkup = isNewItem ? '<strong class="is-empty">—</strong><small>ไม่มีสิทธิ์เบิกเดิม</small>' : '<strong>' + formatAdditionalTransferMoney(item.approvedOld) + "</strong>";
      return '<article class="hat-treatment-item' + (isNewItem ? " is-new" : "") + '"><div class="hat-treatment-heading"><div><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.code) + '</span></div><div class="hat-treatment-statuses">' + (isNewItem ? '<span class="hat-new-item-badge"><span class="material-icons-round" aria-hidden="true">new_releases</span>รายการเพิ่มใหม่</span>' : "") + '<span class="hat-check-result ' + (success ? "is-success" : "is-warning") + '"><span class="material-icons-round" aria-hidden="true">' + (success ? "check_circle" : "warning") + "</span>" + escapeHtml(item.result) + '</span></div></div><div class="hat-treatment-values">' +
        '<div><span>ยอดตามใบเสร็จเดิม</span>' + oldReceiptMarkup + "</div>" +
        '<div><span>สิทธิ์เบิกเดิม</span>' + oldBenefitMarkup + "</div>" +
        '<div><span>ยอดที่ขอเพิ่ม</span><strong>' + formatAdditionalTransferMoney(item.requested) + "</strong></div>" +
        '<div class="is-current"><span>ยอดอนุมัติโอนเพิ่ม</span><strong>' + formatAdditionalTransferMoney(item.approveNow) + "</strong></div>" +
      "</div></article>";
    }).join("");
  }

  function renderDocuments(request) {
    const documents = request.documents || [];
    if (!documents.length) {
      return '<tr><td colspan="4"><div class="hat-doc-empty">ไม่พบเอกสารประกอบ</div></td></tr>';
    }
    return documents.map(function (documentItem, documentIndex) {
      return "<tr><td><strong>" + escapeHtml(documentItem.name) + '</strong></td><td><div class="hat-doc-file"><span>' + escapeHtml(documentItem.fileName) + '</span><button type="button" class="hat-view-document-button" data-hat-view-document="' + documentIndex + '" aria-label="ดูเอกสาร ' + escapeHtml(documentItem.name) + '" title="ดูเอกสาร"><span class="material-icons-round" aria-hidden="true">visibility</span>ดูเอกสาร</button></div></td><td class="hat-align-center"><span class="hat-doc-count">' + Number(documentItem.count || 0) + '</span></td><td><span class="hat-doc-detail">' + escapeHtml(documentItem.detail) + '</span></td></tr>';
    }).join("");
  }

  function openAdditionalTransferDocumentPreview(request, documentItem) {
    if (!documentItem || typeof window.showModal !== "function") return;
    const fileName = escapeHtml(documentItem.fileName || "-");
    window.showModal('<div class="hat-document-preview"><header><div><span class="material-icons-round" aria-hidden="true">description</span><div><h3>ดูเอกสารประกอบคำขอโอนเพิ่ม</h3><p>' + escapeHtml(documentItem.name || "เอกสารประกอบ") + '</p></div></div><button type="button" onclick="closeModal()" aria-label="ปิดหน้าต่างดูเอกสาร"><span class="material-icons-round" aria-hidden="true">close</span></button></header><div class="hat-document-preview-body"><div class="hat-document-preview-sheet"><span class="material-icons-round" aria-hidden="true">picture_as_pdf</span><strong>' + fileName + '</strong><span>Mock Document Preview</span></div><dl><div><dt>เลขที่คำขอ</dt><dd>' + escapeHtml(request.requestId) + '</dd></div><div><dt>Claim / Case</dt><dd>' + escapeHtml(request.claimNo) + ' / ' + escapeHtml(request.caseNo) + '</dd></div><div><dt>สถานพยาบาล</dt><dd>' + escapeHtml(request.hospital) + '</dd></div><div><dt>รายละเอียด</dt><dd>' + escapeHtml(documentItem.detail || "-") + '</dd></div></dl></div><footer><span><span class="material-icons-round" aria-hidden="true">info</span>เอกสารตัวอย่างสำหรับ Mock/Demo</span><button type="button" onclick="closeModal()">ปิด</button></footer></div>', "max-w-3xl");
  }

  function getAdditionalTransferDecisionMeta(decision) {
    if (decision === "reject") return { label: "ปฏิเสธโอนเพิ่ม", icon: "close", tone: "reject" };
    if (decision === "return") return { label: "ขอแก้ไขโอนเพิ่ม", icon: "reply", tone: "return" };
    return { label: "อนุมัติโอนเพิ่ม", icon: "check", tone: "approve" };
  }

  function renderDecisionButtons(draft) {
    return [
      { value: "approve", label: "อนุมัติโอนเพิ่ม", icon: "check" },
      { value: "reject", label: "ปฏิเสธโอนเพิ่ม", icon: "close" },
      { value: "return", label: "ขอแก้ไขโอนเพิ่ม", icon: "reply" }
    ].map(function (option) {
      const active = draft.decision === option.value;
      return '<button type="button" class="hat-decision-button is-' + option.value + (active ? " is-active" : "") + '" data-hat-decision-value="' + option.value + '" aria-pressed="' + String(active) + '"><span class="material-icons-round" aria-hidden="true">' + option.icon + "</span><span>" + option.label + "</span></button>";
    }).join("");
  }

  function renderDecisionSummary(request) {
    const draft = getDecisionDraft(request);
    const approvedAmount = parseAdditionalTransferMoney(draft.approvedAmount);
    const decisionMeta = getAdditionalTransferDecisionMeta(draft.decision);
    const cumulativeApproved = request.originalApproved + approvedAmount;
    const summary = document.getElementById("hatDecisionSummaryValues");
    if (!summary) return;
    summary.innerHTML = '<div class="hat-summary-decision"><div><span class="hat-summary-label">ผลการพิจารณา</span><strong class="hat-decision-chip is-' + decisionMeta.tone + '"><span class="material-icons-round" aria-hidden="true">' + decisionMeta.icon + "</span>" + decisionMeta.label + '</strong></div><div class="hat-summary-current"><span>ยอดอนุมัติรอบนี้</span><strong>' + formatAdditionalTransferMoney(approvedAmount) + '</strong><em>บาท</em></div></div>' +
      '<div class="hat-summary-calculation"><h4>การคำนวณยอดอนุมัติ</h4><div class="hat-summary-equation"><div class="hat-summary-metric"><span>ยอดอนุมัติครั้งก่อน</span><strong>' + formatAdditionalTransferMoney(request.originalApproved) + '</strong><em>บาท</em></div><span class="hat-summary-operator" aria-label="บวก">+</span><div class="hat-summary-metric is-additional"><span>ยอดอนุมัติโอนเพิ่ม</span><strong>' + formatAdditionalTransferMoney(approvedAmount) + '</strong><em>บาท</em></div><span class="hat-summary-equals" aria-hidden="true">=</span><div class="hat-summary-total"><div><span>ยอดอนุมัติสะสมใหม่</span><strong>' + formatAdditionalTransferMoney(cumulativeApproved) + '</strong><em>บาท</em></div></div></div></div>' +
      '<div class="hat-summary-reference"><h4>ข้อมูลประกอบการพิจารณา</h4><div class="hat-summary-reference-grid"><div><span>ค่าใช้จ่ายทั้งหมดสุทธิ</span><strong>' + formatAdditionalTransferMoney(getAdditionalTransferNetExpense(request)) + ' บาท</strong></div><div class="is-requested"><span>ยอดเงินที่ขอโอนเพิ่ม</span><strong>' + formatAdditionalTransferMoney(request.requestedAmount) + " บาท</strong></div></div></div>";
  }

  function bindDetailEvents(request) {
    const draft = getDecisionDraft(request);
    const decision = document.getElementById("hatDecisionSelect");
    const approvedAmount = document.getElementById("hatApprovedAmount");
    const remark = document.getElementById("hatDecisionRemark");
    const decisionButtons = Array.from(document.querySelectorAll("[data-hat-decision-value]"));
    const previousClaimButton = document.querySelector("[data-hat-previous-claim]");
    const heroStickyButton = document.querySelector("[data-hat-toggle-hero-sticky]");

    document.querySelectorAll("[data-hat-view-document]").forEach(function (button) {
      button.addEventListener("click", function () {
        openAdditionalTransferDocumentPreview(request, (request.documents || [])[Number(button.dataset.hatViewDocument)]);
      });
    });

    heroStickyButton?.addEventListener("click", function () {
      const hero = document.querySelector(".hat-detail-hero");
      const nextSticky = state.heroStickyByRequest[request.requestId] !== true;
      state.heroStickyByRequest[request.requestId] = nextSticky;
      hero?.classList.toggle("is-unpinned", !nextSticky);
      heroStickyButton.setAttribute("aria-pressed", String(nextSticky));
      heroStickyButton.setAttribute("aria-label", nextSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้");
      heroStickyButton.setAttribute("title", nextSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้");
      const icon = heroStickyButton.querySelector(".material-icons-round");
      const label = heroStickyButton.querySelector(".hat-hero-pin-label");
      if (icon) icon.textContent = nextSticky ? "push_pin" : "keep_off";
      if (label) label.textContent = nextSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้";
    });

    function captureDetailState() {
      if (decision) draft.decision = decision.value;
      if (approvedAmount) draft.approvedAmount = approvedAmount.value;
      if (remark) draft.remark = remark.value;
      state.detailScrollByRequest[request.requestId] = getPageScrollPosition(detailPageId);
    }

    document.querySelector("[data-hat-back-monitor]")?.addEventListener("click", showConsiderHospitalAdditionalTransferPage);
    previousClaimButton?.addEventListener("click", function () {
      captureDetailState();
      const routing = window.ClaimMonitorDetailRouting;
      if (typeof routing?.openFromAdditionalTransfer === "function") {
        routing.openFromAdditionalTransfer({
          requestId: request.requestId,
          claimNo: request.claimNo,
          caseNo: request.caseNo,
          product: deriveAdditionalTransferProduct(request.claimNo),
          claimType: request.claimType || "Hospital",
          treatment: request.treatment
        });
        return;
      }
      if (typeof window.hospitalNotify === "function") {
        window.hospitalNotify({
          type: "warning",
          title: "ไม่สามารถเปิดข้อมูลเคลมครั้งก่อนได้",
          detail: "ระบบเชื่อมต่อ Existing Claim Detail ยังไม่พร้อมใช้งาน"
        });
      }
    });
    if (!decision || !approvedAmount || !remark) return;
    function syncDecisionButtons() {
      decisionButtons.forEach(function (button) {
        const active = button.dataset.hatDecisionValue === decision.value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    decisionButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        decision.value = button.dataset.hatDecisionValue;
        decision.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    decision.addEventListener("change", function () {
      draft.decision = decision.value;
      draft.approvedAmount = formatAdditionalTransferMoney(decision.value === "approve" ? getCalculatedAdditionalTransferApproval(request) : 0);
      approvedAmount.value = draft.approvedAmount;
      syncDecisionButtons();
      renderDecisionSummary(request);
    });
    remark.addEventListener("input", function () { draft.remark = remark.value; });
  }

  function renderAdditionalTransferDetail(request) {
    const mount = document.getElementById(detailMountId);
    if (!mount) return;
    const product = deriveAdditionalTransferProduct(request.claimNo);
    const requestStatus = getStatusMeta(request.status);
    const draft = getDecisionDraft(request);
    const heroSticky = state.heroStickyByRequest[request.requestId] === true;

    mount.innerHTML = '<section class="hat-detail-hero' + (heroSticky ? "" : " is-unpinned") + '" aria-labelledby="hatDetailHeroTitle"><div class="hat-hero-toolbar"><button type="button" class="hat-back-button" data-hat-back-monitor><span class="material-icons-round" aria-hidden="true">arrow_back</span>กลับไปหน้ามอนิเตอร์</button><button type="button" class="hat-hero-pin-button" data-hat-toggle-hero-sticky aria-pressed="' + String(heroSticky) + '" aria-label="' + (heroSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้") + '" title="' + (heroSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้") + '"><span class="material-icons-round" aria-hidden="true">' + (heroSticky ? "push_pin" : "keep_off") + '</span><span class="hat-hero-pin-label">' + (heroSticky ? "ยกเลิกการตรึง" : "ตรึงส่วนนี้") + '</span></button></div><div class="hat-hero-grid"><div class="hat-hero-main"><div class="hat-hero-tags"><span>' + product + ' · เคลมโรงพยาบาล</span><span>' + escapeHtml(request.treatment) + '</span></div><h2 id="hatDetailHeroTitle">' + escapeHtml(request.insured) + '</h2><div class="hat-hero-hospital"><span>สถานพยาบาล</span><strong>' + escapeHtml(request.hospital) + '</strong></div><div class="hat-hero-reference-grid"><div><span>Claim No.</span><strong>' + escapeHtml(request.claimNo) + '</strong></div><div><span>Case No.</span><strong>' + escapeHtml(request.caseNo) + '</strong></div><div><span>แผนความคุ้มครอง</span><strong>' + escapeHtml(request.plan) + '</strong></div></div></div><div class="hat-hero-side"><div class="hat-hero-statuses"><div><span>สถานะเคส</span><strong class="hat-case-status"><span class="material-icons-round" aria-hidden="true">autorenew</span>' + escapeHtml(request.caseStatus || "Re-Open") + '</strong></div><div><span>สถานะคำขอ</span><strong class="hat-request-status is-' + requestStatus.tone + '"><span class="material-icons-round" aria-hidden="true">' + requestStatus.icon + "</span>" + requestStatus.label + '</strong></div></div><div class="hat-hero-amounts"><div><span>ยอดเงินตามใบเสร็จทั้งหมด</span><strong>' + formatAdditionalTransferMoney(getAdditionalTransferReceiptTotal(request)) + '</strong><em>บาท</em></div><div><span>ค่าใช้จ่ายทั้งหมดสุทธิ</span><strong>' + formatAdditionalTransferMoney(getAdditionalTransferNetExpense(request)) + '</strong><em>บาท</em></div><div><span>ยอดเงินอนุมัติครั้งก่อน</span><strong>' + formatAdditionalTransferMoney(request.originalApproved) + '</strong><em>บาท</em></div><div class="is-requested"><span>ยอดเงินที่ขอโอนเพิ่ม</span><strong>' + formatAdditionalTransferMoney(request.requestedAmount) + '</strong><em>บาท</em></div></div></div></div></section>' +
      '<section class="hat-detail-section hat-request-reason-section">' + renderDetailSectionHeader("priority_high", "เหตุผลที่โรงพยาบาลขอโอนเพิ่ม", "ข้อมูลสำคัญสำหรับตรวจสอบที่มาของคำขอ") + '<div class="hat-request-grid"><div><span>เลขที่คำขอ</span><strong>' + escapeHtml(request.requestId) + '</strong></div><div><span>Reference จาก SmileConnect</span><strong>' + escapeHtml(request.refNo) + '</strong></div><div class="is-wide"><span>สาเหตุการโอนเพิ่ม</span><strong>' + escapeHtml(request.requestReason) + '</strong></div><div class="is-wide is-note"><span>หมายเหตุการโอนเพิ่ม</span><strong>' + escapeHtml(request.sourceRemark) + '</strong></div></div></section>' +
      '<section class="hat-detail-section">' + renderDetailSectionHeader("fact_check", "ข้อมูลประกอบการพิจารณา", "ข้อมูลรับคำขอและผู้พิจารณาล่าสุด", '<button type="button" class="hat-previous-claim-button" data-hat-previous-claim aria-label="ดูข้อมูลเคลมครั้งก่อน"><span class="material-icons-round" aria-hidden="true">history</span>ดูข้อมูลเคลมครั้งก่อน</button>') + '<div class="hat-support-grid"><article><span>วันที่รับคำขอ</span><strong>' + escapeHtml(request.receivedDate) + '</strong><small>เวลา ' + escapeHtml(request.receivedTime) + ' น.</small></article><article><span>ผู้พิจารณาล่าสุด</span><strong>' + escapeHtml(request.latestApprover) + '</strong><small>ข้อมูลจากรายการคำขอโอนเพิ่มปัจจุบัน</small></article></div></section>' +
      '<section class="hat-detail-section">' + renderDetailSectionHeader("description", "เอกสารเคลม", "เอกสารประกอบคำขอโอนเพิ่ม") + '<div class="hat-doc-table-shell overflow-x-auto soft-scroll"><table class="hat-doc-table"><thead><tr><th>รายการเอกสาร</th><th>ไฟล์เอกสาร</th><th class="hat-align-center">จำนวนเอกสาร</th><th>รายละเอียด</th></tr></thead><tbody>' + renderDocuments(request) + '</tbody></table></div></section>' +
      '<section class="hat-detail-section hat-decision-section">' + renderDetailSectionHeader("gavel", "ผลการพิจารณา", "") + '<form class="hat-decision-form" novalidate><fieldset class="hat-decision-choice"><legend>ผลการพิจารณา</legend><select id="hatDecisionSelect" class="hat-decision-select-bridge" tabindex="-1" aria-hidden="true"><option value="approve"' + (draft.decision === "approve" ? " selected" : "") + '>อนุมัติโอนเพิ่ม</option><option value="reject"' + (draft.decision === "reject" ? " selected" : "") + '>ปฏิเสธโอนเพิ่ม</option><option value="return"' + (draft.decision === "return" ? " selected" : "") + '>ขอแก้ไขโอนเพิ่ม</option></select><div class="hat-decision-buttons" role="group" aria-label="เลือกผลการพิจารณา">' + renderDecisionButtons(draft) + '</div></fieldset><div class="hat-decision-fields"><label for="hatApprovedAmount"><span>ยอดอนุมัติโอนเพิ่ม</span><div class="hat-amount-input"><input id="hatApprovedAmount" inputmode="decimal" value="' + escapeHtml(draft.approvedAmount) + '" readonly aria-readonly="true"><span>บาท</span></div></label><label for="hatDecisionReviewer"><span>ผู้พิจารณา</span><input id="hatDecisionReviewer" value="' + escapeHtml(request.latestApprover) + '" readonly aria-readonly="true"></label></div><label class="hat-decision-remark" for="hatDecisionRemark"><span>หมายเหตุ</span><textarea id="hatDecisionRemark" rows="4">' + escapeHtml(draft.remark) + '</textarea></label></form></section>' +
      '<section class="hat-detail-section hat-decision-summary-section" id="hatDecisionSummary">' + renderDetailSectionHeader("calculate", "สรุปผลการพิจารณา", "") + '<div id="hatDecisionSummaryValues" class="hat-decision-summary"></div></section>';

    bindDetailEvents(request);
    renderDecisionSummary(request);
  }

  function scrollToDetailTop() {
    const detailPage = document.getElementById(detailPageId);
    const documentRoot = document.documentElement;
    const previousScrollBehavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = "auto";
    if (detailPage) detailPage.scrollTop = 0;
    window.scrollTo(0, 0);
    window.requestAnimationFrame(function () {
      if (detailPage) detailPage.scrollTop = 0;
      documentRoot.style.scrollBehavior = previousScrollBehavior;
    });
  }

  function restoreDetailScroll(requestId) {
    const scrollY = Number(state.detailScrollByRequest[requestId]) || 0;
    const detailPage = document.getElementById(detailPageId);
    const documentRoot = document.documentElement;
    const previousScrollBehavior = documentRoot.style.scrollBehavior;
    const restore = function () {
      documentRoot.style.scrollBehavior = "auto";
      if (detailPage) detailPage.scrollTop = scrollY;
      window.scrollTo(0, scrollY);
    };
    restore();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        restore();
        documentRoot.style.scrollBehavior = previousScrollBehavior;
      });
    });
  }

  function openConsiderHospitalAdditionalTransferDetail(requestId, options) {
    const request = getRequests().find(function (item) { return item.requestId === requestId; });
    const detailPage = document.getElementById(detailPageId);
    if (!request || !detailPage) return;

    const restoreState = options?.restoreState === true;
    if (!restoreState) state.scrollY = getPageScrollPosition(monitorPageId);
    state.currentRequestId = request.requestId;
    renderAdditionalTransferDetail(request);
    document.getElementById("monitorPage")?.classList.add("hidden");
    document.getElementById("detailPage")?.classList.add("hidden");
    if (typeof window.hideClaimPages === "function") window.hideClaimPages();
    detailPage.classList.remove("hidden");

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    if (pageTitle) pageTitle.textContent = "รายละเอียดคำขอโอนเพิ่ม";
    if (pageSubtitle) pageSubtitle.textContent = "พิจารณาเคลม - เคลมโรงพยาบาล (โอนเพิ่ม) - " + request.requestId;
    document.title = "รายละเอียดคำขอโอนเพิ่ม | ClaimAgent";
    if (typeof window.setMenuActive === "function") window.setMenuActive("consider");
    if (typeof window.setConsiderSubmenuExpanded === "function") window.setConsiderSubmenuExpanded(true);
    if (typeof window.setConsiderSubmenuActive === "function") window.setConsiderSubmenuActive("hospitalAdditionalTransfer");
    if (restoreState) restoreDetailScroll(request.requestId);
    else scrollToDetailTop();
  }

  function restoreMonitorScroll() {
    const monitorPage = document.getElementById(monitorPageId);
    const documentRoot = document.documentElement;
    const previousScrollBehavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = "auto";
    if (monitorPage) monitorPage.scrollTop = state.scrollY;
    window.scrollTo(0, state.scrollY);
    window.requestAnimationFrame(function () {
      if (monitorPage) monitorPage.scrollTop = state.scrollY;
      window.scrollTo(0, state.scrollY);
      documentRoot.style.scrollBehavior = previousScrollBehavior;
    });
  }

  function showConsiderHospitalAdditionalTransferPage() {
    const monitorPage = document.getElementById(monitorPageId);
    if (!monitorPage) return;

    document.getElementById("monitorPage")?.classList.add("hidden");
    document.getElementById("detailPage")?.classList.add("hidden");
    if (typeof window.hideClaimPages === "function") {
      window.hideClaimPages();
    } else {
      document.querySelectorAll(".page").forEach(function (page) { page.classList.add("hidden"); });
    }
    monitorPage.classList.remove("hidden");

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    if (pageTitle) pageTitle.textContent = "พิจารณาเคลม";
    if (pageSubtitle) pageSubtitle.textContent = "พิจารณาเคลม - เคลมโรงพยาบาล (โอนเพิ่ม)";
    if (typeof window.setMenuActive === "function") window.setMenuActive("consider");
    if (typeof window.setClaimSubmenuExpanded === "function") window.setClaimSubmenuExpanded(false);
    if (typeof window.setBillingSubmenuExpanded === "function") window.setBillingSubmenuExpanded(false);
    if (typeof window.setConsiderSubmenuExpanded === "function") window.setConsiderSubmenuExpanded(true);
    if (typeof window.setConsiderSubmenuActive === "function") window.setConsiderSubmenuActive("hospitalAdditionalTransfer");

    renderMonitor();
    window.requestAnimationFrame(restoreMonitorScroll);
  }

  let scrollFrame = 0;
  function captureMonitorScroll() {
    if (scrollFrame || document.getElementById(monitorPageId)?.classList.contains("hidden")) return;
    scrollFrame = window.requestAnimationFrame(function () {
      state.scrollY = getPageScrollPosition(monitorPageId);
      scrollFrame = 0;
    });
  }
  window.addEventListener("scroll", captureMonitorScroll, { passive: true });
  document.getElementById(monitorPageId)?.addEventListener("scroll", captureMonitorScroll, { passive: true });

  document.addEventListener("click", function (event) {
    const monitorPage = document.getElementById(monitorPageId);
    if (!monitorPage || monitorPage.classList.contains("hidden") || monitorPage.contains(event.target)) return;
    state.scrollY = getPageScrollPosition(monitorPageId);
  }, true);

  renderMonitor();
  document.getElementById(submenuId)?.addEventListener("click", showConsiderHospitalAdditionalTransferPage);
  window.showConsiderHospitalAdditionalTransferPage = showConsiderHospitalAdditionalTransferPage;
  window.openConsiderHospitalAdditionalTransferDetail = openConsiderHospitalAdditionalTransferDetail;
})();
