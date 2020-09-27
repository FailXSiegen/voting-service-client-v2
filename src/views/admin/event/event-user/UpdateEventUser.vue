<template>
  <div class="create-new-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <nav id="mainNavigation">
          <span class="h2 my-3 d-block">{{ eventRecord.title }}</span>
          <div class="list-group">
            <router-link
              :to="{ name: 'MemberList' }"
              class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
              {{ localize('view.event.navigation.members') }}
            </router-link>
          </div>
        </nav>
      </div>
      <div class="col-12 col-md-3 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <hr />
        <app-event-user-mask :eventUserRecord="eventUserRecord" @updateEventUser="onUpdateEventUser" />
      </div>
    </div>
  </div>
</template>

<script>

import AppEventUserMask from '@/components/events/EventUserMask'
import { localize } from '@/helper/localization-helper'
import { UPDATE_EVENT_USER } from '@/graphql/mutations'
import { fetchEventBySlug } from '@/api/event'

export default {
  components: {
    AppEventUserMask
  },
  props: {
    eventSlug: {
      type: String
    },
    eventUserRecord: {
      type: Object,
      required: true
    }
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  data () {
    return {
      headline: 'Benutzer editieren',
      eventRecord: {}
    }
  },
  methods: {
    onUpdateEventUser () {
      this.eventUserRecord.eventId = this.eventRecord.id
      this.eventUserRecord.voteAmount = parseInt(this.eventUserRecord.voteAmount)
      if (!this.eventUserRecord.allowToVote) {
        this.eventUserRecord.voteAmount = 0
      }
      this.$apollo.mutate({
        mutation: UPDATE_EVENT_USER,
        variables: { input: this.eventUserRecord }
      }).then(() => {
        this.$router.push({ name: 'MemberList' })
      }).catch((error) => {
        console.error(error)
      })
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
