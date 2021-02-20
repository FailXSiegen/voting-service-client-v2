import AppNavigation from '@/organizer/components/events/detail/Navigation'
import AppVerifiedUsers from '@/organizer/components/events/detail/VerifiedUsers'
import { localize } from '@/frame/lib/localization-helper'
import { fetchEventBySlug } from '@/user/api/fetch/event'
import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'
import {
  EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
  NEW_EVENT_USER_SUBSCRIPTION,
  UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
} from '@/frame/api/graphql/gql/subscriptions'

export default {
  props: {
    eventSlug: {
      type: String
    }
  },
  components: {
    AppNavigation,
    AppVerifiedUsers
  },
  async created () {
    document.title = 'Teilnehmer - digitalwahl.org'
    const response = await fetchEventBySlug(this.eventSlug)
    if (response === null || response.success === false || response.event.organizerId !== this.$store.getters.getCurrentUserId) {
      await this.$router.push('/admin/events')
    }
    this.eventRecord = response.event
  },
  data () {
    return {
      headline: 'Teilnehmerliste',
      eventRecord: {},
      eventUsers: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
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
      updateEventUserAccessRights: {
        query: UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION,
        result ({ data }) {
          const { eventUserId, eventId, verified, allowToVote, voteAmount } = data.updateEventUserAccessRights
          if (parseInt(eventId) !== this.eventRecord.id) {
            return
          }
          const eventUser = this.eventUsers.find((user) => {
            return user.id === eventUserId
          })
          if (!eventUser) {
            return
          }
          eventUser.verified = verified
          eventUser.allowToVote = allowToVote
          eventUser.voteAmount = voteAmount
        }
      },
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
  computed: {
    verifiedUsers () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified
      })
    },
    verifiedUsersCount () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified
      }).length
    },
    verifiedUsersCountOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online
      }).length
    },
    verifiedUsersCountOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online
      }).length
    },
    verifiedUsersCountAllowToVote () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountAllowToVoteOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountAllowToVoteOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online && eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVote () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVoteOnline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && eventUser.online && !eventUser.allowToVote
      }).length
    },
    verifiedUsersCountNotAllowToVoteOffline () {
      if (!this.eventUsers) {
        return []
      }
      return this.eventUsers.filter((eventUser) => {
        return eventUser.verified && !eventUser.online && !eventUser.allowToVote
      }).length
    },
    verifiedUsersVoteCount () {
      if (!this.eventUsers) {
        return []
      }
      let voteCount = 0
      this.eventUsers.forEach(eventUser => {
        if (eventUser.verified && eventUser.allowToVote) {
          voteCount += eventUser.voteAmount
        }
      })
      return voteCount
    },
    verifiedUsersVoteCountOnline () {
      if (!this.eventUsers) {
        return []
      }
      let voteCount = 0
      this.eventUsers.forEach(eventUser => {
        if (eventUser.verified && eventUser.online && eventUser.allowToVote) {
          voteCount += eventUser.voteAmount
        }
      })
      return voteCount
    },
    verifiedUsersVoteCountOffline () {
      if (!this.eventUsers) {
        return []
      }
      let voteCount = 0
      this.eventUsers.forEach(eventUser => {
        if (eventUser.verified && !eventUser.online && eventUser.allowToVote) {
          voteCount += eventUser.voteAmount
        }
      })
      return voteCount
    }
  }
}
