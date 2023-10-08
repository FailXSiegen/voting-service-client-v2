<template>
  <template
    v-for="item in items"
    :key="item.value"
  >
    <div class="form-check">
      <input
        :id="id+'-'+item.value"
        v-model="inputValue"
        :name="name"
        :class="[
          'form-check-input',
          (hasErrors ? 'is-invalid': null),
          ...classes
        ]"
        type="radio"
        :value="item.value"
        @change="onChange"
      >
      <label
        v-if="item.label"
        class="form-check-label"
        :for="id+'-'+item.value"
      >
        {{ item.label }}
      </label>
      <small
        v-if="item.helpText"
        class="form-text text-muted"
      >
        <span v-html="item.helpText" />
      </small>
    </div>
  </template>

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
  value: String,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
  items: {
    type: Array,
    default: () => []
  },
});

const inputValue = ref(props.value);

function onChange() {
  emit('change', {value: inputValue.value});
}
</script>
