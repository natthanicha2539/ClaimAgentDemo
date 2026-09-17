# Customer Claim Detail

## Identity

- เมนู: พิจารณาเคลม → เคลมลูกค้า → ดูรายละเอียด
- Page ID: `considerCustomerDetailPage` — static empty mount; renderer injects content
- รองรับ PH/PA และ OPD/IPD/Day Case Surgery

## Navigation และ Flow

- Entry ผ่าน effective `openConsiderCustomerRow`; จาก Monitor ใช้ `openClaimMonitorDetail(appId)` ซึ่งส่ง hydrated renderer record ผ่าน opener เดิม
- Back ปกติไป `considerPage`; Monitor-origin ถูก capture handler คืน `claimMonitorPage` พร้อม state
- Related: [Consider List](consider-list.md), [Claim Monitor](../claims/claim-monitor.md)

## Effective implementation

- Core renderer: `showConsiderCustomerDetailPage`, shared detail builders เช่น `detailForm`, `docs`, step/summary renderers
- Decision state ใช้ `window.customerDecisionState`; traffic accident patch ครอบ Customer page ด้วย
- ห้ามเรียก renderer โดยตรง เพราะจะข้าม opener/wrapper chain

## Data และ Source ownership

- Monitor-origin: `claim-detail.mock.js` → `ClaimDetailMockResolver.resolve(appId)` → `rendererRecord.claimDetailMock`
- Minimum files to read: `js/claim-monitor-detail-routing.js`, `js/claim-detail-mock-resolver.js`, `js/mock-data/claim-detail.mock.js`; อ่าน anchors ใน `index.html` เมื่อแก้ renderer; เพิ่ม traffic script/CSS เมื่อแก้ traffic fields
- Stable anchors: `id="considerCustomerDetailPage"`, `showConsiderCustomerDetailPage`, `function detailForm`, `function docs`
- CSS scope: `#considerCustomerDetailPage` และ shared consideration detail CSS; traffic additions อยู่ใน external scoped CSS

## Constraints และ Regression

- Shared continuous-claim selector เลือกและแสดงรายการด้วย `caseNo` เท่านั้น; `claimNo` ใช้ได้เฉพาะ metadata ภายใน
- Step 3 `สรุปค่าใช้จ่ายโรงพยาบาล` แสดง `ยอดเงินรวมตามใบเสร็จ` จากผลรวมคอลัมน์ใบเสร็จใน Step 2 และใช้ label `ค่าใช้จ่ายทั้งหมดสุทธิ` โดยไม่เปลี่ยนสูตรเดิม
- PH ซ่อน school information; PA แสดง school info ตาม behavior เดิม
- Tests: `tests/claim-detail-mock-mapping.cjs`, `tests/claim-monitor-detail-routing.cjs`, traffic static test, Phase 0 Customer Detail responsive
