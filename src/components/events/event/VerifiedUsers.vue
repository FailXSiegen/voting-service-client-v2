<template>
  <ul class="allowed-users list-group">
    <li v-for="(user, index) in eventUsersByEvent" :key="index" class="list-group-item my-2 border">
      <div class="d-flex w-100 justify-content-between mb-1">
        <h5 class="mb-1">{{ user.publicName }}
          <span class="text-success small" v-if="user.allowToVote">{{ localize('view.event.user.member') }}</span>
          <span class="text-info small" v-else>{{ localize('view.event.user.visitor') }}</span>
        </h5>
        <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
        <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
      </div>
      <button v-if="!user.allowToVote" v-on:click="verifyWithVoting(user.id)" class="btn btn-success mr-2">{{ localize('view.event.user.setTo') }}
        {{ localize('view.event.user.member') }}
      </button>
      <button v-else-if="user.allowToVote" v-on:click="verifyAsGuest(user.id)" class="btn btn-info mr-2">{{ localize('view.event.user.setTo') }}
        {{ localize('view.event.user.visitor') }}
      </button>
    </li>
  </ul>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { EVENT_USERS_BY_EVENT } from '@/graphql/queries'
import { UPDATE_EVENT_USER_VERIFIED } from '@/graphql/mutations'

export default {
  props: {
    eventRecord: Object
  },
  data () {
    return {
      eventUsersByEvent: []
    }
  },
  mounted () {
    this.$apollo.queries.eventUsersByEvent.refetch()
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    verifyWithVoting (userId) {
      this.$apollo.mutate({
        mutation: UPDATE_EVENT_USER_VERIFIED,
        variables: {
          input: {
            id: userId,
            verified: true,
            allowToVote: true
          }
        }
      }).then(() => {
        this.$apollo.queries.eventUsersByEvent.refetch()
      }).catch((error) => {
        console.error(error)
      })
    },
    verifyAsGuest (userId) {
      this.$apollo.mutate({
        mutation: UPDATE_EVENT_USER_VERIFIED,
        variables: {
          input: {
            id: userId,
            verified: true,
            allowToVote: false
          }
        }
      }).then(() => {
        this.$apollo.queries.eventUsersByEvent.refetch()
      }).catch((error) => {
        console.error(error)
      })
    }
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
          verified: true
        }
      }
    }
  }
}
</script>

<style scoped>
.status-indicator {
  display: table;
  font-weight: initial;
}

h5 > .small {
  font-size: 50%;
}
</style>
