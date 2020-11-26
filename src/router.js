import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLogin from '@/frame/views/Login'
import AppRegister from '@/frame/views/Register'
import AppDashboard from '@/organizer/views/Dashboard'
import AppEvents from '@/organizer/views/Events'
import AppProfile from '@/organizer/views/Profile'
import AppOrganizers from '@/organizer/views/Organizers'
import AppCreateEvent from '@/organizer/views/CreateEvent'
import AppUpdateEvent from '@/organizer/views/UpdateEvent'
import AppMemberList from '@/organizer/views/event/MemberList'
import AppPolls from '@/organizer/views/event/Polls'
import AppWaitingRoom from '@/organizer/views/event/WaitingRoom'
import AppResults from '@/organizer/views/event/Results'
import AppUserEvent from '@/user/views/Event'
import AppCreateEventUser from '@/organizer/views/event/event-user/CreateEventUser'
import AppUpdateEventUser from '@/organizer/views/event/event-user/UpdateEventUser'
// import store from '@/store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: AppLogin,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register Organizer',
    component: AppRegister,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AppDashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/events',
    name: 'Events',
    component: AppEvents,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/profile',
    name: 'Profile',
    component: AppProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/organizers',
    name: 'Organizers',
    component: AppOrganizers,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/new',
    name: 'CreateEvent',
    component: AppCreateEvent,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/update/:eventSlug',
    name: 'updateEvent',
    props: true,
    component: AppUpdateEvent,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/:eventSlug',
    name: 'MemberList',
    props: true,
    component: AppMemberList,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/eventuser/create/:eventSlug',
    name: 'CreateEventUser',
    props: true,
    component: AppCreateEventUser,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/eventuser/update/:eventSlug',
    name: 'UpdateEventUser',
    props: true,
    component: AppUpdateEventUser,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/polls/:eventSlug',
    name: 'Polls',
    props: true,
    component: AppPolls,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/waitingroom/:eventSlug',
    name: 'WaitingRoom',
    props: true,
    component: AppWaitingRoom,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/event/results/:eventSlug',
    name: 'Results',
    props: true,
    component: AppResults,
    meta: { requiresAuth: true }
  },
  {
    path: '/:eventSlug',
    name: 'Event',
    props: true,
    component: AppUserEvent,
    meta: { requiresAuth: false }
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
