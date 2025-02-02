<template>
  <PageLayout>
    <template #title>
      {{ event.title }}
    </template>
    <template #subtitle>
      {{
        $t(
          event.active
            ? "view.login.headline.userWelcomeTo"
            : "view.login.headline.inactiveEvent",
        )
      }}
    </template>
    <template #content>
      <div v-if="event.active">
        <form
          class="card card-body event-user-login-form m-auto"
          autocomplete="off"
          @submit.prevent="onSubmit"
        >
          <div class="mb-3">
            <BaseInput
              :label="$t('view.login.label.username')"
              :errors="v$.username?.$errors"
              :has-errors="v$.username?.$errors?.length > 0"
              :value="formData.username"
              :help-text="
                !readOnlyUsername ? $t('view.login.label.usernameHelp') : ''
              "
              :autocomplete="off"
              :readonly="readOnlyUsername"
              :classes="[readOnlyUsername ? 'form-control-plaintext' : '']"
              @change="
                ({ value }) => {
                  formData.username = value;
                }
              "
            />
          </div>
          <div class="mb-3">
            <input
              v-if="event.allowMagicLink && readOnlyUsername"
              :value="formData.password"
              type="hidden"
            />
            <BaseInput
              :label="$t('view.login.label.password')"
              :errors="v$.password?.$errors"
              :has-errors="v$.password?.$errors?.length > 0"
              :value="formData.password"
              type="password"
              autocomplete="one-time-code"
              :help-text="$t('view.login.label.passwordHelp')"
              v-if="!readOnlyUsername"
              @change="
                ({ value }) => {
                  formData.password = value;
                }
              "
            />
          </div>
          <div class="mb-3">
            <BaseInput
              :label="$t('view.login.label.publicName')"
              :errors="v$.publicName?.$errors"
              :has-errors="v$.publicName?.$errors?.length > 0"
              :value="formData.publicName"
              :help-text="$t('view.login.label.publicNameHelp')"
              :autocomplete="off"
              @change="
                ({ value }) => {
                  formData.publicName = value;
                }
              "
            />
          </div>
          <button class="btn btn-primary btn-block float-end">
            {{ $t("view.login.submitToEvent") }}
          </button>
        </form>
      </div>
      <AlertBox
        v-else
        type="info"
        :message="$t('view.login.inactiveEventText')"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/eventUser/components/PageLayout.vue";
import BaseInput from "@/core/components/form/BaseInput.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import { computed, reactive } from "vue";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { loginEventUser } from "@/core/auth/login";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";
import { hashString } from "@/core/util/hashString";
// Data.

const emit = defineEmits(["exit"]);
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
const coreStore = useCore();
const urlParams = new URLSearchParams(window.location.search);

// Set username readonly, if it is set in the url.
const readOnlyUsername = urlParams.get("username") !== null ?? false;
// Form and validation setup.
const formData = reactive({
  username: urlParams.get("username") ?? "",
  password:
    readOnlyUsername && props.event.allowMagicLink
      ? hashString(urlParams.get("username") + props.event.createDatetime)
      : "",
  publicName: urlParams.get("publicname") ?? "",
});
const rules = computed(() => {
  return {
    username: { required },
    password: { required },
    publicName: { required },
  };
});
const v$ = useVuelidate(rules, formData);

// Events.

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  const { username, password, publicName } = formData;

  loginEventUser(username, password, publicName, props.event?.id ?? 0)
    .then(({ token }) => coreStore.loginUser(token))
    .then(() =>
      toast(t("success.login.eventUser", { userName: publicName }), {
        type: "success",
      }),
    )
    .then(() => emit("exit"))
    .catch((error) => {
      handleError(error, { autoClose: false });
    });
}
</script>

<style lang="scss" scoped>
.event-user-login-form {
  max-width: 440px;
}
</style>
