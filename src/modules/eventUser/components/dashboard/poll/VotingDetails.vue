<template>
  <div
    v-if="activePollEventUser && activePollEventUser.pollUser"
    class="card mb-3"
  >
    <div class="card-header">
      <h5 class="card-title">
        {{ $t("view.polls.active.title") }}
      </h5>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="d-flex flex-wrap">
          <div
            v-for="(pollUser, index) in activePollEventUser.pollUser"
            :key="pollUser.id"
            class="d-flex align-items-center px-3"
            :class="{ 'border-end border-secondary': index < activePollEventUser.pollUser.length - 1 }"
          >
            <span v-html="hasVoted(pollUser) ? '<i class=\'bi bi-check-square text-success\'></i>' : '<i class=\'bi bi-x-square text-danger\'></i>'"></span>
            <span class="mx-2">{{ pollUser.publicName }}</span>
            <template v-if="getPollUserAnswers(pollUser.id).length">
              <span
                v-for="(count, answer) in groupUserAnswers(pollUser.id)"
                :key="answer"
                class="badge rounded-pill mt-1"
                :class="{
                  'bg-success': answer === 'Ja',
                  'bg-danger': answer === 'Nein',
                  'bg-secondary': answer !== 'Ja' && answer !== 'Nein'
                }"
              >
                {{ answer }} <template v-if="count > 1">x{{ count }}</template>
              </span>
            </template>
            <span v-else class="badge rounded-pill bg-secondary mt-1">?</span>
          </div>
        </div>
      </div>

      <div v-if="false" class="col-12 col-md-auto">
        <h4>{{ t("view.polls.active.alreadyVoted") }}</h4>
        <ul class="list-group">
          <li
            v-for="(pollUserVoted, index) in activePollEventUser.pollUserVoted"
            :key="index"
            class="list-group-item d-flex justify-content-between align-items-center align-content-center"
          >
            {{ index + 1 }} - {{ pollUserVoted.publicName }} [{{
              pollUserVoted.eventUserId
            }}]
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import t from "@/core/util/l18n";

const props = defineProps({
  activePollEventUser: {
    type: Object,
    required: true,
  },
});
function getPollUserAnswers(userId) {
  return props.activePollEventUser?.pollAnswers?.filter(
    (a) => a.pollUserId === userId
  ) || [];
}

function groupUserAnswers(userId) {
  const answers = getPollUserAnswers(userId);
  const grouped = {};
  
  answers.forEach((answer) => {
    grouped[answer.answerContent] = (grouped[answer.answerContent] || 0) + 1;
  });
  
  return grouped;
}
function renderPollAnswer(pollUser) {
  const answers = props.activePollEventUser?.pollAnswers?.filter(
    (a) => a.pollUserId === pollUser.id,
  );
  if (!answers || answers?.length === 0) {
    return "?";
  }
  return answers.map((a) => a.answerContent).join(", ");
}

function hasVoted(pollUser) {
  return props.activePollEventUser?.pollUserVoted?.find((pollUserVoted) => {
    return (
      parseInt(pollUserVoted?.eventUserId, 10) ===
      parseInt(pollUser?.eventUserId, 10)
    );
  });
}
</script>
