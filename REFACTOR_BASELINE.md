# ClaimAgent Refactor Baseline — Phase 0

Baseline นี้สร้างจาก Runtime ปัจจุบันก่อนเริ่มแยก CSS, JavaScript หรือ Mock Data จุดประสงค์คือใช้ตรวจว่า Refactor รอบถัดไปไม่เปลี่ยน UI, Flow, Business Rule, Mock Data หรือ observable behavior เดิม

วันที่เก็บ Baseline: 10 กันยายน 2569  
Runtime: เปิด `index.html` ผ่าน `file://` ด้วย Chrome/Playwright  
รูปแบบ Test: Node.js CommonJS ไม่มี `package.json`, Build step หรือ ES Module

## Baseline Summary

| รายการ | จำนวน |
|---|---:|
| DOM ID occurrences | 1,565 |
| DOM IDs ไม่ซ้ำ | 1,462 |
| Page IDs สำคัญ | 38 |
| Modal IDs | 88 |
| Iframes | 5 |
| Duplicate IDs ใน Source/Template | 77 |
| Function declarations/expressions | 1,700 |
| Function names ไม่ซ้ำ | 1,224 |
| Function names ที่ประกาศซ้ำ | 176 |
| Final runtime functions ที่ resolve ได้ | 553 |
| Duplicate/overridden runtime functions | 91 |
| Dynamic/wrapped runtime functions | 80 |
| Static `window.*` assignments | 468 |
| Static top-level variable declarations | 110 |
| Custom runtime window globals | 921 |
| Mock dataset candidates | 31 |
| Scripts | 184 |
| Styles | 342 |
| Ordered patch-stack entries | 381 |
| Static `addEventListener` | 490 |
| Runtime listeners observed | 549 |
| Inline handlers | 491 |
| `.onclick` assignments | 16 |
| MutationObservers | 48 |
| `setTimeout` calls | 219 |
| `requestAnimationFrame` calls | 35 |

รายละเอียดเต็มอยู่ใน JSON ภายใต้ `tests/parity/baseline/`

## Script Execution Dependencies

ลำดับปัจจุบันเป็นส่วนหนึ่งของ Runtime contract:

1. Safe-guard script และ Tailwind configuration ใน `<head>`
2. Inline styles ก่อน `<body>`
3. Application shell และ Page sections
4. Core/legacy inline script ซึ่งเป็น inline script ที่ใหญ่ที่สุด
5. Style/script patch stack หลัง Core ซึ่ง override หรือ wrap implementation ก่อนหน้า
6. `js/menu-billing-hospital-review.js` ถูกโหลดระหว่าง patch stack
7. External scripts ท้ายไฟล์ตามลำดับ:
   - `js/menu-claim-entry-transfer-confirmation.js`
   - `js/menu-hospital-claim-step1-decision-doc-reset.js`
   - `js/menu-hospital-claim-traffic-accident.js`
   - `js/menu-customer-claim-detail.js`
   - `js/menu-claim-search-detail-blank.js`

ห้ามย้าย script/style โดยพิจารณาจากชื่อ Feature อย่างเดียว ต้องอ้าง `script-order.json`, source hash และ effective runtime reference ก่อนทุกครั้ง

`claimCalcFrame` ยังใช้ `srcdoc` ภายใน `index.html` โดย Baseline เก็บ encoded/decoded length, SHA-256, script count และ style count ไว้ใน `dom-pages.json`

## Effective Implementations และ Override Risk

`effective-functions.json` เก็บ declaration/assignment chain ตาม script index และ line แล้วเทียบกับ final `window[name]` ผ่าน `Function.prototype.toString()` SHA-256

- Final runtime functions: 553
- มี duplicate หรือ override chain: 91
- เป็น dynamic wrapper หรือหา source ด้วย hash ตรงไม่ได้: 80

กลุ่มเสี่ยงสูงประกอบด้วย:

- Navigation: `openClaimEntry`, `openConsiderCustomerRow`, `openConsiderHospitalRow`, `setConsiderationTab`
- Claim Monitor: `renderClaimMonitor`, `renderConsiderationTable`, status/filter helpers
- Customer Claim: `setCustomerStep`, `selectCustomerDecision`, detail/payment render wrappers
- Hospital Claim: `setHospitalFullStep`, `setHospitalHalfStep`, document/decision/compensation wrappers
- Claim Journey: `renderClaimEntry`, `renderClaimSelectionControls`, `renderBenefitSummary`, `renderPaymentPage`
- Billing/Transfer: `openHospitalBillingReview`, `setBillingReviewStep`, `renderTransferTrackingTable`, `applyTransferTrackingFilters`

Function เหล่านี้ห้ามรวม ลบ หรือเลือก implementation จากชื่อเท่านั้นใน Phase 1

## Globals และ Mock Data

`window-globals.json` เก็บ Static assignments/top-level declarations และ Custom globals ที่ resolve จริงหลังหน้าโหลด

`mock-data.json` เก็บ Source location, initializer hash, static initializer count, final runtime count และ serialized runtime hash ของ Mock 31 ชุด ทุกชุด resolve ที่ Runtime ได้

