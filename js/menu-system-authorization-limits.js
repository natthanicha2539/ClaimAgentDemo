/* ตั้งค่าระบบ > จัดการวงเงิน: local interactive prototype. */
(function () {
  "use strict";

  const master = (window.CLAIM_AGENT_AUTH_MASTER || []).map(function (row, id) {
    return { id: id, branch: row[0], position: row[1], department: row[2] };
  });
  const byMasterId = new Map(master.map(function (row) { return [row.id, row]; }));
  const storageKey = "claimagent.authorization-limits.v1";
  const initialLimits = [5000, 10000, 30000, 100000, null];
  const firstNames = ["กมลชนก", "ธนกร", "พิมพ์ชนก", "ณัฐวุฒิ", "ชลธิชา", "กิตติพงษ์", "สิริพร", "ภาคภูมิ", "วราภรณ์", "อธิพงศ์", "นภัสสร", "ปริญญา"];
  const lastNames = ["ศรีสุวรรณ", "สุขประเสริฐ", "วัฒนากุล", "พงษ์พิพัฒน์", "อินทรรักษ์", "ใจดี", "รัตนวงศ์", "เกษมสุข", "จันทร์แก้ว", "ทองสกุล"];
  const chosen = Array.from({ length: 60 }, function (_, i) { return master[Math.floor(i * master.length / 60)]; });
  const employees = chosen.map(function (row, i) {
    return { id: "EMP" + String(i + 1).padStart(4, "0"), name: firstNames[i % 12] + " " + lastNames[Math.floor(i / 12)], masterId: row.id, status: i % 11 === 10 ? "ไม่ใช้งาน" : "ใช้งาน" };
  });
  const $ = function (id) { return document.getElementById(id); };
  const escapeHtml = function (value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  const money = function (amount) { return amount === null ? "ไม่จำกัดวงเงิน" : Number(amount).toLocaleString("th-TH") + " บาท"; };
  let state, tab = "levels", conditionPage = 1, employeePage = 1, highlightedId = "", dialog = null, toastTimer;

  function seed() {
    return {
      levels: initialLimits.map(function (limit, i) { return { id: "L" + (i + 1), name: "Level " + (i + 1), order: i + 1, limit: limit, active: true }; }).concat({ id: "L6", name: "Level 6", order: 6, limit: null, active: false }),
      mappings: chosen.slice(0, 40).map(function (row, i) { return { id: "MAP" + String(i + 1).padStart(4, "0"), masterId: row.id, level: "L" + (i % 5 + 1) }; }),
      nextId: 41,
      schemaVersion: 2,
      history: []
    };
  }
  function normalize(raw) {
    if (!raw || !Array.isArray(raw.levels) || !Array.isArray(raw.mappings) || !Number.isInteger(raw.nextId)) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
    const next = structuredClone(raw);
    next.levels = next.levels.map(function (level, i) {
      return { id: String(level.id), name: String(level.name || "Level " + String(level.id).replace(/^L/, "")), order: Number.isInteger(level.order) ? level.order : i + 1, limit: level.limit === null ? null : Number(level.limit), active: level.active === true };
    });
    if (next.schemaVersion !== 2 && !next.levels.some(function (item) { return item.id === "L6"; })) next.levels.push({ id: "L6", name: "Level 6", order: Math.max(0, ...next.levels.map(function (item) { return item.order; })) + 1, limit: null, active: false });
    next.schemaVersion = 2;
    next.history = Array.isArray(next.history) ? next.history : [];
    if (next.levels.some(function (level) { return !/^L[1-9]\d*$/.test(level.id) || !level.name.trim() || !Number.isInteger(level.order) || level.order < 1 || (level.limit !== null && (!Number.isInteger(level.limit) || level.limit <= 0)); })) throw new Error("ข้อมูล Level ไม่ถูกต้อง");
    if (new Set(next.levels.map(function (level) { return level.id; })).size !== next.levels.length || new Set(next.levels.map(function (level) { return level.order; })).size !== next.levels.length) throw new Error("Level Code หรือลำดับซ้ำ");
    if (next.mappings.some(function (mapping) { return !byMasterId.has(mapping.masterId) || !next.levels.some(function (level) { return level.id === mapping.level; }); })) throw new Error("ข้อมูลเงื่อนไขไม่ถูกต้อง");
    if (new Set(next.mappings.map(function (mapping) { return mapping.masterId; })).size !== next.mappings.length) throw new Error("เงื่อนไขซ้ำ");
    return next;
  }
  function readStored() {
    const raw = localStorage.getItem(storageKey);
    return raw === null ? null : normalize(JSON.parse(raw));
  }
  function persist(next) {
    try {
      const serialized = JSON.stringify(normalize(next));
      localStorage.setItem(storageKey, serialized);
      if (localStorage.getItem(storageKey) !== serialized) throw new Error("ตรวจสอบข้อมูลหลังบันทึกไม่ผ่าน");
      state = readStored();
      render();
      return true;
    } catch (error) {
      toast("บันทึกไม่สำเร็จ: " + error.message, "error");
      return false;
    }
  }
  function toast(message, kind) {
    const box = $("alToast"); if (!box) return;
    box.textContent = message; box.className = "al-toast " + (kind || "success"); box.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { box.hidden = true; }, 5000);
  }
  function level(id) { return state.levels.find(function (item) { return item.id === id; }); }
  function mappingFor(masterId) { return state.mappings.find(function (item) { return item.masterId === masterId; }); }
  window.CLAIM_AGENT_AUTH = Object.freeze({
    levels: function () {
      return state ? sortedLevels().map(function (item) { return { id: item.id, name: item.name, limit: item.limit, active: item.active, employeeCount: employeeCount(item.id) }; }) : [];
    },
    resolveLevel: function (levelId, amount) {
      const item = state && level(levelId);
      if (!item) return { allowed: false, reason: "กรุณาเลือก Authorize Level" };
      const base = { level: item.id, name: item.name, limit: item.limit };
      if (!item.active) return { ...base, allowed: false, reason: item.id + " มีสถานะไม่ใช้งาน" };
      if (!Number.isFinite(amount) || amount <= 0) return { ...base, allowed: false, reason: "จำนวนเงินต้องมากกว่า 0 บาท" };
      if (item.limit !== null && amount > item.limit) return { ...base, allowed: false, overLimit: true, reason: "จำนวนเงินเกินวงเงินของ " + item.id };
      return { ...base, allowed: true, reason: "อยู่ในวงเงินอนุมัติของ " + item.id };
    },
    employees: function () {
      return employees.map(function (employee) {
        const source = byMasterId.get(employee.masterId);
        return { id: employee.id, name: employee.name, status: employee.status, branch: source.branch, position: source.position, department: source.department };
      });
    },
    resolve: function (employeeId, amount) {
      const employee = employees.find(function (item) { return item.id === employeeId; });
      if (!employee) return { allowed: false, reason: "กรุณาเลือกพนักงาน Demo" };
      const source = byMasterId.get(employee.masterId);
      const mapping = state && mappingFor(employee.masterId);
      const item = mapping && level(mapping.level);
      const base = { employeeId: employee.id, name: employee.name, branch: source.branch, position: source.position, department: source.department, level: item ? item.id : "", limit: item ? item.limit : null };
      if (employee.status !== "ใช้งาน") return { ...base, allowed: false, reason: "พนักงานไม่ได้อยู่ในสถานะใช้งาน" };
      if (!item) return { ...base, allowed: false, reason: "ยังไม่ได้กำหนด Authorize Level ให้ตำแหน่งนี้" };
      if (!item.active) return { ...base, allowed: false, reason: item.id + " มีสถานะไม่ใช้งาน" };
      if (!Number.isFinite(amount) || amount <= 0) return { ...base, allowed: false, reason: "จำนวนเงินต้องมากกว่า 0 บาท" };
      if (item.limit !== null && amount > item.limit) return { ...base, allowed: false, overLimit: true, reason: "จำนวนเงินเกินวงเงินของ " + item.id };
      return { ...base, allowed: true, reason: "อยู่ในวงเงินอนุมัติของ " + item.id };
    }
  });
  function sortedLevels() { return state.levels.slice().sort(function (a, b) { return a.order - b.order || a.id.localeCompare(b.id); }); }
  function employeeCount(levelId) { return employees.filter(function (employee) { const mapping = mappingFor(employee.masterId); return employee.status === "ใช้งาน" && mapping && mapping.level === levelId; }).length; }
  function levelUsage(levelId) { return state.mappings.filter(function (mapping) { return mapping.level === levelId; }).length; }

  function renderLevelTable() {
    $("alLevelRows").innerHTML = sortedLevels().map(function (item) {
      return '<tr><td><span class="al-level-pill">' + escapeHtml(item.id) + '</span></td><td class="al-level-name">' + escapeHtml(item.name) + '</td><td class="al-level-limit">' + money(item.limit) + '</td><td><span class="al-status ' + (item.active ? "" : "is-off") + '">' + (item.active ? "ใช้งาน" : "ไม่ใช้งาน") + '</span></td><td>' + levelUsage(item.id) + '</td><td>' + employeeCount(item.id) + '</td><td class="al-row-actions"><div class="al-action-group"><button type="button" class="al-icon-button al-edit" data-level-edit="' + escapeHtml(item.id) + '" aria-label="แก้ไข ' + escapeHtml(item.name) + '" title="แก้ไข"><span class="material-icons-round" aria-hidden="true">edit</span></button><button type="button" class="al-icon-button al-delete" data-level-delete="' + escapeHtml(item.id) + '" aria-label="ลบ ' + escapeHtml(item.name) + '" title="ลบ"><span class="material-icons-round" aria-hidden="true">delete_outline</span></button></div></td></tr>';
    }).join("");
  }
  function renderMappingFilterChoices() {
    const sources = master;
    function fill(id, values, allLabel, labelFor) {
      const select = $(id), previous = select.value;
      select.innerHTML = '<option value="">' + allLabel + '</option>' + values.sort(function (a, b) { return a.localeCompare(b, "th"); }).map(function (value) {
        return '<option value="' + escapeHtml(value || "__NO_DEPARTMENT__") + '">' + escapeHtml(labelFor ? labelFor(value) : value) + '</option>';
      }).join("");
      select.value = previous;
    }
    fill("alBranchFilter", Array.from(new Set(sources.map(function (row) { return row.branch; }))), "ทุกสาขา");
    const branch = $("alBranchFilter").value;
    const inBranch = sources.filter(function (row) { return !branch || row.branch === branch; });
    fill("alPositionFilter", Array.from(new Set(inBranch.map(function (row) { return row.position; }))), "ทุกตำแหน่ง");
    const position = $("alPositionFilter").value;
    const inPosition = inBranch.filter(function (row) { return !position || row.position === position; });
    fill("alDepartmentFilter", Array.from(new Set(inPosition.map(function (row) { return row.department; }))), "ทุกแผนก", function (value) { return value || "ไม่ระบุแผนก"; });
  }
  function pager(target, current, count, onChange) {
    const pages = Math.max(1, Math.ceil(count / 10));
    target.innerHTML = '<button type="button" data-page="' + (current - 1) + '"' + (current === 1 ? " disabled" : "") + '>ก่อนหน้า</button><span>หน้า ' + current + ' / ' + pages + '</span><button type="button" data-page="' + (current + 1) + '"' + (current === pages ? " disabled" : "") + '>ถัดไป</button>';
    target.onclick = function (event) { const button = event.target.closest("[data-page]"); if (button && !button.disabled) onChange(Number(button.dataset.page)); };
  }
  function visibleMappings() {
    const query = $("alSearch").value.trim().toLocaleLowerCase("th-TH");
    const branch = $("alBranchFilter").value, position = $("alPositionFilter").value, department = $("alDepartmentFilter").value;
    return master.filter(function (source) {
      return (!branch || source.branch === branch) && (!position || source.position === position) && (!department || (department === "__NO_DEPARTMENT__" ? !source.department : source.department === department)) && (!query || source.branch.toLocaleLowerCase("th-TH").includes(query) || source.position.toLocaleLowerCase("th-TH").includes(query));
    });
  }
  function renderMappings() {
    const rows = visibleMappings(); conditionPage = Math.min(conditionPage, Math.max(1, Math.ceil(rows.length / 10)));
    const configured = rows.filter(function (source) { return !!mappingFor(source.id); }).length;
    $("alResultCount").textContent = "แสดง " + (rows.length ? (conditionPage - 1) * 10 + 1 : 0) + "–" + Math.min(conditionPage * 10, rows.length) + " จาก " + rows.length + " รายการ · กำหนด Level แล้ว " + configured + " รายการ";
    $("alConditionRows").innerHTML = rows.length ? rows.slice((conditionPage - 1) * 10, conditionPage * 10).map(function (source) {
      const mapping = mappingFor(source.id), item = mapping && level(mapping.level), label = escapeHtml(source.branch + " " + source.position + " " + (source.department || ""));
      const edit = mapping
        ? '<button type="button" class="al-icon-button al-edit" data-edit="' + escapeHtml(mapping.id) + '" aria-label="แก้ไขเงื่อนไข ' + label + '" title="แก้ไข"><span class="material-icons-round" aria-hidden="true">edit</span></button>'
        : '<button type="button" class="al-icon-button al-edit" data-assign="' + source.id + '" aria-label="กำหนด Level ให้ ' + label + '" title="กำหนด Level"><span class="material-icons-round" aria-hidden="true">edit</span></button>';
      const remove = mapping ? '<button type="button" class="al-icon-button al-delete" data-delete="' + escapeHtml(mapping.id) + '" aria-label="ลบเงื่อนไข ' + label + '" title="ลบ"><span class="material-icons-round" aria-hidden="true">delete_outline</span></button>' : "";
      return '<tr' + (mapping && mapping.id === highlightedId ? ' class="al-highlight"' : "") + '><td>' + escapeHtml(source.branch) + '</td><td>' + escapeHtml(source.position) + '</td><td>' + escapeHtml(source.department || "ไม่ระบุแผนก") + '</td><td>' + (item ? '<span class="al-level-pill">' + escapeHtml(item.id) + '</span>' : "—") + '</td><td>' + (item ? money(item.limit) : "—") + '</td><td><span class="al-status ' + (item ? (item.active ? "" : "is-off") : "is-unset") + '">' + (item ? (item.active ? "ใช้งาน" : "ไม่ใช้งาน") : "ยังไม่กำหนด") + '</span></td><td class="al-row-actions"><div class="al-action-group">' + edit + remove + '</div></td></tr>';
    }).join("") : '<tr><td colspan="7" class="al-empty">ไม่พบข้อมูลที่ตรงกับการค้นหาและตัวกรอง</td></tr>';
    pager($("alPagination"), conditionPage, rows.length, function (next) { conditionPage = next; renderMappings(); });
  }
  function renderEmployees() {
    const query = $("alEmployeeSearch").value.trim().toLocaleLowerCase("th-TH");
    const rows = employees.filter(function (employee) { const source = byMasterId.get(employee.masterId); return [employee.id, employee.name, source.branch, source.position].some(function (text) { return text.toLocaleLowerCase("th-TH").includes(query); }); });
    employeePage = Math.min(employeePage, Math.max(1, Math.ceil(rows.length / 10)));
    $("alEmployeeCount").textContent = "แสดง " + (rows.length ? (employeePage - 1) * 10 + 1 : 0) + "–" + Math.min(employeePage * 10, rows.length) + " จาก " + rows.length + " คน";
    $("alEmployeeRows").innerHTML = rows.length ? rows.slice((employeePage - 1) * 10, employeePage * 10).map(function (employee) {
      const source = byMasterId.get(employee.masterId), mapping = mappingFor(employee.masterId), item = mapping && level(mapping.level);
      return '<tr><td>' + employee.id + '</td><td>' + escapeHtml(employee.name) + '</td><td>' + escapeHtml(source.branch) + '</td><td>' + escapeHtml(source.position) + '<small>' + escapeHtml(source.department || "ไม่ระบุแผนก") + '</small></td><td>' + (item ? escapeHtml(item.id) : "ยังไม่ได้กำหนด") + '</td><td>' + (item ? money(item.limit) : "—") + '</td><td>' + (item ? "ตามตำแหน่ง" : "—") + '</td><td><span class="al-status ' + (employee.status === "ใช้งาน" ? "" : "is-off") + '">' + employee.status + '</span></td></tr>';
    }).join("") : '<tr><td colspan="8" class="al-empty">ไม่พบพนักงาน</td></tr>';
    pager($("alEmployeePagination"), employeePage, rows.length, function (next) { employeePage = next; renderEmployees(); });
  }
  function renderTestChoices() {
    const select = $("alTestEmployee"), old = select.value;
    select.innerHTML = '<option value="">เลือกพนักงาน</option>' + employees.map(function (employee) { return '<option value="' + employee.id + '">' + employee.id + ' · ' + escapeHtml(employee.name) + '</option>'; }).join("");
    select.value = old;
  }
  function renderHistory() {
    $("alTestHistory").innerHTML = state.history.length ? state.history.slice(0, 20).map(function (entry) {
      return '<div class="al-history-row"><strong class="' + (entry.allowed ? "is-pass" : "is-fail") + '">' + (entry.allowed ? "ผ่าน" : "ไม่ผ่าน") + '</strong><div>' + escapeHtml(entry.employeeId + " · " + entry.name) + '<small>' + escapeHtml(entry.branch + " / " + entry.position + " · " + (entry.level || "ไม่มี Level") + " · " + entry.reason) + '</small><small>วงเงิน ณ ตอนทดสอบ: ' + (entry.level ? money(entry.limit) : "—") + '</small></div><span>' + money(entry.amount) + '<small>' + escapeHtml(entry.at) + '</small></span></div>';
    }).join("") : '<p class="al-history-empty">ยังไม่มีผลทดสอบ</p>';
  }
  function render() { renderLevelTable(); renderMappingFilterChoices(); renderMappings(); }

  function showTab(name) {
    tab = name;
    ["levels", "conditions"].forEach(function (item) { $("al" + item[0].toUpperCase() + item.slice(1) + "Panel").classList.toggle("hidden", item !== name); });
    document.querySelectorAll("[data-al-tab]").forEach(function (button) { const active = button.dataset.alTab === name; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); button.tabIndex = active ? 0 : -1; });
  }
  function showPage() {
    document.querySelectorAll("main .page, #monitorPage, #detailPage, #claimMonitorPage").forEach(function (page) { page.classList.add("hidden"); page.style.removeProperty("display"); });
    $("authorizationLimitsPage").classList.remove("hidden"); $("systemSettingsSubmenu").classList.remove("hidden");
    $("menuSystemSettings").setAttribute("aria-expanded", "true"); $("systemSettingsArrow").textContent = "expand_less";
    document.querySelectorAll("aside button[aria-current='page']").forEach(function (button) { button.removeAttribute("aria-current"); });
    $("submenuAuthorizationLimits").setAttribute("aria-current", "page");
    $("pageTitle").textContent = "จัดการวงเงิน"; $("pageSubtitle").textContent = "ตั้งค่าระบบ / จัดการวงเงิน";
    document.title = "จัดการวงเงิน — ClaimAgent"; render(); window.scrollTo(0, 0);
  }
  function closeDialog() { if (dialog) { dialog.remove(); dialog = null; document.body.style.overflow = ""; } }
  function openDialog(content) {
    closeDialog(); dialog = document.createElement("div"); dialog.className = "al-dialog-backdrop";
    dialog.innerHTML = '<div class="al-dialog" role="dialog" aria-modal="true">' + content + '</div>';
    document.body.appendChild(dialog); document.body.style.overflow = "hidden";
    dialog.addEventListener("click", function (event) { if (event.target === dialog || event.target.closest("[data-close]")) closeDialog(); });
    dialog.querySelector("button,select,input")?.focus();
  }
  function confirmAction(title, message, action) {
    openDialog('<div class="al-confirm"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message) + '</p><footer><button type="button" class="al-btn al-outline" data-close>ยกเลิก</button><button id="alConfirmAction" type="button" class="al-btn al-danger">ยืนยัน</button></footer></div>');
    $("alConfirmAction").addEventListener("click", function () { if (action()) closeDialog(); });
  }
  function optionList(values, current, placeholder) {
    return '<option value="">' + escapeHtml(placeholder) + '</option>' + values.map(function (value) { const id = typeof value === "string" ? value : value.id, label = typeof value === "string" ? value : value.name; return '<option value="' + escapeHtml(id) + '"' + (id === current ? " selected" : "") + '>' + escapeHtml(label) + '</option>'; }).join("");
  }
  function openLevelEditor(id) {
    const original = id && level(id), nextCode = "L" + (Math.max(0, ...state.levels.map(function (item) { return Number(item.id.slice(1)); })) + 1);
    const current = original || { id: nextCode, name: "Level " + nextCode.slice(1), order: Math.max(0, ...state.levels.map(function (item) { return item.order; })) + 1, limit: null, active: true };
    openDialog(`<form id="alLevelForm" class="al-level-editor">
      <header class="al-editor-header">
        <div class="al-editor-heading"><span class="al-editor-icon material-icons-round" aria-hidden="true">admin_panel_settings</span><div><h3 id="alLevelEditorTitle">${original ? "แก้ไข Authorize Level" : "เพิ่ม Authorize Level"}</h3><p>กำหนดข้อมูลและวงเงินอนุมัติของ Level</p></div></div>
        <button type="button" class="al-editor-close" data-close aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button>
      </header>
      <div class="al-dialog-body">
        <div class="al-editor-grid">
          <label class="al-editor-code">รหัส Level<input name="code" value="${escapeHtml(current.id)}" readonly></label>
          <label>ชื่อ Level<input name="name" value="${escapeHtml(current.name)}" required maxlength="80"></label>
          <label class="al-editor-limit">วงเงินอนุมัติสูงสุดต่อรายการ (บาท)<input name="limit" type="number" min="1" step="1" value="${current.limit === null ? "" : current.limit}"${current.limit === null ? " disabled" : ""} placeholder="ระบุวงเงิน"></label>
        </div>
        <div class="al-editor-options">
          <label class="al-editor-option"><input name="unlimited" type="checkbox"${current.limit === null ? " checked" : ""}><span><strong>ไม่จำกัดวงเงิน</strong><small>อนุมัติได้โดยไม่กำหนดวงเงินสูงสุดต่อรายการ</small></span></label>
          <label class="al-editor-option"><input name="active" type="checkbox"${current.active ? " checked" : ""}><span><strong>เปิดใช้งาน</strong><small>ให้ Level นี้พร้อมใช้งานในการกำหนดสิทธิ์</small></span></label>
        </div>
        <p id="alLevelError" class="al-form-error" role="alert"></p>
      </div>
      <footer><button type="button" class="al-btn al-outline" data-close>ยกเลิก</button><button type="submit" class="al-btn al-primary"><span class="material-icons-round" aria-hidden="true">save</span>บันทึกข้อมูล</button></footer>
    </form>`);
    dialog.querySelector(".al-dialog").setAttribute("aria-labelledby", "alLevelEditorTitle");
    const form = $("alLevelForm");
    form.elements.unlimited.addEventListener("change", function () { form.elements.limit.disabled = this.checked; });
    form.addEventListener("submit", function (event) {
      event.preventDefault(); const name = form.elements.name.value.trim(), order = current.order, unlimited = form.elements.unlimited.checked, raw = form.elements.limit.value, limit = unlimited ? null : Number(raw);
      let error = "";
      if (!name) error = "กรุณาระบุชื่อ Level";
      else if (!unlimited && (!raw || !Number.isInteger(limit) || limit <= 0)) error = "วงเงินต้องเป็นจำนวนเต็มบวก หรือเลือกไม่จำกัดวงเงิน";
      if (error) { $("alLevelError").textContent = error; return; }
      const next = structuredClone(state), candidate = { id: current.id, name: name, order: order, limit: limit, active: form.elements.active.checked };
      next.levels = next.levels.filter(function (item) { return item.id !== current.id; }).sort(function (a, b) { return a.order - b.order; });
      next.levels.splice(order - 1, 0, candidate);
      next.levels.forEach(function (item, index) { item.order = index + 1; });
      const commit = function () { if (!persist(next)) return false; toast(original ? "บันทึกการแก้ไข Level แล้ว" : "เพิ่ม Level แล้ว"); return true; };
      const impacted = original && employeeCount(id);
      if (original && original.limit !== limit && impacted) {
        closeDialog(); confirmAction("ยืนยันการเปลี่ยนวงเงิน", "วงเงินใหม่นี้มีผลกับพนักงาน " + impacted + " คน และไม่เปลี่ยนผลทดสอบที่บันทึกไว้ก่อนหน้า", commit);
      } else if (commit()) closeDialog();
    });
  }
  function deleteLevel(id) {
    const count = levelUsage(id), people = employeeCount(id);
    if (count || people) { toast("ลบ " + id + " ไม่ได้: มี " + count + " เงื่อนไข และ " + people + " พนักงานที่ผูกอยู่ สามารถปิดใช้งาน Level แทนได้", "warning"); return; }
    confirmAction("ลบ Authorize Level", "ยืนยันลบ " + id + " ที่ไม่มีการใช้งาน?", function () {
      const next = structuredClone(state); next.levels = next.levels.filter(function (item) { return item.id !== id; }).sort(function (a, b) { return a.order - b.order; });
      next.levels.forEach(function (item, index) { item.order = index + 1; });
      if (!persist(next)) return false; toast("ลบ " + id + " แล้ว"); return true;
    });
  }
  function openMappingEditor(id, presetMasterId) {
    const original = id && state.mappings.find(function (item) { return item.id === id; });
    let source = original ? byMasterId.get(original.masterId) : byMasterId.get(presetMasterId);
    openDialog('<form id="alConditionForm"><header><h3>' + (original ? "แก้ไขเงื่อนไข" : "เพิ่มเงื่อนไข") + '</h3><button type="button" data-close aria-label="ปิด">×</button></header><div class="al-dialog-body"><p class="al-dialog-note">เลือกสาขา ตำแหน่ง และแผนกจาก Master Data</p><label>สาขา<select name="branch" required></select></label><label>ตำแหน่ง / แผนก<select name="masterId" required></select></label><label>Authorize Level<select name="level" required></select></label><div id="alDialogLimit" class="al-dialog-limit"></div><p id="alDialogError" class="al-form-error" role="alert"></p></div><footer><button type="button" class="al-btn al-outline" data-close>ยกเลิก</button><button type="submit" class="al-btn al-primary">' + (original ? "บันทึก" : "เพิ่มข้อมูล") + '</button></footer></form>');
    const form = $("alConditionForm");
    const branches = Array.from(new Set(master.map(function (row) { return row.branch; }))).sort(function (a, b) { return a.localeCompare(b, "th"); });
    form.elements.branch.innerHTML = optionList(branches, source && source.branch, "เลือกสาขา");
    form.elements.level.innerHTML = optionList(sortedLevels().map(function (item) { return { id: item.id, name: item.id + " · " + item.name + (item.active ? "" : " (ไม่ใช้งาน)") }; }), original && original.level, "เลือก Authorize Level");
    function updatePairs() {
      const rows = master.filter(function (row) { return row.branch === form.elements.branch.value; });
      form.elements.masterId.innerHTML = '<option value="">เลือกตำแหน่ง / แผนก</option>' + rows.map(function (row) { return '<option value="' + row.id + '"' + (source && source.id === row.id ? " selected" : "") + '>' + escapeHtml(row.position + " · " + (row.department || "ไม่ระบุแผนก")) + '</option>'; }).join("");
    }
    function updateLimit() { const selected = level(form.elements.level.value); $("alDialogLimit").textContent = selected ? "วงเงินอนุมัติ: " + money(selected.limit) + (selected.active ? "" : " · Level ไม่ใช้งาน") : ""; }
    form.elements.branch.addEventListener("change", function () { source = null; updatePairs(); });
    form.elements.level.addEventListener("change", updateLimit); updatePairs(); updateLimit();
    form.addEventListener("submit", function (event) {
      event.preventDefault(); const masterId = Number(form.elements.masterId.value), levelId = form.elements.level.value;
      if (!form.elements.branch.value || !form.elements.masterId.value || !byMasterId.has(masterId) || !level(levelId)) { $("alDialogError").textContent = "กรุณาเลือกสาขา ตำแหน่ง/แผนก และ Authorize Level ให้ครบ"; return; }
      if (state.mappings.some(function (item) { return item.masterId === masterId && (!original || item.id !== id); })) { $("alDialogError").textContent = "เงื่อนไขสาขา ตำแหน่ง และแผนกนี้มีอยู่แล้ว"; return; }
      const next = structuredClone(state);
      if (original) Object.assign(next.mappings.find(function (item) { return item.id === id; }), { masterId: masterId, level: levelId });
      else next.mappings.unshift({ id: "MAP" + String(next.nextId++).padStart(4, "0"), masterId: masterId, level: levelId });
      if (!persist(next)) return;
      highlightedId = original ? id : next.mappings[0].id; conditionPage = 1; $("alSearch").value = "";
      const selectedSource = byMasterId.get(masterId);
      $("alBranchFilter").value = selectedSource.branch; renderMappingFilterChoices();
      $("alPositionFilter").value = selectedSource.position; renderMappingFilterChoices();
      $("alDepartmentFilter").value = selectedSource.department || "__NO_DEPARTMENT__";
      closeDialog(); render(); toast(original ? "บันทึกการแก้ไขเงื่อนไขแล้ว" : "เพิ่มข้อมูลแล้ว");
    });
  }
  function testAuthorization(event) {
    event.preventDefault(); const employee = employees.find(function (item) { return item.id === $("alTestEmployee").value; }), amount = Number($("alTestAmount").value);
    const result = $("alTestResult");
    if (!employee || !Number.isFinite(amount) || amount <= 0) { result.className = "al-test-result is-error"; result.textContent = "กรุณาเลือกพนักงานและระบุจำนวนเงินมากกว่า 0 บาท"; return; }
    const source = byMasterId.get(employee.masterId), mapping = mappingFor(employee.masterId), item = mapping && level(mapping.level);
    let allowed = false, reason;
    if (employee.status !== "ใช้งาน") reason = "พนักงานมีสถานะไม่ใช้งาน";
    else if (!item) reason = "ยังไม่ได้กำหนด Authorize Level ให้ตำแหน่งนี้";
    else if (!item.active) reason = item.id + " มีสถานะไม่ใช้งาน";
    else if (item.limit !== null && amount > item.limit) reason = "จำนวนเงินเกินวงเงินของ " + item.id;
    else { allowed = true; reason = "อยู่ในวงเงินอนุมัติของ " + item.id; }
    result.className = "al-test-result " + (allowed ? "is-success" : "is-warning");
    result.innerHTML = '<strong>' + (allowed ? "ผ่านเงื่อนไข" : "ไม่ผ่านเงื่อนไข") + '</strong><div>พนักงาน: ' + escapeHtml(employee.id + " · " + employee.name) + '</div><div>สาขา / ตำแหน่ง: ' + escapeHtml(source.branch + " / " + source.position) + '</div><div>Authorize Level: ' + escapeHtml(item ? item.id + " · " + item.name : "ยังไม่ได้กำหนด") + '</div><div>วงเงินสูงสุด: ' + (item ? money(item.limit) : "—") + '</div><div>จำนวนเงินที่ทดสอบ: ' + money(amount) + '</div><div>เหตุผล: ' + escapeHtml(reason) + '</div>';
    const next = structuredClone(state);
    next.history.unshift({ at: new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date()), employeeId: employee.id, name: employee.name, branch: source.branch, position: source.position, level: item ? item.id : "", limit: item ? item.limit : null, amount: amount, allowed: allowed, reason: reason });
    next.history = next.history.slice(0, 100);
    if (!persist(next)) toast("แสดงผลทดสอบแล้ว แต่ไม่สามารถบันทึกประวัติได้", "warning");
  }
  function init() {
    try { state = readStored(); } catch (error) { toast("อ่านข้อมูลเดิมไม่สำเร็จ: " + error.message, "error"); }
    if (state) {
      try { if (JSON.parse(localStorage.getItem(storageKey)).schemaVersion !== 2) persist(state); } catch (_) { /* keep the loaded state in memory */ }
    }
    if (!state) {
      state = seed();
      try { if (localStorage.getItem(storageKey) === null) persist(state); else render(); }
      catch (error) { render(); toast("เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล", "warning"); }
    } else render();
    $("menuSystemSettings").addEventListener("click", function () { const expanded = this.getAttribute("aria-expanded") !== "true"; this.setAttribute("aria-expanded", String(expanded)); $("systemSettingsSubmenu").classList.toggle("hidden", !expanded); $("systemSettingsArrow").textContent = expanded ? "expand_less" : "expand_more"; });
    $("submenuAuthorizationLimits").addEventListener("click", showPage);
    const tabButtons = Array.from(document.querySelectorAll("[data-al-tab]"));
    tabButtons.forEach(function (button, index) {
      button.addEventListener("click", function () { showTab(button.dataset.alTab); });
      button.addEventListener("keydown", function (event) {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabButtons.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabButtons.length) % tabButtons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabButtons.length - 1;
        else return;
        event.preventDefault(); showTab(tabButtons[next].dataset.alTab); tabButtons[next].focus();
      });
    });
    $("alAddLevel").addEventListener("click", function () { openLevelEditor(); });
    $("alLevelRows").addEventListener("click", function (event) { const edit = event.target.closest("[data-level-edit]"), remove = event.target.closest("[data-level-delete]"); if (edit) openLevelEditor(edit.dataset.levelEdit); if (remove) deleteLevel(remove.dataset.levelDelete); });
    $("alAdd").addEventListener("click", function () { openMappingEditor(); });
    $("alReset").addEventListener("click", function () { confirmAction("รีเซ็ตข้อมูลตัวอย่าง", "เงื่อนไข Level ในเครื่องนี้จะกลับเป็นค่าเริ่มต้น", function () { if (!persist(seed())) return false; highlightedId = ""; conditionPage = 1; $("alSearch").value = ""; $("alBranchFilter").value = ""; $("alPositionFilter").value = ""; $("alDepartmentFilter").value = ""; render(); toast("รีเซ็ตข้อมูลตัวอย่างแล้ว"); return true; }); });
    $("alSearch").addEventListener("input", function () { conditionPage = 1; renderMappings(); });
    $("alBranchFilter").addEventListener("change", function () { $("alPositionFilter").value = ""; $("alDepartmentFilter").value = ""; conditionPage = 1; renderMappingFilterChoices(); renderMappings(); });
    $("alPositionFilter").addEventListener("change", function () { $("alDepartmentFilter").value = ""; conditionPage = 1; renderMappingFilterChoices(); renderMappings(); });
    $("alDepartmentFilter").addEventListener("change", function () { conditionPage = 1; renderMappings(); });
    $("alClearFilters").addEventListener("click", function () { $("alSearch").value = ""; $("alBranchFilter").value = ""; $("alPositionFilter").value = ""; $("alDepartmentFilter").value = ""; conditionPage = 1; renderMappingFilterChoices(); renderMappings(); });
    $("alConditionRows").addEventListener("click", function (event) { const edit = event.target.closest("[data-edit]"), assign = event.target.closest("[data-assign]"), remove = event.target.closest("[data-delete]"); if (edit) openMappingEditor(edit.dataset.edit); if (assign) openMappingEditor(null, Number(assign.dataset.assign)); if (remove) confirmAction("ลบเงื่อนไข", "ยืนยันลบเงื่อนไขนี้? พนักงานที่อ้างอิงจะไม่มีสิทธิ์อนุมัติ", function () { const next = structuredClone(state); next.mappings = next.mappings.filter(function (item) { return item.id !== remove.dataset.delete; }); if (!persist(next)) return false; toast("ลบเงื่อนไขแล้ว"); return true; }); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && dialog) closeDialog(); });
    showTab(tab);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.showAuthorizationLimitsPage = showPage;
})();
