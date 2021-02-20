<template>
  <div class="create-new-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <app-event-mask :eventRecord="eventRecord" @mutateEvent="updateEvent" />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppEventMask from '@/organizer/components/events/EventMask'
import { localize } from '@/frame/lib/localization-helper'
import { convertUnixTimeStampForDatetimeLocaleInput } from '@/frame/lib/time-stamp'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import { addDangerMessage } from '@/frame/lib/alert-helper'
import { UPDATE_EVENT_MUTATION } from '@/organizer/api/graphql/gql/mutations'
import moment from 'moment'

export default {
  async created () {
    document.title = 'Event bearbeiten - digitalwahl.org'
    const response = await fetchEventBySlug(this.eventSlug)
    if (
      response === null ||
      response.success === false ||
      response.event.organizerId !== this.$store.getters.getCurrentUserId
    ) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
    this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(
      this.eventRecord.scheduledDatetime
    )
  },
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppEventMask
  },
  data () {
    return {
      headline: 'Event',
      eventRecord: {}
    }
  },
  methods: {
    updateEvent () {
      delete this.eventRecord.createDatetime
      delete this.eventRecord.__typename
      delete this.eventRecord.modifiedDatetime
      delete this.eventRecord.deleted
      delete this.eventRecord.imagePath
      delete this.eventRecord.organizerId
      this.eventRecord.active =
        this.eventRecord.active === true || this.eventRecord.active === 1
      this.eventRecord.lobbyOpen =
        this.eventRecord.lobbyOpen === true || this.eventRecord.lobbyOpen === 1
      this.eventRecord.scheduledDatetime = this.convertScheduledDatetime()
      this.$apollo
        .mutate({
          mutation: UPDATE_EVENT_MUTATION,
          variables: { input: this.eventRecord }
        })
        .then(() => {
          this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(
            this.eventRecord.scheduledDatetime
          )
          window.location = '/admin/events'
        })
        .catch(error => {
          addDangerMessage(
            'Fehler',
            'Das Event konnte nicht geupdated werden. Für weitere Informationen lohnt ein Blick in die Console.',
            true
          )
          console.error(error)
          this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(
            this.eventRecord.scheduledDatetime
          )
        })
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
    localize (path) {
      return localize(path)
    }
  }
}
</script>
