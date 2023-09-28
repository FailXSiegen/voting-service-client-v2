<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEvents')">
    <template #title>
      {{ $t('navigation.views.organizerEvents') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div class="events-container">
        <router-link
          :to="{name: RouteOrganizerEventsNew}"
          class="btn btn-success btn-lg my-3"
        >
          <i class="bi-plus bi--2xl align-middle" />
          <span class="align-middle">{{
            $t('view.event.create.createNew')
          }}</span>
        </router-link>
        <EventListing
          v-if="upcomingEvents"
          :headline="$t('view.event.upcoming')"
          :events-detail="true"
          :events="upcomingEvents"
          @delete="onDelete"
        />
        <EventListing
          v-if="expiredEvents"
          :headline="$t('view.event.latest')"
          :events-detail="true"
          :events="expiredEvents"
          @delete="onDelete"
        />
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import EventListing from '@/modules/organizer/components/events/EventListing.vue';
import {ref} from 'vue';
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
  RouteOrganizerEventsNew,
} from "@/router/routes";
import {UPCOMING_EVENTS} from '@/modules/organizer/graphql/queries/upcoming-events';
import {EXPIRED_EVENTS} from '@/modules/organizer/graphql/queries/expired-events';
import {useMutation, useQuery} from "@vue/apollo-composable";
import {useCore} from "@/core/store/core";
import t from '@/core/util/l18n';
import {toast} from "vue3-toastify";
import {REMOVE_EVENT} from "@/modules/organizer/graphql/mutation/remove-event";

const coreStore = useCore();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents
]);

const upcomingEvents = ref([]);
const expiredEvents = ref([]);

// Query upcoming event.
const upcomingEventsQuery = useQuery(UPCOMING_EVENTS, {organizerId: coreStore?.user?.id ?? 0}, {fetchPolicy: "no-cache"});
upcomingEventsQuery.onResult(({data}) => {
  upcomingEvents.value = data?.upcomingEvents ?? [];
});

// Query upcoming event.
const expiredEventsQuery = useQuery(EXPIRED_EVENTS, {organizerId: coreStore?.user?.id ?? 0}, {fetchPolicy: "no-cache"});
expiredEventsQuery.onResult(({data}) => {
  expiredEvents.value = data?.expiredEvents ?? [];
});

async function onDelete({eventId, organizerId}) {
  // Update new zoom meeting.
  const {mutate: removeEvent} = useMutation(REMOVE_EVENT, {
    variables: {
      organizerId,
      id: eventId,
    },
  });
  await removeEvent();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Refetch event record.
  upcomingEventsQuery.refetch();
  expiredEventsQuery.refetch();

  // Show success message.
  toast(t('success.organizer.events.deletedSuccessfully'), {type: 'success'});
}
</script>
