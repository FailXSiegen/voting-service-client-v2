<template>
  <div class="polls-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation v-if="eventUsers" :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-6 col-lg-4 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr>
        <app-active-poll v-if="activePoll" :activePoll="activePoll" :activePollAnswerCount="activePollAnswerCount" :activePollMaxAnswer="activePollMaxAnswer"
                         @onCloseActivePoll="stopPoll" />
        <div class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center" role="alert" v-if="!activePoll">
          <p class="mb-0">{{ localize('view.user.verified.noActivePoll') }}</p>
        </div>
        <hr v-if="pollsWithNoResults">
        <app-polls :pollsWithNoResults="pollsWithNoResults"
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

import AppNavigation from '@/components/events/event/Navigation'
import AppPolls from '@/components/events/event/Polls'
import AppActivePoll from '@/components/events/event/polls/ActivePoll'
import { localize } from '@/helper/localization-helper'
import { fetchEventBySlug } from '@/api/event'
import { EVENT_USERS_BY_EVENT, POLLS_NO_RESULTS, ACTIVE_POLL } from '@/graphql/queries'
import { CREATE_POLL, REMOVE_POLL, START_POLL, STOP_POLL } from '@/graphql/mutations'
import {
  NEW_EVENT_USER_SUBSCRIPTION,
  POLL_ANSWER_LIVE_CYCLE_SUBSCRIPTION,
  POLL_LIFE_CYCLE_SUBSCRIPTION
} from '@/graphql/subscriptions'

export default {
  async created () {
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
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
      pollAnswerLifeCycle: {
        query: POLL_ANSWER_LIVE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          this.activePollAnswerCount = data.pollAnswerLifeCycle.pollAnswersCount
          this.activePollMaxAnswer = data.pollAnswerLifeCycle.maxVotes
        }
      },
      pollLifeCycle: {
        query: POLL_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          if (data.pollLifeCycle.state === 'closed') {
            this.activePoll = undefined
          }
        }
      }
    }
  },
  data () {
    return {
      headline: 'Umfragen',
      eventRecord: {},
      eventUsers: [],
      pollsWithNoResults: [],
      activePoll: undefined,
      activePollAnswerCount: 0,
      activePollMaxAnswer: 0
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    createPoll (poll, instantStart) {
      delete poll.pollAnswer
      delete poll.list
      // @todo Don't start if there is an activePoll Object | set instantStart to false?
      this.$apollo.mutate({
        mutation: CREATE_POLL,
        variables: { input: poll, instantStart: instantStart }
      }).then((response) => {
        const createdPoll = response.data.createPoll
        if (!instantStart) {
          if (!this.pollsWithNoResults) {
            this.pollsWithNoResults = [createdPoll]
          } else {
            this.pollsWithNoResults.push(createdPoll)
          }
        } else {
          this.$apollo.queries.activePoll.refetch()
        }
      }
      ).catch((error) => {
        console.error(error)
      })
    },
    removePoll (pollId) {
      this.$apollo.mutate({
        mutation: REMOVE_POLL,
        variables: { pollId }
      }).then(() => {
        this.removePollFromNoResultList(pollId)
      }).catch((error) => {
        console.error(error)
      })
    },
    startPoll (pollId) {
      this.$apollo.mutate({
        mutation: START_POLL,
        variables: { pollId }
      }).then((response) => {
        this.removePollFromNoResultList(response.data.startPoll.id)
        this.$apollo.queries.activePoll.refetch()
      }).catch((error) => {
        console.error(error)
      })
    },
    stopPoll () {
      this.$apollo.mutate({
        mutation: STOP_POLL,
        variables: { id: this.activePoll.id }
      }).then((response) => {
        if (response.data.stopPoll) {
          this.activePoll = undefined
        } else {
          console.log('Could not close poll')
        }
      }).catch((error) => {
        console.error(error)
      })
    },
    removePollFromNoResultList (pollId) {
      const removeIndex = this.pollsWithNoResults.map(item => item.id).indexOf(pollId)
      this.pollsWithNoResults.splice(removeIndex, 1)
    }
  }
}
</script>
