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
