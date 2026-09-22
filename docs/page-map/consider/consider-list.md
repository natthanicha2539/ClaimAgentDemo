# Consideration List — Customer/Hospital

## Identity

- เมนู: พิจารณาเคลม → เคลมลูกค้า / เคลมโรงพยาบาล
- Page ID: `considerPage` — static section ใช้ร่วมกันสอง context
- หน้าที่: filter/search/pagination และเปิดรายละเอียดรายการพิจารณา

## Navigation และ Flow

- Entry: `showConsiderationPage("customer")` หรือ `showConsiderationPage("hospital")`
- Detail: `openConsiderCustomerRow(...)` หรือ `openConsiderHospitalRow(...)`
- Related: [Customer Detail](customer-detail.md), [Hospital Half](hospital-opd-half-detail.md), [Hospital Full](hospital-opd-full-detail.md)

## Effective implementation

- ตรวจ final declarations ของ `showConsiderationPage`, `renderConsiderationTable`, openers และ wrapper chains
- Numeric index opener เป็น legacy contract; Phase 2 เพิ่ม object support แต่ห้ามทำให้ numeric path เปลี่ยน
- `considerRowsPerPage` เป็น select control ไม่ใช่ page

## Data และ Source ownership

- Globals: `considerationCustomerRows`, `considerationHospitalRows`, filters, selected index/current row
- Minimum files to read: `index.html`; อ่าน `js/claim-monitor-detail-routing.js` เมื่อแก้ shared opener contract
- Stable anchors: `id="considerPage"`, `function showConsiderationPage`, `openConsiderCustomerRow`, `openConsiderHospitalRow`
- CSS scope: legacy `#considerPage` inline CSS plus hospital-only `#considerPage[data-consider-tab="hospital"]` in `css/menu-consider-hospital-notice.css`
- Hospital child states: compact overview, Hospital Notice Dashboard, Hospital Notice Monitor, and modal Notice Detail; these remain inside the existing `considerPage` destination and do not add Sidebar routes.
- Hospital Notice behavior and session-only mock data: `js/menu-consider-hospital-notice.js`, `js/mock-data/consider-hospital-notice.mock.js`. Notice Status is independent from Claim Status.

## Constraints และ Regression

- ห้าม push Claim Monitor record เข้า consideration datasets
- ทดสอบ customer/hospital list, numeric openers, pagination และ Phase 2 routing regression
