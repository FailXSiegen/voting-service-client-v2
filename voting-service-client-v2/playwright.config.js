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
    trace: 'on-first-retry',  // Only collect trace on retry to save space
    video: 'retain-on-failure', // Only keep videos for failed tests
    screenshot: 'only-on-failure',
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--js-flags="--max-old-space-size=4096"'
      ],
      slowMo: 500, // Add small delays to improve stability
    },
    contextOptions: {
      reducedMotion: 'reduce',
      forcedColors: 'none',
      viewport: { width: 800, height: 600 }  // Smaller viewport = less memory
    }
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