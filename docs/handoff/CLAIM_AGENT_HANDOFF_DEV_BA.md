# ClaimAgent — Consolidated Handoff สำหรับ Dev และ BA

วันที่สรุป: 11 กันยายน 2569  
สถานะเอกสาร: As-built prototype specification  
Runtime contract: เปิด `index.html` ผ่าน `file://`, Classic Script, ไม่มี ES Module, package manager หรือ build step

## 1. วัตถุประสงค์และขอบเขต

เอกสารนี้รวม Change ที่ทำใน prototype ปัจจุบันเพื่อให้ BA นำไปจัดทำ Functional/UI Specification และให้ Dev เห็น source ownership, integration contract, patch order และ regression gate โดยไม่ต้องอ่าน `index.html` ทั้งไฟล์

สิ่งที่ต้องถือเป็นข้อจำกัดร่วม:

- Application Shell, Sidebar และ Topbar เดิมต้องคงอยู่
- ห้าม derive record context จาก filter, row index, Claim No./CPG pattern หรือข้อความใน DOM เมื่อมี record key ที่กำหนดไว้
- Claim Monitor ใช้ `appId` เป็น record key; Claim Search ใช้ Claim No. ที่อยู่ใน Mock Search เป็น key ของ action เดิม
- ห้าม normalize Hospital OPD Half/Full: `claimType` ยังคงเป็น `OPD Half` / `OPD Full` และ `treatmentType` ยังคงเป็น `OPD`
- Effective opener/wrapper chain และลำดับ script เป็น runtime contract ห้ามเรียก renderer ปลายทางตรงเพื่อข้าม wrapper
- Known baseline issue เดิมไม่ใช่ scope สำหรับ cleanup

## 2. สรุปหน้าจอและเงื่อนไขสำหรับ BA

### 2.1 แจ้งเคลม > Claim Monitor

| หัวข้อ | As-built behavior |
| --- | --- |
| Mock Data | 76 รายการ แยก Customer 36 และ Hospital 40 |
| Product | PH, PA |
| Claim Category | เคลมลูกค้า, เคลมโรงพยาบาล |
| Customer Treatment | OPD, IPD, Day Case Surgery |
| Hospital Treatment | OPD Half, OPD Full, IPD, Day Case Surgery |
| Customer Status | รอพิจารณา, รอเอกสาร, รอแก้ไข, ปฏิเสธ, ยกเลิก, อยู่ระหว่างดำเนินการ |
| Hospital Status | รอพิจารณา, รอแก้ไข, ปฏิเสธ, ยกเลิก, อยู่ระหว่างดำเนินการ |
| Views | Table และ Card ใช้ dataset เดียวกัน |
| Detail entry | กด record แล้ว resolve ด้วย `appId`; context มาจาก record ไม่ใช่ค่าบน filter |
| Back | คืน Product/Category/Treatment/Status, search type/value, Table/Card mode, selected record และ scroll position |

Invalid combinations ที่ต้องไม่เกิด:

- Customer ไม่มี OPD Half และ OPD Full
- Hospital ไม่มี Customer OPD
- Hospital ไม่มีสถานะรอเอกสาร

จำนวนต่อ context:

- Customer: 2 Products × 3 Treatments × 6 Statuses = 36
- Hospital: 2 Products × 4 Treatments × 5 Statuses = 40
- รวม = 76

### 2.2 Claim Monitor > Claim Detail

- Routing ใช้ `product`, `claimCategory`, `claimType`, `treatmentType`, `itemStatus` จาก record ที่ resolve ด้วย `appId`
- Customer OPD/IPD/Day Case Surgery ไป Customer Claim Detail เดิม
- Hospital OPD Half ไป Hospital OPD Half Detail
- Hospital OPD Full ไป Hospital OPD Full Detail
- Hospital IPD และ Day Case Surgery ไป Hospital Detail destination เดิมของระบบ
- Status เป็น context สำหรับ display/mock เท่านั้น ไม่สร้าง business rule เพิ่ม
- Detail mock resolve ได้ครบ 76 `appId` โดยประกอบจาก Base Detail + Product/Category/Treatment/Status overrides + appId-specific values
- PH ซ่อนข้อมูลสถานศึกษา; PA แสดงข้อมูลสถานศึกษาและ `schoolStatus = อนุมัติกรมธรรม์`
- สถานะปฏิเสธ/ยกเลิกมี approved amount = 0 และไม่มี transfer success; รอเอกสารมีเฉพาะ Customer และมีเอกสารค้างอย่างน้อย 1 รายการ

