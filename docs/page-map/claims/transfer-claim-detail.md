# Transfer Claim Detail

## Identity

- Breadcrumb: ติดตามการโอนเงิน → รายละเอียด
- Page ID: `transferClaimDetailPage` — static section
- หน้าที่: รายละเอียดและ action ของรายการโอนที่เลือก

## Navigation และ Flow

- Entry จาก selected transfer row; Back ไป `transferTrackingPage`
- Confirmation behavior บางส่วนถูกเสริมโดย external script
- มี 4 แท็บที่กดใช้งานได้: ข้อมูลการเคลม, ประวัติการทำรายการ, ประวัติการโอนเงิน และประวัติการตัดจ่าย
- Related: [Transfer Tracking](transfer-tracking.md)

## Effective implementation

- ตรวจ opener/renderer ที่อ้าง page ID ใน `index.html`
- Visual owner: `css/transfer-claim-detail-refresh.css` โหลดท้ายสุดและ scope ใต้ `#transferClaimDetailPage`
- Tab behavior และ Mock history owner: `js/transfer-claim-detail-tabs.js` รับ selected row ผ่าน internal event `claimagent:transfer-detail-opened` และไม่สร้าง public API
- `js/menu-claim-entry-transfer-confirmation.js` เป็น late patch สำหรับ confirmation; ห้ามย้ายลำดับ

## Data และ Source ownership

- Minimum files to read: `js/menu-claim-entry-transfer-confirmation.js`, `index.html` เฉพาะ detail anchors
- Stable anchors: `id="transferClaimDetailPage"`, `transferClaimDetailPage`
- CSS scope: `#transferClaimDetailPage`, `.transfer-detail-reference-page`; ห้ามเปลี่ยน field หรือข้อมูลเพื่อรองรับงาน visual
- `ประวัติการตัดจ่าย` ใน Demo หมายถึงส่งตั้งเบิกกองทุนแล้ว และกองทุนจ่ายเงินคืนเคสนั้นเรียบร้อย; ข้อมูลในแท็บนี้เป็น Mock Data

## Constraints และ Regression

- รักษา selected transfer record และ Back context; ห้าม derive จาก visible DOM text
- ทดสอบ confirmation success/cancel และไม่มี overlay ค้าง
