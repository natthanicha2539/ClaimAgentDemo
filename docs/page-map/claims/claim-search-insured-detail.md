# รายละเอียดผู้เอาประกันจาก Claim Search

## Identity

- Breadcrumb: งานเคลม → ค้นหาเคลม → ผู้เอาประกัน หรือ legacy แจ้งเคลม → ค้นหาการแจ้งเคลม → ผู้เอาประกัน
- Page ID: `claimSearchInsuredDetailPage` — static section
- หน้าที่: แสดงข้อมูลผู้เอาประกันจาก legacy Claim Record Search

## Navigation และ Flow

- Entry จากการเลือกกรมธรรม์ใน `#claimWorkSearchSurface` ผ่าน `renderClaimSearchInsuredDetail(row, customRows)` หรือจาก legacy claim record flow
- งานเคลมใช้ `appId`/policy ที่เลือกเพื่อสร้าง Claim History เฉพาะกรมธรรม์; Back ผ่าน wrapper `backToClaimRecordSearch()` แล้วคืน search state เดิม
- Desktop Hero ของ flow งานเคลมใช้ความสูง 164px; Tablet/Mobile ปล่อยความสูงตาม content เพื่อไม่ให้ข้อมูลถูกตัด
- `#csdAppStatus` รับ `data-status-tone` จากสถานะกรมธรรม์และแสดง active/pending/closed ด้วยสีที่มี contrast ชัดเจน
- Related: [PH Claim Record Detail](claim-record-ph-detail.md), [Claim Monitor](claim-monitor.md)

## Effective implementation

- Renderer และ History UI อยู่ใน `index.html`; source selection/state จากงานเคลมอยู่ใน `js/menu-claim-work-search.js`
- Shared page hiders และ navigation patches มีผลกับ visibility

## Data และ Source ownership

- Minimum files to read: `docs/page-map/claims/claim-search.md`, `js/menu-claim-work-search.js`, `index.html` เฉพาะ `renderClaimSearchInsuredDetail` และ `id="claimSearchInsuredDetailPage"`
- Stable anchors: `id="claimSearchInsuredDetailPage"`, `renderClaimSearchInsuredDetail`, `openSelectedPolicyHistory`, `backToClaimRecordSearch`
- CSS scope เดิม: `#claimSearchInsuredDetailPage`; visual override ของงานเคลมอยู่ใน `css/menu-claim-work-search.css` ภายใต้ `.claim-work-search-history`

## Constraints และ Regression

- Dataset งานเคลมมาจาก `window.claimWorkSearchMock`; ไม่ใช่ `claimMonitorRows` และห้ามใช้ row index จาก Monitor
- ทดสอบ selected insured, Back และ hidden-page coverage
