<template>
  <template v-if="loaded">
    <router-view />
    <ToTop />
    <DialogsWrapper />
  </template>
</template>

<script setup>
import ToTop from "@/core/components/ToTop.vue";
import { useCore } from "@/core/store/core";
import { ref } from "vue";

const loaded = ref(false);

// Initialise the core store.
(async () => {
 try {
    await useCore().init();
    loaded.value = true;
  } catch (error) {
    console.error("App.vue initialization failed:", error);
  }
})();
</script>
