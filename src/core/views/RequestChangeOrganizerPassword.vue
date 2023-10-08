<template>
  <CorePageLayout :meta-title="$t('view.changeOrganizerPassword.title')">
    <div class="request-password-change-organizer">
      <div class="container">
        <h2 class="mb-4 text-center d-block">
          {{ $t('view.changeOrganizerPassword.title') }}
        </h2>
        <div class="d-flex justify-content-center">
          <form
            v-if="!emailHasBeenSent"
            class="card border-info w-100 request-password-change-organizer-wrapper"
            @submit.prevent="onSubmit"
          >
            <div class="card-body">
              <div class="form-group">
                <BaseInput
                  :label="$t('view.changeOrganizerPassword.form.username')"
                  :errors="v$.username.$errors"
                  :has-errors="v$.username.$errors.length > 0"
                  @change="({value}) => {formData.username = value;}"
                />
              </div>
              <button
                type="submit"
                class="btn btn-secondary btn-block"
              >
                {{ $t('view.changeOrganizerPassword.form.requestChangePasswordSubmit') }}
              </button>
            </div>
          </form>
          <AlertBox
            v-else
            :message="$t('view.changeOrganizerPassword.emailHasBeenSent')"
          />
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
import AlertBox from "@/core/components/AlertBox.vue";
import {requestPasswordChange} from "@/modules/organizer/requests/request-password-change";

const emailHasBeenSent = ref(false);

// Form and validation setup.
const formData = reactive({
  username: '',
});
const rules = {
  username: {required},
};
const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  try {
    await requestPasswordChange(formData.username);
    emailHasBeenSent.value = true;
  } catch (error) {
    handleError(error);
  }
}
</script>

<style lang="scss" scoped>
.request-password-change-organizer {
  .request-password-change-organizer-wrapper {
    max-width: 400px;
  }
}
</style>