### 2.3 งานเคลม > ค้นหาเคลม

Search Type ทั้ง 8 แบบ:

1. เลขที่ CL
2. เลขที่ Case
3. เลขบัตรประชาชน
4. Passport / GCode
5. AppID
6. เลขบัตรประกันนักเรียน
7. ชื่อ-สกุลผู้เอาประกัน
8. ชื่อสถานศึกษา

Result flow:

| เงื่อนไขค้นหา | ผลลัพธ์/ขั้นตอน |
| --- | --- |
| CL / Case | แสดงรายการ Claim ระดับ Claim |
| บัตรประชาชน / Passport-GCode | แสดงผู้เอาประกันและกรมธรรม์ให้เลือก |
| AppID / บัตรประกันนักเรียน | resolve กรมธรรม์ที่ตรงและเลือกให้โดยอัตโนมัติ |
| ชื่อ-สกุลซ้ำ | แสดงแต่ละบุคคลพร้อมตารางกรมธรรม์แบบเดียวกับผลเลขบัตรประชาชน แล้วเลือกกรมธรรม์ของบุคคลที่ต้องการ |
| ชื่อสถานศึกษา | ต้องใช้ปีการศึกษาประกอบ |
| เลือกกรมธรรม์ | เปิด Claim History เฉพาะกรมธรรม์นั้น |
| ไม่พบข้อมูล | แสดง empty/no-result state โดยไม่เปลี่ยนหน้า |

Mock Search ปัจจุบัน:

- 3 บุคคล
- 6 กรมธรรม์
- 13 Claims; จำนวน Claim รายกรมธรรม์ตรงกับค่าที่ประกาศเป็น 4/2/1/3/2/1
- มี Mock chips 13 รายการ: ครบทุก Search Type และมีตัวอย่างสถานะ/บุคคล/สถานศึกษาเพิ่มเติม
- Desktop วาง chips ข้าง helper copy; Mobile แสดงเป็นแถวเลื่อนแนวนอน ไม่ซ่อน

UI ที่เพิ่ม/ปรับ:

- Search Form, validation state, result table, person chooser, policy selection และ Claim History ใช้ visual language จาก HTML reference แต่คง shell เดิม
- ปุ่ม “ดูรายละเอียดเคลม” ในตารางเป็น Icon Button รูป `visibility` ขนาด 36×36 px พร้อม `aria-label` ระบุ Claim และ tooltip `ดูรายละเอียดเคลม`
- ตารางกว้างเลื่อนภายใน container และห้ามทำให้ document overflow แนวนอน

### 2.4 งานเคลม > ค้นหาเคลม > Claim History

- Reuse renderer เดิม `renderClaimSearchInsuredDetail`
- Hero ข้อมูลผู้เอาประกันบน Desktop ลดความสูงเป็น 164 px; Tablet/Mobile ปล่อยความสูงตามเนื้อหาเพื่อไม่ให้ข้อมูลซ้อนหรือถูกตัด
- สถานะ App ใช้ semantic tone ตามสถานะ (`active`, `pending`, `closed`) พร้อมสีข้อความ พื้นหลัง และเส้นขอบที่อ่านได้ชัดเจน
- แสดงเฉพาะ Claim ของกรมธรรม์ที่เลือก; ปุ่มแก้ไขถูกซ่อนใน flow read-only จากเมนูงานเคลม
- แสดงหัวข้อรายการและจำนวน Claim ของกรมธรรม์
- Back คืน Search Type, query, ปีการศึกษา (ถ้ามี), บุคคลและกรมธรรม์ที่เลือก
- ปุ่มดู Claim ใน History ผ่าน effective opener เดิมไป native read-only detail; ไม่ใช้ iframe

