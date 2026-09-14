# Agent Tracking Dashboard

## Identity

- หน้า: Dashboard ติดตาม Agent
- Page ID: `agentTrackingDashboardPage` — static section
- หน้าที่: KPI/finance/status/transfer และค้นหาแผนงานระดับ Agent

## Navigation และ Flow

- Entry ผ่าน feature opener ใน inline IIFE; ไม่พบ sidebar button โดยตรงใน markup หลัก
- Related: [Claim Tracking Dashboard](claim-tracking.md)

## Effective implementation

- Opener ซ่อน `main .page` และแสดง page นี้; filters/renderers ใช้ prefix `aad-`
- ตรวจ shared page hiding ก่อนเปลี่ยน visibility

## Data และ Source ownership

- Minimum files to read: `index.html` เฉพาะ `#agentTrackingDashboardPage`, `aad-` feature block
- Stable anchors: `id="agentTrackingDashboardPage"`, `agentTrackingDashboardPage.classList`
- CSS scope: `#agentTrackingDashboardPage`, `.aad-*`

## Constraints และ Regression

- รักษา KPI/filters และ branch combobox; ทดสอบ desktop/mobile overflow และ empty search

