# Performance Review

These are informal developer-local measurements, not production guarantees or hard service-level objectives.

## Workload

- 10,000 deterministic employees
- 14,064 deterministic salary records
- All employee-list requests use a maximum page size of 100; the measured page size was 25
- Salary analytics use the latest salary effective at the request time and exclude future records

## Measurement environment

- Date: 2026-09-19
- Node.js: 24.18.1, x64
- OS: Windows (`win32`, build 10.0.26200)
- Local machine: 16 logical CPUs and approximately 31 GiB memory; no controlled benchmark isolation
- Database: SQLite 3.44.0 through Prisma 6.19 and the local-file libSQL adapter
- API: compiled Fastify server on `127.0.0.1:3000`

The committed `pnpm perf:check` command sends one warm-up request and then 10 sequential requests per endpoint, reads the complete response, and reports median, minimum, maximum, and payload bytes. It requires a running API and supports `PERF_BASE_URL` and `PERF_SAMPLES` overrides. It reports observations only and has no CI timing threshold.

An initial pre-change pass used the same warm-up and sample counts through PowerShell `Invoke-WebRequest`. The repeat below used the committed Node script. Different local HTTP clients produced different absolute overhead, so conclusions use broad categories rather than claimed percentage improvements.

## Employee directory

| Scenario             | Request                             |   Median | Observed range | Payload |
| -------------------- | ----------------------------------- | -------: | -------------: | ------: |
| Default page         | `/api/employees`                    |  9.02 ms |  6.13–13.23 ms | 8,070 B |
| Deep page            | `page=100&pageSize=25`              |  6.48 ms |  5.43–12.85 ms | 8,000 B |
| Employee-code search | `search=EMP000500`                  | 12.21 ms | 10.64–13.70 ms |   383 B |
| Country filter       | `country=AE`                        | 12.11 ms |  8.85–12.97 ms | 8,066 B |
| Department filter    | `department=Engineering`            | 11.58 ms |  7.55–20.93 ms | 8,055 B |
| Combined filter      | `country=AE&department=Engineering` | 11.59 ms |  8.69–19.51 ms | 8,119 B |
| Last-name sort       | `sortBy=lastName&sortOrder=asc`     | 11.86 ms |  7.76–12.97 ms | 8,157 B |

The pre-change PowerShell pass measured 23.21–28.48 ms medians for these same scenarios, including HTTP-client overhead. Both passes place the directory in the **comfortable** category for the assessment workload. Page 100 did not reveal an offset-pagination issue at 10,000 employees.

Salary sorting remains unsupported. Correct current-salary sorting would require a specialized database query and a defined cross-currency comparison policy; loading every employee into Node.js before pagination remains unacceptable.

## Employee details and salary mutation

- `GET /api/employees/:id` for `EMP000001` with two salary-history rows: 16.88 ms median across 10 samples, 15.23–18.91 ms observed, 562-byte payload.
- `POST /api/employees/:id/salaries`: 17.85 ms median across 10 distinct future effective dates, 16.25–23.90 ms observed, 167-byte response. The deterministic seed was restored after measurement.
- Details return one employee and its ordered salary history; no unrelated employees or salary records are returned.
- The mutation path keeps duplicate-effective-date protection and correctness checks; its measured latency does not justify query simplification.

## Analytics

| Endpoint or filter                |    Median |   Observed range |  Payload |
| --------------------------------- | --------: | ---------------: | -------: |
| Summary                           | 137.68 ms | 127.56–156.21 ms |  1,292 B |
| Departments                       | 134.69 ms | 126.74–149.14 ms | 10,479 B |
| Countries                         | 134.47 ms | 128.59–149.04 ms |  2,145 B |
| Summary, `country=AE`             |  23.52 ms |   18.33–27.77 ms |    250 B |
| Summary, `department=Engineering` |  45.28 ms |   39.78–56.64 ms |  1,291 B |
| Summary, combined filters         |  12.06 ms |    8.77–15.23 ms |    247 B |

Unfiltered analytics remain **comfortable** for an interactive local assessment at 10,000 employees. Each request reads only country, department, and one current salary projection per employee. Currency grouping and median calculation remain in TypeScript; moving median into adapter-specific SQL would add complexity without evidence of a meaningful issue.

## Query design

