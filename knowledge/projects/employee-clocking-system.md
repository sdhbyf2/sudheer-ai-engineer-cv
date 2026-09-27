---
type: project
id: employee-clocking-system
title: Employee Time & Attendance Clocking System
role: Full-Stack Developer
company: Brittania Consultancy Services
date: 2024 — 2025
stack: [PHP, MySQL, JavaScript, HTML5, CSS3, REST API, Session Auth, PDF Export]
tags: [Workforce Management, Time & Attendance, Employee Portal, Admin Dashboard, Clock-In/Out, Leave Management, Document Upload]
featured_on_website: false
url: /#experience
---

## Overview
A self-hosted, real-time employee time and attendance clocking system built for an operations and consultancy company. The system provides separate employee and admin portals with clock-in/out, break tracking, leave management, document uploads, holiday management, attendance reporting, and automated clock-out via cron scheduling.

## Problem & Challenge
Operations and consulting companies employing field and office staff need a reliable, self-hosted time tracking solution that works without dependency on third-party SaaS tools. Employees need simple clock-in/out flows; administrators need full attendance visibility, manual adjustments, leave approvals, and exportable records.

## Technical Architecture & Implementation
- **PHP REST API Layer**: Modular PHP API endpoints covering: `clock_in.php`, `clock_out.php`, `start_break.php`, `end_break.php`, `auto_clock_out.php` (cron-triggered), `get_attendance.php`, `get_notifications.php`, `download_attendance.php` (CSV/PDF export), `upload_document.php`, `delete_document.php`, `deactivate_employee.php`, `reactivate_employee.php`.
- **Employee Portal**: Authenticated employee dashboard (session auth) with clock-in/out interface, attendance history, leave request submission, document management, and notification feed.
- **Admin Portal**: Full administrator dashboard covering employee management (add/edit/deactivate), attendance records with manual adjustment support, leave approval queue, holiday configuration, document viewer, and exportable attendance reports.
- **Automated Clock-Out (Cron)**: Server-side cron job triggers `auto_clock_out.php` to automatically close open sessions beyond shift boundaries, preventing missed clock-outs from polluting records.
- **Document Management**: Secure document upload, storage, and deletion scoped per employee record.

## Engineering Outcomes
- Eliminated reliance on manual spreadsheets and third-party SaaS for employee time tracking.
- Administrators gained real-time attendance visibility with manual correction and exportable records.
- Deployed across Brittania's consultancy operations as a companion to the corporate onboarding portal.
