<template>
  <div class="core-page container-fluid">
    <div class="container core-page-container">
      <slot />
    </div>
  </div>
  <LoginFooter />
</template>

<script setup>
import { useHead } from '@unhead/vue';
import LoginFooter from '@/core/components/LoginFooter.vue';
import { SEO_PAGES } from '@/core/seo-pages.mjs';

const props = defineProps({
  metaTitle: {
    type: String,
    default: 'Einfach die Wahl haben',
  },
});

const seoPage = SEO_PAGES[location.pathname];

useHead({
  title: props.metaTitle ?? 'Einfach die Wahl haben',
  titleTemplate: (title) => {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    const suffix = settings.titleSuffix || 'digitalwahl.org';
    return `${title} - ${suffix}`;
  },
  htmlAttrs: {
    lang: 'de',
  },
  link: seoPage ? [{ rel: 'canonical', href: location.origin + location.pathname }] : [],
  meta: [
    { name: 'description', content: seoPage?.description ?? 'Einfach die Wahl haben.' },
    { name: 'robots', content: seoPage ? 'index,follow' : 'noindex' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
});
</script>

<style lang="scss" scoped>
.core-page-container {
  margin-top: 3rem;
  margin-bottom: 4rem;
}
</style>
