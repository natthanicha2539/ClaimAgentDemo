# Change Request Handoff - Claim Hospital Billing Ver2

## Summary
เอกสารนี้ใช้ส่งต่องานแก้ไข Change Request สำหรับ ClaimAgent รอบ Ver2 ครอบคลุมการปรับ flow แจ้งเคลมทั่วไป, หน้าเคลมโรงพยาบาล, และหน้า `วางบิลเคลม - เคลมโรงพยาบาล`

## Scope ที่แก้แล้ว
- หน้าแจ้งเคลมทั่วไปที่ไม่ใช่ `เสียชีวิต` และ `ทุพพลภาพ/สูญเสียอวัยวะ`
- หน้า `พิจารณาเคลม - เคลมโรงพยาบาล` สำหรับ OPD Half / OPD Full
- หน้า `วางบิลเคลม - เคลมโรงพยาบาล`

## Files Changed
- `index.html`
- `js/menu-claim-entry-transfer-confirmation.js`
- `js/menu-hospital-claim-step1-decision-doc-reset.js`

## Key Changes

### 1. แจ้งเคลมทั่วไป: Modal ยืนยันบัญชีโอนเงิน
- เพิ่ม override ใหม่ใน `js/menu-claim-entry-transfer-confirmation.js`
- หน้าแจ้งเคลมทั่วไปที่ไม่ใช่ `เสียชีวิต` และ `ทุพพลภาพ/สูญเสียอวัยวะ` เมื่อกดปุ่มหลักในหน้า Payment จะเปิด Modal ยืนยันบัญชีโอนเงินก่อน
- ปุ่มหลักใน Modal ใช้ข้อความ `โอนเงิน`
- เมื่อกด `โอนเงิน` จะแสดง progress 3 ขั้น:
  1. สร้างเลขที่เคลม (CL)
  2. สร้างเลขที่ Case (CC)
  3. โอนเงิน
- Success modal แสดงเลขอ้างอิงตัวอย่างครบ `CL`, `CC`, และเลขที่โอนเงิน/CPG
- เคลม `เสียชีวิต` และ `ทุพพลภาพ/สูญเสียอวัยวะ` ยังคงใช้ flow เดิม คือ `ส่งตรวจสอบ`

### 2. พิจารณาเคลมโรงพยาบาล: Step1 Section ผลพิจารณา
- เพิ่ม override ใน `js/menu-hospital-claim-step1-decision-doc-reset.js`
- Scope ครอบคลุม `#considerHospitalOpdHalfPage` และ `#considerHospitalOpdFullPage`
- เปลี่ยน header `ผลการพิจารณา` เป็น `แจ้งผลการพิจารณาโรงพยาบาล`
- เปลี่ยนปุ่ม `รอแก้ไข` เป็น `แจ้งแก้ไข`
- ตัดปุ่ม `ยกเลิก` ออกจาก decision section
- หาก state เดิมเป็น `cancel` จะล้างค่า decision state เพื่อไม่ให้ค้างค่าเดิม

### 3. วางบิลเคลมโรงพยาบาล: Step1 Section ผลพิจารณา
- ขยาย override ให้ครอบคลุม `#billingHospitalReviewPage`
- เปลี่ยน header `ผลการพิจารณา` เป็น `แจ้งผลการพิจารณาโรงพยาบาล`
- เปลี่ยนปุ่ม `รอแก้ไข` เป็น `แจ้งแก้ไข`
- ตัดปุ่ม `ยกเลิก`
- ตัดปุ่ม `บันทึกแบบร่าง` ในหน้า billing hospital

