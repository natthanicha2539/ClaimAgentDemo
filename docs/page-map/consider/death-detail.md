# Death & Disability Detail

## Identity

- Breadcrumb: พิจารณาเคลม → Death & Disability → รายละเอียด
- Page ID: `considerDeathDetailPage` — static section
- หน้าที่: ผู้รับผลประโยชน์ ความคุ้มครอง เอกสาร และการตัดสินใจ Death claim

## Navigation และ Flow

- Entry จาก `considerDeathPage`; Back inline handler `showConsiderDeathPage()`
- มี edit beneficiary, change account, scan document และ confirmation modals
- Related: [Death List](death-list.md)

## Effective implementation

- Inline handlers เช่น `showDdChangeAccountModal`, `showEditBeneficiaryModal` ต้องคง global names
- อ่าน all `dd-` functions/patches ใน order ที่ปรากฏ

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `considerDeathDetailPage` และ `dd-` anchors
- Stable anchors: `id="considerDeathDetailPage"`, `showDdChangeAccountModal`, `showEditBeneficiaryModal`
- CSS scope: `#considerDeathDetailPage`, `.dd-detail-page`, `.dd-*`

## Constraints และ Regression

- ห้ามนำ Customer/Hospital decision rule มาใช้โดยอนุมาน
- ทดสอบ beneficiary/edit/account/document modals, Back และ overlay cleanup

