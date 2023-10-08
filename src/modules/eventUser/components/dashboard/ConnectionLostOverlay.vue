<template>
  <div
    id="overlay"
    class="h-100 w-100 position-fixed d-flex align-items-center align-content-center justify-content-center text-center"
  >
    <span class="content alert alert-danger">
      <h1>{{ $t('error.network.connectionLost') }}</h1>
      <button
        class="btn-lg btn btn-secondary py-2 d-print-none"
        @click="onReloadPage"
      >
        <i class="mr-3 bi bi-arrow-repeat bi--1xl" />
        {{ $t('navigation.reload') }}
      </button>
    </span>
  </div>
</template>

<script setup>
function onReloadPage() {
  location.reload();
}
</script>

<style scoped>
#overlay {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
}
</style>
