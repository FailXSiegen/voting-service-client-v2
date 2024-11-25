<template>
  <div v-if="pollResult.poll" class="card mb-3">
    <div class="card-header">
      <h5 class="h4 mb-1">
        {{ pollResult.poll.title }} ({{ $t("view.results.type." + pollResult.type) }}) - 
        {{ getCreateDatetime }}
      </h5>
      <p class="small text-muted">
        {{ $t("view.event.user.member") }}: {{ pollResult.pollUser.length }} |
        {{ $t("view.results.givenVotes") }} {{ pollResult.pollAnswer.length }} |
        {{ $t("view.results.voters") }} {{ pollResult.maxVotes }}
      </p>
    </div>

    <div class="card-body">
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
                    ({{ getAnswerPercentage(answer.length) }})
                  </span>
                </span>
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
                  v-for="(participant, index) in pollResult.pollUser"
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
                            'bg-secondary': answer !== 'Ja' && answer !== 'Nein'
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
import { computed } from "vue";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";

const props = defineProps({
  eventRecord: {
    type: Object,
    required: true,
  },
  pollResult: {
    type: Object,
    required: true,
  },
});

const totalValidVotes = computed(() => {
  return props.pollResult.pollAnswer.filter(answer => 
    answer.answerContent !== 'Enthaltung'
  ).length;
});

const pollAnswerGroups = computed(() => {
  const grouped = groupBy(props.pollResult.pollAnswer, "answerContent");
  const groupsArray = Object.entries(grouped);
  groupsArray.sort((a, b) => b[1].length - a[1].length);
  return groupsArray.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {},
  );
});

const groupedUserAnswers = computed(() => {
  const grouped = {};
  props.pollResult.pollAnswer.forEach(answer => {
    if (!grouped[answer.pollUserId]) {
      grouped[answer.pollUserId] = {};
    }
    grouped[answer.pollUserId][answer.answerContent] = 
      (grouped[answer.pollUserId][answer.answerContent] || 0) + 1;
  });
  return grouped;
});

const getCreateDatetime = computed(() => {
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
  const userFound = props.pollResult.pollUser.find(
    (user) => user.id === pollUserId,
  );
  return userFound ? userFound.publicName : "Unknown";
}

function getAnswerPercentage(answerLength) {
  return ((answerLength / totalValidVotes.value) * 100).toFixed(2) + "%";
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