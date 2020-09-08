<template>
  <div class="login-container container-fluid min-vh-100">
    <div class="row align-items-center justify-content-around h-100">
      <div class="col-12 my-5">
        <h1 class="mb-4 text-center">{{ localize('view.login.headline.title') }}</h1>
        <div class="row justify-content-around mt-5">
          <div class="mb-5 col-md-5 order-2 order-md-1 border py-3">
            <form @submit.prevent="onLoginById">
              <h2 class="mb-4">{{ localize('view.login.headline.eventIdent') }}</h2>
              <div class="form-group">
                <label for="eventIdent">{{ localize('view.login.label.eventIdent') }}</label>
                <input id="eventIdent" class="form-control" type="text" required="required">
              </div>
              <button type="submit" class="btn btn-primary btn-block">{{ localize('view.login.submitToEvent') }}
              </button>
            </form>
          </div>
          <div class="mb-5 col-md-5 order-1 order-md-2 border py-3">
            <form @submit.prevent="onLoginUser">
              <h2 class="mb-4">{{ localize('view.login.headline.orgaLogin') }}</h2>
              <div class="form-group">
                <label for="email">{{ localize('view.login.label.email') }}</label>
                <input v-model="user.email" type="email" name="email" id="email" class="form-control" required="required">
              </div>
              <div class="form-group">
                <label for="password">{{ localize('view.login.label.password') }}</label>
                <input v-model="user.password" type="password" name="password" id="password" class="form-control" required="required">
              </div>
              <div class="form-group">
                <button class="btn btn-primary btn-block float-right">{{ localize('view.login.submit') }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { login } from '@/graphql/auth'
import * as R from 'ramda'
import { onLogin as loginApolloClient } from '@/vue-apollo'

export default {
  data () {
    return {
      user: {
        displayName: '',
        email: '',
        password: ''
      }
    }
  },
  methods: {
    onLoginUser () {
      const loginType = 'organizer'
      login(this.user.email, this.user.password, loginType).then(async (data) => {
        const token = R.path(['token'], data)
        const expiresAt = R.path(['expiresAt'], data)
        await loginApolloClient(this.$apollo.provider.defaultClient, token, expiresAt)
        await this.$router.push('/admin')
      }).catch((error) => {
        console.error(error)
      })
    },
    localize (path) {
      return localize(path)
    },
    onLoginById () {
      alert('Login by ID')
    }
  }
}
</script>
