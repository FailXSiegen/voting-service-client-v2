<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsEdit')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerEventsEdit') }}
        <router-link
          :to="{name: RouteOrganizerMemberRoom, params: {id: eventId}}"
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
      <EventUserForm
        v-if="loaded"
        :prefill-data="prefillData"
        @submit="onSubmit"
      />
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
import {reactive, ref} from "vue";
import {useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {useMutation} from "@vue/apollo-composable";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {EVENT_USER} from "@/modules/organizer/graphql/queries/event-user";
import {UPDATE_EVENT_USER} from "@/modules/organizer/graphql/mutation/update-event-user";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const eventId = route.params.id;
const eventUserId = route.params.eventUserId;
const loaded = ref(false);
const event = ref(null);
const eventUser = ref(null);
const prefillData = reactive({
  verified: false,
  allowToVote: false,
  username: '',
  publicName: '',
  voteAmount: 1,
});
let eventUserQuery;

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(EVENT, {id: eventId, organizerId: coreStore.user.id}, {fetchPolicy: "no-cache"});
eventQuery.onResult(({data}) => {
  // Check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({name: RouteOrganizerDashboard});
    return;
  }
  event.value = data?.event;

  // Fetch event user to edit.
  eventUserQuery = useQuery(EVENT_USER, {id: eventUserId}, {fetchPolicy: "no-cache"});
  eventUserQuery.onResult(({data}) => {
    // Check if the event could be fetched successfully. redirect to list if not.
    if (null === data?.eventUser) {
      handleError(new NetworkError());
      router.push({name: RouteOrganizerDashboard});
      return;
    }
    eventUser.value = data?.eventUser ?? null;
    prefillData.verified = eventUser.value?.verified ?? false;
    prefillData.allowToVote = eventUser.value?.allowToVote ?? false;
    prefillData.username = eventUser.value?.username ?? '';
    prefillData.publicName = eventUser.value?.publicName ?? '';
    prefillData.voteAmount = eventUser.value?.voteAmount ?? 1;
    loaded.value = true;
  });
});

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerMemberRoom,
  RouteOrganizerLobbyRoom,
  RouteOrganizerPolls,
  RouteOrganizerPollResults,
]);

async function onSubmit({username, verified, allowToVote, publicName, voteAmount}) {
  // Update Event user.
  const {mutate: updateEventUser} = useMutation(UPDATE_EVENT_USER, {
    variables: {
      input: {
        id: eventUser.value?.id,
        eventId,
        username,
        verified,
        allowToVote,
        publicName,
        voteAmount,
      },
    },
  });
  await updateEventUser();

  // Back to member room.
  await router.push({name: RouteOrganizerMemberRoom});

  // Show success message.
  toast(i18n.global.tc('success.organizer.eventUser.updatedSuccessfully'), {type: 'success'});
}
</script>