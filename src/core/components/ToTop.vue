<template>
  <div
      v-if="show"
      class="to-top position-fixed bg-white"
  >
    <button
        data-cy="to-top-btn"
        class="btn btn-secondary"
        @click.prevent="onClickToTopButton"
    >
      <i class="bi bi-arrow-up-circle display-5"/>
    </button>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";

const minHeight = 250;
const show = ref(false)

let lastKnownScrollPosition = 0;
let ticking = false;

function onClickToTopButton() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function onScroll() {
  lastKnownScrollPosition = window.scrollY;
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const shouldShowToTopButton = lastKnownScrollPosition >= minHeight;
      if (shouldShowToTopButton !== show.value) {
        show.value = shouldShowToTopButton
      }
      ticking = false;
    });
    ticking = true;
  }
}

onMounted(() => {
  document.addEventListener("scroll", onScroll);
})

</script>

<style scoped>
.to-top {
  z-index: 1100;
  right: 10px;
  bottom: 10px;
}
</style>
