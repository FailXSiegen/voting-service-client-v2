<template>
  <div :id="'event-' + event.slug">
    <component
      :is="activeComponent"
      v-if="activeComponent"
      :event="event"
      @exit="determineActiveComponent"
    />
  </div>
</template>

<script setup>
import { useCore } from "@/core/store/core";
import { onMounted, shallowRef } from "vue";
import EventUserLogin from "@/modules/eventUser/components/EventUserLogin.vue";
import EventUserDashboard from "@/modules/eventUser/components/EventUserDashboard.vue";
import { terminateWebsocketClient } from "@/apollo-client";
import { logout } from "@/core/auth/login";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";

// Data.

const coreStore = useCore();
const event = coreStore.event;
const eventUser = coreStore.eventUser.value;
const activeComponent = shallowRef(null);

// Check if event user is in wrong event.
if (
  eventUser?.eventId &&
  parseInt(event.id, 10) !== parseInt(eventUser?.eventId, 10)
) {
  logout()
    .then(() => determineActiveComponent())
    .then(() => toast(t("notice.logout.wrongEvent"), { type: "info" }));
}

// Terminate websocket connection, if the user change the tab.

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") {
    console.warn("Tab is inactive. Now terminating websocket connection.");
    terminateWebsocketClient();
  }
});

// Define active component.

activeComponent.value = coreStore.isActiveEventUserSession
  ? EventUserDashboard
  : EventUserLogin;

// Functions.

function determineActiveComponent() {
  activeComponent.value = coreStore.isActiveEventUserSession
    ? EventUserDashboard
    : EventUserLogin;
}

onMounted(() => {
  determineActiveComponent();
});
</script>
