// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: false,
  workers: 2, // Limit concurrent test workers
  reporter: 'html',
  timeout: 3600000, // 60 minutes timeout for load tests
  expect: {
    timeout: 30000, // 30 seconds for individual actions
  },

  use: {
    baseURL: 'https://voting.failx.de',
    trace: 'on-first-retry',  // Only collect trace on retry to save space
    video: 'retain-on-failure', // Only keep videos for failed tests
    screenshot: 'only-on-failure',
    navigationTimeout: 120000, // 2 minutes for navigation
    actionTimeout: 60000, // 1 minute for actions
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--js-flags="--max-old-space-size=4096"',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--no-first-run',
        '--disable-web-security',
        '--aggressive-cache-discard',
        '--disable-ipc-flooding-protection'
      ],
      slowMo: 0, // No delay at all
      headless: false, // Show browsers to keep them alive
    },
    contextOptions: {
      reducedMotion: 'reduce',
      forcedColors: 'none',
      viewport: { width: 800, height: 600 },  // Smaller viewport = less memory
      ignoreHTTPSErrors: true,
      acceptDownloads: false,
      locale: 'de-DE'
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