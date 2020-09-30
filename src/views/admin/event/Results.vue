<template>
  <div class="results-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1 d-print-none">
        <app-navigation  v-if="eventUsers" :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-results :pollResult="pollResult" :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppResults from '@/components/events/event/ResultsListing'
import { localize } from '@/helper/localization-helper'
import { fetchEventBySlug } from '@/api/event'
import { EVENT_USERS_BY_EVENT, POLLS_RESULTS } from '@/graphql/queries'
import { NEW_EVENT_USER_SUBSCRIPTION } from '@/graphql/subscriptions'

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
      fetchPolicy: 'network-only',
      query: EVENT_USERS_BY_EVENT,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    },
    pollResult: {
      fetchPolicy: 'network-only',
      query: POLLS_RESULTS,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    },
    $subscribe: {
      newEventUser: {
        query: NEW_EVENT_USER_SUBSCRIPTION,
        result ({ data }) {
          if (parseInt(data.newEventUser.eventId) !== this.eventRecord.id) {
            return
          }
          this.eventUsers.push({ ...data.newEventUser })
        }
      }
    }
  },
  data () {
    return {
      headline: 'Umfrage-Ergebnisse',
      eventRecord: {},
      eventUsers: [],
      pollResults: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
