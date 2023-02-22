<template>
  <div class="form-check">
    <input
      :id="id"
      :name="name"
      :class="[
        'form-check-input',
        (hasErrors ? 'is-invalid': null),
        ...classes
      ]"
      :checked="checked"
      type="checkbox"
      @input="(event) => $emit('update:checked', event.target.checked)"
    >
    <label
      class="form-check-label"
      :for="id"
      v-html="label"
    />
    <span
      v-for="error in errors"
      :key="error.uid"
      class="form-field-error text-danger"
    >
      {{ $t('error.formValidation.' + error.$validator) }}<br>
    </span>
  </div>
</template>

<script setup>
defineEmits(['update:checked']);
defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
  // eslint-disable-next-line vue/require-default-prop
  id: String,
  // eslint-disable-next-line vue/require-default-prop
  name: String,
  classes: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: []
  },
  hasErrors: Boolean,
  errors: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: []
  },
  // eslint-disable-next-line vue/require-default-prop
  checked: Boolean,
});
</script>
