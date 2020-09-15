<template>
  <section class="user-login-container">
    <div class="min-vh-100 container-fluid">
      <div class="row align-items-center justify-content-around h-100">
        <div class="col-12 my-5">
          <h1 class="mb-4 text-center">{{ localize('view.login.headline.userWelcomeTo') }}</h1>
          <div class="row justify-content-around mt-5">
            <div class="mb-5 col-md-5 order-1 order-md-2 border py-3">
              <form @submit.prevent="onLogin">
                <div class="form-group">
                  <label for="email">{{ localize('view.login.label.email') }}</label>
                  <input v-model="user.email" type="email" name="email" id="email" class="form-control" required="required">
                  <small>{{ localize('view.login.label.emailHelp') }}</small>
                </div>
                <div class="form-group">
                  <label for="password">{{ localize('view.login.label.password') }}</label>
                  <input type="password" name="password" id="password" class="form-control" required="required">
                  <small>{{ localize('view.login.label.passwordHelp') }}</small>
                </div>
                <div class="form-group">
                  <label for="displayName">{{ localize('view.login.label.displayName') }}</label>
                  <input v-model="user.displayName" type="text" name="email" id="displayName" class="form-control" required="required">
                  <small>{{ localize('view.login.label.displayNameHelp') }}</small>
                </div>
                <div class="form-group">
                  <button class="btn btn-primary btn-block float-right">{{ localize('view.login.submitToEvent') }}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    users: {
      type: Array
    },
    user: {
      type: Object
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    onLogin () {
      const emailSearch = this.users.filter(user => user.email === this.user.email)
      if (emailSearch.length > 0) {
        this.$emit('changeComponent', {
          component: 'AppUserDashboard',
          displayName: this.displayName,
          verified: true
        })
      } else {
        this.$emit('changeComponent', {
          component: 'AppUserDashboard',
          verified: false
        })
      }
    }
  }
}
</script>
