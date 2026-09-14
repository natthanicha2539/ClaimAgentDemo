# Claim Calculation

## Identity

- เมนู: คำนวณวงเงินเคลม
- Page ID: `claimCalcPage` — static shell
- หน้าที่: แสดง `claimCalcFrame` ซึ่งใช้ `srcdoc`

## Navigation และ Flow

- Entry: `showClaimCalcPage(false)` จาก `#menuCalc`; จาก claim flow ใช้ `showClaimCalcPageFromClaim()`
- Back route แตกต่างตามจุดเข้าและต้องรักษา context เดิม
- Related: [Claim Entry](claim-entry.md), [Claim Monitor](claim-monitor.md)

## Effective implementation

- Shell navigation อยู่ใน `index.html`; calculator implementation อยู่ใน `claimCalcFrame.srcdoc`
- srcdoc เป็น boundary แยก document มี CSS/JS/event ของตัวเอง

## Data และ Source ownership

- Minimum files to read: ค้นเฉพาะ `id="claimCalcPage"`, `claimCalcFrame`, `showClaimCalcPage` และ `showClaimCalcPageFromClaim` ใน `index.html`
- Stable anchors: `id="claimCalcPage"`, `id="claimCalcFrame"`, `claimCalcFrame.srcdoc`
- CSS scope: shell `#claimCalcPage`; calculator styles อยู่ใน srcdoc

## Constraints และ Regression

- Phase 0 เก็บ srcdoc hash; ห้ามแก้ srcdoc เมื่อ scope เป็นหน้าอื่น
- ทดสอบเปิดตรง/เปิดจาก claim, Back context, iframe scroll และ srcdoc hash

