# Death & Disability List

## Identity

- เมนู: พิจารณาเคลม → Death & Disability
- Page ID: `considerDeathPage` — static section
- หน้าที่: รายการค้นหา/พิจารณา Death & Disability

## Navigation และ Flow

- Entry: `showConsiderDeathPage()` จาก `#submenuConsiderDeath`
- Detail: เปิด `considerDeathDetailPage`; Back detail เรียก `showConsiderDeathPage()`
- Related: [Death Detail](death-detail.md)

## Effective implementation

- ตรวจ `showConsiderDeathPage`, list renderer/filter และ row opener ใน `index.html`
- Shared Consider submenu state และ page hider มีผล

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `considerDeathPage` และ `dd-` feature blocks
- Stable anchors: `id="considerDeathPage"`, `function showConsiderDeathPage`
- CSS scope: `#considerDeathPage`, `.dd-page`, `.dd-*`

## Constraints และ Regression

- เป็น dataset/business flow แยกจาก Customer/Hospital; ห้าม reuse Monitor routing โดยอัตโนมัติ
- ทดสอบ list/filter/detail/back และ responsive table

