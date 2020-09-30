<template>
  <div class="container-verified-user" v-if="eventUsers">
    <h3>Benutzer: {{ eventUsers.length }}</h3>
    <ul class="allowed-users list-group">
      <li v-for="(user, index) in eventUsers" :key="index" class="list-group-item my-2 border">
        <div class="d-flex w-100 justify-content-between mb-1 align-content-center">
          <span class="flex-fill d-flex pr-5 align-items-center">
            <span class="user-information flex-fill">
              <h5 class="mb-1">{{ user.publicName }}
                <span class="text-success small" v-if="user.allowToVote">{{ localize('view.event.user.member') }}</span>
                <span class="text-info small" v-else>{{ localize('view.event.user.visitor') }}</span>
                <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
                <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
              </h5>
            </span>
            <p class="mb-0 justify-content-end">{{ user.username }} <span v-if="user.voteAmount">- Stimmen: {{ user.voteAmount }}</span>  </p>
          </span>
          <button v-if="!user.allowToVote" v-on:click="updateToParticipant(user)" class="btn btn-success btn-lg mr-2">{{ localize('view.event.user.setTo') }}
            {{ localize('view.event.user.member') }}
          </button>
          <button v-else-if="user.allowToVote" v-on:click="updateUserToGuest(user)" class="btn btn-info btn-lg mr-2">{{ localize('view.event.user.setTo') }}
            {{ localize('view.event.user.visitor') }}
          </button>
          <router-link :to="{ name: 'UpdateEventUser', params: { eventUserRecord: user } }"
                       class="btn float-xl-right btn-warning btn-lg">
            <i class="bi-pencil align-middle"></i>
          </router-link>

        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { UPDATE_USER_TO_GUEST, UPDATE_USER_TO_PARTICIPANT } from '@/graphql/mutations'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    eventUsers: {
      type: Array,
      required: true
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    updateUserToGuest (user) {
      const eventUserId = user.id
      this.$apollo.mutate({
        mutation: UPDATE_USER_TO_GUEST,
        variables: { eventUserId }
      }).then(() => {
        user.voteAmount = 0
      }).catch((error) => {
        console.error(error)
      })
    },
    updateToParticipant (user) {
      const eventUserId = user.id
      this.$apollo.mutate({
        mutation: UPDATE_USER_TO_PARTICIPANT,
        variables: { eventUserId }
      }).then(() => {
        user.voteAmount = 1
      }).catch((error) => {
        console.error(error)
      })
    }
  }
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: lightgrey;
}
.status-indicator {
  display: table;
  font-weight: initial;
}

h5 > .small {
  font-size: 50%;
}
</style>
