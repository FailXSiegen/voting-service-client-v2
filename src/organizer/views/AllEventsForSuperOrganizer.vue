<template>
  <div class="events-container" v-if="organizer.superAdmin">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <app-event-listing
            :headline="localize('view.event.upcoming')"
            :events-detail="false"
            :events-show-delete="true"
            :events-show-activate="true"
            :events="allUpcomingEvents"
            :showOrganizer="true"
            @onDeleteEvent="deleteEvent"
            @onToggleActivate="toggleActivate"
          />
          <hr />
          <app-event-listing
            :headline="localize('view.event.latest')"
            :events-detail="false"
            :events-show-delete="true"
            :events-show-activate="true"
            :events="allPastEvents"
            :showOrganizer="true"
            @onDeleteEvent="deleteEvent"
            @onToggleActivate="toggleActivate"
          />
          <button
            v-if="showMoreEnabled"
            class="my-5 mx-auto btn btn-info py-2 d-flex align-items-center d-print-none"
            @click="showMorePastEvents"
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
import AppNavigation from '@/organizer/components/Navigation'
import AppEventListing from '@/organizer/components/events/Listing'
import { addSuccessMessage, addDangerMessage } from '@/frame/lib/alert-helper'
import { localize } from '@/frame/lib/localization-helper'
import {
  ORGANIZER,
  ALL_UPCOMING_EVENTS,
  ALL_PAST_EVENTS
} from '@/organizer/api/graphql/gql/queries'
import {
  REMOVE_EVENT_MUTATION,
  UPDATE_EVENT_STATUS_MUTATION
} from '@/organizer/api/graphql/gql/mutations'

export default {
  components: {
    AppNavigation,
    AppEventListing
  },
  apollo: {
    organizer: {
      query: ORGANIZER,
      variables () {
        return {
          organizerId: this.currentUserId
        }
      }
    },
    allUpcomingEvents: {
      query: ALL_UPCOMING_EVENTS
    },
    allPastEvents: {
      query: ALL_PAST_EVENTS,
      fetchPolicy: 'network-only',
      variables () {
        return {
          page: 0,
          pageSize: this.pageSize
        }
      },
      result ({ data }) {
        if (data.allPastEvents && data.allPastEvents.length === 10) {
          this.showMoreEnabled = true
        }
      }
    }
  },
  data () {
    return {
      headline: 'Veranstaltungen',
      allUpcomingEvents: [],
      allPastEvents: [],
      organizer: [],
      currentUserId: this.$store.state.currentUser.id,
      page: 0,
      pageSize: 10,
      showMoreEnabled: false
    }
  },
  created () {
    document.title = 'Alle Events - digitalwahl.org'
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    showMorePastEvents () {
      this.page++
      // Fetch more data and transform the original result
      this.$apollo.queries.allPastEvents.fetchMore({
        // New variables
        variables: {
          page: this.page,
          pageSize: this.pageSize
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newResults = fetchMoreResult.allPastEvents
          this.showMoreEnabled = true
          this.allPastEvents.push(...newResults)
          if (newResults.length < this.pageSize) {
            this.showMoreEnabled = false
          }
          return true
        }
      })
    },
    toggleActivate (eventId, status) {
      const updateEvent = { id: parseInt(eventId), active: status }
      this.$apollo
        .mutate({
          mutation: UPDATE_EVENT_STATUS_MUTATION,
          variables: { input: updateEvent }
        })
        .then(() => {
          addSuccessMessage('Erfolg', 'Die Veranstaltung wurde bearbeitet.')
          this.$apollo.queries.allUpcomingEvents.refetch()
          this.$apollo.queries.allPastEvents.refetch()
        })
        .catch((error) => {
          addDangerMessage(
            'Fehler',
            'Das Event konnte nicht geupdated werden. Für weitere Informationen lohnt ein Blick in die Console.',
            true
          )
          console.error(error)
        })
    },
    deleteEvent (eventId, organizerId) {
      this.$apollo
        .mutate({
          mutation: REMOVE_EVENT_MUTATION,
          variables: {
            organizerId: parseInt(organizerId),
            id: parseInt(eventId)
          }
        })
        .then(() => {
          addSuccessMessage('Erfolg', 'Die Veranstaltung wurde gelöscht.')
          let removeItems = []
          if (this.allUpcomingEvents !== null) {
            removeItems = this.allUpcomingEvents.filter(function (item, index) {
              return item.id === eventId
            })
            this.allUpcomingEvents.splice(
              this.allUpcomingEvents.indexOf(removeItems[0]),
              1
            )
          }
          if (this.allPastEvents !== null) {
            removeItems = this.allPastEvents.filter(function (item, index) {
              return item.id === eventId
            })
            this.allPastEvents.splice(
              this.allPastEvents.indexOf(removeItems[0]),
              1
            )
          }
        })
        .catch((error) => {
          addDangerMessage(
            'Fehler',
            'Die Veranstaltung konnte nicht gelöscht werden.'
          )
          console.error(error)
        })
    }
  }
}
</script>
