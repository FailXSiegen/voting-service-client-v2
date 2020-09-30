<template>
  <div class="memberlist-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation v-if="eventUsers" :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 col-lg-9 col-xl-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <router-link :to="{ name: 'CreateEventUser' }" class="btn btn-success btn-lg my-3">
          <i class="bi-plus bi--2xl align-middle"></i>
          <span class="align-middle">{{ localize('view.event.create.labels.eventUser.createNew') }}</span>
        </router-link>
        <hr>
        <div class="container-member-status">
          <table class="table table-sm">
            <thead class="thead-light">
              <tr>
                <th>Teilnehmer / Online / Offline</th>
                <th>Gäste / Online / Offline</th>
                <th>Gesamt / Online / Offline</th>
              </tr>
            </thead>
            <tbody>
            <tr>
              <td>{{ verifiedUsersCountAllowToVote }} / {{ verifiedUsersCountAllowToVoteOnline }} / {{ verifiedUsersCountAllowToVoteOffline }}</td>
              <td>{{ verifiedUsersCountNotAllowToVote }} / {{ verifiedUsersCountNotAllowToVoteOnline }} / {{ verifiedUsersCountNotAllowToVoteOffline }}</td>
              <td>{{ verifiedUsersCount }} / {{ verifiedUsersCountOnline }} / {{ verifiedUsersCountOffline }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <hr>
        <app-verified-users :eventUsers="verifiedUsers" :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppVerifiedUsers from '@/components/events/event/VerifiedUsers'
import { localize } from '@/helper/localization-helper'
import { fetchEventBySlug } from '@/api/event'
import { EVENT_USERS_BY_EVENT } from '@/graphql/queries'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION,
  UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
} from '@/graphql/subscriptions'

export default {
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppVerifiedUsers
  },
  apollo: {
    eventUsers: {
      fetchPolicy: 'network-only',
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
      headline: 'Teilnehmerliste',
      eventRecord: {},
      eventUsers: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  },
  computed: {
    verifiedUsers () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified
      })
    },
    verifiedUsersCount () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified
      }).length
    },
    verifiedUsersCountOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online
      }).length
    },
    verifiedUsersCountOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online
      }).length
    },
    verifiedUsersCountAllowToVote () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountAllowToVoteOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountAllowToVoteOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVote () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVoteOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online && !eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVoteOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online && !eventUser.allowToVote
      }).length
    }
  }
}
</script>
