<template>
  <div class="multiple-event-user-new">
    <form @submit.prevent="onSubmit">
      <div class="mb-3">
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
      <div v-if="formData.allowToVote" class="mb-3">
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
      <div class="mb-3">
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
      <div class="mb-3">
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

      <!-- Progress Feedback -->
      <div v-if="isProcessing" class="progress-feedback mt-3">
        <div class="progress">
          <div
            class="progress-bar"
            role="progressbar"
            :style="{ width: `${(progress.current / progress.total) * 100}%` }"
            :aria-valuenow="progress.current"
            :aria-valuemin="0"
            :aria-valuemax="progress.total"
          >
            {{ progress.current }} / {{ progress.total }}
          </div>
        </div>
        <small class="text-muted">
          {{ $t("view.event.create.labels.eventUser.processing") }}
          <span v-if="progress.current > 0 && progress.total > 0">
            ({{ Math.round((progress.current / progress.total) * 100) }}%)
          </span>
        </small>
      </div>

      <button class="btn btn-primary mt-5 mb-3" :disabled="isProcessing">
        <i
          :class="[
            isProcessing ? 'bi-hourglass-split' : 'bi-play',
            'bi--2xl align-middle',
          ]"
        />
        <span class="align-middle">
          {{
            $t(
              isProcessing
                ? "view.event.create.labels.eventUser.processing"
                : "view.event.create.labels.eventUser.submit",
            )
          }}
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

defineProps({
  isProcessing: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Object,
    default: () => ({
      current: 0,
      total: 0,
    }),
  },
});

const emit = defineEmits(["submit"]);
const usernamesText = ref("");

// Form data setup
const formData = reactive({
  allowToVote: false,
  tokenBasedLogin: false,
  voteAmount: 0,
  usernames: [],
});

// Validation rules
const rules = computed(() => {
  return {
    usernames: { required },
    voteAmount: {
      requiredIf: requiredIf(formData.allowToVote),
    },
  };
});

const v$ = useVuelidate(rules, formData);

// Parse and validate usernames/emails from textarea
function parseUsernamesText() {
  const usernames = usernamesText.value?.split("\n") ?? [];
  try {
    // Validate for empty lines and spaces
    usernames.forEach((username, index) => {
      if (username === "" || username.trim().indexOf(" ") >= 0) {
        throw index;
      }
    });

    // Validate email format if tokenBasedLogin is true
    if (formData.tokenBasedLogin) {
      usernames.forEach((email, index) => {
        if (!isValidEmail(email)) {
          throw index;
        }
      });
    }

    formData.usernames = usernames.map((username) => username.trim());
    return true;
  } catch (index) {
    const numberOfRow = index + 1;
    handleError(
      new NetworkError(
        `Die Benutzerliste enthält fehlerhafte Eintragungen oder Leerzeilen in Zeile ${numberOfRow}`,
      ),
    );
    return false;
  }
}

// Event handlers
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

  emit("submit", {
    usernames: formData.usernames,
    allowToVote: formData.allowToVote,
    voteAmount: formData.voteAmount,
    tokenBasedLogin: formData.tokenBasedLogin,
  });
}
</script>

<style lang="scss" scoped>
.multiple-event-user-new {
  max-width: 840px;

  .progress-feedback {
    .progress {
      height: 20px;
      background-color: #e9ecef;
      border-radius: 0.25rem;

      .progress-bar {
        min-width: 2em;
        background-color: #0d6efd;
        color: white;
        text-align: center;
        transition: width 0.3s ease;
      }
    }

    .text-muted {
      display: block;
      margin-top: 0.5rem;
      text-align: center;
    }
  }

  .btn {
    min-width: 150px;

    i {
      margin-right: 0.5rem;
    }
  }
}
</style>
