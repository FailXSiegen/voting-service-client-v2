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
          <!-- VERBESSERTE SPERRUNG: Bedingung mit Split-Vote-Erkennung -->
          <div
v-if="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < eventUser.voteAmount)" 
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
              <small v-if="props.event.multivoteType !== 2 && votingProcess.usedVotesCount?.value < eventUser.voteAmount" id="pollCounter">
                <b>({{ $t('view.polls.modal.ballotCounter', { current: votingProcess.usedVotesCount?.value + 1, total: eventUser.voteAmount }) }})</b>
              </small>
            </h5>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary ms-auto"
              @click="reloadPage"
              title="Seite neu laden"
            >
              <i class="bi bi-arrow-clockwise"></i>
            </button>
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
                :event="event"
                :poll="poll"
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import { Modal } from "bootstrap";
import PollForm from "@/modules/eventUser/components/dashboard/poll/PollForm.vue";
import VotingDetailsWithSubscription from "@/modules/eventUser/components/dashboard/poll/VotingDetailsWithSubscription.vue";
// ENTFERNT: useVotingProcess - wird jetzt als Prop übergeben
// import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";

const emit = defineEmits(["submit"]);
const modal = ref(null);
const pollForm = ref(null);
let bootstrapModal = null;

// ENTFERNT: Lokale votingProcess Instanz - wird jetzt als Prop von Parent übergeben
// const votingProcess = useVotingProcess(ref(), ref());

// Einfacher lokaler State
const isSubmitting = ref(false);

// Flag, das anzeigt, ob das Modal sichtbar ist
const isVisible = ref(false);

// Timer für automatische Sichtbarkeitsprüfung
let visibilityCheckInterval = null;

// MutationObserver für das Tracken von Klassenänderungen
let modalClassObserver = null;

// Funktion zum Überprüfen, ob das Modal wirklich sichtbar ist
function checkModalVisibility() {
  // DOM-basierte Prüfung
  const modalElement = document.getElementById('pollModal');
  if (modalElement) {
    const isDisplayed = modalElement.classList.contains('show') && 
                        window.getComputedStyle(modalElement).display !== 'none';
    
    // Nur aktualisieren, wenn sich der Zustand ändert
    if (isDisplayed !== isVisible.value) {
      isVisible.value = isDisplayed;
      
      // Debug ausgeben
      if (!isDisplayed) { 
        // Wenn das Modal verschwunden ist, obwohl es sichtbar sein sollte, 
        // versuchen es neu zu öffnen
        if (props.poll && !props.poll.closed && 
            props.eventUser.voteAmount > 0 && 
            props.eventUser.allowToVote) {
          
          // Stelle sicher, dass wir nur wieder öffnen, wenn wir Teilstimmen abgegeben haben
          const usedVotes = props.eventUser.voteAmount > 1 ? votingProcess.value.usedVotesCount?.value || 0 : 0;
          const totalVotes = props.eventUser.voteAmount || 0;
          
          if (usedVotes > 0 && usedVotes < totalVotes) {
            console.warn("[DEBUG:VOTING] Modal verschwunden bei Teilabstimmung! Versuche erneut zu öffnen...");
            
            // 250ms Verzögerung für stabile Wiedereröffnung
            setTimeout(() => {
              try {
                showModal();
              } catch (e) {
                console.error("[DEBUG:VOTING] Fehler bei auto-reopen:", e);
              }
            }, 250);
          }
        }
      }
    }
  }
}

// Getter-Funktion, um den sichtbaren Zustand des Modals abzufragen
function getIsVisible() {
  return isVisible.value;
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
  votingProcess: {
    type: Object,
    required: true,
  },
});

// Create a local reference to the votingProcess prop for use in template and script
const votingProcess = computed(() => props.votingProcess);

const pollFormKey = ref(1);

const modalState = computed(() => {
  return {
    isDisabled: isSubmitting.value || (pollForm.value && pollForm.value.isSubmitting)
  };
});

// Tracking-Variable, um mehrfache Aufrufe zu verhindern
let isResetInProgress = false;
let isRestoringBackdrop = false;

// Deklariere die Event-Handler-Funktionen VOR ihrer Verwendung
const handleVotingComplete = () => {
  // console.log("[DEBUG:VOTING] handleVotingComplete wurde aufgerufen");
  // Sofort isSubmitting auf false setzen für direkte visuelle Rückmeldung
  isSubmitting.value = false;
  // Dann vollständiges Reset durchführen, aber nur wenn nicht bereits ein Reset läuft
  if (!isResetInProgress) {
    // console.log("[DEBUG:VOTING] handleVotingComplete ruft resetSubmittingState auf");
    resetSubmittingState();
  }
};

const handleVotingError = () => {
  // Sofort isSubmitting auf false setzen für direkte visuelle Rückmeldung
  isSubmitting.value = false;
  // Dann vollständiges Reset durchführen, aber nur wenn nicht bereits ein Reset läuft
  if (!isResetInProgress) {
    resetSubmittingState();
  }
};

const handleVotingReset = () => {
  // Sofort isSubmitting auf false setzen für direkte visuelle Rückmeldung
  isSubmitting.value = false;
  // Dann vollständiges Reset durchführen, aber nur wenn nicht bereits ein Reset läuft
  if (!isResetInProgress) {
    resetSubmittingState();
  }
};

