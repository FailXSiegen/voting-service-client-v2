<template>
  <div class="results-listing">
    <h2>{{ $t("view.results.pastResults") }}</h2>
    <div v-if="visiblePollResults?.length > 0" class="created-polls">
      <ResultItem
        v-for="(pollResult, index) in visiblePollResults"
        :key="pollResult.id"
        :event-record="eventRecord"
        :poll-result="pollResult"
        @result-hidden="onResultHidden"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import ResultItem from "@/modules/organizer/components/events/poll/ResultItem.vue";

const props = defineProps({
  eventRecord: {
    type: Object,
    required: true,
  },
  pollResults: {
    type: Array,
    required: true,
  },
});

// Local copy of poll results that can be filtered
const visiblePollResults = ref([...props.pollResults]);

// Watch for changes to pollResults prop
watch(() => props.pollResults, (newResults) => {
  visiblePollResults.value = [...newResults];
}, { deep: true });

// Handle when a result is hidden
function onResultHidden(pollResultId) {
  visiblePollResults.value = visiblePollResults.value.filter(
    result => result.id !== pollResultId
  );
}
</script>
