# ClaimAgent — Current Handoff สำหรับ BA

วันที่สรุป: 17 กันยายน 2569  
สถานะ: **READY FOR MOCK/UAT**  
Demo Version: **273**  
Last Updated ในระบบ: **17/09/2026 13:41:48**

## 1. วัตถุประสงค์และ Source of Truth

เอกสารนี้รวบรวม Functional Flow, Business Rules, Mock Scope, Navigation/State Restoration และ Known Risks ของ ClaimAgent Mock/Demo ปัจจุบัน เพื่อให้ BA นำไปจัดทำหรือปรับปรุง Specification ตั้งแต่ต้น

ข้อจำกัดสำคัญ:

- Branch `main` ยังไม่มี Git Commit และไฟล์ทั้งหมดเป็น Untracked จึงไม่มี Git Baseline สำหรับเปรียบเทียบงานก่อนและหลังเริ่ม Branch ได้ครบ 100%
- เนื้อหาสรุปจาก Current Runtime, Page Map, Feature Files, Tests และ Requirements ที่ได้รับทั้งหมด
- หากเอกสารเก่าขัดกับหน้าจอปัจจุบัน ให้ถือ **Current Runtime และเอกสารฉบับนี้เป็น Source of Truth**
- ชื่อเมนูในเอกสารนี้ใช้ชื่อล่าสุดเท่านั้น

## 2. โครงสร้างเมนูล่าสุด

```text
หน้าแรก

แจ้งเคลม
├─ แจ้งเคลม
├─ ติดตามการโอนเงิน
└─ ค้นหาการแจ้งเคลม

คำนวณวงเงินเคลม

จัดการเงินเคลม
├─ โอนเพิ่ม
├─ คืนเงิน
├─ อนุมัติคืนเงิน
├─ ขยายวงเงิน
├─ แก้ไขการโอนเงิน
├─ สอบถามธนาคาร
└─ ตั้งค่าการโอนเงิน

จัดการข้อมูลแจ้งเคลม
├─ แก้ไขเคลมผิดคน
└─ แก้ไขการแจ้งเคลม

งานเคลม
└─ ค้นหาเคลม

พิจารณาเคลม
├─ เคลมลูกค้า
├─ เคลมโรงพยาบาล
├─ เคลมโรงพยาบาล (โอนเพิ่ม) [เมนูใหม่]
└─ Death&Disability

วางบิลเคลม
├─ ตั้งเบิกกองทุน
└─ ตรวจสอบรพ.วางบิล

สำหรับการกองทุน [Section ใหม่]
└─ จัดการเงินกองทุน [Placeholder]
   ├─ Dashboard สำรองเงิน
   ├─ โอนเงิน รพ.
   └─ ตั้งค่าการจ่ายเงิน รพ.

สำหรับ Dev
├─ Master
└─ Flow
```

หมายเหตุ:

- `ตั้งเบิกกองทุน` และ `ตรวจสอบรพ.วางบิล` เป็นชื่อเมนูล่าสุด และ Breadcrumb/Page Title ต้องใช้ชื่อเดียวกัน
- `Dashboard สำรองเงิน` ใต้ `จัดการเงินกองทุน` มี Page Shell, Routing และ Active Page State แล้ว; `โอนเงิน รพ.` และ `ตั้งค่าการจ่ายเงิน รพ.` ยังเป็น Placeholder
- Placeholder รองรับการพับ/ขยายด้วย Mouse และ Keyboard แต่กดเมนูย่อยแล้วต้องไม่เปลี่ยนหน้า

## 3. แจ้งเคลม / บันทึกเคลม

### 3.1 บันทึกเคลม / ค้นหาผู้เอาประกัน

- ใช้ Mock Data 76 รายการ แบ่งเป็นเคลมลูกค้า 36 รายการ และเคลมโรงพยาบาล 40 รายการ
- รองรับผลิตภัณฑ์ PH และ PA
- รองรับบริบทประเภทเคลม ประเภทการรักษา และสถานะตามแต่ละ Flow
- Filter ในส่วนนี้มี Note ว่าใช้สำหรับ Mock เพื่อทดสอบเท่านั้น และไม่มีผลต่อข้อมูลที่แสดง
- ตารางตัดปุ่ม `ดูรายละเอียด` ออกตาม Requirement ล่าสุด
- Claim Detail Resolver ยังคงรองรับ Entry Source อื่นที่ต้องเปิดรายละเอียด

### 3.2 กฎ PH/PA

- PH ไม่แสดงข้อมูลสถานศึกษา
- PA แสดงข้อมูลสถานศึกษา
- Resolver ต้องไม่แก้ไข Source Mock Row ระหว่างทำงาน