// Neue Funktion zur expliziten Zurücksetzung des Submitting-Status
function resetSubmittingState() {
  // STOPPE ENDLOSSCHLEIFEN: Wenn bereits ein Reset läuft, nicht erneut starten
  if (isResetInProgress) {
    return;
  }

  // Markiere, dass ein Reset in Bearbeitung ist
  isResetInProgress = true;

  // Sofort Overlay ausblenden (wichtig für direkte visuelle Feedback)
  isSubmitting.value = false;

  // KRITISCH: Bei Split-Voting sofort sicherstellen, dass modal-open bleibt
  const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;
  const maxVotes = props.eventUser?.voteAmount || 0;
  const hasVotesRemaining = usedVotes < maxVotes;

  if (hasVotesRemaining && modal.value?.classList.contains('show')) {
    // Modal ist noch offen und es sind noch Stimmen übrig
    // Stelle sofort sicher, dass modal-open gesetzt ist
    if (!document.body.classList.contains('modal-open')) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      // console.log('[DEBUG:VOTING] modal-open sofort wiederhergestellt bei Split-Voting');
    }

    // KRITISCH: Prüfe sofort, ob Backdrop vorhanden ist und erstelle nur wenn nötig
    // Verwende requestAnimationFrame für besseres Timing
    requestAnimationFrame(() => {
      const existingBackdrop = document.querySelector('.modal-backdrop');

      if (!existingBackdrop) {
        // console.log('[DEBUG:VOTING] Backdrop fehlt nach Vote, erstelle neuen');

        // Erstelle neuen Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.zIndex = '1050'; // Standard Bootstrap z-index für Backdrop
        document.body.appendChild(backdrop);
      } else {
        // console.log('[DEBUG:VOTING] Backdrop bereits vorhanden, keine Erstellung nötig');
      }
    });
  }

  // Stelle sicher, dass alle Werte korrekt aktualisiert sind
  // nextTick(() => {
  //   try {
  //     // Prüfe aktuelle Stimmwerte für Debug - Verwende PROPS für sicheren Zugriff
  //     const usedVotes = votingProcess?.usedVotesCount?.value || 0;
  //     // KORRIGIERT: Verwende props.eventUser statt eventUser direkt (Vermeidet ReferenceError)
  //     const totalVotes = props.eventUser?.voteAmount || 0;
  //     console.log(`[DEBUG:VOTING] Stimmzähler vor UI-Entsperrung: ${usedVotes}/${totalVotes}`);
  //   } catch (e) {
  //     console.error('[DEBUG:VOTING] Fehler beim Debug-Log:', e);
  //   }
  // });

  // Extra Reset aller UI-Flags, um sicherzustellen, dass alles korrekt zurückgesetzt ist
  if (pollForm.value && typeof pollForm.value.resetSubmitState === 'function') {
    try {
      pollForm.value.resetSubmitState();
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler beim Reset des PollForm:', e);
    }
  }

  // GARANTIERE, dass isSubmitting false ist
  isSubmitting.value = false;

  // Lösche den Event-Listener temporär, um Endlosschleifen zu vermeiden
  const tempRemoveListeners = () => {
    if (typeof window !== 'undefined') {
      try {
        window.removeEventListener('voting:complete', handleVotingComplete);
        window.removeEventListener('voting:error', handleVotingError);
        window.removeEventListener('voting:reset', handleVotingReset);

        // Nach kurzer Zeit wieder hinzufügen
        setTimeout(() => {
          try {
            window.addEventListener('voting:complete', handleVotingComplete);
            window.addEventListener('voting:error', handleVotingError);
            window.addEventListener('voting:reset', handleVotingReset);

            // Reset als abgeschlossen markieren
            isResetInProgress = false;
          } catch (e) {
            console.error('[DEBUG:VOTING] Fehler beim Hinzufügen der Event-Listener nach Pause:', e);
            isResetInProgress = false; // Trotzdem Reset als abgeschlossen markieren
          }
        }, 100);
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Entfernen der Event-Listener:', e);
        isResetInProgress = false; // Reset trotzdem als abgeschlossen markieren
      }
    }
  };

  // DOM-basierte Garantie für Overlay-Ausblendung
  try {
    const overlay = document.querySelector('.modal-content > div[style*="background-color: rgba(255,255,255,0.95)"]');
    if (overlay) {
      overlay.style.display = 'none';
    }
  } catch (e) {
    console.error('[DEBUG:VOTING] Fehler bei DOM-Manipulation:', e);
  }

  // Event-Listener temporär entfernen
  tempRemoveListeners();
}

