<template>
  <ul class="allowed-users list-group">
    <li v-for="(user, index) in verifiedUsers" :key="index" class="list-group-item">
      <div class="d-flex w-100 justify-content-between mb-1">
        <h5 class="mb-1">{{ user.publicName }}</h5>
        <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
        <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
      </div>
      <small class="text-success" v-if="user.allowToVote">{{ localize('view.event.user.member') }}</small>
      <small class="text-info" v-else>{{ localize('view.event.user.visitor') }}</small>
    </li>
  </ul>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    verifiedUsers: {
      type: Array,
      required: true
    }
  },
  data () {
    return {}
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
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
