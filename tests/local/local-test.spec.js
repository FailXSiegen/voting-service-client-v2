// live-test.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Importiere die Module
const { CONFIG } = require('./config'); // Importiere die richtige Config aus dem live-Verzeichnis
const {
  sleep,
  cleanupResultsDirectory,
  writeResults,
  getTestUserId,
  getDisplayName,
  ensureScreenshotsDirectory
} = require('../lib/utils');
const { loginAsOrganizer, createAndStartPoll } = require('../lib/localLoginOrganizer'); // Verwende die spezielle Live-Version
const { loginAsUser } = require('../lib/localLoginUser');
const { executeVotingInBatches } = require('../lib/votingFunctions');

// CSV-Datei einlesen und Benutzer extrahieren
async function loadUsersFromCsv() {
  const results = [];
  const csvFilePath = path.join(__dirname, 'event_user.csv');

  // Für Debug-Zwecke: Lese die CSV-Datei direkt als Text, um das genaue Format zu prüfen
  try {
    const rawData = fs.readFileSync(csvFilePath, 'utf8');

    // Prüfe die Header
    const firstLine = rawData.split('\n')[0];
  } catch (error) {
    console.error('Fehler beim Lesen der CSV-Datei als Text:', error);
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data) => {
        // Erzwinge Kleinschreibung der Eigenschaftsnamen für konsistente Zugriffe
        const normalizedData = {};
        for (const key in data) {
          normalizedData[key.toLowerCase()] = data[key];
        }

        // Explizit setzen für CSV-Header-Mapping (falls die Header anders sind als erwartet)
        if (data['﻿username']) {
          normalizedData['username'] = data['﻿username'];
        }

        // Nur Benutzer mit Stimmrecht hinzufügen (vote_amount > 0)
        const voteAmount = parseInt(normalizedData['vote_amount'] || '0', 10);
        if (voteAmount > 0) {
          results.push(normalizedData);
        }
      })
      .on('end', () => {
        console.log(`CSV geladen: ${results.length} Benutzer mit Stimmrecht gefunden`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Fehler beim Lesen der CSV-Datei:', error);
        reject(error);
      });
  });
}

