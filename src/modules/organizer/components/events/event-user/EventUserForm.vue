<template>
  <div class="mutate-event-user">
    <form @submit.prevent="onSubmit">
      <div class="mb-3">
        <CheckboxInput
          v-model:checked="formData.verified"
          :label="$t('view.event.create.labels.eventUser.verified')"
          :errors="v$.verified?.$errors"
          :has-errors="v$.verified?.$errors?.length > 0"
          @update="
            ({ value }) => {
              formData.verified = value;
            }
          "
        />
      </div>
      <div class="mb-3">
        <CheckboxInput
          v-model:checked="formData.allowToVote"
          :label="$t('view.event.create.labels.eventUser.allowToVote')"
          :errors="v$.allowToVote?.$errors"
          :has-errors="v$.allowToVote?.$errors?.length > 0"
          @update="
            ({ value }) => {
              formData.allowToVote = value;
            }
          "
        />
      </div>
      <div class="mb-3">
        <BaseInput
          :label="$t('view.event.create.labels.eventUser.username')"
          :errors="v$.username?.$errors"
          :has-errors="v$.username?.$errors?.length > 0"
          :value="formData.username"
          @change="
            ({ value }) => {
              formData.username = value;
            }
          "
        />
      </div>
      <div class="mb-3">
        <BaseInput
          :label="$t('view.event.create.labels.eventUser.publicName')"
          :errors="v$.publicName?.$errors"
          :has-errors="v$.publicName?.$errors?.length > 0"
          :value="formData.publicName"
          @change="
            ({ value }) => {
              formData.publicName = value;
            }
          "
        />
      </div>
      <div v-if="formData.allowToVote" class="mb-3">
        <BaseInput
          :label="$t('view.event.create.labels.eventUser.voteAmount')"
          :errors="v$.voteAmount?.$errors"
          :has-errors="v$.voteAmount?.$errors?.length > 0"
          :value="formData.voteAmount?.toString()"
          type="number"
          @change="
            ({ value }) => {
              formData.voteAmount = value;
            }
          "
        />
      </div>
      <button class="btn btn-primary mt-5 mb-3">
        <i class="bi-play bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t("view.event.create.labels.eventUser.submit") }}
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import { required, requiredIf } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import BaseInput from "@/core/components/form/BaseInput.vue";

const emit = defineEmits(["submit"]);
const props = defineProps({
  prefillData: {
    type: Object,
    required: false,
    default: null,
  },
});

// Form and validation setup.
const formData = reactive({
  verified: props.prefillData?.verified ?? false,
  allowToVote: props.prefillData?.allowToVote ?? false,
  username: props.prefillData?.username ?? "",
  publicName: props.prefillData?.publicName ?? "",
  voteAmount: props.prefillData?.voteAmount ?? 1,
});
const rules = computed(() => {
  return {
    username: { required },
    publicName: { required },
    voteAmount: {
      requiredIf: requiredIf(formData.allowToVote),
    },
  };
});
const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  // Reset vote amount if not allowed to vote.
  if (!formData.allowToVote) {
    formData.voteAmount = 0;
  }

  emit("submit", formData);
}
</script>

<style lang="scss" scoped>
.mutate-event-user {
  max-width: 840px;
}
</style>
