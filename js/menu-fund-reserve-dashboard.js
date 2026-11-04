/* ============================================================
   จัดการเงินกองทุน > Dashboard สำรองเงิน
   Read-only mock dashboard; financial values are presentation data only.
   ============================================================ */
(function () {
  "use strict";

  const dailyForecast = [
    { shortDate: "7 ก.ย.", fullDate: "7 ก.ย. 2569", amount: 2.48, balance: 10.37, records: 28, hospitals: 5, tone: "positive", status: "เงินเพียงพอ", color: "#087bea" },
    { shortDate: "8 ก.ย.", fullDate: "8 ก.ย. 2569", amount: 1.85, balance: 8.52, records: 24, hospitals: 4, tone: "positive", status: "เงินเพียงพอ", color: "#2f91e8" },
    { shortDate: "9 ก.ย.", fullDate: "9 ก.ย. 2569", amount: 3.20, balance: 5.32, records: 42, hospitals: 8, tone: "positive", status: "เงินเพียงพอ", color: "#637fe3" },
    { shortDate: "10 ก.ย.", fullDate: "10 ก.ย. 2569", amount: 1.40, balance: 3.92, records: 18, hospitals: 3, tone: "positive", status: "เงินเพียงพอ", color: "#2db4b8" },
    { shortDate: "11 ก.ย.", fullDate: "11 ก.ย. 2569", amount: 2.90, balance: 1.02, records: 31, hospitals: 6, tone: "caution", status: "เฝ้าระวัง", color: "#139cc1" },
    { shortDate: "12 ก.ย.", fullDate: "12 ก.ย. 2569", amount: 2.35, balance: -1.33, records: 26, hospitals: 5, tone: "danger", status: "เงินไม่เพียงพอ", color: "#8068d9" },
    { shortDate: "13 ก.ย.", fullDate: "13 ก.ย. 2569", amount: 1.54, balance: -2.87, records: 19, hospitals: 4, tone: "danger", status: "เงินไม่เพียงพอ", color: "#3a9bb2" }
  ];

  const maximumAmount = Math.max.apply(null, dailyForecast.map(function (item) { return item.amount; }));

  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function renderChart() {
    const bars = byId("frdChartBars");
    const coverage = byId("frdCoverageStrip");
    if (!bars || !coverage) return;

    bars.replaceChildren();
    coverage.replaceChildren();

    dailyForecast.forEach(function (item) {
      const column = createElement("div", "frd-chart-column");
      const barArea = createElement("div", "frd-bar-area");
      const bar = createElement("div", "frd-bar");
      const value = createElement("span", "frd-bar-value", item.amount.toFixed(2) + " ลบ.");
      const label = createElement("span", "frd-chart-label", item.shortDate);

      bar.style.setProperty("--bar-height", Math.max(14, (item.amount / maximumAmount) * 78) + "%");
      bar.style.setProperty("--bar-color", item.color);
      bar.appendChild(value);
      barArea.appendChild(bar);
      column.appendChild(barArea);
      column.appendChild(label);
      bars.appendChild(column);

      const coverageItem = createElement("div", "frd-coverage-item is-" + item.tone);
      coverageItem.appendChild(createElement("span", "", "สิ้นวัน " + item.shortDate));
      coverageItem.appendChild(createElement("strong", "", (item.balance < 0 ? "-" : "") + Math.abs(item.balance).toFixed(2) + " ลบ."));
      coverageItem.appendChild(createElement("small", "", item.status));
      coverage.appendChild(coverageItem);
    });
  }

  function renderTable() {
    const body = byId("frdUpcomingTableBody");
    if (!body) return;
    body.replaceChildren();

    dailyForecast.forEach(function (item) {
      const row = document.createElement("tr");
      [item.fullDate, String(item.records), String(item.hospitals), formatMoney(item.amount * 1000000)].forEach(function (value) {
        row.appendChild(createElement("td", "", value));
      });
      const statusCell = document.createElement("td");
      statusCell.appendChild(createElement("span", "frd-status is-" + item.tone, item.status));
      row.appendChild(statusCell);
      body.appendChild(row);
    });
  }

  function clearOtherMenuStates() {
    document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (button) {
      if (button.id === "menuFundManagement" || button.id === "submenuFundReserveDashboard") return;
      button.classList.remove("bg-white/15", "font-bold", "text-white");
    });
  }

  function setFundMenuActive(active) {
    const submenu = byId("fundManagementSubmenu");
    const parent = byId("menuFundManagement");
    const arrow = byId("fundManagementArrow");
    const dashboardButton = byId("submenuFundReserveDashboard");

    if (active) {
      clearOtherMenuStates();
      submenu && submenu.classList.remove("hidden");
      parent && parent.setAttribute("aria-expanded", "true");
      if (arrow) arrow.textContent = "expand_less";
      dashboardButton && dashboardButton.classList.add("bg-white/15", "font-bold", "text-white");
      dashboardButton && dashboardButton.classList.remove("font-semibold", "text-white/75");
      dashboardButton && dashboardButton.setAttribute("aria-current", "page");
    } else {
      dashboardButton && dashboardButton.classList.remove("bg-white/15", "font-bold", "text-white");
      dashboardButton && dashboardButton.classList.add("font-semibold", "text-white/75");
      dashboardButton && dashboardButton.removeAttribute("aria-current");
    }
  }

  function updatePageHeading() {
    const title = byId("pageTitle");
    const subtitle = byId("pageSubtitle");
    if (title) title.textContent = "Dashboard สำรองเงิน";
    if (subtitle) subtitle.textContent = "จัดการเงินกองทุน / Dashboard สำรองเงิน";
    document.title = "Dashboard สำรองเงิน — ClaimAgent";
  }

  function showFundReserveDashboardPage() {
    document.querySelectorAll("main .page, #monitorPage, #detailPage, #claimMonitorPage").forEach(function (page) {
      page.classList.add("hidden");
      page.style.removeProperty("display");
    });

    const page = byId("fundReserveDashboardPage");
    if (!page) return;
    page.classList.remove("hidden");
    setFundMenuActive(true);
    updatePageHeading();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function refreshDashboard() {
    const button = byId("frdRefreshButton");
    const status = byId("frdLiveStatus");
    if (!button || button.disabled) return;

    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    if (status) status.textContent = "กำลังรีเฟรชข้อมูล Dashboard สำรองเงิน";

    window.setTimeout(function () {
      renderChart();
      renderTable();
      const now = new Date();
      const dateText = new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(now).replace("น.", "").trim();
      const updatedAt = byId("frdUpdatedAt");
      if (updatedAt) updatedAt.textContent = "อัปเดตล่าสุด " + dateText + " น.";
      button.disabled = false;
      button.classList.remove("is-loading");
      button.removeAttribute("aria-busy");
      if (status) status.textContent = "รีเฟรชข้อมูลเรียบร้อยแล้ว";
    }, 650);
  }

  function init() {
    renderChart();
    renderTable();
    const dashboardButton = byId("submenuFundReserveDashboard");
    const refreshButton = byId("frdRefreshButton");
    dashboardButton && dashboardButton.addEventListener("click", showFundReserveDashboardPage);
    refreshButton && refreshButton.addEventListener("click", refreshDashboard);

    document.querySelectorAll("aside button[id^='menu'], aside button[id^='submenu']").forEach(function (button) {
      if (button.id === "menuFundManagement" || button.id === "submenuFundReserveDashboard") return;
      button.addEventListener("click", function () { setFundMenuActive(false); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.showFundReserveDashboardPage = showFundReserveDashboardPage;
})();
