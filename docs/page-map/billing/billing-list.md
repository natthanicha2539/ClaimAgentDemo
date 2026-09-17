# Billing Claim List — Customer/Hospital

## Identity

- เมนู: วางบิลเคลม → ตั้งเบิกกองทุน / ตรวจสอบรพ.วางบิล
- Page ID: `billingClaimPage` — static section ใช้ร่วมกันสอง context
- Page Title/Breadcrumb: `ตั้งเบิกกองทุน` / `วางบิลเคลม - ตั้งเบิกกองทุน` สำหรับ customer context และ `ตรวจสอบรพ.วางบิล` / `วางบิลเคลม - ตรวจสอบรพ.วางบิล` สำหรับ hospital context
- หน้าที่: filter/search/table รายการวางบิล
- หน้า `ตั้งเบิกกองทุน` บังคับเลือก `ประเภทการเคลม` แบบ Button Filter ก่อนแสดงผล: `เคลมลูกค้า` หรือ `เคลมโรงพยาบาล`
- ทั้งสองประเภทใช้ Search layout เดียวกัน: Row 1 ประเภทการเคลม/ผลิตภัณฑ์, Row 2 สาขา/ผู้ทำรายการ, Row 3 ค้นหาจาก/คำค้นหา/ปุ่มค้นหา
- `ค้นหาจาก` เป็น Button Filter: เลขที่ CL, เลขที่ Case, ชื่อสถานพยาบาล, ชื่อผู้เอาประกัน
- ผลลัพธ์เรียงตามวันที่อนุมัติจากวันก่อนหน้าไปวันล่าสุด
- Customer columns: `วันที่แจ้งเคลม`, `วันที่อนุมัติเคลม`, `เลขที่ Case`, `ผู้อนุมัติ`, `จำนวนเงินตั้งเบิก`, `ชื่อบริษัทประกัน`, `ดำเนินการ`; checkbox เลือกตั้งเบิกอยู่ในคอลัมน์ดำเนินการเพื่อคง workflow เดิม
- Hospital fund columns: `วันที่อนุมัติเคลม`, `เลขที่ Case`, `ชื่อสถานพยาบาล`, `ผู้อนุมัติ`, `จำนวนเงินตั้งเบิก`, `ชื่อบริษัทประกัน`, `ดำเนินการ`
- ชื่อบริษัทประกันในตารางแสดงชื่อย่อจาก Mock Data เช่น `Ergo`, `Pacific`, `BUI`, `Chubb`

## Navigation และ Flow

- Entry: `showBillingClaimPage("customer")` หรือ `showBillingClaimPage("hospital")`
- Hospital row สามารถเปิด dynamic `billingHospitalReviewPage`
- Related: [Hospital Billing Review](hospital-review.md)

## Effective implementation

- List owner อยู่ใน `index.html`; Hospital review opener ถูกแยกใน external script
- `menu-billing-hospital-review.js` มี navigation repair/wrappers ที่แตะ Billing และเมนูข้างเคียง

## Data และ Source ownership

- Globals: billing context/filter/current row, `currentFundBillingClaimType` และ `hospitalBillingRows`
- Minimum files to read: `index.html` สำหรับ list; `js/menu-billing-hospital-review.js` เมื่อแก้ Hospital row/open behavior
- Stable anchors: `id="billingClaimPage"`, `function showBillingClaimPage`, `hospitalBillingRows`
- CSS scope: `#billingClaimPage`; inline CSS
- Claim type, Product และ Search by ใช้ semantic button group พร้อม `aria-pressed`; สาขาและผู้ทำรายการคง native select ตาม canonical form pattern เดิม

## Constraints และ Regression

- Tests: `tests/billing-hospital-document-columns-static.cjs`, Phase 0 Billing responsive
- Known baseline: Billing tablet มี table-without-internal-scroll 1 scenario
