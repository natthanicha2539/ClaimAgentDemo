/* ============================================================
   menu-claim-entry-transfer-confirmation.js
   แจ้งเคลมทั่วไป: ยืนยันบัญชีโอนเงินก่อนสร้าง CL/CC/โอนเงิน
   ============================================================ */
(function () {
  "use strict";

  const EXCLUDED_COVERAGES = ["เสียชีวิต", "ทุพพลภาพ/สูญเสียอวัยวะ"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseAmount(value) {
    if (typeof window.parseMoney === "function") return Number(window.parseMoney(value || 0)) || 0;
    return Number(String(value || 0).replace(/,/g, "")) || 0;
  }

  function formatAmount(value) {
    const amount = parseAmount(value);
    if (typeof window.formatMoney === "function") return window.formatMoney(amount);
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function currentState() {
    return window.claimState || {};
  }

  function currentRow() {
    const state = currentState();
    return state.paPrimaryRow || state.row || {};
  }

  function isExcludedCoverage() {
    return EXCLUDED_COVERAGES.includes(String(currentState().coverageType || "").trim());
  }

  function isPA() {
    if (typeof window.currentProductType === "function") return window.currentProductType() === "PA";
    return String(currentRow().product || "").toUpperCase() === "PA";
  }

  function isGeneralClaimPaymentPage() {
    const paymentPage = document.getElementById("paymentPage");
    return !!paymentPage && !paymentPage.classList.contains("hidden") && !isExcludedCoverage();
  }

  function getTransferAmount() {
    const state = currentState();
    const inputAmount = document.getElementById("transferAmount")?.value;
    const amount = parseAmount(inputAmount || state.transferAmount || state.primaryClaimAmount || 0);
    state.transferAmount = amount;
    return amount;
  }

  function getPaymentSnapshot() {
    const row = currentRow();
    const pa = isPA();
    const name = row.name || (pa ? "โรงเรียนบ้านกำแพงเพ็ชร" : "นายกรภัทร วรวงศ์คุณากร");
    const payeeName = pa ? (row.school || "โรงเรียนบ้านกำแพงเพ็ชร") : name;
    const contactName = pa ? (row.coordinatorName || "นางกนก พันธรัญา") : name;
    const contactPhone = pa ? (row.coordinatorPhone || row.phone || "091-1232345") : (row.phone || "081-2345678");
    const bankName = pa ? (row.bankName || "กรุงไทย") : (row.bankName || "กรุงไทย");
    const bankAccount = pa ? (row.bankAccount || "1821000000") : (row.bankAccount || "5281137123");
    const bankOwner = pa ? (row.bankOwner || contactName) : (row.bankOwner || name);
    return {
      product: pa ? "PA" : "PH",
      payeeLabel: pa ? "ผู้รับเงิน / สถานศึกษา" : "ผู้รับเงิน / ผู้เอาประกัน",
      payeeName,
      contactLabel: pa ? "ครูผู้ประสานงาน" : "ผู้ติดต่อ",
      contactName,
      contactPhone,
      bankName,
      bankAccount,
      bankOwner,
      amount: getTransferAmount()
    };
  }

  function getClaimRefs() {
    const pa = isPA();
    if (pa && typeof window.getPAClaimTransferRefs === "function") {
      const refs = window.getPAClaimTransferRefs();
      if (Array.isArray(refs) && refs.length) return refs;
    }
    if (pa && typeof window.getPAClaimSummaryRows === "function") {
      const rows = window.getPAClaimSummaryRows();
      if (Array.isArray(rows) && rows.length > 1) {
        return rows.map((_, index) => `CLPA69050001${String(12 + index).padStart(2, "0")}`);
      }
    }
    return [pa ? "CLPA6905000112" : "CL6905000111"];
  }

  function caseRefFromClaim(claimRef, index) {
    const clean = String(claimRef || "").trim();
    if (/^CLPA/i.test(clean)) return clean.replace(/^CLPA/i, "CCPA") + "-01";
    if (/^CL/i.test(clean)) return clean.replace(/^CL/i, "CC") + "-01";
    return `CC690500011${index + 1}-01`;
  }

  function buildRefs() {
    const claimRefs = getClaimRefs();
    return {
      claims: claimRefs,
      cases: claimRefs.map(caseRefFromClaim),
      transfer: isPA() && claimRefs.length > 1 ? "CPG000193" : "CPG0001920"
    };
  }

  function injectStyle() {
    if (document.getElementById("claimEntryTransferConfirmStyle")) return;
    const style = document.createElement("style");
    style.id = "claimEntryTransferConfirmStyle";
    style.textContent = `
      #claimModalBox:has(.claim-entry-transfer-modal){width:min(780px,94vw)!important;max-width:780px!important;border-radius:18px!important}
      .claim-entry-transfer-modal{background:#fff;color:#334155}
      .claim-entry-transfer-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;border-bottom:1px solid #e3edf5;background:#fff}
      .claim-entry-transfer-title{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:900;color:#174b69}
      .claim-entry-transfer-title-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#e4f3ff;color:#0878bb}
      .claim-entry-transfer-close{display:grid;place-items:center;width:38px;height:38px;border-radius:999px;background:#b91c1c;color:#fff}
      .claim-entry-transfer-body{padding:18px 20px 20px}
      .claim-entry-transfer-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
      .claim-entry-transfer-info{border:1px solid #dbe7f3;border-radius:12px;background:#fbfdff;padding:12px 14px}
      .claim-entry-transfer-info small{display:block;margin-bottom:4px;color:#718396;font-size:12px;font-weight:800}
      .claim-entry-transfer-info strong{display:block;color:#164765;font-size:17px;font-weight:900;line-height:1.35}
      .claim-entry-transfer-account{display:grid;grid-template-columns:62px minmax(0,1fr) auto;align-items:center;gap:14px;border:1px solid #cfe0ed;border-radius:14px;background:#f8fbfd;padding:15px}
      .claim-entry-transfer-bank-icon{display:grid;place-items:center;width:58px;height:58px;border-radius:16px;background:#dff2ff;color:#0878bb}
      .claim-entry-transfer-bank-icon .material-icons-round{font-size:30px!important}
      .claim-entry-transfer-bank-detail{display:grid;gap:3px;font-size:14px;font-weight:700;color:#64748b;line-height:1.45}
      .claim-entry-transfer-bank-detail b{color:#334155}
      .claim-entry-transfer-amount{text-align:right;color:#0871b7;font-size:28px;font-weight:900;white-space:nowrap}
      .claim-entry-transfer-warning{display:flex;align-items:flex-start;gap:8px;margin-top:14px;border:1px solid #fde68a;border-radius:11px;background:#fff8c9;padding:10px 13px;color:#6b5b20;font-size:14px;font-weight:800;line-height:1.45}
      .claim-entry-transfer-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
      .claim-entry-transfer-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:44px;border-radius:10px;padding:0 20px;font-size:16px;font-weight:900}
      .claim-entry-transfer-btn.secondary{border:1px solid #cbd5e1;background:#fff;color:#475569}
      .claim-entry-transfer-btn.primary{border:1px solid #13803a;background:#16843b;color:#fff;box-shadow:0 7px 15px rgba(22,132,59,.18)}
      .claim-entry-process-list{display:grid;gap:10px;margin-top:14px}
      .claim-entry-process-row{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:12px;min-height:62px;border:1px solid #dbe5f0;border-radius:12px;background:#fff;padding:10px 13px}
      .claim-entry-process-row.is-running{border-color:#7dd3fc;background:#f0f9ff;box-shadow:0 0 0 3px rgba(14,165,233,.10)}
      .claim-entry-process-row.is-success{border-color:#bbf7d0;background:#f0fdf4}
      .claim-entry-process-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#eef2f7;color:#64748b}
      .claim-entry-process-row.is-running .claim-entry-process-icon{background:#dff2ff;color:#075f99}
      .claim-entry-process-row.is-success .claim-entry-process-icon{background:#dcfce7;color:#15803d}
      .claim-entry-process-name{display:block;color:#334155;font-size:16px;font-weight:900}
      .claim-entry-process-detail{display:block;margin-top:2px;color:#94a3b8;font-size:12px;font-weight:800}
      .claim-entry-process-status{display:inline-flex;align-items:center;gap:5px;border-radius:999px;background:#f1f5f9;color:#64748b;padding:5px 9px;font-size:12px;font-weight:900;white-space:nowrap}
      .claim-entry-process-row.is-running .claim-entry-process-status{background:#dff2ff;color:#075f99}
      .claim-entry-process-row.is-success .claim-entry-process-status{background:#dcfce7;color:#15803d}
      .claim-entry-transfer-success-refs{margin:15px auto 0;max-width:520px;overflow:hidden;border:1px solid #dbe5f0;border-radius:12px;background:#f8fafc;text-align:left}
      .claim-entry-transfer-ref-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;padding:10px 12px;border-bottom:1px solid #e5edf5;font-size:14px;font-weight:800}
      .claim-entry-transfer-ref-row:last-child{border-bottom:0}
      .claim-entry-transfer-ref-row span{color:#64748b}
      .claim-entry-transfer-ref-row b{color:#075f99;word-break:break-word}
      .claim-entry-spin{animation:claimEntrySpin .9s linear infinite}@keyframes claimEntrySpin{to{transform:rotate(360deg)}}
      @media(max-width:680px){.claim-entry-transfer-grid,.claim-entry-transfer-account{grid-template-columns:1fr}.claim-entry-transfer-amount{text-align:left;font-size:24px}.claim-entry-transfer-actions{flex-direction:column-reverse}.claim-entry-transfer-btn{width:100%}.claim-entry-process-row{grid-template-columns:36px 1fr}.claim-entry-process-status{grid-column:2;justify-self:start}.claim-entry-transfer-ref-row{grid-template-columns:1fr;gap:2px}}
    `;
    document.head.appendChild(style);
  }

  function showModal(html, maxWidth) {
    if (typeof window.showModal === "function") {
      window.showModal(html, maxWidth || "max-w-2xl");
      return;
    }
    const modal = document.getElementById("claimModal");
    const box = document.getElementById("claimModalBox");
    if (!modal || !box) return;
    box.innerHTML = html;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeModal() {
    if (typeof window.closeModal === "function") window.closeModal();
  }

  function renderConfirmModal(snapshot) {
    return `
      <div class="claim-entry-transfer-modal">
        <div class="claim-entry-transfer-head">
          <div class="claim-entry-transfer-title">
            <span class="claim-entry-transfer-title-icon"><span class="material-icons-round">account_balance_wallet</span></span>
            <span>ยืนยันบัญชีโอนเงิน</span>
          </div>
          <button type="button" class="claim-entry-transfer-close" onclick="closeModal()" aria-label="ปิด"><span class="material-icons-round">close</span></button>
        </div>
        <div class="claim-entry-transfer-body">
          <div class="claim-entry-transfer-grid">
            <div class="claim-entry-transfer-info"><small>${escapeHtml(snapshot.payeeLabel)}</small><strong>${escapeHtml(snapshot.payeeName)}</strong></div>
            <div class="claim-entry-transfer-info"><small>${escapeHtml(snapshot.contactLabel)} / เบอร์ติดต่อ</small><strong>${escapeHtml(snapshot.contactName)}<br>${escapeHtml(snapshot.contactPhone)}</strong></div>
          </div>
          <div class="claim-entry-transfer-account">
            <span class="claim-entry-transfer-bank-icon"><span class="material-icons-round">account_balance</span></span>
            <div class="claim-entry-transfer-bank-detail">
              <span>ธนาคาร : <b>${escapeHtml(snapshot.bankName)}</b></span>
              <span>เลขที่บัญชี : <b>${escapeHtml(snapshot.bankAccount)}</b></span>
              <span>ชื่อบัญชี : <b>${escapeHtml(snapshot.bankOwner)}</b></span>
            </div>
            <div class="claim-entry-transfer-amount">THB ${formatAmount(snapshot.amount)}</div>
          </div>
          <div class="claim-entry-transfer-warning"><span class="material-icons-round">info</span><span>กรุณาตรวจสอบข้อมูลบัญชีและจำนวนเงินให้ถูกต้องก่อนกดโอนเงิน ระบบจะสร้าง CL, สร้าง CC และทำรายการโอนเงิน</span></div>
          <div class="claim-entry-transfer-actions">
            <button type="button" class="claim-entry-transfer-btn secondary" onclick="closeModal()">ยกเลิก</button>
            <button type="button" class="claim-entry-transfer-btn primary" onclick="runClaimEntryTransferProcess()"><span class="material-icons-round">send</span>โอนเงิน</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderProcessModal(refs) {
    const steps = [
      { name: "สร้างเลขที่เคลม (CL)", detail: refs.claims.length > 1 ? `สร้าง ${refs.claims.length} รายการ` : refs.claims[0], icon: "description" },
      { name: "สร้างเลขที่ Case (CC)", detail: refs.cases.length > 1 ? `สร้าง ${refs.cases.length} รายการ` : refs.cases[0], icon: "badge" },
      { name: "โอนเงิน", detail: refs.transfer, icon: "account_balance_wallet" }
    ];
    return `
      <div class="claim-entry-transfer-modal">
        <div class="claim-entry-transfer-head">
          <div class="claim-entry-transfer-title">
            <span class="claim-entry-transfer-title-icon"><span class="material-icons-round claim-entry-spin">sync</span></span>
            <span>กำลังดำเนินการ</span>
          </div>
        </div>
        <div class="claim-entry-transfer-body">
          <div class="claim-entry-process-list">
            ${steps.map((step, index) => `
              <div id="claimEntryProcessRow${index}" class="claim-entry-process-row">
                <span class="claim-entry-process-icon"><span class="material-icons-round">${step.icon}</span></span>
                <span><span class="claim-entry-process-name">${escapeHtml(step.name)}</span><span class="claim-entry-process-detail">${escapeHtml(step.detail)}</span></span>
                <span id="claimEntryProcessStatus${index}" class="claim-entry-process-status"><span class="material-icons-round !text-base">schedule</span>รอดำเนินการ</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderSuccessModal(refs) {
    const claimText = refs.claims.join(", ");
    const caseText = refs.cases.join(", ");
    return `
      <div class="claim-entry-transfer-modal">
        <div class="claim-entry-transfer-head">
          <div class="claim-entry-transfer-title">
            <span class="claim-entry-transfer-title-icon" style="background:#dcfce7;color:#15803d"><span class="material-icons-round">check_circle</span></span>
            <span>ทำรายการสำเร็จ</span>
          </div>
          <button type="button" class="claim-entry-transfer-close" onclick="closeModal()" aria-label="ปิด"><span class="material-icons-round">close</span></button>
        </div>
        <div class="stp-final-status">
          <div class="stp-final-icon"><span class="material-icons-round !text-5xl">check</span></div>
          <h3>ทำรายการสำเร็จ</h3>
          <p>ระบบสร้าง CL, สร้าง CC และทำรายการโอนเงินเรียบร้อยแล้ว</p>
          <div class="claim-entry-transfer-success-refs">
            <div class="claim-entry-transfer-ref-row"><span>เลขที่เคลม (CL)</span><b>${escapeHtml(claimText)}</b></div>
            <div class="claim-entry-transfer-ref-row"><span>เลขที่ Case (CC)</span><b>${escapeHtml(caseText)}</b></div>
            <div class="claim-entry-transfer-ref-row"><span>เลขที่การโอนเงิน</span><b>${escapeHtml(refs.transfer)}</b></div>
          </div>
          <button type="button" onclick="closeModal();showClaimMonitor()" class="mt-5 h-11 rounded-lg bg-brand-600 px-10 font-extrabold text-white">ปิด</button>
        </div>
      </div>
    `;
  }

  function applyGeneralClaimAction() {
    if (!isGeneralClaimPaymentPage()) return;
    const button = document.getElementById("primaryActionBtn");
    if (!button) return;
    button.innerHTML = '<span class="material-icons-round align-middle">save</span> บันทึกและโอนเงิน';
    button.onclick = window.showClaimEntryTransferConfirmModal;
  }

  window.showClaimEntryTransferConfirmModal = function () {
    if (isExcludedCoverage()) {
      if (typeof window.showSaveAndTransferProcessModal === "function") window.showSaveAndTransferProcessModal();
      return;
    }
    injectStyle();
    showModal(renderConfirmModal(getPaymentSnapshot()), "max-w-2xl");
  };

  window.runClaimEntryTransferProcess = function (index) {
    injectStyle();
    const stepIndex = Number(index || 0);
    if (stepIndex === 0) {
      window.__claimEntryTransferRefs = buildRefs();
      showModal(renderProcessModal(window.__claimEntryTransferRefs), "max-w-2xl");
    }
    if (stepIndex >= 3) {
      window.finishClaimEntryTransferProcess();
      return;
    }
    const row = document.getElementById(`claimEntryProcessRow${stepIndex}`);
    const status = document.getElementById(`claimEntryProcessStatus${stepIndex}`);
    if (!row || !status) return;
    row.classList.add("is-running");
    status.innerHTML = '<span class="material-icons-round !text-base claim-entry-spin">sync</span>กำลังดำเนินการ';
    setTimeout(function () {
      row.classList.remove("is-running");
      row.classList.add("is-success");
      status.innerHTML = '<span class="material-icons-round !text-base">check_circle</span>สำเร็จ';
      window.runClaimEntryTransferProcess(stepIndex + 1);
    }, 650);
  };

  window.finishClaimEntryTransferProcess = function () {
    injectStyle();
    const refs = window.__claimEntryTransferRefs || buildRefs();
    showModal(renderSuccessModal(refs), "max-w-2xl");
  };

  const originalRenderPaymentPage = window.renderPaymentPage;
  if (typeof originalRenderPaymentPage === "function") {
    window.renderPaymentPage = function () {
      const result = originalRenderPaymentPage.apply(this, arguments);
      setTimeout(applyGeneralClaimAction, 0);
      return result;
    };
  }

  document.addEventListener("click", function (event) {
    const button = event.target && event.target.closest ? event.target.closest("#primaryActionBtn") : null;
    if (!button || !isGeneralClaimPaymentPage()) return;
    if (!String(button.textContent || "").includes("บันทึกและโอนเงิน")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.showClaimEntryTransferConfirmModal();
  }, true);

  document.addEventListener("DOMContentLoaded", function () {
    injectStyle();
    setTimeout(applyGeneralClaimAction, 0);
  }, { once: true });
})();
