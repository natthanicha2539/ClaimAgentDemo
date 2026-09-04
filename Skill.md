---
name: claimagent-system
description: วิเคราะห์ ออกแบบ สร้าง ตรวจสอบ และแก้ไขระบบ ClaimAgent ทั้งระบบ รวม UX/UI, HTML/CSS/JavaScript prototype, Business Rule, Validation, Workflow, Status, Claim, Payment, Billing, OCR, PreAuth, Monitor, SmileConnect และ Audit Trail ใช้เมื่อผู้ใช้กล่าวถึง ClaimAgent หรือขอทำ BRD/FSD, Flow, Wireframe, Mockup, Test Case, Data Dictionary, Dashboard หรือแก้ไฟล์ต้นแบบระบบเคลม
---

# ClaimAgent System

ทำงานกับ ClaimAgent โดยรักษาความหมายทางธุรกิจ ชื่อฟิลด์ สถานะ และพฤติกรรมข้ามหน้าจอให้สอดคล้องกันทั้งระบบ

## เริ่มงาน

1. ระบุ Module, Claim Source, Product, Coverage และ Step ที่เกี่ยวข้อง
2. ใช้ไฟล์หรือ Spec ที่ผู้ใช้ให้มาเป็นแหล่งอ้างอิงหลัก
3. หากแก้ Prototype ขนาดใหญ่ ให้หา Renderer และ Event Handler ที่ใช้งานจริงก่อนแก้
4. ตรวจสคริปต์ซ้ำ, ID ซ้ำ, iframe และ Patch ท้ายไฟล์ที่อาจเขียนทับผลลัพธ์
5. จำกัดการเปลี่ยนแปลงตามขอบเขตที่ผู้ใช้ขอ

## วิเคราะห์ Requirement

- แยก Actor, Trigger, Preconditions, Main Flow, Alternate Flow, Validation, Output และ Audit
- ระบุเงื่อนไขตาม Product และประเภทเคลม
- แยกข้อเท็จจริงจากข้อเสนอแนะ
- ห้ามสร้าง Business Rule ใหม่โดยไม่ระบุว่าเป็นข้อเสนอแนะ

## ออกแบบ UX/UI

- เรียงข้อมูลตามลำดับงานจริงของเจ้าหน้าที่
- แสดงสถานะ ยอดเงิน และ Warning ที่มีผลต่อการตัดสินใจก่อน
- ลด Tabs เมื่อผู้ใช้ต้องตรวจเทียบข้อมูลข้าม Section; ใช้ One-page หรือ Progressive Disclosure
- ใช้ชื่อฟิลด์เดียวกับหน้าต้นทาง
- รองรับ Desktop, Tablet, Mobile และการพิมพ์ตามความเหมาะสม

## สร้างหรือแก้ HTML/CSS/JavaScript

- รักษา Function ที่ไม่เกี่ยวข้อง
- ใช้ HTML แบบ Standalone เมื่อผู้ใช้ขอเฉพาะหน้า
- ไม่คำนวณข้อมูลที่ Requirement กำหนดให้ Backend เป็นผู้คำนวณ
- ป้องกัน Double Submit และกำหนด Loading/Disabled state สำหรับ Action สำคัญ
- ตรวจ JavaScript syntax และ Interaction ที่แก้

## จัดทำเอกสาร BA/QA

- BRD: วัตถุประสงค์ ขอบเขต Actor Rule และผลลัพธ์
- FSD: Field, Source, Data Type, Validation, Mapping, API และ Error handling
- Test Case: Positive, Negative, Boundary, Permission, Integration และ Audit
- Flow: ใช้ชื่อสถานะและ Action ตรงกับระบบ

## หลักการข้อมูลและ Integration

- ให้ Backend หรือระบบต้นทางเป็น Source of Truth ตาม Interface
- แยก ClaimAgent state, Payment state และ SmileConnect state
- บันทึก Audit Trail เมื่อสถานะ ยอดเงิน ผู้รับเงิน หรือผล Integration เปลี่ยน
- แสดง Reference และ Error จาก Integration เมื่อมีข้อมูล
- ปกปิดข้อมูลบัญชีและข้อมูลส่วนบุคคลในหน้าดูย้อนหลัง

## Modules และขอบเขตระบบ