onMounted(() => {
  // KRITISCHER FIX: Entferne alle alten "Zombie"-Modal-Elemente beim Mounten
  // Dies verhindert, dass alte Modal-Instanzen im DOM bleiben und Probleme verursachen
  console.log('[DEBUG:VOTING] PollModal wird gemounted, prüfe auf Zombie-Modals');
  const allModals = document.querySelectorAll('.modal');
  allModals.forEach(oldModal => {
    // Entferne nur Modal-Elemente, die nicht das aktuelle sind
    if (oldModal !== modal.value) {
      console.log('[DEBUG:VOTING] Entferne Zombie-Modal:', oldModal.id);
      oldModal.remove();
    }
  });

  // Entferne auch alle Backdrops
  const allBackdrops = document.querySelectorAll('.modal-backdrop');
  allBackdrops.forEach(backdrop => {
    console.log('[DEBUG:VOTING] Entferne Zombie-Backdrop');
    backdrop.remove();
  });

  // Entferne modal-open von body
  if (document.body.classList.contains('modal-open')) {
    console.log('[DEBUG:VOTING] Entferne modal-open von body beim Mount');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  bootstrapModal = new Modal(modal.value);

  // Event-Listener hinzufügen, um den sichtbaren Zustand des Modals zu verfolgen
  if (modal.value) {
    // Event-Listener, der erkennt, wenn das Modal angezeigt wird
    modal.value.addEventListener('shown.bs.modal', () => {
      isVisible.value = true;
    });

    // Event-Listener, der erkennt, wenn das Modal geschlossen wird
    modal.value.addEventListener('hidden.bs.modal', () => {
      isVisible.value = false;

      // WICHTIGER FIX: Bei Modal-Schließung garantiert den isSubmitting-Status zurücksetzen
      resetSubmittingState();
    });

    // KRITISCH: Permanenter MutationObserver um zu tracken, wann die show-Klasse entfernt wird
    let lastHadShow = false;
    modalClassObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // SICHERHEITSCHECK: Prüfe, ob modal.value noch existiert (kann null sein beim Unmounting)
          if (!modal.value) {
            console.warn('[DEBUG:VOTING] Observer läuft, aber modal.value ist null - überspringe');
            return;
          }
          const hasShow = modal.value.classList.contains('show');
          const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;
          const maxVotes = props.eventUser?.voteAmount || 0;
          const inSplitVoting = usedVotes > 0 && usedVotes < maxVotes;

          // Log JEDE Änderung der show-Klasse
          if (lastHadShow && !hasShow) {
            console.warn('[DEBUG:VOTING] ⚠️ show-Klasse wurde ENTFERNT', {
              usedVotes,
              maxVotes,
              inSplitVoting,
              stack: new Error().stack
            });

            if (inSplitVoting) {
              console.error('[DEBUG:VOTING] ❌ KRITISCH: Dies passierte während Split-Voting!');
            }
          } else if (!lastHadShow && hasShow) {
            console.log('[DEBUG:VOTING] ✅ show-Klasse wurde HINZUGEFÜGT', { usedVotes, maxVotes });
          }

          lastHadShow = hasShow;
        }
      });
    });
    modalClassObserver.observe(modal.value, { attributes: true, attributeFilter: ['class'] });
  }

  // Setup completion handler to show appropriate UI state when voting is complete
  votingProcess.value.setVotingCompletedCallback(() => {
    // Force UI update to show completion state
    votingProcess.value.votingFullyCompleted.value = true;

    // KRITISCH: Stelle sicher, dass isSubmitting zurückgesetzt wird bei Abstimmungsabschluss
    resetSubmittingState();
  });

  // Starte regelmäßige Sichtbarkeitsprüfung
  visibilityCheckInterval = setInterval(checkModalVisibility, 1000);

  // Initial überprüfen
  setTimeout(checkModalVisibility, 300);
});
  
  // DEAKTIVIERT: Das 30-Sekunden-Reset wurde deaktiviert, da es bei längeren Abstimmungen störend ist
  // // NEUES SAFETY NET: Regelmäßig überprüfen, ob isSubmitting zurückgesetzt werden muss
  // // Falls ein Event nicht korrekt verarbeitet wurde oder ein Callback nicht ankam
  // const submittingCheckInterval = setInterval(() => {
  //   // Prüfe, ob das isSubmitting-Flag länger als 30 Sekunden aktiv ist
  //   if (isSubmitting.value && window._lastSubmittingStartTime) {
  //     const submittingDuration = Date.now() - window._lastSubmittingStartTime;
  //
  //     // Nach 30 Sekunden im submitting-Zustand forcieren wir ein Zurücksetzen
  //     if (submittingDuration > 30000) { // 30 Sekunden
  //       console.warn('[DEBUG:VOTING] isSubmitting ist seit mehr als 30 Sekunden aktiv - forciere Zurücksetzen');
  //       resetSubmittingState();
  //
  //       // Flags im voting-process auch zurücksetzen
  //       if (votingProcess) {
  //         votingProcess.releaseUILocks();
  //       }
  //     }
  //   }
  // }, 5000); // Alle 5 Sekunden prüfen
  
  // NEU: Verwende die global deklarierten Event-Handler-Funktionen für garantierte UI-Entsperrung
  
  // Event-Listener registrieren
  if (typeof window !== 'undefined') {
    window.addEventListener('voting:complete', handleVotingComplete);
    window.addEventListener('voting:error', handleVotingError);
    window.addEventListener('voting:reset', handleVotingReset);
  }
  
  // Cleanup für dieses Intervall hinzufügen (auskommentiert, da submittingCheckInterval deaktiviert)
  onBeforeUnmount(() => {
    // clearInterval(submittingCheckInterval);

    // Auch die Event-Listener entfernen
    if (typeof window !== 'undefined') {
      window.removeEventListener('voting:complete', handleVotingComplete);
      window.removeEventListener('voting:error', handleVotingError);
      window.removeEventListener('voting:reset', handleVotingReset);
    }

    // KRITISCHER FIX: MutationObserver disconnecten
    if (modalClassObserver) {
      modalClassObserver.disconnect();
      modalClassObserver = null;
      console.log('[DEBUG:VOTING] MutationObserver disconnected');
    }

    // Sichtbarkeits-Interval stoppen
    if (visibilityCheckInterval) {
      clearInterval(visibilityCheckInterval);
      visibilityCheckInterval = null;
      console.log('[DEBUG:VOTING] Visibility check interval cleared');
    }

    // KRITISCHER FIX: Bootstrap Modal SOFORT zerstören, bevor Component unmounted wird
    if (bootstrapModal) {
      try {
        bootstrapModal.dispose();
        console.log('[DEBUG:VOTING] Bootstrap Modal disposed');
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Dispose des Bootstrap Modals:', e);
      }
    }

    // KRITISCHER FIX: Modal-Element DIREKT aus DOM entfernen
    // Dies ist notwendig, weil Bootstrap das Element nicht automatisch entfernt
    if (modal.value && modal.value.parentNode) {
      console.log('[DEBUG:VOTING] Entferne Modal-Element direkt aus DOM');
      modal.value.parentNode.removeChild(modal.value);
    }

    // KRITISCHER FIX: Backdrop entfernen beim Unmounten der Komponente
    // Dies verhindert, dass der Backdrop sichtbar bleibt, wenn das Modal durch v-if=false entfernt wird
    console.log('[DEBUG:VOTING] PollModal wird unmounted, entferne Backdrop und modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
        console.log('[DEBUG:VOTING] Backdrop entfernt');
      }
    });

    // Entferne auch modal-open von body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    console.log('[DEBUG:VOTING] modal-open von body entfernt');
  });
  
  // KRITISCH: Poll-Closed-Zustand überwachen und Modal schließen
  const pollClosedWatcher = watch(
    () => props.poll?.closed,
    (isClosed) => {
      if (isClosed) {
        console.warn("[DEBUG:VOTING] Poll wurde geschlossen (reactive watch), schließe Modal");
        // Nur schließen, wenn es keine Split-Vote-Situation ist
        const totalAllowedVotes = props.eventUser?.voteAmount || 0;
        const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;
        
        // Schließe nur, wenn alle Stimmen abgegeben wurden oder keine Split-Vote-Situation vorliegt
        if (usedVotes >= totalAllowedVotes || usedVotes === 0) {
          hideModal();
        } else {
          console.warn("[DEBUG:VOTING] Split-Vote-Situation erkannt, Modal bleibt geöffnet für weitere Stimmen");
        }
      }
    },
    { immediate: false } // NICHT sofort beim Mounting prüfen
  );
  
  // KRITISCH: Überwache auch den Poll-State vom Parent-Component
  const pollStateWatcher = watch(
    () => props.activePollEventUser?.state,
    (state) => {
      if (state === 'closed') {
        console.warn("[DEBUG:VOTING] Poll-State wurde auf 'closed' gesetzt (reactive watch)");

        // Nur schließen, wenn es keine Split-Vote-Situation ist
        const totalAllowedVotes = props.eventUser?.voteAmount || 0;
        const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;

        // Schließe nur, wenn alle Stimmen abgegeben wurden oder keine Split-Vote-Situation vorliegt
        if (usedVotes >= totalAllowedVotes || usedVotes === 0) {
          console.warn("[DEBUG:VOTING] Schließe Modal, da alle Stimmen abgegeben wurden oder keine Split-Vote-Situation vorliegt");
          hideModal();
        } else {
          console.warn("[DEBUG:VOTING] Split-Vote-Situation erkannt, Modal bleibt geöffnet für weitere Stimmen");
        }
      }
    },
    { immediate: false } // NICHT sofort beim Mounting prüfen
  );

  // KRITISCH: Überwache usedVotesCount und schließe Modal SOFORT, wenn alle Stimmen abgegeben wurden
  const usedVotesWatcher = watch(
    () => votingProcess.value?.usedVotesCount?.value,
    (usedVotes) => {
      const totalAllowedVotes = props.eventUser?.voteAmount || 0;

      // Wenn alle Stimmen abgegeben wurden, schließe das Modal SOFORT
      if (usedVotes >= totalAllowedVotes && totalAllowedVotes > 0) {
        console.warn(`[DEBUG:VOTING] Alle Stimmen abgegeben (${usedVotes}/${totalAllowedVotes}), schließe Modal SOFORT`);
        hideModal();
      }
    },
    { immediate: false }
  );

  // Watcher beim Unmounting entfernen
  onBeforeUnmount(() => {
    pollClosedWatcher();
    pollStateWatcher();
    usedVotesWatcher();
    
    // Cleanup des Sichtbarkeits-Intervalls
    if (visibilityCheckInterval) {
      clearInterval(visibilityCheckInterval);
      visibilityCheckInterval = null;
    }
    
    // Event-Listener entfernen
    if (modal.value) {
      try {
        modal.value.removeEventListener('shown.bs.modal', () => {
          isVisible.value = true;
        });
        
        modal.value.removeEventListener('hidden.bs.modal', () => {
          isVisible.value = false;
        });
      } catch (e) {
        console.error("[DEBUG:VOTING] Fehler beim Entfernen der Event-Listener:", e);
      }
    }
  });

