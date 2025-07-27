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
            'input[name="email"]',
            'input[type="text"]',
            'input[type="email"]',
            'input[placeholder*="Benutzername"]',
            'input[placeholder*="Username"]',
            'input[placeholder*="E-Mail"]',
            'input[placeholder*="Email"]'
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

        // Fallback: Versuche alle Input-Felder im Organizer-Formular zu finden
        if (!foundUsername) {
            console.warn('Organizer: Konnte Benutzernamefeld mit Standard-Selektoren nicht finden, versuche Fallback...');
            try {
                // Suche nur innerhalb des Organizer-Formulars
                const organizerForm = page.locator('#organizer-login-form, form:has-text("Als Organisator einloggen")');
                const allInputs = await organizerForm.locator('input').all();
                for (const input of allInputs) {
                    const type = await input.getAttribute('type') || 'text';
                    const id = await input.getAttribute('id') || '';
                    const isVisible = await input.isVisible();
                    console.log(`Organizer: Prüfe Input im Organizer-Formular - ID: ${id}, Type: ${type}, Visible: ${isVisible}`);
                    if (isVisible && type !== 'password' && type !== 'hidden' && type !== 'submit') {
                        console.log(`Organizer: Fallback - Benutzernamefeld im Organizer-Formular gefunden (ID: ${id}, type: ${type})`);
                        await input.fill(CONFIG.ORGANIZER_USERNAME);
                        foundUsername = true;
                        break;
                    }
                }
            } catch (e) {
                console.error('Organizer: Fallback fehlgeschlagen:', e);
            }
        }

        if (!foundUsername) {
            console.warn('Organizer: Konnte Benutzernamefeld auch mit Fallback nicht finden!');
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

        // Nur fortfahren wenn beide Felder gefüllt wurden
        if (!foundUsername || !foundPassword) {
            throw new Error(`ORGANIZER LOGIN FAILED: Username gefunden: ${foundUsername}, Password gefunden: ${foundPassword}. Beide Felder müssen ausgefüllt werden!`);
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
                console.error('❌ ORGANIZER LOGIN FEHLGESCHLAGEN!');
                console.error('Aktuelle URL:', url);
                console.error('Mögliche Ursachen:');
                console.error('1. loadtest-admin User existiert nicht in der Datenbank');
                console.error('2. load-test-scenario.sql wurde nicht ausgeführt');
                console.error('3. Falsche Login-Credentials (loadtest-admin:loadtest123)');
                console.error('4. SMTP/Email-Probleme bei der Organizer-Erstellung');
                console.error('5. API-Server nicht erreichbar unter https://voting.failx.de');
                
                throw new Error(`ORGANIZER LOGIN FAILED: Kein Erfolgsindikator gefunden auf URL: ${url}. Bitte führen Sie erst load-test-scenario.sql gegen die Datenbank aus!`);
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
        // Prüfe, ob Benutzer bereit sind, bevor wir die Abstimmung starten
        console.log("Organizer: Prüfe, ob bereits genug Teilnehmer online sind...");
        
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
                const resultsDir = path.join(process.cwd(), 'voting-results');
                
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
                            console.error(`Organizer: Fehler beim Lesen von ${file}:`, error.message);
                        }
                    }
                }
                
                const minUsers = 5; // Mindestens 5 Benutzer sollten bereit sein
                usersReady = totalLoggedInUsers >= minUsers && batchCount > 0;
                
                if (usersReady) {
                    console.log(`Organizer: Insgesamt ${totalLoggedInUsers} Benutzer in ${batchCount} Batches sind bereit!`);
                } else {
                    console.log(`Organizer: Warte auf mehr Benutzer... Aktuell: ${totalLoggedInUsers} von mindestens ${minUsers}`);
                    await page.waitForTimeout(5000); // 5 Sekunden warten
                }
            } catch (error) {
                console.error("Organizer: Fehler bei der Benutzerprüfung:", error.message);
                await page.waitForTimeout(2000);
            }
        }
        
        if (!usersReady) {
            console.warn("Organizer: Warnung - Nicht genügend Benutzer bereit, fahre trotzdem fort...");
        } else {
            console.log(`Organizer: ${totalLoggedInUsers} Benutzer sind eingeloggt. Warte zusätzlich 5 Sekunden, damit die PubSub-Verbindungen vollständig aufgebaut werden können...`);
            await page.waitForTimeout(5000);
        }
        
        // Generiere ein Timestamp für den Reload
        const reloadTimestamp = new Date().toISOString();
        
        // Navigiere direkt zum Event - explizit die URL neu laden
        console.log(`Organizer: Lade Abstimmungsseite neu um ${reloadTimestamp}...`);
        const screenshotsDir = ensureScreenshotsDirectory();
        
        // Screenshot vor dem Reload
        await page.screenshot({ 
            path: path.join(screenshotsDir, `before-explicit-reload-${reloadTimestamp.substring(11, 19).replace(/:/g, '-')}.png`),
            fullPage: true 
        });

        await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`);

        try {
            // Warte auf den Selektor und überprüfe gleichzeitig auf leere Seite
            const whiteScreenTimeout = 10000; // Timeout für Überprüfung
            const startTime = Date.now();
            let isWhiteScreen = true;
            let headerFound = false;
            
            // Warte auf den Header, überprüfe dabei in Intervallen auf leere Seite
            while ((Date.now() - startTime) < 30000) { // 30 Sekunden Gesamttimeout
                try {
                    // Versuche den Header zu finden
                    headerFound = await page.locator('h1 div:has-text("Abstimmungen")').isVisible({ timeout: 1000 });
                    if (headerFound) {
                        console.log("Organizer: Abstimmungsüberschrift gefunden.");
                        break;
                    }
                    
                    // Überprüfe, ob die Seite eine leere weiße Seite ist
                    const elementsCount = await page.evaluate(() => {
                        return {
                            bodyChildCount: document.body?.childElementCount || 0,
                            visibleElements: document.querySelectorAll('div, span, p, h1, h2, h3, button, a, input').length,
                            hasContent: !!document.body?.textContent?.trim()
                        };
                    });
                    
                    isWhiteScreen = elementsCount.bodyChildCount < 3 && 
                                    elementsCount.visibleElements < 5 && 
                                    !elementsCount.hasContent;
                    
                    if (isWhiteScreen) {
                        console.warn("Organizer: WARNUNG - Leere weiße Seite erkannt!");
                        
                        // Mache einen Screenshot der leeren Seite
                        await page.screenshot({ 
                            path: path.join(screenshotsDir, `white-screen-detected-${Date.now()}.png`),
                            fullPage: true 
                        });
                        
                        // Sammle weitere Diagnoseinformationen
                        const diagnostics = await page.evaluate(() => {
                            return {
                                url: window.location.href,
                                documentReadyState: document.readyState,
                                htmlContent: document.documentElement.innerHTML.substring(0, 500), // Ersten 500 Zeichen
                                hasConsoleErrors: typeof window.hasConsoleErrors !== 'undefined' ? window.hasConsoleErrors : 'nicht verfügbar',
                                bodyStyles: window.getComputedStyle(document.body).cssText
                            };
                        });
                        
                        console.log("Organizer: White Screen Diagnostics:", JSON.stringify(diagnostics, null, 2));
                        
                        // Versuche die Seite neu zu laden
                        console.log("Organizer: Versuche die Seite neu zu laden, um die weiße Seite zu beheben...");
                        await page.reload({ waitUntil: 'domcontentloaded' });
                        await page.waitForTimeout(2000);
                    } else {
                        // Gefundene Elemente protokollieren
                        const visibleElements = await page.evaluate(() => {
                            const elements = Array.from(document.querySelectorAll('div, h1, h2, button, a'));
                            return elements.slice(0, 10).map(el => ({
                                tagName: el.tagName,
                                id: el.id,
                                className: el.className,
                                textContent: el.textContent?.substring(0, 50) || ''
                            }));
                        });
                        
                        console.log(`Organizer: Seite lädt... (Elemente gefunden: ${visibleElements.length})`);
                    }
                    
                    // Kurz warten und erneut prüfen
                    await page.waitForTimeout(2000);
                } catch (e) {
                    // Fehler ignorieren und weiter warten
                    await page.waitForTimeout(1000);
                }
            }
            
            if (!headerFound) {
                console.error("Organizer: Abstimmungsüberschrift wurde nicht gefunden!");
                
                // Finaler Check auf weiße Seite
                const finalCheck = await page.evaluate(() => {
                    return {
                        bodyChildCount: document.body?.childElementCount || 0,
                        visibleElements: document.querySelectorAll('div, span, p, h1, h2, h3, button, a, input').length,
                        hasContent: !!document.body?.textContent?.trim(),
                        htmlContent: document.documentElement.innerHTML.substring(0, 1000) // Ersten 1000 Zeichen
                    };
                });
                
                console.log("Organizer: Finaler Seitencheck:", JSON.stringify(finalCheck, null, 2));
                
                // Mache einen Screenshot
                await page.screenshot({ 
                    path: path.join(screenshotsDir, `header-not-found-page-state.png`),
                    fullPage: true 
                });
                
                // Füge JavaScript-Hilfscode ein, um Console-Errors zu erfassen
                await page.evaluate(() => {
                    window.consoleErrors = [];
                    const originalConsoleError = console.error;
                    console.error = function() {
                        window.consoleErrors.push(Array.from(arguments).join(' '));
                        originalConsoleError.apply(console, arguments);
                    };
                });
                
                // Versuche erneut zu laden mit anderer Strategie
                console.log("Organizer: Versuche erneuten Reload mit networkidle2 Strategie...");
                await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`, { 
                    waitUntil: ['networkidle', 'domcontentloaded']
                });
            } else {
                console.log("Organizer: Abstimmungsseite erfolgreich geladen.");
            }
            
            // Nach dem ersten Laden kurz warten und dann mehrere explizite Reloads durchführen
            console.log("Organizer: Warte 3 Sekunden nach dem ersten Laden...");
            await page.waitForTimeout(3000);
            
            // Erster expliziter Reload nach kurzem Warten
            console.log("Organizer: Führe ersten expliziten Reload durch...");
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForTimeout(3000);
            
            // Screenshot nach dem ersten Reload
            await page.screenshot({ 
                path: path.join(screenshotsDir, `after-first-explicit-reload.png`),
                fullPage: true 
            });
            
            // Prüfe Anzahl der wahlberechtigten Teilnehmer nach dem ersten Reload
            console.log("Organizer: Prüfe Anzahl der wahlberechtigten Teilnehmer nach dem ersten Reload...");
            const voterCountAfterFirstReload = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
            if (voterCountAfterFirstReload) {
                console.log(`Organizer: Nach erstem Reload: ${voterCountAfterFirstReload}`);
                
                // Versuche die Zahl zu extrahieren
                const match = voterCountAfterFirstReload.match(/(\d+)/);
                if (match && match[1]) {
                    console.log(`Organizer: Erkannte Anzahl wahlberechtigter Teilnehmer nach erstem Reload: ${match[1]}`);
                }
            }
            
            // Nochmal warten und dann einen zweiten Reload durchführen
            console.log("Organizer: Warte 10 Sekunden vor dem zweiten Reload...");
            await page.waitForTimeout(10000);
            
            // Zweiter expliziter Reload nach längerem Warten
            console.log("Organizer: Führe zweiten expliziten Reload durch...");
            await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(5000);
            
            // Screenshot nach dem zweiten Reload
            await page.screenshot({ 
                path: path.join(screenshotsDir, `after-second-explicit-reload.png`),
                fullPage: true 
            });
            
            // Prüfe Anzahl der wahlberechtigten Teilnehmer nach dem zweiten Reload
            console.log("Organizer: Prüfe Anzahl der wahlberechtigten Teilnehmer nach dem zweiten Reload...");
            const voterCountAfterSecondReload = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
            if (voterCountAfterSecondReload) {
                console.log(`Organizer: Nach zweitem Reload: ${voterCountAfterSecondReload}`);
                
                // Versuche die Zahl zu extrahieren
                const match = voterCountAfterSecondReload.match(/(\d+)/);
                if (match && match[1]) {
                    console.log(`Organizer: Erkannte Anzahl wahlberechtigter Teilnehmer nach zweitem Reload: ${match[1]}`);
                }
            }
        } catch (error) {
            console.error("Organizer: Fehler beim Warten auf Abstimmungsüberschrift:", error.message);

            // Screenshot bei Timeout
            await page.screenshot({
                path: path.join(screenshotsDir, `error-organizer-polls-page-timeout.png`)
            });
            
            // Sammle Informationen über den Zustand der Seite
            try {
                const pageState = await page.evaluate(() => {
                    return {
                        url: window.location.href,
                        documentState: document.readyState,
                        bodyEmpty: document.body.childElementCount === 0,
                        elements: document.body.childElementCount,
                        whiteScreen: document.body.childElementCount < 3 && !document.body.textContent.trim(),
                        htmlLength: document.documentElement.innerHTML.length,
                        networkInfo: performance.getEntriesByType('resource').length,
                        jsErrors: window.consoleErrors || 'not captured'
                    };
                });
                console.error("Organizer: Seite konnte nicht geladen werden. Aktueller Seitenzustand:", JSON.stringify(pageState, null, 2));
                
                // Wenn eine weiße Seite erkannt wurde
                if (pageState.whiteScreen) {
                    console.error("Organizer: WEISSE SEITE ERKANNT! Versuche erneuten Reload mit anderen Parametern...");
                    
                    // Speichere spezifischen Screenshot für weiße Seite
                    await page.screenshot({
                        path: path.join(screenshotsDir, `white-screen-detected-on-timeout.png`)
                    });
                    
                    // Versuche verschiedene Strategien zum Neuladen
                    for (const strategy of ['domcontentloaded', 'networkidle', 'load']) {
                        try {
                            console.log(`Organizer: Versuche Reload mit Strategie '${strategy}'...`);
                            await page.goto(`${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`, { 
                                waitUntil: strategy, 
                                timeout: 30000 
                            });
                            await page.waitForTimeout(5000);
                            
                            // Überprüfe, ob die Seite jetzt geladen ist
                            const newState = await page.evaluate(() => ({
                                elements: document.body.childElementCount,
                                whiteScreen: document.body.childElementCount < 3 && !document.body.textContent.trim()
                            }));
                            
                            if (!newState.whiteScreen && newState.elements > 5) {
                                console.log(`Organizer: Reload mit Strategie '${strategy}' war erfolgreich! Seite geladen.`);
                                await page.screenshot({
                                    path: path.join(screenshotsDir, `reload-success-${strategy}.png`)
                                });
                                break;
                            } else {
                                console.log(`Organizer: Reload mit Strategie '${strategy}' war nicht erfolgreich.`);
                            }
                        } catch (reloadError) {
                            console.error(`Organizer: Fehler beim Reload mit Strategie '${strategy}':`, reloadError.message);
                        }
                    }
                }
            } catch (evalError) {
                console.error("Organizer: Fehler beim Auswerten des Seitenzustands:", evalError.message);
            }

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

        // Längere Wartezeit nach der Abstimmungserstellung
        console.log("Organizer: Warte 5 Sekunden nach dem Speichern der Abstimmung...");
        await page.waitForTimeout(5000);

        // Screenshot der aktuellen Seite machen
        console.log("Organizer: Erstelle Screenshot der Abstimmungsseite...");
        await page.screenshot({ 
            path: path.join(screenshotsDir, `poll-creation-before-check.png`),
            fullPage: true 
        });
        
        // Prüfe den Text mit den wahlberechtigten Teilnehmern
        console.log("Organizer: Prüfe Anzahl der wahlberechtigten Teilnehmer...");
        const voterCountText = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
        if (voterCountText) {
            console.log(`Organizer: ${voterCountText}`);
            
            // Versuche die Zahl zu extrahieren
            const match = voterCountText.match(/(\d+)/);
            if (match && match[1]) {
                console.log(`Organizer: Erkannte Anzahl wahlberechtigter Teilnehmer: ${match[1]}`);
            }
        } else {
            console.log("Organizer: Keine Information über wahlberechtigte Teilnehmer gefunden");
        }
        
        // Prüfe, ob der Button zum Erstellen oder Speichern disabled ist
        console.log("Organizer: Prüfe Status der Abstimmungs-Buttons...");
        
        // Prüfe mehrere mögliche Button-Texte
        const buttonSelectors = [
            'button:has-text("Neue Abstimmung erstellen")',
            'button:has-text("Abstimmung erstellen")',
            'button:has-text("Abstimmung speichern")',
            'button:has-text("Abstimmung speichern & sofort starten")',
            'button:has-text("speichern & sofort starten")',
            'button.btn-primary:has-text("speichern")',
            'button[type="submit"]'
        ];
        
        // Überprüfe jeden möglichen Button
        for (const selector of buttonSelectors) {
            const buttonCount = await page.locator(selector).count().catch(() => 0);
            if (buttonCount > 0) {
                console.log(`Organizer: Gefunden: ${buttonCount} Buttons mit Selektor "${selector}"`);
                
                // Prüfe, ob der Button deaktiviert ist
                const isDisabled = await page.locator(selector).isDisabled().catch(() => null);
                if (isDisabled !== null) {
                    console.log(`Organizer: Button "${selector}" ist ${isDisabled ? 'deaktiviert' : 'aktiviert'}`);
                    
                    if (isDisabled) {
                        console.log(`Organizer: WARNUNG - Button "${selector}" ist deaktiviert. Teilnehmer werden möglicherweise nicht erkannt!`);
                        
                        // Versuche den Tooltip oder Hilfetext zu finden
                        const tooltipText = await page.locator(`${selector}[title]`).getAttribute("title").catch(() => null);
                        if (tooltipText) {
                            console.log(`Organizer: Tooltip-Text des Buttons: "${tooltipText}"`);
                        }
                    }
                    
                    // Versuche den Text des Buttons auszulesen
                    const buttonText = await page.locator(selector).innerText().catch(() => null);
                    if (buttonText) {
                        console.log(`Organizer: Button-Text: "${buttonText}"`);
                    }
                }
            }
        }
                
        // Suche nach Fehlermeldungen oder Hilfetexten auf der Seite
        const errorMessages = await page.locator('.alert, .error-message, .warning, .info-text').innerText().catch(() => null);
        if (errorMessages) {
            console.log(`Organizer: Gefundene Fehlermeldungen oder Hilfetexte: "${errorMessages}"`);
        }
        
        // Überprüfe, ob die Abstimmung tatsächlich erstellt und aktiv ist
        console.log("Organizer: Überprüfe, ob die Abstimmung aktiv ist...");
        const hasActivePoll = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

        if (!hasActivePoll) {
            console.warn("Organizer: WARNUNG - Keine aktive Abstimmung gefunden!");

            // Versuche die Seite neu zu laden, um zu sehen, ob die Abstimmung dann angezeigt wird
            console.log("Organizer: Lade die Seite neu, um nach der Abstimmung zu suchen...");
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000); // Längeres Warten nach dem Reload
            
            // Screenshot nach Reload
            await page.screenshot({ 
                path: path.join(screenshotsDir, `poll-creation-after-reload.png`),
                fullPage: true 
            });
            
            // Prüfe erneut Anzahl der wahlberechtigten Teilnehmer nach Reload
            console.log("Organizer: Prüfe Anzahl der wahlberechtigten Teilnehmer nach Reload...");
            const voterCountTextAfterReload = await page.locator('p:has-text("Aktuelle Anzahl wahlberechtigter Teilnehmer")').innerText().catch(() => null);
            if (voterCountTextAfterReload) {
                console.log(`Organizer: Nach Reload: ${voterCountTextAfterReload}`);
                
                // Versuche die Zahl zu extrahieren
                const match = voterCountTextAfterReload.match(/(\d+)/);
                if (match && match[1]) {
                    console.log(`Organizer: Erkannte Anzahl wahlberechtigter Teilnehmer nach Reload: ${match[1]}`);
                }
            } else {
                console.log("Organizer: Keine Information über wahlberechtigte Teilnehmer nach Reload gefunden");
            }
            
            // Prüfe, ob der Button zum Erstellen disabled ist nach Reload
            console.log("Organizer: Prüfe Status der Abstimmungs-Buttons nach Reload...");
            
            // Prüfe mehrere mögliche Button-Texte
            for (const selector of buttonSelectors) {
                const buttonCount = await page.locator(selector).count().catch(() => 0);
                if (buttonCount > 0) {
                    console.log(`Organizer: Nach Reload gefunden: ${buttonCount} Buttons mit Selektor "${selector}"`);
                    
                    // Prüfe, ob der Button deaktiviert ist
                    const isDisabled = await page.locator(selector).isDisabled().catch(() => null);
                    if (isDisabled !== null) {
                        console.log(`Organizer: Nach Reload - Button "${selector}" ist ${isDisabled ? 'deaktiviert' : 'aktiviert'}`);
                        
                        if (isDisabled) {
                            console.log(`Organizer: WARNUNG - Button "${selector}" ist nach Reload deaktiviert!`);
                            
                            // Versuche den Tooltip oder Hilfetext zu finden
                            const tooltipText = await page.locator(`${selector}[title]`).getAttribute("title").catch(() => null);
                            if (tooltipText) {
                                console.log(`Organizer: Tooltip-Text des Buttons nach Reload: "${tooltipText}"`);
                            }
                        }
                        
                        // Versuche den Text des Buttons auszulesen
                        const buttonText = await page.locator(selector).innerText().catch(() => null);
                        if (buttonText) {
                            console.log(`Organizer: Button-Text nach Reload: "${buttonText}"`);
                        }
                    }
                }
            }
            
            // Suche nach Fehlermeldungen oder Hilfetexten auf der Seite nach Reload
            const errorMessagesAfterReload = await page.locator('.alert, .error-message, .warning, .info-text').innerText().catch(() => null);
            if (errorMessagesAfterReload) {
                console.log(`Organizer: Gefundene Fehlermeldungen oder Hilfetexte nach Reload: "${errorMessagesAfterReload}"`);
            }

            // Prüfe erneut nach dem Reload
            const pollActiveAfterReload = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

            if (pollActiveAfterReload) {
                console.log("Organizer: Aktive Abstimmung nach Reload gefunden!");
            } else {
                console.error("Organizer: FEHLER - Keine aktive Abstimmung nach Reload gefunden!");
                
                // Zusätzliche Diagnoseinformationen
                console.log("Organizer: Versuche weitere UI-Elemente zu finden...");
                
                // Versuche verschiedene UI-Elemente zu finden, die auf eine erfolgreiche Abstimmungserstellung hindeuten könnten
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
                            console.log(`Organizer: Gefunden: ${count} Elemente mit Selektor "${selector}"`);
                        }
                    } catch (e) {
                        // Ignoriere Fehler bei Selektoren
                    }
                }
                
                // Mache einen Screenshot der aktuellen Seite
                const screenshotsDir = ensureScreenshotsDirectory();
                await page.screenshot({ 
                    path: path.join(screenshotsDir, `poll-creation-current-state.png`),
                    fullPage: true 
                });
            }
        } else {
            console.log("Organizer: Aktive Abstimmung erfolgreich erstellt!");
        }
        
        // Speichere Informationen über die aktive Abstimmung
        try {
            const fs = require('fs');
            const path = require('path');
            const resultsDir = path.join(process.cwd(), 'voting-results');
            
            // Speichere die Organizer-Ergebnisdatei
            const organizerData = {
                pollStarted: true,
                timestamp: new Date().toISOString(),
                pollVisible: hasActivePoll,
                // Versuche, die Poll-ID aus der UI zu extrahieren (falls möglich)
                pollId: await page.evaluate(() => {
                    const pollElement = document.querySelector('[data-poll-id]');
                    return pollElement ? pollElement.getAttribute('data-poll-id') : null;
                }).catch(() => null)
            };
            
            fs.writeFileSync(path.join(resultsDir, 'organizer.json'), JSON.stringify(organizerData, null, 2));
            console.log("Organizer: Poll-Status in organizer.json gespeichert");
        } catch (error) {
            console.error("Organizer: Fehler beim Speichern des Poll-Status:", error.message);
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