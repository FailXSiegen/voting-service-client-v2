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
      :class="['custom-select form-select', hasErrors ? 'is-invalid' : null, ...classes]"
      @change="onChange"
    >
      <option value="0" selected="selected">---</option>
      <option
        v-for="videoConference in videoConferences"
        :key="videoConference.compositeId"
        :value="videoConference.compositeId"
      >
        {{ videoConference.title }}
      </option>
    </select>
  </div>
  <div v-if="helpText" class="form-text text-muted">
    {{ helpText }}
  </div>
  <span v-for="error in errors" :key="error.uid" class="form-field-error text-danger">
    {{ $t('error.formValidation.' + error.$validator) }}<br />
  </span>
</template>

<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCore } from '@/core/store/core';

const emit = defineEmits(['change']);

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
  selectedTypename: String,
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
});

function getAllVideoConferences(org) {
  const zoom = (org?.zoomMeetings ?? []).map((m) => ({
    ...m,
    __typename: 'ZoomMeeting',
    compositeId: `zoom-${m.id}`,
  }));
  const jitsi = (org?.jitsiMeetings ?? []).map((m) => ({
    ...m,
    __typename: 'JitsiMeeting',
    compositeId: `jitsi-${m.id}`,
  }));
  return [...zoom, ...jitsi];
}

const coreStore = useCore();
const { organizer } = storeToRefs(coreStore);
const videoConferences = ref(getAllVideoConferences(coreStore.getOrganizer));

// Resolve initial value to compositeId
function resolveInitialValue() {
  if (!props.value) return '0';
  const prefix = props.selectedTypename === 'JitsiMeeting' ? 'jitsi' : 'zoom';
  return `${prefix}-${props.value}`;
}

const inputValue = ref(resolveInitialValue());

watch(organizer, (newOrganizer) => {
  videoConferences.value = getAllVideoConferences(newOrganizer);
});

function onChange() {
  if (inputValue.value === '0') {
    emit('change', { value: undefined });
    return;
  }
  const conferences = videoConferences.value || [];
  const foundConference = conferences.find((c) => c.compositeId === inputValue.value);
  emit('change', {
    value: foundConference,
  });
}
</script>
