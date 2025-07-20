<template>
  <div class="dashboard-container">
    <header>
      <slot name="header" />
    </header>
    <main class="container-fluid mb-5 pb-5">
      <div class="row">
        <div class="col-12">
          <h1>
            <slot name="title" />
          </h1>
          <hr />
        </div>
      </div>
      <slot name="content" />
    </main>
  </div>
</template>

<script setup>
import { useHead } from "@vueuse/head";

const props = defineProps({
  metaTitle: {
    type: String,
    default: "Einfach die Wahl haben",
  },
});

useHead({
  title: props.metaTitle ?? "Einfach die Wahl haben",
  titleTemplate: "%s - digitalwahl.org",
  htmlAttrs: {
    lang: "de",
  },
  meta: [
    { name: "description", content: "Einfach die Wahl haben." },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
});
</script>
