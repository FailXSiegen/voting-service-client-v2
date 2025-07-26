// load-test-stress.spec.js
// Stress-Test mit 200 Nutzern - Maximallast-Szenario
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Importiere die Module
const { CONFIG } = require('../lib/config');
const {
  sleep,
  cleanupResultsDirectory,
  writeResults,
  getTestUserId,
  getDisplayName,
  ensureScreenshotsDirectory
} = require('../lib/utils');
const { loginAsOrganizer, createAndStartPoll } = require('../lib/loginOrganizer');
const { loginAsUser } = require('../lib/loginUser');
const { executeVotingInBatches } = require('../lib/votingFunctions');

// Konfiguration für Stress-Test überschreiben
const STRESS_CONFIG = {
  ...CONFIG,
  MAX_USERS_PER_TEST: 200,      // Doppelte Anzahl für Stress-Test
  USERS_PER_BATCH: 100,          // Größere Batches
  VOTE_BATCH_SIZE: 100,          // Mehr gleichzeitige Abstimmungen
  CONCURRENT_LOGINS: 50,         // Mehr gleichzeitige Logins
  BATCH_VOTE_DELAY: 200,         // Kürzere Verzögerung
  VOTING_DELAY: 500,             // Kürzere Wartezeit
  CHECK_INTERVAL: 200,           // Schnelleres Polling
  USER_READY_PERCENTAGE: 95,     // Akzeptiere 95% statt 100%
};

