# Additional Transfer Detail

## Identity

- Breadcrumb: จัดการเงินเคลม → โอนเพิ่ม → รายละเอียด
- Page ID: `additionalTransferDetailPage` — static section
- หน้าที่: แสดง record ที่เลือกและขั้นตอนยืนยันโอนเพิ่ม

## Navigation และ Flow

- Entry จาก `additionalTransferPage`; Back ต้องคืน list state
- Related: [Additional Transfer](additional-transfer.md), [Transfer Tracking](../claims/transfer-tracking.md)

## Effective implementation

- Detail state/handlers อยู่ใน IIFE เดียวกับ additional transfer; ตรวจ `detailPage=$('additionalTransferDetailPage')`
- Confirmation modals และ click bindings เป็น closure-local

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ additional-transfer markup/IIFE
- Stable anchors: `id="additionalTransferDetailPage"`, `additionalTransferDetailPage`
- CSS scope: `#additionalTransferDetailPage`, `.atx-page`

## Constraints และ Regression

- รักษา selected record key และจำนวนเงิน; ทดสอบ cancel/confirm/back และ overlay cleanup

