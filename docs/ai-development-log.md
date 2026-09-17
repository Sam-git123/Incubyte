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

## 2026-09-17 — Phase 2 salary value behaviour

### Task

Define and implement the first salary-domain rules through a red-green-refactor TDD cycle, without adding transport, persistence, or UI concerns.

### AI contribution

The AI agent translated the requested rules into explicit tests for valid, zero, negative, fractional, unsupported, lowercase, and malformed inputs. It first demonstrated the expected missing-module failure, then added the minimum plain-TypeScript implementation.

### Engineering review

A `createSalary` function was chosen over a class because the value has no behavior beyond validated construction. A dedicated `SalaryValidationError`, one centralized currency tuple, a derived currency type, and a frozen return value were accepted. A broader Money framework, external library, currency conversion, and additional layers were deliberately rejected as unnecessary.

The refactor review removed a duplicate test-only input type; no further abstraction improved the code.

### Verification

- RED: the focused salary suite failed because the production module did not exist.
- GREEN: the focused suite passed all eight generated cases after implementation and refactoring.
- The full test suite, strict TypeScript check, and lint/format checks passed.

## 2026-09-17 — Phase 3 persistence foundation

### Task

Add the minimum Prisma and SQLite persistence model for employees and salary history, a real migration, a centralized client boundary, and isolated repository integration tests without starting API features.

### AI contribution

The AI agent proposed the schema and indexes, generated and reviewed the initial migration SQL, added the Prisma client and repository boundaries, and wrote integration tests for creation, uniqueness, ordered salary history, integer retention, foreign keys, and cascading deletion.

### Engineering review

Required scalar employee attributes were accepted instead of premature reference tables. Salary records are append-style, allow future effective dates, and cascade on employee deletion. The repository accepts the Phase 2 `Salary` value so it does not duplicate domain validation. Prisma 6.19 with the libSQL adapter was selected after current Prisma 7 migration tooling failed with a documented schema-engine regression; `RUST_LOG=info` is applied to migration scripts as the documented workaround for the corresponding SQLite CLI issue.

The design deliberately excludes service logic, current-salary selection, seed data, pagination, HTTP routes, and generic repository abstractions.

### Verification

- Repository tests start from an ignored test database rebuilt from committed migrations and clear records between cases.
- Prisma Client generation and a clean migration apply succeeded.
- The focused persistence suite and the complete workspace quality gates passed.

## 2026-09-17 — Phase 4 employee listing API

### Task

Implement the first application endpoint, `GET /api/employees`, through red-green-refactor TDD with validated server-side pagination, stable ordering, and currently effective salary data.

### AI contribution

The AI agent translated the pagination and salary-selection requirements into deterministic Fastify integration tests before adding production behavior. It then introduced shared Zod transport contracts and a small route-service-repository flow, including an injected request-time source and explicit persistence-to-API mapping.

### Engineering review

The engineer-requested defaults, limits, empty-page behavior, and `employeeCode ASC` order were kept explicit. Current salary is selected at the database boundary as the latest record effective at or before one controlled `asOf` time, with only that record returned for each employee. A generic clock framework, N+1 salary lookups, client-side pagination, configurable sorting, search, filtering, and response exposure of Prisma records were deliberately rejected or deferred.

### Verification

- RED: all 17 focused API cases failed with `404` because the route did not exist.
- GREEN: the focused suite passed after the minimum endpoint implementation.
- The complete workspace test, typecheck, lint, and build gates were run after refactoring and documentation updates.

## 2026-09-17 — Phase 5 employee search, filtering, and sorting

### Task

Extend `GET /api/employees` with composable database-backed search, country and department filters, and strict user-controlled sorting while preserving pagination and current-salary behavior.

### AI contribution

The AI agent developed search, filter, and sorting behavior in separate red-green cycles. It proposed one reusable Prisma `where` object for the count and page queries, token-based full-name search without a schema change, normalization at the transport boundary, and an explicit sort allowlist with stable secondary ordering.

### Engineering review

Accepted behavior includes a 100-character trimmed search, uppercase two-letter country input, exact trimmed department matching, AND composition across filters, five safe sort fields, and rejection of orphaned or invalid sort options. Salary sorting was deliberately deferred because correct current-effective ordering needs specialized database work and raw cross-currency comparisons are misleading. An in-memory fetch/sort/paginate approach was rejected because it violates server-side pagination. No speculative name indexes or search infrastructure were added.

### Verification

- RED search: 9 expected failures before `search` was accepted.
- RED filters: 7 expected failures before country and department predicates existed.
- RED sorting: 6 expected failures before allow-listed database ordering existed.
- Each capability passed its focused integration suite before the next was started; the complete workspace quality gate was run after refactoring and documentation updates.

## 2026-09-17 — Phase 6 deterministic employee seed

### Task

Create an idempotent deterministic seed of exactly 10,000 employees with realistic synthetic international compensation data, salary history, verification, and measured performance.

### AI contribution

The AI agent designed and implemented a pure seeded generator, centralized weighted country and department definitions, department-specific job families, illustrative country/level salary bands, deterministic dates and identifiers, batched transactional persistence, and post-seed invariants. It first encoded generator rules as focused failing tests, then added a small-database idempotency integration test and verified the full dataset through the existing API.

### Engineering review

A local seeded PRNG was accepted instead of Faker so the data model and randomness remain explicit without a new dependency. One undifferentiated salary range, random currencies, real-person email domains, uncontrolled timestamps, per-record database writes, and a 10,000-row test on every normal assertion were rejected. Salary values reuse the domain validator and are synthetic—not factual market data. Clearing application employee/salary data was accepted as the simplest idempotency strategy for this development database and documented as destructive.

### Verification

- RED: the six generator specifications failed because the generator module did not exist.
- GREEN: six pure generator tests and one migrated-database integration test passed.
- The real seed ran twice with identical counts: 10,000 employees and 14,064 salary records, with no employee missing salary.
- The full dataset passed default-page, pagination, search, country filter, department filter, and sorting checks through `app.inject()`.
- The complete workspace test, typecheck, lint, and build gates were run after documentation and refactoring.

## 2026-09-17 — Phase 7 employee directory UI

### Task

Build the first production-facing React screen over `GET /api/employees`, including server-controlled pagination, debounced search, country and department filters, supported sorting, responsive presentation, and explicit loading, error, retry, and empty states.

### AI contribution

The AI agent translated the API contract into behavior-first React Testing Library cases, then implemented a small feature boundary around an API adapter, TanStack Query hook, local control state, filter controls, and MUI DataGrid. It also added exact URL-mapping tests and prepared the local Vite proxy and environment-based API path.

### Engineering review

MUI DataGrid Community and TanStack Query were accepted because their current features cover server-side directory behavior without custom table or request-state infrastructure. Search is trimmed and debounced for 300 ms; all data operations remain on the API; filters, sorting, and page-size changes reset to page one. Salary sorting remains unavailable because the API deliberately rejects it. URL-backed filter state, frontend routing, a generic API client, permissive CORS, and speculative employee actions were kept out of scope.

### Verification

- RED: the focused directory suite failed because the employee-directory implementation did not exist.
- GREEN: component tests cover data, loading, retry, empty states, debounced search, filters, pagination, and sorting; API-adapter tests cover exact query serialization and safe failure behavior.
- The implementation was checked against the seeded local API, followed by the full workspace test, typecheck, lint, and build gates.
