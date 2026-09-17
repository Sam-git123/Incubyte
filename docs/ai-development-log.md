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

## 2026-09-17 — Phase 1 workspace bootstrap

### Task

Create a strict TypeScript pnpm workspace with minimal Fastify, React/Vite, and shared-contracts packages, plus workspace-level linting, formatting, testing, and build commands. Product features and persistence were explicitly excluded.

### AI prompt / request

The developer asked the AI agent to complete Phase 1 only, preserve the Phase 0 artifacts and Git history, keep dependencies at appropriate workspace levels, add only API-health and React-heading smoke tests, run all quality gates, and avoid committing or pushing.

### AI contribution

The AI agent created the workspace manifests and TypeScript configurations, shared ESLint and Prettier configuration, a factory-based Fastify application with `GET /health`, a minimal React entry point, an empty compilable contracts package, and two focused bootstrap tests. It installed compatible dependency versions and generated the pnpm lockfile.

### Engineering review

Shared development tools were kept at the workspace root, while Fastify and React/Vite dependencies were scoped to their owning applications. Strict TypeScript settings are inherited from one base configuration, with environment-specific module and library settings in each package. The API separates application construction from process startup so it can be tested with `app.inject()` without opening a network port.

No employee, salary, analytics, database, UI-library, or deployment concerns were introduced. The existing architecture status note was updated only to reflect that the workspace bootstrap now exists.

### Verification

- `pnpm lint`: passed ESLint and Prettier checks.
- `pnpm typecheck`: passed for API, web, and contracts packages.
- `pnpm test`: passed two tests across two test files.
- `pnpm build`: produced successful API, web, and contracts builds.
