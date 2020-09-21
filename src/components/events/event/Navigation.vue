<template>
  <nav id="mainNavigation">
    <span class="h2 my-3 d-block">{{ eventRecord.title }}</span>
    <div class="list-group">
      <router-link
        :to="{ name: 'MemberList' }"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.members') }}
        <span class="badge badge-success badge-pill">
          {{ verifiedUsersCount }}
        </span>
      </router-link>
      <router-link
        :to="{ name: 'WaitingRoom' }"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.waitingRoom') }}
        <span class="badge badge-warning badge-pill">
          {{ pendingUsersCount }}
        </span>
      </router-link>
      <router-link
        :to="{ name: 'Polls' }"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.polls') }}
      </router-link>
      <router-link
        :to="{ name: 'Results' }"
        class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.results') }}
      </router-link>
      <router-link
        :to="{ name: 'Events' }"
         class="mt-5 list-group-item list-group-item-action bg-danger list-group-item-dark mb-3 rounded">
        {{ localize('view.event.navigation.back') }}
      </router-link>
    </div>
  </nav>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  data () {
    return {}
  },
  methods: {
    localize (path) {
      return localize(path)
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

<style>
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
