<template>
  <div class="create-new-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <form @submit.prevent="createEvent">
          <div class="form-group">
            <label for="eventTitle">{{ localize('view.event.create.labels.title') }}</label>
            <input v-model="event.title" type="text" class="form-control" id="eventTitle" required="required" :placeholder="localize('view.event.create.labels.title')">
          </div>
          <div class="form-group">
            <label for="eventSlug">{{ localize('view.event.create.labels.slug') }}</label>
            <input v-model="event.slug" type="text" class="form-control" id="eventSlug" required="required" :placeholder="localize('view.event.create.labels.slug')">
          </div>
          <div class="form-group">
            <label for="eventDescription">{{ localize('view.event.create.labels.description') }}</label>
            <textarea v-model="event.description" class="form-control" id="eventDescription" rows="3"
                      aria-describedby="eventDescriptionHelpBlock"></textarea>
            <small id="eventDescriptionHelpBlock" class="form-text text-muted">
              Eine kurze Beschreibung des Events
            </small>
          </div>
          <div class="form-group">
          <label for="scheduledDatetime">{{ localize('view.event.create.labels.scheduledDatetime') }}</label>
          <input v-model="event.scheduledDatetime" class="form-control" type="date" id="scheduledDatetime" required="required">
          </div>
          <div class="form-check">
            <input v-model="event.lobbyOpen" class="form-check-input" type="checkbox" id="lobbyOpen">
            <label class="form-check-label" for="lobbyOpen">
              {{ localize('view.event.create.labels.lobbyOpen') }}
            </label>
          </div>
          <button class="btn btn-primary mt-5 mb-3">
            <i class="bi-play bi--2xl align-middle"></i>
            <span class="align-middle">{{ localize('view.event.create.labels.submit') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/Navigation'
import { localize } from '@/helper/localization-helper'
import { createEventMutation } from '@/graphql/views/event'

export default {
  components: {
    AppNavigation
  },
  data () {
    return {
      headline: 'Neues Event erstellen',
      event: {
        title: '',
        slug: '',
        description: '',
        scheduledDatetime: '',
        lobbyOpen: false,
        active: true,
        organizerId: 17
      }
    }
  },
  methods: {
    createEvent () {
      this.event.scheduledDatetime = this.convertScheduledDatetime()
      this.$apollo.mutate({
        mutation: createEventMutation(),
        variables: { input: this.event }
      }).then(() => {
        this.$router.push('/admin/events')
      }).catch((error) => {
        console.error(error)
        this.event.scheduledDatetime = null
      })
    },
    convertScheduledDatetime () {
      if (this.event.scheduledDatetime) {
        return Math.round(new Date(this.event.scheduledDatetime).getTime() / 1000)
      }
      return 0
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
