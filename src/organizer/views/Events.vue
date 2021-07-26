<template>
  <div class="events-container">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <router-link
            to="/admin/event/new"
            class="btn btn-success btn-lg my-3"
          >
            <i class="bi-plus bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.event.create.createNew')
            }}</span>
          </router-link>
          <app-event-listing
            v-if="upcomingEvents"
            :headline="localize('view.event.upcoming')"
            :events-detail="true"
            :events="upcomingEvents"
            @onDeleteEvent="deleteEvent"
          />
          <app-event-listing
            v-if="expiredEvents"
            :headline="localize('view.event.latest')"
            :events-detail="true"
            :events="expiredEvents"
            @onDeleteEvent="deleteEvent"
          />
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
import { REMOVE_EVENT_MUTATION } from '@/organizer/api/graphql/gql/mutations'
import {
  UPCOMING_EVENTS,
  EXPIRED_EVENTS
} from '@/organizer/api/graphql/gql/queries'

export default {
  components: {
    AppNavigation,
    AppEventListing
  },
  apollo: {
    upcomingEvents: {
      query: UPCOMING_EVENTS,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
    },
    expiredEvents: {
      query: EXPIRED_EVENTS,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
    }
  },
  data () {
    return {
      headline: 'Veranstaltungen',
      expiredEvents: [],
      upcomingEvents: []
    }
  },
  created () {
    document.title = 'Meine Veranstaltungen - digitalwahl.org'
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    emittedAlert () {
      return addSuccessMessage(
        'Erfolg',
        'Keine Ahnung wie ich das gemacht habe.'
      )
    },
    deleteEvent (eventId) {
      this.$apollo
        .mutate({
          mutation: REMOVE_EVENT_MUTATION,
          variables: {
            organizerId: this.$store.getters.getCurrentUserId,
            id: parseInt(eventId)
          }
        })
        .then(() => {
          addSuccessMessage('Erfolg', 'Die Veranstaltung wurde gelöscht.')
          let removeItems = []
          if (this.upcomingEvents !== null) {
            removeItems = this.upcomingEvents.filter(function (item, index) {
              return item.id === eventId
            })
            this.upcomingEvents.splice(
              this.upcomingEvents.indexOf(removeItems[0]),
              1
            )
          }
          if (this.expiredEvents !== null) {
            removeItems = this.expiredEvents.filter(function (item, index) {
              return item.id === eventId
            })
            this.expiredEvents.splice(
              this.expiredEvents.indexOf(removeItems[0]),
              1
            )
          }
        })
        .catch(error => {
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
