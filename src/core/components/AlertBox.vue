<template>
  <div
    :class="'alert ' + config.wrapperClass"
    role="alert"
  >
    <i
      v-if="useIcon"
      :class="'bi flex-shrink-0 me-2 ' + config.icon + ' mr-2'"
    />
    <div class="d-inline">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import {computed} from "vue";

const types = {
  success: {
    wrapperClass: 'alert-success',
    icon: 'bi-check-circle-fill'
  },
  warning: {
    wrapperClass: 'alert-warning',
    icon: 'bi-exclamation-triangle-fill'
  },
  danger: {
    wrapperClass: 'alert-danger',
    icon: 'bi-exclamation-triangle-fill'
  },
  info: {
    wrapperClass: 'alert-info',
    icon: 'bi-info-fill'
  }
};

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: false,
    default: 'success'
  },
  useIcon: {
    type: Boolean,
    required: false,
    default: true
  },
});

const config = computed(() => {
  for (const [key, value] of Object.entries(types)) {
    if (key === props.type) {
      return value;
    }
  }
  throw new Error("Invalid type used for AlertBox. Allowed types are: " + Object.keys(types).join(', '));
});
</script>