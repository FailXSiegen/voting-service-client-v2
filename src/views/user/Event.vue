<template>
  <div :id="eventSlug">
    <slot name="alerts"></slot>
    <component v-if="allowToRender"
               :eventRecord="eventRecord"
               v-bind:is="component"
               @logout="onLogout"
               @changeComponent="changeComponent" />
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import AppUserLogin from '@/components/user/Login'
import AppUserDashboard from '@/components/user/Dashboard'
import { fetchEventBySlug } from '@/api/event'

export default {
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppUserLogin,
    AppUserDashboard
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false) {
      await this.$router.push('/')
    }
    this.eventRecord = response.event

    // Fetch user record if already logged in.
    if (this.$store.getters.isLoggedIn) {
      this.component = 'AppUserDashboard'
    }
    this.allowToRender = true
  },
  data () {
    return {
      eventRecord: null,
      component: 'AppUserLogin',
      allowToRender: false
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    async changeComponent (event) {
      this.component = event.component
    },
    async onLogout () {
      this.component = 'AppUserLogin'
    }
  }
}
</script>

<style scoped>
.toast-container {
  top: 10%;
  bottom: auto;
}
</style>
