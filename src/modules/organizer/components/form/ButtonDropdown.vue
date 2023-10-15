<template>
  <div class="btn-group" role="group">
    <div class="btn-group" role="group">
      <button
        id="btnGroupDropdown"
        type="button"
        class="btn btn-secondary dropdown-toggle pr-3 pl-3"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span :class="['mr-2', 'nav-icon', 'bi', icon]" /><span class="mr-2">{{
          label
        }}</span>
      </button>
      <div class="dropdown-menu" aria-labelledby="btnGroupDropdown">
        <a
          v-for="(button, i) in buttons"
          :key="i"
          class="dropdown-item"
          href="#"
          @click.prevent="button?.onClick"
          >{{ button.label }}</a
        >
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  buttons: {
    type: Array,
    required: true,
  },
});
const icon = "bi-download";
</script>
