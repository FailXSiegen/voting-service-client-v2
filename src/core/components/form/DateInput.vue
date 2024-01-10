<template>
  <label v-if="label" :for="id">
    {{ label }}
  </label>
  <VueDatePicker
    :id="id"
    v-model="inputValue"
    :name="name"
    :format="format"
    locale="de"
    cancel-text="abbrechen"
    select-text="auswählen"
    @update:model-value="onChange"
  />
  <small v-if="helpText" class="form-text text-muted">
    <span v-html="helpText" />
  </small>
  <span
    v-for="error in errors"
    :key="error.uid"
    class="form-field-error text-danger"
  >
    <!--    {{ $t('error.formValidation.' + error.$validator) }}<br>-->
  </span>
</template>

<script setup>
import { ref } from "vue";
import VueDatePicker from "@vuepic/vue-datepicker";

const emit = defineEmits(["change"]);

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  label: String,
  // eslint-disable-next-line vue/require-default-prop
  id: String,
  // eslint-disable-next-line vue/require-default-prop
  type: String,
  // eslint-disable-next-line vue/require-default-prop
  name: String,
  // eslint-disable-next-line vue/require-default-prop
  autocomplete: String,
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
  value: Number,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
});

const inputValue = ref(props.value > 0 ? new Date(props.value * 1000) : null);

function onChange() {
  emit("change", {
    value: inputValue.value
      ? Math.floor(inputValue.value.getTime() / 1000)
      : null,
  });
}

const format = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hour = date.getHours();
  const minutes = date.getUTCMinutes();

  return `${day}.${month}.${year} - ${hour}:${minutes}`;
};
</script>
