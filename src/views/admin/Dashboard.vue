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
            :events-detail="false"
            :events="upcomingEvents"
          />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/components/Navigation'
import AppEventListing from '@/components/events/Listing'
import { localize } from '@/helper/localization-helper'

export default {
  components: {
    AppNavigation,
    AppEventListing
  },
  data () {
    return {
      headline: 'Dashboard',
      upcomingEvents: [
        {
          title: 'Next Event 1',
          created: '22.09.2020',
          finished: true
        },
        {
          title: 'Next Event 2',
          created: '23.09.2020',
          finished: false
        },
        {
          title: 'Next Event 3',
          created: '26.10.2020',
          finished: true
        }
      ]
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
