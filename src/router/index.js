import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLogin from '@/views/Login'
import AppDashboard from '@/views/admin/Dashboard'
import AppEvents from '@/views/admin/Events'
import AppProfile from '@/views/admin/Profile'
import AppCreateEvent from '@/views/admin/CreateEvent'
import AppUpdateEvent from '@/views/admin/UpdateEvent'
import AppMemberList from '@/views/admin/event/MemberList'
import AppPolls from '@/views/admin/event/Polls'
import AppWaitingRoom from '@/views/admin/event/WaitingRoom'
import AppResults from '@/views/admin/event/Results'
import AppUserEvent from '@/views/user/Event'
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
    path: '/admin/event/new',
    name: 'Create Event',
    component: AppCreateEvent
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/update',
    name: 'updateEvent',
    props: true,
    component: AppUpdateEvent
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/event',
    name: 'MemberList',
    component: AppMemberList
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/polls',
    name: 'Polls',
    component: AppPolls
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/waitingroom',
    name: 'Waiting Room',
    component: AppWaitingRoom
    // meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/results',
    name: 'Results',
    component: AppResults
    // meta: { requiresAuth: true }
  },
  {
    path: '/:eventSlug',
    name: 'Event',
    props: true,
    component: AppUserEvent
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
