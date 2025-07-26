// global-setup-pipeline.js
// Globales Setup für Pipeline-Tests

const fs = require('fs');
const path = require('path');

module.exports = async config => {
  console.log('=== PIPELINE TEST SETUP ===');
  
  // Umgebungsvariablen prüfen
  console.log('Test-Umgebung:', {
    url: process.env.TEST_BASE_URL || 'nicht gesetzt',
    eventSlug: process.env.TEST_EVENT_SLUG || 'nicht gesetzt',
    workers: config.workers,
    timeout: config.use.timeout,
  });
  
  // Erstelle notwendige Verzeichnisse
  const dirs = ['voting-results', 'test-results', 'test-reports'];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Verzeichnis erstellt: ${dir}`);
    }
  });
  
  // Ressourcen-Check
  const os = require('os');
  console.log('System-Ressourcen:');
  console.log(`- CPUs: ${os.cpus().length}`);
  console.log(`- RAM: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  console.log(`- Freier RAM: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`);
  
  // Warnung bei zu wenig Ressourcen
  const freeMemGB = os.freemem() / 1024 / 1024 / 1024;
  if (freeMemGB < 2) {
    console.warn('⚠️  WARNUNG: Weniger als 2GB RAM verfügbar!');
    console.warn('    Tests könnten fehlschlagen oder langsam sein.');
  }
  
  // Playwright-Version ausgeben
  const { chromium } = require('@playwright/test');
  console.log(`Playwright Version: ${chromium._version || 'unbekannt'}`);
  
  // Cleanup alte Ergebnisse
  const resultsDir = path.join(process.cwd(), 'voting-results');
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(resultsDir, file));
      }
    });
    console.log(`${files.length} alte Ergebnis-Dateien gelöscht`);
  }
  
  // Erstelle Konfigurations-Info
  const configInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.TEST_BASE_URL || 'local',
    maxBrowsers: process.env.MAX_BROWSERS || 3,
    testMode: 'pipeline',
    resourceLimits: {
      maxMemoryMB: 512,
      maxCPUPercent: 80
    }
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'voting-results', 'test-config.json'),
    JSON.stringify(configInfo, null, 2)
  );
  
  console.log('=== SETUP ABGESCHLOSSEN ===\n');
};