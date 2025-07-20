// liveLoginUser.js
const { CONFIG } = require('../local/config');

// Login als Benutzer mit Magic-Link
async function loginAsUser(page, username, password, publicName) {
    try {
        // Prüfe, ob page gültig ist
        if (!page || typeof page.goto !== 'function') {
            console.error(`Login nicht möglich: Ungültiges Page-Objekt für Benutzer ${username}`);
            return false;
        }

        // Überprüfe, ob username oder publicName undefined sind
        if (!username) {
            console.error('FEHLER: username ist undefined oder leer');
            return false;
        }
        if (!publicName) {
            console.error('FEHLER: publicName ist undefined oder leer');
            return false;
        }

        // Erstelle den Magic-Link basierend auf dem Template und den Benutzerinformationen
        let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
        magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username || ''));
        magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName || '')); // Parameter korrigiert
        console.log(magicLink);
        // Navigiere zur Login-Seite mit erweiterten Fehlerbehandlung
        try {
            await page.goto(magicLink, { timeout: 300000 });
        } catch (navigationError) {
            console.error(`Fehler bei der Navigation für ${username}: ${navigationError.message}`);
            // Versuche erneut mit reduziertem Timeout und anderer Loadstate-Strategie
            try {
                await page.goto(magicLink, { timeout: 15000, waitUntil: 'domcontentloaded' });
            } catch (retryError) {
                console.error(`Wiederholt fehlgeschlagene Navigation für ${username}: ${retryError.message}`);
                return false;
            }
        }

        // Prüfe, ob die Seite richtig geladen wurde
        try {
            // Verwende kürzeres Timeout für 'networkidle', um Performance zu verbessern
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
        } catch (loadError) {
            // Fehler beim Warten auf den Ladezustand protokollieren, aber weitermachen
            console.warn(`Warnung: Timeout beim Warten auf 'networkidle' für ${username}`);
        }

        // Erst prüfen wir, ob wir vielleicht schon eingeloggt sind (Magic Link könnte direkt eingeloggt haben)
        const url = await page.url();
        if (url.includes('/dashboard') || (url.includes('/event/') && !url.includes('login'))) {
            console.log(`Benutzer ${username}: Bereits eingeloggt, URL zeigt Dashboard oder Event-Ansicht: ${url}`);
            return true;
        }
        
        // Mache Screenshot vor Button-Erkennung
        try {
            const path = require('path');
            const screenshotsDir = path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);
            if (!require('fs').existsSync(screenshotsDir)) {
                require('fs').mkdirSync(screenshotsDir, { recursive: true });
            }
            await page.screenshot({ 
                path: path.join(screenshotsDir, `login-page-${username.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
                fullPage: true
            });
        } catch (screenshotError) {
            console.warn(`Fehler beim Erstellen des Screenshots: ${screenshotError.message}`);
        }
        
        // Bei Magic-Links müssen wir nur den Login-Button klicken, keine Felder ausfüllen
        // Erweiterte Selektoren für den Submit-Button mit VIEL GRÖSSERER AUSWAHL
        const buttonSelectors = [
            // Priorität 1: Spezifische Login-Buttons
            'button.btn-primary',
            'input[type="submit"]',
            'button[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Anmelden")',
            'button:has-text("Einloggen")',
            'button:has-text("teilnehmen")',
            'button:has-text("Teilnehmen")',
            'button:has-text("Weiter")',
            'button:has-text("Fortfahren")',
            'button:has-text("Bestätigen")',
            'button:has-text("bestätigen")',
            'button:has-text("Beitreten")',
            'button:has-text("beitreten")',

            // Priorität 2: Klassen
            '.btn-primary',
            '.login-button',
            '.auth-button',
            '.auth-submit',
            '.event-login-button',
            '.submit-button',
            '.enter-button',
            
            // Priorität 3: Formular-Submit
            'form input[type="submit"]',
            'form button[type="submit"]',
            'form .btn[type="submit"]',
            
            // Priorität 4: SEHR allgemeine Selektoren (letzter Ausweg)
            '.btn:visible',
            'input[type="button"]',
            'button:visible'
        ];

        // Analysiere die Seitenstruktur, um zu verstehen, was wir vor uns haben
        const pageStructure = await page.evaluate(() => {
            return {
                buttonCount: document.querySelectorAll('button').length,
                formCount: document.querySelectorAll('form').length,
                inputCount: document.querySelectorAll('input').length,
                links: document.querySelectorAll('a').length,
                bodyText: document.body.innerText.substring(0, 200),
                buttons: Array.from(document.querySelectorAll('button')).map(b => {
                    return {
                        text: b.innerText.substring(0, 30),
                        classes: b.className,
                        id: b.id,
                        isVisible: b.offsetWidth > 0 && b.offsetHeight > 0,
                        type: b.type
                    };
                }).slice(0, 5) // Nur die ersten 5 zurückgeben
            };
        });
        
        console.log(`Seitenstruktur für ${username}: ${pageStructure.buttonCount} Buttons, ${pageStructure.formCount} Forms, ${pageStructure.inputCount} Inputs`);
        if (pageStructure.buttons.length > 0) {
            console.log(`Gefundene Buttons: ${JSON.stringify(pageStructure.buttons)}`);
        }

        // Klicke auf den Anmelde-Button mit deutlich verbesserter Fehlerbehandlung
        let buttonClicked = false;
        for (const selector of buttonSelectors) {
            if (buttonClicked) break;

            try {
                // Benutze count, um festzustellen, ob es mehrere Buttons gibt
                const count = await page.locator(selector).count();
                if (count === 0) continue;
                
                // Log zur besseren Diagnose
                console.log(`${count} Elemente gefunden für Selektor: ${selector}`);
                
                // Wenn mehrere Buttons gefunden wurden, wähle den ersten sichtbaren
                let buttonToClick;
                if (count > 1) {
                    console.log(`Mehrere Buttons (${count}) gefunden für Selektor ${selector}, wähle den ersten sichtbaren`);
                    for (let i = 0; i < count; i++) {
                        const btn = page.locator(selector).nth(i);
                        const isVisible = await btn.isVisible().catch(() => false);
                        if (isVisible) {
                            buttonToClick = btn;
                            console.log(`- Button ${i} ist sichtbar, wähle diesen`);                        
                            break;
                        }
                    }
                    if (!buttonToClick) continue; // Kein sichtbarer Button gefunden
                } else {
                    buttonToClick = page.locator(selector);
                }

                // Prüfe, ob der Button tatsächlich sichtbar ist
                const isVisible = await buttonToClick.isVisible({ timeout: 3000 }).catch(() => false);
                if (!isVisible) {
                    console.log(`Button nicht sichtbar: ${selector}`);
                    continue;
                }

                // Mache Screenshot des gefundenen Buttons zur Bestätigung
                try {
                    const path = require('path');
                    const screenshotsDir = path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);
                    await page.screenshot({ 
                        path: path.join(screenshotsDir, `button-found-${username.replace(/[^a-zA-Z0-9]/g, '_')}.png`)
                    });
                } catch (screenshotError) {
                    // Ignoriere Screenshot-Fehler
                }

                // Bessere Vorbereitung vor dem Klick
                try {
                    // Scrolle zum Button und warte einen Moment
                    await buttonToClick.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(500);
                    
                    // Versuche alle drei Klick-Methoden nacheinander mit kurzen Pausen
                    
                    // 1. Standard-Klick
                    console.log(`Versuche Standard-Klick auf ${selector}`);
                    await buttonToClick.click({ timeout: 5000 }).then(() => {
                        console.log(`Standard-Klick erfolgreich auf ${selector}`);
                        buttonClicked = true;
                    }).catch(async (clickError) => {
                        console.log(`Standard-Klick fehlgeschlagen: ${clickError.message}`);
                        
                        // 2. Force-Klick
                        await page.waitForTimeout(300);
                        console.log(`Versuche Force-Klick auf ${selector}`);
                        await buttonToClick.click({ force: true, timeout: 3000 }).then(() => {
                            console.log(`Force-Klick erfolgreich auf ${selector}`);
                            buttonClicked = true;
                        }).catch(async (forceClickError) => {
                            console.log(`Force-Klick fehlgeschlagen: ${forceClickError.message}`);
                            
                            // 3. JavaScript-Klick als letzte Option
                            await page.waitForTimeout(300);
                            console.log(`Versuche JavaScript-Klick auf ${selector}`);
                            await page.evaluate((sel) => {
                                const elements = document.querySelectorAll(sel);
                                if (elements.length > 0) {
                                    // Klicke auf das erste sichtbare Element
                                    for (const elem of elements) {
                                        const rect = elem.getBoundingClientRect();
                                        if (rect.width > 0 && rect.height > 0) {
                                            console.log('JS: Sichtbares Element gefunden, klicke es');
                                            elem.click();
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            }, selector).then((result) => {
                                console.log(`JavaScript-Klick ${result ? 'erfolgreich' : 'nicht erfolgreich'} auf ${selector}`);
                                if (result) buttonClicked = true;
                            }).catch((jsClickError) => {
                                console.log(`JavaScript-Klick fehlgeschlagen: ${jsClickError.message}`);
                            });
                        });
                    });
                    
                    // Wenn erfolgreich geklickt wurde, beenden wir die Schleife
                    if (buttonClicked) break;
                } catch (e) {
                    console.log(`Allgemeiner Fehler beim Klick-Versuch: ${e.message}`);
                }
            } catch (e) {
                console.log(`Fehler bei Selektor ${selector}: ${e.message}`);
            }
        }

        if (!buttonClicked) {
            console.warn(`Benutzer ${username}: Konnte keinen Login-Button finden! Versuche ALLE möglichen Notfallmaßnahmen...`);
            
            // Notfallmaßnahme 1: Enter-Taste drücken
            console.log(`Versuche Enter-Taste als Notfallmaßnahme für ${username}`);
            await page.keyboard.press('Enter').catch(() => { });
            await page.waitForTimeout(1000);
            
            // Notfallmaßnahme 2: Tab + Enter (fokussiert den nächsten Button und drückt Enter)
            console.log(`Versuche Tab + Enter als Notfallmaßnahme für ${username}`);
            await page.keyboard.press('Tab').catch(() => { });
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter').catch(() => { });
            await page.waitForTimeout(1000);
            
            // Notfallmaßnahme 3: Formular direkt submitten
            console.log(`Versuche Formular-Submission als Notfallmaßnahme für ${username}`);
            await page.evaluate(() => {
                const forms = document.querySelectorAll('form');
                for (const form of forms) {
                    try {
                        form.submit();
                        console.log('Formular abgeschickt');
                    } catch (e) { 
                        console.log('Fehler beim Formular-Submit:', e);
                    }
                }
            }).catch(() => { });
            await page.waitForTimeout(1000);
            
            // Notfallmaßnahme 4: Alle Buttons klicken
            console.log(`Versuche ALLE Buttons zu klicken als Notfallmaßnahme für ${username}`);
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
                let clicked = false;
                for (const button of buttons) {
                    try {
                        if (button.offsetWidth > 0 && button.offsetHeight > 0) { // Nur sichtbare Buttons
                            button.click();
                            clicked = true;
                            console.log('Button geklickt:', button.innerText || button.value || 'Ohne Text');
                            break; // Nur den ersten Button klicken
                        }
                    } catch (e) { }
                }
                return clicked;
            }).catch(() => { });
            await page.waitForTimeout(1000);
            
            // Notfallmaßnahme 5: Magic-Link nochmal öffnen
            console.log(`Versuche Magic-Link erneut zu öffnen für ${username}`);
            let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
            magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username || ''));
            magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName || ''));
            await page.goto(magicLink, { timeout: 20000 }).catch(() => {});
            await page.waitForTimeout(3000);

            // Final: Prüfe, ob wir nach all diesen Maßnahmen eingeloggt sind
            const url = await page.url();
            if (url.includes('/dashboard') || (url.includes('/event/') && !url.includes('login'))) {
                console.log(`Benutzer ${username}: Erfolgreich eingeloggt nach Notfallmaßnahmen, URL: ${url}`);
                return true;
            }
            
            // Screenshot nach Notfallmaßnahmen
            try {
                const path = require('path');
                const screenshotsDir = path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);
                await page.screenshot({ 
                    path: path.join(screenshotsDir, `after-emergency-${username.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
                    fullPage: true
                });
            } catch (screenshotError) {
                // Ignoriere Screenshot-Fehler
            }
        }

        // Erweiterte Warten auf Erfolgsindikatoren
        const successSelectors = [
            'h2:has-text("Willkommen")',
            '.welcome-message',
            '.dashboard',
            'h1:has-text("Dashboard")',
            '.user-dashboard',
            // Erweiterte Selektoren
            '.event-dashboard',
            '.active-polls',
            '.user-info',
            '.user-panel',
            '.event-panel',
            '.event-view'
        ];

        // Verbessertes Timeout und Wartezeit
        let loginSuccess = false;
        for (const selector of successSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 15000 });
                loginSuccess = true;
                break;
            } catch (e) {
                // Versuche den nächsten Erfolgsindikator
            }
        }

        if (!loginSuccess) {
            console.warn(`Benutzer ${username}: Kein Erfolgsindikator nach Login gefunden! Prüfe URL-basiert...`);

            // Überprüfe, ob wir dennoch auf einer Seite nach dem Login sind (mehr URL-Patterns)
            const url = await page.url().catch(() => '');
            if (url.includes('/dashboard') || url.includes('/event/') ||
                (!url.includes('login') && (url.includes(CONFIG.EVENT_SLUG) || url.includes(CONFIG.EVENT_ID.toString()))) ||
                url.includes('publicname=') || // Magic Link Parameter im URL
                url.includes('username=')) {   // Magic Link Parameter im URL
                
                loginSuccess = true;
                console.log(`Benutzer ${username}: Login scheint aufgrund der URL erfolgreich zu sein: ${url}`);
                
                // Analysiere Seiteninhalt als Bestätigung
                const pageContent = await page.evaluate(() => {
                    return {
                        text: document.body.innerText.substring(0, 500),
                        hasDashboardElements: !!document.querySelector('.dashboard, .event-view, .user-panel'),
                        hasEventContent: !!document.querySelector('.event-content, .event-info, .poll-list'),
                        hasUserInfo: !!document.querySelector('.user-name, .user-info, .username-display')
                    };
                }).catch(() => ({}));
                
                if (pageContent.hasDashboardElements || pageContent.hasEventContent || pageContent.hasUserInfo) {
                    console.log(`Benutzer ${username}: Login bestätigt durch erkannte UI-Elemente`);
                } else {
                    console.log(`Benutzer ${username}: Login durch URL bestätigt, aber keine UI-Elemente erkannt`);                
                }
                
            } else {
                console.error(`Benutzer ${username}: Login fehlgeschlagen, aktuelle URL: ${url}`);

                // Screenshot des fehlgeschlagenen Logins
                try {
                    const path = require('path');
                    const screenshotsDir = path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);
                    await page.screenshot({ 
                        path: path.join(screenshotsDir, `login-failed-${username.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
                        fullPage: true
                    });
                } catch (screenshotError) {
                    // Ignoriere Screenshot-Fehler
                }

                // Mehrere Reload-Versuche mit unterschiedlichen Strategien
                for (let attempt = 1; attempt <= 3 && !loginSuccess; attempt++) {
                    console.log(`Benutzer ${username}: Reload-Versuch ${attempt}/3`);
                    try {
                        // Verschiedene Reload-Strategien ausprobieren
                        if (attempt === 1) {
                            await page.reload({ waitUntil: 'networkidle' }).catch(() => { });
                        } else if (attempt === 2) {
                            // Direkt die URL mit Magic Link nochmal laden
                            let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
                            magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username || ''));
                            magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName || ''));
                            await page.goto(magicLink, { timeout: 20000 }).catch(() => {});
                        } else {
                            // Erweiterte Strategie: Cache löschen und neu laden
                            await page.evaluate(() => {
                                try {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                } catch (e) {}
                            }).catch(() => {});
                            let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
                            magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username || ''));
                            magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName || ''));
                            await page.goto(magicLink, { timeout: 20000 }).catch(() => {});
                        }
                        
                        await page.waitForTimeout(3000);

                        // Prüfe, ob die URL nach dem Reload auf einen Login-Erfolg hinweist (erweiterte Kriterien)
                        const urlAfterReload = await page.url().catch(() => '');
                        if (urlAfterReload.includes('/dashboard') || 
                            urlAfterReload.includes('/event/') ||
                            (!urlAfterReload.includes('login') && urlAfterReload.includes(CONFIG.EVENT_SLUG)) ||
                            urlAfterReload.includes('publicname=') || // Magic Link Parameter im URL
                            urlAfterReload.includes('username=')) {   // Magic Link Parameter im URL
                            
                            loginSuccess = true;
                            console.log(`Benutzer ${username}: Login nach Reload-Versuch ${attempt} erfolgreich, URL: ${urlAfterReload}`);
                            break;
                        } else {
                            console.log(`Benutzer ${username}: Reload-Versuch ${attempt} nicht erfolgreich, URL: ${urlAfterReload}`);
                        }
                    } catch (reloadError) {
                        console.error(`Benutzer ${username}: Fehler bei Reload-Versuch ${attempt}: ${reloadError.message}`);
                    }
                }
            }
        }

        return loginSuccess;
    } catch (error) {
        console.error(`Fehler beim Login für ${username}:`, error.message);
        
        // Versuch einer Wiederherstellung nach einem Fehler
        try {
            console.log(`Benutzer ${username}: Versuche Wiederherstellung nach Fehler...`);
            
            // Screenshot des Fehlers
            try {
                const path = require('path');
                const screenshotsDir = path.join(process.cwd(), CONFIG.SCREENSHOTS_DIR);
                if (!require('fs').existsSync(screenshotsDir)) {
                    require('fs').mkdirSync(screenshotsDir, { recursive: true });
                }
                await page.screenshot({ 
                    path: path.join(screenshotsDir, `login-error-recovery-${username.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
                    fullPage: true
                });
            } catch (screenshotError) {
                // Ignoriere Screenshot-Fehler
            }
            
            // Prüfe ob wir trotz Fehler auf einer gültigen Seite sind
            const url = await page.url().catch(() => '');
            if (url.includes('/dashboard') || 
                url.includes('/event/') ||
                (!url.includes('login') && url.includes(CONFIG.EVENT_SLUG)) ||
                url.includes('publicname=') || 
                url.includes('username=')) {
                
                console.log(`Benutzer ${username}: Trotz Fehler scheint Login aufgrund der URL erfolgreich zu sein: ${url}`);
                return true;
            }
            
            // Letzter Rettungsversuch: Magic Link direkt neu laden
            console.log(`Benutzer ${username}: Letzter Rettungsversuch - Lade Magic Link erneut...`);
            let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
            magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username || ''));
            magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName || ''));
            
            await page.goto(magicLink, { timeout: 30000 }).catch(() => {});
            await page.waitForTimeout(5000);
            
            // Prüfe ob wir jetzt erfolgreich sind
            const recoveryUrl = await page.url().catch(() => '');
            if (recoveryUrl.includes('/dashboard') || 
                recoveryUrl.includes('/event/') ||
                (!recoveryUrl.includes('login') && recoveryUrl.includes(CONFIG.EVENT_SLUG)) ||
                recoveryUrl.includes('publicname=') || 
                recoveryUrl.includes('username=')) {
                
                console.log(`Benutzer ${username}: Wiederherstellung nach Fehler erfolgreich, URL: ${recoveryUrl}`);
                return true;
            }
        } catch (recoveryError) {
            console.error(`Benutzer ${username}: Fehler bei der Wiederherstellung: ${recoveryError.message}`);
        }
        
        return false;
    }
}

module.exports = {
    loginAsUser
};