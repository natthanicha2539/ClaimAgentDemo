/* แจ้งเคลมลูกค้า: ขั้นตอนโอนเงินตาม Daily Limit และ Authorize Level (Demo) */
(function () {
  "use strict";

  const KEY = "claimagent.customer-authorized-transfers.v1";
  const DAILY_LIMIT = 30000;
  let selectedLevelId = "";
  let extendPage = 1;
  let noticeTimer;

  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = value => Number(value || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bangkokDay = date => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const emptyStore = () => ({ version: 1, nextId: 800001, records: [], authorizationSampleSeeded: false });

  function readStore() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return emptyStore();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Number.isInteger(data.nextId) || !Array.isArray(data.records)) throw new Error("ข้อมูลรายการโอนเงินไม่ถูกต้อง");
    return data;
  }
  function saveStore(data) {
    const serialized = JSON.stringify(data);
    localStorage.setItem(KEY, serialized);
    if (localStorage.getItem(KEY) !== serialized) throw new Error("ตรวจสอบข้อมูลหลังบันทึกไม่ผ่าน");
    renderQueues();
    updateLevelPreview();
    window.dispatchEvent(new CustomEvent("claimagent:authorized-transfer-changed"));
  }
  function ensureAuthorizationSample() {
    const data = readStore();
    if (data.authorizationSampleSeeded) return;
    if (!data.records.some(item => item.id === "CAT-AUTH-LEVEL-SAMPLE")) {
      const refs = refFor(data.nextId++, "PH");
      data.records.push({
        id: "CAT-AUTH-LEVEL-SAMPLE", claims: [refs.claim], cases: [refs.caseNo], pmc: refs.pmc, pmcCandidate: refs.pmc,
        product: "PH", insured: "นายธนกฤต วัฒนชัย", contactName: "นายธนกฤต วัฒนชัย", contactPhone: "081-234-5678",
        payee: "นายธนกฤต วัฒนชัย", bank: "กรุงไทย", account: "5281137123", branch: "สำนักงานใหญ่",
        amount: 20000, status: "pending_level", createdAt: new Date().toISOString(), initiatorLevelId: "L1", transferLevelId: "L1",
        dailyApprovalRequested: false, approvedBy: "", transferAt: "", authorizationSample: true
      });
    }
    data.authorizationSampleSeeded = true;
    saveStore(data);
  }
  function notice(message, tone) {
    let box = $("catTransferNotice");
    if (!box) {
      box = document.createElement("div");
      box.id = "catTransferNotice";
      box.setAttribute("role", "status");
      document.body.appendChild(box);
    }
    box.className = "cat-notice " + (tone || "success");
    box.textContent = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => box.remove(), 5000);
  }
  function auth() { return window.CLAIM_AGENT_AUTH; }
  function levels() { return auth() && auth().levels ? auth().levels() : []; }
  function resolve(levelId, amount) {
    if (!auth() || !auth().resolveLevel) return { allowed: false, reason: "ไม่สามารถอ่านข้อมูล Authorize Level" };
    const result = auth().resolveLevel(levelId, amount);
    const chosen = levels().find(item => item.id === levelId);
    if (result.level && chosen && chosen.active && chosen.employeeCount < 1) return { ...result, allowed: false, overLimit: false, reason: "Level นี้ยังไม่มีพนักงานที่ได้รับสิทธิ์" };
    return result;
  }
  function legacyLevel(employeeId) {
    return employeeId && auth() && auth().resolve ? auth().resolve(employeeId, 1).level || "" : "";
  }
  function levelOptions() {
    const all = levels();
    if (!selectedLevelId) selectedLevelId = all.find(item => item.active)?.id || "";
    return '<option value="">เลือก Level ของพนักงาน</option>' + all.map(item => '<option value="' + esc(item.id) + '"' + (item.id === selectedLevelId ? " selected" : "") + '>' + esc(item.id + " · " + (item.limit === null ? "ไม่จำกัดวงเงิน" : money(item.limit) + " บาท") + (item.active ? "" : " (ไม่ใช้งาน)")) + '</option>').join("");
  }
  function currentAmount() {
    const state = window.claimState || {};
    const value = $("transferAmount")?.value || state.transferAmount || state.primaryClaimAmount || 0;
    const parsed = typeof window.parseMoney === "function" ? Number(window.parseMoney(value)) : Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function isCustomerGeneral() {
    const state = window.claimState || {};
    return state.claimCategory !== "hospital" && !["เสียชีวิต", "ทุพพลภาพ/สูญเสียอวัยวะ"].includes(String(state.coverageType || "").trim());
  }
  function recordTransferLevel(record) { return record.transferLevelId || legacyLevel(record.transferEmployeeId); }
  function dailyTotal(data, levelId) {
    const today = bangkokDay(new Date());
    return data.records.reduce((sum, record) => sum + (record.status === "success" && recordTransferLevel(record) === levelId && record.transferAt && bangkokDay(new Date(record.transferAt)) === today ? Number(record.amount) : 0), 0);
  }
  function trackingDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(date).map(part => [part.type, part.value]));
    return parts.day + "/" + parts.month + "/" + (Number(parts.year) + 543) + " " + parts.hour + ":" + parts.minute + ":" + parts.second;
  }
  function trackingRows() {
    return readStore().records.filter(item => item.pmc && ["pending_level", "success"].includes(item.status)).map(item => {
      const createdAt = item.createdAt || item.transferAt || new Date().toISOString();
      const totalCents = Math.round(Number(item.amount || 0) * 100);
      const caseCount = Math.max(1, item.claims.length);
      return ({
      authorizationTransferId: item.id, refNo: item.pmc, claimNo: item.claims[0],
      claims: item.claims.map((claimNo, index) => ({ claimNo, caseNo: item.cases[index] || "-", insured: item.insured, amount: (Math.floor(totalCents / caseCount) + (index < totalCents % caseCount ? 1 : 0)) / 100, product: item.product })),
      created: trackingDate(createdAt), createdIso: createdAt, notifyDate: trackingDate(createdAt),
      transferDate: item.status === "success" ? trackingDate(item.transferAt) : "-", insured: item.insured,
      payee: item.payee, recipient: item.payee || item.insured, payeeRelation: "ผู้รับเงิน", bank: item.bank, account: item.account,
      branch: item.branch, product: item.product, claimType: "ค่ารักษา", transferKind: "Authorize Level", amount: item.amount,
      status: item.status === "success" ? "โอนสำเร็จ" : "รอโอน", statusKey: item.status === "success" ? "success" : "wait",
      statusFilter: item.status === "success" ? "success" : "pending", transferMode: "customer",
      initiatorLevelId: item.initiatorLevelId || legacyLevel(item.initiatorId), authorizationSample: !!item.authorizationSample
      });
    });
  }
  function evaluateTracking(id, levelId) {
    try {
      const data = readStore();
      const record = data.records.find(item => item.id === id);
      if (!record || record.status !== "pending_level") return { allowed: false, reason: "รายการนี้ไม่อยู่ในสถานะรอโอน" };
      const result = resolve(levelId, record.amount);
      if (!result.allowed) return { allowed: false, reason: result.reason };
      const dailyExceeded = dailyTotal(data, levelId) + record.amount > DAILY_LIMIT;
      return { allowed: !dailyExceeded, dailyExceeded, reason: dailyExceeded ? "ยอดโอนสะสมวันนี้รวมรายการนี้เกิน 30,000 บาท ต้องส่งรออนุมัติวงเงิน" : "วงเงินของ " + levelId + " เพียงพอสำหรับรายการนี้" };
    } catch (cause) { return { allowed: false, reason: "ตรวจสิทธิ์ไม่สำเร็จ: " + cause.message }; }
  }
  function payFromTracking(id, levelId) {
    try {
      const check = evaluateTracking(id, levelId);
      if (!check.allowed && !check.dailyExceeded) return { ok: false, reason: check.reason };
      const updated = updateRecord(id, ["pending_level"], item => {
        item.transferLevelId = levelId;
        if (check.dailyExceeded) { item.status = "pending_daily"; item.dailyApprovalRequested = true; }
        else { item.status = "success"; item.transferAt = new Date().toISOString(); }
      });
      return updated ? { ok: true, status: updated.status, record: updated } : { ok: false, reason: "รายการนี้ไม่อยู่ในสถานะรอโอน" };
    } catch (cause) { return { ok: false, reason: "โอนเงินไม่สำเร็จ: " + cause.message }; }
  }
  function updateLevelPreview() {
    const box = $("catClaimLevelNotice");
    if (!box) return;
    const levelId = $("catClaimActor")?.value || "";
    const amount = currentAmount();
    const result = resolve(levelId, amount > 0 ? amount : 1);
    let message = "เลือก Level ของพนักงานเพื่อดูผลตรวจสอบวงเงิน (เฉพาะ Demo)";
    let tone = "neutral";
    if (levelId && !result.allowed && !result.overLimit) { message = result.reason; tone = "error"; }
    else if (levelId && amount > 0) {
      try {
        const total = dailyTotal(readStore(), levelId);
        if (total + amount > DAILY_LIMIT) { message = "ยอดสะสมวันนี้ " + money(total) + " + ยอดเบิก " + money(amount) + " บาท เกิน 30,000 บาท · จะแสดงแจ้งเตือนรออนุมัติวงเงิน"; tone = "warning"; }
        else if (result.overLimit) { message = "ยอดเบิกเกินวงเงินของ " + levelId + " (" + money(result.limit) + " บาท) · จะแสดงแจ้งเตือนเกินวงเงินและรอโอน"; tone = "warning"; }
        else { message = "ยอดเบิกอยู่ในวงเงินของ " + levelId + " · สามารถยืนยันโอนเงินได้"; tone = "success"; }
      } catch (_) { message = "ไม่สามารถอ่านยอดสะสมสำหรับ Demo ได้"; tone = "error"; }
    }
    box.className = "cat-level-preview " + tone;
    box.textContent = message;
  }
  function modal(title, body, actions, tone) {
    const html = '<div class="cat-dialog"><header><span class="material-icons-round ' + (tone || "") + '">account_balance_wallet</span><h3>' + esc(title) + '</h3><button type="button" onclick="closeModal()" aria-label="ปิด"><span class="material-icons-round">close</span></button></header><div class="cat-dialog-body">' + body + '</div><footer>' + actions + '</footer></div>';
    window.showModal(html, "max-w-xl");
  }
  function error(message) {
    modal("ไม่สามารถทำรายการ", '<p role="alert">' + esc(message) + '</p>', '<button type="button" class="cat-btn primary" onclick="closeModal()">รับทราบ</button>', "error");
  }
  function refFor(sequence, product) {
    const now = new Date();
    const year = String(Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric" }).format(now)) + 543).slice(-2);
    const month = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", month: "2-digit" }).format(now);
    const suffix = year + month + String(sequence).padStart(6, "0");
    return { claim: (product === "PA" ? "CLPA" : "CL") + suffix, caseNo: (product === "PA" ? "CCPA" : "CC") + suffix + "-01", pmc: "PMC" + suffix };
  }
  function recordSnapshot() {
    const state = window.claimState || {};
    const row = state.paPrimaryRow || state.row || {};
    const product = row.product === "PA" ? "PA" : "PH";
    return {
      product,
      insured: row.name || "-",
      school: row.school || "",
      contactName: product === "PA" ? (row.coordinatorName || row.name || "-") : (row.name || "-"),
      contactPhone: row.coordinatorPhone || row.phone || "-",
      branch: row.branch || row.province || "-",
      payee: product === "PA" ? (row.bankOwner || row.school || row.name || "-") : (row.bankOwner || row.name || "-"),
      bank: row.bankName || "กรุงไทย",
      account: row.bankAccount || (product === "PA" ? "1821000000" : "5281137123"),
      amount: currentAmount()
    };
  }
  function findCurrent(data) {
    const state = window.claimState || {};
    if (!state.__authorizedTransferId) return null;
    const record = data.records.find(item => item.id === state.__authorizedTransferId);
    if (!record) return null;
    if (record.product === "PH" && state.createdConsiderationClaimCode !== record.claims[0]) return null;
    return record;
  }
  function showInitialResult(record) {
    const status = record.status;
    const refs = '<div class="cat-refs"><span>เลขที่ CL</span><strong>' + esc(record.claims.join(", ")) + '</strong><span>เลขที่ Case</span><strong>' + esc(record.cases.join(", ")) + '</strong>' + (record.pmc ? '<span>เลขที่ PMC</span><strong>' + esc(record.pmc) + '</strong>' : "") + '</div>';
    const snapshot = {
      payeeLabel: record.product === "PA" ? "ผู้รับเงิน / สถานศึกษา" : "ผู้รับเงิน / ผู้เอาประกัน",
      payeeName: record.product === "PA" ? (record.school || record.payee || "-") : record.insured,
      contactLabel: record.product === "PA" ? "ครูผู้ประสานงาน" : "ผู้ติดต่อ",
      contactName: record.contactName || record.insured,
      contactPhone: record.contactPhone || "-",
      bankName: record.bank,
      bankAccount: record.account,
      bankOwner: record.payee,
      amount: record.amount
    };
    if (status === "await_transfer_confirm") {
      const renderer = window.renderClaimEntryTransferConfirmModal;
      if (typeof renderer !== "function") return error("ไม่สามารถแสดงหน้าต่างยืนยันโอนเงิน");
      window.showModal(renderer(snapshot, "กรุณาตรวจสอบข้อมูลบัญชีและจำนวนเงินก่อนกดโอนเงิน"), "max-w-2xl");
      const button = $("claimModalBox")?.querySelector(".claim-entry-transfer-btn.primary");
      if (button) {
        button.removeAttribute("onclick");
        button.addEventListener("click", function () { confirmInitial(record.id); }, { once: true });
      }
    } else if (status === "await_limit_confirm") {
      const renderer = window.renderClaimEntryTransferConfirmModal;
      if (typeof renderer !== "function") return error("ไม่สามารถแสดงหน้าต่างยืนยันบันทึก");
      const warning = "ยอดเบิก " + money(record.amount) + " บาท เกินวงเงินของ " + (record.initiatorLevelId || legacyLevel(record.initiatorId) || "Level ที่เลือก") + " กรุณายืนยันบันทึกเพื่อรอโอนใน Monitor";
      const content = document.createElement("div");
      content.innerHTML = renderer(snapshot, warning);
      const dialog = content.querySelector(".claim-entry-transfer-modal");
      dialog.classList.add("cat-limit-confirmation");
      dialog.querySelector(".claim-entry-transfer-title > span:last-child").textContent = "เกินวงเงินที่ได้รับอนุญาต";
      const confirm = dialog.querySelector(".claim-entry-transfer-btn.primary");
      confirm.textContent = "ยืนยันบันทึก";
      confirm.removeAttribute("onclick");
      window.showModal(content.innerHTML, "max-w-2xl");
      $("claimModalBox")?.querySelector(".cat-limit-confirmation .claim-entry-transfer-btn.primary")?.addEventListener("click", function () { confirmInitial(record.id); }, { once: true });
    } else if (status === "pending_daily") {
      modal("รออนุมัติวงเงิน", '<p>ยอดโอนสะสมวันนี้รวมยอดเบิกเกิน 30,000 บาท รายการอยู่ใน Monitor ขยายวงเงิน สถานะ รอดำเนินการ</p>' + refs,
        '<button type="button" class="cat-btn primary" onclick="CLAIM_AGENT_TRANSFER.openExtend()">เปิด Monitor ขยายวงเงิน</button>', "warning");
    } else if (status === "pending_level") {
      modal("บันทึกรายการรอโอนแล้ว", '<p>รายการอยู่ใน Monitor แจ้งโอนเงิน สถานะ รอโอน</p>' + refs,
        '<button type="button" class="cat-btn primary" onclick="CLAIM_AGENT_TRANSFER.openTransfer()">เปิด Monitor แจ้งโอนเงิน</button>');
    } else if (status === "success") {
      modal("โอนเงินสำเร็จ (Demo)", '<p>ระบบจำลองการโอนเงินอัตโนมัติเรียบร้อยแล้ว</p>' + refs,
        '<button type="button" class="cat-btn primary" onclick="CLAIM_AGENT_TRANSFER.openTransfer()">ดูรายการโอนเงิน</button>');
    }
  }
  function createRecord(data, snapshot, chosenLevel) {
    const state = window.claimState || {};
    const count = snapshot.product === "PA" && typeof window.getPAClaimSummaryRows === "function" ? Math.max(1, window.getPAClaimSummaryRows().length) : 1;
    const refs = Array.from({ length: count }, (_, index) => refFor(data.nextId + index, snapshot.product));
    data.nextId += count;
    const dailyExceeded = dailyTotal(data, chosenLevel.level) + snapshot.amount > DAILY_LIMIT;
    const limitExceeded = !chosenLevel.allowed;
    const record = {
      id: "CAT" + refs[0].claim.replace(/\D/g, ""),
      claims: refs.map(item => item.claim), cases: refs.map(item => item.caseNo), pmc: "", pmcCandidate: refs[0].pmc,
      ...snapshot, status: dailyExceeded ? "pending_daily" : (limitExceeded ? "await_limit_confirm" : "await_transfer_confirm"),
      createdAt: new Date().toISOString(), initiatorLevelId: chosenLevel.level, transferLevelId: chosenLevel.level,
      dailyApprovalRequested: dailyExceeded, approvedBy: "", transferAt: ""
    };
    data.records.unshift(record);
    saveStore(data);
    state.__authorizedTransferId = record.id;
    if (snapshot.product === "PH") {
      state.createdConsiderationClaimCode = record.claims[0];
      if (typeof window.syncClaimEntryToCustomerConsideration === "function") window.syncClaimEntryToCustomerConsideration();
    }
    return record;
  }
  function refreshUnconfirmed(record, data, snapshot, chosenLevel) {
    if (!["await_transfer_confirm", "await_limit_confirm", "pending_level"].includes(record.status)) return record;
    const nextStatus = dailyTotal(data, chosenLevel.level) + snapshot.amount > DAILY_LIMIT
      ? "pending_daily"
      : (chosenLevel.overLimit ? "await_limit_confirm" : "await_transfer_confirm");
    const changed = record.status !== nextStatus || record.initiatorLevelId !== chosenLevel.level || record.amount !== snapshot.amount
      || record.account !== snapshot.account || record.bank !== snapshot.bank || record.payee !== snapshot.payee;
    if (!changed) return record;
    Object.assign(record, snapshot, {
      initiatorLevelId: chosenLevel.level,
      transferLevelId: chosenLevel.level,
      status: nextStatus,
      dailyApprovalRequested: nextStatus === "pending_daily"
    });
    saveStore(data);
    return record;
  }
  function begin() {
    if (!isCustomerGeneral()) return;
    const snapshot = recordSnapshot();
    if (!Number.isFinite(snapshot.amount) || snapshot.amount <= 0) return error("กรุณาระบุยอดเบิกมากกว่า 0 บาท");
    if (!snapshot.bank || !snapshot.account) return error("กรุณาตรวจสอบข้อมูลบัญชีรับเงิน");
    const levelId = $("catClaimActor")?.value || selectedLevelId;
    selectedLevelId = levelId;
    const result = resolve(levelId, snapshot.amount);
    if (!result.level || (!result.overLimit && !result.allowed)) return error(result.reason);
    try {
      const data = readStore();
      const existing = findCurrent(data);
      const record = existing ? refreshUnconfirmed(existing, data, snapshot, result) : createRecord(data, snapshot, result);
      showInitialResult(record);
    } catch (cause) { error("บันทึกรายการไม่สำเร็จ: " + cause.message); }
  }
  function updateRecord(id, allowedStatuses, change) {
    const data = readStore();
    const record = data.records.find(item => item.id === id);
    if (!record || !allowedStatuses.includes(record.status)) return null;
    change(record, data);
    saveStore(data);
    return record;
  }
  function confirmInitial(id) {
    try {
      const data = readStore();
      const existing = data.records.find(item => item.id === id);
      if (!existing) return error("ไม่พบรายการนี้");
      if (existing.status === "await_limit_confirm") {
        const record = updateRecord(id, ["await_limit_confirm"], item => { item.pmc = item.pmcCandidate; item.status = "pending_level"; });
        if (record) { notice("บันทึกรายการรอโอนแล้ว"); showInitialResult(record); }
        return;
      }
      if (existing.status !== "await_transfer_confirm") return showInitialResult(existing);
      const transferLevelId = recordTransferLevel(existing) || selectedLevelId;
      const result = resolve(transferLevelId, existing.amount);
      if (!result.level || (!result.overLimit && !result.allowed)) return error(result.reason);
      const exceedsDaily = dailyTotal(data, transferLevelId) + existing.amount > DAILY_LIMIT;
      const record = updateRecord(id, ["await_transfer_confirm"], item => {
        item.transferLevelId = transferLevelId;
        if (exceedsDaily) { item.status = "pending_daily"; item.dailyApprovalRequested = true; }
        else if (!result.allowed) { item.status = "pending_level"; item.pmc = item.pmcCandidate; }
        else { item.status = "success"; item.pmc = item.pmcCandidate; item.transferAt = new Date().toISOString(); }
      });
      if (record) { notice(record.status === "success" ? "โอนเงินสำเร็จ (Demo)" : "บันทึกรายการรอดำเนินการแล้ว"); showInitialResult(record); }
    } catch (cause) { error("ทำรายการไม่สำเร็จ: " + cause.message); }
  }
  function pay(id) {
    const result = payFromTracking(id, selectedLevelId);
    if (!result.ok) return error(result.reason);
    notice(result.status === "pending_daily" ? "ยอดสะสมเกิน 30,000 บาท ส่งไปรออนุมัติวงเงินแล้ว" : "โอนเงินสำเร็จ (Demo)", result.status === "pending_daily" ? "warning" : "success");
    showInitialResult(result.record);
  }
  function approve(id) {
    try {
      const result = resolve(selectedLevelId, 1);
      if (!result.allowed || result.level !== "L5") return error("การอนุมัติยอดสะสมเกิน 30,000 บาทต้องเลือก Authorize Level L5 ที่ใช้งานอยู่");
      const data = readStore();
      const record = data.records.find(item => item.id === id);
      if (!record || record.status !== "pending_daily") return error("รายการนี้ไม่อยู่ในสถานะรอดำเนินการ");
      const amountResult = resolve(selectedLevelId, record.amount);
      if (!amountResult.allowed) return error(amountResult.reason);
      const updated = updateRecord(id, ["pending_daily"], item => {
        item.approvedLevelId = selectedLevelId;
        item.transferLevelId = recordTransferLevel(item) || selectedLevelId;
        item.pmc = item.pmc || item.pmcCandidate;
        item.status = "success";
        item.transferAt = new Date().toISOString();
      });
      if (updated) { notice("อนุมัติและโอนเงินสำเร็จ (Demo)"); showInitialResult(updated); }
    } catch (cause) { error("อนุมัติไม่สำเร็จ: " + cause.message); }
  }
  function openTransfer() { window.closeModal(); if (typeof window.showTransferTrackingPage === "function") window.showTransferTrackingPage(); renderQueues(); }
  function openExtend() { window.closeModal(); $("submenuExtendLimit")?.click(); renderQueues(); }
  function resume(id) {
    try {
      const record = readStore().records.find(item => item.id === id);
      if (!record) return error("ไม่พบรายการนี้");
      showInitialResult(record);
    } catch (cause) { error("อ่านรายการไม่สำเร็จ: " + cause.message); }
  }

  function insertActorControl() {
    const page = $("paymentPage"), actions = $("primaryActionBtn")?.parentElement;
    if (!page || !actions) return;
    let panel = $("catClaimActorPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "catClaimActorPanel";
      panel.className = "cat-actor-panel";
      panel.innerHTML = '<div class="cat-actor-copy"><strong>เลือก Level ของพนักงาน <span class="cat-demo-tag">แสดงเฉพาะ Demo</span></strong><small>เลือก Level ที่พนักงานได้รับสิทธิ์ เพื่อทดลองการแจ้งเตือนวงเงิน</small></div><select id="catClaimActor" aria-label="เลือก Level ของพนักงาน"></select><div id="catClaimLevelNotice" class="cat-level-preview neutral" role="status" aria-live="polite"></div>';
      actions.before(panel);
      panel.querySelector("select").addEventListener("change", event => { selectedLevelId = event.target.value; updateLevelPreview(); });
    }
    panel.hidden = !isCustomerGeneral();
    if (!panel.hidden) { panel.querySelector("select").innerHTML = levelOptions(); updateLevelPreview(); }
  }
  function ensureMonitor(pageId, sectionId, title) {
    const page = $(pageId);
    if (!page || $(sectionId)) return;
    const section = document.createElement("section");
    section.id = sectionId;
    section.className = "cat-monitor-card";
    section.innerHTML = '<header><div><h3>' + title + ' <span class="cat-mock-badge">แสดงเฉพาะ Demo</span></h3><p>รายการจาก แจ้งเคลมลูกค้า ตามเงื่อนไขวงเงิน</p></div><label>Level ของพนักงานสำหรับดำเนินการ<select class="cat-monitor-actor" aria-label="Level ของพนักงานสำหรับดำเนินการ"></select></label></header><div class="cat-monitor-tools"><label><span class="material-icons-round">search</span><input type="search" placeholder="ค้นหาเลขที่ CL, PMC หรือชื่อผู้เอาประกัน" aria-label="ค้นหารายการจากแจ้งเคลมลูกค้า"></label><span class="cat-monitor-count"></span></div><div class="cat-monitor-scroll"><table><thead><tr><th>เลขที่ CL / PMC</th><th>ผู้เอาประกัน</th><th>ยอดเบิก</th><th>Level ที่แจ้งเคลม</th><th>สถานะ</th><th>ดำเนินการ</th></tr></thead><tbody></tbody></table></div><div class="cat-monitor-pager"></div>';
    page.insertBefore(section, page.firstElementChild);
    section.querySelector(".cat-monitor-actor").addEventListener("change", event => { selectedLevelId = event.target.value; document.querySelectorAll(".cat-monitor-actor").forEach(select => { select.value = selectedLevelId; }); if ($("catClaimActor")) $("catClaimActor").value = selectedLevelId; updateLevelPreview(); });
    section.querySelector('input[type="search"]').addEventListener("input", () => { extendPage = 1; renderQueues(); });
    section.addEventListener("click", event => {
      const button = event.target.closest("[data-cat-action]");
      if (!button) return;
      if (button.dataset.catAction === "approve") approve(button.dataset.catId);
      if (button.dataset.catAction === "resume") resume(button.dataset.catId);
      if (button.dataset.catAction === "page") { extendPage = Number(button.dataset.page); renderQueues(); }
    });
  }
  function renderMonitor(sectionId, rows, action) {
    const section = $(sectionId);
    if (!section) return;
    section.querySelector(".cat-monitor-actor").innerHTML = levelOptions();
    const query = section.querySelector('input[type="search"]').value.trim().toLocaleLowerCase("th-TH");
    const filtered = rows.filter(item => [item.claims.join(" "), item.pmc, item.insured].some(value => String(value || "").toLocaleLowerCase("th-TH").includes(query)));
    const pages = Math.max(1, Math.ceil(filtered.length / 10));
    let page = extendPage;
    page = Math.max(1, Math.min(page, pages));
    extendPage = page;
    section.querySelector(".cat-monitor-count").textContent = filtered.length + " รายการ";
    section.querySelector("tbody").innerHTML = filtered.length ? filtered.slice((page - 1) * 10, page * 10).map(item => {
      const awaiting = item.status === "await_transfer_confirm" || item.status === "await_limit_confirm";
      const label = item.status === "success" ? "โอนสำเร็จ" : item.status === "pending_daily" ? "รอดำเนินการ" : awaiting ? "รอยืนยัน" : "รอโอน";
      const button = awaiting ? '<button type="button" class="cat-btn primary" data-cat-action="resume" data-cat-id="' + esc(item.id) + '">ดำเนินการต่อ</button>' : item.status === action.status ? '<button type="button" class="cat-btn primary" data-cat-action="' + action.name + '" data-cat-id="' + esc(item.id) + '">' + action.label + '</button>' : "—";
      return '<tr><td data-label="เลขที่ CL / PMC"><div class="cat-cell-value"><strong>' + esc(item.claims.join(", ")) + '</strong><small>' + esc(item.pmc || "ยังไม่สร้าง PMC") + '</small></div></td><td data-label="ผู้เอาประกัน"><div class="cat-cell-value">' + esc(item.insured) + '<small>' + esc(item.branch) + (item.authorizationSample ? ' · ข้อมูลตัวอย่าง' : '') + '</small></div></td><td data-label="ยอดเบิก" class="cat-money"><div class="cat-cell-value">' + money(item.amount) + ' บาท</div></td><td data-label="Level ที่แจ้งเคลม"><div class="cat-cell-value">' + esc(item.initiatorLevelId || legacyLevel(item.initiatorId) || "—") + '</div></td><td data-label="สถานะ"><div class="cat-cell-value"><span class="cat-status ' + (item.status === "success" ? "done" : "wait") + '">' + label + '</span>' + (item.authorizationSample && item.status === "pending_level" ? '<small>ยอดเบิกเกินวงเงิน L1 · เลือก Level ที่มีวงเงินเพียงพอก่อนโอน</small>' : '') + '</div></td><td data-label="ดำเนินการ"><div class="cat-cell-value">' + button + '</div></td></tr>';
    }).join("") : '<tr><td colspan="6" class="cat-empty">ยังไม่มีรายการที่ตรงกับการค้นหา</td></tr>';
    section.querySelector(".cat-monitor-pager").innerHTML = '<span>แสดง ' + (filtered.length ? (page - 1) * 10 + 1 : 0) + '–' + Math.min(page * 10, filtered.length) + ' จาก ' + filtered.length + ' รายการ</span><div><button type="button" data-cat-action="page" data-page="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + '>ก่อนหน้า</button><span>' + page + ' / ' + pages + '</span><button type="button" data-cat-action="page" data-page="' + (page + 1) + '"' + (page === pages ? " disabled" : "") + '>ถัดไป</button></div>';
  }
  function renderQueues() {
    let data;
    try { data = readStore(); } catch (_) { return; }
    renderMonitor("catExtendMonitor", data.records.filter(item => item.dailyApprovalRequested), { status: "pending_daily", name: "approve", label: "อนุมัติ" });
  }
  function init() {
    ensureMonitor("extendLimitPage", "catExtendMonitor", "Monitor ขยายวงเงิน");
    insertActorControl();
    try { ensureAuthorizationSample(); } catch (cause) { notice("โหลดรายการตัวอย่างไม่สำเร็จ: " + cause.message, "warning"); }
    renderQueues();
    document.addEventListener("input", event => { if (event.target && event.target.id === "transferAmount") updateLevelPreview(); });
  }
  const originalConfirm = window.showClaimEntryTransferConfirmModal;
  window.showClaimEntryTransferConfirmModal = function () {
    if (!isCustomerGeneral()) return typeof originalConfirm === "function" ? originalConfirm.apply(this, arguments) : undefined;
    begin();
  };
  const originalRender = window.renderPaymentPage;
  if (typeof originalRender === "function") window.renderPaymentPage = function () { const result = originalRender.apply(this, arguments); setTimeout(insertActorControl, 0); return result; };
  const originalOpen = window.openClaimEntry;
  if (typeof originalOpen === "function") window.openClaimEntry = function () { const result = originalOpen.apply(this, arguments); if (window.claimState) window.claimState.__authorizedTransferId = ""; return result; };
  window.CLAIM_AGENT_TRANSFER = Object.freeze({ begin, confirmInitial, pay, payFromTracking, evaluateTracking, trackingRows, approve, resume, openTransfer, openExtend, readStore, dailyTotal });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
