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
    <PollStatus :exist-active-poll="existActivePoll" :poll-state="pollState" :vote-amount="eventUser?.voteAmount || 0" />
    <VotingDetailsWithSubscription
      v-if="poll?.type === 'PUBLIC' && existActivePoll && event.publicVoteVisible"
      :active-poll-event-user="activePollEventUser"
      :event-id="event.id"
      :event="event"
      :poll="poll"
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
      :voting-process="votingProcess"
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
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useQuery, useSubscription } from "@vue/apollo-composable";
import { Modal } from "bootstrap";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { ACTIVE_POLL_EVENT_USER } from "@/modules/organizer/graphql/queries/active-poll-event-user.js";
import { USER_VOTE_CYCLE } from "@/modules/eventUser/graphql/queries/user-vote-cycle";
import { toast } from "vue3-toastify";
import { useI18n } from "vue-i18n";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { POLL_LIFE_CYCLE_SUBSCRIPTION } from "@/modules/eventUser/graphql/subscription/poll-life-cycle";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";
import { apolloClient } from "@/apollo-client";
import { POLL_ANSWER_LIVE_CYCLE } from "@/modules/organizer/graphql/subscription/poll-answer-life-cycle";

const coreStore = useCore();
const { t } = useI18n();
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
// KRITISCH: Extrahiere usedVotesCount als separate ref für Reaktivität
const usedVotesCount = votingProcess.usedVotesCount;
const activePollEventUser = ref(null);
const pollUserVotedCount = ref(0);

// Globale Sicherheitsmaßnahme für UI-Freigabe nach Modals
function ensureUIIsUnlocked() {
  try {
    // Backdrop-Elemente entfernen
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length > 0) {
      Array.from(backdrops).forEach(backdrop => {
        if (backdrop && backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      });
    }
    
    // Body-Styles zurücksetzen
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.pointerEvents = '';
    document.body.style.position = '';
    
    // Verhindere mögliche verbleibende Overlays
    const overlays = document.querySelectorAll('[data-bs-backdrop="static"]');
    overlays.forEach(overlay => {
      if (overlay && overlay.parentNode && !overlay.closest('.modal')) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  } catch (error) {
    console.error('[DEBUG:VOTING] Fehler beim Entsperren der UI:', error);
  }
}

const currentPollSubmissionId = ref(null); // Speichert die ID der aktuellen Abstimmungssession
const showVotingModal = computed(() => {
  // KRITISCH: Modal muss auch bei Split-Voting sichtbar bleiben!
  // Also auch dann anzeigen, wenn noch Stimmen übrig sind (usedVotesCount < voteAmount)
  const hasVotesAvailable = eventUser.value?.voteAmount >= 1;
  const isAllowedToVote = eventUser.value?.allowToVote;
  // KRITISCH: Verwende die extrahierte ref direkt für bessere Reaktivität
  const usedVotes = usedVotesCount.value || 0;
  const maxVotes = eventUser.value?.voteAmount || 0;
  const hasRemainingVotes = usedVotes < maxVotes;

  // FIX: Modal soll NUR angezeigt werden, wenn der User abstimmen darf UND noch Stimmen übrig sind
  // Nicht mehr anzeigen, wenn alle Stimmen bereits abgegeben wurden
  const result = hasVotesAvailable && isAllowedToVote && hasRemainingVotes;

  console.log(`[DEBUG:VOTING] showVotingModal berechnet: hasVotesAvailable=${hasVotesAvailable}, isAllowedToVote=${isAllowedToVote}, usedVotes=${usedVotes}, maxVotes=${maxVotes}, hasRemainingVotes=${hasRemainingVotes}, RESULT=${result}`);

  // Zeige Modal wenn: (erlaubt zu wählen) UND (noch Stimmen übrig)
  return result;
});

// KRITISCH: Watcher auf usedVotesCount, um zu tracken, wann es sich ändert
watch(usedVotesCount, (newVal, oldVal) => {
  console.log(`[DEBUG:VOTING] 🔄 usedVotesCount GEÄNDERT von ${oldVal} zu ${newVal}`);
  console.log(`[DEBUG:VOTING] 🔍 eventUser.voteAmount=${eventUser.value?.voteAmount}, eventUser.allowToVote=${eventUser.value?.allowToVote}`);

  // FIX: Wenn alle Stimmen abgegeben wurden, resetSubmittingState aufrufen BEVOR das Modal aus dem DOM entfernt wird
  const maxVotes = eventUser.value?.voteAmount || 0;
  if (newVal >= maxVotes && maxVotes > 0) {
    console.log(`[DEBUG:VOTING] 🎯 Alle Stimmen abgegeben (${newVal}/${maxVotes}), setze isSubmitting zurück`);
    // Verwende die resetSubmittingState-Funktion des PollModals
    if (pollModal.value?.resetSubmittingState) {
      try {
        pollModal.value.resetSubmittingState();
        console.log('[DEBUG:VOTING] ✅ isSubmitting erfolgreich zurückgesetzt via resetSubmittingState');
      } catch (e) {
        console.error('[DEBUG:VOTING] ❌ Fehler beim Zurücksetzen von isSubmitting:', e);
      }
    }
  }
}, { immediate: true });

// KRITISCH: Watcher auf showVotingModal, um zu tracken, wann es sich ändert
watch(showVotingModal, (newVal, oldVal) => {
  console.log(`[DEBUG:VOTING] ⚠️ showVotingModal GEÄNDERT von ${oldVal} zu ${newVal}`);
  if (newVal) {
    console.log('[DEBUG:VOTING] ✅ Modal SOLLTE jetzt im DOM sein (v-if=true)');
  } else {
    console.log('[DEBUG:VOTING] ❌ Modal SOLLTE jetzt AUS dem DOM sein (v-if=false)');

    // FIX: Modal explizit schließen, BEVOR es durch v-if=false unmounted wird
    // WICHTIG: Verwende flush: 'sync' im Watch, um sicherzustellen, dass hideModal
    // aufgerufen wird, BEVOR Vue die Komponente aus dem DOM entfernt
    if (pollModal.value?.hideModal) {
      try {
        console.log('[DEBUG:VOTING] 🔧 Rufe hideModal() auf, bevor Modal unmounted wird');
        pollModal.value.hideModal();
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Schließen des Modals vor Unmount:', e);
      }
    }
  }
}, { immediate: true, flush: 'sync' });

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
  () => {
    return !eventUser.value?.online || !eventUser.value?.id;
  },
);

// Watchdog-Timer für UI-Lock-Situationen einrichten
let watchdogInterval = null;

onMounted(() => {
  // Watchdog für UI-Lock-Situationen - prüft alle 3 Sekunden
  watchdogInterval = setInterval(() => {
    try {
      // Prüfe, ob noch Stimmen übrig sind
      const totalAllowedVotes = eventUser.value?.voteAmount || 0;
      const usedVotes = votingProcess.usedVotesCount?.value || 0;
      const partialVotesUsed = usedVotes > 0 && usedVotes < totalAllowedVotes;
      
      // Wenn teilweise abgestimmt und UI-Locks aktiv sind und keine aktive Abstimmung
      if (partialVotesUsed && 
          (votingProcess.isProcessingVotes.value || 
           votingProcess.pollFormSubmitting.value ||
           votingProcess.currentlyProcessingBatch.value) &&
          !votingProcess.isActiveVotingSession()) {
        
        // Erste Maßnahme: Setze UI-Locks zurück
        console.warn("[DEBUG:VOTING] Watchdog: UI-Locks zurücksetzen");
        votingProcess.isProcessingVotes.value = false;
        votingProcess.pollFormSubmitting.value = false;
        votingProcess.currentlyProcessingBatch.value = false;
        
        // Wenn kein Modal sichtbar ist, versuche es zu öffnen
        if (pollModal.value && 
            poll.value && !poll.value.closed && pollState.value !== "closed") {
          
          console.warn("[DEBUG:VOTING] Watchdog: Versuche Modal zu öffnen");
          setTimeout(() => {
            try {
              pollModal.value.showModal();
            } catch (err) {
              console.error("[DEBUG:VOTING] Watchdog: Fehler beim Öffnen des Modals:", err);
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error("[DEBUG:VOTING] Watchdog-Fehler:", err);
    }
  }, 3000);
});

onBeforeUnmount(() => {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
});

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
          
          // Nach dem Speichern: Nochmals den gespeicherten Wert prüfen
          const newStoredCounter = pollStatePersistence.restoreVoteCounter(poll.value.id, props.event.id);
          
          // Prüfen, ob der Wert korrekt gespeichert wurde
          if (newStoredCounter !== voteCounter.value) {
            console.warn(`[DEBUG:COUNTER] Problem beim Speichern! Expected=${voteCounter.value}, Got=${newStoredCounter}`);
          }
          
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
              // Sicherheitscheck: Ist pollModal.value noch vorhanden?
              if (pollModal.value) {
                // Vollständiges Zurücksetzen des Formulars NUR bei neuem Poll (serverVoteCycle === 0)
                // Bei Split-Voting NICHT zurücksetzen, um die Auswahl zu behalten
                if (serverVoteCycle === 0) {
                  pollModal.value.reset(false);
                  console.log('[DEBUG:VOTING] Neuer Poll (activePollEventUser): Formular wird zurückgesetzt');
                } else {
                  console.log(`[DEBUG:VOTING] Split-Voting (activePollEventUser, Zyklus ${serverVoteCycle}): Formular wird NICHT zurückgesetzt`);
                }

                // Kurze Verzögerung, um sicherzustellen dass die pollModal-Referenz stabil bleibt
                setTimeout(() => {
                  // Double-check before access
                  if (pollModal.value) {
                    try {
                      pollModal.value.showModal();
                    } catch (e) {
                      console.error("[DEBUG:VOTING] Fehler beim Öffnen des Modals nach reset:", e);
                    }
                  } else {
                    console.warn("[DEBUG:VOTING] pollModal.value wurde null zwischen reset und showModal!");
                  }
                }, 50);
              } else {
                console.warn("[DEBUG:VOTING] pollModal.value ist null beim Versuch, reset aufzurufen und Modal zu öffnen");
              }
            }, 100);
          } else {
            pollState.value = "voted";
          }
        } else {
          
          // Lese vorhandene Werte aus dem lokalen Storage
          const storedCounter = pollStatePersistence.restoreVoteCounter(poll.value.id, props.event.id);
          const storedUsedVotes = pollStatePersistence.getUsedVotes(poll.value.id, props.event.id);
          
          // Stelle sicher, dass der Zähler korrekt initialisiert wird
          voteCounter.value = storedCounter;
          
          // Synchronisiere den verwendeten Stimmen-Zähler mit dem gespeicherten Zustand
          // Dies ist wichtig, um nach einem Reload den korrekten Stimmenzähler wiederherzustellen
          votingProcess.usedVotesCount.value = storedUsedVotes;
          
          // Prüfen, ob die Werte plausibel sind
          if (voteCounter.value > 99000) {
            console.warn(`[DEBUG:COUNTER] Unplausibel hoher voteCounter (${voteCounter.value})! Setze auf ${storedUsedVotes + 1}`);
            voteCounter.value = storedUsedVotes + 1;
          }
          
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
              // Sicherheitscheck: Ist pollModal.value noch vorhanden?
              if (pollModal.value) {
                // Vollständiges Zurücksetzen des Formulars NUR bei neuem Poll
                // Prüfe via usedVotesCount (da kein serverVoteCycle in diesem Fallback verfügbar)
                const currentUsedVotes = votingProcess.usedVotesCount.value || 0;
                if (currentUsedVotes === 0) {
                  pollModal.value.reset(false);
                  console.log('[DEBUG:VOTING] Neuer Poll (activePollEventUser Fallback 1): Formular wird zurückgesetzt');
                } else {
                  console.log(`[DEBUG:VOTING] Split-Voting (activePollEventUser Fallback 1, ${currentUsedVotes} verwendet): Formular wird NICHT zurückgesetzt`);
                }

                // Kurze Verzögerung, um sicherzustellen dass die pollModal-Referenz stabil bleibt
                setTimeout(() => {
                  // Double-check before access
                  if (pollModal.value) {
                    try {
                      pollModal.value.showModal();
                    } catch (e) {
                      console.error("[DEBUG:VOTING] Fehler beim Öffnen des Modals nach reset:", e);
                    }
                  } else {
                    console.warn("[DEBUG:VOTING] pollModal.value wurde null zwischen reset und showModal!");
                  }
                }, 50);
              } else {
                console.warn("[DEBUG:VOTING] pollModal.value ist null beim Versuch, reset aufzurufen und Modal zu öffnen");
              }
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
          // Vollständiges Zurücksetzen des Formulars NUR bei neuem Poll
          const currentUsedVotes = votingProcess.usedVotesCount.value || 0;
          if (currentUsedVotes === 0) {
            pollModal.value?.reset(false);
            console.log('[DEBUG:VOTING] Neuer Poll (activePollEventUser Fallback 2): Formular wird zurückgesetzt');
          } else {
            console.log(`[DEBUG:VOTING] Split-Voting (activePollEventUser Fallback 2, ${currentUsedVotes} verwendet): Formular wird NICHT zurückgesetzt`);
          }

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
    const { verified, voteAmount, allowToVote, pollHints } =
      data.updateEventUserAccessRights;

    // Vorherige Werte speichern, um Änderungen erkennen zu können
    const previousVoteAmount = eventUser.value?.voteAmount || 0;
    const previousAllowToVote = eventUser.value?.allowToVote || false;

    // Update der Benutzerrechte im Core-Store
    coreStore.updateEventUserAccessRights(verified, voteAmount, allowToVote, pollHints);
    
    // Spezifischere Nachricht je nach Art der Änderung
    let updateMessage;
    
    if (previousVoteAmount !== voteAmount) {
      if (voteAmount > previousVoteAmount) {
        updateMessage = t("view.polls.voteIncrease", {
          voteAmount: voteAmount,
          previousVoteAmount: previousVoteAmount,
          difference: voteAmount - previousVoteAmount
        });
      } else {
        updateMessage = t("view.polls.voteDecrease", {
          voteAmount: voteAmount,
          previousVoteAmount: previousVoteAmount,
          difference: previousVoteAmount - voteAmount
        });
      }
    } else if (previousAllowToVote !== allowToVote) {
      if (allowToVote) {
        updateMessage = t("view.polls.voteEnabled");
      } else {
        updateMessage = t("view.polls.voteDisabled");
      }
    } else {
      // Fallback für andere Änderungen
      updateMessage = t("view.polls.userUpdate");
    }
    
    // Toast-Nachricht mit deutlich hervorgehobener Warnung anzeigen
    toast(updateMessage, {
      type: "info",
      autoClose: 5000, // 5 Sekunden anzeigen, dann automatisch schließen
      className: "vote-rights-update-toast",
      onOpen: () => (highlightStatusChange.value = true),
      onClose: () => (highlightStatusChange.value = false),
    });
  }
});

