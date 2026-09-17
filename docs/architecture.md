# Proposed Architecture

> Status: Phase 5 employee querying implemented. `GET /api/employees` now supports validated search, country and department filters, allow-listed sorting, and filter-aware pagination; product UI and deterministic bulk seed data remain future work.

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
- `apps/api`: Fastify and TypeScript, with the salary domain kept separate from the Prisma client boundary. The employee route validates HTTP input, the service coordinates listing and response mapping, and the repository owns bounded database queries.
- `packages/contracts`: shared Zod schemas and TypeScript request/response contracts for employee-list transport data. It does not contain business logic.
- `apps/api/prisma`: the SQLite schema and versioned migrations. Generated Prisma Client code is reproducible through `pnpm db:generate` and excluded from version control. Deterministic bulk seeding remains a later phase.

MUI DataGrid is the initial table choice because pagination, sorting, accessibility primitives, and Material UI integration match the directory needs. This remains a proposal until the employee-directory phase validates licensing and feature requirements.

## Domain and data model

The implemented persistence model has an `Employee` with many append-style `SalaryRecord` entries. Employee codes and emails are unique; country, department, and job title remain required string attributes. A salary record contains an integer `amountMinor`, `currency`, `effectiveFrom`, and creation metadata. Required foreign keys and cascading employee deletion prevent orphan salary rows.

Future-dated salary records are intentionally allowed. The employee listing derives current salary as the record with the latest `effectiveFrom` at or before one request-scoped `asOf` time. A future-only or absent salary produces `currentSalary: null`; equal effective dates use creation time and record ID as deterministic tie-breakers.

Salary amount and supported-currency validation remain in the plain TypeScript domain. SQLite complements those rules with integer storage, required fields, uniqueness, and referential integrity; it does not duplicate the supported-currency list.

Analytics will group salary values by currency whenever aggregation could cross currencies. No base-currency conversion or external FX dependency is proposed.

## Request flow

1. React derives query parameters from the directory or dashboard state.
2. Fastify validates path, query, and body data against explicit schemas. The employee list accepts bounded pagination plus `search`, `country`, `department`, `sortBy`, and `sortOrder`; arbitrary parameters and sort fields are rejected.
3. A feature service applies business rules and asks its data-access code for bounded queries or database aggregations.
4. Prisma applies the same database `where` conditions to the filtered count and page queries, then orders before applying offset pagination. Search trims input and ANDs whitespace-delimited terms; each term may match first name, last name, or employee code through SQLite's case-insensitive ASCII `LIKE` behavior. Country codes are uppercased and matched exactly, while trimmed departments retain exact casing.
5. The page query includes at most one currently effective salary per employee, avoiding per-employee salary queries and unnecessary history in the response.
6. The API returns typed success data or a predictable error envelope without stack traces.
7. TanStack Query caches server state and invalidates affected employee and analytics queries after mutations.

The implemented API surface is currently `GET /api/employees` plus the bootstrap health route. Employee detail, salary mutation, and analytics endpoints remain proposed and will be refined incrementally.

## Quality and operational boundaries

- Business behaviour will follow red-green-refactor TDD, with Fastify integration tests, focused React tests, and a few critical Playwright flows.
- Employee listing uses bounded server-side offset pagination. Its allowlist supports employee code, first name, last name, department, and country, defaulting to `employeeCode ASC`; non-unique fields use `employeeCode ASC` as a stable secondary order.
- Salary sorting is deliberately rejected: correct ordering would require a specialized query over each employee's current effective record, and raw minor-unit comparisons across currencies would be misleading.
- Existing unique employee-code and country/department indexes support exact directory queries. No name index was added because the current contains search is not expected to benefit from a normal B-tree index.
- Persistence tests recreate an ignored `prisma/test.db` from committed migrations for each suite and clear tables between cases, so they never use developer data or depend on execution order.
- The API will validate independently of the UI, avoid sensitive-value logging, and expose consistent error codes.
- The modular boundaries leave a natural place to add authentication later, but production-grade identity, audit, encryption, and privacy controls are explicitly not implemented yet.

## Deployment direction

Development and assessment review initially target a single web application, API process, and SQLite database. Deployment has not been chosen. If the eventual host cannot provide durable SQLite storage, or real concurrency and operational requirements outgrow it, the Prisma-backed persistence layer can be migrated deliberately to PostgreSQL. That is a future decision based on evidence, not part of Phase 0.
