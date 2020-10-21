<template>
  <div class="dashboard-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
          <app-event-listing
            :headline="localize('view.event.upcoming')"
            :events-detail="true"
            :events="upcomingEvents"
          />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppEventListing from '@/organizer/components/events/Listing'
import { localize } from '@/frame/lib/localization-helper'
import { EXPIRED_EVENTS, UPCOMING_EVENTS } from '@/organizer/api/graphql/gql/queries'

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
      headline: 'Dashboard',
      expiredEvents: [],
      upcomingEvents: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