ตัวอย่างชุดข้อมูลสำคัญ:

| Dataset | Initializer | Final Runtime |
|---|---:|---:|
| `monitorRows` | 3 | 3 |
| `claimMonitorRows` | 8 | 8 |
| `considerationCustomerRows` | 18 | 18 |
| `considerationHospitalRows` | 15 | 18 |
| `considerationDeathRows` | 5 | 5 |
| `DISABILITY_BENEFIT_RULES` | 35 | 35 |
| `organCatalog` | 12 | 12 |
| `transferTrackingRows` | 14 | 14 |
| `hospitalBillingRows` | 10 | 10 |

จำนวน Initializer และ Final Runtime ที่ต่างกันเป็นผลจาก patch ปัจจุบันและต้องถือเป็น behavior เดิม ห้ามปรับให้เท่ากันใน Refactor

## Inline Handler Dependencies

Inline handlers 491 จุดยังพึ่ง Global functions โดยตรง จึงห้าม rename หรือย้ายเข้า private scope จนกว่าจะมี Compatibility layer ที่ทดสอบแล้ว

Runtime ตรวจ dependency names 192 ชื่อ พบ 7 token ที่ไม่ใช่ global function ได้แก่ `Step`, `closest`, `max`, `min`, `remove`, `stopPropagation` และ `stringify` ซึ่งเป็น method/fragment จาก static extraction ไม่ใช่ข้อสรุปว่า handler เสีย

รายการ handler, source hash, event type และ dependency รายจุดอยู่ใน `event-bindings.json`

## Critical Regression Matrix

ทดสอบ 7 หน้า × 7 Viewports รวม 49 scenarios และ 98 screenshots:

- Claim Monitor
- Claim Search
- Customer Claim Detail
- Hospital Claim Detail
- Claim Journey
- Billing
- Transfer

Viewports:

- 1920×1080
- 1440×900
- 1366×768
- 768×1024
- 430×932
- 390×844
- 375×812

แต่ละ scenario ตรวจ Vertical scroll, body/html overflow, page horizontal overflow, table internal scroll, active page, hidden-page hit testing, overlay blocking, critical overlap, Claim Journey/timeline visibility และ system-name overlap พร้อม viewport/full-page screenshot

## Known Baseline Issues — ห้ามแก้ใน Phase 0

Runtime ที่มีอยู่เดิม:

- Page error: `expenseData is not defined`
- Customer Claim Detail setup พบ `renderClaimPaymentDetail is not defined` ทั้ง 7 viewports
- Existing test `tests/customer-claim-detail.cjs` timeout เพราะ `#customerClaimReadOnlyPage` ยังคง hidden; บันทึกเป็น Known Baseline และไม่ได้แก้ Test/Runtime เดิม
- Tailwind CDN แสดง production warning ใน Console

Responsive checks:

- `claim-journey-not-readable`: 7 scenarios เพราะ `#claimStepper` ไม่ visible ตาม Runtime ปัจจุบัน
- `critical-target-blocked`: 6 scenarios ที่ Tablet 768px
- `table-without-internal-scroll`: Billing ที่ Tablet 768px จำนวน 1 scenario
- `page-horizontal-overflow`: Claim Journey ที่ Mobile 430/390/375 รวม 3 scenarios โดย document กว้างเกิน viewport 53px

Known issues เหล่านี้เป็นค่าตั้งต้นสำหรับตรวจ Regression ไม่ใช่ authorization ให้แก้ UI หรือ Business Logic ใน Phase 1

Regression tests เดิมแบบ Static ผ่าน 3 ชุด: Hospital billing document columns, Claim Search blank detail และ Hospital traffic accident. Customer Claim browser test มี Known failure ตามรายการด้านบน

## Running the Baseline

```bash
export NODE_PATH=/Users/n.toraksa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
node tests/parity/collect-static-baseline.cjs
node tests/parity/collect-runtime-baseline.cjs
node tests/parity/run-all.cjs
```

ตรวจ Current Runtime เทียบกับ Baseline โดยไม่เขียนทับ Artifact เดิม:

```bash
export NODE_PATH=/Users/n.toraksa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
node tests/parity/check-baseline.cjs
```

ก่อน regenerate Baseline ต้องตรวจ Diff ทุกครั้ง ห้าม regenerate เพื่อทำให้ Regression ผ่าน

## Phase 1 Safety Gates

- ห้ามสลับ Script/Style/Patch order โดยไม่มีผล compare จาก `script-order.json`
- ต้องรักษา final function hashes หรืออธิบาย Compatibility mapping ราย function
- ต้องรักษา Inline-handler globals ทุกชื่อ
- ต้องรักษา Mock serialized hashes และ final runtime counts
- ต้องทดสอบ Customer/Hospital routes เพราะมี runtime wrappers และ Known errors
- ต้องตรวจ `claimCalcFrame.srcdoc` แยกจาก Main document
- ต้องรันครบ 49 responsive scenarios หลังการย้ายแต่ละ Feature
- Phase 0 ไม่ได้เริ่มหรือดำเนินการ Refactor Phase 1
