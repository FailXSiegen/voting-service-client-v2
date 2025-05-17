// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: false,
  workers: undefined,
  reporter: 'html',
  timeout: 300000, // 5 minutes timeout for load tests

  use: {
    baseURL: 'http://192.168.178.142:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Define the pattern for test files
  testMatch: '**/*.spec.js',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});