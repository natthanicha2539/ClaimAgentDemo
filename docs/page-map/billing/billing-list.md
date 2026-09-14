# Billing Claim List — Customer/Hospital

## Identity

- เมนู: วางบิลเคลม → เคลมลูกค้า / เคลมโรงพยาบาล
- Page ID: `billingClaimPage` — static section ใช้ร่วมกันสอง context
- หน้าที่: filter/search/table รายการวางบิล

## Navigation และ Flow

- Entry: `showBillingClaimPage("customer")` หรือ `showBillingClaimPage("hospital")`
- Hospital row สามารถเปิด dynamic `billingHospitalReviewPage`
- Related: [Hospital Billing Review](hospital-review.md)

## Effective implementation

- List owner อยู่ใน `index.html`; Hospital review opener ถูกแยกใน external script
- `menu-billing-hospital-review.js` มี navigation repair/wrappers ที่แตะ Billing และเมนูข้างเคียง

## Data และ Source ownership

- Globals: billing context/filter/current row และ `hospitalBillingRows`
- Minimum files to read: `index.html` สำหรับ list; `js/menu-billing-hospital-review.js` เมื่อแก้ Hospital row/open behavior
- Stable anchors: `id="billingClaimPage"`, `function showBillingClaimPage`, `hospitalBillingRows`
- CSS scope: `#billingClaimPage`; inline CSS

## Constraints และ Regression

- Tests: `tests/billing-hospital-document-columns-static.cjs`, Phase 0 Billing responsive
- Known baseline: Billing tablet มี table-without-internal-scroll 1 scenario

