<template>
  <ul class="allowed-users list-group">
    <li v-for="(user, index) in verifiedUsers" :key="index" class="list-group-item">
      <div class="d-flex w-100 justify-content-between mb-1">
        <h5 class="mb-1">{{ user.publicName }}
          <span class="text-success small" v-if="user.allowToVote">{{ localize('view.event.user.member') }}</span>
          <span class="text-info small" v-else>{{ localize('view.event.user.visitor') }}</span>
        </h5>
        <span class="badge badge-success badge-pill status-indicator" v-if="user.online">online</span>
        <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
      </div>
      <button class="btn btn-primary mr-2">{{ localize('view.event.user.setTo') }} {{ localize('view.event.user.member') }}</button>
      <button class="btn btn-primary mr-2">{{ localize('view.event.user.setTo') }} {{ localize('view.event.user.visitor') }}</button>
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
h5 > .small {
  font-size: 50%;
}
</style>
