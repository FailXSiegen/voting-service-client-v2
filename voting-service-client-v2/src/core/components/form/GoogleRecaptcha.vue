<template>
  <div
    v-if="!isDev"
    id="recaptcha-container"
    class="g-recaptcha"
    :data-sitekey="recaptchaSiteKey"
  ></div>
  <div v-else class="dev-mode-recaptcha">
    <small class="text-muted">reCAPTCHA auto-verified in dev mode</small>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const emit = defineEmits(["verified", "expired"]);
const env = import.meta.env;
const recaptchaResponse = ref(null);
const recaptchaVerified = ref(false);
const recaptchaSiteKey = env.VITE_RECAPTCHA_SITE_KEY;
const isDev = env.MODE === 'development';

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
          sitekey: recaptchaSiteKey,
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
});
</script>
