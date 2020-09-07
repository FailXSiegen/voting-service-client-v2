<template>
  <form class="profile-form my-5" @submit.prevent="editProfile">
    <div class="form-group">
      <label for="currentPassword">{{ localize('view.profile.label.currentPassword') }}</label>
      <input type="password" class="form-control" id="currentPassword">
    </div>
    <div class="form-group">
      <label for="newPassword">{{ localize('view.profile.label.newPassword') }}</label>
      <input type="password" class="form-control" id="newPassword">
    </div>
    <div class="form-group">
      <label for="repeatPassword">{{ localize('view.profile.label.repeatPassword') }}</label>
      <input type="password" class="form-control" id="repeatPassword">
    </div>
    <div class="form-group">
      <label for="email">{{ localize('view.profile.label.email') }}</label>
      <input type="email" class="form-control" id="email">
    </div>
    <div class="form-group">
      <label for="fullName">{{ localize('view.profile.label.fullName') }}</label>
      <input type="email" class="form-control" id="fullName">
    </div>
    <button type="submit" class="btn btn-primary btn-block my-3">Submit</button>
  </form>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  methods: {
    localize (path) {
      return localize(path)
    },
    editProfile () {
      alert('Edit Profile')
    }
  }
}
</script>
