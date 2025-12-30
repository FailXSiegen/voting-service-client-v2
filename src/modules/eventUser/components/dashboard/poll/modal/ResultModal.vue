<template>
  <div class="container-modal d-print-none">
    <div
      id="resultModal"
      ref="modal"
      class="modal fade"
      tabindex="-1"
      data-bs-keyboard="false"
      data-bs-backdrop="false"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
      >
        <div v-if="pollResult" class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ t("view.polls.modal.result") }}
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="hideModal()"
            ></button>
          </div>
          <div class="modal-body">
            <!-- 
              Wichtig: v-if hinzugefügt, um sicherzustellen, dass die Komponente nur 
              gerendert wird, wenn pollResult vorhanden ist
            -->
            <result-item 
              v-if="pollResult && pollResult.poll" 
              :poll-result="pollResult" 
              :event-record="event"
              :initial-percentage-type="modalPercentageType"
              @percentage-type-change="handlePercentageTypeChange" 
            />
            <div v-else class="alert alert-info">
              Lade Ergebnisse...
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-danger"
              aria-label="Schließen"
              @click="hideModal()"
            >
              <span aria-hidden="true">
                {{ t("view.polls.modal.close") }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Modal } from "bootstrap";
import ResultItem from "@/modules/organizer/components/events/poll/ResultItem.vue";

const modal = ref(null);
let bootstrapModal = null;

// Eigener State für die Prozentanzeige innerhalb des Modals
const modalPercentageType = ref("validVotes");

// Flag, das anzeigt, ob das Modal sichtbar ist
const isVisible = ref(false);

// Flag, das anzeigt, ob das Modal in den letzten 1000ms angezeigt wurde
// Dies verhindert ein Flackern durch zu schnell aufeinanderfolgende show/hide-Aufrufe
const recentlyShown = ref(false);
let recentlyShownTimeout = null;

// Konsistente Initialisierung der isVisible-Referenz
window.setTimeout(() => {
  // Anfangsstatus für isVisible setzen, falls onMounted-Hooks noch nicht ausgeführt wurden
  isVisible.value = false;
}, 0);

// Globaler Flag-Speicher, um den Status von poll.state zu verfolgen
// Diese Variable erlaubt es uns, auf pollState Änderungen zu reagieren
window._resultModalTracking = window._resultModalTracking || {};
window._resultModalTracking.activeModalId = window._resultModalTracking.activeModalId || null;

const props = defineProps({
  pollResult: {
    type: Object,
    required: false,
    default: null,
  },
  event: {
    type: Object,
    required: true,
    default: () => ({}),  // Fallback-Wert als leeres Objekt
  },
});

onMounted(() => {
  // KRITISCH: Bootstrap Modal mit expliziten Optionen initialisieren
  try {
    bootstrapModal = new Modal(modal.value, {
      backdrop: 'static',
      keyboard: false
    });
  } catch (e) {
    console.error('[DEBUG:RESULT] Fehler bei Bootstrap-Modal-Initialisierung im onMounted:', e);
  }

  // Event-Listener hinzufügen, um den sichtbaren Zustand des Modals zu verfolgen
  if (modal.value) {
    // Event-Listener, der erkennt, wenn das Modal angezeigt wird
    modal.value.addEventListener('shown.bs.modal', () => {
      isVisible.value = true;

      // Setze den recently-shown-Status, um Flackern zu verhindern
      recentlyShown.value = true;
      if (recentlyShownTimeout) {
        clearTimeout(recentlyShownTimeout);
      }
      recentlyShownTimeout = setTimeout(() => {
        recentlyShown.value = false;
      }, 1000); // Sperre für 1 Sekunde
    });

    // Event-Listener, der erkennt, wenn das Modal geschlossen wird
    modal.value.addEventListener('hidden.bs.modal', () => {
      isVisible.value = false;
    });
  }
});

