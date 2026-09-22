# Hospital OPD Half Detail

## Identity

- เมนู: พิจารณาเคลม → เคลมโรงพยาบาล → OPD Half
- Page ID: `considerHospitalOpdHalfPage` — static empty mount; renderer injects content
- Data model: `claimType="OPD Half"`, `treatmentType="OPD"`

## Navigation และ Flow

- Entry ผ่าน effective `openConsiderHospitalRow`; Monitor-origin ต้องผ่าน `openClaimMonitorDetail(appId)`
- Back ไป source feature เดิม; Monitor-origin คืน complete monitor state
- Related: [Consider List](consider-list.md), [Hospital Full](hospital-opd-full-detail.md)

## Effective implementation

- Base renderer/openers และ shared `detailForm`/`docs('half')` อยู่ใน `index.html`
- Late patches: `menu-hospital-claim-step1-decision-doc-reset.js` แล้ว `menu-hospital-claim-traffic-accident.js`; ห้ามสลับ order
- Traffic accident fields เป็น readonly/default ตาม Hospital behavior

## Data และ Source ownership

- Minimum files to read: `js/menu-hospital-claim-step1-decision-doc-reset.js`, `js/menu-hospital-claim-traffic-accident.js`, `css/menu-hospital-claim-traffic-accident.css`; เพิ่ม resolver/mock files สำหรับ Monitor-origin data
- Stable anchors: `id="considerHospitalOpdHalfPage"`, `openConsiderHospitalRow`, `docs(kind='customer'`
- CSS scope: page ID, `.opd-half-*`, external traffic CSS

## Constraints และ Regression

- Shared continuous-claim selector เลือกและแสดงรายการด้วย `caseNo` เท่านั้น
- Step 3 `สรุปค่าใช้จ่ายโรงพยาบาล` แสดง `ยอดเงินรวมตามใบเสร็จ` จาก Step 2 และใช้ label `ค่าใช้จ่ายทั้งหมดสุทธิ` โดยไม่เปลี่ยนสูตรเดิม
- Step 3 `สรุปค่าชดเชย` เพิ่มขนาดตัวอักษรทั้ง Section และแยกสถานะ `แก้ไขบัญชี`/`บันทึกการแก้ไขบัญชี` ด้วยข้อความ ไอคอน สี และ `aria-pressed`
- ห้าม normalize Half เป็น `treatmentType="OPD_HALF"`
- Tests: routing/mapping 76 records, `tests/hospital-claim-traffic-accident-static.cjs`, Phase 0 Hospital Detail responsive
