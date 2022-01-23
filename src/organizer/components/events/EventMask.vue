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
      <label class="form-check-label" for="active"> Veranstaltung aktiv </label>
    </div>
    <div v-if="organizer" class="form-group">
      <label>Videokonferenz-System-Auswahl</label>
      <select
        v-model="selectedMeetingId"
        class="form-control"
        @change="onChangeMeeting"
      >
        <option value="0" selected="selected">---</option>
        <option
          v-for="(meeting, index) in meetings"
          :key="index"
          :value="meeting.id"
        >
          {{ meeting.title }}
        </option>
      </select>
      <component
        v-if="selectedMeetingId"
        v-bind:is="videoConferenceConfigComponent"
        :config="eventRecord.videoConferenceConfig"
        @update="onUpdateVideoConferenceConfig"
      />
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
import { ORGANIZER } from '@/organizer/api/graphql/gql/queries'
import { VideoConferenceType } from '@/enum'
import AppZoomConfig from '@/organizer/components/events/detail/video-conference-config/ZoomConfig'

export default {
  components: {
    datePicker,
    AppZoomConfig
  },
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  apollo: {
    organizer: {
      query: ORGANIZER,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
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
      },
      organizer: null,
      selectedMeetingId: 0,
      selectedMeetingType: null
    }
  },
  created () {
    if (
      this.eventRecord.scheduledDatetime &&
      Number.isInteger(this.eventRecord.scheduledDatetime)
    ) {
      this.eventRecord.scheduledDatetime =
        convertUnixTimeStampForDatetimeLocaleInput(
          this.eventRecord.scheduledDatetime
        )
    }

    if (
      this.eventRecord.videoConferenceConfig &&
      this.eventRecord.videoConferenceConfig.length > 0
    ) {
      const config = JSON.parse(this.eventRecord.videoConferenceConfig)
      this.selectedMeetingId = config.id
      this.selectedMeetingType = config.type
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
    onMutateEvent () {
      this.$emit('mutateEvent', {
        eventRecord: this.eventRecord
      })
    },
    onChangeMeeting () {
      const selectedMeeting =
        this.meetings.filter(
          (meeting) => meeting.id === this.selectedMeetingId
        )[0] || null
      if (selectedMeeting === null) {
        this.selectedMeetingType = null
        this.eventRecord.videoConferenceConfig = null
        return
      }
      this.selectedMeetingType = selectedMeeting.type
      this.eventRecord.videoConferenceConfig = JSON.stringify({
        id: selectedMeeting.id,
        type: selectedMeeting.type,
        credentials: {}
      })
    },
    onUpdateVideoConferenceConfig (event) {
      this.eventRecord.videoConferenceConfig = JSON.stringify(event.config)
    },
    localize (path) {
      return localize(path)
    }
  },
  computed: {
    meetings () {
      const meetings = []
      for (const meeting of this.organizer.zoomMeetings) {
        meetings.push({
          id: meeting.id,
          title: '[Zoom] ' + meeting.title,
          type: VideoConferenceType.ZOOM
        })
      }
      return meetings
    },
    videoConferenceConfigComponent () {
      const config = JSON.parse(this.eventRecord.videoConferenceConfig)
      if (!config || !config.type) {
        return null
      }
      switch (config.type) {
        case VideoConferenceType.ZOOM:
          return AppZoomConfig
      }
      return null
    }
  }
}
</script>
