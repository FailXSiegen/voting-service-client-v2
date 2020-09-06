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
            <input v-model="newEvent.title" type="text" class="form-control" id="eventTitle" required="required" :placeholder="localize('view.event.create.labels.title')">
          </div>
          <div class="form-group">
            <label for="eventDescription">{{ localize('view.event.create.labels.description') }}</label>
            <textarea v-model="newEvent.description" class="form-control" id="eventDescription" rows="3"
                      aria-describedby="eventDescriptionHelpBlock"></textarea>
            <small id="eventDescriptionHelpBlock" class="form-text text-muted">
              Eine kurze Beschreibung des Events
            </small>
          </div>
          <div class="form-group">
          <label for="eventStart">{{ localize('view.event.create.labels.date') }}</label>
          <input v-model="newEvent.startDate" class="form-control" type="date" id="eventStart" name="trip-start" required="required">
          </div>
          <div class="form-check">
            <input v-model="newEvent.activateLobby" class="form-check-input" type="checkbox" id="activateLobby">
            <label class="form-check-label" for="activateLobby">
              {{ localize('view.event.create.labels.activateLobby') }}
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

export default {
  components: {
    AppNavigation
  },
  data () {
    return {
      headline: 'Neues Event erstellen',
      newEvent: {
        title: '',
        description: '',
        startDate: '',
        activateLobby: false,
        finished: false
      }
    }
  },
  methods: {
    createEvent () {
      alert('Event wurde erstellt.')
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
