<template>
  <div class="pending-users">
    <ul class="allowed-users list-group">
      <li v-for="(user, index) in eventUsersByEvent" :key="index" class="list-group-item">
        <div class="d-flex w-100 justify-content-between mb-3">
          <span  class="user-information mb-1">
            <h5 class="mb-0">{{ user.publicName }}</h5>
            <small>{{ user.username }}</small>
          </span>
          <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
          <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
        </div>
        <button class="btn btn-success mr-2" v-on:click="updateToParticipant(user.id)">{{ localize('view.event.user.verifyAs') }} {{ localize('view.event.user.member') }}</button>
        <button class="btn btn-info mr-2" v-on:click="updateUserToGuest(user.id)">{{ localize('view.event.user.verifyAs') }} {{ localize('view.event.user.visitor') }}</button>
        <button class="btn btn-danger mr-2">{{ localize('view.event.user.block') }}</button>
      </li>
    </ul>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { EVENT_USERS_BY_EVENT } from '@/graphql/queries'
import { UPDATE_USER_TO_GUEST, UPDATE_USER_TO_PARTICIPANT } from '@/graphql/mutations'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      eventUsersByEvent: []
    }
  },
  mounted () {
    this.$apollo.queries.eventUsersByEvent.refetch()
  },
  apollo: {
    eventUsersByEvent: {
      query: EVENT_USERS_BY_EVENT,
      update (data) {
        return data.findEventUserByEvent
      },
      variables () {
        return {
          eventId: this.eventRecord.id,
          verified: false
        }
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    updateUserToGuest (eventUserId) {
      this.$apollo.mutate({
        mutation: UPDATE_USER_TO_GUEST,
        variables: { eventUserId }
      }).then(() => {
        this.$apollo.queries.eventUsersByEvent.refetch()
      }).catch((error) => {
        console.error(error)
      })
    },
    updateToParticipant (eventUserId) {
      this.$apollo.mutate({
        mutation: UPDATE_USER_TO_PARTICIPANT,
        variables: { eventUserId }
      }).then(() => {
        this.$apollo.queries.eventUsersByEvent.refetch()
      }).catch((error) => {
        console.error(error)
      })
    }
  }
}
</script>

<style scoped>
.status-indicator {
  display: table;
  font-weight: initial;
}
</style>
