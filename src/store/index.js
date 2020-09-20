import Vue from 'vue'
import Vuex from 'vuex'
import { AUTH_TOKEN } from '@/vue-apollo'
import { jwtDecode } from '@/lib/jwt-util'
import * as R from 'ramda'

Vue.use(Vuex)

export default new Vuex.Store({
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
        route: '/admin'
      },
      {
        title: 'Veranstaltungen',
        route: '/admin/events'
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
