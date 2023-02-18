<template>
  <router-view />
  <ToTop />
</template>

<script setup>
import ToTop from '@/core/components/ToTop.vue';
import {useHead} from '@vueuse/head';
import {useCore} from "@/core/store/core";

useHead({
  title: 'Einfach die Wahl haben',
  titleTemplate: '%s - digitalwahl.org',
  htmlAttrs: {
    lang: 'de'
  },
  meta: [
    {name: 'description', content: 'Einfach die Wahl haben.'},
    {name: 'viewport', content: 'width=device-width, initial-scale=1'}
  ]
});

// Initialise the core store.
useCore().init();
</script>