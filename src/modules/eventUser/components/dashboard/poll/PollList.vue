<template>
  <div class="created-polls list-group">
    <div
      v-for="(poll, i) in polls"
      :key="i"
      class="list-group-item d-flex justify-content-between align-items-center"
    >
      <div>
        <h5 class="mb-1">
          {{ poll.title }}
          <i
            v-if="isDisabled(poll)"
            class="bi bi-check-circle-fill text-success ms-2"
            :title="$t('view.polls.completed')"
          />
        </h5>
      </div>
      <button
        :class="{
          btn: true,
          'btn-success': !isDisabled(poll),
          'btn-secondary': isDisabled(poll),
        }"
        :disabled="isDisabled(poll)"
        @click="emit('play', poll)"
      >
        <i class="bi bi-play-fill bi--2xl" />
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["play"]);
const props = defineProps({
  polls: {
    type: Array,
    required: true,
  },
  completedPolls: {
    type: Array,
    default: () => [],
    deprecated: "Use userVoteCycle from poll data instead"
  },
});

function isDisabled(poll) {
  // Neue DB-basierte Logik: Prüfe ob User bereits abgestimmt hat
  if (poll.userVoteCycle && poll.userVoteCycle.voteCycle > 0) {
    return true; // User hat bereits abgestimmt
  }
  
  // Fallback für Kompatibilität mit alter completedPolls Logic
  if (props.completedPolls && props.completedPolls.length > 0) {
    const hits = props.completedPolls.filter(
      (completedPoll) => completedPoll.id === poll.id,
    );
    return hits.length > 0;
  }
  
  return false; // Button ist aktiv
}
</script>
