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

## 2026-09-17 — Phase 8 employee details

### Task

Add a dedicated employee details API and React view for employee information, current salary, and ordered salary history without introducing salary mutation.

### AI contribution

The AI agent defined the shared detail contract, wrote failing Fastify and React behavior tests, and implemented the route-service-repository path, React Router navigation, dedicated TanStack Query key, detail states, and salary-history presentation. It also reviewed current-salary behavior against the listing implementation and centralized the shared Prisma salary ordering.

### Engineering review

Internal employee IDs remain opaque: unknown or malformed-looking strings receive the same safe 404 instead of a speculative CUID validator. One relation query returns the employee and necessary salary history; no per-record queries or raw Prisma values reach HTTP. A compact semantic table was accepted for history, with future records visibly marked as scheduled. URL-persisted directory filters, generalized error frameworks, salary editing, and extra routes were rejected or deferred.

### Verification

- RED backend: six endpoint cases received Fastify's default 404 before route implementation.
- RED frontend: the details modules were absent and employee names were not navigation links.
- GREEN: focused API and frontend suites cover the detail contract, salary timing and ordering, navigation, rendering, loading, retry, not-found, no-salary, and dedicated resource request.
- The seeded application workflow and complete workspace quality gates were checked after refactoring.

## 2026-09-18 — Phase 9 salary changes

### Task

Add an append-only employee salary-change API and a details-page workflow while preserving current/future salary semantics and existing history.

### AI contribution

The AI agent translated the workflow into failing API and UI tests, proposed the route-service-repository boundary, added duplicate-date concurrency protection, and implemented a React Hook Form/Zod dialog with exact decimal-string conversion and TanStack Query invalidation.

### Engineering review

Appending a new effective-dated record was accepted; overwriting the current salary was rejected because it destroys history. Future dates and unambiguous backdating are allowed, while duplicate employee/date rows are rejected by both application behavior and a database unique constraint. Currency remains consistent with existing history or the centralized country mapping. JavaScript `value * 100`, free-form currency choice, a generic command framework, and authentication/audit expansion were deliberately rejected.

### Verification

- RED backend: salary creation, validation, timing, history, currency, not-found, and conflict cases failed against the missing route.
- RED frontend: conversion/dialog modules and the details-page entry point were absent.
- GREEN: focused Fastify, form, mutation, details, and conversion suites passed before the full workspace quality gates, clean migration/seed check, and seeded manual API workflow.

## 2026-09-18 — Phase 10 compensation analytics

### Task

Add summary, department, and country analytics APIs that use currently effective salaries and remain correct across currencies, salary history, future records, missing salaries, and filters.

### AI contribution

The AI agent translated the product rules into deterministic API and median tests, identified mixed-currency aggregation as the primary correctness risk, and proposed both targeted raw SQL and minimal Prisma projection strategies. It implemented shared transport contracts, grouped statistics, controlled-time salary selection, manual seeded checks, and repeatable local measurements.

### Engineering review

Mixed-currency totals and averages were explicitly rejected. One Prisma query returning employee dimensions plus at most one current salary was accepted because it avoids N+1 behavior and measured comfortably at 10,000 employees. Application-side median was preferred over clever SQLite SQL; it keeps the rule testable and only processes required numeric rows. Average and median round to the nearest minor unit. No cache, new index, raw SQL, FX conversion, or dashboard code was added.

### Verification

- RED summary: ten API cases returned 404 and the median helper import was absent.
- RED grouped analytics: five department and five country cases returned 404 before handlers existed.
- GREEN: focused suites cover summary metrics, multiple currencies, history/future semantics, missing salaries, filters, deterministic ordering, grouped endpoints, validation, and median edge cases.
- The deterministic seed, full workspace quality gate, live seeded requests, and measured endpoint timings verified correctness and assessment-scale behavior.

## 2026-09-18 — Phase 11 compensation dashboard

### Task

Build a responsive dashboard over the existing analytics APIs with summary counts, currency-aware compensation, country and department analysis, filters, and complete loading, error, and empty states.

### AI contribution

The AI agent translated the dashboard requirements into failing React behavior tests, explored table and chart layouts, implemented endpoint-specific TanStack Query hooks, and assembled a restrained Material UI information hierarchy. It also checked filter propagation, mixed-currency presentation, accessible chart labeling, responsive layout, and seeded API consistency.

