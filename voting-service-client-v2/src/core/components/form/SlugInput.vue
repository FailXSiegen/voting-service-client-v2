<template>
  <label v-if="label" :for="id">
    {{ label }}
  </label>

  <div class="input-group">
    <input
      :id="id"
      v-model="inputValue"
      :name="name"
      :class="['form-control', hasErrors ? 'is-invalid' : null, ...classes]"
      :autocomplete="autocomplete"
      :type="type"
      @keyup="onChange"
    />
    <div class="input-group-text p-0">
      <button class="btn btn-transparent" @click.prevent="onGenerateSlug">
        <i class="bi bi-arrow-clockwise" />
      </button>
    </div>
  </div>
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
</template>

<script setup>
import { ref } from "vue";
import { slugify } from "@/core/services/slugify-service";

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
  value: String,
  // eslint-disable-next-line vue/require-default-prop
  baseValue: String,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
});

const inputValue = ref(props.value);

function onChange() {
  emit("change", { value: inputValue.value });
}

function onGenerateSlug() {
  inputValue.value = slugify(props.baseValue);
  onChange();
}
</script>