- Claim sources: เคลมลูกค้า, เคลมโรงพยาบาล, Death & Disability และ PreAuth
- Products: PH และ PA
- Coverage: ค่ารักษา, ค่าชดเชย, ทุพพลภาพ, สูญเสียอวัยวะ และเสียชีวิต
- Treatment: OPD, IPD และ Day Case Surgery
- Claim modes: เคลมปกติและเคลมต่อเนื่อง
- Modules: แจ้งเคลม, OCR/เอกสาร, พิจารณาเคลม, จัดการเงิน, วางบิล, Monitor, PreAuth, Master และ Integration

## Workflow การพิจารณา

1. ตรวจผู้เอาประกันและสิทธิ์
2. บันทึกข้อมูลเคลมและตรวจเอกสาร
3. พิจารณาค่าใช้จ่าย
4. ตรวจสรุปรายการเคลม
5. เลือกผลการพิจารณา
6. สร้าง Payment ตามเงื่อนไข
7. ส่งผลไป SmileConnect
8. Update ClaimAgent และ Audit Trail

## สถานะ

- Open: ยังอยู่ในกระบวนการ
- Close: จบกระบวนการ
- Re-Open: ถูกส่งกลับมาแก้ไขหรือดำเนินการต่อ
- Decision: รอเอกสาร, รอแก้ไข, อนุมัติ, ปฏิเสธ, ยกเลิก
- Payment: รอโอน, อยู่ระหว่างดำเนินการ, โอนสำเร็จ, โอนไม่สำเร็จ

## Business Rules

### เอกสาร

- รายการที่มีจำนวนเอกสารมากกว่า 0 ต้องเลือกผลตรวจให้ครบ
- ผลตรวจรองรับ ผ่าน, ไม่ผ่าน และรอเอกสารเพิ่มเติม
- จำนวนเอกสาร 0 ไม่บังคับเลือกผลตรวจ
- ก่อนอนุมัติ เอกสารบังคับต้องผ่านทุกแถว

### ค่าใช้จ่ายและค่าชดเชย

- ตรวจความสัมพันธ์ของยอดใบเสร็จ ส่วนลด ไม่คุ้มครอง สิทธิ์เบิก และยอดโอน
- ยอดเกิน Benefit ให้แยก NPL หรือ Exgratia
- ห้ามใช้ชื่อ `ยอดอนุมัติ` แทน `สิทธิ์เบิก` หากความหมายต่างกัน
- ค่าชดเชยจาก Backend ห้ามคำนวณซ้ำบน Frontend
- IPD รองรับวันนอนปกติและ ICU แยกรายการ
- หากโอนค่าชดเชยแยกและยอดมากกว่า 0 ต้องมีธนาคาร เลขบัญชี ชื่อบัญชี และเบอร์โทรครบ
- หากไม่มีค่าชดเชย ไม่สร้าง Section ที่ทำให้เข้าใจว่ามีสิทธิ์

### เคลมต่อเนื่อง

- ใช้เหตุการณ์เดิมและผู้เอาประกันรายเดิม
- PA เคลมต่อเนื่องไม่เพิ่มผู้เอาประกันใหม่
- ยอดในสิทธิ์ไม่เกิน MPL คงเหลือ; ส่วนเกินเป็น NPL

### Action ตามผลการพิจารณา

- รอเอกสาร/รอแก้ไข: Update และบันทึก Transaction
- ปฏิเสธ/ยกเลิก: Close และบันทึก Transaction
- อนุมัติ: สร้าง Payment ตามกรณี ส่ง SmileConnect Update ClaimAgent และบันทึก Transaction
- ป้องกัน Submit ซ้ำทุก Action ที่สร้าง Transaction หรือส่ง Integration

### การส่งรายการวางบิลกลับ

- ขั้นตรวจสอบสถานะ หากเป็นรอแก้ไขหรือยกเลิก ให้ ClaimAgent ส่งกลับ SmileConnect
- SmileConnect สร้างเลขชุดวางบิลใหม่ทุกครั้งและไม่ใช้เลขเดิม

## มาตรฐาน UI

- Font: Noto Sans Thai 400, 500, 600, 700
- Modern Enterprise โทนกรมท่า น้ำเงิน ฟ้า และพื้นเทาอมฟ้า
- เขียว = Success, ส้ม = Warning, แดง = Error/ไม่คุ้มครอง
- ลด Card ใหญ่และพื้นที่ว่างที่ไม่ช่วยตรวจสอบ
- ยอดเงินชิดขวาและทศนิยม 2 ตำแหน่ง

## ชื่อฟิลด์มาตรฐาน

