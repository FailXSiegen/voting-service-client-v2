<template>
  <div class="create-new-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <nav id="mainNavigation">
          <span class="h5 my-3 d-block">{{ eventRecord.title }}</span>
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
        <app-event-user-mask :eventUserRecord="eventUserRecord" @onUpdateOrCreateEventUser="createEventUser" />
      </div>
    </div>
  </div>
</template>

<script>

import AppEventUserMask from '@/components/events/EventUserMask'
import { localize } from '@/helper/localization-helper'
import { CREATE_EVENT_USER } from '@/graphql/mutations'
import { fetchEventBySlug } from '@/api/event'
import { addDangerMessage, addSuccessMessage } from '@/helper/alert-helper.js'

export default {
  components: {
    AppEventUserMask
  },
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
  data () {
    return {
      headline: 'Neuen Benutzer erstellen',
      eventRecord: {},
      eventUserRecord: {
        allowToVote: false,
        voteAmount: 1
      }
    }
  },
  methods: {
    createEventUser () {
      this.eventUserRecord.eventId = this.eventRecord.id
      this.eventUserRecord.verified = true
      this.eventUserRecord.voteAmount = parseInt(this.eventUserRecord.voteAmount)
      if (!this.eventUserRecord.allowToVote) {
        this.eventUserRecord.voteAmount = 0
      }
      this.$apollo.mutate({
        mutation: CREATE_EVENT_USER,
        variables: { input: this.eventUserRecord }
      }).then(() => {
        addSuccessMessage('Erfolg', 'Der Nutzer wurde erfolgreich erstellt. ')
        this.$router.push({ name: 'MemberList' })
      }).catch((error) => {
        addDangerMessage('Fehler!', 'Der User konnte nicht erstellt werden. Für mehr Informationen lohnt ein Blick in die Console.')
        console.error(error)
      })
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
