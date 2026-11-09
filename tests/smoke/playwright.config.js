// Eigene Config, damit der Smoke-Test keinen lokalen Dev-Server startet
// SMOKE_ORG_USER/SMOKE_ORG_PASS aus tests/smoke/.env (gitignored, chmod 600), falls vorhanden
try {
  process.loadEnvFile(require('path').join(__dirname, '.env'));
} catch {
  /* ohne .env wird der Organizer-Test übersprungen */
}

module.exports = {
  testDir: __dirname,
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: { headless: true, screenshot: 'only-on-failure' },
  outputDir: '../../test-results/smoke',
};
