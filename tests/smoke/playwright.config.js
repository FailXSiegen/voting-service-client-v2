// Eigene Config, damit der Smoke-Test keinen lokalen Dev-Server startet
module.exports = {
  testDir: __dirname,
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: { headless: true, screenshot: 'only-on-failure' },
  outputDir: '../../test-results/smoke',
};