test.describe('Stress-Test mit 200 Benutzern', () => {
  test.beforeAll(async () => {
    console.log('=== STRESS TEST SETUP: Lösche alle alten Ergebnisdateien ===');
    cleanupResultsDirectory();
    console.log('=== STRESS TEST mit 200 Nutzern wird vorbereitet ===');
  });

  // Organizer startet die Abstimmung
  test('Organizer erstellt Abstimmung für Stress-Test', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Stress-Test Organizer: Starte Login...");
      const loginSuccess = await loginAsOrganizer(page);
      expect(loginSuccess).toBeTruthy();

      writeResults('stress-organizer-ready', {
        organizerReady: true,
        timestamp: new Date().toISOString(),
        testType: 'stress',
        expectedUsers: STRESS_CONFIG.MAX_USERS_PER_TEST
      });

      // Warte auf 95% der Nutzer (Stress-Test toleriert Ausfälle)
      console.log(`Stress-Test: Warte auf mindestens ${STRESS_CONFIG.USER_READY_PERCENTAGE}% der Nutzer...`);
      
      const maxWaitTime = 300000; // 5 Minuten für 200 Nutzer
      const startTime = Date.now();
      let usersReady = false;
      let lastUserCount = 0;

      while (!usersReady && (Date.now() - startTime) < maxWaitTime) {
        const resultsDir = path.join(process.cwd(), 'voting-results');
        let totalUsers = 0;

        try {
          const files = fs.readdirSync(resultsDir);
          for (const file of files) {
            if (file.startsWith('stress-batch-') && file.endsWith('-ready.json')) {
              const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file)));
              totalUsers += data.usersLoggedIn || 0;
            }
          }
        } catch (e) {
          console.error("Stress-Test: Fehler beim Prüfen der Nutzer:", e);
        }

        const readyPercentage = (totalUsers / STRESS_CONFIG.MAX_USERS_PER_TEST) * 100;
        
        if (totalUsers !== lastUserCount) {
          console.log(`Stress-Test: ${totalUsers}/${STRESS_CONFIG.MAX_USERS_PER_TEST} Nutzer bereit (${readyPercentage.toFixed(1)}%)`);
          lastUserCount = totalUsers;
        }

        if (readyPercentage >= STRESS_CONFIG.USER_READY_PERCENTAGE) {
          usersReady = true;
          console.log(`Stress-Test: ${readyPercentage.toFixed(1)}% der Nutzer sind bereit - fahre fort!`);
        }

        await page.waitForTimeout(2000);
      }

      // Erstelle und starte die Abstimmung
      console.log("Stress-Test: Erstelle Abstimmung unter Maximallast...");
      const pollStarted = await createAndStartPoll(page);
      expect(pollStarted).toBeTruthy();

      writeResults('stress-organizer', {
        pollStarted: true,
        timestamp: new Date().toISOString(),
        usersAtStart: lastUserCount
      });

      // Bleibe online für die Dauer des Tests
      console.log("Stress-Test: Überwache System unter Last...");
      await page.waitForTimeout(STRESS_CONFIG.ORGANIZER_TOTAL_WAIT_TIME);

    } catch (error) {
      console.error("Stress-Test Organizer Fehler:", error);
      throw error;
    } finally {
      await context.close();
    }
  });

  // 2 parallele Batches mit je 100 Nutzern
  for (let batchId = 1; batchId <= 2; batchId++) {
    test(`Stress-Test Batch ${batchId} (100 Nutzer)`, async ({ browser }) => {
      const userContexts = [];
      const userPages = [];
      const votingTimings = [];
      const loginTimings = [];

      try {
        // Gestaffelte Starts für die Batches
        await sleep(2000 * batchId);

        console.log(`[Stress Batch ${batchId}] Starte aggressive Login-Welle...`);
        
        const loginStartTime = Date.now();
        const loginPromises = [];

        // Aggressive Login-Strategie
        for (let i = 0; i < STRESS_CONFIG.USERS_PER_BATCH; i += STRESS_CONFIG.CONCURRENT_LOGINS) {
          const concurrentPromises = [];

          for (let j = 0; j < STRESS_CONFIG.CONCURRENT_LOGINS && i + j < STRESS_CONFIG.USERS_PER_BATCH; j++) {
            const userOffset = i + j + 1;
            const username = getTestUserId(batchId, userOffset);
            const displayName = getDisplayName(batchId, userOffset);
            const userId = ((batchId - 1) * STRESS_CONFIG.USERS_PER_BATCH) + userOffset;

            concurrentPromises.push((async () => {
              const userLoginStart = Date.now();
              
              try {
                const context = await browser.newContext({
                  // Reduzierte Ressourcen für Stress-Test
                  viewport: { width: 640, height: 480 },
                  reducedMotion: 'reduce',
                  deviceScaleFactor: 1
                });
                const page = await context.newPage();

                userContexts.push(context);
                
                const loginSuccess = await loginAsUser(page, username, CONFIG.USER_PASSWORD, displayName);
                const loginTime = Date.now() - userLoginStart;
                
                loginTimings.push({
                  user: userId,
                  loginTime,
                  success: loginSuccess
                });

                if (loginSuccess) {
                  userPages.push({
                    page,
                    userIndex: userId,
                    username
                  });
                }

                return loginSuccess;
              } catch (error) {
                console.error(`[Stress Batch ${batchId}] Login-Fehler für ${username}:`, error.message);
                loginTimings.push({
                  user: userId,
                  loginTime: Date.now() - userLoginStart,
                  success: false,
                  error: error.message
                });
                return false;
              }
            })());
          }

          // Warte auf aktuelle Gruppe
          await Promise.all(concurrentPromises);
          
          // Minimale Pause zwischen Gruppen
          if (i + STRESS_CONFIG.CONCURRENT_LOGINS < STRESS_CONFIG.USERS_PER_BATCH) {
            await sleep(100); // Nur 100ms Pause im Stress-Test
          }
        }

        const totalLoginTime = Date.now() - loginStartTime;
        const successfulLogins = userPages.length;
        const failedLogins = STRESS_CONFIG.USERS_PER_BATCH - successfulLogins;

        console.log(`[Stress Batch ${batchId}] Login-Phase abgeschlossen:`);
        console.log(`  - Erfolgreiche Logins: ${successfulLogins}`);
        console.log(`  - Fehlgeschlagene Logins: ${failedLogins}`);
        console.log(`  - Gesamtzeit: ${(totalLoginTime / 1000).toFixed(2)}s`);
        console.log(`  - Durchschnitt pro Login: ${(totalLoginTime / STRESS_CONFIG.USERS_PER_BATCH).toFixed(0)}ms`);

        writeResults(`stress-batch-${batchId}-ready`, {
          batchId,
          usersLoggedIn: successfulLogins,
          failedLogins,
          loginTimings: loginTimings.slice(0, 10), // Erste 10 für Analyse
          totalLoginTime,
          timestamp: new Date().toISOString(),
          batchComplete: true
        });

        // Warte auf Abstimmungsstart
        console.log(`[Stress Batch ${batchId}] Warte auf Abstimmung...`);
        await sleep(10000);

        // Aggressive Abstimmung
        console.log(`[Stress Batch ${batchId}] Starte Massen-Abstimmung...`);
        const votingStartTime = Date.now();
        
        const successfulVotes = await executeVotingInBatches(
          userPages, 
          votingTimings,
          STRESS_CONFIG.VOTE_BATCH_SIZE
        );

        const totalVotingTime = Date.now() - votingStartTime;

        console.log(`[Stress Batch ${batchId}] Abstimmung abgeschlossen:`);
        console.log(`  - Erfolgreiche Abstimmungen: ${successfulVotes}`);
        console.log(`  - Fehlgeschlagene Abstimmungen: ${userPages.length - successfulVotes}`);
        console.log(`  - Gesamtzeit: ${(totalVotingTime / 1000).toFixed(2)}s`);

        // Ergebnisse speichern
        writeResults(`stress-batch-${batchId}`, {
          batchId,
          totalUsers: userPages.length,
          successfulVotes,
          failedVotes: userPages.length - successfulVotes,
          votingTimings: votingTimings.slice(0, 10),
          totalVotingTime,
          performance: {
            avgLoginTime: loginTimings.reduce((a, b) => a + b.loginTime, 0) / loginTimings.length,
            avgVotingTime: votingTimings.length > 0 ? 
              votingTimings.reduce((a, b) => a + b.votingTime, 0) / votingTimings.length : 0,
            throughput: {
              loginsPerSecond: (successfulLogins / (totalLoginTime / 1000)).toFixed(2),
              votesPerSecond: (successfulVotes / (totalVotingTime / 1000)).toFixed(2)
            }
          }
        });

        // Kurze Nachbeobachtung
        await sleep(30000);

      } catch (error) {
        console.error(`[Stress Batch ${batchId}] Kritischer Fehler:`, error);
        
        writeResults(`stress-batch-${batchId}-error`, {
          batchId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      } finally {
        // Cleanup
        console.log(`[Stress Batch ${batchId}] Räume auf...`);
        for (const context of userContexts) {
          await context.close().catch(() => {});
        }
      }
    });
  }

  // Zusammenfassungs-Test
  test('Stress-Test Ergebnis-Zusammenfassung', async () => {
    await sleep(5000); // Warte kurz auf finale Ergebnisse

    const resultsDir = path.join(process.cwd(), 'voting-results');
    const summary = {
      testType: 'stress',
      timestamp: new Date().toISOString(),
      targetUsers: STRESS_CONFIG.MAX_USERS_PER_TEST,
      results: {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        totalVotes: 0,
        successfulVotes: 0,
        failedVotes: 0
      },
      performance: {
        avgLoginTime: 0,
        avgVotingTime: 0,
        maxConcurrentUsers: 0
      },
      batches: []
    };

    // Sammle Ergebnisse aller Batches
    for (let i = 1; i <= 2; i++) {
      try {
        const batchFile = path.join(resultsDir, `stress-batch-${i}.json`);
        if (fs.existsSync(batchFile)) {
          const batchData = JSON.parse(fs.readFileSync(batchFile));
          summary.batches.push(batchData);
          
          summary.results.totalLogins += batchData.totalUsers;
          summary.results.successfulVotes += batchData.successfulVotes;
          summary.results.failedVotes += batchData.failedVotes || 0;
        }
      } catch (e) {
        console.error(`Fehler beim Lesen von Batch ${i}:`, e);
      }
    }

    // Berechne Durchschnittswerte
    if (summary.batches.length > 0) {
      const avgLoginTimes = summary.batches
        .filter(b => b.performance?.avgLoginTime)
        .map(b => b.performance.avgLoginTime);
      
      if (avgLoginTimes.length > 0) {
        summary.performance.avgLoginTime = 
          avgLoginTimes.reduce((a, b) => a + b, 0) / avgLoginTimes.length;
      }
    }

    writeResults('stress-test-summary', summary);

    console.log('\n=== STRESS-TEST ZUSAMMENFASSUNG ===');
    console.log(`Ziel: ${summary.targetUsers} Nutzer`);
    console.log(`Erreicht: ${summary.results.totalLogins} Logins`);
    console.log(`Erfolgreiche Abstimmungen: ${summary.results.successfulVotes}`);
    console.log(`Durchschnittliche Login-Zeit: ${summary.performance.avgLoginTime.toFixed(0)}ms`);
    console.log('==================================\n');

    // Test gilt als erfolgreich, wenn mindestens 90% abstimmen konnten
    const successRate = (summary.results.successfulVotes / summary.targetUsers) * 100;
    expect(successRate).toBeGreaterThan(90);
  });
});