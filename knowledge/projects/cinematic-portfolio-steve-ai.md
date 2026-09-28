---
type: project
id: cinematic-portfolio-steve-ai
title: Cinematic Portfolio & Steve Autonomous Recruiter AI
role: Creator & Full-Stack / Applied AI Architect
company: Personal Engineering Portfolio & Production AI Assistant
date: 2024 — PRESENT
stack: [React 19, Vite, Three.js, WebGL, Node.js, Vercel Serverless, Upstash Redis, Upstash QStash, Ultravox API, WebRTC, Google Gemini 2.5 Flash, OpenAI GPT-4o, Google Calendar API, Playwright, Vitest]
tags: [Real-time Voice AI, WebRTC, Watchdog Architecture, QStash, Distributed Redis, RAG, Job Description Matcher, Google Calendar Integration, SSRF Hardening, Anti-Hallucination Guardrails, Three.js Cinematic 3D]
featured_on_website: true
url: /#story
---

## Overview
A high-performance cinematic personal portfolio and autonomous AI recruiter assistant ("Steve") engineered to evaluate job descriptions in real-time, converse over low-latency WebRTC voice, qualify recruiter inquiries, and schedule discovery calls directly into Google Calendar with automated London DST timezone conversion and distributed race-condition prevention.

## Problem & Challenge
Standard developer portfolios are static and fail to engage senior tech recruiters or hiring managers. Building a production-grade AI agent to represent a candidate requires solving complex distributed systems problems: preventing runaway AI voice costs when users close their browser tabs unexpectedly, strictly preventing LLM hallucinations (such as fabricated employers or credentials), safeguarding serverless webhooks against replay and SSRF attacks, and synchronizing calendar availability without double-booking.

## Technical Architecture & Implementation
- **Real-Time WebRTC Voice Engine with Ultravox & Dual LLM Routing**: Ultra-low-latency bidirectional voice streaming via WebRTC with Ultravox AI. Features automatic provider fallback between Google Gemini 2.5 Flash and OpenAI GPT-4o, voice hallucination filters for foreign scripts/background noise, and client-side speech state indicators.
- **Durable Watchdog & Dead-Man's Switch via Upstash QStash**: Implements a signed HMAC-SHA256 browser heartbeat. A serverless watchdog schedule is managed via Upstash QStash to trigger an asynchronous termination check within 30 seconds if the browser closes without a clean disconnect, preventing runaway billing on active WebRTC voice channels.
- **Fail-Closed Distributed Rate Limiting & Atomic Idempotency**: Atomic Upstash Redis Lua scripts enforce distributed rate limits across session cookies, IP addresses, and actions. Recruiter lead captures use SHA-256 payload hashes and atomic pending/completed locks to prevent duplicate submissions or race conditions.
- **Deterministic Job Description Evaluation & Strict Grounding Guardrails**: A two-stage role alignment engine that extracts technical requirements from posted URLs or pasted text, parses them against reviewed portfolio facts, enforces server-side claim verification, strips ungrounded duration/certification claims, and delivers structured match verdicts (Strong Match, Good Match, Partial Match, Not a Fit) with zero hallucinations.
- **DST-Aware Google Calendar Integration**: Connects to Google Calendar via OAuth2 to calculate true real-time availability in the Europe/London timezone across British Summer Time (BST) / GMT transitions, enforcing strict booking horizons, lead times, and single-event mutual exclusion locks.
- **Multi-Stage SSRF Defense Engine**: Protects serverless fetching of external job postings with private/loopback IP resolution checks (blocking 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, AWS metadata 169.254.169.254, IPv6 loopbacks), DNS race timeout wrappers, strict content-type validation, and 512 KB streaming body caps.
- **Cinematic WebGL / Three.js Frontend**: Smooth 60fps WebGL particle backgrounds, Lenis smooth scrolling, accessible modal dialogs with focus trapping, and responsive mobile-first UI with 0 WCAG axe violations.

## Engineering Outcomes
- Fully autonomous AI colleague deployed to Vercel production with 99.9% uptime.
- 0 hallucinated claims verified through 69 automated unit tests and multi-browser Playwright suites.
- Sub-500ms voice session initiation and bulletproof cost control via QStash dead-man's switch.
- Direct lead capture pipeline syncing qualified inquiries and meeting bookings.
