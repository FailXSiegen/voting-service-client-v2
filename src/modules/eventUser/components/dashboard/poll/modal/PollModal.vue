<template>
  <div class="container-modal d-print-none">
    <div
      id="pollModal"
      ref="modal"
      class="modal fade"
      tabindex="-1"
      data-bs-keyboard="false"
      data-bs-backdrop="static"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
      >
        <div v-if="poll" class="modal-content position-relative">
          <!-- Modal-wide overlay to block all interaction during submission -->
          <!-- ABSOLUTE GARANTIERTE SPERRUNG: 100% zuverlässiges Locking mit mehrfachen Bedingungen -->
          <div
v-if="isSubmitting || votingProcess.isProcessingVotes?.value || votingProcess.currentlyProcessingBatch?.value || votingProcess.pollFormSubmitting?.value || (votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < eventUser.voteAmount) || !!(eventUser.voteAmount && votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < eventUser.voteAmount)" 
               class="position-absolute w-100 h-100 top-0 start-0 z-3" 
               style="background-color: rgba(255,255,255,0.95); cursor: not-allowed;">
            <div class="position-absolute top-50 start-50 translate-middle text-center">
              <span class="spinner-border spinner-border-lg text-primary" role="status"></span>
              <div class="mt-2 fw-bold text-dark">{{ $t("view.polls.modal.submitting") }}...</div>
              <div class="mt-2 small">Bitte warten Sie, Ihre Stimmen werden gezählt</div>
              <!-- Fortschrittsanzeige für viele Stimmen -->
              <div v-if="votingProcess.usedVotesCount?.value > 0" class="mt-2">
                Fortschritt: {{ votingProcess.usedVotesCount?.value }} von {{ eventUser.voteAmount }} Stimmzetteln
              </div>
            </div>
          </div>

          <div class="modal-header">
            <h5 class="modal-title">
              {{ poll.title }}<br />
              <small v-if="props.event.multivoteType !== 2" id="pollCounter">
                <b>(Stimmzettel {{ voteCounter }} von {{ eventUser.voteAmount }})</b>
              </small>
            </h5>
          </div>

          <div class="modal-body">
            <!-- NEUE WARNUNG: Anzeige wenn Umfrage geschlossen ist -->
            <div v-if="poll.closed" class="alert alert-warning mb-3">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Diese Abstimmung ist geschlossen und kann nicht mehr verwendet werden.</strong>
            </div>
            
            <!-- NEUE WARNUNG: Anzeige wenn alle Stimmen abgegeben wurden -->
            <div v-else-if="votingProcess.votingFullyCompleted?.value || (eventUser.voteAmount && votingProcess.usedVotesCount?.value >= eventUser.voteAmount)" class="alert alert-info mb-3">
              <i class="bi bi-check-circle me-2"></i>
              <strong>Sie haben alle verfügbaren Stimmen für diese Abstimmung abgegeben.</strong>
            </div>

            <p v-if="poll.maxVotes === 1">
              {{ $t("view.polls.modal.maxVote1") }}
            </p>
            <p v-if="poll.maxVotes > 1">
              {{ $t("view.polls.modal.maxVoteGreater1") }}
              {{ poll.maxVotes }}
            </p>
            <p v-if="poll.minVotes > 0">
              {{ $t("view.polls.modal.minVoteGreater0") }}
              {{ poll.minVotes }}
            </p>

            <!-- Form conditionally disabled when poll is closed or all votes used -->
            <PollForm
              v-if="!poll.closed && !(votingProcess.votingFullyCompleted?.value || (eventUser.voteAmount && votingProcess.usedVotesCount?.value >= eventUser.voteAmount))"
              ref="pollForm"
              :key="pollFormKey"
              :event="event"
              :event-user="eventUser"
              :poll="poll"
              :vote-counter="voteCounter"
              @submit="onSubmit"
            />
            <div v-if="poll.type === 'PUBLIC' && activePollEventUser && event.publicVoteVisible" class="d-inline-block w-100">
              <hr />
              <VotingDetailsWithSubscription
                :active-poll-event-user="activePollEventUser"
                :event-id="event.id"
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { Modal } from "bootstrap";
import PollForm from "@/modules/eventUser/components/dashboard/poll/PollForm.vue";
import VotingDetailsWithSubscription from "@/modules/eventUser/components/dashboard/poll/VotingDetailsWithSubscription.vue";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";

const emit = defineEmits(["submit"]);
const modal = ref(null);
const pollForm = ref(null);
let bootstrapModal = null;

// Use voting process to get the state
const votingProcess = useVotingProcess(ref(), ref());

// Einfacher lokaler State
const isSubmitting = ref(false);

// Flag, das anzeigt, ob das Modal sichtbar ist
let isVisible = false;

// Getter-Funktion, um den sichtbaren Zustand des Modals abzufragen
function getIsVisible() {
  return isVisible;
}

const props = defineProps({
  poll: {
    type: Object,
    required: false,
    default: null,
  },
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
  activePollEventUser: {
    type: Object,
    required: false,
    default: null,
  },
  voteCounter: {
    type: Number,
    required: true,
  },
});

