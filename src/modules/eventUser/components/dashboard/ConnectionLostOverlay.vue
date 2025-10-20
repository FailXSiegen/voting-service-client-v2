<template>
  <div
    id="overlay"
    class="h-100 w-100 position-fixed d-flex align-items-center align-content-center justify-content-center text-center"
  >
    <span class="content alert alert-danger">
      <h1>{{ $t("error.network.connectionLost") }}</h1>
      <div class="d-flex justify-content-center gap-3">
        <button
          class="btn-lg btn btn-secondary py-2 d-print-none"
          @click="onReloadPage"
        >
          <i class="me-3 bi bi-arrow-repeat bi--1xl" />
          {{ $t("navigation.reload") }}
        </button>
        <button
          class="btn-lg btn btn-danger py-2 d-print-none"
          @click="onLogout"
        >
          <i class="me-3 bi bi-x-square bi--1xl" />
          {{ $t("navigation.logOut") }}
        </button>
      </div>
    </span>
  </div>
</template>

<script setup>
import { logout } from "@/core/auth/login";
import { useCore } from "@/core/store/core";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useCore();

function onReloadPage() {
  location.reload();
}

async function onLogout() {
  try {
    await logout();
    // Manuelle Bereinigung des LocalStorage für den Fall, dass die Verbindung zum Server nicht hergestellt werden kann
    localStorage.clear();
    // Zustand des Stores zurücksetzen
    await store.logoutUser();
    // Nach Logout einfach die Seite neu laden
    location.reload();
  } catch (error) {
    console.error("Fehler beim Logout:", error);
    // Im Fehlerfall trotzdem LocalStorage löschen und Seite neu laden
    localStorage.clear();
    location.reload();
  }
}
</script>

<style scoped>
#overlay {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}
</style>
