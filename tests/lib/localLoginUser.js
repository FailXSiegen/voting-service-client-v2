// localLoginUser.js
const { CONFIG } = require('../local/config');

// Login als Benutzer mit Magic-Link
async function loginAsUser(page, username, password, publicName) {
    try {
        if (!username || !publicName) {
            console.error(`FEHLER: username (${username}) oder publicName (${publicName}) fehlt`);
            return false;
        }

        // Magic-Link URL bauen
        let magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE;
        magicLink = magicLink.replace('#USERNAME#', encodeURIComponent(username));
        magicLink = magicLink.replace('#PUBLIC_NAME#', encodeURIComponent(publicName));
        console.log(`Benutzer ${username}: Navigiere zu ${magicLink}`);

        await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Prüfe ob wir auf der Login-Seite sind
        const btn = page.locator('button.btn-primary').first();
        const isVisible = await btn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!isVisible) {
            console.error(`Benutzer ${username}: Login-Button nicht gefunden`);
            return false;
        }

        // Button klicken und auf Login-Response warten
        console.log(`Benutzer ${username}: Klicke Login-Button...`);
        try {
            const [response] = await Promise.all([
                page.waitForResponse(
                    r => r.url().includes('/login') && r.status() === 201,
                    { timeout: 15000 }
                ),
                btn.click()
            ]);
            console.log(`Benutzer ${username}: Login erfolgreich (Status ${response.status()})`);
        } catch (e) {
            console.error(`Benutzer ${username}: Login fehlgeschlagen: ${e.message}`);
            return false;
        }

        // Warte kurz damit WebSocket-Verbindung aufgebaut wird (setzt Online-Status)
        await page.waitForTimeout(3000);

        console.log(`Benutzer ${username}: Login abgeschlossen, warte auf Event-Dashboard`);
        return true;

    } catch (error) {
        console.error(`Benutzer ${username}: Login-Fehler: ${error.message}`);
        return false;
    }
}

module.exports = {
    loginAsUser
};
