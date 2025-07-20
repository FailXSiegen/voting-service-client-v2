//EventUserFrame.vue
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
import { onMounted, onUnmounted, shallowRef } from "vue";
import EventUserLogin from "@/modules/eventUser/components/EventUserLogin.vue";
import EventUserDashboard from "@/modules/eventUser/components/EventUserDashboard.vue";
import { terminateWebsocketClient, reconnectWebsocketClient } from "@/apollo-client";
import { logout } from "@/core/auth/login";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";

// Data
const coreStore = useCore();
const event = coreStore.event;
const eventUser = coreStore.eventUser.value;
const activeComponent = shallowRef(null);

// Style handling
function applyEventStyles() {
  if (event?.styles) {
    try {
      const stylesObject = typeof event.styles === 'string' 
        ? JSON.parse(event.styles) 
        : event.styles;
      coreStore.updateEventStyles(stylesObject);
    } catch (error) {
      console.error('Style processing error:', error);
    }
  }
}

function removeEventStyles() {
  coreStore.resetEventStyles();
}

// Event user validation
if (
  eventUser?.eventId &&
  parseInt(event.id, 10) !== parseInt(eventUser?.eventId, 10)
) {
  logout()
    .then(() => coreStore.init())
    .then(() => determineActiveComponent())
    .then(() => toast(t("notice.logout.wrongEvent"), { type: "info" }));
}

// Websocket handling
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") {
    console.warn("Tab is inactive. Now terminating websocket connection.");
    terminateWebsocketClient();
  } else {
    console.log("Tab is active again. Reconnecting websocket client.");
    
    // Setze sofort den lokalen Status auf online (UI-Feedback)
    if (coreStore.isActiveEventUserSession) {
      coreStore.setEventUserOnlineState(true);
    }
    
    // Starte die WebSocket-Reconnect-Prozedur
    reconnectWebsocketClient().then(() => {
      console.log("WebSocket reconnection completed successfully.");
      
      // Zusätzliche Sicherheit: Erzwinge ein Update des Online-Status nach erfolgreicher Verbindung
      if (coreStore.isActiveEventUserSession) {
        // Stelle erneut sicher, dass der UI-Status korrekt ist
        coreStore.setEventUserOnlineState(true);
        
        // Erzwinge ein erneutes Update nach kurzer Verzögerung, um sicherzustellen,
        // dass alle WebSocket-Handler geladen sind
        setTimeout(() => {
          console.log("Forcing additional online status update after delay");
          coreStore.setEventUserOnlineState(true);
        }, 1000);
      }
    }).catch(err => {
      console.error("Error reconnecting websocket client:", err);
    });
  }
});

// Component management
activeComponent.value = coreStore.isActiveEventUserSession
  ? EventUserDashboard
  : EventUserLogin;

function determineActiveComponent() {
  activeComponent.value = coreStore.isActiveEventUserSession
    ? EventUserDashboard
    : EventUserLogin;
}

// Lifecycle hooks
onMounted(() => {
  determineActiveComponent();
  applyEventStyles();
});

onUnmounted(() => {
  removeEventStyles();
});
</script>