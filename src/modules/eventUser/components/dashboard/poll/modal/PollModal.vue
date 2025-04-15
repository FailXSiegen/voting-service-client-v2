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
                Fortschritt: {{ votingProcess.usedVotesCount?.value }} von {{ eventUser.voteAmount }} Stimmen
              </div>
            </div>
          </div>

          <div class="modal-header">
            <h5 class="modal-title">
              {{ poll.title }}<br />
              <small v-if="props.event.multivoteType !== 2" id="pollCounter">
                <b>(Stimme {{ voteCounter }} von {{ eventUser.voteAmount }})</b>
              </small>
            </h5>
          </div>

          <div class="modal-body">
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

            <PollForm
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
              <VotingDetails
                :active-poll-event-user="activePollEventUser"
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
import VotingDetails from "@/modules/eventUser/components/dashboard/poll/VotingDetails.vue";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";

const emit = defineEmits(["submit"]);
const modal = ref(null);
const pollForm = ref(null);
let bootstrapModal = null;

// Use voting process to get the state
const votingProcess = useVotingProcess(ref(), ref());

// Einfacher lokaler State
const isSubmitting = ref(false);

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
  // Vor dem Öffnen des Modals müssen wir sicherstellen, dass alle Status zurückgesetzt sind
  isSubmitting.value = false;
  
  // Formular nur beim ersten Öffnen zurücksetzen, da die Modal-Events global für alle Clients ausgelöst werden
  // Das verhindert, dass während einer Sitzung eines Clients das Formular bei anderen Clients zurückgesetzt wird
  if (pollForm.value && pollFormKey.value === 1) {
    pollForm.value.reset(false); // komplett zurücksetzen
  }
  
  // Um das "Wird abgestimmt" bei jedem Öffnen korrekt anzuzeigen, 
  // stellen wir sicher, dass die Komponente in einem frischen Zustand ist
  
  // Dann das Modal zeigen
  bootstrapModal?.show();
}

function hideModal() {
  // WICHTIG: Stelle vor dem Schließen sicher, dass das Modal gesperrt ist,
  // damit keine weiteren Klicks möglich sind
  isSubmitting.value = true;
  
  // Alle UI-relevanten Flags auf true setzen
  if (votingProcess) {
    votingProcess.pollFormSubmitting.value = true;
    votingProcess.currentlyProcessingBatch.value = true;
    votingProcess.isProcessingVotes.value = true;
  }
  
  // KRITISCH: Erst kurze Verzögerung, damit die reaktiven Updates durch Vue erfolgen können
  // Dadurch wird sichergestellt, dass die UI gesperrt bleibt
  setTimeout(() => {
    // Modal jetzt schließen
    bootstrapModal?.hide();
    
    // LOKAL states danach zurücksetzen (nicht vorher!)
    reset();
    
    // Formular Key erhöhen für frisches Formular beim nächsten Öffnen
    pollFormKey.value += 1;

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

function reset() {
  // WICHTIG: Hier explizit auf false setzen, damit das Overlay verschwindet,
  // wenn die Verarbeitung vollständig abgeschlossen ist
  isSubmitting.value = false;
  
  // Stelle sicher, dass auch das PollForm zurückgesetzt wird
  if (pollForm.value) {
    // Wir setzen nur den Submission-Status zurück, nicht die Formularauswahl
    if (pollForm.value.resetSubmitState) {
      pollForm.value.resetSubmitState();
    } else {
      // Fallback
      pollForm.value.isSubmitting = false;
    }
  }
  
  // Stelle sicher, dass die Overlay-Anzeige auch wirklich aktualisiert wird
  // durch eine sofortige zweite Aktualisierung für bessere Reaktivität
  
  // Nochmal setzen für sicherere Reaktivität
  setTimeout(() => {
    isSubmitting.value = false;
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