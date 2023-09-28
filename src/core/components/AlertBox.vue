<template>
  <div
    :class="'alert text-left ' + config.wrapperClass"
    role="alert"
  >
    <div class="icon">
      <i
        v-if="useIcon"
        :class="'bi flex-shrink-0 me-2 ' + config.icon + ' mr-2'"
      />
    </div>
    <div class="message">
      <template v-if="message">
        {{ message }}
      </template>
      <slot v-else />
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
    icon: 'bi-info-circle-fill'
  }
};

const props = defineProps({
  message: {
    type: String,
    required: false,
    default: ''
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

<style scoped>
.alert .icon {
  display: table-cell;
}

.alert div,
.alert span {
  padding-left: 5px;
  display: table-cell;
}
</style>