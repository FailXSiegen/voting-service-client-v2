// playwright-pipeline.config.js
// Optimierte Playwright-Konfiguration für GitLab Runner

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // WICHTIG: Begrenzte Worker für Pipeline
  workers: 1,  // Nur 1 Worker-Prozess!
  fullyParallel: false,  // Keine parallelen Tests
  
  // Retries und Timeouts
  retries: 1,
  timeout: 600000, // 10 Minuten pro Test
  
  // Globale Test-Konfiguration
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://voting.failx.de',
    
    // Minimale Trace/Video für Ressourcen-Schonung
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    
    // Headless ist Pflicht in Pipeline
    headless: true,
    
    // Browser-Optionen für Container
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--single-process',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--js-flags="--max-old-space-size=256"',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled'
      ],
      
      // Keine SlowMo in Pipeline
      slowMo: 0,
      
      // Chrome-spezifische Flags
      chromiumSandbox: false,
    },
    
    // Kleinerer Viewport
    viewport: { width: 640, height: 480 },
    
    // Context-Optionen
    contextOptions: {
      reducedMotion: 'reduce',
      forcedColors: 'none',
      // Keine Permissions
      permissions: [],
      // Kein WebGL
      ignoreHTTPSErrors: true,
    },
    
    // Navigation Timeouts
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  // Reporter für Pipeline
  reporter: [
    ['list'],  // Einfache Konsolen-Ausgabe
    ['junit', { outputFile: 'test-results/junit.xml' }],  // Für GitLab
    ['html', { open: 'never' }],  // HTML aber nicht öffnen
  ],

  // Output-Verzeichnisse
  outputDir: 'test-results',
  
  // Nur Chromium für geringere Ressourcen
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Überschreibe Device-Settings
        viewport: { width: 640, height: 480 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
    },
  ],

  // Globale Setup/Teardown
  globalSetup: require.resolve('./tests/lib/global-setup-pipeline.js'),
  globalTeardown: require.resolve('./tests/lib/global-teardown-pipeline.js'),
});