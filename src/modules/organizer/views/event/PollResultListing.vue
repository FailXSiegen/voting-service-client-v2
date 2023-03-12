<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPollResults')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerPollResults') }}
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
      <EventNavigation />
    </template>
    <template #content>
      <div class="row">
        <div class="col-6 col-md-auto mb-3">
          <button
            class="btn btn-success mr-3"
            @click="exportPollOverview()"
          >
            Export Übersicht
          </button>
        </div>
        <div class="col-6 col-md-auto  mb-3">
          <button
            class="btn btn-success mr-3"
            @click="exportPollResults"
          >
            Export Ergebnisse
          </button>
        </div>
        <div class="col-6 col-md-auto mb-3">
          <button
            class="btn btn-success mr-3"
            @click="exportPollResultsDetail"
          >
            Export Ergebnisse mit Details
          </button>
        </div>
        <div class="col-6 col-md-auto">
          <button
            class="btn btn-success mr-3"
            @click="exportPollEventUsersVoted"
          >
            Export Teilnehmer mit abgegebener Stimmenanzahl
          </button>
        </div>
      </div>
      <hr>
      <ResultListing
        v-if="pollResults?.length > 0"
        :poll-results="pollResults"
        :event-record="event"
      />

      <button
        v-if="showMoreEnabled"
        class="my-5 mx-auto btn btn-info py-2 d-flex align-items-center d-print-none"
        @click="showMorePollResults"
      >
        <i class="mr-3 bi bi-plus-square-fill bi--2xl" />
        {{ $t('view.results.showMore') }}
      </button>
      <p
        v-if="!showMoreEnabled"
        class="alert alert-light mx-auto my-5"
      >
        {{ $t('view.results.noMoreResults') }}
      </p>
    </template>
  </PageLayout>
</template>

<script setup>
// @todo add missing messages!
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import EventNavigation from '@/modules/organizer/components/EventNavigation.vue';
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
import {useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {ref} from "vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import {POLLS_RESULTS} from "@/modules/organizer/graphql/queries/poll-results";
import {toast} from "vue3-toastify";
import l18n from "@/l18n";
import {exportPollResultsCsv} from "@/modules/organizer/requests/export-results-csv";

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
const pollResults = ref([]);

const page = ref(0);
const pageSize = ref(10);
const showMoreEnabled = ref(true);

let pollResultsQuery;

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(EVENT, {id, organizerId: coreStore.user.id}, {fetchPolicy: "no-cache"});
eventQuery.onResult(({data}) => {
  // check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({name: RouteOrganizerDashboard});
    return;
  }
  event.value = data?.event;

  // Fetch poll results.
  pollResultsQuery = useQuery(POLLS_RESULTS, {
    eventId: event.value?.id,
    page,
    pageSize
  }, {fetchPolicy: "cache-and-network"});
  pollResultsQuery.onResult(({data}) => {
    if (loaded.value) {
      return;
    }
    if (data?.pollResult && data?.pollResult?.length >= pageSize.value) {
      showMoreEnabled.value = true;
    }
    if (data?.pollResult) {
      pollResults.value = data?.pollResult;
    }
    loaded.value = true;
  });
});

function showMorePollResults() {
  page.value += 1;
  pollResultsQuery.fetchMore({
    variables: {
      page: page.value,
      pageSize: pageSize.value
    },
    updateQuery: (previousResult, {fetchMoreResult}) => {
      if (!fetchMoreResult?.pollResult) {
        showMoreEnabled.value = false;
        toast(l18n.global.tc('view.results.noMoreResults'), {type: 'info'});
        return;
      }

      pollResults.value = [
        ...pollResults.value,
        ...fetchMoreResult.pollResult,
      ];
    },
  });
}

// Events.

async function exportPollOverview() {
  const response = await exportPollResultsCsv(id, 'pollOverview');
  await downloadCsv(await response.text(), 'pollOverview.csv');
}

async function exportPollResults() {
  const response = await exportPollResultsCsv(id, 'pollResults');
  await downloadCsv(await response.text(), 'pollResults.csv');
}

async function exportPollResultsDetail() {
  const response = await exportPollResultsCsv(id, 'pollResultsDetail');
  await downloadCsv(await response.text(), 'pollResultsDetail.csv');
}

async function exportPollEventUsersVoted() {
  const response = await exportPollResultsCsv(id, 'pollEventUsersVoted');
  await downloadCsv(await response.text(), 'pollEventUsersVoted.csv');
}

async function downloadCsv(responseText, filename) {
  const blob = new Blob([responseText], {type: 'text/csv'});
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

</script>
