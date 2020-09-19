<template>
  <div class="memberlist-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-verified-users :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppVerifiedUsers from '@/components/events/event/VerifiedUsers'
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  components: {
    AppNavigation,
    AppVerifiedUsers
  },
  data () {
    return {
      headline: 'Teilnehmerliste'
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
