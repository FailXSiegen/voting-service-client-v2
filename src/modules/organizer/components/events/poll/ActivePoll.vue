<template>
  <div
    v-if="activePoll.title"
    class="container-active-poll"
  >
    <div class="card active-poll mb-3">
      <div class="card-header">
        <h2 class="h4">
          {{ $t('view.polls.active.title') }}
        </h2>
      </div>
      <div class="card-body">
        <h3>{{ activePoll.title }}</h3>
        <p
          v-if="activePollMaxAnswer > 0"
          v-html="t('view.polls.active.voteStatus', {
            votes: parseInt(activePollAnswerCount, 10),
            maxVotes: activePollMaxAnswer,
            users: pollUserVotedCount,
            maxUsers: pollUserCount
          })"
        />
        <p
          v-if="activePollMaxAnswer === 0"
          v-html="t('view.polls.active.voteStatus', {
            votes: parseInt(activePoll.answerCount, 10),
            maxVotes: activePoll.maxVotes,
            users: activePoll.pollUserVotedCount,
            maxUsers: activePoll.pollUserCount
          })"
        />
      </div>
      <div class="card-footer">
        <button
          type="button"
          class="btn btn-danger pull-right"
          @click="onCloseActivePoll"
        >
          {{ $t('view.polls.active.close') }}
        </button>
      </div>
    </div>

    <div class="card active-poll-details mb-3">
      <div class="card-header">
        <h2
          v-if="activePollEventUser"
          class="h4"
        >
          {{ t('view.polls.active.details') }}
        </h2>
      </div>

      <div class="card-body">
        <div
          v-if="activePollEventUser && activePollEventUser.pollUser"
          class="row"
        >
          <div class="col-12 col-md-auto">
            <h4>{{ t('navigation.views.organizerMemberRoom') }}</h4>
            <ul class="list-group">
              <li
                v-for="(pollUser, index) in activePollEventUser.pollUser"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center align-content-center"
              >
                {{ index + 1 }} - {{ pollUser.publicName }} [{{ pollUser.eventUserId }}]
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
            <h4>{{ t('view.polls.active.alreadyVoted') }}</h4>
            <ul class="list-group">
              <li
                v-for="(pollUserVoted, index) in activePollEventUser.pollUserVoted"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center align-content-center"
              >
                {{ index + 1 }} - {{ pollUserVoted.publicName }} [{{ pollUserVoted.eventUserId }}]
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import t from '@/core/util/l18n';

const emit = defineEmits(['close']);
const props = defineProps({
  activePoll: {
    type: Object,
    required: true
  },
  activePollEventUser: {
    type: Object,
    required: true
  },
  activePollAnswerCount: {
    type: Number,
    required: true
  },
  activePollMaxAnswer: {
    type: Number,
    required: true
  },
  pollUserCount: {
    type: Number,
    required: true
  },
  pollUserVotedCount: {
    type: Number,
    required: true
  }
});

function hasVoted(pollUser) {
  return props.activePollEventUser?.pollUserVoted?.find((pollUserVoted) => {
    return parseInt(pollUserVoted?.eventUserId, 10) === parseInt(pollUser?.eventUserId, 10);
  });
}

function onCloseActivePoll() {
  emit('close');
}
</script>

<style scoped>
.active-poll,
.active-poll-details {
    width: 100%;
    max-width: 600px;
}
</style>
