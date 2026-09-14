# PH Claim Record Detail

## Identity

- เมนู: แจ้งเคลม → ค้นหาการแจ้งเคลม
- Page ID: `claimRecordPhDetailPage` — static section
- หน้าที่: รายละเอียด record สำหรับ product PH ใน legacy search flow

## Navigation และ Flow

- Entry จาก search result หลัง `searchClaimRecords()`/product selection
- Back กลับ search/insured detail ตาม legacy state
- Related: [Claim Search Insured Detail](claim-search-insured-detail.md)

## Effective implementation

- ตรวจ functions ที่อ้าง `claimRecordPhDetailPage`, `claimRecordSearchForm`, `selectClaimRecordProduct`
- Visibility ถูกควบคุมผ่าน shared claim page navigation

## Data และ Source ownership

- Minimum files to read: `index.html`
- Stable anchors: `id="claimRecordPhDetailPage"`, `claimRecordSearchForm`, `searchClaimRecords`
- CSS scope: `#claimRecordPhDetailPage`; inline CSS

## Constraints และ Regression

- เป็น legacy record detail ไม่ใช่ Consider Customer Detail
- ทดสอบ product PH, search context และ Back state

