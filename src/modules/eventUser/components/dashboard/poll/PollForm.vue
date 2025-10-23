<template>
  <form id="poll-form" class="needs-validation" @submit.prevent="onSubmit">
    <!-- Combined poll hints -->
    <div v-if="(pollHints && pollHints.length > 0) || (transferredVoteHints && transferredVoteHints.length > 0)" class="alert alert-info mb-3">
      <div class="fw-bold mb-2">
        <i class="bi bi-info-circle me-2"></i>
        Stimmenhinweise:
      </div>

      <!-- Received votes -->
      <div
        v-for="hint in pollHints"
        :key="hint.fromUserName + '-received-' + hint.timestamp"
        class="mb-1"
      >
        <button
          v-if="hasMultipleVotes && props.event.multivoteType !== 2"
          type="button"
          class="btn btn-link p-0 text-decoration-none fw-bold"
          :class="{ 'text-muted': hint.voteAmount > remainingVotes }"
          :disabled="hint.voteAmount > remainingVotes"
          @click="setVotesToUse(hint.voteAmount)"
        >
          {{ hint.voteAmount }} Stimme(n)
        </button>
        <span v-else class="fw-bold">
          {{ hint.voteAmount }} Stimme(n)
        </span>
        von {{ hint.fromUserName }} erhalten
        <small class="text-muted ms-2">{{ formatTimestamp(hint.timestamp) }}</small>
        <span v-if="hint.voteAmount > remainingVotes" class="text-muted small">
          (nicht genügend Stimmen übrig)
        </span>
      </div>

      <!-- Transferred votes -->
      <div
        v-for="hint in transferredVoteHints"
        :key="hint.fromUserName + '-transferred-' + hint.timestamp"
        class="mb-1"
      >
        <span class="fw-bold">{{ hint.voteAmount }} Stimme(n)</span> an {{ hint.fromUserName }} übertragen
        <small class="text-muted ms-2">{{ formatTimestamp(hint.timestamp) }}</small>
      </div>
    </div>

    <!-- Vote allocation controls for users with multiple votes -->
    <fieldset v-if="hasMultipleVotes" class="alert alert-info">
      <div class="mb-3">
        <label class="form-label fw-bold">
          {{ $t('view.polls.modal.voteAllocation', { voteAmount: remainingVotes }) }}
          <span class="text-muted ms-2 small">
            ({{ Math.round((remainingVotes / props.eventUser.voteAmount) * 100) }}% {{ $t('view.polls.modal.ofTotalVotes') }})
          </span>
        </label>

        <!-- Progress bar für Stimmenfortschritt -->
        <div class="progress mb-2">
          <div
            class="progress-bar"
            :class="{'bg-success': remainingVotesPercentage > 50, 'bg-warning': remainingVotesPercentage <= 50 && remainingVotesPercentage > 25, 'bg-danger': remainingVotesPercentage <= 25}"
            role="progressbar"
            :style="{ width: remainingVotesPercentage + '%' }"
            :aria-valuenow="remainingVotesPercentage"
            aria-valuemin="0"
            aria-valuemax="100">
            {{ remainingVotes }} / {{ props.eventUser.voteAmount }} {{ $t('view.polls.modal.votes') }}
          </div>
        </div>

        <!-- Quick selection buttons - only show if user has more than 3 votes -->
        <div v-if="props.eventUser.voteAmount > 3" class="btn-group w-100 mb-2">
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            @click="setVotePercentage(25)"
          >
            25% ({{ Math.round(remainingVotes * 0.25) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            @click="setVotePercentage(50)"
          >
            50% ({{ Math.round(remainingVotes * 0.5) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            @click="setVotePercentage(75)"
          >
            75% ({{ Math.round(remainingVotes * 0.75) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            @click="setVotePercentage(100)"
          >
            100% ({{ remainingVotes }})
          </button>
        </div>
        
        <!-- Vote slider and input -->
        <div class="row mb-2">
          <div class="col-12 col-lg-8 d-flex align-items-center">
            <input 
              v-model.number="formData.votesToUse" 
              type="range" 
              class="form-range flex-grow-1 me-2" 
              min="1" 
              :max="remainingVotes"
              :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            >
          </div>
          <!-- Numerical input -->
          <div class="col-12 col-lg-4">
            <div class="input-group">
              <input
                v-model.number="formData.votesToUse"
                type="number"
                class="form-control"
                min="1"
                :max="remainingVotes"
                :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
              >
              <span class="input-group-text">{{ $t('view.polls.modal.votes') }}</span>
            </div>
          </div>
        </div>

        <div class="form-text">
          {{ $t('view.polls.modal.votesToUseHelptext') }}
        </div>

        <!-- Spezielle UI für wenige verbleibende Stimmen -->
        <div v-if="remainingVotesPercentage <= 15" class="alert alert-warning mt-2 mb-2 p-2">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ $t('view.polls.modal.fewVotesRemaining', {
            remaining: remainingVotes,
            total: props.eventUser.voteAmount,
            percentage: remainingVotesPercentage
          }) }}
        </div>

        <!-- Checkbox for "Use all available votes" -->
        <div class="mt-2">
          <CheckboxInput
            id="submit-answer-for-each-vote"
            :label="$t('view.polls.modal.useAllVotes')"
            :help-text="$t('view.polls.modal.canSubmitAnswerForEachVoteHelptext')"
            :checked="formData.useAllAvailableVotes"
            :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)"
            @update:checked="onCheckboxChange"
          />
        </div>
      </div>
    </fieldset>
    <hr v-if="hasMultipleVotes" />
    <div class="d-flex justify-content-center answer-wrapper">
      <!-- Can only select one. -->
      <fieldset v-if="voteType === VOTE_TYPE_SINGLE" :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)">
        <RadioInput
          id="poll-answer"
          :items="possibleAnswers"
          :value="formData.singleAnswer"
          :has-errors="false"
          @change="
            ({ value }) => {
              // Speichern der Antwort-ID - diese kann als Zahl oder String vorliegen
              // Daher senden wir den Wert exakt wie er empfangen wurde ohne Typ-Umwandlung
              // Überprüfe zuerst, ob wir denselben Wert erneut setzen - falls ja, nichts tun
              if (formData.singleAnswer !== value) {
                formData.singleAnswer = value;
              }
            }
          "
        />
      </fieldset>

      <!-- Can select multiple or all. -->
      <fieldset
        v-else-if="voteType === VOTE_TYPE_MULTIPLE_ALL"
        :disabled="formData.abstain || (isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount))"
        :class="{ 'opacity-50': formData.abstain }"
      >
        <CheckboxInputGroup
          :items="possibleAnswers"
          :has-errors="v$.multipleAnswers?.$errors?.length > 0"
          :max-checked-items="poll.maxVotes || null"
          :min-checked-items="poll.minVotes || null"
          :selected-values="formData.multipleAnswers"
          @change="
            (value) => {
              // Nur aktualisieren, wenn die Arrays unterschiedlich sind
              // Dies verhindert unnötige reaktive Aktualisierungen
              if (!Array.isArray(formData.multipleAnswers) || 
                  !Array.isArray(value) ||
                  formData.multipleAnswers.length !== value.length ||
                  formData.multipleAnswers.some((v, i) => v !== value[i])) {
                formData.multipleAnswers = value;
              }
            }
          "
        />
      </fieldset>
    </div>
    <!-- Abstain. -->
    <template v-if="showAbstain">
      <hr />
      <fieldset :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)">
        <CheckboxInput
          id="allow-abstain"
          :label="$t('view.polls.modal.abstain')"
          :help-text="$t('view.polls.modal.abstainHelptext')"
          :checked="formData.abstain"
          @update:checked="handleAbstainChange"
        />
      </fieldset>
    </template>

    <hr />
    <div class="overlay-container position-relative">
      <!-- VERBESSERTE SPERRUNG mit Bedingung, die Split-Voting ermöglicht -->
      <div
v-if="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)" 
           class="position-absolute w-100 h-100 top-0 start-0 z-1" 
           style="background-color: rgba(255,255,255,0.95); cursor: not-allowed;">
        <div class="position-absolute top-50 start-50 translate-middle text-center">
          <span class="spinner-border spinner-border-lg text-primary" role="status"></span>
          <div class="mt-2 fw-bold text-dark">{{ $t("view.polls.modal.submitting") }}...</div>
          <div class="mt-2 small">Bitte warten Sie, Ihre Stimmen werden gezählt</div>
          
          <!-- Fortschrittsanzeige für viele Stimmen -->
          <div v-if="votingProcess.usedVotesCount?.value > 0" class="mt-2">
            Fortschritt: {{ votingProcess.usedVotesCount?.value }} von {{ props.eventUser.voteAmount }} Stimmen
          </div>
        </div>
      </div>
      
      <!-- KRITISCH: Verbesserte Sperrungsbedingung für den Button, die Split-Voting ermöglicht -->
      <button
type="submit" class="btn btn-primary mx-auto d-block h1" 
              :disabled="isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)" 
              :class="{ 'opacity-50': isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) }">
        <span v-if="!(isSubmitting && !(votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount))" class="h3">{{ $t("view.polls.modal.submitPoll") }}</span>
        <span v-else class="d-flex align-items-center justify-content-center">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span class="h3">{{ $t("view.polls.modal.submitting") }}</span>
        </span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { computed, reactive, watch, onMounted, onUnmounted, ref, inject, watchEffect } from "vue";
import { detectBrowser, isLocalStorageAvailable } from "@/core/utils/browser-compatibility";
import { and, or, required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import RadioInput from "@/core/components/form/RadioInput.vue";
import CheckboxInputGroup from "@/core/components/form/CheckboxInputGroup.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";
import {
  minLength,
  objectPropertyIsEqual,
  objectPropertyIsGreaterThan,
  maxLength,
  objectPropertyIsNotEqual,
} from "@/core/form/validation/same-as";

const VOTE_TYPE_SINGLE = 1;
const VOTE_TYPE_MULTIPLE_ALL = 2;

const emit = defineEmits(["submit"]);
const props = defineProps({
  poll: {
    type: Object,
    required: true,
  },
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
  voteCounter: {
    type: Number,
    required: true,
  },
});

// Instanziere votingProcess für den Zugriff auf usedVotesCount und andere Status
// KRITISCH: Die direkten Flags von votingProcess werden für Sperrung verwendet
const votingProcess = useVotingProcess(props.eventUser, props.event);

// Einfacher lokaler State
const isSubmitting = ref(false);
const safariCompatibilityMode = ref(false);
const storageFunctional = ref(true);

// Poll hints berechnen
const pollHints = computed(() => {
  if (!props.eventUser.pollHints) {
    return [];
  }

  try {
    const hints = JSON.parse(props.eventUser.pollHints);
    const hintsArray = Array.isArray(hints) ? hints : [];

    // Filtere nur 'received' Hints
    return hintsArray.filter(hint => hint.type === 'received' || !hint.type);
  } catch (e) {
    console.warn('Konnte pollHints nicht parsen:', e);
    return [];
  }
});

// Poll hints für abgegebene Stimmen berechnen
const transferredVoteHints = computed(() => {
  if (!props.eventUser.pollHints) {
    return [];
  }

  try {
    const hints = JSON.parse(props.eventUser.pollHints);
    const hintsArray = Array.isArray(hints) ? hints : [];

    // Filtere nur 'transferred' Hints
    return hintsArray.filter(hint => hint.type === 'transferred');
  } catch (e) {
    console.warn('Konnte pollHints nicht parsen:', e);
    return [];
  }
});

const voteType = computed(() => {
  if (props.poll.maxVotes === 1) {
    return VOTE_TYPE_SINGLE;
  }
  if (props.poll.maxVotes > 1 || props.poll.maxVotes === 0) {
    return VOTE_TYPE_MULTIPLE_ALL;
  }
  throw Error("Invalid voting setup!");
});

const showAbstain = computed(
  () =>
    props.poll.allowAbstain &&
    props.poll.pollAnswer === "custom"
);

const possibleAnswers = computed(() => {
  const result = [];
  props.poll.possibleAnswers.forEach((answer) => {
    result.push({
      label: answer.content,
      value: parseInt(answer.id, 10),
    });
  });

  return result;
});

const remainingVotes = computed(() => {
  // Wenn wir einen neuen Poll haben (props.poll.id ist neu oder hat sich geändert),
  // oder wenn ein poll-reset-Event stattgefunden hat, sollten wir die gesamte voteAmount verwenden
  if (typeof window !== 'undefined' && window._newPollActive === true) {
    // console.log("[DEBUG:VOTING] remainingVotes: Verwende komplette voteAmount, da neuer Poll aktiv");
    return props.eventUser.voteAmount;
  }
  
  // KRITISCH: Wir brauchen eine zuverlässige, konsistente Quelle für used votes
  // Egal ob aus lokalem votingProcess oder globalem Modul
  let usedVotes = 0;
  
  // Zuerst prüfen wir alle möglichen Quellen und verwenden den HÖCHSTEN Wert
  // Dies stellt sicher, dass wir niemals Stimmen "verlieren"
  if (votingProcess && votingProcess.usedVotesCount && votingProcess.usedVotesCount.value !== undefined) {
    usedVotes = Math.max(usedVotes, votingProcess.usedVotesCount.value || 0);
  }
  
  if (window && window.votingProcessModule && window.votingProcessModule.usedVotesCount !== undefined) {
    usedVotes = Math.max(usedVotes, window.votingProcessModule.usedVotesCount || 0);
  }
  
  // Zuletzt die voteCounter-Berechnung als zusätzliche Quelle (falls höher)
  const voteCounterBasedUsed = (props.voteCounter > 1) ? (props.voteCounter - 1) : 0;
  usedVotes = Math.max(usedVotes, voteCounterBasedUsed);
  
  // Jetzt zur Sicherheit in beide andere Quellen zurückspeichern für Konsistenz
  if (votingProcess && votingProcess.usedVotesCount) {
    votingProcess.usedVotesCount.value = usedVotes;
  }
  
  if (window && window.votingProcessModule) {
    window.votingProcessModule.usedVotesCount = usedVotes;
  }
  
  const total = props.eventUser.voteAmount;
  
  // KRITISCH: Wenn total und usedVotes gleich sind, können keine Stimmen mehr abgegeben werden
  // In diesem Fall können wir direkt 0 zurückgeben, um unerwünschtes Verhalten zu vermeiden
  if (total <= usedVotes) {
    // Reset formData.votesToUse auf 0, wenn alle Stimmen aufgebraucht sind
    // Dies verhindert Endlosschleifen bei der Validierung
    if (formData && formData.votesToUse !== 0) {
      // Nicht-reaktive Änderung durch direkten Zugriff auf das Objekt
      setTimeout(() => {
        formData.votesToUse = 0;
        
        // Alle Stimmen aufgebraucht = 100% verwendet
        formData.useAllAvailableVotes = true;
        
        // console.log("[DEBUG:VOTING] Keine Stimmen mehr übrig: votesToUse auf 0 gesetzt");
      }, 0);
    }
    
    // console.log(`[DEBUG:VOTING] remainingVotes: Endgültiger usedVotes=${usedVotes}, keine Stimmen mehr übrig`);
    return 0;
  }
  
  // console.log(`[DEBUG:VOTING] remainingVotes: Endgültiger usedVotes=${usedVotes}, verbleibend=${total - usedVotes}`);
  return total - usedVotes;
});

// Ursprüngliche Berechnung, ob mehrere Stimmen vorhanden sind
const rawHasMultipleVotes = computed(() => {
  return props.eventUser.voteAmount > 1 && props.event.multivoteType === 1;
});

// Sicherer Berechnungsweg für hasMultipleVotes mit expliziter Typ-Konvertierung
// und Fallback für Safari und problematische Browser
const hasMultipleVotes = computed(() => {
  // Standard-Berechnung
  const standardCheck = parseInt(props.eventUser.voteAmount || 0, 10) > 1 && 
                        parseInt(props.event.multivoteType || 0, 10) === 1;
  
  // Safari-Kompatibilitätsmodus, falls aktiviert oder Browser-Probleme erkannt wurden
  if (safariCompatibilityMode.value || !storageFunctional.value) {
    return standardCheck || (parseInt(props.eventUser.voteAmount || 0, 10) > 1);
  }
  
  return standardCheck;
});

// Berechne den Prozentsatz der verbleibenden Stimmen im Verhältnis zur Gesamtstimmzahl
const remainingVotesPercentage = computed(() => {
  return Math.round((remainingVotes.value / props.eventUser.voteAmount) * 100);
});

// Form and validation setup.
const formData = reactive({
  singleAnswer: null,
  multipleAnswers: [],
  abstain: false,
  useAllAvailableVotes: true, // Standardmäßig "Alle Stimmen verwenden" aktivieren
  votesToUse: 1,
});

// KRITISCH: Überwache explizit die Poll-ID, um das Formular zurückzusetzen
// wenn zu einer neuen Abstimmung gewechselt wird
watch(() => props.poll?.id, (newPollId, oldPollId) => {
  if (newPollId && oldPollId && newPollId !== oldPollId) {
    // Vermeide rekursive Updates, indem wir die Aktualisierung verzögern
    setTimeout(() => {
      // KRITISCH: Alte Poll-Daten aus localStorage löschen
      try {
        localStorage.removeItem(`poll_form_data_${oldPollId}`);
      } catch (e) {
        console.error('Fehler beim Löschen der localStorage-Daten:', e);
      }

      // Formular vollständig zurücksetzen
      reset(false);

      // Mit maximaler Stimmenzahl neu starten
      // Nur wenn die Werte nicht bereits gesetzt sind
      if (!formData.useAllAvailableVotes) {
        formData.useAllAvailableVotes = true;
      }
      
      if (formData.votesToUse !== remainingVotes.value) {
        formData.votesToUse = remainingVotes.value;
      }
    }, 10); // Eine kleine Verzögerung für bessere Event-Verarbeitung
  }
}, { immediate: true });

// WICHTIG: Beobachte auch remainingVotes, um bei jeder Änderung das Formular auf 100% zu setzen
watch(() => remainingVotes.value, (newValue, oldValue) => {
  // Nur reagieren, wenn sich der Wert tatsächlich geändert hat
  if (newValue === oldValue) return;
  
  // Rekursion-Schutz: Stelle sicher, dass wir nicht in eine Endlosschleife geraten
  // indem wir prüfen, ob wir bereits auf dem aktuellen Wert sind
  if (formData.votesToUse !== newValue) {
    formData.votesToUse = newValue;
  }
  
  // Checkbox nur setzen, wenn der Zustand sich ändert
  if (!formData.useAllAvailableVotes) {
    formData.useAllAvailableVotes = true;
  }
}, { flush: 'post' }); // Verzögere die Ausführung bis nach dem DOM-Update

// KRITISCH: Entfernen der alten bidirektionalen Synchronisierung
// Diese wird jetzt direkt in der remainingVotes-Berechnung durchgeführt
// und ist dort wesentlich zuverlässiger, da sie bei jedem Zugriffsversuch
// auf remainingVotes sofort erfolgt

onMounted(() => {
  // Um die Anzahl der verwendeten Stimmen korrekt zu initialisieren,
  // rufen wir einfach remainingVotes.value auf. Dies löst die 
  // verbesserte Berechnung aus, die alle Quellen synchronisiert.
  
  // Ein kurzer Timeout ist wichtig, damit alle Komponenten vollständig geladen sind
  setTimeout(() => {
    // Dieser Aufruf synchronisiert alle Quellen und erhält den maximalen usedVotes-Wert
    const actualRemaining = remainingVotes.value;
    // console.log(`[DEBUG:VOTING] onMounted Initialisierung: Verbleibende Stimmen=${actualRemaining}`);
    
    // Immer mit maximaler Stimmenzahl starten
    formData.useAllAvailableVotes = true;
    formData.votesToUse = actualRemaining;
  }, 100);

  // KRITISCH: Beim ersten Laden sicherstellen, dass keine alten Daten vorhanden sind
  if (props.poll && props.poll.id) {
    // Alte Daten löschen - mit sicherer Fehlerbehandlung
    try {
      localStorage.removeItem(`poll_form_data_${props.poll.id}`);
    } catch (e) {
      console.error('Fehler beim Löschen von localStorage-Daten:', e);
      storageFunctional.value = false;
    }
  }
  
  // KRITISCHES FIX: Safety Timer einrichten, der isSubmitting nach einer gewissen Zeit zurücksetzt
  // Dies ist besonders wichtig für Split-Voting, wenn die UI hängenbleibt
  const safetyTimer = setInterval(() => {
    // Prüfen, ob wir in einer Split-Vote-Situation sind (bereits abgegebene Stimmen, aber nicht alle)
    const maxAllowedVotes = props.eventUser?.voteAmount || 0;
    const currentUsedVotes = votingProcess?.usedVotesCount?.value || 0;
    const isSplitVoting = currentUsedVotes > 0 && currentUsedVotes < maxAllowedVotes;
    
    // Wenn wir in Split-Voting sind und isSubmitting ist gesetzt, nach 10 Sekunden zurücksetzen
    if (isSplitVoting && isSubmitting.value) {
      // Prüfe, wann isSubmitting zuletzt gesetzt wurde
      const lastSubmitTime = window._lastSubmittingStartTime || 0;
      const now = Date.now();
      
      // Wenn mehr als 10 Sekunden vergangen sind, isSubmitting zurücksetzen
      if (now - lastSubmitTime > 10000) {
        console.warn("[DEBUG:VOTING] Safety Timer: isSubmitting wird zurückgesetzt nach 10s in Split-Voting");
        isSubmitting.value = false;
        
        // Auch die voting-process Flags zurücksetzen
        if (votingProcess) {
          // Nur setzen, wenn sie existieren und true sind
          if (votingProcess.pollFormSubmitting && votingProcess.pollFormSubmitting.value === true) {
            votingProcess.pollFormSubmitting.value = false;
          }
          
          if (votingProcess.isProcessingVotes && votingProcess.isProcessingVotes.value === true) {
            votingProcess.isProcessingVotes.value = false;
          }
          
          // Auch die releaseUILocks-Funktion aufrufen, falls verfügbar
          if (typeof votingProcess.releaseUILocks === 'function') {
            votingProcess.releaseUILocks();
          }
        }
      }
    }
  }, 5000); // Alle 5 Sekunden prüfen
  
  // Safety Timer bereinigen, wenn Komponente entfernt wird
  onUnmounted(() => {
    clearInterval(safetyTimer);
  });
  
  // Browser-Erkennung für Safari und andere problematische Browser
  const browser = detectBrowser();
  
  // Spezieller Safari-Kompatibilitätsmodus
  if (browser.isSafari) {
    console.info('Safari erkannt - Prüfe localStorage-Funktionalität');
    
    // Prüfe, ob localStorage funktioniert
    storageFunctional.value = isLocalStorageAvailable();
    
    if (!storageFunctional.value) {
      console.warn('localStorage-Probleme erkannt - aktiviere Safari-Kompatibilitätsmodus');
      safariCompatibilityMode.value = true;
    }
  }
  
  // Prüfe explizit, ob voteAmount korrekt funktioniert
  if (typeof props.eventUser.voteAmount === 'undefined' || props.eventUser.voteAmount === null) {
    console.warn('voteAmount ist undefiniert oder null - aktiviere Kompatibilitätsmodus');
    safariCompatibilityMode.value = true;
  }
  
  // Wenn Kompatibilitätsmodus aktiv ist, stelle sicher, dass der Formular-Reset korrekt funktioniert
  if (safariCompatibilityMode.value) {
    // Sicherstellen, dass useAllAvailableVotes und votesToUse korrekt gesetzt sind
    setTimeout(() => {
      formData.useAllAvailableVotes = true;
      formData.votesToUse = remainingVotes.value;
    }, 100);
  }
});

function setVotePercentage(percentage) {
  const votesToUse = Math.max(1, Math.min(
    remainingVotes.value,
    Math.round((remainingVotes.value * percentage) / 100)
  ));

  formData.votesToUse = votesToUse;

  if (percentage === 100) {
    formData.useAllAvailableVotes = true;
  } else {
    formData.useAllAvailableVotes = false;
  }
}

function setVotesToUse(amount) {
  if (amount <= remainingVotes.value && amount > 0) {
    formData.votesToUse = amount;
    formData.useAllAvailableVotes = (amount === remainingVotes.value);
  }
}

function onCheckboxChange(isChecked) {
  // Überprüfe, ob sich der Zustand tatsächlich geändert hat
  if (formData.useAllAvailableVotes === isChecked) return;
  
  formData.useAllAvailableVotes = isChecked;

  // Nur die Stimmenzahl aktualisieren, wenn wir "Alle Stimmen" auswählen
  // und der aktuelle Wert nicht bereits die maximale Stimmenzahl ist
  if (isChecked && formData.votesToUse !== remainingVotes.value) {
    formData.votesToUse = remainingVotes.value;
  }

  // Überprüfe, ob wir bei jedem UI-Event den Button-Status aktualisieren sollten
  if (window.pollFormSubmitting !== undefined) {
    isSubmitting.value = window.pollFormSubmitting;
  }
}

// Handler für Enthaltungs-Checkbox
function handleAbstainChange(isChecked) {
  formData.abstain = isChecked;
  // Keine automatische Änderung der Stimmzahl bei Enthaltung
}

watch(() => formData.votesToUse, (newValue, oldValue) => {
  // Spezialfall: Wenn das Formular gerade zurückgesetzt wurde, nicht eingreifen
  if (window._formResetInProgress === true) {
    // console.log("[DEBUG:VOTING] Watch votesToUse: Reset läuft, überspringe Korrektur");
    return;
  }

  // KRITISCH: Endlosschleifen-Erkennung und Schutz
  // Erkenne mögliche Endlosschleifen bei Werten nahe 0 oder remainingVotes
  if (typeof window._votesToUsePreviousValues === 'undefined') {
    window._votesToUsePreviousValues = [];
  }
  
  // Füge aktuellen Wert zum Verlauf hinzu
  window._votesToUsePreviousValues.push(newValue);
  
  // Behalte nur die letzten 5 Werte
  if (window._votesToUsePreviousValues.length > 5) {
    window._votesToUsePreviousValues.shift();
  }
  
  // Prüfe auf oszillierende Werte (mögliche Endlosschleife)
  const uniqueValues = new Set(window._votesToUsePreviousValues);
  if (window._votesToUsePreviousValues.length >= 4 && uniqueValues.size <= 2) {
    console.warn("[DEBUG:VOTING] Mögliche Endlosschleife erkannt in votesToUse watch. Überspringe Update.");
    return;
  }

  // Debug-Ausgabe
  // console.log("[DEBUG:VOTING] Watch votesToUse: Änderung von", oldValue, "zu", newValue, "| remainingVotes =", remainingVotes.value);
  
  // Verhindere Endlos-Rekursion, indem Änderungen nur vorgenommen werden,
  // wenn sich der Wert tatsächlich geändert hat
  if (newValue === oldValue) return;
  
  // KRITISCH: Spezialbehandlung für den Fall, dass remainingVotes 0 ist
  // In diesem Fall akzeptieren wir nur 0 als gültigen Wert für votesToUse
  if (remainingVotes.value === 0) {
    if (newValue !== 0) {
      // console.log("[DEBUG:VOTING] Watch votesToUse: Setze Wert auf 0, da keine Stimmen mehr übrig");
      formData.votesToUse = 0;
    }
    // Checkbox auf true setzen, da 0 von 0 = 100%
    if (!formData.useAllAvailableVotes) {
      formData.useAllAvailableVotes = true;
    }
    return;
  }
  
  let correctedValue = newValue;
  
  // Korrigiere den Wert, wenn er außerhalb des gültigen Bereichs liegt
  if (newValue < 1) {
    correctedValue = 1;
  } else if (newValue > remainingVotes.value) {
    correctedValue = remainingVotes.value;
  }
  
  // Aktualisiere nur, wenn sich der Wert nach der Korrektur tatsächlich geändert hat
  if (correctedValue !== newValue) {
    // console.log("[DEBUG:VOTING] Watch votesToUse: Korrigiere Wert von", newValue, "zu", correctedValue);
    formData.votesToUse = correctedValue;
  }
  
  // Synchronisiere die "Alle Stimmen verwenden" Checkbox 
  // aber nur wenn sich der Wert tatsächlich geändert hat
  const shouldUseAllVotes = (correctedValue === remainingVotes.value);
  if (formData.useAllAvailableVotes !== shouldUseAllVotes) {
    // console.log("[DEBUG:VOTING] Watch votesToUse: Checkbox-Synchronisierung auf", shouldUseAllVotes);
    formData.useAllAvailableVotes = shouldUseAllVotes;
  }
}, { flush: 'post' }); // Verzögere die Ausführung bis nach dem DOM-Update

// Bei Änderung des abstain-Status nur die Formularvalidierung aktualisieren,
// aber keine automatische Änderung an der Stimmenzahl vornehmen
watch(() => formData.abstain, () => {
  // Nur Validierung neu auslösen, keine automatische Änderung der Stimmzahl
});

const rules = computed(() => {
  return {
    singleAnswer: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual("value", voteType, VOTE_TYPE_SINGLE),
        // Min vote = 1 and max vote = 1 (Required to pick 1 answer).
        and(
          objectPropertyIsEqual("minVotes", props.poll, 1),
          objectPropertyIsEqual("maxVotes", props.poll, 1),
          required,
        ),
        // Min vote = 0 and max vote = 1 (Can pick 1 answer).
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 1),
        ),
      ),
    },
    multipleAnswers: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual("value", voteType, VOTE_TYPE_MULTIPLE_ALL),
        // Min vote = 0 and max vote = 0 (Do what you want)
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 0),
        ),
        // Min vote = 0 and max vote > 0 (can not be greater than max vote)
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsGreaterThan("maxVotes", props.poll, 0),
          maxLength(props.poll.maxVotes),
        ),
        // Min vote > 0 and max vote = 0 (must be at least the length of min vote)
        and(
          objectPropertyIsGreaterThan("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 0),
          minLength(props.poll.minVotes),
        ),
        // Min vote > 0 and max vote > 0
        // (must be at least the length of min vote but can not be greater than max vote)
        and(
          objectPropertyIsGreaterThan("minVotes", props.poll, 0),
          objectPropertyIsGreaterThan("maxVotes", props.poll, 0),
          maxLength(props.poll.maxVotes),
          minLength(props.poll.minVotes),
        ),
        // Allow to abstain.
        and(
          objectPropertyIsEqual("allowAbstain", props.poll, true),
          objectPropertyIsEqual("abstain", formData, true),
        ),
      ),
    },
    votesToUse: {
      required,
    },
  };
});
const v$ = useVuelidate(rules, formData);

