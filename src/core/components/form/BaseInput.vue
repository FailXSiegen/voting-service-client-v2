<template>
  <label v-if="label" :for="id">
    {{ label }}
  </label>
  <input
    :id="id"
    v-model="inputValue"
    :name="name"
    :class="['form-control', hasErrors ? 'is-invalid' : null, ...classes]"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :readonly="readonly"
    :type="type"
    @keyup="onChange"
    @blur="onChange"
    @change="onChange"
  />
  <small v-if="helpText" class="form-text text-muted">
    <span v-html="helpText" />
  </small>
  <span
    v-for="error in errors"
    :key="error.uid"
    class="form-field-error text-danger"
  >
    {{ $t("error.formValidation." + error.$validator) }}<br />
  </span>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["change"]);

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
  // eslint-disable-next-line vue/require-default-prop
  placeholder: String,
  // eslint-disable-next-line vue/require-default-prop
  id: String,
  // eslint-disable-next-line vue/require-default-prop
  type: String,
  // eslint-disable-next-line vue/require-default-prop
  name: String,
  // eslint-disable-next-line vue/require-default-prop
  autocomplete: String,
  // eslint-disable-next-line vue/require-default-prop
  readonly: String,
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
  value: String,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
});

const inputValue = ref(props.value);

function onChange() {
  emit("change", { value: inputValue.value });
}
</script>
