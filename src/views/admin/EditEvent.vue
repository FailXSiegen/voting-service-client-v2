<template>
  <div class="create-new-container container-fluid">
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

import AppNavigation from '@/components/Navigation'
import AppEventMask from '@/components/events/EventMask'
import { localize } from '@/helper/localization-helper'
import { createEventMutation } from '@/graphql/views/event'

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
    createEvent () {
      this.eventRecord.scheduledDatetime = this.convertScheduledDatetime()
      this.$apollo.mutate({
        mutation: createEventMutation(),
        variables: { input: this.eventRecord }
      }).then(() => {
        this.$router.push('/admin/events')
      }).catch((error) => {
        console.error(error)
        this.eventRecord.scheduledDatetime = null
      })
    },
    convertScheduledDatetime () {
      if (this.eventRecord.scheduledDatetime) {
        return Math.round(new Date(this.eventRecord.scheduledDatetime).getTime() / 1000)
      }
      return 0
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
