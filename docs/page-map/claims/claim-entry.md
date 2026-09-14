# Claim Entry / Claim Journey

## Identity

- เมนู: แจ้งเคลม → แจ้งเคลม → ดำเนินการ
- Page ID: `claimEntryPage` — static section
- หน้าที่: Step 1 ของ workflow และพื้นที่ Claim Journey/stepper

## Navigation และ Flow

- Entry: `showClaimEntryPage`/`showClaimPage("claimEntryPage", ...)`
- Next: `validateClaimEntryBeforeNext()` ไป `documentPage`; Back ไป `claimMonitorPage`
- Related: [Document](document.md), [Claim Calculation](claim-calculation.md)

## Effective implementation

- Shared navigation: `showClaimPage`, `getWorkflowStepIndex`, `renderStepper`
- Product/treatment behavior อิง `currentProductType()` และ current claim state
- มี late patches เกี่ยวกับ date, coverage, treatment, traffic accident และ transfer confirmation; ตรวจ Phase 0 duplicate chain ก่อนแก้

## Data และ Source ownership

- Globals: selected insured/claim context, product PH/PA, treatment, claim date, coverage state
- Minimum files to read: `index.html`; เพิ่ม `js/menu-claim-entry-transfer-confirmation.js` เมื่อแก้ confirmation
- Stable anchors: `id="claimEntryPage"`, `validateClaimEntryBeforeNext`, `renderStepper("claimStepper"`
- CSS scope: `#claimEntryPage`, claim stepper และ `.pa-typography`; inline CSS

## Constraints และ Regression

- การเริ่ม “แจ้งเคลมต่อเนื่อง” จากประวัติเคลมต้องเลือกรายการระดับ Case และส่ง `caseNo` เข้า opener; ห้ามใช้ `claimNo` เป็น selection key
- Known baseline: Claim Journey readability ไม่ผ่าน 7 viewports และชื่อระบบ/timeline เป็นพื้นที่เสี่ยง ห้ามแก้โดยบังเอิญ
- Tests: Phase 0 Claim Journey 7-viewports; transfer confirmation tests เมื่อแตะปุ่มถัดไป
