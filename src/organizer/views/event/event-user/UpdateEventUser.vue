<template>
  <div class="create-new-container">
    <slot name="alerts"></slot>
    <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <hr />
          <app-event-user-mask
            :eventUserRecord="eventUserRecord"
            @onUpdateOrCreateEventUser="onUpdateEventUser"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppEventUserMask from '@/organizer/components/events/EventUserMask'
import AppNavigation from '@/organizer/components/events/detail/Navigation'
import { localize } from '@/frame/lib/localization-helper'
import { UPDATE_EVENT_USER } from '@/organizer/api/graphql/gql/mutations'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'
import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'

export default {
  components: {
    AppEventUserMask,
    AppNavigation
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
      headline: 'Benutzer editieren',
      eventRecord: {},
      eventUsers: []
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
          if (data.eventUserLifeCycle) {
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
    }
  },
  methods: {
    onUpdateEventUser () {
      this.eventUserRecord.eventId = this.eventRecord.id
      this.eventUserRecord.voteAmount = parseInt(
        this.eventUserRecord.voteAmount
      )
      if (!this.eventUserRecord.allowToVote) {
        this.eventUserRecord.voteAmount = 0
      }
      this.$apollo
        .mutate({
          mutation: UPDATE_EVENT_USER,
          variables: { input: this.eventUserRecord }
        })
        .then(() => {
          addSuccessMessage(
            'Erfolg',
            'Der Nutzer wurde erfolgreich geupdated. '
          )
          this.$router.push({ name: 'MemberList' })
        })
        .catch(error => {
          addDangerMessage(
            'Fehler',
            'User konnte nicht geupdated werden. Für mehr Informationen lohnt ein Blick in die Console.'
          )
          console.error(error)
        })
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
