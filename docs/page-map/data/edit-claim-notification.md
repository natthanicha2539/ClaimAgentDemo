# Edit Claim Notification

## Identity

- เมนู: จัดการข้อมูลแจ้งเคลม → แก้ไขการแจ้งเคลม
- Page ID: `editClaimNotificationPage` — static section ที่ inject จาก inline script
- หน้าที่: ค้นหา claim และแก้ coverage/treatment ผ่าน modal

## Navigation และ Flow

- Entry: `#submenuEditClaimNotification` → closure-local `show`
- Search → edit modal → save; click backdrop/close/cancel ปิด modal

## Effective implementation

- `init()` bind `ecnSearchBtn`, `ecnClaimNo`, `ecnEditBtn`, `ecnCoverage`, modal actions
- `refreshTreatment` เป็น dependency ของ coverage selection

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ edit-claim-notification markup/IIFE
- Stable anchors: `id="editClaimNotificationPage"`, `ecnSearchBtn`, `refreshTreatment`, `ecnEditModal`
- CSS scope: `#editClaimNotificationPage` และ prefix `ecn-`

## Constraints และ Regression

- รักษา valid treatment options ตาม coverage; ทดสอบ search, dependent options, save/cancel และ overlay cleanup

