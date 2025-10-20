// loginOrganizer.js
const { CONFIG } = require('./config');
const { ensureScreenshotsDirectory } = require('./utils');
const path = require('path');

// Login als Organisator
async function loginAsOrganizer(page) {
    try {
        console.log('Organizer: Starte Login-Prozess');
        await page.goto(`${CONFIG.CLIENT_URL}`);

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
                    console.log(`Organizer: Benutzernamefeld gefunden mit Selektor ${selector}`);
                    await page.fill(selector, CONFIG.ORGANIZER_USERNAME);
                    foundUsername = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!foundUsername) {
            console.warn('Organizer: Konnte Benutzernamefeld nicht finden!');
        }

        // Finde und fülle das Passwortfeld
        let foundPassword = false;
        for (const selector of passwordSelectors) {
            try {
                const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
                if (visible) {
                    console.log(`Organizer: Passwortfeld gefunden mit Selektor ${selector}`);
                    await page.fill(selector, CONFIG.ORGANIZER_PASSWORD);
                    foundPassword = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!foundPassword) {
            console.warn('Organizer: Konnte Passwortfeld nicht finden!');
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
                    console.log(`Organizer: Login-Button gefunden mit Selektor ${selector}`);
                    await page.click(selector);
                    buttonClicked = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!buttonClicked) {
            console.warn('Organizer: Konnte keinen Login-Button finden!');
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
                console.log(`Organizer: Login erfolgreich (${selector} gefunden)`);
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
                console.log(`Organizer: URL deutet auf erfolgreichen Login hin: ${url}`);
                loginSuccess = true;
            } else {
                console.warn('Organizer: Kein Erfolgsindikator nach Login gefunden!');
            }
        }

        return loginSuccess;
    } catch (error) {
        console.error('Fehler beim Login als Organizer:', error.message);
        return false;
    }
}

