/* ============================================================
   พิจารณาเคลม > Death & Disability
   จัดการบัญชีปลายทางการโอนเงินแบบ session-only (สร้าง/แก้ไข/ลบ)
   ============================================================ */
(function () {
  "use strict";

  var originalShowChangeAccount = window.showDdChangeAccountModal;
  var accountByClaim = window.ddTransferAccountByClaim || Object.create(null);
  var lastAccountTrigger = null;
  window.ddTransferAccountByClaim = accountByClaim;

  function byId(id) {
    return document.getElementById(id);
  }

  function claimNo() {
    return (byId("ddClaimCodeValue") && byId("ddClaimCodeValue").textContent.trim()) || "default";
  }

  function currentAccount() {
    return accountByClaim[claimNo()] || null;
  }

  function setValue(id, value) {
    var field = byId(id);
    if (field) field.value = value || "";
  }

  function accountFields() {
    return [
      "ddChangeReasonModern",
      "ddChangeBankModern",
      "ddChangeAccountNoModern",
      "ddChangeAccountNameModern",
      "ddChangeReceiverPrefixModern",
      "ddChangeReceiverFirstNameModern",
      "ddChangeReceiverLastNameModern"
    ];
  }

  function ensureEmptyPrefixOption() {
    var select = byId("ddChangeReceiverPrefixModern");
    if (!select || select.querySelector('option[value=""]')) return;
    var option = document.createElement("option");
    option.value = "";
    option.textContent = "เลือกคำนำหน้า";
    select.insertBefore(option, select.firstChild);
  }

  function configureFieldLabels() {
    accountFields().forEach(function (id) {
      var field = byId(id);
      if (!field) return;
      var label = field.closest(".death-form-field") && field.closest(".death-form-field").querySelector("label");
      if (label) label.setAttribute("for", id);
      field.setAttribute("aria-describedby", "deathChangeSaveHint");
      field.removeAttribute("aria-invalid");
    });
  }

  function fillForm(data) {
    ensureEmptyPrefixOption();
    setValue("ddChangeReasonModern", data && data.reason);
    setValue("ddChangeBankModern", data && data.bank);
    setValue("ddChangeAccountNoModern", data && data.accountNo);
    setValue("ddChangeAccountNameModern", data && data.accountName);
    setValue("ddChangeReceiverPrefixModern", data && data.receiverPrefix);
    setValue("ddChangeReceiverFirstNameModern", data && data.receiverFirstName);
    setValue("ddChangeReceiverLastNameModern", data && data.receiverLastName);
  }

  function ensureDetailActions() {
    var section = byId("ddTransferAccountDetail");
    var title = section && section.querySelector(":scope > .dd-section-title, :scope > .dd-transfer-detail-head > .dd-section-title");
    if (!section || !title) return;
    var head = section.querySelector(":scope > .dd-transfer-detail-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "dd-transfer-detail-head";
      section.insertBefore(head, title);
      head.appendChild(title);
    }
    var actions = head.querySelector(".dd-transfer-detail-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "dd-transfer-detail-actions";
      actions.innerHTML =
        '<button type="button" class="dd-account-action dd-account-action-edit" onclick="editDdTransferAccount()">' +
          '<span class="material-icons-round" aria-hidden="true">edit</span>แก้ไข' +
        '</button>' +
        '<button type="button" class="dd-account-action dd-account-action-delete" onclick="showDeleteDdTransferAccountConfirm()">' +
          '<span class="material-icons-round" aria-hidden="true">delete</span>ลบ' +
        '</button>';
      head.appendChild(actions);
    }
  }

  function renderAccount(data) {
    var section = byId("ddTransferAccountDetail");
    var cashButton = byId("ddThirdPartyCashBtn");
    ensureDetailActions();
    if (data) {
      var receiver = data.receiverPrefix + data.receiverFirstName + " " + data.receiverLastName;
      if (byId("ddTransferReasonText")) byId("ddTransferReasonText").textContent = data.reason;
      if (byId("ddTransferReceiverText")) byId("ddTransferReceiverText").textContent = receiver;
      if (byId("ddTransferBankText")) byId("ddTransferBankText").textContent = data.bank + " " + data.accountNo + " " + data.accountName;
      if (section) section.classList.remove("hidden");
      if (cashButton) {
        cashButton.disabled = true;
        cashButton.setAttribute("aria-disabled", "true");
        cashButton.classList.add("is-account-saved");
        cashButton.title = "บันทึกบัญชีปลายทางแล้ว กรุณาใช้ปุ่มแก้ไขในรายละเอียด";
      }
      return;
    }
    if (section) section.classList.add("hidden");
    ["ddTransferReasonText", "ddTransferReceiverText", "ddTransferBankText"].forEach(function (id) {
      if (byId(id)) byId(id).textContent = "-";
    });
    if (cashButton) {
      cashButton.disabled = false;
      cashButton.removeAttribute("aria-disabled");
      cashButton.classList.remove("is-account-saved");
      cashButton.removeAttribute("title");
    }
  }

  function syncCurrentClaim() {
    renderAccount(currentAccount());
  }

  function showValidation(message, invalidFields) {
    var hint = byId("deathChangeSaveHint");
    if (hint) {
      hint.textContent = message;
      hint.classList.add("show", "is-error");
      hint.setAttribute("role", "alert");
    }
    accountFields().forEach(function (id) {
      var field = byId(id);
      if (field) field.setAttribute("aria-invalid", invalidFields.indexOf(id) >= 0 ? "true" : "false");
    });
    if (invalidFields.length && byId(invalidFields[0])) byId(invalidFields[0]).focus();
  }

  window.showDdChangeAccountModal = function (options) {
    var mode = options && options.mode === "edit" ? "edit" : "create";
    var cashButton = byId("ddThirdPartyCashBtn");
    if (mode === "create" && cashButton && cashButton.disabled) return;
    if (typeof originalShowChangeAccount !== "function") return;
    lastAccountTrigger = document.activeElement;
    originalShowChangeAccount();

    var modal = document.querySelector("#claimModal .death-change-account-modal");
    if (!modal) return;
    var modalBox = byId("claimModalBox");
    if (modalBox) modalBox.classList.add("dd-account-modal-host");
    var accountTypeField = byId("ddChangeAccountTypeModern");
    if (accountTypeField && accountTypeField.closest(".death-form-field")) {
      accountTypeField.closest(".death-form-field").remove();
    }
    ["ddChangeBankModern", "ddChangeAccountNoModern"].forEach(function (id) {
      var field = byId(id);
      var owner = field && field.closest(".death-form-field");
      if (owner) {
        owner.classList.remove("col-4");
        owner.classList.add("col-6");
      }
    });
    modal.dataset.ddAccountMode = mode;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    var title = modal.querySelector(".death-modal-title");
    if (title) {
      title.id = "ddChangeAccountModalTitle";
      title.textContent = mode === "edit" ? "แก้ไขบัญชีปลายทางการโอนเงิน" : "เปลี่ยนบัญชีปลายทางการโอนเงิน";
      modal.setAttribute("aria-labelledby", title.id);
    }
    var subtitle = modal.querySelector(".death-modal-subtitle");
    if (subtitle) subtitle.textContent = mode === "edit" ? "ตรวจสอบและแก้ไขข้อมูลบัญชีปลายทางที่บันทึกไว้" : "กรุณากรอกข้อมูลบัญชีปลายทางใหม่ให้ครบถ้วนก่อนบันทึก";
    var primary = modal.querySelector(".death-btn-primary");
    if (primary) primary.innerHTML = '<span class="material-icons-round" aria-hidden="true">save</span>' + (mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกการเปลี่ยนบัญชี");
    var cancel = modal.querySelector(".death-btn-secondary");
    var close = modal.querySelector(".death-modal-close");
    if (cancel) cancel.setAttribute("onclick", "cancelDdChangeAccountModal()");
    if (close) {
      close.setAttribute("onclick", "cancelDdChangeAccountModal()");
      close.setAttribute("aria-label", "ปิดหน้าต่างเปลี่ยนบัญชี");
    }
    fillForm(mode === "edit" ? currentAccount() : null);
    configureFieldLabels();
    window.setTimeout(function () {
      var first = byId("ddChangeReasonModern");
      if (first) first.focus();
    }, 0);
  };

  window.cancelDdChangeAccountModal = function () {
    if (typeof window.closeModal === "function") window.closeModal();
    window.setTimeout(function () {
      if (lastAccountTrigger && document.contains(lastAccountTrigger)) lastAccountTrigger.focus();
    }, 0);
  };

  window.saveDdCashHandoverModal = function () {
    var data = {
      reason: (byId("ddChangeReasonModern") && byId("ddChangeReasonModern").value.trim()) || "",
      bank: (byId("ddChangeBankModern") && byId("ddChangeBankModern").value.trim()) || "",
      accountNo: (byId("ddChangeAccountNoModern") && byId("ddChangeAccountNoModern").value.trim()) || "",
      accountName: (byId("ddChangeAccountNameModern") && byId("ddChangeAccountNameModern").value.trim()) || "",
      receiverPrefix: (byId("ddChangeReceiverPrefixModern") && byId("ddChangeReceiverPrefixModern").value.trim()) || "",
      receiverFirstName: (byId("ddChangeReceiverFirstNameModern") && byId("ddChangeReceiverFirstNameModern").value.trim()) || "",
      receiverLastName: (byId("ddChangeReceiverLastNameModern") && byId("ddChangeReceiverLastNameModern").value.trim()) || ""
    };
    var valueById = {
      ddChangeReasonModern: data.reason,
      ddChangeBankModern: data.bank,
      ddChangeAccountNoModern: data.accountNo,
      ddChangeAccountNameModern: data.accountName,
      ddChangeReceiverPrefixModern: data.receiverPrefix,
      ddChangeReceiverFirstNameModern: data.receiverFirstName,
      ddChangeReceiverLastNameModern: data.receiverLastName
    };
    var invalid = accountFields().filter(function (id) { return !valueById[id]; });
    if (invalid.length) {
      showValidation("กรุณากรอกข้อมูลการเปลี่ยนบัญชีให้ครบถ้วน", invalid);
      return;
    }
    accountByClaim[claimNo()] = data;
    renderAccount(data);
    if (typeof window.closeModal === "function") window.closeModal();
    window.setTimeout(function () {
      var section = byId("ddTransferAccountDetail");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      var edit = document.querySelector("#ddTransferAccountDetail .dd-account-action-edit");
      if (edit) edit.focus({ preventScroll: true });
    }, 120);
  };

  window.editDdTransferAccount = function () {
    if (!currentAccount()) return;
    window.showDdChangeAccountModal({ mode: "edit" });
  };

  window.showDeleteDdTransferAccountConfirm = function () {
    var data = currentAccount();
    if (!data || typeof window.showModal !== "function") return;
    lastAccountTrigger = document.activeElement;
    window.showModal(
      '<div class="death-modal-shell dd-account-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="ddDeleteAccountTitle" aria-describedby="ddDeleteAccountDescription">' +
        '<div class="death-modal-head">' +
          '<div class="death-modal-title-wrap"><div class="death-modal-title-icon"><span class="material-icons-round" aria-hidden="true">delete</span></div>' +
          '<div><div id="ddDeleteAccountTitle" class="death-modal-title">ลบบัญชีปลายทางนี้?</div><div class="death-modal-subtitle">เลขที่เคลม ' + claimNo().replace(/[&<>"']/g, "") + '</div></div></div>' +
          '<button type="button" class="death-modal-close" onclick="cancelDeleteDdTransferAccount()" aria-label="ปิดหน้าต่างยืนยันการลบ"><span class="material-icons-round" aria-hidden="true">close</span></button>' +
        '</div>' +
        '<div class="death-modal-body"><div id="ddDeleteAccountDescription" class="dd-account-delete-message">' +
          '<span class="material-icons-round" aria-hidden="true">warning</span><div><strong>ข้อมูลบัญชีที่บันทึกไว้จะถูกนำออก</strong><p>หลังลบแล้ว ปุ่ม “เงินสดมอบหน้างาน” จะกลับมาใช้งานได้ และต้องกรอกข้อมูลใหม่หากต้องการเปลี่ยนบัญชีอีกครั้ง</p></div>' +
        '</div><div class="death-modal-actions">' +
          '<button type="button" class="death-btn-secondary" onclick="cancelDeleteDdTransferAccount()">ยกเลิก</button>' +
          '<button type="button" class="dd-account-confirm-delete" onclick="deleteDdTransferAccount()"><span class="material-icons-round" aria-hidden="true">delete</span>ลบบัญชี</button>' +
        '</div></div>' +
      '</div>',
      "max-w-xl"
    );
    window.setTimeout(function () {
      var cancel = document.querySelector("#claimModal .dd-account-delete-confirm .death-btn-secondary");
      if (cancel) cancel.focus();
    }, 0);
  };

  window.cancelDeleteDdTransferAccount = function () {
    if (typeof window.closeModal === "function") window.closeModal();
    window.setTimeout(function () {
      if (lastAccountTrigger && document.contains(lastAccountTrigger)) lastAccountTrigger.focus();
    }, 0);
  };

  window.deleteDdTransferAccount = function () {
    delete accountByClaim[claimNo()];
    renderAccount(null);
    if (typeof window.closeModal === "function") window.closeModal();
    window.setTimeout(function () {
      var button = byId("ddThirdPartyCashBtn");
      if (button) button.focus();
    }, 0);
  };

  var originalShowDeathDetail = window.showConsiderDeathDetail;
  if (typeof originalShowDeathDetail === "function" && !originalShowDeathDetail.__ddAccountManagement) {
    var wrappedShowDeathDetail = function () {
      var result = originalShowDeathDetail.apply(this, arguments);
      window.setTimeout(syncCurrentClaim, 80);
      return result;
    };
    wrappedShowDeathDetail.__ddAccountManagement = true;
    window.showConsiderDeathDetail = wrappedShowDeathDetail;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (document.querySelector("#claimModal .dd-account-delete-confirm")) {
      event.preventDefault();
      window.cancelDeleteDdTransferAccount();
    } else if (document.querySelector("#claimModal .death-change-account-modal[data-dd-account-mode]")) {
      event.preventDefault();
      window.cancelDdChangeAccountModal();
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncCurrentClaim);
  else syncCurrentClaim();
})();
