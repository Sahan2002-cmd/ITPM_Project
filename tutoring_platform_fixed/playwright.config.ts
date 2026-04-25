import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    screenshot: 'on',
    video: 'retain-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['html', { open: 'always' }]],
});