<template>
  <div class="memberlist-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation
          :verifiedUsers="getVerifiedUsers(this.$store.state.users).length"
          :pendingUsers="getPendingUsers(this.$store.state.users).length"
        />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <div class="row mt-5">
          <div class="col-12">
            <app-verified-users
              :verifiedUsers="getVerifiedUsers(this.$store.state.users)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppVerifiedUsers from '@/components/events/event/VerifiedUsers'
import { getVerifiedUsers, getPendingUsers } from '@/helper/users-helper'
import { localize } from '@/helper/localization-helper'

export default {
  components: {
    AppNavigation,
    AppVerifiedUsers
  },
  data () {
    return {
      headline: 'Verified Members'
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    getVerifiedUsers,
    getPendingUsers
  }
}
</script>
