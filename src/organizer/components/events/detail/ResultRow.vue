<template>
  <li class="list-group-item">
    <app-result-item :eventRecord="eventRecord" :pollResult="pollResult" />
  </li>
</template>

<script>
import AppResultItem from '@/organizer/components/events/detail/ResultItem'

export default {
  components: {
    AppResultItem
  },
  props: {
    eventRecord: {
      type: Object
    },
    pollResult: {
      type: Object,
      required: true
    }
  }
}
</script>
<style scoped>
@media print {
  .collapse {
    display: block !important;
    height: auto !important;
  }
  .col-md-9 {
    width: 100% !important;
  }
  .list-group-item {
    position: relative;
    page-break-inside: avoid;
    page-break-after: always;
  }
}
</style>
