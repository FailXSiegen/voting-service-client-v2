<template>
  <div class="create-new-container">
    <slot name="alerts"></slot>
    <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <hr />
          <app-event-multiple-user-mask
            :eventMultipleUserRecord="eventMultipleUserRecord"
            @onCreateEventMultipleUser="createEventMultipleUser"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppEventMultipleUserMask from '@/organizer/components/events/EventMultipleUserMask'
import AppNavigation from '@/organizer/components/events/detail/Navigation'
import { localize } from '@/frame/lib/localization-helper'
import { CREATE_EVENT_USER } from '@/organizer/api/graphql/gql/mutations'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import {
  addDangerMessage,
  addSuccessMessage
} from '@/frame/lib/alert-helper.js'
import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'

export default {
  components: {
    AppEventMultipleUserMask,
    AppNavigation
  },
  props: {
    eventSlug: {
      type: String
    }
  },
  apollo: {
    eventUsers: {
      fetchPolicy: 'network-only',
      query: EVENT_USERS_BY_EVENT,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    },
    $subscribe: {
      newEventUser: {
        query: NEW_EVENT_USER_SUBSCRIPTION,
        result ({ data }) {
          if (parseInt(data.newEventUser.eventId) !== this.eventRecord.id) {
            return
          }
          this.eventUsers.push({ ...data.newEventUser })
        }
      },
      eventUserLifeCycle: {
        query: EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          let eventUserFound = false
          const eventUserId = data.eventUserLifeCycle.eventUserId
          this.eventUsers.forEach(eventUser => {
            if (eventUserId === eventUser.id) {
              eventUserFound = true
              eventUser.online = data.eventUserLifeCycle.online
            }
          })
          if (!eventUserFound && data.eventUserLifeCycle) {
            this.eventUsers.push({ ...data.eventUserLifeCycle })
          }
        }
      }
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
      eventRecord: {},
      eventUsers: []
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
