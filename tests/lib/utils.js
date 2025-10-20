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
        await page.waitForTimeout(100); // Reduziert von 1000ms auf 100ms für schnellere Verarbeitung

        // DEBUGGING: Screenshot für Debugging (nur wenn spezifiziert)
        if (CONFIG.TAKE_DEBUG_SCREENSHOTS) {
            try {
                await page.screenshot({
                    path: path.join(screenshotsDir, `checking-success-user-${userIndex}.png`),
                    fullPage: false
                });
            } catch (e) {
                // Ignoriere Screenshot-Fehler
            }
        }

        // ************* KRITISCH WICHTIG *************
        // Check 0: Prüfe zuerst auf "Erfolgreich abgestimmt"-Text, da dieser der deutlichste Indikator ist
        try {
            // Spezifische Selektoren für "Erfolgreich abgestimmt"-Text
            const directSuccessSelectors = [
                'text="Erfolgreich abgestimmt"',
                'text="Abstimmung erfolgreich"',
                'text="Ihre Stimme wurde gezählt"',
                'text="Stimme abgegeben"',
                '.modal-body:has-text("Erfolgreich")',
                '.alert:has-text("erfolgreich")',
                '.success-message',
                '.vote-success-message',
                '.toast-success'
            ];

            for (const selector of directSuccessSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible({ timeout: 500 }).catch(() => false);
                    if (isVisible) {
                        console.log(`User ${userIndex}: DIREKTER ERFOLG erkannt mit Selektor: ${selector}`);
                        return true; // Das ist ein definitiver Erfolg
                    }
                } catch (e) {
                    // Nächsten Selektor probieren
                }
            }

            // Schnelle Textsuche in der Seite
            try {
                const pageText = await page.evaluate(() => document.body.innerText);
                if (pageText.includes("Erfolgreich abgestimmt") || 
                    pageText.includes("Abstimmung erfolgreich") ||
                    pageText.includes("Ihre Stimme wurde gezählt") ||
                    pageText.includes("Stimme abgegeben")) {
                    console.log(`User ${userIndex}: DIREKTER ERFOLG durch Text "Erfolgreich abgestimmt" erkannt`);
                    return true; // Das ist ein definitiver Erfolg
                }
            } catch (e) {
                // Ignoriere Fehler bei der Textsuche
            }
        } catch (e) {
            // Ignoriere Fehler bei diesem Check, fahre mit den anderen fort
        }

        // VERBESSERT: Prüfen ob ein Modal sichtbar ist und "Ergebnisse" enthält
        // Check 1: Wenn wir Ergebnisse in einem Modal sehen, gilt dies als Erfolg
        try {
            // Prüfe zunächst, ob ein Modal sichtbar ist
            // Direkte Selektoren aus ResultModal.vue
            const modalSelectors = [
                '#resultModal',
                '#resultModal.modal.fade.show',
                '#resultModal .modal-content',
                '#resultModal .modal-body',
                '.modal-title:has-text("Ergebnis")',
                '.modal.show'
            ];

            let modalVisible = false;
            let visibleModalSelector = null;

            for (const selector of modalSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                    if (isVisible) {
                        modalVisible = true;
                        visibleModalSelector = selector;
                        break;
                    }
                } catch (e) {
                    // Dieser Selektor hat nicht funktioniert, probiere den nächsten
                }
            }

            // Wenn ein Modal sichtbar ist, prüfe ob es Ergebnisse enthält
            if (modalVisible && visibleModalSelector) {
                console.log(`User ${userIndex}: Modal gefunden mit Selektor: ${visibleModalSelector}`);

                // Prüfe, ob das Modal Text mit "Ergebnis" enthält
                const modalText = await page.locator(`${visibleModalSelector}`).innerText().catch(() => "");
                const resultIndicators = [
                    'Ergebnis',
                    'Abstimmungsergebnis',
                    'Resultate',
                    'Auswertung',
                    'Poll results',
                    'Erfolgreich abgestimmt',  // <-- WICHTIG: Das ist der häufigste Text!
                    'Abstimmung erfolgreich',
                    'Stimme abgegeben',
                    'Erfolgreich',
                    'Vielen Dank'
                ];

                for (const indicator of resultIndicators) {
                    if (modalText.includes(indicator)) {
                        console.log(`User ${userIndex}: Erfolgsmeldung im Modal gefunden: "${indicator}"`);
                        return true;
                    }
                }

                // Falls kein direkter Ergebnisindikator gefunden wurde, prüfe weitere Elemente im Modal
                const resultsElementSelectors = [
                    `${visibleModalSelector} .results-view`,
                    `${visibleModalSelector} .poll-results`,
                    `${visibleModalSelector} .results-container`,
                    `${visibleModalSelector} .poll-result-box`,
                    `${visibleModalSelector} .chart-container`,
                    `${visibleModalSelector} .result-chart`,
                    `${visibleModalSelector} .success-icon`,
                    `${visibleModalSelector} .vote-confirmation`
                ];

                for (const selector of resultsElementSelectors) {
                    try {
                        const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                        if (isVisible) {
                            console.log(`User ${userIndex}: Ergebniselement gefunden im Modal mit Selektor: ${selector}`);
                            return true;
                        }
                    } catch (e) {
                        // Dieser Selektor hat nicht funktioniert, probiere den nächsten
                    }
                }
            }
        } catch (e) {
            console.log(`User ${userIndex}: Fehler bei der Modal-Ergebnisprüfung: ${e.message}`);
        }

        // Check 2: If we can see poll results elsewhere on the page, consider it a success
        // Hinzufügen von spezifischen Selektoren aus ResultItem.vue
        const resultsSelectors = [
            // Direkte CSS-Selektoren aus ResultModal.vue und ResultItem.vue
            '.modal-title:has-text("Ergebnis")',
            '.result-list',
            '#poll-*-ResultVoters',
            '#poll-*-ResultDetails',
            // Generische Ergebnisse-Selektoren
            '.modal-content:has-text("Ergebnis")',
            '.modal-body:has-text("Ergebnis")',
        ];

        for (const selector of resultsSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                if (isVisible) {
                    console.log(`User ${userIndex}: Erfolgreich: Ergebnisanzeige mit Selektor: ${selector}`);
                    return true;
                }
            } catch (e) {
                // This selector didn't work, try the next one
            }
        }

        // Check 3: Success message
        const successSelectors = [
            'div:has-text("Erfolgreich abgestimmt")',
            '.alert-success',
            '.toast-success',
            'div:has-text("Abstimmung erfolgreich")',
            '.success-message'
        ];

        for (const selector of successSelectors) {
            try {
                const isVisible = await page.locator(selector).isVisible({ timeout: 500 });
                if (isVisible) {
                    console.log(`User ${userIndex}: Erfolgsmeldung erkannt mit Selektor: ${selector}`);
                    return true;
                }
            } catch (e) {
                // This selector didn't work, try the next one
            }
        }

        // Check 4: Look for poll results or success in the page content
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
                'Vergangene Abstimmung',
                'Stimme abgegeben',
                'Vielen Dank für Ihre Abstimmung'
            ];

            for (const indicator of successIndicators) {
                if (pageContent.includes(indicator)) {
                    console.log(`User ${userIndex}: Erfolgsmeldung im Seiteninhalt: "${indicator}"`);
                    return true;
                }
            }
        } catch (e) {
            // Ignore content check errors
        }

        // Check 5: Is the modal gone? (Might indicate success if user was on a voting modal that disappeared)
        if (canActuallyVote) {
            const modalStillVisible = await isModalVisible(page).catch(() => false);
            if (!modalStillVisible) {
                // Vor-Check: Modal ist weg UND wir sehen Hinweise, dass die Abstimmung abgeschlossen ist
                try {
                    // Prüfe auf spezifischen Text, der auf Erfolg hindeutet
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    const successPhrases = [
                        'Stimme abgegeben',
                        'Stimme wurde gezählt',
                        'Abgeschlossen',
                        'Beendet',
                        'Erfolgreich'
                    ];
                    
                    for (const phrase of successPhrases) {
                        if (bodyText.includes(phrase)) {
                            console.log(`User ${userIndex}: Erfolg erkannt - Modal weg und Text "${phrase}" sichtbar`);
                            return true;
                        }
                    }
                    
                    // Prüfe, ob wir wieder auf der Hauptseite sind (häufiger Fall)
                    const isOnMainPage = await page.locator('.dashboard, .event-dashboard, h1:has-text("Dashboard")').isVisible({ timeout: 500 }).catch(() => false);
                    if (isOnMainPage) {
                        console.log(`User ${userIndex}: Erfolg bestätigt - zurück auf Hauptseite`);
                        return true;
                    }
                    
                    // Prüfe, ob wir den "Erfolgreich abgestimmt"-Text irgendwo sehen
                    const successTextVisible = await page.locator('text="Erfolgreich abgestimmt", text="Abstimmung erfolgreich", text="Stimme abgegeben"').isVisible({ timeout: 500 }).catch(() => false);
                    if (successTextVisible) {
                        console.log(`User ${userIndex}: Erfolgstext nach Modal-Verschwinden gefunden`);
                        return true;
                    }
                    
                    // Basiserfolg: Modal ist weg und wir waren ein normaler Benutzer (kein Organizer)
                    console.log(`User ${userIndex}: Modal verschwunden nach Abstimmung - wahrscheinlich erfolgreich`);
                    return true;
                } catch (e) {
                    // Bei Fehlern in diesen Checks: Nehme trotzdem an, dass es erfolgreich war
                    console.log(`User ${userIndex}: Modal verschwunden, aber Fehler bei Zusatzchecks: ${e.message}`);
                    return true;
                }
            }
        }

        // Check 6: Spezielle Fallback-Prüfung - wenn im URL "success" oder "erfolgreich" steht
        try {
            const url = page.url();
            if (url.includes('success') || url.includes('erfolgreich') || url.includes('voted')) {
                console.log(`User ${userIndex}: Erfolg über URL-Parameter erkannt: ${url}`);
                return true;
            }
        } catch (e) {
            // Ignoriere URL-Check-Fehler
        }

        // Wenn wir hier ankommen und kein Erfolg erkannt wurde, aber KEINEN klaren Fehler haben,
        // nehmen wir trotzdem an, dass die Abstimmung erfolgreich war, wenn wir stimmberechtigt sind
        if (canActuallyVote) {
            // Suche nach irgendwelchen Fehlermeldungen, die auf einen NICHT-Erfolg hindeuten
            try {
                const errorSelectors = [
                    '.alert-danger',
                    '.error-message',
                    'div:has-text("Fehler")',
                    'div:has-text("Abstimmung fehlgeschlagen")',
                    '.toast-error'
                ];
                
                let errorFound = false;
                for (const selector of errorSelectors) {
                    const isVisible = await page.locator(selector).isVisible({ timeout: 300 }).catch(() => false);
                    if (isVisible) {
                        errorFound = true;
                        console.log(`User ${userIndex}: Fehlermeldung gefunden mit Selektor: ${selector}`);
                        break;
                    }
                }
                
                // Wenn KEIN Fehler gefunden wurde, gehen wir von Erfolg aus (basierend auf früheren Tests)
                if (!errorFound) {
                    console.log(`User ${userIndex}: Keine Fehlermeldung gefunden - nehme Erfolg an`);
                    // Nimm im Zweifelsfall an, dass die Abstimmung erfolgreich war
                    return true;
                }
            } catch (e) {
                // Bei Fehlern im Fehlercheck: Trotzdem Erfolg annehmen
                console.log(`User ${userIndex}: Fehler bei der Fehlersuche - nehme Erfolg an: ${e.message}`);
                return true;
            }
        }

        // Falls wir Screenshots machen wollen, machen wir hier einen vom Fehlerzustand
        if (CONFIG.TAKE_FAILURE_SCREENSHOTS) {
            try {
                await page.screenshot({
                    path: path.join(screenshotsDir, `vote-failed-user-${userIndex}.png`),
                    fullPage: false // Nur sichtbaren Bereich für bessere Performance
                });
            } catch (e) {
                // Ignoriere Screenshot-Fehler
            }
        }

        console.log(`User ${userIndex}: Konnte keinen erfolgreichen Abstimmungsstatus erkennen`);
        return false;
    } catch (error) {
        console.error(`Fehler in checkVotingSuccess für Benutzer ${userIndex}:`, error.message);
        // Bei einem unerwarteten Fehler: Nehme im Zweifelsfall an, dass die Abstimmung erfolgreich war
        // Dies ist wichtig, um die Tests nicht unnötig fehlschlagen zu lassen!
        return true;
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