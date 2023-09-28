<template>
  <label
    v-if="label"
  >
    {{ label }}
  </label>
  <textarea
    v-model="newUsername"
    :name="name"

    :class="[
      'form-control',
      ...classes
    ]"
  ></textarea>
  <small
    v-if="helpText"
    class="form-text text-muted"
  >
    {{ helpText }}
  </small>
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
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import t from '@/core/util/l18n';

const emit = defineEmits(['change']);

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
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
  value: Array,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String
});

const items = ref(props.value ?? []);
const newUsername = ref('');

function onAddUsername() {
  const processedNewUsername = newUsername.value?.trim();
  if (!processedNewUsername) {
    return;
  }
  const copyOfItems = JSON.parse(JSON.stringify(items.value));
  const hit = copyOfItems.find((username) => username === processedNewUsername);
  if (hit) {
    handleError(new NetworkError(t('error.formValidation.valueAlreadyExist')));
    return;
  }
  copyOfItems.push(processedNewUsername);
  items.value = copyOfItems;
  newUsername.value = '';
  onChange();
}

function onRemoveUsername(usernameToRemove) {
  const copyOfItems = JSON.parse(JSON.stringify(items.value));
  items.value = copyOfItems.filter((username) => username !== usernameToRemove);
}

function onChange() {
  emit('change', {value: items.value});
}
</script>
