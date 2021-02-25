<template>
  <nav id="mainNavigation" class="navbar navbar-dark fixed-top bg-dark">
    <span class="h5 my-3 d-block text-white">{{ eventRecord.title }}</span>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarCollapse"
      aria-controls="navbarCollapse"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse bg-dark" id="navbarCollapse">
      <div class="list-group">
        <router-link
          :to="{ name: 'MemberList' }"
          class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded"
        >
          {{ localize('view.event.navigation.members') }}
          <span class="badge badge-success badge-pill">
            {{ verifiedUsersCount }}
          </span>
        </router-link>
        <router-link
          :to="{ name: 'WaitingRoom' }"
          class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded"
        >
          {{ localize('view.event.navigation.waitingRoom') }}
          <span class="badge badge-warning badge-pill">
            {{ pendingUsersCount }}
          </span>
        </router-link>
        <router-link
          :to="{ name: 'Polls' }"
          class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded"
        >
          {{ localize('view.event.navigation.polls') }}
        </router-link>
        <router-link
          :to="{ name: 'Results' }"
          class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded"
        >
          {{ localize('view.event.navigation.results') }}
        </router-link>
        <router-link
          :to="{ name: 'Events' }"
          class="mt-5 list-group-item list-group-item-action bg-danger list-group-item-dark mb-3 rounded text-white"
        >
          {{ localize('view.event.navigation.back') }}
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    eventUsers: {
      type: Array
    }
  },
  data () {
    return {}
  },
  computed: {
    verifiedUsersCount () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter(eventUser => {
        return eventUser.verified
      }).length
    },
    pendingUsersCount () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter(eventUser => {
        return !eventUser.verified
      }).length
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
