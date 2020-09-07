<template>
  <div class="results-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-results />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppResults from '@/components/events/event/ResultsListing'
import { localize } from '@/helper/localization-helper'

export default {
  components: {
    AppNavigation,
    AppResults
  },
  data () {
    return {
      headline: 'Umfrage-Ergebnisse'
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
