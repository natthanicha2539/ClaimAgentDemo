/* ============================================================
   Claim Monitor -> Claim Detail record-aware routing
   Resolves the selected record by appId and preserves Monitor state.
   ============================================================ */
(function () {
  "use strict";

  const CUSTOMER_CATEGORY = "เคลมลูกค้า";
  const HOSPITAL_CATEGORY = "เคลมโรงพยาบาล";
  const CUSTOMER_TYPES = ["OPD", "IPD", "Day Case Surgery"];
  const HOSPITAL_TYPES = ["OPD Half", "OPD Full", "IPD", "Day Case Surgery"];
  const PRODUCTS = ["PH", "PA"];
  const CUSTOMER_STATUSES = ["รอพิจารณา", "รอเอกสาร", "รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "อยู่ระหว่างดำเนินการ"];
  const HOSPITAL_STATUSES = ["รอพิจารณา", "รอแก้ไข", "ปฏิเสธ", "ยกเลิก", "อยู่ระหว่างดำเนินการ", "อนุมัติ"];

  const effectiveCustomerOpener = window.openConsiderCustomerRow;
  const effectiveHospitalOpener = window.openConsiderHospitalRow;
  let activeSession = null;
  let additionalTransferSession = null;

  function removeAdditionalTransferReturnBar() {
    document.querySelectorAll("[data-hat-source-return]").forEach(function (node) { node.remove(); });
  }

  function clearAdditionalTransferNavigationContext(options) {
    const session = additionalTransferSession;
    additionalTransferSession = null;
    delete window.claimDetailNavigationContext;
    removeAdditionalTransferReturnBar();

    if (options?.restoreClaimGlobals && session) {
      if (session.previousDecisionState === undefined) delete window.customerDecisionState;
      else window.customerDecisionState = session.previousDecisionState;
      if (session.previousDetailMock === undefined) delete window.currentClaimDetailMock;
      else window.currentClaimDetailMock = session.previousDetailMock;
    }
    return session;
  }

  function monitorRows() {
    try {
      return typeof claimMonitorRows !== "undefined" && Array.isArray(claimMonitorRows) ? claimMonitorRows : [];
    } catch (error) {
      return [];
    }
  }

  function resolveRecord(recordOrAppId) {
    const appId = typeof recordOrAppId === "object" && recordOrAppId
      ? recordOrAppId.appId
      : recordOrAppId;
    if (!appId) return { record: null, error: "missing-record-key" };
    const matches = monitorRows().filter(row => String(row.appId) === String(appId));
    if (matches.length !== 1) {
      return { record: null, error: matches.length ? "ambiguous-record-key" : "record-not-found" };
    }
    return { record: matches[0], error: "" };
  }

  function validateContext(record) {
    if (!record || !record.appId || !record.product || !record.claimCategory || !record.claimType || !record.treatmentType || !record.itemStatus) {
      return { valid: false, error: "missing-context" };
    }
    if (!PRODUCTS.includes(record.product)) return { valid: false, error: "unsupported-product" };
    if (record.claimCategory === CUSTOMER_CATEGORY) {
      if (!CUSTOMER_TYPES.includes(record.claimType)) return { valid: false, error: "unsupported-customer-treatment" };
      if (!CUSTOMER_STATUSES.includes(record.itemStatus)) return { valid: false, error: "unsupported-customer-status" };
      return { valid: true, destination: "considerCustomerDetailPage" };
    }
    if (record.claimCategory === HOSPITAL_CATEGORY) {
      if (!HOSPITAL_TYPES.includes(record.claimType)) return { valid: false, error: "unsupported-hospital-treatment" };
      if (!HOSPITAL_STATUSES.includes(record.itemStatus)) return { valid: false, error: "unsupported-hospital-status" };
      return {
        valid: true,
        destination: record.claimType === "OPD Half" ? "considerHospitalOpdHalfPage" : "considerHospitalOpdFullPage"
      };
    }
    return { valid: false, error: "unsupported-claim-category" };
  }

  function selectedView() {
    return document.getElementById("claimCardView")?.classList.contains("hidden") ? "table" : "card";
  }

  function captureMonitorState(record) {
    const value = id => document.getElementById(id)?.value || "";
    return {
      recordKey: record.appId,
      scrollY: window.scrollY,
      view: selectedView(),
      searchType: value("claimSearchType"),
      keyword: value("claimKeyword"),
      product: value("claimContextProduct"),
      claimCategory: value("claimContextCategory"),
      treatment: value("claimContextTreatment"),
      status: value("claimContextStatus")
    };
  }

  function applyValue(id, value) {
    const control = document.getElementById(id);
    if (control) control.value = value || "";
  }

  function restoreMonitorState() {
    if (!activeSession) return false;
    const session = activeSession;
    const state = session.monitor;
    activeSession = null;

    if (session.previousDecisionState === undefined) delete window.customerDecisionState;
    else window.customerDecisionState = session.previousDecisionState;
    if (session.previousDetailMock === undefined) delete window.currentClaimDetailMock;
    else window.currentClaimDetailMock = session.previousDetailMock;

    applyValue("claimSearchType", state.searchType);
    applyValue("claimKeyword", state.keyword);
    applyValue("claimContextProduct", state.product);
    applyValue("claimContextCategory", state.claimCategory);
    window.ClaimMonitorContextFilters?.syncDependentOptions();
    applyValue("claimContextTreatment", state.treatment);
    applyValue("claimContextStatus", state.status);

    if (typeof filterClaimMonitorRows === "function") claimMonitorFilteredRows = filterClaimMonitorRows();
    selectedClaimMonitorIndex = claimMonitorFilteredRows.findIndex(row => String(row.appId) === String(state.recordKey));
    claimState.row = selectedClaimMonitorIndex >= 0 ? claimMonitorFilteredRows[selectedClaimMonitorIndex] : null;
    if (typeof showClaimMonitor === "function") showClaimMonitor(false);
    if (typeof setClaimMonitorView === "function") setClaimMonitorView(state.view);
    if (selectedClaimMonitorIndex >= 0) {
      const detail = document.getElementById("claimSelectedDetail");
      if (detail) {
        renderClaimSelectedDetail(selectedClaimMonitorIndex);
        detail.classList.remove("hidden");
      }
    }
    const restoreScroll = () => {
      const scrollingElement = document.scrollingElement || document.documentElement;
      const previousBehavior = scrollingElement.style.scrollBehavior;
      scrollingElement.style.scrollBehavior = "auto";
      scrollingElement.scrollTop = state.scrollY;
      requestAnimationFrame(() => { scrollingElement.style.scrollBehavior = previousBehavior; });
    };
    requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
    setTimeout(restoreScroll, 120);
    return true;
  }

  function openClaimMonitorDetail(recordOrAppId) {
    clearAdditionalTransferNavigationContext();
    const resolved = resolveRecord(recordOrAppId);
    if (!resolved.record) return false;
    const route = validateContext(resolved.record);
    if (!route.valid) return false;
    const detailResolution = window.ClaimDetailMockResolver?.resolve(resolved.record.appId);
    if (!detailResolution?.detail || !detailResolution?.rendererRecord || detailResolution.error) return false;
    const rendererRecord = detailResolution.rendererRecord;

    const filteredRows = typeof claimMonitorFilteredRows !== "undefined" && Array.isArray(claimMonitorFilteredRows)
      ? claimMonitorFilteredRows
      : monitorRows();
    selectedClaimMonitorIndex = filteredRows.findIndex(row => String(row.appId) === String(resolved.record.appId));
    claimState.row = resolved.record;

    const context = Object.freeze({
      recordKey: resolved.record.appId,
      product: resolved.record.product,
      claimCategory: resolved.record.claimCategory,
      claimType: resolved.record.claimType,
      treatmentType: resolved.record.treatmentType,
      itemStatus: resolved.record.itemStatus,
      destination: route.destination
    });
    activeSession = {
      context,
      monitor: captureMonitorState(resolved.record),
      previousDecisionState: window.customerDecisionState,
      previousDetailMock: window.currentClaimDetailMock
    };
    window.claimMonitorDetailContext = context;
    window.currentClaimDetailMock = detailResolution.detail;
    const decisionTypeByStatus = {
      "รอเอกสาร": "waitdocs",
      "รอแก้ไข": "edit",
      "ปฏิเสธ": "reject",
      "ยกเลิก": "cancel"
    };
    window.customerDecisionState = {
      type: decisionTypeByStatus[resolved.record.itemStatus] || "",
      reason: detailResolution.detail.decision.reason || "",
      note: detailResolution.detail.decision.note || ""
    };

    if (resolved.record.claimCategory === CUSTOMER_CATEGORY) {
      if (typeof effectiveCustomerOpener !== "function") return false;
      effectiveCustomerOpener(rendererRecord);
    } else {
      if (typeof effectiveHospitalOpener !== "function") return false;
      effectiveHospitalOpener(rendererRecord);
    }
    return true;
  }

  function notifyAdditionalTransferResolutionFailure(context) {
    if (typeof window.hospitalNotify !== "function") return;
    const claimNo = String(context?.claimNo || "-");
    const caseNo = String(context?.caseNo || "-");
    window.hospitalNotify({
      type: "warning",
      title: "ไม่พบข้อมูลเคลมครั้งก่อน",
      detail: "ไม่พบ Claim No. " + claimNo + " และ Case No. " + caseNo + " ที่ตรงกันใน Mock Data กรุณาตรวจสอบข้อมูลอีกครั้ง"
    });
  }

  function setExistingClaimDetailNavigation(record) {
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    if (pageTitle) pageTitle.textContent = record.claimCategory === CUSTOMER_CATEGORY ? "รายละเอียดเคลมลูกค้า" : "รายละเอียดเคลมโรงพยาบาล";
    if (pageSubtitle) pageSubtitle.textContent = "งานเคลม / ค้นหาเคลม / ดูรายละเอียด";
    document.title = (record.claimCategory === CUSTOMER_CATEGORY ? "รายละเอียดเคลมลูกค้า" : "รายละเอียดเคลมโรงพยาบาล") + " | ClaimAgent";
    if (typeof window.setMenuActive === "function") window.setMenuActive("claimWork");
    if (typeof window.setClaimWorkSubmenuExpanded === "function") window.setClaimWorkSubmenuExpanded(true);
    if (typeof window.setClaimWorkSubmenuActive === "function") window.setClaimWorkSubmenuActive("search");
    if (typeof window.setConsiderSubmenuExpanded === "function") window.setConsiderSubmenuExpanded(false);
  }

  function mountAdditionalTransferReturnBar(record, requestId) {
    removeAdditionalTransferReturnBar();
    const route = validateContext(record);
    const detailPage = route.valid ? document.getElementById(route.destination) : null;
    if (!detailPage) return;
    const bar = document.createElement("div");
    bar.className = "hat-source-return-bar";
    bar.dataset.hatSourceReturn = "hospitalAdditionalTransfer";
    bar.innerHTML = '<span><span class="material-icons-round" aria-hidden="true">history</span>กำลังดูข้อมูลเคลมครั้งก่อนของคำขอ ' + String(requestId).replace(/[&<>'"]/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]; }) + '</span><button type="button" data-hat-return-additional-transfer><span class="material-icons-round" aria-hidden="true">arrow_back</span>กลับหน้ารายละเอียดคำขอโอนเพิ่ม</button>';
    bar.querySelector("[data-hat-return-additional-transfer]")?.addEventListener("click", restoreAdditionalTransferDetail);
    detailPage.prepend(bar);
  }

  function openClaimDetailFromAdditionalTransfer(context) {
    const resolution = window.ClaimDetailMockResolver?.resolveByClaimContext(context);
    if (!resolution?.detail || !resolution?.rendererRecord || !resolution?.record || resolution.error) {
      notifyAdditionalTransferResolutionFailure(context);
      return false;
    }

    const route = validateContext(resolution.record);
    if (!route.valid) {
      notifyAdditionalTransferResolutionFailure(context);
      return false;
    }

    const requestId = String(context?.requestId || "").trim();
    if (!requestId) {
      notifyAdditionalTransferResolutionFailure(context);
      return false;
    }

    const previousDecisionState = window.customerDecisionState;
    const previousDetailMock = window.currentClaimDetailMock;

    activeSession = null;
    delete window.claimMonitorDetailContext;
    clearAdditionalTransferNavigationContext();
    const navigationContext = Object.freeze({
      source: "hospitalAdditionalTransfer",
      requestId
    });
    additionalTransferSession = {
      context: navigationContext,
      recordKey: resolution.detail.recordKey,
      previousDecisionState,
      previousDetailMock
    };
    window.claimDetailNavigationContext = navigationContext;
    window.currentClaimDetailMock = resolution.detail;
    const decisionTypeByStatus = {
      "รอเอกสาร": "waitdocs",
      "รอแก้ไข": "edit",
      "ปฏิเสธ": "reject",
      "ยกเลิก": "cancel",
      "อนุมัติ": "approve"
    };
    window.customerDecisionState = {
      type: decisionTypeByStatus[resolution.record.itemStatus] || "",
      reason: resolution.detail.decision.reason || "",
      note: resolution.detail.decision.note || ""
    };

    if (resolution.record.claimCategory === CUSTOMER_CATEGORY) {
      if (typeof effectiveCustomerOpener !== "function") {
        clearAdditionalTransferNavigationContext({ restoreClaimGlobals: true });
        notifyAdditionalTransferResolutionFailure(context);
        return false;
      }
      effectiveCustomerOpener(resolution.rendererRecord);
    } else {
      if (typeof effectiveHospitalOpener !== "function") {
        clearAdditionalTransferNavigationContext({ restoreClaimGlobals: true });
        notifyAdditionalTransferResolutionFailure(context);
        return false;
      }
      effectiveHospitalOpener(resolution.rendererRecord);
    }
    setExistingClaimDetailNavigation(resolution.record);
    mountAdditionalTransferReturnBar(resolution.record, requestId);
    return true;
  }

  function restoreAdditionalTransferDetail() {
    if (additionalTransferSession?.context.source !== "hospitalAdditionalTransfer") return false;
    const session = clearAdditionalTransferNavigationContext({ restoreClaimGlobals: true });
    const opener = window.openConsiderHospitalAdditionalTransferDetail;
    if (!session || typeof opener !== "function") return false;
    opener(session.context.requestId, { restoreState: true });
    return true;
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest("button[onclick*='showConsiderationPage']");
    if (!button) return;
    const detailPage = button.closest("#considerCustomerDetailPage, #considerHospitalOpdHalfPage, #considerHospitalOpdFullPage");
    if (!detailPage) return;
    if (additionalTransferSession?.context.source === "hospitalAdditionalTransfer") {
      if (String(window.currentClaimDetailMock?.recordKey || "") !== String(additionalTransferSession.recordKey || "")) {
        clearAdditionalTransferNavigationContext({ restoreClaimGlobals: true });
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      restoreAdditionalTransferDetail();
      return;
    }
    if (!activeSession) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreMonitorState();
  }, true);

  document.addEventListener("click", function (event) {
    if (!additionalTransferSession) return;
    const sidebarButton = event.target.closest("aside.fixed button[id^='submenu']");
    if (sidebarButton) clearAdditionalTransferNavigationContext({ restoreClaimGlobals: true });
  }, true);

  window.openClaimMonitorDetail = openClaimMonitorDetail;
  window.openClaimDetailFromAdditionalTransfer = openClaimDetailFromAdditionalTransfer;
  window.backToClaimMonitorDetailSource = restoreMonitorState;
  window.ClaimMonitorDetailRouting = Object.freeze({
    resolveRecord,
    validateContext,
    restoreMonitorState,
    restoreAdditionalTransferDetail,
    openFromAdditionalTransfer: openClaimDetailFromAdditionalTransfer
  });
})();
