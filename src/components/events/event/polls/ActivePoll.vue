<template>
 <div class="container-active-poll" v-if="activePoll.title">
  <h2>{{ localize('view.polls.active.title') }}</h2>
  <p> {{ activePoll.title }}</p>
   <p v-if="activePollMaxAnswer"> Abegebene Stimmen {{ activePollAnswerCount }} von maximal {{ activePollMaxAnswer }}</p>
   <p v-if="!activePollMaxAnswer"> Abegebene Stimmen {{ activePoll.answerCount }} von maximal {{ activePoll.maxVotes }}</p>
  <button type="button" class="btn btn-danger" @click="closeActivePoll">{{ localize('view.polls.active.close') }}</button>
 </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    activePoll: {
      type: Object
    },
    activePollAnswerCount: {
      type: Number
    },
    activePollMaxAnswer: {
      type: Number
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
