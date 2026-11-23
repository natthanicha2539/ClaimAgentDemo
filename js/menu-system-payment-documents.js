/* ตั้งค่าระบบ > จัดการเอกสารโอนเงิน: browser-only PDF and DocStorage demo. */
(function () {
  "use strict";
  const records = window.ClaimAgentPaymentDocumentMocks || [];
  const initialQueue = records.filter(record => record.debitDate === "2026-11-19").map(record => record.pmt);
  const storageKey = "claimagent.payment-documents.v1";
  const importStorageKey = "claimagent.payment-documents.imports.v1";
  const urls = new Map();
  const generating = new Set();
  const uploading = new Set();
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = value => Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let statuses = {};
  let batches = [];
  let activeBatchId = "";
  let activeTab = "queue";
  let importBusy = false;
  let appliedFrom = "";
  let appliedTo = "";
  let pageSize = 10;
  let currentPage = 1;
  let progressDialog = null;
  let progressTimer = null;
  let uploadBodyOverflow = "";

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) statuses = stored;
  } catch (_) { /* The demo remains usable without browser storage. */ }
  try {
    const stored = JSON.parse(localStorage.getItem(importStorageKey) || "[]");
    if (Array.isArray(stored)) batches = stored.filter(batch => batch && typeof batch.id === "string" && Array.isArray(batch.rows)).slice(0, 1);
    activeBatchId = batches[0]?.id || "";
  } catch (_) { /* The demo remains usable without browser storage. */ }

  function saveBatches() {
    try { localStorage.setItem(importStorageKey, JSON.stringify(batches)); } catch (_) { /* Session state still works. */ }
  }
  function activeBatch() { return batches.find(batch => batch.id === activeBatchId); }

  function saveStatuses() {
    try { localStorage.setItem(storageKey, JSON.stringify(statuses)); } catch (_) { /* Session state still works. */ }
  }
  function statusFor(pmt) {
    const stored = statuses[pmt];
    return stored && ["success", "failed"].includes(stored.status) ? stored : { status: "pending", attempts: 0, reason: "" };
  }
  function labelFor(status) {
    return { pending: "รออัปโหลด", uploading: "กำลังอัปโหลด", failed: "อัปโหลดไม่สำเร็จ", success: "อัปโหลดสำเร็จ" }[status] || "รออัปโหลด";
  }
  function todayBangkok() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function updateDateMax() {
    const today = todayBangkok();
    $("pdocFromDate").max = today;
    $("pdocToDate").max = today;
    return today;
  }
  function pendingRecords() {
    const queuedPmts = initialQueue;
    const pendingAll = queuedPmts.map(pmt => records.find(record => record.pmt === pmt)).filter(record => record && statusFor(record.pmt).status !== "success");
    const pending = pendingAll.filter(record => (!appliedFrom || record.debitDate >= appliedFrom) && (!appliedTo || record.debitDate <= appliedTo));
    return { pending, pendingAll };
  }
  function render() {
    const { pending, pendingAll } = pendingRecords();
    const pageCount = Math.max(1, Math.ceil(pending.length / pageSize));
    currentPage = Math.max(1, Math.min(currentPage, pageCount));
    const start = (currentPage - 1) * pageSize;
    const visible = pending.slice(start, start + pageSize);
    $("pdocUploadCountValue").textContent = String(pending.length);
    $("pdocPageSelect").innerHTML = Array.from({ length: pageCount }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("");
    $("pdocPageSelect").value = String(currentPage);
    $("pdocPageSize").value = String(pageSize);
    $("pdocPageRange").textContent = pending.length ? `${start + 1}-${Math.min(start + pageSize, pending.length)} จาก ${pending.length}` : "0-0 จาก 0";
    $("pdocPrevPage").disabled = currentPage === 1;
    $("pdocNextPage").disabled = currentPage === pageCount;
    $("pdocUploadEmpty").querySelector("strong").textContent = pendingAll.length && !pending.length ? "ไม่พบรายการในช่วงวันที่ที่เลือก" : "ไม่มีรายการรออัปโหลด";
    $("pdocUploadEmpty").hidden = pending.length > 0;
    $("pdocUploadTable").hidden = pending.length === 0;
    $("pdocUploadRows").innerHTML = visible.length ? visible.map((record, index) => {
      const state = statusFor(record.pmt);
      const status = uploading.has(record.pmt) ? "uploading" : state.status;
      return `<tr><td>${start + index + 1}</td><td class="pdoc-ref">${esc(record.cc)}</td><td>${esc(record.claim)}</td><td class="pdoc-ref">${esc(record.pmt)}</td><td>${esc(record.documentNo || "—")}</td><td><span class="pdoc-status ${status}">${labelFor(status)}</span>${state.reason && status === "failed" ? `<small class="pdoc-failure">${esc(state.reason)}</small>` : ""}</td><td><div class="pdoc-row-actions"><button type="button" class="pdoc-btn ${status === "failed" ? "pdoc-retry-btn" : "pdoc-upload-btn"}" data-action="upload" data-pmt="${esc(record.pmt)}" ${status === "uploading" ? "disabled" : ""}><span class="material-icons-round" aria-hidden="true">${status === "failed" ? "refresh" : "cloud_upload"}</span>${status === "uploading" ? "กำลังอัปโหลด..." : status === "failed" ? "อัปโหลดใหม่" : "อัปโหลด"}</button></div></td></tr>`;
    }).join("") : "";
    renderImports();
  }

  function renderImports() {
    const batch = activeBatch();
    const rows = batch?.rows || [];
    const valid = rows.filter(row => row.pmt && !row.error);
    const ready = valid.filter(row => row.status !== "success");
    $("pdocBatchSummary").textContent = batch ? `${rows.length} รายการ · รออัปโหลด ${ready.length}` : "";
    $("pdocUploadAll").disabled = importBusy || !ready.length;
    $("pdocImportEmpty").hidden = rows.length > 0;
    $("pdocImportTable").hidden = rows.length === 0;
    $("pdocImportRows").innerHTML = rows.map((row, index) => {
      const state = row.error ? "failed" : row.status === "success" ? "success" : row.status === "failed" ? "failed" : "pending";
      const label = row.error ? "ข้อมูลไม่ถูกต้อง" : row.status === "success" ? "อัปโหลดสำเร็จ" : row.status === "failed" ? "อัปโหลดไม่สำเร็จ" : "รออัปโหลด";
      const issue = row.error || row.reason || "";
      return `<tr><td>${index + 1}</td><td class="pdoc-ref">${esc(row.cc || "—")}</td><td>${esc(row.cl || "—")}</td><td class="pdoc-ref">${esc(row.pmt || "—")}</td><td>${esc(row.documentNo || "—")}</td><td><span class="pdoc-status ${state}">${label}</span>${issue ? `<small class="pdoc-failure">${esc(issue)}</small>` : ""}</td><td><div class="pdoc-row-actions">${row.pmt && !row.error && row.status !== "success" ? `<button type="button" class="pdoc-btn pdoc-upload-btn" data-import-action="upload" data-row="${index}" ${importBusy ? "disabled" : ""}>${row.status === "failed" ? "อัปโหลดใหม่" : "อัปโหลด"}</button>` : ""}</div></td></tr>`;
    }).join("");
  }

  function drawReport(record, entries, pageNo, pageCount, printedAt) {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 990;
    const ctx = canvas.getContext("2d");
    const blue = "#135cb5";
    const dark = "#15314c";
    const total = record.details.reduce((sum, item) => sum + item.amount, 0);
    const text = (value, x, y, size = 20, color = dark, weight = "normal", align = "left") => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px "TH Sarabun New", Sarabun, sans-serif`;
      ctx.textAlign = align;
      ctx.fillText(String(value), x, y);
    };
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, 1400, 990);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.roundRect(26, 22, 1348, 936, 20); ctx.fill();
    text("✚  สยามสไมล์", 72, 90, 31, "#00a1cc", "bold");
    ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(700, 139, 32, 0, Math.PI * 2); ctx.fill();
    text("฿", 700, 151, 30, "#fff", "bold", "center");
    text("Payment Detail Complete Transaction Report", 700, 222, 37, blue, "normal", "center");
    text(record.pmt, 700, 262, 34, blue, "bold", "center");
    ctx.strokeStyle = "#e1e7ed"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(735, 309); ctx.lineTo(735, 620); ctx.stroke();
    const fields = [
      ["Account No :", record.accountNo], ["Name Mapping Account No :", record.accountName],
      ["Bank :", record.bank], ["TransRefNo :", record.transRef],
      ["Net Transaction Amount :", money(total)]
    ];
    fields.forEach((field, index) => {
      const y = 356 + index * 57;
      ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(105, y - 8, 20, 0, Math.PI * 2); ctx.fill();
      text(["▣", "▤", "▥", "▧", "฿"][index], 105, y, 20, "#fff", "bold", "center");
      text(field[0], 153, y, 22, blue, "bold");
      text(field[1], 470, y, 22, dark);
    });
    const debit = record.debitDate.split("-").reverse().join("/");
    const dateParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric" }).format(printedAt);
    const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(printedAt);
    [["Debit Date :", debit, 795, 382], ["Print Date :", dateParts, 1090, 382], ["Debit Time :", record.debitTime, 795, 535], ["Print Time :", timeParts, 1090, 535]].forEach(field => {
      ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(field[2], field[3] - 6, 21, 0, Math.PI * 2); ctx.fill();
      text("●", field[2], field[3] + 1, 15, "#fff", "bold", "center");
      text(field[0], field[2] + 44, field[3], 25, blue, "bold");
      text(field[1], field[2] + 44, field[3] + 27, 22, dark);
    });
    ctx.fillStyle = blue; ctx.fillRect(66, 643, 223, 39);
    text("Payment Detail", 87, 671, 23, "#fff", "bold");
    ctx.fillStyle = blue; ctx.fillRect(84, 714, 1232, 51);
    const headers = [["Claim No.", 104], ["Customer Name", 330], ["Transaction Amount", 726], ["Narrative", 906], ["Approved Amount", 1115]];
    headers.forEach(header => text(header[0], header[1], 748, 21, "#fff", "bold"));
    entries.forEach((item, index) => {
      const y = 798 + index * 39;
      text(item.claimNo, 104, y, 19);
      text(item.customerName, 330, y, 19);
      text(money(item.amount), 861, y, 19, dark, "normal", "right");
      text(item.narrative, 906, y, 19);
      text(money(item.amount), 1290, y, 19, dark, "normal", "right");
    });
    const totalY = 818 + entries.length * 39;
    ctx.fillStyle = "#e7f1fb"; ctx.fillRect(84, totalY - 22, 1232, 42);
    text(pageNo === pageCount ? "Grand Total" : "Subtotal", 103, totalY + 5, 21, blue, "bold");
    const pageTotal = entries.reduce((sum, item) => sum + item.amount, 0);
    text(money(pageNo === pageCount ? total : pageTotal), 861, totalY + 5, 21, blue, "bold", "right");
    text(money(pageNo === pageCount ? total : pageTotal), 1290, totalY + 5, 21, blue, "bold", "right");
    text(`เอกสารตัวอย่าง · ${pageNo} / ${pageCount}`, 1308, 933, 17, "#6d7d90", "normal", "right");
    return canvas;
  }

  function makePdf(canvases) {
    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [0];
    let length = 0;
    const put = bytes => { parts.push(bytes); length += bytes.length; };
    const write = value => put(encoder.encode(value));
    const object = (number, content) => { offsets[number] = length; write(`${number} 0 obj\n${content}\nendobj\n`); };
    write("%PDF-1.4\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    const pageRefs = canvases.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
    object(2, `<< /Type /Pages /Kids [${pageRefs}] /Count ${canvases.length} >>`);
    canvases.forEach((canvas, i) => {
      const pageId = 3 + i * 3, contentId = pageId + 1, imageId = pageId + 2;
      object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      const commands = "q 842 0 0 595 0 0 cm /Im0 Do Q\n";
      object(contentId, `<< /Length ${commands.length} >>\nstream\n${commands}endstream`);
      const base64 = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      offsets[imageId] = length;
      write(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
      put(bytes);
      write("\nendstream\nendobj\n");
    });
    const startXref = length;
    write(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
    for (let i = 1; i < offsets.length; i++) write(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    write(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }

  async function generate(record) {
    if (generating.has(record.pmt) || uploading.has(record.pmt)) return;
    generating.add(record.pmt);
    try {
      if (document.fonts && document.fonts.load) await document.fonts.load('22px "TH Sarabun New"');
      const chunks = [];
      for (let i = 0; i < record.details.length; i += 2) chunks.push(record.details.slice(i, i + 2));
      const printedAt = new Date();
      const canvases = chunks.map((entries, index) => drawReport(record, entries, index + 1, chunks.length, printedAt));
      const blob = makePdf(canvases);
      const previous = urls.get(record.pmt);
      if (previous) URL.revokeObjectURL(previous);
      urls.delete(record.pmt);
      urls.set(record.pmt, URL.createObjectURL(blob));
    } finally {
      generating.delete(record.pmt);
      render();
    }
  }
  function closeUploadProgress(pmt) {
    if (!progressDialog) return;
    clearTimeout(progressTimer);
    progressDialog.remove();
    progressDialog = null;
    document.body.style.overflow = uploadBodyOverflow;
    render();
    const nextButton = pmt ? document.querySelector(`#${activeTab === "import" ? "pdocImportRows" : "pdocUploadRows"} [data-pmt="${pmt}"][data-action="upload"]`) : null;
    (nextButton || (activeTab === "import" ? $("pdocUploadAll") : $("pdocQueueTab"))).focus();
  }
  function showUploadProgress(pmt, total = 1) {
    const bulk = pmt == null;
    uploadBodyOverflow = document.body.style.overflow;
    progressDialog = document.createElement("div");
    progressDialog.className = "pdoc-dialog-backdrop pdoc-progress-backdrop";
    progressDialog.innerHTML = `<div class="pdoc-progress-dialog" role="dialog" aria-modal="true" aria-labelledby="pdocProgressTitle" aria-describedby="pdocProgressDescription" tabindex="-1"><span class="material-icons-round pdoc-progress-mark" aria-hidden="true">cloud_upload</span><h3 id="pdocProgressTitle">${bulk ? "กำลังอัปโหลดทั้งหมด" : "กำลังอัปโหลดเอกสาร"}</h3><p id="pdocProgressDescription">${bulk ? `0 จาก ${total} รายการ` : `เลข PMT ${esc(pmt)}`}</p><div class="pdoc-progress-track" role="progressbar" aria-label="ความคืบหน้าการอัปโหลด" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${bulk ? 0 : 10}"><span class="pdoc-progress-fill" style="width:${bulk ? 0 : 10}%"></span></div><p class="pdoc-progress-note" aria-live="polite">กำลังส่งเอกสารเข้า DocStorage Demo</p><button type="button" class="pdoc-btn pdoc-outline pdoc-progress-close" hidden>ปิด</button></div>`;
    document.body.appendChild(progressDialog);
    document.body.style.overflow = "hidden";
    progressDialog.querySelector(".pdoc-progress-dialog").focus();
    progressDialog.querySelector(".pdoc-progress-close").addEventListener("click", () => closeUploadProgress(pmt));
    if (!bulk) requestAnimationFrame(() => {
      if (!progressDialog) return;
      progressDialog.querySelector(".pdoc-progress-fill").style.width = "82%";
      progressDialog.querySelector(".pdoc-progress-track").setAttribute("aria-valuenow", "82");
    });
  }
  function simulateUpload(record) {
    const attempts = statusFor(record.pmt).attempts + 1;
    statuses[record.pmt] = record.failFirstUpload && attempts === 1
      ? { status: "failed", attempts, reason: "DocStorage Demo ปฏิเสธรายการตัวอย่าง กรุณาอัปโหลดใหม่" }
      : { status: "success", attempts, reason: "" };
    saveStatuses();
    return statuses[record.pmt];
  }
  function showUploadResult(pmt, state, imported = false) {
    if (!progressDialog) return;
    const success = state.status === "success";
    progressDialog.classList.toggle("is-success", success);
    progressDialog.classList.toggle("is-failed", !success);
    progressDialog.querySelector(".pdoc-progress-mark").textContent = success ? "check_circle" : "error";
    progressDialog.querySelector("#pdocProgressTitle").textContent = success ? "อัปโหลดสำเร็จ" : "อัปโหลดไม่สำเร็จ";
    progressDialog.querySelector("#pdocProgressDescription").textContent = success ? (imported ? `เลข PMT ${pmt} อัปโหลดสำเร็จแล้ว` : `เลข PMT ${pmt} ถูกนำออกจากรายการรออัปโหลดแล้ว`) : state.reason;
    progressDialog.querySelector(".pdoc-progress-fill").style.width = "100%";
    progressDialog.querySelector(".pdoc-progress-track").setAttribute("aria-valuenow", "100");
    const note = progressDialog.querySelector(".pdoc-progress-note");
    note.hidden = success;
    if (!success) note.textContent = `เลข PMT ${pmt} ยังอยู่ในตาราง สามารถอัปโหลดใหม่ได้`;
    if (success) progressTimer = setTimeout(() => closeUploadProgress(pmt), 3000);
    else {
      const close = progressDialog.querySelector(".pdoc-progress-close");
      close.hidden = false;
      close.focus();
    }
  }
  async function upload(pmt) {
    const record = records.find(item => item.pmt === pmt);
    if (!record || progressDialog || uploading.has(pmt) || statusFor(pmt).status === "success") return;
    uploading.add(pmt);
    const feedback = $("pdocUploadFeedback");
    feedback.hidden = true;
    showUploadProgress(pmt);
    render();
    await new Promise(resolve => setTimeout(resolve, 700));
    const result = simulateUpload(record);
    uploading.delete(pmt);
    render();
    showUploadResult(pmt, result);
    if (result.status === "failed") {
      feedback.textContent = `อัปโหลด ${pmt} ไม่สำเร็จ · ${result.reason}`;
      feedback.classList.add("failed");
      feedback.hidden = false;
    }
  }
  function importFeedback(message, failed = false) {
    const feedback = $("pdocImportFeedback");
    feedback.textContent = message;
    feedback.classList.toggle("failed", failed);
    feedback.hidden = false;
  }
  function setTab(tab) {
    activeTab = tab;
    for (const name of ["queue", "import"]) {
      const selected = name === tab;
      const button = $(name === "queue" ? "pdocQueueTab" : "pdocImportTab");
      $(name === "queue" ? "pdocQueuePanel" : "pdocImportPanel").hidden = !selected;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle("is-active", selected);
    }
    render();
  }
  async function importFile(event) {
    event.preventDefault();
    const file = $("pdocImportFile").files[0];
    if (!file || importBusy) return;
    importBusy = true;
    $("pdocImportSubmit").disabled = true;
    $("pdocImportFeedback").hidden = true;
    try {
      const data = await window.ClaimAgentPaymentDocumentXlsx.read(file);
      const seen = new Set();
      const rows = [];
      for (const item of data) {
        const claimRecords = records.filter(record => record.claim.toUpperCase() === item.cl);
        const legacyRecords = claimRecords.filter(record => record.legacyImport);
        const matches = legacyRecords.length ? legacyRecords : claimRecords.filter(record => record.cc.toUpperCase() === item.cc);
        const error = !item.cl ? `แถว ${item.number}: กรุณาระบุ CL` : !legacyRecords.length && !item.cc ? `แถว ${item.number}: กรุณาระบุ CC สำหรับเคลมทั่วไป` : !matches.length ? `แถว ${item.number}: ไม่พบรายการที่ตรงกับ ${legacyRecords.length ? "CL" : "CL และ CC"}` : "";
        if (error) { rows.push({ cl: item.cl, cc: item.cc, error }); continue; }
        for (const record of matches) {
          const key = `${record.cc}|${record.claim}|${record.pmt}`;
          if (seen.has(key)) { rows.push({ cl: item.cl, cc: item.cc, error: `แถว ${item.number}: รายการซ้ำในไฟล์` }); continue; }
          seen.add(key);
          rows.push({ cl: item.cl, cc: record.cc, pmt: record.pmt, documentNo: record.documentNo, status: "pending", attempts: 0, reason: "" });
        }
      }
      const createdAt = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
      const batch = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, createdAt, rows };
      batches = [batch];
      activeBatchId = batch.id;
      saveBatches();
      $("pdocImportForm").reset();
      importFeedback(`นำเข้า ${rows.length} รายการ`);
    } catch (cause) { importFeedback(cause.message || "ไม่สามารถนำเข้าไฟล์ได้", true); }
    finally { importBusy = false; $("pdocImportSubmit").disabled = false; render(); }
  }
  function simulateImportedUpload(record, row) {
    row.attempts = (row.attempts || 0) + 1;
    row.status = record.failFirstUpload && row.attempts === 1 ? "failed" : "success";
    row.reason = row.status === "failed" ? "DocStorage Demo ปฏิเสธรายการตัวอย่าง กรุณาอัปโหลดใหม่" : "";
    saveBatches();
    return row;
  }
  async function uploadImported(row) {
    if (!row?.pmt || row.error || row.status === "success" || importBusy || progressDialog) return;
    const record = records.find(item => item.pmt === row.pmt);
    if (!record) return;
    importBusy = true;
    showUploadProgress(row.pmt);
    render();
    let result;
    try {
      if (!urls.has(record.pmt)) await generate(record);
      await new Promise(resolve => setTimeout(resolve, 700));
      result = simulateImportedUpload(record, row);
    } catch (cause) {
      row.status = "failed";
      row.reason = cause.message || "เตรียมเอกสารไม่สำเร็จ";
      saveBatches();
      result = row;
    }
    importBusy = false;
    render();
    showUploadResult(row.pmt, result, true);
    if (result.status === "failed") importFeedback(`อัปโหลด ${row.pmt} ไม่สำเร็จ · ${result.reason}`, true);
  }
  async function uploadAll() {
    const batch = activeBatch();
    if (!batch || importBusy || progressDialog) return;
    const queue = batch.rows.filter(row => row.pmt && !row.error && row.status !== "success");
    if (!queue.length) return;
    importBusy = true;
    showUploadProgress(null, queue.length);
    render();
    const failed = [];
    for (const [index, row] of queue.entries()) {
      const record = records.find(item => item.pmt === row.pmt);
      try {
        if (!record) throw new Error("ไม่พบข้อมูลเอกสาร");
        if (!urls.has(record.pmt)) await generate(record);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (simulateImportedUpload(record, row).status === "failed") failed.push(row.pmt);
      } catch (cause) {
        row.status = "failed";
        row.reason = cause.message || "เตรียมเอกสารไม่สำเร็จ";
        saveBatches();
        failed.push(row.pmt);
      }
      const completed = index + 1;
      const percent = Math.round(completed / queue.length * 100);
      progressDialog.querySelector("#pdocProgressDescription").textContent = `อัปโหลดแล้ว ${completed} จาก ${queue.length} รายการ`;
      progressDialog.querySelector(".pdoc-progress-fill").style.width = `${percent}%`;
      progressDialog.querySelector(".pdoc-progress-track").setAttribute("aria-valuenow", String(percent));
      render();
    }
    importBusy = false;
    const success = failed.length === 0;
    progressDialog.classList.toggle("is-success", success);
    progressDialog.classList.toggle("is-failed", !success);
    progressDialog.querySelector(".pdoc-progress-mark").textContent = success ? "check_circle" : "error";
    progressDialog.querySelector("#pdocProgressTitle").textContent = success ? "อัปโหลดทั้งหมดสำเร็จ" : "อัปโหลดบางรายการไม่สำเร็จ";
    progressDialog.querySelector("#pdocProgressDescription").textContent = `สำเร็จ ${queue.length - failed.length} จาก ${queue.length} รายการ`;
    progressDialog.querySelector(".pdoc-progress-note").hidden = success;
    if (!success) progressDialog.querySelector(".pdoc-progress-note").textContent = `ยังรออัปโหลด: ${failed.join(", ")}`;
    if (success) progressTimer = setTimeout(() => closeUploadProgress(null), 3000);
    else {
      importFeedback(`อัปโหลดไม่สำเร็จ ${failed.length} รายการ · ${failed.join(", ")}`, true);
      const close = progressDialog.querySelector(".pdoc-progress-close");
      close.hidden = false;
      close.focus();
    }
    render();
  }
  function showPage() {
    updateDateMax();
    document.querySelectorAll("main .page, #monitorPage, #detailPage, #claimMonitorPage").forEach(page => { page.classList.add("hidden"); page.style.removeProperty("display"); });
    $("paymentDocumentsPage").classList.remove("hidden");
    $("systemSettingsSubmenu").classList.remove("hidden");
    $("menuSystemSettings").setAttribute("aria-expanded", "true");
    $("systemSettingsArrow").textContent = "expand_less";
    document.querySelectorAll("aside button[aria-current='page']").forEach(button => button.removeAttribute("aria-current"));
    $("submenuPaymentDocuments").setAttribute("aria-current", "page");
    $("pageTitle").textContent = "จัดการเอกสารโอนเงิน";
    $("pageSubtitle").textContent = "ตั้งค่าระบบ / จัดการเอกสารโอนเงิน";
    document.title = "จัดการเอกสารโอนเงิน — ClaimAgent";
    render();
    window.scrollTo(0, 0);
  }
  function init() {
    const today = updateDateMax();
    $("pdocFromDate").value = today;
    $("pdocToDate").value = today;
    appliedFrom = appliedTo = today;
    $("submenuPaymentDocuments").addEventListener("click", showPage);
    $("pdocQueueTab").addEventListener("click", () => setTab("queue"));
    $("pdocImportTab").addEventListener("click", () => setTab("import"));
    document.querySelector(".pdoc-tabs").addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = activeTab === "queue" ? "import" : "queue";
      setTab(next);
      $(next === "queue" ? "pdocQueueTab" : "pdocImportTab").focus();
    });
    $("pdocImportForm").addEventListener("submit", importFile);
    $("pdocUploadAll").addEventListener("click", uploadAll);
    $("pdocImportRows").addEventListener("click", async event => {
      const button = event.target.closest("[data-import-action]");
      if (!button || importBusy) return;
      const row = activeBatch()?.rows[Number(button.dataset.row)];
      if (!row) return;
      if (button.dataset.importAction === "upload") await uploadImported(row);
    });
    $("pdocPageSelect").addEventListener("change", event => { currentPage = Number(event.target.value) || 1; render(); });
    $("pdocPageSize").addEventListener("change", event => { pageSize = Number(event.target.value) || 10; currentPage = 1; render(); });
    $("pdocPrevPage").addEventListener("click", () => { currentPage -= 1; render(); });
    $("pdocNextPage").addEventListener("click", () => { currentPage += 1; render(); });
    $("pdocDateForm").addEventListener("focusin", updateDateMax);
    $("pdocDateForm").addEventListener("submit", event => {
      event.preventDefault();
      const today = updateDateMax();
      const from = $("pdocFromDate").value;
      const to = $("pdocToDate").value;
      const error = $("pdocDateError");
      if ((from && from > today) || (to && to > today)) {
        error.textContent = "ไม่สามารถเลือกวันที่ในอนาคตได้";
        error.hidden = false;
        (from > today ? $("pdocFromDate") : $("pdocToDate")).focus();
        return;
      }
      if ((from && !to) || (!from && to) || (from && to && from > to)) {
        error.textContent = from && to ? "จากวันที่โอนเงินต้องไม่เกินถึงวันที่" : "กรุณาระบุทั้งจากวันที่โอนเงินและถึงวันที่";
        error.hidden = false;
        return;
      }
      error.hidden = true;
      appliedFrom = from;
      appliedTo = to;
      currentPage = 1;
      render();
    });
    const onRowAction = event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const record = records.find(item => item.pmt === button.dataset.pmt);
      if (!record) return;
      if (button.dataset.action === "upload") upload(record.pmt);
    };
    $("pdocUploadRows").addEventListener("click", onRowAction);
    try { if (typeof claimPages !== "undefined" && !claimPages.includes("paymentDocumentsPage")) claimPages.push("paymentDocumentsPage"); } catch (_) { /* Shared navigation may be unavailable. */ }
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
  window.showPaymentDocumentsPage = showPage;
})();
