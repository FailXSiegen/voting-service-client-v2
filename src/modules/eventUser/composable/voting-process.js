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
    if (newPollId !== currentPollId.value) {
      usedVotesCount.value = 0;
      voteCounter.value = 1;
      currentPollId.value = newPollId;
      votingFullyCompleted.value = false;

      // Bei neuer Abstimmung sicherstellen, dass alle alten Sessions deaktiviert sind
      deactivateVotingSession();
    }
  }

  async function handleFormSubmit(pollFormData, poll, votesToUse = null) {
    // Starte Formularverarbeitung

    // KRITISCH: Prüfen, ob bereits eine Abstimmung läuft
    if (isActiveVotingSession()) {
      // Es läuft bereits eine Abstimmung in dieser Browser-Session
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

    // Zu Beginn jeder neuen Form-Submission setzen wir den Zähler zurück
    // Dies stellt sicher, dass wir bei jeder Abstimmung von vorne anfangen
    voteCounter.value = 1;

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

      const maxAllowedVotes = eventUser.value.voteAmount;
      const remainingVotes = maxAllowedVotes - usedVotesCount.value;

      if (remainingVotes <= 0) {
        if (pollId) {
          pollStatePersistence.upsertPollState(pollId, 99999);
        }
        await onVotingCompleted.value();
        return false;
      }

      let actualVotesToUse = 1;

      if (pollFormData.useAllAvailableVotes) {
        actualVotesToUse = remainingVotes;
      } else if (votesToUse !== null && votesToUse > 0) {
        const requested = parseInt(votesToUse, 10);
        actualVotesToUse = Math.min(requested, remainingVotes);
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

      for (let i = 0; i < adjustedVotesToUse; i++) {
        const result = await submitSingleVote(pollFormData, poll, false);
        if (result) {
          // Erhöhe nur den lokalen Erfolgszähler für diesen Batch
          localSuccessCount++;
        }
      }

      // NACH der Schleife den Gesamtzähler ADDIEREN (nicht überschreiben!)
      // So können mehrere Batches nacheinander Stimmen abgeben
      usedVotesCount.value += localSuccessCount;

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
          pollStatePersistence.upsertPollState(pollId, 99999);
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
        voteCounter.value = usedVotesCount.value + 1;
        pollStatePersistence.upsertPollState(pollId, voteCounter.value);
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
    // Der Fortschritt wird jetzt relativ zum aktuellen Batch berechnet, nicht zum Gesamtzähler
    // Dadurch bleibt die Debug-Anzeige korrekt, auch bei mehreren Batches
    const batchSubmissionCount = currentlySubmittedInBatch.value + 1;
    const batchSize = expectedVoteCount.value;

    // Stimmenfortschritt verfolgen
    currentlySubmittedInBatch.value = batchSubmissionCount;

    const baseInput = {
      eventUserId: eventUser.value.id,
      pollId: poll.value?.id ?? 0,
      type: poll.value.type,
      voteCycle: usedVotesCount.value + 1, // Verwende den Gesamtzähler + 1 für den Server
      answerItemLength: 1,
      answerItemCount: 1,
      multivote: useAllVotes
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
          };
          await mutateAnswer(input);
          answerCounter++;
        }
      } else if (pollFormData.singleAnswer) {
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
    currentPollId.value = null;
    isProcessingVotes.value = false;
    pollFormSubmitting.value = false;
    currentlyProcessingBatch.value = false;
    expectedVoteCount.value = 1;
    lastBatchTimestamp.value = null;
    currentlySubmittedInBatch.value = 0; // Batch-Zähler zurücksetzen
    votingFullyCompleted.value = false;

    // Auch die aktive Session deaktivieren
    deactivateVotingSession();

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