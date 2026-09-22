# Fund Hospital Payment Settings

## Identity

- เมนู: จัดการเงินกองทุน → ตั้งค่าการจ่ายเงิน รพ.
- Page ID: `fundHospitalPaymentSettingsPage` — static section
- หน้าที่: จำลองการตั้งค่าจ่ายอัตโนมัติ Delay และ Hold รายสถานพยาบาล

## Navigation และ Flow

- Entry: `#submenuFundHospitalPaymentSettings`
- รองรับค้นหา แก้ไขรายแถว บันทึก เพิ่มสถานพยาบาล และประวัติแบบ inline

## Effective implementation

- Markup owner: `#fundHospitalPaymentSettingsPage` ใน `index.html`
- Renderer/navigation owner: IIFE ใน `js/menu-fund-hospital-payment-settings.js`
- Style owner: `css/menu-fund-hospital-payments.css`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ fund menu/page, `js/mock-data/fund-hospital-payments.mock.js`, `js/menu-fund-hospital-payment-settings.js`, `css/menu-fund-hospital-payments.css`
- Stable anchors: `fundHospitalPaymentSettingsPage`, `submenuFundHospitalPaymentSettings`, `fhpsSearchInput`, `fhpsTableBody`
- ข้อมูลการตั้งค่าและประวัติเป็น Mock Data ใน memory และรีเซ็ตเมื่อ reload

## Constraints และ Regression

- Delay รับจำนวนเต็ม 0–30 วัน; ชื่อโรงพยาบาลเป็นข้อมูลบังคับ
- ไม่มี network หรือ localStorage และการตั้งค่าไม่แก้สถานะ Monitor ย้อนหลัง
- รักษา dirty/save state, keyboard dialog และ horizontal table containment
