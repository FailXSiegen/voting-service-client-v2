<template>
  <div class="form-check">
    <input
      :id="checkboxId"
      :name="name"
      :class="['form-check-input', hasErrors ? 'is-invalid' : null, ...classes]"
      :value="value ?? 1"
      :checked="checked"
      :disabled="disabled"
      type="checkbox"
      @input="(event) => $emit('update:checked', event.target.checked)"
    />
    <label class="form-check-label" :for="checkboxId" v-html="label" />
    <div v-if="helpText" class="form-text text-muted">
      <span v-html="helpText" />
    </div>
    <span
      v-for="error in errors"
      :key="error.uid"
      class="form-field-error text-danger"
    >
      {{ $t("error.formValidation." + error.$validator) }}<br />
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";

defineEmits(["update:checked"]);

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
  // eslint-disable-next-line vue/require-default-prop
  id: String,
  // eslint-disable-next-line vue/require-default-prop
  name: String,
  classes: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: [],
  },
  hasErrors: Boolean,
  errors: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: [],
  },
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
  // eslint-disable-next-line vue/require-default-prop
  checked: Boolean,
  // eslint-disable-next-line vue/require-default-prop
  disabled: Boolean,
  // eslint-disable-next-line vue/require-default-prop
  value: [String, Number],
});

// Generate a unique ID if none is provided
const checkboxId = computed(() => {
  if (props.id) {
    return props.id;
  }
  // Generate a unique ID based on label or fallback to random
  const baseId = props.label 
    ? props.label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : 'checkbox';
  return `${baseId}-${Math.random().toString(36).substr(2, 9)}`;
});
</script>