### 2.5 งานเคลม > ค้นหาเคลม > ดูรายละเอียด

- Page ID แบบ dynamic: `customerClaimReadOnlyPage`
- UI เป็น read-only ภายใน shell เดิม ประกอบด้วย context strip, ป้ายข้อมูลตัวอย่าง, blue claim hero, quick summary, section tabs, detail cards, financial cards, expense/documents/decision และ Claim Journey ตาม field ที่ renderer เดิมรองรับ
- แท็บ section ใช้ดีไซน์เดียวกับหน้าพิจารณาเคลม: พื้นขาวไล่สีบาง ๆ, เส้นแบ่งล่าง, active เป็นข้อความและเส้นใต้ `#0075bd`, hover สีฟ้าอ่อน, Mobile เลื่อนแนวนอน
- แท็บยังเป็น anchor navigation ไป section เดิม ไม่ใช่การซ่อน/แสดง tab panel
- PH ไม่แสดง school section; PA แสดง school information
- เอกสาร Mock ที่ไม่มีไฟล์ระบุสถานะชัดเจน; เอกสารตัวอย่างเปิด dialog preview แบบ read-only
- Back คืน Search หรือ Claim History ตามจุดที่เข้ามา พร้อม state เดิม

### 2.6 พิจารณาเคลม > เคลมลูกค้า — Step 1

เพิ่มคำถาม `เป็นอุบัติเหตุจากการจราจร`:

- ตัวเลือก `ใช่` / `ไม่ใช่`; ค่าเริ่มต้น `ไม่ใช่`
- `ไม่ใช่`: ซ่อนและล้างรายละเอียดอุบัติเหตุ ไม่ validate รายละเอียด
- `ใช่`: แสดงรายละเอียดให้เลือกและ validate ก่อนออกจาก Step 1
- รายละเอียดประกอบด้วยประเภทยานพาหนะ, ผู้ขับขี่/ผู้โดยสาร และเป็นส่วนเกิน พ.ร.บ.
- เลือกยานพาหนะ `อื่นๆ` ต้องระบุข้อความ; เลือกผู้ขับขี่แสดง reminder ตรวจแอลกอฮอล์; เลือกไม่ใช้ พ.ร.บ. ต้องระบุเหตุผล
- Validation แสดง field error, summary และ focus field แรกที่ยังไม่ครบ

### 2.7 พิจารณาเคลม > เคลมโรงพยาบาล — OPD Half/Full

