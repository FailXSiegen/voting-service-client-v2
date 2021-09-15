import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLogin from '@/frame/views/Login'
import AppImprint from '@/frame/views/staticPages/Imprint'
import AppDataProtection from '@/frame/views/staticPages/DataProtection'
import AppFaq from '@/frame/views/staticPages/Faq'
import AppManual from '@/frame/views/staticPages/Manual'
import AppUserAgreement from '@/frame/views/staticPages/UserAgreement'
import AppFunctions from '@/frame/views/staticPages/Functions'
import AppRegister from '@/frame/views/Register'
import AppValidateEmail from '@/frame/views/ValidateEmail'
import AppRequestPassword from '@/frame/views/RequestPassword'
import AppFormPasswordForgot from '@/frame/views/ForgotPassword'
import AppDashboard from '@/organizer/views/Dashboard'
import AppEvents from '@/organizer/views/Events'
import AppProfile from '@/organizer/views/Profile'
import AppOrganizers from '@/organizer/views/Organizers'
import AppAllEvents from '@/organizer/views/AllEventsForSuperOrganizer'
import AppCreateEvent from '@/organizer/views/CreateEvent'
import AppUpdateEvent from '@/organizer/views/UpdateEvent'
import AppMemberList from '@/organizer/views/event/MemberList'
import AppPolls from '@/organizer/views/event/Polls'
import AppWaitingRoom from '@/organizer/views/event/WaitingRoom'
import AppResults from '@/organizer/views/event/Results'
import AppUserEvent from '@/user/views/Event'
import AppCreateEventUser from '@/organizer/views/event/event-user/CreateEventUser'
import AppCreateEventMultipleUser from '@/organizer/views/event/event-user/CreateEventMultipleUser'
import AppUpdateEventUser from '@/organizer/views/event/event-user/UpdateEventUser'
import AppVideoConferenceListing from '@/organizer/views/video-conference/Listing'
import AppVideoConferenceZoomNew from '@/organizer/views/video-conference/zoom/New'
import AppVideoConferenceZoomEdit from '@/organizer/views/video-conference/zoom/Edit'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: AppLogin,
    meta: { requiresAuth: false }
  },
  {
    path: '/impressum',
    name: 'Imprint',
    component: AppImprint,
    meta: { requiresAuth: false }
  },
  {
    path: '/datenschutz',
    name: 'Data Protection',
    component: AppDataProtection,
    meta: { requiresAuth: false }
  },
  {
    path: '/haeufige-fragen',
    name: 'Faq',
    component: AppFaq,
    meta: { requiresAuth: false }
  },
  {
    path: '/nutzervereinbarung',
    name: 'User Agreement',
    component: AppUserAgreement,
    meta: { requiresAuth: false }
  },
  {
    path: '/anleitung',
    name: 'Manual',
    component: AppManual,
    meta: { requiresAuth: false }
  },
  {
    path: '/funktionen-planung',
    name: 'Functions',
    component: AppFunctions,
    meta: { requiresAuth: false }
  },
  {
    path: '/passwort-vergessen',
    name: 'Fogot Password',
    component: AppRequestPassword,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register Organizer',
    component: AppRegister,
    meta: { requiresAuth: false }
  },
  {
    path: '/validate/:hash',
    props: true,
    name: 'Validate Register Organizer',
    component: AppValidateEmail,
    meta: { requiresAuth: false }
  },
  {
    path: '/password-forgot/:hash',
    props: true,
    name: 'Passwort ändern Formular',
    component: AppFormPasswordForgot,
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
    path: '/admin/video-conference',
    name: 'VideoConference',
    component: AppVideoConferenceListing,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/video-conference/zoom/new',
    name: 'NewZoomMeeting',
    component: AppVideoConferenceZoomNew,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/video-conference/zoom/edit/:id',
    name: 'EditZoomMeeting',
    component: AppVideoConferenceZoomEdit,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/organizers',
    name: 'Organizers',
    component: AppOrganizers,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/organizer/allevents',
    name: 'AllEvents',
    component: AppAllEvents,
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
    path: '/admin/event/eventmultipleuser/create/:eventSlug',
    name: 'CreateEventMultipleUser',
    props: true,
    component: AppCreateEventMultipleUser,
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
