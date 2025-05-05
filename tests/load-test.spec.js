// load-test.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Importiere die Module
const { CONFIG } = require('./config');
const {
  sleep,
  cleanupResultsDirectory,
  writeResults,
  getTestUserId,
  getDisplayName,
  ensureScreenshotsDirectory
} = require('./utils');
const { loginAsOrganizer, createAndStartPoll } = require('./loginOrganizer');
const { loginAsUser } = require('./loginUser');
const { executeVotingInBatches } = require('./votingFunctions');

// Haupttest-Funktion zum Laden von Benutzern
test.describe('Load testing mit gestaffelten Benutzer-Batches', () => {
  // VOR BEGINN DER TESTS: Lösche alle alten Ergebnisdateien
  test.beforeAll(async () => {
    console.log('=== TEST SETUP: Lösche alle alten Ergebnisdateien ===');
    cleanupResultsDirectory();
    console.log('=== TEST SETUP ABGESCHLOSSEN ===');
  });

  // Organizer startet den Poll erst nachdem die Benutzer eingeloggt sind
  test('Organizer logged ein und erstellt Abstimmung', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Organizer-Test: Versuche Login als Organizer...");
      const loginSuccess = await loginAsOrganizer(page);
      expect(loginSuccess).toBeTruthy();

      // Organizer ist eingeloggt, aber wartet auf die Benutzer-Logins
      console.log("Organizer-Test: Login erfolgreich. Warte bis die Benutzer eingeloggt sind...");

      // Markiere, dass der Organizer bereit ist
      writeResults('organizer-ready', {
        organizerReady: true,
        timestamp: new Date().toISOString()
      });

      // Reduzierte Wartezeit, damit die Benutzer Zeit haben sich einzuloggen
      console.log("Organizer-Test: Warte 20 Sekunden, damit sich alle Benutzer einloggen können...");
      await page.waitForTimeout(20000);

      // Prüfe, ob die User-Batches Dateien erstellt haben, die auf erfolgreiche Logins hindeuten
      console.log("Organizer-Test: Prüfe, ob aktuelle Batch-Dateien da sind...");
      const resultsDir = path.join(process.cwd(), 'voting-results');

      // Überprüfe, welche Dateien vorhanden sind (nur zur Information)
      console.log("Organizer-Test: Vorhandene Dateien:", fs.readdirSync(resultsDir).join(", "));

      let readyBatches = 0;
      let totalBatches = 0;
      let totalUsersLoggedIn = 0;
      // WICHTIG: Wir erwarten genau CONFIG.MAX_USERS_PER_TEST Benutzer
      let targetUserCount = CONFIG.MAX_USERS_PER_TEST;

      // Funktion zum Prüfen der Benutzer-Bereitschaft
      async function checkUserBatchesReady() {
        readyBatches = 0;
        totalBatches = 0;
        totalUsersLoggedIn = 0;

        try {
          const files = fs.readdirSync(resultsDir);
          for (const file of files) {
            if (file.startsWith('user-batch-') && file.endsWith('-ready.json')) {
              totalBatches++;

              // Lese die Datei, um festzustellen, wie viele Benutzer eingeloggt sind
              try {
                const batchData = JSON.parse(fs.readFileSync(path.join(resultsDir, file)));
                if (batchData && batchData.usersLoggedIn) {
                  // Prüfe, ob der Batch als vollständig markiert ist
                  const usersInThisBatch = batchData.usersLoggedIn || 0;
                  const isBatchComplete = batchData.batchComplete === true;

                  totalUsersLoggedIn += usersInThisBatch;
                  console.log(`Organizer-Test: Benutzer-Batch ${file} ist bereit mit ${usersInThisBatch} eingeloggten Benutzern (${isBatchComplete ? 'vollständig' : 'noch unvollständig'}).`);

                  // Nur vollständige Batches als "ready" markieren
                  if (isBatchComplete) {
                    readyBatches++;
                  }
                }
              } catch (readError) {
                console.error(`Organizer-Test: Fehler beim Lesen von ${file}:`, readError);
              }
            }
          }
        } catch (e) {
          console.error("Organizer-Test: Fehler beim Prüfen der Benutzer-Bereitschaft:", e);
        }

        const readyPercentage = totalUsersLoggedIn / targetUserCount * 100;
        console.log(`Organizer-Test: ${totalUsersLoggedIn} von ${targetUserCount} Benutzern sind eingeloggt (${readyPercentage.toFixed(1)}%)`);

        // Nur als bereit melden, wenn alle erwarteten Benutzer eingeloggt sind
        // UND alle erwarteten Batches als vollständig markiert wurden
        const allUsersReady = totalUsersLoggedIn >= targetUserCount;
        const allBatchesComplete = readyBatches === totalBatches && totalBatches > 0;

        console.log(`Organizer-Test: Status - Alle Benutzer bereit: ${allUsersReady}, Alle Batches vollständig: ${allBatchesComplete}, ${readyBatches}/${totalBatches} Batches bereit`);

        return {
          allReady: allUsersReady && allBatchesComplete && readyPercentage >= CONFIG.USER_READY_PERCENTAGE,
          readyPercentage,
          totalBatches,
          readyBatches,
          totalUsersLoggedIn,
          allBatchesComplete
        };
      }

      // Erste Prüfung
      let readyStatus = await checkUserBatchesReady();

      // Warte auf 100% Bereitschaft mit Timeout
      const maxWaitTime = 240000; // 4 Minuten maximale Wartezeit
      const startWaitTime = Date.now();
      // Feste Wartezeit von 5 Sekunden

      while (!readyStatus.allReady && (Date.now() - startWaitTime) < maxWaitTime) {
        console.log(`Organizer-Test: Benutzerbereitschaft bei ${readyStatus.readyPercentage.toFixed(1)}%, warte weitere 5 Sekunden...`);

        await page.waitForTimeout(5000);
        readyStatus = await checkUserBatchesReady();
      }

      if (!readyStatus.allReady) {
        console.warn(`Organizer-Test: WARNUNG - Nach ${maxWaitTime / 1000} Sekunden sind nur ${readyStatus.readyPercentage.toFixed(1)}% der Benutzer bereit.`);
        console.warn(`Organizer-Test: Warte weiter, bis ALLE Benutzer (100%) eingeloggt sind...`);

        // Mache einen Screenshot zur Fehleranalyse
        const screenshotsDir = ensureScreenshotsDirectory();
        await page.screenshot({
          path: path.join(screenshotsDir, `timeout-waiting-for-users-${Math.floor(readyStatus.readyPercentage)}-percent.png`)
        });

        if (readyStatus.totalUsersLoggedIn === 0) {
          throw new Error("Keine Benutzer haben sich eingeloggt. Test kann nicht fortgesetzt werden.");
        }

        // Warte UNBEGRENZT, bis wir 100% der Benutzer haben
        // Der Test wird AUSSCHLIESSLICH fortgesetzt, wenn alle Benutzer erfolgreich eingeloggt sind
        console.log(`Organizer-Test: Warte unbegrenzt, bis ALLE ${CONFIG.MAX_USERS_PER_TEST} Benutzer (100%) eingeloggt sind...`);
        
        const loginStartTime = Date.now();
        let loginElapsedMinutes = 0;
        
        while (!readyStatus.allReady) {
          // Zeige jede Minute einen ausführlichen Statusbericht an
          const currentElapsedMinutes = Math.floor((Date.now() - loginStartTime) / 60000);
          
          if (currentElapsedMinutes > loginElapsedMinutes) {
            loginElapsedMinutes = currentElapsedMinutes;
            console.log(`Organizer-Test: STATUSBERICHT NACH ${loginElapsedMinutes} MINUTEN:`);
            console.log(`  - ${readyStatus.totalUsersLoggedIn} von ${CONFIG.MAX_USERS_PER_TEST} Benutzern sind eingeloggt (${readyStatus.readyPercentage.toFixed(1)}%)`);
            console.log(`  - ${readyStatus.readyBatches} von ${readyStatus.totalBatches} Batches sind vollständig`);
            console.log(`  - Wartend auf fehlende ${CONFIG.MAX_USERS_PER_TEST - readyStatus.totalUsersLoggedIn} Benutzer...`);
          }
          
          console.log(`Organizer-Test: Benutzerbereitschaft bei ${readyStatus.readyPercentage.toFixed(1)}%, ${readyStatus.totalUsersLoggedIn}/${CONFIG.MAX_USERS_PER_TEST} Benutzer... (Warte 5 Sekunden)`);
          await page.waitForTimeout(5000);
          readyStatus = await checkUserBatchesReady();
        }

        console.log(`Organizer-Test: Alle Benutzer (100%) sind nach verlängerter Wartezeit erfolgreich eingeloggt.`);
      } else {
        console.log(`Organizer-Test: Alle Benutzer (100%) sind erfolgreich eingeloggt. Fahre mit dem Test fort.`);
      }

      // Erstelle und starte den Poll
      console.log("Organizer-Test: Starte Erstellung und Aktivierung des Polls...");
      const pollStarted = await createAndStartPoll(page);
      expect(pollStarted).toBeTruthy();

      // Verifiziere, dass der Poll wirklich aktiv ist
      console.log("Organizer-Test: Verifiziere, dass der Poll aktiv ist...");
      // Prüfe, ob aktiver Poll auf der Seite angezeigt wird
      const isActivePollVisible = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

      if (!isActivePollVisible) {
        console.warn("Organizer-Test: WARNUNG - Konnte keine aktive Abstimmung auf der Organizer-Seite sehen!");

        // Versuche, die Seite neu zu laden
        console.log("Organizer-Test: Lade die Seite neu für erneute Verifizierung...");
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Erneute Prüfung nach dem Reload
        const activePollAfterReload = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

        if (activePollAfterReload) {
          console.log("Organizer-Test: Aktive Abstimmung nach Reload gefunden!");
        } else {
          console.error("Organizer-Test: FEHLER - Keine aktive Abstimmung erkennbar. Test könnte fehlschlagen!");
        }
      } else {
        console.log("Organizer-Test: Aktive Abstimmung erfolgreich verifiziert!");
      }

      // Warten, damit der Poll überall ankommen kann
      console.log(`Organizer-Test: Warte ${CONFIG.VOTING_DELAY}ms, damit der Poll alle Teilnehmer erreichen kann...`);
      await page.waitForTimeout(CONFIG.VOTING_DELAY);

      // Speichere im Dateisystem, dass der Poll gestartet wurde
      console.log("Organizer-Test: Markiere den Poll als gestartet und speichere Ergebnis...");
      writeResults('organizer', {
        pollStarted: true,
        timestamp: new Date().toISOString(),
        pollVisible: isActivePollVisible
      });

      // Bleib für eine längere Dauer des Tests online
      console.log("Organizer-Test: Bleibe online für die Dauer des Tests...");
      
      // Berechnung der Gesamtdauer basierend auf der Benutzeranzahl
      const testDurationMinutes = 10; // Feste Testdauer von 10 Minuten
      const estimatedTime = testDurationMinutes * 60 * 1000;
      
      console.log(`Organizer-Test: Bleibe online für ${testDurationMinutes} Minuten...`);
      
      // Wartezeit mit Status-Updates
      const startTime = Date.now();
      let elapsedTime = 0;
      
      while (elapsedTime < estimatedTime) {
          await page.waitForTimeout(10000); // Alle 10 Sekunden Status ausgeben
          elapsedTime = Date.now() - startTime;
          const remainingSeconds = Math.round((estimatedTime - elapsedTime) / 1000);
          
          console.log(`Organizer-Test: Noch ${remainingSeconds} Sekunden aktiv bleiben...`);
          
          // Kleine Interaktion, um den Browser aktiv zu halten
          try {
              await page.evaluate(() => {
                  window.scrollBy(0, 10);
                  window.scrollBy(0, -10);
              });
          } catch (e) {
              // Ignoriere Fehler
          }
      }
      
      console.log("Organizer-Test: Wartezeit abgelaufen, beende Test...");
    } catch (error) {
      console.error("Organizer-Test: Fehler im Organizer-Test:", error.message);
      throw error; // Re-throw to fail the test
    } finally {
      await context.close();
    }
  });

  // Parallele Tests für die Benutzer (3 parallele Tests mit je 50 Benutzern = 150 insgesamt)
  for (let testId = 1; testId <= 3; testId++) {
    test(`User batch ${testId} votes in poll`, async ({ browser }) => {
      const userContexts = [];
      const userPages = [];
      const votingTimings = [];

      try {
        // Warteschleife, um sicherzustellen, dass der Organisator zuerst eingeloggt ist
        // und um die Logins über Zeit zu verteilen (vermeidet DB-Überlastung)
        await new Promise(r => setTimeout(r, 5000 * testId)); // Staffelung der Tests

        // Benutzer in diesem Batch einloggen
        console.log(`[Test ${testId}] Starte Login für Benutzer-Batch...`);

        const loginPromises = [];

        // Benutzer pro Batch aus Konfiguration
        const usersPerBatch = CONFIG.USERS_PER_BATCH;
        const concurrentLogins = CONFIG.CONCURRENT_LOGINS;
        
        console.log(`[Test ${testId}] Login-Gruppen: ${usersPerBatch} Benutzer, ${concurrentLogins} gleichzeitig`);

        for (let batchOffset = 0; batchOffset < usersPerBatch; batchOffset += concurrentLogins) {
          // Benutzer parallel anmelden
          const batchPromises = [];

          for (let j = 0; j < concurrentLogins && batchOffset + j < usersPerBatch; j++) {
            const userOffset = batchOffset + j + 1;

            batchPromises.push((async () => {
              // Hier die korrigierte Berechnung mit der Funktion aus utils.js
              const username = getTestUserId(testId, userOffset);
              const displayName = getDisplayName(testId, userOffset);
              const userId = ((testId - 1) * usersPerBatch) + userOffset;

              console.log(`[Test ${testId}] Bereite Login vor für: ${username} (${displayName})`);

              // Zusätzliches leichtes Staffeln innerhalb der Gruppe
              await sleep(j * 50); // 50ms zwischen den Logins innerhalb einer Gruppe

              const context = await browser.newContext();
              const page = await context.newPage();

              userContexts.push(context);
              userPages.push({
                page,
                userIndex: userId,
                username
              });

              return await loginAsUser(page, username, CONFIG.USER_PASSWORD, displayName);
            })());
          }

          // Warte auf die aktuelle Gruppe, bevor die nächste gestartet wird
          const batchResults = await Promise.all(batchPromises);
          loginPromises.push(...batchResults);

          // Kurze Pause zwischen den Gruppen, um die Datenbank zu entlasten
          if (batchOffset + concurrentLogins < usersPerBatch) {
            const staggerDelay = Math.max(500, 2000 - (testId * 250)); // Weniger Wartezeit für spätere Gruppen
            console.log(`[Test ${testId}] Kurze Pause zwischen Login-Gruppen (${staggerDelay}ms)...`);
            await new Promise(r => setTimeout(r, staggerDelay));
          }
        }

        // Auswertung der gesammelten Login-Ergebnisse
        const successfulLogins = loginPromises.filter(r => r).length;
        console.log(`[Test ${testId}] ${successfulLogins} von ${usersPerBatch} Benutzern erfolgreich eingeloggt`);

        // Vergleiche, wie viele Logins wir wirklich haben vs. wie viele wir erwarten
        const actualLoginCount = successfulLogins;
        const expectedLoginCount = usersPerBatch;
        const actualPagesCount = userPages.length;

        console.log(`[Test ${testId}] Login-Status: ${actualLoginCount}/${expectedLoginCount} erfolgreiche Logins, ${actualPagesCount}/${expectedLoginCount} Pages`);

        // Wenn nicht alle erwartet Logins erfolgreich waren, warten wir in einer Schleife
        if (actualLoginCount < expectedLoginCount || actualPagesCount < expectedLoginCount) {
          console.log(`[Test ${testId}] WARNUNG: Nicht alle Benutzer eingeloggt. Warte auf weitere Logins...`);

          // Fester Zeitraum - wir warten 5 Minuten (30*10 = 300 Sekunden), Intervall 10 Sekunden
          for (let waitCounter = 0; waitCounter < 30; waitCounter++) {
            console.log(`[Test ${testId}] Warte (${waitCounter + 1}/30) weitere 10 Sekunden auf Logins...`);
            await new Promise(r => setTimeout(r, 10000));

            // Nach jedem Intervall prüfen, wie viele Pages wir jetzt haben
            console.log(`[Test ${testId}] Nach Warten: ${userPages.length}/${expectedLoginCount} Pages erstellt`);

            // Wenn wir jetzt genug haben, brechen wir die Warteschleife ab
            if (userPages.length >= expectedLoginCount) {
              console.log(`[Test ${testId}] ERFOLG: Alle ${userPages.length} Pages erstellt!`);
              break;
            }
          }
        }

        // STRIKTE Prüfung nach dem Warten - nur wenn wir GENAU die erwartete Anzahl haben,
        // markieren wir den Batch als vollständig
        const finalLoginCount = successfulLogins;
        const finalPagesCount = userPages.length;
        const batchIsComplete = finalPagesCount >= expectedLoginCount;

        console.log(`[Test ${testId}] FINALER STATUS: ${finalLoginCount}/${expectedLoginCount} erfolgreiche Logins, ${finalPagesCount}/${expectedLoginCount} Pages, Batch vollständig: ${batchIsComplete}`);

        // Schreibe den Status
        writeResults(`user-batch-${testId}-ready`, {
          batchId: testId,
          usersLoggedIn: finalPagesCount, // Wir melden die Anzahl der erstellten Pages
          timestamp: new Date().toISOString(),
          // Nur als vollständig melden, wenn wir GENAU die erwartete Anzahl haben
          batchComplete: batchIsComplete
        });

        // Prüfe, ob der Organizer bereits bereit ist
        let organizerReady = false;
        try {
          const resultsDir = path.join(process.cwd(), 'voting-results');
          const organizerReadyFile = path.join(resultsDir, 'organizer-ready.json');
          if (fs.existsSync(organizerReadyFile)) {
            organizerReady = true;
            console.log(`[Test ${testId}] Organizer ist bereits bereit.`);
          }
        } catch (e) {
          console.error(`[Test ${testId}] Fehler beim Prüfen des Organizer-Status:`, e);
        }

        if (!organizerReady) {
          console.log(`[Test ${testId}] Warte auf Organizer-Bereitschaft...`);
        }

        // Warten, bis der Poll gestartet wurde
        console.log(`[Test ${testId}] Warte auf Abstimmungsstart...`);

        // Warte und prüfe, ob der Poll wirklich gestartet wurde
        console.log(`[Test ${testId}] Warte auf Abstimmungsstart und prüfe, ob Poll verfügbar ist...`);

        // Kürzere Wartezeit für Poll-Synchronisation
        console.log(`[Test ${testId}] Warte 5 Sekunden für Poll-Synchronisation...`);
        await new Promise(r => setTimeout(r, 5000));

        // Prüfe in der Ergebnisdatei des Organizers, ob der Poll gestartet wurde
        try {
          const resultsDir = path.join(process.cwd(), 'voting-results');
          const organizerResultFile = path.join(resultsDir, 'organizer.json');

          if (fs.existsSync(organizerResultFile)) {
            const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
            if (organizerData.pollStarted) {
              console.log(`[Test ${testId}] Laut Organizer-Daten wurde der Poll gestartet um:`, organizerData.timestamp);
              console.log(`[Test ${testId}] Poll sichtbar für Organizer:`, organizerData.pollVisible ? 'Ja' : 'Nein');
            } else {
              console.warn(`[Test ${testId}] WARNUNG: Organizer hat noch keinen Poll gestartet!`);
            }
          } else {
            console.warn(`[Test ${testId}] WARNUNG: Keine Organizer-Ergebnisdatei gefunden!`);
          }
        } catch (e) {
          console.error(`[Test ${testId}] Fehler beim Lesen der Organizer-Ergebnisse:`, e);
        }

        // WICHTIGE ÄNDERUNG: Abstimmung in Batches mit jeweils 25 Usern
        console.log(`[Test ${testId}] Starte Abstimmungsprozess in Batches mit je ${CONFIG.VOTE_BATCH_SIZE} Benutzern...`);

        // Verwende die neue Batch-Funktion für die Abstimmung
        const successfulVotes = await executeVotingInBatches(userPages, votingTimings);

        console.log(`[Test ${testId}] ${successfulVotes} von ${userPages.length} Abstimmungen erfolgreich`);

        // Prüfe, ob tatsächlich irgendwelche Abstimmungen erfolgreich waren
        if (successfulVotes === 0) {
          console.error(`[Test ${testId}] KRITISCHER FEHLER: Keine einzige Abstimmung war erfolgreich!`);

          // Nimm Screenshots aller Pages zum Debugging
          for (let i = 0; i < Math.min(userPages.length, 5); i++) {
            try {
              const screenshotsDir = ensureScreenshotsDirectory();
              await userPages[i].page.screenshot({
                path: path.join(screenshotsDir, `Test${testId}-No-Votes-User-${i + 1}.png`)
              });
            } catch (e) {
              console.error(`Fehler beim Speichern des Screenshots für Benutzer ${i + 1}:`, e);
            }
          }

          // Mit diesem Assert wird der Test fehlschlagen, wenn keine Abstimmungen erfolgreich waren
          expect(successfulVotes).toBeGreaterThan(0, `Test ${testId}: Keine erfolgreichen Abstimmungen - Poll wurde möglicherweise nicht korrekt gestartet`);
        }

        // Prüfe, ob die Abstimmungszeitdaten sinnvoll sind
        if (votingTimings.length > 0) {
          console.log(`[Test ${testId}] Abstimmungszeiten:`,
            votingTimings.slice(0, 5).map(t => `User ${t.user}: ${t.votingTime}ms`).join(', ') +
            (votingTimings.length > 5 ? ` und ${votingTimings.length - 5} weitere...` : ''));

          // Prüfe, ob irgendeine Abstimmung eine Zeitdauer > 0 hat (ein Indikator für eine echte Abstimmung)
          const realVotes = votingTimings.filter(t => t.votingTime > 0);
          if (realVotes.length === 0 && votingTimings.length > 0) {
            console.warn(`[Test ${testId}] WARNUNG: Alle erfolgreichen Abstimmungen haben Zeitdauer 0ms - möglicherweise wurden keine echten Abstimmungen durchgeführt!`);
          }
        }

        // Ergebnisse für diesen Test speichern
        writeResults(`user-batch-${testId}`, {
          totalUsers: userPages.length,
          successfulVotes,
          votingTimings,
          batches: Math.ceil(userPages.length / CONFIG.VOTE_BATCH_SIZE)
        });

        // Test ist erfolgreich, wenn mindestens eine erfolgreiche Abstimmung durchgeführt wurde
        expect(successfulVotes).toBeGreaterThan(0, `Test ${testId}: Abstimmung fehlgeschlagen - es konnten keine Stimmen abgegeben werden`);

        // Halte die Browser-Kontexte länger offen, damit Benutzer ihre Stimmen vollständig abgeben können
        console.log(`[Test ${testId}] Halte alle Browser-Fenster für 5 Minuten offen, um vollständige Stimmabgabe zu ermöglichen...`);
        
        // Bleibe für eine bestimmte Zeit online (5 Minuten)
        const keepAliveMinutes = 5;
        const keepAliveTime = keepAliveMinutes * 60 * 1000;
        
        console.log(`[Test ${testId}] Bleibe online für ${keepAliveMinutes} Minuten...`);
        
        // Halte die Browser-Fenster aktiv
        const startTime = Date.now();
        let elapsedTime = 0;
        
        while (elapsedTime < keepAliveTime) {
          // Alle 30 Sekunden Status ausgeben (verwende die erste Benutzerseite für waitForTimeout)
          if (userPages.length > 0) {
            await userPages[0].page.waitForTimeout(30000);
          } else {
            // Fallback, falls keine userPages verfügbar sind
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
          elapsedTime = Date.now() - startTime;
          const remainingMinutes = Math.round((keepAliveTime - elapsedTime) / 60000);
          
          console.log(`[Test ${testId}] Noch ca. ${remainingMinutes} Minuten aktiv bleiben...`);
          
          // Kleine Interaktion mit allen Browser-Fenstern, um sie aktiv zu halten
          for (let i = 0; i < Math.min(userPages.length, 10); i++) {
            try {
              await userPages[i].page.evaluate(() => {
                window.scrollBy(0, 5);
                window.scrollBy(0, -5);
              });
            } catch (e) {
              // Ignoriere Fehler bei geschlossenen Browsern
            }
          }
        }
        
        console.log(`[Test ${testId}] Keep-alive Zeit abgelaufen, beende Test...`);

      } finally {
        // Aufräumen - erst nach langer Keep-alive Zeit
        console.log(`[Test ${testId}] Schließe alle Browser-Kontexte...`);
        for (const context of userContexts) {
          await context.close();
        }
      }
    });
  }
});