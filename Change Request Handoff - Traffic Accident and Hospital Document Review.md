# Change Requirement Handoff — Traffic Accident & Hospital Claim UI

## 1. วัตถุประสงค์

ปรับหน้าจอในกระบวนการพิจารณาเคลมและวางบิลเคลมให้รองรับข้อมูลอุบัติเหตุจากการจราจรในรูปแบบเดียวกัน อ่านง่าย กระชับ และกำหนดสถานะการแก้ไขข้อมูลให้เหมาะกับแต่ละ Flow รวมถึงลดขั้นตอนการตรวจเอกสารที่ไม่ใช้งาน และปรับลำดับปุ่มใน Step 2 ของการพิจารณาเคลมโรงพยาบาล

การแก้ไขนี้เป็น UI/Frontend scope โดยต้องไม่เปลี่ยน Business Flow อื่นที่อยู่นอกเหนือรายการด้านล่าง

## 2. เมนูและหน้าที่ได้รับผลกระทบ

| เมนู / หน้า | Page scope ในระบบ | Step / Section | รายการแก้ไข |
| --- | --- | --- | --- |
| พิจารณาเคลม > เคลมโรงพยาบาล > บันทึกข้อมูลเคลม | `#considerHospitalOpdHalfPage` | Step 1 | เพิ่ม/ปรับ Section ข้อมูลอุบัติเหตุจากการจราจร, ค่าเริ่มต้นถูกเลือกและแก้ไขไม่ได้, ตัดคอลัมน์ผลการตรวจและหมายเหตุในตรวจสอบเอกสาร |
| พิจารณาเคลม > เคลมโรงพยาบาล > บันทึกข้อมูลเคลม | `#considerHospitalOpdFullPage` | Step 1 | เหมือน OPD Half |
| พิจารณาเคลม > เคลมโรงพยาบาล > บันทึกข้อมูลเคลม | `#considerHospitalOpdHalfPage`, `#considerHospitalOpdFullPage` | Step 2 | สลับลำดับปุ่มให้ “ยืนยันบันทึกผลพิจารณา/บันทึกผลพิจารณา” อยู่ก่อน “ถัดไป” |
| วางบิลเคลม > เคลมโรงพยาบาล > ตรวจสอบรายการวางบิล | `#billingHospitalReviewPage` | Step 1 | เพิ่ม Section ข้อมูลอุบัติเหตุจากการจราจร โดยเลือกค่าเริ่มต้นและแก้ไขไม่ได้ |
| วางบิลเคลม > เคลมโรงพยาบาล > ตรวจสอบรายการวางบิล | `#billingHospitalReviewPage` | Section ตรวจสอบเอกสาร | ตัดคอลัมน์ “ผลการตรวจ” และ “หมายเหตุ” |
| พิจารณาเคลม > เคลมลูกค้า | `#considerCustomerDetailPage` | Step 1 | เพิ่ม Section ข้อมูลอุบัติเหตุจากการจราจร โดยเริ่มต้นไม่เลือกค่าและผู้ใช้เลือกได้ |

หมายเหตุ: คำว่า “ทุกประเภทรายการเคลมโรงพยาบาล” ใน Prototype ปัจจุบันครอบคลุม page scope ของ OPD Half และ OPD Full ข้างต้น หาก Production มีประเภทหรือ container เพิ่มเติม Dev ต้องผูก component เดียวกันกับ page scope นั้นด้วย

## 3. Change Requirement

### CR-01: Section ข้อมูลอุบัติเหตุจากการจราจร

- แสดงใน Step 1 ถัดจาก Section รายละเอียดเคลม
- ใช้ Card แบบเต็มความกว้าง มี Header สีฟ้าอ่อน ไอคอนรถ ชื่อ Section และคำอธิบาย
- Desktop แบ่งข้อมูลเป็น 3 คอลัมน์เท่ากัน พร้อมเส้นคั่นแนวตั้ง
- หน้าจอแคบกว่า 820px เปลี่ยนเป็น 1 คอลัมน์ และใช้เส้นคั่นแนวนอน
- ไม่มีการกำหนดความสูงคอลัมน์แบบตายตัว เนื้อหาต้องไม่ถูกยืดจนเกิดช่องว่างมากเกินไป

#### 3.1 ประเภทยานพาหนะ

