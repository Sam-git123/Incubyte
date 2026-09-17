# Proposed Architecture

> Status: Phase 0 proposal. No application workspace, framework, database schema, or runtime code has been initialized.

## Overview

The proposed system is a TypeScript modular monolith: a React single-page application communicates over REST/JSON with a Node.js Fastify API backed by SQLite through Prisma. This keeps deployment and local development simple for an assessment-scale workload while retaining clear feature boundaries.

```mermaid
flowchart LR
    HR[HR Manager] --> Web[React + Vite application]
    Web -->|REST / JSON under /api| API[Node.js + Fastify API]
    API --> Domain[Employee, Salary, and Analytics modules]
    Domain --> Prisma[Prisma data access]
    Prisma --> DB[(SQLite)]
```

The browser will request only the employee page or analytics result it needs. Filtering, sorting, pagination, and aggregation belong on the server and database path rather than in the browser.

## Proposed application structure

- `apps/web`: React, Vite, TypeScript, Material UI, TanStack Query, React Hook Form, and Zod. UI code will be organized primarily by employee, salary, and analytics features.
- `apps/api`: Fastify and TypeScript, organized into employee, salary, and analytics modules. Route handlers will translate HTTP concerns; business rules will live outside handlers.
- `packages/contracts`: shared Zod schemas and TypeScript request/response contracts where sharing reduces drift. It will not contain business logic.
- `prisma`: the eventual Prisma schema, migrations, and deterministic seed. Its exact contents will be designed and tested in later phases.

MUI DataGrid is the initial table choice because pagination, sorting, accessibility primitives, and Material UI integration match the directory needs. This remains a proposal until the employee-directory phase validates licensing and feature requirements.

## Domain and data model

The conceptual model has an `Employee` with many immutable `SalaryRecord` entries. A salary record contains an integer `amountMinor`, ISO-4217 `currency`, `effectiveFrom`, and creation metadata. A new salary creates a record rather than overwriting history. The exact rule for selecting the current record—including future effective dates and equal dates—must be specified through tests before implementation.

Analytics will group salary values by currency whenever aggregation could cross currencies. No base-currency conversion or external FX dependency is proposed.

## Request flow

1. React derives query parameters from the directory or dashboard state.
2. Fastify validates path, query, and body data against explicit schemas.
3. A feature service applies business rules and asks its data-access code for bounded queries or database aggregations.
4. Prisma executes parameterized SQLite queries.
5. The API returns typed success data or a predictable error envelope without stack traces.
6. TanStack Query caches server state and invalidates affected employee and analytics queries after mutations.

The likely initial API surface is `GET /api/employees`, `GET /api/employees/:employeeId`, `POST /api/employees/:employeeId/salaries`, and a small set of `/api/analytics` endpoints. Contracts will be refined incrementally rather than treated as implemented by this document.

## Quality and operational boundaries

- Business behaviour will follow red-green-refactor TDD, with Fastify integration tests, focused React tests, and a few critical Playwright flows.
- Employee queries will use bounded server-side pagination and allow-listed sort fields. Indexes will be selected from observed query patterns, not added speculatively.
- The API will validate independently of the UI, avoid sensitive-value logging, and expose consistent error codes.
- The modular boundaries leave a natural place to add authentication later, but production-grade identity, audit, encryption, and privacy controls are explicitly not implemented yet.

## Deployment direction

Development and assessment review initially target a single web application, API process, and SQLite database. Deployment has not been chosen. If the eventual host cannot provide durable SQLite storage, or real concurrency and operational requirements outgrow it, the Prisma-backed persistence layer can be migrated deliberately to PostgreSQL. That is a future decision based on evidence, not part of Phase 0.
