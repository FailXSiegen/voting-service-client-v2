<template>
  <div v-if="resolvedConfig">
    <div class="mb-3">
      <BaseInput
        :label="$t('view.event.create.labels.videoConferenceConfig.jitsi.roomName')"
        :value="appliedConfig.roomName"
        @change="onChangeRoomName"
      />
    </div>
  </div>
</template>

<script setup>
import BaseInput from '@/core/components/form/BaseInput.vue';
import { reactive } from 'vue';

const props = defineProps({
  recordId: {
    type: String,
    required: true,
  },
  config: {
    type: String,
    required: true,
    default: '{}',
  },
});
const emit = defineEmits(['change']);

const resolvedConfig = JSON.parse(props.config);
const appliedConfig = reactive({
  roomName: resolvedConfig?.credentials?.roomName ?? '',
});

function onChangeRoomName(value) {
  appliedConfig.roomName = value.value;
  emit('change', {
    id: parseInt(props.recordId, 10),
    type: 2,
    credentials: {
      roomName: appliedConfig.roomName,
    },
  });
}
</script>
