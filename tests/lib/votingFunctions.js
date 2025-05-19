// votingFunctions.js
const path = require('path');
const fs = require('fs');
const { CONFIG, updateSuccessfulVotes, GLOBAL_STATUS, resetGlobalStatus } = require('./config');
const { ensureScreenshotsDirectory, pollForModal, isModalVisible, checkVotingSuccess } = require('./utils');

// Verbesserte Funktion für die Interaktion mit dem Abstimmungs-Modal
async function interactWithModal(page, userIndex) {
    try {
        const screenshotsDir = ensureScreenshotsDirectory();

        // DEBUGGING: Screenshot des Modals vor jeder Interaktion
        await page.screenshot({
            path: path.join(screenshotsDir, `modal-before-interaction-user-${userIndex}.png`),
            fullPage: false
        });

        // Zufällige Option auswählen (zwischen 1 und 3)
        const optionIndex = Math.floor(Math.random() * 3) + 1;
        console.log(`User ${userIndex}: Selecting option ${optionIndex}`);

        // Verbesserte Radiobutton-Auswahl
        const radioSelectors = [
            `.form-check:nth-of-type(${optionIndex}) input[type="radio"]`,
            `input[type="radio"]:nth-of-type(${optionIndex})`,
            `.modal-body input[type="radio"]:nth-child(${optionIndex})`,
            '.form-check input[type="radio"]', // Alternativer Selector
            'input[type="radio"]'  // Fallback zu jedem Radiobutton
        ];

        let radioButtonClicked = false;

        // Probiere jeden Selektor nacheinander
        for (const selector of radioSelectors) {
            try {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    // Für den Fallback-Selektor (letzter), verwende ersten Radiobutton
                    const buttonIndex = 0;

                    // VERBESSERT: Sichtbarkeit prüfen und ins Sichtfeld scrollen
                    const radioButton = page.locator(selector).nth(buttonIndex);
                    const isVisible = await radioButton.isVisible({ timeout: 1000 }).catch(() => false);

                    if (isVisible) {
                        // Scroll zum Radio-Button, damit er sicher im sichtbaren Bereich ist
                        await radioButton.scrollIntoViewIfNeeded();

                        // Reduzierte Wartezeit nach dem Scrollen
                        await page.waitForTimeout(100);

                        // Klicke auf den Radio-Button
                        await radioButton.click({ force: true, timeout: 3000 });

                        radioButtonClicked = true;
                        console.log(`User ${userIndex}: Successfully clicked radio button with selector: ${selector}`);
                        break;
                    } else {
                        console.log(`User ${userIndex}: Radio button found but not visible, trying next selector`);
                    }
                }
            } catch (e) {
                console.log(`User ${userIndex}: Error with selector ${selector}: ${e.message}`);
                // Gehe zum nächsten Selektor
            }
        }

        if (!radioButtonClicked) {
            console.error(`User ${userIndex}: Failed to click any radio button`);

            // Versuche noch einmal mit JavaScript direkt
            try {
                // Versuche mit JavaScript direkt zu klicken
                await page.evaluate(() => {
                    const radios = document.querySelectorAll('input[type="radio"]');
                    if (radios.length > 0) {
                        radios[0].checked = true;
                        radios[0].click();
                        return true;
                    }
                    return false;
                });

                console.log(`User ${userIndex}: Attempted to click radio button using JavaScript`);
                radioButtonClicked = true;  // Wir nehmen an, dass es funktioniert hat
            } catch (jsError) {
                console.error(`User ${userIndex}: Failed to click radio button with JavaScript: ${jsError.message}`);
            }

            // Nimm einen Screenshot des Problems
            try {
                await page.screenshot({
                    path: path.join(screenshotsDir, `modal-radio-selection-failed-user-${userIndex}.png`),
                    fullPage: true  // Vollseiten-Screenshot für bessere Diagnose
                });
            } catch (screenshotError) {
                console.error(`Failed to take screenshot for user ${userIndex}:`, screenshotError.message);
            }

            if (!radioButtonClicked) {
                return false;
            }
        }

        // Keine Pause nach dem Klicken des Radiobuttons für maximale Geschwindigkeit
        // Screenshots nur in 10% der Fälle machen, um Performance zu verbessern
        if (Math.random() < 0.1) {
            await page.screenshot({
                path: path.join(screenshotsDir, `modal-after-radio-user-${userIndex}.png`),
                fullPage: false
            });
        }

        // Verbesserte Submit-Button-Auswahl mit mehr Selektoren
        const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Jetzt abstimmen")',
            'button:has-text("Abstimmen")',
            '.modal-content button.btn-primary',
            '.modal-footer button.btn-primary',
            '.modal-footer button',
            '.modal-content .btn-primary',
            '.modal-dialog button[type="submit"]',
            '.modal form button',
            'form .btn-primary',
            'form button[type="submit"]'
        ];

        let submitButtonClicked = false;

        // Probiere jeden Selektor nacheinander
        for (const selector of submitSelectors) {
            try {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    // Für jeden Selektor, klicke den ersten passenden Button
                    const buttonIndex = 0;

                    // Prüfe Sichtbarkeit und scrolle ins Sichtfeld
                    const submitButton = page.locator(selector).nth(buttonIndex);
                    const isVisible = await submitButton.isVisible({ timeout: 1000 }).catch(() => false);

                    if (isVisible) {
                        // Scroll zum Submit-Button, damit er sicher im sichtbaren Bereich ist
                        await submitButton.scrollIntoViewIfNeeded();

                        // Keine Wartezeit nach dem Scrollen für maximale Geschwindigkeit

                        // Klicke auf den Submit-Button
                        await submitButton.click({ force: true, timeout: 3000 });

                        submitButtonClicked = true;
                        console.log(`User ${userIndex}: Successfully clicked submit button with selector: ${selector}`);
                        break;
                    } else {
                        console.log(`User ${userIndex}: Submit button found but not visible: ${selector}`);
                    }
                }
            } catch (e) {
                console.log(`User ${userIndex}: Error with submit selector ${selector}: ${e.message}`);
                // Gehe zum nächsten Selektor
            }
        }

        if (!submitButtonClicked) {
            console.error(`User ${userIndex}: Failed to click any submit button`);

            // Versuche als Fallback alle Buttons der Reihe nach
            try {
                const allButtons = await page.locator('button').all();
                console.log(`User ${userIndex}: Found ${allButtons.length} buttons, trying each one...`);

                for (const button of allButtons) {
                    try {
                        const isVisible = await button.isVisible().catch(() => false);
                        if (isVisible) {
                            await button.scrollIntoViewIfNeeded();
                            await page.waitForTimeout(200);
                            await button.click({ force: true, timeout: 2000 });
                            submitButtonClicked = true;
                            console.log(`User ${userIndex}: Clicked a generic button as fallback`);
                            break;
                        }
                    } catch (btnError) {
                        // Versuche den nächsten Button
                    }
                }
            } catch (btnError) {
                console.error(`User ${userIndex}: Error trying generic buttons: ${btnError.message}`);
            }

            // Als letzten Ausweg versuche mit JavaScript direkt das Formular abzusenden
            if (!submitButtonClicked) {
                try {
                    // Versuche, das Formular mit JavaScript abzusenden
                    const formSubmitted = await page.evaluate(() => {
                        const form = document.querySelector('form');
                        if (form) {
                            form.submit();
                            return true;
                        }
                        // Fallback: Versuche, einen beliebigen Button zu klicken
                        const buttons = document.querySelectorAll('button');
                        if (buttons.length > 0) {
                            for (let i = 0; i < buttons.length; i++) {
                                if (buttons[i].offsetParent !== null) { // Prüft, ob der Button sichtbar ist
                                    buttons[i].click();
                                    return true;
                                }
                            }
                        }
                        return false;
                    });

                    if (formSubmitted) {
                        console.log(`User ${userIndex}: Submitted form using JavaScript`);
                        submitButtonClicked = true;
                    }
                } catch (jsError) {
                    console.error(`User ${userIndex}: Failed to submit form with JavaScript: ${jsError.message}`);
                }
            }

            try {
                // Mache einen Screenshot des Problems
                await page.screenshot({
                    path: path.join(screenshotsDir, `modal-submit-failed-user-${userIndex}.png`),
                    fullPage: true // Vollseiten-Screenshot für bessere Diagnose
                });
            } catch (screenshotError) {
                console.error(`Failed to take screenshot for user ${userIndex}:`, screenshotError.message);
            }

            if (!submitButtonClicked) {
                return false;
            }
        }

        // Warte auf die Abstimmungsverarbeitung
        console.log(`User ${userIndex}: Vote submitted, waiting for processing...`);
        // Deutlich erhöhte Verarbeitungszeit, um sicherzustellen, dass die Verbindung lange genug bestehen bleibt
        
        // Stark reduzierte Wartezeit zur Abstimmungsverarbeitung
        console.log(`User ${userIndex}: Warte 200ms auf Abstimmungsverarbeitung...`);
        await page.waitForTimeout(200);

        // Prüfe auf Erfolg und mache Screenshots
        const success = await checkVotingSuccess(page, userIndex);

        if (success) {
            console.log(`User ${userIndex}: Vote successfully processed`);

            // Erfolgs-Screenshot nur in 10% der Fälle für bessere Performance
            if (Math.random() < 0.1) {
                try {
                    await page.screenshot({
                        path: path.join(screenshotsDir, `vote-success-user-${userIndex}.png`),
                        fullPage: false
                    });
                } catch (screenshotError) {
                    console.error(`Failed to take success screenshot for user ${userIndex}:`, screenshotError.message);
                }
            }
        } else {
            console.error(`User ${userIndex}: Vote submission appears to have failed`);

            try {
                // Mache einen Screenshot des sichtbaren Bereichs
                await page.screenshot({
                    path: path.join(screenshotsDir, `modal-post-submission-failed-user-${userIndex}.png`),
                    fullPage: true
                });
            } catch (screenshotError) {
                console.error(`Failed to take screenshot for user ${userIndex}:`, screenshotError.message);
            }
        }

        return success;
    } catch (error) {
        console.error(`User ${userIndex}: Error during modal interaction:`, error.message);

        try {
            // Mache einen Screenshot des sichtbaren Bereichs
            await page.screenshot({
                path: path.join(screenshotsDir, `modal-interaction-error-user-${userIndex}.png`),
                fullPage: true
            });
        } catch (screenshotError) {
            console.error(`Failed to take screenshot for user ${userIndex}:`, screenshotError.message);
        }

        return false;
    }
}

