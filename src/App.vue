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
  await useCore().init();
  loaded.value = true;
})();
</script>
