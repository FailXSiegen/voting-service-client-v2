<template>
  <router-view />
  <ToTop />
  <DialogsWrapper />
</template>

<script setup>
import ToTop from '@/core/components/ToTop.vue';
import {useCore} from "@/core/store/core";
// Initialise the core store.
useCore().init();
</script>