<template>
  <div class="events-container container-fluid" v-if="organizer.superAdmin">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <app-event-listing
          :headline="localize('view.event.upcoming')"
          :events-detail="false"
          :events="allUpcomingEvents"
          :showOrganizer="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppEventListing from '@/organizer/components/events/Listing'
import { addSuccessMessage } from '@/frame/lib/alert-helper'
import { localize } from '@/frame/lib/localization-helper'
import {
  ORGANIZER,
  ALL_UPCOMING_EVENTS
} from '@/organizer/api/graphql/gql/queries'

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
    }
  },
  data () {
    return {
      headline: 'Events',
      allUpcomingEvents: [],
      organizer: [],
      currentUserId: this.$store.state.currentUser.id
    }
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
    }
  }
}
</script>
