# Claim Payment

## Identity

- Breadcrumb: แจ้งเคลม → การชำระเงิน
- Page ID: `paymentPage` — static section
- หน้าที่: Step การชำระเงินท้าย Claim Journey

## Navigation และ Flow

- Entry ผ่าน workflow จาก `ocrPage`; exit/submit กลับ Monitor หรือเปิด confirmation ตาม state เดิม
- Related: [OCR](ocr.md), [Transfer Tracking](transfer-tracking.md)

## Effective implementation

- ตรวจ `renderStepper("payStepper"`, payment validation/submit handlers และ late confirmation wrappers
- `js/menu-claim-entry-transfer-confirmation.js` อาจครอบ action จาก Claim Entry/Payment

## Data และ Source ownership

- Minimum files to read: `index.html`, `js/menu-claim-entry-transfer-confirmation.js`
- Stable anchors: `id="paymentPage"`, `payStepper`, `paymentPage`
- CSS scope: `#paymentPage` และ shared workflow/payment styles

## Constraints และ Regression

- ห้ามเปลี่ยน transfer status หรือสร้าง business rule จาก mock status
- ทดสอบ validation, confirmation, back navigation และ state persistence

