<template>
  <div class="d-flex justify-content-center align-items-center" style="min-height: 100vh">
    <div class="text-center">
      <div v-if="loading" class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Lade...</span>
      </div>
      <div v-else-if="error" class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Link nicht gefunden</h4>
        <p>{{ error }}</p>
        <hr />
        <router-link to="/" class="btn btn-primary">Zur Startseite</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resolveShortlink } from '@/modules/shortlink/requests/resolve-shortlink';
import { loginByShortlink } from '@/core/auth/login';
import { useCore } from '@/core/store/core';
import { handleError } from '@/core/error/error-handler';

const route = useRoute();
const router = useRouter();
const coreStore = useCore();
const loading = ref(true);
const error = ref(null);

function eventPath(slug) {
  return `/event/${encodeURIComponent(slug)}`;
}

onMounted(async () => {
  const shortCode = String(route.params.shortCode ?? '');

  try {
    // SEC-40/MAGIC-1: log in with the shortcode itself. No username/public name in the URL or
    // history state, no password derived from public event data.
    const result = await loginByShortlink(shortCode);
    if (result?.success && result.token && result.eventSlug) {
      await coreStore.loginUser(result.token);
      // replace: the shortlink itself should not stay in the browser history.
      await router.replace(eventPath(result.eventSlug));
      return;
    }

    // Magic link not allowed for this event (or event inactive): open the event login page
    // without any prefilled personal data.
    const data = await resolveShortlink(shortCode);
    await router.replace(eventPath(data.eventSlug));
  } catch (err) {
    handleError(err);
    error.value = 'Der angeforderte Link konnte nicht gefunden werden.';
    loading.value = false;
  }
});
</script>
