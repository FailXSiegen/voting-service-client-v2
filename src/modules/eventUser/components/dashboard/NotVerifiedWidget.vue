<template>
  <div class="d-print-none text-center">
    <div
      class="spinner-border mb-5"
      style="width: 3rem; height: 3rem"
      role="status"
    >
      <span class="sr-only">Loading...</span>
    </div>
    <h1>{{ $t('view.user.pending.tankYou') }}</h1>
    <h2>
      {{ $t('view.user.pending.loggedInAs') }}
      {{ eventUser.username }}
    </h2>
    <AlertBox
      type="info"
      :message="$t('view.user.pending.bodyText')"
    />
  </div>
</template>

<script setup>
import AlertBox from "@/core/components/AlertBox.vue";

defineProps({
  eventUser: {
    type: Object,
    required: true
  }
});
</script>
