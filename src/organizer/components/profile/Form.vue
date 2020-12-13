<template>
  <form class="profile-form my-5" @submit.prevent="submitUpdateOrganizer">
    <div class="form-group">
      <label for="currentPassword">{{ localize('view.profile.label.currentPassword') }}</label>
      <input type="password" class="form-control" id="currentPassword" disabled="disabled">
    </div>
    <div class="form-group">
      <label for="newPassword">{{ localize('view.profile.label.newPassword') }}</label>
      <input type="password" class="form-control" id="newPassword" disabled="disabled">
    </div>
    <div class="form-group">
      <label for="repeatPassword">{{ localize('view.profile.label.repeatPassword') }}</label>
      <input type="password" class="form-control" id="repeatPassword" disabled="disabled">
    </div>
    <div class="form-group">
      <label for="email">{{ localize('view.profile.label.email') }}</label>
      <input type="email" v-model="organizer.email" class="form-control" id="email">
    </div>
    <div class="form-group">
      <label for="fullName">{{ localize('view.profile.label.fullName') }}</label>
      <input type="input" v-model="organizer.publicName" class="form-control" id="fullName">
    </div>
    <button type="submit" class="btn btn-primary btn-block my-3" >Submit</button>
  </form>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    organizer: {
      type: Object
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    submitUpdateOrganizer () {
      //  @Todo check if password is correct and if new password equals new password repeat
      this.$emit('onUpdateOrganizer', {
        organizer: this.organizer
      })
    }
  }
}
</script>