// Zustandsvariable für Cycle-Events, um überflüssige Verarbeitung zu vermeiden
const isProcessingLifeCycleEvent = ref(false);

// Globale Zustandsvariable, die anzeigt, dass der Poll geschlossen wurde und keine weiteren Events verarbeitet werden sollen
const pollClosedEventReceived = ref(false);

const pollLifeCycleSubscription = useSubscription(
  POLL_LIFE_CYCLE_SUBSCRIPTION,
  { eventId: props.event.id },
);
pollLifeCycleSubscription.onResult(async ({ data }) => {
  // Basis-Prüfung: Sind überhaupt Daten vorhanden?
  if (!data?.pollLifeCycle) {
    return;
  }
  
  // Bei neuer Abstimmung sofort alle Flags zurücksetzen
  if (data.pollLifeCycle.state === "new") {
    console.warn("[DEBUG:VOTING] Life-Cycle-Event mit status='new' erhalten");
    
    // Alle Status-Flags zurücksetzen
    pollClosedEventReceived.value = false;
    window._newPollActive = true;
    
    // Globale Closure-Flags zurücksetzen
    if (window._isHandlingPollClosure) {
      window._isHandlingPollClosure = false;
      delete window._currentClosureId;
    }
  }
  
  // KRITISCH: Wenn der Poll bereits als geschlossen markiert wurde, ignorieren wir alle weiteren Events AUSSER "new"
  // Das "new" Event wurde bereits oben verarbeitet, deshalb ist diese Prüfung jetzt sicher
  if (pollClosedEventReceived.value) {
    console.warn("[DEBUG:VOTING] Poll ist bereits als geschlossen markiert, ignoriere weiteres Life-Cycle-Event");
    return;
  }
  
  // Wenn Poll-Closed-Event empfangen wird
  if (data.pollLifeCycle.state === "closed") {
    console.warn("[DEBUG:VOTING] Life-Cycle-Event mit status='closed' erhalten");
    
    // KRITISCH: Sowohl lokale als auch globale Flags setzen
    pollClosedEventReceived.value = true;
    window.pollClosedEventReceived = true; // Globales Flag setzen, das von allen Prozessen geprüft wird
    
    // WICHTIG: Bei geschlossener Poll auch die aktive Poll-ID auf null setzen
    // Das verhindert Poll-ID-Mismatch-Fehler beim nächsten Öffnen eines Polls
    window._currentActivePollId = null;
    console.warn(`[DEBUG:VOTING] Globale Poll-ID bei Schließung zurückgesetzt: null`);
    
    // PollModal VERZÖGERT schließen, damit ResultModal Zeit hat seinen Backdrop zu erstellen
    if (pollModal.value) {
      try {
        // KRITISCH: 600ms Verzögerung, damit ResultModal seinen Backdrop erstellen kann
        setTimeout(() => {
          // console.log('[DEBUG:VOTING] Schließe PollModal jetzt (nach Verzögerung)');
          pollModal.value.hideModal();
        }, 600);

        // UI-Locks freigeben (kann sofort passieren)
        votingProcess.releaseUILocks();
        votingProcess.isProcessingVotes.value = false;
        votingProcess.pollFormSubmitting.value = false;
        votingProcess.currentlyProcessingBatch.value = false;

        // Poll-Status auf "closed" setzen
        pollState.value = "closed";
      } catch(e) {
        console.error('[DEBUG:VOTING] Fehler beim Schließen des PollModals:', e);
      }
    }
    
    // SOFORT mit dem Laden der Ergebnisse beginnen, um Zeit zu sparen
    // Diese Sofortaktion initiiert das Laden parallel zu allem anderen
    try {
      // Sofort die Ergebnisse neu laden, ohne auf die weitere Event-Verarbeitung zu warten      
      apolloClient.query({
        query: POLLS_RESULTS,
        variables: { eventId: props.event.id, page: 0, pageSize: pageSize.value },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      }).then(result => {
        if (result.data?.pollResult && result.data.pollResult.length > 0) {
          // Ergebnisse direkt ins pollResults setzen
          pollResults.value = [...result.data.pollResult];
          
          // Speziell das letzte/neueste Ergebnis als lastPollResult setzen
          const sortedResults = [...result.data.pollResult].sort(
            (a, b) => b.createDatetime - a.createDatetime
          );
          lastPollResult.value = sortedResults[0];
          
          // DIREKT HIER das Ergebnis-Modal anzeigen, sobald wir Ergebnisse haben
          // Dies ist der schnellste Weg, Ergebnisse anzuzeigen
          try {
            // console.log('[DEBUG:RESULT] Prüfe ob ResultModal geöffnet werden soll:', {
            //   hasResultModal: !!resultModal.value,
            //   isVisible: resultModal.value?.isVisible?.value
            // });

            if (resultModal.value && !resultModal.value.isVisible?.value) {
              // console.log('[DEBUG:RESULT] Öffne ResultModal SOFORT (keine Verzögerung)');
              // KRITISCH: Öffne ResultModal SOFORT, damit es seinen Backdrop erstellen kann
              // BEVOR PollModal seinen Backdrop entfernt
              // console.log('[DEBUG:RESULT] Rufe resultModal.showModal() auf');
              resultModal.value.showModal();
            } else {
              // console.log('[DEBUG:RESULT] ResultModal wird NICHT geöffnet - Bedingung nicht erfüllt');
            }
          } catch (modalError) {
            console.error('[DEBUG:VOTING] Fehler beim direkten Anzeigen des ResultModals:', modalError);
          }
        }
      }).catch(e => {
        console.error('[DEBUG:VOTING] SOFORTAKTION: Fehler beim sofortigen Laden der Ergebnisse:', e);
      });
    } catch (e) {
      console.error('[DEBUG:VOTING] SOFORTAKTION: Fehler bei sofortiger Ergebnisabfrage:', e);
    }
  }
  
  // KRITISCHE SCHUTZMAßNAHME: Vermeide parallele Verarbeitung desselben Events
  // Falls wir bereits ein Event verarbeiten, warten wir kurz
  if (isProcessingLifeCycleEvent.value) {
    console.warn("[DEBUG:VOTING] Es wird bereits ein Life-Cycle-Event verarbeitet, warte kurz...");
    
    // Warte eine kurze Zeit und prüfe dann erneut
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Wenn immer noch verarbeitet wird, ignoriere dieses Event
    if (isProcessingLifeCycleEvent.value) {
      console.warn("[DEBUG:VOTING] Life-Cycle-Event wird immer noch verarbeitet, ignoriere dieses Event");
      return;
    }
  }
  
  // Markiere, dass wir jetzt ein Event verarbeiten
  isProcessingLifeCycleEvent.value = true;
  
  try {
  
    // OLD POLL: Speichere alte Poll-ID für Lösch-Operationen
    const oldPollId = poll.value?.id;
  
    // KRITISCHE INFORMATION: Ist dies ein "new" Event?
    const isNewPoll = data.pollLifeCycle.state === "new";
  
    // KRITISCH: Bei neuer Abstimmung alle laufenden Abstimmungsprozesse HART abbrechen
    if (isNewPoll) {
    // WICHTIGSTES GLOBALES FLAG: Wird in allen Teilen der Anwendung geprüft
    // Dies setzen wir IMMER im globalen Scope, damit alle laufenden Prozesse es sehen können
      window._newPollActive = true;
      window.pollClosedEventReceived = false; // Globales Flag zurücksetzen
    
      // Auch ein globales Flag für die Poll-ID setzen, um Race-Conditions zu erkennen
      if (poll.value && poll.value.id) {
        window._currentActivePollId = poll.value.id;
      }
    
      // Alle laufenden Abstimmungen abbrechen
      votingProcess.deactivateVotingSession();
      votingProcess.pollFormSubmitting.value = false;
      votingProcess.isProcessingVotes.value = false;
      votingProcess.currentlyProcessingBatch.value = false;
    
      // Session-ID zurücksetzen
      currentPollSubmissionId.value = null;
    
      // Stimmenzähler zurücksetzen
      pollUserVotedCount.value = 0;
    
      // Alte Formulardaten sicherstellen
      if (oldPollId) {
        localStorage.removeItem(`poll_form_data_${oldPollId}`);
      }
    }
  
    // Wende die Daten an
    poll.value = data.pollLifeCycle.poll;
    pollState.value = data.pollLifeCycle.state;
  
    // KRITISCH: Hier explizit die globale Poll-ID aktualisieren, sobald die Daten angewendet wurden
    // Dies ist entscheidend für korrekte Prüfungen in den anderen Funktionen
    if (poll.value && poll.value.id) {
      window._currentActivePollId = poll.value.id;
      console.warn(`[DEBUG:VOTING] Aktuelle globale Poll-ID aktualisiert: ${window._currentActivePollId}`);
    } else {
    // Bei ungültigen Daten die globale Poll-ID zurücksetzen
      window._currentActivePollId = null;
      console.warn(`[DEBUG:VOTING] Globale Poll-ID zurückgesetzt: null`);
    }
  
    // Wenn dies ein neuer Poll ist, das _newPollReceived Flag setzen
    // KRITISCH: Dies muss direkt nach dem Setzen des Zustands erfolgen
    if (isNewPoll) {
      window._newPollReceived = true;
    }
  
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
        
      // SOFORTAKTION: ResultModal definitiv schließen, bevor alles andere getan wird
      if (resultModal.value) {
        try {        
        // Globales Flag setzen und ResultModal schließen
          window._newPollActive = true;
          resultModal.value.hideModal();
        
          // Alle Status-Flags zurücksetzen
          pollClosedEventReceived.value = false;
        
          // Globale Closure-Flags zurücksetzen
          if (window._isHandlingPollClosure) {
            window._isHandlingPollClosure = false;
            delete window._currentClosureId;
          }
        
          // Nach einer Sekunde nochmal prüfen, ob das Modal wirklich geschlossen ist
          setTimeout(() => {
            if (resultModal.value && resultModal.value.isVisible && resultModal.value.isVisible.value) {
              resultModal.value.hideModal();
            
              // Native Bootstrap Modal API verwenden
              try {
                const modalElement = resultModal.value.modal.value;
                const instance = Modal.getInstance(modalElement);
                if (instance) {
                  instance.hide();
                }
              } catch (domError) {
                console.error('[DEBUG:VOTING] Fehler beim Schließen des Modals:', domError);
              }
            }
          }, 1000);
        } catch (e) {
          console.error('[DEBUG:VOTING] Fehler beim Schließen des ResultModals:', e);
        }
      }
    
      // KRITISCH: Vor dem Zurücksetzen die Werte explizit zurücksetzen
      // Dies ist essentiell, damit beim Öffnen des PollModals nicht fälschlicherweise "Stimme wird abgegeben" angezeigt wird
      votingProcess.pollFormSubmitting.value = false;
      votingProcess.isProcessingVotes.value = false;
      votingProcess.currentlyProcessingBatch.value = false;
    
      // Prüfe, ob wir in einer Split-Vote-Situation sind
      const maxVoteCount = eventUser.value?.voteAmount || 0;
      const currentUsedVoteCount = votingProcess?.usedVotesCount?.value || 0;
      const inSplitVoteSituation = currentUsedVoteCount > 0 && currentUsedVoteCount < maxVoteCount;
      
      // KRITISCHES FIX: Nur zurücksetzen, wenn wir NICHT in einer Split-Vote-Situation sind
      // Bei Split-Voting müssen die Zählerstände erhalten bleiben
      if (!inSplitVoteSituation) {
        // KRITISCH: Das globale votingProcessModule jetzt auch direkt auf 0 setzen
        // Dies stellt sicher, dass die Berechnung in PollForm.vue korrekt ist
        if (typeof window !== 'undefined' && window.votingProcessModule) {
          // console.log("[DEBUG:VOTING] Setze direkt votingProcessModule.usedVotesCount = 0 vor resetVoteCounts");
          window.votingProcessModule.usedVotesCount = 0;
          window.votingProcessModule.voteCounter = 1;
        }
        
        // Vollständiges Zurücksetzen aller Zähler und Status-Werte
        // console.log("[DEBUG:VOTING] Vor resetVoteCounts: usedVotesCount =", votingProcess.usedVotesCount?.value, "voteCounter =", votingProcess.voteCounter?.value);
        
        // KRITISCHE ÄNDERUNG: Setze voteCounter.value AUF JEDEN FALL explizit auf 1
        // Dies ist notwendig, weil dies der Wert ist, der als prop an PollForm gesendet wird
        // und in PollForm.vue für die Berechnung von remainingVotes verwendet wird
        voteCounter.value = 1;
        
        votingProcess.resetVoteCounts();
        // console.log("[DEBUG:VOTING] Nach resetVoteCounts: usedVotesCount =", votingProcess.usedVotesCount?.value, "voteCounter =", votingProcess.voteCounter?.value);
      } else {
        // console.log("[DEBUG:VOTING] Split-Vote-Situation erkannt, Stimmenzähler wird NICHT zurückgesetzt. usedVotesCount =", currentUsedVoteCount, "von", maxVoteCount);
      }
    
      // Auch die aktuelle Abstimmungs-ID zurücksetzen
      currentPollSubmissionId.value = null;
    
      // KRITISCH: Nach einer kurzen Verzögerung nochmals explizit alle UI-Locks zurücksetzen
      // Dies ist eine zusätzliche Sicherheitsmaßnahme gegen hängengebliebene Flags
      setTimeout(() => {
        votingProcess.pollFormSubmitting.value = false;
        votingProcess.isProcessingVotes.value = false;
        votingProcess.currentlyProcessingBatch.value = false;
        pollUserVotedCount.value = 0;
        
        // Erneut prüfen, ob wir in einer Split-Vote-Situation sind
        const timeoutMaxVotes = eventUser.value?.voteAmount || 0;
        const timeoutUsedVotes = votingProcess?.usedVotesCount?.value || 0;
        const timeoutInSplitVoteSituation = timeoutUsedVotes > 0 && timeoutUsedVotes < timeoutMaxVotes;
        
        // Nochmal sicherstellen, dass voteCounter korrekt ist - nur wenn KEINE Split-Vote-Situation vorliegt
        if (!timeoutInSplitVoteSituation && voteCounter.value !== 1) {
          // console.log("[DEBUG:VOTING] voteCounter nochmal korrigiert von", voteCounter.value, "auf 1");
          voteCounter.value = 1;
        } else if (timeoutInSplitVoteSituation) {
          // console.log("[DEBUG:VOTING] Split-Vote-Situation beim Timeout-Check, voteCounter wird nicht zurückgesetzt. Aktuell:", voteCounter.value);
        }
      }, 100);
    
      // Flag nach angemessener Zeit zurücksetzen
      setTimeout(() => {
        window._newPollActive = false;
      }, 2000); // 2 Sekunden sind ausreichend
    
      // Zähler wurde bereits oben auf 1 gesetzt
      // voteCounter.value = 1; // Auskommentiert, da oben bereits gesetzt
    
      // Für einen neuen Poll auch den persistenten Zustand zurücksetzen
      if (poll.value && poll.value.id && props.event && props.event.id) {
        pollStatePersistence.resetVoteState(poll.value.id, props.event.id);
      }

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

              // KRITISCH: Prüfe zuerst die persistierten Daten für diesen Poll
              // Dies verhindert, dass das Modal bei bereits vollständig abgestimmten Polls erneut öffnet
              const persistedUsedVotes = pollStatePersistence.getUsedVotes(poll.value.id, props.event.id);
              // console.log(`[DEBUG:VOTING] Persistierte usedVotes für Poll ${poll.value.id}: ${persistedUsedVotes}, maxVotes: ${maxVotes}`);

              // Wenn persistierte Daten zeigen, dass bereits alle Stimmen abgegeben wurden, verwende diese
              let finalVoteCycle = serverVoteCycle;
              if (persistedUsedVotes >= maxVotes) {
                // console.log(`[DEBUG:VOTING] Persistierte Daten zeigen: Alle Stimmen bereits abgegeben (${persistedUsedVotes}/${maxVotes})`);
                finalVoteCycle = persistedUsedVotes;
              }

              // FIX: Nur überschreiben, wenn der Server-Wert größer ist als der aktuelle Client-Wert
              // Dies verhindert Race Conditions, wenn der Bulk-Vote noch nicht vom Server verarbeitet wurde
              const currentClientValue = votingProcess.usedVotesCount.value;
              if (finalVoteCycle > currentClientValue) {
                console.log(`[DEBUG:VOTING] Server hat höheren Wert (${finalVoteCycle} > ${currentClientValue}), übernehme Server-Wert`);
                votingProcess.usedVotesCount.value = finalVoteCycle;
              } else if (finalVoteCycle < currentClientValue) {
                console.warn(`[DEBUG:VOTING] ⚠️ Server-Wert (${finalVoteCycle}) ist niedriger als Client-Wert (${currentClientValue}), behalte Client-Wert`);
                // Behalte den höheren Client-Wert
              } else {
                console.log(`[DEBUG:VOTING] Server und Client sind synchron (${finalVoteCycle})`);
                votingProcess.usedVotesCount.value = finalVoteCycle;
              }

              // Stelle sicher, dass der Zähler korrekt initialisiert wird
              voteCounter.value = finalVoteCycle + 1;

              // Persistieren, damit future Loads konsistent sind (nur wenn Server-Daten neuer sind)
              if (serverVoteCycle >= persistedUsedVotes) {
                pollStatePersistence.upsertPollState(poll.value.id, voteCounter.value, serverVoteCycle, props.event.id);
              }

              // Prüfen, ob bereits alle Stimmen abgegeben wurden (mit finalVoteCycle statt serverVoteCycle)
              if (finalVoteCycle >= maxVotes) {
                // console.log(`[DEBUG:VOTING] Alle Stimmen bereits abgegeben (${finalVoteCycle}/${maxVotes}), setze pollState auf 'voted'`);
                pollState.value = "voted";
                return;
              }
            
              // Kleine Verzögerung, um sicherzustellen, dass alle Status zurückgesetzt sind
              setTimeout(() => {
              // EXTRA PRÜFUNG: Nur Modal öffnen, wenn wirklich noch Stimmen übrig sind
              // ZUSÄTZLICH: Client-seitigen usedVotesCount prüfen, um Race Conditions zu vermeiden
                const clientUsedVotes = votingProcess.usedVotesCount.value;
                console.log(`[DEBUG:VOTING] Modal-Öffnungsprüfung (pollLifeCycle): maxVotes=${maxVotes}, serverVoteCycle=${serverVoteCycle}, clientUsedVotes=${clientUsedVotes}`);

                // KRITISCH: Prüfen, ob gerade ein ResultModal geöffnet wird oder offen ist
                // Verwende den globalen Tracking-Mechanismus
                if (window._resultModalTracking?.activeModalId) {
                  // console.log('[DEBUG:VOTING] ResultModal ist aktiv (activeModalId gesetzt), PollModal wird nicht geöffnet');
                  return;
                }

                // Zusätzliche Prüfung auf isVisible
                if (resultModal.value?.isVisible?.value) {
                  // console.log('[DEBUG:VOTING] ResultModal ist noch sichtbar, PollModal wird nicht geöffnet');
                  return;
                }

                if (maxVotes > 0 && serverVoteCycle < maxVotes && clientUsedVotes < maxVotes) {
                // VERSTÄRKTE AKTIONEN: Vor dem Öffnen des PollModals
                // 1. Stelle absolut sicher, dass ResultModal geschlossen ist
                  if (resultModal.value) {
                    try {
                      resultModal.value.hideModal();
                    } catch (modalError) {
                      console.error('[DEBUG:VOTING] Fehler beim Schließen des ResultModals:', modalError);
                    }
                  }

                  // 2. Poll-closed-Flag explizit zurücksetzen
                  pollClosedEventReceived.value = false;

                  // 3. Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
                  // ABER NUR wenn es ein neuer Poll ist (serverVoteCycle === 0)
                  // Bei Split-Voting (serverVoteCycle > 0) NICHT zurücksetzen, um die Auswahl zu behalten
                  if (serverVoteCycle === 0) {
                    pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
                    console.log('[DEBUG:VOTING] Neuer Poll: Formular wird zurückgesetzt');
                  } else {
                    console.log(`[DEBUG:VOTING] Split-Voting (pollLifeCycle, Zyklus ${serverVoteCycle}): Formular wird NICHT zurückgesetzt`);
                  }

                  // 4. Eine Verzögerung einbauen um sicherzustellen dass ResultModal wirklich geschlossen ist
                  setTimeout(() => {

                    // Nach erfolgreichem Öffnen des PollModals ist der Poll nicht mehr "neu"
                    if (window._newPollActive) {
                      window._newPollActive = false;
                    }

                    // KRITISCHE FINALE PRÜFUNG: Nochmals prüfen, ob wirklich noch Stimmen übrig sind
                    // Dies verhindert, dass das Modal öffnet, wenn die Stimmen in der Zwischenzeit aufgebraucht wurden
                    const finalUsedVotes = votingProcess.usedVotesCount.value;
                    // Verwende maxVotes aus dem äußeren Scope (bereits aus Server-Daten oder eventUser geladen)
                    const finalMaxVotes = maxVotes;
                    console.log(`[DEBUG:VOTING] Finale Prüfung vor showModal (pollLifeCycleSubscription): finalUsedVotes=${finalUsedVotes}, finalMaxVotes=${finalMaxVotes}`);

                    if (finalUsedVotes >= finalMaxVotes && finalMaxVotes > 0) {
                      console.log(`[DEBUG:VOTING] ABBRUCH: Alle Stimmen bereits abgegeben (${finalUsedVotes}/${finalMaxVotes}), Modal wird NICHT geöffnet`);
                      return;
                    }

                    console.log('[DEBUG:VOTING] >>> Rufe pollModal.showModal() auf (pollLifeCycleSubscription)');
                    pollModal.value?.showModal();
                  }, 250);
                } else {
                  // console.log(`[DEBUG:VOTING] Modal wird NICHT geöffnet - alle Stimmen verbraucht (server=${serverVoteCycle}, client=${clientUsedVotes}, max=${maxVotes})`);
                  pollState.value = "voted";
                }
              }, 100);
            } else {
            // Fallback - Keine Server-Daten verfügbar, normales Verhalten
              setTimeout(() => {
              // Sicherstellen, dass der voteCounter neu initialisiert wird
                voteCounter.value = 1;

                // EXTRA PRÜFUNG: Nur Modal öffnen, wenn wirklich noch Stimmen übrig sind
                const clientUsedVotes = votingProcess.usedVotesCount.value;
                const maxVotes = eventUser.value?.voteAmount || 0;
                // console.log(`[DEBUG:VOTING] Modal-Öffnungsprüfung (Fallback): maxVotes=${maxVotes}, clientUsedVotes=${clientUsedVotes}`);
                if (maxVotes > 0 && clientUsedVotes < maxVotes) {
                // VERSTÄRKTE AKTIONEN: Vor dem Öffnen des PollModals
                // 1. Stelle absolut sicher, dass ResultModal geschlossen ist
                  if (resultModal.value) {
                    try {
                      resultModal.value.hideModal();
                    } catch (modalError) {
                      console.error('[DEBUG:VOTING] Fehler beim Schließen des ResultModals:', modalError);
                    }
                  }

                  // 2. Poll-closed-Flag explizit zurücksetzen
                  pollClosedEventReceived.value = false;

                  // 3. Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
                  // ABER NUR wenn es ein neuer Poll ist (clientUsedVotes === 0)
                  // Bei Split-Voting (clientUsedVotes > 0) NICHT zurücksetzen, um die Auswahl zu behalten
                  if (clientUsedVotes === 0) {
                    pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
                    console.log('[DEBUG:VOTING] Neuer Poll (Fallback): Formular wird zurückgesetzt');
                  } else {
                    // console.log(`[DEBUG:VOTING] Split-Voting (Fallback, ${clientUsedVotes} verwendet): Formular wird NICHT zurückgesetzt`);
                  }

                  // 4. Eine Verzögerung einbauen um sicherzustellen dass ResultModal wirklich geschlossen ist
                  setTimeout(() => {
                  // Nach erfolgreichem Öffnen des PollModals ist der Poll nicht mehr "neu"
                    if (window._newPollActive) {
                      window._newPollActive = false;
                    }

                    // KRITISCHE FINALE PRÜFUNG: Nochmals prüfen, ob wirklich noch Stimmen übrig sind
                    const finalUsedVotes = votingProcess.usedVotesCount.value;
                    // Verwende maxVotes aus dem äußeren Scope
                    const finalMaxVotes = maxVotes;
                    console.log(`[DEBUG:VOTING] Finale Prüfung vor showModal (Fallback 1): finalUsedVotes=${finalUsedVotes}, finalMaxVotes=${finalMaxVotes}`);

                    if (finalUsedVotes >= finalMaxVotes && finalMaxVotes > 0) {
                      console.log(`[DEBUG:VOTING] ABBRUCH (Fallback): Alle Stimmen bereits abgegeben (${finalUsedVotes}/${finalMaxVotes}), Modal wird NICHT geöffnet`);
                      return;
                    }

                    console.log('[DEBUG:VOTING] >>> Rufe pollModal.showModal() auf (Fallback 1)');
                    pollModal.value?.showModal();
                  }, 250);
                } else {
                  // console.log(`[DEBUG:VOTING] Modal wird NICHT geöffnet (Fallback) - alle Stimmen verbraucht (client=${clientUsedVotes}, max=${maxVotes})`);
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
            const clientUsedVotes = votingProcess.usedVotesCount.value;
            const maxVotes = eventUser.value?.voteAmount || 0;
            // console.log(`[DEBUG:VOTING] Modal-Öffnungsprüfung (Fallback 2): maxVotes=${maxVotes}, clientUsedVotes=${clientUsedVotes}`);
            if (maxVotes > 0 && clientUsedVotes < maxVotes) {
            // VERSTÄRKTE AKTIONEN: Vor dem Öffnen des PollModals
            // 1. Stelle absolut sicher, dass ResultModal geschlossen ist
              if (resultModal.value) {
                try {
                  resultModal.value.hideModal();
                } catch (modalError) {
                  console.error('[DEBUG:VOTING] Fehler beim Schließen des ResultModals:', modalError);
                }
              }

              // 2. Poll-closed-Flag explizit zurücksetzen
              pollClosedEventReceived.value = false;

              // 3. Vor dem Öffnen des Modals sicherstellen, dass die Form korrekt zurückgesetzt wird
              // ABER NUR wenn es ein neuer Poll ist (clientUsedVotes === 0)
              // Bei Split-Voting (clientUsedVotes > 0) NICHT zurücksetzen, um die Auswahl zu behalten
              if (clientUsedVotes === 0) {
                pollModal.value?.reset(false); // Vollständiges Zurücksetzen erzwingen
                console.log('[DEBUG:VOTING] Neuer Poll (Fallback 2): Formular wird zurückgesetzt');
              } else {
                // console.log(`[DEBUG:VOTING] Split-Voting (Fallback 2, ${clientUsedVotes} verwendet): Formular wird NICHT zurückgesetzt`);
              }

              // 4. Eine Verzögerung einbauen um sicherzustellen dass ResultModal wirklich geschlossen ist
              setTimeout(() => {
              // Nach erfolgreichem Öffnen des PollModals ist der Poll nicht mehr "neu"
                if (window._newPollActive) {
                  window._newPollActive = false;
                }

                // KRITISCHE FINALE PRÜFUNG: Nochmals prüfen, ob wirklich noch Stimmen übrig sind
                const finalUsedVotes = votingProcess.usedVotesCount.value;
                // Verwende maxVotes aus dem äußeren Scope
                const finalMaxVotes = maxVotes;
                console.log(`[DEBUG:VOTING] Finale Prüfung vor showModal (Fallback 2): finalUsedVotes=${finalUsedVotes}, finalMaxVotes=${finalMaxVotes}`);

                if (finalUsedVotes >= finalMaxVotes && finalMaxVotes > 0) {
                  console.log(`[DEBUG:VOTING] ABBRUCH (Fallback 2): Alle Stimmen bereits abgegeben (${finalUsedVotes}/${finalMaxVotes}), Modal wird NICHT geöffnet`);
                  return;
                }

                console.log('[DEBUG:VOTING] >>> Rufe pollModal.showModal() auf (Fallback 2)');
                pollModal.value?.showModal();
              }, 250);
            } else {
              // console.log(`[DEBUG:VOTING] Modal wird NICHT geöffnet (Fallback 2) - alle Stimmen verbraucht (client=${clientUsedVotes}, max=${maxVotes})`);
              pollState.value = "voted";
            }
          }, 100);
        }
      }
    } else if (pollState.value === "closed") {
    // KRITISCH: Wenn wir bereits markiert haben, dass der Poll geschlossen ist, nichts weiter tun
      if (pollClosedEventReceived.value) {
        console.warn("[DEBUG:VOTING] Poll wurde bereits als geschlossen markiert, ignoriere weiteres Event");
        return;
      }
    
      // Markiere global, dass der Poll geschlossen wurde, um weitere Event-Verarbeitung zu blockieren
      pollClosedEventReceived.value = true;
    
      // Globale statische Flag für diesen Prozess, um parallele Closure-Behandlungen zu verhindern
      // Dies ist wichtig, weil ref() hier bei mehrfachen Aufrufen immer neue Instances erstellt
      // VERBESSERT: Wir setzen die Flag, lassen aber dennoch die kritischen Reset-Operationen durchlaufen
      const isAlreadyHandlingClosure = !!window._isHandlingPollClosure;
    
      // Die Flag immer setzen, damit keine neuen Instanzen starten
      window._isHandlingPollClosure = true;
    
      // Neuer Ansatz: Wir führen IMMER kritische Sicherheitsmaßnahmen durch,
      // unabhängig davon, ob bereits eine Instanz läuft. Nur komplexe Operationen werden
      // nur einmal ausgeführt.
    
      // KRITISCHE SOFORTAKTIONEN - IMMER AUSFÜHREN!
    
      // 1. Alle UI-Sperren sofort freigeben
      // votingProcess.releaseUILocks();
      // votingProcess.isProcessingVotes.value = false;
      // votingProcess.pollFormSubmitting.value = false;
      // votingProcess.currentlyProcessingBatch.value = false;
      // votingProcess.deactivateVotingSession();
    
      // 2. Poll-Modal GARANTIERT sofort schließen
      if (pollModal.value) {
        pollModal.value.hideModal();
      
        // Sicherheitsabfrage: Bootstrap-Modal direkt ansprechen falls vorhanden
        try {
          if (pollModal.value.modal && pollModal.value.modal.value) {
            const modalElement = pollModal.value.modal.value;
          
            // Versuche über die native Bootstrap-Funktion
            if (typeof Modal !== 'undefined' && Modal.getInstance) {
              const instance = Modal.getInstance(modalElement);
              if (instance) {
                instance.hide();
              }
            }
          
            // Native Bootstrap 5 API verwenden
          
            // Direkter Zugriff auf die Bootstrap Modal-Instanz
            const instance = Modal.getInstance(modalElement);
            if (instance) {
              instance.hide();
            }
          }
        } catch (e) {
          console.error("[DEBUG:VOTING] Fehler beim direkten Modal-Zugriff:", e);
        }
      }
    
      // 3. Status als geschlossen markieren
      pollState.value = "closed";
    
      // Wenn bereits eine vollständige Verarbeitung läuft, hier zurückkehren
      if (isAlreadyHandlingClosure) {
        console.warn("[DEBUG:VOTING] Poll-Schließung wird bereits vollständig verarbeitet");
        return;
      }
    
      try {
      // Alle laufenden Abstimmungsvorgänge sofort abbrechen, unabhängig vom Modalzustand
        console.warn("[DEBUG:VOTING] Poll geschlossen, breche alle laufenden Prozesse ab");
      
        // HARTE RESET-SEQUENZ: Alle Flags und Zustände in einer festgelegten Reihenfolge zurücksetzen
      
        // 1. Zuerst alle aktiven Sessions deaktivieren
        votingProcess.deactivateVotingSession();
      
        // 2. Dann die Batch-Verarbeitung stoppen, damit keine weiteren Events mehr verarbeitet werden
        votingProcess.currentlyProcessingBatch.value = false;
      
        // 3. Dann Zähler zurücksetzen, um wiederholte Event-Verarbeitung zu verhindern
        pollUserVotedCount.value = 0;
        currentPollSubmissionId.value = null;
      
        // 4. Dann UI-Sperren freigeben
        votingProcess.releaseUILocks();
        votingProcess.isProcessingVotes.value = false;
        votingProcess.pollFormSubmitting.value = false;
      
        // 5. Explizit das Poll-Modal schließen
        if (pollModal.value) {
        // Zuerst alle Flags zurücksetzen
          pollModal.value.isSubmitting = false;
        
          if (pollModal.value.pollForm) {
            pollModal.value.pollForm.isSubmitting = false;
          }
        
          // Dann das Modal schließen
          pollModal.value.hideModal();
        }
      
        // Benachrichtigung nur anzeigen, wenn tatsächlich eine Abstimmung im Gange war
        if (votingProcess.isActiveVotingSession() || votingProcess.isProcessingVotes.value || 
          votingProcess.pollFormSubmitting.value || votingProcess.currentlyProcessingBatch.value) {
          toast(t("view.polls.info.pollClosed"), { type: "info" });
        }
      
        // 6. Ergebnisanzeige vorbereiten
        showMoreEnabled.value = true;
        page.value = 0;
        pollResults.value = [];
      
        // Status sofort als geschlossen markieren, um weitere Verarbeitung zu verhindern
        pollState.value = "closed";
      
        // 7. Wir laden die Ergebnisse mit einer kontrollierten Verzögerung, 
        // um sicherzustellen, dass die UI-Updates abgeschlossen sind
      
        // Wartezeit bevor wir Ergebnisse laden - längere Zeit für stabilere UI
        const RESULTS_DELAY = 500;
      
        // WICHTIG: Wir verwenden eine eindeutige ID für diesen Vorgang
        // um sicherzustellen, dass nur ein einziger Prozess die Ergebnisse anzeigt
        const closureId = Date.now();
        window._currentClosureId = closureId;
      
        setTimeout(async () => {
          try {
          // Prüfe, ob wir noch der aktuelle Closure-Prozess sind
            if (window._currentClosureId !== closureId) {
              console.warn("[DEBUG:VOTING] Ein neuerer Closure-Prozess wurde gestartet, breche ab");
              window._isHandlingPollClosure = false;
              return;
            }
                    
            // SOFORT beim Poll-Schließen nochmals alle PollModals schließen
            // Diese Sicherheitsmaßnahme wird IMMER ausgeführt
            if (pollModal.value) {
              try {
              // Nochmal alle UI-Locks aufheben
                votingProcess.releaseUILocks();
                votingProcess.isProcessingVotes.value = false;
                votingProcess.pollFormSubmitting.value = false;
              
                // Dann das Modal definitiv schließen
                pollModal.value.hideModal();
                console.warn("[DEBUG:VOTING] PollModal vor Ergebnisanzeige geschlossen");
              } catch (e) {
                console.error('[DEBUG:VOTING] Fehler beim erneuten Schließen des PollModals:', e);
              }
            }
          
            // Ergebnisse aggressiv und mit hoher Priorität neu laden
            try {            
            // Zurücksetzen des Zustands für eine frische Abfrage
              pollResults.value = [];
              page.value = 0;
            
              // Zuerst ein hartes Refetch durchführen, das den Apollo-Cache umgeht
              const networkOnlyFetch = await apolloClient.query({
                query: POLLS_RESULTS,
                variables: { eventId: props.event.id, page: 0, pageSize: pageSize.value },
                fetchPolicy: 'network-only', // Immer vom Server laden
                errorPolicy: 'all'
              });
            
              if (networkOnlyFetch.data?.pollResult) {
              // Daten direkt ins pollResults setzen
                pollResults.value = [...networkOnlyFetch.data.pollResult];
              
                // Speziell das letzte/neueste Ergebnis als lastPollResult setzen
                if (networkOnlyFetch.data.pollResult.length > 0) {
                  const sortedResults = [...networkOnlyFetch.data.pollResult].sort(
                    (a, b) => b.createDatetime - a.createDatetime
                  );
                  lastPollResult.value = sortedResults[0];
                }
              } else {
                console.warn('[DEBUG:VOTING] Direkte Abfrage lieferte keine Ergebnisse');
              }
            
              // Zusätzlich den normalen Refetch durchführen, um Apollo upzudaten
              await pollResultsQuery.refetch();
            } catch (loadError) {
              console.error('[DEBUG:VOTING] Fehler beim Laden der Ergebnisse:', loadError);
            
              // Fallback: Versuche nochmal den normalen Refetch
              try {
                await pollResultsQuery.refetch();
              } catch (e) {
                console.error('[DEBUG:VOTING] Auch Fallback-Refetch fehlgeschlagen:', e);
              }
            }
          
            // Kurze Verzögerung, um sicherzustellen, dass alle UI-Updates abgeschlossen sind
            setTimeout(() => {
              try {
              // Prüfe erneut, ob wir noch der aktuelle Closure-Prozess sind
                if (window._currentClosureId !== closureId) {
                  console.warn("[DEBUG:VOTING] Ein neuerer Closure-Prozess wurde gestartet, breche Modal-Anzeige ab");
                  window._isHandlingPollClosure = false;
                  return;
                }
              
                // Poll ist garantiert geschlossen
                pollState.value = "closed";
              
                // GARANTIERTE SOFORTAKTION: Poll immer direkt im Objekt als geschlossen markieren,
                // damit reactive Watches ausgelöst werden
                if (poll.value) {
                  poll.value.closed = true;
                }
              
                // SICHERHEIT: Zuerst aktives PollModal schließen, falls es noch offen ist
                if (pollModal.value) {
                  try {
                    console.warn('[DEBUG:VOTING] Schließe PollModal definitiv vor Ergebnisanzeige');
                    pollModal.value.hideModal();
                  } catch (e) {
                    console.error('[DEBUG:VOTING] Fehler beim Schließen des PollModals vor Ergebnisanzeige:', e);
                  }
                }
              
                // Verzögerung für UI-Synchronisation
                setTimeout(() => {
                  try {
                  // WICHTIG: Prüfen, ob lastPollResult tatsächlich gesetzt wurde
                    if (!lastPollResult.value && pollResults.value.length > 0) {
                    // Sicherheitscode: Wenn lastPollResult noch nicht gesetzt wurde, aber Ergebnisse vorhanden sind
                      const sortedResults = [...pollResults.value].sort(
                        (a, b) => b.createDatetime - a.createDatetime
                      );
                      lastPollResult.value = sortedResults[0];
                    }
                
                    // Nochmals explizit prüfen, ob wir ein Ergebnis zum Anzeigen haben
                    if (lastPollResult.value) {
                    
                      // VEREINFACHT: Direkter Zugriff auf ResultModal ohne komplexe Prüfungen
                      if (resultModal.value) {                      
                      // Besser: Prüfen, ob wir eine normale update-Methode haben
                        if (typeof resultModal.value.updatePollResult === 'function') {
                          resultModal.value.updatePollResult(lastPollResult.value);
                        }                       
                        // Dann das Modal anzeigen
                        resultModal.value.showModal();
                      } else {
                        console.warn('[DEBUG:VOTING] ResultModal ist nicht verfügbar');
                      }
                    } else {
                      console.warn('[DEBUG:VOTING] Kein Ergebnis zum Anzeigen verfügbar!');
                    }
                  } catch (e) {
                    console.error('[DEBUG:VOTING] Fehler beim Anzeigen des ResultModals:', e);
                  } finally {
                  // Closure-Handling als abgeschlossen markieren
                    window._isHandlingPollClosure = false;
                  }
                }, 200); // Ausreichende Verzögerung für UI-Updates
              } catch (e) {
                console.error('[DEBUG:VOTING] Fehler bei ResultModal-Anzeige:', e);
                window._isHandlingPollClosure = false;
              }
            }, 300); // Kurze Verzögerung für stabile UI-Aktualisierung
          } catch (error) {
            console.error("Fehler beim Laden der Ergebnisse:", error);
            window._isHandlingPollClosure = false;
          }
        }, RESULTS_DELAY); // Längere Verzögerung für stabile UI-Aktualisierung
      } catch (error) {
        console.error("Fehler bei der Verarbeitung der Poll-Schließung:", error);
        window._isHandlingPollClosure = false;
      }
    }
  } finally {
    // Stelle sicher, dass isProcessingLifeCycleEvent immer zurückgesetzt wird
    isProcessingLifeCycleEvent.value = false;
    
    // Stelle sicher, dass Flags zurückgesetzt werden
    setTimeout(() => {
      window._newPollActive = false;
    }, 5000);
  }
});

