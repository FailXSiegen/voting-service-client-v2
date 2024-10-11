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
          <div class="jumbotron jumbotron-fluid">
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
            class="register__form border p-3 text-left"
            @submit.prevent="onSubmit"
          >
            <!-- Form Fields -->
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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
            <div class="form-group">
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

            <!-- reCAPTCHA -->
            <div id="recaptcha-container" class="g-recaptcha" :data-sitekey="recaptchaSiteKey"></div>
            <button class="btn btn-primary btn-block float-right mt-3" :disabled="!recaptchaVerified">
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
import { reactive, ref, onMounted } from "vue";
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

const submitSuccess = ref(false);
const recaptchaResponse = ref(null);
const recaptchaVerified = ref(false);
const recaptchaSiteKey = "6LcAzPQpAAAAAPoCUtR_DcuHNHi6b6AFi3Y8TpXD";
let recaptchaWidgetId = null;

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

function onCaptchaVerified(response) {
  console.log('Captcha verified:', response); // Debugging output
  recaptchaResponse.value = response;
  recaptchaVerified.value = true;
}

function onCaptchaExpired() {
  console.log('Captcha expired'); // Debugging output
  recaptchaResponse.value = null;
  recaptchaVerified.value = false;
}

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  function tryRenderRecaptcha() {
    if (window.grecaptcha && window.grecaptcha.render) {
      console.log('reCAPTCHA is ready, rendering now');
      window.grecaptcha.ready(() => {
        try {
          recaptchaWidgetId = window.grecaptcha.render('recaptcha-container', {
            sitekey: recaptchaSiteKey,
            callback: onCaptchaVerified,
            'expired-callback': onCaptchaExpired,
          });
          console.log('reCAPTCHA rendered successfully');
        } catch (error) {
          console.error('Error rendering reCAPTCHA:', error);
        }
      });
    } else {
      console.log('reCAPTCHA not ready, retrying in 100ms');
      setTimeout(tryRenderRecaptcha, 100);
    }
  }

  script.onload = () => {
    console.log('reCAPTCHA script loaded, attempting to render');
    tryRenderRecaptcha();
  };

  script.onerror = (error) => {
    console.error('Failed to load reCAPTCHA script:', error);
  };
});

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
      publicOrganisation: formData.publicOrganisation
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
