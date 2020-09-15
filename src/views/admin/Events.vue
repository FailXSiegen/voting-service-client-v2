<template>
  <div class="events-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <router-link to="/admin/events/new" class="btn btn-success btn-lg my-3">
          <i class="bi-plus bi--2xl align-middle"></i>
          <span class="align-middle">{{ localize('view.event.create.createNew') }}</span>
        </router-link>
        <app-event-listing
          :headline="localize('view.event.upcoming')"
          :events-detail="true"
          :events="upcomingEvents"
        />
        <app-event-listing
          :headline="localize('view.event.latest')"
          :events-detail="false"
          :events="expiredEvents"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/components/Navigation'
import AppEventListing from '@/components/events/Listing'
import { localize } from '@/helper/localization-helper'
import { UPCOMING_EVENTS, EXPIRED_EVENTS } from '@/graphql/queries'

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
      headline: 'Events',
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
