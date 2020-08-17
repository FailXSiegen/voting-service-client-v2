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
    alerts: []
  },
  getters: {},
  mutations: {},
  actions: {}
})