### Engineering review

A proposed global salary headline was rejected because the unfiltered organization contains eight currencies. Separate currency cards, department headcount bars, and a country table were accepted; department salary comparison appears only in a single-currency view. A chart package was not added for one simple bar visualization, and compensation calculations remain exclusively on the backend. Local filter state and one coherent dashboard error were kept deliberately simple.

### Verification

- RED: the focused dashboard suite failed on missing analytics frontend modules, and the application-shell test failed while `/` still opened Employees.
- GREEN: focused tests cover summary counts, separate currency groups, endpoint-specific filters, clearing, loading, failure, empty results, department data, country currency labels, and dashboard-first routing.
- The full workspace test, typecheck, lint, and build gates and seeded browser/API checks were completed after refactoring.

## 2026-09-18 — Phase 12 critical frontend test coverage

### Task

Strengthen regression coverage for the employee directory, employee details, salary-change workflow, and compensation dashboard without adding product behavior, backend work, end-to-end infrastructure, or CI changes.

### AI contribution

The AI agent audited every existing frontend test before editing, identified behavior gaps and brittle assertions, and added focused React Testing Library coverage for deterministic debounce timing, combined filters, pagination and sorting controls, absent salary display, visible post-mutation refresh, safe mutation failures, salary formatting, and filtered dashboard empty states. It also extracted one small helper that creates an isolated QueryClient for each render.

### Engineering review

Tests continue to mock API boundaries while exercising the real router, TanStack Query, Material UI, and form behavior. Query-cache spy assertions and an unmanaged focus element were removed in favor of visible UI outcomes and cleanup-safe rendering. Fake timers are limited to debounce and salary-time semantics, and fixed system time keeps scheduled/current salary labels deterministic. No generic test framework, MSW layer, snapshot suite, or production feature change was introduced.

### Verification

- The focused frontend suite passes 57 tests across 9 files.
- Salary mutation coverage verifies that successful invalidation produces refreshed current salary and history in the rendered page.
- The full workspace test, typecheck, lint, and build gates were run after the test refactor and documentation update.
- Coverage percentages were not reported because code-coverage instrumentation is not configured in the workspace.

## 2026-09-18 — Phase 13 end-to-end tests

### Task

Add a small Playwright suite that exercises the highest-value browser-to-database journeys without duplicating detailed unit and API coverage.

### AI contribution

The AI agent selected employee search/navigation, salary change persistence, and dashboard filtering as the three full-system scenarios. It added Playwright-managed application startup, a dedicated migrated SQLite database, a focused deterministic seed, semantic selectors, and failure-only screenshots and traces.

### Engineering review

The E2E database uses the existing schema, migrations, seed generator, and persistence code but limits the fixture to 501 employees for faster repeatable runs. Tests run serially because salary mutation shares one SQLite database; separate deterministic employees keep workflows independent. Arbitrary sleeps, network mocks, page-object hierarchies, browser matrices, retries, and duplicated backend edge cases were deliberately rejected.

### Verification

- The E2E suite was run successfully three consecutive times from a clean database reset.
- The full unit/integration test, typecheck, lint, and build gates passed.
- Browser installation and the single-command E2E workflow are documented in the README.

## 2026-09-19 — Phase 14 continuous integration

### Task

Add GitHub Actions checks for installation, Prisma generation, linting, type checking, unit/integration tests, production builds, and Playwright E2E tests without adding deployment behavior.

### AI contribution

The AI agent reviewed clean-checkout requirements and current project scripts, verified the official action setup pattern, and created a two-job workflow. The quality job runs the standard local commands; the dependent E2E job installs Chromium and delegates database reset, migrations, seeding, and server startup to the existing `pnpm test:e2e` command.

### Engineering review

Node 20.19.0 matches the repository's minimum supported runtime, while pnpm is sourced from the pinned `packageManager` field and its store is cached through the standard Node setup action. Non-secret SQLite URLs are job-local. A job matrix, custom actions, duplicated server orchestration, coverage thresholds, security scanners, Docker, and deployment steps were rejected as unnecessary for this phase.

### Verification

- A frozen-lockfile install and explicit Prisma generation passed locally.
- The workflow YAML was formatting-checked and reviewed against existing scripts and clean-checkout assumptions.
- Lint, typecheck, unit/integration tests, production build, and the Chromium E2E suite passed locally.

