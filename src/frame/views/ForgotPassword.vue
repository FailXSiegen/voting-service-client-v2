<template>
  <div class="pw-forgot container-fluid min-vh-100">
    <slot name="alerts"></slot>
    <div class="container">
      <form
        class="profile-form my-5"
        v-if="submitSuccess && !saveSuccess"
        @submit.prevent="submitUpdateOrganizer(submitData)"
      >
        <div class="form-group">
          <label for="newPassword">{{
            localize('view.profile.label.newPassword')
          }}</label>
          <input
            type="password"
            v-model="submitData.newPassword"
            class="form-control"
            id="newPassword"
          />
        </div>
        <div class="form-group">
          <label for="repeatPassword">{{
            localize('view.profile.label.repeatPassword')
          }}</label>
          <input
            type="password"
            v-model="submitData.repeatPassword"
            class="form-control"
            id="repeatPassword"
          />
        </div>
        <button type="submit" class="btn btn-primary btn-block my-3">
          {{ localize('view.profile.label.submit') }}
        </button>
      </form>
      <div class="alert alert-success mt-3" v-if="saveSuccess">
        <h2>Passwort erfolgreich geändert</h2>
        <a href="/" class="btn btn-primary">Zum Login</a>
      </div>
    </div>
    <app-footer />
  </div>
</template>

<script>
export { default } from '@/frame/views/forgotPassword.vue.js'
</script>
