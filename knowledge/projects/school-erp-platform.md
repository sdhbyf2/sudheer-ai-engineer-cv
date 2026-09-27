---
type: project
id: school-erp-platform
title: Multi-Tenant School Management ERP (Lekhavali)
role: Full-Stack Lead Engineer
company: Independent ERP Product
date: 2024 — PRESENT (Work in Progress)
stack: [FastAPI, Python 3.13, PostgreSQL, SQLAlchemy, Alembic, Celery, Redis, React 18, Vite, TypeScript, React Native, Expo, Playwright, Vitest, Docker, OCI]
tags: [EdTech, School ERP, Multi-Tenant, RAG, AI Assistant, Agentic Workflows, Role-Based Access, Mobile App, Production Deployment]
featured_on_website: true
url: /#project-rag
---

## Overview
A comprehensive, enterprise-grade, multi-tenant School ERP platform connecting admissions, academics, attendance, timetable scheduling, fee management, staff records, parent communication, and AI-assisted workflows across K-12 schools, trusts, and educational groups. The platform serves multiple configurable user roles (School Admin, Subject Teacher, Staff, Finance, Student, Parent, Driver/Transport, Group Admin, Alumni) each with a purpose-built portal and strict RBAC.

## Problem & Challenge
Managing a school at scale requires dozens of fragmented systems: attendance books, physical fee receipts, paper timetables, manual grade entry, and separate parent communications. Integrating these into a single authoritative source with role-appropriate views is the core challenge, complicated by multi-school group tenancy, compliance requirements, and the need for AI assistance at the point of action.

## Technical Architecture & Implementation
- **Backend API (FastAPI + Python 3.13)**: Core REST API built with FastAPI and SQLAlchemy ORM on PostgreSQL. Alembic handles schema migrations. Business logic enforces multi-tenant isolation at every query level.
- **Asynchronous Worker Engine (Celery + Redis)**: Background task engine handles asynchronous job queues across dedicated channels: AI chat, attendance, timetable generation, notifications, finance, reports, and personalization. Redis provides both the task broker and caching layer.
- **AI Service (RAG + pgvector + LLM Routing)**: A standalone AI microservice provides contextual guidance inside the ERP using Retrieval-Augmented Generation (RAG) with pgvector HNSW indexes. LLM routing connects hosted providers with automatic local-model failover.
- **Frontend Web Portal (React 18, Vite, TypeScript)**: Multi-portal React application with strict TypeScript, React Hook Form + Zod validation, TanStack React Query data fetching, Recharts dashboards, Framer Motion transitions, and QR code attendance flows (html5-qrcode).
- **Cross-Platform Mobile App (React Native, Expo, TypeScript)**: Companion mobile app for students and parents providing access to timetables, attendance, fee statements, and AI chat on Android and iOS.
- **Security & Quality Engineering**: ISO 27001-aligned security audit conducted (120+ vulnerabilities identified and remediated). Playwright end-to-end tests, Vitest unit tests, and race condition mitigations implemented. Deployed on OCI (Oracle Cloud Infrastructure) via Docker containerization.

## Engineering Outcomes
- Multi-role, multi-school ERP platform actively in development serving the full academic lifecycle.
- AI-assisted guidance embedded into contextually relevant ERP workflows via RAG.
- Robust security posture with documented audit trail and phased remediation.
- Live platform available at lekhavali.com.
