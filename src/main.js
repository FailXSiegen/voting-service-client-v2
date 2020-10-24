import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import apolloProvider from '@/vue-apollo.js'
import 'bootstrap'
import '@/assets/scss/main.scss'
import 'bootstrap-icons-font/dist/bootstrap-icons-font.css'
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
