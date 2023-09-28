<template>
  <div class="dashboard-stats">
    <h1>{{ event.title }}</h1>
    <h2>
      {{ $t('view.user.verified.welcome') }}
      {{ eventUser.publicName }}
    </h2>
    <p id="userInformation">
      {{ eventUser.username }} -
      <span
        v-if="eventUser.allowToVote"
        class="text-success small"
      >
        {{ $t('view.event.user.member') }}</span>
      <span
        v-else
        class="text-info small"
      >{{
        $t('view.event.user.visitor')
      }}</span>
      <span v-if="eventUser.allowToVote">
        | Anzahl Stimmen: {{ eventUser.voteAmount }}</span>
      <span> | Status: </span>
      <span
        v-if="eventUser.online"
        class="badge badge-success badge-pill status-indicator"
      >online</span>
      <span
        v-else
        class="badge badge-danger badge-pill status-indicator"
      >offline</span>
    </p>
    <hr class="d-print-none">
    <p
      v-if="event.description"
      class="d-print-none"
    >
      {{ event.description }}
    </p>
  </div>
  <hr>
</template>

<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  eventUser: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>

</style>