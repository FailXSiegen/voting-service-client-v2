<template>
  <CorePageLayout>
    <h1 class="login__headline text-center">
      {{ $t("view.login.headline.title") }}
    </h1>
    <h2 class="login__subheadline mb-4 text-center subheader">
      {{ $t("view.login.headline.subtitle") }}
    </h2>
    <div
      v-if="event"
      class="d-flex flex-column align-items-center h-100 justify-content-around mt-5 p-3 card activate-auth-token-page mb-5"
    >
      <h3
        class="text-center mb-4"
        v-html="
          $t('view.activateAuthToken.subTitle', { eventTitle: event.title })
        "
      ></h3>
      <p
        class="description mb-4"
        v-html="$t('view.activateAuthToken.description')"
      ></p>

      <form class="card p-3 border-primary" @submit.prevent="onSubmit">
        <div class="mb-3">
          <BaseInput
            :label="$t('view.event.create.labels.eventUser.username')"
            :errors="v$.username?.$errors"
            :has-errors="v$.username?.$errors?.length > 0"
            :value="formData.username"
            @change="
              ({ value }) => {
                formData.username = value;
              }
            "
          />
        </div>
        <div class="mb-3">
          <BaseInput
            :label="$t('view.event.create.labels.eventUser.publicName')"
            :errors="v$.publicName?.$errors"
            :has-errors="v$.publicName?.$errors?.length > 0"
            :value="formData.publicName"
            :disabled="event?.publicnameReadonly === true || event?.publicnameReadonly === 1"
            @change="
              ({ value }) => {
                formData.publicName = value;
              }
            "
          />
        </div>
        <button class="btn btn-primary btn-lg" type="submit">
          {{ $t("view.activateAuthToken.activateButtonText") }}
        </button>
      </form>
    </div>
  </CorePageLayout>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import { fetchEventById } from "@/modules/eventUser/requests/fetch-event-by-id.js";
import { activateEventUserAuthToken } from "@/modules/eventUser/requests/activate-event-user-auth-token.js";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import BaseInput from "@/core/components/form/BaseInput.vue";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { RouteEventUserFrame } from "@/router/routes";

const route = useRoute();
const router = useRouter();
const eventId = route.params.eventId;
const token = route.params.token;
const event = ref(null);

// Check if publicName is passed as query parameter
const publicNameFromQuery = route.query.publicname || route.query.publicName || "";

// Ftech the related event.
fetchEventById(eventId).then((response) => {
  event.value = response;
  // If publicName is readonly and provided via query, set it
  if ((response?.publicnameReadonly === true || response?.publicnameReadonly === 1) && publicNameFromQuery) {
    formData.publicName = publicNameFromQuery;
  }
});

// Form and validation setup.
const formData = reactive({
  username: "",
  publicName: publicNameFromQuery || "",
});
const rules = computed(() => {
  return {
    username: { required },
    publicName: { required },
  };
});
const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  activateEventUserAuthToken(token, formData.username, formData.publicName)
    .then((success) => {
      if (success) {
        toast(t("success.login.activateEventUserAuthToken"), {
          type: "success",
        });
        return router.push({
          name: RouteEventUserFrame,
          params: { eventSlug: event.value.slug },
        });
      }
    })
    .then(() => window.location.reload())
    .catch((error) => handleError(error));
}
</script>

<style lang="scss" scoped>
.activate-auth-token-page {
  max-width: 600px;
  display: block;
  margin: auto;
}
</style>
