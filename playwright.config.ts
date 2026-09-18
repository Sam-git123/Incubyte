import { defineConfig, devices } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3000';
const webUrl = 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: webUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'cross-env DATABASE_URL=file:./e2e.db PORT=3000 corepack pnpm --filter @acme/api exec tsx src/server.ts',
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'corepack pnpm --filter @acme/web exec vite --host 127.0.0.1 --port 5173',
      url: webUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
