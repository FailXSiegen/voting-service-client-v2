<template>
  <div class="container-poll-status d-print-none">
    <div
      v-if="pollState === 'voted' && hasVotingRights"
      class="container-poll-voted text-center alert alert-success"
    >
      <i class="bi-check bi--4xl my-3" />
      <h2 v-html="$t('view.user.verified.voted')" />
    </div>
  </div>
  <div
    v-if="existActivePoll"
    class="container-active-poll text-center alert alert-primary"
    role="alert"
  >
    <i class="bi-arrow-repeat bi--spin bi--4xl my-3" />
    <p v-html="$t('view.user.verified.activePoll')" />
  </div>
  <div
    v-else
    class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center"
    role="alert"
  >
    <p class="mb-0">
      {{ $t("view.user.verified.noActivePoll") }}
    </p>
  </div>
  <hr class="d-print-none" />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pollState: {
    type: String,
    required: true,
  },
  existActivePoll: {
    type: Boolean,
    required: true,
  },
  voteAmount: {
    type: Number,
    required: true,
  },
});

const hasVotingRights = computed(() => {
  return props.voteAmount > 0;
});
</script>
