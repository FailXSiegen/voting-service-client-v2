<template>
  <PageLayout :meta-title="$t('navigation.views.organizerMemberRoom')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerMemberRoom') }}
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
      <router-link
        :to="{ name: RouteOrganizerEventUserNew }"
        class="btn btn-success my-3 mr-3"
      >
        <i class="bi-plus bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t('view.event.create.labels.eventUser.createNew') }}
        </span>
      </router-link>
      <router-link
        :to="{ name: RouteOrganizerEventUserMultipleNew }"
        class="btn btn-info my-3"
      >
        <i class="bi-list bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t('view.event.create.labels.eventMultipleUser.createNew') }}
        </span>
      </router-link>
      <hr>
      <VerifiedEventUserList
        :event-users="verifiedEventUsers"
        @update-to-guest="onUpdateToGuest"
        @update-to-participant="onUpdateToParticipant"
        @unverfify-event-user="onUnverfifyEventUser"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import VerifiedEventUserList from "@/modules/organizer/components/events/VerifiedEventUserList.vue";
import {
  getRoutesByName,
  RouteOrganizerDashboard,
  RouteOrganizerLobbyRoom,
  RouteOrganizerMemberRoom,
  RouteOrganizerPollResults,
  RouteOrganizerPolls,
  RouteOrganizerEventUserNew,
  RouteOrganizerEventUserMultipleNew
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";
import {useMutation, useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {computed, ref} from "vue";
import {UPDATE_EVENT_USER_TO_PARTICIPANT} from "@/modules/organizer/graphql/mutation/update-event-user-to-participant";
import {UPDATE_EVENT_USER_TO_GUEST} from "@/modules/organizer/graphql/mutation/update-event-user-to-guest";
import {EVENT_USERS} from "@/modules/organizer/graphql/queries/event-users";

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
const verifiedEventUsers = computed(() => eventUsers.value.filter((eventUser) => eventUser.verified));
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

async function onUpdateToParticipant(eventUserId) {
  console.log('onUpdateToParticipant', eventUserId);
  // const {mutate: updateEventUserToParticipant} = useMutation(UPDATE_EVENT_USER_TO_PARTICIPANT, {
  //   variables: {
  //     eventUserId,
  //   },
  // });
  // await updateEventUserToParticipant();
  // await eventUsersQuery.refetch();
}

async function onUpdateToGuest(eventUserId) {
  console.log('onUpdateToGuest', eventUserId);

  // const {mutate: updateEventUserToGuest} = useMutation(UPDATE_EVENT_USER_TO_GUEST, {
  //   variables: {
  //     eventUserId,
  //   },
  // });
  // await updateEventUserToGuest();
  // await eventUsersQuery.refetch();
}

async function onUnverfifyEventUser(eventUserId) {
  console.log('onUnverfifyEventUser', eventUserId);
}

</script>
