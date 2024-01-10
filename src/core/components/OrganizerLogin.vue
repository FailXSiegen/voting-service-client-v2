<template>
  <form
    id="organizer-login-form"
    class="card p-3 border-primary"
    @submit.prevent="onLogin"
  >
    <h2 class="mb-4">
      {{ $t("view.login.headline.orgaLogin") }}
    </h2>
    <div class="form-group">
      <BaseInput
        id="organizer-login-username"
        :label="$t('view.login.label.onlyUsername')"
        :errors="v$.username.$errors"
        :has-errors="v$.username.$errors.length > 0"
        @change="
          ({ value }) => {
            formData.username = value;
          }
        "
      />
    </div>
    <div class="form-group">
      <BaseInput
        id="organizer-login-password"
        :label="$t('view.login.label.password')"
        :errors="v$.password.$errors"
        :has-errors="v$.password.$errors.length > 0"
        autocomplete="new-password"
        type="password"
        @change="
          ({ value }) => {
            formData.password = value;
          }
        "
      />
    </div>
    <div class="form-group">
      <button
        id="organizer-login-submit"
        type="submit"
        class="btn btn-primary w-100"
      >
        {{ $t("view.login.submit") }}
      </button>
    </div>
    <small>
      <router-link :to="{ name: forgotPasswordRouteName }">
        {{ $t("view.login.label.lostPassword") }}
      </router-link>
    </small>
  </form>
</template>

<script setup>
import { loginOrganizer } from "@/core/auth/login";
import BaseInput from "@/core/components/form/BaseInput.vue";
import { handleError } from "@/core/error/error-handler";
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { useCore } from "@/core/store/core";
import { useRouter } from "vue-router";
import {
  RouteOrganizerDashboard,
  RouteRequestChangeOrganizerPassword,
} from "@/router/routes";

import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";

const coreStore = useCore();
const forgotPasswordRouteName = RouteRequestChangeOrganizerPassword;

// Form and validation setup.
const formData = reactive({
  username: "",
  password: "",
});
const rules = {
  username: { required },
  password: { required },
};
const v$ = useVuelidate(rules, formData);
const router = useRouter();

async function onLogin() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  loginOrganizer(formData.username, formData.password)
    .then(({ token }) => coreStore.loginUser(token))
    .then(() => router.push({ name: RouteOrganizerDashboard }))
    .then(() => toast(t("success.login.organizer"), { type: "success" }))
    .catch((error) => handleError(error, { autoClose: false }));
}
</script>
