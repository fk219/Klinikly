import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 }
  },
  webServer: [
    {
      command: 'npx tsx e2e/server.ts',
      url: 'http://127.0.0.1:3102/health/ready',
      timeout: 180_000,
      reuseExistingServer: false
    },
    {
      command: 'npm --workspace apps/web run dev -- --host 127.0.0.1 --port 5176 --strictPort',
      url: 'http://localhost:5176',
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://127.0.0.1:3102' }
    }
  ]
});
