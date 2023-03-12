<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsNew')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerEventUserNew') }}
        <router-link
          :to="{name: RouteOrganizerMemberRoom, params: {id}}"
          class="btn btn-secondary mb-3 float-right d-none d-md-inline-block"
        >
          <i class="bi-arrow-left bi--1xl mr-1" />
          <span class="align-middle">
            {{ $t('view.event.backToMemeberRoom') }}
          </span>
        </router-link>
      </div>
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <EventUserForm @submit="onSubmit" />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import EventUserForm from '@/modules/organizer/components/events/event-user/EventUserForm.vue';
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
import {ref} from "vue";
import {useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {useMutation} from "@vue/apollo-composable";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {CREATE_EVENT_USER} from "@/modules/organizer/graphql/mutation/create-event-user";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);

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
});

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerMemberRoom,
  RouteOrganizerLobbyRoom,
  RouteOrganizerPolls,
  RouteOrganizerPollResults,
]);

async function onSubmit({username, verified, allowToVote, publicName, voteAmount}) {
  // Create new Event user.
  const {mutate: createEventUser} = useMutation(CREATE_EVENT_USER, {
    variables: {
      input: {
        eventId: id,
        username,
        verified,
        allowToVote,
        publicName,
        voteAmount,
      },
    },
  });
  await createEventUser();

  // Back to member room.
  await router.push({name: RouteOrganizerMemberRoom});

  // Show success message.
  toast(i18n.global.tc('success.organizer.eventUser.createdSuccessfully'), {type: 'success'});
}
</script>