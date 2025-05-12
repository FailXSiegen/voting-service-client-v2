<template>
  <ConnectionLostOverlay v-if="connectionLost" />
  <NotVerifiedWidget
    v-if="eventUser && !eventUser.verified"
    :event-user="eventUser"
  />
  <template v-if="eventUser && eventUser.verified">
    <DashboardStats
      v-if="event && eventUser && eventUser.verified"
      :event="event"
      :highlight-status-change="highlightStatusChange"
      :event-user="eventUser"
    />
    <JoinMeetingControl
      v-if="event && !meetingFrameIsActive && event.meeting"
      :event="event"
      @join-meeting="onJoinMeeting"
    />
    <MeetingContainer
      v-if="event && eventUser && meetingFrameIsActive && event.meeting"
      :event="event"
      :event-user="eventUser"
    />
    <PollStatus :exist-active-poll="existActivePoll" :poll-state="pollState" />
    <VotingDetailsWithSubscription
      v-if="poll?.type === 'PUBLIC' && existActivePoll && event.publicVoteVisible"
      :active-poll-event-user="activePollEventUser"
      :event-id="event.id"
    />
    <ResultListing
      v-if="event && pollResults?.length > 0"
      :event-record="event"
      :poll-results="pollResults"
    />
    <button
      v-if="showMoreEnabled && pollResults?.length > 0"
      class="btn btn-secondary my-3 mx-auto py-2 d-flex align-items-center d-print-none mb-3"
      @click="onShowMorePollResults"
    >
      <i class="me-3 bi bi-plus-square-fill bi--2xl" />
      {{ $t("view.results.showMore") }}
    </button>
    <AlertBox
      v-if="!showMoreEnabled"
      type="info"
      :message="$t('view.results.noMoreResults')"
    />
    <PollModal
      v-if="showVotingModal"
      ref="pollModal"
      :poll="poll"
      :event="event"
      :event-user="eventUser"
      :vote-counter="voteCounter"
      :active-poll-event-user="activePollEventUser"
      @submit="onSubmitPoll"
    />
    <ResultModal
      ref="resultModal"
      :poll-result="lastPollResult"
      :event="event"
    />
  </template>
</template>

<script setup>
import NotVerifiedWidget from "@/modules/eventUser/components/dashboard/NotVerifiedWidget.vue";
import ConnectionLostOverlay from "@/modules/eventUser/components/dashboard/ConnectionLostOverlay.vue";
import DashboardStats from "@/modules/eventUser/components/dashboard/DashboardStats.vue";
import JoinMeetingControl from "@/modules/eventUser/components/dashboard/meeting/JoinMeetingControl.vue";
import MeetingContainer from "@/modules/eventUser/components/dashboard/meeting/MeetingContainer.vue";
import PollStatus from "@/modules/eventUser/components/dashboard/poll/PollStatus.vue";
import VotingDetailsWithSubscription from "@/modules/eventUser/components/dashboard/poll/VotingDetailsWithSubscription.vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import PollModal from "@/modules/eventUser/components/dashboard/poll/modal/PollModal.vue";
import ResultModal from "@/modules/eventUser/components/dashboard/poll/modal/ResultModal.vue";
import { useCore } from "@/core/store/core";
import { computed, ref } from "vue";
import { useQuery, useSubscription } from "@vue/apollo-composable";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { ACTIVE_POLL_EVENT_USER } from "@/modules/organizer/graphql/queries/active-poll-event-user.js";
import { USER_VOTE_CYCLE } from "@/modules/eventUser/graphql/queries/user-vote-cycle";
import { toast } from "vue3-toastify";
import l18n from "@/l18n";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { POLL_LIFE_CYCLE_SUBSCRIPTION } from "@/modules/eventUser/graphql/subscription/poll-life-cycle";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";
import { POLL_ANSWER_LIVE_CYCLE } from "@/modules/organizer/graphql/subscription/poll-answer-life-cycle";

const coreStore = useCore();
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

// Data.

const eventUser = ref(coreStore.getEventUser);
const meetingFrameIsActive = ref(false);
const page = ref(0);
const pageSize = ref(3);
const showMoreEnabled = ref(true);
const pollState = ref("closed");
const poll = ref(null);
const pollModal = ref(null);
const resultModal = ref(null);
const pollResults = ref([]);
const lastPollResult = ref(null);
const highlightStatusChange = ref(false);
const pollStatePersistence = usePollStatePersistence();
const votingProcess = useVotingProcess(eventUser, props.event);
const voteCounter = votingProcess.voteCounter;
const activePollEventUser = ref(null);
const pollUserVotedCount = ref(0);

// Eine eindeutige ID, die nur innerhalb dieser Browser-Session existiert
// Wird verwendet, um eigene Events von fremden Events zu unterscheiden
const localBrowserSessionKey = ref(Date.now().toString() + "-" + Math.random().toString(36).substring(2, 15));
const currentPollSubmissionId = ref(null); // Speichert die ID der aktuellen Abstimmungssession
const showVotingModal = computed(() => {
  return eventUser.value?.voteAmount >= 1 && eventUser.value?.allowToVote;
});

