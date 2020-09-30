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
        <button v-if="showMoreEnabled" class="my-5 mx-auto btn btn-info py-2 d-flex align-items-center d-print-none" @click="showMorePollResults">
          <i class="mr-3 bi bi-plus-square-fill bi--2xl"></i> {{ localize('view.results.showMore') }}
        </button>
        <p v-if="!showMoreEnabled" class="alert alert-light mx-auto my-5">{{ localize('view.results.noMoreResults') }}</p>
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
          eventId: this.eventRecord.id,
          page: 0,
          pageSize: this.pageSize
        }
      },
      result ({ data }) {
        if (data.pollResult.length === 10) {
          this.showMoreEnabled = true
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
      pollResult: [],
      page: 0,
      pageSize: 10,
      showMoreEnabled: false
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    showMorePollResults () {
      this.page++
      // Fetch more data and transform the original result
      this.$apollo.queries.pollResult.fetchMore({
        // New variables
        variables: {
          eventId: this.eventRecord.id,
          page: this.page,
          pageSize: this.pageSize
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newResults = fetchMoreResult.pollResult
          this.showMoreEnabled = true
          this.pollResult.push(...newResults)
          if (newResults.length < this.pageSize) {
            this.showMoreEnabled = false
          }
          return true
        }
      })
    }
  }
}
</script>
