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
      role: null
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
    users: [
      {
        uid: 1234,
        username: 'habundloot',
        email: 'mo@habundloot.de',
        publicName: 'Moritz Preuß',
        allowToVote: true,
        online: true,
        verified: true,
        eventCoOrganisator: false
      },
      {
        uid: 23456,
        username: '0m3gaC0d3',
        email: 'technoutz@gmail.com',
        publicName: 'Wolf Peterchens Mondfahrt',
        allowToVote: false,
        online: false,
        verified: true,
        eventCoOrganisator: false
      },
      {
        uid: 34567,
        username: 'FailXSiegen',
        email: 'failX@fail2000.com',
        publicName: 'Herr Felix Mann',
        allowToVote: true,
        online: true,
        verified: true,
        eventCoOrganisator: true
      },
      {
        uid: 45678,
        username: 'Testdummy2000',
        email: 'dumm@duemmer.com',
        publicName: 'Pending Test Visitor',
        allowToVote: false,
        online: true,
        verified: true,
        eventCoOrganisator: false
      },
      {
        uid: 45678,
        username: 'Testdummy2000',
        email: 'dumm@duemmer.com',
        publicName: 'Pending Test Member',
        allowToVote: true,
        online: true,
        verified: false,
        eventCoOrganisator: false
      }
    ]
  },
  getters: {
    verifiedUsers: state => {
      return state.users.filter(user => user.verified)
    },
    pendingUsers: state => {
      return state.users.filter(user => !user.verified)
    },
    getCurrentUserId: state => {
      const id = R.path(['currentUser', 'id'], state)
      if (id === null) {
        throw new Error('Could not fetch id from store')
      }
      return id
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
        role: R.path(['payload', 'role'], decodedToken)
      }
    }
  },
  actions: {
    extractUserData (context) {
      context.commit('extractUserData')
    }
  }
})
