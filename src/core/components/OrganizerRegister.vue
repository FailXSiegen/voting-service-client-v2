<template>
  <div class="login__organizer card mt-3 p-3">
    <h3 class="login__form--headline mb-4">
      {{ $t('view.login.headline.orgaRegister') }}
    </h3>
    <router-link
      to="/register"
      class="login__button btn btn-secondary btn-block w-100 h-100"
    >
      {{ $t('view.login.registerAsOrganizer') }}
    </router-link>
    <span class="w-100 d-inline-block text-center">
      <small><b>{{ $t('view.login.registerAsOrganizerInfo') }}</b></small>
    </span>
  </div>
</template>