## 4. งานเคลม / ค้นหาเคลม

เพิ่ม Search Flow สำหรับค้นหาและเปิด Claim Detail แบบ Read-only

### 4.1 ประเภทการค้นหา

1. เลขที่ CL
2. เลขที่ Case
3. บัตรประชาชน
4. Passport/GCode
5. AppID
6. บัตรนักเรียน
7. ชื่อ-สกุล
8. ชื่อสถานศึกษา พร้อมปีการศึกษา

### 4.2 หลักการแสดงผล

- เลขที่ CL/Case แสดงผลระดับ Claim
- ข้อมูลผู้เอาประกันแสดงผลระดับ Policy/Application
- ต้องเลือกกรมธรรม์ก่อนดู Claim History
- AppID และบัตรนักเรียน Resolve ไปยังกรมธรรม์โดยอัตโนมัติ
- กรณีชื่อซ้ำ ให้จัดกลุ่มตามบุคคลและแสดงกรมธรรม์ของแต่ละคน
- การค้นหาสถานศึกษาต้องระบุปีการศึกษา
- มี Mock Quick Search 13 แบบ พร้อม Note ว่าใช้สำหรับ Mock เพื่อทดสอบเท่านั้น
- `หลักการแสดงผล` แสดงเป็น Info Icon พร้อม Tooltip
- ตัดข้อความอธิบาย Result Flow และข้อความซ้ำในหัวข้อเงื่อนไขการค้นหา
- ตัดข้อความ `ระดับเคลม` และ `รายการ Claim ที่ตรงกับคำค้นหา` จากผลการค้นหา
- Back จาก Claim Detail ต้องคืน Search Type, Keyword และกรมธรรม์ที่เลือก

## 5. รายละเอียดการแจ้งเคลม / Existing Claim Detail

- Existing Claim Detail เป็นหน้า Read-only ภายใน Application Shell เดิม ไม่ใช้ iframe
- ใช้ Field และข้อมูลเดิม โดยปรับเฉพาะการจัดวางและ Visual Hierarchy
- แสดง Context Strip, Mock Notice, Claim Hero, Summary, Section Navigation และ Detail Cards
- รองรับความแตกต่างของ PH/PA ตามกฎเดิม
- Back ต้องคืน Search/Claim History State ตาม Entry Source

Tab ของหน้ารายละเอียดการแจ้งเคลม:

1. ข้อมูลการเคลม
2. ประวัติการทำรายการ
3. ประวัติการโอนเงิน

## 6. แจ้งเคลม / ติดตามการโอนเงิน

- แก้ปัญหาหน้าขาวจาก `buildTransferClaimMockup is not defined`
- ใช้ Mock Data การโอนเงิน 14 รายการ
- Date Picker กดได้ทั้งช่องและ Icon และแสดงวันที่แบบ พ.ศ.
- Reset คืนช่วงวันที่ตาม Dataset
- หน้า Detail ใช้ข้อมูลจากรายการที่ User เลือก
- ปรับดีไซน์ Detail ให้สอดคล้องกับหน้าอื่นในระบบ

Tab:

1. ข้อมูลการเคลม
2. ประวัติการทำรายการ
3. ประวัติการโอนเงิน
4. ประวัติการตัดจ่าย

นิยาม `การตัดจ่าย`:

- มีการส่งตั้งเบิกกองทุนแล้ว
- กองทุนจ่ายเงินคืนสำหรับ Case นั้นเรียบร้อยแล้ว

## 7. กฎเคลมต่อเนื่อง

หน้าที่เป็นเคลมต่อเนื่องต้องเลือกและแสดงด้วย **เลขที่ Case เท่านั้น** ห้ามใช้ Claim No. เป็นค่าที่เลือกแทน Case No.

ครอบคลุม:

- ตรวจสอบสิทธิ์
- บันทึกข้อมูลเคลม
- พิจารณาเคลมลูกค้า
- เคลมโรงพยาบาล OPD Half
- เคลมโรงพยาบาล OPD Full
- เคลมโรงพยาบาล IPD
- เคลมโรงพยาบาล Day Case Surgery
- ตรวจสอบรพ.วางบิล

## 8. พิจารณาเคลม / เคลมโรงพยาบาล (โอนเพิ่ม)

เป็น Workflow ใหม่สำหรับ Mock/Demo

### 8.1 Monitor

Page ID: `considerHospitalAdditionalTransferPage`

ความสามารถ:

