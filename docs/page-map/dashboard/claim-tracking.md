# Claim Tracking Dashboard

## Identity

- หน้า: Dashboard ติดตามเคลม
- Page ID: `claimTrackingDashboardPage` — static section
- หน้าที่: KPI, status summary, transfer overview และตารางติดตามเคลม

## Navigation และ Flow

- Entry ผ่าน dashboard opener ใน inline feature block; ไม่พบ sidebar button โดยตรงใน markup หลัก
- Exit ผ่าน shared page navigation
- Related: [Agent Tracking Dashboard](agent-tracking.md)

## Effective implementation

- Renderer/filter อยู่ใน IIFE ใกล้ `claimTrackingDashboardPage`; opener ซ่อน `main .page` แล้วแสดง page นี้
- ตรวจ late page hiders เพราะ dashboard ถูกเพิ่มหลัง core navigation

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ anchors `#claimTrackingDashboardPage`, `cad-`
- Stable anchors: `id="claimTrackingDashboardPage"`, `claimTrackingDashboardPage.classList`
- CSS scope: `#claimTrackingDashboardPage`, `.cad-*`

## Constraints และ Regression

- รักษา dashboard filters/KPI consistency; ทดสอบ table overflow และ mobile stacked layout

