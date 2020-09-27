<template>
  <section class="user-dashboard-container">
    <div v-if="eventUser" class="container bg-white min-vh-100">
      <div v-if="!eventUser.verified" class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12 text-center">
          <i class="bi-arrow-repeat bi--spin bi--4xl mb-3"></i>
          <h1>{{ localize('view.user.pending.tankYou') }}</h1>
          <p>{{ localize('view.user.pending.bodyText') }}</p>
        </div>
      </div>
      <div v-else class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-12">
          <h1>{{ eventRecord.title }}</h1>
          <h2>{{ localize('view.user.verified.welcome') }} {{ eventUser.publicName }}</h2>
          <hr />
          <p v-if="eventRecord.description">{{ eventRecord.description }}</p>
          <app-modal-poll v-if="pollState === 'new' && eventUser.allowToVote"
                          :identifier="'poll' + poll.id"
                          :poll="poll"
                          :voteAmount="eventUser.voteAmount"
                          :trigger="openModal"
                          @onSubmitPoll="submitPoll"
          />
          <button @click="onLogout" class="logout btn btn-danger py-3 d-flex align-items-center">
            <i class="mr-3 bi bi-x-square bi--2xl"></i> {{ localize('navigation.logOut') }}
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { POLL_LIFE_CYCLE_SUBSCRIPTION, UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION } from '@/graphql/subscriptions'
import { EVENT_USER_BY_ID } from '@/graphql/queries'
import AppModalPoll from '@/components/modal/Poll'
import { onLogout as apolloOnLogout } from '@/vue-apollo'
import { CREATE_POLL_SUBMIT_ANSWER } from '@/graphql/mutations'

export default {
  components: {
    AppModalPoll
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
      pollState: ''
    }
  },
  methods: {
    async onLogout () {
      await apolloOnLogout(this.$apollo.provider.defaultClient)
      await this.$router.push({ name: 'Login' })
    },
    submitPoll (pollSubmitAnswer) {
      pollSubmitAnswer.pollResultId = this.pollResultId
      delete pollSubmitAnswer.answerContentArray
      this.$apollo.mutate({
        mutation: CREATE_POLL_SUBMIT_ANSWER,
        variables: {
          input: pollSubmitAnswer
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