- Search, Status Filter, Date Filter และ Quick Filter
- Reset, Table และ Pagination ขนาด 5/10/20 รายการ
- เก็บ Filter, Pagination และ Scroll Position ใน Private Module State
- ไม่มี KPI Cards

คอลัมน์:

1. สถานพยาบาล
2. ผู้เอาประกัน
3. Claim / Case
4. วันที่รับคำขอ
5. ยอดขอโอนเพิ่ม
6. สถานะ
7. ดำเนินการ

ข้อกำหนดการแสดงผล:

- ไม่แสดง SmileConnect/Product/Treatment ใต้สถานพยาบาล
- ไม่แสดง Request No./Reference ใต้ Claim/Case
- ไม่แสดงข้อความ SLA ใต้วันที่รับคำขอ โดยให้สถานะเป็นตัวสื่อ SLA
- Action ใช้ Visibility Icon

Product Rule:

1. Claim No. ขึ้นต้น `CLPA` ให้ Product = PA
2. Claim No. ขึ้นต้น `CL` ให้ Product = PH
3. ต้องตรวจ `CLPA` ก่อน `CL`

### 8.2 รายละเอียดคำขอโอนเพิ่ม

Page ID: `considerHospitalAdditionalTransferDetailPage`

Section ปัจจุบัน:

1. Hero
2. เหตุผลที่โรงพยาบาลขอโอนเพิ่ม
3. ข้อมูลประกอบการพิจารณา
4. เอกสารเคลม
5. ผลการพิจารณา
6. สรุปผลการพิจารณา

> Section `รายการค่ารักษาที่ขอพิจารณาเพิ่ม` ถูกตัดออกจากหน้าจอล่าสุดแล้ว

#### Hero

แสดง:

- ชื่อผู้เอาประกัน
- ชื่อสถานพยาบาล
- ยอดเงินรวมตามใบเสร็จ
- ค่าใช้จ่ายทั้งหมดสุทธิ
- ยอดเงินอนุมัติครั้งก่อน
- ยอดเงินที่ขอโอนเพิ่ม

Sticky behavior:

- ค่าเริ่มต้นเป็นไม่ตรึง
- ปุ่มใช้ข้อความ `ตรึงส่วนนี้` และ `ยกเลิกการตรึง`
- จำสถานะแยกตาม Request ID ภายใน Browser Session
- Mobile แสดง Hero แบบไม่ Sticky และซ่อนปุ่ม Toggle
- การ Toggle ต้องไม่เปลี่ยน Scroll Position, Decision Draft หรือ Navigation Context

#### เอกสารเคลม

- ใช้คำว่า `เอกสารประกอบคำขอโอนเพิ่ม`
- มีปุ่มดูเอกสาร
- เอกสารเป็น Mock Preview

#### ผลการพิจารณา

แสดงตัวเลือกพร้อมกันแบบ Segmented Decision Buttons:

- อนุมัติโอนเพิ่ม
- ปฏิเสธโอนเพิ่ม
- ขอแก้ไขโอนเพิ่ม

Internal State เดิมยังใช้ค่า `approve`, `reject` และ `return`

Field:

- ยอดอนุมัติโอนเพิ่ม — Read-only ตาม Logic เดิม
- ผู้พิจารณา — Read-only
- หมายเหตุ
- ไม่มี Field ยอดไม่คุ้มครอง

Decision Draft, Approved Amount, Remark และ Detail Scroll Position ต้องเก็บแยกตาม Request ID

#### สรุปผลการพิจารณา

แสดง:

- ผลการพิจารณา
- ยอดอนุมัติรอบนี้
- ยอดอนุมัติครั้งก่อน
- ยอดอนุมัติโอนเพิ่ม
- ยอดอนุมัติสะสมใหม่
- ค่าใช้จ่ายทั้งหมดสุทธิ
- ยอดเงินที่ขอโอนเพิ่ม

สูตร:

```text
ยอดอนุมัติครั้งก่อน
+ ยอดอนุมัติโอนเพิ่ม
= ยอดอนุมัติสะสมใหม่
```

Responsive:

- Desktop แสดงแนวนอนแบบ Compact
- Tablet แบ่งเป็นสองแถว
- Mobile Stack แนวตั้ง
- ต้องไม่เกิด Horizontal Overflow

### 8.3 ดูข้อมูลเคลมครั้งก่อน

- เปิด Existing Claim Detail ของระบบเดิม
- Resolve ด้วย Claim No. และ Case No. ของ Additional Transfer Request
- Claim Type = Hospital
- รองรับ IPD, OPD Full, OPD Half และ Day Case Surgery
- ไม่สร้าง Claim Detail ใหม่

