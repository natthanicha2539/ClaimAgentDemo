/* จัดการเงินกองทุน > โอนเงิน รพ. — session-only mock workflow. */
(function () {
  "use strict";

  const dataSource = window.ClaimAgentFundMockData;
  if (!dataSource) return;
  const state = dataSource.createTransferState();
  const statuses = ["รอสร้างรายการ", "รอโอน", "รอจ่ายอัตโนมัติ", "โอนสำเร็จ", "โอนไม่สำเร็จ"];
  const failureReasons = ["บัญชีถูกปิด", "เลขบัญชีไม่ถูกต้อง", "ชื่อบัญชีไม่ตรง", "ธนาคารปลายทางขัดข้อง", "วงเงินโอนเกินกำหนด"];

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]; }); }
  function money(value) { return Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function groupTotal(group) { return group.claims.reduce(function (sum, item) { return sum + Number(item.amount || 0); }, 0); }
  function announce(message) { const live = byId("fhtLiveStatus"); if (live) live.textContent = message; }
  function currentRecords(status) { return status === "รอสร้างรายการ" ? state.claims : state.groups.filter(function (group) { return group.status === status; }); }

  function clearFundActive() {
    ["submenuFundReserveDashboard", "submenuFundHospitalTransfer", "submenuFundHospitalPaymentSettings"].forEach(function (id) {
      const button = byId(id);
      if (!button) return;
      button.classList.remove("bg-white/15", "font-bold", "text-white");
      button.classList.add("font-semibold", "text-white/75");
      button.removeAttribute("aria-current");
    });
  }

  function setMenuActive(active) {
    const button = byId("submenuFundHospitalTransfer");
    if (!button) return;
    if (active) {
      clearFundActive();
      document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (item) {
        if (!["menuFundManagement", "submenuFundHospitalTransfer"].includes(item.id)) item.classList.remove("bg-white/15", "font-bold", "text-white");
      });
      byId("fundManagementSubmenu")?.classList.remove("hidden");
      byId("menuFundManagement")?.setAttribute("aria-expanded", "true");
      if (byId("fundManagementArrow")) byId("fundManagementArrow").textContent = "expand_less";
      button.classList.add("bg-white/15", "font-bold", "text-white");
      button.classList.remove("font-semibold", "text-white/75");
      button.setAttribute("aria-current", "page");
    } else {
      button.classList.remove("bg-white/15", "font-bold", "text-white");
      button.classList.add("font-semibold", "text-white/75");
      button.removeAttribute("aria-current");
    }
  }

  function showPage() {
    document.querySelectorAll("main .page, #monitorPage, #detailPage, #claimMonitorPage").forEach(function (page) { page.classList.add("hidden"); page.style.removeProperty("display"); });
    byId("fundHospitalTransferPage")?.classList.remove("hidden");
    setMenuActive(true);
    if (byId("pageTitle")) byId("pageTitle").textContent = "โอนเงิน รพ.";
    if (byId("pageSubtitle")) byId("pageSubtitle").textContent = "จัดการเงินกองทุน / โอนเงิน รพ.";
    document.title = "โอนเงิน รพ. — ClaimAgent";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function countStatus(status) { return currentRecords(status).length; }

  function renderShortcuts() {
    const root = byId("fhtStatusShortcuts");
    if (!root) return;
    root.innerHTML = statuses.map(function (status) {
      return '<button type="button" class="fhp-shortcut' + (state.appliedStatus === status ? " is-active" : "") + '" data-fht-status="' + status + '">' + status + '<span>' + countStatus(status) + " รายการ</span></button>";
    }).join("");
  }

  function emptyWorkspace() {
    return '<div class="fhp-empty"><div><span class="material-icons-round" aria-hidden="true">account_balance_wallet</span><h3>เลือกสถานะเพื่อจัดการรายการโอนเงิน</h3><p>เลือกสถานะจากตัวกรองหรือปุ่มทางลัดด้านบน</p></div></div>';
  }

  function statusChip(status) { return '<span class="fhp-status" data-status="' + escapeHtml(status) + '">' + escapeHtml(status) + "</span>"; }
  function checkbox(value, checked) { return '<input class="fhp-check" type="checkbox" data-fht-select="' + escapeHtml(value) + '" aria-label="เลือกรายการ ' + escapeHtml(value) + '"' + (checked ? " checked" : "") + ">"; }
  function isSelected(id) { return state.selected.includes(id); }

  function renderClaims() {
    const rows = state.claims.map(function (item) {
      return "<tr><td>" + checkbox(item.id, isSelected(item.id)) + '</td><td class="is-code">' + escapeHtml(item.hospitalRef) + '</td><td class="is-code">' + escapeHtml(item.id) + "</td><td>" + escapeHtml(item.sent) + "</td><td>" + escapeHtml(item.insured) + "</td><td>" + escapeHtml(item.hospital) + '</td><td class="is-number">' + money(item.amount) + "</td><td>" + statusChip("รอสร้างรายการ") + '</td><td><button class="fhp-icon-button" type="button" data-fht-detail="claim:' + escapeHtml(item.id) + '" aria-label="ดูรายละเอียด ' + escapeHtml(item.id) + '"><span class="material-icons-round" aria-hidden="true">visibility</span></button></td></tr>';
    }).join("");
    return panelHeader("รายการรอสร้าง HCG", state.claims.length + " เคส") + '<div class="fhp-table-wrap" tabindex="0"><table class="fhp-table"><thead><tr><th>' + checkbox("all", state.claims.length > 0 && state.claims.every(function (item) { return isSelected(item.id); })) + '</th><th>เลขอ้างอิงใบคุม รพ.</th><th>เลขที่เคส</th><th>วันที่ส่งวางบิล</th><th>ชื่อผู้เอาประกัน</th><th>สถานพยาบาล</th><th class="is-number">จำนวนเงิน</th><th>สถานะ</th><th>รายละเอียด</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9" class="fhp-table-empty">ไม่มีรายการรอสร้าง HCG</td></tr>') + '</tbody></table></div>' + actionBar("Generate Group", "inventory_2");
  }

  function panelHeader(title, subtitle) {
    return '<header class="fhp-panel-heading"><div><h3>' + title + "</h3><p>" + subtitle + '</p></div><div class="fhp-selection-summary"><span>เลือกแล้ว</span><strong id="fhtSelectedCount">' + state.selected.length + "</strong><span>รายการ</span></div></header>";
  }

  function actionBar(label, icon) {
    const selectedRecords = selectedCurrentRecords();
    const total = selectedRecords.reduce(function (sum, record) { return sum + (record.claims ? groupTotal(record) : Number(record.amount || 0)); }, 0);
    return '<div class="fhp-action-bar"><p>ยอดรวมที่เลือก <strong id="fhtSelectedTotal">' + money(total) + ' บาท</strong></p><button id="fhtPrimaryAction" type="button" class="fhp-button is-primary"' + (state.selected.length ? "" : " disabled") + '><span class="material-icons-round" aria-hidden="true">' + icon + "</span>" + label + "</button></div>";
  }

  function rowActions(group, status) {
    const id = escapeHtml(group.id);
    if (status !== "โอนสำเร็จ") return '<button class="fhp-icon-button" type="button" data-fht-detail="group:' + id + '" aria-label="ดูรายละเอียด ' + id + '"><span class="material-icons-round" aria-hidden="true">visibility</span></button>';
    return '<div class="fhp-action-menu-wrap"><button class="fhp-icon-button" type="button" data-fht-menu="' + id + '" aria-expanded="false" aria-label="เปิดเมนูดำเนินการ ' + id + '"><span class="material-icons-round" aria-hidden="true">more_vert</span></button><div class="fhp-action-menu" data-fht-menu-panel="' + id + '" hidden><button type="button" data-fht-detail="group:' + id + '"><span class="material-icons-round">visibility</span>ดูรายละเอียด</button><button type="button" data-fht-document="' + id + '"><span class="material-icons-round">description</span>เอกสารแจ้งชำระ</button><button type="button" data-fht-email="' + id + '"><span class="material-icons-round">mail</span>จำลองส่งอีเมล</button></div></div>';
  }

  function renderGroups(status) {
    const records = currentRecords(status);
    const selectable = status === "รอโอน" || status === "รอจ่ายอัตโนมัติ";
    const rows = records.map(function (group) {
      const amount = groupTotal(group);
      return "<tr>" + (selectable ? "<td>" + checkbox(group.id, isSelected(group.id)) + "</td>" : "") + '<td class="is-code">' + escapeHtml(group.id) + "</td><td>" + escapeHtml(status === "โอนสำเร็จ" ? group.transferred : group.created) + "</td>" + (["รอโอน", "รอจ่ายอัตโนมัติ"].includes(status) ? "<td>" + escapeHtml(group.estimate) + "</td>" : "") + "<td>" + escapeHtml(group.hospital) + '</td><td class="is-number">' + group.claims.length + '</td><td class="is-number">' + money(amount) + "</td><td>" + escapeHtml(group.bank) + '</td><td class="is-code">' + escapeHtml(group.account) + "</td><td>" + escapeHtml(group.accountName) + "</td><td>" + statusChip(group.status) + (group.failureReason ? '<small class="fhp-failure">' + escapeHtml(group.failureReason) + "</small>" : "") + "</td><td>" + (group.email === "—" ? "—" : '<span class="fhp-mail">' + escapeHtml(group.email) + "</span>") + '</td><td><div class="fhp-row-actions">' + rowActions(group, status) + "</div></td></tr>";
    }).join("");
    const selectHead = selectable ? "<th>" + checkbox("all", records.length > 0 && records.every(function (item) { return isSelected(item.id); })) + "</th>" : "";
    const estimateHead = ["รอโอน", "รอจ่ายอัตโนมัติ"].includes(status) ? "<th>วันที่คาดว่าเงินจะออก</th>" : "";
    let content = panelHeader(status, records.length + " รายการ") + '<div class="fhp-table-wrap" tabindex="0"><table class="fhp-table"><thead><tr>' + selectHead + "<th>เลขอ้างอิงการโอน</th><th>" + (status === "โอนสำเร็จ" ? "วันที่โอนเงิน" : "วันที่ทำรายการ") + "</th>" + estimateHead + '<th>สถานพยาบาล</th><th class="is-number">จำนวนราย</th><th class="is-number">จำนวนเงิน</th><th>ธนาคาร</th><th>เลขที่บัญชี</th><th>ชื่อบัญชี</th><th>สถานะ</th><th>สถานะส่งเมล</th><th>ดำเนินการ</th></tr></thead><tbody>' + (rows || '<tr><td colspan="13" class="fhp-table-empty">ไม่มีรายการในสถานะนี้</td></tr>') + "</tbody></table></div>";
    if (status === "รอโอน") content += actionBar("ยืนยันการโอนเงิน", "payments");
    if (status === "รอจ่ายอัตโนมัติ") content += renderMockControls();
    return content;
  }

  function renderMockControls() {
    return '<div class="fhp-mock-panel"><div><div><h4>Mock ผลการโอนเงิน</h4><p>เลือกอย่างน้อยหนึ่งรายการ แล้วจำลองผลจากระบบธนาคาร</p></div><span>' + state.selected.length + ' รายการที่เลือก</span></div><div class="fhp-mock-options"><button type="button" class="fhp-button is-success" data-fht-outcome="success"' + (state.selected.length ? "" : " disabled") + '><span class="material-icons-round" aria-hidden="true">check_circle</span>Mock โอนสำเร็จ</button><button type="button" class="fhp-button is-danger" data-fht-outcome="failed"' + (state.selected.length ? "" : " disabled") + '><span class="material-icons-round" aria-hidden="true">error</span>Mock โอนไม่สำเร็จ</button></div></div>';
  }

  function selectedCurrentRecords() { const records = currentRecords(state.appliedStatus); return records.filter(function (item) { return state.selected.includes(item.id); }); }

  function renderWorkspace() {
    const workspace = byId("fhtWorkspace");
    if (!workspace) return;
    if (!state.appliedStatus) workspace.innerHTML = emptyWorkspace();
    else if (state.appliedStatus === "รอสร้างรายการ") workspace.innerHTML = renderClaims();
    else workspace.innerHTML = renderGroups(state.appliedStatus);
    renderShortcuts();
  }

  function applyStatus(status, withLoading) {
    if (!statuses.includes(status)) return;
    state.status = status;
    state.selected = [];
    byId("fhtStatusFilter").value = status;
    if (!withLoading) { state.appliedStatus = status; renderWorkspace(); announce("แสดงรายการสถานะ " + status + " แล้ว"); return; }
    const button = byId("fhtSearchButton");
    button.disabled = true; button.setAttribute("aria-busy", "true");
    byId("fhtWorkspace").innerHTML = '<div class="fhp-empty"><div><span class="material-icons-round" aria-hidden="true">progress_activity</span><h3>กำลังค้นหารายการ</h3></div></div>';
    window.setTimeout(function () { state.appliedStatus = status; button.disabled = false; button.removeAttribute("aria-busy"); renderWorkspace(); announce("ค้นหารายการสถานะ " + status + " เรียบร้อยแล้ว"); }, 180);
  }

  function openDialog(options) {
    const previous = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "fhp-dialog-backdrop";
    backdrop.innerHTML = '<section class="fhp-dialog' + (options.wide ? " is-wide" : "") + '" role="dialog" aria-modal="true" aria-labelledby="fhpDialogTitle"><header class="fhp-dialog-head"><span class="material-icons-round" aria-hidden="true">' + (options.icon || "info") + '</span><div><h3 id="fhpDialogTitle">' + escapeHtml(options.title) + "</h3><p>" + escapeHtml(options.subtitle || "") + '</p></div><button type="button" class="fhp-dialog-close" aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button></header><div class="fhp-dialog-body">' + options.body + '</div><footer class="fhp-dialog-foot"><button type="button" class="fhp-button is-secondary" data-dialog-cancel>' + (options.cancelLabel || "ปิด") + "</button>" + (options.confirmLabel ? '<button type="button" class="fhp-button ' + (options.danger ? "is-danger" : "is-primary") + '" data-dialog-confirm>' + options.confirmLabel + "</button>" : "") + "</footer></section>";
    function close() { backdrop.remove(); previous?.focus?.(); }
    backdrop.addEventListener("click", function (event) { if (event.target === backdrop || event.target.closest(".fhp-dialog-close,[data-dialog-cancel]")) close(); });
    backdrop.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
      if (event.key === "Tab") { const focusable = Array.from(backdrop.querySelectorAll("button,input:not([disabled])")); const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    });
    backdrop.querySelector("[data-dialog-confirm]")?.addEventListener("click", function () { if (!options.onConfirm || options.onConfirm(backdrop) !== false) close(); });
    document.body.appendChild(backdrop);
    (backdrop.querySelector("[data-dialog-confirm]") || backdrop.querySelector(".fhp-dialog-close")).focus();
    return backdrop;
  }

  function claimRows(claims) {
    return '<div class="fhp-dialog-table"><table class="fhp-table"><thead><tr><th>เลขอ้างอิงใบคุม รพ.</th><th>เลขที่เคส</th><th>ชื่อผู้เอาประกัน</th><th class="is-number">จำนวนเงิน</th><th class="is-number">หัก ณ ที่จ่าย 3%</th><th class="is-number">จำนวนเงินสุทธิ</th></tr></thead><tbody>' + claims.map(function (item) { return '<tr><td class="is-code">' + escapeHtml(item.hospitalRef) + '</td><td class="is-code">' + escapeHtml(item.id) + "</td><td>" + escapeHtml(item.insured) + '</td><td class="is-number">' + money(item.amount) + '</td><td class="is-number">' + money(item.amount * .03) + '</td><td class="is-number">' + money(item.amount * .97) + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }

  function showDetail(kind, id) {
    if (kind === "claim") {
      const item = state.claims.find(function (claimItem) { return claimItem.id === id; }); if (!item) return;
      openDialog({ title: "รายละเอียดเคส", subtitle: item.id, icon: "description", body: '<div class="fhp-dialog-summary"><div><span>สถานพยาบาล</span><strong>' + escapeHtml(item.hospital) + '</strong></div><div><span>ผู้เอาประกัน</span><strong>' + escapeHtml(item.insured) + '</strong></div><div class="is-total"><span>ยอดเงิน</span><strong>' + money(item.amount) + " บาท</strong></div></div>" }); return;
    }
    const group = state.groups.find(function (groupItem) { return groupItem.id === id; }); if (!group) return;
    openDialog({ title: "รายละเอียด HCG", subtitle: group.id, icon: "account_balance", wide: true, body: '<div class="fhp-dialog-summary"><div><span>สถานพยาบาล</span><strong>' + escapeHtml(group.hospital) + '</strong></div><div><span>บัญชีรับเงิน</span><strong>' + escapeHtml(group.bank + " · " + group.account) + '</strong></div><div class="is-total"><span>ยอดสุทธิหลังหัก ณ ที่จ่าย</span><strong>' + money(groupTotal(group) * .97) + " บาท</strong></div></div>" + (group.failureReason ? '<div class="fhp-dialog-alert"><strong>สาเหตุที่โอนไม่สำเร็จ:</strong> ' + escapeHtml(group.failureReason) + "</div>" : "") + claimRows(group.claims) });
  }

  function confirmGenerate() {
    const selected = selectedCurrentRecords(); if (!selected.length) return;
    const byHospital = selected.reduce(function (map, item) { (map[item.hospital] ||= []).push(item); return map; }, {});
    const total = selected.reduce(function (sum, item) { return sum + item.amount; }, 0);
    openDialog({ title: "ยืนยันการ Generate Group", subtitle: "ระบบจะสร้าง HCG แยกตามสถานพยาบาล", icon: "inventory_2", confirmLabel: "ยืนยัน Generate Group", cancelLabel: "ยกเลิก", body: '<div class="fhp-dialog-summary"><div><span>จำนวนเคส</span><strong>' + selected.length + '</strong></div><div><span>สถานพยาบาล</span><strong>' + Object.keys(byHospital).length + '</strong></div><div class="is-total"><span>ยอดเงินรวม</span><strong>' + money(total) + " บาท</strong></div></div>", onConfirm: function () {
      Object.keys(byHospital).forEach(function (hospital) {
        const number = String(state.sequence++).padStart(3, "0");
        state.groups.push({ id: "HCG690900" + number, created: "17/09/2569 16:30", estimate: "19/09/2569", hospital: hospital, bank: "ธนาคารไทยพาณิชย์", account: "xxx-x-" + number + "-x", accountName: hospital, status: "รอโอน", email: "—", claims: byHospital[hospital] });
      });
      state.claims = state.claims.filter(function (item) { return !state.selected.includes(item.id); });
      state.selected = []; renderWorkspace(); announce("Generate Group สำเร็จ " + Object.keys(byHospital).length + " รายการ");
    } });
  }

  function confirmManualTransfer() {
    const selected = selectedCurrentRecords(); if (!selected.length) return;
    openDialog({ title: "ยืนยันการโอนเงิน", subtitle: "จำลองการส่งคำสั่งโอนเงินให้ธนาคาร", icon: "payments", confirmLabel: "ยืนยันการโอนเงิน", cancelLabel: "ยกเลิก", body: '<div class="fhp-dialog-summary"><div><span>จำนวน HCG</span><strong>' + selected.length + '</strong></div><div><span>จำนวนเคส</span><strong>' + selected.reduce(function (sum, group) { return sum + group.claims.length; }, 0) + '</strong></div><div class="is-total"><span>ยอดเงินรวม</span><strong>' + money(selected.reduce(function (sum, group) { return sum + groupTotal(group); }, 0)) + " บาท</strong></div></div>", onConfirm: function () {
      selected.forEach(function (group) { group.status = "โอนสำเร็จ"; group.transferred = "17/09/2569 16:30"; group.email = "รอส่ง"; });
      state.selected = []; renderWorkspace(); renderShortcuts(); announce("จำลองการโอนเงินสำเร็จ " + selected.length + " รายการ");
    } });
  }

  function completeAuto(outcome) {
    const selected = selectedCurrentRecords(); if (!selected.length) return;
    if (outcome === "success") {
      selected.forEach(function (group) { group.status = "โอนสำเร็จ"; group.transferred = "17/09/2569 16:30"; group.email = "รอส่ง"; }); state.selected = []; renderWorkspace(); announce("Mock โอนสำเร็จ " + selected.length + " รายการ"); return;
    }
    openDialog({ title: "ระบุสาเหตุที่โอนไม่สำเร็จ", subtitle: "สาเหตุจะบันทึกไว้กับรายการ Mock", icon: "error", danger: true, confirmLabel: "ยืนยันผลโอนไม่สำเร็จ", cancelLabel: "ยกเลิก", body: '<div class="fhp-reason-list">' + failureReasons.map(function (reason, index) { return '<label><input type="radio" name="fhtFailureReason" value="' + escapeHtml(reason) + '"' + (index === 0 ? " checked" : "") + "><span>" + escapeHtml(reason) + "</span></label>"; }).join("") + "</div>", onConfirm: function (dialog) {
      const reason = dialog.querySelector('input[name="fhtFailureReason"]:checked')?.value; if (!reason) return false;
      selected.forEach(function (group) { group.status = "โอนไม่สำเร็จ"; group.failureReason = reason; group.email = "—"; }); state.selected = []; renderWorkspace(); announce("Mock โอนไม่สำเร็จ " + selected.length + " รายการ");
    } });
  }

  function showMockDocument(id) { openDialog({ title: "เอกสารแจ้งชำระ", subtitle: id, icon: "description", body: '<div class="fhp-dialog-alert">เอกสารตัวอย่างสำหรับ Demo เท่านั้น ไม่มีการสร้างหรือดาวน์โหลดเอกสารจริง</div><p>สถานะเอกสาร: พร้อมส่งให้สถานพยาบาล</p>' }); }
  function mockEmail(id) { const group = state.groups.find(function (item) { return item.id === id; }); if (!group) return; group.email = "ส่งสำเร็จ"; renderWorkspace(); announce("จำลองส่งอีเมลสำหรับ " + id + " สำเร็จ"); }

  function handleWorkspaceClick(event) {
    const menuButton = event.target.closest("[data-fht-menu]");
    if (menuButton) {
      const id = menuButton.dataset.fhtMenu;
      byId("fhtWorkspace").querySelectorAll("[data-fht-menu-panel]").forEach(function (panel) { if (panel.dataset.fhtMenuPanel !== id) panel.hidden = true; });
      const panel = byId("fhtWorkspace").querySelector('[data-fht-menu-panel="' + id + '"]');
      panel.hidden = !panel.hidden; menuButton.setAttribute("aria-expanded", String(!panel.hidden)); return;
    }
    const detail = event.target.closest("[data-fht-detail]"); if (detail) { const parts = detail.dataset.fhtDetail.split(":"); showDetail(parts[0], parts[1]); return; }
    const documentButton = event.target.closest("[data-fht-document]"); if (documentButton) { showMockDocument(documentButton.dataset.fhtDocument); return; }
    const email = event.target.closest("[data-fht-email]"); if (email) { mockEmail(email.dataset.fhtEmail); return; }
    if (event.target.closest("#fhtPrimaryAction")) { if (state.appliedStatus === "รอสร้างรายการ") confirmGenerate(); else confirmManualTransfer(); return; }
    const outcome = event.target.closest("[data-fht-outcome]"); if (outcome) completeAuto(outcome.dataset.fhtOutcome);
  }

  function handleSelection(event) {
    const checkboxNode = event.target.closest("[data-fht-select]"); if (!checkboxNode) return;
    const records = currentRecords(state.appliedStatus);
    if (checkboxNode.dataset.fhtSelect === "all") state.selected = checkboxNode.checked ? records.map(function (item) { return item.id; }) : [];
    else if (checkboxNode.checked) { if (!state.selected.includes(checkboxNode.dataset.fhtSelect)) state.selected.push(checkboxNode.dataset.fhtSelect); }
    else state.selected = state.selected.filter(function (id) { return id !== checkboxNode.dataset.fhtSelect; });
    renderWorkspace();
  }

  function init() {
    renderShortcuts(); renderWorkspace();
    byId("submenuFundHospitalTransfer")?.addEventListener("click", showPage);
    byId("fhtStatusFilter")?.addEventListener("change", function (event) { state.status = event.target.value; });
    byId("fhtSearchButton")?.addEventListener("click", function () { if (statuses.includes(state.status)) applyStatus(state.status, true); else announce("กรุณาเลือกสถานะก่อนค้นหา"); });
    byId("fhtResetButton")?.addEventListener("click", function () { state.status = ""; state.appliedStatus = ""; state.selected = []; byId("fhtStatusFilter").value = ""; renderWorkspace(); announce("ล้างตัวกรองแล้ว"); });
    byId("fhtStatusShortcuts")?.addEventListener("click", function (event) { const button = event.target.closest("[data-fht-status]"); if (button) applyStatus(button.dataset.fhtStatus, false); });
    byId("fhtWorkspace")?.addEventListener("click", handleWorkspaceClick);
    byId("fhtWorkspace")?.addEventListener("change", handleSelection);
    document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (button) { if (!["menuFundManagement", "submenuFundHospitalTransfer"].includes(button.id)) button.addEventListener("click", function () { setMenuActive(false); }); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.showFundHospitalTransferPage = showPage;
})();
