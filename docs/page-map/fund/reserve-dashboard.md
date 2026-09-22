# Fund Reserve Dashboard

## Identity

- เมนู: จัดการเงินกองทุน → Dashboard สำรองเงิน
- Page ID: `fundReserveDashboardPage` — static section
- หน้าที่: แสดงยอดคงเหลือ ประมาณการเงินออก 7 วัน เงินสำรองที่ควรเพิ่ม และรายการจ่ายเงินที่กำลังจะถึง

## Navigation และ Flow

- Entry: `#submenuFundReserveDashboard`
- `#menuFundManagement` เปิด/ปิด submenu และคงสถานะ expanded เมื่ออยู่ในหน้านี้
- ปุ่ม `#frdRefreshButton` จำลอง background refresh เฉพาะข้อมูล read-only และอัปเดตเวลา

## Effective implementation

- Markup owner: `#fundReserveDashboardPage` ใน `index.html`
- Renderer/navigation owner: IIFE ใน `js/menu-fund-reserve-dashboard.js`
- Style owner: `css/menu-fund-reserve-dashboard.css`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `#fundReserveDashboardPage` และ fund menu, `js/menu-fund-reserve-dashboard.js`, `css/menu-fund-reserve-dashboard.css`
- Stable anchors: `fundReserveDashboardPage`, `submenuFundReserveDashboard`, `frdRefreshButton`, `frdUpcomingTableBody`
- ข้อมูลยอดเงินและสถานะทั้งหมดเป็น mock data เพื่อการนำเสนอ; หน้านี้ไม่เขียนข้อมูลหรือทำรายการทางการเงิน

## Constraints และ Regression

- คง navigation และ active state ให้ทำงานร่วมกับ `โอนเงิน รพ.` และ `ตั้งค่าการจ่ายเงิน รพ.`
- ตารางและกราฟเลื่อนแนวนอนภายใน panel บนหน้าจอแคบ โดย page ไม่ซ้อนใต้ navigation rail
- รักษา active submenu, localized document title, keyboard focus และ live status ของการ refresh
