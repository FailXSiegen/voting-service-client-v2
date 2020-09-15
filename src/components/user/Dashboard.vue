<template>
  <section class="user-dashboard-container">
    <div class="container-fluid bg-white min-vh-100">
      <div v-if="!user.verified" class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12 text-center">
          <i class="bi-arrow-repeat bi--spin bi--4xl mb-3"></i>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <p>{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12">
          <h1>{{ localize('view.user.verified.welcome') }} {{user.displayName}}</h1>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    users: {
      type: Array
    },
    user: {
      type: Object
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