- Control: Radio Button, เลือกได้ 1 ค่า, Required
- ตัวเลือก: `มอเตอร์ไซค์`, `รถยนต์`, `อื่นๆ`
- เมื่อเลือก `อื่นๆ` ให้แสดงช่อง `โปรดระบุ` และบังคับกรอก
- เมื่อเปลี่ยนจาก `อื่นๆ` เป็นตัวเลือกอื่น ให้ซ่อนช่องและล้างค่าเดิม

#### 3.2 ผู้ขับขี่ หรือ ผู้โดยสาร

- Control: Radio Button, เลือกได้ 1 ค่า, Required
- ตัวเลือก: `ผู้ขับขี่`, `ผู้โดยสาร`
- เมื่อเลือก `ผู้ขับขี่` แสดง Information message:
  `กรุณาตรวจสอบผลตรวจแอลกอฮอล์ประกอบการพิจารณาเคลม`
- เมื่อเลือก `ผู้โดยสาร` ให้ซ่อนข้อความทันที
- ข้อความเป็น Reminder เท่านั้น ไม่ใช่เงื่อนไขบังคับแนบเอกสาร

#### 3.3 เป็นส่วนเกิน พ.ร.บ.

- Control: Radio Button, เลือกได้ 1 ค่า, Required
- ตัวเลือก: `ใช่`, `ไม่ใช่`
- เมื่อเลือก `ไม่ใช่` ให้แสดงช่อง `โปรดระบุสาเหตุที่ไม่ใช้ พ.ร.บ.` และบังคับกรอก
- เมื่อเปลี่ยนจาก `ไม่ใช่` เป็น `ใช่` ให้ซ่อนช่องและล้างค่าเดิม

### CR-02: ค่าเริ่มต้นและสิทธิ์แก้ไขแยกตาม Flow

#### พิจารณาเคลมโรงพยาบาลและวางบิลเคลมโรงพยาบาล

- อ่านค่าจากข้อมูลเคลมเดิมเมื่อมีข้อมูลต้นทาง
- หากไม่มีข้อมูลต้นทาง ให้ใช้ค่าเริ่มต้น `มอเตอร์ไซค์`, `ผู้ขับขี่`, `ใช่`
- Radio และช่องข้อมูลตามเงื่อนไขทั้งหมดต้อง Disable/Read-only
- ผู้ใช้ดูข้อมูลได้ แต่แก้ไขไม่ได้

#### พิจารณาเคลมลูกค้า

- ทุก Radio เริ่มต้นเป็นค่าว่าง ไม่มีรายการถูกเลือก
- ผู้ใช้สามารถเลือกและแก้ไขได้
- Validate ก่อนออกจาก Step 1 หรือกดปุ่มดำเนินการ
- เมื่อ Validation ไม่ผ่าน ให้แสดงข้อความใต้ Field, แสดง Summary error และ Focus ไปยัง Field แรกที่ไม่ครบ

### CR-03: Typography และระยะห่างของ Radio

- ขนาดตัวอักษรของตัวเลือก Radio เท่ากับ `19px`, น้ำหนัก `600`
- ขนาด Radio `20px`
- ระยะห่างแนวตั้งระหว่างตัวเลือก `6px`
- ระยะจากหัวข้อ Field ถึงรายการตัวเลือก `8px`
- แต่ละแถวสูง `30px` และต้องเรียงชิดด้านบน ไม่กระจายเต็มความสูงของคอลัมน์
- ไม่ใช้ Pill/Card แยกในแต่ละตัวเลือก

### CR-04: Step 2 ลำดับปุ่มพิจารณาเคลมโรงพยาบาล

- Scope เฉพาะ `#considerHospitalOpdHalfPage` และ `#considerHospitalOpdFullPage`
- ใน Step 2 ให้เรียงปุ่มด้านขวาเป็น:
  1. `ยืนยันบันทึกผลพิจารณา` หรือ `บันทึกผลพิจารณา`
  2. `ถัดไป`
- ไม่เปลี่ยน Function/Handler ของปุ่มเดิม เปลี่ยนเฉพาะลำดับการแสดงผล

### CR-05: Section ตรวจสอบเอกสาร

#### พิจารณาเคลมโรงพยาบาล

- ตัดคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ` ออกจากตารางตรวจสอบเอกสาร
- ล้าง attribute/class ที่ใช้บังคับผลตรวจรายแถว
- ยกเลิก Approval guard ที่อ้างอิง Validation ของผลตรวจเอกสาร เพื่อไม่ให้ปุ่มดำเนินการถูก Block จากคอลัมน์ที่ถูกตัดออก
- คอลัมน์และ Function อื่นของตารางต้องยังทำงานตามเดิม

#### วางบิลเคลมโรงพยาบาล

- ตัดคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ` ออกจาก Section ตรวจสอบเอกสาร
- ตารางที่แสดงผลเหลือข้อมูลหลัก ได้แก่ รายการเอกสาร, ค้นหาเอกสาร, จำนวนเอกสาร และรายละเอียด/การดำเนินการตามโครงสร้างของหน้า
- การตัดคอลัมน์ต้องรองรับทั้ง renderer หลักและ shared/fallback renderer
- ไม่ตัด Field “หมายเหตุ” ที่อยู่ใน Section อื่น เช่น รายการค่าใช้จ่ายหรือผลการตรวจสอบรวม

## 4. Acceptance Criteria

1. ทุกหน้าใน Scope แสดง Section ข้อมูลอุบัติเหตุจากการจราจรใน Step 1 เพียงหนึ่งครั้ง
2. พิจารณาเคลมโรงพยาบาล OPD Half/Full และวางบิลโรงพยาบาลแสดงค่าที่เลือกไว้และทุก Control ถูก Disable
3. พิจารณาเคลมลูกค้าเริ่มต้นโดยไม่มี Radio ถูกเลือกและสามารถเลือกข้อมูลได้
4. เลือกประเภทยานพาหนะ `อื่นๆ` แล้วแสดงช่อง `โปรดระบุ`; เปลี่ยนเป็นค่าอื่นแล้วซ่อนและล้างค่า
5. เลือก `ผู้ขับขี่` แล้วแสดงข้อความตรวจแอลกอฮอล์; เลือก `ผู้โดยสาร` แล้วซ่อนข้อความ
6. เลือกส่วนเกิน พ.ร.บ. เป็น `ไม่ใช่` แล้วแสดงช่องเหตุผล; เปลี่ยนเป็น `ใช่` แล้วซ่อนและล้างค่า
7. หน้าเคลมลูกค้าไม่สามารถออกจาก Step 1 ได้เมื่อ Required field ยังไม่ครบ
8. ตัวเลือก Radio มีขนาดตัวอักษร 19px อ่านได้ชัดเจน และมีช่องว่างแนวตั้ง 6px โดยไม่ถูก CSS ส่วนกลางยืดระยะ
9. Layout Desktop เป็น 3 คอลัมน์ และ Responsive เป็น 1 คอลัมน์เมื่อหน้าจอแคบกว่า 820px
10. Step 2 ของพิจารณาเคลมโรงพยาบาลแสดงปุ่มบันทึกผลพิจารณาก่อนปุ่มถัดไป
11. ตารางตรวจสอบเอกสารของพิจารณาเคลมโรงพยาบาลไม่มีคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ` และไม่ติด Validation จากข้อมูลสองคอลัมน์นี้
12. ตารางตรวจสอบเอกสารของวางบิลเคลมโรงพยาบาลไม่มีคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ`
13. หน้า/Section/Flow อื่นนอก Scope ต้องไม่เปลี่ยนแปลง

## 5. ไฟล์ที่กระทบและไฟล์อ้างอิง

