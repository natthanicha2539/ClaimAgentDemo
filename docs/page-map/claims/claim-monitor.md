# Claim Monitor

## Identity

- เมนู: แจ้งเคลม → แจ้งเคลม
- Page ID: `claimMonitorPage` — static section
- หน้าที่: แสดง 76 mock records, filter/search, table/card และเปิด Claim Detail

## Navigation และ Flow

- Entry: `showClaimMonitor()` จาก `#submenuNewClaim`
- Detail: `openClaimMonitorDetail(appId)` โดย `appId` เป็น record key; Back คืน filters/search/view/selection/scroll
- Related: [Claim Entry](claim-entry.md), [Customer Detail](../consider/customer-detail.md), [Hospital Half](../consider/hospital-opd-half-detail.md), [Hospital Full](../consider/hospital-opd-full-detail.md)

## Effective implementation

- Renderer: `renderClaimMonitor`, `renderClaimMonitorTable`, `renderClaimMonitorCards`, `renderClaimSelectedDetail`
- Filters: `filterClaimMonitorRows` และ `window.ClaimMonitorContextFilters`
- Routing adapter: `window.openClaimMonitorDetail`; ต้องผ่าน captured effective `openConsiderCustomerRow` / `openConsiderHospitalRow`
- ห้ามใช้ filtered index ข้าม dataset หรือเรียก detail page renderer ตรง

## Data และ Source ownership

- Globals: `claimMonitorRows`, `claimMonitorFilteredRows`, `selectedClaimMonitorIndex`, `claimState`, `claimMonitorDetailContext`, `currentClaimDetailMock`
- Minimum files to read: `js/mock-data/claim-monitor.mock.js`, `js/claim-monitor-context-filters.js`, `js/claim-monitor-detail-routing.js`; อ่าน renderer anchors ใน `index.html` เฉพาะเมื่อแก้ UI
- Stable anchors: `id="claimMonitorPage"`, `function showClaimMonitor`, `function renderClaimMonitor`, `openClaimMonitorDetail`
- CSS scope: `#claimMonitorPage`; inline CSS

## Constraints และ Regression

- Matrix: Customer 36 + Hospital 40; Half/Full คง `treatmentType="OPD"`
- Tests: `tests/claim-monitor-context-filters.cjs`, `tests/claim-monitor-detail-routing.cjs`, `tests/claim-detail-mock-mapping.cjs`, Phase 0 Claim Monitor parity

