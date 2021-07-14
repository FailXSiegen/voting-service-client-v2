<template>
  <div class="results-listing">
    <h2>Vergangene Abstimmungen</h2>
    <ul class="created-polls list-group" v-if="pollResult">
      <app-result-row
        v-for="(pollResult, index) in pollResult"
        :key="index"
        :eventRecord="eventRecord"
        :pollResult="pollResult"
      />
    </ul>
  </div>
</template>

<style>
.modal-backdrop.show {
  opacity: 0.9 !important;
}
</style>

<script>
import { localize } from '@/frame/lib/localization-helper'
import AppResultRow from '@/organizer/components/events/detail/ResultRow'

export default {
  props: {
    eventRecord: {
      type: Object
    },
    pollResult: {
      type: Array
    }
  },
  components: {
    AppResultRow
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
