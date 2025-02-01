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
        <div
          v-for="pollUser in activePollEventUser.pollUser"
          :key="pollUser.id"
          class="col-12 col-md-auto"
        >
          {{ hasVoted(pollUser) ? "✅" : "❌" }}
          {{ pollUser.publicName }} [ {{ renderPollAnswer(pollUser) }} ]
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