votingProcess.setVotingCompletedCallback(() => {
  if (pollState.value !== "closed") {
    pollState.value = "voted";
  }
  pollModal.value.hideModal();
});
const existActivePoll = computed(
  () => poll.value !== null && pollState.value !== "closed",
);
const connectionLost = computed(
  () => !eventUser.value?.online || !eventUser.value?.id,
);

const activePollEventUserQuery = useQuery(
  ACTIVE_POLL_EVENT_USER,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
activePollEventUserQuery.onResult(({ data }) => {
  if (!data?.activePollEventUser) {
    return;
  }
  activePollEventUser.value = data.activePollEventUser;
  poll.value = data.activePollEventUser.poll;
  pollState.value = data.activePollEventUser.state;
  
  // KRITISCH: Prüfe, ob alle Stimmen bereits abgegeben wurden
  // In diesem Fall das Modal gar nicht erst öffnen!
  const totalAllowedVotes = eventUser.value?.voteAmount || 0;
  const usedVotes = votingProcess.usedVotesCount?.value || 0;
  
  if (totalAllowedVotes > 0 && usedVotes >= totalAllowedVotes) {
    
    // Setze den Status auf "abgestimmt", ohne das Modal zu öffnen
    pollState.value = "voted";
    return;
  }
  
  // Keine Abstimmung anzeigen, wenn gerade ein Abstimmungsprozess läuft
  if (votingProcess.isProcessingVotes.value === true || 
      votingProcess.pollFormSubmitting.value === true || 
      votingProcess.currentlyProcessingBatch.value === true || 
      currentPollSubmissionId.value !== null) {
    return;
  }
  
  if (
    pollStatePersistence.canVote(poll.value.id, eventUser.value, props.event)
  ) {
    // Server-seitigen Vote-Cycle für den Benutzer abrufen
    if (eventUser.value?.id && poll.value?.id) {
      const eventUserId = eventUser.value?.id?.toString();
      const pollId = poll.value?.id?.toString();
  
      
      if (!eventUserId || !pollId) {
        console.error('Ungültige Parameter für userVoteCycle:', { eventUserId, pollId });
        return;
      }
      
      const userVoteCycleQuery = useQuery(
        USER_VOTE_CYCLE,
        { 
          eventUserId,
          pollId
        },
        { 
          fetchPolicy: "network-only",
          errorPolicy: "all" // Explizit Fehler zurückgeben, um sie im Log zu sehen
        }
      );
      
      // Fehlerbehandlung
      userVoteCycleQuery.onError((error) => {
        console.error('GraphQL-Fehler bei userVoteCycle:', error);
      });
      
      userVoteCycleQuery.onResult(({ data }) => {
        if (data?.userVoteCycle) {
          // Server-seitigen Vote-Cycle als verlässlichere Quelle verwenden
          const serverVoteCycle = data.userVoteCycle.voteCycle || 0;
          const maxVotes = data.userVoteCycle.maxVotes || eventUser.value.voteAmount;
          
          // Die verwendeten Stimmen direkt übernehmen
          votingProcess.usedVotesCount.value = serverVoteCycle;
          
          // Stelle sicher, dass der Zähler korrekt initialisiert wird
          voteCounter.value = serverVoteCycle + 1;
          
          // Persistieren, damit future Loads konsistent sind
          pollStatePersistence.upsertPollState(poll.value.id, voteCounter.value, serverVoteCycle, props.event.id);
          
          // Prüfen, ob bereits alle Stimmen abgegeben wurden
          if (serverVoteCycle >= maxVotes) {
            pollState.value = "voted";
            return;
          }
          
          // Zurücksetzen aller Verarbeitungszustände vor dem Öffnen des Modals
          votingProcess.pollFormSubmitting.value = false;
          votingProcess.currentlyProcessingBatch.value = false;
          votingProcess.isProcessingVotes.value = false;
          currentPollSubmissionId.value = null;
          
          // Zähler für die Erkennung des Batch-Abschlusses zurücksetzen
          pollUserVotedCount.value = 0;
          
          // NOCHMAL prüfen, ob wirklich Stimmen übrig sind, bevor das Modal geöffnet wird
          if (voteCounter.value <= maxVotes) {
            // Kleine Verzögerung vor dem Öffnen des Modals, um sicherzustellen, 
            // dass alle zuvor gesetzten Zustände vollständig zurückgesetzt wurden
            setTimeout(() => {
              pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
              pollModal.value.showModal();
            }, 100);
          } else {
            pollState.value = "voted";
          }
        } else {
          // Fallback zum lokalen Storage, wenn der Server keine Daten zurückgibt
          // Stelle sicher, dass der Zähler korrekt initialisiert wird
          voteCounter.value = pollStatePersistence.restoreVoteCounter(poll.value.id, props.event.id);
          
          // Synchronisiere den verwendeten Stimmen-Zähler mit dem gespeicherten Zustand
          // Dies ist wichtig, um nach einem Reload den korrekten Stimmenzähler wiederherzustellen
          votingProcess.usedVotesCount.value = pollStatePersistence.getUsedVotes(poll.value.id, props.event.id);
          
          // Zurücksetzen aller Verarbeitungszustände vor dem Öffnen des Modals
          votingProcess.pollFormSubmitting.value = false;
          votingProcess.currentlyProcessingBatch.value = false;
          votingProcess.isProcessingVotes.value = false;
          currentPollSubmissionId.value = null;
          
          // Zähler für die Erkennung des Batch-Abschlusses zurücksetzen
          pollUserVotedCount.value = 0;
          
          // NOCHMAL prüfen, ob wirklich Stimmen übrig sind, bevor das Modal geöffnet wird
          if (voteCounter.value <= totalAllowedVotes) {
            // Kleine Verzögerung vor dem Öffnen des Modals, um sicherzustellen, 
            // dass alle zuvor gesetzten Zustände vollständig zurückgesetzt wurden
            setTimeout(() => {
              pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
              pollModal.value.showModal();
            }, 100);
          } else {
            pollState.value = "voted";
          }
        }
      });
    } else {
      // Fallback, wenn keine Poll- oder EventUser-ID verfügbar ist
      // Stelle sicher, dass der Zähler korrekt initialisiert wird
      voteCounter.value = pollStatePersistence.restoreVoteCounter(poll.value.id, props.event.id);
      
      // Synchronisiere den verwendeten Stimmen-Zähler mit dem gespeicherten Zustand
      // Dies ist wichtig, um nach einem Reload den korrekten Stimmenzähler wiederherzustellen
      votingProcess.usedVotesCount.value = pollStatePersistence.getUsedVotes(poll.value.id, props.event.id);
      
      // Zurücksetzen aller Verarbeitungszustände vor dem Öffnen des Modals
      votingProcess.pollFormSubmitting.value = false;
      votingProcess.currentlyProcessingBatch.value = false;
      votingProcess.isProcessingVotes.value = false;
      currentPollSubmissionId.value = null;
      
      // Zähler für die Erkennung des Batch-Abschlusses zurücksetzen
      pollUserVotedCount.value = 0;
      
      // NOCHMAL prüfen, ob wirklich Stimmen übrig sind, bevor das Modal geöffnet wird
      if (voteCounter.value <= totalAllowedVotes) {
        // WICHTIG: Stelle sicher, dass keine alten Formular-Daten für diese Poll existieren
        if (poll.value && poll.value.id) {
          localStorage.removeItem(`poll_form_data_${poll.value.id}`);
        }
        
        // Kleine Verzögerung vor dem Öffnen des Modals, um sicherzustellen, 
        // dass alle zuvor gesetzten Zustände vollständig zurückgesetzt wurden
        setTimeout(() => {
          // Vollständiges Zurücksetzen des Formulars erzwingen
          pollModal.value?.reset(false);
          
          // Sicherheitscheck: Nochmals prüfen, ob alte localStorage-Daten gelöscht wurden
          if (poll.value && poll.value.id) {
            localStorage.removeItem(`poll_form_data_${poll.value.id}`);
          }
          
          // Jetzt erst das Modal öffnen
          pollModal.value.showModal();
        }, 100);
      } else {
        pollState.value = "voted";
      }
    }
  }
});

// Fetch poll results.
const pollResultsQuery = useQuery(
  POLLS_RESULTS,
  { eventId: props.event.id, page, pageSize },
  { fetchPolicy: "cache-and-network" },
);

pollResultsQuery.onResult(({ data }) => {
  if (!data?.pollResult) return;

  if (page.value === 0 && data.pollResult.length < pageSize.value) {
    showMoreEnabled.value = false;
  }

  if (data.pollResult.length > 0) {
    pollResults.value = [
      ...pollResults.value.filter(
        (existing) =>
          !data.pollResult.some((newResult) => newResult.id === existing.id),
      ),
      ...data.pollResult,
    ].sort((a, b) => b.createDatetime - a.createDatetime);

    lastPollResult.value = pollResults.value[0];
  }
});

const updateEventUserAccessRightsSubscription = useSubscription(
  UPDATE_EVENT_USER_ACCESS_RIGHTS,
  { eventUserId: eventUser.value.id },
);
updateEventUserAccessRightsSubscription.onResult(({ data }) => {
  if (data.updateEventUserAccessRights) {
    const { verified, voteAmount, allowToVote } =
      data.updateEventUserAccessRights;
    coreStore.updateEventUserAccessRights(verified, voteAmount, allowToVote);
    toast(l18n.global.tc("view.polls.userUpdate"), {
      type: "info",
      autoClose: false,
      onOpen: () => (highlightStatusChange.value = true),
      onClose: () => (highlightStatusChange.value = false),
    });
  }
});

const pollLifeCycleSubscription = useSubscription(
  POLL_LIFE_CYCLE_SUBSCRIPTION,
  { eventId: props.event.id },
);
pollLifeCycleSubscription.onResult(async ({ data }) => {
  // Kein komplizierter UI-Status mehr nötig - wir isolieren jetzt auf Event-Ebene, 
  // indem jeder Browser nur seine eigenen Events verarbeitet
  // Das vereinfacht die Logik erheblich
  
  if (!data?.pollLifeCycle) {
    return;
  }
  
  // OLD POLL: Speichere alte Poll-ID für Lösch-Operationen
  const oldPollId = poll.value?.id;
  
  poll.value = data.pollLifeCycle.poll;
  pollState.value = data.pollLifeCycle.state;
  
  // KRITISCH: Wenn wir ein pollLifeCycle-Event erhalten und die Poll-ID hat sich geändert,
  // müssen wir alle alten Formular-Daten löschen
  if (oldPollId && poll.value && poll.value.id && oldPollId !== poll.value.id) {
    // Lösche die Formular-Daten der alten Abstimmung
    localStorage.removeItem(`poll_form_data_${oldPollId}`);
  }
  
  // ZUSÄTZLICH: Bei jeder Poll-Statusänderung sicherstellen, dass für die neue/geänderte Poll
  // keine alten ungültigen Formular-Daten vorhanden sind
  if (poll.value && poll.value.id) {
    localStorage.removeItem(`poll_form_data_${poll.value.id}`);
  }

  if (pollState.value === "new") {
    // Vollständiges Zurücksetzen aller Zähler und Status-Werte
    votingProcess.resetVoteCounts();
    // Auch die aktuelle Abstimmungs-ID zurücksetzen
    currentPollSubmissionId.value = null;
    
    // Setze den Zähler auf 1 für einen frischen Start
    voteCounter.value = 1;
    
    // Für einen neuen Poll auch den persistenten Zustand zurücksetzen
    if (poll.value && poll.value.id && props.event && props.event.id) {
      pollStatePersistence.resetVoteState(poll.value.id, props.event.id);
    }
    
    resultModal.value?.hideModal();

    if (!poll.value) {
      console.warn("Missing current poll. Try to refetch.");
      // WICHTIG: Temporär deaktiviert um das Problem mit flackernden Radio-Buttons zu testen
      await activePollEventUserQuery.refetch();
    }
    
    // KRITISCH: Prüfe, ob alle Stimmen bereits abgegeben wurden
    // In diesem Fall das Modal gar nicht erst öffnen!
    const totalAllowedVotes = eventUser.value?.voteAmount || 0;
    const usedVotes = votingProcess.usedVotesCount?.value || 0;
    
    if (totalAllowedVotes > 0 && usedVotes >= totalAllowedVotes) {
      
      // Setze den Status auf "abgestimmt", ohne das Modal zu öffnen
      pollState.value = "voted";
      return;
    }
    
    // WICHTIG: Lokalen Storage für die aktuelle und vorherige Abstimmung löschen
    if (poll.value && poll.value.id) {
      // Lösche alle Formular-Daten für diese Abstimmung
      localStorage.removeItem(`poll_form_data_${poll.value.id}`);
    }
    
    // Keine Abstimmung anzeigen, wenn gerade ein Abstimmungsprozess läuft
    if (showVotingModal.value) {
      // Server-seitigen Vote-Cycle für den Benutzer abrufen für die neue Poll
      if (eventUser.value?.id && poll.value?.id) {
        const eventUserId = eventUser.value?.id?.toString();
        const pollId = poll.value?.id?.toString();
        
        if (!eventUserId || !pollId) {
          console.error('Ungültige Parameter für userVoteCycle (neue Poll):', { eventUserId, pollId });
          return;
        }
        
        const userVoteCycleQuery = useQuery(
          USER_VOTE_CYCLE,
          { 
            eventUserId,
            pollId
          },
          { 
            fetchPolicy: "network-only", 
            errorPolicy: "all" // Explizit Fehler zurückgeben, um sie im Log zu sehen
          }
        );
        
        // Fehlerbehandlung
        userVoteCycleQuery.onError((error) => {
          console.error('GraphQL-Fehler bei userVoteCycle (neue Poll):', error);
        });
        
        userVoteCycleQuery.onResult(({ data }) => {
          if (data?.userVoteCycle) {
            // Server-seitigen Vote-Cycle als verlässlichere Quelle verwenden
            const serverVoteCycle = data.userVoteCycle.voteCycle || 0;
            const maxVotes = data.userVoteCycle.maxVotes || eventUser.value.voteAmount;
            
            // Die verwendeten Stimmen direkt übernehmen
            votingProcess.usedVotesCount.value = serverVoteCycle;
            
            // Stelle sicher, dass der Zähler korrekt initialisiert wird
            voteCounter.value = serverVoteCycle + 1;
            
            // Persistieren, damit future Loads konsistent sind
            pollStatePersistence.upsertPollState(poll.value.id, voteCounter.value, serverVoteCycle, props.event.id);
            
            // Prüfen, ob bereits alle Stimmen abgegeben wurden
            if (serverVoteCycle >= maxVotes) {
              pollState.value = "voted";
              return;
            }
            
            // Kleine Verzögerung, um sicherzustellen, dass alle Status zurückgesetzt sind
            setTimeout(() => {
              // EXTRA PRÜFUNG: Nur Modal öffnen, wenn wirklich noch Stimmen übrig sind
              if (maxVotes > 0 && serverVoteCycle < maxVotes) {
                // Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
                pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
                pollModal.value?.showModal();
              } else {
                pollState.value = "voted";
              }
            }, 100);
          } else {
            // Fallback - Keine Server-Daten verfügbar, normales Verhalten
            setTimeout(() => {
              // Sicherstellen, dass der voteCounter neu initialisiert wird
              voteCounter.value = 1;
              
              // EXTRA PRÜFUNG: Nur Modal öffnen, wenn wirklich noch Stimmen übrig sind
              if (eventUser.value?.voteAmount > 0 && votingProcess.usedVotesCount.value < eventUser.value.voteAmount) {
                // Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
                pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
                pollModal.value?.showModal();
              } else {
                pollState.value = "voted";
              }
            }, 100);
          }
        });
      } else {
        // Fallback - Keine IDs verfügbar, normales Verhalten
        setTimeout(() => {
          // Sicherstellen, dass der voteCounter neu initialisiert wird
          voteCounter.value = 1;
          
          // EXTRA PRÜFUNG: Nur Modal öffnen, wenn wirklich noch Stimmen übrig sind
          if (eventUser.value?.voteAmount > 0 && votingProcess.usedVotesCount.value < eventUser.value.voteAmount) {
            // Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
            pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
            pollModal.value?.showModal();
          } else {
            pollState.value = "voted";
          }
        }, 100);
      }
    }
  } else if (pollState.value === "closed") {
    pollModal.value?.hideModal();
    resultModal.value?.showModal();
    showMoreEnabled.value = true;
    page.value = 0;
    pollResults.value = [];
    pollResultsQuery.refetch();
  }
});

const pollAnswerLifeCycleSubscription = useSubscription(
  POLL_ANSWER_LIVE_CYCLE,
  { eventId: props.event.id }
);
pollAnswerLifeCycleSubscription.onResult(async ({ data }) => {
  // Prüfe, ob das Event für unser Event ist
  if (!data?.pollAnswerLifeCycle) {
    return;
  }
  
  // Aktualisiere die Abstimmungsdaten, um VotingDetails zu aktualisieren
  // WICHTIG: Temporär deaktiviert um das Problem mit flackernden Radio-Buttons zu testen
  // await activePollEventUserQuery.refetch();
  
  // ABSOLUT STRIKTE BROWSER-ISOLATION MIT VERBESSERTER SESSION-VERWALTUNG
  
  // Schritt 1: Hat der Benutzer überhaupt Stimmrechte?
  if (!eventUser.value?.voteAmount || eventUser.value?.voteAmount <= 0) {
    return;
  }
  
  // UI immer freigeben, falls Events empfangen werden, unabhängig von der Session
  // Das ist wichtig, um sicherzustellen, dass die UI niemals dauerhaft gesperrt bleibt
  if (!votingProcess.isActiveVotingSession() && 
      (votingProcess.isProcessingVotes.value || votingProcess.pollFormSubmitting.value)) {
    votingProcess.releaseUILocks();
    votingProcess.currentlyProcessingBatch.value = false;
  }
  
  // Schritt 2: KRITISCHE PRÜFUNG - Ist diese Browser-Session aktiv abstimmend registriert?
  // Diese Prüfung verwendet unsere neue globale Session-Verwaltung
  if (!votingProcess.isActiveVotingSession()) {
    return;
  }
  
  // Schritt 3: ESSENTIELLE VERARBEITUNGSPRÜFUNG - nur Events verarbeiten, wenn wir in einem Batch sind
  if (!votingProcess.currentlyProcessingBatch.value) {
    return;
  }
  
  // Schritt 4: Zusätzliche Sperre - verarbeite NUR Events in der korrekten Anzahl
  // Wir erwarten exakt die Anzahl von Events, die wir auch als Stimmen abgegeben haben
  const expectedCount = votingProcess.expectedVoteCount.value || 1;
  const ourCurrentCount = pollUserVotedCount.value;
  
  // HARTE SICHERHEITSSPERRE: Wenn wir schon die Anzahl der erwarteten Events erreicht haben,
  // ignorieren wir ALLE weiteren Events, egal woher sie kommen
  if (ourCurrentCount >= expectedCount) {
    return;
  }
  
  // Debug-Ausgabe zur Überwachung der Event-Verarbeitung
  const serverVoteCount = data.pollAnswerLifeCycle.pollUserVotedCount || 0;
  
  // Schritt 5: Zeitliche Validierung - Events zu alt?
  const ourStartTimestamp = votingProcess.lastBatchTimestamp.value || 0;
  const currentTime = Date.now();
  const timeSinceStart = currentTime - ourStartTimestamp;
  
  // 5 Minuten Timeout (wie vorher)
  if (timeSinceStart > 300000) {
    return;
  }
  
  // Nur für Debug-Zwecke ausgeben, wie lange das Event unterwegs war
  
  // Ab hier wissen wir sicher, dass wir in einer aktiven Abstimmung sind
  const totalAllowedVotes = eventUser.value?.voteAmount || 0;
  
  // Erhöhe den Zähler GENAU EINMAL pro Event
  // Dieser Wert wird benutzt, um den Fortschritt zu tracken
  pollUserVotedCount.value++;
  
  // Prüfe, ob jetzt alle erwarteten Events eingetroffen sind
  const expectedVoteCount = expectedCount; // wir verwenden den vorher deklarierten Wert
  const batchComplete = (pollUserVotedCount.value >= expectedVoteCount);
  
  // Gibt den aktuellen Status der Verarbeitung aus (nur für Debug-Zwecke)
  const completionPercentage = Math.round(pollUserVotedCount.value/expectedVoteCount*100);
  
  // Solange der Batch nicht vollständig ist, bleiben alle Sperren aktiv
  if (!batchComplete) {
    // Stelle absolut sicher, dass ALLE beteiligten UI-Komponenten gesperrt bleiben
    // Diese Flags MÜSSEN gesetzt sein, solange noch Events erwartet werden
    votingProcess.isProcessingVotes.value = true;
    votingProcess.pollFormSubmitting.value = true;
    
    // Stelle sicher, dass auch das Modal-Fenster gesperrt bleibt
    if (pollModal.value) {
      pollModal.value.isSubmitting = true;
      
      if (pollModal.value.pollForm) {
        pollModal.value.pollForm.isSubmitting = true;
      }
    }
    
    // Warte auf weitere Events, ohne weitere Codeausführung
    return;
  }
  
  // Wenn wir hier ankommen, ist der Batch komplett (alle erwarteten Events sind da)
  
  // BATCH KOMPLETT: Alle erwarteten Events wurden empfangen!
  
  // Aktualisiere den Zustand
  // WICHTIG: Temporär deaktiviert um das Problem mit flackernden Radio-Buttons zu testen
  await activePollEventUserQuery.refetch();
  
  // WICHTIG: usedVotesCount wird jetzt direkt in handleFormSubmit gesetzt
  // und NICHT mehr hier durch subscription-Events, um Doppelzählungen zu vermeiden
  
  // Hole die KORREKTEN Werte für weitere Verarbeitung
  // Dies ist der Wert, der von handleFormSubmit DIREKT gesetzt wurde, 
  // NICHT der Wert aus der Subscription-Event-Zählung
  const usedVotes = votingProcess.usedVotesCount.value;
  
  // RESET nach vollständiger Verarbeitung aller Events für diesen Browser
  
  // KRITISCH: Deaktiviere die Voting-Session, da wir alle Events verarbeitet haben
  // Das verhindert, dass wir versehentlich Events aus anderen Browser-Sessions verarbeiten
  votingProcess.deactivateVotingSession();
  
  // Erst jetzt UI zurücksetzen
  resetUIAfterSubmission();
  
  // Nach dem Reset der UI setzen wir auch den pollUserVotedCount zurück,
  // damit der nächste Batch von vorne anfangen kann
  pollUserVotedCount.value = 0;
  
  // Abstimmungs-ID zurücksetzen, damit wir für neue Abstimmungen bereit sind
  currentPollSubmissionId.value = null;
  
  // Prüfen, ob alle verfügbaren Stimmen abgegeben wurden
  // WICHTIG: Wir verwenden hier den direkten Wert aus votingProcess.usedVotesCount
  // und NICHT den Wert aus der Subscription-Event-Zählung (pollUserVotedCount)
  const actualUsedVotes = votingProcess.usedVotesCount.value;
  
  // Unser neues "votingFullyCompleted" Flag für den Zustand nutzen
  if (votingProcess.votingFullyCompleted.value || actualUsedVotes >= totalAllowedVotes) {
    // Bei vollständiger Abstimmung das votingFullyCompleted Flag setzen
    votingProcess.votingFullyCompleted.value = true;
  } else {
  }
  
  // VERBESSERTE UI-FREIGABE mit der neuen Methode
  
  // UI-Sperren explizit freigeben
  votingProcess.releaseUILocks();
  
  // Auch das Batch-Flag zurücksetzen
  votingProcess.currentlyProcessingBatch.value = false;
  
  // UI-Komponenten aktualisieren
  if (pollModal.value) {
    pollModal.value.isSubmitting = false;
    
    if (pollModal.value.pollForm) {
      pollModal.value.pollForm.isSubmitting = false;
    }
  }
  
  // Bei allen Stimmen das Modal schließen
  if (usedVotes >= totalAllowedVotes) {
    if (pollModal.value) {
      pollModal.value.hideModal();
    }
    // Status auf "abgestimmt" setzen
    pollState.value = "voted";
  }
  
  // Das Formular NICHT global zurücksetzen, sondern nur lokal im reset der eigenen Abstimmung
  // Jeder Browser soll seinen eigenen Zustand behalten
});
function onJoinMeeting() {
  meetingFrameIsActive.value = true;
}

function onShowMorePollResults() {
  page.value += 1;
  pollResultsQuery.fetchMore({
    variables: {
      page: page.value,
      pageSize: pageSize.value,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (
        !fetchMoreResult?.pollResult ||
        fetchMoreResult.pollResult.length < pageSize.value
      ) {
        showMoreEnabled.value = false;
        toast(l18n.global.tc("view.results.noMoreResults"), { type: "info" });
        return previousResult;
      }

      return {
        ...previousResult,
        pollResult: [
          ...(previousResult?.pollResult || []),
          ...fetchMoreResult.pollResult,
        ],
      };
    },
  });
}

async function onSubmitPoll(pollFormData) {
  try {
    
    // SICHERHEITSPRÜFUNG: Ist noch eine aktive Abstimmung im Gange?
    if (votingProcess.isActiveVotingSession()) {
      // Toast-Nachricht für den Benutzer
      toast(l18n.global.tc("view.polls.info.stillProcessing"), { type: "info" });
      return;
    }
    
    // RESET ALLER ZUSTÄNDE vor jeder neuen Abstimmung
    // Dies stellt sicher, dass alte Zustände nicht hängenbleiben
    votingProcess.pollFormSubmitting.value = false;
    votingProcess.currentlyProcessingBatch.value = false;
    votingProcess.isProcessingVotes.value = false;
    currentPollSubmissionId.value = null;
    pollUserVotedCount.value = 0;
    
    // Kurze Pause nach dem Reset, um sicherzustellen, dass alle Views aktualisiert sind
    await new Promise(resolve => setTimeout(resolve, 50));

    // KRITISCH: Setzen aller relevanten Zustände vor der Abstimmung
    // Diese Flags sorgen dafür, dass die UI bis zum Empfang aller Events gesperrt bleibt
    votingProcess.pollFormSubmitting.value = true;
    votingProcess.currentlyProcessingBatch.value = true;
    votingProcess.isProcessingVotes.value = true;
    
    // KRITISCH: Auch im PollModal den korrekten Zustand setzen
    // Dadurch wird das Overlay eingeblendet, das alle Interaktionen blockiert
    if (pollModal.value) {
      pollModal.value.isSubmitting = true;
      
      // Sicherstellen, dass auch das PollForm gesperrt ist
      if (pollModal.value.pollForm) {
        pollModal.value.pollForm.isSubmitting = true;
      }
    }

    let success = false;
    
    // Generiere für diese Abstimmung eine eindeutige ID und speichere den Zeitstempel
    // Diese werden nur in dieser Browser-Session verwendet
    const currentTimestamp = Date.now();
    currentPollSubmissionId.value = "poll-" + currentTimestamp + "-" + Math.random().toString(36).substring(2, 10);
    
    // Wichtig: Zähler zurücksetzen für den neuen Batch
    pollUserVotedCount.value = 0;
    
    // Log vor der nächsten Abstimmung
    
    try {      
      // Verarbeitung der Stimmen - Wir überlassen die Session-Verwaltung nun vollständig dem voting-process
      if (pollFormData.votesToUse && parseInt(pollFormData.votesToUse, 10) > 0) {
        const votesToUse = parseInt(pollFormData.votesToUse, 10);
        
        // WICHTIG: Speichere die gewählte Stimmenzahl für Persistenz zwischen Seiten-Reloads
        if (poll.value && poll.value.id && props.event && props.event.id) {
          // GARANTIERT GENAU DIE VOM NUTZER GEWÄHLTE ANZAHL SPEICHERN
          pollStatePersistence.setMaxVotesToUse(poll.value.id, props.event.id, votesToUse);
          
          // Zur Sicherheit direkt danach prüfen, ob der Wert auch korrekt gespeichert wurde
          const saved = pollStatePersistence.getMaxVotesToUse(poll.value.id, props.event.id);
          
          // Wenn der Wert nicht korrekt gespeichert wurde, nochmal versuchen
          if (saved === null || saved !== votesToUse) {
            pollStatePersistence.setMaxVotesToUse(poll.value.id, props.event.id, votesToUse);
          }
        }
      
        if (votesToUse === eventUser.value.voteAmount) {
          pollFormData.useAllAvailableVotes = true;
          success = await votingProcess.handleFormSubmit(pollFormData, poll);
        } else {
          success = await votingProcess.handleFormSubmit(pollFormData, poll, votesToUse);
        }
      } else {
        // Hier wird mit 1 Stimme abgestimmt, dies ebenfalls speichern
        if (poll.value && poll.value.id && props.event && props.event.id) {
          pollStatePersistence.setMaxVotesToUse(poll.value.id, props.event.id, 1);
          
          // Zur Sicherheit direkt danach prüfen, ob der Wert auch korrekt gespeichert wurde
          const saved = pollStatePersistence.getMaxVotesToUse(poll.value.id, props.event.id);
          
          // Wenn der Wert nicht korrekt gespeichert wurde, nochmal versuchen
          if (saved === null || saved !== 1) {
            pollStatePersistence.setMaxVotesToUse(poll.value.id, props.event.id, 1);
          }
        }
        success = await votingProcess.handleFormSubmit(pollFormData, poll);
      }
      
      if (!success) {
        // Wenn der Vorgang nicht erfolgreich war, SOFORT zurücksetzen und Session deaktivieren
        resetUIAfterSubmission();
        votingProcess.deactivateVotingSession();
        toast("Fehler bei der Stimmabgabe", { type: "warning" });
      }
      
      // SOFORTIGE UI-FREIGABE nach Formular-Übermittlung
      
      // Explizit die UI-Sperren freigeben
      votingProcess.releaseUILocks();
      
      // Auch das Modal entsperren
      if (pollModal.value) {
        pollModal.value.isSubmitting = false;
        if (pollModal.value.pollForm) {
          pollModal.value.pollForm.isSubmitting = false;
        }
      }
      
      // Zusätzlich einen kurzen Timeout setzen, um sicherzustellen,
      // dass die UI-Freigabe wirklich erfolgt
      setTimeout(() => {
        // Immer UI-Sperren zurücksetzen, unabhängig vom Session-Status
        
        // Explizit die UI-Sperren freigeben
        votingProcess.releaseUILocks();
        votingProcess.currentlyProcessingBatch.value = false;
        
        // Auch das Modal entsperren
        if (pollModal.value) {
          pollModal.value.isSubmitting = false;
          if (pollModal.value.pollForm) {
            pollModal.value.pollForm.isSubmitting = false;
          }
        }
      }, 1000);
      
      // Wichtig: Bei Erfolg setzen wir NICHT zurück - das passiert erst durch das pollAnswerLifeCycle-Event!
      
    } catch (error) {
      console.error('Fehler bei der Stimmverarbeitung:', error);
      success = false;
      
      // Aktive Session als fehlgeschlagen markieren
      votingProcess.deactivateVotingSession();
      
      // UI sofort zurücksetzen und Fehler anzeigen
      resetUIAfterSubmission();
      toast("Fehler bei der Stimmverarbeitung", { type: "error" });
    }
  } catch (error) {
    console.error('Fehler bei der Stimmabgabe:', error);
    toast("Fehler bei der Stimmabgabe", { type: "error" });
    
    // Aktive Session als fehlgeschlagen markieren
    votingProcess.deactivateVotingSession();
    
    // Auch bei einem allgemeinen Fehler alles zurücksetzen
    resetUIAfterSubmission();
  }
}

function resetUIAfterSubmission() {
  
  const totalAllowedVotes = eventUser.value?.voteAmount || 0;
  const usedVotes = votingProcess.usedVotesCount?.value || 0;
  
  try {
    // Prüfen, ob wir alle Stimmen verwendet haben
    const allVotesUsed = (totalAllowedVotes > 0 && usedVotes >= totalAllowedVotes) || votingProcess.votingFullyCompleted.value;
    const partialVotesUsed = (usedVotes > 0 && usedVotes < totalAllowedVotes && !votingProcess.votingFullyCompleted.value);
    
    // Bei komplett abgeschlossener Abstimmung (alle Stimmen genutzt) Modal schließen
    if (allVotesUsed) {
        
      // Sicherstellen, dass das Modal geschlossen wird
      if (pollModal.value) {
        pollModal.value.hideModal();
      }
      
      // Status auf "abgestimmt" setzen
      pollState.value = "voted";
      
      // Vollständige Abstimmung markieren
      votingProcess.votingFullyCompleted.value = true;
    }
    
    // IMMER alle UI-Komponenten zurücksetzen, unabhängig vom Status
    if (pollModal.value) {
      pollModal.value.isSubmitting = false;
      
      if (pollModal.value.pollForm) {
        pollModal.value.pollForm.isSubmitting = false;
      }
    }
    
    // ALLE UI-Flags werden mit der verbesserten Methode zurückgesetzt
    votingProcess.releaseUILocks();
    
    // Das Batch-Flag muss auch zurückgesetzt werden, um weitere Events zu verhindern
    votingProcess.currentlyProcessingBatch.value = false;
    
    // Session-ID zurücksetzen
    currentPollSubmissionId.value = null;
    
    // Auch den Stimmenzähler zurücksetzen
    pollUserVotedCount.value = 0;
    
    // Wir geben hier auch eine Ausgabe der restlichen Stimmen aus
    const votesLeft = totalAllowedVotes - usedVotes;
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der UI:', error);
    
    // Wenn ein Fehler auftritt, setzen wir alles sicherheitshalber zurück
    try {
      // Verwende die neue Methode zur Freigabe der UI-Sperre
      votingProcess.releaseUILocks();
      
      // Batch-Verarbeitung explizit beenden
      votingProcess.currentlyProcessingBatch.value = false;
      
      // Deaktiviere die Session vollständig
      votingProcess.deactivateVotingSession();
      
      // Session-ID zurücksetzen
      currentPollSubmissionId.value = null;
      
      // Auch den Stimmenzähler zurücksetzen
      pollUserVotedCount.value = 0;
      
    } catch (e) {
      console.error('Kritischer Fehler beim Zurücksetzen der Flags:', e);
    }
  }
}
</script>
