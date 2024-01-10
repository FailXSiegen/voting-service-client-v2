<template>
  <div class="results-listing">
    <h2>{{ $t("view.results.pastResults") }}</h2>
    <div v-if="pollResults?.length > 0" class="created-polls">
      <ResultItem
        v-for="(pollResult, index) in pollResults"
        :key="index"
        :event-record="eventRecord"
        :poll-result="pollResult"
      />
    </div>
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
  },
});
</script>
