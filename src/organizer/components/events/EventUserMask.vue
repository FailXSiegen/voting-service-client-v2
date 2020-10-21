<template>
  <div class="container-create-event-user">
    <form @submit.prevent="createOrUpdateEventUser">
      <div class="form-check">
        <input v-model="eventUserRecord.verified"
               class="form-check-input"
               type="checkbox"
               id="verified">
        <label for="verified">
          {{ localize('view.event.create.labels.eventUser.verified') }}
        </label>
      </div>
      <div class="form-check">
        <input v-model="eventUserRecord.allowToVote"
               class="form-check-input"
               type="checkbox"
               id="allowToVote">
        <label for="allowToVote">
          {{ localize('view.event.create.labels.eventUser.allowToVote') }}
        </label>
      </div>
      <div class="form-group">
        <label for="username">{{ localize('view.event.create.labels.eventUser.username') }}</label>
        <input v-model="eventUserRecord.username" type="text" class="form-control" id="username" required="required" >
      </div>
      <div class="form-group">
        <label for="publicName">{{ localize('view.event.create.labels.eventUser.publicName') }}</label>
        <input v-model="eventUserRecord.publicName" type="text" class="form-control" id="publicName" >
      </div>
      <div class="participants-input" v-if="eventUserRecord.allowToVote">
        <div class="form-group">
          <label for="voteAmount">{{ localize('view.event.create.labels.eventUser.voteAmount') }}</label>
          <input v-model="eventUserRecord.voteAmount" type="number" class="form-control" id="voteAmount">
        </div>
      </div>
      <button class="btn btn-primary mt-5 mb-3">
        <i class="bi-play bi--2xl align-middle"></i>
        <span class="align-middle">{{ localize('view.event.create.labels.eventUser.submit') }}</span>
      </button>
    </form>
  </div>
</template>

<script>

import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    eventUserRecord: {
      type: Object,
      required: true
    }
  },
  async created () {
    delete this.eventUserRecord.__typename
    delete this.eventUserRecord.password
    delete this.eventUserRecord.online
    delete this.eventUserRecord.eventId
  },
  methods: {
    createOrUpdateEventUser () {
      this.$emit('onUpdateOrCreateEventUser', {
        eventUserRecord: this.eventUserRecord
      })
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
