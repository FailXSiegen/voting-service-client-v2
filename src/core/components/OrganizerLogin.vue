<template>
  <button
    class="btn btn-primary"
    @click.prevent="test"
  >
    TEST
  </button>
  <form
    id="organizer-login-form"
    class="card p-3 border-primary"
    @submit.prevent="onLogin"
  >
    <h2 class=" mb-4">
      {{ $t('view.login.headline.orgaLogin') }}
    </h2>
    <div class="form-group">
      <BaseInput
        id="organizer-login-username"
        :label="$t('view.login.label.onlyUsername')"
        :errors="v$.username.$errors"
        :has-errors="v$.username.$errors.length > 0"
        @change="({value}) => {formData.username = value;}"
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
        @change="({value}) => {formData.password = value;}"
      />
    </div>
    <div class="form-group">
      <button
        id="organizer-login-submit"
        type="submit"
        class="btn btn-primary w-100"
      >
        {{ $t('view.login.submit') }}
      </button>
    </div>
    <small>
      <a href="/passwort-vergessen">
        {{ $t('view.login.label.lostPassword') }}
      </a>
    </small>
  </form>
</template>

<script setup>
import {loginOrganizer} from "@/core/auth/login";
import BaseInput from '@/core/components/form/BaseInput.vue';
import {handleError} from "@/core/error/error-handler";
import {reactive, computed} from "vue";
import {useVuelidate} from '@vuelidate/core';
import {required} from '@vuelidate/validators';
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {useCore} from "@/core/store/core";

import {apolloClient} from "@/apollo-client";
import {useQuery} from "@vue/apollo-composable";
import {gql} from "graphql-tag";
import {provideApolloClient} from "@vue/apollo-composable";

const coreStore = useCore();

// Form and validation setup.
const formData = reactive({
  username: '',
  password: '',
});
const rules = {
  username: {required},
  password: {required},
};
const v$ = useVuelidate(rules, formData);

function test() {
  apolloClient.cache.reset();
  const {value} = getExpiredEvents();
  console.log(value, 'getExpiredEvents');
}

async function onLogin() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  loginOrganizer(formData.username, formData.password)
      .then((jwtResponse) => coreStore.loginUser(jwtResponse)).then(() => getExpiredEvents()).then(({value}) => console.log(value, 'getExpiredEvents'))
      .catch(error => handleError(error, {autoClose: false}));
}

function getExpiredEvents() {
  apolloClient.cache.reset();

  provideApolloClient(apolloClient);
  const EVENT_USER_BY_ID = gql`
  query expiredEvents($organizerId: ID!) {
    expiredEvents(organizerId: $organizerId) {
      id
      createDatetime
      modifiedDatetime
      title
      slug
      description
      scheduledDatetime
      lobbyOpen
      active
      __typename
    }
  }
  `;
  const userQueryResult = useQuery(EVENT_USER_BY_ID, {organizerId: 1});
  return computed(() => userQueryResult.result.value?.expiredEvents ?? []);
}

</script>