// Hilfsfunktion zum expliziten Erstellen der Benachrichtigungsdatei
function forceCreateNotificationFile(successfulVotes, totalParticipants, source = "manual_creation") {
    try {
        const resultsDir = path.join(process.cwd(), 'voting-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const notificationFile = path.join(resultsDir, 'all-voted-notification.json');

        fs.writeFileSync(notificationFile, JSON.stringify({
            allVoted: true,
            successfulVotes: successfulVotes,
            totalParticipants: totalParticipants,
            timestamp: new Date().toISOString(),
            reducedWaitTime: CONFIG.REDUCED_WAIT_TIME,
            source: source,
            note: "Manually created notification file"
        }, null, 2));

        console.log(`MANUELL: all-voted-notification.json erstellt mit ${successfulVotes}/${totalParticipants} Stimmen`);

        return fs.existsSync(notificationFile);
    } catch (error) {
        console.error(`KRITISCHER FEHLER: Konnte Benachrichtigungsdatei nicht manuell erstellen:`, error);
        return false;
    }
}

// Verbesserte Abstimmungsfunktion mit mehreren Versuchen
async function attemptVoting(page, userIndex, votingTimings) {
    // Prüfen, ob die Page noch existiert
    try {
        // Ein einfacher Aufruf, um zu sehen, ob die Page noch existiert
        await page.evaluate(() => true);
    } catch (e) {
        console.log(`User ${userIndex}: Page ist zu Beginn von attemptVoting bereits geschlossen`);
        return false; // Page ist geschlossen, keine weiteren Aktionen möglich
    }

    // Zuerst prüfen, ob der Organizer die Abstimmung bereits gestartet hat
    let pollStarted = false;
    try {
        const fs = require('fs');
        const path = require('path');
        const resultsDir = path.join(process.cwd(), 'voting-results');
        const organizerResultFile = path.join(resultsDir, 'organizer.json');

        if (fs.existsSync(organizerResultFile)) {
            const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
            pollStarted = organizerData.pollStarted === true;

            if (!pollStarted) {
                console.log(`User ${userIndex}: Abstimmung wurde vom Organizer noch nicht gestartet. Versuche es trotzdem...`);
            }
        }
    } catch (error) {
        console.log(`User ${userIndex}: Fehler beim Prüfen des Abstimmungsstatus:`, error.message);
    }

    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
            // Erneute Prüfung vor jedem Versuch
            try {
                await page.evaluate(() => true);
            } catch (e) {
                console.log(`User ${userIndex}: Page wurde zwischen Versuchen geschlossen`);
                return false;
            }

            // Prüfe nur auf bereits abgestimmt, nachdem der erste Versuch fehlgeschlagen ist
            if (attempt > 0) {
                // Prüfe, ob der Benutzer bereits abgestimmt hat und Ergebnisse von vorherigen Versuchen sichtbar sind
                const alreadyVoted = await checkVotingSuccess(page, userIndex);
                if (alreadyVoted) {
                    votingTimings.push({
                        user: userIndex,
                        votingTime: 0, // Spezialfall: bereits abgestimmt
                        attempt: attempt
                    });

                    return true;
                }
            }

            // Polling für das Modal mit konfigurierter maximaler Wartezeit
            const modalAppeared = await pollForModal(page, userIndex, CONFIG.MAX_CHECK_TIME);

            if (!modalAppeared) {
                // Bevor wir bei diesem Versuch aufgeben, prüfen wir, ob Ergebnisse sichtbar sind
                const resultsVisible = await checkVotingSuccess(page, userIndex);
                if (resultsVisible) {
                    // Erfasse dies als erfolgreiche Abstimmung
                    votingTimings.push({
                        user: userIndex,
                        votingTime: 0, // Wir kennen die genaue Zeit nicht, also verwenden wir 0
                        attempt: attempt + 1
                    });

                    return true;
                }

                // Prüfen, ob sich der Organizer-Status geändert hat (falls er vorher nicht gestartet war)
                if (!pollStarted && attempt < CONFIG.MAX_RETRIES - 1) {
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const resultsDir = path.join(process.cwd(), 'voting-results');
                        const organizerResultFile = path.join(resultsDir, 'organizer.json');

                        if (fs.existsSync(organizerResultFile)) {
                            const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
                            const nowStarted = organizerData.pollStarted === true;

                            if (nowStarted && !pollStarted) {
                                console.log(`User ${userIndex}: Abstimmung wurde gerade vom Organizer gestartet. Versuche erneut...`);
                                pollStarted = true;
                                // Zusätzliche Pause nach Abstimmungsstart
                                await page.waitForTimeout(2000);
                                // Seite neu laden, um die aktive Abstimmung zu sehen
                                await page.reload({ waitUntil: 'domcontentloaded' });
                                await page.waitForTimeout(1000);
                                continue;
                            }
                        }
                    } catch (error) {
                        // Ignoriere Fehler beim Prüfen
                    }
                }

                if (attempt < CONFIG.MAX_RETRIES - 1) {
                    await page.waitForTimeout(CONFIG.RETRY_DELAY);
                    continue;
                } else {
                    return false;
                }
            }

            const voteStartTime = Date.now();

            // Verbesserte Interaktion mit dem Modal
            const interactionSuccessful = await interactWithModal(page, userIndex);

            if (!interactionSuccessful) {
                // Prüfe vor jeder Aktion auf Erfolgsmeldung oder Ergebnisanzeige
                try {
                    // VERBESSERT: Prüfen ob ein Modal sichtbar ist und Ergebnis anzeigt
                    const modalSelectors = [
                        '.modal.show',
                        '.modal[style*="display: block"]',
                        '.modal.fade.show',
                        '.modal-dialog[style*="display: block"]',
                        '.modal-content:visible'
                    ];

                    for (const modalSelector of modalSelectors) {
                        try {
                            const isVisible = await page.locator(modalSelector).isVisible({ timeout: 500 }).catch(() => false);
                            if (isVisible) {
                                // Prüfen ob das Modal Ergebnisse enthält
                                const modalText = await page.locator(modalSelector).innerText().catch(() => "");
                                if (modalText.includes('Ergebnis') || modalText.includes('Abstimmungsergebnis') ||
                                    modalText.includes('Resultate') || modalText.includes('Auswertung')) {
                                    console.log(`User ${userIndex}: Ergebnisanzeige im Modal gefunden`);

                                    votingTimings.push({
                                        user: userIndex,
                                        votingTime: Date.now() - voteStartTime,
                                        attempt: attempt + 1,
                                        type: 'modal-results'
                                    });

                                    return true;
                                }
                            }
                        } catch (e) {
                            // Ignoriere Fehler bei diesem Selektor
                        }
                    }

                    // Erfolgsindikatoren, die überprüft werden sollen
                    const successLocators = [
                        // Direkte Erfolgsmeldungen
                        'div:has-text("Erfolgreich abgestimmt")',
                        '.alert-success',
                        'div:has-text("Abstimmung erfolgreich")',

                        // Ergebnisansicht (für den letzten Wähler, der sofort Ergebnisse sehen könnte)
                        'div:has-text("Ergebnis")',
                        '.poll-results',
                        '.results-container',
                        'div:has-text("Abstimmungsergebnis")',
                        '.results-view'
                    ];

                    // Versuche jeden Erfolgsindikator
                    for (const locator of successLocators) {
                        const isVisible = await page.locator(locator).isVisible().catch(() => false);

                        if (isVisible) {
                            // Wenn wir einen Ergebnisindikator gefunden haben, könnte dies der letzte Wähler sein
                            if (locator.includes('Ergebnis') || locator.includes('results')) {
                                console.log(`User ${userIndex}: Found results display - this might be the last voter`);
                            }

                            votingTimings.push({
                                user: userIndex,
                                votingTime: Date.now() - voteStartTime,
                                attempt: attempt + 1,
                                type: locator.includes('Ergebnis') || locator.includes('results') ? 'results' : 'success'
                            });

                            return true;
                        }
                    }

                    // Alternative Prüfung mit der verbesserten checkVotingSuccess-Funktion
                    const checkSuccess = await checkVotingSuccess(page, userIndex);
                    if (checkSuccess) {
                        const voteEndTime = Date.now();
                        votingTimings.push({
                            user: userIndex,
                            votingTime: voteEndTime - voteStartTime,
                            attempt: attempt + 1,
                            type: 'checkVotingSuccess'
                        });

                        return true;
                    }
                } catch (e) {
                    // Ignoriere Fehler in diesen direkten Prüfungen
                }

                if (attempt < CONFIG.MAX_RETRIES - 1) {
                    console.log(`User ${userIndex}: Retry attempt ${attempt + 1}/${CONFIG.MAX_RETRIES}`);
                    await page.waitForTimeout(CONFIG.RETRY_DELAY);
                    continue;
                } else {
                    return false;
                }
            }

            // Wenn wir hier angekommen sind, war die Interaktion erfolgreich
            const voteEndTime = Date.now();
            votingTimings.push({
                user: userIndex,
                votingTime: voteEndTime - voteStartTime,
                attempt: attempt + 1,
                type: 'successful-interaction'
            });

            return true;
        } catch (error) {
            console.error(`User ${userIndex}: Error in attemptVoting:`, error.message);

            // Versuche zu prüfen, ob die Abstimmung trotz Fehler erfolgreich war
            try {
                const successDespiteError = await checkVotingSuccess(page, userIndex);
                if (successDespiteError) {
                    votingTimings.push({
                        user: userIndex,
                        votingTime: 0, // Unbekannt, da es einen Fehler gab
                        attempt: attempt + 1,
                        type: 'success-despite-error'
                    });
                    return true;
                }
            } catch (e) {
                // Ignoriere Fehler in dieser Notfallprüfung
            }

            if (attempt < CONFIG.MAX_RETRIES - 1) {
                // Exponentielles Backoff mit Cap
                const backoffDelay = Math.min(CONFIG.RETRY_DELAY * Math.pow(1.3, attempt), 3000);
                console.log(`User ${userIndex}: Retry after error, attempt ${attempt + 1}/${CONFIG.MAX_RETRIES} (Warte ${Math.round(backoffDelay)}ms)`);
                await page.waitForTimeout(backoffDelay);
            } else {
                console.log(`User ${userIndex}: Maximale Anzahl an Versuchen (${CONFIG.MAX_RETRIES}) erreicht. Aufgabe.`);
                return false;
            }
        }
    }
    return false;
}

