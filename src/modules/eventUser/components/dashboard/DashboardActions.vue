<template>
  <div class="actions-container">
    <div class="actions">
      <button
        class="actions-item btn btn-danger d-print-none"
        @click="onLogout"
      >
        <i class="mr-2 bi bi-x-square" />{{ $t("navigation.logOut") }}
      </button>
      <button
        class="actions-item btn btn-secondary d-print-none"
        @click="onReloadPage"
      >
        <i class="mr-2 bi bi-arrow-repeat" />{{ $t("navigation.reload") }}
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["logout"]);

// Events.

function onLogout() {
  emit("logout");
}

function onReloadPage() {
  location.reload();
}
</script>

<style lang="scss" scoped>
.actions-container {
  display: flex;
  justify-content: end;

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
