<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPollResults')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerPollResults") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation />
    </template>
    <template #content>
      <ButtonDropdown :buttons="exportButtons" label="Export" />

      <hr />

      <!-- Loading State -->
      <div v-if="isLoading" class="d-flex justify-content-center my-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">{{ $t("common.loading") }}</span>
        </div>
        <span class="ms-3">{{ $t("common.loading") }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ $t("common.error.loading") }}
      </div>

      <!-- Results -->
      <template v-else>
        <div>
          <template v-if="pollResults?.length > 0">
            <ResultListing
              :key="'poll-results'"
              :poll-results="pollResults"
              :event-record="event"
              :show-hidden-controls="true"
              class="poll-results-container"
            />

            <button
              v-if="showMoreEnabled"
              class="my-5 mx-auto btn btn-secondary py-2 d-flex align-items-center d-print-none"
              :disabled="isLoadingMore"
              @click="showMorePollResults"
            >
              <i class="me-3 bi bi-plus-square-fill bi--2xl" />
              {{
                isLoadingMore
                  ? $t("common.loading")
                  : $t("view.results.showMore")
              }}
            </button>

            <p v-if="!showMoreEnabled" class="alert alert-light mx-auto my-5">
              {{ $t("view.results.noMoreResults") }}
            </p>
          </template>

          <p v-else class="alert alert-info mx-auto my-5">
            {{ $t("view.results.noResults") }}
          </p>
        </div>
      </template>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import { RouteOrganizerDashboard } from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { ref, computed, watch, nextTick } from "vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { toast } from "vue3-toastify";
import l18n from "@/l18n";
import { exportPollResultsCsv } from "@/modules/organizer/requests/export-results-csv";
import ButtonDropdown from "@/modules/organizer/components/form/ButtonDropdown.vue";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const event = ref(null);
const pollResults = ref([]);
const error = ref(null);

const page = ref(0);
const pageSize = ref(10);
const showMoreEnabled = ref(true);

// Tracking loading states
const isEventLoading = ref(true);
const isPollResultsLoading = ref(true);
const isLoadingMore = ref(false);
const isLoading = computed(
  () => isEventLoading.value || isPollResultsLoading.value,
);

const exportButtons = [
  {
    label: "Übersicht",
    onClick: exportPollOverview,
  },
  {
    label: "Ergebnisse",
    onClick: exportPollResults,
  },
  {
    label: "Ergebnisse mit Details",
    onClick: exportPollResultsDetail,
  },
  {
    label: "Teilnehmer mit abgegebener Stimmenanzahl",
    onClick: exportPollEventUsersVoted,
  },
  {
    label: "Stimmen-Anpassungen Log",
    onClick: exportVoteAdjustments,
  },
];

let pollResultsQuery;

// Event Query
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  },
);

// Update loading state for event
watch(
  () => eventQuery.loading.value,
  (loading) => {
    isEventLoading.value = loading;
  },
);

// Handle event query errors
eventQuery.onError((err) => {
  error.value = err;
  handleError(err);
});

// Event query result handler
eventQuery.onResult(({ data }) => {
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({ name: RouteOrganizerDashboard });
    return;
  }

  event.value = data?.event;
  setupPollResultsQuery();
});

function setupPollResultsQuery() {
  pollResultsQuery = useQuery(
    POLLS_RESULTS,
    {
      eventId: event.value?.id,
      page: page.value,
      pageSize: pageSize.value,
      includeHidden: true, // Organizers see all results including hidden ones
    },
    {
      fetchPolicy: "network-only",
    },
  );

  // Update loading state for poll results
  watch(
    () => pollResultsQuery.loading.value,
    (loading) => {
      isPollResultsLoading.value = loading;
    },
  );

  // Handle poll results
  pollResultsQuery.onResult(({ data }) => {
    if (!data?.pollResult) {
      showMoreEnabled.value = false;
      return;
    }

    pollResults.value = data.pollResult;
    showMoreEnabled.value = data.pollResult.length >= pageSize.value;
  });

  // Handle poll results errors
  pollResultsQuery.onError((err) => {
    error.value = err;
    handleError(err);
  });
}

async function showMorePollResults() {
  if (isLoadingMore.value) {
    return;
  }

  isLoadingMore.value = true;
  const nextPage = page.value + 1;
  const loadMoreButton = document.querySelector(".poll-results-container");
  const buttonPosition =
    loadMoreButton?.getBoundingClientRect().bottom + window.pageYOffset;

  try {
    await pollResultsQuery.fetchMore({
      variables: {
        eventId: event.value?.id,
        page: nextPage,
        pageSize: pageSize.value,
        includeHidden: true, // Organizers see all results including hidden ones
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.pollResult?.length) {
          showMoreEnabled.value = false;
          toast(l18n.global.tc("view.results.noMoreResults"), { type: "info" });
          return prev;
        }

        const updatedResults = {
          pollResult: [...prev.pollResult, ...fetchMoreResult.pollResult],
        };

        pollResults.value = updatedResults.pollResult;
        page.value = nextPage;
        showMoreEnabled.value =
          fetchMoreResult.pollResult.length >= pageSize.value;

        return updatedResults;
      },
    });

    nextTick(() => {
      window.scrollTo({
        top: buttonPosition,
        behavior: "auto",
      });
    });
  } catch (error) {
    console.error("Error loading more results:", error);
    toast(l18n.global.tc("common.error.loading"), { type: "error" });
  } finally {
    isLoadingMore.value = false;
  }
}

// Export functions
async function exportPollOverview() {
  const response = await exportPollResultsCsv(id, "pollOverview");
  await downloadCsv(await response.text(), "pollOverview.csv");
}

async function exportPollResults() {
  const response = await exportPollResultsCsv(id, "pollResults");
  await downloadCsv(await response.text(), "pollResults.csv");
}

async function exportPollResultsDetail() {
  const response = await exportPollResultsCsv(id, "pollResultsDetail");
  await downloadCsv(await response.text(), "pollResultsDetail.csv");
}

async function exportPollEventUsersVoted() {
  const response = await exportPollResultsCsv(id, "pollEventUsersVoted");
  await downloadCsv(await response.text(), "pollEventUsersVoted.csv");
}

async function exportVoteAdjustments() {
  try {
    const response = await fetch(
      `/api/event/${id}/export-vote-adjustments`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${coreStore.authToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Export fehlgeschlagen');
    }

    // Get filename from Content-Disposition header or create default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'vote-adjustments.csv';
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast(l18n.global.tc("common.success"), { type: "success" });
  } catch (error) {
    console.error('Export error:', error);
    toast(error.message || l18n.global.tc("common.error"), { type: "error" });
  }
}

async function downloadCsv(responseText, filename) {
  const blob = new Blob([responseText], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
