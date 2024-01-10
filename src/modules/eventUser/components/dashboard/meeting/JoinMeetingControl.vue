<template>
  <button class="btn btn-primary" @click.prevent="onJoinMeeting">
    <i class="bi bi-camera-video-fill mr-2" />{{
      $t("view.event.meeting.join")
    }}
  </button>
  <hr />
</template>

<script setup>
defineProps({
  event: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["joinMeeting"]);

function onJoinMeeting() {
  emit("joinMeeting");
}
</script>
