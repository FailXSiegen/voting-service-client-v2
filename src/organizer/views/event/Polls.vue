<template>
  <div class="polls-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-6 col-lg-4 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr />
        <app-active-poll
          v-if="activePoll"
          :activePoll="activePoll"
          :activePollAnswerCount="activePollAnswerCount"
          :activePollMaxAnswer="activePollMaxAnswer"
          :pollUserCount="pollUserCount"
          :pollUserVotedCount="pollUserVotedCount"
          @onCloseActivePoll="stopPoll"
        />
        <div
          class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center"
          role="alert"
          v-if="!activePoll"
        >
          <p class="mb-0">{{ localize('view.user.verified.noActivePoll') }}</p>
        </div>
        <span>
          Aktuelle Anzahl wahlberechtigter Teilnehmer:
          {{ verifiedUsersCountAllowToVoteOnline }}
        </span>
        <hr v-if="pollsWithNoResults" />
        <app-polls
          v-if="!activePoll"
          :pollsWithNoResults="pollsWithNoResults"
          :eventRecord="eventRecord"
          @onCreatePoll="createPoll"
          @onRemovePoll="removePoll"
          @onStartPoll="startPoll"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/events/detail/Navigation'
import AppPolls from '@/organizer/components/events/detail/Polls'
import AppActivePoll from '@/organizer/components/events/detail/polls/ActivePoll'
import { localize } from '@/frame/lib/localization-helper'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import {
  EVENT_USERS_BY_EVENT,
  POLLS_NO_RESULTS,
  ACTIVE_POLL
} from '@/organizer/api/graphql/gql/queries'
import {
  CREATE_POLL,
  REMOVE_POLL,
  START_POLL,
  STOP_POLL
} from '@/organizer/api/graphql/gql/mutations'
import {
  NEW_EVENT_USER_SUBSCRIPTION,
  POLL_ANSWER_LIVE_CYCLE_SUBSCRIPTION,
  POLL_LIFE_CYCLE_SUBSCRIPTION,
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'

export default {
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
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppPolls,
    AppActivePoll
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
    activePoll: {
      fetchPolicy: 'network-only',
      query: ACTIVE_POLL,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      }
    },
    pollsWithNoResults: {
      fetchPolicy: 'network-only',
      query: POLLS_NO_RESULTS,
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
          if (!eventUserFound) {
            this.eventUsers.push({ ...data.eventUserLifeCycle })
          }
        }
      },
      pollAnswerLifeCycle: {
        query: POLL_ANSWER_LIVE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          this.activePollAnswerCount = data.pollAnswerLifeCycle.pollAnswersCount
          this.activePollMaxAnswer = data.pollAnswerLifeCycle.maxVotes
          this.pollUserCount = data.pollAnswerLifeCycle.pollUserCount
          this.pollUserVotedCount = data.pollAnswerLifeCycle.pollUserVotedCount
        }
      },
      pollLifeCycle: {
        query: POLL_LIFE_CYCLE_SUBSCRIPTION,
        variables () {
          return {
            eventId: this.eventRecord.id
          }
        },
        result ({ data }) {
          if (
            data.pollLifeCycle.poll &&
            data.pollLifeCycle.state !== 'closed'
          ) {
            this.activePoll = data.pollLifeCycle.poll
          }
          if (data.pollLifeCycle.state === 'closed') {
            this.activePoll = undefined
          }
        }
      }
    }
  },
  data () {
    return {
      headline: 'Abstimmungen',
      eventRecord: {},
      eventUsers: [],
      pollsWithNoResults: [],
      activePoll: undefined,
      activePollAnswerCount: 0,
      activePollMaxAnswer: 0,
      pollUserCount: 0,
      pollUserVotedCount: 0
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    createPoll (poll, instantStart) {
      if (this.activePoll) {
        addDangerMessage('Fehler', 'Es wird eine Abstimmung durchgeführt')
        return false
      }
      delete poll.pollAnswer
      delete poll.list
      // @todo Don't start if there is an activePoll Object | set instantStart to false?
      this.$apollo
        .mutate({
          mutation: CREATE_POLL,
          variables: { input: poll, instantStart: instantStart }
        })
        .then(response => {
          const createdPoll = response.data.createPoll
          if (!instantStart) {
            if (!this.pollsWithNoResults) {
              this.pollsWithNoResults = [createdPoll]
            } else {
              this.pollsWithNoResults.push(createdPoll)
            }
            addSuccessMessage('Erfolg', 'Abstimmung erfolgreich erstellt')
          } else {
            this.$apollo.queries.activePoll.refetch()
          }
        })
        .catch(error => {
          console.error(error)
        })
    },
    removePoll (pollId) {
      this.$apollo
        .mutate({
          mutation: REMOVE_POLL,
          variables: { pollId }
        })
        .then(() => {
          this.removePollFromNoResultList(pollId)
        })
        .catch(error => {
          console.error(error)
        })
    },
    startPoll (pollId) {
      this.$apollo
        .mutate({
          mutation: START_POLL,
          variables: { pollId }
        })
        .then(response => {
          this.removePollFromNoResultList(response.data.startPoll.id)
          this.$apollo.queries.activePoll.refetch()
        })
        .catch(error => {
          console.error(error)
        })
    },
    stopPoll () {
      this.$apollo
        .mutate({
          mutation: STOP_POLL,
          variables: { id: this.activePoll.id }
        })
        .then(response => {
          if (response.data.stopPoll) {
            location.reload()
          } else {
            console.log('Could not close poll')
          }
        })
        .catch(error => {
          console.error(error)
        })
    },
    removePollFromNoResultList (pollId) {
      const removeIndex = this.pollsWithNoResults
        .map(item => item.id)
        .indexOf(pollId)
      this.pollsWithNoResults.splice(removeIndex, 1)
    }
  },
  computed: {
    verifiedUsersCountAllowToVoteOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter(eventUser => {
        return eventUser.verified && eventUser.online && eventUser.allowToVote
      }).length
    }
  }
}
</script>
