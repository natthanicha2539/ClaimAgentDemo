# Bank Inquiry

## Identity

- เมนู: จัดการเงินเคลม → สอบถามธนาคาร
- Page ID: `bankInquiryPage` — static section ที่ inject จาก inline script
- หน้าที่: ค้นหาธนาคารและยืนยันการสอบถาม

## Navigation และ Flow

- Entry: `#submenuBankInquiry` → `show()` ภายใน feature IIFE
- Flow ใช้ `biConfirmModal` และ `biResultModal`

## Effective implementation

- `init()` bind search input/button, confirm/cancel/result และ overlay click
- State/menu activation เป็น closure-local ผ่าน `activateMenu()`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ bank-inquiry markup/IIFE
- Stable anchors: `id="bankInquiryPage"`, `function activateMenu()`, `biSearchBtn`, `biConfirmModal`
- CSS scope: `#bankInquiryPage` และ prefix `bi-`

## Constraints และ Regression

- ทดสอบ Enter/search/no-result/result, modal cancel/confirm และ overlay cleanup