- Employee listing builds one Prisma `where` object and uses it for both filtered count and page retrieval.
- SQLite applies filtering and ordering before `OFFSET` and `LIMIT`; Node.js does not slice or sort the full employee population.
- A logged 25-row list request used a fixed count query, employee-page query, and one salary relation query, plus the transaction commit. It did not issue one salary query per employee.
- The salary relation selects only rows effective at or before `asOf`, orders newest first, and returns at most one current salary per employee.
- A logged unfiltered analytics request used two fixed SQL statements: employee dimensions followed by one salary relation query for the selected employee IDs. It did not issue N salary queries.
- Analytics deliberately transfer minimal rows into Node.js for grouping and median calculation rather than full employee objects or salary histories.

## Query-plan and index review

Current employee indexes:

- primary key on `id`
- unique `employeeCode`
- unique `email`
- `countryCode`
- `department`

Current salary indexes:

- primary key on `id`
- unique composite `(employeeId, effectiveFrom)`

Selected `EXPLAIN QUERY PLAN` findings:

- Default and deep-page employee-code ordering scan the unique `employeeCode` index.
- Exact country and department filters use their existing indexes; stable employee-code ordering adds a small temporary sort.
- The combined country/department query selected the department index and applied the remaining predicate. Its measured 11.59 ms median does not justify a composite index.
- Leading-wildcard name/code search scans in employee-code order. Normal first/last-name indexes would not make `%term%` predicates index-seeking, and the 12.21 ms measured median does not justify full-text search.
- Last-name sorting scans 10,000 employee rows and uses a temporary B-tree, but its 11.86 ms median does not justify another index at this scale.
- Employee salary history uses the existing `(employeeId, effectiveFrom)` index.

No index was added. Additional indexes would add storage, write cost, migrations, and maintenance without a measured user-facing benefit.

## Payload review

- A 25-row directory page is approximately 8 KiB and includes only directory fields plus the current salary, not salary history.
- The measured two-row employee detail response is 562 bytes and includes history because the details page uses it.
- Summary, department, and country analytics responses are approximately 1.3 KiB, 10.5 KiB, and 2.1 KiB respectively.
- No endpoint returns the 10,000-employee dataset to React for directory processing.
- The production build currently emits one 1,221.22 KiB JavaScript chunk (369.77 KiB gzip). This is acceptable for the local assessment, but deployment measurements should determine whether route-level splitting is worthwhile.

## Frontend review

- MUI DataGrid is configured for server pagination and server sorting and receives only the current page. Manual navigation showed rows 1–25 followed by 26–50, not a 10,000-row client collection.
- Employee search remains debounced by 300 ms. A manual `EMP000500` search produced one matching row and one server request after the debounce.
- Filter, page, detail, and dashboard interactions remained responsive in the local browser review.
- The dashboard declares three independent TanStack Query hooks with no application-level dependency between summary, department, and country requests. Local in-app-browser/Vite logs showed the proxy delivering them sequentially, but total refresh remained responsive and the observation did not isolate a React bottleneck; no orchestration abstraction was added.
- TanStack Query uses a 30-second `staleTime`, avoiding immediate refetches while keeping compensation data short-lived.
- Salary mutation now invalidates employee detail, employee-list, and analytics query families. Inactive analytics are marked stale and refresh when revisited, avoiding stale dashboard figures without adding a cache layer.
- No React profiler evidence indicated an expensive rerender. No speculative `useMemo`, `useCallback`, or `React.memo` changes were added.
- Route-level code splitting was considered after the build-size warning, but deferred because no deployed-network or startup regression was measured.

## Optimizations

One small cache-correctness change was justified: successful salary mutations now invalidate cached analytics as well as employee data. This prevents a recently visited dashboard from reusing compensation metrics that predate the salary change. It does not change API latency, so no before/after endpoint percentage is claimed.

No database, query, schema, pagination, median, or rendering optimization was necessary.

## Remaining trade-offs

- Offset pagination is simpler and measured comfortably through page 100 at 10,000 rows. Cursor pagination should be reconsidered only for materially deeper datasets or write-heavy page traversal.
- SQLite remains sufficient for this local assessment workload. Deployment durability and production write concurrency, not these measurements, may still motivate PostgreSQL later.
- Contains search intentionally favors simple predictable behavior over full-text infrastructure.
- Application-side median remains clear and fast enough while processing only required current-salary values.
- The numbers are local observations and should be repeated after meaningful changes to runtime, database adapter, schema, hosting, or dataset size.

## Prior seed measurement

The Phase 6 seed generated and replaced 10,000 employees and 14,064 salary records in 1.98–2.20 seconds across three local runs. A full `pnpm db:seed` took approximately six seconds including compilation.
