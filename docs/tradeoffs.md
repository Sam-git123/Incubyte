# Initial Engineering Trade-offs

These are working decisions for the assessment, not irreversible commitments. Each should be revisited when implementation evidence or deployment constraints contradicts its assumptions.

## React SPA with Vite instead of Next.js

The product is an authenticated-in-production internal tool with interaction-heavy tables and forms, not a public content site needing server rendering or search indexing. React with Vite provides a smaller surface and an explicit separation from the API. Next.js should be reconsidered if server rendering, an integrated full-stack deployment, or framework-managed routing becomes a concrete benefit.

## Fastify REST API

Fastify offers a compact Node.js framework, strong schema-oriented validation, useful TypeScript support, and fast in-process integration tests through `app.inject()`. REST keeps the small resource-oriented API understandable. This can be revisited if team constraints favor another framework or the interaction model demonstrates a real need that REST handles poorly; GraphQL is not justified initially.

## Modular monolith instead of microservices

Employee, salary, and analytics concerns can have clear module boundaries while running in one API process. At roughly 10,000 employees, independent services would add deployment, networking, consistency, and observability costs without a demonstrated scaling benefit. A boundary should become a service only if ownership, reliability, or scaling evidence makes independent operation valuable.

## SQLite with Prisma instead of PostgreSQL initially

SQLite makes local setup and assessment review reproducible with little infrastructure. Prisma supplies type-safe access and a plausible migration path while avoiding a custom data framework. SQLite should be replaced if hosting lacks durable storage or production concurrency, availability, backup, or operational requirements demand PostgreSQL. Prisma itself should be reconsidered if generated queries prevent necessary correctness or performance.

The initial implementation pins Prisma 6.19 and uses its local-file libSQL adapter. This avoids a current Prisma 7 migration-engine regression and avoids a native SQLite compilation requirement on Node 24. The pin and adapter are implementation choices, not domain commitments, and should be revisited when the upstream tooling is stable for the supported development environments.

## MUI DataGrid as the initial directory table

MUI DataGrid aligns with the required Material UI stack and supplies accessible table behavior, sorting, and server-mode pagination with less bespoke UI work. Before implementation, required features must be checked against the community edition; licensing or customization limits would favor TanStack Table.

## Effective-dated salary history instead of destructive updates

Appending salary records preserves change history and supports auditability with a small conceptual model. It adds rules for choosing the current salary and handling future or duplicate effective dates, which must be specified before coding. A full temporal ledger or approval workflow is deferred unless audit requirements expand.

The foreign key cascades salary deletion when its employee is deleted, preventing orphaned history. Future effective dates are permitted by design; this phase stores them but does not implement activation or approval workflows.

## Employee attributes instead of reference tables

Country, department, and job title are required string fields rather than separate tables. This keeps the first relational model and fixtures small while no management or metadata behavior exists for those concepts. Reference tables become worthwhile if later requirements introduce controlled vocabularies, renaming, localization, or additional attributes.

## Integer minor units instead of floating point

Integer minor units prevent ordinary binary floating-point errors and make the API representation explicit. Currency-specific fraction digits, integer limits, and rounding still require deliberate rules. A decimal database type or money library may be warranted if calculations later exceed safe integer bounds or require more complex precision.

## Server-side pagination, filtering, sorting, and aggregation

Ten thousand records could sometimes fit in browser memory, but transferring and processing the entire data set increases payloads, weakens query consistency, and scales poorly. Bounded server queries also mirror a realistic production design. Client-side processing may still be appropriate for an already loaded small result set, but not for the primary directory or organization-wide analytics.

The listing endpoint uses simple `page`/`pageSize` offset pagination, capped at 100 rows. It defaults to `employeeCode ASC` and allow-lists employee code, first name, last name, department, and country; non-unique fields add employee code as a stable secondary order. This produces understandable metadata and predictable page boundaries for the assessment. Cursor pagination should be reconsidered if deep-page performance or frequent concurrent inserts become material.

## Database-backed contains search instead of search infrastructure

At the expected 10,000-employee scale, SQLite `contains` predicates over first name, last name, and employee code are a clear baseline. Whitespace-delimited terms are ANDed so full names work without a denormalized column or raw SQL concatenation. This relies on SQLite's case-insensitive ASCII `LIKE` behavior; broader Unicode collation or materially larger data could justify full-text search later. Normal first/last-name indexes were not added because leading-wildcard contains queries generally cannot use them effectively.

## Defer salary sorting

Salary sorting is not in the allowlist. Correctly ordering before pagination requires a database-level query over the latest currently effective salary, while comparing minor-unit values across currencies is not economically meaningful. Loading all employees to sort in Node.js was rejected because it would break server-side pagination. Salary sorting can be revisited with an explicit currency policy and a maintainable database query; until then, `sortBy=salary` returns a validation error.

## Currency-separated analytics instead of automatic conversion

Adding unlike currencies creates misleading results. Initial metrics will therefore be grouped by currency, and country views must still preserve currency meaning. Cross-currency reporting can be added only with an agreed base currency, rate source, effective date, and rounding policy; live FX integration is deliberately absent.

## Shared validation contracts, limited to transport concerns

Sharing Zod schemas and TypeScript API types can keep the React client and Fastify API aligned. Keeping business logic out of the contracts package avoids coupling domain behavior to transport types. Sharing should remain selective: duplication is preferable when a shared abstraction would blur distinct frontend and backend responsibilities.
