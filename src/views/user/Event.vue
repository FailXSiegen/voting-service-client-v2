<template>
  <div :id="this.event.slug">
      <component :user="user" :users="users" v-bind:is="component" @changeComponent="changeComponent"/>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import AppUserLogin from '@/components/user/Login'
import AppUserDashboard from '@/components/user/Dashboard'

const events = [
  {
    slug: 'test-event',
    event: {
      name: 'Event 1'
    }
  }
]

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
  created () {
    // @todo Get event by 'find by slug' API shit
    const foundEvent = events.filter(event => {
      return event.slug === this.eventSlug
    })
    if (foundEvent.length > 0) {
      this.event = foundEvent
    } else {
      this.$router.push('/')
    }
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
