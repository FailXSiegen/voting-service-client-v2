<template>
  <CorePageLayout :meta-title="$t('view.register.headline')">
    <div class="register-organizer">
      <div class="align-items-center justify-content-center">
        <div class="register-organizer-wrapper text-center m-auto">
          <h1 class="register-organizer-headline">
            {{ $t("view.register.headline") }}
          </h1>
          <p class="register-organizer-subheadline">
            {{ $t("view.register.subheadline") }}
          </p>
          <div class="p-5 mb-4 bg-body-tertiary rounded-3">
            <p
              class="register__description"
              v-html="$t('view.register.description')"
            />
          </div>
          <AlertBox
            v-if="submitSuccess"
            :message="$t('view.register.success')"
          />
          <form
            v-else
            id="register-form"
            class="register__form border p-3 text-start"
            @submit.prevent="onSubmit"
          >
            <!-- Form Fields -->
            <div class="mb-3">
              <BaseInput
                :label="$t('view.register.label.username')"
                :errors="v$.username.$errors"
                :has-errors="v$.username.$errors.length > 0"
                @change="
                  ({ value }) => {
                    formData.username = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <EmailInput
                :label="$t('view.register.label.email')"
                :errors="v$.email.$errors"
                :has-errors="v$.email.$errors.length > 0"
                @change="
                  ({ value }) => {
                    formData.email = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <BaseInput
                :label="$t('view.register.label.password')"
                :errors="v$.password.$errors"
                :has-errors="v$.password.$errors.length > 0"
                type="password"
                @change="
                  ({ value }) => {
                    formData.password = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <BaseInput
                :label="$t('view.register.label.repeatPassword')"
                :errors="v$.passwordRepeated.$errors"
                :has-errors="v$.passwordRepeated.$errors.length > 0"
                type="password"
                @change="
                  ({ value }) => {
                    formData.passwordRepeated = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <BaseInput
                :label="$t('view.register.label.publicName')"
                :errors="v$.publicName.$errors"
                :has-errors="v$.publicName.$errors.length > 0"
                @change="
                  ({ value }) => {
                    formData.publicName = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <BaseInput
                :label="$t('view.register.label.publicOrganisation')"
                :errors="v$.publicOrganisation.$errors"
                :has-errors="v$.publicOrganisation.$errors.length > 0"
                @change="
                  ({ value }) => {
                    formData.publicOrganisation = value;
                  }
                "
              />
              <small id="public-organisation-hint" class="form-text text-muted">
                {{ $t("view.register.label.publicOrganisationHint") }}
              </small>
            </div>
            <div class="mb-3">
              <CheckboxInput
                v-model:checked="formData.dataProtectionAccepted"
                :label="$t('view.register.label.dataProtection')"
                :errors="v$.dataProtectionAccepted.$errors"
                :has-errors="v$.dataProtectionAccepted.$errors.length > 0"
                @update="
                  ({ value }) => {
                    formData.dataProtectionAccepted = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <CheckboxInput
                v-model:checked="formData.isBetaAccepted"
                :label="$t('view.register.label.beta')"
                :errors="v$.isBetaAccepted.$errors"
                :has-errors="v$.isBetaAccepted.$errors.length > 0"
                @update="
                  ({ value }) => {
                    formData.isBetaAccepted = value;
                  }
                "
              />
            </div>
            <GoogleRecaptcha
              @verified="recaptchaVerified = true"
              @expired="recaptchaVerified = false"
            />
            <button
              class="btn btn-primary btn-block float-end mt-3"
              :disabled="!recaptchaVerified"
            >
              {{ $t("view.register.submit") }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import { reactive, ref } from "vue";
import { required, sameAs as equal } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { create } from "@/modules/organizer/requests/create";
import { sameAs } from "@/core/form/validation/same-as";
import BaseInput from "@/core/components/form/BaseInput.vue";
import EmailInput from "@/core/components/form/EmailInput.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import GoogleRecaptcha from "@/core/components/form/GoogleRecaptcha.vue";

const submitSuccess = ref(false);
const recaptchaVerified = ref(false);

// Form and validation setup.
const formData = reactive({
  username: "",
  email: "",
  password: "",
  passwordRepeated: "",
  publicName: "",
  publicOrganisation: "",
  dataProtectionAccepted: false,
  isBetaAccepted: true,
});

const rules = {
  username: { required },
  email: { required },
  password: { required },
  passwordRepeated: {
    required,
    sameAs: sameAs("password", formData),
  },
  publicName: { required },
  publicOrganisation: { required },
  dataProtectionAccepted: { required, checked: equal(true) },
  isBetaAccepted: { required, checked: equal(true) },
};

const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result || !recaptchaVerified.value) {
    handleError(new InvalidFormError());
    return;
  }
  try {
    await create({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      publicName: formData.publicName,
      publicOrganisation: formData.publicOrganisation,
    });
    submitSuccess.value = true;
  } catch (error) {
    handleError(error);
  }
}
</script>

<style lang="scss" scoped>
.register-organizer-wrapper {
  max-width: 760px;
}
</style>
