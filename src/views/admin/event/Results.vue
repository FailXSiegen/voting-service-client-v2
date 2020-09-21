<template>
  <div class="results-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation  v-if="eventUsers" :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-results :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppResults from '@/components/events/event/ResultsListing'
import { localize } from '@/helper/localization-helper'
import { fetchEventBySlug } from '@/api/event'
import { EVENT_USERS_BY_EVENT } from '@/graphql/queries'

export default {
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppResults
  },
  apollo: {
    eventUsers: {
      query: EVENT_USERS_BY_EVENT,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    }
  },
  data () {
    return {
      headline: 'Umfrage-Ergebnisse',
      eventRecord: {},
      eventUsers: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
