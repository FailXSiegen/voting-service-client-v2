<template>
  <div
    v-if="activePoll.title"
    class="container-active-poll"
  >
    <h2>{{ $t('view.polls.active.title') }}</h2>
    <h3>{{ activePoll.title }}</h3>
    <p v-if="activePollMaxAnswer > 0">
      Abgegebene Stimmen
      <span
        v-if="!activePollAnswerCount"
        class="noAnswerCount"
      >0</span>
      <span
        v-if="activePollAnswerCount > 0"
        class="answerCount"
      >{{
        activePollAnswerCount
      }}</span>
      von maximal {{ activePollMaxAnswer }}<br>
      Personen: {{ pollUserVotedCount }} / {{ pollUserCount }}
    </p>
    <p v-if="activePollMaxAnswer == 0">
      Abgegebene Stimmen
      <span
        v-if="!activePoll.answerCount"
        class="noAnswerCount"
      >0</span>
      <span
        v-if="activePoll.answerCount > 0"
        class="answerCount"
      >{{
        activePoll.answerCount
      }}</span>
      von maximal {{ activePoll.maxVotes }}<br>
      Personen: {{ activePoll.pollUserVotedCount }} /
      {{ activePoll.pollUserCount }}
    </p>
    <button
      type="button"
      class="btn btn-danger"
      @click="onCloseActivePoll"
    >
      {{ $t('view.polls.active.close') }}
    </button>
    <hr class="d-block w-100 my-5">
    <h3 v-if="activePollEventUser">
      Abstimmungsdetails <small>(aktualisiert alle 5 Sekunden)</small>
    </h3>
    <div
      v-if="activePollEventUser && activePollEventUser.pollUser"
      class="row"
    >
      <div class="col-12 col-md-auto">
        <h4>Teilnehmer</h4>
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
              :class="
                pollUser.voted === true
                  ? 'bi-check text-success'
                  : 'bi-x text-danger'
              "
            />
          </li>
        </ul>
      </div>
      <div class="col-12 col-md-auto">
        <h4>Bisherige Stimmenabgabe</h4>
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
// @todo add missing messages!

const emit = defineEmits(['close']);
defineProps({
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

function onCloseActivePoll() {
  emit('close');
}
</script>
