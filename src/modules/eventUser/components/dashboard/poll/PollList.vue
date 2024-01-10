<template>
  <div class="created-polls list-group">
    <div
      v-for="(poll, i) in polls"
      :key="i"
      class="list-group-item d-flex justify-content-between"
    >
      <div>
        <h5 class="mb-1">
          {{ poll.title }}
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
  },
});

function isDisabled(poll) {
  const hits = props.completedPolls.filter(
    (completedPoll) => completedPoll.id === poll.id,
  );
  return hits.length > 0;
}
</script>
