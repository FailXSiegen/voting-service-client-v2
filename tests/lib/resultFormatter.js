// resultFormatter.js
// Formatiert und konsolidiert Test-Ergebnisse für Pipeline-Artefakte

const fs = require('fs');
const path = require('path');

class ResultFormatter {
  constructor(resultsDir = 'voting-results') {
    this.resultsDir = path.join(process.cwd(), resultsDir);
    this.outputDir = path.join(process.cwd(), 'test-reports');
  }

  // Hauptfunktion zum Formatieren aller Ergebnisse
  async formatAllResults() {
    console.log('Formatiere Test-Ergebnisse...');
    
    // Stelle sicher, dass Output-Verzeichnis existiert
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    try {
      // Sammle alle Ergebnis-Dateien
      const resultFiles = this.collectResultFiles();
      
      // Generiere verschiedene Report-Formate
      const summary = await this.generateSummaryReport(resultFiles);
      const performance = await this.generatePerformanceReport(resultFiles);
      const errors = await this.generateErrorReport(resultFiles);
      const timeline = await this.generateTimelineReport(resultFiles);
      
      // Generiere HTML-Report
      await this.generateHTMLReport({
        summary,
        performance,
        errors,
        timeline
      });
      
      // Generiere CSV-Exporte
      await this.generateCSVExports(resultFiles);
      
      // Generiere JUnit XML für GitLab
      await this.generateJUnitXML(resultFiles);
      
      console.log('✅ Alle Reports erfolgreich generiert!');
      
      return {
        summary,
        performance,
        errors,
        reportPath: this.outputDir
      };
      
    } catch (error) {
      console.error('Fehler beim Formatieren der Ergebnisse:', error);
      throw error;
    }
  }

