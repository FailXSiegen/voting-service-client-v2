<template>
  <div class="input-group mb-3">
    <label v-if="label" :for="id" class="input-group-text">
      {{ label }}
    </label>
    <select
      v-if="videoConferences"
      :id="id"
      v-model="inputValue"
      :name="name"
      :class="[
        'custom-select form-select',
        hasErrors ? 'is-invalid' : null,
        ...classes,
      ]"
      @change="onChange"
    >
      <option value="0" selected="selected">---</option>
      <option
        v-for="videoConference in videoConferences"
        :key="videoConference.id"
        :value="videoConference.id"
      >
        {{ videoConference.title }}
      </option>
    </select>
  </div>
  <div v-if="helpText" class="form-text text-muted">
    {{ helpText }}
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
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useCore } from "@/core/store/core";

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
  helpText: String,
});

const inputValue = ref(props.value);

function onChange() {
  // WICHTIGER FIX: Defensive Programmierung - verhindere null reference errors
  const conferences = videoConferences.value || [];
  const foundConference = conferences.find(({ id }) => inputValue.value === id);
  emit("change", {
    value: foundConference,
  });
}

const coreStore = useCore();

const { organizer } = storeToRefs(coreStore);
const videoConferences = ref(coreStore.getOrganizer?.zoomMeetings ?? []);
// WICHTIGER FIX: Watch changes to organizer in the store - mit null safety
watch(organizer, (newOrganizer) => {
  if (newOrganizer && newOrganizer.zoomMeetings) {
    videoConferences.value = newOrganizer.zoomMeetings;
  } else {
    videoConferences.value = [];
  }
});
</script>
