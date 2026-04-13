<template>
  <div class="meeting">
    <div class="container-zoom">
      <div id="zoom-hook" />
      <ZoomFrame
        v-if="isZoomMeeting && event.meeting.credentials"
        :nickname="eventUser.publicName"
        :meeting-number="event.meeting.credentials.meetingId"
        :password="event.meeting.credentials.password"
        :return-url="event.slug"
        @loaded="onLoaded"
      />
      <JitsiFrame
        v-else-if="isJitsiMeeting && event.meeting.credentials"
        :server-url="event.meeting.serverUrl"
        :room-name="event.meeting.credentials.roomName"
        :nickname="eventUser.publicName"
        :return-url="event.slug"
        @loaded="onLoaded"
      />
      <div
        v-if="meetingLoaded"
        class="btn btn-primary position-fixed sticky-top mt-2 meeting-toggle-btn"
        :title="$t('view.event.meeting.switchView')"
        @click.prevent="onToggleVideoConference"
      >
        <template v-if="dashboardForeground">
          <i class="bi bi bi-fullscreen me-2" /><span>{{
            $t('view.event.meeting.backToMeeting')
          }}</span>
        </template>
        <template v-else>
          <i class="bi bi-fullscreen-exit me-2" /><span>{{
            $t('view.event.meeting.backToDashboard')
          }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import ZoomFrame from '@/modules/eventUser/components/dashboard/meeting/frame/ZoomFrame.vue';
import JitsiFrame from '@/modules/eventUser/components/dashboard/meeting/frame/JitsiFrame.vue';
import { ref, computed } from 'vue';

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
});

const isZoomMeeting = computed(() => {
  return props.event.meeting && !props.event.meeting.serverUrl;
});

const isJitsiMeeting = computed(() => {
  return props.event.meeting && !!props.event.meeting.serverUrl;
});

// Data.
const dashboardForeground = ref(false);
const meetingLoaded = ref(false);

// Events.

function onToggleVideoConference() {
  if (isZoomMeeting.value) {
    toggleOverlayVisibility('#zmmtg-root');
  } else if (isJitsiMeeting.value) {
    toggleOverlayVisibility('#jitsi-root');
  }
}

function toggleOverlayVisibility(selector) {
  const bodyElement = document.querySelector('body');
  const overlayElement = document.querySelector(selector);

  if (!overlayElement) return;

  if (!dashboardForeground.value) {
    // Hide meeting, show dashboard
    bodyElement.classList.add('zoom-hidden');
    bodyElement.classList.remove('zoom-show');
    overlayElement.classList.add('hidden');
  } else {
    // Show meeting, hide dashboard
    bodyElement.classList.add('zoom-show');
    bodyElement.classList.remove('zoom-hidden');
    overlayElement.classList.remove('hidden');
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

.meeting-toggle-btn {
  z-index: 1100;
}
</style>
