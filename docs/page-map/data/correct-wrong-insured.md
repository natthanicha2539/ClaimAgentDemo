# Correct Wrong Insured

## Identity

- เมนู: จัดการข้อมูลแจ้งเคลม → แก้ไขเคลมผิดคน
- Page ID: `correctWrongInsuredPage` — static section ที่ inject จาก inline script
- หน้าที่: ค้นหาเคลม เลือกผู้เอาประกันใหม่ ระบุเหตุผล และยืนยัน

## Navigation และ Flow

- Entry: `#submenuCorrectWrongInsured` → closure-local `show`
- ใช้ search/confirm/success modals และ expandable transfer card

## Effective implementation

- `init()` เป็น binding hub สำหรับ search, choose, validate, save, confirm, copy และ modal close
- Menu state ทำใน feature-local `activateMenu()`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ correct-wrong-insured markup/IIFE
- Stable anchors: `id="correctWrongInsuredPage"`, `cwiClaimSearchBtn`, `cwiChooseBtn`, `cwiConfirmBtn`
- CSS scope: `#correctWrongInsuredPage` และ prefix `cwi-`

## Constraints และ Regression

- รักษา original/new insured identity และ reason validation; ทดสอบทุก modal, copy fallback และ no-result state

