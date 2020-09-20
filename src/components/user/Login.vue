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
                  <label for="username">{{ localize('view.login.label.username') }}</label>
                  <input v-model="user.username" type="text" name="username" id="username" class="form-control" required="required">
                  <small>{{ localize('view.login.label.usernameHelp') }}</small>
                </div>
                <div class="form-group">
                  <label for="password">{{ localize('view.login.label.password') }}</label>
                  <input v-model="user.password" type="password" name="password" id="password" class="form-control" required="required">
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
import * as R from 'ramda'
import { onLogin as loginApolloClient } from '@/vue-apollo'
import { login } from '@/graphql/auth'

export default {
  props: {
    user: {
      type: Object,
      default () {
        return {}
      }
    },
    event: {
      type: Object,
      required: true
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    onLogin () {
      const loginType = 'event-user'
      // @todo set the event and display_name as optional parameter in login
      login(this.user.username, this.user.password, loginType, this.user.displayName, this.event.id).then(async (data) => {
        const token = R.path(['token'], data)
        const expiresAt = R.path(['expiresAt'], data)
        await loginApolloClient(this.$apollo.provider.defaultClient, token, expiresAt)
        await this.$store.dispatch('extractUserData')
        this.$emit('changeComponent', {
          component: 'AppUserDashboard'
        })
      }).catch((error) => {
        console.error(error)
      })
    }
  }
}
</script>
