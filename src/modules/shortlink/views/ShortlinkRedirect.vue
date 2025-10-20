<template>
  <div class="d-flex justify-content-center align-items-center" style="min-height: 100vh;">
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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resolveShortlink } from "@/modules/shortlink/requests/resolve-shortlink";
import { handleError } from "@/core/error/error-handler";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  const shortCode = route.params.shortCode;

  try {
    const data = await resolveShortlink(shortCode);

    // Build query parameters
    const query = {};
    if (data.username) {
      query.username = data.username;
    }
    if (data.publicName) {
      query.publicname = data.publicName;
    }

    // Redirect to event page
    await router.push({
      path: `/event/${data.eventSlug}`,
      query: query,
    });
  } catch (err) {
    handleError(err);
    error.value = "Der angeforderte Link konnte nicht gefunden werden.";
    loading.value = false;
  }
});
</script>
