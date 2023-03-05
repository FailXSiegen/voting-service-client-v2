<template>
  <PageLayout :meta-title="$t('navigation.views.organizerLobbyRoom')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerLobbyRoom') }}
        <router-link
          :to="{name: RouteOrganizerDashboard}"
          class="btn btn-secondary mb-3 float-right d-none d-md-inline-block"
        >
          <i class="bi-arrow-left bi--1xl mr-1" />
          <span class="align-middle">
            {{ $t('navigation.backToDashboard') }}
          </span>
        </router-link>
      </div>
    </template>
    <template #header>
      <PageNavigation
        :routes="routes"
        :pass-params="true"
        :show-profile-link="false"
      />
    </template>
    <template #content>
      <PendingEventUserList
        :event-users="pendingEventUsers"
        @delete="onDelete"
        @update-to-guest="onUpdateToGuest"
        @update-to-participant="onUpdateToParticipant"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import {
  getRoutesByName,
  RouteOrganizerDashboard,
  RouteOrganizerLobbyRoom,
  RouteOrganizerMemberRoom,
  RouteOrganizerPollResults,
  RouteOrganizerPolls,
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";
import {useMutation, useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {computed, ref} from "vue";
import PendingEventUserList from "@/modules/organizer/components/events/PendingEventUserList.vue";
import {EVENT_USERS} from "@/modules/organizer/graphql/queries/event-users";
import {UPDATE_EVENT_USER_TO_PARTICIPANT} from "@/modules/organizer/graphql/mutation/update-event-user-to-participant";
import {UPDATE_EVENT_USER_TO_GUEST} from "@/modules/organizer/graphql/mutation/update-event-user-to-guest";
import {DELETE_EVENT_USER} from "@/modules/organizer/graphql/mutation/delete-event-user";
import {useSubscription} from "@vue/apollo-composable";
import {NEW_EVENT_USER} from "@/modules/organizer/graphql/subscription/new-event-user";
import {
  UPDATE_EVENT_USER_ACCESS_RIGHTS
} from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import {EVENT_USER_LIFE_CYCLE} from "@/modules/organizer/graphql/subscription/event-user-life-cycle";

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerMemberRoom,
  RouteOrganizerLobbyRoom,
  RouteOrganizerPolls,
  RouteOrganizerPollResults,
]);

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);
const eventUsers = ref([]);
const pendingEventUsers = computed(() => eventUsers.value.filter((eventUser) => !eventUser.verified));
let eventUsersQuery;

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(EVENT, {id, organizerId: coreStore.user.id}, {fetchPolicy: "no-cache"});
eventQuery.onResult(({data}) => {
  // Check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({name: RouteOrganizerDashboard});
    return;
  }
  event.value = data?.event;
  loaded.value = true;

  // Fetch pending event users..
  eventUsersQuery = useQuery(EVENT_USERS, {eventId: event.value?.id}, {fetchPolicy: "cache-and-network"});
  eventUsersQuery.onResult(({data}) => {
    if (data?.eventUsers) {
      eventUsers.value = data?.eventUsers;
    }
  });
});

