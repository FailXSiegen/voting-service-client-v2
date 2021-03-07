<template>
  <form
    class="profile-form my-5"
    @submit.prevent="submitUpdateOrganizer(submitData)"
  >
    <div class="form-group">
      <label for="currentPassword">{{
        localize('view.profile.label.currentPassword')
      }}</label>
      <input
        type="password"
        v-model="submitData.currentPassword"
        class="form-control"
        id="currentPassword"
      />
    </div>
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
    <div class="form-group">
      <label for="email">{{ localize('view.profile.label.email') }}</label>
      <input
        type="email"
        v-model="organizer.email"
        class="form-control"
        id="email"
      />
    </div>
    <div class="form-group">
      <label for="fullName">{{
        localize('view.profile.label.fullName')
      }}</label>
      <input
        type="input"
        v-model="organizer.publicName"
        class="form-control"
        id="fullName"
      />
    </div>
    <button type="submit" class="btn btn-primary btn-block my-3">
      {{ localize('view.profile.label.submit') }}
    </button>
  </form>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { validatePassword } from '@/frame/api/fetch/validate-password'
export default {
  props: {
    organizer: {
      type: Object
    }
  },
  data () {
    return {
      submitData: {
        currentPassword: '',
        newPassword: '',
        repeatPassword: ''
      },
      submitSuccess: false
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    async submitUpdateOrganizer (data) {
      const currentPasswordField = document.getElementById('currentPassword')
      const newPasswordField = document.getElementById('newPassword')
      const repeatPasswordField = document.getElementById('repeatPassword')
      if (data.newPassword !== data.repeatPassword) {
        this.$emit('onUpdateOrganizerError', {
          title: 'Fehler',
          message: 'Passwörter stimmen nicht überein'
        })
        newPasswordField.classList.add('is-invalid')
        repeatPasswordField.classList.add('is-invalid')
      } else {
        let currentPasswordIsValid = false
        if (data.currentPassword) {
          const passwordIsValid = await validatePassword({
            username: this.organizer.username,
            password: data.currentPassword
          })
          currentPasswordIsValid = passwordIsValid.success
          if (!currentPasswordIsValid) {
            currentPasswordField.classList.add('is-invalid')
          }
        }
        if (currentPasswordIsValid) {
          this.organizer.password = data.newPassword
          this.$emit('onUpdateOrganizer', {
            organizer: this.organizer
          })
        }
      }
    }
  }
}
</script>
