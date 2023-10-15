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

// Data.

const coreStore = useCore();
const event = coreStore.event;
const activeComponent = shallowRef(null);

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