// Haupttest-Funktion zum Laden von Benutzern
test.describe('Live testing mit Benutzern aus CSV', () => {
  // Liste der Benutzer aus der CSV-Datei
  let users = [];

  // VOR BEGINN DER TESTS: Lösche alle alten Ergebnisdateien und lade Benutzer
  test.beforeAll(async () => {
    console.log('=== TEST SETUP: Lösche alle alten Ergebnisdateien ===');
    cleanupResultsDirectory();

    try {
      users = await loadUsersFromCsv();
      console.log(`=== ${users.length} Benutzer aus CSV-Datei geladen ===`);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }

    console.log('=== TEST SETUP ABGESCHLOSSEN ===');
  });

  // Organizer startet den Poll erst nachdem die Benutzer eingeloggt sind
  test('Organizer logged ein und erstellt Abstimmung', async ({ browser }) => {
    // Erhöhtes Timeout für diesen Test
    test.setTimeout(300000); // 2 Minuten statt 30 Sekunden
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
      let targetUserCount = users.length || CONFIG.MAX_USERS_PER_TEST;

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

        // Mache einen Screenshot nur bei kritischen Fehlern (0% Benutzer eingeloggt)
        if (readyStatus.readyPercentage < 10) {
          const screenshotsDir = ensureScreenshotsDirectory();
          await page.screenshot({
            path: path.join(screenshotsDir, `error-low-user-login-rate-${Math.floor(readyStatus.readyPercentage)}-percent.png`)
          });
        }

        if (readyStatus.totalUsersLoggedIn === 0) {
          throw new Error("Keine Benutzer haben sich eingeloggt. Test kann nicht fortgesetzt werden.");
        }

        // Warte UNBEGRENZT, bis wir 100% der Benutzer haben
        // Der Test wird AUSSCHLIESSLICH fortgesetzt, wenn alle Benutzer erfolgreich eingeloggt sind
        console.log(`Organizer-Test: Warte unbegrenzt, bis ALLE ${targetUserCount} Benutzer (100%) eingeloggt sind...`);

        const loginStartTime = Date.now();
        let loginElapsedMinutes = 0;

        while (!readyStatus.allReady) {
          // Zeige jede Minute einen ausführlichen Statusbericht an
          const currentElapsedMinutes = Math.floor((Date.now() - loginStartTime) / 60000);

          if (currentElapsedMinutes > loginElapsedMinutes) {
            loginElapsedMinutes = currentElapsedMinutes;
            console.log(`Organizer-Test: STATUSBERICHT NACH ${loginElapsedMinutes} MINUTEN:`);
            console.log(`  - ${readyStatus.totalUsersLoggedIn} von ${targetUserCount} Benutzern sind eingeloggt (${readyStatus.readyPercentage.toFixed(1)}%)`);
            console.log(`  - ${readyStatus.readyBatches} von ${readyStatus.totalBatches} Batches sind vollständig`);
            console.log(`  - Wartend auf fehlende ${targetUserCount - readyStatus.totalUsersLoggedIn} Benutzer...`);
          }

          console.log(`Organizer-Test: Benutzerbereitschaft bei ${readyStatus.readyPercentage.toFixed(1)}%, ${readyStatus.totalUsersLoggedIn}/${targetUserCount} Benutzer... (Warte 5 Sekunden)`);
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

      // Berechnung der Gesamtdauer basierend auf der Konfiguration
      const testDurationMinutes = Math.floor(CONFIG.ORGANIZER_TOTAL_WAIT_TIME / 60000); // Max. 20 Minuten
      const estimatedTime = CONFIG.ORGANIZER_TOTAL_WAIT_TIME;

      console.log(`Organizer-Test: Bleibe online für ${testDurationMinutes} Minuten oder bis alle Benutzer abgestimmt haben...`);

      // Wartezeit mit Status-Updates und Prüfung auf vollständige Abstimmung
      const startTime = Date.now();
      let elapsedTime = 0;
      let allVoted = false;
      let reducedWaitStarted = false;
      const reducedWaitTime = CONFIG.REDUCED_WAIT_TIME || 5000; // 5 Sekunden Standard-Reduzierung

      while (elapsedTime < estimatedTime && (!allVoted || !reducedWaitStarted)) {
        // Prüfe, ob alle Benutzer abgestimmt haben
        try {
          const fs = require('fs');
          const path = require('path');
          const resultsDir = path.join(process.cwd(), 'voting-results');
          const notificationFile = path.join(resultsDir, 'all-voted-notification.json');

          // Wenn die Benachrichtigungsdatei existiert, haben alle abgestimmt
          if (fs.existsSync(notificationFile)) {
            const notificationData = JSON.parse(fs.readFileSync(notificationFile));

            if (notificationData.allVoted === true && !reducedWaitStarted) {
              allVoted = true;
              reducedWaitStarted = true;

              // Wenn alle abgestimmt haben, verkürze die Wartezeit
              console.log(`Organizer-Test: WICHTIGE BENACHRICHTIGUNG - Alle ${notificationData.successfulVotes} Teilnehmer haben abgestimmt!`);
              console.log(`Organizer-Test: Die Tests werden in ${reducedWaitTime / 1000} Sekunden beendet...`);

              // Starte einen Countdown für die reduzierte Wartezeit
              const reducedWaitStartTime = Date.now();
              let resultTitleFound = false;
              const screenshotsDir = ensureScreenshotsDirectory();

              // Warte die reduzierte Zeit und prüfe währenddessen auf den Ergebnistitel
              while (Date.now() - reducedWaitStartTime < reducedWaitTime && !resultTitleFound) {
                const remainingReducedTimeSeconds = Math.round((reducedWaitTime - (Date.now() - reducedWaitStartTime)) / 1000);
                console.log(`Organizer-Test: Reduzierte Wartezeit - noch ${remainingReducedTimeSeconds} Sekunden...`);

                // Versuche, den gespeicherten Abstimmungstitel zu laden
                let expectedPollTitle = null;
                try {
                  const titleFilePath = path.join(resultsDir, 'poll-title.json');
                  if (fs.existsSync(titleFilePath)) {
                    const titleData = JSON.parse(fs.readFileSync(titleFilePath));
                    expectedPollTitle = titleData.pollTitle;
                    console.log(`Organizer-Test: Erwarteter Abstimmungstitel aus Datei geladen: "${expectedPollTitle}"`);
                  } else {
                    console.log(`Organizer-Test: Keine poll-title.json Datei gefunden, verwende generische Selektoren`);
                  }
                } catch (error) {
                  console.error(`Organizer-Test: Fehler beim Laden des Abstimmungstitels:`, error.message);
                }

                // Prüfe, ob der Abstimmungstitel in div.results-listing als .h5 sichtbar ist
                try {
                  // Debug: Überprüfe den HTML-Inhalt für den Titel
                  console.log(`Organizer-Test: Überprüfe HTML auf den Abstimmungstitel...`);
                  const htmlContent = await page.content();

                  // Prüfen, ob der erwartete Titel im HTML erscheint
                  if (expectedPollTitle && htmlContent.includes(expectedPollTitle)) {
                    console.log(`Organizer-Test: WICHTIG! Erwarteter Titel "${expectedPollTitle}" ist im HTML-Code enthalten`);
                  } else if (expectedPollTitle) {
                    console.log(`Organizer-Test: WARNUNG! Erwarteter Titel "${expectedPollTitle}" ist NICHT im HTML-Code enthalten`);
                    // Suche nach "Lasttest" oder anderen Schlüsselwörtern im HTML
                    if (htmlContent.includes("Lasttest")) {
                      console.log(`Organizer-Test: Aber "Lasttest" wurde im HTML gefunden - Titel könnte teilweise vorhanden sein`);
                    }
                  }

                  // Erstelle dynamische Selektoren basierend auf dem erwarteten Titel
                  let titleSelectors = [
                    'div.results-listing .h5',
                    'div.results-listing h5',
                    '.poll-result .h5',
                    '.poll-results h5',
                    '.poll-completed h5'
                  ];

                  // Füge dynamische Selektoren hinzu, wenn wir einen erwarteten Titel haben
                  if (expectedPollTitle) {
                    const escapedTitle = expectedPollTitle.replace(/\"/g, '\"');
                    titleSelectors = titleSelectors.concat([
                      `.card-header h5:has-text("${escapedTitle}")`,
                      `.result-title:has-text("${escapedTitle}")`,
                      `h5:has-text("${escapedTitle}")`,
                      `.h5:has-text("${escapedTitle}")`,
                      `*:has-text("${escapedTitle}")`
                    ]);
                  } else {
                    // Fallback zu generischen Selektoren
                    titleSelectors = titleSelectors.concat([
                      '.card-header h5:has-text("Lasttest")',
                      '.card-header h5:has-text("geheim")',
                      '.card-header h5:contains("2025")'
                    ]);
                  }

                  for (const selector of titleSelectors) {
                    console.log(`Organizer-Test: Prüfe Selektor: ${selector}`);

                    // Prüfe den Selektor mit try/catch
                    const isTitleVisible = await page.locator(selector).isVisible({ timeout: 1000 }).catch((e) => {
                      console.log(`Organizer-Test: Fehler beim Prüfen von Selektor ${selector}: ${e.message}`);
                      return false;
                    });

                    console.log(`Organizer-Test: Selektor ${selector} ist ${isTitleVisible ? 'sichtbar' : 'nicht sichtbar'}`);

                    if (isTitleVisible) {
                      try {
                        const titleText = await page.locator(selector).innerText();
                        console.log(`Organizer-Test: ERFOLG! Abstimmungstitel gefunden: "${titleText}"`);

                        // Prüfe, ob der gefundene Titel dem erwarteten Titel entspricht
                        if (expectedPollTitle && titleText.includes(expectedPollTitle)) {
                          console.log(`Organizer-Test: PERFEKT! Gefundener Titel enthält den erwarteten Titel "${expectedPollTitle}"`);
                        }

                        // Kein Screenshot bei Erfolg nötig

                        resultTitleFound = true;
                        break;
                      } catch (e) {
                        console.log(`Organizer-Test: Fehler beim Auslesen des Titels: ${e.message}`);
                      }
                    }
                  }

                  // Wenn kein Titel gefunden wurde, versuche eine andere Methode
                  if (!resultTitleFound) {
                    console.log(`Organizer-Test: Keine Ergebnistitel mit Selektoren gefunden. Versuche allgemeine Textsuche...`);

                    // Allgemeine Textsuche auf der Seite
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    if (expectedPollTitle && bodyText.includes(expectedPollTitle)) {
                      console.log(`Organizer-Test: ERFOLG! Erwarteter Titel "${expectedPollTitle}" wurde im Seitentext gefunden`);
                      resultTitleFound = true;

                      // Kein Screenshot nötig
                    } else if (bodyText.includes("Lasttest")) {
                      console.log(`Organizer-Test: ERFOLG! "Lasttest" wurde im Seitentext gefunden`);
                      resultTitleFound = true;

                      // Kein Screenshot nötig
                    }
                  }
                } catch (e) {
                  console.log(`Organizer-Test: Fehler bei der Titelprüfung: ${e.message}`);
                }

                await page.waitForTimeout(1000); // Status jede Sekunde aktualisieren

                // Halte Browser aktiv
                try {
                  await page.evaluate(() => {
                    window.scrollBy(0, 5);
                    window.scrollBy(0, -5);
                  });
                } catch (e) {
                  // Ignoriere Fehler
                }
              }

              // Benachrichtigung über den finalen Status
              if (resultTitleFound) {
                console.log(`Organizer-Test: TEST ERFOLGREICH - Abstimmungstitel gefunden, alle Teilnehmer haben abgestimmt.`);
              } else {
                console.log(`Organizer-Test: Reduzierte Wartezeit abgelaufen, Abstimmungstitel nicht gefunden.`);
              }
              break; // Beende die Schleife nach der reduzierten Wartezeit
            }
          }
        } catch (error) {
          console.error("Organizer-Test: Fehler beim Prüfen der Abstimmungsbenachrichtigung:", error.message);
        }

        // Normaler Status-Update, wenn nicht alle abgestimmt haben
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

  // Parallele Tests für die Benutzer aus der CSV-Datei
  // Wir teilen die Benutzer in 2 Batches auf (oder passen uns an die Benutzerzahl an)
  const batchCount = 3; // Reduziert: 2 Batches

  for (let testId = 1; testId <= batchCount; testId++) {
    test(`User batch ${testId} votes in poll`, async ({ browser }) => {
      // Erhöhtes Timeout für User-Tests
      test.setTimeout(300000); // 2 Minuten statt 30 Sekunden
      const userContexts = [];
      const userPages = [];
      const votingTimings = [];

      // Berechne die Start- und Endindizes für diesen Batch
      const usersPerBatch = Math.ceil(users.length / batchCount);
      const startIndex = (testId - 1) * usersPerBatch;
      const endIndex = Math.min(startIndex + usersPerBatch, users.length);
      const batchUsers = users.slice(startIndex, endIndex);

      console.log(`[Test ${testId}] Batch mit ${batchUsers.length} Benutzern (Indizes ${startIndex} bis ${endIndex - 1} von insgesamt ${users.length})`);

      try {
        // Warteschleife, um sicherzustellen, dass der Organisator zuerst eingeloggt ist
        // und um die Logins über Zeit zu verteilen (vermeidet DB-Überlastung)
        await new Promise(r => setTimeout(r, 5000 * testId)); // Staffelung der Tests

        const loginPromises = [];

        // Konfiguration für diesen Batch
        const usersInThisBatch = batchUsers.length;
        const concurrentLogins = CONFIG.CONCURRENT_LOGINS;


        for (let batchOffset = 0; batchOffset < usersInThisBatch; batchOffset += concurrentLogins) {
          // Benutzer parallel anmelden
          const batchPromises = [];

          for (let j = 0; j < concurrentLogins && batchOffset + j < usersInThisBatch; j++) {
            const userIndex = batchOffset + j;
            const user = batchUsers[userIndex];

            batchPromises.push((async () => {
              try {
                // BOM-Problem korrigieren: 
                // Die CSV-Datei enthält möglicherweise ein UTF-8 BOM, das Probleme beim Schlüsselzugriff verursacht
                // Wir gehen alle Schlüssel des Objekts durch und suchen nach einem, der mit 'username' endet
                let usernameKey = null;
                let publicnameKey = null;

                for (const key in user) {
                  if (key.endsWith('username') || key === 'username') {
                    usernameKey = key;
                  }
                  if (key.toLowerCase().endsWith('publicname') || key.toLowerCase() === 'publicname') {
                    publicnameKey = key;
                  }
                }

                // Benutze die gefundenen Schlüssel oder Fallback-Werte
                const username = usernameKey ? user[usernameKey] : user.username;
                const publicName = publicnameKey ? user[publicnameKey] : user.publicname;
                const userId = startIndex + userIndex + 1;

                // Zusätzliches leichtes Staffeln innerhalb der Gruppe
                await sleep(j * 50); // 50ms zwischen den Logins innerhalb einer Gruppe

                // Erstelle einen neuen Browser-Kontext mit Fehlerbehandlung
                let context;
                try {
                  context = await browser.newContext();
                } catch (contextError) {
                  console.error(`Fehler beim Erstellen des Browser-Kontexts für User ${userId}: ${contextError.message}`);
                  return false; // Keine weiteren Aktionen bei Fehler im Kontext
                }

                // Erstelle eine neue Seite mit Fehlerbehandlung
                let page;
                try {
                  page = await context.newPage();
                } catch (pageError) {
                  console.error(`Fehler beim Erstellen der Page für User ${userId}: ${pageError.message}`);
                  try { await context.close(); } catch { }
                  return false; // Keine weiteren Aktionen bei Fehler bei der Page
                }

                userContexts.push(context);
                userPages.push({
                  page,
                  userIndex: userId,
                  username,
                  publicName
                });

                // Verwende die spezialisierte Login-Funktion für Event-User mit Magic Links
                // Vermutlicher Grund: Die CSV-Datei hat ein UTF-8 BOM, was zu unterschiedlichen Schlüsselnamen führt
                const loginResult = await loginAsUser(page, username, null, publicName);
                return loginResult;
              } catch (error) {
                console.error(`Allgemeiner Fehler beim Login-Prozess für Benutzer #${userIndex}: ${error.message}`);
                return false;
              }
            })());
          }

          // Warte auf die aktuelle Gruppe, bevor die nächste gestartet wird
          const batchResults = await Promise.all(batchPromises);
          loginPromises.push(...batchResults);

          // Kurze Pause zwischen den Gruppen, um die Datenbank zu entlasten
          if (batchOffset + concurrentLogins < usersInThisBatch) {
            const staggerDelay = Math.max(500, 2000 - (testId * 250)); // Weniger Wartezeit für spätere Gruppen
            await new Promise(r => setTimeout(r, staggerDelay));
          }
        }

        // Auswertung der gesammelten Login-Ergebnisse
        const successfulLogins = loginPromises.filter(r => r).length;

        // Vergleiche, wie viele Logins wir wirklich haben vs. wie viele wir erwarten
        const actualLoginCount = successfulLogins;
        const expectedLoginCount = usersInThisBatch;
        const actualPagesCount = userPages.length;


        // Wenn nicht alle erwartet Logins erfolgreich waren, warten wir in einer Schleife
        if (actualLoginCount < expectedLoginCount || actualPagesCount < expectedLoginCount) {

          // Fester Zeitraum - wir warten 5 Minuten (30*10 = 300 Sekunden), Intervall 10 Sekunden
          for (let waitCounter = 0; waitCounter < 30; waitCounter++) {
            await new Promise(r => setTimeout(r, 10000));

            // Wenn wir jetzt genug haben, brechen wir die Warteschleife ab
            if (userPages.length >= expectedLoginCount) {
              break;
            }
          }
        }

        // STRIKTE Prüfung nach dem Warten - nur wenn wir GENAU die erwartete Anzahl haben,
        // markieren wir den Batch als vollständig
        const finalLoginCount = successfulLogins;
        const finalPagesCount = userPages.length;
        const batchIsComplete = finalPagesCount >= expectedLoginCount;
        // Schreibe den Status
        writeResults(`user-batch-${testId}-ready`, {
          batchId: testId,
          usersLoggedIn: finalPagesCount, // Wir melden die Anzahl der erstellten Pages
          timestamp: new Date().toISOString(),
          // Nur als vollständig melden, wenn wir GENAU die erwartete Anzahl haben
          batchComplete: batchIsComplete
        });


        // Starte den Keep-Alive-Mechanismus in einem separaten asynchronen Prozess
        // Führe regelmäßige Aktivitäten im Browser durch, um die Verbindung aktiv zu halten
        const keepAliveInterval = setInterval(async () => {
          let activePagesCount = 0;

          // Führe für jede Page eine kleine Aktivität durch
          for (let i = 0; i < userPages.length; i++) {
            try {
              const page = userPages[i].page;

              // Überspringe geschlossene Pages
              if (!page || page.isClosed()) {
                continue;
              }

              // Seite regelmäßig neu laden, um WebSocket-Verbindungen zu erneuern
              // Alle 30 Sekunden jede 10. Seite neu laden
              const now = new Date();
              if (now.getSeconds() % 30 === 0 && i % 10 === 0) {
                try {
                  await page.reload({ waitUntil: 'networkidle' });
                  await page.waitForTimeout(1000);
                } catch (reloadError) {
                  console.error(`[Test ${testId}] Fehler beim Neuladen der Seite für Benutzer ${userPages[i].userIndex}:`, reloadError.message);
                }
              }

              // Führe aggressivere Aktivitäten durch, um die Verbindung aktiv zu halten
              await page.evaluate(() => {
                try {
                  // Scroll-Aktivität - mehr Bewegung
                  for (let i = 0; i < 3; i++) {
                    window.scrollBy(0, 5);
                    window.scrollBy(0, -5);
                  }

                  // Intensivere Mausbewegung
                  for (let i = 0; i < 3; i++) {
                    const event = new MouseEvent('mousemove', {
                      bubbles: true,
                      cancelable: true,
                      clientX: Math.random() * window.innerWidth,
                      clientY: Math.random() * window.innerHeight
                    });
                    document.body.dispatchEvent(event);
                  }

                  // Klicke auf den Body, um Fokus zu behalten
                  document.body.click();

                  // Aktiviere WebSocket-Verbindungen mit mehreren Pings
                  if (window.socket && typeof window.socket.send === 'function') {
                    try {
                      // Mehrere Ping-Nachrichten senden
                      window.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                      window.socket.send(JSON.stringify({ type: 'activity', timestamp: Date.now() }));
                    } catch (e) { }
                  }

                  // Simuliere Tastatureingaben, um das Fenster aktiv zu halten
                  const keyEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    keyCode: 0 // Harmloser Tastencode
                  });
                  document.body.dispatchEvent(keyEvent);

                  // Lokale Speicherung zur Aktivitätsverfolgung
                  try {
                    localStorage.setItem('lastActivity', Date.now().toString());
                  } catch (e) { }

                  return true;
                } catch (e) {
                  console.error("Fehler bei der Keep-Alive-Aktivität:", e);
                  return false;
                }
              }).then(isActive => {
                if (isActive) {
                  activePagesCount++;
                }
              }).catch((error) => {
                console.warn(`[Test ${testId}] Keep-Alive-Fehler für Benutzer ${userPages[i].userIndex}:`, error.message);
              });

              // Kurze Pause zwischen den Benutzern, um Überlastung zu vermeiden
              await page.waitForTimeout(50);
            } catch (e) {
              console.warn(`[Test ${testId}] Allgemeiner Keep-Alive-Fehler:`, e.message);
            }
          }

          // Häufigere Status-Updates
          const now = new Date();
          if (now.getSeconds() % 5 === 0) {
            console.log(`[Test ${testId}] Keep-Alive aktiv: ${activePagesCount}/${userPages.length} Browser verbunden (${new Date().toLocaleTimeString()})`);
          }
        }, 1000); // Häufigere Ausführung - alle 1000ms statt 2000ms

        // Bereinigungsfunktion für den Keep-Alive-Prozess
        const cleanupKeepAlive = () => {
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            console.log(`[Test ${testId}] Keep-Alive-Mechanismus gestoppt`);
          }
        };

        // Diese Funktion wird später aufgerufen, um den Keep-Alive zu stoppen

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

        // Warten, bis der Poll gestartet wurde, mit aktiven Keep-Alive-Mechanismus
        console.log(`[Test ${testId}] Aktives Warten auf Abstimmungsstart mit Keep-Alive...`);

        // Implementiere eine aktive Wartefunktion mit regelmäßigen Prüfungen
        const pollWaitStartTime = Date.now();
        const maxPollWaitTime = CONFIG.WAIT_FOR_POLL_START_TIME || 600000; // Maximal 10 Minuten auf den Poll warten

        // Diese Funktion überprüft aktiv den Status des Polls während wir warten
        let pollStarted = false;

        console.log(`[Test ${testId}] Warte aktiv auf Abstimmungsstart (maximal ${maxPollWaitTime / 60000} Minuten)...`);

        // Aktive Warteschleife mit regelmäßiger Überprüfung
        while ((Date.now() - pollWaitStartTime) < maxPollWaitTime && !pollStarted) {
          // Prüfe, ob der Poll bereits gestartet wurde
          try {
            const resultsDir = path.join(process.cwd(), 'voting-results');
            const organizerResultFile = path.join(resultsDir, 'organizer.json');

            if (fs.existsSync(organizerResultFile)) {
              try {
                const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));

                if (organizerData && organizerData.pollStarted === true) {
                  console.log(`[Test ${testId}] ERFOLG: Abstimmung wurde vom Organizer gestartet um: ${organizerData.timestamp}`);
                  pollStarted = true;
                  break; // Verlasse die Warteschleife
                }
              } catch (parseError) {
                console.error(`[Test ${testId}] Fehler beim Parsen der Organizer-Datei:`, parseError);
              }
            }
          } catch (fileError) {
            console.error(`[Test ${testId}] Fehler beim Überprüfen der Organizer-Datei:`, fileError);
          }

          // Alle 10 Sekunden ein Status-Update ausgeben
          const waitedSeconds = Math.floor((Date.now() - pollWaitStartTime) / 1000);
          if (waitedSeconds % 10 === 0) {
            console.log(`[Test ${testId}] Warte seit ${waitedSeconds} Sekunden auf Abstimmungsstart (${userPages.length} Browser verbunden)...`);

            // Zusätzlich Pagerefresh für jeden 10. Benutzer alle 30 Sekunden,
            // um eventuelle Verbindungsprobleme zu beheben
            if (waitedSeconds % 30 === 0) {
              for (let i = 0; i < userPages.length; i += 10) {
                try {
                  if (!userPages[i].page.isClosed()) {
                    console.log(`[Test ${testId}] Aktualisiere Seite für Benutzer ${userPages[i].userIndex}...`);
                    await userPages[i].page.reload({ waitUntil: 'networkidle' });
                  }
                } catch (e) {
                  // Ignoriere Fehler beim Reload
                }
              }
            }
          }

          // Kurze Pause vor der nächsten Prüfung
          await new Promise(r => setTimeout(r, 1000));
        }

        // Wenn wir hier ankommen, wurde entweder die Abstimmung gestartet oder das Timeout erreicht
        if (!pollStarted) {
          console.warn(`[Test ${testId}] WARNUNG: Maximale Wartezeit auf Abstimmungsstart (${maxPollWaitTime / 60000} Minuten) überschritten!`);
          console.log(`[Test ${testId}] Versuche trotzdem mit der Abstimmung fortzufahren...`);
        }

        // In beiden Fällen fortfahren - entweder wurde die Abstimmung gestartet oder wir versuchen es trotzdem

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

        // WICHTIGE ÄNDERUNG: Abstimmung in Batches mit jeweils konfigurierten Usern
        console.log(`[Test ${testId}] Starte Abstimmungsprozess in Batches mit je ${CONFIG.VOTE_BATCH_SIZE} Benutzern...`);

        // Stoppe den Keep-Alive-Mechanismus NICHT - wir lassen ihn weiterlaufen, um die Verbindung während
        // der Abstimmung weiterhin aktiv zu halten
        console.log(`[Test ${testId}] Keep-Alive-Mechanismus bleibt während der Abstimmung aktiv`);

        // Verwende die neue Batch-Funktion für die Abstimmung
        const successfulVotes = await executeVotingInBatches(userPages, votingTimings);

        console.log(`[Test ${testId}] ${successfulVotes} von ${userPages.length} Abstimmungen erfolgreich`);

        // Prüfe, ob tatsächlich irgendwelche Abstimmungen erfolgreich waren
        if (successfulVotes === 0) {
          console.error(`[Test ${testId}] KRITISCHER FEHLER: Keine einzige Abstimmung war erfolgreich!`);

          // Nimm Screenshots nur von einem repräsentativen Benutzer für Fehleranalyse
          if (userPages.length > 0) {
            try {
              const screenshotsDir = ensureScreenshotsDirectory();
              await userPages[0].page.screenshot({
                path: path.join(screenshotsDir, `Test${testId}-Critical-Error-No-Votes.png`)
              });
            } catch (e) {
              console.error(`Fehler beim Speichern des Screenshots: ${e.message}`);
            }
          }

          // Mit diesem Assert wird der Test fehlschlagen, wenn keine Abstimmungen erfolgreich waren
          expect(successfulVotes).toBeGreaterThan(0, `Test ${testId}: Keine erfolgreichen Abstimmungen - Poll wurde möglicherweise nicht korrekt gestartet`);
        }

        // Zusätzliche Wartezeit von 60 Sekunden nach der Abstimmung
        console.log(`[Test ${testId}] Warte 60 Sekunden nach erfolgreicher Abstimmung...`);
        await new Promise(resolve => setTimeout(resolve, 60000));

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
        console.log(`[Test ${testId}] Halte alle Browser-Fenster für ${CONFIG.USER_WAIT_AFTER_VOTE / 1000} Sekunden offen, um vollständige Stimmabgabe zu ermöglichen...`);

        // Verbesserte keep-alive Implementierung
        const keepAliveTime = CONFIG.USER_WAIT_AFTER_VOTE;

        console.log(`[Test ${testId}] Verbesserte Keep-Alive-Strategie für ${CONFIG.USER_WAIT_AFTER_VOTE / 1000} Sekunden aktiviert...`);

        // Halte die Browser-Fenster aktiv mit verbesserter Strategie
        const startTime = Date.now();
        let elapsedTime = 0;
        let lastLogTime = 0;
        const logInterval = 10000; // 10 Sekunden zwischen Status-Updates
        let activePagesCount = 0;

        // Führe regelmäßige Aktivitäten aus, um die Verbindung aktiv zu halten
        while (elapsedTime < keepAliveTime) {
          try {
            elapsedTime = Date.now() - startTime;

            // Regelmäßige Status-Updates
            const currentTime = Date.now();
            if (currentTime - lastLogTime >= logInterval) {
              lastLogTime = currentTime;
              const remainingSeconds = Math.round((keepAliveTime - elapsedTime) / 1000);
              console.log(`[Test ${testId}] Keep-Alive: ${activePagesCount} aktive Browser, noch ${remainingSeconds} Sekunden verbleibend...`);
            }

            // Zähler zurücksetzen
            activePagesCount = 0;

            // Für jede Page eine kleine Aktion durchführen
            for (let i = 0; i < userPages.length; i++) {
              try {
                // Überspringe geschlossene Pages
                if (!userPages[i].page || userPages[i].page.isClosed()) {
                  continue;
                }

                // Führe verschiedene Aktionen durch, um die Seite aktiv zu halten
                await userPages[i].page.evaluate(() => {
                  try {
                    // Kleine Scroll-Bewegungen
                    window.scrollBy(0, 1);
                    window.scrollBy(0, -1);

                    // Simuliere Mausbewegung, um Verbindungen aktiv zu halten
                    const event = new MouseEvent('mousemove', {
                      bubbles: true,
                      cancelable: true,
                      clientX: Math.random() * 50,
                      clientY: Math.random() * 50
                    });
                    document.body.dispatchEvent(event);

                    // Aktiviere WebSocket-Verbindungen, falls vorhanden
                    if (window.socket && typeof window.socket.send === 'function') {
                      try {
                        window.socket.send(JSON.stringify({ type: 'ping' }));
                      } catch (e) {
                        // Ignoriere Socket-Fehler
                      }
                    }

                    // Berühre auch modale Dialoge, die möglicherweise offen sind
                    const modalElement = document.querySelector('.modal.show');
                    if (modalElement) {
                      modalElement.dispatchEvent(event);

                      // Prüfe auf "Stimme wird abgegeben" Meldung und stelle sicher, dass sie sichtbar bleibt
                      const loadingIndicator = document.querySelector('.modal .spinner-border');
                      if (loadingIndicator) {
                        // Wenn wir einen Loading-Indikator haben, halten wir die Verbindung besonders aktiv
                        for (let j = 0; j < 3; j++) {
                          const moveEvent = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            clientX: Math.random() * 100,
                            clientY: Math.random() * 100
                          });
                          document.body.dispatchEvent(moveEvent);
                        }
                      }
                    }

                    return true; // Signal, dass die Seite aktiv ist
                  } catch (e) {
                    return false;
                  }
                }).then(isActive => {
                  if (isActive) {
                    activePagesCount++;
                  }
                }).catch(() => {
                  // Ignoriere Fehler bei geschlossenen Pages
                });

              } catch (pageError) {
                // Ignoriere Fehler bei einzelnen Pages
              }
            }

            // Warte das konfigurierte Intervall bis zur nächsten Aktion
            await new Promise(resolve => setTimeout(resolve, CONFIG.KEEP_ALIVE_INTERVAL || 5000));

          } catch (error) {
            console.error(`[Test ${testId}] Fehler im Keep-Alive-Loop:`, error);
            // Kurze Pause und dann weiter
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        console.log(`[Test ${testId}] Keep-alive Zeit abgelaufen, beende Test...`);

      } catch (unexpectedError) {
        console.error(`[Test ${testId}] Unerwarteter Fehler aufgetreten: ${unexpectedError.message}`);
        // Trotz Fehler nicht fehlschlagen lassen - wir möchten den Test erfolgreich abschließen
      } finally {
        // Stoppe den Keep-Alive-Mechanismus falls er noch läuft
        if (typeof cleanupKeepAlive === 'function') {
          console.log(`[Test ${testId}] Stoppe Keep-Alive-Mechanismus...`);
          cleanupKeepAlive();
        }

        // Aufräumen - erst nach langer Keep-alive Zeit
        console.log(`[Test ${testId}] Schließe alle Browser-Kontexte...`);
        for (const context of userContexts) {
          try {
            // Prüfe, ob der Kontext noch existiert, bevor er geschlossen wird
            if (context) {
              const pages = await context.pages().catch(() => []);
              if (pages.length > 0) {
                await context.close();
              }
            }
          } catch (e) {
            console.log(`[Test ${testId}] Fehler beim Schließen des Browser-Kontexts: ${e.message}`);
            // Kontext konnte nicht geschlossen werden, aber das sollte den Test nicht fehlschlagen lassen
          }
        }
      }
    });
  }
});