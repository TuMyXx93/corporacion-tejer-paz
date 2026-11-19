import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || '3015';
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const managesWebServer = !process.env.BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  ...(managesWebServer
    ? {
        webServer: {
          command: `pnpm exec next start -p ${PORT}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }
    : {}),
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
});
