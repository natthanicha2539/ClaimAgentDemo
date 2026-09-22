# Edit Transfer

## Identity

- เมนู: จัดการเงินเคลม → แก้ไขการโอนเงิน
- Page ID: `editTransferPage` — static section ที่ inject จาก inline script
- หน้าที่: ค้นหาและแก้ไขข้อมูลการโอน

## Navigation และ Flow

- Entry: `#submenuEditTransfer` → closure-local `showPage`
- Exit ผ่าน shared money navigation

## Effective implementation

- อ่าน IIFE ที่มี `$('submenuEditTransfer')?.addEventListener('click',showPage)` ทั้ง block
- Shared money submenu patch มีผลต่อ active state

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ edit-transfer markup/IIFE
- Stable anchors: `id="editTransferPage"`, `submenuEditTransfer`
- CSS scope: `#editTransferPage` และ feature-prefixed selectors

## Constraints และ Regression

- รักษา selected transfer identity และ validation; ทดสอบ search/edit/save/cancel/back

