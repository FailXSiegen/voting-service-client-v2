<template>
  <div class="create-new-container">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <app-event-mask
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
      headline: 'Veranstaltung',
      eventRecord: {}
    }
  },
  methods: {
    updateEvent () {
      const updateEvent = JSON.parse(JSON.stringify(this.eventRecord))
      delete updateEvent.createDatetime
      delete updateEvent.__typename
      delete updateEvent.modifiedDatetime
      delete updateEvent.deleted
      delete updateEvent.imagePath
      delete updateEvent.organizerId
      delete updateEvent.meetingType
      delete updateEvent.meetingId
      updateEvent.active =
        updateEvent.active === true || updateEvent.active === 1
      updateEvent.lobbyOpen =
        updateEvent.lobbyOpen === true || updateEvent.lobbyOpen === 1
      updateEvent.scheduledDatetime = this.convertScheduledDatetime()
      updateEvent.multivoteType = parseInt(updateEvent.multivoteType)
      console.log(updateEvent)
      this.$apollo
        .mutate({
          mutation: UPDATE_EVENT_MUTATION,
          variables: { input: updateEvent }
        })
        .then(() => {
          window.location = '/admin/events'
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
