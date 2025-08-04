<template>
  <PageLayout :meta-title="$t('navigation.views.organizerProfile')">
    <template #title>
      {{ $t("navigation.views.organizerProfile") }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div v-if="organizerLoaded">
        <form class="profile-form" @submit.prevent="onSubmit">
          <div class="mb-3">
            <EmailInput
              :label="$t('view.profile.label.email')"
              :errors="v$.email?.$errors"
              :has-errors="v$.email?.$errors.length > 0"
              :value="formData.email"
              @change="
                ({ value }) => {
                  formData.email = value;
                }
              "
            />
          </div>
          <div class="mb-3">
            <BaseInput
              :label="$t('view.profile.label.fullName')"
              :errors="v$.publicName?.$errors"
              :has-errors="v$.publicName?.$errors.length > 0"
              :value="formData.publicName"
              @change="
                ({ value }) => {
                  formData.publicName = value;
                }
              "
            />
          </div>
          <div class="mb-3">
            <BaseInput
              :label="$t('view.profile.label.currentPassword')"
              :errors="v$.currentPassword?.$errors"
              :has-errors="v$.currentPassword?.$errors.length > 0"
              autocomplete="new-password"
              type="password"
              @change="
                ({ value }) => {
                  formData.currentPassword = value;
                }
              "
            />
          </div>
          <div class="card mb-3">
            <div class="card-header">
              <div class="mb-3">
                <CheckboxInput
                  v-model:checked="formData.changePassword"
                  label="Reset password"
                  :errors="v$.changePassword?.$errors"
                  :has-errors="v$.changePassword?.$errors.length > 0"
                  @update="
                    ({ value }) => {
                      formData.changePassword = value;
                    }
                  "
                />
              </div>
            </div>
            <div v-if="formData.changePassword" class="card-body">
              <div class="mb-3">
                <BaseInput
                  :label="$t('view.profile.label.newPassword')"
                  :errors="v$.newPassword?.$errors"
                  :has-errors="v$.newPassword?.$errors.length > 0"
                  autocomplete="new-password"
                  type="password"
                  @change="
                    ({ value }) => {
                      formData.newPassword = value;
                    }
                  "
                />
              </div>
              <div class="mb-3">
                <BaseInput
                  :label="$t('view.profile.label.repeatPassword')"
                  :errors="v$.newPasswordRepeated?.$errors"
                  :has-errors="v$.newPasswordRepeated?.$errors.length > 0"
                  autocomplete="new-password"
                  type="password"
                  @change="
                    ({ value }) => {
                      formData.newPasswordRepeated = value;
                    }
                  "
                />
              </div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block my-3">
            {{ $t("view.profile.label.submit") }}
          </button>
        </form>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
} from "@/router/routes";
import { computed, watch } from "vue";
import { useCore } from "@/core/store/core";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { reactive } from "vue";
import { sameAs } from "@/core/form/validation/same-as";
import BaseInput from "@/core/components/form/BaseInput.vue";
import { storeToRefs } from "pinia";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import EmailInput from "@/core/components/form/EmailInput.vue";
import { validatePassword } from "@/core/auth/validate-password";
import { useMutation } from "@vue/apollo-composable";
import { UPDATE_ORGANIZER } from "@/modules/organizer/graphql/mutation/update-organizer";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";

const coreStore = useCore();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
]);

// Form and validation setup.
const formData = reactive({
  changePassword: false,
  currentPassword: "",
  newPassword: "",
  newPasswordRepeated: "",
  email: coreStore.getOrganizer?.email ?? "",
  publicName: coreStore.getOrganizer?.publicName ?? "",
});
const rules = computed(() => {
  return {
    currentPassword: { required },
    newPassword: formData.changePassword ? { required } : {},
    newPasswordRepeated: formData.changePassword
      ? { required, sameAs: sameAs("newPassword", formData) }
      : {},
    email: { required },
    publicName: { required },
  };
});

const v$ = useVuelidate(rules, formData);

const { organizer } = storeToRefs(coreStore);

// let organizer = reactive({});
const organizerLoaded = computed(() => coreStore.getOrganizer?.id);

// Watch changes to organizer in the store.
watch(organizer, (value) => {
  formData.email = value.email;
  formData.publicName = value.publicName;
  // organizerLoaded.value = true;
});

// Refetch organizer To make sure we really have the current organizer data.
coreStore.queryOrganizer();

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  try {
    // Validate password.
    await validatePassword({
      username: coreStore.getOrganizer.username,
      password: formData.currentPassword,
    });
  } catch (error) {
    // Password is wrong.
    handleError(error);
    return;
  }

  // Update organizer record.
  const { mutate: updateOrganizer } = useMutation(UPDATE_ORGANIZER, {
    variables: {
      input: {
        id: coreStore.getOrganizer?.id,
        publicName: formData.publicName ?? coreStore.getOrganizer?.publicName,
        email: formData.email ?? coreStore.getOrganizer?.email,
        password: formData.changePassword ? formData.newPassword : undefined,
      },
    },
  });
  await updateOrganizer();

  // Show success message.
  toast(t("success.organizer.profile.savedSuccessfully"), { type: "success" });
}
</script>

<style lang="scss" scoped>
.profile-form {
  max-width: 640px;
}
</style>
