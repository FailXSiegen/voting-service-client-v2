// global-teardown-pipeline.js
// Cleanup nach Pipeline-Tests

const fs = require('fs');
const path = require('path');
const ResultFormatter = require('./resultFormatter');

module.exports = async config => {
  console.log('\n=== PIPELINE TEST TEARDOWN ===');
  
  try {
    // Formatiere Ergebnisse
    console.log('Formatiere Test-Ergebnisse...');
    const formatter = new ResultFormatter();
    await formatter.formatAllResults();
    
    // Zeige Zusammenfassung
    const summaryPath = path.join(process.cwd(), 'test-reports', 'summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath));
      
      console.log('\n📊 TEST-ZUSAMMENFASSUNG:');
      console.log(`✅ Erfolgreiche Tests: ${summary.successfulTests}`);
      console.log(`❌ Fehlgeschlagene Tests: ${summary.failedTests}`);
      console.log(`👥 Getestete Nutzer: ${summary.overallMetrics.totalUsers}`);
      console.log(`🗳️  Erfolgreiche Abstimmungen: ${summary.overallMetrics.successfulVotes}`);
    }
    
    // Cleanup temporäre Dateien
    const tempFiles = [
      'test-config.json',
      'global-vote-status.json'
    ];
    
    tempFiles.forEach(file => {
      const filePath = path.join(process.cwd(), 'voting-results', file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    // Speicher-Info
    const os = require('os');
    console.log('\nSystem-Status nach Tests:');
    console.log(`- Freier RAM: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`);
    
    console.log('\n=== TEARDOWN ABGESCHLOSSEN ===');
    
  } catch (error) {
    console.error('Fehler im Teardown:', error);
  }
};