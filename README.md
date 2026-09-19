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
pnpm test:e2e
```

## Continuous integration

GitHub Actions runs the same lint, type-check, unit/integration, build, and E2E checks automatically for every push and pull request. The workflow uses the pinned pnpm version and isolated SQLite databases; it does not require repository secrets.

## Production deployment

The production topology is one Render web service. Fastify serves both the REST API and the compiled React SPA, so browser requests use the same-origin `/api` path and no CORS policy is required. A paid Render persistent disk is mounted at `/var/data`; production SQLite data is stored at `/var/data/acme.db`.

The checked-in [`render.yaml`](./render.yaml) is the deployment source of truth. To provision it, create a Render Blueprint from this repository and review the `starter` service and 1 GB disk before applying it. Render supplies the public HTTPS URL and the runtime `PORT`.

The lifecycle is intentionally separated:

- Build: frozen dependency install, Prisma client generation, and production builds.
- Start/redeploy: apply committed migrations with `prisma migrate deploy`, then start compiled Fastify output.
- First deploy only: the Blueprint `initialDeployHook` runs the deterministic seed.
- Normal restarts: never reset or reseed the database.

Required production configuration is represented in `render.yaml`:

```text
DATABASE_URL=file:/var/data/acme.db
NODE_ENV=production
PORT=<provided by Render>
```

For a local production-mode smoke test after the development database has been migrated and seeded:

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
$env:DATABASE_URL = "file:./dev.db"
$env:NODE_ENV = "production"
$env:PORT = "3000"
pnpm start:production
```

Open `http://localhost:3000`, verify `GET /health`, employee and analytics APIs, and a direct route such as `http://localhost:3000/employees/seed-employee-000001`. Stop the process with Ctrl+C; Fastify and Prisma close gracefully on SIGINT/SIGTERM.

Deployment failures should be diagnosed in this order: confirm the persistent disk is attached at `/var/data`, confirm `DATABASE_URL` uses that absolute path, inspect migration output before the server start, and verify the initial seed hook completed. Do not fix a failed normal deployment by running `db:reset` or by rerunning the destructive seed against reviewer data.

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
