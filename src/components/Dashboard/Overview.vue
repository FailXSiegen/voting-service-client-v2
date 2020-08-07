<template>
  <div class="dashboard-overview-container">
    <div class="row">
      <div class="col-4">
        <app-event-overview></app-event-overview>
      </div>
    </div>
  </div>
</template>

<script>
import AppEventOverview from './../Events/Overview'

export default {
  components: {
    AppEventOverview
  },
  data () {
    return {
      headline: 'Dashboard'
    }
  }
}
</script>
