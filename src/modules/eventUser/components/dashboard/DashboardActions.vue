<template>
  <div class="actions-container">
    <div class="actions">
      <button
        v-if="!isEventUserAuthorizedViaToken"
        class="actions-item btn btn-danger d-print-none"
        @click="onLogout"
      >
        <i class="mr-2 bi bi-x-square" />{{ $t("navigation.logOut") }}
      </button>
      <button
        v-else
        class="actions-item btn btn-danger d-print-none"
        @click="onTerminateTokenSession"
      >
        <i class="mr-2 bi bi-x-square" />{{
          $t("navigation.terminateTokenSession")
        }}
      </button>
      <button
        class="actions-item btn btn-secondary d-print-none"
        @click="onReloadPage"
      >
        <i class="mr-2 bi bi-arrow-repeat" />{{ $t("navigation.reload") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCore } from "@/core/store/core";

const emit = defineEmits(["logout", "terminateTokenSession"]);
const store = useCore();
const isEventUserAuthorizedViaToken = store.isEventUserAuthorizedViaToken;

// Events.

function onLogout() {
  emit("logout");
}

function onTerminateTokenSession() {
  emit("terminateTokenSession");
}

function onReloadPage() {
  location.reload();
}
</script>

<style lang="scss" scoped>
.actions-container {
  display: flex;
  justify-content: end;

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
