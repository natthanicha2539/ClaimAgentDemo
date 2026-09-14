# Refund

## Identity

- เมนู: จัดการเงินเคลม → คืนเงิน
- Page ID: `refundPage` — static section
- หน้าที่: รายการ/ค้นหารายการคืนเงิน

## Navigation และ Flow

- Entry: `#submenuRefund`; เลือกรายการไป `refundDetailPage`
- Related: [Refund Detail](refund-detail.md), [Approve Refund](approve-refund.md)

## Effective implementation

- Feature IIFE ใช้ `$`, `menu`, `page`, `detail`; ตรวจ block ที่ประกาศ `menu=$('submenuRefund')`
- Money submenu visibility ถูก patch ร่วมกับ Additional/Approve Refund

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `id="refundPage"` และ refund IIFE
- Stable anchors: `id="refundPage"`, `submenuRefund`, `refundDetailPage`
- CSS scope: `#refundPage`, `.rf-page`

## Constraints และ Regression

- รักษา filter/selection และสถานะคืนเงิน; ทดสอบ list/detail/back และ active submenu