function reloadPage() {
  window.location.reload();
}

function onSubmit(data) {
  if (isSubmitting.value) {
    console.warn('Vermeidung von doppelter Stimmabgabe: Formular ist bereits im Submitting-Zustand');
    return;
  }

  isSubmitting.value = true;
  
  // WICHTIG: Speichere den Zeitpunkt des Submit-Beginns für automatische Überwachung
  if (typeof window !== 'undefined') {
    window._lastSubmittingStartTime = Date.now();
  }
  
  // Safety-Timeout: Falls keine Antwort kommt, nach 45 Sekunden UI entsperren
  const safetyTimeout = setTimeout(() => {
    if (isSubmitting.value) {
      console.warn('[DEBUG:VOTING] Safety-Timeout ausgelöst: isSubmitting wird zurückgesetzt');
      resetSubmittingState();
      
      // Auch voting-process Flags zurücksetzen
      if (votingProcess.value) {
        votingProcess.value.releaseUILocks();
      }
    }
  }, 45000); // 45 Sekunden
  
  // Event emittieren und Callback für Erfolg/Fehler registrieren
  emit("submit", data);
  
  // Neues Event-System für besser koordinierte UI-Updates:
  // Lausche auf globale Voting-Events für garantierte UI-Entsperrung
  // Da handleVotingComplete global definiert ist, erstellen wir hier eine lokale Funktion mit dem gleichen Namen
  const localHandleVotingComplete = () => {
    clearTimeout(safetyTimeout); // Safety-Timeout abbrechen
    resetSubmittingState();
  };
  
  const localHandleVotingError = () => {
    clearTimeout(safetyTimeout); // Safety-Timeout abbrechen
    resetSubmittingState();
  };
  
  // Globale Event-Listener für bessere Koordination
  if (typeof window !== 'undefined') {
    window.addEventListener('voting:complete', localHandleVotingComplete);
    window.addEventListener('voting:error', localHandleVotingError);
    
    // Nach 5 Sekunden Events wieder entfernen, um Memory-Leaks zu vermeiden
    setTimeout(() => {
      window.removeEventListener('voting:complete', localHandleVotingComplete);
      window.removeEventListener('voting:error', localHandleVotingError);
    }, 5000);
  }
  
  // Status wird durch pollAnswerLifeCycle-Event oder Fehlerbehandlung zurückgesetzt
  // UND durch die neuen Safety-Mechanismen
}

