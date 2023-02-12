<template>
  <router-view />
  <ToTop />
</template>

<script setup>
import ToTop from '@/core/components/ToTop.vue';
import {useHead} from '@vueuse/head';
import {loginOrganizer} from "@/core/auth/login";
import {handleError} from "@/core/error/error-handler";

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


</script>