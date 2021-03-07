import { localize } from '@/frame/lib/localization-helper'
import AppUserLogin from '@/user/components/Login'
import AppUserDashboard from '@/user/components/Dashboard'
import { fetchEventBySlug } from '@/user/api/fetch/event'

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
    if (this.$store.getters.isLoggedIn) {
      this.userRole = this.$store.getters.getCurrentUserRole
    }
    // Fetch user record if already logged in.
    if (this.$store.getters.isLoggedIn && this.$store.getters.getCurrentUserRole === 'event-user') {
      this.component = 'AppUserDashboard'
    }
    this.allowToRender = true
  },
  data () {
    return {
      eventRecord: null,
      component: 'AppUserLogin',
      allowToRender: false,
      userRole: ''
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
