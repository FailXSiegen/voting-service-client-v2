<template>
  <div :id="event.slug">
    <component v-if="allowToRender" :user="eventUser" :event="event" v-bind:is="component"
               @changeComponent="changeComponent"
               @refresh="onRefresh" />
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import AppUserLogin from '@/components/user/Login'
import AppUserDashboard from '@/components/user/Dashboard'
import { fetchEventBySlug } from '@/api/event'
import { EVENT_USER_BY_ID } from '@/graphql/queries'

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
    this.event = response.event

    // Fetch user record if already logged in.
    if (this.$store.getters.isLoggedIn) {
      await this.onRefresh()
      this.component = 'AppUserDashboard'
    }
    this.allowToRender = true
  },
  apollo: {
    eventUser: {
      query: EVENT_USER_BY_ID,
      variables () {
        return {
          id: this.$store.getters.getCurrentUserId
        }
      }
    }
  },
  data () {
    return {
      eventUser: undefined,
      event: {},
      component: 'AppUserLogin',
      allowToRender: false
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    async changeComponent (event) {
      await this.onRefresh()
      this.component = event.component
    },
    async onRefresh () {
      await this.$apollo.queries.eventUser.refetch()
      console.log(this.eventUser)
    }
  }
}
</script>
