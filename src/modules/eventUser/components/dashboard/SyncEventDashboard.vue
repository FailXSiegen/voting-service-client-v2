<template>
  <ConnectionLostOverlay v-if="connectionLost" />
  <NotVerifiedWidget
    v-if="eventUser && !eventUser.verified"
    :event-user="eventUser"
  />
  <template v-if="eventUser && eventUser.verified">
    <DashboardStats
      v-if="event && eventUser && eventUser.verified"
      :event="event"
      :highlight-status-change="highlightStatusChange"
      :event-user="eventUser"
    />
    <JoinMeetingControl
      v-if="event && !meetingFrameIsActive && event.meeting"
      :event="event"
      @join-meeting="onJoinMeeting"
    />
    <MeetingContainer
      v-if="event && eventUser && meetingFrameIsActive && event.meeting"
      :event="event"
      :event-user="eventUser"
    />
    <PollStatus :exist-active-poll="existActivePoll" :poll-state="pollState" />
    <ResultListing
      v-if="event && pollResults?.length > 0"
      :event-record="event"
      :poll-results="pollResults"
    />
    <button
      v-if="showMoreEnabled && pollResults?.length > 0"
      class="btn btn-secondary my-3 mx-auto py-2 d-flex align-items-center d-print-none mb-3"
      @click="onShowMorePollResults"
    >
      <i class="mr-3 bi bi-plus-square-fill bi--2xl" />
      {{ $t("view.results.showMore") }}
    </button>
    <AlertBox
      v-if="!showMoreEnabled"
      type="info"
      :message="$t('view.results.noMoreResults')"
    />
    <PollModal
      ref="pollModal"
      :poll="poll"
      :event="event"
      :event-user="eventUser"
      :vote-counter="voteCounter"
      @submit="onSubmitPoll"
    />
    <ResultModal
      ref="resultModal"
      :poll-result="lastPollResult"
      :event="event"
    />
  </template>
</template>

<script setup>
// TODO what about the user lost connection after the frist vote. What about the left votes?
import NotVerifiedWidget from "@/modules/eventUser/components/dashboard/NotVerifiedWidget.vue";
import ConnectionLostOverlay from "@/modules/eventUser/components/dashboard/ConnectionLostOverlay.vue";
import DashboardStats from "@/modules/eventUser/components/dashboard/DashboardStats.vue";
import JoinMeetingControl from "@/modules/eventUser/components/dashboard/meeting/JoinMeetingControl.vue";
import MeetingContainer from "@/modules/eventUser/components/dashboard/meeting/MeetingContainer.vue";
import PollStatus from "@/modules/eventUser/components/dashboard/poll/PollStatus.vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import PollModal from "@/modules/eventUser/components/dashboard/poll/modal/PollModal.vue";
import ResultModal from "@/modules/eventUser/components/dashboard/poll/modal/ResultModal.vue";
import { useCore } from "@/core/store/core";
import { computed, ref } from "vue";
import { useQuery, useSubscription } from "@vue/apollo-composable";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { ACTIVE_POLL_EVENT_USER } from "@/modules/organizer/graphql/queries/active-poll-event-user.js";
import { toast } from "vue3-toastify";
import l18n from "@/l18n";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { POLL_LIFE_CYCLE_SUBSCRIPTION } from "@/modules/eventUser/graphql/subscription/poll-life-cycle";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";

const coreStore = useCore();
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

// Data.

const eventUser = ref(coreStore.getEventUser);
const meetingFrameIsActive = ref(false);
const page = ref(0);
const pageSize = ref(1);
const showMoreEnabled = ref(true);
const pollState = ref("closed");
const poll = ref(null);
const pollModal = ref(null);
const resultModal = ref(null);
const pollResults = ref([]);
const lastPollResult = ref(null);
const highlightStatusChange = ref(false);
const pollStatePersistence = usePollStatePersistence();
const votingProcess = useVotingProcess(eventUser, props.event);
const voteCounter = votingProcess.voteCounter;
votingProcess.setVotingCompletedCallback(() => {
  pollModal.value.hideModal();
});
const existActivePoll = computed(
  () => poll.value !== null && pollState.value !== "closed",
);
const connectionLost = computed(
  () => !eventUser.value?.online || !eventUser.value?.id,
);

