<template>
  <div class="memberlist-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <div class="row">
          <div class="col-12 col-md-6">
            <app-allowed-users />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppAllowedUsers from '@/components/events/event/AllowedUsers'

export default {
  components: {
    AppNavigation,
    AppAllowedUsers
  },
  data () {
    return {
      headline: 'Memberlisting'
    }
  }
}
</script>
