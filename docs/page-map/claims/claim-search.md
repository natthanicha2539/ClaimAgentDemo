# งานเคลม — ค้นหาเคลม

## Identity

- เมนู: งานเคลม → ค้นหาเคลม
- Page ID: `claimSearchPage` — static section
- หน้าที่: ค้นหารายการเคลมระดับงานเคลม

## Navigation และ Flow

- Entry: `showTopClaimSearchPage()` จาก `#submenuClaimWorkSearch`
- `js/menu-claim-work-search.js` wrap entry นี้และแสดง `#claimWorkSearchSurface` เฉพาะเมื่อ `claimRecordSearchSource === "topMenu"`
- เลขที่ CL / Case → ตารางระดับ Claim → ปุ่มดูรายละเอียดแบบ Icon Button (`visibility`) พร้อม accessible name และ tooltip
- เลขบัตรประชาชน / Passport-GCode → ผู้เอาประกันและกรมธรรม์ → เลือกกรมธรรม์ → Claim History
- AppID / เลขบัตรประกันนักเรียน → resolve กรมธรรม์ที่ตรงกันและเลือกอัตโนมัติ → Claim History
- ชื่อ-สกุลซ้ำ → แสดงผู้เอาประกันแต่ละคนพร้อมตารางกรมธรรม์รูปแบบเดียวกับผลเลขบัตรประชาชน แล้วเลือกกรมธรรม์ของบุคคลที่ต้องการ
- ชื่อสถานศึกษา → ใช้ปีการศึกษาประกอบก่อนเลือกกรมธรรม์
- Back จาก `claimSearchInsuredDetailPage` กลับ surface นี้พร้อมประเภทค้นหา คำค้น และกรมธรรม์ที่เลือกเดิม
- Detail route แสดง native read-only detail ตามข้อมูล Claim ที่กด โดยไม่ใช้ iframe
- ใต้ฟอร์มค้นหามี `Mock ทดลอง` 13 chips จาก `claimWorkSearchMock.quickExamples`: ครบ 8 Search Types และเพิ่มตัวอย่าง Claim อนุมัติ/รอเอกสาร/ปฏิเสธ, ผู้เอาประกันหนึ่งคนหลายกรมธรรม์ และสถานศึกษาอีกแห่ง; แต่ละ chip เลือก Search Type, เติมคำค้น (รวมปีการศึกษาสำหรับสถานศึกษา) และค้นหาทันที
- Header เงื่อนไขการค้นหาไม่มี subtitle/flow badge; หลักการแสดงผลย่อเป็น icon `#cwsPrincipleTipButton` และแสดง wording เดิมผ่าน accessible tooltip `#cwsPrincipleTooltip` เมื่อ hover หรือ keyboard focus
- ผลค้นหาระดับ Claim แสดงเฉพาะจำนวนรายการ โดยไม่แสดง `รายการ Claim ที่ตรงกับคำค้นหา` และ `ระดับ Claim`
- แสดง `#cwsMockOnlyNote` ใต้หลักการแสดงผลและชุด Mock chips เพื่อระบุว่าตัวเลือกส่วนนี้ใช้สำหรับ Mock ทดสอบเท่านั้นและไม่มีผลต่อการแสดงผลข้อมูล; Note เป็นข้อมูลแบบ read-only และไม่เปลี่ยน behavior ของการค้นหาหรือ quick examples
- Mobile ยังคงแสดง Mock chips โดยเลื่อนแนวนอนภายใน `.cws-demo-set` และไม่ทำให้ทั้งหน้าเกิด horizontal overflow
- Related: [Customer Claim Read-only](customer-claim-readonly.md)

## Effective implementation

- Navigation wrapper: `showTopClaimSearchPage`, `showClaimRecordSearchPage`, `backToClaimRecordSearch` ใน `js/menu-claim-work-search.js`
- Search renderer/controller: `ClaimWorkSearch`, `runSearch`, `renderClaims`, `renderPeopleChooser`, `renderPolicyResults`, `renderSchoolResults`
- Claim History renderer ที่ reuse: `renderClaimSearchInsuredDetail` ใน `index.html`
- Detail renderer: `js/menu-customer-claim-detail.js`; compatibility wrapper `js/menu-claim-search-detail-blank.js` โหลดภายหลังแต่ส่งต่อ opener เดิม
- Direct Claim result ต้องกำหนด `claimSearchInsuredCurrentRow` และ `claimSearchInsuredCurrentHistoryRows` จาก record ที่กดก่อนผ่าน effective opener

## Data และ Source ownership

- Minimum files to read: `docs/page-map/claims/claim-search.md`, `js/menu-claim-work-search.js`, `js/mock-data/claim-search.mock.js`, `css/menu-claim-work-search.css`, `js/menu-claim-search-detail-blank.js`; เปิด `index.html` เฉพาะ anchors `claimSearchPage`, `renderClaimSearchInsuredDetail`, `backToClaimRecordSearch` เมื่อต้องแก้ History/Back
- Stable anchors: `id="claimSearchPage"`, `id="claimWorkSearchSurface"`, `showTopClaimSearchPage`, `window.ClaimWorkSearch`, `PAGE_ID = "customerClaimReadOnlyPage"`
- Mock Data: `window.claimWorkSearchMock` แยกจาก `claimMonitorRows`; ปัจจุบันมี 3 บุคคล, 6 กรมธรรม์, 13 Claims และ 13 quick examples โดยจำนวนจริงรายกรมธรรม์ตรงกับ `policy.claims` ทุกใบ (4/2/1/3/2/1)
- CSS scope: `#claimSearchPage.claim-work-search-active`, `#claimWorkSearchSurface`, `.cws-*`
- Claim History ที่เปิดจากเมนูนี้เพิ่ม class `.claim-work-search-history` เพื่อใช้ visual scope ตาม Reference โดยไม่เปลี่ยน History ที่เปิดจาก Feature อื่น
- Search form events bind ใน `bindStaticEvents()`; ปุ่ม Claim/บุคคลแบบ dynamic เรียก `ClaimWorkSearch.openClaimDetail` และ `ClaimWorkSearch.selectPerson` ผ่าน inline handler ส่วน policy controls bind หลัง renderer
- Action ดูรายละเอียดใช้ `.cws-view-btn.cws-view-icon-btn`; ห้ามถอด `data-cws-view-claim`, `aria-label`, `title` หรือเปลี่ยน handler ที่ส่ง Claim No. เป็น record key

## Constraints และ Regression

- Tests: `tests/claim-work-search.cjs`, `tests/claim-search-detail-blank-static.cjs`; Phase 0 Claim Search responsive
- Patch order: `js/menu-claim-search-detail-blank.js` → `js/mock-data/claim-search.mock.js` → `js/menu-claim-work-search.js`; ห้ามเรียก detail renderer ข้าม effective opener
- หน้า `claimSearchPage` ใช้ร่วมกับเมนู “แจ้งเคลม → ค้นหาการแจ้งเคลม”; wrapper ต้อง `deactivate()` surface ใหม่ก่อนส่งต่อ original opener
- Detail ใช้ native project shell และ local React/MUI vendor; ห้ามนำ iframe/Base64 template จาก Reference เข้ามา
