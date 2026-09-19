# Demo Script

Target length: 3–5 minutes. Use the deterministic 10,000-employee database and begin with both applications already running.

## 00:00 — Problem and scope

- Introduce the application as an HR salary-management assessment for a global 10,000-person organization.
- State the deliberate boundary: employee compensation and insights, not payroll, authentication, or FX conversion.

## 00:30 — Compensation Insights

- Open the dashboard and point out the 10,000-employee headcount.
- Explain why salary statistics appear in separate currency groups rather than one misleading global average.
- Filter to the United Arab Emirates, then Engineering, and show the department/country views updating from server data.

## 01:20 — Employee Directory

- Open Employees and show server-side pagination.
- Search for `EMP000500`; briefly demonstrate a country or department filter and supported sorting.
- Explain the 300 ms search debounce and that React receives only the requested page.

## 02:05 — Employee details and salary history

- Open the matching employee.
- Identify profile data, current salary, effective date, and ordered salary history.
- Explain that current salary ignores future records until their effective date.

## 02:40 — Change salary and prove persistence

- Open **Change salary**, retain the employee's locked currency, enter a valid amount, and choose an unused future effective date.
- Save once and show the success message plus the scheduled history row.
- Refresh the browser and show that the row remains persisted while the current salary is unchanged until its date.

## 03:35 — Engineering evidence

- Show the brief architecture diagram in `README.md`.
- Mention integer minor units, append-only history, predictable API errors, server-side queries, and deterministic seed data.
- Point to `docs/performance.md`, the Vitest/React test suites, three Playwright workflows, and GitHub Actions.

## 04:15 — AI-assisted development

- Explain that AI helped explore designs, generate/review tests, investigate performance, and review documentation.
- Mention concrete rejected suggestions: mixed-currency aggregation, client-side pagination/sorting, unnecessary infrastructure, and speculative optimization.
- Point reviewers to `docs/ai-development-log.md` for the phase-by-phase record and verification evidence.

## Before recording

- Confirm the public URL, `/health`, and direct SPA-route refreshes if deployment is available.
- Start from a freshly seeded database or choose an unused salary effective date.
- Close unrelated windows and avoid showing local environment files or secrets.
- Keep installation and source navigation out of the recording unless needed to answer a specific question.