const pollFormKey = ref(1);

const modalState = computed(() => {
  return {
    isDisabled: isSubmitting.value || (pollForm.value && pollForm.value.isSubmitting)
  };
});

onMounted(() => {
  bootstrapModal = new Modal(modal.value);
  
  // Event-Listener hinzufügen, um den sichtbaren Zustand des Modals zu verfolgen
  if (modal.value) {
    // Event-Listener, der erkennt, wenn das Modal angezeigt wird
    modal.value.addEventListener('shown.bs.modal', () => {
      isVisible = true;
    });
    
    // Event-Listener, der erkennt, wenn das Modal geschlossen wird
    modal.value.addEventListener('hidden.bs.modal', () => {
      isVisible = false;
    });
  }
  
  // Setup completion handler to show appropriate UI state when voting is complete
  votingProcess.setVotingCompletedCallback(() => {
    // Force UI update to show completion state
    votingProcess.votingFullyCompleted.value = true;
  });
  
  // KRITISCH: Poll-Closed-Zustand überwachen und Modal schließen
  const pollClosedWatcher = watch(
    () => props.poll?.closed,
    (isClosed) => {
      if (isClosed) {
        console.warn("[DEBUG:VOTING] Poll wurde geschlossen (reactive watch), schließe Modal");
        hideModal();
      }
    },
    { immediate: true } // Sofort beim Mounting prüfen
  );
  
  // KRITISCH: Überwache auch den Poll-State vom Parent-Component
  const pollStateWatcher = watch(
    () => props.activePollEventUser?.state,
    (state) => {
      if (state === 'closed') {
        console.warn("[DEBUG:VOTING] Poll-State wurde auf 'closed' gesetzt (reactive watch), schließe Modal");
        hideModal();
      }
    },
    { immediate: true } // Sofort beim Mounting prüfen
  );
  
  // Watcher beim Unmounting entfernen
  onBeforeUnmount(() => {
    pollClosedWatcher();
    pollStateWatcher();
  });
});

function onSubmit(data) {
  if (isSubmitting.value) {
    console.warn('Vermeidung von doppelter Stimmabgabe: Formular ist bereits im Submitting-Zustand');
    return;
  }
  
  isSubmitting.value = true;
  
  emit("submit", data);
  
  // Status wird durch pollAnswerLifeCycle-Event oder Fehlerbehandlung zurückgesetzt
}

function showModal() {
  // KRITISCHE SICHERHEITSPRÜFUNG: Wenn der Poll geschlossen ist, das Modal NICHT öffnen
  // und stattdessen SOFORT schließen, falls es geöffnet ist
  if (props.poll && props.poll.closed) {
    console.warn("[DEBUG:VOTING] Poll ist geschlossen, Modal wird geschlossen");
    
    // Sofort schließen falls offen
    if (bootstrapModal) {
      try {
        bootstrapModal.hide();
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Schließen des geschlossenen Poll-Modals:', e);
      }
    }
    
    return; // Sofort zurückkehren ohne das Modal zu öffnen
  }
  
  // EXTRA-PRÜFUNG: Prüfe auch beim Parents-Component, ob der Poll closed ist
  try {
    if (props.activePollEventUser?.state === "closed") {
      console.warn("[DEBUG:VOTING] Poll-State ist 'closed' laut activePollEventUser, Modal wird nicht geöffnet");
      return;
    }
  } catch (e) {
    console.error('[DEBUG:VOTING] Fehler bei extra Poll-State-Prüfung:', e);
  }
  
  // Vor dem Öffnen des Modals müssen wir sicherstellen, dass alle Status zurückgesetzt sind
  isSubmitting.value = false;
  
  // KRITISCH: Lokalen Storage für die aktuelle Abstimmung löschen
  if (props.poll && props.poll.id) {
    localStorage.removeItem(`poll_form_data_${props.poll.id}`);
  }
  
  // Formular bei JEDEM Öffnen zurücksetzen
  // Entferne die Bedingung, damit das Formular IMMER zurückgesetzt wird
  if (pollForm.value) {
    pollForm.value.reset(false); // komplett zurücksetzen
  }
  
  // Erhöhe immer den pollFormKey, um sicherzustellen, dass das Formular neu instanziiert wird
  pollFormKey.value += 1;
  
  // Um das "Wird abgestimmt" bei jedem Öffnen korrekt anzuzeigen, 
  // stellen wir sicher, dass die Komponente in einem frischen Zustand ist
  
  // KRITISCH: Vor dem Öffnen NOCHMAL prüfen, ob der Poll geschlossen ist
  if (props.poll && props.poll.closed) {
    console.warn("[DEBUG:VOTING] Poll wurde während der Vorbereitung geschlossen, Modal wird nicht geöffnet");
    return;
  }
  
  // Dann das Modal zeigen
  if (bootstrapModal) {
    bootstrapModal.show();
  } else if (modal.value) {
    console.warn("[DEBUG:VOTING] bootstrapModal nicht initialisiert, erstelle neu");
    bootstrapModal = new Modal(modal.value);
    bootstrapModal.show();
  } else {
    console.error("[DEBUG:VOTING] Kann Modal nicht öffnen: DOM-Element nicht verfügbar");
  }
}