- Step 1 แสดงข้อมูลอุบัติเหตุจากการจราจรแบบ read-only/disabled; อ่านค่าต้นทาง หรือ fallback เป็น มอเตอร์ไซค์ / ผู้ขับขี่ / ใช่
- Section ผลพิจารณาใช้หัวข้อ `แจ้งผลการพิจารณาโรงพยาบาล`
- เปลี่ยน wording `รอแก้ไข` เป็น `แจ้งแก้ไข` และไม่มีปุ่ม `ยกเลิก`
- ตารางตรวจสอบเอกสารไม่มีคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ` และไม่ถูก block ด้วย validation ของสองคอลัมน์นี้
- Step 2 เรียงปุ่มบันทึกผลพิจารณาก่อนปุ่มถัดไป โดยไม่เปลี่ยน handler

### 2.8 พิจารณาเคลม Customer/Hospital — Step 3

- Section `รายการค่ารักษา` เปลี่ยนหัวตารางจาก `สิทธิ์เบิก` เป็น `สิทธิ์เบิกตามความคุ้มครอง`
- ใช้ observer/patch เฉพาะหน้าเป้าหมายเพื่อรองรับ re-render; ไม่แก้สูตรคำนวณหรือสิทธิ์

### 2.9 วางบิลเคลม > เคลมโรงพยาบาล > ตรวจสอบรายการวางบิล

- Step 1 แสดงข้อมูลอุบัติเหตุจากการจราจรแบบ read-only/disabled เช่นเดียวกับ Hospital consideration
- Section ผลพิจารณาใช้หัวข้อ `แจ้งผลการพิจารณาโรงพยาบาล`, ใช้ `แจ้งแก้ไข`, ไม่มี `ยกเลิก` และไม่มี `บันทึกแบบร่าง`
- Section ตรวจสอบเอกสารไม่มีคอลัมน์ `ผลการตรวจ` และ `หมายเหตุ` ทั้ง renderer หลักและ fallback/shared renderer
- การตัดคอลัมน์นี้ไม่รวม field หมายเหตุที่อยู่ใน section อื่น

### 2.10 แจ้งเคลมทั่วไป — Payment confirmation

- เคลมทั่วไปที่ไม่ใช่เสียชีวิตและทุพพลภาพ/สูญเสียอวัยวะ เปิด Modal ยืนยันบัญชีโอนเงินก่อน
- ปุ่มยืนยันใช้ข้อความ `โอนเงิน`
- Progress แสดง 3 ขั้น: สร้าง CL → สร้าง CC → โอนเงิน
- Success แสดงเลขอ้างอิง CL, CC และ Transfer/CPG
- Death/Disability ยังคง flow `ส่งตรวจสอบ` เดิม

## 3. UI Component Inventory

| Component | Scope | Behavior สำคัญ |
| --- | --- | --- |
| Claim Monitor context filters | `#claimMonitorPage` | option ของ Treatment/Status เปลี่ยนตาม Category |
| Mock example chips | `#claimWorkSearchSurface` | 13 chips, กดแล้วเติมค่าและค้นหา, Desktop/Mobile horizontal scroll |
| Claim result Icon Button | `.cws-view-icon-btn` | ส่ง Claim No. เดิม, accessible label/tooltip, 36×36 |
| Claim History visual scope | `.claim-work-search-history` | ใช้เฉพาะเมื่อเข้าจากเมนูงานเคลม |
| Read-only detail tabs | `.ccro-nav`, `.ccro-nav-link` | visual เหมือน consideration; scroll-to-section; Mobile horizontal scroll |
| Traffic accident card | `.hospital-traffic-section` | Editable เฉพาะ Customer เมื่อ qualifier=ใช่; Hospital/Billing read-only |
| Step 3 wording patch | `menu-consider-step3-wording.js` | เปลี่ยนข้อความเท่านั้น |

## 4. Technical Handoff สำหรับ Dev

### 4.1 Source ownership

| Feature | Runtime source |
| --- | --- |
| Claim Monitor mock 76 | `js/mock-data/claim-monitor.mock.js` |
| Claim Monitor context filters | `js/claim-monitor-context-filters.js` |
| Monitor → Detail routing/back state | `js/claim-monitor-detail-routing.js` |
| Detail mock composition | `js/mock-data/claim-detail.mock.js` |
| Detail resolver/hydration | `js/claim-detail-mock-resolver.js` |
| Claim Search mock 13 | `js/mock-data/claim-search.mock.js` |
| Claim Search controller/UI | `js/menu-claim-work-search.js`, `css/menu-claim-work-search.css` |
| Native read-only Claim Detail | `js/menu-customer-claim-detail.js`, `css/customer-claim-detail.css` |
| Detail compatibility wrapper | `js/menu-claim-search-detail-blank.js` |
| Traffic accident UI/rules | `js/menu-hospital-claim-traffic-accident.js`, `css/menu-hospital-claim-traffic-accident.css` |
| Hospital decision/document reset | `js/menu-hospital-claim-step1-decision-doc-reset.js` |
| Billing hospital document table | `js/menu-billing-hospital-review.js` |
| Claim Payment confirmation | `js/menu-claim-entry-transfer-confirmation.js` |
| Step 3 wording | `js/menu-consider-step3-wording.js` |
| 37-page navigation map | `docs/page-map/INDEX.md`, `docs/page-map/pages.manifest.json` |

### 4.2 Patch/load order ที่ห้ามสลับ

