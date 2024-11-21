<template>
  <div class="dashboard-stats">
    <h1>{{ event.title }}</h1>
    <h2>
      {{ $t("view.user.verified.welcome") }}
      {{ eventUser.publicName }}
    </h2>
    <p :class="{ pulse: highlightStatusChange }">
      {{ eventUser.username }} -
      <span v-if="eventUser.allowToVote" class="text-success small">
        {{ $t("view.event.user.member") }}</span
      >
      <span v-else class="text-info small">{{
        $t("view.event.user.visitor")
      }}</span>
      <span v-if="eventUser.allowToVote">
        | Anzahl Stimmen:
        <span class="badge text-bg-info">{{ eventUser.voteAmount }}</span></span
      >
      <span> | Status: </span>
      <span
        v-if="eventUser.online"
        class="badge text-bg-success badge-pill status-indicator"
        >online</span
      >
      <span v-else class="badge text-bg-danger badge-pill status-indicator"
        >offline</span
      >
    </p>
    <hr class="d-print-none" />
    <p v-if="event.description" class="d-print-none">
      {{ event.description }}
    </p>
  </div>
  <hr />
</template>

<script setup>
defineProps({
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
  highlightStatusChange: {
    type: Boolean,
    required: true,
  },
});
</script>

<style scoped>
.pulse {
  background: rgba(23, 162, 184, 0.15);
  box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.5);
  transform: scale(1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.4);
  }
  30% {
    transform: scale(0.99);
    box-shadow: 0 0 0 10px rgba(23, 162, 184, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0);
  }
}
</style>
