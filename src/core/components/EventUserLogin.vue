<template>
  <form
    id="event-user-login-form"
    class="p-3 card border-info"
    autocomplete="off"
    @submit.prevent="onRedirectToEvent"
  >
    <h2 class="mb-4">
      {{ $t("view.login.headline.eventIdent") }}
    </h2>
    <div class="mb-3">
      <BaseInput
        id="event-user-login-event-slug"
        :label="$t('view.login.label.eventIdent')"
        :errors="v$.eventSlug.$errors"
        :has-errors="v$.eventSlug.$errors.length > 0"
        @change="({ value }) => (formData.eventSlug = value)"
      />
    </div>
    <button
      id="event-user-login-submit"
      type="submit"
      class="btn btn-secondary btn-block text-white"
    >
      {{ $t("view.login.submitToEvent") }}
    </button>
  </form>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from 'vue-router';
import BaseInput from "@/core/components/form/BaseInput.vue";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";

const router = useRouter();
const formData = reactive({
  eventSlug: "",
});
const rules = {
  eventSlug: { required },
};
const v$ = useVuelidate(rules, formData);

async function onRedirectToEvent() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  router.push(`/event/${formData.eventSlug}`);
}
</script>