// Die Zustandsvariable ist bereits oben definiert

const pollAnswerLifeCycleSubscription = useSubscription(
  POLL_ANSWER_LIVE_CYCLE,
  { eventId: props.event.id }
);
pollAnswerLifeCycleSubscription.onResult(async ({ data }) => {
  // Sofortige Checks zur Verhinderung unnötiger Verarbeitung
  // 1. Prüfe, ob das Event gültige Daten enthält
  if (!data?.pollAnswerLifeCycle) {
    return;
  }
  
  // Prüfe, ob ein neuer Poll aktiv ist
  if (window._newPollActive) {
    console.warn("[DEBUG:VOTING] Neuer Poll aktiv, ignoriere alte Answer-Events");
    
    // Flags zurücksetzen
    pollClosedEventReceived.value = false;
    
    // Freigabe ALLER UI-Sperren als Schutzmaßnahme
    votingProcess.releaseUILocks();
    votingProcess.currentlyProcessingBatch.value = false;
    votingProcess.isProcessingVotes.value = false;
    votingProcess.pollFormSubmitting.value = false;
    
    // Deaktiviere ALLE aktiven Voting-Sessions
    votingProcess.deactivateVotingSession();
    
    // Globale Flags auch zurücksetzen
    currentPollSubmissionId.value = null;
    pollUserVotedCount.value = 0;
    
    // NEUHEIT: Poll-State explizit auf "new" setzen
    if (poll.value && poll.value.id) {
      pollState.value = "new";
    }
    
    // Beende die Verarbeitung sofort, um für den neuen Poll bereit zu sein
    return;
  }
  
  // 2. KRITISCHE FLAG-PRÜFUNG:
  // Wenn wir bereits ein closed-Event erhalten haben, ignorieren wir alle weiteren Events für diesen Poll
  if (pollClosedEventReceived.value || pollState.value === "closed") {
    console.warn("[DEBUG:VOTING] Poll wurde bereits geschlossen, ignoriere weiteres Answer-Event");
    
    // Freigabe ALLER UI-Sperren als Schutzmaßnahme
    votingProcess.releaseUILocks();
    votingProcess.currentlyProcessingBatch.value = false;
    votingProcess.isProcessingVotes.value = false;
    votingProcess.pollFormSubmitting.value = false;
    
    // Deaktiviere ALLE aktiven Voting-Sessions
    votingProcess.deactivateVotingSession();
    
    // WICHTIG: Auch die globalen Flags zurücksetzen
    currentPollSubmissionId.value = null;
    pollUserVotedCount.value = 0;
    
    // Setze das Poll-Modal zurück und schließe es definitiv
    if (pollModal.value) {
      pollModal.value.isSubmitting = false;
      if (pollModal.value.pollForm) {
        pollModal.value.pollForm.isSubmitting = false;
      }
      pollModal.value.hideModal();
    }
        
    // Beende die Verarbeitung sofort ohne weitere Aktionen
    return;
  }
  
  // 3. KRITISCHE POLL-ZUSTANDS-PRÜFUNG: 
  // Prüfe explizit, ob der Poll bereits geschlossen ist
  if (poll.value && poll.value.closed) {
    console.warn("[DEBUG:VOTING] Poll ist geschlossen, aber Subscription-Event empfangen. Setze closed-Flag und ignoriere Event.");
    
    // Markiere explizit, dass wir ein closed-Event erhalten haben, um weitere Verarbeitung zu blockieren
    pollClosedEventReceived.value = true;
    pollState.value = "closed";
    
    // SOFORT ALLE UI-SPERREN AUFHEBEN, um UI-Blockaden zu vermeiden
    votingProcess.releaseUILocks();
    votingProcess.currentlyProcessingBatch.value = false;
    votingProcess.isProcessingVotes.value = false;
    votingProcess.pollFormSubmitting.value = false;
    
    // WICHTIG: Auch die globalen Flags zurücksetzen
    currentPollSubmissionId.value = null;
    pollUserVotedCount.value = 0;
    
    // Deaktiviere ALLE aktiven Voting-Sessions
    votingProcess.deactivateVotingSession();
    
    // Poll-Modal zurücksetzen und definitiv schließen
    if (pollModal.value) {
      pollModal.value.isSubmitting = false;
      if (pollModal.value.pollForm) {
        pollModal.value.pollForm.isSubmitting = false;
      }
      pollModal.value.hideModal();
    }
    
    // Beende die Verarbeitung sofort
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
    // Partial votes used
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
        toast(t("view.results.noMoreResults"), { type: "info" });
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
      toast(t("view.polls.info.stillProcessing"), { type: "info" });
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
    
    // KRITISCH: Nach der Pause nochmals alle Zustände prüfen und explizit zurücksetzen
    // Dies ist essentiell, um sicherzustellen, dass alle UI-Flags korrekt sind
    if (votingProcess.pollFormSubmitting.value === true) {
      console.warn("[DEBUG:VOTING] pollFormSubmitting ist nach dem Reset immer noch true! Setze explizit zurück.");
      votingProcess.pollFormSubmitting.value = false;
    }
    
    if (votingProcess.isProcessingVotes.value === true) {
      console.warn("[DEBUG:VOTING] isProcessingVotes ist nach dem Reset immer noch true! Setze explizit zurück.");
      votingProcess.isProcessingVotes.value = false;
    }
    
    if (votingProcess.currentlyProcessingBatch.value === true) {
      console.warn("[DEBUG:VOTING] currentlyProcessingBatch ist nach dem Reset immer noch true! Setze explizit zurück.");
      votingProcess.currentlyProcessingBatch.value = false;
    }

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
        
        // Spezifische Nachricht anzeigen, falls Poll während der Abstimmung geschlossen wurde
        if (typeof window !== 'undefined' && window._pollClosedDuringVoting === true) {
          const successfulVotes = window._successfulVotesBeforeClose || 0;
          // Spezifische Benachrichtigung für geschlossene Poll
          toast(`Poll wurde während der Abstimmung geschlossen. ${successfulVotes} Stimme(n) wurden gezählt.`, { type: "info" });
          // Flags zurücksetzen
          window._pollClosedDuringVoting = false;
          window._successfulVotesBeforeClose = 0;
        } else {
          // Standard-Fehlerbenachrichtigung
          toast("Fehler bei der Stimmabgabe", { type: "warning" });
        }
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
        
        // NEUE KOORDINATION: Event direkt an resetSubmittingState durchreichen
        if (typeof pollModal.value.resetSubmittingState === 'function') {
          try {
            pollModal.value.resetSubmittingState();
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Aufruf von resetSubmittingState:', e);
          }
        }
      }
      
      // NEUES EVENTBASIERTES SYSTEM: Globale Events auslösen zur UI-Koordination - MIT RATE LIMITING
      if (typeof window !== 'undefined') {
        try {
          // Prüfen, ob in den letzten 100ms bereits ein Event ausgelöst wurde
          const now = Date.now();
          const minTimeBetweenEvents = 100; // ms
          
          if (!window._lastSyncDashboardEventTimestamp || (now - window._lastSyncDashboardEventTimestamp) > minTimeBetweenEvents) {
            // Event-Timestamp aktualisieren
            window._lastSyncDashboardEventTimestamp = now;
            
            // Eindeutige ID für das Event
            const uniqueId = `sync-dashboard-${now}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Event auslösen
            window.dispatchEvent(new CustomEvent('voting:complete', { 
              detail: { timestamp: now, id: uniqueId, source: 'syncDashboard' }
            }));
          }
        } catch (e) {
          console.error('[DEBUG:VOTING] Fehler beim Auslösen des globalen voting:complete Event:', e);
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
          
          // NEUE KOORDINATION: Event direkt an resetSubmittingState durchreichen
          if (typeof pollModal.value.resetSubmittingState === 'function') {
            try {
              pollModal.value.resetSubmittingState();
            } catch (e) {
              console.error('[DEBUG:VOTING] Fehler beim Aufruf von resetSubmittingState im Timeout:', e);
            }
          }
        }
        
        // Erneut globales Event auslösen zur garantierten UI-Koordination mit Rate Limiting
        if (typeof window !== 'undefined') {
          try {
            // Prüfen, ob in den letzten 150ms bereits ein Event ausgelöst wurde
            const now = Date.now();
            const minTimeBetweenEvents = 150; // ms - größere Pause für Timeout-Events
            
            if (!window._lastTimeoutEventTimestamp || (now - window._lastTimeoutEventTimestamp) > minTimeBetweenEvents) {
              // Event-Timestamp aktualisieren
              window._lastTimeoutEventTimestamp = now;
              
              // Eindeutige ID für das Event
              const uniqueId = `sync-timeout-${now}-${Math.random().toString(36).substring(2, 9)}`;
              
              // Event auslösen
              window.dispatchEvent(new CustomEvent('voting:complete', { 
                detail: { timestamp: now, id: uniqueId, isTimeout: true, source: 'syncDashboardTimeout' }
              }));
            } 
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Auslösen des globalen voting:complete Event im Timeout:', e);
          }
        }
      }, 1000);
      
      // Wichtig: Bei Erfolg setzen wir NICHT zurück - das passiert erst durch das pollAnswerLifeCycle-Event!
      
    } catch (error) {
      console.error('Fehler bei der Stimmverarbeitung:', error);
      success = false;
      
      // Aktive Session als fehlgeschlagen markieren
      votingProcess.deactivateVotingSession();
      
      // Globales Error-Event auslösen
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('voting:error', { 
            detail: { timestamp: Date.now(), error: error }
          }));
        } catch (e) {
          console.error('[DEBUG:VOTING] Fehler beim Auslösen des voting:error Events:', e);
        }
      }
      
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
  
  // KRITISCH: Globales Reset-Event auslösen für neue Event-basierte Koordination
  // Dies wird von PollModal.vue abgefangen, um das isSubmitting-Flag zurückzusetzen
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('voting:reset', { 
        detail: { timestamp: Date.now() }
      }));
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler beim Auslösen des globalen voting:reset Event:', e);
    }
  }
  
  // Direkter Aufruf von resetSubmittingState, falls verfügbar
  if (pollModal?.value?.resetSubmittingState) {
    try {
      pollModal.value.resetSubmittingState();
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler beim Aufruf von resetSubmittingState in resetUIAfterSubmission:', e);
    }
  }
  
  try {
    // Prüfen, ob wir alle Stimmen verwendet haben
    const allVotesUsed = (totalAllowedVotes > 0 && usedVotes >= totalAllowedVotes) || votingProcess.votingFullyCompleted.value;
    const partialVotesUsed = (usedVotes > 0 && usedVotes < totalAllowedVotes && !votingProcess.votingFullyCompleted.value);
    
    // Stimmzähler korrigieren, falls durch Reload mehr Stimmen gezählt wurden als maximal erlaubt
    if (usedVotes > totalAllowedVotes) {
      console.warn(`[DEBUG:VOTING] UI-Reset: Stimmenzähler korrigiert: ${usedVotes} auf ${totalAllowedVotes}`);
      votingProcess.usedVotesCount.value = totalAllowedVotes;
    }
    
    // Erste Sicherheitsmaßnahme: Entferne alle verbleibenden modal-backdrop Elemente
    try {
      // Backdrop entfernen
      const backdrops = document.getElementsByClassName('modal-backdrop');
      if (backdrops.length > 0) {
        // Array.from verwenden, da die HTMLCollection sich verändert bei DOM-Änderungen
        Array.from(backdrops).forEach(backdrop => {
          if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
        });
      }
      
      // Body-Styles zurücksetzen
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    } catch (cleanupErr) {
      console.error("[DEBUG:VOTING] Fehler beim Bereinigen der Modal-Elemente:", cleanupErr);
    }
    
    // Bei komplett abgeschlossener Abstimmung (alle Stimmen genutzt) Modal schließen
    if (allVotesUsed) {
      ensureUIIsUnlocked();
      // Sicherstellen, dass das Modal geschlossen wird
      if (pollModal.value) {
        pollModal.value.hideModal();
      }
      
      // Status auf "abgestimmt" setzen
      pollState.value = "voted";
      
      // Vollständige Abstimmung markieren
      votingProcess.votingFullyCompleted.value = true;
    } else if (partialVotesUsed) {
      // Bei nur teilweise abgegebenen Stimmen das Modal neu öffnen,
      // damit der Benutzer weitere Stimmen abgeben kann
      
      // KRITISCH: Vorherige UI-Sperren SOFORT zurücksetzen,
      // um sicherzustellen, dass das Modal überhaupt geöffnet werden kann
      votingProcess.isProcessingVotes.value = false;
      votingProcess.pollFormSubmitting.value = false;
      votingProcess.currentlyProcessingBatch.value = false;
      
      // Alle UI-Komponenten zurücksetzen
      if (pollModal.value) {
        pollModal.value.isSubmitting = false;
        
        if (pollModal.value.pollForm) {
          pollModal.value.pollForm.isSubmitting = false;
        }
        
        // Verzögerung für UI-Aktualisierung wichtig, damit alle Events verarbeitet sind
        setTimeout(() => {          
          // KRITISCH: Nochmals alle Flags zurücksetzen, um sicherzustellen,
          // dass die UI wirklich entsperrt ist
          votingProcess.isProcessingVotes.value = false;
          votingProcess.pollFormSubmitting.value = false;
          votingProcess.currentlyProcessingBatch.value = false;
          
          // Deaktiviere alle aktiven Voting-Sessions
          votingProcess.deactivateVotingSession();

          // KRITISCH: Bei Split-Voting das Modal NICHT schließen und NICHT zurücksetzen!
          // Das Modal bleibt einfach offen und der Benutzer kann direkt weitervoten
          // DEAKTIVIERT: Formular zurücksetzen und Modal schließen/neu öffnen
          // Dies verhindert, dass die Auswahl verloren geht und usedVotesCount auf 0 gesetzt wird
          // eslint-disable-next-line no-constant-condition
          if (false && pollModal.value) {  // DEAKTIVIERT durch if (false)
            pollModal.value.reset(false);

            // KRITISCH: Prüfe, ob aktuell ein Modal offen ist
            // Wenn ja, schließen wir es zuerst, bevor wir versuchen ein neues zu öffnen
            try {
              // Versuche, das Modal zu schließen
              pollModal.value.hideModal();
              
              // Kurze Verzögerung, um sicherzustellen, dass das Modal vollständig geschlossen ist
              setTimeout(() => {
                // Stelle sicher, dass der Poll nicht geschlossen ist
                if (poll.value && !poll.value.closed && pollState.value !== "closed") {
                  // Nochmals UI-Locks zurücksetzen vor dem Öffnen
                  votingProcess.isProcessingVotes.value = false;
                  votingProcess.pollFormSubmitting.value = false;
                  votingProcess.currentlyProcessingBatch.value = false;
                  
                  // Verzögerung einbauen, um sicherzustellen, dass das DOM vollständig aufgebaut ist
                  setTimeout(() => {
                    // Versuche das Modal zu öffnen mit erhöhter Sicherheit
                    try {
                      
                      // Einfach versuchen, showModal direkt aufzurufen, ohne weitere Validierung
                      if (pollModal.value) {
                        // Explizit das Modal-Element neu initialisieren falls nötig
                        if (typeof Modal !== 'undefined' && (!pollModal.value.bootstrapModal || !pollModal.value.modal)) {
                          try {
                            // Prüfen, ob das DOM-Element existiert
                            const modalElement = document.getElementById('pollModal');
                            if (modalElement) {
                              // Neues Bootstrap Modal erstellen
                              const newBootstrapModal = new Modal(modalElement);
                              pollModal.value.bootstrapModal = newBootstrapModal;
                              pollModal.value.modal = ref(modalElement);
                            }
                          } catch (initErr) {
                            console.error("[DEBUG:VOTING] Fehler bei Modal-Neuinitialisierung:", initErr);
                          }
                        }
                        
                        // Nach möglicher Neuinitialisierung aufrufen
                        pollModal.value.showModal();
                      } else {
                        console.error("[DEBUG:VOTING] Modal-DOM-Element nicht verfügbar - pollModal.value ist null");
                      }
                    } catch (modalErr) {
                      console.error("[DEBUG:VOTING] Fehler beim Öffnen des Modals:", modalErr);
                    }
                  }, 150); // Kurze Verzögerung, damit das DOM aktualisiert werden kann
                  
                  // Nochmals explizit UI-Sperren zurücksetzen nach dem Öffnen
                  setTimeout(() => {
                    votingProcess.isProcessingVotes.value = false;
                    votingProcess.pollFormSubmitting.value = false;
                    votingProcess.currentlyProcessingBatch.value = false;
                  }, 100);
                } else {
                  console.warn(`[DEBUG:VOTING] Modal nicht geöffnet, da Poll geschlossen ist`);
                }
              }, 200); // Warte 200ms nach dem Schließen
            } catch (modalErr) {
              console.error("[DEBUG:VOTING] Fehler beim Verarbeiten des Modals:", modalErr);
              
              // Trotz Fehler versuchen, das Modal zu öffnen
              if (poll.value && !poll.value.closed && pollState.value !== "closed") {
                try {
                  pollModal.value.showModal();
                } catch (emergencyErr) {
                  console.error("[DEBUG:VOTING] Auch Notfallversuch fehlgeschlagen:", emergencyErr);
                }
              }
            }
          } else {
            console.error("[DEBUG:VOTING] pollModal.value ist nicht verfügbar!");
          }
        }, 300); // Kürzere Verzögerung für stabilere Verarbeitung
      }
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
    console.warn(`[DEBUG:VOTING] Verbleibende Stimmen: ${votesLeft}/${totalAllowedVotes}`);
    
    // DEAKTIVIERT: Notfall-Wiedereröffnung nicht mehr nötig, da Modal bei Split-Voting offen bleibt
    // Zusätzlicher Sicherheitscheck: nach einer Zeit nochmals prüfen,
    // ob der Modal-Dialog tatsächlich geöffnet wurde
    // eslint-disable-next-line no-constant-condition
    if (false && partialVotesUsed) {  // DEAKTIVIERT durch if (false)
      setTimeout(() => {
        // Wenn wir noch Stimmen übrig haben und das Modal nicht angezeigt wird
        if (poll.value && !poll.value.closed &&
            pollState.value !== "closed" &&
            pollModal.value &&
            (!pollModal.value.isVisible || !pollModal.value.isVisible.value)) {

          console.warn(`[DEBUG:VOTING] NOTFALL-WIEDERERÖFFNUNG: Modal wurde nicht korrekt geöffnet`);
          
          // Nochmals explizit alle UI-Locks zurücksetzen
          votingProcess.isProcessingVotes.value = false;
          votingProcess.pollFormSubmitting.value = false;
          votingProcess.currentlyProcessingBatch.value = false;
          
          // Auch das Modal zurücksetzen
          pollModal.value.isSubmitting = false;
          if (pollModal.value.pollForm) {
            pollModal.value.pollForm.isSubmitting = false;
          }
          
          // Verzögerung einbauen, um sicherzustellen, dass das DOM vollständig aufgebaut ist
          setTimeout(() => {
            try {
              // Entferne erst alle existierenden Modals und Backdrops
              try {
                const backdrops = document.getElementsByClassName('modal-backdrop');
                if (backdrops.length > 0) {
                  Array.from(backdrops).forEach(backdrop => {
                    if (backdrop && backdrop.parentNode) {
                      backdrop.parentNode.removeChild(backdrop);
                    }
                  });
                }
                
                // Body-Klassen zurücksetzen
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
              } catch (cleanupErr) {
                console.error("[DEBUG:VOTING] Fehler beim Aufräumen vor Notfalleröffnung:", cleanupErr);
              }
              
              // Einheitliche Methode zur Modal-Verwaltung statt mehrerer Fallback-Mechanismen
              if (pollModal.value) {
                // Zentrale Funktion zur Modell-Initialisierung
                const initializeAndShowModal = () => {
                  try {
                    const modalElement = document.getElementById('pollModal');
                    if (modalElement) {
                      // Speichere das Modal-Element als Referenz
                      pollModal.value.modal = ref(modalElement);
                      
                      // Erstelle ein neues Bootstrap Modal mit einheitlicher Konfiguration
                      const bootstrapModal = new Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false,
                        focus: true
                      });
                      
                      // Bootstrap-Modal konsistent als Property speichern
                      pollModal.value.bootstrapModal = bootstrapModal;
                      
                      // Modal anzeigen
                      bootstrapModal.show();
                      
                      // Zusätzlich Flag setzen
                      pollModal.value.isVisible = ref(true);
                      
                      return true;
                    }
                    return false;
                  } catch (err) {
                    console.error("[DEBUG:VOTING] Fehler bei Modal-Initialisierung:", err);
                    return false;
                  }
                };
                
                // Versuche das Modal zu initialisieren und anzuzeigen
                const success = initializeAndShowModal();
                
                // Falls das nicht funktioniert hat, versuche die showModal-Methode als letzten Ausweg
                if (!success && typeof pollModal.value.showModal === 'function') {
                  console.warn("[DEBUG:VOTING] Fallback auf showModal-Methode");
                  pollModal.value.showModal();
                }
              } else {
                console.error("[DEBUG:VOTING] NOTFALL: pollModal.value ist nicht verfügbar");
              }
            } catch (emergencyErr) {
              console.error("[DEBUG:VOTING] Auch Notfall-Wiedereröffnung fehlgeschlagen:", emergencyErr);
            }
          }, 200);
        }
      }, 1000); // Prüfe nach 1 Sekunde
    }
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
      
      // Trotz Fehler versuchen, das Modal zu öffnen, wenn wir teilweise abgestimmt haben
      if (usedVotes > 0 && usedVotes < totalAllowedVotes && 
          poll.value && !poll.value.closed && 
          pollState.value !== "closed" && 
          pollModal.value) {
        
        setTimeout(() => {
          try {
            pollModal.value.showModal();
          } catch (emergencyErr) {
            console.error("[DEBUG:VOTING] Fehler-Notfall-Wiedereröffnung fehlgeschlagen:", emergencyErr);
          }
        }, 500);
      }
    } catch (e) {
      console.error('Kritischer Fehler beim Zurücksetzen der Flags:', e);
    }
  }
}
</script>
