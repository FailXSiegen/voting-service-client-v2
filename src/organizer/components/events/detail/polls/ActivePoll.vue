<template>
  <div class="container-active-poll" v-if="activePoll.title">
    <h2>{{ localize('view.polls.active.title') }}</h2>
    <h3>{{ activePoll.title }}</h3>
    <p v-if="activePollMaxAnswer > 0">
      Abgegebene Stimmen
      <span class="noAnswerCount" v-if="!activePollAnswerCount">0</span>
      <span class="answerCount" v-if="activePollAnswerCount > 0">{{
        activePollAnswerCount
      }}</span>
      von maximal {{ activePollMaxAnswer }}<br />
      Personen: {{ pollUserVotedCount }} / {{ pollUserCount }}
    </p>
    <p v-if="activePollMaxAnswer == 0">
      Abgegebene Stimmen
      <span class="noAnswerCount" v-if="!activePoll.answerCount">0</span>
      <span class="answerCount" v-if="activePoll.answerCount > 0">{{
        activePoll.answerCount
      }}</span>
      von maximal {{ activePoll.maxVotes }}<br />
      Personen: {{ activePoll.pollUserVotedCount }} /
      {{ activePoll.pollUserCount }}
    </p>
    <button type="button" class="btn btn-danger" @click="closeActivePoll">
      {{ localize('view.polls.active.close') }}
    </button>
    <hr class="d-block w-100 my-5" />
    <h3 v-if="activePollEventUser">
      Abstimmungsdetails <small>(aktualisiert alle 5 Sekunden)</small>
    </h3>
    <div class="row" v-if="activePollEventUser && activePollEventUser.pollUser">
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
            ></i>
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

<script>
import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    activePoll: {
      type: Object
    },
    activePollEventUser: {
      type: Object
    },
    activePollAnswerCount: {
      type: Number,
      default () {
        return 0
      }
    },
    activePollMaxAnswer: {
      type: Number,
      default () {
        return 0
      }
    },
    pollUserCount: {
      type: Number,
      default () {
        return 0
      }
    },
    pollUserVotedCount: {
      type: Number,
      default () {
        return 0
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    closeActivePoll () {
      if (confirm('Abstimmung schließen?')) {
        this.$emit('onCloseActivePoll')
      }
    }
  }
}
</script>
