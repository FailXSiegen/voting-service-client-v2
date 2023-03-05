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
import PendingEventUserList from "@/modules/organizer/components/events/PendingEventUserList.vue";
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
</script>
