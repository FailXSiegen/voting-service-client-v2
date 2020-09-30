<template>
  <section class="user-dashboard-container">
    <slot name="alerts"></slot>
    <div v-if="eventUser" class="container position-relative bg-white min-vh-100 pt-5 pt-md-0">
      <div v-if="!eventUser.verified" class="row min-vh-100 justify-content-center align-items-center d-print-none">
        <div class="col-12 text-center">
          <div class="spinner-border mb-5" style="width: 3rem; height: 3rem;" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <h2>{{ localize('view.user.pending.loggedInAs') }} {{ eventUser.username }}</h2>
          <p class="alert alert-info w-auto d-inline-block mt-2">{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center pt-5 pt-md-0">
        <div class="col-12">
          <h1>{{ eventRecord.title }}</h1>
          <h2>{{ localize('view.user.verified.welcome') }} {{ eventUser.publicName }}</h2>
          <p>{{ eventUser.username }} - <span class="text-success small" v-if="eventUser.allowToVote">{{ localize('view.event.user.member') }}</span> <span class="text-info small" v-else>{{ localize('view.event.user.visitor') }}</span>
            <span v-if="eventUser.allowToVote"> | Anzahl Stimmen: {{ eventUser.voteAmount }}</span>
            <span> | Status: </span>
            <span class="badge badge-success badge-pill status-indicator" v-if="eventUser.online">online</span>
            <span class="badge badge-danger badge-pill status-indicator" v-else>offline</span>
          </p>
          <hr class="d-print-none">
          <p class="d-print-none" v-if="eventRecord.description">{{ eventRecord.description }}</p>
          <hr class="d-print-none">
          <div class="container-poll-status d-print-none">
            <div class="container-poll-voted text-center alert alert-success" v-if="this.pollState === 'voted'">
              <i class="bi-check bi--4xl my-3"></i>
              <h2 v-html="localize('view.user.verified.voted')">{{ localize('view.user.verified.voted') }}</h2>
            </div>
            <div class="container-active-poll text-center alert alert-primary" role="alert" v-if="existActivePoll">
              <i class="bi-arrow-repeat bi--spin bi--4xl my-3"></i>
              <p v-html="localize('view.user.verified.activePoll')">{{ localize('view.user.verified.activePoll') }}</p>
            </div>
            <div class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center" role="alert"  v-else>
              <p class="mb-0">{{ localize('view.user.verified.noActivePoll') }}</p>
            </div>
          </div>
          <div class="container-poll-result mt-3" v-if="pollResult">
            <hr class="d-print-none">
            <app-results :pollResult="pollResult" :eventRecord="eventRecord" />
          </div>
          <app-modal-poll v-if="pollState === 'new' && eventUser.allowToVote"
                          :identifier="'poll' + poll.id"
                          :poll="poll"
                          :voteAmount="eventUser.voteAmount"
                          :trigger="openModal"
                          @onSubmitPoll="submitPoll"
                          ref="pollModal"
          />
          <button v-if="showMoreEnabled && pollResult" class="btn btn-info my-3 mx-auto py-2 d-flex align-items-center d-print-none" @click="showMorePollResults">
            <i class="mr-3 bi bi-plus-square-fill bi--2xl"></i>   {{ localize('view.results.showMore') }}
          </button>
          <p v-if="!showMoreEnabled">{{ localize('view.results.noMoreResults') }}</p>
        </div>
      </div>
      <button @click="onLogout" class="logout btn btn-danger py-2 d-flex align-items-center d-print-none">
        <i class="mr-3 bi bi-x-square bi--2xl"></i> {{ localize('navigation.logOut') }}
      </button>
    </div>
  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { addDangerMessage, addSuccessMessage } from '@/helper/alert-helper'
import { POLL_LIFE_CYCLE_SUBSCRIPTION, UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION } from '@/graphql/subscriptions'
import { EVENT_USER_BY_ID, POLLS_RESULTS } from '@/graphql/queries'
import AppModalPoll from '@/components/modal/Poll'
import AppResults from '@/components/events/event/ResultsListing'
import { onLogout as apolloOnLogout } from '@/vue-apollo'
import { CREATE_POLL_SUBMIT_ANSWER, CREATE_POLL_USER_VOTED } from '@/graphql/mutations'

export default {
  components: {
    AppModalPoll,
    AppResults
  },
  props: {
    eventRecord: {
      type: Object,
      required: true
    }
  },
  apollo: {
    eventUser: {
      query: EVENT_USER_BY_ID,
      pollInterval: 5000,
      variables () {
        return {
          id: this.$store.getters.getCurrentUserId
        }
      }
    },
    pollResult: {
      query: POLLS_RESULTS,
      variables () {
        return {
          eventId: this.eventRecord.id,
          page: 0,
          pageSize: this.pageSize
        }
      },
      result ({ data }) {
        if (data.pollResult && data.pollResult.length === 10) {
          this.showMoreEnabled = true
        }
      }
    },
    $subscribe: {
      updateEventUserAccessRights: {
        query: UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION,
        variables () {
          return {
            eventUserId: this.$store.getters.getCurrentUserId
          }
        },
        result ({ data }) {
          this.eventUser.verified = data.updateEventUserAccessRights.verified
          this.eventUser.allowToVote = data.updateEventUserAccessRights.allowToVote
          this.eventUser.voteAmount = data.updateEventUserAccessRights.voteAmount
          addSuccessMessage('Statusänderung', 'Ihr Status wurde aktualisiert')
        }
      },
      pollLifeCycle: {
        query: POLL_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          if (data.pollLifeCycle.poll) {
            this.poll = data.pollLifeCycle.poll
          }
          if (data.pollLifeCycle.pollResultId) {
            this.pollResultId = data.pollLifeCycle.pollResultId
          }
          if (data.pollLifeCycle.state === 'closed') {
            this.$apollo.queries.pollResult.refetch()
            this.showMoreEnabled = true
            this.page = 1
            if (this.$refs.pollModal) {
              this.$refs.pollModal.close()
            }
          }
          this.pollState = data.pollLifeCycle.state
        }
      }
    }
  },
  data () {
    return {
      eventUser: null,
      poll: null,
      pollResultId: null,
      openModal: true,
      pollState: '',
      pollResult: [],
      page: 0,
      pageSize: 10,
      showMoreEnabled: false
    }
  },
  computed: {
    existActivePoll () {
      return (this.poll && this.pollState !== 'closed')
    }
  },
  created () {
    document.title = 'digitalwahl.org'
  },
  methods: {
    showMorePollResults () {
      this.page++
      // Fetch more data and transform the original result
      this.$apollo.queries.pollResult.fetchMore({
        // New variables
        variables: {
          eventId: this.eventRecord.id,
          page: this.page,
          pageSize: this.pageSize
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newResults = fetchMoreResult.pollResult
          this.showMoreEnabled = true
          this.pollResult.push(...newResults)
          if (newResults.length < this.pageSize) {
            this.showMoreEnabled = false
          }
          return true
        }
      })
    },
    async onLogout () {
      await apolloOnLogout(this.$apollo.provider.defaultClient)
      await this.$router.push({ name: 'Login' })
    },
    submitPoll (pollSubmitAnswerInput) {
      pollSubmitAnswerInput.pollResultId = this.pollResultId
      const pollUserVotedInput = { pollResultId: this.pollResultId, eventUserId: this.eventUser.id, voteCycle: 1 }
      this.$apollo.mutate({
        mutation: CREATE_POLL_USER_VOTED,
        variables: {
          input: pollUserVotedInput
        }
      }).catch((error) => {
        addDangerMessage('Fehler', 'Die Stimmenabgabe war nicht erfolgreich')
        console.error(error)
      })
      if (pollSubmitAnswerInput.answerContents && pollSubmitAnswerInput.answerContents.length > 0) {
        const parentObject = this
        pollSubmitAnswerInput.answerContents.forEach(function (pollAnswer, index) {
          const answer = {}
          Object.assign(answer, pollSubmitAnswerInput)
          answer.answerContent = pollAnswer
          answer.possibleAnswerId = pollSubmitAnswerInput.possibleAnswerIds[index].id
          delete answer.answerContents
          delete answer.possibleAnswerIds
          parentObject.$apollo.mutate({
            mutation: CREATE_POLL_SUBMIT_ANSWER,
            variables: {
              input: answer
            }
          }).then((response) => {
            if (parentObject.voteCounter === parentObject.eventUser.voteAmount && index === pollSubmitAnswerInput.answerContents.length - 1) {
              parentObject.pollState = 'voted'
              parentObject.voteCounter = 1
            }
          }).catch((error) => {
            addDangerMessage('Fehler', 'Die Stimmenabgabe war nicht erfolgreich')
            console.error(error)
          })
        })
      } else {
        delete pollSubmitAnswerInput.answerContents
        delete pollSubmitAnswerInput.possibleAnswerIds
        this.$apollo.mutate({
          mutation: CREATE_POLL_SUBMIT_ANSWER,
          variables: {
            input: pollSubmitAnswerInput
          }
        }).then((response) => {
          if (this.voteCounter === this.eventUser.voteAmount) {
            this.pollState = 'voted'
            this.voteCounter = 1
          }
        }).catch((error) => {
          addDangerMessage('Fehler', 'Die Stimmenabgabe war nicht erfolgreich')
          console.error(error)
        })
      }
    },
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
<style scoped>
 .logout {
   position: absolute;
   top: 15px;
   right: 15px;
 }
</style>
