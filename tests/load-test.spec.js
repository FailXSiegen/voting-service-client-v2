const { test, expect } = require('@playwright/test');

// Konfiguration
const CONFIG = {
  USERS: 150,              // Anzahl der Teilnehmer
  ORGANIZER: 1,            // Anzahl der Organisatoren
  BATCH_SIZE: 25,          // Anzahl der gleichzeitigen Browser pro Batch
  API_URL: 'http://localhost:4000',
  CLIENT_URL: 'http://localhost:5173',
  EVENT_SLUG: 'loadtest-event',
  ORGANIZER_EMAIL: 'loadtest@example.org',
  ORGANIZER_PASSWORD: 'TestPassword123!',
  USER_PASSWORD: 'test123'
};

// Einfacher Test mit wenigen Benutzern zum schnellen Testen
test('Simple load test with 3 users', async ({ browser }) => {
  console.log('Starte einfachen Lasttest mit 3 Teilnehmern...');

  // Drei Benutzer gleichzeitig testen
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext()
  ]);

  const pages = await Promise.all(contexts.map(context => context.newPage()));

  try {
    // Alle drei Benutzer parallel einloggen
    await Promise.all(pages.map(async (page, index) => {
      const username = `testuser${index + 1}`;
      console.log(`Login für ${username}...`);

      await page.goto(`${CONFIG.CLIENT_URL}/event/${CONFIG.EVENT_SLUG}`);
      // Ausfüllen der Formularfelder basierend auf dem aktuellen Formular
      const usernameInputs = await page.$$('input.form-control');

      // Annahme: Erstes Input-Feld ist Username/Email
      await usernameInputs[0].fill(username);

      // Zweites Input-Feld ist Passwort
      await usernameInputs[1].fill(CONFIG.USER_PASSWORD);

      // Drittes Input-Feld ist Anzeige-Name
      await usernameInputs[2].fill(`User ${index + 1}`);

      // Auf Submit-Button klicken
      await page.click('button.btn-primary');

      // Warten auf Willkommenstext statt auf URL-Änderung
      try {
        // Warten auf Text, der nach erfolgreichem Login erscheint
        await page.waitForSelector('text=Willkommen', { timeout: 30000 });
        console.log(`Willkommen User ${index + 1}`);
      } catch (error) {
        console.error(`Timeout beim Warten - ${username}:`, error);
        // Screenshot für Debugging
        await page.screenshot({ path: `error-${username}.png` });
      }
    }));

    console.log('Lasttests abgeschlossen');

    // Kurz warten, damit die Benutzeroberfläche vollständig geladen wird
    await new Promise(r => setTimeout(r, 2000));

  } catch (error) {
    console.error('Fehler im einfachen Lasttest:', error);
    throw error;
  } finally {
    // Aufräumen
    await Promise.all(contexts.map(context => context.close()));
  }
});

// Vollständiger Lasttest mit mehreren Benutzern in Batches
test('Full load test with multiple users', async ({ browser }) => {
  console.log(`Starte vollständigen Lasttest mit ${CONFIG.USERS} Teilnehmern...`);

  // Anzahl der Batches berechnen
  const batchCount = Math.ceil(CONFIG.USERS / CONFIG.BATCH_SIZE);
  const userTimings = [];

  for (let batch = 0; batch < batchCount; batch++) {
    console.log(`Starte Batch ${batch + 1}/${batchCount}`);

    // Anzahl der Benutzer in diesem Batch berechnen (letzter Batch könnte weniger sein)
    const usersInBatch = Math.min(CONFIG.BATCH_SIZE, CONFIG.USERS - batch * CONFIG.BATCH_SIZE);
    const promises = [];

    for (let i = 0; i < usersInBatch; i++) {
      const userIndex = batch * CONFIG.BATCH_SIZE + i + 1;
      promises.push((async () => {
        const startTime = Date.now();
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          const username = `testuser${userIndex}`;
          const displayName = `User ${userIndex}`;

          await page.goto(`${CONFIG.CLIENT_URL}/event/${CONFIG.EVENT_SLUG}`);

          // Warten, bis die Seite geladen ist und Formularfelder sichtbar sind
          await page.waitForSelector('input.form-control', { timeout: 10000 });
          
          // Ausfüllen der Formularfelder - Direkte Selektoren verwenden für mehr Stabilität
          await page.locator('input.form-control').nth(0).fill(username);
          await page.locator('input.form-control').nth(1).fill(CONFIG.USER_PASSWORD);
          await page.locator('input.form-control').nth(2).fill(displayName);

          // Login durchführen
          const loginStartTime = Date.now();
          await page.click('button.btn-primary');

          // Warten auf Willkommenstext statt auf URL-Änderung
          try {
            // Warten auf Text, der nach erfolgreichem Login erscheint
            await page.waitForSelector('text=Willkommen', { timeout: 30000 });
            const loginEndTime = Date.now();
            userTimings.push({
              user: userIndex,
              loginTime: loginEndTime - loginStartTime,
              totalTime: loginEndTime - startTime
            });
          } catch (error) {
            console.error(`Timeout beim Warten auf Dashboard für ${username}`);
            await page.screenshot({ path: `error-${username}.png` });
          }

          // Hier könnte weitere Interaktion stattfinden (Umfragen beantworten etc.)

          // Kurze Pause zwischen Aktionen
          await new Promise(r => setTimeout(r, 500));
        } finally {
          await context.close();
        }
      })());
    }

    // Alle Benutzer in diesem Batch starten und warten, bis sie fertig sind
    await Promise.all(promises);

    // Kurze Pause zwischen Batches
    await new Promise(r => setTimeout(r, 2000));
  }

  // Ergebnisse ausgeben
  console.log(`\nLasttest mit ${userTimings.length} Benutzern abgeschlossen`);

  if (userTimings.length > 0) {
    const loginTimes = userTimings.map(t => t.loginTime);
    const totalTimes = userTimings.map(t => t.totalTime);

    const avgLoginTime = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
    const avgTotalTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    const minLoginTime = Math.min(...loginTimes);
    const maxLoginTime = Math.max(...loginTimes);

    console.log(`Durchschnittliche Login-Zeit: ${Math.round(avgLoginTime)}ms`);
    console.log(`Schnellster Login: ${minLoginTime}ms`);
    console.log(`Langsamster Login: ${maxLoginTime}ms`);
    console.log(`Durchschnittliche Gesamtzeit: ${Math.round(avgTotalTime)}ms`);
  }
});