// Events.

async function onSubmit() {
  if (isSubmitting.value) {
    return;
  }
  
  try {
    // Verbesserte explizite Prüfung auf gültige Auswahl
    // Wenn Enthaltung gewählt wurde, dann ist das eine gültige Auswahl
    if (formData.abstain) {
      // Bei Enthaltung sind keine weiteren Prüfungen nötig
    } else if (!formData.singleAnswer && (!formData.multipleAnswers || formData.multipleAnswers.length === 0)) {
      alert('Bitte treffen Sie eine Auswahl');
      return;
    }
    
    // Prüfe, ob ein Radio-Button ausgewählt wurde bei Single-Choice-Abstimmungen
    // Überspringen wenn Enthaltung gewählt ist
    if (voteType.value === VOTE_TYPE_SINGLE && !formData.singleAnswer && !formData.abstain) {
      console.error('Keine Antwort bei Single-Choice ausgewählt');
      alert('Bitte wählen Sie eine Antwort aus.');
      return;
    }
    
    // Sicher gehen, dass votesToUse einen gültigen Wert hat
    if (typeof formData.votesToUse !== 'number' || formData.votesToUse < 1) {
      formData.votesToUse = 1;
    }
    
    // Validierung
    const result = await v$.value.$validate();
    if (!result) {
      console.error(`[ERROR:FORM] Validierungsfehler:`, v$.value.$errors);
      
      // Stelle sicher, dass wir den Nutzer gut informieren
      const errorMessages = v$.value.$errors.map(e => e.$message).join(', ');
      alert(`Bitte überprüfen Sie Ihre Eingaben: ${errorMessages}`);
      return;
    }
    
    isSubmitting.value = true;
    
    formData.type = voteType.value;
    emit("submit", {...formData}); // Kopie des Objekts übergeben
    
    // Status wird durch pollAnswerLifeCycle-Event oder Fehlerbehandlung zurückgesetzt
    // Explizites Zurücksetzen geschieht in SyncEventDashboard.vue, nicht hier
    
  } catch (error) {
    console.error("Fehler beim Absenden:", error);
    // Bei Fehler lokal zurücksetzen
    isSubmitting.value = false;
  }
}

