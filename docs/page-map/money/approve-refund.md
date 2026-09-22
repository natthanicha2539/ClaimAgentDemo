# Approve Refund

## Identity

- เมนู: จัดการเงินเคลม → อนุมัติคืนเงิน
- Page ID: `approveRefundPage` — static section ที่ inject จาก inline script
- หน้าที่: รายการอนุมัติ พร้อม review/slip/confirm/success/reject modals

## Navigation และ Flow

- Entry: `#submenuApproveRefund`; review เปิดผ่าน modal ไม่ใช่ page ID แยก
- Related: [Refund](refund.md)

## Effective implementation

- Feature IIFE anchors: `menu=$('submenuApproveRefund')`, `approveRefundReviewModal`, `arConfirmModal`, `arSuccessModal`
- Patch ที่คง Claim Money submenu visible ทำงานหลัง init

## Data และ Source ownership

- Minimum files to read: inline approve-refund markup/IIFE ใน `index.html`
- Stable anchors: `id="approveRefundPage"`, `submenuApproveRefund`, `arRejectConfirmModal`
- CSS scope: `#approveRefundPage`, `.ar-page` และ modal prefixes `ar-`

## Constraints และ Regression

- ทดสอบ approve/reject/cancel/slip และ overlay cleanup; รักษา active submenu

