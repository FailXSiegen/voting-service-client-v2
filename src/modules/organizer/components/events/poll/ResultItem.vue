<template>
  <div v-if="pollResult && pollResult.poll" class="card mb-3">
    <div class="card-header">
      <h5 class="h4 mb-1">
        {{ pollResult.poll.title }} ({{
          $t("view.results.type." + pollResult.type)
        }}) -
        {{ getCreateDatetime }}
      </h5>
      <p class="small text-muted">
        {{ $t("view.event.user.member") }}: {{ pollResult.pollUser?.length || 0 }} |
        <template v-if="hasAbstentions">
          {{ $t("view.results.givenVotes") }} {{ totalValidVotes }}
          {{ $t("view.results.withoutAbstentions") }} |
          {{ $t("view.results.abstentions") }} {{ abstentionCount }} |
          {{ $t("view.results.totalVotes") }}
          {{ pollResult.pollAnswer?.length || 0 }} |
        </template>
        <template v-else>
          {{ $t("view.results.givenVotes") }}
          {{ pollResult.pollAnswer?.length || 0 }} |
        </template>
        {{ $t("view.results.voters") }} {{ pollResult.maxVotes || 0 }} 
        <template v-if="isCustomPoll">
          | {{ $t("view.results.maxVotesPerOption") }}:
          {{ maxVotesPerOption }}
          <template v-if="hasAbstentions">
            | {{ $t("view.results.maxVotesPerOptionNoAbstention") }}:
            {{ maxVotesPerOptionNoAbstention }}
          </template>
        </template>
      </p>
    </div>

    <div class="card-body">
      <div v-if="isCustomPoll" class="row mb-3">
        <div class="col-12">
          <div class="btn-group d-print-none" role="group">
            <button
              type="button"
              class="btn"
              :class="localPercentageType === 'maxPerOptionNoAbstention' ? 'btn-primary' : 'btn-outline-primary'"
              @click="changePercentageType('maxPerOptionNoAbstention')"
            >
              {{ $t("view.results.percentageOfMaxPerOptionNoAbstention") }}
            </button>
            <button
              type="button"
              class="btn"
              :class="localPercentageType === 'maxPerOption' ? 'btn-primary' : 'btn-outline-primary'"
              @click="changePercentageType('maxPerOption')"
            >
              {{ $t("view.results.percentageOfMaxPerOption") }}
            </button>
            <button
              type="button"
              class="btn"
              :class="localPercentageType === 'validVotes' ? 'btn-primary' : 'btn-outline-primary'"
              @click="changePercentageType('validVotes')"
            >
              {{ $t("view.results.percentageOfValidVotes") }}
            </button>
         
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12 col-md-6">
          <p>{{ $t("view.results.mainResult") }}</p>
          <div class="result-list">
            <ul class="list-group">
              <li
                v-for="(answer, index) in pollAnswerGroups"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                {{ index }}
                <span class="result">
                  <span
                    v-if="index === 'Ja'"
                    class="badge badge-pill"
                    style="background-color: green; color: white"
                  >
                    {{ answer.length }}
                  </span>
                  <span
                    v-else-if="index === 'Nein'"
                    class="badge badge-pill"
                    style="background-color: red; color: white"
                  >
                    {{ answer.length }}
                  </span>
                  <span
                    v-else
                    class="badge badge-pill"
                    style="background-color: grey; color: white"
                  >
                    {{ answer.length }}
                  </span>
                  <span v-if="index !== 'Enthaltung'" class="ms-2 small">
                    <span
                      class="percentage-info"
                    >
                      ({{ getAnswerPercentage(answer.length) }})
                    </span>
                    <span v-if="isMajority(answer.length)" class="text-success ms-1">
                      <span
v-if="isAbsoluteMajority(answer.length)" 
                            class="majority-indicator"
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            :title="$t('Absolute Mehrheit: Mehr als 50% der Stimmen je nach ausgewählter Berechnungsmethode')">
                        {{ $t("view.results.absoluteMajority") }}
                      </span>
                      <span
