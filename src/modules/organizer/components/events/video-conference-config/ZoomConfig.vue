<template>
  <div v-if="resolvedConfig">
    <div class="mb-3">
      <BaseInput
        :label="
          $t('view.event.create.labels.videoConferenceConfig.zoom.meetingId')
        "
        :value="appliedConfig.meetingId"
        @change="onChangeMeetingId"
      />
    </div>
    <div class="mb-3">
      <BaseInput
        :label="
          $t('view.event.create.labels.videoConferenceConfig.zoom.password')
        "
        :value="appliedConfig.password"
        @change="onChangePassword"
      />
    </div>
  </div>
</template>

<script setup>
import BaseInput from "@/core/components/form/BaseInput.vue";
import { reactive } from "vue";

const props = defineProps({
  recordId: {
    type: String,
    required: true,
  },
  config: {
    type: String,
    required: true,
    default: "{}",
  },
});
const emit = defineEmits(["change"]);

const resolvedConfig = JSON.parse(props.config);
const appliedConfig = reactive({
  meetingId: resolvedConfig?.credentials?.meetingId ?? "",
  password: resolvedConfig?.credentials?.password ?? "",
});

function onChangeMeetingId(value) {
  appliedConfig.meetingId = value.value;
  emit("change", {
    id: parseInt(props.recordId, 10),
    type: 1,
    credentials: {
      meetingId: appliedConfig.meetingId,
      password: appliedConfig.password,
    },
  });
}

function onChangePassword(value) {
  appliedConfig.password = value.value;
  emit("change", {
    id: parseInt(props.recordId, 10),
    type: 1,
    credentials: {
      meetingId: appliedConfig.meetingId,
      password: appliedConfig.password,
    },
  });
}
</script>
