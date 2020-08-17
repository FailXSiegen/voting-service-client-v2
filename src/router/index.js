import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLogin from '@/views/Login'
import AppDashboard from '@/views/admin/Dashboard'
import AppEvents from '@/views/admin/Events'
import AppProfile from '@/views/admin/Profile'
import AppMemberlist from '@/views/event/Memberlist'
import AppPolls from '@/views/event/Polls'
import AppWaitingroom from '@/views/event/Waitingroom'
import AppResults from '@/views/event/Results'
import AppUser from '@/views/User'
// import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: AppLogin
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AppDashboard
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/events',
    name: 'Events',
    component: AppEvents
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/profile',
    name: 'Profile',
    component: AppProfile
    // meta: { requiresAuth: true }
  },
  {
    path: '/event',
    name: 'Memberlist',
    component: AppMemberlist
    // meta: { requiresAuth: true }
  },
  {
    path: '/event/polls',
    name: 'Polls',
    component: AppPolls
    // meta: { requiresAuth: true }
  },
  {
    path: '/event/waitingroom',
    name: 'Waitingroom',
    component: AppWaitingroom
    // meta: { requiresAuth: true }
  },
  {
    path: '/event/results',
    name: 'Results',
    component: AppResults
    // meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    component: AppUser
    // meta: { requiresAuth: true }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// router.beforeEach((to, from, next) => {
//   // Check if the user is logged i
//   const isUserLoggedIn = store.getters.isAuthenticated
//   console.log(store.state)
//   if (to.matched.some(record => record.meta.requiresAuth)) {
//     if (!isUserLoggedIn) {
//       store.dispatch('logOut')
//       next({
//         path: '/login',
//         query: { redirect: to.fullPath }
//       })
//     } else {
//       next()
//     }
//   } else {
//     next()
//   }
// })

export default router
