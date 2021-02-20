<template>
  <div class="waitingroom-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr />
        <app-pending-users
          v-if="eventUsers"
          :eventUsers="pendingUsers"
          :eventRecord="eventRecord"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/events/detail/Navigation'
import AppPendingUsers from '@/organizer/components/events/detail/PendingUsers'
import { addSuccessMessage } from '@/frame/lib/alert-helper'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION,
  UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'
import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'

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
      pollInterval: 5000,
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
          const {
            eventUserId,
            eventId,
            verified,
            allowToVote,
            voteAmount
          } = data.updateEventUserAccessRights
          if (parseInt(eventId) !== this.eventRecord.id) {
            return
          }
          const eventUser = this.eventUsers.find(user => {
            return user.id === eventUserId
          })
          if (!eventUser) {
            return
          }
          eventUser.verified = verified
          eventUser.allowToVote = allowToVote
          eventUser.voteAmount = voteAmount
          addSuccessMessage(
            'Erfolg',
            'Die Rechte des Nutzers wurden erfolgreich angepasst.'
          )
        }
      },
      newEventUser: {
        query: NEW_EVENT_USER_SUBSCRIPTION,
        result ({ data }) {
          if (parseInt(data.newEventUser.eventId) !== this.eventRecord.id) {
            return
          }

          this.eventUsers.push({ ...data.newEventUser })
          addSuccessMessage(
            'Hallöchen',
            'Ein neuer User ist dem Waitingroom beigetreten.'
          )
        }
      },
      eventUserLifeCycle: {
        query: EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          let eventUserFound = false
          const eventUserId = data.eventUserLifeCycle.eventUserId
          this.eventUsers.forEach(eventUser => {
            if (eventUserId === eventUser.id) {
              eventUserFound = true
              eventUser.online = data.eventUserLifeCycle.online
            }
          })
          if (!eventUserFound && data.eventUserLifeCycle) {
            this.eventUsers.push({ ...data.eventUserLifeCycle })
          }
        }
      }
    }
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (
      response === null ||
      response.success === false ||
      response.event.organizerId !== this.$store.getters.getCurrentUserId
    ) {
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
      return this.eventUsers.filter(eventUser => {
        return !eventUser.verified
      })
    }
  }
}
</script>