### Runtime files

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html` | โหลด CSS/JS ของ Change นี้ และเป็นเจ้าของโครงสร้าง Page scope เดิม |
| `js/menu-hospital-claim-traffic-accident.js` | สร้าง Section, จัดการ state/default/disabled, conditional fields, validation, ตัดคอลัมน์เอกสารฝั่งพิจารณาเคลม และจัดลำดับปุ่ม Step 2 |
| `css/menu-hospital-claim-traffic-accident.css` | ดีไซน์ Card, responsive layout, typography และ spacing ของ Radio |
| `js/menu-billing-hospital-review.js` | ตัดคอลัมน์ผลการตรวจ/หมายเหตุในหน้า Billing Hospital ทั้ง renderer หลักและ shared renderer |

### Integration/reference files

| ไฟล์ | ใช้อ้างอิง |
| --- | --- |
| `js/menu-hospital-claim-step1-decision-doc-reset.js` | Logic เดิมของ Step/ผลพิจารณา; traffic override ต้องโหลดหลังไฟล์นี้ |
| `DESIGN.md` | ขอบเขตและ Design decision ที่อนุมัติแล้ว |
| `tests/hospital-claim-traffic-accident-static.cjs` | Static regression ของ Section, 4 page scopes, validation และลำดับปุ่ม |
| `tests/billing-hospital-document-columns-static.cjs` | Static regression ของคอลัมน์ตรวจสอบเอกสารฝั่ง Billing |

### Requirement/design references

- `/Users/n.toraksa/.codex/attachments/e4dc7b7c-3388-4c6b-829e-1f0155233c72/pasted-text.txt`
- `/Users/n.toraksa/Desktop/Screenshot 2569-09-08 at 16.10.17.png`
- `/Users/n.toraksa/Desktop/Screenshot 2569-09-08 at 16.27.29.png`

## 6. ข้อมูลต้นทางที่ Frontend รองรับ

Section รองรับการอ่านข้อมูลจาก object ที่มีชื่อกลุ่ม เช่น `trafficAccident`, `trafficAccidentInfo`, `roadAccident` หรือข้อมูลระดับ `claim/row` โดย Normalize ค่าไทย/อังกฤษเป็นค่ากลางของ UI หาก Backend มี Contract ที่แน่นอน ควร Map เข้าสู่ Field ต่อไปนี้:

- `vehicleType` / `trafficVehicleType`
- `vehicleOther`
- `casualtyStatus` / `injuredStatus` / `riderStatus`
- `poroboExcess` / `isPoroboExcess` / `motorActExcess`
- `noPoroboReason` / `poroboReason` / `motorActUnusedReason`

## 7. QA / Regression Checklist

- ทดสอบ OPD Half และ OPD Full แยกกันทั้ง Step 1 และ Step 2
- ทดสอบ Billing Hospital จากทั้งเมนูวางบิลและหน้าตรวจสอบรายการวางบิล
- ทดสอบ Customer Claim ด้วยค่าว่าง, กรอกครบ, และแต่ละ conditional branch
- ตรวจว่า disabled controls ยังแสดงค่าชัดเจนและไม่สามารถแก้ด้วย keyboard/mouse
- ตรวจว่าเปลี่ยนตัวเลือกแล้ว conditional value ถูก Clear จริง
- ตรวจตารางเอกสารกรณีมี/ไม่มีเอกสาร และหลัง scan/search/re-render
- ตรวจว่าไม่มี Approval/Next button ค้าง disabled เพราะ Validation ของคอลัมน์ที่ถูกตัด
- ตรวจ responsive ที่ desktop, tablet และ mobile
- ตรวจว่า Section ไม่ถูกสร้างซ้ำหลังเปลี่ยน Step หรือเปิดเคลมรายการอื่น

## 8. Verification ที่ทำแล้วใน Prototype

- `node --check js/menu-hospital-claim-traffic-accident.js` — ผ่าน
- `node tests/hospital-claim-traffic-accident-static.cjs` — ผ่าน
- `node tests/billing-hospital-document-columns-static.cjs` — ผ่าน
- Strict design audit ไม่พบ finding ในไฟล์ที่แก้ของ Change นี้ แต่ยังมี legacy findings เดิมใน `index.html` ซึ่งอยู่นอก Scope

## 9. Out of Scope

- ไม่เปลี่ยน API, Database schema หรือ Backend persistence contract
- ไม่เปลี่ยน Flow การคำนวณสิทธิ์/วงเงิน/ค่าใช้จ่าย
- ไม่เปลี่ยน Section หมายเหตุหรือผลตรวจที่อยู่นอกตารางตรวจสอบเอกสาร
- ไม่เปลี่ยนหน้าพิจารณาเคลมประเภทอื่นที่ไม่ได้ระบุใน Page scope
- ไม่แก้ legacy design/audit findings อื่นใน `index.html`

## 10. Implementation Note

- Workspace ปัจจุบันแสดงไฟล์ทั้งโปรเจกต์เป็น untracked ใน `git status` จึงไม่สามารถใช้ Git diff ระบุเจ้าของการเปลี่ยนแปลงย้อนหลังได้อย่างแม่นยำ รายการไฟล์ในเอกสารนี้อ้างอิงจาก Runtime ownership และการตรวจโค้ดปัจจุบัน
- ก่อน Merge เข้าระบบจริง Dev ควรเทียบไฟล์เหล่านี้กับ branch ฐานของทีม และย้ายเฉพาะ Change ที่อยู่ใน Scope
