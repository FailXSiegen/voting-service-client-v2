import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    language: 'de_DE',
    views: [
      {
        title: 'Dashboard',
        route: '/admin'
      },
      {
        title: 'Events',
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
        eventCoOrganizer: false
      },
      {
        uid: 23456,
        username: '0m3gaC0d3',
        email: 'technoutz@gmail.com',
        publicName: 'Wolf Peterchens Mondfahrt',
        allowToVote: false,
        online: false,
        verified: true,
        eventCoOrganizer: false
      },
      {
        uid: 34567,
        username: 'FailXSiegen',
        email: 'failX@fail2000.com',
        publicName: 'Herr Felix Mann',
        allowToVote: true,
        online: true,
        verified: true,
        eventCoOrganizer: true
      },
      {
        uid: 45678,
        username: 'Testdummy2000',
        email: 'dumm@duemmer.com',
        publicName: 'Pending Test Visitor',
        allowToVote: false,
        online: true,
        verified: false,
        eventCoOrganizer: false
      },
      {
        uid: 45678,
        username: 'Testdummy2000',
        email: 'dumm@duemmer.com',
        publicName: 'Pending Test Member',
        allowToVote: true,
        online: true,
        verified: false,
        eventCoOrganizer: false
      }
    ]
  },
  getters: {},
  mutations: {},
  actions: {}
})
