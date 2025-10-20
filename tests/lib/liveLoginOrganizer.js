// liveLoginOrganizer.js - Speziell für den Live-Test mit dem richtigen CONFIG
const { CONFIG, log, getScreenshotsDir } = require('../live/config');
const path = require('path');

// Login als Organisator
async function loginAsOrganizer(page) {
    try {
        log('Organizer-Login gestartet', 'milestone');
        await page.goto(`${CONFIG.CLIENT_URL}`);
        
        // Warte, bis die Seite vollständig geladen ist
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Zusätzliche Wartezeit für Rendering

        // Versuche verschiedene Selektoren für die Formularfelder
        const usernameSelectors = [
            '#organizer-login-username',
            '#username',
            'input[name="username"]',
            'input[placeholder*="Benutzername"]',
            'input[placeholder*="Username"]'
        ];

        const passwordSelectors = [
            '#organizer-login-password',
            '#password',
            'input[name="password"]',
            'input[type="password"]',
            'input[placeholder*="Passwort"]'
        ];

        // Finde und fülle das Benutzernamefeld
        let foundUsername = false;
        for (const selector of usernameSelectors) {
            try {
                const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
                if (visible) {
                    await page.fill(selector, CONFIG.ORGANIZER_USERNAME);
                    foundUsername = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!foundUsername) {
            log('Benutzernamefeld nicht gefunden', 'error');
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, `error-username-field-not-found.png`),
                fullPage: true
            });
            
            // Versuche, weitere Informationen zur Seite zu erfassen
            log('Organizer-Login: Konnte Benutzernamefeld nicht finden. Prüfe URL und Seiteninhalt...', 'error');
            log(`Aktuelle URL: ${page.url()}`, 'error');
        }

        // Finde und fülle das Passwortfeld
        let foundPassword = false;
        for (const selector of passwordSelectors) {
            try {
                const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
                if (visible) {
                    await page.fill(selector, CONFIG.ORGANIZER_PASSWORD);
                    foundPassword = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!foundPassword && foundUsername) {
            // Nur Screenshot machen, wenn das Benutzernamefeld gefunden wurde, das Passwortfeld aber nicht
            log('Passwortfeld nicht gefunden', 'error');
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, `error-password-field-not-found.png`),
                fullPage: true
            });
        }

        // Versuche verschiedene Selektoren für den Submit-Button
        const buttonSelectors = [
            '#organizer-login-submit',
            'button[type="submit"]',
            'button.btn-primary',
            'input[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Anmelden")',
            'button:has-text("Einloggen")'
        ];

        let buttonClicked = false;
        for (const selector of buttonSelectors) {
            try {
                const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
                if (visible) {
                    await page.click(selector);
                    buttonClicked = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!buttonClicked) {
            log('Login-Button nicht gefunden', 'error');
            
            // Nur Screenshot machen, wenn das Benutzerfeld und Passwortfeld gefunden wurden, aber der Button nicht
            if (foundUsername && foundPassword) {
                const screenshotsDir = getScreenshotsDir();
                await page.screenshot({
                    path: path.join(screenshotsDir, `error-login-button-not-found.png`),
                    fullPage: true
                });
            }
            
            // Versuche Enter zu drücken als letzten Ausweg
            await page.keyboard.press('Enter');
        }

        // Warten auf erfolgreichen Login mit verschiedenen Indikatoren
        const successSelectors = [
            'main h1:has-text("Dashboard")',
            '.dashboard',
            'h1:has-text("Dashboard")',
            '.admin-dashboard',
            '.organizer-dashboard',
            '.event-list'
        ];

        let loginSuccess = false;
        for (const selector of successSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                log('Login erfolgreich', 'milestone');
                loginSuccess = true;
                break;
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!loginSuccess) {
            // Überprüfe, ob die URL auf einen erfolgreichen Login hindeutet
            const url = page.url();
            if (url.includes('/admin') || url.includes('/dashboard') || url.includes('/event/')) {
                log('Login erfolgreich (URL-Prüfung)', 'milestone');
                loginSuccess = true;
            } else {
                // Nur bei wirklich kritischem Fehler Screenshot und ausführliches Logging
                log('Login fehlgeschlagen', 'error');
                
                const screenshotsDir = getScreenshotsDir();
                await page.screenshot({
                    path: path.join(screenshotsDir, `error-login-failed.png`),
                    fullPage: true
                });
                
                // Zusätzliche Informationen für die Fehlerdiagnose
                log(`URL nach Login-Versuch: ${url}`, 'error');
                log('Login-Element-Status:', 'error');
                log(`Benutzernamefeld gefunden: ${foundUsername}`, 'error');
                log(`Passwortfeld gefunden: ${foundPassword}`, 'error');
                log(`Login-Button gefunden und geklickt: ${buttonClicked}`, 'error');
            }
        }

        return loginSuccess;
    } catch (error) {
        log(`Login-Fehler: ${error.message}`, 'error');
        const screenshotsDir = getScreenshotsDir();
        await page.screenshot({
            path: path.join(screenshotsDir, `error-login-exception.png`),
            fullPage: true
        });
        return false;
    }
}

