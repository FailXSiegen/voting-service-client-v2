// Eigene Config: kein Dev-Server, ein Worker (afterAll sammelt die Meldungen aller Tests)
try {
  process.loadEnvFile(require('path').join(__dirname, '.env'));
} catch {
  /* ohne .env laufen nur die öffentlichen Seiten */
}

module.exports = {
  testDir: __dirname,
  workers: 1,
  reporter: 'list',
  use: { headless: true },
  outputDir: '../../test-results/csp',
};
