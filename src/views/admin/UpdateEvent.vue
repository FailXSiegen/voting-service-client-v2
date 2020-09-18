<template>
  <div class="create-new-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <app-event-mask :eventRecord="eventRecord" @mutateEvent="updateEvent"/>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/Navigation'
import AppEventMask from '@/components/events/EventMask'
import { localize } from '@/helper/localization-helper'
import { updateEventMutation } from '@/graphql/views/event'
import { convertUnixTimeStampForDatetimeLocaleInput } from '@/lib/time-stamp'

export default {
  components: {
    AppNavigation,
    AppEventMask
  },
  props: {
    eventRecord: {
      type: Object
    }
  },
  data () {
    return {
      headline: 'Event'
    }
  },
  methods: {
    updateEvent () {
      delete this.eventRecord.createDatetime
      this.eventRecord.scheduledDatetime = this.convertScheduledDatetime()
      this.$apollo.mutate({
        mutation: updateEventMutation(),
        variables: { input: this.eventRecord }
      }).then(() => {
        this.$router.push('/admin/events')
      }).catch((error) => {
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