1. Legacy core และ patch stack ใน `index.html`
2. `js/menu-hospital-claim-step1-decision-doc-reset.js`
3. `js/menu-hospital-claim-traffic-accident.js`
4. `js/menu-customer-claim-detail.js`
5. `js/menu-claim-search-detail-blank.js`
6. `js/mock-data/claim-search.mock.js`
7. `js/menu-claim-work-search.js`
8. `js/claim-monitor-context-filters.js`
9. `js/mock-data/claim-detail.mock.js`
10. `js/claim-detail-mock-resolver.js`
11. `js/claim-monitor-detail-routing.js`
12. `js/menu-consider-step3-wording.js`

หมายเหตุ: `claimMonitorRows` ถูกโหลดก่อน core renderer ที่ตำแหน่งเดิม ห้ามย้ายเพียงเพราะอยู่ในโฟลเดอร์ mock-data

### 4.3 Integration contracts

- `window.openClaimMonitorDetail(recordOrAppId)` ต้อง resolve จาก `claimMonitorRows` ด้วย `appId` และผ่าน captured effective customer/hospital opener
- ห้าม copy/push Claim Monitor record เข้า `considerationCustomerRows` หรือ `considerationHospitalRows`
- `window.ClaimDetailMockResolver.resolve(appId)` ต้องคืน detail และ renderer record ที่มี context ครบ
- `window.ClaimWorkSearch.openClaimDetail(claimNo)` เป็น handler ของ result action; `data-cws-view-claim` ต้องคงอยู่
- `showTopClaimSearchPage()` เป็น entry ของหน้าใหม่ ขณะที่ `showClaimRecordSearchPage()` ของเมนูแจ้งเคลมยังต้องเปิด legacy surface เดิม
- `customerClaimReadOnlyPage` ถูกสร้าง dynamic และห้ามใส่ iframe
- Inline handlers ยังพึ่ง globals จึงห้าม rename หรือย้ายเข้า private scopeโดยไม่มี compatibility layer

## 5. Acceptance Criteria สำหรับ BA/UAT

1. Claim Monitor แสดง/กรองได้ครบ 76 รายการและไม่มี invalid combination
2. Routing 76 records ได้ destination, appId, product, category, treatment และ status ตรง record
3. Back จาก Detail คืน Monitor state ครบทุก control/view/selection/scroll
4. Claim Search ใช้ Search Type ครบ 8 แบบและ flow ตรงตารางในข้อ 2.3
5. Policy counts ตรง 13 Claims (4/2/1/3/2/1)
6. Mock chips แสดงทั้ง Desktop และ Mobile; Mobile เลื่อนภายในแถว
7. ปุ่มดูรายละเอียดใน result เป็น Icon Button และ keyboard/screen reader เข้าใจว่าเปิด Claim ใด
8. Claim History แสดงเฉพาะกรมธรรม์ที่เลือกและ Back คืน state
9. Claim Detail ใช้ native shell, ไม่มี iframe, PH/PA แสดง field ถูกต้อง และแท็บเหมือน consideration
10. Desktop/Tablet/Mobile เลื่อนแนวตั้งได้, body ไม่ lock, table/tabs/chips เลื่อนแนวนอนภายใน และไม่มี page horizontal overflow ใหม่
11. Traffic accident Customer validate เฉพาะเมื่อเลือก `ใช่`; Hospital/Billing แก้ไขไม่ได้
12. Hospital document table และ decision buttons ตรงเงื่อนไขข้อ 2.7/2.9
13. Step 3 แสดง `สิทธิ์เบิกตามความคุ้มครอง` โดยไม่เปลี่ยน calculation
14. Claim Monitor ยังคง 76 records หลังใช้ Claim Search/Detail

## 6. Regression และหลักฐานทดสอบ

