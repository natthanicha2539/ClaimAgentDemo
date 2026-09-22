# Hospital Additional Transfer Monitor

## Identity

- เมนู: พิจารณาเคลม → เคลมโรงพยาบาล (โอนเพิ่ม)
- Menu ID: `submenuConsiderHospitalAdditionalTransfer`
- Page ID: `considerHospitalAdditionalTransferPage`
- Entry: `window.showConsiderHospitalAdditionalTransferPage()`

## Navigation และ Flow

- Submenu เปิด Monitor และตั้ง active state ให้เมนู `consider` กับ submenu นี้
- ปุ่ม visibility ในแต่ละแถวเปิด `openConsiderHospitalAdditionalTransferDetail(requestId)`
- Back จาก Detail คืน Monitor พร้อม Search, Status, Date, Quick Filter, Pagination และตำแหน่ง scroll เดิม
- Related: [Additional Transfer Detail](hospital-additional-transfer-detail.md), [Consider List](consider-list.md)

## Effective implementation

- Filter แบบ local ประกอบด้วย Search, Status, Date และ Quick Filter; ปุ่มล้างคืนค่าเริ่มต้น
- ตารางมี 7 คอลัมน์: สถานพยาบาล, ผู้เอาประกัน, Claim / Case, วันที่รับคำขอ, ยอดขอโอนเพิ่ม, สถานะ และ Action
- Dataset navigation ใช้ pagination 5/10/20 แถว และตารางเลื่อนแนวนอนบน viewport แคบ
- Product derive จาก Claim No.: `CLPA* => PA`, `CL* => PH` โดยต้องตรวจ `CLPA` ก่อน `CL`

## Data และ Source ownership

- Minimum files to read: `js/menu-consider-hospital-additional-transfer.js`, `js/mock-data/hospital-additional-transfer.mock.js`, `css/menu-consider-hospital-additional-transfer.css`; อ่าน `index.html` เฉพาะ shell/menu/script registration
- Mock source: `window.ClaimAgentHospitalAdditionalTransferMock.requests` จำนวน 12 รายการ
- Monitor state อยู่ใน private module state ของ feature JS และไม่ใช้ `claimMonitorRows`
- CSS scope: `#considerHospitalAdditionalTransferPage` และ prefix `.hat-*`

## Constraints และ Regression

- ไม่มี KPI cards และไม่แสดง SmileConnect/Product/Treatment ใต้โรงพยาบาล, Request/Reference ใต้ Claim/Case หรือข้อความ SLA ใต้วันที่
- Action ใช้ visibility icon pattern เดิม; หน้า Claim/Consider เดิมต้องคง behavior
- Tests: `tests/hospital-additional-transfer-static.cjs`, `tests/hospital-additional-transfer-routing.cjs`, `tests/page-map-integrity.cjs`
