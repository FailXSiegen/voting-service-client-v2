<template>
  <form
    id="event-user-login-form"
    class="p-3 card border-info"
    autocomplete="off"
    @submit.prevent="onLogin"
  >
    <h2 class="mb-4">
      {{ $t('view.login.headline.eventIdent') }}
    </h2>
    <div class="form-group">
      <BaseInput
        id="event-user-login-event-slug"
        :label="$t('view.login.label.eventIdent')"
        :errors="v$.eventSlug.$errors"
        :has-errors="v$.eventSlug.$errors.length > 0"
        @change="({value}) => formData.eventSlug = value"
      />

      <!--      <label for="event-slug">-->
      <!--        {{ $t('view.login.label.eventIdent') }}-->
      <!--      </label>-->
      <!--      <input-->
      <!--        id="event-user-login-event-slug"-->
      <!--        v-model="eventSlug"-->
      <!--        class="form-control"-->
      <!--        type="text"-->
      <!--        required="required"-->
      <!--      >-->
    </div>
    <button
      id="event-user-login-submit"
      type="submit"
      class="btn btn-info btn-block text-white"
    >
      {{ $t('view.login.submitToEvent') }}
    </button>
  </form>
</template>

<script setup>
import {reactive} from "vue";
import BaseInput from '@/core/components/form/BaseInput.vue';
import {required} from "@vuelidate/validators";
import {useVuelidate} from "@vuelidate/core";
import {handleError} from "@/core/error/error-handler";
import {InvalidFormError} from "@/core/error/InvalidFormError";

// Form and validation setup.
const formData = reactive({
  eventSlug: '',
});
const rules = {
  eventSlug: {required},
};
const v$ = useVuelidate(rules, formData);

async function onLogin() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  throw new Error('yet not implemented');
}
</script>
