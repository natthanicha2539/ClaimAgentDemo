# Fund Hospital Transfer

## Identity

- เมนู: จัดการเงินกองทุน → โอนเงิน รพ.
- Page ID: `fundHospitalTransferPage` — static section
- หน้าที่: จำลอง workflow การสร้าง HCG และติดตามผลการโอนเงินโรงพยาบาล

## Navigation และ Flow

- Entry: `#submenuFundHospitalTransfer`
- สถานะ: รอสร้างรายการ, รอโอน, รอจ่ายอัตโนมัติ, โอนสำเร็จ และโอนไม่สำเร็จ
- รองรับ Generate Group, ยืนยันโอน, Mock ผลอัตโนมัติ และดูรายละเอียด

## Effective implementation

- Markup owner: `#fundHospitalTransferPage` ใน `index.html`
- Renderer/navigation owner: IIFE ใน `js/menu-fund-hospital-transfer.js`
- Style owner: `css/menu-fund-hospital-payments.css`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ fund menu/page, `js/mock-data/fund-hospital-payments.mock.js`, `js/menu-fund-hospital-transfer.js`, `css/menu-fund-hospital-payments.css`
- Stable anchors: `fundHospitalTransferPage`, `submenuFundHospitalTransfer`, `fhtStatusFilter`, `fhtWorkspace`
- ข้อมูลและผลการทำรายการเป็น Mock Data ใน memory และรีเซ็ตเมื่อ reload

## Constraints และ Regression

- ไม่มี network, localStorage หรือการทำรายการเงินจริง
- ไม่แก้เมนู Monitor - แก้ไขการโอนเงิน และไม่เปลี่ยน business rule ของหน้าอื่น
- ตารางเลื่อนภายใน panel บนหน้าจอแคบ และ dialog ต้องคืน focus ให้ต้นทาง
