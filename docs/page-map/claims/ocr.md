# Claim OCR

## Identity

- Breadcrumb: แจ้งเคลม → OCR
- Page ID: `ocrPage` — static section
- หน้าที่: Step OCR ของ Claim Journey

## Navigation และ Flow

- Entry/Exit ผ่าน shared claim workflow; Previous `documentPage`, Next `paymentPage`
- Related: [Document](document.md), [Payment](payment.md)

## Effective implementation

- ตรวจ `renderStepper("ocrStepper"`, OCR handlers, observers และ timeout patches ใน `index.html`
- หน้านี้ใช้ shared `showClaimPage`; function ชื่อซ้ำให้ยึด runtime effective reference

## Data และ Source ownership

- Minimum files to read: `index.html`, Phase 0 `effective-functions.json` และ `event-bindings.json`
- Stable anchors: `id="ocrPage"`, `ocrStepper`, `showOcr`
- CSS scope: `#ocrPage`; inline CSS

## Constraints และ Regression

- ห้ามเปลี่ยน async/mock OCR timing หรือ validation โดยไม่ระบุ business change
- ทดสอบ loading/result/error state, Previous/Next และ scroll

