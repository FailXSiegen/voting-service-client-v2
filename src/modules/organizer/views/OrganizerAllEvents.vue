<template>
  <PageLayout :meta-title="$t('navigation.views.organizerAllEvents')">
    <template #title>
      {{ $t('navigation.views.organizerAllEvents') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <EventListing
        :headline="$t('view.event.upcoming')"
        :events-detail="false"
        :events-show-delete="true"
        :events-show-activate="true"
        :events="allUpcomingEvents"
        :show-organizer="true"
        @delete="onDelete"
        @toggle-active="onToggleActive"
      />
      <hr>
      <EventListing
        :headline="$t('view.event.latest')"
        :events-detail="false"
        :events-show-delete="true"
        :events-show-activate="true"
        :events="allPastEvents"
        :show-organizer="true"
        @delete="onDelete"
        @toggle-active="onToggleActive"
      />
      <template v-if="noMorePastEventsFound">
        <AlertBox type="info">
          {{ $t('view.results.noMoreResults') }}
        </AlertBox>
      </template>
      <button
        :disabled="noMorePastEventsFound"
        class="my-5 mx-auto btn btn-info py-2 d-flex align-items-center d-print-none"
        @click.prevent="onShowMorePastEvents"
      >
        <i class="mr-3 bi bi-plus-square-fill bi--2xl" />
        {{ $t('view.results.showMore') }}
      </button>
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
} from "@/router/routes";
import {useMutation, useQuery} from "@vue/apollo-composable";
import {useCore} from "@/core/store/core";
import i18n from "@/l18n";
import {toast} from "vue3-toastify";
import {REMOVE_EVENT} from "@/modules/organizer/graphql/mutation/remove-event";
import {ALL_UPCOMING_EVENTS} from "@/modules/organizer/graphql/queries/all-upcoming-events";
import {ALL_PAST_EVENTS} from "@/modules/organizer/graphql/queries/all-past-events";
import AlertBox from "@/core/components/AlertBox.vue";
import l18n from "@/l18n";
import {UPDATE_EVENT_STATUS} from "@/modules/organizer/graphql/queries/update-event-status";

const coreStore = useCore();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents
]);

const page = ref(0);
const pageSize = ref(10);
const noMorePastEventsFound = ref(false);
const allUpcomingEvents = ref([]);
const allPastEvents = ref([]);

// Query upcoming event.
const allUpcomingEventsQuery = useQuery(ALL_UPCOMING_EVENTS, null, {fetchPolicy: "cache-and-network"});
allUpcomingEventsQuery.onResult(({data}) => {
  allUpcomingEvents.value = data?.allUpcomingEvents ?? [];
});

// Query upcoming event.
const allPastEventsQuery = useQuery(ALL_PAST_EVENTS, {
  page: page.value,
  pageSize: pageSize.value
}, {fetchPolicy: "cache-and-network"});
allPastEventsQuery.onResult(({data}) => {
  allPastEvents.value = data?.allPastEvents ?? [];
});

function onShowMorePastEvents() {
  page.value += 1;
  allPastEventsQuery.fetchMore({
    variables: {
      page: page.value,
      pageSize: pageSize.value
    },
    updateQuery: (previousResult, {fetchMoreResult}) => {
      if (!fetchMoreResult?.allPastEvents) {
        noMorePastEventsFound.value = true;
        toast(l18n.global.tc('view.results.noMoreResults'), {type: 'info'});
        return previousResult;
      }

      return {
        ...previousResult,
        allPastEvents: [
          ...previousResult.allPastEvents,
          ...fetchMoreResult.allPastEvents,
        ],
      };
    },
  });
}

async function onDelete({eventId, organizerId}) {
  console.log('onDelete');
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
  allUpcomingEventsQuery.refetch();
  allPastEventsQuery.refetch();

  // Show success message.
  toast(i18n.global.tc('success.organizer.events.deletedSuccessfully'), {type: 'success'});
}

async function onToggleActive({eventId, status}) {
  console.log('onToggleActive');
  // Update update event status.
  const {mutate: updateEventStatus} = useMutation(UPDATE_EVENT_STATUS, {
    variables: {
      input: {
        id: parseInt(eventId, 10),
        active: status
      }
    },
  });
  await updateEventStatus();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Refetch event record.
  allUpcomingEventsQuery.refetch();
  allPastEventsQuery.refetch();

  // Show success message.
  toast(i18n.global.tc('success.organizer.events.updatedSuccessfully'), {type: 'success'});
}
</script>
