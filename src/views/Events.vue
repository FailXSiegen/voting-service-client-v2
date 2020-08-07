<template>
  <div class="events-container">
    <div class="row" style="min-height: 100vh;">
      <div class="col-3 bg-dark text-white py-3">
        <app-navigation></app-navigation>
      </div>
      <div class="col-9 py-3">
        <h1>{{ headline }}</h1>
        <app-overview></app-overview>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from './../components/Navigation'
import AppOverview from './../components/Events/Overview'

export default {
  components: {
    AppNavigation,
    AppOverview
  },
  data () {
    return {
      headline: 'Events'
    }
  }
}
</script>
