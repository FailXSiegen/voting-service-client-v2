<template>
  <div class="core-page container-fluid">
    <div class="container core-page-container">
      <slot />
    </div>
  </div>
  <LoginFooter />
</template>

<script setup>
import {useHead} from '@vueuse/head';
import LoginFooter from '@/core/components/LoginFooter.vue';

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

<style lang="scss" scoped>
.core-page-container {
  margin-top: 3rem;
  margin-bottom: 4rem;
}
</style>