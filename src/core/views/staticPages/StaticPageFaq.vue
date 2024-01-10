<template>
  <CorePageLayout meta-title="Häufige Fragen">
    <div class="faq">
      <h1>Häufige Fragen</h1>
      <div v-for="name in componentNames" :key="name">
        <component :is="name" @loaded="handleContentLoaded(name, $event)"></component>
      <div class="mb-4" v-html="htmlContents[name]"></div>
    </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
</script>
<script content>
import { defineAsyncComponent } from 'vue';
const componentNames = [
  'GeneralInfo',
  'Security',
  'Registration',
  'Execution',
  'Requirements',
  'Results',
  'Support',
  'Legal',
  'Feedback',
  'Special',
  /* ...weitere Namen... */
];

export default {
  components: componentNames.reduce((components, name) => {
    components[name] = defineAsyncComponent(() => import(`@/core/views/staticPages/Faq/${name}.vue`));
    return components;
  }, {}),

  data() {
    return {
      htmlContents: componentNames.reduce((contents, name) => {
        contents[name] = '';
        return contents;
      }, {})
    };
  },

  methods: {
    handleContentLoaded(name, htmlContent) {
      this.htmlContents[name] = htmlContent;
    },
  },
};
</script>
<style>
.card-header:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.card-header .btn:focus {
  box-shadow: none !important;
}
</style>
