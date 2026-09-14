# Hospital OPD Full / IPD / Day Case Detail

## Identity

- เมนู: พิจารณาเคลม → เคลมโรงพยาบาล → ดูรายละเอียด
- Page ID: `considerHospitalOpdFullPage` — static empty mount; renderer injects content
- ใช้เป็น destination เดิมของ OPD Full, IPD และ Day Case Surgery

## Navigation และ Flow

- Entry ผ่าน effective `openConsiderHospitalRow`; Monitor-origin ผ่าน record-aware adapter
- Back ไป `considerPage` หรือคืน `claimMonitorPage` ตาม source session
- Related: [Consider List](consider-list.md), [Hospital Half](hospital-opd-half-detail.md)

## Effective implementation

- Base renderer/openers และ shared detail builders อยู่ใน `index.html`
- Late decision/document reset และ traffic accident scripts ครอบ page นี้ตาม script order
- Status เป็น context/hydration เท่านั้น ห้ามเพิ่ม routing rule จาก status

## Data และ Source ownership

- Minimum files to read: hospital patch scripts/CSS; resolver/mock/routing files เมื่อแก้ Monitor-origin data; `index.html` เฉพาะ renderer anchors
- Stable anchors: `id="considerHospitalOpdFullPage"`, `openConsiderHospitalRow`, `showConsiderHospital`
- CSS scope: page ID, shared Hospital/OPD Full detail styles, external traffic CSS

## Constraints และ Regression

- Shared continuous-claim selector เลือกและแสดงรายการด้วย `caseNo` เท่านั้นสำหรับ OPD Full, IPD และ Day Case Surgery
- OPD Full คง `claimType="OPD Full"`, `treatmentType="OPD"`; IPD/Day Case ไม่สร้าง destination ใหม่
- Tests: routing/mapping 76 records, hospital traffic static test, Phase 0 Hospital Detail responsive