  // Sammle alle Ergebnis-Dateien
  collectResultFiles() {
    const files = fs.readdirSync(this.resultsDir);
    const results = {};
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const content = JSON.parse(
            fs.readFileSync(path.join(this.resultsDir, file), 'utf8')
          );
          results[file.replace('.json', '')] = content;
        } catch (e) {
          console.error(`Fehler beim Lesen von ${file}:`, e);
        }
      }
    });
    
    return results;
  }

  // Generiere Zusammenfassungs-Report
  async generateSummaryReport(results) {
    const summary = {
      testRun: new Date().toISOString(),
      environment: process.env.TEST_BASE_URL || 'unknown',
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      testTypes: [],
      overallMetrics: {
        totalUsers: 0,
        successfulLogins: 0,
        successfulVotes: 0,
        avgLoginTime: 0,
        avgVotingTime: 0
      }
    };

    // Analysiere Ergebnisse
    Object.entries(results).forEach(([key, data]) => {
      if (key.includes('summary')) {
        summary.testTypes.push({
          type: data.testType || 'unknown',
          status: data.results ? 'completed' : 'failed',
          metrics: data.results || {}
        });
        
        if (data.results) {
          summary.totalTests++;
          summary.successfulTests++;
          summary.overallMetrics.totalUsers += data.results.totalLogins || 0;
          summary.overallMetrics.successfulVotes += data.results.successfulVotes || 0;
        }
      }
    });

    // Speichere Summary
    fs.writeFileSync(
      path.join(this.outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    return summary;
  }

  // Generiere Performance-Report
  async generatePerformanceReport(results) {
    const performance = {
      loginTimes: [],
      votingTimes: [],
      throughput: [],
      responseTimeDistribution: {
        login: { p50: 0, p90: 0, p95: 0, p99: 0 },
        voting: { p50: 0, p90: 0, p95: 0, p99: 0 }
      }
    };

    // Sammle alle Timing-Daten
    Object.entries(results).forEach(([key, data]) => {
      if (data.loginTimings) {
        performance.loginTimes.push(...data.loginTimings);
      }
      if (data.votingTimings) {
        performance.votingTimes.push(...data.votingTimings);
      }
      if (data.performance?.throughput) {
        performance.throughput.push({
          test: key,
          ...data.performance.throughput
        });
      }
    });

    // Berechne Perzentile
    if (performance.loginTimes.length > 0) {
      const sorted = performance.loginTimes
        .map(t => t.loginTime || 0)
        .sort((a, b) => a - b);
      
      performance.responseTimeDistribution.login = {
        p50: this.percentile(sorted, 50),
        p90: this.percentile(sorted, 90),
        p95: this.percentile(sorted, 95),
        p99: this.percentile(sorted, 99)
      };
    }

    // Speichere Performance-Daten
    fs.writeFileSync(
      path.join(this.outputDir, 'performance.json'),
      JSON.stringify(performance, null, 2)
    );

    return performance;
  }

  // Generiere Error-Report
  async generateErrorReport(results) {
    const errors = {
      totalErrors: 0,
      errorsByType: {},
      errorDetails: []
    };

    Object.entries(results).forEach(([key, data]) => {
      if (key.includes('error') || data.error) {
        errors.totalErrors++;
        
        const errorType = data.error?.type || 'unknown';
        errors.errorsByType[errorType] = (errors.errorsByType[errorType] || 0) + 1;
        
        errors.errorDetails.push({
          test: key,
          timestamp: data.timestamp,
          error: data.error || data,
          stack: data.stack
        });
      }
    });

    fs.writeFileSync(
      path.join(this.outputDir, 'errors.json'),
      JSON.stringify(errors, null, 2)
    );

    return errors;
  }

  // Generiere Timeline-Report
  async generateTimelineReport(results) {
    const timeline = [];

    Object.entries(results).forEach(([key, data]) => {
      if (data.timestamp) {
        timeline.push({
          time: data.timestamp,
          event: key,
          type: this.getEventType(key),
          details: this.extractTimelineDetails(data)
        });
      }
    });

    // Sortiere nach Zeit
    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    fs.writeFileSync(
      path.join(this.outputDir, 'timeline.json'),
      JSON.stringify(timeline, null, 2)
    );

    return timeline;
  }

  // Generiere HTML-Report
  async generateHTMLReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voting Tool - Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .status-success {
            color: #27ae60;
        }
        .status-failed {
            color: #e74c3c;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        th {
            background: #34495e;
            color: white;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .timeline {
            position: relative;
            padding: 20px 0;
        }
        .timeline-item {
            padding: 10px 20px;
            margin-bottom: 10px;
            background: white;
            border-left: 3px solid #3498db;
            border-radius: 4px;
        }
        .error-item {
            background: #fee;
            border-left-color: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Voting Tool - Load Test Report</h1>
        <p>Generiert am: ${new Date().toLocaleString('de-DE')}</p>
        <p>Test-Umgebung: ${process.env.TEST_BASE_URL || 'Lokal'}</p>
    </div>

    <div class="metric-grid">
        <div class="metric-card">
            <div class="metric-value">${data.summary.overallMetrics.totalUsers}</div>
            <div class="metric-label">Gesamtnutzer</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.summary.overallMetrics.successfulVotes}</div>
            <div class="metric-label">Erfolgreiche Abstimmungen</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.summary.successfulTests}/${data.summary.totalTests}</div>
            <div class="metric-label">Erfolgreiche Tests</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.errors.totalErrors}</div>
            <div class="metric-label">Fehler</div>
        </div>
    </div>

    <div class="metric-card">
        <h2>Performance-Metriken</h2>
        <table>
            <tr>
                <th>Metrik</th>
                <th>P50</th>
                <th>P90</th>
                <th>P95</th>
                <th>P99</th>
            </tr>
            <tr>
                <td>Login-Zeit (ms)</td>
                <td>${data.performance.responseTimeDistribution.login.p50}</td>
                <td>${data.performance.responseTimeDistribution.login.p90}</td>
                <td>${data.performance.responseTimeDistribution.login.p95}</td>
                <td>${data.performance.responseTimeDistribution.login.p99}</td>
            </tr>
            <tr>
                <td>Abstimmungs-Zeit (ms)</td>
                <td>${data.performance.responseTimeDistribution.voting.p50}</td>
                <td>${data.performance.responseTimeDistribution.voting.p90}</td>
                <td>${data.performance.responseTimeDistribution.voting.p95}</td>
                <td>${data.performance.responseTimeDistribution.voting.p99}</td>
            </tr>
        </table>
    </div>

    <div class="metric-card">
        <h2>Test-Timeline</h2>
        <div class="timeline">
            ${data.timeline.slice(0, 20).map(item => `
                <div class="timeline-item ${item.type === 'error' ? 'error-item' : ''}">
                    <strong>${new Date(item.time).toLocaleTimeString('de-DE')}</strong> - 
                    ${item.event}: ${item.details}
                </div>
            `).join('')}
        </div>
    </div>

    ${data.errors.totalErrors > 0 ? `
    <div class="metric-card">
        <h2>Fehlerübersicht</h2>
        <table>
            <tr>
                <th>Zeit</th>
                <th>Test</th>
                <th>Fehler</th>
            </tr>
            ${data.errors.errorDetails.slice(0, 10).map(error => `
                <tr>
                    <td>${new Date(error.timestamp).toLocaleTimeString('de-DE')}</td>
                    <td>${error.test}</td>
                    <td>${error.error.message || error.error}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}
</body>
</html>
    `;

    fs.writeFileSync(
      path.join(this.outputDir, 'report.html'),
      html
    );
  }

  // Generiere CSV-Exporte
  async generateCSVExports(results) {
    // Login-Zeiten CSV
    const loginData = [];
    Object.entries(results).forEach(([key, data]) => {
      if (data.loginTimings) {
        data.loginTimings.forEach(timing => {
          loginData.push({
            test: key,
            user: timing.user,
            loginTime: timing.loginTime,
            success: timing.success
          });
        });
      }
    });

    if (loginData.length > 0) {
      const loginCSV = this.arrayToCSV(loginData);
      fs.writeFileSync(
        path.join(this.outputDir, 'login-times.csv'),
        loginCSV
      );
    }

    // Voting-Zeiten CSV
    const votingData = [];
    Object.entries(results).forEach(([key, data]) => {
      if (data.votingTimings) {
        data.votingTimings.forEach(timing => {
          votingData.push({
            test: key,
            user: timing.user,
            votingTime: timing.votingTime,
            success: timing.success !== false
          });
        });
      }
    });

    if (votingData.length > 0) {
      const votingCSV = this.arrayToCSV(votingData);
      fs.writeFileSync(
        path.join(this.outputDir, 'voting-times.csv'),
        votingCSV
      );
    }
  }

  // Generiere JUnit XML für GitLab
  async generateJUnitXML(results) {
    const testSuites = [];
    
    Object.entries(results).forEach(([key, data]) => {
      if (key.includes('summary') && data.testType) {
        const suite = {
          name: `Load Test - ${data.testType}`,
          tests: data.results ? 1 : 0,
          failures: data.results ? 0 : 1,
          time: 0,
          testCases: []
        };

        if (data.results) {
          suite.testCases.push({
            name: `${data.testType} - Vote Success Rate`,
            time: 0,
            status: 'passed'
          });
        } else {
          suite.testCases.push({
            name: `${data.testType} - Test Execution`,
            time: 0,
            status: 'failed',
            error: 'Test did not complete successfully'
          });
        }

        testSuites.push(suite);
      }
    });

    const xml = this.generateJUnitXMLString(testSuites);
    fs.writeFileSync(
      path.join(this.outputDir, 'junit.xml'),
      xml
    );
  }

  // Hilfsfunktionen
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index] || 0;
  }

  getEventType(key) {
    if (key.includes('error')) return 'error';
    if (key.includes('ready')) return 'ready';
    if (key.includes('summary')) return 'summary';
    if (key.includes('vote')) return 'vote';
    return 'info';
  }

  extractTimelineDetails(data) {
    if (data.usersLoggedIn) return `${data.usersLoggedIn} Nutzer eingeloggt`;
    if (data.successfulVotes) return `${data.successfulVotes} erfolgreiche Abstimmungen`;
    if (data.error) return `Fehler: ${data.error.message || data.error}`;
    if (data.pollStarted) return 'Abstimmung gestartet';
    return 'Event aufgezeichnet';
  }

  arrayToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ];
    
    return csv.join('\n');
  }

  generateJUnitXMLString(testSuites) {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests, 0);
    const totalFailures = testSuites.reduce((sum, suite) => sum + suite.failures, 0);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites tests="${totalTests}" failures="${totalFailures}">\n`;
    
    testSuites.forEach(suite => {
      xml += `  <testsuite name="${suite.name}" tests="${suite.tests}" failures="${suite.failures}">\n`;
      
      suite.testCases.forEach(testCase => {
        xml += `    <testcase name="${testCase.name}" time="${testCase.time}"`;
        
        if (testCase.status === 'failed') {
          xml += `>\n      <failure message="${testCase.error}"/>\n    </testcase>\n`;
        } else {
          xml += `/>\n`;
        }
      });
      
      xml += `  </testsuite>\n`;
    });
    
    xml += `</testsuites>`;
    
    return xml;
  }
}

// Export für Verwendung in Tests
module.exports = ResultFormatter;

// Wenn direkt ausgeführt, formatiere Ergebnisse
if (require.main === module) {
  const formatter = new ResultFormatter();
  formatter.formatAllResults()
    .then(() => console.log('Fertig!'))
    .catch(error => {
      console.error('Fehler:', error);
      process.exit(1);
    });
}