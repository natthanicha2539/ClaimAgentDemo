# Customer Claim Read-only

## Identity

- Breadcrumb: งานเคลม → ค้นหาเคลม → ดูรายละเอียด
- Page ID: `customerClaimReadOnlyPage` — dynamic section
- สถานะปัจจุบัน: แสดงรายละเอียดเคลมแบบ read-only ภายใน Application Shell เดิม

## Navigation และ Flow

- Page ถูกสร้างโดย `page()` ใน `js/menu-customer-claim-detail.js`
- Entry จาก Claim Search ผ่าน effective opener; Back คืนหน้า Search หรือ Claim History พร้อม state เดิม
- Visual flow: read-only context strip → mock notice → claim hero → five-item summary → section navigation ที่ใช้รูปแบบแท็บเดียวกับหน้าพิจารณาเคลม → isolated detail cards
- Related: [Claim Search](claim-search.md)

## Effective implementation

- Base owner: `js/menu-customer-claim-detail.js`
- Effective renderer: `js/menu-customer-claim-detail.js`
- Final compatibility wrapper: `js/menu-claim-search-detail-blank.js` ซึ่งโหลดภายหลังและส่งต่อ opener ไป renderer เดิม
- Vendor React/MUI โหลดจาก `js/vendor/` แบบ on demand และยังรองรับ `file://`

## Data และ Source ownership

- Minimum files to read: `js/menu-claim-search-detail-blank.js`, `js/menu-customer-claim-detail.js`; CSS เฉพาะเมื่อแก้ base surface
- Stable anchors: `const pageId = 'customerClaimReadOnlyPage'`, `function open(record, insured, history)`
- CSS scope: `#customerClaimReadOnlyPage` ใน `css/customer-claim-detail.css`; stable anchors ได้แก่ `.ccro-contextbar`, `.ccro-mock-alert`, `.ccro-hero`, `.ccro-quick`, `.ccro-nav`, `.ccro-sections`
- `.ccro-nav` / `.ccro-nav-link` ยึด visual pattern จาก `.customer-review-tabs` / `.customer-review-tab`: พื้นขาวไล่สีบาง ๆ, เส้นแบ่งล่าง, active เป็นข้อความและเส้นใต้ `#0075bd`, hover สีฟ้าอ่อน และเลื่อนแนวนอนบนจอแคบ โดยยังคงทำหน้าที่ scroll-to-section ไม่เปลี่ยนเป็น tab panel
- Mobile: context, navigation, financial summary และตารางเลื่อนแนวนอนภายในเจ้าของพื้นที่ ขณะที่ document scroll แนวตั้งและไม่มี body scroll lock

## Constraints และ Regression

- Patch order ห้ามสลับ: customer detail base → claim-search compatibility wrapper → claim-work-search adapter
- Tests: `tests/claim-search-detail-blank-static.cjs`, `tests/customer-claim-detail.cjs`
