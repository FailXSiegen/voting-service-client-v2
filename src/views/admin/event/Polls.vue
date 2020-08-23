<template>
  <div class="polls-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <div class="row">
          <div class="col-12 col-md-6">
            <app-polls-listing />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppPollsListing from '@/components/events/event/PollsListing'
import { localize } from '@/helper/localization-helper'

export default {
  components: {
    AppNavigation,
    AppPollsListing
  },
  data () {
    return {
      headline: 'Polls'
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