### 4. ผลตรวจสอบเอกสาร: ล้างค่าเมื่อเอกสารเปลี่ยน
- เมื่อมีการสแกน/ค้นหา/เพิ่ม/ปรับจำนวนเอกสาร ให้ล้างผลตรวจเอกสารเฉพาะแถวนั้น
- ไม่ล้างหมายเหตุ เว้นแต่ behavior เดิมของระบบล้างเอง
- ล้าง class selected/active และตั้ง `aria-pressed="false"` ให้ปุ่มผลตรวจในแถวนั้น
- Dispatch event เพื่อให้ validation/ปุ่มถัดไป/ปุ่มอนุมัติ sync ตาม behavior เดิม
- สำหรับหน้า billing hospital มีการกัน legacy ไม่ให้เติมผลตรวจกลับเป็น `ผ่าน` อัตโนมัติหลัง scan/render



## Verification Done
- Syntax check ผ่าน:
  - `node --check js/menu-claim-entry-transfer-confirmation.js`
  - `node --check js/menu-hospital-claim-step1-decision-doc-reset.js`
- Browser harness/manual verification ที่เคยทดสอบแล้ว:
  - หน้า OPD Full detail แสดง header/ปุ่มถูกต้อง และไม่มีปุ่ม `ยกเลิก`
  - Scan/ค้นหาเอกสารแล้วผลตรวจเอกสารถูกล้างเฉพาะแถว
  - Dropdown `สาเหตุการปฏิเสธ` เลือกค่าได้
  - หน้า billing hospital ไม่มีปุ่ม `บันทึกแบบร่าง`
- ไฟล์ harness ชั่วคราวถูกลบแล้ว
- Local server ที่ใช้ทดสอบถูกหยุดแล้ว

## QA Checklist For Dev
- แจ้งเคลมทั่วไป PH/PA:
  - ไปถึงหน้า Payment
  - กดปุ่มหลัก
  - ต้องเห็น Modal ยืนยันบัญชีโอนเงิน
  - กด `โอนเงิน`
  - ต้องเห็น progress ครบ CL / CC / Transfer และ success modal
- Death/Disability:
  - ปุ่มยังเป็น `ส่งตรวจสอบ`
  - ยังเปิด modal ยืนยันส่งตรวจสอบเดิม
  - ต้องไม่เข้า flow โอนเงิน
- พิจารณาเคลมโรงพยาบาล OPD Full / OPD Half:
  - Step1 header ต้องเป็น `แจ้งผลการพิจารณาโรงพยาบาล`
  - ปุ่มต้องเป็น `แจ้งแก้ไข`
  - ต้องไม่มีปุ่ม `ยกเลิก`
  - เลือก `แจ้งแก้ไข` แล้วเลือกสาเหตุได้
  - เลือก `ปฏิเสธ` แล้วเลือกสาเหตุได้
- วางบิลเคลมโรงพยาบาล:
  - Step1 header ต้องเป็น `แจ้งผลการพิจารณาโรงพยาบาล`
  - ปุ่มต้องเป็น `แจ้งแก้ไข`
  - ต้องไม่มีปุ่ม `ยกเลิก`
  - ต้องไม่มีปุ่ม `บันทึกแบบร่าง`
  - Scan/ค้นหาเอกสารแล้วผลตรวจของแถวนั้นต้องกลับเป็นค่าว่าง
- ผลตรวจเอกสาร:
  - เลือกผลตรวจหลายแถว แล้ว scan/เพิ่มเอกสารหนึ่งแถว ต้องล้างเฉพาะแถวนั้น
  - แถวอื่นต้องยังคงผลตรวจเดิม
  - แถวที่มีจำนวนเอกสารมากกว่า 0 และยังไม่เลือกผลตรวจ ต้องกลับไปติด validation ก่อนอนุมัติ/ถัดไป

## Notes
- Repo ปัจจุบันขึ้นเป็น untracked ทั้งก้อนใน `git status` จึงไม่สามารถดู diff เฉพาะ tracked files แบบปกติได้
- การแก้ไขใช้แนวทางเพิ่ม override script ท้าย `index.html` ตาม pattern เดิมของโปรโตไทป์ เพื่อลดการแก้ legacy script ขนาดใหญ่โดยตรง
- ควรทำ manual QA ซ้ำใน browser จริงก่อนส่งต่อ UAT
