<template>
  <div
    class="modal fade show d-block"
    tabindex="-1"
    role="dialog"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ $t("view.organizers.create.title") }}
          </h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="onSubmit">
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
            </div>
            <div class="mb-3">
              <CheckboxInput
                v-model:checked="formData.skipEmailVerification"
                :label="$t('view.organizers.create.skipEmailVerification')"
                @update="
                  ({ value }) => {
                    formData.skipEmailVerification = value;
                  }
                "
              />
            </div>
            <div class="mb-3">
              <CheckboxInput
                v-model:checked="formData.autoVerify"
                :label="$t('view.organizers.create.autoVerify')"
                @update="
                  ({ value }) => {
                    formData.autoVerify = value;
                  }
                "
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            {{ $t("general.cancel") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="onSubmit"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
            {{ $t("view.organizers.create.submit") }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
</template>

<script setup>
import { reactive, ref, defineEmits } from "vue";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { useMutation } from "@vue/apollo-composable";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import BaseInput from "@/core/components/form/BaseInput.vue";
import EmailInput from "@/core/components/form/EmailInput.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import { CREATE_ORGANIZER } from "@/modules/organizer/graphql/mutation/create-organizer";

const emit = defineEmits(["close", "created"]);
const isSubmitting = ref(false);

const formData = reactive({
  username: "",
  email: "",
  password: "",
  publicName: "",
  publicOrganisation: "",
  skipEmailVerification: true,
  autoVerify: true,
});

const rules = {
  username: { required },
  email: { required },
  password: { required },
  publicName: { required },
  publicOrganisation: { required },
};

const v$ = useVuelidate(rules, formData);

const { mutate: createOrganizer } = useMutation(CREATE_ORGANIZER);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  isSubmitting.value = true;

  try {
    await createOrganizer({
      input: {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        publicName: formData.publicName,
        publicOrganisation: formData.publicOrganisation,
        confirmedEmail: formData.skipEmailVerification,
        verified: formData.autoVerify,
      },
    });

    emit("created");
  } catch (error) {
    handleError(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>