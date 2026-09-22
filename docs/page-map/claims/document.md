# Claim Document

## Identity

- Breadcrumb: แจ้งเคลม → เอกสาร
- Page ID: `documentPage` — static section
- หน้าที่: Step เอกสารของ Claim Journey

## Navigation และ Flow

- Entry/Exit ผ่าน `showClaimPage` และ workflow step functions
- Previous: `claimEntryPage`; Next: `ocrPage`
- Related: [Claim Entry](claim-entry.md), [OCR](ocr.md)

## Effective implementation

- ตรวจ `renderStepper("docStepper"`, document renderer/handlers และ late document patches ใน `index.html`
- Navigation ใช้ shared `hideClaimPages`; inline handlers ต้องคง global names

## Data และ Source ownership

- Minimum files to read: `index.html`, Phase 0 function/event inventories
- Stable anchors: `id="documentPage"`, `docStepper`, `showDocument`
- CSS scope: `#documentPage` และ shared claim workflow styles; inline CSS

## Constraints และ Regression

- อย่าสับสนกับ document checking ใน Consideration/Billing ซึ่งใช้ renderer คนละชุด
- ทดสอบ Previous/Next, stepper, upload/scan state และ scroll