// Öffne einen neuen Poll als Organizer
async function createAndStartPoll(page) {
    try {
        // Prüfe, ob Benutzer bereit sind, bevor wir die Abstimmung starten
        log('Prüfe Teilnehmer-Bereitschaft', 'info');

        // Starte eine aktive Prüfung der Teilnehmer mit Timeout
        let usersReady = false;
        const maxCheckTime = 60000; // 1 Minute maximal warten
        const startTime = Date.now();

        // Variablen für die Anzeige des aktuellen Status
        let totalLoggedInUsers = 0;
        let batchCount = 0;

        while (!usersReady && (Date.now() - startTime) < maxCheckTime) {
            try {
                const fs = require('fs');
                const path = require('path');
                const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);

                // Prüfe alle Batch-Dateien nach eingeloggten Benutzern
                const files = fs.readdirSync(resultsDir);
                totalLoggedInUsers = 0;
                batchCount = 0;

                for (const file of files) {
                    if (file.startsWith('user-batch-') && file.endsWith('-ready.json')) {
                        try {
                            const batchData = JSON.parse(fs.readFileSync(path.join(resultsDir, file)));
                            totalLoggedInUsers += batchData.usersLoggedIn || 0;
                            batchCount++;
                        } catch (error) {
                            log(`Fehler beim Lesen von ${file}: ${error.message}`, 'error');
                        }
                    }
                }

                const minUsers = 5; // Mindestens 5 Benutzer sollten bereit sein
                usersReady = totalLoggedInUsers >= minUsers && batchCount > 0;

                if (usersReady) {
                    log(`${totalLoggedInUsers} Benutzer in ${batchCount} Batches bereit`, 'milestone');
                } else {
                    // Reduziere Logging - nur noch alle STATUS_LOG_INTERVAL Sekunden
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    if (elapsed % CONFIG.STATUS_LOG_INTERVAL === 0) {
                        log(`Warte auf mind. ${minUsers} Benutzer... Aktuell: ${totalLoggedInUsers}`, 'info');
                    }
                    await page.waitForTimeout(5000); // 5 Sekunden warten
                }
            } catch (error) {
                log(`Fehler bei der Benutzerprüfung: ${error.message}`, 'error');
                await page.waitForTimeout(2000);
            }
        }

        if (!usersReady) {
            log('Nicht genügend Benutzer bereit, fahre trotzdem fort', 'warn');
        } else {
            log(`${totalLoggedInUsers} Benutzer bereit, fahre fort`, 'milestone');
            await page.waitForTimeout(5000);
        }

        // Navigiere direkt zum Event
        log('Lade Abstimmungsseite', 'info');
        try {
            await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`);

            await page.waitForSelector('h1 div:has-text("Abstimmungen")', { timeout: 30000 });
            log('Abstimmungsseite geladen', 'milestone');

            // Nach dem ersten Laden kurz warten und Reload durchführen
            await page.waitForTimeout(3000);
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(3000);

            // Prüfe Anzahl der wahlberechtigten Teilnehmer
            const voterCountAfterReload = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
            if (voterCountAfterReload) {
                const match = voterCountAfterReload.match(/(\d+)/);
                if (match && match[1]) {
                    log(`${match[1]} wahlberechtigte Teilnehmer erkannt`, 'info');
                }
            }
        } catch (error) {
            log(`Fehler beim Laden der Abstimmungsseite: ${error.message}`, 'error');

            // Screenshot bei Timeout
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, `error-polls-page-timeout.png`)
            });
        }

        // Zur Abstimmungsverwaltung navigieren
        log('Erstelle neue Abstimmung', 'milestone');
        try {
            await page.click('text=Neue Abstimmung erstellen');
            await page.waitForSelector('text=Neue Abstimmung anlegen', { timeout: 10000 });
        } catch (error) {
            log(`Fehler beim Öffnen des Abstimmungsformulars: ${error.message}`, 'error');

            // Screenshot bei Fehler
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, `error-new-poll-form.png`)
            });

            // Versuche alternative Selektoren
            try {
                const alternativeSelectors = [
                    'button:has-text("Neue Abstimmung")',
                    'a:has-text("Neue Abstimmung")',
                    'button:has-text("Abstimmung erstellen")',
                    '.btn-primary:has-text("Abstimmung")'
                ];

                for (const selector of alternativeSelectors) {
                    const isVisible = await page.locator(selector).isVisible().catch(() => false);
                    if (isVisible) {
                        await page.locator(selector).click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                }
            } catch (e) {
                log(`Fehler mit alternativen Selektoren: ${e.message}`, 'error');
            }
        }

        // Neue Abstimmung erstellen
        const votingTitle = `Lasttest Abstimmung ${new Date().toISOString()}`;
        log(`Erstelle Abstimmung: "${votingTitle}"`, 'info');

        // Speichere den Titel in einer JSON-Datei für andere Tests
        try {
            const fs = require('fs');
            const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }
            const titleFile = path.join(resultsDir, 'poll-title.json');
            fs.writeFileSync(titleFile, JSON.stringify({
                pollTitle: votingTitle,
                timestamp: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            log(`Fehler beim Speichern des Titels: ${error.message}`, 'error');
        }

        // Versuche das Titelfeld zu finden
        const titleSelectors = [
            'input[placeholder="Was soll abgestimmt werden?"]',
            'input[placeholder*="abgestimmt"]',
            'input[placeholder*="Abstimmung"]',
            'textarea[placeholder*="abgestimmt"]',
            'input.poll-title',
            '.form-control[id*="title"]'
        ];

        let titleFieldFound = false;
        for (const selector of titleSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible().catch(() => false);
                if (isVisible) {
                    await page.fill(selector, votingTitle);
                    titleFieldFound = true;
                    break;
                }
            } catch (e) {
                // Nächsten Selektor probieren
            }
        }

        if (!titleFieldFound) {
            log('Titelfeld nicht gefunden', 'error');
            // Screenshot bei Fehler
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, 'error-poll-title-field.png'),
                fullPage: true
            });
        }

        // Prüfe ob Optionen hinzugefügt werden müssen
        const optionsRequired = await page.locator('.form-check, .poll-options input[type="text"]').count() > 0;
        if (optionsRequired) {
            log('Füge Abstimmungsoptionen hinzu', 'info');
            // Versuche die Optionen-Felder zu finden und auszufüllen
            const optionSelectors = [
                '.form-check input[type="text"]',
                '.poll-options input[type="text"]',
                'input[placeholder*="Option"]',
                '.option-input'
            ];

            for (const selector of optionSelectors) {
                try {
                    const optionCount = await page.locator(selector).count();
                    if (optionCount > 0) {
                        // Fülle mindestens 3 Optionen aus
                        for (let i = 0; i < Math.min(optionCount, 3); i++) {
                            await page.locator(selector).nth(i).fill(`Option ${i + 1}`);
                        }
                        break;
                    }
                } catch (e) {
                    // Versuche den nächsten Selektor
                }
            }
        }

        // Abstimmung speichern
        log('Speichere & starte Abstimmung', 'milestone');

        // Versuche verschiedene Selektoren für den Speicher-Button
        const saveButtonSelectors = [
            'text=Abstimmung speichern & sofort starten',
            'button:has-text("speichern & sofort starten")',
            'button:has-text("Speichern & starten")',
            'button.btn-primary:has-text("speichern")',
            'button.btn-primary:has-text("starten")',
            'button[type="submit"]'
        ];

        let saveButtonClicked = false;
        for (const selector of saveButtonSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible().catch(() => false);
                if (isVisible) {
                    await page.click(selector);
                    saveButtonClicked = true;
                    break;
                }
            } catch (e) {
                // Nächsten Selektor probieren
            }
        }

        if (!saveButtonClicked) {
            log('Speicher-Button nicht gefunden', 'error');
            // Screenshot bei Fehler
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, 'error-save-button.png'),
                fullPage: true
            });
        }

        // Bestätigung, falls ein Bestätigungsdialog erscheint
        try {
            // Erweiterte Selektoren für den Bestätigungsdialog
            const confirmSelectors = [
                'text=Bestätigen',
                'button:has-text("Bestätigen")',
                'button:has-text("OK")',
                'button:has-text("Ja")',
                'button.btn-primary:visible',
                '.modal button.btn-primary'
            ];

            for (const selector of confirmSelectors) {
                const isVisible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
                if (isVisible) {
                    await page.click(selector);
                    break;
                }
            }
        } catch (e) {
            // Kein Bestätigungsdialog, ignorieren
        }

        // Wartezeit nach der Abstimmungserstellung
        log('Warte nach Speichern der Abstimmung', 'debug');
        await page.waitForTimeout(5000);

        // Prüfe den Text mit den wahlberechtigten Teilnehmern
        const voterCountText = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
        if (voterCountText) {
            const match = voterCountText.match(/(\d+)/);
            if (match && match[1]) {
                log(`${match[1]} wahlberechtigte Teilnehmer erkannt`, 'info');
            }
        }

        // Überprüfe, ob die Abstimmung tatsächlich erstellt und aktiv ist
        log('Prüfe, ob Abstimmung aktiv ist', 'info');
        const hasActivePoll = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

        if (!hasActivePoll) {
            log('Keine aktive Abstimmung gefunden', 'warn');

            // Versuche die Seite neu zu laden
            log('Lade Seite neu', 'info');
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000);

            // Screenshot bei Problemen
            const screenshotsDir = getScreenshotsDir();
            await page.screenshot({
                path: path.join(screenshotsDir, `error-poll-not-found.png`),
                fullPage: true
            });

            // Prüfe erneut nach dem Reload
            const pollActiveAfterReload = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

            if (pollActiveAfterReload) {
                log('Abstimmung nach Reload gefunden', 'milestone');
            } else {
                log('Keine Abstimmung nach Reload gefunden', 'error');

                // Suche nach anderen UI-Elementen, die auf Abstimmung hindeuten
                const selectors = [
                    '.poll-list-item',
                    '.poll-item',
                    '[data-poll-id]',
                    '.poll-card',
                    '.dashboard-item',
                    '.btn:has-text("Abstimmung")',
                    '.event-polls'
                ];

                for (const selector of selectors) {
                    try {
                        const count = await page.locator(selector).count();
                        if (count > 0) {
                            log(`Gefunden: ${count} Elemente mit Selektor "${selector}"`, 'debug');
                        }
                    } catch (e) {
                        // Ignoriere Fehler
                    }
                }
            }
        } else {
            log('Abstimmung erfolgreich erstellt', 'milestone');
        }

        // Speichere Informationen über die aktive Abstimmung
        try {
            const fs = require('fs');
            const path = require('path');
            const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);

            // Speichere die Organizer-Ergebnisdatei
            const organizerData = {
                pollStarted: true,
                timestamp: new Date().toISOString(),
                pollVisible: hasActivePoll,
                pollId: await page.evaluate(() => {
                    const pollElement = document.querySelector('[data-poll-id]');
                    return pollElement ? pollElement.getAttribute('data-poll-id') : null;
                }).catch(() => null)
            };

            fs.writeFileSync(path.join(resultsDir, 'organizer.json'), JSON.stringify(organizerData, null, 2));
            log('Poll-Status gespeichert', 'info');
        } catch (error) {
            log(`Fehler beim Speichern des Status: ${error.message}`, 'error');
        }

        return true;
    } catch (error) {
        log(`Fehler beim Erstellen der Abstimmung: ${error.message}`, 'error');
        // Screenshot bei allgemeinem Fehler
        const screenshotsDir = getScreenshotsDir();
        await page.screenshot({
            path: path.join(screenshotsDir, 'error-poll-creation-exception.png'),
            fullPage: true
        });
        return false;
    }
}

module.exports = {
    loginAsOrganizer,
    createAndStartPoll
};