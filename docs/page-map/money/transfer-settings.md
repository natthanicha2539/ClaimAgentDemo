# Transfer Settings

## Identity

- เมนู: จัดการเงินเคลม → ตั้งค่าการโอนเงิน
- Page ID: `transferSettingsPage` — static section ที่ inject จาก inline script
- หน้าที่: เปิด/ปิดระบบโอนและบันทึกประวัติ mock

## Navigation และ Flow

- Entry: `#submenuTransferSettings` → closure-local `show`
- Toggle เปิด confirmation; confirm เปลี่ยน local `enabled` และเพิ่ม history

## Effective implementation

- `init()` bind `tsToggle`, `tsCancelBtn`, `tsConfirmBtn`, overlay click
- Menu activation ทำใน `keepMenu()`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ transfer-settings markup/IIFE
- Stable anchors: `id="transferSettingsPage"`, `function keepMenu()`, `tsToggle`, `tsConfirmModal`
- CSS scope: `#transferSettingsPage` และ prefix `ts-`

## Constraints และ Regression

- รักษาเวลาทำการ/ข้อความคำแนะนำและ history behavior; ทดสอบ toggle cancel/confirm และ mobile

