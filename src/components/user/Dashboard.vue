<template>
  <section class="user-dashboard-container">
    <div v-if="eventUser" class="container position-relative bg-white min-vh-100">
      <div v-if="!eventUser.verified" class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12 text-center">
          <i class="bi-arrow-repeat bi--spin bi--4xl mb-3"></i>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <h2>{{ localize('view.user.pending.loggedInAs') }} {{ eventUser.username }}</h2>
          <p>{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12">
          <h1>{{ eventRecord.title }}</h1>
          <h2>{{ localize('view.user.verified.welcome') }} {{ eventUser.publicName }} <small>{{ eventUser.username }}</small></h2>
          <hr>
          <p v-if="eventRecord.description">{{ eventRecord.description }}</p>
          <hr>
          <div class="container-poll-status">
            <div class="container-active-poll text-center alert alert-primary" role="alert" v-if="existActivePoll">
              <i class="bi-arrow-repeat bi--spin bi--4xl my-3"></i>
              <p v-html="localize('view.user.verified.activePoll')">{{ localize('view.user.verified.activePoll') }}</p>
            </div>
            <div class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center" role="alert"  v-else>
              <p class="mb-0">{{ localize('view.user.verified.noActivePoll') }}</p>
            </div>
          </div>
          <div class="container-poll-result mt-3" v-if="pollResult">
            <hr>
            <app-results :pollResult="pollResult" :eventRecord="eventRecord" />
          </div>
          <app-modal-poll v-if="pollState === 'new' && eventUser.allowToVote"
                          :identifier="'poll' + poll.id"
                          :poll="poll"
                          :voteAmount="eventUser.voteAmount"
                          :trigger="openModal"
                          @onSubmitPoll="submitPoll"
          />

        </div>
      </div>
      <button @click="onLogout" class="logout btn btn-danger py-2 d-flex align-items-center">
        <i class="mr-3 bi bi-x-square bi--2xl"></i> {{ localize('navigation.logOut') }}
      </button>
    </div>

  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { POLL_LIFE_CYCLE_SUBSCRIPTION, UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION } from '@/graphql/subscriptions'
import { EVENT_USER_BY_ID, POLLS_RESULTS } from '@/graphql/queries'
import AppModalPoll from '@/components/modal/Poll'
import AppResults from '@/components/events/event/ResultsListing'
import { onLogout as apolloOnLogout } from '@/vue-apollo'
import { CREATE_POLL_SUBMIT_ANSWER } from '@/graphql/mutations'

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
          eventId: this.eventRecord.id
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
        }
      },
      pollLifeCycle: {
        query: POLL_LIFE_CYCLE_SUBSCRIPTION,
        result ({ data }) {
          this.poll = data.pollLifeCycle.poll
          this.pollState = data.pollLifeCycle.state
          this.pollResultId = data.pollLifeCycle.pollResultId
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
      pollResult: []
    }
  },
  computed: {
    existActivePoll () {
      return (this.poll && this.pollState !== 'closed')
    }
  },
  methods: {
    async onLogout () {
      await apolloOnLogout(this.$apollo.provider.defaultClient)
      await this.$router.push({ name: 'Login' })
    },
    submitPoll (pollSubmitAnswerInput) {
      pollSubmitAnswerInput.pollResultId = this.pollResultId
      delete pollSubmitAnswerInput.answerContentArray
      this.$apollo.mutate({
        mutation: CREATE_POLL_SUBMIT_ANSWER,
        variables: {
          input: pollSubmitAnswerInput
        }
      }).then((response) => {
        this.pollState = 'vote'
      }).catch((error) => {
        console.error(error)
      })
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