## 2026-09-19 — Phase 15 performance review

### Task

Measure the application against its deterministic 10,000-employee workload, inspect query and browser behavior, and make only evidence-backed optimizations.

### AI contribution

The AI agent generated performance hypotheses, captured repeat local HTTP samples and payload sizes, logged Prisma query counts, inspected selected SQLite query plans and indexes, reviewed frontend server-mode behavior in a browser, and added a reusable side-effect-free benchmark script.

### Engineering review

The measured employee directory and analytics paths were accepted without database changes. Offset pagination, current relational search, existing country/department indexes, the salary composite index, and application-side median all remained comfortable at the stated scale. Proposed cursor pagination, full-text search, extra name/composite indexes, raw median SQL, caching infrastructure, and broad React memoization were rejected because the measurements did not justify them.

The cache review found one concrete correctness issue: a successful salary change invalidated employee data but not analytics. A focused failing test demonstrated the stale analytics state, and the existing mutation hook was extended to invalidate the analytics query family.

### Verification

- The deterministic seed restored 10,000 employees and 14,064 salary records before measurement and after mutation timing.
- `pnpm perf:check` verified one warm-up plus 10 successful samples for each representative employee and analytics GET request.
- Query logging confirmed fixed query counts rather than per-employee salary queries; selected `EXPLAIN QUERY PLAN` output confirmed existing index use and the expected search/sort scans.
- Manual browser checks covered directory paging, debounced search, employee details, dashboard loading, and filter refresh.
- The focused cache-invalidation test and the complete test, typecheck, lint, build, and Playwright gates passed.

## 2026-09-19 — Phase 16 deployment and production readiness

### Task

Prepare the implemented modular monolith for a public deployment with durable data, safe migrations, production SPA delivery, runtime validation, and operational documentation without adding product behavior.

### AI contribution

The AI agent compared deployment shapes, reviewed provider constraints, wrote failing production-serving tests, and added the minimal same-origin Fastify/React runtime, Render Blueprint, configuration validation, security headers, graceful shutdown, and deployment guidance. It also separated repeatable migrations from one-time destructive seeding and exercised the production build locally.

### Engineering review

A single Render service with a persistent SQLite disk was accepted as the smallest architecture consistent with the measured workload and current Prisma schema. A split frontend/backend deployment and permissive CORS were rejected because same-origin hosting is simpler. PostgreSQL and Docker were deferred because neither was required for correctness here. The limitations of paid persistent storage, single-instance SQLite, and provider-managed provisioning are documented rather than hidden.

### Verification

- RED: production tests initially failed because security headers, static assets, SPA fallback, and predictable unknown-API responses were absent.
- GREEN: focused tests cover runtime configuration, security headers, cache behavior, SPA fallback, and the JSON 404 contract.
- Frozen installation, Prisma generation, full lint, typecheck, unit/integration tests, production build, local production smoke checks, and Playwright E2E were run after the deployment changes.

## 2026-09-19 — Phase 17 final assessment review

### Task

Review the completed repository from a first-time assessor's perspective, align documentation with the implemented product, and verify a clean setup, seeded data, core browser journey, and final quality gates without adding features.

### AI contribution

The AI agent audited documentation, routes, manifests, tracked artifacts, placeholders, Git history, and the reviewer setup path. It rewrote the README as a concise entry point, corrected stale requirement/architecture statements, aligned the unknown-route error with the shared contract, and prepared a short demo script.

### Engineering review

The original requirements framing and chronological AI log were preserved rather than rewritten into a perfect retrospective. Late suggestions to reorganize working modules, remove dependencies without evidence, add screenshots, split the existing bundle without deployed measurements, or introduce new documentation platforms were rejected. The absent public deployment and demo video remain explicit blockers rather than invented links.

### Verification

- An isolated copy with no dependencies, environment file, generated client, build output, or database passed the documented frozen install, Prisma generation, migrations, deterministic 10,000-employee seed, 191 tests, and production build.
- A manual browser journey covered analytics filters, employee search/details, a future salary change, scheduled/current semantics, persisted history after refresh, and browser-console review.
- The final worktree passed lint, typecheck, unit/integration tests, production build, Playwright E2E, seed-count verification, and tracked-artifact checks.