- ข้อมูลผู้เอาประกัน, ชื่อผู้เอาประกัน, เลขบัตรประชาชน, Application ID
- เบอร์โทรศัพท์, อายุกรมธรรม์, สถานะ App
- วันที่เริ่มคุ้มครอง, วันที่สิ้นสุดความคุ้มครอง, แผน
- วันที่แจ้ง, สถานพยาบาล, จังหวัด, สถานะเคลม
- เลขที่เคลม, เลขที่ Case, ประเภทการเคลม, ประเภทรายการเคลม
- เหตุของการเคลม, ประเภทความคุ้มครอง, ประเภทการรักษา
- วันที่เริ่มอาการ, วันที่เกิดเหตุ, เวลาที่เกิดเหตุ
- วันที่เข้า รพ., เวลาที่เข้า รพ., วันที่ออก รพ., เวลาที่ออก รพ.
- อาการสำคัญ (ChiefComplaint)
- การวินิจฉัย1 (Diagnosis1), การวินิจฉัย2 (Diagnosis2), การวินิจฉัย3 (Diagnosis3)
- รายละเอียด

## ตารางรายละเอียดค่าใช้จ่าย

1. รายการค่ารักษา
2. ยอดเงินตามใบเสร็จ
3. สิทธิ์เบิก
4. ส่วนลด
5. ยอดไม่คุ้มครอง
6. สาเหตุไม่คุ้มครอง
7. หมายเหตุ
8. Action เมื่อเป็นหน้าแก้ไข

ยอดสรุป: ยอดเงินตามใบเสร็จรวม, ส่วนลดรวม, ยอดไม่คุ้มครองรวม, ยอดเงินสุทธิ, ยอดเงินโอน, NPL และ Exgratia

## หน้าดูรายละเอียด

- ใช้ Read-only เป็นค่าเริ่มต้น
- แสดงเลขที่เคลม สถานะ ยอดสำคัญ และ Integration status ก่อนรายละเอียด
- ใช้ One-page เมื่อผู้ใช้ต้องตรวจข้อมูลข้าม Section
- ย่อ–ขยายเฉพาะข้อมูลรองและ Audit Trail จำนวนมาก
- ไม่ใช้ Tabs หากผู้ใช้กำหนดให้ตรวจครบจบในหน้าเดียว

## Checklist ก่อนแก้ Prototype

1. ตรวจขนาดไฟล์และโครงสร้าง HTML
2. ค้นหา ID หน้า Renderer ฟังก์ชันเปิดหน้า และ Event Handler
3. ตรวจ Renderer หรือ Patch ชุดท้ายสุด
4. ตรวจ iframe และ srcdoc
5. รักษาการแก้ไขที่ไม่เกี่ยวข้อง

## Checklist ระหว่างแก้

- จำกัด selector ให้อยู่ในหน้าที่แก้
- หลีกเลี่ยง global override และ ID ซ้ำ
- แยก state ของแต่ละ Claim/หน้าจอ
- Escape ข้อมูลที่นำไปสร้าง HTML
- ใช้ Backend payload เป็น Source of Truth สำหรับยอดที่ห้ามคำนวณหน้าเว็บ

## Verification

- ตรวจ JavaScript ทุก script block ด้วย syntax checker
- ทดสอบปุ่ม Step, Modal, Validation, Loading และ Disabled state
- ทดสอบ Product และ Claim type ที่เกี่ยวข้อง
- ทดสอบกรณีมีข้อมูล ไม่มีข้อมูล ยอดศูนย์ และ Integration ล้มเหลว
- ตรวจ Responsive และตารางล้น
- ระบุชัดหากไม่ได้ทดสอบ Runtime จริง

## Standalone extraction

- นำเฉพาะ CSS, HTML, state และ JavaScript ที่หน้าต้องใช้
- ตัดเมนูและ dependency ที่ไม่เกี่ยวข้อง
- ใช้ข้อมูล Demo โดยไม่ผูก global จากไฟล์เดิม
- ตรวจว่าเปิดโดยตรงแล้วไม่มี ReferenceError

## ส่งมอบ

- สรุปสิ่งที่เปลี่ยนและขอบเขตที่ไม่ถูกกระทบ
- ระบุ Validation และกรณีที่ตรวจแล้ว
- อย่าอ้างว่าทดสอบผ่านหากตรวจได้เพียง Syntax หรือ Static inspection
- ส่งไฟล์ชื่อสื่อความหมายและเปิดใช้งานได้ตามรูปแบบที่ผู้ใช้ขอ
