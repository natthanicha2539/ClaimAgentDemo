/* Step 3 read-only fields shared by customer and hospital claim consideration. */
(function () {
  "use strict";
  const pages = [
    ["considerCustomerDetailPage", "cc"],
    ["considerHospitalOpdFullPage", "hf"],
    ["considerHospitalOpdHalfPage", "hh"],
    ["billingHospitalReviewPage", "hf", true],
    ["billingHospitalReviewPage", "hh", true]
  ];
  const necessity = {
    PAIN_MANAGEMENT: "การบรรเทาและลดอาการปวด",
    RESTORING_MOBILITY: "การเพิ่มและฟื้นฟูการเคลื่อนไหว",
    POST_INJURY_POST_SURGICAL_REHAB: "การฟื้นฟูผู้ป่วยหลังการบาดเจ็บหรือผ่าตัด"
  };
  const vehicle = { motorcycle: "มอเตอร์ไซค์", car: "รถยนต์", other: "อื่นๆ" };
  const casualty = { driver: "ผู้ขับขี่", passenger: "ผู้โดยสาร" };
  const yesNo = { yes: "ใช่", no: "ไม่ใช่", true: "ใช่", false: "ไม่ใช่" };
  function line(label, value) {
    const item = document.createElement("div");
    const title = document.createElement("div");
    const text = document.createElement("div");
    title.className = "text-sm font-bold text-slate-500";
    text.className = "font-extrabold text-brand-700";
    title.textContent = label + " :";
    text.textContent = value == null || value === "" ? "-" : String(value);
    item.append(title, text);
    return item;
  }
  function formatDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[3] + "/" + match[2] + "/" + (Number(match[1]) + 543) : (value || "-");
  }
  const coreLabels = [
    "เหตุของการเคลม", "ประเภทความคุ้มครอง", "ประเภทการรักษา",
    "วันที่แจ้งเคลม", "วันที่เอกสารครบ", "วันที่เกิดเหตุ", "เวลาที่เกิดเหตุ",
    "วันที่เข้า รพ.", "เวลาที่เข้า รพ.", "วันที่ออก รพ.", "เวลาที่ออก รพ."
  ];
  function coreValue(row, label) {
    const values = {
      "เหตุของการเคลม": row.claimCause || row.cause,
      "ประเภทความคุ้มครอง": row.coverageType || row.coverage,
      "ประเภทการรักษา": row.treatmentType || row.claimType,
      "วันที่แจ้งเคลม": formatDate(row.claimNoticeDate || row.notifiedDate || row.symptomDate),
      "วันที่เอกสารครบ": formatDate(row.documentCompleteDate || row.documentsCompleteDate || row.claim?.documentCompleteDate),
      "วันที่เกิดเหตุ": formatDate(row.incidentDate),
      "เวลาที่เกิดเหตุ": row.incidentTime,
      "วันที่เข้า รพ.": formatDate(row.admitDate),
      "เวลาที่เข้า รพ.": row.admitTime,
      "วันที่ออก รพ.": formatDate(row.dischargeDate),
      "เวลาที่ออก รพ.": row.dischargeTime
    };
    return values[label] || "-";
  }
  function labelOf(item) {
    return String(item.firstElementChild?.textContent || "").replace(/\s*:\s*$/, "").trim();
  }
  function valueFromStep1(page, prefix, labelText) {
    const pane = page.querySelector("#" + prefix + "StepPane1");
    const label = Array.from(pane?.querySelectorAll("label") || []).find(function (item) {
      return item.textContent?.includes(labelText);
    });
    const control = label?.querySelector("input,select,textarea");
    return control ? control.value : null;
  }
  function descriptionFromStep1(page, prefix) {
    return valueFromStep1(page, prefix, "รายละเอียดการเจ็บป่วย/การบาดเจ็บ");
  }
  function insertDescription(grid, value) {
    const children = Array.from(grid.children);
    const diagnosis = children.find(function (item) { return labelOf(item) === "คำวินิจฉัย 3"; });
    if (!diagnosis) return;
    const label = "รายละเอียดการเจ็บป่วย/การบาดเจ็บ";
    const item = children.find(function (node) { return labelOf(node) === label; }) || line(label, value);
    item.classList.add("md:col-span-3", grid.className.includes("xl:grid-cols-5") ? "xl:col-span-5" : "xl:col-span-3");
    item.lastElementChild.textContent = value == null || value === "" ? "-" : String(value);
    diagnosis.after(item);
  }
  function arrangeCore(grid, row) {
    const existing = Array.from(grid.children);
    const core = coreLabels.map(function (label) {
      const item = existing.find(function (node) { return labelOf(node) === label; }) || line(label, coreValue(row, label));
      item.dataset.step3CoreField = label;
      return item;
    });
    core.forEach(function (item) { grid.appendChild(item); });
    existing.filter(function (item) { return !core.includes(item); }).forEach(function (item) { grid.appendChild(item); });
    grid.dataset.step3CoreGrid = "true";
  }
  function section(title, fields) {
    const node = document.createElement("section");
    node.className = "claim-step3-extra-section";
    node.style.cssText = "margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0";
    const heading = document.createElement("h3");
    heading.className = "mb-3 text-lg font-extrabold text-brand-700";
    heading.textContent = title;
    const grid = document.createElement("div");
    grid.className = "grid gap-6 md:grid-cols-3 xl:grid-cols-5 text-lg";
    fields.forEach(function (field) { grid.appendChild(line(field[0], field[1])); });
    node.append(heading, grid);
    return node;
  }
  function selected(page, name) {
    return page.querySelector('[data-hospital-traffic-accident] input[name="' + name + '"]:checked')?.value || "";
  }
  function control(page, fragment) {
    return page.querySelector('[data-hospital-traffic-accident] [id$="' + fragment + '"]')?.value || "";
  }
  function update(pageId, prefix, isBilling) {
    const page = document.getElementById(pageId);
    const pane = page?.querySelector("#" + prefix + "StepPane3");
    const card = pane?.querySelector(".claim-detail-summary-card");
    if (!card) return;
    const row = prefix === "cc" ? window.currentConsiderCustomerRow || {} : window.currentConsiderHospitalRow || {};
    const grid = card.querySelector(".grid");
    if (!grid) return;
    if (isBilling) {
      const claim = window.__getBillingHospitalReviewState?.()?.claim || {};
      insertDescription(grid, claim.medicalDescription ?? descriptionFromStep1(page, prefix) ?? row.medicalDescription ?? "");
      return;
    }
    if (prefix === "cc" && pane.querySelector("[data-customer-compensation-step3]")) {
      [1, 2, 3].forEach(function (number) {
        const label = "คำวินิจฉัย " + number;
        if (Array.from(grid.children).some(function (item) { return labelOf(item) === label; })) return;
        grid.appendChild(line(label, valueFromStep1(page, prefix, "การวินิจฉัย" + number) ?? row["diagnosis" + number] ?? row["diag" + number] ?? ""));
      });
      insertDescription(grid, descriptionFromStep1(page, prefix) ?? row.medicalDescription ?? row.cc ?? row.chiefComplaint ?? "");
      return;
    }
    arrangeCore(grid, row);
    insertDescription(grid, descriptionFromStep1(page, prefix) ?? row.medicalDescription ?? row.medicalNote ?? (prefix === "cc" ? row.cc || row.chiefComplaint : "") ?? "");
    const date = Array.from(grid.children).find(function (item) { return labelOf(item) === "วันที่เอกสารครบ"; });
    date.lastElementChild.textContent = coreValue(row, "วันที่เอกสารครบ");
    card.querySelectorAll(".claim-step3-extra-section").forEach(function (node) { node.remove(); });
    const therapyOn = row.isPhysicalTherapy === true;
    const therapy = [["เป็นการกายภาพบำบัด", therapyOn ? "ใช่" : "ไม่ใช่"]];
    if (therapyOn) therapy.push(["ความจำเป็นทางการแพทย์", necessity[row.medicalNecessity] || row.medicalNecessity || "-"]);
    card.appendChild(section("ข้อมูลกายภาพบำบัด", therapy));
    const traffic = row.trafficAccident || row.trafficAccidentInfo || {};
    const flag = selected(page, prefix + "TrafficAccident") || traffic.isTrafficAccident;
    const flagText = yesNo[String(flag)] || "-";
    const fields = [["เป็นอุบัติเหตุจากการจราจร", flagText]];
    if (flagText === "ใช่") {
      const vehicleValue = selected(page, prefix + "TrafficVehicle") || traffic.vehicle || traffic.vehicleType || "";
      const casualtyValue = selected(page, prefix + "TrafficCasualty") || traffic.casualty || traffic.casualtyStatus || "";
      const porobo = selected(page, prefix + "TrafficPorobo") || traffic.poroboExcess || "";
      fields.push(["ประเภทยานพาหนะ", vehicle[vehicleValue] || vehicleValue || "-"]);
      if (vehicleValue === "other") fields.push(["โปรดระบุ", control(page, "TrafficVehicleOther") || traffic.vehicleOther || "-"]);
      fields.push(["ผู้ขับขี่ หรือ ผู้โดยสาร", casualty[casualtyValue] || casualtyValue || "-"]);
      fields.push(["เป็นส่วนเกิน พ.ร.บ.", yesNo[String(porobo)] || "-"]);
      if (String(porobo) === "no") fields.push(["โปรดระบุสาเหตุที่ไม่ใช้ พ.ร.บ.", control(page, "TrafficNoPoroboReason") || traffic.noPoroboReason || "-"]);
    }
    card.appendChild(section("ข้อมูลอุบัติเหตุจากการจราจร", fields));
  }
  function refresh() { pages.forEach(function (item) { update(item[0], item[1], item[2]); }); }
  ["setCustomerStep", "setHospitalFullStep", "setHospitalHalfStep"].forEach(function (name) {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function (step) {
      const result = original.apply(this, arguments);
      if (Number(step) === 3) setTimeout(refresh, 0);
      return result;
    };
  });
  document.addEventListener("click", function (event) {
    if (event.target.closest("#ccStepBtn3,#hfStepBtn3,#hhStepBtn3,[onclick*='Step(3)']")) setTimeout(refresh, 0);
  });
  document.addEventListener("DOMContentLoaded", refresh);
})();