v-else
                            class="majority-indicator"
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            :title="$t('Relative Mehrheit: Die meisten Stimmen von allen Optionen, aber nicht über 50%')">
                        {{ $t("view.results.relativeMajority") }}
                      </span>
                    </span>
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div v-if="isCustomPoll" class="mt-3">
            <p class="mb-1"><strong>{{ $t("view.results.percentageExplanation") }}</strong></p>
            <ul class="small text-muted">
              <li v-if="localPercentageType === 'validVotes'">
                {{ $t("view.results.validVotesExplanation") }}
              </li>
              <li v-if="localPercentageType === 'maxPerOption'">
                {{ $t("view.results.maxPerOptionExplanation", {
                  maxVotesPerOption: maxVotesPerOption
                }) }}
              </li>
              <li v-if="localPercentageType === 'maxPerOptionNoAbstention'">
                {{ $t("view.results.maxPerOptionNoAbstentionExplanation", {
                  maxVotesPerOption: maxVotesPerOption
                }) }}
              </li>
            </ul>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <p>{{ $t("general.member") }}</p>
          <button
            class="btn btn-primary btn-result d-print-none"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#poll-' + pollResult.id + '-ResultVoters'"
            aria-expanded="false"
            :aria-controls="'poll-' + pollResult.id + '-ResultVoters'"
          >
            <i class="bi bi-caret-right-fill" />
            {{ $t("view.results.showMemberList") }}
          </button>
          <div :id="'poll-' + pollResult.id + '-ResultVoters'" class="collapse">
            <div class="card card-body">
              <ul class="list-group">
                <li
                  v-for="(participant, index) in pollResult.pollUser || []"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ participant.publicName }}
                </li>
              </ul>
            </div>
          </div>

          <hr class="divider mx-2" />

          <p v-if="pollResult.type === 'PUBLIC'">
            {{ $t("view.results.detailResult") }}
          </p>
          <button
            v-if="pollResult.type === 'PUBLIC'"
            class="btn btn-primary btn-result d-print-none"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="'#poll-' + pollResult.id + '-ResultDetails'"
            aria-expanded="false"
            :aria-controls="'poll-' + pollResult.id + '-ResultDetails'"
          >
            <i class="bi bi-caret-right-fill" />
            {{ $t("view.results.showDetailResult") }}
          </button>
          <div
            v-if="pollResult.type === 'PUBLIC'"
            :id="'poll-' + pollResult.id + '-ResultDetails'"
            class="collapse"
          >
            <div class="card card-body">
              <ul class="list-group">
                <li
                  v-for="(user, userId) in groupedUserAnswers"
                  :key="userId"
                  class="list-group-item"
                >
                  <div class="d-flex justify-content-between">
                    <span>{{ getPublicName(userId) }}</span>
                    <div class="d-flex gap-2 mt-1">
                      <span
                        v-for="(count, answer) in user"
                        :key="answer"
                        class="d-flex align-items-center"
                      >
                        <span
                          class="badge rounded-pill"
                          :class="{
                            'bg-success': answer === 'Ja',
                            'bg-danger': answer === 'Nein',
                            'bg-secondary':
                              answer !== 'Ja' && answer !== 'Nein',
                          }"
                        >
                          {{ answer }} x{{ count }}
                        </span>
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";

// Bootstrap Tooltips initialisieren
onMounted(() => {
  // Tooltips initialisieren
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});

const props = defineProps({
  eventRecord: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  pollResult: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  // Neuer Prop für den initialen Prozentanzeigetyp
  initialPercentageType: {
    type: String,
    default: "maxPerOptionNoAbstention"
  }
});

// Definiere Emits für die Kommunikation mit dem Modal
const emit = defineEmits(['percentage-type-change']);

// Lokaler State, der auf initialPercentageType initialisiert wird
const localPercentageType = ref(props.initialPercentageType);

// Beobachte Änderungen am initialPercentageType-Prop
watch(() => props.initialPercentageType, (newValue) => {
  localPercentageType.value = newValue;
});

// Funktion zum Ändern des Prozenttyps
function changePercentageType(type) {
  localPercentageType.value = type;
  // Informiere die übergeordnete Komponente (Modal) über die Änderung
  emit('percentage-type-change', type);
}

