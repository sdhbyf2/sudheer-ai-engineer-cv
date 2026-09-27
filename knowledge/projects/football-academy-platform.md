---
type: project
id: football-academy-platform
title: Sports Football Academy Website & CMS
role: Full-Stack Web Developer
company: Private Football Academy Client (Pattaya, Thailand)
date: 2024 — 2025
stack: [PHP, HTML5, CSS3, JavaScript, MySQL, REST API, CMS, Video Streaming]
tags: [Sports, Football Academy, CMS, Player Applications, Youth Football, Responsive Web, School Portal]
featured_on_website: false
url: /#experience
---

## Overview
A full feature website and content management system for a professional youth football development academy offering U11–U19 football programmes in Thailand. The platform covers the academy's brand story, football development curriculum, player care, coaching philosophy, tour programmes, fees, application portal, and blog/media gallery — all managed through a bespoke CMS.

## Problem & Challenge
A specialist football academy needs a premium digital presence to attract international youth footballers, communicate training philosophy, accept player applications online, and maintain fresh content (articles, galleries, tours) without developer intervention. The CMS needed to give non-technical staff full content control across 15+ pages.

## Technical Architecture & Implementation
- **Multi-Page PHP Frontend**: Cinematic, video-led homepage with WASM-powered film sections (`data-scene`, `data-film` video lazy loading), plus dedicated pages for football development, player care, academics, albums, UK tour programme, fees/admissions, application portal, blog/articles, gallery, and contact.
- **Custom CMS (Admin Panel)**: Self-contained admin portal (login, sessions, WYSIWYG editor via `editor.php`, paginated article management, live preview) allowing staff to publish blog posts, news articles, and manage media without touching code.
- **Player Application API**: REST endpoints (`submit-application.php`) handling youth player registration forms with server-side validation and email dispatch (PHP Mailer).
- **Contact & Persistence APIs**: Contact form submission (`submit-contact.php`) and session persistence (`persistence.php`) for multi-step form state.
- **Gallery & Media Management**: Albums page with dynamic gallery data from the CMS, video poster image lazy-loading with WebP assets.

## Engineering Outcomes
- Delivered a premium, cinematic sports web presence competitive with major international academy brands.
- Non-technical staff can independently publish articles, update content, and preview posts via the custom CMS.
- Player applications submitted directly through the platform with automated email workflows.
