<template>
  <form
    id="organizer-form"
    class="login__form login__form--organizer card p-3 border-primary"
    @submit.prevent="onLogin"
  >
    <h2 class="login__form--headline mb-4">
      {{ $t('view.login.headline.orgaLogin') }}
    </h2>
    <div class="login__form-group form-group">
      <label
        class="login__label"
        for="username"
      >{{ $t('view.organizers.username') }}</label>
      <input
        id="username"
        v-model="user.username"
        name="username"
        class="login__form-control form-control"
        required="required"
      >
    </div>
    <div class="login__form-group form-group">
      <label
        class="login__label"
        for="password"
      >
        {{ $t('view.login.label.password') }}
      </label>
      <input
        id="password"
        v-model="user.password"
        class="login__form-control form-control"
        type="password"
        name="password"
        required="required"
        autocomplete="new-password"
      >
    </div>
    <div class="login__form-group form-group">
      <button class="login__button btn btn-primary w-100">
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
const user = {
  password: ''
}

function onLogin() {
  throw new Error('yet not implemented')
}
</script>