<template>
  <template v-if="loaded">
    <div v-if="!browserCompatible" class="browser-compatibility-warning">
      <div class="container py-4">
        <div class="alert alert-warning">
          <h4><i class="bi bi-exclamation-triangle-fill me-2"></i> Browser-Kompatibilitätswarnung</h4>
          <p>Ihr Browser unterstützt möglicherweise nicht alle Funktionen, die für eine zuverlässige Abstimmung benötigt werden.</p>
          <p><strong>Empfehlung:</strong> Verwenden Sie einen modernen Browser wie Chrome, Firefox oder Edge.</p>
          <p>Alternativ können Sie folgende Einstellungen in Ihrem aktuellen Browser überprüfen:</p>
          <ul>
            <li>Deaktivieren Sie den "Privaten Modus" oder "Inkognito-Modus"</li>
            <li>Erlauben Sie Cookies und Website-Daten für diese Seite</li>
            <li>Deaktivieren Sie den Tracking-Schutz oder Content-Blocker temporär</li>
          </ul>
          <button class="btn btn-primary mt-2" @click="browserCompatibilityWarningDismissed = true">
            Fortfahren trotz Einschränkungen
          </button>
        </div>
      </div>
    </div>
    <template v-if="browserCompatible || browserCompatibilityWarningDismissed">
      <router-view />
      <ToTop />
      <DialogsWrapper />
    </template>
  </template>
</template>

<script setup>
import ToTop from "@/core/components/ToTop.vue";
import { useCore } from "@/core/store/core";
import { apolloClient } from "@/apollo-client";
import { ref, onMounted, watch } from "vue";
import { checkBrowserCompatibility, detectBrowser } from "@/core/utils/browser-compatibility";
import { provideApolloClient, useSubscription } from "@vue/apollo-composable";
import { TOKEN_REFRESH_REQUIRED_SUBSCRIPTION } from "@/core/graphql/subscription/token-refresh-required";
import { refreshLogin } from "@/core/auth/login";
import { handleError } from "@/core/error/error-handler";

const loaded = ref(false);
const browserCompatible = ref(true);
const browserCompatibilityWarningDismissed = ref(false);
const coreStore = useCore();

// Provide Apollo client for this component
provideApolloClient(apolloClient);

// Initialise the core store.
(async () => {
  try {
    await coreStore.init();
    loaded.value = true;
    
    // Browser-Kompatibilität überprüfen
    const browserInfo = detectBrowser();
    
    const compatibility = checkBrowserCompatibility({
      showAlert: false,
      onIncompatible: (result) => {
        browserCompatible.value = false;
        
        // Sende Telemetrie-Daten, um Probleme zu erfassen
        try {
          const telemetryData = {
            compatibility: result,
            browser: browserInfo,
            timestamp: new Date().toISOString(),
            url: window.location.href
          };
          
          // Optional: Sende anonyme Telemetrie-Daten an den Server
          // Hier könnte ein API-Aufruf stehen, um die Daten zu senden
          console.warn('Browser-Kompatibilitätsproblem:', telemetryData);
        } catch (e) {
          console.error('Fehler beim Senden der Telemetrie-Daten:', e);
        }
      }
    });
    
    // Spezielle Fallback-Logik für Safari
    if (browserInfo.isSafari) {
      // Stelle sicher, dass wir Probleme mit Safari spezifisch behandeln
      console.info('Safari erkannt - aktiviere erweiterte Fallback-Mechanismen');
      
      // Versuche einen localStorage-Schreibzugriff mit Fehlerbehandlung
      try {
        localStorage.setItem('safari-compatibility-check', 'ok');
        const testResult = localStorage.getItem('safari-compatibility-check');
        localStorage.removeItem('safari-compatibility-check');
        
        if (testResult !== 'ok') {
          console.warn('Safari localStorage Test fehlgeschlagen!');
          browserCompatible.value = false;
        }
      } catch (e) {
        console.error('Safari localStorage Fehler:', e);
        browserCompatible.value = false;
      }
    }
  } catch (error) {
    console.error("App.vue initialization failed:", error);
  }
})();

// Token refresh subscription logic
const isAuthReady = ref(false);

// Watch for changes in user authentication state
watch(() => coreStore.isInitialized, (initialized) => {
  if (initialized) {
    isAuthReady.value = true;
  }
});

// Only enable subscriptions when authentication is ready
const tokenRefreshSubscription = useSubscription(
  TOKEN_REFRESH_REQUIRED_SUBSCRIPTION,
  () => ({
    eventUserId: coreStore.user?.id || null
  }),
  { enabled: isAuthReady }
);

// Handle token refresh subscription
tokenRefreshSubscription.onResult(async (result) => {
  if (!result.data) return;
  
  const { tokenRefreshRequired } = result.data;
  
  // Only process if we have data and it's for the current user
  if (tokenRefreshRequired && 
      coreStore.user.id == tokenRefreshRequired.userId && 
      coreStore.user.type === tokenRefreshRequired.userType) {
    
    console.info('[TokenRefresh] Server requested token refresh:', tokenRefreshRequired.reason);
    
    try {
      // If token is directly provided by the server, use it
      if (tokenRefreshRequired.token) {
        // Login with the new token and indicate it's a token refresh
        await coreStore.loginUser(tokenRefreshRequired.token, true);
        console.info('[TokenRefresh] Successfully refreshed token from subscription data');
      } else {
        // Fallback to refresh login API call
        const { token } = await refreshLogin();
        
        if (token) {
          // Login with the new token and indicate it's a token refresh
          await coreStore.loginUser(token, true);
          console.info('[TokenRefresh] Successfully refreshed token via API');
        }
      }
    } catch (error) {
      console.error('[TokenRefresh] Failed to refresh token:', error);
      handleError(error);
    }
  }
});

// Füge CSS für die Warnmeldung hinzu
onMounted(() => {
  const style = document.createElement('style');
  style.textContent = `
    .browser-compatibility-warning {
      position: relative;
      z-index: 1050;
      background-color: rgba(255, 255, 255, 0.95);
    }
  `;
  document.head.appendChild(style);
});
</script>