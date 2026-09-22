# Extend Transfer Limit

## Identity

- เมนู: จัดการเงินเคลม → ขยายวงเงิน
- Page ID: `extendLimitPage` — static section ที่ inject จาก inline script
- หน้าที่: ค้นหา/ขอขยายวงเงินตาม behavior เดิม

## Navigation และ Flow

- Entry: `#submenuExtendLimit` → closure-local `showPage`
- Exit ผ่านเมนูอื่น/shared page hider

## Effective implementation

- Feature อยู่ใน IIFE ใกล้ anchor `$('submenuExtendLimit')?.addEventListener('click',showPage)`
- เมนู active ถูกจัดผ่าน `claimMoneyManagementSubmenu`

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `id="extendLimitPage"` และ enclosing IIFE
- Stable anchors: `id="extendLimitPage"`, `submenuExtendLimit`
- CSS scope: `#extendLimitPage` และ prefix ของ feature ใน inline CSS

## Constraints และ Regression

- ห้ามเปลี่ยน limit calculation/validation โดยไม่ระบุ business rule
- ทดสอบ empty/valid/invalid input, confirmation และ mobile scroll

