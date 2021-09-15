<template>
  <section class="user-dashboard-container">
    <slot name="alerts"></slot>
    <div
      v-if="overlayError"
      id="overlay"
      class="h-100 w-100 position-fixed d-flex align-items-center align-content-center justify-content-center text-center"
    >
      <span class="content alert alert-danger">
        <h1>Serververbindung unterbrochen</h1>
        <button
          @click="reloadPage"
          class="btn-lg btn btn-info py-2 d-print-none"
        >
          <i class="mr-3 bi bi-arrow-repeat bi--1xl"></i>
          {{ localize('navigation.reload') }}
        </button>
      </span>
    </div>
    <div
      v-if="eventUser"
      class="container position-relative bg-white min-vh-100 pt-5 pt-md-0"
    >
      <div
        v-if="!eventUser.verified"
        class="row min-vh-100 justify-content-center align-items-center d-print-none"
      >
        <div class="col-12 text-center">
          <div
            class="spinner-border mb-5"
            style="width: 3rem; height: 3rem;"
            role="status"
          >
            <span class="sr-only">Loading...</span>
          </div>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <h2>
            {{ localize('view.user.pending.loggedInAs') }}
            {{ eventUser.username }}
          </h2>
          <p class="alert alert-info w-auto d-inline-block mt-2">
            {{ localize('view.user.pending.bodyText') }}
          </p>
        </div>
      </div>
      <div
        v-else
        class="row min-vh-100 justify-content-center align-items-center pt-5 pt-md-0"
      >
        <div class="col-12">
          <h1>{{ eventRecord.title }}</h1>
          <h2>
            {{ localize('view.user.verified.welcome') }}
            {{ eventUser.publicName }}
          </h2>
          <p id="userInformation">
            {{ eventUser.username }} -
            <span class="text-success small" v-if="eventUser.allowToVote">
              {{ localize('view.event.user.member') }}</span
            >
            <span class="text-info small" v-else>{{
              localize('view.event.user.visitor')
            }}</span>
            <span v-if="eventUser.allowToVote">
              | Anzahl Stimmen: {{ eventUser.voteAmount }}</span
            >
            <span> | Status: </span>
            <span
              class="badge badge-success badge-pill status-indicator"
              v-if="eventUser.online"
              >online</span
            >
            <span class="badge badge-danger badge-pill status-indicator" v-else
              >offline</span
            >
          </p>
          <hr class="d-print-none" />
          <p class="d-print-none" v-if="eventRecord.description">
            {{ eventRecord.description }}
          </p>
          <hr v-if="!openMeeting && eventRecord.meeting.credentials" />

          <button
            @click.prevent="onJoinMeeting"
            v-if="!openMeeting && eventRecord.meeting.credentials"
            class="btn btn-primary"
          >
            An Videokonferenz teilnehmen
          </button>

          <div
            class="meeting"
            v-if="openMeeting && eventRecord.meeting.credentials"
          >
            <div class="container-zoom">
              <div id="zoom-hook"></div>
              <ZoomFrame
                v-if="eventRecord.meeting.credentials"
                :apiKey="eventRecord.meeting.apiKey"
                :apiSecret="eventRecord.meeting.apiSecret"
                :nickname="eventUser.publicName"
                :meetingId="eventRecord.meeting.credentials.id"
                :password="eventRecord.meeting.credentials.password"
                :returnUrl="eventRecord.slug"
              />
              <div
                class="btn btn-primary position-fixed sticky-top mt-2"
                @click.prevent="onToggleVideoConference"
                title="Ansicht wechseln"
              >
                <i class="bi bi-arrow-repeat bi--2xl"></i>
              </div>
            </div>
          </div>

          <hr v-if="!openMeeting && eventRecord.meeting.credentials" />
          <hr class="d-print-none" />
          <div class="container-poll-status d-print-none">
            <div
              class="container-poll-voted text-center alert alert-success"
              v-if="this.pollState === 'voted'"
            >
              <i class="bi-check bi--4xl my-3"></i>
              <h2 v-html="localize('view.user.verified.voted')">
                {{ localize('view.user.verified.voted') }}
              </h2>
            </div>
            <div
              class="container-active-poll text-center alert alert-primary"
              role="alert"
              v-if="existActivePoll"
            >
              <i class="bi-arrow-repeat bi--spin bi--4xl my-3"></i>
              <p v-html="localize('view.user.verified.activePoll')">
                {{ localize('view.user.verified.activePoll') }}
              </p>
            </div>
            <div
              class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center"
              role="alert"
              v-else
            >
              <p class="mb-0">
                {{ localize('view.user.verified.noActivePoll') }}
              </p>
            </div>
          </div>
          <div class="container-poll-result mt-3" v-if="pollResult">
            <hr class="d-print-none" />
            <app-results :pollResult="pollResult" :eventRecord="eventRecord" />
          </div>
          <app-modal-poll
            v-if="pollState === 'new' && eventUser.allowToVote"
            :identifier="'poll' + poll.id"
            :poll="poll"
            :multivoteType="eventRecord.multivoteType"
            :voteAmount="eventUser.voteAmount"
            :trigger="openModal"
            @onSubmitPoll="submitPoll"
            ref="pollModal"
          />
          <app-modal-poll-result
            v-if="lastPollResult && pollState === 'closed'"
            :identifier="'pollResult' + lastPollResult.id"
            :pollResult="lastPollResult"
            :eventRecord="eventRecord"
            :trigger="openModalResult"
            ref="pollResultModal"
            @onCloseResultModal="closeResultModal"
          />
          <button
            v-if="showMoreEnabled && pollResult"
            class="btn btn-info my-3 mx-auto py-2 d-flex align-items-center d-print-none"
            @click="showMorePollResults"
          >
            <i class="mr-3 bi bi-plus-square-fill bi--2xl"></i>
            {{ localize('view.results.showMore') }}
          </button>
          <p v-if="!showMoreEnabled">
            {{ localize('view.results.noMoreResults') }}
          </p>
        </div>
      </div>
      <button
        @click="onLogout"
        class="logout btn btn-danger py-2 d-flex align-items-center d-print-none"
      >
        <i class="mr-3 bi bi-x-square bi--2xl"></i>
        {{ localize('navigation.logOut') }}
      </button>
      <button
        @click="reloadPage"
        class="reload btn btn-info py-2 d-flex align-items-center d-print-none"
      >
        <i class="mr-3 bi bi-arrow-repeat bi--1xl"></i>
        {{ localize('navigation.reload') }}
      </button>
    </div>
  </section>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import {
  addDangerMessage,
  addSuccessMessage,
  addWarnMessage
} from '@/frame/lib/alert-helper'
import {
  POLL_LIFE_CYCLE_SUBSCRIPTION,
  UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'
import { POLLS_RESULTS } from '@/frame/api/graphql/gql/queries'
import {
  ACTIVE_POLL_EVENT_USER,
  EVENT_USER_BY_ID
} from '@/user/api/graphql/gql/queries'
import AppModalPoll from '@/user/components/modal/Poll'
import AppModalPollResult from '@/user/components/modal/PollResult'
import AppResults from '@/organizer/components/events/detail/ResultsListing'
import { onLogout as apolloOnLogout, wsLink } from '@/vue-apollo'
import { CREATE_POLL_SUBMIT_ANSWER } from '@/user/api/graphql/gql/mutations'
import $ from 'jquery'
import ZoomFrame from '@/user/components/video-conference/ZoomFrame.vue'

export default {
  components: {
    AppModalPoll,
    AppModalPollResult,
    AppResults,
    ZoomFrame
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
      variables () {
        return {
          id: this.$store.getters.getCurrentUserId
        }
      },
      result ({ data }) {
        if (data === 'undefined') {
          this.onLogout()
        }
        if (parseInt(data.eventUser.eventId) !== this.eventRecord.id) {
          this.onLogout()
          addWarnMessage(
            'Achtung',
            'Es liegt ein Fehler vor. Bitte melden Sie sich ab und danach wieder neu ein.'
          )
        }
      }
    },
    activePollEventUser: {
      query: ACTIVE_POLL_EVENT_USER,
      variables () {
        return {
          eventId: this.eventRecord.id
        }
      },
      result ({ data }) {
        if (
          data.activePollEventUser &&
          data.activePollEventUser.poll &&
          data.activePollEventUser.pollUserVoted.findIndex(
            x => x.eventUserId === this.eventUser.id
          ) === -1
        ) {
          this.poll = data.activePollEventUser.poll
          this.pollState = data.activePollEventUser.state
          this.pollResultId = data.activePollEventUser.pollResultId
          this.voteCounter = 1
        } else if (data.activePollEventUser && data.activePollEventUser.poll) {
          this.poll = 'voted'
        }
      }
    },
    pollResult: {
      query: POLLS_RESULTS,
      variables () {
        return {
          eventId: this.eventRecord.id,
          page: 0,
          pageSize: 1
        }
      },
      result ({ data }) {
        if (data.pollResult && data.pollResult.length > 0) {
          this.lastPollResult = data.pollResult[0]
        }
        if (data.pollResult && data.pollResult.length === 1) {
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
          this.eventUser.allowToVote =
            data.updateEventUserAccessRights.allowToVote
          this.eventUser.voteAmount =
            data.updateEventUserAccessRights.voteAmount
          addSuccessMessage(
            'Statusänderung',
            '<p>Ihr Status wurde aktualisiert</p><a class="btn btn-primary btn-block my-3" id="anchorLink" href="#">Änderung anschauen</a>'
          )
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
          if (data.pollLifeCycle.poll) {
            if (
              typeof this.eventUser.id === 'undefined' ||
              isNaN(this.eventUser.id)
            ) {
              this.reloadPage()
            }

            if (this.$refs.pollModal) {
              this.$refs.pollModal.close()
            }
            this.poll = data.pollLifeCycle.poll
          }
          if (data.pollLifeCycle.pollResultId) {
            this.pollResultId = data.pollLifeCycle.pollResultId
          }
          if (data.pollLifeCycle.state === 'closed') {
            if (this.openMeeting) {
              this.openModalResult = true
            }
            this.$apollo.queries.pollResult.refetch()
            this.showMoreEnabled = true
            this.page = 0
            this.voteCounter = 1
            if (this.$refs.pollModal) {
              this.$refs.pollModal.close()
            }
          }
          this.pollState = data.pollLifeCycle.state
        }
      }
    }
  },
  created () {
    document.title = 'digitalwahl.org'
  },
  mounted () {
    const self = this
    wsLink.subscriptionClient.on('disconnected', () => {
      self.overlayError = true
      self.eventUser.online = false
    })
    wsLink.subscriptionClient.on('connected', () => {
      self.overlayError = false
      self.eventUser.online = true
    })
    wsLink.subscriptionClient.on('reconnected', () => {
      self.overlayError = false
      self.eventUser.online = true
    })
    $(function () {
      $('body, html').on('click', '#anchorLink', function () {
        $([document.documentElement, document.body]).animate(
          {
            scrollTop: $('#userInformation').offset().top - 110
          },
          200,
          function () {
            $('#userInformation').addClass('pulse')
            setTimeout(function () {
              $('#userInformation').removeClass('pulse')
            }, 3000)
          }
        )
      })
    })
  },
  data () {
    return {
      eventUser: null,
      poll: null,
      pollResultId: null,
      openModal: true,
      openModalResult: false,
      pollState: 'closed',
      activePollEventUser: {},
      pollResult: [],
      lastPollResult: {},
      page: 0,
      pageSize: 10,
      showMoreEnabled: false,
      voteCounter: 1,
      overlayError: false,
      openMeeting: false,
      dashboardForeground: false
    }
  },
  computed: {
    existActivePoll () {
      return this.poll && this.pollState !== 'closed'
    }
  },
  methods: {
    closeResultModal () {
      this.openModalResult = false
    },
    showMorePollResults () {
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
          if (!Array.isArray(newResults)) {
            return false
          }
          this.showMoreEnabled = true
          if (this.page === 0) {
            newResults.shift()
          }
          this.pollResult.push(...newResults)
          if (newResults.length < this.pageSize) {
            this.showMoreEnabled = false
          }
          this.page++
          return true
        }
      })
    },
    async onLogout () {
      await apolloOnLogout(this.$apollo.provider.defaultClient)
      if (this.eventRecord.slug) {
        this.eventUser = {}
        window.location = '/' + this.eventRecord.slug
      } else {
        this.eventUser = {}
        window.location = '/'
      }
    },
    async reloadPage () {
      location.reload()
    },
    async submitPoll (pollSubmitAnswerInput) {
      pollSubmitAnswerInput.pollResultId = this.pollResultId
      const answer = {}
      Object.assign(answer, pollSubmitAnswerInput)
      let answerCounter = 1
      if (
        pollSubmitAnswerInput.answerContents &&
        pollSubmitAnswerInput.answerContents.length > 0
      ) {
        for await (const pollAnswer of pollSubmitAnswerInput.answerContents) {
          const multipleAnswer = {}
          Object.assign(multipleAnswer, pollSubmitAnswerInput)
          multipleAnswer.answerContent = pollAnswer
          multipleAnswer.possibleAnswerId = null
          multipleAnswer.voteCycle = this.voteCounter
          multipleAnswer.answerItemLength =
            pollSubmitAnswerInput.answerContents.length
          multipleAnswer.answerItemCount = answerCounter
          delete multipleAnswer.answerContents
          delete multipleAnswer.possibleAnswerIds
          await this.submitAnswer(
            multipleAnswer,
            answerCounter,
            this.voteCounter
          )
          answerCounter++
        }
      } else {
        delete answer.answerContents
        delete answer.possibleAnswerIds
        answer.answerItemLength = 1
        answer.answerItemCount = 1
        await this.submitAnswer(answer, answerCounter, this.voteCounter)
      }
      this.voteCounter++
    },
    async submitAnswer (answer, answerCounter, voteCounter) {
      this.$apollo
        .mutate({
          mutation: CREATE_POLL_SUBMIT_ANSWER,
          variables: {
            input: answer
          }
        })
        .then(response => {
          if (
            voteCounter === this.eventUser.voteAmount ||
            this.eventRecord.multivoteType === 2 ||
            answer.multivote
          ) {
            if (this.pollState === 'new') {
              this.pollState = 'voted'
            }
            this.voteCounter = 1
          }
        })
        .catch(error => {
          addDangerMessage('Fehler', 'Die Stimmenabgabe war nicht erfolgreich')
          console.error(error)
        })
    },
    onJoinMeeting () {
      this.openMeeting = true
    },
    onToggleVideoConference () {
      if (!this.dashboardForeground) {
        $('body').addClass('zoom-hidden')
        $('#zmmtg-root')
          .addClass('hidden')
          .hide()
      } else {
        $('body').addClass('zoom-show')
        $('#zmmtg-root')
          .removeClass('hidden')
          .show()
      }
      this.dashboardForeground = !this.dashboardForeground
    },
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
<style scoped>
#overlay {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.logout {
  position: absolute;
  top: 15px;
  right: 15px;
}

.reload {
  position: absolute;
  top: 75px;
  right: 15px;
}

.pulse {
  background: rgba(23, 162, 184, 0.15);
  box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.5);
  transform: scale(1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.4);
  }
  30% {
    transform: scale(0.99);
    box-shadow: 0 0 0 10px rgba(23, 162, 184, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0);
  }
}

.container-zoom {
  width: 70%;
  height: 100%;
}
</style>
