# Developer Master

## Identity

- เมนู: Developer → Master
- Page ID: `devMasterPage` — static section
- หน้าที่: ดู/จัดการ mock master data สำหรับงานพัฒนา

## Navigation และ Flow

- Entry: `#menuDevMaster`; handler ซ่อนหน้าอื่นและแสดง master page
- Related: [Developer Flow](flow.md)

## Effective implementation

- ตรวจ IIFE/handlers รอบ `menuDevMaster` และ late sidebar reset logic
- ปุ่ม sidebar อื่นจะ reset Developer page state

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `id="devMasterPage"`, `menuDevMaster` และ master renderer/data anchors
- CSS scope: `#devMasterPage`, developer/master prefixes ใน inline CSS

## Constraints และ Regression

- เป็น development utility; ห้ามให้ global mock/master edits กระทบ production-facing datasets โดยไม่ตั้งใจ
- ทดสอบ menu switching, search/edit dialogs และ mobile scroll
