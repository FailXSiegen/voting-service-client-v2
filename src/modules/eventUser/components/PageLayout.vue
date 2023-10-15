<template>
  <main class="container mt-5">
    <slot name="actions" />
    <div class="title d-block mb-5">
      <h1 class="text-center">
        <slot name="title" />
      </h1>
      <h2 class="h4 text-center">
        <slot name="subtitle" />
      </h2>
    </div>
    <div class="content d-block">
      <slot name="content" />
    </div>
  </main>

  <!--  <div class="container-fluid">-->
  <!--    <div class="align-items-center justify-content-around">-->
  <!--      <main class="container-fluid min-vh-100 ">-->
  <!--        <div class="align-items-center justify-content-around h-100">-->
  <!--          <div class="row">-->
  <!--            <div class="col-12 py-3 mb-4">-->
  <!--              <h1 class="text-center">-->
  <!--                <slot name="title" />-->
  <!--              </h1>-->
  <!--              <h2 class="h4 text-center">-->
  <!--                <slot name="subtitle" />-->
  <!--              </h2>-->
  <!--            </div>-->
  <!--            <div class="col-12">-->
  <!--              <slot name="content" />-->
  <!--            </div>-->
  <!--          </div>-->
  <!--        </div>-->
  <!--      </main>-->
  <!--    </div>-->
  <!--  </div>-->
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