function hideModal() {  
  // WICHTIG: Stelle vor dem Schließen sicher, dass das Modal gesperrt ist,
  // damit keine weiteren Klicks möglich sind
  isSubmitting.value = true;
  
  // KRITISCH: Lokalen Storage für die aktuelle Abstimmung löschen
  if (props.poll && props.poll.id) {
    localStorage.removeItem(`poll_form_data_${props.poll.id}`);
  }
  
  // Alle UI-relevanten Flags auf true setzen
  if (votingProcess) {
    votingProcess.pollFormSubmitting.value = true;
    votingProcess.currentlyProcessingBatch.value = true;
    votingProcess.isProcessingVotes.value = true;
  }
  
  // WICHTIG: Wenn das Bootstrap-Modal nicht existiert, neu initialisieren
  if (!bootstrapModal && modal.value) {
    try {
      bootstrapModal = new Modal(modal.value);
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler bei Bootstrap-Modal-Initialisierung:', e);
    }
  }
  
  // Sofortiger Schließversuch ohne Verzögerung
  if (bootstrapModal) {
    try {
      bootstrapModal.hide();
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler beim Schließen des Modals:', e);
    }
  }
  
  // KRITISCH: Zusätzlich mit kurzer Verzögerung, damit die reaktiven Updates durch Vue erfolgen können
  // Dadurch wird sichergestellt, dass die UI gesperrt bleibt und das Modal wirklich geschlossen wird
  setTimeout(() => {
    try {
      // Erneuter Schließversuch
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
      
      // LOKAL states danach zurücksetzen (nicht vorher!)
      reset(false); // Immer vollständiges Zurücksetzen erzwingen
      
      // Formular Key erhöhen für frisches Formular beim nächsten Öffnen
      pollFormKey.value += 1;
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler beim verzögerten Schließen des Modals:', e);
    }

    // IMMER alle States zurücksetzen, sobald das Modal geschlossen ist
    // Aber mit einer Verzögerung, damit das Modal wirklich sauber entfernt ist
    
    // Prüfe, ob alle Stimmen abgegeben wurden
    const totalAllowedVotes = props.eventUser?.voteAmount || 0;
    const usedVotes = votingProcess.usedVotesCount?.value || 0;
    
    // Bei abgeschlossener Abstimmung (alle Stimmen genutzt) sofort zurücksetzen
    if (usedVotes >= totalAllowedVotes) {
      votingProcess.resetVoteCounts();
    } else if (votingProcess.isProcessingVotes.value) {
      // Bei laufender Abstimmung mit Verzögerung zurücksetzen
      
      setTimeout(() => {
        // Direkter Reset nach Verzögerung
        votingProcess.resetVoteCounts();
      }, 500);
    }
  }, 50);
}

function reset(keepSelection = false) {
  // WICHTIG: Hier explizit auf false setzen, damit das Overlay verschwindet,
  // wenn die Verarbeitung vollständig abgeschlossen ist
  isSubmitting.value = false;
  
  // KRITISCH: Lokalen Storage für die aktuelle Abstimmung löschen
  if (props.poll && props.poll.id) {
    localStorage.removeItem(`poll_form_data_${props.poll.id}`);
  }
  
  // Stelle sicher, dass auch das PollForm vollständig zurückgesetzt wird
  if (pollForm.value) {
    if (!keepSelection) {
      // Komplettes Zurücksetzen des Formulars, inklusive der Auswahl
      if (pollForm.value.reset) {
        pollForm.value.reset(false);
      }
    } else {
      // Wir setzen nur den Submission-Status zurück, nicht die Formularauswahl
      if (pollForm.value.resetSubmitState) {
        pollForm.value.resetSubmitState();
      } else {
        // Fallback
        pollForm.value.isSubmitting = false;
      }
    }
  }
  
  // Stelle sicher, dass die Overlay-Anzeige auch wirklich aktualisiert wird
  // durch eine sofortige zweite Aktualisierung für bessere Reaktivität
  
  // Nochmal setzen für sicherere Reaktivität
  setTimeout(() => {
    isSubmitting.value = false;
    
    // NOCHMALS sicherstellen, dass keine alten Formulardaten existieren
    if (props.poll && props.poll.id) {
      localStorage.removeItem(`poll_form_data_${props.poll.id}`);
    }
  }, 50);
}

defineExpose({
  showModal,
  hideModal,
  modalState,
  isSubmitting,
  pollForm,
  reset
});
</script>

<style>
.pulse {
  background: rgba(23, 162, 184, 0.15);
  box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.5);
  transform: scale(1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.4);
  }
  30% {
    transform: scale(0.99);
    box-shadow: 0 0 0 10px rgba(23, 162, 184, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0);
  }
}
</style>