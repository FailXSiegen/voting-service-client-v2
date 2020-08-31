<template>
  <nav id="mainNavigation">
    <div class="list-group">
      <router-link
        to="/event"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.members') }}
        <span class="badge badge-success badge-pill">
          {{ verifiedUsersCount }}
        </span>
      </router-link>
      <router-link
        to="/event/waitingroom"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.waitingRoom') }}
        <span class="badge badge-warning badge-pill">
          {{ pendingUsersCount }}
        </span>
      </router-link>
      <router-link
        to="/event/polls"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.polls') }}
      </router-link>
      <router-link
        to="/event/results"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.results') }}
      </router-link>
    </div>
  </nav>
</template>

<script>

import { localize } from '@/helper/localization-helper'

export default {
  data () {
    return {}
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  },
  computed: {
    pendingUsersCount () {
      return this.$store.getters.pendingUsers.length
    },
    verifiedUsersCount () {
      return this.$store.getters.verifiedUsers.length
    }
  }
}
</script>

<style scoped>
@media screen AND (min-width: 991px) {
  #mainNavigation {
    min-height: 100vh;
  }
}
.list-group-item {
  border-color: transparent;
  border-width: 3px;
}
.list-group-item.list-group-item-dark.router-link-exact-active,
.list-group-item.list-group-item-dark:active,
.list-group-item.list-group-item-dark:focus {
  background-color: white;
  border-color: var(--primary);
  border-width: 3px;
}
.list-group-item.list-group-item-dark:hover {
  border-color: transparent;
  background-color: var(--primary);
  color: white;
}
.list-group-item+.list-group-item {
  border-top-width: initial;
}
</style>