const totalValidVotes = computed(() => {
  if (!props.pollResult?.pollAnswer) return 0;
  return props.pollResult.pollAnswer.filter(
    (answer) => answer.answerContent !== "Enthaltung",
  ).length;
});

const abstentionCount = computed(() => {
  if (!props.pollResult?.pollAnswer) return 0;
  return props.pollResult.pollAnswer.filter(
    (answer) => answer.answerContent === "Enthaltung",
  ).length;
});

const hasAbstentions = computed(() => {
  return abstentionCount.value > 0;
});

// Maximum selectable options per voter from poll configuration
const maxSelectPerVoter = computed(() => {
  return props.pollResult?.poll?.maxSelect || 1;
});

// Maximum potential votes from participants (number of participants × max selectable options)
const maxPotentialVotes = computed(() => {
  return (props.pollResult?.pollUser?.length || 0) * maxSelectPerVoter.value;
});

// Maximum votes possible per option
const maxVotesPerOption = computed(() => {
  // Wenn poll.maxVotes definiert ist, verwenden Sie es
  if (props.pollResult?.poll?.maxVotes) {
    return (props.pollResult.maxVotes || 0) / props.pollResult.poll.maxVotes;
  }

  // Fallback: Berechnung basierend auf Anzahl der Optionen
  const optionCount = props.pollResult?.poll?.options?.length ||
                     (props.pollResult?.poll?.possibleAnswers?.length || 10);

  // Calculate the voting weight per voter per option
  const votingWeightPerVoter = Math.round(
    (props.pollResult?.maxVotes || 0) /
    (props.pollResult?.pollUser?.length || 1) /
    optionCount
  );

  // The max votes per option is the number of voters × voting weight
  return (props.pollResult?.pollUser?.length || 0) * votingWeightPerVoter;
});

// Maximum votes possible per option (without abstentions)
const maxVotesPerOptionNoAbstention = computed(() => {
  // Basiswert von maxVotesPerOption verwenden
  const baseValue = maxVotesPerOption.value;

  // Wenn keine Enthaltungen vorhanden sind, ist der Wert gleich
  if (!hasAbstentions.value) {
    return baseValue;
  }

  // Jede Enthaltung einfach direkt abziehen
  // Beispiel:
  // Teilnehmer: 2 | Gültige Stimmen: 100 | Enthaltungen: 50 | Gesamt: 150 | Max. pro Option: 600
  // Enthaltungen abziehen: 600 - 50 = 550

  // Einfache Subtraktion der Enthaltungen vom Maximalwert
  return Math.max(0, baseValue - abstentionCount.value);
});

// Check if this is a custom poll (more than Yes/No/Abstain options)
const isCustomPoll = computed(() => {
  if (!props.pollResult?.poll?.pollAnswerType) {
    // If pollAnswerType is not available, try to determine based on answer content
    if (!props.pollResult?.pollAnswer) return false;
    
    const uniqueAnswers = new Set(props.pollResult.pollAnswer.map(a => a.answerContent));
    const standardOptions = new Set(['Ja', 'Nein', 'Enthaltung']);
    
    // If there are answers that are not in the standard set, it's a custom poll
    return [...uniqueAnswers].some(answer => !standardOptions.has(answer));
  }
  
  return props.pollResult.poll.pollAnswerType === 'custom';
});

const pollAnswerGroups = computed(() => {
  if (!props.pollResult?.pollAnswer) return {};
  
  const grouped = groupBy(props.pollResult.pollAnswer, "answerContent");
  const groupsArray = Object.entries(grouped);
  groupsArray.sort((a, b) => b[1].length - a[1].length);
  return groupsArray.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {},
  );
});

const groupedUserAnswers = computed(() => {
  if (!props.pollResult?.pollAnswer) return {};
  
  const grouped = {};
  props.pollResult.pollAnswer.forEach((answer) => {
    if (!grouped[answer.pollUserId]) {
      grouped[answer.pollUserId] = {};
    }
    grouped[answer.pollUserId][answer.answerContent] =
      (grouped[answer.pollUserId][answer.answerContent] || 0) + 1;
  });
  return grouped;
});

