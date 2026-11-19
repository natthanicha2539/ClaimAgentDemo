/* Claim Detail mock resolver: appId is the only lookup key. */
(function () {
  "use strict";

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function merge(target) {
    for (let index = 1; index < arguments.length; index += 1) {
      const source = arguments[index];
      if (!source || typeof source !== "object") continue;
      Object.keys(source).forEach(key => {
        const value = source[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const current = target[key] && typeof target[key] === "object" && !Array.isArray(target[key]) ? target[key] : {};
          target[key] = merge(current, value);
        } else {
          target[key] = clone(value);
        }
      });
    }
    return target;
  }

  function monitorRows() {
    try {
      return typeof claimMonitorRows !== "undefined" && Array.isArray(claimMonitorRows) ? claimMonitorRows : [];
    } catch (error) {
      return [];
    }
  }

  function appSpecific(record) {
    const key = String(record.appId);
    const safeKey = key.replace(/[^0-9A-Za-z]/g, "").padStart(6, "0");
    return {
      recordKey: key,
      claimNo: `${record.product === "PA" ? "CLPA" : "CL"}-MOCK-${safeKey}`,
      caseNo: `CASE-MOCK-${safeKey}`,
      applicationId: key,
      insuredName: record.name,
      citizenId: record.idCard || "-",
      passport: record.passport || "",
      studentRef: record.studentRef || "",
      insuredStatus: record.appStatus || "ปกติ",
      contact: record.phone || "-",
      plan: record.plan || "-",
      hospitalProvince: record.province || "กรุงเทพมหานคร",
      schoolInformation: record.product === "PA" ? {
        name: record.school || "โรงเรียนทดสอบ Claim Monitor",
        coordinator: record.coordinatorName || "ครูผู้ประสานงาน",
        coordinatorPhone: record.coordinatorPhone || record.phone || "-"
      } : null
    };
  }

  function toRendererRecord(record, detail) {
    return merge({}, record, detail, {
      appId: record.appId,
      applicationId: record.appId,
      product: record.product,
      claimCategory: record.claimCategory,
      claimType: record.claimType,
      treatmentType: record.treatmentType,
      itemStatus: record.itemStatus,
      name: detail.insuredName,
      idCard: detail.citizenId,
      phone: detail.contact,
      appStatus: detail.insuredStatus,
      school: detail.schoolInformation ? detail.schoolInformation.name : "-",
      claimCode: detail.claimNo,
      claimStatus: detail.claimStatus,
      date: detail.claimDate,
      amount: detail.financial.claimedAmount,
      claimCause: detail.claimCause,
      coverageType: detail.coverageType,
      incidentDate: detail.incidentDateTime.date,
      incidentTime: detail.incidentDateTime.time,
      admitDate: detail.hospitalInDateTime.date,
      admitTime: detail.hospitalInDateTime.time,
      dischargeDate: detail.hospitalOutDateTime.date,
      dischargeTime: detail.hospitalOutDateTime.time,
      hospital: detail.hospitalName,
      province: detail.hospitalProvince,
      diagnosis: detail.diagnosis1,
      note: detail.medicalNote,
      ipdDays: detail.stayDays.ipd,
      icuDays: detail.stayDays.icu,
      totalStayDays: detail.stayDays.total,
      claimDetailMock: detail
    });
  }

  function resolve(appId) {
    if (!appId) return { detail: null, rendererRecord: null, error: "missing-record-key" };
    const matches = monitorRows().filter(row => String(row.appId) === String(appId));
    if (matches.length !== 1) {
      return { detail: null, rendererRecord: null, error: matches.length ? "ambiguous-record-key" : "record-not-found" };
    }
    const record = matches[0];
    const catalog = window.claimDetailMockCatalog;
    if (!catalog) return { detail: null, rendererRecord: null, error: "mock-catalog-unavailable" };
    const detail = merge(
      {}, catalog.base,
      catalog.productOverrides[record.product],
      catalog.categoryOverrides[record.claimCategory],
      catalog.treatmentOverrides[record.claimType],
      catalog.statusOverrides[record.itemStatus],
      appSpecific(record),
      {
        recordKey: record.appId, applicationId: record.appId, product: record.product, plan: record.plan,
        claimCategory: record.claimCategory, claimType: record.claimType,
        treatmentType: record.treatmentType, treatment: record.claimType,
        claimStatus: record.itemStatus, insuredName: record.name, citizenId: record.idCard || "-",
        passport: record.passport || "", studentRef: record.studentRef || "",
        insuredStatus: record.appStatus || "ปกติ", contact: record.phone || "-"
      }
    );
    detail.financial.approvedAmount = detail.approvedAmount == null ? null : Number(detail.approvedAmount).toFixed(2);
    return { detail, rendererRecord: toRendererRecord(record, detail), error: "" };
  }

  function deriveProductFromClaimNo(claimNo) {
    const normalized = String(claimNo || "").trim().toUpperCase();
    if (normalized.startsWith("CLPA")) return "PA";
    if (normalized.startsWith("CL")) return "PH";
    return "";
  }

  function normalizeTreatment(treatment) {
    const normalized = String(treatment || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized === "opd half") return "OPD Half";
    if (normalized === "opd full") return "OPD Full";
    if (normalized === "ipd") return "IPD";
    if (normalized === "day case" || normalized === "daycase" || normalized === "day case surgery" || normalized === "daycase surgery") return "Day Case Surgery";
    if (normalized === "opd") return "OPD";
    return "";
  }

  function normalizeClaimCategory(claimType) {
    const normalized = String(claimType || "").trim().toLowerCase();
    if (normalized === "hospital" || normalized === "เคลมโรงพยาบาล") return "เคลมโรงพยาบาล";
    if (normalized === "customer" || normalized === "เคลมลูกค้า") return "เคลมลูกค้า";
    return "";
  }

  function amount(value) {
    return Number(value || 0).toFixed(2);
  }

  function findAdditionalTransferRequest(claimNo, caseNo) {
    const requests = window.ClaimAgentHospitalAdditionalTransferMock?.requests;
    if (!Array.isArray(requests)) return null;
    return requests.find(function (request) {
      return String(request.claimNo || "").trim().toUpperCase() === claimNo && String(request.caseNo || "").trim().toUpperCase() === caseNo;
    }) || null;
  }

  function previousClaimDate(receivedDate) {
    const parts = String(receivedDate || "").split("/").map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) return null;
    const date = new Date(parts[2] - 543, parts[1] - 1, parts[0]);
    date.setDate(date.getDate() - 1);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return {
      iso: date.getFullYear() + "-" + month + "-" + day,
      thai: day + "/" + month + "/" + (date.getFullYear() + 543)
    };
  }

  function additionalTransferClaimConsistency(request) {
    if (!request) return {};
    const priorDate = previousClaimDate(request.receivedDate);
    const treatmentItems = Array.isArray(request.treatmentItems) ? request.treatmentItems : [];
    const itemNames = treatmentItems.map(function (item) { return item.name; }).filter(Boolean);
    const approvedAmount = amount(request.originalApproved);
    const documents = (request.documents || []).map(function (documentItem, index) {
      return {
        code: "PREV-" + String(index + 1).padStart(2, "0"),
        name: documentItem.name,
        status: "ได้รับเอกสารแล้ว",
        note: "เอกสารเชื่อมโยงคำขอโอนเพิ่ม " + request.requestId
      };
    });
    return {
      claimDate: priorDate ? priorDate.thai + " 15:30:00" : undefined,
      decisionDate: priorDate ? priorDate.thai + " 16:30:00" : undefined,
      incidentDateTime: priorDate ? { date: priorDate.iso, time: "09:30" } : undefined,
      hospitalInDateTime: priorDate ? { date: priorDate.iso, time: "10:00" } : undefined,
      hospitalOutDateTime: priorDate ? { date: priorDate.iso, time: request.treatment === "IPD" ? "18:00" : "12:30" } : undefined,
      plan: request.plan,
      insuredName: request.insured,
      hospitalName: request.hospital,
      approvedAmount: Number(request.originalApproved || 0),
      financial: {
        claimedAmount: approvedAmount,
        discountAmount: "0.00",
        nonCoveredAmount: "0.00",
        eligibleAmount: approvedAmount,
        approvedAmount
      },
      medicalNote: "เคลมครั้งก่อนอนุมัติ " + approvedAmount + " บาท ก่อนรับคำขอโอนเพิ่ม " + request.requestId + (itemNames.length ? " โดยรายการที่ขอพิจารณาเพิ่มเกี่ยวข้องกับ " + itemNames.join(" และ ") : ""),
      documents,
      additionalTransferReference: {
        requestId: request.requestId,
        requestedAmount: Number(request.requestedAmount || 0),
        treatmentItems: clone(treatmentItems)
      }
    };
  }

  function resolveByClaimContext(context) {
    const input = context || {};
    const claimNo = String(input.claimNo || "").trim().toUpperCase();
    const caseNo = String(input.caseNo || "").trim().toUpperCase();
    if (!claimNo || !caseNo) return { detail: null, rendererRecord: null, record: null, error: "missing-claim-context" };

    const product = deriveProductFromClaimNo(claimNo);
    if (!product) return { detail: null, rendererRecord: null, record: null, error: "unsupported-product-prefix" };
    const treatment = normalizeTreatment(input.treatment);
    if (!treatment) return { detail: null, rendererRecord: null, record: null, error: "unsupported-treatment" };
    const claimCategory = normalizeClaimCategory(input.claimType);
    if (!claimCategory) return { detail: null, rendererRecord: null, record: null, error: "unsupported-claim-category" };

    const catalog = window.claimDetailMockCatalog;
    if (!catalog) return { detail: null, rendererRecord: null, record: null, error: "mock-catalog-unavailable" };
    const records = Array.isArray(catalog.contextRecords) ? catalog.contextRecords : [];
    const matches = records.filter(function (record) {
      return String(record.claimNo || "").trim().toUpperCase() === claimNo && String(record.caseNo || "").trim().toUpperCase() === caseNo;
    });
    if (matches.length !== 1) {
      return { detail: null, rendererRecord: null, record: null, error: matches.length ? "ambiguous-claim-context" : "claim-context-not-found" };
    }

    const sourceRecord = matches[0];
    const sourceTreatment = normalizeTreatment(sourceRecord.claimType);
    if (sourceRecord.product !== product) return { detail: null, rendererRecord: null, record: null, error: "product-mismatch" };
    if (sourceRecord.claimCategory !== claimCategory) return { detail: null, rendererRecord: null, record: null, error: "claim-category-mismatch" };
    if (sourceTreatment !== treatment) return { detail: null, rendererRecord: null, record: null, error: "treatment-mismatch" };

    const record = merge({}, sourceRecord, {
      product,
      claimCategory,
      claimType: treatment,
      treatmentType: sourceRecord.treatmentType || treatment
    });
    const linkedRequest = findAdditionalTransferRequest(claimNo, caseNo);
    const linkedConsistency = additionalTransferClaimConsistency(linkedRequest);
    const detail = merge(
      {}, catalog.base,
      catalog.productOverrides[product],
      catalog.categoryOverrides[claimCategory],
      catalog.treatmentOverrides[treatment],
      catalog.statusOverrides[record.itemStatus],
      appSpecific(record),
      linkedConsistency,
      {
        recordKey: record.appId,
        applicationId: record.appId,
        claimNo: sourceRecord.claimNo,
        caseNo: sourceRecord.caseNo,
        product,
        plan: linkedRequest?.plan || record.plan,
        claimCategory,
        claimType: treatment,
        treatmentType: record.treatmentType,
        treatment,
        claimStatus: record.itemStatus,
        insuredName: linkedRequest?.insured || record.name,
        hospitalName: linkedRequest?.hospital || record.hospital,
        approvedAmount: Number(linkedRequest?.originalApproved ?? record.approvedAmount ?? 0),
        financial: {
          claimedAmount: amount(linkedRequest?.originalApproved ?? record.claimedAmount),
          eligibleAmount: amount(linkedRequest?.originalApproved ?? record.approvedAmount),
          approvedAmount: amount(linkedRequest?.originalApproved ?? record.approvedAmount)
        }
      }
    );
    detail.financial.approvedAmount = amount(detail.approvedAmount);
    return { detail, rendererRecord: toRendererRecord(record, detail), record, error: "" };
  }

  window.ClaimDetailMockResolver = Object.freeze({ resolve, resolveByClaimContext });
})();
