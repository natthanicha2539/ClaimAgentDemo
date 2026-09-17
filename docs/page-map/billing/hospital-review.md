# Hospital Billing Review

## Identity

- Breadcrumb: วางบิลเคลม → เคลมโรงพยาบาล → ตรวจสอบรายการวางบิล
- Page ID: `billingHospitalReviewPage` — dynamic section
- หน้าที่: ตรวจรายการวางบิล เอกสาร การตัดสินใจ และข้อมูลอุบัติเหตุจราจร

## Navigation และ Flow

- Entry: effective `window.openHospitalBillingReview`; Back คืน `billingClaimPage`
- Page ถูก mount โดย `ensureReviewPage()`/owner logic ใน external script
- Related: [Billing List](billing-list.md)

## Effective implementation

- Primary owner: `js/menu-billing-hospital-review.js`
- Patch order: billing owner → `menu-claim-entry-transfer-confirmation.js` → `menu-hospital-claim-step1-decision-doc-reset.js` → `menu-hospital-claim-traffic-accident.js`
- Traffic script wraps `openHospitalBillingReview`; ใช้ final runtime reference เท่านั้น

## Data และ Source ownership

- Globals/API: `openHospitalBillingReview`, `__getBillingHospitalReviewState`, current hospital row
- Minimum files to read: billing owner JS, decision/doc reset JS, traffic JS และ traffic CSS
- Stable anchors: `REVIEW_PAGE_ID = 'billingHospitalReviewPage'`, `openHospitalBillingReview`, `__getBillingHospitalReviewState`
- CSS scope: dynamic page ID, billing-specific styles และ external traffic CSS

## Constraints และ Regression

- ถ้า Billing Review เปิด shared continuous-claim selector ต้องเลือกและแสดงรายการด้วย `caseNo` เท่านั้น
- Step 3 ที่ reuse Hospital renderer แสดง `ยอดเงินรวมตามใบเสร็จ` จาก Step 2 และใช้ label `ค่าใช้จ่ายทั้งหมดสุทธิ` โดยไม่เปลี่ยนสูตรยอดวางบิลหรือยอดตั้งเบิก
- Step 3 ที่ reuse Hospital renderer ใช้ typography และสถานะปุ่มแก้ไข/บันทึกของ `สรุปค่าชดเชย` ชุดเดียวกับ Hospital Consider
- ห้ามสลับ patch order; ห้ามคืนคอลัมน์ review ที่ authoritative trim ลบออก
- Tests: billing document-columns static, hospital traffic static, targeted browser smoke
