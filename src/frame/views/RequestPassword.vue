<template>
  <div class="request-password container-fluid min-vh-100">
    <div class="container py-5">
      <form
        id="request-password-form"
        class="p-3 border border-info"
        v-if="!submitSuccess"
        @submit.prevent="requestForgotPasswordLink"
        autocomplete="off"
      >
        <h2 class="mb-4">
          Passwort vergessen
        </h2>
        <div class="form-group">
          <label class="label" for="email">
            Benutzernamen eingeben*
          </label>
          <input
            id="username"
            class="form-control"
            v-model="username"
            type="text"
            required="required"
          />
        </div>
        <button type="submit" class="btn btn-info btn-block">
          Passwort vergessen-Link anfordern
        </button>
      </form>
      <div v-if="submitSuccess" class="alert alert-success">
        <h2>E-Mail ist versendet</h2>
      </div>
    </div>
    <app-footer />
  </div>
</template>

<script>
export { default } from '@/frame/views/requestPassword.vue.js'
</script>
