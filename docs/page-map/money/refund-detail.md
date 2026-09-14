# Refund Detail

## Identity

- Breadcrumb: จัดการเงินเคลม → คืนเงิน → รายละเอียด
- Page ID: `refundDetailPage` — static section
- หน้าที่: รายละเอียดและ action คืนเงิน

## Navigation และ Flow

- Entry จาก selected refund row; Back ไป `refundPage`
- Related: [Refund](refund.md), [Approve Refund](approve-refund.md)

## Effective implementation

- Opener/renderer/confirmation อยู่ใน refund IIFE เดียวกันใน `index.html`
- Shared modal close behavior และ page hider มีผลกับ flow

## Data และ Source ownership

- Minimum files to read: refund markup/IIFE ใน `index.html`
- Stable anchors: `id="refundDetailPage"`, `detail=$('refundDetailPage')`
- CSS scope: `#refundDetailPage`, `.rf-page`

## Constraints และ Regression

- รักษา source row และจำนวนเงิน; ทดสอบ action ทุกสถานะ, Back และไม่มี overlay blocking