function showModal() {
  // KRITISCH: Prüfe, ob das Modal bereits sichtbar ist
  // Verwende document.getElementById für zuverlässige Prüfung
  const modalElement = document.getElementById('pollModal');
  const hasShowClass = modalElement?.classList.contains('show') || false;
  const computedDisplay = modalElement ? window.getComputedStyle(modalElement).display : 'none';
  const hasVisibleDisplay = computedDisplay === 'block';

  // NEUE STRATEGIE: Prüfe auch ob die modal-open Klasse auf body gesetzt ist
  // Dies ist ein zuverlässigerer Indikator dafür, dass ein Modal gerade aktiv ist
  const bodyHasModalOpen = document.body.classList.contains('modal-open');

  // Überprüfe, ob wir in einer Split-Vote-Situation sind (noch Stimmen übrig)
  const totalAllowedVotes = props.eventUser?.voteAmount || 0;
  console.log('[DEBUG:VOTING] Lese votingProcess.usedVotesCount.value:', votingProcess.value?.usedVotesCount?.value, 'votingProcess exists:', !!votingProcess.value);
  const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;
  const inSplitVoteSituation = usedVotes > 0 && usedVotes < totalAllowedVotes;

  // Für Split-Voting-Erkennung: Modal ist sichtbar, wenn:
  // KRITISCH: Modal ist NUR sichtbar, wenn die show-Klasse gesetzt ist
  // bodyHasModalOpen und inSplitVoteSituation alleine bedeuten NICHT, dass das Modal sichtbar ist!
  // Sie bedeuten nur, dass es sichtbar SEIN SOLLTE.
  const isModalAlreadyVisible = hasShowClass;

  console.log(`[DEBUG:VOTING] showModal() aufgerufen: hasShowClass=${hasShowClass}, computedDisplay=${computedDisplay}, hasVisibleDisplay=${hasVisibleDisplay}, bodyHasModalOpen=${bodyHasModalOpen}, inSplitVoteSituation=${inSplitVoteSituation}, usedVotes=${usedVotes}/${totalAllowedVotes}, isModalAlreadyVisible=${isModalAlreadyVisible}`);

  // KRITISCH: Wenn bereits alle Stimmen abgegeben wurden, Modal NICHT öffnen
  if (usedVotes >= totalAllowedVotes && totalAllowedVotes > 0) {
    // console.log(`[DEBUG:VOTING] Alle Stimmen bereits abgegeben (${usedVotes}/${totalAllowedVotes}), Modal wird nicht geöffnet`);
    return;
  }
  
  // KRITISCHE SICHERHEITSPRÜFUNG: Wenn der Poll geschlossen ist, das Modal NICHT öffnen
  // und stattdessen SOFORT schließen, falls es geöffnet ist - AUSSER wir sind in einer Split-Vote-Situation
  if (props.poll && props.poll.closed && !inSplitVoteSituation) {
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
    
  // EXTRA-PRÜFUNG: Prüfe auch beim Parents-Component, ob der Poll closed ist - AUSSER bei Split-Vote-Situation
  if (!inSplitVoteSituation) {
    try {
      if (props.activePollEventUser?.state === "closed") {
        console.warn("[DEBUG:VOTING] Poll-State ist 'closed' laut activePollEventUser, Modal wird nicht geöffnet");
        return;
      }
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler bei extra Poll-State-Prüfung:', e);
    }
  }
  
  // Vor dem Öffnen des Modals müssen wir sicherstellen, dass alle Status zurückgesetzt sind
  isSubmitting.value = false;

  // KRITISCH: Lokalen Storage für die aktuelle Abstimmung löschen - ABER NUR wenn Modal nicht bereits sichtbar ist
  if (!isModalAlreadyVisible && props.poll && props.poll.id) {
    localStorage.removeItem(`poll_form_data_${props.poll.id}`);
  }

  // Formular zurücksetzen - ABER NUR wenn Modal nicht bereits sichtbar ist
  // Beim Split-Voting ist das Modal bereits offen, also nicht zurücksetzen
  if (!isModalAlreadyVisible && pollForm.value) {
    pollForm.value.reset(false); // komplett zurücksetzen
    console.log('[DEBUG:VOTING] Formular zurückgesetzt (Modal war nicht sichtbar)');
  } else if (isModalAlreadyVisible) {
    console.log('[DEBUG:VOTING] Formular wird NICHT zurückgesetzt (Modal bereits sichtbar)');
  }

  // Erhöhe pollFormKey NUR wenn Modal nicht bereits sichtbar ist
  // Beim Split-Voting wollen wir die Komponente NICHT neu instanziieren
  if (!isModalAlreadyVisible) {
    pollFormKey.value += 1;
    // console.log('[DEBUG:VOTING] pollFormKey erhöht, Komponente wird neu instanziiert');
  } else {
    // console.log('[DEBUG:VOTING] pollFormKey wird NICHT erhöht (Modal bereits sichtbar)');
  }

  // KRITISCH: Die Flags vom voting-process explizit zurücksetzen
  // Dies verhindert das Problem mit dem "Stimme wird abgegeben" beim Öffnen eines neuen Polls
  if (votingProcess.value) {
    votingProcess.value.isProcessingVotes.value = false;
    votingProcess.value.pollFormSubmitting.value = false;
    votingProcess.value.currentlyProcessingBatch.value = false;
  }
  
  // Um das "Wird abgestimmt" bei jedem Öffnen korrekt anzuzeigen, 
  // stellen wir sicher, dass die Komponente in einem frischen Zustand ist
  
  // KRITISCH: Vor dem Öffnen NOCHMAL prüfen, ob der Poll geschlossen ist
  if (props.poll && props.poll.closed) {
    console.warn("[DEBUG:VOTING] Poll wurde während der Vorbereitung geschlossen, Modal wird nicht geöffnet");
    return;
  }
  
  // Bereinige zuvor eventuell verbliebene Modal-Elemente - ABER NUR wenn Modal nicht bereits sichtbar ist
  // UND wenn modal-open nicht bereits gesetzt ist
  const isModalOpenSet = document.body.classList.contains('modal-open');

  if (!isModalAlreadyVisible && !isModalOpenSet) {
    try {
      // Body-Styles zurücksetzen - NUR wenn Modal nicht sichtbar ist UND modal-open nicht gesetzt ist!
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.pointerEvents = '';
      document.body.style.position = '';
      // console.log('[DEBUG:VOTING] Body-Styles zurückgesetzt (Modal war nicht sichtbar, modal-open war nicht gesetzt)');
    } catch (e) {
      console.error("[DEBUG:VOTING] Fehler beim Bereinigen vorheriger Modal-Elemente:", e);
    }
  } else {
    // console.log(`[DEBUG:VOTING] Body-Styles werden NICHT zurückgesetzt: isModalAlreadyVisible=${isModalAlreadyVisible}, isModalOpenSet=${isModalOpenSet}`);
  }
  
  // Dann das Modal zeigen
  try {
    // Sicherheitsprüfung: Ist das DOM-Element vorhanden?
    if (!modal.value) {
      console.error("[DEBUG:VOTING] Kann Modal nicht öffnen: DOM-Element nicht verfügbar");
      return; // Abbrechen, wenn kein DOM-Element vorhanden ist
    }
    
    // Ist Bootstrap Modal bereits initialisiert?
    if (bootstrapModal) {
      // KRITISCH: Wenn das Modal bereits sichtbar ist UND noch Stimmen übrig sind,
      // NICHT schließen und wieder öffnen! Stattdessen nur sicherstellen, dass alles korrekt ist
      const hasVotesRemaining = usedVotes < totalAllowedVotes;

      if (isModalAlreadyVisible && hasVotesRemaining) {
        console.log('[DEBUG:VOTING] Modal bereits sichtbar mit verbleibenden Stimmen: bleibt offen');
        console.log('[DEBUG:VOTING] modal.value ist:', modal.value ? 'vorhanden' : 'NULL/UNDEFINED');

        // KRITISCH: Nutze Bootstrap's eigene show() Methode statt manuelle Klassen-Manipulation
        console.log('[DEBUG:VOTING] Rufe bootstrapModal.show() auf um Modal sichtbar zu machen');
        try {
          bootstrapModal.show();
          console.log('[DEBUG:VOTING] bootstrapModal.show() erfolgreich aufgerufen');

          // Verify it worked
          setTimeout(() => {
            if (modal.value) {
              const hasShowClassNow = modal.value.classList.contains('show');
              const computedDisplayNow = window.getComputedStyle(modal.value).display;
              console.log(`[DEBUG:VOTING] Nach bootstrapModal.show(): hasShowClass=${hasShowClassNow}, computedDisplay: ${computedDisplayNow}`);
            }
          }, 100);
        } catch (e) {
          console.error('[DEBUG:VOTING] Fehler beim Aufrufen von bootstrapModal.show():', e);
        }

        // Stelle sicher, dass modal-open und Backdrop vorhanden sind
        if (!document.body.classList.contains('modal-open')) {
          document.body.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          console.log('[DEBUG:VOTING] modal-open wiederhergestellt');
        }

        // KRITISCH: Stelle auch sicher, dass ein Backdrop vorhanden ist
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (!existingBackdrop) {
          console.log('[DEBUG:VOTING] Backdrop fehlt, erstelle neuen');
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.style.zIndex = '1050';
          document.body.appendChild(backdrop);
        } else {
          console.log('[DEBUG:VOTING] Backdrop bereits vorhanden');
        }

        // Debug: Prüfe den aktuellen Zustand des Modals NACH Wiederherstellung
        if (modal.value) {
          console.log('[DEBUG:VOTING] Modal-Zustand nach Wiederherstellung:', {
            hasShowClass: modal.value.classList.contains('show'),
            display: modal.value.style.display,
            computedDisplay: window.getComputedStyle(modal.value).display,
            visibility: window.getComputedStyle(modal.value).visibility,
            opacity: window.getComputedStyle(modal.value).opacity,
            zIndex: window.getComputedStyle(modal.value).zIndex
          });
        }

        // DEBUGGING: MutationObserver um zu sehen, ob die show-Klasse entfernt wird
        if (modal.value) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const hasShow = modal.value.classList.contains('show');
                if (!hasShow) {
                  console.error('[DEBUG:VOTING] WARNUNG: show-Klasse wurde ENTFERNT!', new Error().stack);
                }
              }
            });
          });
          observer.observe(modal.value, { attributes: true, attributeFilter: ['class'] });

          // Beende Beobachtung nach 5 Sekunden
          setTimeout(() => observer.disconnect(), 5000);
        }

        console.log('[DEBUG:VOTING] RETURN - showModal() wird hier beendet (Modal bleibt offen)');
        return; // Frühzeitig zurückkehren, kein hide/show
      }

      // WICHTIG: Wenn wir hier sind, bedeutet das, dass bootstrapModal existiert,
      // aber das Modal ist NICHT sichtbar oder es sind keine Stimmen übrig.
      // Wir müssen das Modal schließen und neu öffnen.
      console.log('[DEBUG:VOTING] Modal wird geschlossen und neu geöffnet');

      // Stelle sicher, dass das Modal wirklich geschlossen ist, bevor wir es wieder öffnen
      try {
        console.log('[DEBUG:VOTING] Rufe bootstrapModal.hide() auf');
        // Versuche, das Modal zu verbergen
        bootstrapModal.hide();
        // Kleine Verzögerung, bevor wir es wieder öffnen
        setTimeout(() => {
          try {
            // Prüfe, ob bereits ein anderes Modal geöffnet ist
            const hasActiveModals = document.body.classList.contains('modal-open');
            if (hasActiveModals) {
              // Entferne alle zurückgebliebenen Modal-Elemente
              const activeModals = document.getElementsByClassName('modal show');
              if (activeModals.length > 0) {
                Array.from(activeModals).forEach(modal => {
                  if (modal && modal.id !== 'pollModal') {
                    try {
                      const instance = Modal.getInstance(modal);
                      if (instance) {
                        instance.hide();
                      }
                    } catch (e) {
                      console.error("[DEBUG:VOTING] Fehler beim Schließen eines anderen Modals:", e);
                    }
                  }
                });
              }
            }
            
            // Extra: Bootstrap-Timer-Verzögerung abschalten, damit das Modal sofort geöffnet wird
            if (typeof Modal !== 'undefined' && Modal._getInstance) {
              const modalContent = document.querySelector('#pollModal .modal-content');
              if (modalContent) {
                modalContent.style.transitionDuration = '0.1s';
              }
            }
            
            // Nach aufräumen Modal öffnen und dabei Option setzen, dass es nicht automatisch geschlossen werden kann
            bootstrapModal.show();

            // Stelle sicher, dass Modal sichtbar bleibt durch zusätzliche Klasse
            const modalElement = document.getElementById('pollModal');
            if (modalElement) {
              modalElement.classList.add('force-show');
              modalElement.setAttribute('data-bs-keyboard', 'false');
              modalElement.setAttribute('data-bs-backdrop', 'static');

              // Stelle sicher, dass das Modal im DOM richtig als sichtbar markiert ist
              modalElement.style.display = 'block';
              modalElement.classList.add('show');
              modalElement.setAttribute('aria-modal', 'true');
              modalElement.setAttribute('role', 'dialog');
              document.body.classList.add('modal-open');
            }
          } catch (showErr) {
            console.error("[DEBUG:VOTING] Fehler beim Show nach Timeout:", showErr);
            
            // Trotzdem versuchen, das Modal anzuzeigen
            try {
              bootstrapModal.show();
            } catch (e) {
              console.error("[DEBUG:VOTING] Auch zweiter Versuch fehlgeschlagen:", e);
            }
          }
        }, 150); // Längere Verzögerung für bessere Stabilität
      } catch (modalErr) {
        // Wenn das Schließen fehlschlägt, versuchen wir das Modal trotzdem zu öffnen
        console.warn("[DEBUG:VOTING] Fehler beim Schließen vor Neuanzeige:", modalErr);
        try {
          bootstrapModal.show();
        } catch (e) {
          console.error("[DEBUG:VOTING] Fehler beim direkten Anzeigen:", e);
        }
      }
    } else {
      // Falls nicht, neu initialisieren
      console.warn("[DEBUG:VOTING] bootstrapModal nicht initialisiert, erstelle neu");
      
      // Prüfen, ob die Bootstrap Modal-Klasse verfügbar ist
      if (typeof Modal === 'undefined') {
        console.error("[DEBUG:VOTING] Bootstrap Modal-Klasse ist nicht verfügbar");
        return;
      }
      
      // Vor der Initialisierung nochmal prüfen, ob das DOM-Element existiert
      if (!modal.value) {
        console.error("[DEBUG:VOTING] DOM-Element ist während der Initialisierung verschwunden");
        return;
      }
      
      // Neues Modal erstellen und anzeigen
      bootstrapModal = new Modal(modal.value);
      bootstrapModal.show();
    }
  } catch (error) {
    console.error("[DEBUG:VOTING] Fehler beim Öffnen des Modals:", error);
  }
}