Navigation Context:

```text
source = hospitalAdditionalTransfer
requestId = currentRequestId
```

Back จาก Existing Claim Detail ต้อง:

- กลับ Additional Transfer Detail ของ Request เดิมโดยตรง
- ไม่ผ่านหน้าค้นหาเคลม
- คืน Decision Draft, Approved Amount และ Remark
- คืน Detail Scroll Position
- คง Monitor Search, Status, Date, Quick Filter, Pagination และ Scroll Position
- ล้าง Source Context หลังกลับสำเร็จ เพื่อไม่ให้รั่วไปยัง Flow อื่น
- ไม่เปลี่ยน Back Behavior ของ Search Claim และ Claim Monitor

## 9. Step 3 — สรุปรายการเคลม

ใช้กับ:

- พิจารณาเคลมลูกค้า
- พิจารณาเคลมโรงพยาบาล
- ตรวจสอบรพ.วางบิลที่ Reuse Hospital Renderer

### 9.1 สรุปค่าใช้จ่ายโรงพยาบาล

- เพิ่ม `ยอดเงินรวมตามใบเสร็จ`
- คำนวณจากผลรวมคอลัมน์ยอดเงินตามใบเสร็จใน Step 2
- หากไม่มีรายการให้แสดง `0.00`
- เมื่อแก้ Step 2 แล้วกลับ Step 3 ต้องแสดงยอดล่าสุด
- ต้องไม่เพิ่มแถวซ้ำเมื่อสลับ Step
- ใช้คำว่า `ค่าใช้จ่ายทั้งหมดสุทธิ`
- ไม่เปลี่ยนสูตรหรือมูลค่าเดิม

### 9.2 สรุปค่าชดเชย

- ขยาย Font ทั้ง Section
- ชื่อบัญชีรับเงินค่าชดเชยและข้อมูลผู้ชำระเบี้ยต้องเด่นขึ้น
- ปุ่ม `แก้ไขบัญชี` ใช้ Outline State
- เมื่ออยู่ใน Edit Mode เปลี่ยนเป็นปุ่มสีเขียว `บันทึกการแก้ไขบัญชี`
- รองรับ `aria-pressed`

## 10. วางบิลเคลม / ตั้งเบิกกองทุน

### 10.1 เงื่อนไขการค้นหา

ใช้ Layout เดียวกันทั้งเคลมลูกค้าและเคลมโรงพยาบาล:

```text
Row 1: ประเภทการเคลม* | ผลิตภัณฑ์*
Row 2: สาขา | ผู้ทำรายการ
Row 3: ค้นหาจาก | คำค้นหา* | ปุ่มค้นหา
```

ประเภทการเคลมเป็น Button Filter:

- เคลมลูกค้า
- เคลมโรงพยาบาล

ค้นหาจากเป็น Button Filter:

- เลขที่ CL
- เลขที่ Case
- ชื่อสถานพยาบาล
- ชื่อผู้เอาประกัน

ข้อมูลเรียงตามวันที่อนุมัติจากเก่าสุดไปล่าสุด

### 10.2 ตารางเคลมลูกค้า

| ลำดับ | คอลัมน์ |
| --- | --- |
| 1 | เลือกรายการ |
| 2 | วันที่แจ้งเคลม |
| 3 | วันที่อนุมัติเคลม |
| 4 | เลขที่ Case |
| 5 | ผู้อนุมัติ |
| 6 | จำนวนเงินตั้งเบิก |
| 7 | ชื่อบริษัทประกัน |
| 8 | ดำเนินการ |

Checkbox สำหรับเลือกรายการอยู่ในคอลัมน์แรก ส่วนคอลัมน์ `ดำเนินการ` ใช้สำหรับดูรายละเอียด

### 10.3 ตารางเคลมโรงพยาบาล

| ลำดับ | คอลัมน์ |
| --- | --- |
| 1 | วันที่อนุมัติเคลม |
| 2 | เลขที่ Case |
| 3 | ชื่อสถานพยาบาล |
| 4 | ผู้อนุมัติ |
| 5 | จำนวนเงินตั้งเบิก |
| 6 | ชื่อบริษัทประกัน |
| 7 | ดำเนินการ |

บริษัทประกันแสดงชื่อย่อ เช่น Ergo, Pacific, BUI และ Chubb

ตาราง Responsive ต้องเลื่อนแนวนอนภายใน Table Container โดยไม่ทำให้ทั้งหน้า Overflow

## 11. พิจารณาเคลมโรงพยาบาล / ตรวจสอบรพ.วางบิล

