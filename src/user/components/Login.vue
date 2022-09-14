<template>
  <section class="user-login-container">
    <slot name="alerts"></slot>
    <div class="min-vh-100 container-fluid">
      <div class="row align-items-center justify-content-around h-100">
        <div class="col-12 my-5">
          <h1 class="mb-4 text-center">{{ eventRecord.title }}</h1>
          <h2 class="h4 text-center" v-if="eventRecord.active">
            {{ localize('view.login.headline.userWelcomeTo') }}
          </h2>
          <div
            class="row justify-content-around mt-5"
            v-if="eventRecord.active"
          >
            <div class="mb-5 col-md-5 order-1 order-md-2 border py-3">
              <form
                id="eventuser-login-form"
                @submit.prevent="onLogin"
                autocomplete="off"
              >
                <div class="form-group mb-5">
                  <label for="username">{{
                    localize('view.login.label.username')
                  }}</label>
                  <input
                    v-model="eventUser.username"
                    type="text"
                    name="username"
                    id="username"
                    class="form-control"
                    required="required"
                  />
                  <small v-html="localize('view.login.label.usernameHelp')"></small>
                </div>
                <div class="form-group mb-5">
                  <label for="password">{{
                    localize('view.login.label.password')
                  }}</label>
                  <input
                    v-model="eventUser.password"
                    type="password"
                    name="password"
                    id="password"
                    class="form-control"
                    required="required"
                    autocomplete="one-time-code"
                  />
                  <small>{{ localize('view.login.label.passwordHelp') }}</small>
                </div>
                <div class="form-group  mb-5">
                  <label for="publicName">{{
                    localize('view.login.label.publicName')
                  }}</label>
                  <input
                    v-model="eventUser.publicName"
                    type="text"
                    name="publicName"
                    id="publicName"
                    class="form-control"
                    required="required"
                  />
                  <small>{{
                    localize('view.login.label.publicNameHelp')
                  }}</small>
                </div>
                <div class="form-group">
                  <button class="btn btn-primary btn-block float-right">
                    {{ localize('view.login.submitToEvent') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div v-else>
            <h2 class="h4 text-center">
              {{ localize('view.login.headline.inactiveEvent') }}
            </h2>
            <p class="alert alert-info container text-center mt-5">
              {{ localize('view.login.inactiveEventText') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'
import * as R from 'ramda'
import { onLogin as loginApolloClient } from '@/vue-apollo'
import { login, refreshLogin } from '@/frame/api/fetch/auth'

export default {
  title: 'Foo Page',
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  created () {
    document.title = this.eventRecord.title + ' - digitalwahl.org'
  },
  data () {
    return {
      eventUser: {
        username: '',
        password: '',
        publicName: ''
      }
    }
  },
  mounted () {
    const urlParams = new URLSearchParams(window.location.search)
    const getUsername = urlParams.get('username')
    this.eventUser.username = getUsername
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    validateInput (parentId, ignoreInput = '') {
      const formInputs = document.querySelectorAll(parentId + ' .form-control')
      for (let i = 0; i < formInputs.length; i++) {
        if (ignoreInput.length > 0) {
          if (formInputs[i].id !== ignoreInput) {
            formInputs[i].classList.add('is-invalid')
          }
        } else {
          formInputs[i].classList.add('is-invalid')
        }
      }
    },
    onLogin () {
      const loginType = 'event-user'
      // @todo set the event and display_name as optional parameter in login
      login(
        this.eventUser.username,
        this.eventUser.password,
        loginType,
        this.eventUser.publicName,
        this.eventRecord.id
      )
        .then(async data => {
          const token = R.path(['token'], data)
          const expiresAt = R.path(['expiresAt'], data)

          await loginApolloClient(
            this.$apollo.provider.defaultClient,
            token,
            expiresAt
          )
          await this.$store.dispatch('extractUserData')
          if (!this.$store.getters.getCurrentUserId) {
            refreshLogin()
          }
          this.$emit('changeComponent', {
            component: 'AppUserDashboard'
          })
          addSuccessMessage(
            'Erfolg',
            'Der Login hat funktioniert. Gleich geht es weiter.'
          )
        })
        .catch(error => {
          addDangerMessage(
            'Fehler',
            'Der Login hat nicht funktioniert. Für genauere Infos lohnt ein Blick in die Console.'
          )
          this.validateInput('#eventuser-login-form', 'publicName')
          console.error(error)
          return false
        })
    }
  }
}
</script>
