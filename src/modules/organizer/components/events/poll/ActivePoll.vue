<template>
  <div v-if="activePoll.title" class="container-active-poll">
    <div class="card active-poll mb-3">
      <div class="card-header">
        <h2 class="h4">
          {{ $t("view.polls.active.title") }}
        </h2>
      </div>
      <div class="card-body">
        <h3>{{ activePoll.title }}</h3>
        <p
          v-if="activePollMaxAnswer > 0"
          v-html="
            t('view.polls.active.voteStatus', {
              votes: safeAnswerCount,
              maxVotes: safeMaxAnswer,
              users: safeVotedCount,
              maxUsers: safeUserCount,
            })
          "
        />
        <p
          v-if="activePollMaxAnswer === 0"
          v-html="
            t('view.polls.active.voteStatus', {
              votes: parseInt(activePoll.answerCount, 10) || 0,
              maxVotes: parseInt(activePoll.maxVotes, 10) || 1,
              users: parseInt(activePoll.pollUserVotedCount, 10) || 0,
              maxUsers: parseInt(activePoll.pollUserCount, 10) || 1,
            })
          "
        />
      </div>
      <div class="card-footer">
        <button
          type="button"
          class="btn btn-danger pull-right"
          @click="onCloseActivePoll"
        >
          {{ $t("view.polls.active.close") }}
        </button>
      </div>
    </div>

    <div class="card active-poll-details mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 v-if="activePollEventUser" class="h4 mb-0">
          {{ t("view.polls.active.details") }}
        </h2>
        <button 
          type="button" 
          class="btn btn-secondary btn-sm" 
          :disabled="isRefreshing"
          @click="onRefresh"
        >
          {{ $t("view.polls.active.refresh") || "Aktualisieren" }}
        </button>
      </div>

      <div class="card-body">
        <div
          v-if="activePollEventUser && activePollEventUser.pollUser"
          class="row"
        >
          <div class="col-12 col-md-auto">
            <h4>{{ t("navigation.views.organizerMemberRoom") }}</h4>
            <ul class="list-group">
              <li
                v-for="(pollUser, index) in activePollEventUser.pollUser"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center align-content-center"
              >
                {{ index + 1 }} - {{ pollUser.publicName }} [{{
                  pollUser.eventUserId
                }}]
                <i
                  class="bi h2 mb-0"
                  :class="{
                    'bi-check text-success': hasVoted(pollUser),
                    'bi-x text-danger': !hasVoted(pollUser),
                  }"
                />
              </li>
            </ul>
          </div>

          <div class="col-12 col-md-auto">
            <h4>{{ t("view.polls.active.alreadyVoted") }}</h4>
            <ul class="list-group">
              <li
                v-for="(
                  pollUserVoted, index
                ) in activePollEventUser.pollUserVoted"
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
    </div>
  </div>
</template>

<script setup>
import t from "@/core/util/l18n";
import { computed, ref } from "vue";

const isRefreshing = ref(false);

const emit = defineEmits(["close", "refresh"]);
const props = defineProps({
  activePoll: {
    type: Object,
    required: true,
  },
  activePollEventUser: {
    type: Object,
    required: true,
  },
  activePollAnswerCount: {
    type: Number,
    required: true,
  },
  activePollMaxAnswer: {
    type: Number,
    required: true,
  },
  pollUserCount: {
    type: Number,
    required: true,
  },
  pollUserVotedCount: {
    type: Number,
    required: true,
  },
});

// Computed properties to ensure valid display values
const safeAnswerCount = computed(() => parseInt(props.activePollAnswerCount, 10) || 0);
const safeMaxAnswer = computed(() => parseInt(props.activePollMaxAnswer, 10) || 1);
const safeUserCount = computed(() => parseInt(props.pollUserCount, 10) || 1);
const safeVotedCount = computed(() => parseInt(props.pollUserVotedCount, 10) || 0);

function hasVoted(pollUser) {
  return props.activePollEventUser?.pollUserVoted?.find((pollUserVoted) => {
    return (
      parseInt(pollUserVoted?.eventUserId, 10) ===
      parseInt(pollUser?.eventUserId, 10)
    );
  });
}

function onCloseActivePoll() {
  emit("close");
}

function onRefresh() {
  isRefreshing.value = true;
  emit("refresh");
}

// Expose isRefreshing to parent component
defineExpose({ isRefreshing });
</script>

<style scoped>
.active-poll,
.active-poll-details {
  width: 100%;
  max-width: 600px;
}
</style>
