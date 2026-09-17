# Eligibility Detail

## Identity

- Breadcrumb: Eligibility Monitor → รายละเอียดผู้เอาประกัน
- Page ID: `detailPage` — static section
- หน้าที่: แสดงข้อมูลสิทธิ์/ความคุ้มครองก่อนเข้าสู่ขั้นแจ้งเคลม

## Navigation และ Flow

- Entry: opener จากรายการ Eligibility; context มาจาก selected eligibility row
- Exit: กลับ `monitorPage` หรือเริ่ม workflow แจ้งเคลม
- Related: [Eligibility Monitor](monitor.md), [Claim Entry](../claims/claim-entry.md)

## Effective implementation

- Renderer และ navigation ยังอยู่ใน `index.html`; ตรวจทุก declaration ที่เขียน `detailPage.classList`
- มี shared `hideClaimPages`, `showClaimPage` และ late navigation patches ครอบ behavior
- Inline handlers ภายใน section ต้องคงชื่อ global function เดิม

## Data และ Source ownership

- Minimum files to read: `index.html` และ Phase 0 `effective-functions.json`
- Stable anchors: `id="detailPage"`, `detailPage.classList`, `showDetail`
- CSS scope: `#detailPage` และ shared eligibility card/table styles ใน inline CSS

## Constraints และ Regression

- ห้าม derive selection จาก Claim Monitor; Eligibility ใช้ dataset/state คนละชุด
- ตัวเลือกเคลมต่อเนื่องต้องใช้ `caseNo` เป็น selection key และแสดงเลขที่ Case เท่านั้น; `claimNo` คงไว้เป็นข้อมูลภายในของรายการ
- ทดสอบ Back, selected insured, scroll และการเริ่ม Claim Entry
