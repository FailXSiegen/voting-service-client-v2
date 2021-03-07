import Vue from 'vue'
import Vuex from 'vuex'
import { AUTH_TOKEN } from '@/vue-apollo'
import { jwtDecode } from '@/frame/lib/jwt-util'
import * as R from 'ramda'
import moduleOrganizer from '@/organizer/store/organizer'
import moduleUser from '@/user/store/user'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    organizer: moduleOrganizer,
    user: moduleUser
  },
  state: {
    language: 'de_DE',
    currentUser: {
      type: null,
      id: null,
      role: null,
      verified: null
    },
    views: [
      {
        title: 'Übersicht',
        icon: 'bi-calendar4-week',
        route: '/admin',
        superAdmin: false
      },
      {
        title: 'Veranstaltungen',
        icon: 'bi-card-list',
        route: '/admin/events',
        superAdmin: false
      },
      {
        title: 'Organisatoren',
        icon: 'bi-people-fill',
        route: '/admin/organizers',
        superAdmin: true
      },
      {
        title: 'Alle Veranstaltungen',
        icon: 'bi-calendar2-range-fill',
        route: '/admin/organizer/allevents',
        superAdmin: true
      }
    ],
    pagination: {
      itemsPerPage: 2,
      maximumNumberOfLinks: 5
    },
    alerts: [],
    users: []
  },
  getters: {
    verifiedUsers: state => {
      return state.users.filter(user => user.verified)
    },
    pendingUsers: state => {
      return state.users.filter(user => !user.verified)
    },
    isLoggedIn: (state, getters) => {
      return getters.getCurrentUserId > 0
    },
    getCurrentUserId: state => {
      return R.path(['currentUser', 'id'], state)
    },
    getCurrentUserRole: state => {
      return R.path(['currentUser', 'role'], state)
    },
    isCurrentUserVerfied: state => {
      return R.path(['currentUser', 'verified'], state)
    }
  },
  mutations: {
    extractUserData (state) {
      // @TODO fetch token by memory/store
      const token = localStorage.getItem(AUTH_TOKEN)
      if (!(typeof token === 'string') || token.length === 0) {
        return
      }
      const decodedToken = jwtDecode(token)
      state.currentUser = {
        type: R.path(['payload', 'user', 'type'], decodedToken),
        id: R.path(['payload', 'user', 'id'], decodedToken),
        role: R.path(['payload', 'role'], decodedToken),
        verified: R.path(['payload', 'user', 'verified'], decodedToken)
      }
    }
  },
  actions: {
    extractUserData (context) {
      context.commit('extractUserData')
    }
  }
})
