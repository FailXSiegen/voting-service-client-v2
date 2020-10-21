<template>
  <div class="create-new-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <app-event-mask :eventRecord="eventRecord" @mutateEvent="createEvent"/>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/organizer/components/Navigation'
import AppEventMask from '@/organizer/components/events/EventMask'
import { localize } from '@/frame/lib/localization-helper'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'
import { CREATE_EVENT_MUTATION } from '@/organizer/api/graphql/gql/mutations'
import { convertUnixTimeStampForDatetimeLocaleInput, getCurrentUnixTimeStamp } from '@/frame/lib/time-stamp'

export default {
  components: {
    AppNavigation,
    AppEventMask
  },
  data () {
    return {
      headline: 'Neues Event erstellen',
      eventRecord: {
        title: '',
        slug: '',
        description: '',
        scheduledDatetime: convertUnixTimeStampForDatetimeLocaleInput(getCurrentUnixTimeStamp()),
        lobbyOpen: false,
        active: true,
        organizerId: this.$store.getters.getCurrentUserId
      }
    }
  },
  methods: {
    createEvent () {
      this.eventRecord.scheduledDatetime = this.convertScheduledDatetime()
      this.$apollo.mutate({
        mutation: CREATE_EVENT_MUTATION,
        variables: { input: this.eventRecord }
      }).then(() => {
        this.$router.push('/admin/events')
        addSuccessMessage('Juhu', 'Das Event wurde erstellt.')
      }).catch((error) => {
        addDangerMessage('Fehler', 'Das Event konnte nicht erstellt werden. Für weitere Infos lohnt ein Blick in die Console.')
        console.error(error)
        this.eventRecord.scheduledDatetime = convertUnixTimeStampForDatetimeLocaleInput(this.eventRecord.scheduledDatetime)
      })
    },
    convertScheduledDatetime () {
      if (this.eventRecord.scheduledDatetime) {
        const convertedDatetime = Date.parse(this.eventRecord.scheduledDatetime)
        return convertedDatetime / 1000
      }
      return 0
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
