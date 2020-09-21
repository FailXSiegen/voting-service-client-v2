<template>
  <div class="memberlist-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 col-lg-6 col-xl-5 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <router-link :to="{ name: 'CreateEventUser' }" class="btn btn-success btn-lg my-3">
          <i class="bi-plus bi--2xl align-middle"></i>
          <span class="align-middle">{{ localize('view.event.create.labels.eventUser.createNew') }}</span>
        </router-link>
        <hr>
        <app-verified-users :eventRecord="eventRecord" />
      </div>
    </div>
  </div>
</template>

<script>

import AppNavigation from '@/components/events/event/Navigation'
import AppVerifiedUsers from '@/components/events/event/VerifiedUsers'
import { localize } from '@/helper/localization-helper'
import { fetchEventBySlug } from '@/api/event'

export default {
  props: {
    eventSlug: {
      type: String
    }
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  components: {
    AppNavigation,
    AppVerifiedUsers
  },
  data () {
    return {
      headline: 'Teilnehmerliste',
      eventRecord: {}
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
