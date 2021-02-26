<template>
  <div class="results-container ">
    <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-lg-2">
          <h1>{{ headline }}</h1>
          <div class="row">
            <div class="col-6 col-md-auto mb-3">
              <button
                @click="exportPollOverview()"
                class="btn btn-success mr-3"
              >
                Export Übersicht
              </button>
            </div>
            <div class="col-6 col-md-auto  mb-3">
              <button @click="exportPollResults" class="btn btn-success mr-3">
                Export Ergebnisse
              </button>
            </div>
            <div class="col-6 col-md-auto mb-3">
              <button
                @click="exportPollResultsDetail"
                class="btn btn-success mr-3"
              >
                Export Ergebnisse mit Details
              </button>
            </div>
            <div class="col-6 col-md-auto">
              <button
                @click="exportPollEventUsersVoted"
                class="btn btn-success mr-3"
              >
                Export Teilnehmer mit abgegebener Stimmenanzahl
              </button>
            </div>
          </div>
          <hr />
          <app-results :pollResult="pollResult" :eventRecord="eventRecord" />
          <button
            v-if="showMoreEnabled"
            class="my-5 mx-auto btn btn-info py-2 d-flex align-items-center d-print-none"
            @click="showMorePollResults"
          >
            <i class="mr-3 bi bi-plus-square-fill bi--2xl"></i>
            {{ localize('view.results.showMore') }}
          </button>
          <p v-if="!showMoreEnabled" class="alert alert-light mx-auto my-5">
            {{ localize('view.results.noMoreResults') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/events/detail/Navigation'
import AppResults from '@/organizer/components/events/detail/ResultsListing'
import { localize } from '@/frame/lib/localization-helper'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import { exportPollResultsCsv } from '@/organizer/api/fetch/export-results-csv'
import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'
import { POLLS_RESULTS } from '@/frame/api/graphql/gql/queries'
import {
  NEW_EVENT_USER_SUBSCRIPTION,
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'

export default {
  async created () {
    document.title = 'Ergebnisse - digitalwahl.org'
    const response = await fetchEventBySlug(this.eventSlug)
    if (
      response === null ||
      response.success === false ||
      response.event.organizerId !== this.$store.getters.getCurrentUserId
    ) {
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
        if (data.pollResult && data.pollResult.length === 10) {
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
      },
      eventUserLifeCycle: {
        query: EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          let eventUserFound = false
          if (data.eventUserLifeCycle) {
            const eventUserId = data.eventUserLifeCycle.eventUserId
            this.eventUsers.forEach(eventUser => {
              if (eventUserId === eventUser.id) {
                eventUserFound = true
                eventUser.online = data.eventUserLifeCycle.online
              }
            })
            if (!eventUserFound && data.eventUserLifeCycle.username) {
              this.eventUsers.push({ ...data.eventUserLifeCycle })
            }
          }
        }
      }
    }
  },
  data () {
    return {
      headline: 'Ergebnisse',
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
    },
    async exportPollOverview () {
      const response = await exportPollResultsCsv(
        this.eventRecord.id,
        'pollOverview'
      )
      await this.downloadCsv(await response.text(), 'pollOverview.csv')
    },
    async exportPollResults () {
      const response = await exportPollResultsCsv(
        this.eventRecord.id,
        'pollResults'
      )
      await this.downloadCsv(await response.text(), 'pollResults.csv')
    },
    async exportPollResultsDetail () {
      const response = await exportPollResultsCsv(
        this.eventRecord.id,
        'pollResultsDetail'
      )
      await this.downloadCsv(await response.text(), 'pollResultsDetail.csv')
    },
    async exportPollEventUsersVoted () {
      const response = await exportPollResultsCsv(
        this.eventRecord.id,
        'pollEventUsersVoted'
      )
      await this.downloadCsv(await response.text(), 'pollEventUsersVoted.csv')
    },
    async downloadCsv (reponseText, filename) {
      const blob = new Blob([reponseText], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
</script>
