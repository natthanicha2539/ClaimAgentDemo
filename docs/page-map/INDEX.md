# ClaimAgent Page Code Map

เอกสารชุดนี้เป็นจุดเริ่มต้นสำหรับการแก้เฉพาะหน้า ให้เปิดไฟล์ของหน้าปลายทางก่อน แล้วอ่านเฉพาะรายการในหัวข้อ **Minimum files to read** ไม่จำเป็นต้องอ่าน `index.html` ทั้งไฟล์

ข้อมูลอ้างอิงมาจาก Phase 0 baseline และ effective runtime ปัจจุบัน เอกสารนี้ไม่ได้เปลี่ยน UI, flow, business rule หรือ runtime

## วิธีใช้กับ Codex

ตัวอย่างคำสั่ง: “แก้หน้า `considerHospitalOpdHalfPage` โดยอ่าน `docs/page-map/consider/hospital-opd-half-detail.md` ก่อน และห้ามแตะ Related Pages”

ก่อนแก้หน้าใด ให้ตรวจ wrapper/patch-order constraints ในไฟล์ของหน้านั้นเสมอ เพราะหลาย global function ถูกประกาศหรือ wrap มากกว่าหนึ่งครั้ง

## Eligibility

- [Eligibility Monitor](eligibility/monitor.md) — `monitorPage`
- [Eligibility Detail](eligibility/detail.md) — `detailPage`

## แจ้งเคลม / งานเคลม

- [Claim Monitor](claims/claim-monitor.md) — `claimMonitorPage`
- [Claim Entry / Claim Journey](claims/claim-entry.md) — `claimEntryPage`
- [Document](claims/document.md) — `documentPage`
- [OCR](claims/ocr.md) — `ocrPage`
- [Payment](claims/payment.md) — `paymentPage`
- [ค้นหาเคลม](claims/claim-search.md) — `claimSearchPage`
- [รายละเอียดผู้เอาประกันจากการค้นหา](claims/claim-search-insured-detail.md) — `claimSearchInsuredDetailPage`
- [รายละเอียด PH จากค้นหาการแจ้งเคลม](claims/claim-record-ph-detail.md) — `claimRecordPhDetailPage`
- [Customer Claim Read-only](claims/customer-claim-readonly.md) — `customerClaimReadOnlyPage` (dynamic)
- [ติดตามการโอนเงิน](claims/transfer-tracking.md) — `transferTrackingPage`
- [รายละเอียดรายการโอน](claims/transfer-claim-detail.md) — `transferClaimDetailPage`
- [คำนวณวงเงินเคลม](claims/claim-calculation.md) — `claimCalcPage`

## จัดการเงินเคลม

- [โอนเพิ่ม](money/additional-transfer.md) — `additionalTransferPage`
- [รายละเอียดโอนเพิ่ม](money/additional-transfer-detail.md) — `additionalTransferDetailPage`
- [คืนเงิน](money/refund.md) — `refundPage`
- [รายละเอียดคืนเงิน](money/refund-detail.md) — `refundDetailPage`
- [อนุมัติคืนเงิน](money/approve-refund.md) — `approveRefundPage`
- [ขยายวงเงิน](money/extend-limit.md) — `extendLimitPage`
- [แก้ไขการโอนเงิน](money/edit-transfer.md) — `editTransferPage`
- [สอบถามธนาคาร](money/bank-inquiry.md) — `bankInquiryPage`
- [ตั้งค่าการโอนเงิน](money/transfer-settings.md) — `transferSettingsPage`

## จัดการข้อมูลแจ้งเคลม

- [แก้ไขเคลมผิดคน](data/correct-wrong-insured.md) — `correctWrongInsuredPage`
- [แก้ไขการแจ้งเคลม](data/edit-claim-notification.md) — `editClaimNotificationPage`

## จัดการเงินกองทุน

- [Dashboard สำรองเงิน](fund/reserve-dashboard.md) — `fundReserveDashboardPage`
- [โอนเงิน รพ.](fund/hospital-transfer.md) — `fundHospitalTransferPage`
- [ตั้งค่าการจ่ายเงิน รพ.](fund/hospital-payment-settings.md) — `fundHospitalPaymentSettingsPage`

## พิจารณาเคลม

- [รายการพิจารณา Customer/Hospital](consider/consider-list.md) — `considerPage`
- [เคลมโรงพยาบาล (โอนเพิ่ม)](consider/hospital-additional-transfer.md) — `considerHospitalAdditionalTransferPage`
- [รายละเอียดเคลมโรงพยาบาล (โอนเพิ่ม)](consider/hospital-additional-transfer-detail.md) — `considerHospitalAdditionalTransferDetailPage`
- [Customer Claim Detail](consider/customer-detail.md) — `considerCustomerDetailPage`
- [Hospital OPD Half Detail](consider/hospital-opd-half-detail.md) — `considerHospitalOpdHalfPage`
- [Hospital OPD Full/IPD/Day Case Detail](consider/hospital-opd-full-detail.md) — `considerHospitalOpdFullPage`
- [Death & Disability](consider/death-list.md) — `considerDeathPage`
- [Death & Disability Detail](consider/death-detail.md) — `considerDeathDetailPage`

## วางบิลเคลม

- [รายการวางบิล Customer/Hospital](billing/billing-list.md) — `billingClaimPage`
- [ตรวจสอบรายการวางบิลโรงพยาบาล](billing/hospital-review.md) — `billingHospitalReviewPage` (dynamic)

## Dashboard

- [Claim Tracking Dashboard](dashboard/claim-tracking.md) — `claimTrackingDashboardPage`
- [Agent Tracking Dashboard](dashboard/agent-tracking.md) — `agentTrackingDashboardPage`

## Developer

- [Master](dev/master.md) — `devMasterPage`
- [Flow](dev/flow.md) — `devFlowPage`

## ไม่ใช่ Page Destination

- `claimHistoryPrevPage`, `claimHistoryNextPage` เป็นปุ่ม pagination
- `considerRowsPerPage` เป็น `<select>`
- ปุ่ม “หน้าแรก” ปัจจุบันไม่มี ID และไม่มี destination binding ที่ยืนยันได้ จึงไม่สร้าง page document

## Integrity check

รัน `node tests/page-map-integrity.cjs` เพื่อตรวจจำนวนเอกสาร, page IDs, dynamic owners, source references และรายการ control ID ที่ต้องไม่ถูกนับเป็นหน้า
