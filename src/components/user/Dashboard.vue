<template>
  <section class="user-dashboard-container">
    <div v-if="eventUser" class="container bg-white min-vh-100">
      <div v-if="!eventUser.verified" class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12 text-center">
          <i class="bi-arrow-repeat bi--spin bi--4xl mb-3"></i>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <p>{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12">
          <h1>{{ localize('view.user.verified.welcome') }} {{ eventUser.publicName }}</h1>
        </div>
      </div>
    </div>
    <app-modal-poll v-if="poll" :identifier="'poll' + poll.id" :poll="poll" :trigger="openModal" />
  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { POLL_LIFE_CYCLE, UPDATE_EVENT_USER_ACCESS_RIGHTS } from '@/graphql/subscriptions'
import { EVENT_USER_BY_ID } from '@/graphql/queries'
import AppModalPoll from '@/components/modal/Poll'

export default {
  components: {
    AppModalPoll
  },
  apollo: {
    eventUser: {
      query: EVENT_USER_BY_ID,
      variables () {
        return {
          id: this.$store.getters.getCurrentUserId
        }
      }
    },
    $subscribe: {
      updateEventUserAccessRights: {
        query: UPDATE_EVENT_USER_ACCESS_RIGHTS,
        result ({ data }) {
          const id = parseInt(data.updateEventUserAccessRights.eventUserId)
          if (id !== this.$store.getters.getCurrentUserId) {
            return
          }
          this.$apollo.queries.eventUser.refetch()
        }
      },
      pollLifeCycle: {
        query: POLL_LIFE_CYCLE,
        result ({ data }) {
          this.poll = data.pollLifeCycle.poll
        }
      }
    }
  },
  data () {
    return {
      eventUser: null,
      poll: null,
      openModal: false
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
