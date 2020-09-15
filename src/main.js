import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons-font/dist/bootstrap-icons-font.min.css'
import { createProvider } from '@/vue-apollo'

Vue.config.productionTip = false

export const apolloProvider = createProvider()

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
