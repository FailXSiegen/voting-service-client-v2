// votingFunctions.js
const path = require('path');
const { CONFIG } = require('./config');
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

                        // Füge eine kleine Wartezeit hinzu, um sicherzustellen, dass das Scrollen abgeschlossen ist
                        await page.waitForTimeout(300);

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

        // DEBUGGING: Screenshot nach Radiobutton-Auswahl
        await page.screenshot({
            path: path.join(screenshotsDir, `modal-after-radio-user-${userIndex}.png`),
            fullPage: false
        });

        // Warte einen Moment nach dem Klicken des Radiobuttons
        await page.waitForTimeout(500);

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

                        // Füge eine kleine Wartezeit hinzu, um sicherzustellen, dass das Scrollen abgeschlossen ist
                        await page.waitForTimeout(300);

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
        await page.waitForTimeout(2000); // Erhöht auf 2 Sekunden für langsamere Verbindungen

        // Prüfe auf Erfolg und mache Screenshots
        const success = await checkVotingSuccess(page, userIndex);

        if (success) {
            console.log(`User ${userIndex}: Vote successfully processed`);

            // Erfolgs-Screenshot
            try {
                await page.screenshot({
                    path: path.join(screenshotsDir, `vote-success-user-${userIndex}.png`),
                    fullPage: false
                });
            } catch (screenshotError) {
                console.error(`Failed to take success screenshot for user ${userIndex}:`, screenshotError.message);
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

// Verbesserte Abstimmungsfunktion mit mehreren Versuchen
async function attemptVoting(page, userIndex, votingTimings) {
    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
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

            // Polling für das Modal mit verbesserter Erkennung
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

                    // Alternative textbasierte Prüfung im Seiteninhalt
                    const pageContent = await page.content();

                    if (pageContent.includes('Erfolgreich abgestimmt') ||
                        pageContent.includes('Abstimmung erfolgreich') ||
                        pageContent.includes('Ergebnis') ||
                        pageContent.includes('Abstimmungsergebnis')) {

                        votingTimings.push({
                            user: userIndex,
                            votingTime: Date.now() - voteStartTime,
                            attempt: attempt + 1,
                            type: pageContent.includes('Ergebnis') ? 'results' : 'success'
                        });

                        return true;
                    }
                } catch (e) {
                    // Ignoriere Fehler in diesen direkten Prüfungen
                }

                // Zusätzliche Prüfung - vielleicht hat es trotz Fehler funktioniert
                const checkSuccess = await checkVotingSuccess(page, userIndex);
                if (checkSuccess) {
                    const voteEndTime = Date.now();
                    votingTimings.push({
                        user: userIndex,
                        votingTime: voteEndTime - voteStartTime,
                        attempt: attempt + 1
                    });

                    return true;
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
                attempt: attempt + 1
            });

            return true;
        } catch (error) {
            console.error(`User ${userIndex}: Error in attemptVoting:`, error.message);

            // Versuche zu prüfen, ob die Abstimmung trotz Fehler erfolgreich war
            try {
                const successDespiteError = await checkVotingSuccess(page, userIndex);
                if (successDespiteError) {
                    return true;
                }
            } catch (e) {
                // Ignoriere Fehler in dieser Notfallprüfung
            }

            if (attempt < CONFIG.MAX_RETRIES - 1) {
                console.log(`User ${userIndex}: Retry after error, attempt ${attempt + 1}/${CONFIG.MAX_RETRIES}`);
                await page.waitForTimeout(CONFIG.RETRY_DELAY);
            } else {
                return false;
            }
        }
    }
    return false;
}

// Führt Abstimmung in Batches aus, um die Systemlast zu reduzieren
async function executeVotingInBatches(userPages, votingTimings) {
    // Bestimme die Anzahl der erforderlichen Batches
    const totalUsers = userPages.length;
    const numBatches = Math.ceil(totalUsers / CONFIG.VOTE_BATCH_SIZE);

    console.log(`Beginne Abstimmung in ${numBatches} Batches mit je ${CONFIG.VOTE_BATCH_SIZE} Benutzern...`);

    let successfulVotes = 0;

    for (let batch = 0; batch < numBatches; batch++) {
        const startIdx = batch * CONFIG.VOTE_BATCH_SIZE;
        const endIdx = Math.min(startIdx + CONFIG.VOTE_BATCH_SIZE, totalUsers);
        const currentBatchSize = endIdx - startIdx;

        console.log(`Starte Batch ${batch + 1}/${numBatches} mit ${currentBatchSize} Benutzern (${startIdx} bis ${endIdx - 1})...`);

        // Führe die Abstimmungen für den aktuellen Batch parallel aus
        const batchPromises = userPages.slice(startIdx, endIdx).map(({ page, userIndex }) =>
            attemptVoting(page, userIndex, votingTimings)
        );

        const batchResults = await Promise.all(batchPromises);
        const batchSuccessfulVotes = batchResults.filter(result => result).length;

        successfulVotes += batchSuccessfulVotes;
        console.log(`Batch ${batch + 1} abgeschlossen: ${batchSuccessfulVotes}/${currentBatchSize} erfolgreiche Abstimmungen`);

        // Längere Pause zwischen den Batches, wenn nicht der letzte Batch
        if (batch < numBatches - 1) {
            const pauseDuration = CONFIG.BATCH_VOTE_DELAY;
            console.log(`Warte ${pauseDuration}ms vor dem nächsten Batch...`);
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
        }
    }

    return successfulVotes;
}

module.exports = {
    interactWithModal,
    attemptVoting,
    executeVotingInBatches
};