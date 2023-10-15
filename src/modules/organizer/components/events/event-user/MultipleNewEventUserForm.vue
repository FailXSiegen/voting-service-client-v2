<template>
  <div class="multiple-event-user-new">
    <form @submit.prevent="onSubmit">
      <div class="form-group">
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
      <div v-if="formData.allowToVote" class="form-group">
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
      <div class="form-group">
        <TextInput
          :label="$t('view.event.create.labels.eventMultipleUser.usernames')"
          :help-text="
            $t('view.event.create.labels.eventMultipleUser.usernamesHint')
          "
          :errors="v$.usernames?.$errors"
          :has-errors="v$.usernames?.$errors?.length > 0"
          :rows="20"
          :cols="5"
          @change="onChangeText"
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
import TextInput from "@/core/components/form/TextInput.vue";
import { NetworkError } from "@/core/error/NetworkError";

const emit = defineEmits(["submit"]);

// Form and validation setup.
const formData = reactive({
  allowToVote: false,
  voteAmount: 1,
  usernames: [],
});
const rules = computed(() => {
  return {
    usernames: { required },
    voteAmount: {
      requiredIf: requiredIf(formData.allowToVote),
    },
  };
});
const v$ = useVuelidate(rules, formData);

function onChangeText({ value }) {
  const usernames = value?.split("\n") ?? [];
  try {
    usernames.forEach((username, index) => {
      if (username === "" || username.trim().indexOf(" ") >= 0) {
        throw index;
      }
    });
    formData.usernames = usernames;
  } catch (index) {
    const numberOfRow = index + 1;
    handleError(
      new NetworkError(
        "Die Benutzerliste enthält fehlerhafte Eintragungen oder Leerzeilen in Zeile " +
          numberOfRow,
      ),
    );
  }
}

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  emit("submit", formData);
}
</script>

<style lang="scss" scoped>
.multiple-event-user-new {
  max-width: 840px;
}
</style>
