# PH Claim Record Detail

## Identity

- เมนู: แจ้งเคลม → ค้นหาการแจ้งเคลม
- Page ID: `claimRecordPhDetailPage` — static section
- หน้าที่: รายละเอียด record สำหรับ product PH / PA ใน legacy search flow

## Navigation และ Flow

- Entry จาก search result หลัง `searchClaimRecords()`/product selection; PH และ PA ใช้ full-page detail เดียวกัน
- Back กลับ search/insured detail ตาม legacy state
- Related: [Claim Search Insured Detail](claim-search-insured-detail.md)

## Effective implementation

- ตรวจ functions ที่อ้าง `claimRecordPhDetailPage`, `claimRecordSearchForm`, `selectClaimRecordProduct`
- Visual owner: `css/claim-record-detail-refresh.css` ใช้ภาษาเดียวกับ `transferClaimDetailPage`
- Tab accessibility adapter: `js/claim-record-detail-tabs.js`; ไม่เพิ่ม public API
- Visibility ถูกควบคุมผ่าน shared claim page navigation

## Data และ Source ownership

- Minimum files to read: `index.html`, `css/claim-record-detail-refresh.css`, `js/claim-record-detail-tabs.js`
- Stable anchors: `id="claimRecordPhDetailPage"`, `claimRecordSearchForm`, `searchClaimRecords`
- CSS scope: `#claimRecordPhDetailPage`; external visual owner โหลดหลัง legacy inline CSS

## Constraints และ Regression

- เป็น legacy record detail ไม่ใช่ Consider Customer Detail
- ทดสอบ product PH, search context และ Back state
