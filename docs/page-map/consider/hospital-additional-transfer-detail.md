# Hospital Additional Transfer Detail

## Identity

- เมนู: พิจารณาเคลม → เคลมโรงพยาบาล (โอนเพิ่ม) → ดูรายละเอียด
- Page ID: `considerHospitalAdditionalTransferDetailPage`
- Opener: `window.openConsiderHospitalAdditionalTransferDetail(requestId)`
- Existing Claim Detail entry: ปุ่ม `ดูข้อมูลเคลมครั้งก่อน`

## Navigation และ Flow

- Monitor ส่ง `requestId` เข้า opener และ Detail render จาก request เดียวกัน
- ปุ่มดูข้อมูลครั้งก่อนเรียก `ClaimMonitorDetailRouting.openFromAdditionalTransfer(...)` ด้วย Claim No., Case No., Product, Claim Type และ Treatment
- Navigation context ใช้ `{ source: "hospitalAdditionalTransfer", requestId }`
- Back จาก Existing Claim Detail กลับ Detail request เดิมโดยตรง; Back จาก Detail กลับ Monitor พร้อม state เดิม
- เมื่อคืน Detail หรือเข้า Claim Detail จาก flow ปกติ context ต้องถูกล้าง/แทนที่เพื่อไม่ให้ source ค้าง

## Effective implementation

- ลำดับ section: Sticky Hero, Decision Snapshot, เหตุผลที่โรงพยาบาลขอโอนเพิ่ม, รายการค่ารักษาที่ขอพิจารณาเพิ่ม, ข้อมูลประกอบการพิจารณา, เอกสารเคลม, ผลการพิจารณา, สรุปผลการพิจารณา
- Decision draft และตำแหน่ง scroll เก็บแยกตาม `requestId` ใน private module state
- Hero toolbar มีปุ่ม Pin/Unpin; สถานะ Sticky เก็บแยกตาม `requestId` ใน browser session และคงเดิมเมื่อกลับจาก Existing Claim Detail
- Desktop/Tablet เริ่มต้นเป็น Sticky; Mobile ไม่เกิน 640px ใช้ non-sticky และซ่อน Toggle
- Product rule: `CLPA* => PA`, `CL* => PH`; ต้องตรวจ `CLPA` ก่อน `CL`
- Treatment ที่ resolver รองรับ: IPD, OPD Full, OPD Half และ Day Case Surgery

## Data และ Source ownership

- Minimum files to read: `js/menu-consider-hospital-additional-transfer.js`, `js/mock-data/hospital-additional-transfer.mock.js`, `js/claim-detail-mock-resolver.js`, `js/claim-monitor-detail-routing.js`, `js/mock-data/claim-detail.mock.js`, `css/menu-consider-hospital-additional-transfer.css`
- Additional Transfer data มาจาก `window.ClaimAgentHospitalAdditionalTransferMock.requests`
- Existing Claim Detail ใช้ exact Claim No. + Case No. จาก `claimDetailMockCatalog.contextRecords`; ไม่ fallback ไป record อื่น
- Existing Customer/Hospital Detail renderer เป็นเจ้าของ UI ปลายทางเดิม

## Constraints และ Regression

- ห้ามสร้าง Claim Detail, Previous-decision page/route/subview ใหม่
- ไม่แสดง `สถานะเอกสาร`, `Decision Panel` หรือ `สรุปการตัดสินใจ`; wording คง `ผลการพิจารณา` และ `สรุปผลการพิจารณา`
- Search Claim และ Claim Monitor entry ต้องใช้ Back behavior เดิมเมื่อ source ไม่ใช่ `hospitalAdditionalTransfer`
- Tests: `tests/hospital-additional-transfer-static.cjs`, `tests/hospital-additional-transfer-routing.cjs`, `tests/claim-monitor-detail-routing.cjs`
