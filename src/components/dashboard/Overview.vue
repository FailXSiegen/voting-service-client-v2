<template>
  <div class="dashboard-overview-container">
    <div class="row">
      <div class="col-4">
        <app-event-listing></app-event-listing>
      </div>
    </div>
  </div>
</template>

<script>
import AppEventListing from '../events/Listing'

export default {
  components: {
    AppEventListing
  },
  data () {
    return {
      headline: 'Dashboard'
    }
  }
}
</script>
