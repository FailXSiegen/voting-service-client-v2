<template>
  <form @submit.prevent="onMutateEvent">
    <div class="form-group">
      <label for="eventTitle">{{
        localize('view.event.create.labels.title')
      }}</label>
      <input
        v-model="eventRecord.title"
        type="text"
        class="form-control"
        id="eventTitle"
        required="required"
        @change="generateSlug()"
        :placeholder="localize('view.event.create.labels.title')"
      />
    </div>
    <div class="form-group">
      <label for="eventSlug">{{
        localize('view.event.create.labels.slug')
      }}</label>
      <input
        v-model="eventRecord.slug"
        type="text"
        class="form-control"
        id="eventSlug"
        @change="validateSlug()"
        required="required"
        :placeholder="localize('view.event.create.labels.slug')"
      />
      <small id="eventSlugHelpBlock" class="form-text text-muted">
        {{ localize('view.event.create.labels.slugHelp') }}
      </small>
    </div>
    <div class="form-group">
      <label for="eventDescription">{{
        localize('view.event.create.labels.description')
      }}</label>
      <textarea
        v-model="eventRecord.description"
        class="form-control"
        id="eventDescription"
        rows="3"
        required="required"
        aria-describedby="eventDescriptionHelpBlock"
      ></textarea>
      <small id="eventDescriptionHelpBlock" class="form-text text-muted">
        {{ localize('view.event.create.labels.descriptionHelp') }}
      </small>
    </div>
    <div class="form-group">
      <label>{{
        localize('view.event.create.labels.scheduledDatetime')
      }}</label>
      <date-picker
        v-model="eventRecord.scheduledDatetime"
        required="required"
        :config="options"
      ></date-picker>
    </div>
    <div class="form-check">
      <input
        v-model="eventRecord.lobbyOpen"
        class="form-check-input"
        type="checkbox"
        id="lobbyOpen"
      />
      <label class="form-check-label" for="lobbyOpen">
        {{ localize('view.event.create.labels.lobbyOpen') }}
      </label>
    </div>
    <div class="form-check">
      <input
        v-model="eventRecord.active"
        class="form-check-input"
        type="checkbox"
        id="active"
      />
      <label class="form-check-label" for="active">
        Veranstaltung aktiv
      </label>
    </div>
    <hr />
    <h3>Mehrfachstimmenabgabe</h3>
    <p class="text-muted">
      Wahlmöglichkeit zur Vorgabe der stimmberechtigten Teilnehmer die mehr als
      eine Stimme haben
    </p>
    <div class="form-check">
      <input
        class="form-check-input"
        type="radio"
        name="multivoteType"
        id="multivoteType1"
        value="1"
        v-model="eventRecord.multivoteType"
      />
      <label class="form-check-label" for="multivoteType1">
        Benutzer können unterschiedliche Stimmenabgabe durchführen
      </label>
      <small class="form-text text-muted"
        >Bsp.: Stimme 1 von 2: Ja, Stimme 2 von 2: nein<br />Bsp. 2: Checkbox
        ausgewählt vom Teilnehmer: Alle Stimmen auf einmal abgeben: Ja 2x</small
      >
    </div>
    <div class="form-check mt-3">
      <input
        class="form-check-input"
        type="radio"
        name="multivoteType"
        id="multivoteType2"
        value="2"
        v-model="eventRecord.multivoteType"
      />
      <label class="form-check-label" for="multivoteType2">
        Benutzer geben IMMER alle Stimmen auf einmal ab
      </label>
      <small class="form-text text-muted"
        >Bsp.: Teilnehmer hat 5 Stimmen. Bei Abstimmung wählt der Teilnehmer nur
        einmal, es wird 5 fach gewertet.</small
      >
    </div>
    <button class="btn btn-primary mt-5 mb-3">
      <i class="bi-play bi--2xl align-middle"></i>
      <span class="align-middle">{{
        localize('view.event.create.labels.submit')
      }}</span>
    </button>
  </form>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { convertUnixTimeStampForDatetimeLocaleInput } from '@/frame/lib/time-stamp'
import datePicker from 'vue-bootstrap-datetimepicker'
import moment from 'moment'

export default {
  components: {
    datePicker
  },
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      options: {
        format: 'DD.MM.YYYY, HH:mm',
        locale: 'de',
        icons: {
          time: 'bi-clock',
          date: 'bi-calendar',
          up: 'bi-arrow-up',
          down: 'bi-arrow-down',
          previous: 'bi-arrow-left',
          next: 'bi-arrow-right',
          today: 'bi-calendar-date',
          clear: 'bi-trash',
          close: 'bi-x-circle'
        }
      }
    }
  },
  async created () {
    if (this.eventRecord.scheduledDatetime) {
      this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(
        this.eventRecord.scheduledDatetime
      )
    }
  },
  methods: {
    generateSlug () {
      if (!this.eventRecord.slug) {
        this.eventRecord.slug = this.eventRecord.title
          .trim()
          .replace(/[^a-zA-Z0-9\- ]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--/g, '')
          .toLowerCase()
      }
    },
    validateSlug () {
      this.eventRecord.slug = this.eventRecord.slug
        .trim()
        .replace(/[^a-zA-Z0-9\- ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--/g, '')
        .toLowerCase()
    },
    convertScheduledDatetime () {
      if (this.eventRecord.scheduledDatetime) {
        return moment(
          this.eventRecord.scheduledDatetime,
          'DD.MM.YYYY, HH:mm'
        ).unix()
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