function hideModal() {  
  try {
    // WICHTIG: Stelle vor dem Schließen sicher, dass das Modal gesperrt ist,
    // damit keine weiteren Klicks möglich sind
    isSubmitting.value = true;
    
    // KRITISCH: Lokalen Storage für die aktuelle Abstimmung löschen
    if (props.poll && props.poll.id) {
      localStorage.removeItem(`poll_form_data_${props.poll.id}`);
    }
    
    // Alle UI-relevanten Flags auf true setzen
    if (votingProcess.value) {
      votingProcess.value.pollFormSubmitting.value = true;
      votingProcess.value.currentlyProcessingBatch.value = true;
      votingProcess.value.isProcessingVotes.value = true;
    }
    
    // Sichere Prüfung, ob DOM-Element existiert, bevor Operationen durchgeführt werden
    if (!modal.value) {
      console.warn("[DEBUG:VOTING] Modal-Element nicht verfügbar beim Schließen");
      // Trotzdem Backdrop und modal-open entfernen, falls vorhanden
      cleanupModalEffects();
      return;
    }
    
    // WICHTIG: Wenn das Bootstrap-Modal nicht existiert, neu initialisieren
    if (!bootstrapModal && modal.value) {
      try {
        // Prüfen, ob die Bootstrap Modal-Klasse verfügbar ist
        if (typeof Modal === 'undefined') {
          console.error("[DEBUG:VOTING] Bootstrap Modal-Klasse ist nicht verfügbar");
          cleanupModalEffects(); // Trotzdem aufräumen
          return;
        }
        
        bootstrapModal = new Modal(modal.value);
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler bei Bootstrap-Modal-Initialisierung:', e);
        cleanupModalEffects(); // Trotzdem aufräumen
      }
    }
    
    // Sofortiger Schließversuch ohne Verzögerung
    if (bootstrapModal) {
      try {
        bootstrapModal.hide();
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim Schließen des Modals:', e);
        // Bei Fehler manuelles Aufräumen durchführen
        cleanupModalEffects();
      }
    } else {
      // Wenn kein Bootstrap-Modal vorhanden ist, trotzdem aufräumen
      cleanupModalEffects();
    }
  } catch (error) {
    console.error('[DEBUG:VOTING] Unerwarteter Fehler beim Schließen des Modals:', error);
    // Bei unvorhergesehenem Fehler trotzdem versuchen aufzuräumen
    cleanupModalEffects();
  }
}