// Handle new users.
const newEventUserSubscription = useSubscription(NEW_EVENT_USER);
newEventUserSubscription.onResult(({data}) => {
  if (parseInt(data?.newEventUser?.eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  copyOfEventUsers.push({...data?.newEventUser});

  eventUsers.value = copyOfEventUsers;
});

// Handle update of event user access rights.
const updateEventUserAccessRightsSubscription = useSubscription(UPDATE_EVENT_USER_ACCESS_RIGHTS);
updateEventUserAccessRightsSubscription.onResult(({data}) => {
  const {
    eventUserId,
    eventId,
    verified,
    allowToVote,
    voteAmount
  } = data.updateEventUserAccessRights;

  if (parseInt(eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  const eventUser = copyOfEventUsers.find(user => {
    return user.id === eventUserId;
  });

  if (!eventUser) {
    // No event user found. So we ignore this.
    return;
  }

  eventUser.verified = verified;
  eventUser.allowToVote = allowToVote;
  eventUser.voteAmount = voteAmount;
  eventUsers.value = copyOfEventUsers;
});

// Handle event user life cycle updates.
const eventUserLifeCycleSubscription = useSubscription(EVENT_USER_LIFE_CYCLE);
eventUserLifeCycleSubscription.onResult(({data}) => {
  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  const eventUser = copyOfEventUsers.find(user => {
    return parseInt(user.id, 10) === parseInt(data?.eventUserLifeCycle?.eventUserId, 10);
  });
  if (!eventUser) {
    // No event user found. So we ignore this.
    console.log('user not found');
    return;
  }
  eventUser.online = data?.eventUserLifeCycle?.online;
  eventUsers.value = copyOfEventUsers;
});

async function onUpdateToParticipant(eventUserId) {
  const {mutate: updateEventUserToParticipant} = useMutation(UPDATE_EVENT_USER_TO_PARTICIPANT, {
    variables: {
      eventUserId,
    },
  });
  await updateEventUserToParticipant();
  await eventUsersQuery.refetch();
}

async function onUpdateToGuest(eventUserId) {
  const {mutate: updateEventUserToGuest} = useMutation(UPDATE_EVENT_USER_TO_GUEST, {
    variables: {
      eventUserId,
    },
  });
  await updateEventUserToGuest();
  await eventUsersQuery.refetch();
}

async function onDelete(eventUserId) {
  const {mutate: deleteEventUser} = useMutation(DELETE_EVENT_USER, {
    variables: {
      eventUserId,
    },
  });
  await deleteEventUser();
  await eventUsersQuery.refetch();
}

// import { localize } from '@/frame/lib/localization-helper'
// import {
//   UPDATE_USER_TO_GUEST,
//   UPDATE_USER_TO_PARTICIPANT,
//   DELETE_EVENT_USER
// } from '@/organizer/api/graphql/gql/mutations'
// import { createFormattedDateFromTimeStamp } from '@/frame/lib/time-stamp'
//
// export default {
//   props: {
//     eventRecord: {
//       type: Object,
//       required: true
//     },
//     eventUsers: {
//       type: Array,
//       required: true
//     },
//     sortParam: {
//       type: String
//     }
//   },
//   data () {
//     return {
//       eventUsersByEvent: []
//     }
//   },
//   methods: {
//     localize (path) {
//       return localize(path)
//     },
//     sortTable (sortParam) {
//       this.$emit('onSort', sortParam)
//     },
//     activeSortParam (sortProperty) {
//       if (sortProperty !== this.sortParam) {
//         return
//       }
//       return 'active'
//     },
//     getCreateDatetimeFromTimestamp (item) {
//       return createFormattedDateFromTimeStamp(item.createDatetime)
//     },
//     updateUserToGuest (eventUserId) {
//       this.$apollo
//           .mutate({
//             mutation: UPDATE_USER_TO_GUEST,
//             variables: { eventUserId }
//           })
//           .catch(error => {
//             console.error(error)
//           })
//     },
//     updateToParticipant (eventUserId) {
//       this.$apollo
//           .mutate({
//             mutation: UPDATE_USER_TO_PARTICIPANT,
//             variables: { eventUserId }
//           })
//           .catch(error => {
//             console.error(error)
//           })
//     },
//     deletePendingUser (eventUserId) {
//       if (confirm('Benutzer wirklich löschen?')) {
//         this.$apollo
//             .mutate({
//               mutation: DELETE_EVENT_USER,
//               variables: { eventUserId }
//             })
//             .catch(error => {
//               console.error(error)
//             })
//       }
//     }
//   }
// }

// import AppNavigation from '@/organizer/components/events/detail/Navigation'
// import AppPendingUsers from '@/organizer/components/events/detail/PendingUsers'
// import { addSuccessMessage } from '@/frame/lib/alert-helper'
// import { fetchEventBySlug } from '@/user/api/fetch/event'
// import {
//   EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
//   NEW_EVENT_USER_SUBSCRIPTION,
//   UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION
// } from '@/frame/api/graphql/gql/subscriptions'
// import { EVENT_USERS_BY_EVENT } from '@/organizer/api/graphql/gql/queries'
//
// export default {
//   props: {
//     eventSlug: {
//       type: String
//     }
//   },
//   components: {
//     AppNavigation,
//     AppPendingUsers
//   },
//   apollo: {
//     eventUsers: {
//       pollInterval: 5000,
//       query: EVENT_USERS_BY_EVENT,
//       variables () {
//         return {
//           eventId: this.eventRecord.id
//         }
//       }
//     },
//     $subscribe: {
//       updateEventUserAccessRights: {
//         query: UPDATE_EVENT_USER_ACCESS_RIGHTS_SUBSCRIPTION,
//         result ({ data }) {
//           const {
//             eventUserId,
//             eventId,
//             verified,
//             allowToVote,
//             voteAmount
//           } = data.updateEventUserAccessRights
//           if (parseInt(eventId) !== this.eventRecord.id) {
//             return
//           }
//           const eventUser = this.eventUsers.find(user => {
//             return user.id === eventUserId
//           })
//           if (!eventUser) {
//             return
//           }
//           eventUser.verified = verified
//           eventUser.allowToVote = allowToVote
//           eventUser.voteAmount = voteAmount
//           addSuccessMessage(
//               'Erfolg',
//               'Die Rechte des Nutzers wurden erfolgreich angepasst.'
//           )
//         }
//       },
//       newEventUser: {
//         query: NEW_EVENT_USER_SUBSCRIPTION,
//         result ({ data }) {
//           if (parseInt(data.newEventUser.eventId) !== this.eventRecord.id) {
//             return
//           }
//
//           this.eventUsers.push({ ...data.newEventUser })
//           addSuccessMessage(
//               'Hallöchen',
//               'Ein neuer User ist dem Waitingroom beigetreten.'
//           )
//         }
//       },
//       eventUserLifeCycle: {
//         query: EVENT_USER_LIFE_CYCLE_SUBSCRIPTION,
//         result ({ data }) {
//           let eventUserFound = false
//           if (data.eventUserLifeCycle) {
//             const eventUserId = data.eventUserLifeCycle.eventUserId
//             this.eventUsers.forEach(eventUser => {
//               if (eventUserId === eventUser.id) {
//                 eventUserFound = true
//                 eventUser.online = data.eventUserLifeCycle.online
//               }
//             })
//             if (!eventUserFound && data.eventUserLifeCycle.username) {
//               this.eventUsers.push({ ...data.eventUserLifeCycle })
//             }
//           }
//         }
//       }
//     }
//   },
//   async created () {
//     document.title = 'Warteraum - digitalwahl.org'
//     const response = await fetchEventBySlug(this.eventSlug)
//     if (
//         response === null ||
//         response.success === false ||
//         response.event.organizerId !== this.$store.getters.getCurrentUserId
//     ) {
//       await this.$router.push('/admin/events')
//     }
//     this.eventRecord = response.event
//   },
//   data () {
//     return {
//       headline: 'Warteraum',
//       eventRecord: {},
//       eventUsers: [],
//       filteredEventUsers: [],
//       filterByUsername: '',
//       sortParam: 'createDatetime',
//       sortOrderInvert: false
//     }
//   },
//   methods: {
//     sortTable (sortProperty) {
//       if (sortProperty === this.sortParam) {
//         this.sortOrderInvert = !this.sortOrderInvert
//       }
//       this.sortParam = sortProperty
//     },
//     onFilter () {
//       if (!this.eventUsers) {
//         return []
//       }
//       this.filteredEventUsers = this.eventUsers.filter(eventUser => {
//         return (
//             !eventUser.verified &&
//             eventUser.username.includes(this.filterByUsername)
//         )
//       })
//     }
//   },
//   computed: {
//     pendingUsers () {
//       if (!this.eventUsers) {
//         return []
//       }
//       return this.eventUsers.filter(eventUser => {
//         return !eventUser.verified
//       })
//     },
//     sortedPendingUsers: function () {
//       if (!this.eventUsers) {
//         return []
//       }
//       const sortPendingUsers = this.eventUsers.filter(eventUser => {
//         return !eventUser.verified
//       })
//       const sortedArray = sortPendingUsers.sort((a, b) =>
//           a[this.sortParam] > b[this.sortParam]
//               ? -1
//               : a[this.sortParam] < b[this.sortParam]
//                   ? 1
//                   : 0
//       )
//       if (this.sortOrderInvert) {
//         sortedArray.reverse()
//       }
//       return sortedArray
//     }
//   }
// }
</script>
