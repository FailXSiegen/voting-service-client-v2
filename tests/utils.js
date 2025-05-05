// utils.js
const fs = require('fs');
const path = require('path');
const { CONFIG, getResultsDir, getScreenshotsDir } = require('./config');

// Sleep-Funktion für Verzögerungen
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Stellt sicher, dass das Ergebnisverzeichnis existiert
function ensureResultsDirectory() {
    const resultsDir = getResultsDir();

    // Verzeichnis erstellen, falls es nicht existiert
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    return resultsDir;
}

// Separate Funktion zum Löschen alter Dateien - wird nur im beforeAll aufgerufen
function cleanupResultsDirectory() {
    const resultsDir = getResultsDir();

    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
        return;
    }

    // WICHTIG: Lösche alle alten Ergebnisdateien, um Fehlinterpretationen zu vermeiden
    try {
        const files = fs.readdirSync(resultsDir);
        for (const file of files) {
            // Lösche nur JSON-Dateien, die zu diesem Test gehören
            if (file.endsWith('.json') &&
                (file.includes('user-batch') || file === 'organizer.json' || file === 'organizer-ready.json')) {
                console.log(`Lösche alte Ergebnisdatei: ${file}`);
                fs.unlinkSync(path.join(resultsDir, file));
            }
        }
    } catch (error) {
        console.error(`Fehler beim Löschen alter Ergebnisdateien:`, error.message);
    }
}

// Stellt sicher, dass das Screenshots-Verzeichnis existiert
function ensureScreenshotsDirectory() {
    const screenshotsDir = getScreenshotsDir();
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    return screenshotsDir;
}

