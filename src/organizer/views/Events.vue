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
          />
          <app-event-listing
            v-if="expiredEvents"
            :headline="localize('view.event.latest')"
            :events-detail="true"
            :events="expiredEvents"
          />
        </div>
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
    }
  }
}
</script>
