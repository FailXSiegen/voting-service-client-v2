// loginUser.js
const { CONFIG } = require('./config');

// Login als Benutzer
async function loginAsUser(page, username, password, displayName) {
    try {
        console.log(`Login-Versuch für Benutzer: ${username}`);
        await page.goto(`${CONFIG.CLIENT_URL}/event/${CONFIG.EVENT_SLUG}`);

        // Warten, bis die Seite geladen ist
        await page.waitForLoadState('networkidle');

        // Versuche mit verschiedenen Selektoren, die Formularfelder zu finden
        const inputSelectors = [
            // Standard-Selektoren
            'input.form-control',
            'input[type="text"]',
            'input[type="password"]',

            // ID-basierte Selektoren
            '#username, #login-username, #event-user-username',
            '#password, #login-password, #event-user-password',
            '#display-name, #displayName, #name',

            // Attribut-basierte Selektoren
            'input[name="username"]',
            'input[name="password"]',
            'input[name="displayName"]'
        ];

        // Versuche zuerst, alle Felder auf einmal zu finden
        let allFieldsFound = false;

        // Versuche zunächst mit form-control
        const formControlCount = await page.locator('input.form-control').count();
        if (formControlCount >= 3) {
            console.log(`Benutzer ${username}: ${formControlCount} form-control Felder gefunden`);

            try {
                // Benutzername
                await page.locator('input.form-control').nth(0).fill(username);
                // Passwort
                await page.locator('input.form-control').nth(1).fill(password || CONFIG.USER_PASSWORD);
                // Anzeigename
                await page.locator('input.form-control').nth(2).fill(displayName);

                allFieldsFound = true;
            } catch (e) {
                console.warn(`Benutzer ${username}: Konnte form-control Felder nicht ausfüllen, versuche spezifischere Selektoren`);
            }
        }

        // Wenn die form-control Methode nicht funktioniert hat, versuche spezifischere Selektoren
        if (!allFieldsFound) {
            console.log(`Benutzer ${username}: Versuche gezielt die Formularfelder zu finden...`);

            // Versuche verschiedene Kombinationen von Selektoren für jedes Feld
            const usernameSelectors = [
                '#username',
                'input[name="username"]',
                'input[placeholder*="Benutzername"]',
                'input[placeholder*="Username"]',
                'input.username'
            ];

            const passwordSelectors = [
                '#password',
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="Passwort"]',
                'input[placeholder*="Password"]',
                'input.password'
            ];

            const displayNameSelectors = [
                '#displayName',
                '#display-name',
                'input[name="displayName"]',
                'input[placeholder*="Name"]',
                'input[placeholder*="Anzeigename"]',
                'input.display-name'
            ];

            // Versuche den Benutzernamen einzugeben
            for (const selector of usernameSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible();
                    if (isVisible) {
                        await page.locator(selector).fill(username);
                        console.log(`Benutzer ${username}: Benutzernamefeld gefunden mit Selektor ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Weiter zum nächsten Selektor
                }
            }

            // Versuche das Passwort einzugeben
            for (const selector of passwordSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible();
                    if (isVisible) {
                        await page.locator(selector).fill(password || CONFIG.USER_PASSWORD);
                        console.log(`Benutzer ${username}: Passwortfeld gefunden mit Selektor ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Weiter zum nächsten Selektor
                }
            }

            // Versuche den Anzeigenamen einzugeben
            for (const selector of displayNameSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible();
                    if (isVisible) {
                        await page.locator(selector).fill(displayName);
                        console.log(`Benutzer ${username}: Anzeigenamefeld gefunden mit Selektor ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Weiter zum nächsten Selektor
                }
            }
        }

        // Versuche verschiedene Selektoren für den Submit-Button
        const buttonSelectors = [
            'button.btn-primary',
            'input[type="submit"]',
            'button[type="submit"]',
            'button:has-text("Login")',
            'button:has-text("Anmelden")',
            'button:has-text("Einloggen")'
        ];

        // Klicke auf den Anmelde-Button
        let buttonClicked = false;
        for (const selector of buttonSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible();
                if (isVisible) {
                    await page.locator(selector).click();
                    console.log(`Benutzer ${username}: Login-Button geklickt mit Selektor ${selector}`);
                    buttonClicked = true;
                    break;
                }
            } catch (e) {
                // Weiter zum nächsten Selektor
            }
        }

        if (!buttonClicked) {
            console.warn(`Benutzer ${username}: Konnte keinen Login-Button finden!`);
            // Versuche, Enter zu drücken, als letzten Ausweg
            await page.keyboard.press('Enter');
        }

        // Warten auf Erfolgsindikatoren
        const successSelectors = [
            'h2:has-text("Willkommen")',
            '.welcome-message',
            '.dashboard',
            'h1:has-text("Dashboard")',
            '.user-dashboard'
        ];

        let loginSuccess = false;
        for (const selector of successSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                console.log(`Benutzer ${username}: Login erfolgreich (${selector} gefunden)`);
                loginSuccess = true;
                break;
            } catch (e) {
                // Versuche den nächsten Erfolgsindikator
            }
        }

        if (!loginSuccess) {
            console.warn(`Benutzer ${username}: Kein Erfolgsindikator nach Login gefunden!`);

            // Überprüfe, ob wir dennoch auf einer Seite nach dem Login sind
            const url = page.url();
            if (url.includes('/dashboard') || url.includes('/event/') || !url.includes('login')) {
                console.log(`Benutzer ${username}: URL deutet auf erfolgreichen Login hin: ${url}`);
                loginSuccess = true;
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