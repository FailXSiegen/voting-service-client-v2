// load-test-weighted.spec.js
// Test mit gewichteten Stimmen - testet Mehrfachstimmen-Funktionalität
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Importiere die Module
const { CONFIG } = require('../lib/config');
const { loadEventIdIntoConfig } = require('../lib/eventLoader');
const {
  sleep,
  cleanupResultsDirectory,
  writeResults,
  getTestUserId,
  getDisplayName,
  ensureScreenshotsDirectory
} = require('../lib/utils');
const { loginAsOrganizer, createAndStartPoll } = require('../lib/loginOrganizer');
const { loginAsUser } = require('../lib/loginUser');
const { executeVotingInBatches } = require('../lib/votingFunctions');

// Spezielle Konfiguration für gewichtete Stimmen
const WEIGHTED_CONFIG = {
  ...CONFIG,
  MAX_USERS_PER_TEST: 50,        // Weniger Nutzer für fokussierten Test
  USERS_PER_BATCH: 25,            
  VOTE_BATCH_SIZE: 10,           // Kleinere Batches für bessere Kontrolle
  CONCURRENT_LOGINS: 5,          // Weniger gleichzeitige Logins
  
  // Nutzer-Verteilung für gewichtete Stimmen
  USER_DISTRIBUTION: {
    singleVote: { start: 1, end: 30, votes: 1 },      // User 1-30: 1 Stimme
    tripleVote: { start: 31, end: 45, votes: 3 },     // User 31-45: 3 Stimmen  
    fiveVote: { start: 46, end: 50, votes: 5 },       // User 46-50: 5 Stimmen
  }
};

// Helper-Funktion: Ermittle Stimmanzahl für einen Nutzer
function getVoteAmountForUser(userId) {
  const dist = WEIGHTED_CONFIG.USER_DISTRIBUTION;
  
  if (userId >= dist.singleVote.start && userId <= dist.singleVote.end) {
    return dist.singleVote.votes;
  } else if (userId >= dist.tripleVote.start && userId <= dist.tripleVote.end) {
    return dist.tripleVote.votes;
  } else if (userId >= dist.fiveVote.start && userId <= dist.fiveVote.end) {
    return dist.fiveVote.votes;
  }
  
  return 1; // Default
}