// Hilfsfunktion zum sicheren Entfernen von Modal-Effekten
function cleanupModalEffects() {
  try {
    // Sicherer Versuch, das Modal-Element zu bereinigen
    if (modal.value) {
      // Bootstrap-Modal-Klassen entfernen
      modal.value.classList.remove('show');
      modal.value.style.display = 'none';
      modal.value.setAttribute('aria-hidden', 'true');
    }
    
    // Backdrop entfernen - DEAKTIVIERT: Lasse Bootstrap das verwalten
    // const backdrops = document.getElementsByClassName('modal-backdrop');
    // if (backdrops.length > 0) {
    //   // Array.from verwenden, da die HTMLCollection sich verändert bei DOM-Änderungen
    //   Array.from(backdrops).forEach(backdrop => {
    //     if (backdrop && backdrop.parentNode) {
    //       backdrop.parentNode.removeChild(backdrop);
    //     }
    //   });
    // }

    // Body-Styles zurücksetzen
    // KRITISCH: Verzögere das Entfernen der modal-open Klasse, damit andere Modals Zeit haben sich zu öffnen
    // Dies verhindert Race Conditions wenn ResultModal sich gerade öffnet während PollModal schließt
    setTimeout(() => {
      // Nach 500ms prüfen, ob andere Modals offen sind
      const otherOpenModals = document.querySelectorAll('.modal.show:not(#pollModal)');

      if (otherOpenModals.length === 0) {
        // Keine anderen Modals offen - sicher zu entfernen
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.style.pointerEvents = '';
        document.body.style.position = '';
        // console.log('[DEBUG:VOTING] Cleanup: modal-open entfernt nach Verzögerung');
      } else {
        // console.log('[DEBUG:VOTING] Andere Modals sind offen, belasse modal-open Klasse');
      }
    }, 500); // 500ms Verzögerung für ResultModal

    // Verhindere mögliche verbleibende Overlays - DEAKTIVIERT: Lasse Bootstrap das verwalten
    // const overlays = document.querySelectorAll('[data-bs-backdrop="static"]');
    // Array.from(overlays).forEach(overlay => {
    //   if (overlay && overlay.parentNode && !overlay.closest('.modal')) {
    //     overlay.parentNode.removeChild(overlay);
    //   }
    // });
    
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
        
        // Prüfe, ob alle Stimmen abgegeben wurden
        const totalAllowedVotes = props.eventUser?.voteAmount || 0;
        const usedVotes = votingProcess.value?.usedVotesCount?.value || 0;
        const inSplitVoteSituation = usedVotes > 0 && usedVotes < totalAllowedVotes;

        // Nur zurücksetzen, wenn es KEINE Split-Vote-Situation ist oder alle Stimmen abgegeben wurden
        if ((!inSplitVoteSituation || usedVotes >= totalAllowedVotes) && votingProcess.value) {
          votingProcess.value.resetVoteCounts();
        } else if (!inSplitVoteSituation && votingProcess.value.isProcessingVotes.value) {
          // Bei laufender Abstimmung mit Verzögerung zurücksetzen - aber nicht bei Split-Vote
          setTimeout(() => {
            if (votingProcess.value && !inSplitVoteSituation) {
              votingProcess.value.resetVoteCounts();
            }
          }, 500);
        }
      } catch (e) {
        console.error('[DEBUG:VOTING] Fehler beim verzögerten Schließen des Modals:', e);
      }
    }, 100);
  } catch (error) {
    console.error('[DEBUG:VOTING] Fehler beim Bereinigen der Modal-Effekte:', error);
  }
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
  
  // Auch alle Event-Handler explizit freischalten
  if (typeof window !== 'undefined') {
    // Global-Flags zurücksetzen (wichtig für übergeordnete Komponenten)
    window._pollFormSubmitting = false; 
    window._isProcessingVotes = false;
    window._currentlyProcessingBatch = false;
    window._lastSubmittingStartTime = null; // Timestamp zurücksetzen
  }
  
  // GARANTIERTE UI-ENTSPERRUNG mit zusätzlichem DOM-basierten Ansatz
  try {
    // Overlay forciert ausblenden via DOM-Manipulation
    const overlay = document.querySelector('.modal-content > div[style*="background-color: rgba(255,255,255,0.95)"]');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    // Modal-Lockouts zurücksetzen
    // KRITISCH: Verzögere das Entfernen der modal-open Klasse
    setTimeout(() => {
      // WICHTIG: Prüfe ob noch Stimmen übrig sind
      const usedVotes = votingProcess.value.usedVotesCount?.value || 0;
      const maxVotes = props.eventUser?.voteAmount || 0;
      const hasVotesRemaining = usedVotes < maxVotes;

      // WICHTIG: Prüfe ob das PollModal SELBST noch offen ist
      const isPollModalStillOpen = modal.value?.classList.contains('show');
      const otherOpenModalsInReset = document.querySelectorAll('.modal.show:not(#pollModal)');

      // Nur modal-open entfernen, wenn:
      // 1. Keine Stimmen mehr übrig sind (alle abgegeben)
      // 2. UND das PollModal nicht mehr offen ist
      // 3. UND keine anderen Modals offen sind
      if (!hasVotesRemaining && !isPollModalStillOpen && otherOpenModalsInReset.length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        // console.log('[DEBUG:VOTING] Reset: modal-open entfernt nach Verzögerung (alle Stimmen abgegeben)');
      } else {
        // console.log(`[DEBUG:VOTING] modal-open bleibt: hasVotesRemaining=${hasVotesRemaining}, isPollModalStillOpen=${isPollModalStillOpen}, otherModals=${otherOpenModalsInReset.length}`);
      }
    }, 500); // 500ms Verzögerung für ResultModal

    // Backdrops werden NICHT mehr hier entfernt
    // Bootstrap verwaltet seine Backdrops selbst
    // Die Wiederherstellung bei Split-Voting erfolgt in resetSubmittingState()
    // console.log('[DEBUG:VOTING] reset() abgeschlossen, Backdrop-Management an Bootstrap delegiert');
  } catch (e) {
    console.error('[DEBUG:VOTING] Fehler bei DOM-basierter UI-Entsperrung:', e);
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
    
    // Bei jeder Zurücksetzung UI-Lock im voting-process garantiert aufheben
    if (votingProcess.value && typeof votingProcess.value.releaseUILocks === 'function') {
      votingProcess.value.releaseUILocks();
    }
    
    // Event auslösen für globale Koordination
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modal:reset-complete'));
    }
  }, 50);
}

defineExpose({
  showModal,
  hideModal,
  modalState,
  isSubmitting,
  pollForm,
  reset,
  resetSubmittingState // Neue Funktion für externe Komponenten verfügbar machen
});
</script>

<style>
/* Sicherstellen, dass der Modal-Backdrop konsistent in allen Browsern angezeigt wird */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop.fade {
  opacity: 0;
}

.modal-backdrop.show {
  opacity: 0.5;
}

/* Modal selbst muss über dem Backdrop sein */
.modal {
  z-index: 1055;
}

.modal.show {
  display: block;
}

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