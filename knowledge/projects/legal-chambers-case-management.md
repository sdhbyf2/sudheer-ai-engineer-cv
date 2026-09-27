---
type: project
id: legal-chambers-management
title: Legal Practice Case Management & Clocking System
role: Full-Stack Developer
company: UK Legal Practice Client
date: 2023 - 2024
stack: [React, Node.js, Express, FullCalendar, jsPDF, Luxon, Multer, DocuSign eSign]
tags: [LegalTech, Case Management, DocuSign, PDF Generation, Internal Tools]
featured_on_website: false
url: /#experience
---

## Overview
An internal case management and staff clocking application designed for a UK legal advocate practice and barrister chambers, handling time tracking, hearing schedules, and client case documentation.

## Problem & Challenge
Legal chambers require reliable, auditable tracking of barrister billable hours, court appearances, and confidential case documents without relying on cumbersome paper logs or generic spreadsheets.

## Technical Architecture & Implementation
- **Calendar & Shift Scheduling**: Integrated FullCalendar and Luxon for accurate handling of court sessions, advocate calendars, and automated late clock-in notifications via background cron jobs.
- **Automated Legal Document Export**: Leveraged jsPDF and jsPDF-autotable to generate formatted billing summaries, case dockets, and attendance records on demand.
- **Secure Document Ingestion**: Handled case file attachments and evidence uploads via Multer with validation and role-based access.

## Engineering Outcomes
- Reduced case administration time and eliminated clock-in tracking discrepancies for chambers staff.
- Streamlined monthly billing cycles through instant PDF export of advocate court and consultation hours.
