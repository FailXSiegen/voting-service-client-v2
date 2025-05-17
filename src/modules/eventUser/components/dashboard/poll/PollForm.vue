<template>
  <form id="poll-form" class="needs-validation" @submit.prevent="onSubmit">
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

        <!-- Quick selection buttons -->
        <div class="btn-group w-100 mb-2">
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting"
            @click="setVotePercentage(25)"
          >
            25% ({{ Math.round(remainingVotes * 0.25) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting"
            @click="setVotePercentage(50)"
          >
            50% ({{ Math.round(remainingVotes * 0.5) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting"
            @click="setVotePercentage(75)"
          >
            75% ({{ Math.round(remainingVotes * 0.75) }})
          </button>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="isSubmitting"
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
              :disabled="isSubmitting"
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
                :disabled="isSubmitting"
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
            :disabled="isSubmitting"
            @update:checked="onCheckboxChange"
          />
        </div>
      </div>
    </fieldset>
    <hr v-if="hasMultipleVotes" />
    <div class="d-flex justify-content-center answer-wrapper">
      <!-- Can only select one. -->
      <fieldset v-if="voteType === VOTE_TYPE_SINGLE" :disabled="isSubmitting">
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
        :disabled="formData.abstain || isSubmitting"
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
      <fieldset :disabled="isSubmitting">
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
      <!-- ABSOLUTE GARANTIERTE SPERRUNG mit der gleichen verstärkten Bedingung wie im Modal -->
      <div
v-if="isSubmitting || votingProcess.isProcessingVotes?.value || votingProcess.currentlyProcessingBatch?.value || votingProcess.pollFormSubmitting?.value || (votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) || !!(props.eventUser.voteAmount && votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)" 
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
      
      <!-- KRITISCH: Die gleiche absolut garantierte Sperrungsbedingung für den Button -->
      <button
type="submit" class="btn btn-primary mx-auto d-block h1" 
              :disabled="isSubmitting || votingProcess.isProcessingVotes?.value || votingProcess.currentlyProcessingBatch?.value || votingProcess.pollFormSubmitting?.value || (votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) || !!(props.eventUser.voteAmount && votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount)" 
              :class="{ 'opacity-50': isSubmitting || votingProcess.isProcessingVotes?.value || votingProcess.currentlyProcessingBatch?.value || votingProcess.pollFormSubmitting?.value || (votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) || !!(props.eventUser.voteAmount && votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) }">
        <span v-if="!(isSubmitting || votingProcess.isProcessingVotes?.value || votingProcess.currentlyProcessingBatch?.value || votingProcess.pollFormSubmitting?.value || (votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount) || !!(props.eventUser.voteAmount && votingProcess.usedVotesCount?.value > 0 && votingProcess.usedVotesCount?.value < props.eventUser.voteAmount))" class="h3">{{ $t("view.polls.modal.submitPoll") }}</span>
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
import { computed, reactive, watch, onMounted, onUnmounted, ref, inject } from "vue";
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
  return props.eventUser.voteAmount - props.voteCounter + 1;
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

onMounted(() => {
  // Immer mit maximaler Stimmenzahl starten
  formData.useAllAvailableVotes = true;
  formData.votesToUse = remainingVotes.value;

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
  // Verhindere Endlos-Rekursion, indem Änderungen nur vorgenommen werden,
  // wenn sich der Wert tatsächlich geändert hat
  if (newValue === oldValue) return;
  
  let correctedValue = newValue;
  
  // Korrigiere den Wert, wenn er außerhalb des gültigen Bereichs liegt
  if (newValue < 1) {
    correctedValue = 1;
  } else if (newValue > remainingVotes.value) {
    correctedValue = remainingVotes.value;
  }
  
  // Aktualisiere nur, wenn sich der Wert nach der Korrektur tatsächlich geändert hat
  if (correctedValue !== newValue) {
    formData.votesToUse = correctedValue;
  }
  
  // Synchronisiere die "Alle Stimmen verwenden" Checkbox 
  // aber nur wenn sich der Wert tatsächlich geändert hat
  const shouldUseAllVotes = (correctedValue === remainingVotes.value);
  if (formData.useAllAvailableVotes !== shouldUseAllVotes) {
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
    // Formularwerte zurücksetzen
    formData.singleAnswer = null;
    formData.multipleAnswers = [];
    formData.abstain = false;

    // WICHTIG: Lokalen Formular-Cache löschen
    if (props.poll && props.poll.id) {
      localStorage.removeItem(`poll_form_data_${props.poll.id}`);
    }

    // Votenzähler IMMER auf Maximum setzen, unabhängig von der Stimmanzahl
    // Auf 100% setzen (alle verbleibenden Stimmen)
    formData.votesToUse = remainingVotes.value;
    formData.useAllAvailableVotes = true;
    
    // Formularvalidierung zurücksetzen
    v$.value.$reset();
    
    // Manuelles DOM-Update erzwingen, um die Radiobuttons visuell zurückzusetzen
    // und die 100%-Vorauswahl visuell zu aktualisieren
    // In einer setTimeout, um nach dem Reactive-Update ausgeführt zu werden
    setTimeout(() => {
      // Nach der RadioInput-Gruppe suchen und manuell zurücksetzen
      const radioInputs = document.querySelectorAll('input[type="radio"]');
      radioInputs.forEach(input => {
        input.checked = false;
      });
      
      // Nach der "Use all votes" Checkbox suchen und IMMER aktivieren
      const checkbox = document.querySelector('#submit-answer-for-each-vote');
      if (checkbox) {
        checkbox.checked = true;
      }
    }, 50);
  }
  
  // Stelle sicher, dass auch der Button-Text und die Overlay-Anzeige aktualisiert werden
  // Sofort nochmal setzen, um eine bessere Reaktivität zu gewährleisten
  isSubmitting.value = false;
}

defineExpose({
  isSubmitting,
  reset,
  resetSubmitState
});
</script>