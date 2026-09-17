# Performance Notes

These are informal development measurements, not production benchmarks.

## Phase 6 deterministic seed

- Date: 2026-09-17
- Environment: local Windows development environment, Node.js 24.18.1; hardware was not benchmark-controlled
- Database: SQLite through Prisma 6.19 and the local-file libSQL adapter
- Dataset: 10,000 employees and 14,064 salary records
- Insertion: employee batches of 500 and salary batches of 1,000 in one transaction
- Runner-reported duration: 1.98–2.20 seconds across three successful runs (2.09 seconds on the first)
- Full `pnpm db:seed` wall time observed by the task runner: approximately 6 seconds, including TypeScript/contracts compilation

The measurement includes deterministic generation, database replacement, and post-seed count/missing-salary checks within the runner timing. It does not establish throughput guarantees and should be repeated if the database adapter, schema, host hardware, or seed volume changes.

No endpoint latency benchmark was recorded in this phase. Representative employee listing requests were verified for correctness against all 10,000 rows, but correctness checks are not reported as performance measurements.

## Phase 10 compensation analytics

- Date: 2026-09-18
- Environment: local Windows development environment, Node.js 24.18.1; hardware was not benchmark-controlled
- Database: SQLite through Prisma 6.19 and the local-file libSQL adapter
- Dataset: freshly seeded 10,000 employees and 14,064 salary records
- Method: built Fastify server on localhost, one warm-up request followed by five sequential PowerShell `Invoke-RestMethod` samples per endpoint; figures include local HTTP and JSON processing
- `GET /api/analytics/summary`: 335.09 ms average, 294.72â€“380.93 ms observed, 1,292-byte compact JSON response
- `GET /api/analytics/departments`: 300.19 ms average, 285.67â€“321.69 ms observed, 10,479-byte compact JSON response
- `GET /api/analytics/countries`: 305.98 ms average, 284.99â€“347.80 ms observed, 2,145-byte compact JSON response

Each endpoint issues one focused Prisma employee query with database filters and at most one effective salary projection per employee, then computes currency groups and medians from minimal numeric rows in application code. Filtered manual checks were faster (approximately 19 ms for AE Engineering, 41 ms for AE, and 93 ms for Engineering in server-reported timings). These informal measurements show comfortable assessment-scale behavior; they are not production latency guarantees. No cache, raw SQL rewrite, or additional index was justified by this evidence.
