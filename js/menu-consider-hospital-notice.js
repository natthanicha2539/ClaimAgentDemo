/* พิจารณาเคลม > เคลมโรงพยาบาล: scoped overview, Notice monitor and Notice detail. */
(function () {
  "use strict";

  const page = document.getElementById("considerPage");
  if (!page || typeof window.createConsiderHospitalNoticeState !== "function") return;

  const state = window.createConsiderHospitalNoticeState();
  const statusLabels = { NEW:"Notice เข้าใหม่", IN_PROGRESS:"กำลังดำเนินการ", WAITING:"รอข้อมูล / ตรวจสอบ", REPLIED:"ตอบโรงพยาบาลแล้ว", CLOSED:"ปิด Notice" };
  let currentDetail = null;
  let returnFocus = null;
  let inertTargets = [];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function byId(id) { return document.getElementById(id); }
  function isHospital() { return page.dataset.considerTab === "hospital"; }
  function counts() {
    return Object.keys(statusLabels).reduce(function (acc, key) { acc[key] = state.records.filter(function (item) { return item.status === key; }).length; return acc; }, {});
  }
  function announce(message) { const live = byId("hcnLive"); if (live) live.textContent = message; }

  function installMarkup() {
    const dashboardGrid = page.querySelector(".consider-dashboard-grid");
    if (dashboardGrid && !byId("hospitalNoticeDashboard")) {
      dashboardGrid.insertAdjacentHTML("afterend", `
        <section id="hospitalNoticeDashboard" class="hcn-dashboard" aria-labelledby="hcnDashboardTitle">
          <div class="hcn-dashboard-head"><div><h2 id="hcnDashboardTitle">Notice จากโรงพยาบาล</h2><p>รายการที่ควรติดตามก่อน แยกสถานะจากสถานะเคลม</p></div><div class="hcn-dashboard-actions"><button type="button" class="hcn-btn hcn-btn-secondary" data-hcn-detail="HN001">ดู Notice</button><button type="button" class="hcn-btn hcn-btn-primary" data-hcn-open-monitor><span class="material-icons-round" aria-hidden="true">open_in_new</span>เปิดหน้า Notice</button></div></div>
          <div id="hcnDashboardPriority" class="hcn-priority"></div>
        </section>`);
    }
    if (!byId("hospitalNoticeMonitorView")) {
      page.insertAdjacentHTML("beforeend", `
        <section id="hospitalNoticeMonitorView" class="hcn-page hidden" aria-labelledby="hcnMonitorTitle">
          <div id="hcnLive" class="hcn-live" role="status" aria-live="polite"></div>
          <header class="hcn-head"><div class="hcn-head-main"><button type="button" class="hcn-icon-btn" data-hcn-back aria-label="กลับหน้าพิจารณาเคลม"><span class="material-icons-round" aria-hidden="true">arrow_back</span></button><div><span class="hcn-eyebrow">HOSPITAL OPERATIONS</span><h2 id="hcnMonitorTitle">Hospital Notice Monitor</h2><p>จัดลำดับและติดตาม Notice จากโรงพยาบาล โดยไม่เปลี่ยนสถานะเคลม</p></div></div><div class="hcn-head-meta"><span><span class="material-icons-round" aria-hidden="true">schedule</span>ข้อมูลตัวอย่าง ณ 18 ก.ย. 2569</span><button type="button" class="hcn-btn hcn-btn-secondary" data-hcn-reset><span class="material-icons-round" aria-hidden="true">restart_alt</span>ล้างตัวกรอง</button></div></header>
          <div id="hcnKpis" class="hcn-kpis" aria-label="สรุป Notice แยกตามสถานะ"></div>
          <section class="hcn-priority-board" aria-labelledby="hcnPriorityTitle"><div class="hcn-section-title"><div><h3 id="hcnPriorityTitle">Priority Watch</h3><p>เรียงตามจำนวนวันที่เกิน Due Date มากที่สุด</p></div></div><div id="hcnPriorityBoard" class="hcn-watch-grid"></div></section>
          <section class="hcn-monitor" aria-labelledby="hcnListTitle"><div class="hcn-monitor-head hcn-section-title"><div><h3 id="hcnListTitle">รายการ Notice</h3><p id="hcnResultCount"></p></div></div>
            <div class="hcn-filters">
              <label class="hcn-field"><span>ค้นหา</span><input id="hcnSearch" type="search" placeholder="Claim No., Case No., ผู้เอาประกัน, โรงพยาบาล"></label>
              <label class="hcn-field"><span>โรงพยาบาล</span><select id="hcnHospital"><option value="">ทุกโรงพยาบาล</option></select></label>
              <label class="hcn-field"><span>เกิน Due Date</span><select id="hcnDays"><option value="">ทุกช่วงเวลา</option><option value="1">ตั้งแต่ 1 วัน</option><option value="3">ตั้งแต่ 3 วัน</option><option value="7">ตั้งแต่ 7 วัน</option></select></label>
              <label class="hcn-field"><span>Notice Status</span><select id="hcnStatus"><option value="">ทุกสถานะ</option>${Object.keys(statusLabels).map(function (key) { return `<option value="${key}">${statusLabels[key]}</option>`; }).join("")}</select></label>
              <button type="button" class="hcn-btn hcn-btn-secondary hcn-reset" data-hcn-reset>Reset</button>
            </div>
            <div id="hcnTabs" class="hcn-tabs" role="group" aria-label="กรองสถานะ Notice"></div>
            <div class="hcn-table-wrap" tabindex="0" aria-label="ตาราง Notice เลื่อนในแนวนอนได้บนหน้าจอขนาดเล็ก"><table class="hcn-table"><thead><tr><th>วันที่ Notice</th><th>Claim No.</th><th>Case No.</th><th>โรงพยาบาล</th><th>ผู้เอาประกัน</th><th>เกิน Due Date</th><th>Notice Status</th><th>ดำเนินการ</th></tr></thead><tbody id="hcnTableBody"></tbody></table><div id="hcnEmpty" class="hcn-empty hidden">ไม่พบ Notice ที่ตรงกับเงื่อนไข กรุณาปรับตัวกรองแล้วลองอีกครั้ง</div></div>
          </section>
        </section>`);
    }
    if (!byId("hcnDetailMask")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div id="hcnDetailMask" class="hcn-mask hidden"></div>
        <aside id="hcnDetailDrawer" class="hcn-drawer hcn-modal hidden" role="dialog" aria-modal="true" aria-labelledby="hcnDetailTitle" aria-describedby="hcnDetailDescription">
          <header class="hcn-drawer-head"><div><h2 id="hcnDetailTitle">Notice Detail</h2><p id="hcnDetailDescription">รายละเอียดและการดำเนินการ Notice จากโรงพยาบาล</p></div><button type="button" class="hcn-icon-btn" data-hcn-close aria-label="ปิดรายละเอียด Notice"><span class="material-icons-round" aria-hidden="true">close</span></button></header>
          <div id="hcnDetailBody" class="hcn-drawer-body"></div>
          <footer class="hcn-drawer-foot"><span class="hcn-footer-note">ข้อความตอบกลับไม่บังคับ</span><div class="hcn-footer-actions"><button type="button" class="hcn-btn hcn-btn-secondary" data-hcn-open-claim><span class="material-icons-round" aria-hidden="true">open_in_new</span>เปิดรายละเอียดเคลม</button><button type="button" class="hcn-btn hcn-btn-primary" data-hcn-primary-action></button></div></footer>
        </aside>`);
    }
    const hospitalSelect = byId("hcnHospital");
    if (hospitalSelect && hospitalSelect.options.length === 1) {
      Array.from(new Set(state.records.map(function (r) { return r.hospital; }))).sort(function (a,b) { return a.localeCompare(b,"th"); }).forEach(function (name) {
        const option = document.createElement("option"); option.value = name; option.textContent = name; hospitalSelect.appendChild(option);
      });
    }
  }

  function renderDashboard() {
    const host = byId("hcnDashboardPriority"); if (!host) return;
    host.innerHTML = state.records.slice().sort(function (a,b) { return b.overdueDays-a.overdueDays; }).slice(0,3).map(function (item) {
      return `<article class="hcn-priority-card"><div><strong>${esc(item.hospital)}</strong><span>${esc(item.claimNo)} · เกิน ${item.overdueDays} วัน</span></div><button type="button" data-hcn-detail="${item.id}">ดู Notice</button></article>`;
    }).join("");
  }
  function filteredRecords() {
    const query = state.query.trim().toLowerCase();
    const requiredStatus = state.status || state.activeTab;
    return state.records.filter(function (item) {
      const haystack = [item.claimNo,item.caseNo,item.hospital,item.insured].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!state.hospital || item.hospital === state.hospital) && (!state.minimumDays || item.overdueDays >= Number(state.minimumDays)) && (!requiredStatus || item.status === requiredStatus);
    });
  }
  function renderMonitor() {
    const summary = counts();
    const icons={NEW:"mark_email_unread",IN_PROGRESS:"sync",WAITING:"hourglass_top",REPLIED:"forward_to_inbox",CLOSED:"task_alt"};
    byId("hcnKpis").innerHTML = Object.keys(statusLabels).map(function (key) { return `<button type="button" class="hcn-kpi" data-status="${key}" data-hcn-kpi="${key}" aria-label="กรอง ${statusLabels[key]} ${summary[key]} รายการ"><i class="material-icons-round" aria-hidden="true">${icons[key]}</i><span>${statusLabels[key]}</span><strong>${summary[key]}</strong><small>รายการ</small></button>`; }).join("");
    byId("hcnTabs").innerHTML = [{key:"",label:"ทั้งหมด"}].concat(Object.keys(statusLabels).map(function (key) { return {key:key,label:statusLabels[key]}; })).map(function (tab) {
      const total = tab.key ? summary[tab.key] : state.records.length;
      return `<button type="button" class="hcn-tab" aria-pressed="${state.activeTab===tab.key}" data-hcn-tab="${tab.key}">${tab.label} <b>${total}</b></button>`;
    }).join("");
    const watch = state.records.slice().sort(function (a,b) { return b.overdueDays-a.overdueDays; }).slice(0,3);
    byId("hcnPriorityBoard").innerHTML = watch.map(function (item,index) { return `<article class="hcn-watch" data-rank="${index+1}"><div class="hcn-watch-rank">${index+1}</div><div class="hcn-watch-copy"><strong>${esc(item.hospital)}</strong><span>${esc(item.claimNo)} · ${esc(item.insured)}</span></div><div class="hcn-watch-days"><strong>${item.overdueDays}</strong><span>วันเกินกำหนด</span></div><button type="button" class="hcn-btn hcn-btn-secondary" data-hcn-detail="${item.id}">ดูรายละเอียด</button></article>`; }).join("");
    const rows = filteredRecords(); byId("hcnResultCount").textContent = `พบ ${rows.length} จาก ${state.records.length} รายการ`;
    byId("hcnTableBody").innerHTML = rows.map(function (item) { return `<tr><td>${esc(item.noticeAt)}</td><td><strong>${esc(item.claimNo)}</strong></td><td>${esc(item.caseNo)}</td><td>${esc(item.hospital)}</td><td>${esc(item.insured)}</td><td><strong>${item.overdueDays} วัน</strong></td><td><span class="hcn-status" data-status="${item.status}">${statusLabels[item.status]}</span></td><td><button type="button" class="hcn-btn hcn-btn-secondary" data-hcn-detail="${item.id}">ดูรายละเอียด</button></td></tr>`; }).join("");
    byId("hcnEmpty").classList.toggle("hidden", rows.length !== 0); byId("hcnTableBody").closest("table").classList.toggle("hidden", rows.length === 0);
  }
  function resetFilters() {
    state.query = state.hospital = state.minimumDays = state.status = state.activeTab = "";
    ["hcnSearch","hcnHospital","hcnDays","hcnStatus"].forEach(function (id) { const el=byId(id); if(el) el.value=""; }); renderMonitor(); announce("ล้างตัวกรอง Notice แล้ว");
  }
  function openMonitor() { page.classList.add("hcn-show-monitor"); byId("hospitalNoticeMonitorView").classList.remove("hidden"); renderMonitor(); window.scrollTo({top:0,behavior:"smooth"}); byId("hcnMonitorTitle").setAttribute("tabindex","-1"); byId("hcnMonitorTitle").focus({preventScroll:true}); }
  function closeMonitor() { page.classList.remove("hcn-show-monitor"); byId("hospitalNoticeMonitorView").classList.add("hidden"); window.scrollTo({top:0,behavior:"smooth"}); }

  function renderDetail(item) {
    byId("hcnDetailTitle").textContent = `${item.claimNo} · Notice`;
    byId("hcnDetailBody").innerHTML = `
      <section class="hcn-detail-section"><div class="hcn-detail-title-row"><h3><span class="material-icons-round" aria-hidden="true">assignment</span>Summary</h3><span class="hcn-status" data-status="${item.status}">${statusLabels[item.status]}</span></div><div class="hcn-summary-grid">
        <div><span>Claim No.</span><strong>${esc(item.claimNo)}</strong></div><div><span>Case No.</span><strong>${esc(item.caseNo)}</strong></div><div><span>โรงพยาบาล</span><strong>${esc(item.hospital)}</strong></div><div><span>ผู้เอาประกัน</span><strong>${esc(item.insured)}</strong></div><div><span>เกิน Due Date</span><strong>${item.overdueDays} วัน</strong></div><div><span>ผู้รับผิดชอบ</span><strong>${esc(item.owner)}</strong></div>
      </div></section>
      <section class="hcn-detail-section"><h3><span class="material-icons-round" aria-hidden="true">mail</span>ข้อความจากโรงพยาบาล</h3><div class="hcn-message">${esc(item.message)}</div></section>
      <section class="hcn-detail-section hcn-reply"><h3><span class="material-icons-round" aria-hidden="true">reply</span>ตอบกลับโรงพยาบาล</h3><div class="hcn-reply-grid"><label class="hcn-field"><span>ข้อความสำเร็จรูป</span><select id="hcnReplyTemplate"><option value="">เลือกข้อความ (ไม่บังคับ)</option><option value="checking">กำลังตรวจสอบ</option><option value="waiting">รอข้อมูลเพิ่มเติม</option><option value="done">ดำเนินการแล้ว</option></select></label><label class="hcn-field"><span>ข้อความตอบกลับ</span><textarea id="hcnReply" placeholder="พิมพ์ข้อความตอบกลับ...">${esc(item.reply)}</textarea></label></div>${item._lastSavedAt ? `<p class="hcn-save-state" role="status"><span class="material-icons-round" aria-hidden="true">check_circle</span>บันทึกแล้ว · ${esc(item._lastSavedAt)}</p>` : ""}</section>
      <details class="hcn-detail-section hcn-history"><summary><span><span class="material-icons-round" aria-hidden="true">history</span>Activity History</span><b>${item.history.length} รายการ</b><span class="material-icons-round hcn-chevron" aria-hidden="true">expand_more</span></summary><div class="hcn-timeline">${item.history.map(function (event) { return `<div class="hcn-event"><strong>${esc(event.action)}</strong><span>${esc(event.actor)} · ${esc(event.time)}</span></div>`; }).join("")}</div></details>`;
    const primary = byId("hcnDetailDrawer").querySelector("[data-hcn-primary-action]");
    const saved = Boolean(item._lastSavedAt && item._lastSavedReply === item.reply);
    primary.disabled = saved;
    primary.innerHTML = saved ? '<span class="material-icons-round" aria-hidden="true">task_alt</span>บันทึกแล้ว' : item.status === "NEW" ? '<span class="material-icons-round" aria-hidden="true">check_circle</span>บันทึกและรับดำเนินการ' : '<span class="material-icons-round" aria-hidden="true">save</span>บันทึกคำตอบ';
  }
  function openDetail(id, trigger) {
    const item = state.records.find(function (record) { return record.id === id; }); if (!item) return;
    currentDetail = item; returnFocus = trigger || document.activeElement; renderDetail(item);
    byId("hcnDetailMask").classList.remove("hidden"); byId("hcnDetailDrawer").classList.remove("hidden"); document.body.style.overflow = "hidden";
    inertTargets = Array.from(document.body.children).filter(function (node) { return node.id !== "hcnDetailMask" && node.id !== "hcnDetailDrawer" && node.tagName !== "SCRIPT"; }); inertTargets.forEach(function (node) { node.inert = true; });
    byId("hcnDetailDrawer").querySelector("[data-hcn-close]").focus();
  }
  function closeDetail() {
    byId("hcnDetailMask").classList.add("hidden"); byId("hcnDetailDrawer").classList.add("hidden"); document.body.style.overflow = ""; inertTargets.forEach(function (node) { node.inert = false; }); inertTargets=[]; const target=returnFocus; returnFocus=null; currentDetail=null; if(target && target.isConnected) target.focus();
  }
  function timestamp() { return new Intl.DateTimeFormat("th-TH",{dateStyle:"short",timeStyle:"medium",timeZone:"Asia/Bangkok"}).format(new Date()); }
  function commitDetailAction() {
    if (!currentDetail) return;
    const text=byId("hcnReply").value.trim(), wasNew=currentDetail.status === "NEW", replyChanged=text !== currentDetail.reply;
    if (currentDetail._lastSavedAt && currentDetail._lastSavedReply === text) { announce("คำตอบนี้บันทึกแล้ว"); return; }
    currentDetail.reply=text;
    if (text && replyChanged) { currentDetail.status="REPLIED"; currentDetail.history.unshift({action:"บันทึกคำตอบถึงโรงพยาบาล",time:timestamp(),actor:"Login User"}); }
    else if (wasNew) { currentDetail.status="IN_PROGRESS"; currentDetail.history.unshift({action:"รับดำเนินการ",time:timestamp(),actor:"Login User"}); }
    currentDetail._lastSavedReply = text;
    currentDetail._lastSavedAt = timestamp();
    renderDashboard(); renderMonitor(); renderDetail(currentDetail);
    announce(text && replyChanged ? "บันทึกคำตอบและอัปเดตสถานะแล้ว" : wasNew ? "รับดำเนินการ Notice แล้ว" : "ไม่มีข้อมูลที่เปลี่ยนแปลง");
  }
  function openClaim() {
    if (!currentDetail) return; const claimNo=currentDetail.claimNo, caseNo=currentDetail.caseNo; closeDetail(); closeMonitor();
    try { const rows=typeof considerationHospitalRows!=="undefined"?considerationHospitalRows:[]; const index=rows.findIndex(function (row) { return row.claimCode===claimNo || row.caseNo===caseNo; }); if(index>=0 && typeof window.openConsiderHospitalRow==="function") window.openConsiderHospitalRow(index); else announce("ไม่พบรายละเอียดเคลมที่เชื่อมโยง"); } catch(error) { console.error("Hospital Notice claim routing failed",error); }
  }
  function enhanceHospitalTable() {
    if (!isHospital()) return; const head=byId("considerTableHead"),body=byId("considerTableBody"); if(!head||!body) return;
    const headRow=head.querySelector("tr"); if(headRow && !headRow.querySelector("[data-hcn-case-head]")) { const claimHead=headRow.children[1]; if(claimHead) claimHead.insertAdjacentHTML("afterend",'<th data-hcn-case-head class="px-4 py-3 text-left">เลขที่ Case</th>'); }
    Array.from(body.rows).forEach(function (tr) { if(tr.querySelector("[data-hcn-case-cell]")) return; const claimCell=tr.cells[1]; if(!claimCell) return; const claimText=claimCell.textContent.trim().split(/\s/)[0]; let source=null; try { source=(typeof considerationHospitalRows!=="undefined"?considerationHospitalRows:[]).find(function (row) { return row.claimCode===claimText; }); } catch(e) {} const cell=document.createElement("td"); cell.dataset.hcnCaseCell=""; cell.className="px-4 py-4 font-semibold text-slate-700"; cell.textContent=source&&source.caseNo?source.caseNo:"-"; claimCell.after(cell); });
  }
  function activateHospital() { page.dataset.considerTab="hospital"; page.classList.remove("hcn-show-monitor"); byId("hospitalNoticeMonitorView").classList.add("hidden"); renderDashboard(); setTimeout(enhanceHospitalTable,0); }
  function activateCustomer() { delete page.dataset.considerTab; page.classList.remove("hcn-show-monitor"); byId("hospitalNoticeMonitorView").classList.add("hidden"); }

  installMarkup(); renderDashboard();
  const previousRender=window.renderConsiderationTable;
  if(typeof previousRender==="function") window.renderConsiderationTable=function(){ const result=previousRender.apply(this,arguments); setTimeout(enhanceHospitalTable,0); return result; };

  document.addEventListener("click",function (event) {
    const target=event.target;
    if(target.closest("#submenuConsiderHospital")) setTimeout(activateHospital,0);
    if(target.closest("#submenuConsiderCustomer")) setTimeout(activateCustomer,0);
    if(target.closest("[data-hcn-open-monitor]")) openMonitor();
    if(target.closest("[data-hcn-back]")) closeMonitor();
    if(target.closest("[data-hcn-reset]")) resetFilters();
    const tab=target.closest("[data-hcn-tab]"); if(tab){state.activeTab=tab.dataset.hcnTab;state.status="";byId("hcnStatus").value="";renderMonitor();}
    const kpi=target.closest("[data-hcn-kpi]"); if(kpi){state.activeTab=kpi.dataset.hcnKpi;state.status="";byId("hcnStatus").value="";renderMonitor();byId("hcnListTitle").scrollIntoView({behavior:"smooth",block:"start"});}
    const detail=target.closest("[data-hcn-detail]"); if(detail) openDetail(detail.dataset.hcnDetail,detail);
    if(target.closest("[data-hcn-close]")||target.id==="hcnDetailMask") closeDetail();
    if(target.closest("[data-hcn-primary-action]")) commitDetailAction();
    if(target.closest("[data-hcn-open-claim]")) openClaim();
  });
  ["hcnSearch","hcnHospital","hcnDays","hcnStatus"].forEach(function (id) { const el=byId(id); if(!el)return; el.addEventListener(id==="hcnSearch"?"input":"change",function(){state.query=byId("hcnSearch").value;state.hospital=byId("hcnHospital").value;state.minimumDays=byId("hcnDays").value;state.status=byId("hcnStatus").value;if(state.status)state.activeTab="";renderMonitor();}); });
  function syncPrimaryActionState() { const button=byId("hcnDetailDrawer").querySelector("[data-hcn-primary-action]"), reply=byId("hcnReply"); if(!button||!reply||!currentDetail)return; const saved=Boolean(currentDetail._lastSavedAt && currentDetail._lastSavedReply === reply.value.trim()); button.disabled=saved; button.innerHTML=saved ? '<span class="material-icons-round" aria-hidden="true">task_alt</span>บันทึกแล้ว' : currentDetail.status === "NEW" ? '<span class="material-icons-round" aria-hidden="true">check_circle</span>บันทึกและรับดำเนินการ' : '<span class="material-icons-round" aria-hidden="true">save</span>บันทึกคำตอบ'; }
  document.addEventListener("input",function(event){if(event.target.id==="hcnReply")syncPrimaryActionState();});
  document.addEventListener("change",function(event){if(event.target.id!=="hcnReplyTemplate")return;const templates={checking:"รับทราบค่ะ ขณะนี้อยู่ระหว่างตรวจสอบข้อมูล และจะเร่งดำเนินการให้โดยเร็วค่ะ",waiting:"ตรวจสอบแล้ว พบว่ายังรอข้อมูลหรือเอกสารเพิ่มเติม เมื่อได้รับครบจะดำเนินการต่อค่ะ",done:"ดำเนินการตรวจสอบเรียบร้อยแล้ว กรุณาตรวจสอบสถานะล่าสุดผ่านระบบค่ะ"};if(event.target.value){byId("hcnReply").value=templates[event.target.value];byId("hcnReply").focus();syncPrimaryActionState();}});
  document.addEventListener("keydown",function(event){if(byId("hcnDetailDrawer").classList.contains("hidden"))return;if(event.key==="Escape"){event.preventDefault();closeDetail();return;}if(event.key==="Tab"){const items=Array.from(byId("hcnDetailDrawer").querySelectorAll("button,select,textarea,summary")).filter(function(el){return !el.disabled;});const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
})();
