# ACME Salary Management

ACME Salary Management is a TypeScript modular monolith for browsing employee compensation, recording effective-dated salary changes, and viewing currency-aware analytics.

## Local development

Prerequisites: Node.js 20.19 or newer and pnpm 10.

```powershell
corepack enable
pnpm install
Copy-Item apps/api/.env.example apps/api/.env
pnpm db:reset
pnpm db:seed
pnpm dev
```

The web application runs at `http://localhost:5173` and proxies API requests to `http://localhost:3000`.

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## End-to-end tests

Install the Chromium browser binary once:

```powershell
pnpm exec playwright install chromium
```

Then run:

```powershell
pnpm test:e2e
```

The command resets `apps/api/prisma/e2e.db`, applies the committed Prisma migrations, seeds 501 deterministic employees, and starts the API and Vite applications automatically. It never uses the normal development database. Playwright runs the three critical workflows serially in Chromium and retains screenshots and traces only when a test fails.