const getCreateDatetime = computed(() => {
  if (!props.pollResult?.createDatetime) return '';
  return createFormattedDateFromTimeStamp(props.pollResult.createDatetime);
});

function groupBy(array, key) {
  const result = {};
  array.forEach((item) => {
    if (!result[item[key]]) {
      result[item[key]] = [];
    }
    result[item[key]].push(item);
  });
  return result;
}

function getPublicName(pollUserId) {
  if (!props.pollResult?.pollUser) return "Unknown";
  
  const userFound = props.pollResult.pollUser.find(
    (user) => user.id === pollUserId,
  );
  return userFound ? userFound.publicName : "Unknown";
}

function getAnswerPercentage(answerLength) {
  let denominator = 1; // Default to avoid division by zero
  let percentage = 0;

  switch (localPercentageType.value) {
    case 'validVotes':
      // Original method: percentage of valid votes (excluding abstentions)
      denominator = totalValidVotes.value > 0 ? totalValidVotes.value : 1;
      percentage = (answerLength / denominator) * 100;
      break;

    case 'maxPerOption':
      // Method: percentage of max votes per option
      denominator = maxVotesPerOption.value > 0 ? maxVotesPerOption.value : 1;
      percentage = (answerLength / denominator) * 100;
      break;

    case 'maxPerOptionNoAbstention':
      // Method: percentage of max votes per option without including abstentions
      // Direkt den bereits berechneten Wert verwenden
      denominator = maxVotesPerOptionNoAbstention.value > 0 ? maxVotesPerOptionNoAbstention.value : 1;
      percentage = (answerLength / denominator) * 100;
      break;

    default:
      // Default to max per option without abstentions method
      denominator = maxVotesPerOptionNoAbstention.value > 0 ? maxVotesPerOptionNoAbstention.value : 1;
      percentage = (answerLength / denominator) * 100;
      break;
  }

  // Format percentages - if over 100%, cap display at 100% and show actual in parentheses
  if (percentage > 100) {
    return "100.00% (" + percentage.toFixed(2) + "%)";
  }

  return percentage.toFixed(2) + "%";
}

// Determine if an answer has a majority based on the current percentage type
function isMajority(answerLength) {
  if (!props.pollResult?.pollAnswer) return false;
  
  // Get all vote counts excluding abstentions
  const voteCounts = Object.entries(pollAnswerGroups.value)
    .filter(([option]) => option !== 'Enthaltung')
    .map(([_, answers]) => answers.length);
  
  if (voteCounts.length === 0) return false;
  
  // Sort in descending order
  voteCounts.sort((a, b) => b - a);
  
  // It's a majority if it has the most votes (might be tied for first)
  return answerLength === voteCounts[0];
}

// Determine if an answer has an absolute majority based on the current percentage type
function isAbsoluteMajority(answerLength) {
  if (totalValidVotes.value === 0) return false;

  if (localPercentageType.value === 'validVotes') {
    // For valid votes, absolute majority is more than 50% of valid votes
    return (answerLength / totalValidVotes.value) > 0.5;
  } else if (localPercentageType.value === 'maxPerOption') {
    // For max per option, absolute majority is more than 50% of max votes per option
    return (answerLength / maxVotesPerOption.value) > 0.5;
  } else if (localPercentageType.value === 'maxPerOptionNoAbstention') {
    // For max per option without abstentions, direkt den berechneten Wert verwenden
    return (answerLength / maxVotesPerOptionNoAbstention.value) > 0.5;
  }

  // Default fallback zum neuen Standard - Maximalstimmen pro Option (ohne Enthaltungen)
  return (answerLength / maxVotesPerOptionNoAbstention.value) > 0.5;
}
</script>

<style scoped>
.btn-result {
  width: 100%;
  text-align: left;
}

.gap-2 {
  gap: 0.5rem;
}

.majority-indicator {
  cursor: help;
  text-decoration: underline dotted;
}

@media print {
  .collapse {
    display: block !important;
    height: auto !important;
  }

  .col-md-9 {
    width: 100% !important;
  }

  .list-group-item {
    position: relative;
    page-break-inside: avoid;
    page-break-after: always;
  }
}
</style>