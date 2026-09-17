# Transfer Tracking

## Identity

- เมนู: แจ้งเคลม → ติดตามการโอนเงิน
- Page ID: `transferTrackingPage` — static section
- หน้าที่: filter/search/table รายการโอนและเปิดรายละเอียด

## Navigation และ Flow

- Entry: `showTransferTrackingPage()` จาก `#submenuTransferTracking`
- Detail: เปิด `transferClaimDetailPage`; Back คืนหน้าติดตาม
- Related: [Transfer Claim Detail](transfer-claim-detail.md)

## Effective implementation

- Functions: `showTransferTrackingPage`, `renderTransferTrackingTable`, `applyTransferTrackingFilters`
- Detail mock adapter: `buildTransferClaimMockup(row)` สร้างข้อมูลหน้ารายละเอียดจาก transfer row เดียวกัน
- ช่องจากวันที่/ถึงวันที่ใช้ shared Buddhist Era date picker; กดได้ทั้งช่องและไอคอนปฏิทิน
- ค่าเริ่มต้นและ Reset ใช้ช่วงวันที่ของ mock dataset เพื่อให้มีผลลัพธ์แสดงทันที
- ตรวจ late transfer patches และ shared page hiding ก่อนเปลี่ยน navigation

## Data และ Source ownership

- Globals/mock rows สำหรับ transfer tracking อยู่ใน `index.html`
- Minimum files to read: `index.html`; เพิ่ม transfer confirmation script เมื่อแก้ action/confirmation
- Stable anchors: `id="transferTrackingPage"`, `function renderTransferTrackingTable`, `function applyTransferTrackingFilters`
- CSS scope: `#transferTrackingPage`, `.tt-page`, `.tt-redesign`; inline CSS

## Constraints และ Regression

- Tests: Phase 0 Transfer responsive 7 viewports
- รักษา table internal scrolling, filter state และ detail record identity
