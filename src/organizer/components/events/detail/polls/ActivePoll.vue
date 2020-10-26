<template>
 <div class="container-active-poll" v-if="activePoll.title">
  <h2>{{ localize('view.polls.active.title') }}</h2>
  <p> {{ activePoll.title }}</p>
   <p v-if="activePollMaxAnswer">
     Abgegebene Stimmen
     <span class="noAnswerCount" v-if="!activePollAnswerCount">0</span>
     <span class="answerCount" v-if="activePollAnswerCount > 0">{{ activePollAnswerCount }}</span>
     von maximal {{ activePollMaxAnswer }}<br />
     Personen: {{ pollUserVotedCount }} / {{ pollUserCount }}
   </p>
   <p v-if="!activePollMaxAnswer">
     Abgegebene Stimmen
     <span class="noAnswerCount" v-if="!activePoll.answerCount">0</span>
     <span class="answerCount" v-if="activePoll.answerCount > 0">{{ activePoll.answerCount }}</span>
     von maximal {{ activePoll.maxVotes }}<br />
     Personen: {{ activePoll.pollUserVotedCount }} / {{ activePoll.pollUserCount }}
   </p>
  <button type="button" class="btn btn-danger" @click="closeActivePoll">{{ localize('view.polls.active.close') }}</button>
 </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    activePoll: {
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
