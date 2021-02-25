<template>
  <div class="create-new-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div
        class="col-12 col-md-3 col-xl-2 bg-dark text-white py-3 order-2 order-md-1"
      >
        <nav id="mainNavigation">
          <span class="h5 my-3 d-block">{{ eventRecord.title }}</span>
          <div class="list-group">
            <router-link
              :to="{ name: 'MemberList' }"
              class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded"
            >
              {{ localize('view.event.navigation.members') }}
            </router-link>
          </div>
        </nav>
      </div>
      <div class="col-12 col-md-3 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>
        <hr />
        <app-event-multiple-user-mask
          :eventMultipleUserRecord="eventMultipleUserRecord"
          @onCreateEventMultipleUser="createEventMultipleUser"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppEventMultipleUserMask from '@/organizer/components/events/EventMultipleUserMask'
import { localize } from '@/frame/lib/localization-helper'
import { CREATE_EVENT_USER } from '@/organizer/api/graphql/gql/mutations'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import {
  addDangerMessage,
  addSuccessMessage
} from '@/frame/lib/alert-helper.js'

export default {
  components: {
    AppEventMultipleUserMask
  },
  props: {
    eventSlug: {
      type: String
    }
  },
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (
      response === null ||
      response.success === false ||
      response.event.organizerId !== this.$store.getters.getCurrentUserId
    ) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  data () {
    return {
      headline: 'Neue Benutzer anhand Liste erstellen',
      eventMultipleUserRecord: {
        allowToVote: false,
        voteAmount: 0,
        listOfUsers: '',
        listOfUsersArray: []
      },
      eventRecord: {}
    }
  },
  methods: {
    createEventMultipleUser () {
      if (this.eventMultipleUserRecord.listOfUsersArray.length > 0) {
        try {
          this.eventMultipleUserRecord.listOfUsersArray.forEach(username => {
            if (!this.eventMultipleUserRecord.allowToVote) {
              this.eventMultipleUserRecord.voteAmount = 0
            }
            const eventUser = {
              eventId: this.eventRecord.id,
              verified: true,
              username: username.trim(),
              allowToVote: this.eventMultipleUserRecord.allowToVote,
              voteAmount: parseInt(this.eventMultipleUserRecord.voteAmount)
            }
            if (eventUser.username === '') {
              throw eventUser.username
            }
            this.$apollo
              .mutate({
                mutation: CREATE_EVENT_USER,
                variables: { input: eventUser }
              })
              .then(() => {})
              .catch(error => {
                addDangerMessage(
                  eventUser.username,
                  'Der User konnte nicht erstellt werden. Für mehr Informationen lohnt ein Blick in die Console.'
                )
                console.error(error)
              })
            addSuccessMessage(
              'Erfolg',
              'Die Nutzer wurden erfolgreich erstellt.'
            )
          })
        } catch (e) {
          addDangerMessage(
            'Fehler',
            'Eingegebene Liste konnte nicht korrekt verarbeitet werden. Leere Zeilen werden nicht interpretiert'
          )
        }
        this.$router.push({ name: 'MemberList' })
      }
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