// Es gibt zwei Arten von Reset: Entweder nur den Submitting-Status oder alles
function resetSubmitState() {
  isSubmitting.value = false;
  
  // Stelle sicher, dass auch der Button-Text und die Overlay-Anzeige aktualisiert werden
  // Sofort nochmal setzen, um eine bessere Reaktivität zu gewährleisten
  isSubmitting.value = false;
}

function reset(keepSelection = false) {
  isSubmitting.value = false;

  if (!keepSelection) {
    // Formularvalidierung zurücksetzen
    v$.value.$reset();

    // WICHTIG: Lokalen Formular-Cache löschen
    if (props.poll && props.poll.id) {
      localStorage.removeItem(`poll_form_data_${props.poll.id}`);
    }

    // Formularwerte zurücksetzen
    formData.singleAnswer = null;
    formData.multipleAnswers = [];
    formData.abstain = false;

    // KRITISCH: Reihenfolge ist wichtig - zuerst useAllAvailableVotes, dann erst votesToUse
    // Dadurch wird verhindert, dass die watch-Funktion für votesToUse 
    // den useAllAvailableVotes-Wert zurücksetzt
    formData.useAllAvailableVotes = true;

    // Kleiner Timeout, um sicherzustellen, dass alle Komponenten up-to-date sind
    setTimeout(() => {
      // Garantiere, dass wir den korrekten Wert haben
      // Dies wird die verbesserte Synchronisierung auslösen
      const currentRemainingVotes = remainingVotes.value;
      // console.log("[DEBUG:VOTING] Reset mit remainingVotes:", currentRemainingVotes);
      
      // Sicherstellen, dass votesToUse einen gültigen Wert hat
      if (typeof currentRemainingVotes !== 'number' || currentRemainingVotes < 1) {
        // Fallback, wenn remainingVotes ungültig ist
        console.warn("[DEBUG:VOTING] Ungültiger remainingVotes-Wert:", currentRemainingVotes);
        const fallbackValue = props.eventUser?.voteAmount || 1;
        formData.votesToUse = fallbackValue;
      } else {
        // Normaler Fall: Setze auf die verfügbaren Stimmen
        formData.votesToUse = currentRemainingVotes;
      }
    }, 50);
    
    // Zweimal setzen für garantierte Reaktivität
    setTimeout(() => {
      // Nochmal garantieren, dass diese Werte korrekt gesetzt sind
      formData.useAllAvailableVotes = true;
      formData.votesToUse = remainingVotes.value;
      
      // Nach der RadioInput-Gruppe suchen und manuell zurücksetzen
      const radioInputs = document.querySelectorAll('input[type="radio"]');
      radioInputs.forEach(input => {
        input.checked = false;
      });
      
      // console.log("[DEBUG:VOTING] Nach Reset: votesToUse =", formData.votesToUse, "useAllAvailableVotes =", formData.useAllAvailableVotes);
    }, 50);
  }
  
  // Stelle sicher, dass auch der Button-Text und die Overlay-Anzeige aktualisiert werden
  // Sofort nochmal setzen, um eine bessere Reaktivität zu gewährleisten
  isSubmitting.value = false;
}

// Funktion zur Formatierung von Unix-Timestamps
function formatTimestamp(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    console.warn('Fehler beim Formatieren des Timestamps:', e);
    return '';
  }
}

defineExpose({
  isSubmitting,
  reset,
  resetSubmitState
});
</script>