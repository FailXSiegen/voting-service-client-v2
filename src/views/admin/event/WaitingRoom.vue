<template>
  <div class="waitingroom-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <div class="row mt-5">
          <div class="col-12">
            <app-pending-users />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppPendingUsers from '@/components/events/event/PendingUsers'
import { localize } from '@/helper/localization-helper'

export default {
  components: {
    AppNavigation,
    AppPendingUsers
  },
  data () {
    return {
      headline: 'Pending Users'
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
