# Developer Flow

## Identity

- เมนู: Developer → Flow
- Page ID: `devFlowPage` — static section
- หน้าที่: โหลด ค้นหา เพิ่ม/แก้ และ preview flow definitions

## Navigation และ Flow

- Entry: `#menuDevFlow`; `resetFlowDisplay()` ทำงานเมื่อเปิด
- Editor/preview ใช้ modal/panel ภายในหน้า; รองรับ fullscreen preview
- Related: [Developer Master](master.md)

## Effective implementation

- `init()` bind add/reload/retry/search/grid/editor/fullscreen และ close controls
- `loadFlows`, `applySearch`, `openEditor`, `saveFlow` เป็น core functions ใน feature IIFE

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `id="devFlowPage"`, `function init(){const page=$('devFlowPage')`
- Stable anchors: `flowAddBtn`, `flowReloadBtn`, `flowEditorForm`, `flowPreviewPanel`
- CSS scope: `#devFlowPage`, `.flow-*`/developer flow selectors

## Constraints และ Regression

- รักษา retry/error/empty states และ fullscreen fallback; ทดสอบ CRUD mock flow และ menu switching

