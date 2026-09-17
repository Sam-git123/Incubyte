# AI Development Log

This log records meaningful AI-assisted engineering work rather than routine completion or formatting.

## 2026-09-17 — Phase 0 product and architecture assessment

### Task

Create the initial product requirements, proposed architecture, and engineering trade-off documentation for Phase 0, without initializing or implementing the application.

### AI prompt / request

The developer instructed the AI agent to read `SPEC.md` completely, create only `docs/requirements.md`, `docs/architecture.md`, `docs/tradeoffs.md`, and this log, keep the requirements concise and product-focused, distinguish requirements from assumptions and exclusions, describe the proposed React/Fastify/SQLite modular monolith as not yet implemented, and avoid committing.

### AI contribution

The AI agent:

- distilled the specification into a concise product brief for the HR Manager workflow;
- separated committed requirements, working assumptions, and deliberately excluded scope;
- proposed feature-oriented frontend and backend boundaries, conceptual request flow, and salary-history model;
- recorded why the initial stack and data-handling choices fit the assessment, plus concrete triggers for revisiting them;
- kept all outputs at the planning level and created no application scaffold or runtime code.

### Engineering review

Accepted from the specification: a React/Vite client, Node.js/Fastify REST API, Prisma/SQLite persistence, modular-monolith structure, server-side data operations, integer minor-unit money, effective-dated salary history, and currency-separated analytics.

Clarified during synthesis: the current-salary rule needs explicit tests for future and equal effective dates; supported currencies and minor-unit behavior remain domain-design questions; MUI DataGrid is provisional pending a feature and license check; PostgreSQL is a migration option only when deployment or concurrency evidence warrants it.

Rejected or deferred: application scaffolding, executable schemas, feature implementation, invented benchmark results, live FX conversion, distributed architecture, and production identity or payroll scope. The developer should review these documents before any Phase 1 work begins.

### Verification

- Read the complete repository specification before editing.
- Reviewed the created Markdown documents and repository diff for scope and internal consistency.
- Confirmed no React, Node, pnpm, Prisma, application code, or Git commit was introduced.
- No automated tests were applicable to this documentation-only phase.