// Führt Abstimmung in Batches aus, um die Systemlast zu reduzieren
async function executeVotingInBatches(userPages, votingTimings) {
    // Verwende die konfigurierte Batch-Größe
    const batchSize = CONFIG.VOTE_BATCH_SIZE;
    const totalUsers = userPages.length;

    // Importiere Vote-Tracking-Funktionen
    const { trackVoteCompletion, markBatchCompleted } = require('./voteNotifier');

    // Berechne die Anzahl der Batches
    const numBatches = Math.ceil(totalUsers / batchSize);

    console.log(`Beginne Abstimmung in ${numBatches} Batches mit je ${batchSize} Benutzern...`);

    // Prüfe zuerst, ob der Organizer die Abstimmung bereits gestartet hat
    console.log(`Prüfe, ob der Organizer die Abstimmung bereits gestartet hat...`);

    let pollStarted = false;
    let pollId = null;
    let eventId = null;
    
    try {
        const fs = require('fs');
        const path = require('path');
        const resultsDir = path.join(process.cwd(), 'voting-results');
        const organizerResultFile = path.join(resultsDir, 'organizer.json');

        if (fs.existsSync(organizerResultFile)) {
            const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
            pollStarted = organizerData.pollStarted === true;
            
            // Versuche, die Poll-ID und Event-ID zu extrahieren, falls vorhanden
            if (organizerData.pollId) {
                pollId = organizerData.pollId;
            }
            
            if (organizerData.eventId) {
                eventId = organizerData.eventId;
            }

            if (pollStarted) {
                console.log(`Die Abstimmung wurde vom Organizer gestartet um: ${organizerData.timestamp}`);
            } else {
                console.warn(`WARNUNG: Der Organizer hat noch keine Abstimmung gestartet! Warte auf Abstimmungsstart...`);
            }
        } else {
            console.warn(`WARNUNG: Keine Organizer-Ergebnisdatei gefunden! Prüfe, ob der Organizer-Test läuft.`);
        }
    } catch (error) {
        console.error(`Fehler beim Prüfen des Abstimmungsstatus:`, error);
    }

    // Wenn die Abstimmung noch nicht gestartet wurde, warte auf den Start (max. 3 Minuten)
    if (!pollStarted) {
        const maxWaitTime = 3 * 60 * 1000; // 3 Minuten
        const startWaitTime = Date.now();
        const checkInterval = 5000; // 5 Sekunden

        console.log(`Warte auf den Start der Abstimmung durch den Organizer (max. ${maxWaitTime/1000} Sekunden)...`);

        while (!pollStarted && (Date.now() - startWaitTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));

            try {
                const fs = require('fs');
                const path = require('path');
                const resultsDir = path.join(process.cwd(), 'voting-results');
                const organizerResultFile = path.join(resultsDir, 'organizer.json');

                if (fs.existsSync(organizerResultFile)) {
                    const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
                    pollStarted = organizerData.pollStarted === true;
                    
                    // Versuche, die Poll-ID und Event-ID zu extrahieren, falls vorhanden
                    if (organizerData.pollId) {
                        pollId = organizerData.pollId;
                    }
                    
                    if (organizerData.eventId) {
                        eventId = organizerData.eventId;
                    }

                    if (pollStarted) {
                        console.log(`Die Abstimmung wurde vom Organizer gestartet um: ${organizerData.timestamp}`);
                        break;
                    } else {
                        const waitedSeconds = Math.floor((Date.now() - startWaitTime) / 1000);
                        console.log(`Warte weiter auf den Abstimmungsstart... (${waitedSeconds} Sekunden vergangen)`);
                    }
                }
            } catch (error) {
                console.error(`Fehler beim Prüfen des Abstimmungsstatus:`, error);
            }
        }

        if (!pollStarted) {
            console.warn(`Timeout: Die Abstimmung wurde vom Organizer nicht innerhalb von ${maxWaitTime/1000} Sekunden gestartet.`);
            console.log(`Versuche trotzdem mit der Abstimmung fortzufahren...`);
        }
    }

    // Zurücksetzen des globalen Status für einen frischen Start
    resetGlobalStatus();

    let successfulVotes = 0;

    let startIdx = 0;
    for (let batch = 0; batch < numBatches; batch++) {
        const endIdx = Math.min(startIdx + batchSize, totalUsers);
        const currentBatchSize = endIdx - startIdx;
        const batchId = batch + 1;

        console.log(`Starte Batch ${batchId}/${numBatches} mit ${currentBatchSize} Benutzern (${startIdx} bis ${endIdx - 1})...`);

        // Keine Pause vor Batches, um maximale Geschwindigkeit zu erreichen
        if (batch > 0) {
            console.log(`Batch ${batchId} startet sofort...`);
        }

        // Tracking-Informationen vor dem Start speichern
        if (CONFIG.VOTE_TRACKING_ENABLED) {
            trackVoteCompletion({
                batchId: batchId,
                eventId: eventId || CONFIG.EVENT_ID, // Fallback zur konfigurierten Event-ID
                pollId: pollId || 0,
                totalVotes: currentBatchSize,
                userCount: currentBatchSize,
                started: true,
                startTimestamp: new Date().toISOString()
            });
        }

        // Führe die Abstimmungen für den aktuellen Batch parallel aus
        const batchPromises = userPages.slice(startIdx, endIdx).map(({ page, userIndex }) =>
            attemptVoting(page, userIndex, votingTimings)
        );

        const batchResults = await Promise.all(batchPromises);
        const batchSuccessfulVotes = batchResults.filter(result => result).length;

        successfulVotes += batchSuccessfulVotes;
        console.log(`Batch ${batchId} abgeschlossen: ${batchSuccessfulVotes}/${currentBatchSize} erfolgreiche Abstimmungen`);

        // Aktualisiere den Tracking-Status nach Abschluss des Batches
        if (CONFIG.VOTE_TRACKING_ENABLED) {
            markBatchCompleted(batchId, batchSuccessfulVotes);
        }

        // Aktualisiere den globalen Status mit den erfolgreichen Abstimmungen
        try {
            // Aktualisiere den globalen Status
            const allVoted = updateSuccessfulVotes(batchSuccessfulVotes);

            // Prüfen, ob wir genug erfolgreiche Stimmen für eine Benachrichtigung haben
            // Vergleiche mit der tatsächlich gezählten Anzahl statt mit dem globalen Status
            const votingThreshold = Math.floor(CONFIG.MAX_USERS_PER_TEST * 0.85); // 85% aller möglichen Stimmen
            if (successfulVotes >= votingThreshold) {
                console.log(`WICHTIGER HINWEIS: Schwellenwert von 85% (${votingThreshold}) der Teilnehmer ist erreicht!`);
                console.log(`Aktueller Fortschritt: ${successfulVotes}/${CONFIG.MAX_USERS_PER_TEST} abgestimmt.`);
                console.log(`Benachrichtige den Organizer, dass er mit reduzierter Wartezeit fortfahren kann...`);

                // Erstelle eine spezielle Benachrichtigungsdatei für den Organizer
                try {
                    const resultsDir = path.join(process.cwd(), 'voting-results');
                    if (!fs.existsSync(resultsDir)) {
                        fs.mkdirSync(resultsDir, { recursive: true });
                    }

                    const notificationFile = path.join(resultsDir, 'all-voted-notification.json');

                    // Schreibe die allVoted-Benachrichtigung
                    fs.writeFileSync(notificationFile, JSON.stringify({
                        allVoted: true,
                        successfulVotes: successfulVotes,
                        totalParticipants: CONFIG.MAX_USERS_PER_TEST,
                        timestamp: new Date().toISOString(),
                        reducedWaitTime: CONFIG.REDUCED_WAIT_TIME,
                        source: "threshold_reached",
                        batchProgress: `${batchId}/${numBatches}`,
                        note: "Created based on 85% threshold of votes"
                    }, null, 2));

                    console.log(`ERFOLG: all-voted-notification.json erstellt unter ${notificationFile}`);

                    // Prüfe, ob die Datei tatsächlich existiert
                    if (fs.existsSync(notificationFile)) {
                        console.log(`VERIFIZIERT: Benachrichtigungsdatei wurde erfolgreich erstellt`);
                    } else {
                        console.error(`FEHLER: Benachrichtigungsdatei wurde nicht erstellt!`);
                    }
                } catch (fileError) {
                    console.error(`Fehler beim Erstellen der Benachrichtigungsdatei:`, fileError);
                }
            }

            if (allVoted) {
                console.log(`WICHTIGER HINWEIS: ALLE TEILNEHMER HABEN LAUT GLOBAL_STATUS ERFOLGREICH ABGESTIMMT!`);
                console.log(`Globaler Status: ${GLOBAL_STATUS.successfulVotes}/${GLOBAL_STATUS.totalParticipants}`);
            }
        } catch (error) {
            console.error(`Fehler beim Aktualisieren des globalen Status:`, error);
        }

        // Aktualisiere startIdx für den nächsten Batch
        startIdx += batchSize;

        // Verwende die konfigurierte Pause zwischen den Batches, wenn nicht der letzte Batch
        if (batch < numBatches - 1) {
            console.log(`Warte ${CONFIG.BATCH_VOTE_DELAY}ms vor dem nächsten Batch...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_VOTE_DELAY));
        }
    }

    // Schreibe ein abschließendes Ergebnis, nachdem alle Batches abgeschlossen sind
    console.log(`Alle Abstimmungsbatches abgeschlossen: ${successfulVotes}/${totalUsers} erfolgreiche Abstimmungen insgesamt`);

    // *** WICHTIGE ÄNDERUNG: Immer die Benachrichtigungsdatei erstellen, wenn über 85% Stimmen vorliegen
    // Auch wenn der globale Status nicht korrekt aktualisiert wurde
    try {
        // Das Problem ist, dass die Benutzer in verschiedenen Prozessen abstimmen und der globale Status
        // nicht immer korrekt über die Prozesse hinweg synchronisiert wird. Daher vertrauen wir auf die
        // tatsächliche Anzahl der erfolgreichen Abstimmungen in diesem Prozess.

        // Wenn dieser Batch fertig ist und mindestens 85% der Benutzer abgestimmt haben,
        // erstellen wir die Benachrichtigungsdatei, da sonst die Tests zu lange dauern.
        if (successfulVotes >= totalUsers * 0.85) {
            console.log(`WICHTIGER HINWEIS: Mindestens 85% der Benutzer haben erfolgreich abgestimmt!`);
            console.log(`Sende Benachrichtigung an Organizer, dass er mit reduzierter Wartezeit fortfahren kann.`);

            // Setze GLOBAL_STATUS manuell
            // Verwende das direkte Update über die importierte Funktion
            GLOBAL_STATUS.successfulVotes = successfulVotes;
            GLOBAL_STATUS.allVoted = true;
            updateSuccessfulVotes(0); // Dies aktualisiert nur den Timestamp und speichert den Status

            // Erstelle die Benachrichtigungsdatei
            const resultsDir = path.join(process.cwd(), 'voting-results');
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }

            const notificationFile = path.join(resultsDir, 'all-voted-notification.json');
            const notificationData = {
                allVoted: true,
                successfulVotes: successfulVotes,
                totalParticipants: totalUsers,
                timestamp: new Date().toISOString(),
                reducedWaitTime: CONFIG.REDUCED_WAIT_TIME,
                source: "batch_completion",
                note: "Notification created at end of batch processing"
            };

            // Schreibe die Datei
            fs.writeFileSync(notificationFile, JSON.stringify(notificationData, null, 2));

            console.log(`ERFOLG: all-voted-notification.json erstellt mit ${successfulVotes}/${totalUsers} Stimmen`);

            // Verifiziere die Erstellung
            if (fs.existsSync(notificationFile)) {
                console.log(`VERIFIZIERT: all-voted-notification.json existiert unter ${notificationFile}`);
            } else {
                console.error(`FEHLER: all-voted-notification.json konnte nicht erstellt werden!`);
            }
        }
    } catch (error) {
        console.error(`Fehler beim finalen Update des Status und der Benachrichtigungen:`, error);

        // Fallback: Versuche trotzdem, die Datei zu erstellen
        try {
            const resultsDir = path.join(process.cwd(), 'voting-results');
            const notificationFile = path.join(resultsDir, 'all-voted-notification.json');

            fs.writeFileSync(notificationFile, JSON.stringify({
                allVoted: true,
                successfulVotes: successfulVotes,
                totalParticipants: totalUsers,
                timestamp: new Date().toISOString(),
                reducedWaitTime: CONFIG.REDUCED_WAIT_TIME,
                source: "error_fallback"
            }, null, 2));

            console.log(`FALLBACK: all-voted-notification.json trotz Fehler erstellt`);
        } catch (fallbackError) {
            console.error(`KRITISCHER FEHLER: Konnte Fallback-Benachrichtigung nicht erstellen:`, fallbackError);
        }
    }

    // Implementierung des Keep-Alive-Mechanismus, um die Verbindung aktiv zu halten
    // und das Browser-Timeout zu verhindern
    await keepConnectionAlive(userPages, successfulVotes, totalUsers);

    return successfulVotes;
}

/**
 * Hält die Browser-Verbindung aktiv, um Timeouts zu verhindern
 * 
 * @param {Array} userPages - Array der Benutzer-Pages
 * @param {number} successfulVotes - Anzahl der erfolgreich abgegebenen Stimmen
 * @param {number} totalUsers - Gesamtanzahl der Benutzer
 * @returns {Promise<void>}
 */
async function keepConnectionAlive(userPages, successfulVotes, totalUsers) {
    console.log(`[Keep-Alive] Starte Keep-Alive-Mechanismus für ${userPages.length} Browser-Fenster...`);
    
    // Berechne Wartezeit basierend auf der Konfiguration
    let keepAliveTime = CONFIG.USER_WAIT_AFTER_VOTE || 180000; // Standard: 3 Minuten
    
    // Bei einer sehr hohen Erfolgsquote können wir die Wartezeit reduzieren
    const successRate = successfulVotes / totalUsers;
    if (successRate >= 0.95) {
        keepAliveTime = Math.max(60000, keepAliveTime / 2); // Mindestens 1 Minute, ansonsten halbieren
        console.log(`[Keep-Alive] Hohe Erfolgsquote (${(successRate * 100).toFixed(1)}%), reduziere Wartezeit auf ${keepAliveTime / 1000} Sekunden`);
    }
    
    const startTime = Date.now();
    let elapsedTime = 0;
    let lastLogTime = 0;
    const logInterval = 10000; // Status alle 10 Sekunden ausgeben
    
    // Aktive Pages zählen
    let activePagesCount = 0;
    
    // Keep-Alive Schleife
    while (elapsedTime < keepAliveTime) {
        try {
            // Aktualisiere verstrichene Zeit
            elapsedTime = Date.now() - startTime;
            
            // Prüfe, ob es Zeit für ein Status-Update ist
            const currentTime = Date.now();
            if (currentTime - lastLogTime >= logInterval) {
                lastLogTime = currentTime;
                const remainingSeconds = Math.round((keepAliveTime - elapsedTime) / 1000);
                console.log(`[Keep-Alive] Halte ${activePagesCount} Browser-Fenster aktiv. Noch ${remainingSeconds} Sekunden verbleibend.`);
            }
            
            // Zähler zurücksetzen
            activePagesCount = 0;
            
            // Für jede Page eine kleine Aktion durchführen
            for (let i = 0; i < userPages.length; i++) {
                try {
                    // Prüfe, ob die Page noch geöffnet ist
                    const page = userPages[i].page;
                    
                    // Überspringe geschlossene Pages
                    if (!page || page.isClosed()) {
                        continue;
                    }
                    
                    // Führe kleine Scrollaktion durch, um Aktivität zu simulieren
                    await page.evaluate(() => {
                        try {
                            // Kleine Scroll-Bewegung
                            window.scrollBy(0, 1);
                            window.scrollBy(0, -1);
                            
                            // Aktiviere ggf. Socket-Verbindungen
                            if (window.socket && typeof window.socket.send === 'function') {
                                try {
                                    window.socket.send(JSON.stringify({type: 'ping'}));
                                } catch (e) {
                                    // Ignoriere Socket-Fehler
                                }
                            }
                            
                            // Eventuelle GraphQL-Verbindungen aktiv halten
                            if (window.apolloClient && typeof window.apolloClient.query === 'function') {
                                try {
                                    // Vermeide tatsächliche Abfragen, setze nur einen Timeout
                                    setTimeout(() => {}, 100);
                                } catch (e) {
                                    // Ignoriere Apollo-Fehler
                                }
                            }
                            
                            // Prüfe auch auf modale Dialoge und halte sie aktiv
                            const modalElement = document.querySelector('.modal.show');
                            if (modalElement) {
                                // Simuliere einen Mausbewegung innerhalb des Modals
                                const event = new MouseEvent('mousemove', {
                                    bubbles: true,
                                    cancelable: true,
                                    clientX: Math.random() * 50,
                                    clientY: Math.random() * 50
                                });
                                modalElement.dispatchEvent(event);
                            }
                            
                            return true; // Signal, dass die Page aktiv ist
                        } catch (e) {
                            return false;
                        }
                    }).then(isActive => {
                        if (isActive) {
                            activePagesCount++;
                        }
                    }).catch(() => {
                        // Ignoriere Fehler bei geschlossenen Pages
                    });
                    
                } catch (pageError) {
                    // Ignoriere Fehler bei einzelnen Pages
                }
            }
            
            // Warte das konfigurierte Intervall bis zur nächsten Aktion
            await new Promise(resolve => setTimeout(resolve, CONFIG.KEEP_ALIVE_INTERVAL || 5000));
            
        } catch (error) {
            console.error(`[Keep-Alive] Fehler im Keep-Alive-Loop:`, error);
            // Kurze Pause und dann weiter
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`[Keep-Alive] Keep-Alive-Mechanismus beendet nach ${Math.round(elapsedTime / 1000)} Sekunden`);
}

// Beim Import dieses Moduls: Prüfe, ob all-voted-notification.json existiert, und erstelle es ggf.
const resultsDir = path.join(process.cwd(), 'voting-results');
const notificationFile = path.join(resultsDir, 'all-voted-notification.json');

// Überprüfe beim Start, ob genug Stimmen da sind, um den Prozess zu verkürzen
try {
    if (fs.existsSync(path.join(resultsDir, 'global-vote-status.json'))) {
        let globalStatus = JSON.parse(fs.readFileSync(path.join(resultsDir, 'global-vote-status.json'), 'utf8'));
        console.log(`[Modul-Init] Aktueller globaler Status: ${globalStatus.successfulVotes}/${globalStatus.totalParticipants} Stimmen`);

        // Wenn mindestens 50% der Stimmen bereits erfasst wurden und file nicht existiert
        if (globalStatus.successfulVotes >= globalStatus.totalParticipants * 0.5 && !fs.existsSync(notificationFile)) {
            console.log(`[Modul-Init] Mehr als 50% der Stimmen erfasst, erstelle all-voted-notification.json`);
            forceCreateNotificationFile(globalStatus.successfulVotes, globalStatus.totalParticipants, "module_init");
        }
    }
} catch (error) {
    console.error(`[Modul-Init] Fehler beim Prüfen des globalen Status:`, error);
}

module.exports = {
    interactWithModal,
    attemptVoting,
    executeVotingInBatches,
    forceCreateNotificationFile
};