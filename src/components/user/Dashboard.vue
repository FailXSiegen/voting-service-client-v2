<template>
  <section class="user-dashboard-container">
    <div class="container bg-white min-vh-100">
      <div v-if="!user.verified" class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12 text-center">
          <i class="bi-arrow-repeat bi--spin bi--4xl mb-3"></i>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <p>{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12">
          <h1>{{ localize('view.user.verified.welcome') }} {{ user.publicName }}</h1>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from '@/graphql/subscriptions'

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  apollo: {
    $subscribe: {
      updateEventUserAccessRights: {
        query: UPDATE_EVENT_USER_ACCESS_RIGHTS,
        result ({ data }) {
          const id = parseInt(data.updateEventUserAccessRights.eventUserId)
          if (id !== this.$store.getters.getCurrentUserId) {
            return
          }
          alert('Change detected!')
          this.$emit('refresh')
        }
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
