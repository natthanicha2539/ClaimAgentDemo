/* ============================================================
   claim-status-detail-card.js
   Shared read-only context card for historical claim statuses.
   ============================================================ */
(function () {
  "use strict";

  const CUSTOMER_STATUSES = new Set(["รอเอกสาร", "รอแก้ไข", "ปฏิเสธ", "ยกเลิก"]);
  const HOSPITAL_STATUSES = new Set(["รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "รอตรวจสอบการแก้ไข"]);
  const DEATH_STATUSES = new Set(["รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "รอตรวจสอบการแก้ไข", "อยู่ระหว่างการทำรายการ", "อยู่ระหว่างทำรายการ"]);
  const STATUS_PRESENTATION = {
    "รอเอกสาร": { tone: "waiting", icon: "description", reason: "เอกสารประกอบการพิจารณายังไม่ครบถ้วน", detail: "รอรับเอกสารที่จำเป็นเพื่อดำเนินการพิจารณาเคลมต่อ" },
    "รอแก้ไข": { tone: "waiting", icon: "edit_note", reason: "ข้อมูลในรายการเคลมต้องได้รับการแก้ไข", detail: "ส่งกลับให้ผู้เกี่ยวข้องตรวจสอบและแก้ไขข้อมูลตามข้อสังเกต" },
    "รอตรวจสอบการแก้ไข": { tone: "review", icon: "fact_check", reason: "ได้รับข้อมูลแก้ไขแล้วและอยู่ระหว่างตรวจสอบ", detail: "เจ้าหน้าที่กำลังตรวจสอบความครบถ้วนและความถูกต้องของข้อมูลที่แก้ไข" },
    "ปฏิเสธ": { tone: "danger", icon: "block", reason: "รายการไม่ผ่านเงื่อนไขการพิจารณาเคลม", detail: "ตรวจสอบเงื่อนไขความคุ้มครองและข้อสังเกตของผู้พิจารณา" },
    "ยกเลิก": { tone: "neutral", icon: "cancel", reason: "รายการเคลมถูกยกเลิก", detail: "ยุติการดำเนินการตามคำขอของผู้แจ้งเคลมหรือสถานพยาบาล" }
  };
  STATUS_PRESENTATION["อยู่ระหว่างการทำรายการ"] = { tone: "progress", icon: "pending_actions", reason: "เจ้าหน้าที่กำลังดำเนินการกับรายการเคลม", detail: "อยู่ระหว่างตรวจสอบข้อมูลและบันทึกผลประโยชน์ก่อนสรุปผลการพิจารณา" };
  STATUS_PRESENTATION["อยู่ระหว่างทำรายการ"] = STATUS_PRESENTATION["อยู่ระหว่างการทำรายการ"];

  function normalizeHospitalWaitingDocumentStatus() {
    try {
      if (typeof considerationHospitalRows === "undefined" || !Array.isArray(considerationHospitalRows)) return;
      considerationHospitalRows.forEach(row => {
        if (row.itemStatus !== "รอเอกสาร") return;
        row.itemStatus = "รอแก้ไข";
        row.statusReason = row.statusReason || "ข้อมูลหรือเอกสารจากสถานพยาบาลต้องได้รับการแก้ไข";
        row.statusDetail = row.statusDetail || "ส่งกลับให้สถานพยาบาลแก้ไขข้อมูลให้ครบถ้วนก่อนเข้าสู่การพิจารณาอีกครั้ง";
      });
    } catch (error) {
      console.warn("Unable to normalize hospital claim status", error);
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCardData(row) {
    const status = String(row && (row.itemStatus || row.status) || "").trim();
    const presentation = STATUS_PRESENTATION[status];
    if (!presentation) return null;
    return {
      status,
      tone: presentation.tone,
      icon: presentation.icon,
      reason: String(row.statusReason || row.correctionReason || row.reason || presentation.reason).trim(),
      detail: String(row.statusDetail || row.correctionDetail || row.detail || row.note || presentation.detail).trim()
    };
  }

  function renderStatusCard(data, titleId) {
    const reasonId = `${titleId}Reason`;
    const detailId = `${titleId}Detail`;
    return `<section class="claim-status-detail-card" data-status-tone="${escapeHtml(data.tone)}" aria-labelledby="${titleId}" aria-describedby="${reasonId} ${detailId}">
      <div class="claim-status-detail-summary">
        <span class="claim-status-detail-icon" aria-hidden="true"><span class="material-icons-round">${escapeHtml(data.icon)}</span></span>
        <div class="min-w-0">
          <p class="claim-status-detail-kicker">รายละเอียดสถานะรายการ</p>
          <div class="claim-status-detail-statusline">
            <span class="claim-status-detail-current-label">สถานะปัจจุบัน</span>
            <h2 id="${titleId}" class="claim-status-detail-badge">${escapeHtml(data.status)}</h2>
          </div>
        </div>
      </div>
      <div class="claim-status-detail-body">
        <div class="claim-status-detail-field">
          <div class="claim-status-detail-label"><span class="material-icons-round" aria-hidden="true">help_outline</span>สาเหตุ</div>
          <p id="${reasonId}" class="claim-status-detail-value">${escapeHtml(data.reason)}</p>
        </div>
        <div class="claim-status-detail-field">
          <div class="claim-status-detail-label"><span class="material-icons-round" aria-hidden="true">notes</span>รายละเอียด</div>
          <p id="${detailId}" class="claim-status-detail-value">${escapeHtml(data.detail)}</p>
        </div>
      </div>
    </section>`;
  }

  function insertCard(page, row, allowedStatuses) {
    if (!page) return;
    page.querySelector(".claim-status-detail-card")?.remove();
    page.querySelector("#hospitalCorrectionReviewCard")?.remove();
    const status = String(row && (row.itemStatus || row.status) || "").trim();
    if (!allowedStatuses.has(status)) return;
    const data = getCardData(row);
    if (!data) return;
    const anchor = page.querySelector(".customer-review-tabs, .customer-review-stepper, [id$='StepPane1']");
    const titleId = `${page.id}ClaimStatusDetailTitle`;
    if (anchor) anchor.insertAdjacentHTML("beforebegin", renderStatusCard(data, titleId));
    else page.insertAdjacentHTML("afterbegin", renderStatusCard(data, titleId));
  }

  function removeHospitalWaitingDocumentStatus(page) {
    if (!page) return;
    page.querySelectorAll('.dd-decision-btn[data-decision="waitdocs"]').forEach(button => button.remove());
  }

  const openCustomer = window.openConsiderCustomerRow;
  if (typeof openCustomer === "function") {
    window.openConsiderCustomerRow = function () {
      const result = openCustomer.apply(this, arguments);
      insertCard(document.getElementById("considerCustomerDetailPage"), window.currentConsiderCustomerRow || {}, CUSTOMER_STATUSES);
      return result;
    };
  }

  const openHospital = window.openConsiderHospitalRow;
  if (typeof openHospital === "function") {
    window.openConsiderHospitalRow = function () {
      normalizeHospitalWaitingDocumentStatus();
      if (window.customerDecisionState?.type === "waitdocs") {
        window.customerDecisionState = { ...window.customerDecisionState, type: "" };
      }
      if (window.hospitalDecisionState?.type === "waitdocs") {
        window.hospitalDecisionState = { ...window.hospitalDecisionState, type: "" };
      }
      const result = openHospital.apply(this, arguments);
      const page = document.querySelector("#considerHospitalOpdFullPage:not(.hidden),#considerHospitalOpdHalfPage:not(.hidden)");
      removeHospitalWaitingDocumentStatus(page);
      insertCard(page, window.currentConsiderHospitalRow || {}, HOSPITAL_STATUSES);
      window.setTimeout(() => {
        removeHospitalWaitingDocumentStatus(page);
        insertCard(page, window.currentConsiderHospitalRow || {}, HOSPITAL_STATUSES);
      }, 120);
      return result;
    };
  }

  const showDeathDetail = window.showConsiderDeathDetail;
  if (typeof showDeathDetail === "function") {
    window.showConsiderDeathDetail = function (claimCode) {
      const result = showDeathDetail.apply(this, arguments);
      const row = (window.considerationDeathRows || []).find(item => item.claimCode === claimCode) || {};
      const page = document.getElementById("considerDeathDetailPage");
      const render = () => {
        insertCard(page, row, DEATH_STATUSES);
        const card = page?.querySelector(".claim-status-detail-card");
        const tabCard = page?.querySelector(".customer-review-tabcard");
        if (card && tabCard && card.parentElement !== tabCard.parentElement) {
          tabCard.parentElement.insertBefore(card, tabCard);
        } else if (card && tabCard && card.nextElementSibling !== tabCard) {
          tabCard.parentElement.insertBefore(card, tabCard);
        }
        const tabs = page?.querySelector(".customer-review-tabs");
        if (tabs) {
          tabs.setAttribute("role", "tablist");
          if (!tabs.dataset.deathKeyboardBound) {
            tabs.dataset.deathKeyboardBound = "true";
            tabs.addEventListener("keydown", event => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              const buttons = Array.from(tabs.querySelectorAll("[data-death-tab]"));
              const currentIndex = buttons.indexOf(document.activeElement);
              if (currentIndex < 0 || !buttons.length) return;
              event.preventDefault();
              const direction = event.key === "ArrowRight" ? 1 : -1;
              const next = buttons[(currentIndex + direction + buttons.length) % buttons.length];
              next.focus();
              next.click();
              next.scrollIntoView({ block: "nearest", inline: "nearest" });
            });
          }
        }
        page?.querySelectorAll("[data-death-tab]").forEach(button => {
          const key = button.dataset.deathTab;
          const pane = page.querySelector(`[data-death-pane="${key}"]`);
          button.setAttribute("role", "tab");
          button.id = `ddTabButton-${key}`;
          if (pane) {
            pane.setAttribute("role", "tabpanel");
            pane.setAttribute("aria-labelledby", button.id);
            button.setAttribute("aria-controls", pane.id);
          }
        });
        const chip = page?.querySelector(".dd-title-chip");
        if (chip && row.status) chip.innerHTML = `<span class="material-icons-round" aria-hidden="true">info</span>${escapeHtml(row.status)}`;
      };
      render();
      window.setTimeout(render, 120);
      return result;
    };
  }

  const setHospitalFullStep = window.setHospitalFullStep;
  if (typeof setHospitalFullStep === "function") {
    window.setHospitalFullStep = function () {
      const result = setHospitalFullStep.apply(this, arguments);
      removeHospitalWaitingDocumentStatus(document.getElementById("considerHospitalOpdFullPage"));
      return result;
    };
  }

  const setHospitalHalfStep = window.setHospitalHalfStep;
  if (typeof setHospitalHalfStep === "function") {
    window.setHospitalHalfStep = function () {
      const result = setHospitalHalfStep.apply(this, arguments);
      removeHospitalWaitingDocumentStatus(document.getElementById("considerHospitalOpdHalfPage"));
      return result;
    };
  }

  normalizeHospitalWaitingDocumentStatus();
})();
