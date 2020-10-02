import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons-font/dist/bootstrap-icons-font.min.css'
import apolloProvider from '@/vue-apollo.js'

Vue.config.productionTip = false

// Fetch user data, if present.
store.dispatch('extractUserData').catch((error) => {
  console.error(error)
})

new Vue({
  router,
  store,
  apolloProvider,
  render: h => h(App)
}).$mount('#app')
