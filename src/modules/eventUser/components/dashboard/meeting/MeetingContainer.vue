<template>
  <div class="meeting">
    <div class="container-zoom">
      <div id="zoom-hook" />
      <ZoomFrame
        v-if="event.meeting.credentials"
        :api-key="event.meeting.apiKey"
        :api-secret="event.meeting.apiSecret"
        :nickname="eventUser.publicName"
        :meeting-number="event.meeting.credentials.meetingId"
        :password="event.meeting.credentials.password"
        :return-url="event.slug"
        @loaded="onLoaded"
      />
      <div
        v-if="meetingLoaded"
        class="btn btn-primary position-fixed sticky-top mt-2"
        :title="$t('view.event.meeting.switchView')"
        @click.prevent="onToggleVideoConference"
      >
        <template v-if="dashboardForeground">
          <i class="bi bi bi-fullscreen mr-2" /><span>{{
            $t("view.event.meeting.backToMeeting")
          }}</span>
        </template>
        <template v-else>
          <i class="bi bi-fullscreen-exit mr-2" /><span>{{
            $t("view.event.meeting.backToDashboard")
          }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import ZoomFrame from "@/modules/eventUser/components/dashboard/meeting/frame/ZoomFrame.vue";
import { ref } from "vue";

defineProps({
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
});

// Data.
const dashboardForeground = ref(false);
const meetingLoaded = ref(false);

// Events.

function onToggleVideoConference() {
  const bodyElement = document.querySelector("body");
  const zoomRootElement = document.querySelector("#zmmtg-root");

  if (bodyElement && zoomRootElement && !dashboardForeground.value) {
    bodyElement.classList.add("zoom-hidden");
    bodyElement.classList.remove("zoom-show");

    zoomRootElement.classList.add("hidden");
    zoomRootElement.style.display = "none";
  } else {
    bodyElement.classList.add("zoom-show");
    bodyElement.classList.remove("zoom-hidden");

    zoomRootElement.classList.remove("hidden");
    zoomRootElement.style.display = "block";
  }

  dashboardForeground.value = !dashboardForeground.value;
}

function onLoaded() {
  meetingLoaded.value = true;
}
</script>

<style>
.container-zoom {
  width: 70%;
  height: 100%;
}
</style>
