<template>
  <div class="events-container">
    <div class="row">
      <div class="col-3 bg-dark text-white py-3">
        <app-navigation></app-navigation>
      </div>
      <div class="col-9 py-3">
        <h1>{{ headline }}</h1>
        <app-event-listing></app-event-listing>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from './../components/Navigation'
import AppEventListing from '../components/events/Listing'

export default {
  components: {
    AppNavigation,
    AppEventListing
  },
  data () {
    return {
      headline: 'Events'
    }
  }
}
</script>