// Queries.

// Try to fetch the active poll.
const activePollEventUserQuery = useQuery(
  ACTIVE_POLL_EVENT_USER,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
activePollEventUserQuery.onResult(({ data }) => {
  if (!data?.activePollEventUser) {
    return;
  }
  poll.value = data.activePollEventUser.poll;
  pollState.value = data.activePollEventUser.state;
  // check if user already voted
  if (
    pollStatePersistence.canVote(poll.value.id, eventUser.value, props.event)
  ) {
    voteCounter.value = pollStatePersistence.restoreVoteCounter();
    pollModal.value.showModal();
  }
});

// Fetch poll results.
const pollResultsQuery = useQuery(
  POLLS_RESULTS,
  { eventId: props.event.id, page, pageSize },
  { fetchPolicy: "cache-and-network" },
);
pollResultsQuery.onResult(({ data }) => {
  if (data?.pollResult && data?.pollResult?.length >= pageSize.value) {
    showMoreEnabled.value = true;
  }

  if (data?.pollResult?.length > 0) {
    // Make sure to only add new poll results.
    for (let pollResult of data.pollResult) {
      if (!pollResults.value.find((x) => x.id === pollResult.id)) {
        pollResults.value.push(pollResult);
      }
    }
    // Sort the result.
    pollResults.value = pollResults.value.sort(
      (a, b) => b.createDatetime - a.createDatetime,
    );
  }
  if (data?.pollResult) {
    lastPollResult.value = data.pollResult[0];
  }
});

// Subscriptions.
const updateEventUserAccessRightsSubscription = useSubscription(
  UPDATE_EVENT_USER_ACCESS_RIGHTS,
  { eventUserId: eventUser.value.id },
);
updateEventUserAccessRightsSubscription.onResult(({ data }) => {
  if (data.updateEventUserAccessRights) {
    const { verified, voteAmount, allowToVote } =
      data.updateEventUserAccessRights;
    coreStore.updateEventUserAccessRights(verified, voteAmount, allowToVote);
    toast(l18n.global.tc("view.polls.userUpdate"), {
      type: "info",
      autoClose: false,
      onOpen: () => (highlightStatusChange.value = true),
      onClose: () => (highlightStatusChange.value = false),
    });
  }
});

const pollLifeCycleSubscription = useSubscription(
  POLL_LIFE_CYCLE_SUBSCRIPTION,
  { eventId: props.event.id },
);
pollLifeCycleSubscription.onResult(async ({ data }) => {
  if (!data?.pollLifeCycle) {
    return;
  }
  // Set the current poll;
  poll.value = data.pollLifeCycle.poll;
  // Set the actual poll state
  pollState.value = data.pollLifeCycle.state;

  // Handle poll state.
  if (pollState.value === "new") {
    // Reset voteCounter.
    voteCounter.value = 1;
    // Close the result modal.
    resultModal.value.hideModal();

    if (!poll.value) {
      console.warn("missing current poll.");
      await activePollEventUserQuery.refetch();
    }

    // Open the poll modal.
    pollModal.value.showModal();
  } else if (pollState.value === "closed") {
    // Close the poll modal.
    pollModal.value.hideModal();
    // Open the result modal.
    resultModal.value.showModal();
    // Refresh poll results.
    showMoreEnabled.value = true;
    page.value = 0;
    pollResults.value = [];
    pollResultsQuery.refetch();
  }
});

// Events.

function onJoinMeeting() {
  meetingFrameIsActive.value = true;
}

function onShowMorePollResults() {
  page.value += 1;
  pollResultsQuery.fetchMore({
    variables: {
      page: page.value,
      pageSize: pageSize.value,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult?.pollResult) {
        showMoreEnabled.value = false;
        toast(l18n.global.tc("view.results.noMoreResults"), { type: "info" });
        return;
      }

      const pollResult = previousResult?.pollResult
        ? [...previousResult.pollResult, ...fetchMoreResult.pollResult]
        : [...fetchMoreResult.pollResult];

      return {
        ...previousResult,
        pollResult,
      };
    },
  });
}

async function onSubmitPoll(pollFormData) {
  await votingProcess.handleFormSubmit(pollFormData, poll);
}
</script>