| Test | Coverage |
| --- | --- |
| `tests/parity/run-all.cjs` | Phase 0 static/runtime/responsive baseline |
| `tests/claim-monitor-context-filters.cjs` | Context filters และ 76-record access |
| `tests/claim-monitor-detail-routing.cjs` | Routing/context/back state ครบ 76 records และ responsive matrix |
| `tests/claim-detail-mock-mapping.cjs` | Detail resolve/mapping 76 records และ 14 primary contexts |
| `tests/claim-work-search.cjs` | 8 search types, 13 Claims, flows, icon action, Back, 7 viewports |
| `tests/customer-claim-detail.cjs` | Native detail, consideration-style tabs, PH/PA, Back, mobile overflow |
| `tests/hospital-claim-traffic-accident-static.cjs` | Traffic qualifier/default/validation/readonly scopes |
| `tests/billing-hospital-document-columns-static.cjs` | Billing document columns |
| `tests/consider-step3-wording.cjs` | Customer/Hospital Step 3 wording |
| `tests/page-map-integrity.cjs` | เอกสารครบ 37 destinations และ source references |

Responsive matrix ที่ใช้: 1920×1080, 1440×900, 1366×768, 768×1024, 430×932, 390×844, 375×812

ผล verification ล่าสุดของ Change “Detail tabs + Search Icon Button”:

- `tests/claim-work-search.cjs` — PASS: Search Type 8 แบบ, 13 Claims, result/policy/history/detail/back, Icon Button และ responsive 7 viewports
- `tests/customer-claim-detail.cjs` — PASS: consideration-style tabs, active state, PH/PA, Back, Mobile internal tab scroll และไม่มี overflow ใหม่
- `tests/consider-step3-wording.cjs` — PASS: Customer, Hospital OPD Half และ Hospital OPD Full
- `tests/page-map-integrity.cjs` — PASS: 37 destinations (35 static + 2 dynamic)
- Static hospital traffic/document tests — PASS
- Runtime พบเฉพาะ Known Baseline `expenseData is not defined`; new runtime errors = 0
- Strict project design audit ยังมี legacy findings เดิม 212 รายการ (210 violations + 2 unresolved) โดย Change รอบนี้ไม่เพิ่ม finding ใหม่; รายการส่วนใหญ่อยู่ใน `index.html` นอก scope

## 7. Known Baseline Issues / ข้อควรระวัง

- Runtime เดิมมี `expenseData is not defined`; ให้เทียบจำนวน error ก่อน/หลังและถือว่าเกิด regression เมื่อมี error ใหม่
- Phase 0 เคยบันทึก Claim Journey readability/overflow, Tablet hit-test และ Billing table warning บาง viewport ไว้แล้ว
- `index.html` มี legacy duplicate/override chains จำนวนมาก; ห้ามเลือก implementation จากชื่อ function อย่างเดียว
- Tailwind CDN มี production warning เดิม
- Prototype ยังไม่มี backend/API/database persistence contract; Mock Data ไม่ใช่ production schema โดยอัตโนมัติ
- ควรให้ BA ยืนยัน wording, status transition, permission และ empty/error/loading state ก่อน production implementation

## 8. สิ่งที่ BA/Dev ยังต้องตัดสินใจก่อน Production

- API contract และ record identifier สำหรับ Claim Search/Detail เทียบกับ `appId`/Claim No. ใน prototype
- Permission matrix ของผู้ดู, ผู้แก้ไข, ผู้พิจารณา และผู้วางบิล
- Status transition และ action availability ในแต่ละสถานะ
- วิธีเปิด/ดาวน์โหลดเอกสารจริง, security และ audit log
- Persistence ของ traffic accident fields และ mapping กับ backend
- Pagination/server-side search เมื่อข้อมูลเกิน mock dataset
- Loading, retry, API error, session expiry และ no-permission states
- Accessibility acceptance รวม keyboard flow, focus restoration และ screen-reader labels

## 9. เอกสารอ้างอิง

- `REFACTOR_BASELINE.md`
- `docs/page-map/INDEX.md`
- `docs/page-map/claims/claim-monitor.md`
- `docs/page-map/claims/claim-search.md`
- `docs/page-map/claims/customer-claim-readonly.md`
- `Change Request Handoff - Traffic Accident and Hospital Document Review.md`
- `Change Request Handoff - Claim Hospital Billing Ver2.md`
- `DESIGN.md`
