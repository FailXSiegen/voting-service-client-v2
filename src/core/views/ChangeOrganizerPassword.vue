<template>
  <CorePageLayout :meta-title="$t('view.changePassword.title')">
    <div class="password-change-organizer">
      <div class="container">
        <h2 class="mb-4 text-center d-block">
          {{ $t('view.changePassword.title') }}
        </h2>
        <div class="d-flex justify-content-center">
          <form
            v-if="!passwordChangedSuccessfully"
            class="card border-info w-100 password-change-organizer-wrapper"
            @submit.prevent="onSubmit"
          >
            <div class="card-body">
              <div class="form-group">
                <BaseInput
                  :label="$t('view.profile.label.newPassword')"
                  :errors="v$.password.$errors"
                  :has-errors="v$.password.$errors.length > 0"
                  autocomplete="new-password"
                  type="password"
                  @change="({value}) => {formData.password = value;}"
                />
              </div>
              <div class="form-group">
                <BaseInput
                  :label="$t('view.profile.label.repeatPassword')"
                  :errors="v$.passwordRepeated.$errors"
                  :has-errors="v$.passwordRepeated.$errors.length > 0"
                  autocomplete="new-password"
                  type="password"
                  @change="({value}) => {formData.passwordRepeated = value;}"
                />
              </div>
              <button
                type="submit"
                class="btn btn-info btn-block"
              >
                {{ $t('view.changePassword.form.changePasswordSubmit') }}
              </button>
            </div>
          </form>
          <div
            v-else
            class="d-block"
          >
            <AlertBox
              :message="$t('view.changePassword.form.passwordChangedSuccessfully')"
            />
            <router-link
              :to="{name: RouteMainLogin}"
              class="btn btn-primary d-block w-100"
            >
              {{ $t('view.changePassword.backToStartpage') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
import BaseInput from "@/core/components/form/BaseInput.vue";
import {reactive, ref} from "vue";
import {required} from "@vuelidate/validators";
import {useVuelidate} from "@vuelidate/core";
import {handleError} from "@/core/error/error-handler";
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {useRoute} from 'vue-router';
import {changePassword} from "@/modules/organizer/requests/change-password";
import AlertBox from "@/core/components/AlertBox.vue";
import {RouteMainLogin} from "@/router/routes";
import {sameAs} from "@/core/form/validation/same-as";

// Access the hash of the url.
const route = useRoute();
const hash = route.params?.hash ?? null;
if (!hash) {
  throw new Error("Missing required parameter hash!");
}

const passwordChangedSuccessfully = ref(false);

// Form and validation setup.
const formData = reactive({
  password: '',
  passwordRepeated: '',
});
const rules = {
  password: {
    required,
  },
  passwordRepeated: {
    required,
    sameAs: sameAs('password', formData)
  },
};
const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  try {
    await changePassword(formData.password, formData.passwordRepeated, hash);
    passwordChangedSuccessfully.value = true;
  } catch (error) {
    handleError(error);
  }
}
</script>

<style lang="scss" scoped>
.password-change-organizer {
  .password-change-organizer-wrapper {
    max-width: 400px;
  }
}
</style>
