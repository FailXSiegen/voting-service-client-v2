<template>
  <label
    v-if="label"
    :for="id"
  >
    {{ label }}
  </label>
  <div class="input-group">
    <div class="input-group-prepend">
      <div class="input-group-text">
        @
      </div>
    </div>
    <input
      :id="id"
      v-model="inputValue"
      :name="name"
      :class="[
        'form-control',
        (hasErrors ? 'is-invalid': null),
        ...classes
      ]"
      :autocomplete="autocomplete"
      type="email"
      @keyup="onChange"
    >
  </div>
  <span
    v-for="error in errors"
    :key="error.uid"
    class="form-field-error text-danger"
  >
    {{ $t('error.formValidation.' + error.$validator) }}<br>
  </span>
</template>

<script setup>
import {ref} from "vue";

const emit = defineEmits(['change']);

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
  // eslint-disable-next-line vue/require-default-prop
  id: String,
  // eslint-disable-next-line vue/require-default-prop
  name: String,
  // eslint-disable-next-line vue/require-default-prop
  autocomplete: String,
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
  value: String
});

const inputValue = ref(props.value);

function onChange() {
  emit('change', {value: inputValue.value});
}
</script>
