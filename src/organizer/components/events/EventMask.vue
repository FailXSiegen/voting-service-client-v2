<template>
  <form @submit.prevent="onMutateEvent">
    <div class="form-group">
      <label for="eventTitle">{{ localize('view.event.create.labels.title') }}</label>
      <input v-model="eventRecord.title" type="text" class="form-control" id="eventTitle" required="required" :placeholder="localize('view.event.create.labels.title')">
    </div>
    <div class="form-group">
      <label for="eventSlug">{{ localize('view.event.create.labels.slug') }}</label>
      <input v-model="eventRecord.slug" type="text" class="form-control" id="eventSlug" required="required" :placeholder="localize('view.event.create.labels.slug')">
    </div>
    <div class="form-group">
      <label for="eventDescription">{{ localize('view.event.create.labels.description') }}</label>
      <textarea v-model="eventRecord.description" class="form-control" id="eventDescription" rows="3"
                aria-describedby="eventDescriptionHelpBlock"></textarea>
      <small id="eventDescriptionHelpBlock" class="form-text text-muted">
        {{ localize('view.event.create.labels.descriptionHelp') }}
      </small>
    </div>
    <div class="form-group">
      <label for="scheduledDatetime">{{ localize('view.event.create.labels.scheduledDatetime') }}</label>
      <input v-model="eventRecord.scheduledDatetime" class="form-control" type="datetime-local" id="scheduledDatetime" required="required">
    </div>
    <div class="form-check">
      <input v-model="eventRecord.lobbyOpen" class="form-check-input" type="checkbox" id="lobbyOpen">
      <label class="form-check-label" for="lobbyOpen">
        {{ localize('view.event.create.labels.lobbyOpen') }}
      </label>
    </div>
    <div class="form-check">
      <input v-model="eventRecord.active" class="form-check-input" type="checkbox" id="active">
      <label class="form-check-label" for="active">
        Event aktiv
      </label>
    </div>
    <button class="btn btn-primary mt-5 mb-3">
      <i class="bi-play bi--2xl align-middle"></i>
      <span class="align-middle">{{ localize('view.event.create.labels.submit') }}</span>
    </button>
  </form>
</template>

<script>

import { localize } from '@/frame/lib/localization-helper'
import { convertUnixTimeStampForDatetimeLocaleInput } from '@/frame/lib/time-stamp'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  async created () {
    this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(this.eventRecord.scheduledDatetime)
  },
  methods: {
    convertScheduledDatetime () {
      if (this.eventRecord.scheduledDatetime) {
        return Math.round(new Date(this.eventRecord.scheduledDatetime).getTime() / 1000)
      }
      return 0
    },
    onMutateEvent () {
      this.$emit('mutateEvent', {
        eventRecord: this.eventRecord
      })
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
