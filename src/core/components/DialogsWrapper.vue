<template>
  <!-- Dialog container for global notifications and alerts -->
  <div class="dialogs-wrapper">
    <!-- Token refresh notification -->
    <div v-if="showTokenRefreshNotification" class="token-refresh-notification">
      <div class="alert alert-info alert-dismissible fade show" role="alert">
        <strong>Verbindung aktualisiert</strong>
        <p>Ihre Sitzung wurde erfolgreich aktualisiert.</p>
        <button 
          type="button" 
          class="btn-close" 
          aria-label="Close" 
          @click="showTokenRefreshNotification = false"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watch } from 'vue';
import { useCore } from '@/core/store/core';

// State for token refresh notification
const showTokenRefreshNotification = ref(false);
const coreStore = useCore();

// Optional - can be used if you need to expose event bus
const tokenRefreshEventBus = inject('tokenRefreshEventBus', null);

// Watch for token refresh events through various means
if (tokenRefreshEventBus) {
  tokenRefreshEventBus.on('tokenRefreshed', () => {
    showNotification();
  });
}

// Watch lastTokenRefresh changes to detect token refreshes
const lastRefreshTimestamp = ref(coreStore.getLastTokenRefresh);

watch(() => coreStore.getLastTokenRefresh, (newTimestamp) => {
  if (newTimestamp && newTimestamp !== lastRefreshTimestamp.value) {
    // A token refresh occurred
    lastRefreshTimestamp.value = newTimestamp;
    showNotification();
  }
});

function showNotification() {
  showTokenRefreshNotification.value = true;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    showTokenRefreshNotification.value = false;
  }, 5000);
}
</script>

<style scoped>
.dialogs-wrapper {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1060;
  width: 320px;
}

.token-refresh-notification {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>