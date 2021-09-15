<template>
  <div class="create-new-container">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <app-event-mask
            v-if="eventRecord.id"
            :eventRecord="eventRecord"
            @mutateEvent="updateEvent"
          />
        </div>
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
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'
import { UPDATE_EVENT_MUTATION } from '@/organizer/api/graphql/gql/mutations'
import moment from 'moment'

export default {
  async created () {
    document.title = 'Event bearbeiten - digitalwahl.org'
    const response = await fetchEventBySlug(this.eventSlug)
    if (
      response === null ||
      response.success === false ||
      response.event === null ||
      response.event.organizerId !== this.$store.getters.getCurrentUserId
    ) {
      console.log(response)
      // await this.$router.push('/admin/events')
    }

    this.eventRecord = response.event
    if (
      this.eventRecord &&
      this.eventRecord.scheduledDatetime &&
      Number.isInteger(this.eventRecord.scheduledDatetime)
    ) {
      this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(
        this.eventRecord.scheduledDatetime
      )
    }
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
      headline: 'Veranstaltung',
      eventRecord: {}
    }
  },
  methods: {
    updateEvent () {
      // @todo move converting to dedicated module!
      const updateEvent = JSON.parse(JSON.stringify(this.eventRecord))
      delete updateEvent.createDatetime
      delete updateEvent.__typename
      delete updateEvent.modifiedDatetime
      delete updateEvent.deleted
      delete updateEvent.imagePath
      delete updateEvent.organizerId
      delete updateEvent.deletePlanned
      delete updateEvent.deleteDatetime
      updateEvent.active =
        updateEvent.active === true || updateEvent.active === 1
      updateEvent.lobbyOpen =
        updateEvent.lobbyOpen === true || updateEvent.lobbyOpen === 1
      updateEvent.scheduledDatetime = this.convertScheduledDatetimeToTimestamp(
        updateEvent.scheduledDatetime
      )
      updateEvent.multivoteType = parseInt(updateEvent.multivoteType)

      // Handle meeting data.
      delete updateEvent.meeting
      if (updateEvent.meetingId) {
        updateEvent.meeting = {
          meetingId: updateEvent.meetingId,
          meetingType: updateEvent.meetingType
        }
      }
      delete updateEvent.meetingId
      delete updateEvent.meetingType

      this.$apollo
        .mutate({
          mutation: UPDATE_EVENT_MUTATION,
          variables: { input: updateEvent }
        })
        .then(() => {
          addSuccessMessage(
            'Gespeichert',
            'Das Event wurde gespeichert.<br /><br /><a class="btn btn-primary" href="/admin/events">Zurück zu den Events</a>',
            true
          )
          // window.location = '/admin/events'
        })
        .catch(error => {
          addDangerMessage(
            'Fehler',
            'Das Event konnte nicht geupdated werden. Für weitere Informationen lohnt ein Blick in die Console.',
            true
          )
          console.error(error)
        })
    },
    convertScheduledDatetimeToTimestamp () {
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