// Öffne einen neuen Poll als Organizer
async function createAndStartPoll(page) {
    try {
        // Navigiere zum Event
        console.log("Organizer: Navigiere zur Abstimmungsseite...");
        const screenshotsDir = ensureScreenshotsDirectory();

        await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`);

        try {
            await page.waitForSelector('h1 div:has-text("Abstimmungen")', { timeout: 30000 });
        } catch (error) {
            console.error("Organizer: Fehler beim Warten auf Abstimmungsüberschrift:", error.message);

            // Screenshot bei Timeout
            await page.screenshot({
                path: path.join(screenshotsDir, `error-organizer-polls-page-timeout.png`)
            });

            // Versuche trotzdem fortzufahren
        }

        // Zur Abstimmungsverwaltung navigieren
        console.log("Organizer: Klicke auf 'Neue Abstimmung erstellen'");
        try {
            await page.click('text=Neue Abstimmung erstellen');
            console.log("Organizer: Klick erfolgreich");
            await page.waitForSelector('text=Neue Abstimmung anlegen', { timeout: 10000 });
            console.log("Organizer: Neue Abstimmung anlegen Formular erschienen");
        } catch (error) {
            console.error("Organizer: Fehler beim Öffnen des Abstimmungsformulars:", error.message);

            // Versuche alternative Selektoren
            try {
                console.log("Organizer: Versuche alternative Selektoren für 'Neue Abstimmung erstellen'");
                const alternativeSelectors = [
                    'button:has-text("Neue Abstimmung")',
                    'a:has-text("Neue Abstimmung")',
                    'button:has-text("Abstimmung erstellen")',
                    '.btn-primary:has-text("Abstimmung")'
                ];

                for (const selector of alternativeSelectors) {
                    const isVisible = await page.locator(selector).isVisible().catch(() => false);
                    if (isVisible) {
                        console.log(`Organizer: Alternative Schaltfläche gefunden: ${selector}`);
                        await page.locator(selector).click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                }
            } catch (e) {
                console.error("Organizer: Auch alternative Selektoren fehlgeschlagen:", e.message);
            }
        }

        // Neue Abstimmung erstellen
        const votingTitle = `Lasttest Abstimmung ${new Date().toISOString()}`;
        console.log(`Organizer: Erstelle Abstimmung mit Titel "${votingTitle}"`);

        // Speichere den Titel in einer JSON-Datei für andere Tests
        try {
            const fs = require('fs');
            const resultsDir = path.join(process.cwd(), 'voting-results');
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }
            const titleFile = path.join(resultsDir, 'poll-title.json');
            fs.writeFileSync(titleFile, JSON.stringify({
                pollTitle: votingTitle,
                timestamp: new Date().toISOString()
            }, null, 2));
            console.log(`Organizer: Abstimmungstitel "${votingTitle}" für Tests gespeichert`);
        } catch (error) {
            console.error('Fehler beim Speichern des Abstimmungstitels:', error.message);
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
                    console.log(`Organizer: Titelfeld gefunden mit Selektor ${selector}`);
                    await page.fill(selector, votingTitle);
                    titleFieldFound = true;
                    break;
                }
            } catch (e) {
                // Nächsten Selektor probieren
            }
        }

        if (!titleFieldFound) {
            console.error("Organizer: FEHLER - Konnte kein Titelfeld für die Abstimmung finden!");
            // Mache einen Screenshot
            await page.screenshot({
                path: path.join(screenshotsDir, 'poll-creation-error.png'),
                fullPage: true
            });
            console.log("Organizer: Screenshot gespeichert als 'poll-creation-error.png'");
        }

        // Prüfe ob Optionen hinzugefügt werden müssen
        const optionsRequired = await page.locator('.form-check, .poll-options input[type="text"]').count() > 0;
        if (optionsRequired) {
            console.log("Organizer: Füge Abstimmungsoptionen hinzu...");
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
        console.log("Organizer: Klicke auf 'Abstimmung speichern & sofort starten'");

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
                    console.log(`Organizer: Speicher-Button gefunden mit Selektor ${selector}`);
                    await page.click(selector);
                    saveButtonClicked = true;
                    break;
                }
            } catch (e) {
                // Nächsten Selektor probieren
            }
        }

        if (!saveButtonClicked) {
            console.error("Organizer: FEHLER - Konnte keinen Speicher-Button finden!");
            // Mache einen Screenshot
            await page.screenshot({
                path: path.join(screenshotsDir, 'save-button-error.png'),
                fullPage: true
            });
            console.log("Organizer: Screenshot gespeichert als 'save-button-error.png'");
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
                    console.log(`Organizer: Bestätigungsdialog gefunden mit Selektor ${selector}`);
                    await page.click(selector);
                    console.log("Organizer: Bestätigungsdialog bestätigt");
                    break;
                }
            }
        } catch (e) {
            console.log("Organizer: Kein Bestätigungsdialog gefunden, fahre fort...");
        }

        // Warte kurz, damit die Änderungen wirksam werden
        await page.waitForTimeout(3000);

        // Überprüfe, ob die Abstimmung tatsächlich erstellt und aktiv ist
        console.log("Organizer: Überprüfe, ob die Abstimmung aktiv ist...");
        const hasActivePoll = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

        if (!hasActivePoll) {
            console.warn("Organizer: WARNUNG - Keine aktive Abstimmung gefunden!");

            // Versuche die Seite neu zu laden, um zu sehen, ob die Abstimmung dann angezeigt wird
            console.log("Organizer: Lade die Seite neu, um nach der Abstimmung zu suchen...");
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Prüfe erneut nach dem Reload
            const pollActiveAfterReload = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

            if (pollActiveAfterReload) {
                console.log("Organizer: Aktive Abstimmung nach Reload gefunden!");
            } else {
                console.error("Organizer: FEHLER - Keine aktive Abstimmung nach Reload gefunden!");
            }
        } else {
            console.log("Organizer: Aktive Abstimmung erfolgreich erstellt!");
        }

        return true;
    } catch (error) {
        console.error('Fehler beim Erstellen der Abstimmung:', error.message);
        return false;
    }
}

module.exports = {
    loginAsOrganizer,
    createAndStartPoll
};