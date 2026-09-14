# Transfer Claim Detail

## Identity

- Breadcrumb: ติดตามการโอนเงิน → รายละเอียด
- Page ID: `transferClaimDetailPage` — static section
- หน้าที่: รายละเอียดและ action ของรายการโอนที่เลือก

## Navigation และ Flow

- Entry จาก selected transfer row; Back ไป `transferTrackingPage`
- Confirmation behavior บางส่วนถูกเสริมโดย external script
- Related: [Transfer Tracking](transfer-tracking.md)

## Effective implementation

- ตรวจ opener/renderer ที่อ้าง page ID ใน `index.html`
- `js/menu-claim-entry-transfer-confirmation.js` เป็น late patch สำหรับ confirmation; ห้ามย้ายลำดับ

## Data และ Source ownership

- Minimum files to read: `js/menu-claim-entry-transfer-confirmation.js`, `index.html` เฉพาะ detail anchors
- Stable anchors: `id="transferClaimDetailPage"`, `transferClaimDetailPage`
- CSS scope: `#transferClaimDetailPage`, `.transfer-detail-reference-page`

## Constraints และ Regression

- รักษา selected transfer record และ Back context; ห้าม derive จาก visible DOM text
- ทดสอบ confirmation success/cancel และไม่มี overlay ค้าง