// Schreibt die Ergebnisdaten in eine JSON-Datei
function writeResults(testName, data) {
    const resultsDir = ensureResultsDirectory();
    const resultFile = path.join(resultsDir, `${testName}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(data, null, 2));
}

// Generierte IDs für Benutzer, die im selben Test-Run erstellt werden
const getTestUserId = (testId, userOffset) => {
    // Batch 1: User 1-50, Batch 2: User 51-100, Batch 3: User 101-150
    return `testuser${((testId - 1) * CONFIG.USERS_PER_BATCH) + userOffset}`;
};

// Generiere Anzeigename für Benutzer
const getDisplayName = (testId, userOffset) => {
    // Gleiche Berechnung wie für userId
    return `User ${((testId - 1) * CONFIG.USERS_PER_BATCH) + userOffset}`;
};

// Prüfung, ob ein Abstimmungs-Modal sichtbar ist
async function isModalVisible(page) {
    try {
        // Versuche verschiedene Selektoren
        const selectors = [
            '.modal-content',
            '#pollModal',
            '.container-modal .modal',
            '.modal.show',
            '.modal-dialog',
            '.modal[style*="display: block"]',
            '.modal.fade.show',
            '.modal-backdrop.show + .modal'
        ];

        for (const selector of selectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                if (isVisible) {
                    return true;
                }
            } catch (e) {
                // Dieser Selektor hat nicht funktioniert, probiere den nächsten
            }
        }

        // Versuche alternative Erkennung über Inhalte
        const contentSelectors = [
            'button:has-text("Jetzt abstimmen")',
            'button:has-text("Abstimmen")',
            '.modal-title',
            'input[type="radio"]',
            'h3:has-text("Abstimmung")',
            '.form-check-input'
        ];

        for (const selector of contentSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                if (isVisible) {
                    return true;
                }
            } catch (e) {
                // Dieser Inhalts-Selektor hat nicht funktioniert, probiere den nächsten
            }
        }

        return false;
    } catch (e) {
        console.error("Fehler bei der Modal-Erkennung:", e);
        return false;
    }
}

// Optimierte Funktion zum Warten auf ein Modal
async function pollForModal(page, userIndex, timeout) {
    const startTime = Date.now();

    // Erste Überprüfung - ist das Modal bereits sichtbar?
    const modalImmediatelyVisible = await isModalVisible(page);
    if (modalImmediatelyVisible) {
        return true;
    }

    // Erster Reload-Versuch
    try {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Überprüfen, ob das Modal nach dem Reload erschienen ist
        const modalVisibleAfterReload = await isModalVisible(page);
        if (modalVisibleAfterReload) {
            return true;
        }
    } catch (e) {
        console.log(`Benutzer ${userIndex}: Fehler beim ersten Reload-Versuch:`, e.message);
    }

    // Modal auch nach Reload nicht sichtbar, jetzt beginnt das optimierte Polling
    while (Date.now() - startTime < timeout) {
        try {
            // Nach dem Modal suchen mit der verbesserten Methode
            const modalVisible = await isModalVisible(page);
            if (modalVisible) {
                return true;
            }
        } catch (e) {
            // Ignorieren und weitermachen
        }

        // Kurze Wartezeit zwischen Prüfungen
        await page.waitForTimeout(300);

        // Alle 10 Sekunden die Seite neu laden
        if ((Date.now() - startTime) % 10000 < 500) {
            try {
                await page.reload({ waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(300);

                // Überprüfen, ob das Modal jetzt erschienen ist
                const modalVisible = await isModalVisible(page);
                if (modalVisible) {
                    return true;
                }
            } catch (e) {
                // Ignorieren und weitermachen
            }
        }
    }

    return false;
}

// Überprüft, ob die Abstimmung erfolgreich war
async function checkVotingSuccess(page, userIndex) {
    try {
        const screenshotsDir = ensureScreenshotsDirectory();

        // Check if this is an organizer or observer page
        let canActuallyVote = true;
        try {
            const isAdminPage = await page.locator('.admin-controls, .poll-management, .organizer-section').isVisible({ timeout: 1000 }).catch(() => false);
            const url = page.url();
            if (isAdminPage || url.includes('/admin/') || url.includes('/organizer/') || url.includes('/management/')) {
                canActuallyVote = false;
            }
        } catch (e) {
            // Ignore errors in this check
        }

        // Allow animations to complete
        await page.waitForTimeout(1000);

        // DEBUGGING: Screenshot für Debugging
        try {
            await page.screenshot({
                path: path.join(screenshotsDir, `checking-success-user-${userIndex}.png`),
                fullPage: false
            });
        } catch (e) {
            // Ignoriere Screenshot-Fehler
        }

        // Check 1: If we can see poll results, consider it a success
        const resultsSelectors = [
            '.modal-content:has-text("Ergebnis")',
            '.modal:has-text("Abstimmungsergebnis")',
            '.modal-body:has-text("Ergebnis")',
            '.poll-results',
            '.results-container',
            'div:has-text("Ergebnis der Abstimmung")',
            '.results-view',
            '.poll-result-box',
            '.poll-completed',
            '.poll-closed',
            '.vergangene-abstimmung',
            '.past-poll'
        ];

        for (const selector of resultsSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 1000 });
                if (isVisible) {
                    console.log(`User ${userIndex}: Vote success detected via results display with selector: ${selector}`);
                    return true;
                }
            } catch (e) {
                // This selector didn't work, try the next one
            }
        }

        // Check 2: Success message
        const successSelectors = [
            'div:has-text("Erfolgreich abgestimmt")',
            '.alert-success',
            '.toast-success',
            'div:has-text("Abstimmung erfolgreich")',
            '.success-message'
        ];

        for (const selector of successSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 1000 });
                if (isVisible) {
                    console.log(`User ${userIndex}: Vote success detected via success message with selector: ${selector}`);
                    return true;
                }
            } catch (e) {
                // This selector didn't work, try the next one
            }
        }

        // Check 3: Look for poll results or success in the page content
        try {
            const pageContent = await page.content();
            const successIndicators = [
                'Erfolgreich abgestimmt',
                'Abstimmung erfolgreich',
                'Ihre Stimme wurde gezählt',
                'Ergebnis',
                'Abstimmungsergebnis',
                'Poll abgeschlossen',
                'Abstimmung beendet',
                'Vergangene Abstimmung'
            ];

            for (const indicator of successIndicators) {
                if (pageContent.includes(indicator)) {
                    console.log(`User ${userIndex}: Vote success detected via page content: "${indicator}"`);
                    return true;
                }
            }
        } catch (e) {
            // Ignore content check errors
        }

        // Check 4: Is the modal gone? (Might indicate success)
        const modalStillVisible = await isModalVisible(page).catch(() => false);
        if (!modalStillVisible && canActuallyVote) {
            console.log(`User ${userIndex}: Vote likely successful - poll modal disappeared`);

            // Zusätzlicher Check: Prüfe, ob wir wieder auf der Hauptseite sind
            try {
                const isOnMainPage = await page.locator('.dashboard, .event-dashboard, h1:has-text("Dashboard")').isVisible({ timeout: 1000 }).catch(() => false);
                if (isOnMainPage) {
                    console.log(`User ${userIndex}: Vote confirmed successful - back on main page`);
                    return true;
                }
            } catch (e) {
                // Ignoriere Fehler und fahre mit der normalen Bewertung fort
            }

            return true;
        }

        // If we've reached here, take a screenshot of the failed state
        await page.screenshot({
            path: path.join(screenshotsDir, `vote-failed-user-${userIndex}.png`),
            fullPage: true
        });

        console.log(`User ${userIndex}: Could not detect successful vote`);
        return false;
    } catch (error) {
        console.error(`Error in checkVotingSuccess for user ${userIndex}:`, error.message);
        return false;
    }
}

module.exports = {
    sleep,
    ensureResultsDirectory,
    cleanupResultsDirectory,
    ensureScreenshotsDirectory,
    writeResults,
    getTestUserId,
    getDisplayName,
    isModalVisible,
    pollForModal,
    checkVotingSuccess
};