- ข้อมูลอุบัติเหตุจราจรใช้ Shared UI ร่วมกัน
- ฝั่งโรงพยาบาลแสดงข้อมูล Read-only ตามค่า Mock
- ฝั่งลูกค้ามีค่าเริ่มต้นเป็น `ไม่ใช่`; หากเลือก `ใช่` จึงแสดงรายละเอียดที่เกี่ยวข้อง
- รองรับประเภทรถอื่น, Reminder แอลกอฮอล์ของผู้ขับขี่ และเหตุผลส่วนเกิน พ.ร.บ.
- Desktop แสดง 3 Columns และหน้าจอเล็กกว่า 820px แสดง 1 Column
- ตารางตรวจเอกสารไม่มีคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ`
- Validation ต้องไม่อ้างอิงคอลัมน์ที่ตัดออกแล้ว

## 12. Shared UX และระบบป้องกันหน้าขาว

- มี White-screen Guard สำหรับคืนหน้าจอก่อนหน้าเมื่อเกิด Runtime Error
- แสดงข้อความแจ้งว่าระบบป้องกันหน้าขาวทำงาน พร้อมรายละเอียด Error
- Date, Select, Filter และ Tab ใช้ Keyboard/Responsive Pattern ของระบบ
- Demo Version และ Last Updated ต้องอัปเดตทุกครั้งที่แก้ Code
- Project เปิดโดยตรงผ่าน `index.html`/`file://` และไม่มี Build Step

## 13. Mock/Demo Scope

ยังไม่มี:

- Backend Integration
- API Transfer
- Real Payment
- Real Fund Settlement
- Real SmileConnect Update
- Database Persistence

State เป็น Frontend/Browser Session และอาจ Reset เมื่อ Reload ตามแต่ละ Feature

## 14. Verification ล่าสุด

| หัวข้อ | ผล/ขอบเขตที่ตรวจ |
| --- | --- |
| Page Map | 39 Destinations / 41 Markdown Files |
| Additional Transfer | Monitor, Detail, Resolver และ State Restoration |
| Claim Monitor | Mock Data 76 รายการ |
| Transfer Tracking | Mock Data 14 รายการ, Date Picker และ 4 Tabs |
| Work Claim Search | Search Types, Mock Quick Search และ Responsive |
| Continuous Claim | รับ Case No. และไม่ใช้ Claim No. เป็นตัวเลือก |
| Billing/Fund | ตรวจ Flow เคลมลูกค้าและเคลมโรงพยาบาล |
| Step 3 | ยอดใบเสร็จ, Wording และไม่สร้างแถวซ้ำ |
| Responsive | Desktop, Tablet และ Mobile หลายขนาด |
| Runtime | ไม่พบ Error ใหม่จาก Feature ที่เพิ่ม |

## 15. Known Manual Risks

- ยังไม่ได้ทดสอบบน Physical Touch Device
- ยังไม่ได้ทดสอบด้วย Screen Reader จริง
- Native Select อาจแสดงต่างกันเล็กน้อยตาม OS/Browser
- Legacy Error เดิม: `expenseData is not defined`
- Repository ไม่มี Git Baseline จึงควรสร้าง Initial Commit หลัง BA ยืนยัน Current Specification
- Page Map เก่าบางจุดอาจยังกล่าวถึงรายการค่ารักษาใน Additional Transfer แต่ Current Runtime ล่าสุดตัด Section นี้ออกแล้ว

## 16. Acceptance Checklist สำหรับ BA/UAT

1. ตรวจชื่อเมนูและ Breadcrumb ตามโครงสร้างล่าสุดในข้อ 2
2. ตรวจ Search/Detail/Back State ของงานเคลม
3. ตรวจ Tracking และประวัติการตัดจ่าย
4. ตรวจทุก Continuous Claim ว่าเลือกด้วย Case No. เท่านั้น
5. ตรวจ Additional Transfer ตั้งแต่ Monitor ถึง Existing Claim Detail และ Back กลับ Request เดิม
6. ตรวจ Decision Draft และ Scroll State หลังย้อนกลับ
7. ตรวจ Step 3 และยอดเงินรวมตามใบเสร็จในทุก Flow ที่เกี่ยวข้อง
8. ตรวจตารางตั้งเบิกกองทุนทั้งลูกค้าและโรงพยาบาล
9. ตรวจ Responsive และ Horizontal Overflow
10. บันทึก UAT Defect เป็น Requirement ใหม่โดยไม่เปลี่ยน Mock Scope เดิมจนกว่าจะได้รับการอนุมัติ
