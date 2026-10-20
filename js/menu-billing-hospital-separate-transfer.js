/* ตรวจสอบรายการวางบิล > เคลมโรงพยาบาล: ยืนยันค่าชดเชยโอนแยกของรายการจาก แจ้งเคลม รพ. */
(function () {
  "use strict";

  let pending = null;
  const modal = document.getElementById("scmApprovalModal");
  if (!modal) return;

  function amount(value) {
    const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function money(value) {
    return amount(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " บาท";
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function activeCompensationCard(button) {
    const pane = button?.closest("#hfStepPane3,#hhStepPane3");
    return pane?.querySelector(".hospital-comp-v10,.hospital-comp-v5,.scm-comp-card") || null;
  }

  function syncCompensationAmount() {
    const review = window.__getBillingHospitalReviewState?.();
    if (review?.sourceMenu !== "hospital" || review.product === "PA") return;
    const page = document.getElementById("billingHospitalReviewPage");
    const card = page?.querySelector("#hfStepPane3 .hospital-comp-v10,#hfStepPane3 .hospital-comp-v5,#hfStepPane3 .scm-comp-card");
    if (!card) return;
    const days = amount(review.medical?.totalStayDays ?? (amount(review.medical?.ipdDays) + amount(review.medical?.icuDays)));
    const rate = amount(review.compensationDailyRate) || 500;
    if (!days) return;
    const total = days * rate;
    const limit = amount(review.compensationBenefitLimit);
    const covered = limit ? Math.min(total, limit) : total;
    card.querySelectorAll(".hc10-amount-row,.hospital-comp-v5-row,.scm-comp-row").forEach(function (line) {
      const label = line.querySelector("span")?.textContent.trim();
      const value = line.querySelector("strong,b");
      if (value && label === "ค่าชดเชยรวม") value.textContent = money(total);
      if (value && label === "ค่าชดเชย (รวมในสิทธิ์ความคุ้มครอง)") value.textContent = money(covered);
    });
    const combine = card.querySelector("#hc10Combine,#hcv5Combine,#scmCombineCheckbox");
    const remaining = card.querySelector(".hc10-remain strong,.hospital-comp-v5-remain strong,.scm-transfer-left strong");
    if (remaining) remaining.textContent = money(combine?.checked ? 0 : covered);
    card.dataset.v10sig = "";
  }

  ["openHospitalBillingReview", "setHospitalFullStep"].forEach(function (name) {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function () {
      const result = original.apply(this, arguments);
      setTimeout(syncCompensationAmount, 0);
      setTimeout(syncCompensationAmount, 100);
      return result;
    };
  });

  function accountFrom(card) {
    const field = selector => String(card?.querySelector(selector)?.value || "").trim();
    return {
      bank: field("#hc10Bank,#hcv5Bank,#scmBankInput"),
      accountNo: field("#hc10No,#hcv5No,#scmNoInput"),
      accountName: field("#hc10Name,#hcv5Name,#scmNameInput"),
      phone: field("#hc10Phone,#hcv5Phone,#scmPhoneInput")
    };
  }

  function close() {
    pending = null;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.billingSeparateTransfer;
    document.body.style.overflow = "";
  }

  function showAccountError(card) {
    let error = card.querySelector("[data-billing-separate-account-error]");
    if (!error) {
      error = document.createElement("p");
      error.dataset.billingSeparateAccountError = "true";
      error.setAttribute("role", "alert");
      error.style.cssText = "margin:12px 16px;padding:10px 12px;border:1px solid #fecaca;border-radius:10px;background:#fff7f7;color:#b91c1c;font-weight:700";
      card.appendChild(error);
    }
    error.textContent = "กรุณาตรวจสอบข้อมูลบัญชีรับเงินค่าชดเชยให้ครบถ้วนก่อนยืนยันการทำรายการ";
    error.scrollIntoView({ block: "nearest" });
  }

  window.openHospitalBillingSeparateTransfer = function (row, button, completeApproval) {
    if (row?.sourceMenu !== "hospital" || row?.product === "PA") return false;
    syncCompensationAmount();
    const card = activeCompensationCard(button);
    const combine = card?.querySelector("#hc10Combine,#hcv5Combine,#scmCombineCheckbox");
    const transfer = amount(card?.querySelector(".hc10-remain strong,.hospital-comp-v5-remain strong,.scm-transfer-left strong")?.textContent);
    if (!card || !combine || combine.checked || transfer <= 0) return false;

    const account = accountFrom(card);
    if (Object.values(account).some(value => !value)) {
      showAccountError(card);
      return true;
    }

    const review = window.__getBillingHospitalReviewState?.() || {};
    const hospitalRight = amount(review.billingAmounts?.netBillableAmount ?? review.decisionAmounts?.hospitalCompanyRight ?? row.hospitalCompanyRight);
    setText("scmCompanyClaim", money(hospitalRight));
    setText("scmTransfer", money(transfer));
    setText("scmBank", account.bank);
    setText("scmAccountNo", account.accountNo);
    setText("scmAccountName", account.accountName);
    setText("scmPhone", account.phone);
    pending = { row, review, transfer, hospitalRight, account, completeApproval };
    modal.dataset.billingSeparateTransfer = "true";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("scmModalConfirm")?.focus();
    return true;
  };

  document.getElementById("scmModalConfirm")?.addEventListener("click", function (event) {
    if (!pending || modal.dataset.billingSeparateTransfer !== "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const approval = pending;
    approval.row.compensationTransfer = {
      amount: approval.transfer,
      hospitalRight: approval.hospitalRight,
      account: { ...approval.account },
      status: "รอตั้งเบิก"
    };
    approval.review.compensationTransfer = { ...approval.row.compensationTransfer, account: { ...approval.account } };
    window.__saveBillingHospitalReviewState?.();
    close();
    approval.completeApproval?.();
  }, true);

  ["scmModalClose", "scmModalBack"].forEach(function (id) {
    document.getElementById(id)?.addEventListener("click", function (event) {
      if (!pending) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }, true);
  });
  modal.addEventListener("click", function (event) {
    if (pending && event.target === modal) close();
  });
  modal.addEventListener("keydown", function (event) {
    if (pending && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
})();
