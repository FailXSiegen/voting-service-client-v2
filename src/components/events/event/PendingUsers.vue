<template>
  <ul class="allowed-users list-group">
    <li v-for="(user, index) in pendingUsers" :key="index" class="list-group-item">
      <div class="d-flex w-100 justify-content-between mb-3">
        <h5 class="mb-1">{{ user.publicName }}</h5>
        <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
        <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
      </div>

      <button class="btn btn-primary mr-2">{{ localize('view.event.user.verifyAs') }} {{ localize('view.event.user.member') }}</button>
      <button class="btn btn-primary mr-2">{{ localize('view.event.user.verifyAs') }} {{ localize('view.event.user.visitor') }}</button>
      <button class="btn btn-danger mr-2">{{ localize('view.event.user.block') }}</button>
    </li>
  </ul>
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
    pendingUsers () {
      return this.$store.getters.pendingUsers
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
