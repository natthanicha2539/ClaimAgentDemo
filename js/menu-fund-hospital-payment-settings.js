/* จัดการเงินกองทุน > ตั้งค่าการจ่ายเงิน รพ. — session-only mock settings. */
(function () {
  "use strict";

  const dataSource = window.ClaimAgentFundMockData;
  if (!dataSource) return;
  const state = dataSource.createPaymentSettingsState();
  const actor = "09104 ฉัตรชนก ปักษาทอง";

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]; }); }
  function announce(message) { const live = byId("fhpsLiveStatus"); if (live) live.textContent = message; }
  function timestamp() { return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).replace(",", ""); }

  function clearFundActive() {
    ["submenuFundReserveDashboard", "submenuFundHospitalTransfer", "submenuFundHospitalPaymentSettings"].forEach(function (id) {
      const button = byId(id); if (!button) return;
      button.classList.remove("bg-white/15", "font-bold", "text-white"); button.classList.add("font-semibold", "text-white/75"); button.removeAttribute("aria-current");
    });
  }

  function setMenuActive(active) {
    const button = byId("submenuFundHospitalPaymentSettings"); if (!button) return;
    if (active) {
      clearFundActive();
      document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (item) { if (!["menuFundManagement", "submenuFundHospitalPaymentSettings"].includes(item.id)) item.classList.remove("bg-white/15", "font-bold", "text-white"); });
      byId("fundManagementSubmenu")?.classList.remove("hidden"); byId("menuFundManagement")?.setAttribute("aria-expanded", "true"); if (byId("fundManagementArrow")) byId("fundManagementArrow").textContent = "expand_less";
      button.classList.add("bg-white/15", "font-bold", "text-white"); button.classList.remove("font-semibold", "text-white/75"); button.setAttribute("aria-current", "page");
    } else { button.classList.remove("bg-white/15", "font-bold", "text-white"); button.classList.add("font-semibold", "text-white/75"); button.removeAttribute("aria-current"); }
  }

  function showPage() {
    document.querySelectorAll("main .page, #monitorPage, #detailPage, #claimMonitorPage").forEach(function (page) { page.classList.add("hidden"); page.style.removeProperty("display"); });
    byId("fundHospitalPaymentSettingsPage")?.classList.remove("hidden"); setMenuActive(true);
    if (byId("pageTitle")) byId("pageTitle").textContent = "ตั้งค่าการจ่ายเงิน รพ.";
    if (byId("pageSubtitle")) byId("pageSubtitle").textContent = "จัดการเงินกองทุน / ตั้งค่าการจ่ายเงิน รพ.";
    document.title = "ตั้งค่าการจ่ายเงิน รพ. — ClaimAgent"; window.scrollTo({ top: 0, behavior: "auto" });
  }

  function settingResult(hospital) {
    if (hospital.hold) return { text: "ระงับการจ่าย", className: "is-hold" };
    if (hospital.auto) return { text: "จ่ายอัตโนมัติหลัง " + hospital.delay + " วัน", className: "is-auto" };
    return { text: "ผู้ใช้งานดำเนินการเอง", className: "" };
  }

  function visibleHospitals() {
    const query = state.appliedQuery.trim().toLocaleLowerCase("th-TH");
    return query ? state.hospitals.filter(function (hospital) { return hospital.name.toLocaleLowerCase("th-TH").includes(query); }) : state.hospitals;
  }

  function renderSummary() {
    byId("fhpsAutoCount").textContent = state.hospitals.filter(function (item) { return item.auto; }).length;
    byId("fhpsHoldCount").textContent = state.hospitals.filter(function (item) { return item.hold; }).length;
  }

  function historyRow(hospital) {
    if (state.openHistoryId !== hospital.id) return "";
    const records = state.history.filter(function (item) { return item.hospitalId === hospital.id; });
    return '<tr class="fhps-history-row"><td colspan="7"><div class="fhps-history-panel"><h4><span class="material-icons-round" aria-hidden="true">history</span>ประวัติการตั้งค่า — ' + escapeHtml(hospital.name) + '</h4><div class="fhps-timeline">' + (records.length ? records.map(function (item) { return '<div class="fhps-event"><b>' + escapeHtml(item.action) + "</b><small>" + escapeHtml(item.time) + " · ผู้ทำรายการ: " + escapeHtml(item.user) + "</small></div>"; }).join("") : '<div class="fhps-event"><b>ยังไม่มีประวัติการบันทึก</b></div>') + "</div></div></td></tr>";
  }

  function renderTable() {
    const hospitals = visibleHospitals();
    byId("fhpsResultCount").textContent = hospitals.length + " สถานพยาบาล";
    byId("fhpsTableBody").innerHTML = hospitals.length ? hospitals.map(function (hospital) {
      const result = settingResult(hospital);
      return '<tr data-fhps-row="' + hospital.id + '"><td>' + escapeHtml(hospital.name) + '</td><td><button type="button" class="fhp-switch" role="switch" aria-checked="' + hospital.auto + '" data-fhps-auto="' + hospital.id + '"><span>' + (hospital.auto ? "เปิด" : "ปิด") + '</span></button></td><td><input class="fhps-delay" type="number" min="0" max="30" value="' + hospital.delay + '" aria-label="Delay ของ ' + escapeHtml(hospital.name) + '" data-fhps-delay="' + hospital.id + '"' + (hospital.auto ? "" : " disabled") + '></td><td><button type="button" class="fhp-switch fhp-hold-switch" role="switch" aria-checked="' + hospital.hold + '" data-fhps-hold="' + hospital.id + '"><span>' + (hospital.hold ? "Hold" : "ปกติ") + '</span></button></td><td><span class="fhps-result ' + result.className + '">' + result.text + "</span></td><td>" + escapeHtml(hospital.updatedAt) + '</td><td><div class="fhps-actions"><button type="button" class="fhp-button is-primary fhps-save" data-fhps-save="' + hospital.id + '"' + (hospital.dirty ? "" : " disabled") + '>บันทึก</button><button type="button" class="fhp-icon-button" data-fhps-history="' + hospital.id + '" aria-expanded="' + (state.openHistoryId === hospital.id) + '" aria-label="ประวัติการตั้งค่า ' + escapeHtml(hospital.name) + '"><span class="material-icons-round" aria-hidden="true">history</span></button></div></td></tr>' + historyRow(hospital);
    }).join("") : '<tr><td colspan="7" class="fhp-table-empty">ไม่พบสถานพยาบาลที่ตรงกับคำค้นหา</td></tr>';
    renderSummary();
  }

  function findHospital(id) { return state.hospitals.find(function (item) { return item.id === id; }); }
  function markDirty(hospital, message) { hospital.dirty = true; renderTable(); announce(message); }

  function openAddDialog() {
    const previous = document.activeElement;
    const inertTargets = Array.from(document.querySelectorAll("body > aside, body > main"));
    const previousBodyOverflow = document.body.style.overflow;
    const backdrop = document.createElement("div"); backdrop.className = "fhp-dialog-backdrop fhps-add-backdrop";
    backdrop.innerHTML = `
      <section class="fhp-dialog fhps-add-dialog" role="dialog" aria-modal="true" aria-labelledby="fhpsAddTitle" aria-describedby="fhpsAddDescription">
        <header class="fhp-dialog-head fhps-add-dialog-head">
          <span class="material-icons-round" aria-hidden="true">add_business</span>
          <div>
            <small>ตั้งค่าการจ่ายเงิน</small>
            <h3 id="fhpsAddTitle">เพิ่มสถานพยาบาล</h3>
            <p id="fhpsAddDescription">ระบุข้อมูลและเงื่อนไขเริ่มต้นสำหรับสถานพยาบาลใหม่</p>
          </div>
          <button type="button" class="fhp-dialog-close" aria-label="ปิดหน้าต่างเพิ่มสถานพยาบาล"><span class="material-icons-round" aria-hidden="true">close</span></button>
        </header>
        <div class="fhp-dialog-body fhps-add-dialog-body">
          <form id="fhpsAddForm" class="fhps-form" novalidate>
            <section class="fhps-form-section" aria-labelledby="fhpsHospitalInfoTitle">
              <div class="fhps-form-section-head">
                <span class="material-icons-round" aria-hidden="true">local_hospital</span>
                <div><h4 id="fhpsHospitalInfoTitle">ข้อมูลสถานพยาบาล</h4><p>ใช้ชื่อเต็มที่ต้องการให้แสดงในรายการตั้งค่า</p></div>
              </div>
              <label class="fhp-field fhps-add-name-field" for="fhpsHospitalName">
                <span>ชื่อสถานพยาบาล <b aria-hidden="true">*</b></span>
                <input id="fhpsHospitalName" required placeholder="เช่น โรงพยาบาลตัวอย่าง" autocomplete="organization" aria-describedby="fhpsNameHint fhpsNameError">
                <small id="fhpsNameHint" class="fhps-field-hint">กรอกชื่อสถานพยาบาลโดยไม่ต้องระบุสาขา หากใช้การตั้งค่าเดียวกัน</small>
                <small id="fhpsNameError" class="fhps-field-error" role="alert" hidden>กรุณาระบุชื่อสถานพยาบาล</small>
              </label>
            </section>
            <section class="fhps-form-section" aria-labelledby="fhpsPaymentRulesTitle">
              <div class="fhps-form-section-head">
                <span class="material-icons-round" aria-hidden="true">tune</span>
                <div><h4 id="fhpsPaymentRulesTitle">เงื่อนไขการจ่ายเงิน</h4><p>กำหนดวิธีดำเนินการเริ่มต้น สามารถแก้ไขภายหลังได้</p></div>
              </div>
              <div class="fhps-option-grid">
                <label class="fhps-option-card">
                  <input id="fhpsHospitalAuto" class="fhps-option-input" type="checkbox">
                  <span class="fhps-option-content"><i class="material-icons-round" aria-hidden="true">bolt</i><span><strong>จ่ายเงินอัตโนมัติ</strong><small>นำรายการเข้าสู่รอบจ่ายอัตโนมัติ</small></span><em aria-hidden="true"></em></span>
                </label>
                <label class="fhps-option-card">
                  <input id="fhpsHospitalHold" class="fhps-option-input" type="checkbox">
                  <span class="fhps-option-content"><i class="material-icons-round" aria-hidden="true">pause_circle</i><span><strong>Hold การจ่ายเงิน</strong><small>พักรายการไว้จนกว่าจะปลด Hold</small></span><em aria-hidden="true"></em></span>
                </label>
              </div>
              <label class="fhp-field fhps-delay-field" for="fhpsHospitalDelay">
                <span>Delay <b aria-hidden="true">*</b></span>
                <span class="fhps-number-control"><input id="fhpsHospitalDelay" type="number" inputmode="numeric" min="0" max="30" value="0" required aria-describedby="fhpsDelayHint fhpsDelayError"><i>วัน</i></span>
                <small id="fhpsDelayHint" class="fhps-field-hint">กำหนดได้ตั้งแต่ 0–30 วัน ก่อนเข้าสู่รอบจ่ายเงิน</small>
                <small id="fhpsDelayError" class="fhps-field-error" role="alert" hidden>Delay ต้องอยู่ระหว่าง 0–30 วัน</small>
              </label>
            </section>
          </form>
        </div>
        <footer class="fhp-dialog-foot fhps-add-dialog-foot">
          <p><span class="material-icons-round" aria-hidden="true">info</span>ข้อมูลนี้เป็น Mock Data สำหรับ Demo</p>
          <div><button type="button" class="fhp-button is-secondary" data-add-cancel>ยกเลิก</button><button type="submit" form="fhpsAddForm" class="fhp-button is-primary"><span class="material-icons-round" aria-hidden="true">save</span>เพิ่มและบันทึก</button></div>
        </footer>
      </section>`;
    function close() {
      inertTargets.forEach(function (target) { target.inert = false; });
      document.body.style.overflow = previousBodyOverflow;
      backdrop.remove(); previous?.focus?.();
    }
    backdrop.addEventListener("click", function (event) { if (event.target === backdrop || event.target.closest(".fhp-dialog-close,[data-add-cancel]")) close(); });
    backdrop.addEventListener("keydown", function (event) { if (event.key === "Escape") close(); if (event.key === "Tab") { const items = Array.from(backdrop.querySelectorAll("button,input")); const first = items[0], last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } });
    backdrop.querySelector("#fhpsAddForm").addEventListener("submit", function (event) {
      event.preventDefault(); const nameInput = backdrop.querySelector("#fhpsHospitalName"); const delayInput = backdrop.querySelector("#fhpsHospitalDelay"); const name = nameInput.value.trim(); const delay = Number(delayInput.value); const nameValid = Boolean(name); const delayValid = Number.isInteger(delay) && delay >= 0 && delay <= 30;
      nameInput.setAttribute("aria-invalid", String(!nameValid)); delayInput.setAttribute("aria-invalid", String(!delayValid)); backdrop.querySelector("#fhpsNameError").hidden = nameValid; backdrop.querySelector("#fhpsDelayError").hidden = delayValid;
      if (!nameValid || !delayValid) { (nameValid ? delayInput : nameInput).focus(); return; }
      const id = "HSP" + String(state.sequence++).padStart(3, "0"); const auto = backdrop.querySelector("#fhpsHospitalAuto").checked; const hold = backdrop.querySelector("#fhpsHospitalHold").checked; const time = timestamp();
      state.hospitals.push({ id: id, name: name, auto: auto, delay: delay, hold: hold, updatedAt: time, dirty: false }); state.history.unshift({ hospitalId: id, time: time, action: "เพิ่มและบันทึกการตั้งค่า · " + (auto ? "เปิด" : "ปิด") + "จ่ายอัตโนมัติ · Delay " + delay + " วัน · " + (hold ? "Hold" : "ปกติ"), user: actor });
      state.appliedQuery = ""; state.query = ""; byId("fhpsSearchInput").value = ""; close(); renderTable(); announce("เพิ่มสถานพยาบาล " + name + " แล้ว");
    });
    ["fhpsHospitalName", "fhpsHospitalDelay"].forEach(function (id) {
      backdrop.querySelector("#" + id).addEventListener("input", function (event) {
        event.target.removeAttribute("aria-invalid");
        const error = backdrop.querySelector(id === "fhpsHospitalName" ? "#fhpsNameError" : "#fhpsDelayError");
        if (error) error.hidden = true;
      });
    });
    document.body.appendChild(backdrop);
    inertTargets.forEach(function (target) { target.inert = true; });
    document.body.style.overflow = "hidden";
    backdrop.querySelector("#fhpsHospitalName").focus();
  }

  function handleTableClick(event) {
    const autoButton = event.target.closest("[data-fhps-auto]"); if (autoButton) { const hospital = findHospital(autoButton.dataset.fhpsAuto); hospital.auto = !hospital.auto; markDirty(hospital, "แก้ไขการจ่ายอัตโนมัติของ " + hospital.name); return; }
    const holdButton = event.target.closest("[data-fhps-hold]"); if (holdButton) { const hospital = findHospital(holdButton.dataset.fhpsHold); hospital.hold = !hospital.hold; markDirty(hospital, "แก้ไขสถานะ Hold ของ " + hospital.name); return; }
    const historyButton = event.target.closest("[data-fhps-history]"); if (historyButton) { state.openHistoryId = state.openHistoryId === historyButton.dataset.fhpsHistory ? "" : historyButton.dataset.fhpsHistory; renderTable(); return; }
    const saveButton = event.target.closest("[data-fhps-save]"); if (saveButton) { const hospital = findHospital(saveButton.dataset.fhpsSave); if (!hospital || !hospital.dirty) return; hospital.dirty = false; hospital.updatedAt = timestamp(); state.history.unshift({ hospitalId: hospital.id, time: hospital.updatedAt, action: "บันทึกการตั้งค่า · " + (hospital.auto ? "เปิด" : "ปิด") + "จ่ายอัตโนมัติ · Delay " + hospital.delay + " วัน · " + (hospital.hold ? "Hold" : "ปกติ"), user: actor }); renderTable(); announce("บันทึกการตั้งค่าของ " + hospital.name + " แล้ว"); }
  }

  function handleDelayChange(event) {
    const input = event.target.closest("[data-fhps-delay]"); if (!input) return; const hospital = findHospital(input.dataset.fhpsDelay); const value = Number(input.value); const valid = Number.isInteger(value) && value >= 0 && value <= 30; input.setAttribute("aria-invalid", String(!valid)); if (!valid) { announce("Delay ต้องอยู่ระหว่าง 0–30 วัน"); return; } hospital.delay = value; hospital.dirty = true; renderTable(); announce("แก้ไข Delay ของ " + hospital.name);
  }

  function init() {
    renderTable();
    byId("submenuFundHospitalPaymentSettings")?.addEventListener("click", showPage);
    byId("fhpsSearchInput")?.addEventListener("input", function (event) { state.query = event.target.value; });
    byId("fhpsSearchInput")?.addEventListener("keydown", function (event) { if (event.key === "Enter") { event.preventDefault(); state.appliedQuery = state.query; renderTable(); } });
    byId("fhpsSearchButton")?.addEventListener("click", function () { state.appliedQuery = state.query; renderTable(); announce("ค้นหาสถานพยาบาลแล้ว"); });
    byId("fhpsResetButton")?.addEventListener("click", function () { state.query = ""; state.appliedQuery = ""; byId("fhpsSearchInput").value = ""; renderTable(); announce("ล้างคำค้นหาแล้ว"); });
    byId("fhpsAddHospitalButton")?.addEventListener("click", openAddDialog);
    byId("fhpsTableBody")?.addEventListener("click", handleTableClick); byId("fhpsTableBody")?.addEventListener("change", handleDelayChange);
    document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (button) { if (!["menuFundManagement", "submenuFundHospitalPaymentSettings"].includes(button.id)) button.addEventListener("click", function () { setMenuActive(false); }); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.showFundHospitalPaymentSettingsPage = showPage;
})();
