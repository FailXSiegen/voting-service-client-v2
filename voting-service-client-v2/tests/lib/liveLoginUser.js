// liveLoginUser.js
const { CONFIG } = require('../live/config');

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

        // Navigiere zur Login-Seite mit erweiterten Fehlerbehandlung
        try {
            await page.goto(magicLink, { timeout: 30000 });
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

        // Bei Magic-Links müssen wir nur den Login-Button klicken, keine Felder ausfüllen
        // Erweiterte Selektoren für den Submit-Button
        const buttonSelectors = [
            'button.btn-primary',
            'input[type="submit"]',
            'button[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Anmelden")',
            'button:has-text("Einloggen")',
            // Zusätzliche allgemeine Selektoren
            '.btn-primary',
            '.login-button',
            '.auth-button',
            'button:visible'
        ];

        // Klicke auf den Anmelde-Button mit besserer Fehlerbehandlung
        let buttonClicked = false;
        for (const selector of buttonSelectors) {
            if (buttonClicked) break;

            try {
                // Verwende timeout, um nicht unnötig zu warten
                const button = page.locator(selector);
                const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);

                if (isVisible) {
                    // Versuche erst, zum Button zu scrollen
                    await button.scrollIntoViewIfNeeded().catch(() => { });
                    await page.waitForTimeout(100);

                    // Klicke mit unterschiedlichen Strategien
                    try {
                        await button.click({ timeout: 3000 });
                        buttonClicked = true;
                        break;
                    } catch (clickError) {
                        // Versuche alternative Klick-Methoden
                        try {
                            // Versuche mit force: true
                            await button.click({ force: true, timeout: 2000 });
                            buttonClicked = true;
                            break;
                        } catch (forceClickError) {
                            // Versuche mit JavaScript direkt
                            try {
                                await page.evaluate((sel) => {
                                    const elem = document.querySelector(sel);
                                    if (elem) elem.click();
                                }, selector);
                                buttonClicked = true;
                                break;
                            } catch (jsClickError) {
                                // Gehe weiter zum nächsten Selektor
                            }
                        }
                    }
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!buttonClicked) {
            console.warn(`Benutzer ${username}: Konnte keinen Login-Button finden! Versuche Enter-Taste...`);
            // Versuche, Enter zu drücken, als letzten Ausweg
            await page.keyboard.press('Enter').catch(() => { });

            // Prüfe direkt, ob wir schon eingeloggt sind (Magic Link könnte uns sofort eingeloggt haben)
            const url = await page.url();
            if (url.includes('/dashboard') || url.includes('/event/') && !url.includes('login')) {
                console.log(`Benutzer ${username}: Magic-Link hat direkt zum Dashboard geführt, kein Button-Klick nötig.`);
                return true;
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

            // Überprüfe, ob wir dennoch auf einer Seite nach dem Login sind
            const url = await page.url().catch(() => '');
            if (url.includes('/dashboard') || url.includes('/event/') ||
                (!url.includes('login') && (url.includes(CONFIG.EVENT_SLUG) || url.includes(CONFIG.EVENT_ID.toString())))) {
                loginSuccess = true;
                console.log(`Benutzer ${username}: Login scheint aufgrund der URL erfolgreich zu sein: ${url}`);
            } else {
                console.error(`Benutzer ${username}: Login fehlgeschlagen, aktuelle URL: ${url}`);

                // Letzter Versuch: Seite neuladen und erneut prüfen
                try {
                    await page.reload({ waitUntil: 'networkidle' }).catch(() => { });
                    await page.waitForTimeout(2000);

                    // Prüfe, ob die URL nach dem Reload auf einen Login-Erfolg hinweist
                    const urlAfterReload = await page.url().catch(() => '');
                    if (urlAfterReload.includes('/dashboard') || urlAfterReload.includes('/event/') ||
                        (!urlAfterReload.includes('login') && urlAfterReload.includes(CONFIG.EVENT_SLUG))) {
                        loginSuccess = true;
                        console.log(`Benutzer ${username}: Login nach Reload erfolgreich, URL: ${urlAfterReload}`);
                    }
                } catch (reloadError) {
                    console.error(`Benutzer ${username}: Fehler beim letzten Reload-Versuch: ${reloadError.message}`);
                }
            }
        }

        return loginSuccess;
    } catch (error) {
        console.error(`Fehler beim Login für ${username}:`, error.message);
        return false;
    }
}

module.exports = {
    loginAsUser
};