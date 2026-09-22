# Additional Transfer

## Identity

- เมนู: จัดการเงินเคลม → โอนเพิ่ม
- Page ID: `additionalTransferPage` — static section
- หน้าที่: ค้นหาและแสดงรายการที่สามารถทำรายการโอนเพิ่ม

## Navigation และ Flow

- Entry binding เริ่มที่ `#submenuAdditionalTransfer`
- เลือกรายการไป `additionalTransferDetailPage`; เมนู shared money submenu ต้องคง active
- Related: [Additional Transfer Detail](additional-transfer-detail.md)

## Effective implementation

- Feature อยู่ใน IIFE ที่ใช้ helper `$`; ตรวจ `submenuAdditionalTransfer`, render/filter และ open-detail functions ใน block เดียวกัน
- Shared page-hiding และ money-menu patches ทำงานหลัง markup

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ anchors `id="additionalTransferPage"` และ `submenuAdditionalTransfer`
- Globals/state เป็น closure-local เป็นหลัก; อย่าเพิ่ม global โดยไม่จำเป็น
- CSS scope: `#additionalTransferPage`, `.at-page`; inline CSS

## Constraints และ Regression

- รักษา search/filter/selected row และห้ามให้ modal/overlay ค้าง
- ทำ smoke test list → detail → back ทั้ง desktop/mobile

