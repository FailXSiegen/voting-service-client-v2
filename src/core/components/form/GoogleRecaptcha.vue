<template>
  <div v-if="!isDev && recaptchaEnabled && recaptchaSiteKey" class="recaptcha-wrapper">
    <div
      id="recaptcha-container"
      class="g-recaptcha"
      :data-sitekey="recaptchaSiteKey"
    ></div>
  </div>
  <div v-else-if="isDev" class="dev-mode-recaptcha">
    <small class="text-muted">reCAPTCHA auto-verified in dev mode</small>
  </div>
  <div v-else-if="!recaptchaEnabled" class="recaptcha-disabled">
    <small class="text-muted">reCAPTCHA is disabled</small>
  </div>
  <div v-else-if="settingsLoading" class="recaptcha-loading">
    <small class="text-muted">Loading reCAPTCHA configuration...</small>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useQuery } from '@vue/apollo-composable';
import { SYSTEM_SETTINGS_QUERY } from '@/modules/organizer/graphql/queries/system-settings';

const emit = defineEmits(["verified", "expired"]);
const env = import.meta.env;
const recaptchaResponse = ref(null);
const recaptchaVerified = ref(false);
const isDev = env.MODE === 'development';

// Query system settings to get reCAPTCHA configuration
const { result: systemSettingsResult, loading: settingsLoading } = useQuery(
  SYSTEM_SETTINGS_QUERY,
  {},
  { fetchPolicy: 'cache-and-network' }
);

const systemSettings = computed(() => systemSettingsResult.value?.systemSettings);
const recaptchaSiteKey = computed(() => {
  // Use system settings first, fallback to env variable for backwards compatibility
  return systemSettings.value?.recaptchaSiteKey || env.VITE_RECAPTCHA_SITE_KEY;
});
const recaptchaEnabled = computed(() => {
  // If we have system settings, use that, otherwise assume enabled if we have a site key
  return systemSettings.value?.recaptchaEnabled ?? Boolean(recaptchaSiteKey.value);
});

function onCaptchaVerified(response) {
  recaptchaResponse.value = response;
  recaptchaVerified.value = true;
  emit("verified");
}

function onCaptchaExpired() {
  recaptchaResponse.value = null;
  recaptchaVerified.value = false;
  emit("expired");
}

onMounted(() => {
  // Auto-verify in development mode
  if (isDev) {
    console.log('Development mode detected - reCAPTCHA automatically verified');
    onCaptchaVerified('dev-mode-auto-verified');
    return;
  }

  // Wait for system settings to load
  function initializeRecaptcha() {
    // If reCAPTCHA is disabled or no site key, auto-verify
    if (!recaptchaEnabled.value || !recaptchaSiteKey.value) {
      console.log('reCAPTCHA disabled or no site key - automatically verified');
      onCaptchaVerified('disabled-auto-verified');
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    function tryToRenderRecaptcha() {
      if (!window.grecaptcha || !window.grecaptcha.render) {
        setTimeout(tryToRenderRecaptcha, 100);
        return;
      }

      window.grecaptcha.ready(() => {
        try {
          window.grecaptcha.render("recaptcha-container", {
            sitekey: recaptchaSiteKey.value,
            callback: onCaptchaVerified,
            "expired-callback": onCaptchaExpired,
          });
        } catch (error) {
          console.error("Error rendering reCAPTCHA:", error);
        }
      });
    }

    script.onload = tryToRenderRecaptcha;
    script.onerror = (error) =>
      console.error("Failed to load reCAPTCHA script:", error);
  }

  // Wait for settings to load or timeout after 5 seconds
  if (settingsLoading.value) {
    let attempts = 0;
    const checkSettings = () => {
      attempts++;
      if (!settingsLoading.value || attempts > 50) { // 50 * 100ms = 5 seconds max
        initializeRecaptcha();
      } else {
        setTimeout(checkSettings, 100);
      }
    };
    checkSettings();
  } else {
    initializeRecaptcha();
  }
});
</script>