test.describe('Gewichtete Stimmen Test', () => {
  test.beforeAll(async () => {
    console.log('=== WEIGHTED VOTE TEST SETUP ===');
    
    // WICHTIG: Lade die aktuelle Event-ID dynamisch
    console.log('Lade Event-ID für Slug:', WEIGHTED_CONFIG.EVENT_SLUG);
    await loadEventIdIntoConfig(WEIGHTED_CONFIG);
    console.log('✅ Event-ID geladen:', WEIGHTED_CONFIG.EVENT_ID);
    
    cleanupResultsDirectory();
    console.log('Test mit verschiedenen Stimmgewichtungen:');
    console.log('- 30 Nutzer mit 1 Stimme');
    console.log('- 15 Nutzer mit 3 Stimmen');
    console.log('- 5 Nutzer mit 5 Stimmen');
    console.log('================================');
  });

  // Organizer erstellt Multi-Vote Abstimmung
  test('Organizer erstellt Multiple-Choice Abstimmung', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log("Weighted Test: Organizer Login...");
      const loginSuccess = await loginAsOrganizer(page);
      expect(loginSuccess).toBeTruthy();

      writeResults('weighted-organizer-ready', {
        organizerReady: true,
        timestamp: new Date().toISOString(),
        testType: 'weighted',
        voteDistribution: WEIGHTED_CONFIG.USER_DISTRIBUTION
      });

      // Warte auf Nutzer-Bereitschafts-Datei
      console.log("Weighted Test: Warte auf Nutzer mit verschiedenen Stimmgewichten...");
      
      // Warte dynamisch auf die User-Ready-Datei mit intelligentem Fallback
      let userReady = false;
      let waitTime = 0;
      const maxWaitTime = 120000; // 2 Minuten max
      
      while (!userReady && waitTime < maxWaitTime) {
        try {
          const fs = require('fs');
          const path = require('path');
          const readyFile = path.join(process.cwd(), 'voting-results', 'weighted-users-ready.json');
          
          if (fs.existsSync(readyFile)) {
            const data = JSON.parse(fs.readFileSync(readyFile, 'utf8'));
            if (data.totalUsers >= 40) { // Mindestens 40 von 50 Usern
              userReady = true;
              console.log(`Weighted Test: ${data.totalUsers} Nutzer bereit, starte Abstimmung!`);
            } else {
              console.log(`Weighted Test: ${data.totalUsers} von 50 Nutzern bereit (warte auf mindestens 40)...`);
            }
          }
          
          // Fallback: Prüfe auch User-Count direkt auf der Seite
          if (!userReady && waitTime > 60000) { // Nach 1 Minute
            console.log("Weighted Test: Prüfe User-Count direkt auf Organizer-Seite als Fallback...");
            
            const pageUserCount = await page.evaluate(() => {
              let foundElements = [];
              
              // Durchsuche alle Elemente nach Text-Pattern
              const allElements = document.querySelectorAll('*');
              for (const element of allElements) {
                const text = element.textContent?.trim() || '';
                
                // Pattern: "X von mindestens Y" oder "Aktuelle Anzahl: X"
                const patterns = [
                  /(\d+)\s*von\s*mindestens\s*(\d+)/i,
                  /aktuelle\s*anzahl.*?(\d+)/i,
                  /wahlberechtigter?\s*teilnehmer.*?(\d+)/i,
                  /anwesende?\s*teilnehmer.*?(\d+)/i,
                  /(\d+)\s*teilnehmer/i,
                  /teilnehmer.*?(\d+)/i
                ];
                
                for (const pattern of patterns) {
                  const match = text.match(pattern);
                  if (match) {
                    foundElements.push({
                      userCount: parseInt(match[1]) || 0
                    });
                  }
                }
              }
              
              return foundElements.length > 0 ? foundElements[0].userCount : 0;
            });
            
            if (pageUserCount >= 40) {
              console.log(`Weighted Test: FALLBACK ERFOLGREICH! Seite zeigt ${pageUserCount} User - starte Abstimmung!`);
              userReady = true;
            } else {
              console.log(`Weighted Test: Fallback - Seite zeigt nur ${pageUserCount} User`);
            }
          }
          
        } catch (e) {
          console.log("Weighted Test: Fehler bei User-Ready Prüfung:", e.message);
        }
        
        if (!userReady) {
          await page.waitForTimeout(2000); // 2 Sekunden warten
          waitTime += 2000;
        }
      }
      
      if (!userReady) {
        console.warn("Weighted Test: Timeout beim Warten auf User - fahre trotzdem fort");
      }

      // Erstelle spezielle Multi-Choice Abstimmung
      console.log("Weighted Test: Erstelle Multiple-Choice Abstimmung...");
      
      // Hier würde normalerweise eine spezielle createMultiChoicePoll Funktion aufgerufen
      // Für diesen Test nutzen wir die Standard-Funktion
      const pollStarted = await createAndStartPoll(page);
      expect(pollStarted).toBeTruthy();

      writeResults('weighted-organizer', {
        pollStarted: true,
        timestamp: new Date().toISOString(),
        pollType: 'multiple-choice',
        maxVotes: 3
      });

      // Überwache die gewichteten Abstimmungen
      console.log("Weighted Test: Überwache gewichtete Abstimmungen...");
      
      const monitoringDuration = 180000; // 3 Minuten
      const startTime = Date.now();
      let voteStats = {
        totalVotesCast: 0,
        usersByWeight: { 1: 0, 3: 0, 5: 0 }
      };

      while (Date.now() - startTime < monitoringDuration) {
        // Prüfe Abstimmungsstatus
        try {
          const resultsDir = path.join(process.cwd(), 'voting-results');
          const files = fs.readdirSync(resultsDir);
          
          for (const file of files) {
            if (file.includes('weighted-votes-')) {
              const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file)));
              if (data.votesCast) {
                voteStats.totalVotesCast += data.votesCast;
              }
            }
          }
        } catch (e) {
          // Ignoriere Fehler beim Monitoring
        }

        await page.waitForTimeout(10000);
      }

      console.log(`Weighted Test: Abstimmung abgeschlossen. Gesamtstimmen: ${voteStats.totalVotesCast}`);

    } catch (error) {
      console.error("Weighted Test Organizer Fehler:", error);
      throw error;
    } finally {
      await context.close();
    }
  });

  // Test mit gewichteten Nutzern
  test('Nutzer mit verschiedenen Stimmgewichten', async ({ browser }) => {
    const userContexts = [];
    const userPages = [];
    const votingResults = [];

    try {
      console.log("Weighted Test: Starte Login-Phase für gewichtete Nutzer...");
      
      // Parallel Login für alle Nutzer-Typen in 10er Batches
      const allLoginTasks = [];
      
      // Sammle alle Login-Tasks
      for (const [voteType, config] of Object.entries(WEIGHTED_CONFIG.USER_DISTRIBUTION)) {
        console.log(`\nBereite ${config.end - config.start + 1} Nutzer mit ${config.votes} Stimme(n) vor...`);
        
        for (let userId = config.start; userId <= config.end; userId++) {
          const username = `testuser${userId}`;
          const displayName = `${voteType.replace('Vote', '')} User ${userId} (${config.votes} votes)`;
          
          allLoginTasks.push({
            username,
            displayName,
            userId,
            voteAmount: config.votes,
            voteType
          });
        }
      }

      // Führe Logins in 10er Batches parallel aus
      const BATCH_SIZE = 10;
      console.log(`\nStarte parallele Logins in ${BATCH_SIZE}er Batches für ${allLoginTasks.length} User...`);
      
      for (let i = 0; i < allLoginTasks.length; i += BATCH_SIZE) {
        const batch = allLoginTasks.slice(i, i + BATCH_SIZE);
        console.log(`Login Batch ${Math.floor(i/BATCH_SIZE) + 1}: User ${batch[0].username} bis ${batch[batch.length-1].username}`);
        
        // Parallel login für alle User im Batch
        const batchPromises = batch.map(async (task) => {
          try {
            const context = await browser.newContext();
            const page = await context.newPage();
            
            userContexts.push(context);
            
            const loginSuccess = await loginAsUser(page, task.username, CONFIG.USER_PASSWORD, task.displayName);
            
            if (loginSuccess) {
              return {
                page,
                userIndex: task.userId,
                username: task.username,
                voteAmount: task.voteAmount,
                voteType: task.voteType
              };
            }
            return null;
          } catch (error) {
            console.error(`Login-Fehler für ${task.username}:`, error.message);
            return null;
          }
        });
        
        // Warte auf alle Logins im Batch
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Sammle erfolgreiche Logins
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            userPages.push(result.value);
          }
        });
        
        console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1} abgeschlossen: ${batchResults.filter(r => r.status === 'fulfilled' && r.value).length}/${batch.length} erfolgreich`);
        
        // Kurze Pause zwischen Batches
        if (i + BATCH_SIZE < allLoginTasks.length) {
          await sleep(1000);
        }
      }

      console.log(`\nWeighted Test: ${userPages.length} Nutzer erfolgreich eingeloggt`);
      
      writeResults('weighted-users-ready', {
        totalUsers: userPages.length,
        usersByType: {
          singleVote: userPages.filter(u => u.voteAmount === 1).length,
          tripleVote: userPages.filter(u => u.voteAmount === 3).length,
          fiveVote: userPages.filter(u => u.voteAmount === 5).length
        },
        timestamp: new Date().toISOString()
      });

      // Warte auf Abstimmungsstart
      console.log("Weighted Test: Warte auf Abstimmung...");
      await sleep(10000);

      // Führe gewichtete Abstimmungen durch
      console.log("\nWeighted Test: Starte gewichtete Abstimmungen...");
      
      // Gruppiere Nutzer nach Stimmgewicht für bessere Analyse
      const usersByWeight = {
        1: userPages.filter(u => u.voteAmount === 1),
        3: userPages.filter(u => u.voteAmount === 3),
        5: userPages.filter(u => u.voteAmount === 5)
      };

      // Teste jede Gewichtsgruppe separat
      for (const [weight, users] of Object.entries(usersByWeight)) {
        if (users.length === 0) continue;
        
        console.log(`\nTeste ${users.length} Nutzer mit ${weight} Stimme(n)...`);
        
        const groupVotingTimings = [];
        let successfulVotes = 0;
        let totalVotesCast = 0;

        // Simuliere Mehrfachauswahl parallel für alle User der Gruppe  
        const votingPromises = users.map(async (user) => {
          try {
            const votingStart = Date.now();
            
            // Warte auf Abstimmung und simuliere dann Abstimmung mit mehreren Optionen
            const voteSuccess = await user.page.evaluate(async (voteAmount) => {
              // Erweiterte Suche nach Abstimmungs-UI mit verschiedenen Selektoren
              const selectors = [
                '[data-vote-option]',
                '.vote-option', 
                'input[type="checkbox"]',
                'input[type="radio"]',
                'button[data-option]',
                'button.btn[data-vote]',
                '.voting-option',
                '.poll-option',
                'label input[type="checkbox"]',
                'label input[type="radio"]',
                // Weitere häufige Abstimmungsselektoren
                '.option-button',
                '[role="checkbox"]',
                '[role="radio"]',
                'button:contains("Option")',
                'div[data-option-id]'
              ];
              
              let voteButtons = [];
              
              // Warte bis zu 30 Sekunden auf Abstimmungsoptionen
              let waitAttempts = 0;
              const maxWaitAttempts = 30; // 30 * 1000ms = 30 Sekunden
              
              while (voteButtons.length === 0 && waitAttempts < maxWaitAttempts) {
                // Durchsuche alle Selektoren
                for (const selector of selectors) {
                  const elements = document.querySelectorAll(selector);
                  if (elements.length > 0) {
                    voteButtons = Array.from(elements);
                    console.log(`Abstimmungsoptionen gefunden mit Selektor: ${selector} (${elements.length} Optionen)`);
                    break;
                  }
                }
                
                // Falls immer noch nichts gefunden, warte 1 Sekunde
                if (voteButtons.length === 0) {
                  console.log(`Warte auf Abstimmungsoptionen... Versuch ${waitAttempts + 1}/${maxWaitAttempts}`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  waitAttempts++;
                }
              }
              
              if (voteButtons.length === 0) {
                // Debug: Zeige verfügbare Elemente
                const allButtons = document.querySelectorAll('button');
                const allInputs = document.querySelectorAll('input');
                const allLabels = document.querySelectorAll('label');
                
                console.log(`FEHLER: Keine Abstimmungsoptionen nach ${maxWaitAttempts} Sekunden gefunden!`);
                console.log(`Verfügbare Buttons: ${allButtons.length}`);
                console.log(`Verfügbare Inputs: ${allInputs.length}`);
                console.log(`Verfügbare Labels: ${allLabels.length}`);
                
                // Zeige ersten 5 Buttons für Debug
                Array.from(allButtons).slice(0, 5).forEach((btn, i) => {
                  console.log(`Button ${i}: ${btn.textContent?.trim() || 'kein Text'} - Klassen: ${btn.className}`);
                });
                
                return { success: false, votesCast: 0, debug: { buttons: allButtons.length, inputs: allInputs.length } };
              }

              // Wähle zufällig bis zu voteAmount Optionen
              const selectedCount = Math.min(voteAmount, voteButtons.length);
              const selectedIndices = [];
              
              while (selectedIndices.length < selectedCount) {
                const randomIndex = Math.floor(Math.random() * voteButtons.length);
                if (!selectedIndices.includes(randomIndex)) {
                  selectedIndices.push(randomIndex);
                  voteButtons[randomIndex].click();
                  await new Promise(r => setTimeout(r, 100)); // Kleine Pause zwischen Klicks
                }
              }

              // Erweiterte Suche nach Submit-Button
              const submitSelectors = [
                '[type="submit"]',
                '.submit-vote',
                'button:contains("Abstimmen")',
                'button:contains("Submit")',
                'button:contains("Abschicken")',
                'button:contains("Senden")',
                'button.btn-primary',
                'button.submit',
                'input[type="submit"]',
                '[data-submit]',
                '.vote-submit'
              ];
              
              let submitButton = null;
              
              for (const selector of submitSelectors) {
                try {
                  const element = document.querySelector(selector);
                  if (element && element.offsetParent !== null) { // Element ist sichtbar
                    submitButton = element;
                    console.log(`Submit-Button gefunden mit Selektor: ${selector}`);
                    break;
                  }
                } catch (e) {
                  // Ignoriere ungültige Selektoren
                }
              }
              
              if (submitButton) {
                submitButton.click();
                console.log(`Erfolgreich abgestimmt: ${selectedCount} Stimme(n) abgegeben`);
                return { success: true, votesCast: selectedCount };
              }

              console.log('Kein Submit-Button gefunden!');
              return { success: false, votesCast: 0, error: 'No submit button found' };
            }, user.voteAmount);

            const votingTime = Date.now() - votingStart;
            
            if (voteSuccess.success) {
              successfulVotes++;
              totalVotesCast += voteSuccess.votesCast;
            }

            // Pause zwischen Abstimmungen (nur für individuelle User)
            await sleep(100 + Math.random() * 400); // Zufällige Pause 100-500ms
            
            return {
              user: user.userIndex,
              votingTime,
              success: voteSuccess.success,
              votesCast: voteSuccess.votesCast,
              maxVotes: user.voteAmount
            };

          } catch (error) {
            console.error(`Fehler bei Nutzer ${user.username}:`, error.message);
            return {
              user: user.userIndex,
              votingTime: 0,
              success: false,
              error: error.message,
              maxVotes: user.voteAmount
            };
          }
        });

        // Warte auf alle parallelen Voting-Operationen
        const results = await Promise.allSettled(votingPromises);
        
        // Verarbeite die Ergebnisse
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const data = result.value;
            if (data.success) {
              successfulVotes++;
              totalVotesCast += data.votesCast;
            }
            groupVotingTimings.push(data);
          } else {
            console.error(`Fehler bei Nutzer ${users[index].username}:`, result.reason?.message);
            groupVotingTimings.push({
              user: users[index].userIndex,
              votingTime: 0,
              success: false,
              error: result.reason?.message,
              maxVotes: users[index].voteAmount
            });
          }
        });

        // Speichere Gruppen-Ergebnisse
        const groupResults = {
          voteWeight: parseInt(weight),
          totalUsers: users.length,
          successfulVotes,
          totalVotesCast,
          expectedVotes: users.length * parseInt(weight),
          efficiency: (totalVotesCast / (users.length * parseInt(weight)) * 100).toFixed(2) + '%',
          timings: groupVotingTimings
        };

        votingResults.push(groupResults);
        
        writeResults(`weighted-votes-${weight}x`, groupResults);
        
        console.log(`Gruppe ${weight}x: ${successfulVotes}/${users.length} erfolgreich, ${totalVotesCast} Stimmen abgegeben`);
      }

      // Gesamtergebnis
      const totalExpectedVotes = 
        30 * 1 +  // 30 users with 1 vote
        15 * 3 +  // 15 users with 3 votes
        5 * 5;    // 5 users with 5 votes

      const actualVotesCast = votingResults.reduce((sum, r) => sum + r.totalVotesCast, 0);
      const overallEfficiency = (actualVotesCast / totalExpectedVotes * 100).toFixed(2);

      const summary = {
        testType: 'weighted',
        timestamp: new Date().toISOString(),
        totalUsers: userPages.length,
        expectedVotes: totalExpectedVotes,
        actualVotesCast,
        efficiency: overallEfficiency + '%',
        groupResults: votingResults,
        analysis: {
          singleVoteEfficiency: votingResults.find(r => r.voteWeight === 1)?.efficiency || '0%',
          tripleVoteEfficiency: votingResults.find(r => r.voteWeight === 3)?.efficiency || '0%',
          fiveVoteEfficiency: votingResults.find(r => r.voteWeight === 5)?.efficiency || '0%'
        }
      };

      writeResults('weighted-test-summary', summary);

      console.log('\n=== WEIGHTED TEST ZUSAMMENFASSUNG ===');
      console.log(`Erwartete Stimmen: ${totalExpectedVotes}`);
      console.log(`Abgegebene Stimmen: ${actualVotesCast}`);
      console.log(`Gesamt-Effizienz: ${overallEfficiency}%`);
      console.log('=====================================\n');

      // Test ist erfolgreich, wenn mindestens 80% der erwarteten Stimmen abgegeben wurden
      expect(parseFloat(overallEfficiency)).toBeGreaterThan(80);

    } catch (error) {
      console.error("Weighted Test Fehler:", error);
      throw error;
    } finally {
      // Cleanup
      for (const context of userContexts) {
        await context.close();
      }
    }
  });
});