function showModal() {
  // console.log('[DEBUG:RESULT] showModal() aufgerufen, isVisible:', isVisible.value);

  // Weniger strenge Prüfung: Nur prüfen, ob das Modal bereits sichtbar ist
  if (isVisible.value) {
    // console.log('[DEBUG:RESULT] Modal ist bereits sichtbar, abbruch');
    return;
  }
  
  // KRITISCHE SICHERHEITSPRÜFUNG: Wenn ein neuer Poll aktiv ist, das Modal NICHT öffnen
  if (window._newPollActive) {
    // console.log('[DEBUG:RESULT] Neuer Poll ist aktiv, Modal wird nicht geöffnet');
    return;
  }
  
  // Debouncing-Flag zurücksetzen, um sicherzustellen, dass wir das Modal zeigen können
  recentlyShown.value = false;
  if (recentlyShownTimeout) {
    clearTimeout(recentlyShownTimeout);
    recentlyShownTimeout = null;
  }
  
  // Reset percentage type to default when opening modal
  modalPercentageType.value = "validVotes";
  
  // KRITISCH: Stelle sicher, dass Bootstrap Modal korrekt initialisiert ist
  if (!bootstrapModal && modal.value) {
    try {
      bootstrapModal = new Modal(modal.value, {
        backdrop: 'static',
        keyboard: false
      });
    } catch (e) {
      console.error('[DEBUG:RESULT] Fehler bei Bootstrap-Modal-Initialisierung:', e);
      isVisible.value = false;
      return;
    }
  }

  if (!bootstrapModal) {
    console.error('[DEBUG:RESULT] Bootstrap Modal konnte nicht initialisiert werden');
    isVisible.value = false;
    return;
  }

  // Generiere eine eindeutige ID für dieses Modal-Fenster
  const modalId = Date.now().toString();
  window._resultModalTracking.activeModalId = modalId;

  // Wir setzen das Flag sofort auf visible um Race-Conditions zu vermeiden
  isVisible.value = true;

  // Modal öffnen
  try {
    // console.log('[DEBUG:RESULT] Rufe bootstrapModal.show() auf');
    bootstrapModal.show();
    // console.log('[DEBUG:RESULT] bootstrapModal.show() erfolgreich');

    // KRITISCH: Stelle sicher, dass modal-open auf Body gesetzt ist
    if (!document.body.classList.contains('modal-open')) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      // console.log('[DEBUG:RESULT] modal-open Klasse auf Body gesetzt');
    }
  } catch (e) {
    console.error('[DEBUG:RESULT] Fehler beim Öffnen des Modals:', e);
    isVisible.value = false;
  }
}

function hideModal() {
  
  // Markiere sofort als nicht mehr sichtbar, um Race-Conditions zu vermeiden
  isVisible.value = false;
  
  // Tracking-ID zurücksetzen
  window._resultModalTracking.activeModalId = null;
  
  // Fallback in case bootstrapModal isn't initialized properly
  if (!bootstrapModal && modal.value) {
    try {
      bootstrapModal = new Modal(modal.value);
    } catch (e) {
      console.error('[DEBUG:VOTING] Fehler bei Bootstrap-Modal-Initialisierung:', e);
    }
  }
  
  // VERSTÄRKTE SCHLIESSEN-METHODE mit mehrfachen Fallbacks
  
  // 1. Versuch: Standard Bootstrap 5 API
  try {
    // Bootstrap-Schließung
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
    
    // Zustand aktualisieren
    recentlyShown.value = false;
    if (recentlyShownTimeout) {
      clearTimeout(recentlyShownTimeout);
      recentlyShownTimeout = null;
    }
  } catch (e) {
    console.error('[DEBUG:VOTING] Fehler bei Standard-Bootstrap-Schließung:', e);
  }
  
  // 2. Versuch: Native Bootstrap 5 API - zweiter Anlauf mit direkter Modal-Instanz
  try {
    if (modal.value && typeof Modal !== 'undefined' && typeof Modal.getInstance === 'function') {
      const instance = Modal.getInstance(modal.value);
      if (instance) {
        instance.hide();
      }
    }
  } catch (e) {
    console.error('[DEBUG:VOTING] Fehler bei nativem Bootstrap-Modal-Zugriff:', e);
  }
  
  // 3. Versuch: Direkter DOM-Zugriff als letzter Fallback
  try {
    if (modal.value) {
      // Alle Bootstrap-Modal-Klassen entfernen
      modal.value.classList.remove('show');
      modal.value.style.display = 'none';
      modal.value.setAttribute('aria-hidden', 'true');
      
      // Backdrop entfernen
      const backdrops = document.getElementsByClassName('modal-backdrop');
      if (backdrops.length > 0) {
        // Array.from um eine echte Array-Kopie zu erstellen, da die HTMLCollection sich verändert wenn Elemente entfernt werden
        Array.from(backdrops).forEach(backdrop => {
          if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
        });
      }
      
      // Modal-Open-Klasse vom Body entfernen
      document.body.classList.remove('modal-open');
      
      // Zusätzlich overflow: hidden vom Body entfernen
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Absolut sicherstellen, dass keine anderen Styles die Interaktion blockieren
      document.body.style.pointerEvents = '';
      
      // Eventuelle fixierte Position zurücksetzen
      document.body.style.position = '';
    }
    
    // Zusätzlich alle Overlays entfernen, die möglicherweise übriggeblieben sind
    const overlays = document.querySelectorAll('.modal-backdrop, [data-bs-backdrop="static"]');
    overlays.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  } catch (domError) {
    console.error('[DEBUG:VOTING] Fehler bei DOM-Manipulation:', domError);
  }
}

// Behandelt Änderungen des Prozenttyps von ResultItem
function handlePercentageTypeChange(newType) {
  modalPercentageType.value = newType;
}

// Neue Methode, um das Poll-Ergebnis von außen zu aktualisieren
function updatePollResult(newPollResult) {
  // Hier können wir die Prop nicht direkt ändern, aber wir können die lokale Variable ändern
  // und die Komponente neu rendern
  if (newPollResult) {
    // Erzwinge ein Re-render der Komponente
    modalPercentageType.value = "validVotes"; // Reset zur Sicherheit
  }
}

defineExpose({
  showModal,
  hideModal,
  isVisible,
  updatePollResult
});
</script>

<style scoped>
/* ResultModal mit integriertem Backdrop-Effekt */
#resultModal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>