import { ref, watch } from "vue";
import l18n from "@/l18n";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-poll-submit-answer";
import { CREATE_BULK_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-bulk-poll-submit-answer";
import { apolloClient } from "@/apollo-client"; // Ensure we import the Apollo client

// Erstelle ein Symbol als eindeutigen Key für Browser-Isolation
const instanceKey = Symbol('voting-process-instance');

// Globale Map um zu tracken, welche Browser-Instanz aktiv abstimmt
// Diese ist über Hooks hinweg isoliert
const globalBrowserSessions = new Map();

// Stelle ein globales Modul bereit, auf das andere Komponenten zugreifen können
if (typeof window !== 'undefined') {
  window.votingProcessModule = {
    usedVotesCount: 0,
    voteCounter: 1
  };
  
  // Tracking von bereits verarbeiteten Poll-Closed Events um Duplikate zu vermeiden
  const processedPollClosedEvents = new Map();
  
  // Globaler Listener für poll:closed Events
  window.addEventListener('poll:closed', (event) => {
    const pollId = event.detail?.pollId;
    const timestamp = event.detail?.timestamp || Date.now();
    
    // Deduplizieren: Prüfe, ob wir dieses Poll-ID bereits kürzlich verarbeitet haben
    if (pollId) {
      const lastProcessed = processedPollClosedEvents.get(pollId);
      const DEDUPLICATION_WINDOW_MS = 5000; // 5 Sekunden Fenster für Deduplizierung
      
      // Wenn wir das Event für diese Poll kürzlich verarbeitet haben, ignorieren
      if (lastProcessed && (timestamp - lastProcessed) < DEDUPLICATION_WINDOW_MS) {
        console.log(`[DEBUG:VOTING] Poll ist bereits als geschlossen markiert, ignoriere weiteres Life-Cycle-Event`);
        return;
      }
      
      // Update der letzten Verarbeitungszeit
      processedPollClosedEvents.set(pollId, timestamp);
      
      // Ältere Einträge aus der Map entfernen (für Speicher-Management)
      const CLEANUP_THRESHOLD_MS = 60000; // 1 Minute
      processedPollClosedEvents.forEach((value, key) => {
        if (timestamp - value > CLEANUP_THRESHOLD_MS) {
          processedPollClosedEvents.delete(key);
        }
      });
    }
    
    console.log('[DEBUG:VOTING] Global poll:closed Event empfangen:', event.detail);
    
    // Setze das globale Flag, um weitere Vote-Verarbeitung zu blockieren
    window.pollClosedEventReceived = true;
    
    // Versuche alle aktiven Vote-Prozesse zu stoppen
    if (globalBrowserSessions.size > 0) {
      console.log('[DEBUG:VOTING] Stoppe alle aktiven Voting-Sessions aufgrund von poll:closed Event');
      
      // Iteriere über alle Sessions und deaktiviere sie
      globalBrowserSessions.forEach((session, key) => {
        session.isActive = false;
        globalBrowserSessions.set(key, session);
      });
      
      // Zusätzlich alle UI-Flags zurücksetzen
      window._pollFormSubmitting = false;
      window._isProcessingVotes = false;
      window._currentlyProcessingBatch = false;
      
      // Event für UI-Entsperrung auslösen
      try {
        window.dispatchEvent(new CustomEvent('voting:complete', {
          detail: { timestamp: Date.now(), pollClosed: true, pollId }
        }));
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:complete Events:', e);
      }
    }
  });
}

// Import provideApolloClient at the module level to prevent any "oe is undefined" issues
// This ensures that the Apollo client is properly provided to all composables
import { provideApolloClient } from '@vue/apollo-composable';

// Explicitly provide the Apollo client at the module level
provideApolloClient(apolloClient);

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
    // MEGA-KRITISCHE SICHERHEITSPRÜFUNG: Validiere die Eingabedaten
    // Dies verhindert Race-Conditions bei schnellen Poll-Wechseln

    // 1. Prüfe, ob Formular-Daten existieren
    if (!pollFormData) {
      console.error("[ERROR:VOTING] Keine Formular-Daten für Stimmabgabe!");
      return false;
    }

    // 2. Prüfe, ob das Poll-Objekt existiert
    if (!poll || !poll.value) {
      console.error("[ERROR:VOTING] Kein gültiges Poll-Objekt für Stimmabgabe!");
      return false;
    }

    // 3. RACE-CONDITION-FIX: Prüfe auf eventuelle Polling-Konflikte
    if (window._newPollActive === true) {
      console.error("[ERROR:VOTING] Neue Poll wurde aktiviert während eine Stimmabgabe im Gange war!");

      // UI entsperren und alle aktiven Sessions deaktivieren
      releaseUILocks();
      deactivateVotingSession();
      currentlyProcessingBatch.value = false;

      return false;
    }

    // 4. Falls die Poll geschlossen wurde, auch diesen Fall sofort abfangen
    if (typeof window !== 'undefined' && window.pollClosedEventReceived === true) {
      console.error("[ERROR:VOTING] Poll wurde bereits geschlossen, blockiere Stimmabgabe!");
      releaseUILocks();
      deactivateVotingSession();
      return false;
    }

    // KRITISCH: Speichere den ursprünglichen Wert, um ihn später wiederherzustellen, falls etwas ihn zurücksetzt
    const originalUsedVotesCount = usedVotesCount.value;
    const originalVoteCounter = voteCounter.value;

    // FRÜHZEITIGE SICHERHEITSPRÜFUNG: Blockiere Stimmabgabe bei geschlossener Umfrage oder keinen Stimmen mehr
    if (poll.value && poll.value.closed) {
      console.warn("[DEBUG:VOTING] Poll ist geschlossen, blockiere Stimmabgabe!");
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

    if (!isResuming) {
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

      // Hole den Server-Zyklus - dies ist die primäre Wahrheitsquelle für abgegebene Stimmen
      // Bei Reload oder Seitenwechsel enthält dies den aktuellen Stand auf dem Server
      // Beim ersten Aufruf enthält dies 0, da noch keine Stimmen abgegeben wurden
      const serverVoteCycle = eventUser.value?.userVoteCycle?.voteCycle || 0;

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
      // 2. Laut Server haben wir bereits Stimmen abgegeben (serverVoteCycle > 0) - PRIMÄRE QUELLE
      // 3. Oder wir haben bereits im lokalen Zustand Stimmen abgegeben (usedVotesCount.value > 0)

      // Priorität: Server-Zyklus ist die primäre Quelle der Wahrheit, dann lokale Zähler
      const isReload = serverVoteCycle > 0 ||
        (currentPollId.value === pollId && usedVotesCount.value > 0) ||
        usedVotesCount.value > 0;

      // KRITISCH: Wir müssen hier auch die gewünschte Stimmenanzahl bei Reload erhalten
      // Wenn der Benutzer nur 1 Stimme abgeben möchte, sollten wir diese Information 
      // durch den Split-Vote-Prozess beibehalten
      let userRequestedVotes = 1; // Standardmäßig 1 Stimme

      // Bei getAllAvailableVotes wird der Wert vom Server oder adjustedVotesToUse übernommen
      if (pollFormData.useAllAvailableVotes) {
        userRequestedVotes = remainingVotes;
      } else if (votesToUse !== null && votesToUse > 0) {
        // Die explizit vom Benutzer angeforderte Stimmenzahl
        userRequestedVotes = votesToUse;
      }

      // Speichere die vom Benutzer gewünschte Stimmenzahl für diesen Durchgang
      // KRITISCH: Dieser Wert wird später verwendet, um die Anzahl der zu verarbeitenden Stimmen zu begrenzen
      if (window) {
        window._lastRequestedVoteCount = userRequestedVotes;
        console.warn(`[DEBUG:VOTING] Benutzeranfrage gespeichert: ${userRequestedVotes} Stimmen`);
      }

      console.warn(`[DEBUG:VOTING] Reload-Status: ${isReload ? 'Reload erkannt' : 'Keine Reload'} (serverVoteCycle=${serverVoteCycle}, usedVotesCount=${usedVotesCount.value}, userRequestedVotes=${userRequestedVotes})`);

      // Erste Stimme sofort abgeben für schnelles Feedback - wir tun dies auch bei Reload,
      // um sicherzustellen, dass wir immer mindestens eine Stimme zählen
      if (adjustedVotesToUse > 0) {
        // Bei jeder Abstimmung: erste Stimme sofort abgeben für schnelles Feedback
        const firstResult = await submitSingleVote(pollFormData, poll, false);

        if (firstResult) {
          localSuccessCount++;
          // UI-Update für erste Stimme
          currentlySubmittedInBatch.value = 1;
          console.warn(`[DEBUG:VOTING] Erste Stimme abgegeben, localSuccessCount=${localSuccessCount}`);
        } else {
          // Prüfen, ob dies ein normales Verhalten bei einem Poll-Wechsel ist
          if (typeof window !== 'undefined' && (window.pollClosedEventReceived === true || window._newPollActive === true)) {
            console.warn(`[DEBUG:VOTING] Erste Stimme nicht abgegeben - Poll wurde geschlossen oder gewechselt. Normal.`);
          } else {
            console.warn(`[DEBUG:VOTING] Erste Stimme konnte nicht abgegeben werden. Verarbeitung wird beendet.`);
          }
          // Wenn die erste Stimme fehlschlägt, brechen wir ab
          return false;
        }
      } else {
        // Wenn keine Stimmen mehr abzugeben sind
        console.warn(`[DEBUG:VOTING] Keine Stimmen mehr verfügbar (adjustedVotesToUse=${adjustedVotesToUse})`);
        currentlySubmittedInBatch.value = 0;
      }

      // Verbleibende Stimmen berechnen unter Berücksichtigung der bereits abgegebenen ersten Stimme
      // Bei Reload und Nicht-Reload müssen wir jeweils eine Stimme abziehen, da wir sie oben bereits verarbeitet haben
      const votesStillToProcess = adjustedVotesToUse - 1;
      console.warn(`[DEBUG:VOTING] Verbleibende zu verarbeitende Stimmen: ${votesStillToProcess} (adjustedVotesToUse=${adjustedVotesToUse}, isReload=${isReload})`);

      // Restliche Stimmen in Batches verarbeiten
      if (votesStillToProcess > 0) {
        // OPTIMIERUNG FÜR LAST-TESTS:
        // Kleinere Batch-Größe und adaptive Pausen
        const BATCH_SIZE = 500; // Erhöht für bessere Performance gemäß LOAD_TEST_PERFORMANCE_OPTIMIZATIONS.md

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

        // Die verbleibenden zu verarbeitenden Stimmen wurden bereits oben berechnet
        // Wir verwenden votesStillToProcess als Basis für beide Fälle (Reload und Normal)
        remainingVotesToProcess = votesStillToProcess;

        // Prüfen, ob wir tatsächlich noch Stimmen übrig haben
        if (remainingVotesToProcess <= 0) {
          console.warn(`[DEBUG:VOTING] Keine verbleibenden Stimmen zum Verarbeiten (remainingVotesToProcess=${remainingVotesToProcess})`);
          return true;  // Erfolgreich beenden, keine weiteren Stimmen zu verarbeiten
        }

        // Berechne, wie viele Stimmen wirklich noch übrig sind 
        // (Gesamtzahl - bereits verwendete Stimmen)
        const trueRemainingVotes = Math.max(0, maxAllowedVotes - usedVotesCount.value);

        // Begrenze die verbleibenden zu verarbeitenden Stimmen auf die tatsächlich vorhandenen
        remainingVotesToProcess = Math.min(remainingVotesToProcess, trueRemainingVotes);

        // Zuerst die vom Benutzer angeforderte Stimmenzahl ermitteln
        // Window-Objekt sollte _lastRequestedVoteCount enthalten, wenn wir es gesetzt haben
        let userRequestedVoteCount = 1; // Default: 1 Stimme
        if (window && window._lastRequestedVoteCount && window._lastRequestedVoteCount > 0) {
          userRequestedVoteCount = window._lastRequestedVoteCount;
          console.warn(`[DEBUG:VOTING] Benutzeranfrage gefunden: ${userRequestedVoteCount} Stimmen`);
        }

        // Log zur Überprüfung der Zahlen
        console.warn(`[DEBUG:VOTING] Stimmen-Berechnung: votesStillToProcess=${votesStillToProcess}, max=${maxAllowedVotes}, used=${usedVotesCount.value}, trueRemaining=${trueRemainingVotes}, userRequested=${userRequestedVoteCount}, finalToProcess=${remainingVotesToProcess}`);

        // MEGA-WICHTIGE KORREKTURBERECHNUNG: limitiere die Anzahl der zu verarbeitenden Stimmen
        // auf die gespeicherte Stimmenzahl, falls vorhanden
        // Eventobj wurde bereits vorher deklariert, also benutzen wir es hier wieder
        if (pollId && eventObj && eventObj.id) {
          const maxStored = pollStatePersistence.getMaxVotesToUse(pollId, eventObj.id);

          if (maxStored !== null && maxStored > 0) {
            // KORREKTUR: Die Anzahl der zu verarbeitenden Stimmen sollte das gespeicherte Limit nicht überschreiten

            // Bei einem Reload bzw. wenn wir einen Seitenwechsel haben, ist die Logik anders!
            if (isReload) {
              // KRITISCH: Bei einem Reload begrenzen wir auf die vom Benutzer angeforderte Anzahl
              // Wenn eine Benutzeranfrage existiert, hat diese höchste Priorität!
              if (window && window._lastRequestedVoteCount && window._lastRequestedVoteCount > 0) {
                // Benutzeranfrage respektieren, aber auf verfügbare Stimmen begrenzen
                const requestedVotes = Math.min(window._lastRequestedVoteCount, trueRemainingVotes);
                console.warn(`[DEBUG:VOTING] RELOAD: Respektiere Benutzeranfrage: ${requestedVotes} Stimmen`);
                remainingVotesToProcess = requestedVotes;
              }
              // Wenn keine explizite Benutzeranfrage, dann auf gespeicherte Anzahl begrenzen
              else if (remainingVotesToProcess > maxStored) {
                remainingVotesToProcess = maxStored;
              }
            } else {
              // Bei erster Abstimmung minus 1, weil die erste Stimme bereits oben verarbeitet wurde
              // KRITISCH: Benutzeranfrage hat höchste Priorität!
              if (window && window._lastRequestedVoteCount && window._lastRequestedVoteCount > 0) {
                // Bei Benutzeranfrage muss 1 abgezogen werden, da die erste Stimme bereits verarbeitet wurde
                const requestedVotes = Math.min(window._lastRequestedVoteCount - 1, trueRemainingVotes);
                console.warn(`[DEBUG:VOTING] Respektiere Benutzeranfrage: ${requestedVotes + 1} Stimmen (minus 1 bereits verarbeitet)`);
                remainingVotesToProcess = requestedVotes;
              }
              // Sonst auf gespeicherte Anzahl minus 1 begrenzen (erste Stimme bereits verarbeitet)
              else if (remainingVotesToProcess > (maxStored - 1)) {
                remainingVotesToProcess = maxStored - 1;
              }
            }
          }
        } else {
          console.warn(`[DEBUG:VOTING] Konnte gespeichertes Limit nicht abrufen: Poll=${pollId}, Event=${JSON.stringify(eventObj)}`);

          // KRITISCH: Selbst ohne persistenten Speicher die Benutzeranfrage respektieren!
          if (window && window._lastRequestedVoteCount && window._lastRequestedVoteCount > 0) {
            if (isReload) {
              // Bei Reload: volle Anzahl verwenden
              const requestedVotes = Math.min(window._lastRequestedVoteCount, trueRemainingVotes);
              console.warn(`[DEBUG:VOTING] FALLBACK+RELOAD: Respektiere Benutzeranfrage: ${requestedVotes} Stimmen`);
              remainingVotesToProcess = requestedVotes;
            } else {
              // Bei Erstabstimmung: -1, da erste Stimme bereits verarbeitet
              const requestedVotes = Math.min(window._lastRequestedVoteCount - 1, trueRemainingVotes);
              console.warn(`[DEBUG:VOTING] FALLBACK: Respektiere Benutzeranfrage: ${requestedVotes + 1} Stimmen (minus 1 bereits verarbeitet)`);
              remainingVotesToProcess = requestedVotes;
            }
          }
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

          // KRITISCH: Prüfe, ob Poll global als geschlossen markiert wurde
          if (typeof window !== 'undefined' && window.pollClosedEventReceived === true) {
            console.warn("[DEBUG:VOTING] Poll wurde global als geschlossen markiert während der Batch-Verarbeitung. Abbruch!");

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

          // KRITISCH: Stellen sicher, dass die tatsächlich verbleibenden Stimmen nicht überschritten werden
          // Prüfe, ob die aktuell verarbeiteten + bereits gezählten Stimmen das Limit überschreiten würden
          const remainingAllowed = Math.max(0, maxAllowedVotes - (usedVotesCount.value + localSuccessCount));
          const safeCurrentBatchSize = Math.min(currentBatchSize, remainingAllowed);

          // Warnung ausgeben, wenn wir begrenzen mussten
          if (safeCurrentBatchSize < currentBatchSize) {
            console.warn(`[DEBUG:VOTING] Begrenze Batch-Größe auf ${safeCurrentBatchSize} (statt ${currentBatchSize}) wegen verbleibender Stimmen`);
          }

          for (let i = 0; i < safeCurrentBatchSize; i++) {
            batchPromises.push(submitSingleVote(pollFormData, poll, false));
          }

          // Verarbeite den aktuellen Batch parallel
          let success = false;
          let attempts = 0;
          const MAX_ATTEMPTS = 3;

          while (!success && attempts < MAX_ATTEMPTS) {
            try {
              // KRITISCH: Prüfe nochmal VOR dem Promise.all, ob der Poll geschlossen wurde
              if (poll.value && poll.value.closed) {
                console.warn("[DEBUG:VOTING] Poll wurde bei Promise.all geschlossen. Verarbeitung wird abgebrochen.");
                return false;
              }

              // KRITISCH: Prüfe, ob Poll global als geschlossen markiert wurde
              if (typeof window !== 'undefined' && window.pollClosedEventReceived === true) {
                console.warn("[DEBUG:VOTING] Poll global als geschlossen markiert bei Promise.all. Abbruch!");
                return false;
              }

              // Jetzt erst den Batch verarbeiten
              const batchResults = await Promise.all(batchPromises);

              // KRITISCH: Prüfe NOCHMAL nach dem Promise.all, ob der Poll zwischenzeitlich geschlossen wurde
              if ((poll.value && poll.value.closed) ||
                (typeof window !== 'undefined' && window.pollClosedEventReceived === true)) {
                console.warn("[DEBUG:VOTING] Poll wurde während Promise.all geschlossen. Speichere erfolgreiche Stimmen.");

                // Statt die Stimmen zu verwerfen, zählen wir die erfolgreichen Stimmen
                const batchSuccessCount = batchResults.filter(result => result === true).length;

                if (batchSuccessCount > 0) {
                  // Wenn Stimmen erfolgreich waren, diese zum Gesamtergebnis hinzufügen
                  localSuccessCount += batchSuccessCount;
                  // UI-Update für Transparenz
                  currentlySubmittedInBatch.value = localSuccessCount + 1; // +1 für die erste bereits gezählte Stimme
                  console.warn(`[DEBUG:VOTING] ${batchSuccessCount} erfolgreiche Stimmen trotz Poll-Schließung gezählt.`);

                  // Window-Flag setzen für spezifische Benachrichtigung
                  if (typeof window !== 'undefined') {
                    window._pollClosedDuringVoting = true;
                    window._successfulVotesBeforeClose = localSuccessCount + 1; // +1 für erste Stimme
                  }
                }

                // Trotzdem abbrechen, aber mit den gezählten Stimmen
                return true; // Wir geben true zurück, damit die Stimmen gezählt werden
              }

              const batchSuccessCount = batchResults.filter(result => result === true).length;
              localSuccessCount += batchSuccessCount;

              // UI nach jedem Batch aktualisieren
              currentlySubmittedInBatch.value = localSuccessCount + 1; // +1 für die erste bereits gezählte Stimme

              success = true;
              retryCount = 0; // Reset retry counter on success
            } catch (error) {
              // KRITISCH: Auch bei Fehlern prüfen, ob der Poll inzwischen geschlossen wurde
              if (poll.value && poll.value.closed) {
                console.warn("[DEBUG:VOTING] Poll wurde während eines Fehlers geschlossen. Speichere bisherige erfolgreiche Stimmen.");

                // Auch bei Fehler die bisher erfolgreichen Stimmen behalten
                if (localSuccessCount > 0) {
                  // Window-Flag setzen für spezifische Benachrichtigung
                  if (typeof window !== 'undefined') {
                    window._pollClosedDuringVoting = true;
                    window._successfulVotesBeforeClose = localSuccessCount + 1; // +1 für erste Stimme
                  }
                }

                return true; // Wir geben true zurück, damit die erfolgreichen Stimmen gezählt werden
              }

              // KRITISCH: Prüfe, ob Poll global als geschlossen markiert wurde
              if (typeof window !== 'undefined' && window.pollClosedEventReceived === true) {
                console.warn("[DEBUG:VOTING] Poll global als geschlossen markiert während eines Fehlers. Speichere bisherige Stimmen.");

                // Auch bei globaler Poll-Schließung die bisher erfolgreichen Stimmen behalten
                if (localSuccessCount > 0) {
                  // Window-Flag setzen für spezifische Benachrichtigung
                  if (typeof window !== 'undefined') {
                    window._pollClosedDuringVoting = true;
                    window._successfulVotesBeforeClose = localSuccessCount + 1; // +1 für erste Stimme
                  }
                }

                return true; // Wir geben true zurück, damit die erfolgreichen Stimmen gezählt werden
              }

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

          // Dynamische Pause zwischen den Batches - basierend auf mehreren Faktoren
          // Pause wird dynamisch an Last, Fortschritt und Systemkapazität angepasst
          if (batchStart + BATCH_SIZE < remainingVotesToProcess) {
            // 1. Faktor: Fortschritt der Abstimmung (progressiver Faktor)
            const progressFactor = batchStart / remainingVotesToProcess;

            // 2. Faktor: Größe des verbleibenden Batches (lastsensitiver Faktor)
            // Bei vielen verbleibenden Stimmen längere Pausen für bessere Verteilung
            const remainingFactor = Math.min(1, (remainingVotesToProcess - batchStart) / 1000);

            // 3. Faktor: Systemlast abschätzen (basierend auf Erfolg des letzten Batches)
            // Wenn der letzte Batch schnell durchlief, können wir kürzere Pausen einlegen
            const systemLoadFactor = retryCount > 0 ? 1.5 : 1;

            // Niedrigere Basis-Verzögerung für allgemein bessere Performance
            const baseDelay = 30;

            // Kombinierte adaptive Verzögerung (alle Faktoren multipliziert)
            const adaptiveComponent = Math.min(progressFactor * remainingFactor * 250, 120);
            const adaptiveDelay = baseDelay + (adaptiveComponent * systemLoadFactor);

            // Stochastische Komponente zur Vermeidung von Request-Clustering
            // Dies verteilt die Anfragen zufällig im Zeitfenster
            const jitterPercentage = 0.3; // 30% Schwankung
            const jitterRange = adaptiveDelay * jitterPercentage;
            const jitter = (Math.random() * jitterRange) - (jitterRange / 2);

            // Endgültige Pause-Zeit berechnen und anwenden
            const pauseTime = Math.max(10, Math.round(adaptiveDelay + jitter));
            console.warn(`[DEBUG:VOTING] Adaptive Pause zwischen Batches: ${pauseTime}ms (Basis=${baseDelay}, Adaptiv=${adaptiveComponent}, Last=${systemLoadFactor})`);
            await new Promise(resolve => setTimeout(resolve, pauseTime));
          }
        }
      }

      // Finales UI-Update
      currentlySubmittedInBatch.value = localSuccessCount;

      // KRITISCH: Bei großen Batches explizit isSubmitting zurücksetzen
      // Dies verhindert, dass große Batches die UI-Entsperrung verhindern
      // Insbesondere wichtig bei Split-Voting von vielen Stimmen
      if (localSuccessCount > 500) {
        console.warn(`[DEBUG:VOTING] Explizite Freigabe nach großem Batch von ${localSuccessCount} Stimmen`);
        
        // Sofort alle UI-Sperren freigeben
        isProcessingVotes.value = false;
        pollFormSubmitting.value = false;
        currentlyProcessingBatch.value = false;
        
        // Auch globale Flags zurücksetzen
        if (typeof window !== 'undefined') {
          window._pollFormSubmitting = false;
          window._isProcessingVotes = false;
          window._currentlyProcessingBatch = false;
          
          // Event für UI-Entsperrung auslösen
          try {
            window.dispatchEvent(new CustomEvent('voting:complete', {
              detail: { timestamp: Date.now(), usedVotes: usedVotesCount.value }
            }));
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:complete Events:', e);
          }
        }
      }

      // Nach einem Reload muss der Zähler korrekt addiert werden
      // VEREINFACHTE UND VERBESSERTE COUNTER-LOGIK: Gemeinsame Verarbeitung für normale und Reload-Fälle
      if (localSuccessCount > 0) {
        // Log für Diagnose
        if (isReload) {
          console.warn(`[DEBUG:VOTING] Bei Reload: usedVotesCount war vor Abstimmung ${usedVotesCount.value}`);
          console.warn(`[DEBUG:VOTING] Bei Reload: Verarbeite ${localSuccessCount} neue Stimmen für diesen Batch`);
        }

        // Signal an UI senden, dass Stimmen erfolgreich abgegeben wurden
        // Dies hilft PollModal, den Fortschritt anzuzeigen
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('voting:progress', {
              detail: { count: localSuccessCount, total: usedVotesCount.value }
            }));
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Feuern des voting:progress Events:', e);
          }
        }

        // SICHERHEITSPRÜFUNG: Bei Reload nur tatsächlich abgegebene Stimmen zum Zähler hinzufügen
        const totalAllowedVotes = eventUser.value.voteAmount;

        // Bei Reload ist serverVoteCycle die primäre Wahrheitsquelle
        if (isReload && serverVoteCycle > 0) {
          // Statt einfach zu addieren, nehmen wir das Maximum aus serverVoteCycle und usedVotesCount
          // Dadurch stellen wir sicher, dass wir bei Reloads keinen Zählerstand verlieren
          const newCount = Math.max(serverVoteCycle, usedVotesCount.value);

          // Dann fügen wir die neuen erfolgreichen Stimmen hinzu
          const potentialNewTotal = newCount + localSuccessCount;

          // Prüfen, ob wir das Maximum überschreiten würden
          if (potentialNewTotal > totalAllowedVotes) {
            const allowedAddition = Math.max(0, totalAllowedVotes - newCount);
            console.warn(`[DEBUG:VOTING] Reload-Fall: Begrenze Stimmenaddition auf ${allowedAddition} (statt ${localSuccessCount})`);
            usedVotesCount.value = newCount + allowedAddition;
          } else {
            usedVotesCount.value = potentialNewTotal;
          }
        } else {
          // Standard-Fall (keine Reload-Situation)
          const potentialNewTotal = usedVotesCount.value + localSuccessCount;

          // Prüfen, ob wir mehr hinzufügen als wir dürfen
          if (potentialNewTotal > totalAllowedVotes) {
            // Wenn wir über das Maximum gehen würden, nur die wirklich verbleibenden Stimmen hinzufügen
            const allowedAddition = Math.max(0, totalAllowedVotes - usedVotesCount.value);
            console.warn(`[DEBUG:VOTING] Begrenze Stimmenaddition auf ${allowedAddition} (statt ${localSuccessCount})`);
            usedVotesCount.value += allowedAddition;
          } else {
            // Sonst normal addieren
            usedVotesCount.value += localSuccessCount;
          }
        }

        console.warn(`[DEBUG:VOTING] usedVotesCount nach Aktualisierung: ${usedVotesCount.value}/${totalAllowedVotes}`);
      } else {
        console.warn(`[DEBUG:VOTING] Keine neuen Stimmen in diesem Batch (localSuccessCount = 0)`);
      }

      // Nachdem die Schleife beendet ist, betrachten wir den Batch als abgeschlossen

      // WICHTIG: Nach der Schleife ALLE Flags zurücksetzen, um die UI sofort freizugeben
      // Dies ist besonders wichtig für Split-Vote-Szenarios, wo der Benutzer mehrere
      // separate Stimmabgaben durchführen möchte

      // GEÄNDERT: Jetzt setzen wir ALLE Flags zurück, nicht nur das Batch-Flag
      currentlyProcessingBatch.value = false;
      isProcessingVotes.value = false;
      pollFormSubmitting.value = false;

      // Flag in übergeordneten Komponenten zurücksetzen
      if (typeof window !== 'undefined') {
        window._pollFormSubmitting = false;
        window._isProcessingVotes = false;
        window._currentlyProcessingBatch = false;

        // NEUER MECHANISMUS: Ein globales Event auslösen, wenn die Stimmabgabe abgeschlossen ist
        // Dies wird von PollModal.vue abgefangen, um das isSubmitting-Flag sofort zurückzusetzen
        try {
          window.dispatchEvent(new CustomEvent('voting:complete', {
            detail: { timestamp: Date.now(), usedVotes: usedVotesCount.value }
          }));
        } catch (e) {
          console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:complete Events:', e);
        }
      }

      // Die Session wird sofort deaktiviert, da handleFormSubmit abgeschlossen ist
      // UI-Sperren werden nun SOFORT freigegeben
      deactivateVotingSession();

      console.log("[DEBUG:VOTING] ALLE UI-Sperren wurden zurückgesetzt nach erfolgreicher Stimmabgabe");

      // NEUE PRÜFUNG: Setze votingFullyCompleted wenn alle Stimmen verbraucht sind
      const totalAllowedVotes = eventUser.value.voteAmount;
      if (usedVotesCount.value >= totalAllowedVotes) {
        votingFullyCompleted.value = true;

        // Extra Prüfung: Bei einem Reload oder Split-Vote stellen wir sicher, dass wir nicht mehr Stimmen
        // abgeben als verfügbar, indem wir den Zähler auf das Maximum begrenzen
        if (usedVotesCount.value > totalAllowedVotes) {
          console.warn(`[DEBUG:VOTING] Stimmenzähler korrigiert: ${usedVotesCount.value} auf ${totalAllowedVotes}`);
          usedVotesCount.value = totalAllowedVotes;
        }
      } else {
        // Wenn noch Stimmen übrig sind, stellen wir sicher, dass wir nicht im "vollständig abgestimmt"-Zustand sind
        // Dies ist wichtig für Split-Vote-Szenarien, damit weitere Stimmabgaben möglich sind
        votingFullyCompleted.value = false;

        // SICHERHEITSPRÜFUNG: Stelle sicher, dass usedVotesCount nicht über das erlaubte Maximum hinausgeht
        // Dies könnte durch Timing-Probleme bei parallelen Requests passieren
        if (usedVotesCount.value > totalAllowedVotes) {
          console.warn(`[DEBUG:VOTING] Zusätzliche Korrektur: usedVotesCount begrenzt von ${usedVotesCount.value} auf ${totalAllowedVotes}`);
          usedVotesCount.value = totalAllowedVotes;
          votingFullyCompleted.value = true;
        }

        // Zusätzlich sicherstellen, dass alle Flags für eine neue Abstimmung bereit sind
        if (currentlyProcessingBatch.value) {
          currentlyProcessingBatch.value = false;
        }
      }

      // Sofortige UI-Freigabe GARANTIEREN
      pollFormSubmitting.value = false;
      isProcessingVotes.value = false;
      currentlyProcessingBatch.value = false;

      // Auch globale Flags zurücksetzen
      if (typeof window !== 'undefined') {
        window._pollFormSubmitting = false;
        window._isProcessingVotes = false;
        window._currentlyProcessingBatch = false;
      }

      // Aktiv die UI entsperren für Benutzer, die Split-Voting machen wollen
      // Nur wenn noch Stimmen übrig sind und wir nicht im "fully completed" Zustand sind
      if (usedVotesCount.value < eventUser.value.voteAmount && !votingFullyCompleted.value) {
        console.log("[DEBUG:VOTING] Noch Stimmen übrig für Split-Voting, alle UI-Sperren garantiert freigegeben");
      }

      // Aggressiveres Sicherheitsnetz: Schnellerer Timeout und mehrere Versuche
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          // Unbedingt noch einmal alle UI-Flags freigeben, falls sie zwischenzeitlich gesetzt wurden
          if (pollFormSubmitting.value || isProcessingVotes.value || currentlyProcessingBatch.value) {
            // UI-Flags notfalls erneut zurücksetzen
            console.log(`[DEBUG:VOTING] UI-Flags zurücksetzen (Versuch ${i}/5)`);
            pollFormSubmitting.value = false;
            isProcessingVotes.value = false;
            currentlyProcessingBatch.value = false;

            // Auch globale Flags zurücksetzen
            if (typeof window !== 'undefined') {
              window._pollFormSubmitting = false;
              window._isProcessingVotes = false;
              window._currentlyProcessingBatch = false;
            }
          }
        }, 1000 * i); // Staffeln: 1s, 2s, 3s, 4s, 5s
      }

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

          // SICHERHEITSPRÜFUNG: Stelle sicher, dass wir nicht mehr Zählen als erlaubt sind
          const maxAllowedVotes = eventUser.value.voteAmount || 0;
          const limitedCounter = Math.min(newCounter, maxAllowedVotes);

          // Verwende den höheren Wert, um sicherzustellen, dass wir niemals einen kleineren Zähler haben
          // Aber begrenze auf maximal erlaubte Stimmen
          if (storedCounter > limitedCounter) {
            voteCounter.value = Math.min(storedCounter, maxAllowedVotes);
          } else {
            voteCounter.value = limitedCounter;
          }
        } else {
          // Auch ohne event.value.id die Begrenzung anwenden
          const maxAllowedVotes = eventUser.value.voteAmount || 0;
          voteCounter.value = Math.min(usedVotesCount.value + 1, maxAllowedVotes);
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

      // Stelle sicher, dass wir nicht in einem inkonsistenten Zustand stecken bleiben
      // Indem wir explizit alle Flags zurücksetzen
      pollFormSubmitting.value = false;
      currentlyProcessingBatch.value = false;
      isProcessingVotes.value = false;

      // Im Fall eines Fehlers setzen wir sofort auch alle UI-Sperren zurück
      try {
        if (typeof window !== 'undefined') {
          // Globale Flags für UI-Sperren zurücksetzen
          window._pollFormSubmitting = false;
          window._isProcessingVotes = false;
          window._currentlyProcessingBatch = false;

          // KRITISCH: Event auslösen, damit PollModal.vue den isSubmitting-Zustand zurücksetzen kann
          try {
            // Prüfen, ob in den letzten 50ms bereits ein Event ausgelöst wurde
            const now = Date.now();
            const minTimeBetweenEvents = 50; // ms

            if (!window._lastVotingErrorTimestamp || (now - window._lastVotingErrorTimestamp) > minTimeBetweenEvents) {
              // Event-Timestamp aktualisieren
              window._lastVotingErrorTimestamp = now;

              // Eindeutige ID für das Event
              const uniqueId = `error-${now}-${Math.random().toString(36).substring(2, 9)}`;

              // Event auslösen
              window.dispatchEvent(new CustomEvent('voting:error', {
                detail: { timestamp: now, error: 'Error during vote processing', id: uniqueId, source: 'errorHandler' }
              }));
            }
          } catch (eventError) {
            console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:error Events:', eventError);
          }

          // Prüfen, ob es globale Funktionen zum Entsperren gibt
          if (typeof window.releaseUILocks === 'function') {
            window.releaseUILocks();
          }
        }
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Zurücksetzen der UI-Sperren:', e);
      }

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

      // Setze globales Flag, um weitere Vote-Verarbeitung zu blockieren
      if (typeof window !== 'undefined') {
        window.pollClosedEventReceived = true;
        
        // Track last poll:closed event dispatched per poll ID
        if (!window._lastPollClosedEvents) {
          window._lastPollClosedEvents = new Map();
        }
        
        const pollId = poll.value?.id;
        const currentTime = Date.now();
        const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds
        
        // Check if we've dispatched an event for this poll recently
        const lastEventTime = window._lastPollClosedEvents.get(pollId);
        
        // Only dispatch if we haven't sent one recently
        if (!lastEventTime || (currentTime - lastEventTime > DEDUPLICATION_WINDOW_MS)) {
          // Event auslösen, dass die Poll geschlossen wurde
          try {
            window.dispatchEvent(new CustomEvent('poll:closed', {
              detail: { 
                pollId: pollId,
                timestamp: currentTime,
                source: 'submitSingleVote'
              }
            }));
            
            // Record this event dispatch
            window._lastPollClosedEvents.set(pollId, currentTime);
            
            // Clean up old entries
            window._lastPollClosedEvents.forEach((time, id) => {
              if (currentTime - time > 60000) { // 1 minute
                window._lastPollClosedEvents.delete(id);
              }
            });
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Auslösen des poll:closed-Events:', e);
          }
        } else {
          console.log('[DEBUG:VOTING] Ignoriere doppeltes poll:closed Event von submitSingleVote');
        }
      }

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

    // KRITISCHER FIX: Prüfe ob pollFormData überhaupt gültige Poll-Daten enthält
    // Dies verhindert das Problem mit ungültigen Antwort-IDs bei Poll-Wechseln
    if (!pollFormData) {
      console.error("[ERROR:VOTING] Keine Formular-Daten vorhanden für Stimmabgabe!");
      return false;
    }

    // RACE-CONDITION-FIX: Prüfe, ob die poll.value.id mit der aktuellen Poll-ID übereinstimmt
    // Dies verhindert, dass alte Stimmen für eine neue Poll abgegeben werden
    if (currentPollId.value && poll.value && poll.value.id && currentPollId.value !== poll.value.id) {
      console.error(`[ERROR:VOTING] Poll-ID-Mismatch! Aktuelle Poll: ${currentPollId.value}, Versuchte Stimmabgabe für: ${poll.value.id}`);
      return false;
    }

    // MEGA-KRITISCH: Prüfe, ob eine globale aktive Poll-ID gesetzt ist, die von neuen Polls überschrieben wurde
    // VERBESSERTE LOGIK: Nur prüfen, wenn die globale ID nicht null ist, um fehlerhafte Mismatch-Erkennungen zu vermeiden
    if (typeof window !== 'undefined' && window._currentActivePollId !== null && window._currentActivePollId !== undefined
      && poll.value && poll.value.id && window._currentActivePollId !== poll.value.id) {

      // Aktualisiere die globale ID, um zukünftige Missverständnisse zu vermeiden
      window._currentActivePollId = poll.value.id;

      // Aktive Session trotzdem deaktivieren und Flags zurücksetzen
      deactivateVotingSession();
      releaseUILocks();

      // Unauffällig beenden ohne Fehlermeldung
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

    // WICHTIG: Prüfe sowohl useAllVotes als auch pollFormData.useAllAvailableVotes
    // useAllVotes wird vom SyncEventDashboard gesetzt
    // pollFormData.useAllAvailableVotes wird vom Formular gesetzt
    if ((useAllVotes || pollFormData.useAllAvailableVotes) && remainingVotes > 1) {
      // Prüfen, ob wir eine einzelne Antwort haben (entweder abstain oder singleAnswer)
      let bulkInput;

      if (pollFormData.abstain) {
        bulkInput = {
          eventUserId: eventUser.value.id,
          pollId: poll.value?.id ?? 0,
          type: poll.value.type,
          answerContent: l18n.global.tc("view.polls.modal.abstain"),
          possibleAnswerId: null,
          voteCount: remainingVotes
        };

        return await submitBulkVote(bulkInput);
      }
      else if (pollFormData.singleAnswer && !pollFormData.multipleAnswers?.length) {
        // Sicherstellen, dass possibleAnswers existiert
        if (!poll.value || !poll.value.possibleAnswers || !Array.isArray(poll.value.possibleAnswers)) {
          console.error(`[ERROR:VOTING] possibleAnswers ist nicht verfügbar für Bulk Vote: ${JSON.stringify(poll.value)}`);
          return false;
        }

        // Antwort validieren
        const singleAnswerStr = String(pollFormData.singleAnswer);
        const answer = poll.value.possibleAnswers.find(
          (x) => x && x.id && (
            String(x.id) === singleAnswerStr ||
            (parseInt(x.id, 10) === parseInt(pollFormData.singleAnswer, 10))
          )
        );

        if (!answer) {
          console.error(`[ERROR:VOTING] Ungültige singleAnswer-ID für Bulk Vote: ${pollFormData.singleAnswer}`);
          return false;
        }

        bulkInput = {
          eventUserId: eventUser.value.id,
          pollId: poll.value?.id ?? 0,
          type: poll.value.type,
          answerContent: answer.content,
          possibleAnswerId: answer.id,
          voteCount: remainingVotes
        };

        return await submitBulkVote(bulkInput);
      }
      // Bei mehreren unterschiedlichen Antworten den normalen Voting-Prozess nutzen
    }

    // Für useAllVotes ohne Bulk-Optimierung: Wir senden die Anzahl der verbleibenden Stimmen statt des Zyklus
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

          // ALLE UI-Sperren zurücksetzen
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          return false;
        }

        // RACE-CONDITION-FIX: Prüfe erneut, ob eine neue Poll aktiviert wurde
        if (window._newPollActive === true) {
          console.error("[ERROR:VOTING] Neue Poll wurde aktiviert während multipleAnswers verarbeitet wurden!");

          // UI entsperren und alle aktiven Sessions deaktivieren
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          // Lokalen Speicher löschen
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          return false;
        }

        // PRÄ-VALIDIERUNG: Prüfe, ob alle ausgewählten Antwort-IDs gültig sind
        const invalidAnswerIds = [];
        for (const answerId of pollFormData.multipleAnswers) {
          // SICHERHEITSCHECK: Prüfe, ob answerId überhaupt ein gültiger Wert ist
          if (!answerId && answerId !== 0) {
            invalidAnswerIds.push("undefined");
            continue;
          }

          const answerExists = poll.value.possibleAnswers.some(
            (x) => x && x.id && parseInt(x.id) === parseInt(answerId)
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

          // ALLE UI-Sperren zurücksetzen bei ungültigen Antworten
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

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

          // ALLE UI-Sperren zurücksetzen
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          return false;
        }

        // RACE-CONDITION-FIX: Prüfe erneut, ob eine neue Poll aktiviert wurde
        if (window._newPollActive === true) {
          console.error("[ERROR:VOTING] Neue Poll wurde aktiviert während singleAnswer verarbeitet wurde!");

          // UI entsperren und alle aktiven Sessions deaktivieren
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          // Lokalen Speicher löschen
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          return false;
        }

        // SICHERHEITSCHECK: Prüfe, ob singleAnswer überhaupt ein gültiger Wert ist
        if (!pollFormData.singleAnswer && pollFormData.singleAnswer !== 0) {
          console.error(`[ERROR:VOTING] singleAnswer ist nicht definiert oder ungültig: ${pollFormData.singleAnswer}`);

          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          // ALLE UI-Sperren zurücksetzen
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          return false;
        }

        // PRÄ-VALIDIERUNG: Prüfe, ob die einzelne Antwort-ID gültig ist
        // Behandle singleAnswer sowohl als String als auch als Number korrekt
        const singleAnswerStr = String(pollFormData.singleAnswer);
        const answerExists = poll.value.possibleAnswers.some(
          (x) => x && x.id && (
            String(x.id) === singleAnswerStr ||
            (parseInt(x.id, 10) === parseInt(pollFormData.singleAnswer, 10))
          )
        );

        if (!answerExists) {
          console.error(`[ERROR:VOTING] Ungültige singleAnswer-ID: ${pollFormData.singleAnswer}. Aktuelle possibleAnswers:`, poll.value.possibleAnswers);

          // SICHERHEIT: Form-Daten löschen, da sie ungültig sind
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }

          // ALLE UI-Sperren zurücksetzen bei ungültigen Antworten
          releaseUILocks();
          deactivateVotingSession();
          currentlyProcessingBatch.value = false;

          return false;
        }

        // Jetzt können wir die Antwort sicher abrufen
        // Wir können singleAnswerStr wiederverwenden, das bereits oben deklariert wurde
        const answer = poll.value.possibleAnswers.find(
          (x) => String(x.id) === singleAnswerStr ||
            (parseInt(x.id, 10) === parseInt(pollFormData.singleAnswer, 10))
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

      // Bei Fehlern IMMER alle UI-Sperren freigeben
      releaseUILocks();

      // Aktive Session deaktivieren
      deactivateVotingSession();

      return false;
    }
  }

  /**
   * Verarbeitet Bulk-Vote-Anfragen (viele identische Stimmen auf einmal)
   * Diese Optimierung wird für den Fall verwendet, dass ein Benutzer alle Stimmen 
   * für die gleiche Antwort abgeben möchte.
   * 
   * @param {Object} input - Eingabedaten für die Bulk-Vote-Mutation
   * @returns {Promise<boolean>} - True wenn erfolgreich, sonst False
   */
  async function submitBulkVote(input) {
    try {
      // Defensive checks for input validation
      if (!input) {
        console.error(`[ERROR:VOTING] submitBulkVote: input is undefined`);
        return false;
      }
      
      // Starte Zeitmessung für Performance-Tracking
      const startTime = performance.now();
      
      // Apollo client is now provided at the module level, so we don't need to do it here

      // Führe die Bulk-Vote-Mutation aus
      const createBulkPollSubmitAnswerMutation = useMutation(
        CREATE_BULK_POLL_SUBMIT_ANSWER,
        {
          variables: { input },
          // Add errorPolicy to handle partial errors
          errorPolicy: 'all',
          // Use the Apollo client instance explicitly
          client: apolloClient
        },
      );
      
      // Check if mutation or mutate function is undefined
      if (!createBulkPollSubmitAnswerMutation) {
        console.error(`[ERROR:VOTING] createBulkPollSubmitAnswerMutation is undefined`);
        return false;
      }
      
      if (typeof createBulkPollSubmitAnswerMutation.mutate !== 'function') {
        console.error(`[ERROR:VOTING] createBulkPollSubmitAnswerMutation.mutate is not a function:`, 
                     createBulkPollSubmitAnswerMutation);
        return false;
      }

      try {
        // Track if warning has been shown to avoid duplicate messages
        let warningShown = false;
        
        // Add a less frequent warning for slow mutations but don't abort them
        const warningTimeoutId = setTimeout(() => {
          console.warn('[DEBUG:VOTING] Bulk mutation is taking longer than expected, but will continue waiting...');
          warningShown = true;
        }, 15000); // Longer initial wait (15 seconds) for bulk operations
        
        // Execute the mutation without a hard timeout
        const result = await createBulkPollSubmitAnswerMutation.mutate();
        
        // Clear the warning timeout
        clearTimeout(warningTimeoutId);
        
        // Log completion if a warning was shown
        if (warningShown) {
          console.log('[DEBUG:VOTING] Long-running bulk mutation completed successfully');
        }
        
        // Validate result to avoid undefined errors
        if (!result) {
          console.error(`[ERROR:VOTING] Bulk mutation result is undefined`);
          return false;
        }
        
        const successCount = result.data?.createBulkPollSubmitAnswer || 0;

        // Ende der Zeitmessung
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        if (successCount > 0) {
          // Zähler für die abgegebenen Stimmen aktualisieren
          // WICHTIGER FIX: Wir erhöhen den Zähler um die tatsächliche Anzahl der erfolgreichen Stimmen!
          // Nicht nur um 1 wie im alten Code!
          usedVotesCount.value += successCount;

          // Erhöhe auch voteCounter für konsistente Anzeige
          voteCounter.value += successCount;

          console.log(`CLIENT: BULK VOTE - usedVotesCount aktualisiert: ${usedVotesCount.value}`);
          console.log(`CLIENT: BULK VOTE - voteCounter aktualisiert: ${voteCounter.value}`);

          // Speichere den aktualisierten Status, damit er auch nach einem Page-Reload erhalten bleibt
          // WICHTIG: poll ist ein Parameter aus dem Kontext der aufrufenden Funktion
          // Wir müssen pollId aus input verwenden, da poll hier nicht direkt verfügbar ist
          if (input.pollId && eventUser && eventUser.value && eventUser.value.id) {
            pollStatePersistence.upsertPollState(
              input.pollId,
              voteCounter.value,
              usedVotesCount.value,
              eventUser.value.id
            );
            console.log(`CLIENT: BULK VOTE - Status persistiert: ${input.pollId}, ${voteCounter.value}, ${usedVotesCount.value}`);
          }

          // ALLE UI-Sperren sofort freigeben, um zu garantieren, dass das UI für Split-Voting nutzbar bleibt
          releaseUILocks();

          // WICHTIG: Globale Flags zurücksetzen, die PollModal oder andere Komponenten gesetzt haben könnten
          if (typeof window !== 'undefined') {
            window._pollFormSubmitting = false;
            window._isProcessingVotes = false;
            window._currentlyProcessingBatch = false;
          }

          console.log(`CLIENT: BULK VOTE - Alle UI-Sperren wurden freigegeben nach erfolgreicher Bulk-Abstimmung`);
        } else {
          console.warn(`CLIENT: BULK VOTE - Keine Stimmen erfolgreich verarbeitet`);

          // Auch bei 0 erfolgreichen Stimmen alle UI-Sperren freigeben
          releaseUILocks();
        }

        // Erfolgreich, wenn mindestens eine Stimme verarbeitet wurde
        return successCount > 0;
      } catch (mutationError) {
        console.error(`[ERROR:BULK_VOTE] GraphQL Fehler bei der Bulk-Mutation:`, mutationError);
        console.log(`[ERROR:BULK_VOTE] GraphQL Fehler Details:`,
          mutationError.graphQLErrors || 'Keine GraphQL-Fehlerdetails');
        
        // Log specific error details to help diagnose "oe is undefined" issue
        if (mutationError instanceof TypeError && mutationError.message.includes('oe is undefined')) {
          console.error(`[ERROR:BULK_VOTE] "oe is undefined" Fehler beim Ausführen der Bulk-Mutation:`, {
            errorName: mutationError.name,
            errorMessage: mutationError.message,
            stackTrace: mutationError.stack,
            input: JSON.stringify(input),
          });
        }
        
        // Release UI locks to prevent UI from being stuck
        if (typeof releaseUILocks === 'function') {
          releaseUILocks();
        }
        
        return false;
      }
    } catch (error) {
      console.error(`[ERROR:BULK_VOTE] Fehler bei der Bulk-Mutation für ${input?.voteCount || 'unknown'} Stimmen:`, error);
      console.log(`[ERROR:BULK_VOTE] Stack:`, error.stack || 'Kein Stack verfügbar');
      
      // Log specific error details to help diagnose "oe is undefined" issue
      if (error instanceof TypeError && error.message.includes('oe is undefined')) {
        console.error(`[ERROR:BULK_VOTE] "oe is undefined" Fehler beim Ausführen der Bulk-Mutation:`, {
          errorName: error.name,
          errorMessage: error.message,
          stackTrace: error.stack,
          input: JSON.stringify(input),
        });
      }
      
      // Release UI locks to prevent UI from being stuck
      if (typeof releaseUILocks === 'function') {
        releaseUILocks();
      }
      
      return false;
    }
  }

  function resetVoteCounts() {
    // VOLLSTÄNDIGER Reset aller Zähler und Status-Werte
    console.log("[DEBUG:VOTING] In resetVoteCounts - Vor Reset: usedVotesCount =", usedVotesCount.value, "voteCounter =", voteCounter.value);
    usedVotesCount.value = 0;
    voteCounter.value = 1;
    
    // Globale Werte ebenfalls aktualisieren
    if (typeof window !== 'undefined' && window.votingProcessModule) {
      window.votingProcessModule.usedVotesCount = 0;
      window.votingProcessModule.voteCounter = 1;
    }
    
    console.log("[DEBUG:VOTING] In resetVoteCounts - Nach Reset: usedVotesCount =", usedVotesCount.value, "voteCounter =", voteCounter.value);

    // Alte Poll-ID speichern, um lokale Daten zu löschen
    const oldPollId = currentPollId.value;

    // Poll-ID zurücksetzen
    currentPollId.value = null;

    // UI-Status zurücksetzen - KRITISCH: Diese Reihenfolge beibehalten für optimales Reset-Verhalten
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

    // KRITISCH: Nach einer kurzen Verzögerung nochmals alle UI-Sperren prüfen und garantiert aufheben
    // Dies verhindert das Problem mit dem "Stimme wird abgegeben" beim Öffnen eines neuen Polls
    setTimeout(() => {
      isProcessingVotes.value = false;
      pollFormSubmitting.value = false;
      currentlyProcessingBatch.value = false;

      // Explizit alle Flags auf false setzen, als zusätzliche Sicherheit
      if (typeof window !== 'undefined') {
        window._pollFormSubmitting = false;
        window._isProcessingVotes = false;
        window._currentlyProcessingBatch = false;
      }
    }, 50);
  }

  // Eine explizite Methode zum kontrollierten Freigeben der UI
  function releaseUILocks() {
    console.log("[DEBUG:VOTING] releaseUILocks aufgerufen - usedVotesCount =", usedVotesCount.value, "voteCounter =", voteCounter.value);
    // VERBESSERT: Explizite Freigabe ALLER UI-Sperren
    isProcessingVotes.value = false;
    pollFormSubmitting.value = false;
    currentlyProcessingBatch.value = false; // Wir setzen jetzt auch dieses Flag zurück

    // Auch globale Flags zurücksetzen (wichtig für modalbasierte UI-Lockouts)
    if (typeof window !== 'undefined') {
      window._pollFormSubmitting = false;
      window._isProcessingVotes = false;
      window._currentlyProcessingBatch = false;

      // KRITISCHES CLEANUP: Auch bei direktem releaseUILocks()-Aufruf Event auslösen
      // Dieser Mechanismus ist essentiell für die Koordination mit PollModal.vue
      try {
        window.dispatchEvent(new CustomEvent('voting:complete', {
          detail: { timestamp: Date.now(), usedVotes: usedVotesCount?.value || 0 }
        }));
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:complete Events bei releaseUILocks:', e);
      }

      // Versuche, eventuelle Bootstrap-Modal-Sperren zu entfernen
      try {
        // Backdrop-Elemente entfernen
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
          backdrops.forEach(backdrop => {
            if (backdrop && backdrop.parentNode) {
              backdrop.parentNode.removeChild(backdrop);
            }
          });

          // Body-Klassen zurücksetzen
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Entfernen von Modal-Elementen:', e);
      }
    }

    console.log("[DEBUG:VOTING] UI-Sperren vollständig freigegeben durch releaseUILocks()");
  }

  // Bei Änderungen an usedVotesCount immer auch das globale Modul aktualisieren
  watch(() => usedVotesCount.value, (newValue) => {
    if (typeof window !== 'undefined' && window.votingProcessModule) {
      window.votingProcessModule.usedVotesCount = newValue;
      console.log("[DEBUG:VOTING] Globales votingProcessModule aktualisiert: usedVotesCount =", newValue);
    }
  });
  
  // Bei Änderungen an voteCounter immer auch das globale Modul aktualisieren
  watch(() => voteCounter.value, (newValue) => {
    if (typeof window !== 'undefined' && window.votingProcessModule) {
      window.votingProcessModule.voteCounter = newValue;
      console.log("[DEBUG:VOTING] Globales votingProcessModule aktualisiert: voteCounter =", newValue);
    }
  });
  
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
    // Defensive checks for input validation
    if (!input) {
      console.error(`[ERROR:VOTING] mutateAnswer: input is undefined`);
      return false;
    }
    
    // Apollo client is now provided at the module level, so we don't need to do it here

    // Create mutation with better error handling
    const createPollSubmitAnswerMutation = useMutation(
      CREATE_POLL_SUBMIT_ANSWER,
      {
        variables: { input },
        // Add errorPolicy to handle partial errors
        errorPolicy: 'all',
        // Use the Apollo client instance explicitly
        client: apolloClient
      },
    );
    
    // Check if mutation or mutate function is undefined
    if (!createPollSubmitAnswerMutation) {
      console.error(`[ERROR:VOTING] createPollSubmitAnswerMutation is undefined`);
      return false;
    }
    
    if (typeof createPollSubmitAnswerMutation.mutate !== 'function') {
      console.error(`[ERROR:VOTING] createPollSubmitAnswerMutation.mutate is not a function:`, 
                    createPollSubmitAnswerMutation);
      return false;
    }
    
    // Execute mutation with better error handling but no hard timeout
    try {
      // Track if warning has been shown to avoid duplicate messages
      let warningShown = false;
      
      // Add a less frequent warning for slow mutations but don't abort them
      const warningTimeoutId = setTimeout(() => {
        console.warn('[DEBUG:VOTING] Mutation is taking longer than expected, but will continue waiting...');
        warningShown = true;
      }, 10000); // Longer initial wait (10 seconds) to reduce noise
      
      // Execute the mutation without a hard timeout
      const result = await createPollSubmitAnswerMutation.mutate();
      
      // Clear the warning timeout
      clearTimeout(warningTimeoutId);
      
      // Log completion if a warning was shown
      if (warningShown) {
        console.log('[DEBUG:VOTING] Long-running mutation completed successfully');
      }
      
      return true;
    } catch (mutationError) {
      console.error('[ERROR:VOTING] Inner mutation error:', mutationError);
      throw mutationError; // Re-throw to be handled by the outer catch
    }
  } catch (error) {
    // Detailed error logging
    console.error(`[ERROR:VOTING] Fehler bei der Mutation für Zyklus ${input?.voteCycle || 'unknown'}/${input?.answerItemCount || 'unknown'}:`, error);
    
    // Log specific error details to help diagnose "oe is undefined" issue
    if (error instanceof TypeError && error.message.includes('oe is undefined')) {
      console.error(`[ERROR:VOTING] "oe is undefined" Fehler beim Ausführen der Mutation:`, {
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        input: JSON.stringify(input),
      });
      
      // Try to immediately cleanup any potential memory issues
      if (typeof window.gc === 'function') {
        try {
          window.gc();
        } catch (e) {
          // Ignore errors if gc is not available
        }
      }
    }
    
    // Don't propagate error to avoid breaking the voting flow
    return false;
  }
}