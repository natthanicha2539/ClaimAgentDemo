# Eligibility Monitor

## Identity

- เมนู: ตรวจสอบสิทธิ์ก่อนแจ้งเคลม (legacy Eligibility)
- Page ID: `monitorPage` — static section
- หน้าที่: ค้นหาผู้เอาประกัน แสดง card/table และเลือกข้อมูลเพื่อเปิดรายละเอียด

## Navigation และ Flow

- Entry: `showMonitorPage()`; legacy binding อ้าง `#menuEligibility` แต่ element นี้ไม่มีใน sidebar markup ปัจจุบัน
- Exit: เลือกรายการไป `detailPage`; เมนูอื่นซ่อนหน้าผ่าน shared page hiders
- Related: [Eligibility Detail](detail.md), [Claim Monitor](../claims/claim-monitor.md)

## Effective implementation

- อ่าน `showMonitorPage`, `setMonitorView`, `renderMonitorCards`, `renderMonitorTable` และ wrapper `originalShowMonitorPage`
- Event สำคัญ: `#searchForm`, `#clearSearchButton`, `#cardViewButton`, `#tableViewButton`
- มี shared navigation/patch หลายชุดที่ซ่อน `.page`; ห้ามตัดสิน effective implementation จาก declaration แรก

## Data และ Source ownership

- Globals: monitor view/filter state และ eligibility mock rows ภายใน `index.html`
- Minimum files to read: `index.html`, `tests/parity/baseline/effective-functions.json`, `tests/parity/baseline/event-bindings.json`
- Stable anchors: `id="monitorPage"`, `function showMonitorPage`, `const originalShowMonitorPage`
- CSS scope: `#monitorPage`, `.monitor-table-theme`; ยังเป็น inline CSS

## Constraints และ Regression

- อย่าสับสนกับ `claimMonitorPage`; ห้ามเปลี่ยน shared body scroll/navigation โดยไม่ทดสอบทั้งสองหน้า
- Tests: Phase 0 route `monitorPage` ยังไม่อยู่ใน critical seven จึงต้องทำ targeted smoke test เพิ่มเมื่อแก้

