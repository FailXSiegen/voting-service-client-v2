<template>
  <div v-if="pollResult.poll" class="card mb-3">
    <div class="card-header">
      <h5 class="h4 mb-1">
        {{ pollResult.poll.title }} ({{
          $t("view.results.type." + pollResult.type)
        }}) -
        {{ getCreateDatetime }}
      </h5>
      <p class="small text-muted">
        {{ $t("view.event.user.member") }}: {{ pollResult.pollUser.length }} |
        {{ $t("view.results.givenVotes") }}
        {{ pollResult.pollAnswer.length }} |
        {{ $t("view.results.voters") }}
        {{ pollResult.maxVotes }}
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
                  <span class="ml-2 small"
                    >({{
                      getAnswerPercentage(
                        answer.length,
                        pollResult.pollAnswer.length,
                        pollResult,
                      )
                    }})</span
                  >
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
            data-toggle="collapse"
            :data-target="'#poll-' + pollResult.id + '-ResultVoters'"
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
            data-toggle="collapse"
            :data-target="'#poll-' + pollResult.id + '-ResultDetails'"
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
              <ul v-if="eventRecord.multivoteType == 1" class="list-group">
                <li
                  v-for="(
                    participantWithAnswer, index
                  ) in pollResult.pollAnswer"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ getPublicName(participantWithAnswer.pollUserId) }} -
                  {{ participantWithAnswer.answerContent }}
                </li>
              </ul>
              <ul v-if="eventRecord.multivoteType == 2" class="list-group">
                <li
                  v-for="(user, index) in pollAnswerGroupByUser"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ getPublicName(index) }} - {{ user.length }} x
                  {{ user[0].answerContent }}
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
// @todo refactor this mess.
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

// computed.

const pollAnswerGroups = computed(() => {
  return groupBy(props.pollResult.pollAnswer, "answerContent");
});

const getCreateDatetime = computed(() => {
  return createFormattedDateFromTimeStamp(props.pollResult.createDatetime);
});

const pollAnswerGroupByUser = computed(() => {
  return groupBy(props.pollResult.pollAnswer, "pollUserId");
});

// Functions.

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
  if (!userFound) {
    return "Unknown";
  }
  return userFound.publicName;
}

function getAnswerPercentage(answerLength, answerTotal, pollResult) {
  if (pollResult.poll.pollAnswer !== "custom") {
    return ((answerLength / answerTotal) * 100).toFixed(2) + "%";
  } else {
    return (
      ((answerLength / pollResult.maxVoteCycles) * 100).toFixed(2) +
      "% // " +
      ((answerLength / answerTotal) * 100).toFixed(2) +
      "%"
    );
  }
}
</script>

<style scoped>
.btn-result {
  width: 100%;
  text-align: left;
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
