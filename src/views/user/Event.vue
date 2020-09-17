<template>
  <div :id="this.event.slug">
      <component :user="user" :users="users" v-bind:is="component" @changeComponent="changeComponent"/>
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
      this.$router.push('/')
    }
    this.event = response.event
  },
  data () {
    return {
      user: {
        loggedIn: false,
        verified: false,
        displayName: '',
        email: ''
      },
      event: {},
      users: this.$store.state.users,
      component: 'AppUserLogin'
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    changeComponent (event) {
      this.component = event.component
      this.user.verified = event.verified
    }
  }
}
</script>
