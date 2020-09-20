<template>
  <div class="polls-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-polls :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppPolls from '@/components/events/event/Polls'
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
    AppPolls
  },
  data () {
    return {
      headline: 'Umfragen'
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
