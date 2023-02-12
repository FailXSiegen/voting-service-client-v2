<template>
  <form
    id="event-form"
    class="login__event--form p-3 card border-info"
    autocomplete="off"
    @submit.prevent="onLogin"
  >
    <h2 class="login__headline mb-4">
      {{ $t('view.login.headline.eventIdent') }}
    </h2>
    <div class="login__form-group form-group">
      <label
        class="login__event--label"
        for="eventSlug"
      >
        {{ $t('view.login.label.eventIdent') }}
      </label>
      <input
        id="eventSlug"
        v-model="eventSlug"
        class="login__form-control form-control"
        type="text"
        required="required"
      >
    </div>
    <button
      type="submit"
      class="login__button btn btn-info btn-block text-white"
    >
      {{ $t('view.login.submitToEvent') }}
    </button>
  </form>
</template>

<script setup>
const eventSlug = '';

function onLogin() {
  throw new Error('yet not implemented');
}
</script>
