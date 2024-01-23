<template>
  <div class="multiple-event-user-new">
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <CheckboxInput
          id="allowToVote"
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
          id="voteAmount"
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
        <CheckboxInput
          id="tokenBasedLogin"
          v-model:checked="formData.tokenBasedLogin"
          :label="$t('view.event.create.labels.eventUser.tokenBasedLogin')"
          :help-text="
            $t('view.event.create.labels.eventUser.tokenBasedLoginHelp')
          "
          :errors="v$.tokenBasedLogin?.$errors"
          :has-errors="v$.tokenBasedLogin?.$errors?.length > 0"
          @update="
            ({ value }) => {
              formData.tokenBasedLogin = value;
            }
          "
        />
      </div>
      <div class="form-group">
        <TextInput
          id="eventMultipleUser"
          :label="
            $t(
              formData.tokenBasedLogin
                ? 'view.event.create.labels.eventMultipleUser.emails'
                : 'view.event.create.labels.eventMultipleUser.usernames',
            )
          "
          :help-text="
            $t(
              formData.tokenBasedLogin
                ? 'view.event.create.labels.eventMultipleUser.emailsHint'
                : 'view.event.create.labels.eventMultipleUser.usernamesHint',
            )
          "
          :errors="v$.usernames?.$errors"
          :has-errors="v$.usernames?.$errors?.length > 0"
          :rows="20"
          :cols="5"
          @change="onChangeUsernamesText"
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
import { computed, reactive, ref } from "vue";
import { required, requiredIf } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import BaseInput from "@/core/components/form/BaseInput.vue";
import TextInput from "@/core/components/form/TextInput.vue";
import { NetworkError } from "@/core/error/NetworkError";
import { isValidEmail } from "@/core/util/email-validator";
const emit = defineEmits(["submit"]);
const usernamesText = ref("");
// Form and validation setup.
const formData = reactive({
  allowToVote: false,
  tokenBasedLogin: false,
  voteAmount: 0,
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

function parseUsernamesText() {
  const usernames = usernamesText.value?.split("\n") ?? [];
  try {
    usernames.forEach((username, index) => {
      if (username === "" || username.trim().indexOf(" ") >= 0) {
        throw index;
      }
    });
    // Validate each line for email format, if tokenBasedLogin = true
    if (formData.tokenBasedLogin) {
      usernames.forEach((email, index) => {
        if (!isValidEmail(email)) {
          throw index;
        }
      });
    }
    formData.usernames = usernames;
    return true;
  } catch (index) {
    const numberOfRow = index + 1;
    handleError(
      new NetworkError(
        "Die Benutzerliste enthält fehlerhafte Eintragungen oder Leerzeilen in Zeile " +
          numberOfRow,
      ),
    );
    return false;
  }
}

function onChangeUsernamesText({ value }) {
  usernamesText.value = value;
}

async function onSubmit() {
  const parsedSuccessfully = parseUsernamesText();
  const result = await v$.value.$validate();
  if (!result || !parsedSuccessfully) {
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
