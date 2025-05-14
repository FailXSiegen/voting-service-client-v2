import { ref } from "vue";
import l18n from "@/l18n";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-poll-submit-answer";

// Erstelle ein Symbol als eindeutigen Key für Browser-Isolation
const instanceKey = Symbol('voting-process-instance');

// Globale Map um zu tracken, welche Browser-Instanz aktiv abstimmt
// Diese ist über Hooks hinweg isoliert
const globalBrowserSessions = new Map();

export function useVotingProcess(eventUser, event) {
  // Jeder Hook-Aufruf erstellt eine isolierte Instanz der Zustände
  const pollFormSubmitting = ref(false);
  const currentlyProcessingBatch = ref(false);
  const expectedVoteCount = ref(1);

  const usedVotesCount = ref(0);
  const voteCounter = ref(1);
  const pollStatePersistence = usePollStatePersistence();
  const onVotingCompleted = ref(() => { });
  const currentPollId = ref(null);
  const isProcessingVotes = ref(false);

  // Zähler für den aktuellen Batch
  const currentlySubmittedInBatch = ref(0);

  // Unique instance ID to ensure each browser session has its own state
  // Verstärkte Eindeutigkeit durch längere Hash-Kombination
  const instanceId = ref(Date.now().toString() + "-" + Math.random().toString(36).substring(2, 15) + "-" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36));

  // Zusätzliche Tracking-Variable für den letzten Batch
  const lastBatchTimestamp = ref(null);

  // Flag, das anzeigt, ob eine Abstimmung komplett abgeschlossen ist
  const votingFullyCompleted = ref(false);

  function setVotingCompletedCallback(callback) {
    onVotingCompleted.value = callback;
  }

  // Registriert diese Browser-Session als aktiv abstimmend
  function registerActiveVotingSession() {
    const sessionKey = instanceId.value;
    globalBrowserSessions.set(sessionKey, {
      timestamp: Date.now(),
      isActive: true,
      expectedVotes: expectedVoteCount.value
    });
    return sessionKey;
  }

  // Prüft, ob diese Browser-Session aktiv abstimmt
  function isActiveVotingSession() {
    return globalBrowserSessions.has(instanceId.value) &&
      globalBrowserSessions.get(instanceId.value).isActive === true;
  }

  // Deaktiviert diese Browser-Session als abstimmend
  function deactivateVotingSession() {
    if (globalBrowserSessions.has(instanceId.value)) {
      const session = globalBrowserSessions.get(instanceId.value);
      session.isActive = false;
      globalBrowserSessions.set(instanceId.value, session);
    }
  }

  function resetVoteCountersForNewPoll(newPollId) {

    // Speichere die ursprünglichen Werte für Debug-Zwecke
    const origUsedVotesCount = usedVotesCount.value;
    const origVoteCounter = voteCounter.value;

    if (newPollId !== currentPollId.value) {
      // WICHTIG: Prüfe, ob wir uns in einer Fortsetzung befinden
      // Wenn die aktuelle Poll dieselbe ist wie in usedVotesCount/voteCounter, nicht zurücksetzen!
      const isContinuation = newPollId === currentPollId.value;

      if (!isContinuation) {
        usedVotesCount.value = 0;
        voteCounter.value = 1;
      }

      // WICHTIG: Speichere die aktuelle Poll-ID, damit wir sie als "gesehen" markieren
      const oldPollId = currentPollId.value;
      currentPollId.value = newPollId;
      votingFullyCompleted.value = false;

      // KRITISCH: Bei einem Page-Reload oder Navigation werden wir für die gleiche Poll
      // aufgerufen - in diesem Fall NICHT den persistenten Zustand zurücksetzen!
      // Wir setzen nur zurück, wenn wirklich eine neue Abstimmung gestartet wurde
      const eventObj = event && typeof event.value === 'object' ? event.value : event;

      // KRITISCH: Prüfe, ob wir den gespeicherten Zustand wiederherstellen können
      if (eventObj && eventObj.id) {
        // Nur zurücksetzen, wenn oldPollId gesetzt war und sich wirklich geändert hat
        // Das ist der Fall bei einer echten neuen Abstimmung, NICHT bei einem Reload
        if (oldPollId !== null && oldPollId !== newPollId) {
          // Stelle sicher, dass wir nicht versehentlich die gespeicherte Stimmanzahl löschen
          // Wenn die Poll schon einmal aktiv war, dann behalten wir die maxVotesToUse
          const existingMaxVotes = pollStatePersistence.getMaxVotesToUse(newPollId, eventObj.id);

          // Vollständiges Zurücksetzen der Stimmen, aber gespeicherte Stimmenzahl beibehalten
          pollStatePersistence.resetVoteStateButKeepMaxVotes(newPollId, eventObj.id, existingMaxVotes);


          // WICHTIG: Bei einer neuen Abstimmung AUCH lokale Form-Daten zurücksetzen
          // Insbesondere die ausgewählten Antworten (multipleAnswers, singleAnswer)
          // Dies verhindert, dass alte Antwort-IDs von der vorherigen Abstimmung verwendet werden
          localStorage.removeItem(`poll_form_data_${oldPollId}`);
        } else {
          // Bei einem Reload oder Navigation: Versuche den gespeicherten Zustand zu laden
          const savedMaxVotes = pollStatePersistence.getMaxVotesToUse(newPollId, eventObj.id);
        }
      } else {
        console.warn(`[DEBUG:VOTING] Konnte Zustand nicht zurücksetzen: Event-ID nicht verfügbar`);
      }

      // Bei neuer Abstimmung sicherstellen, dass alle alten Sessions deaktiviert sind
      deactivateVotingSession();
    }
  }

  async function handleFormSubmit(pollFormData, poll, votesToUse = null) {

    // KRITISCH: Speichere den ursprünglichen Wert, um ihn später wiederherzustellen, falls etwas ihn zurücksetzt
    const originalUsedVotesCount = usedVotesCount.value;
    const originalVoteCounter = voteCounter.value;

    // FRÜHZEITIGE SICHERHEITSPRÜFUNG: Blockiere Stimmabgabe bei geschlossener Umfrage oder keinen Stimmen mehr
    if (poll.value && poll.value.closed) {
      return false;
    }

    // WICHTIG: Prüfe, ob wir eine gespeicherte maximale Stimmzahl haben
    // Diese hat Vorrang vor dem übergebenen Parameter, da sie vom Benutzer ausgewählt wurde
    const eventObj = event && typeof event.value === 'object' ? event.value : event;
    if (eventObj && eventObj.id && poll.value && poll.value.id) {
      const savedMaxVotes = pollStatePersistence.getMaxVotesToUse(poll.value.id, eventObj.id);

      // Wenn gespeicherte Stimmen gefunden wurden, verwenden wir sie
      if (savedMaxVotes !== null && savedMaxVotes > 0) {
        if (votesToUse === null || votesToUse !== savedMaxVotes) {
          // KRITISCH: Hier setzen wir den Parameter, der für alle weiteren Berechnungen genutzt wird
          votesToUse = savedMaxVotes;
        }
      }
    }

    // Frühzeitige Prüfung auf verbleibende Stimmen
    const maxAllowedVotes = eventUser.value?.voteAmount || 0;
    const currentUsedVotes = usedVotesCount.value || 0;
    if (currentUsedVotes >= maxAllowedVotes) {
      votingFullyCompleted.value = true;
      return false;
    }

    if (isActiveVotingSession()) {
      return false;
    }

    // Neue Batch-Zeit setzen, um Events unterscheiden zu können
    lastBatchTimestamp.value = Date.now();

    // Batch-Zähler für jede neue Abstimmung zurücksetzen
    currentlySubmittedInBatch.value = 0;

    // GARANTIERTE SPERRUNG VOR ALLEM ANDEREN:
    // Alle Flags sofort auf true setzen, damit die UI garantiert gesperrt ist
    pollFormSubmitting.value = true;
    currentlyProcessingBatch.value = true;
    isProcessingVotes.value = true;
    votingFullyCompleted.value = false;

    // Diese Browser-Session als aktiv abstimmend registrieren
    const sessionKey = registerActiveVotingSession();

    // Eigene Abstimmung starten - sicherer Zählerstart (KEIN Reset, damit Teilabstimmungen möglich sind)
    // usedVotesCount wird NICHT zurückgesetzt, damit wir Teilabstimmungen verarbeiten können

    // Setze die erwartete Anzahl von Stimmen für diesen Durchgang
    let expectedVotes = 1;

    // Bestimme die erwartete Stimmenzahl anhand des pollFormData und votesToUse
    if (pollFormData.useAllAvailableVotes) {
      expectedVotes = eventUser.value.voteAmount - usedVotesCount.value;
    } else if (votesToUse !== null && votesToUse > 0) {
      expectedVotes = votesToUse;
    }

    // KRITISCH: Wir dürfen den Zähler NICHT zurücksetzen, wenn wir uns in einer Fortsetzung befinden!
    // Andernfalls geht der korrekte Zählerstand verloren und wir beginnen immer wieder bei 1
    const isResuming = usedVotesCount.value > 0 && voteCounter.value > 1;

    if (isResuming) {
      // Bei Fortsetzung einer Abstimmung (nach Reload oder Teilabstimmung) Zähler NICHT zurücksetzen
      console.info(`[DEBUG:VOTING] Abstimmung wird fortgesetzt mit existierendem Zähler: ${voteCounter.value}`);
    } else {
      // Nur bei komplett neuer Abstimmung den Zähler auf 1 setzen
      voteCounter.value = 1;
    }

    // Speichere die Erwartung im lokalen State
    expectedVoteCount.value = expectedVotes;
    // Aktualisiere auch den Eintrag in der globalBrowserSessions Map
    if (globalBrowserSessions.has(sessionKey)) {
      const session = globalBrowserSessions.get(sessionKey);
      session.expectedVotes = expectedVotes;
      globalBrowserSessions.set(sessionKey, session);
    }

    // WICHTIG: Die Flags werden jetzt in SyncEventDashboard.vue gesetzt, vor dem Aufruf dieser Funktion
    // Wir machen hier nur noch die Stimmabgabe
    // Starte Stimmabgabe
    const updateCallback = ref(() => { });

    try {
      const pollId = poll.value?.id ?? 0;

      resetVoteCountersForNewPoll(pollId);

      // KRITISCH: Prüfe, ob der Wert zurückgesetzt wurde, obwohl wir in einer Fortsetzung sind
      // Wenn ja, verwende den ursprünglichen Wert wieder
      if (originalUsedVotesCount > 0 && usedVotesCount.value === 0) {
        usedVotesCount.value = originalUsedVotesCount;
      }

      if (originalVoteCounter > 1 && voteCounter.value === 1) {
        voteCounter.value = originalVoteCounter;
      }

      // NEUE PRÜFUNG: Prüfe, ob die Umfrage bereits geschlossen ist
      if (poll.value && poll.value.closed) {
        pollFormSubmitting.value = false;
        isProcessingVotes.value = false;
        currentlyProcessingBatch.value = false;
        deactivateVotingSession();
        return false;
      }

      const maxAllowedVotes = eventUser.value.voteAmount;
      const remainingVotes = maxAllowedVotes - usedVotesCount.value;

      // Speichere den aktuellen Server-Zyklus für korrekte Berechnung nach Reload
      const serverVoteCycle = usedVotesCount.value;

      // KRITISCH: Prüfe ob es bereits eine gespeicherte maximale Stimmanzahl gibt
      // Eventobj wurde bereits vorher deklariert, also benutzen wir es hier wieder
      const savedMaxVotes = pollId && eventObj && eventObj.id ?
        pollStatePersistence.getMaxVotesToUse(pollId, eventObj.id) : null;

      // Wenn gespeicherte Stimmen gefunden wurden, verwenden wir sie
      if (savedMaxVotes !== null && savedMaxVotes > 0) {
        if (votesToUse === null || votesToUse !== savedMaxVotes) {
          votesToUse = savedMaxVotes;
        }
      } else if (pollId && eventObj && eventObj.id) {
        console.warn(`[DEBUG:VOTING] Keine gespeicherte Stimmanzahl gefunden für: pollId=${pollId}, eventId=${eventObj.id}`);
      }

      if (remainingVotes <= 0) {
        console.error("[DEBUG:VOTING] Keine verbleibenden Stimmen mehr. Blockiere weitere Abstimmungsversuche.");
        if (pollId) {
          // VERBESSERT: Stellt sicher, dass wir immer die tatsächliche Anzahl verwendeter Stimmen speichern
          // Diese ist wichtig für korrekte Wiederherstellung nach Reload
          if (event.value && event.value.id) {
            pollStatePersistence.upsertPollState(pollId, 99999, totalAllowedVotes, event.value.id);
          } else {
            pollStatePersistence.upsertPollState(pollId, 99999);
          }
        }

        // UI sofort entsperren
        pollFormSubmitting.value = false;
        currentlyProcessingBatch.value = false;
        isProcessingVotes.value = false;
        deactivateVotingSession();

        // Vollständigkeitswert setzen
        votingFullyCompleted.value = true;

        await onVotingCompleted.value();
        return false;
      }

      let actualVotesToUse = 1;

      // WICHTIG: Prüfe DIREKT VOR der Stimmverarbeitung, ob wir eine gespeicherte Stimmenzahl haben
      // Eventobj wurde bereits vorher deklariert, also benutzen wir es hier wieder
      const maxStoredVotes = pollId && eventObj && eventObj.id ?
        pollStatePersistence.getMaxVotesToUse(pollId, eventObj.id) : null;


      if (pollFormData.useAllAvailableVotes) {
        actualVotesToUse = remainingVotes;
      } else if (maxStoredVotes !== null && maxStoredVotes > 0) {
        // WICHTIG: Wenn wir eine gespeicherte Stimmenzahl haben, verwenden wir IMMER diese!
        const storedLimit = parseInt(maxStoredVotes, 10);
        // Stelle sicher, dass wir nicht mehr Stimmen verwenden als verfügbar
        actualVotesToUse = Math.min(storedLimit, remainingVotes);
      } else if (votesToUse !== null && votesToUse > 0) {
        const requested = parseInt(votesToUse, 10);
        actualVotesToUse = Math.min(requested, remainingVotes);

        // Speichere die ausgewählte Anzahl für zukünftige Page-Loads
        // Eventobj wurde bereits vorher deklariert, also benutzen wir es hier wieder
        if (pollId && eventObj && eventObj.id) {
          pollStatePersistence.setMaxVotesToUse(pollId, eventObj.id, requested);
        } else {
          console.error(`[DEBUG:VOTING] Konnte Stimmanzahl nicht speichern: Poll=${pollId}, Event=${JSON.stringify(eventObj)}`);
        }
      }

      // WICHTIG: Vor jeder Abstimmungsreihe überprüfen wir, ob wir noch genügend Stimmen haben
      // Aktualisiere den Wert von remainingVotes, da sich der Zählerstand geändert haben könnte
      const currentRemainingVotes = maxAllowedVotes - usedVotesCount.value;
      if (currentRemainingVotes <= 0) {
        return false;
      }

      // Begrenze actualVotesToUse auf die Anzahl der verbleibenden Stimmen
      const adjustedVotesToUse = Math.min(actualVotesToUse, currentRemainingVotes);

      // Lokaler Zähler nur für diese Batch-Abstimmung
      let localSuccessCount = 0;

      // Setze erwartete Stimmanzahl für Subscription-Erkennung
      expectedVoteCount.value = adjustedVotesToUse;

      // Absichtlich NICHT zurücksetzen des usedVotesCount.value vor der Schleife!
      // Dies ist kumulativ über mehrere Batches hinweg

      // OPTIMIERUNG: Batch-Verarbeitung mit kleinen Gruppen paralleler Anfragen
      // Wir teilen die Stimmen in kleine Batches auf und verarbeiten diese parallel
      // So vermeiden wir Datenbankfehler und behalten die Geschwindigkeitsvorteile

      // LÖSUNG FÜR DAS RELOAD-PROBLEM: Explizite Prüfung für Reload-Zustand
      // Wir sind in einem Reload-Zustand, wenn eine der folgenden Bedingungen zutrifft:
      // 1. Die Poll-ID ist bekannt und gleich der aktuellen Poll-ID
      // 2. Laut Server haben wir bereits Stimmen abgegeben (serverVoteCycle > 0)
      const isReload = (currentPollId.value === pollId && usedVotesCount.value > 0) || serverVoteCycle > 0;
      console.warn(`[DEBUG:VOTING] Reload-Status: ${isReload ? 'Reload erkannt' : 'Keine Reload'} (serverVoteCycle=${serverVoteCycle}, usedVotesCount=${usedVotesCount.value})`);


      // Erste Stimme sofort abgeben für schnelles Feedback - aber nur, wenn es KEINE Reload ist!
      if (!isReload && adjustedVotesToUse > 0) {
        // Bei erster Abstimmung: erste Stimme sofort abgeben für schnelles Feedback
        const firstResult = await submitSingleVote(pollFormData, poll, false);

        if (firstResult) {
          localSuccessCount++;
          // UI-Update für erste Stimme
          currentlySubmittedInBatch.value = 1;
        } else {
          console.error(`[DEBUG:VOTING] FEHLER bei der ersten Stimme! Restliche Verarbeitung wird abgebrochen.`);
          // Wenn die erste Stimme fehlschlägt, brechen wir ab
          return false;
        }
      } else if (isReload) {
        // Aber wir setzen trotzdem ein UI-Update für den Benutzer
        currentlySubmittedInBatch.value = 0;
      }

      // Restliche Stimmen in Batches verarbeiten
      if (adjustedVotesToUse > 1) {
        // OPTIMIERUNG FÜR LAST-TESTS:
        // Kleinere Batch-Größe und adaptive Pausen
        const BATCH_SIZE = 25; // Reduziert für bessere Skalierbarkeit bei hoher Last

        // SICHERHEITSCHECK: Prüfe vor dem Start der Batch-Verarbeitung, ob der Poll noch offen ist
        if (poll.value && poll.value.closed) {
          console.warn("[DEBUG:VOTING] Poll wurde zwischenzeitlich geschlossen. Batch-Verarbeitung wird abgebrochen.");
          return false;
        }

        // KRITISCH: Stelle sicher, dass wir die korrekte Anzahl verbleibender Stimmen verwenden
        // Hier NOCHMALS prüfen, ob wir eine gespeicherte Stimmenzahl haben

        // LÖSUNG FÜR DAS RELOAD-PROBLEM: 
        // Wir brauchen eine Variable, die uns sagt, ob es sich um eine erste Abstimmung handelt
        // oder um ein Nachladen einer bestehenden Abstimmung

        // Die Erkennung wurde bereits oben durchgeführt
        // Wir verwenden die Variable isReload, die bereits oben definiert wurde

        let remainingVotesToProcess;

        if (isReload) {
          // Bei einem Reload KEINE Stimme abziehen, da die erste Stimme bereits in usedVotesCount enthalten ist
          // und wir die gesamte gewünschte Anzahl neu verarbeiten müssen
          remainingVotesToProcess = adjustedVotesToUse;
        } else {
          // Bei einer normalen ersten Abstimmung die erste Stimme abziehen, da wir sie bereits oben verarbeitet haben
          remainingVotesToProcess = adjustedVotesToUse - 1;
        }

        // MEGA-WICHTIGE KORREKTURBERECHNUNG: limitiere die Anzahl der zu verarbeitenden Stimmen
        // auf die gespeicherte Stimmenzahl, falls vorhanden
        // Eventobj wurde bereits vorher deklariert, also benutzen wir es hier wieder
        if (pollId && eventObj && eventObj.id) {
          const maxStored = pollStatePersistence.getMaxVotesToUse(pollId, eventObj.id);

          if (maxStored !== null && maxStored > 0) {
            // KORREKTUR: Die Anzahl der zu verarbeitenden Stimmen sollte das gespeicherte Limit nicht überschreiten

            // Bei einem Reload bzw. wenn wir einen Seitenwechsel haben, ist die Logik anders!
            if (isReload) {
              // Bei einem Reload begrenzen wir auf die volle gespeicherte Anzahl
              if (remainingVotesToProcess > maxStored) {
                remainingVotesToProcess = maxStored;
              }
            } else {
              // Bei erster Abstimmung minus 1, weil die erste Stimme bereits oben verarbeitet wurde
              if (remainingVotesToProcess > (maxStored - 1)) {
                remainingVotesToProcess = maxStored - 1;
              }
            }
          }
        } else {
          console.warn(`[DEBUG:VOTING] Konnte gespeichertes Limit nicht abrufen: Poll=${pollId}, Event=${JSON.stringify(eventObj)}`);
        }


        // Retry-Zähler für exponentielles Backoff
        let retryCount = 0;

        // Verarbeite die restlichen Stimmen in Batches
        for (let batchStart = 0; batchStart < remainingVotesToProcess; batchStart += BATCH_SIZE) {
          // SICHERHEITSCHECK: Prüfe VOR JEDEM BATCH, ob der Poll noch offen ist
          if (poll.value && poll.value.closed) {
            console.warn("[DEBUG:VOTING] Poll wurde während der Batch-Verarbeitung geschlossen. Verarbeitung wird SOFORT abgebrochen.");
            
            // KRITISCHE REIHENFOLGE: Erst die Browser-Session deaktivieren, um Callbacks zu verhindern
            deactivateVotingSession();
            
            // Dann currentlyProcessingBatch zurücksetzen, um weitere Event-Verarbeitung zu blockieren
            currentlyProcessingBatch.value = false;
            
            // Dann erst die UI-Sperren aufheben
            releaseUILocks();
            
            // Explizit auf false setzen, um zu erzwingen, dass keine weiteren Verarbeitungen stattfinden
            isProcessingVotes.value = false;
            pollFormSubmitting.value = false;
            votingFullyCompleted.value = false;
            
            // WICHTIG: Wir kehren sofort zurück, ohne weitere Operationen auszuführen
            return false;
          }

          // Erstelle einen Batch von Promises
          const batchPromises = [];
          const currentBatchSize = Math.min(BATCH_SIZE, remainingVotesToProcess - batchStart);

          for (let i = 0; i < currentBatchSize; i++) {
            batchPromises.push(submitSingleVote(pollFormData, poll, false));
          }

          // Verarbeite den aktuellen Batch parallel
          let success = false;
          let attempts = 0;
          const MAX_ATTEMPTS = 3;

          while (!success && attempts < MAX_ATTEMPTS) {
            try {
              const batchResults = await Promise.all(batchPromises);
              const batchSuccessCount = batchResults.filter(result => result === true).length;
              localSuccessCount += batchSuccessCount;

              // UI nach jedem Batch aktualisieren
              currentlySubmittedInBatch.value = localSuccessCount + 1; // +1 für die erste bereits gezählte Stimme

              success = true;
              retryCount = 0; // Reset retry counter on success
            } catch (error) {
              attempts++;
              retryCount++;
              console.error(`Fehler bei der Batch-Verarbeitung (Versuch ${attempts}/${MAX_ATTEMPTS}):`, error);

              if (attempts < MAX_ATTEMPTS) {
                // Exponentielles Backoff bei Fehlern
                const backoffTime = Math.min(100 * (2 ** retryCount), 2000); // max 2 Sekunden
                await new Promise(resolve => setTimeout(resolve, backoffTime));
              }
            }
          }

          // Adaptive Pause zwischen den Batches - längere Pausen bei höherer Last
          // Die Pause verlängert sich, je mehr Stimmen bereits abgegeben wurden
          if (batchStart + BATCH_SIZE < remainingVotesToProcess) {
            // Berechne adaptive Pausenzeit basierend auf der Position im Gesamtprozess
            // und der Anzahl der verbleibenden Stimmen
            const processPercentage = batchStart / remainingVotesToProcess;
            const baseDelay = 100; // Basis-Verzögerung von 100ms
            const adaptiveDelay = baseDelay + Math.min(processPercentage * 400, 400); // Max +400ms zusätzlich

            // Implementiere eine zufällige Schwankung, um Request-Clustering zu vermeiden
            // Dies ist besonders wichtig bei vielen parallelen Clients
            const jitter = Math.random() * 50 - 25; // +/- 25ms zufällige Schwankung

            const pauseTime = Math.round(adaptiveDelay + jitter);
            await new Promise(resolve => setTimeout(resolve, pauseTime));
          }
        }
      }

      // Finales UI-Update
      currentlySubmittedInBatch.value = localSuccessCount;

      // Nach einem Reload muss der Zähler korrekt addiert werden
      // Wir haben bereits bei der Initialisierung den Server-Wert übernommen
      if (isReload) {
        // Im Reload-Fall haben wir bereits zu Beginn den korrekten serverVoteCycle-Wert gesetzt
        // Hier nur die neuen Stimmen hinzufügen
        console.warn(`[DEBUG:VOTING] Bei Reload: usedVotesCount war vor Abstimmung ${usedVotesCount.value}`);
        console.warn(`[DEBUG:VOTING] Bei Reload: Füge ${localSuccessCount} neue Stimmen für diesen Batch hinzu`);

        // Dennoch müssen die neu abgegebenen Stimmen zum Zähler addiert werden
        usedVotesCount.value += localSuccessCount;

        console.warn(`[DEBUG:VOTING] Bei Reload: usedVotesCount nach Aktualisierung: ${usedVotesCount.value}`);
      } else {
        // Im normalen Fall (keine Reload) Gesamtzähler addieren
        usedVotesCount.value += localSuccessCount;
      }

      // Nachdem die Schleife beendet ist, betrachten wir den Batch als abgeschlossen

      // WICHTIG: Nach der Schleife direkt den currentlyProcessingBatch-Flag setzen
      // Dadurch werden nur so viele Events verarbeitet, wie wir gerade abgestimmt haben

      // Nur das Batch-Flag zurücksetzen - damit werden keine weiteren Events mehr verarbeitet!
      currentlyProcessingBatch.value = false;

      // Die anderen Flags bleiben gesetzt, bis die UI aktiv zurückgesetzt wird
      // isProcessingVotes.value = false;
      // pollFormSubmitting.value = false;

      // Die Session wird sofort deaktiviert, da handleFormSubmit abgeschlossen ist
      // UI-Sperren werden nun SOFORT freigegeben, nicht auf Events warten
      deactivateVotingSession();

      // NEUE PRÜFUNG: Setze votingFullyCompleted wenn alle Stimmen verbraucht sind
      const totalAllowedVotes = eventUser.value.voteAmount;
      if (usedVotesCount.value >= totalAllowedVotes) {
        votingFullyCompleted.value = true;

        // Extra Prüfung: Bei einem Reload stellen wir sicher, dass wir nicht mehr Stimmen
        // abgeben als verfügbar, indem wir den Zähler auf das Maximum begrenzen
        if (usedVotesCount.value > totalAllowedVotes) {
          console.warn(`[DEBUG:VOTING] Stimmenzähler korrigiert: ${usedVotesCount.value} auf ${totalAllowedVotes}`);
          usedVotesCount.value = totalAllowedVotes;
        }
      }

      // Sofortige UI-Freigabe garantieren
      pollFormSubmitting.value = false;
      isProcessingVotes.value = false;

      // Trotzdem als Sicherheitsnetz einen Timeout setzen, falls etwas schiefgeht
      setTimeout(() => {
        // Unbedingt noch einmal alle UI-Flags freigeben, falls sie zwischenzeitlich gesetzt wurden
        if (pollFormSubmitting.value || isProcessingVotes.value) {
          // UI-Flags notfalls erneut zurücksetzen
          pollFormSubmitting.value = false;
          isProcessingVotes.value = false;
        }
      }, 5000);

      // Log-Ausgabe

      if (usedVotesCount.value >= maxAllowedVotes) {

        if (pollId) {
          // Stelle sicher, dass wir auch die event.id übermitteln, falls verfügbar
          if (event.value && event.value.id) {
            // Der 99999-Wert ist ein spezieller Marker für "alle Stimmen verbraucht"
            // Wir speichern aber auch die tatsächliche Anzahl der verwendeten Stimmen
            pollStatePersistence.upsertPollState(pollId, 99999, usedVotesCount.value, event.value.id);
          } else {
            pollStatePersistence.upsertPollState(pollId, 99999);
          }
        }
        voteCounter.value = 1;

        // KRITISCH: Wir halten isProcessingVotes auf true, da wir den Callback
        // erst nach einer kurzen Verzögerung ausführen
        updateCallback.value = async () => {
          // Explizit 500ms Wartezeit für Client-Koordination einfügen
          // Dies stellt sicher, dass das UI gesperrt bleibt, bis alle Updates durchgeführt wurden
          await new Promise(resolve => setTimeout(resolve, 500));

          // Erst dann den Callback ausführen und Modal schließen
          await onVotingCompleted.value();
        };
      } else {

        // SUPER-KRITISCH: Prüfe, ob usedVotesCount zwischenzeitlich zurückgesetzt wurde
        // Wenn ja, stelle den ursprünglichen Wert wieder her
        if (originalUsedVotesCount > 0 && usedVotesCount.value < originalUsedVotesCount) {
          usedVotesCount.value = originalUsedVotesCount;
        }

        // KRITISCH: Stelle sicher, dass der voteCounter korrekt aktualisiert wird
        // und dass er niemals niedriger ist als der gespeicherte Wert
        if (pollId && event.value && event.value.id) {
          const storedCounter = pollStatePersistence.restoreVoteCounter(pollId, event.value.id);
          const newCounter = usedVotesCount.value + 1;

          // Verwende den höheren Wert, um sicherzustellen, dass wir niemals einen kleineren Zähler haben
          if (storedCounter > newCounter) {
            voteCounter.value = storedCounter;
          } else {
            voteCounter.value = newCounter;
          }
        } else {
          voteCounter.value = usedVotesCount.value + 1;
        }
        // Auch für Teilabstimmungen die Event-ID mit übergeben, falls verfügbar
        if (event.value && event.value.id) {
          pollStatePersistence.upsertPollState(pollId, voteCounter.value, usedVotesCount.value, event.value.id);
        } else {

          // Sichere Alternative: Extrahiere die Event-ID aus den verfügbaren Quellen
          const eventObj = event && typeof event === 'object' ? event : null;
          const eventId = eventObj?.id || (eventObj?.value?.id);

          if (eventId) {
            pollStatePersistence.upsertPollState(pollId, voteCounter.value, usedVotesCount.value, eventId);
          } else {
            console.warn(`[DEBUG:VOTING] KRITISCH: Keine Event-ID verfügbar! Dies kann zu Inkonsistenzen führen.`);
            // Nur im absoluten Notfall den Legacy-Speicher verwenden
            pollStatePersistence.upsertPollState(pollId, voteCounter.value, usedVotesCount.value);
          }
        }

        updateCallback.value = () => { };
      }

      return true;
    } catch (error) {
      console.error('Fehler bei der Stimmabgabe:', error);

      // Bei einem Fehler setzen wir die UI-Flags zurück

      // WICHTIG: Hier MUSS das currentlyProcessingBatch.value zurückgesetzt werden,
      // da der normale Workflow nicht abgeschlossen wurde
      currentlyProcessingBatch.value = false;

      // UI-Flags zurücksetzen
      pollFormSubmitting.value = false;
      isProcessingVotes.value = false;

      // Aktive Session deaktivieren
      deactivateVotingSession();

      // UI-Flags werden sofort hier zurückgesetzt, um Blockaden zu vermeiden
      return false;
    } finally {
      // Callback ausführen und dann überprüfen, ob Teilstimmen abgegeben wurden
      try {
        // Callback für die UI-Updates ausführen
        await updateCallback.value();

        // Nach dem Callback prüfen wir, ob alle oder nur Teilstimmen abgegeben wurden
        const totalAllowedVotes = eventUser.value.voteAmount;
        const usedVotes = usedVotesCount.value;

        // WICHTIG: Nur die UI-Flags zurücksetzen, nicht Event-Verarbeitungs-Flag!
        // Das currentlyProcessingBatch.value wurde bereits nach der Schleife gesetzt und darf
        // hier nicht überschrieben werden, um eine klare Isolation der Event-Verarbeitung zu gewährleisten

        // Bei vollständiger Abgabe aller Stimmen kennzeichnen wir das
        if (usedVotes >= totalAllowedVotes) {
          votingFullyCompleted.value = true;
        }

        // WICHTIG: Die UI-Flags werden SOFORT zurückgesetzt für garantierte Entsperrung
        isProcessingVotes.value = false;
        pollFormSubmitting.value = false;

        // HIER NOCH EINMAL explizit die Session deaktivieren
        deactivateVotingSession();

        // Am Ende von handleFormSubmit geben wir die Steuerung zurück an den Aufrufer
        // mit garantiert freigegebener UI
      } catch (err) {
        console.error('Fehler im Update-Callback', err);
        // Bei Fehlern alle Flags zurücksetzen und Session beenden
        isProcessingVotes.value = false;
        pollFormSubmitting.value = false;
        currentlyProcessingBatch.value = false;
        deactivateVotingSession();
      }
    }
  }

  async function submitSingleVote(pollFormData, poll, useAllVotes) {
    // OPTIMIERUNG: Keine UI-Updates in dieser Funktion
    // Wir verzichten auf das Inkrementieren des Fortschrittszählers in dieser Funktion
    // Stattdessen aktualisieren wir den Zähler an strategischen Punkten in handleFormSubmit
    // - einmal nach der ersten Stimme für sofortiges Feedback
    // - einmal am Ende für den Gesamtfortschritt

    // KRITISCHE SICHERHEITSPRÜFUNG: Prüfe ERNEUT, ob die Umfrage geschlossen ist
    // Diese Prüfung ist besonders wichtig, wenn der Poll während der Abstimmung geschlossen wird
    if (poll.value && poll.value.closed) {
      console.warn("[DEBUG:VOTING] Poll ist geschlossen. Stimmabgabe wird abgebrochen.");
      
      // KRITISCH: Wir müssen die Browser-Session SOFORT deaktivieren
      // um zu verhindern, dass weitere Events verarbeitet werden
      deactivateVotingSession();
      
      // KRITISCH: Zuerst currentlyProcessingBatch zurücksetzen, um weitere Events zu blockieren
      currentlyProcessingBatch.value = false;
      
      // Alle UI-Sperren direkt zurücksetzen
      isProcessingVotes.value = false;
      pollFormSubmitting.value = false;
      
      // Danach nur zur Sicherheit die explizite Methode aufrufen, falls vorhanden
      if (typeof releaseUILocks === 'function') {
        releaseUILocks();
      }
      
      return false;
    }

    // KRITISCH: voteCycle wird hier definiert, aber wir müssen sicherstellen,
    // dass wir nur die tatsächlich verbleibenden Stimmen verwenden

    // Berechne die Anzahl der noch verfügbaren Stimmen
    const maxAllowedVotes = eventUser.value.voteAmount || 0;
    const currentUsedVotes = usedVotesCount.value || 0;
    const remainingVotes = Math.max(0, maxAllowedVotes - currentUsedVotes);

    // ZUSÄTZLICHE SICHERHEITSPRÜFUNG: Blockiere Stimmabgabe wenn keine Stimmen mehr übrig
    if (remainingVotes <= 0) {
      return false;
    }

    // Für useAllVotes: Wir senden die Anzahl der verbleibenden Stimmen statt des Zyklus
    // Sonst senden wir 1 für einzelne Stimmen
    const votesToSubmit = useAllVotes ? remainingVotes : 1;
    const isLastAnswerInBallot = (votesToSubmit === 1 && pollFormData.multipleAnswers?.length === 0);
    const baseInput = {
      eventUserId: eventUser.value.id,
      pollId: poll.value?.id ?? 0,
      type: poll.value.type,
      voteCycle: votesToSubmit, // Anzahl der abzugebenden Stimmen für diesen Request
      answerItemLength: 1,
      answerItemCount: 1,
      multivote: useAllVotes,
      isLastAnswerInBallot: isLastAnswerInBallot,
    };

    try {
      if (pollFormData.abstain) {
        const input = {
          ...baseInput,
          answerContent: l18n.global.tc("view.polls.modal.abstain"),
          possibleAnswerId: null,
        };
        await mutateAnswer(input);
      } else if (pollFormData.multipleAnswers?.length > 0) {
        let answerCounter = 1;

        // WICHTIG: Vorprüfung - Stellen wir sicher, dass die possibleAnswers existieren
        // und dass wir alle verwendeten Antwort-IDs auch wirklich finden können
        if (!poll.value || !poll.value.possibleAnswers || !Array.isArray(poll.value.possibleAnswers)) {
          console.error(`[ERROR:VOTING] possibleAnswers ist nicht verfügbar: ${JSON.stringify(poll.value)}`);
          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }
          return false;
        }

        // PRÄ-VALIDIERUNG: Prüfe, ob alle ausgewählten Antwort-IDs gültig sind
        const invalidAnswerIds = [];
        for (const answerId of pollFormData.multipleAnswers) {
          const answerExists = poll.value.possibleAnswers.some(
            (x) => parseInt(x.id) === parseInt(answerId)
          );

          if (!answerExists) {
            invalidAnswerIds.push(answerId);
          }
        }

        // Wenn ungültige Antworten gefunden wurden, lokalen Speicher löschen und abbrechen
        if (invalidAnswerIds.length > 0) {
          console.error(`[ERROR:VOTING] Ungültige Antwort-IDs gefunden: ${invalidAnswerIds.join(', ')}. Aktuelle possibleAnswers:`, poll.value.possibleAnswers);

          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          return false;
        }

        // Jetzt können wir sicher sein, dass alle IDs gültig sind
        for await (const answerId of pollFormData.multipleAnswers) {
          const answer = poll.value.possibleAnswers.find(
            (x) => parseInt(x.id) === parseInt(answerId),
          );

          const input = {
            ...baseInput,
            answerContent: answer.content,
            possibleAnswerId: answer.id,
            answerItemLength: pollFormData.multipleAnswers.length,
            answerItemCount: answerCounter,
            isLastAnswerInBallot: (answerCounter === pollFormData.multipleAnswers.length),
          };
          await mutateAnswer(input);
          answerCounter++;
        }
      } else if (pollFormData.singleAnswer) {
        // Prüfe, ob poll.value.possibleAnswers existiert
        if (!poll.value || !poll.value.possibleAnswers || !Array.isArray(poll.value.possibleAnswers)) {
          console.error(`[ERROR:VOTING] possibleAnswers ist nicht verfügbar: ${JSON.stringify(poll.value)}`);
          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }
          return false;
        }

        // PRÄ-VALIDIERUNG: Prüfe, ob die einzelne Antwort-ID gültig ist
        const answerExists = poll.value.possibleAnswers.some(
          (x) => parseInt(x.id) === parseInt(pollFormData.singleAnswer)
        );

        if (!answerExists) {
          console.error(`[ERROR:VOTING] Ungültige singleAnswer-ID: ${pollFormData.singleAnswer}. Aktuelle possibleAnswers:`, poll.value.possibleAnswers);

          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          return false;
        }

        // Jetzt können wir die Antwort sicher abrufen
        const answer = poll.value.possibleAnswers.find(
          (x) => parseInt(x.id) === parseInt(pollFormData.singleAnswer),
        );

        const input = {
          ...baseInput,
          answerContent: answer.content,
          possibleAnswerId: answer.id,
        };
        await mutateAnswer(input);
      } else {
        console.warn("Invalid form data. Submit wird ignoriert!");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Fehler bei der Stimmabgabe:", error);
      return false;
    }
  }

  function resetVoteCounts() {
    // VOLLSTÄNDIGER Reset aller Zähler und Status-Werte
    usedVotesCount.value = 0;
    voteCounter.value = 1;

    // Alte Poll-ID speichern, um lokale Daten zu löschen
    const oldPollId = currentPollId.value;

    // Poll-ID zurücksetzen
    currentPollId.value = null;

    // UI-Status zurücksetzen
    isProcessingVotes.value = false;
    pollFormSubmitting.value = false;
    currentlyProcessingBatch.value = false;
    expectedVoteCount.value = 1;
    lastBatchTimestamp.value = null;
    currentlySubmittedInBatch.value = 0; // Batch-Zähler zurücksetzen
    votingFullyCompleted.value = false;

    // Auch die aktive Session deaktivieren
    deactivateVotingSession();

    // WICHTIG: Lokale Form-Daten der alten Abstimmung löschen
    if (oldPollId) {
      localStorage.removeItem(`poll_form_data_${oldPollId}`);
    }
  }

  // Eine explizite Methode zum kontrollierten Freigeben der UI
  function releaseUILocks() {
    // Explizite Freigabe der UI-Sperren
    isProcessingVotes.value = false;
    pollFormSubmitting.value = false;

    // Wir lassen currentlyProcessingBatch unberührt, da dies den Event-Empfang steuert
  }

  return {
    voteCounter,
    handleFormSubmit,
    setVotingCompletedCallback,
    resetVoteCounts,
    isProcessingVotes,
    usedVotesCount,   // Exportiere usedVotesCount, damit es von außen zugänglich ist
    pollFormSubmitting,
    currentlyProcessingBatch,
    expectedVoteCount,
    instanceId,      // Instanz-ID zur Isolation zwischen Browsern
    lastBatchTimestamp,  // Timestamp des letzten Batches für zusätzliche Isolation
    votingFullyCompleted, // Flag, das anzeigt, ob alle Stimmen abgegeben wurden
    isActiveVotingSession, // Funktion zur Prüfung, ob diese Session aktiv abstimmt
    deactivateVotingSession, // Funktion zum Deaktivieren der Session
    releaseUILocks    // Explizite Methode zum Freigeben der UI
  };
}

async function mutateAnswer(input) {
  try {
    const createPollSubmitAnswerMutation = useMutation(
      CREATE_POLL_SUBMIT_ANSWER,
      {
        variables: { input },
      },
    );
    await createPollSubmitAnswerMutation.mutate();
    return true;
  } catch (error) {
    console.error(`Fehler bei der Mutation für Zyklus ${input.voteCycle}/${input.answerItemCount}:`, error);
    throw error;
  }
}