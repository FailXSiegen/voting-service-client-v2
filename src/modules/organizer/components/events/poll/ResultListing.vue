<template>
  <div class="results-listing">
    <h2>Vergangene Abstimmungen</h2>
    <ul
      v-if="pollResults?.length > 0"
      class="created-polls list-group"
    >
      <ResultItem
        v-for="(pollResult, index) in pollResults"
        :key="index"
        :event-record="eventRecord"
        :poll-result="pollResult"
      />
    </ul>
  </div>
</template>

<script setup>
import ResultItem from "@/modules/organizer/components/events/poll/ResultItem.vue";

defineProps({
  eventRecord: {
    type: Object,
    required: true,
  },
  pollResults: {
    type: Array,
    required: true,
  }
});
</script>
