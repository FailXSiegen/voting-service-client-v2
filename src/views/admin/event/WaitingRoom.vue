<template>
  <div class="waitingroom-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation v-if="eventUsers" :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-pending-users v-if="eventUsers" :eventUsers="pendingUsers" :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppPendingUsers from '@/components/events/event/PendingUsers'
import { fetchEventBySlug } from '@/api/event'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION,
  UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
} from '@/graphql/subscriptions'
import { EVENT_USERS_BY_EVENT } from '@/graphql/queries'

export default {
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppPendingUsers
  },
  apollo: {
    eventUsers: {
      pollInterval: 500,
      query: EVENT_USERS_BY_EVENT,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    },
    $subscribe: {
      updateEventUserAccessRights: {
        query: UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION,
        result ({ data }) {
          const { eventUserId, eventId, verified, allowToVote, voteAmount } = data.updateEventUserAccessRights
          if (parseInt(eventId) !== this.eventRecord.id) {
            return
          }
          const eventUser = this.eventUsers.find((user) => {
            return user.id === eventUserId
          })
          if (!eventUser) {
            return
          }
          eventUser.verified = verified
          eventUser.allowToVote = allowToVote
          eventUser.voteAmount = voteAmount
        }
      },
      newEventUser: {
        query: NEW_EVENT_USER_SUBSCRIPTION,
        result ({ data }) {
          if (parseInt(data.newEventUser.eventId) !== this.eventRecord.id) {
            return
          }
          this.eventUsers.push({ ...data.newEventUser })
        }
      },
      eventUserLifeCycle: {
        query: EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          const eventUserId = data.eventUserLifeCycle.eventUserId
          this.eventUsers.forEach((eventUser) => {
            if (eventUserId === eventUser.id) {
              eventUser.online = data.eventUserLifeCycle.online
            }
          })
        }
      }
    }
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  data () {
    return {
      headline: 'Warteraum',
      eventRecord: {},
      eventUsers: []
    }
  },
  computed: {
    pendingUsers () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return !eventUser.verified
      })
    }
  }
}
</script>
