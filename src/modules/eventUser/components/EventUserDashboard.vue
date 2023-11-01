<template>
  <PageLayout>
    <template #actions>
      <DashboardActions @logout="onLogout" />
    </template>
    <template v-if="eventUser" #content>
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
        <PollStatus
          :exist-active-poll="existActivePoll"
          :poll-state="pollState"
        />
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
  </PageLayout>
</template>

<script setup>
// TODO what about the user lost connection after the frist vote. What about the left votes?
// TODO What if the user disconnected while the poll is active and reconnects?
import PageLayout from "@/modules/eventUser/components/PageLayout.vue";
import DashboardActions from "@/modules/eventUser/components/dashboard/DashboardActions.vue";
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
import { useMutation, useQuery, useSubscription } from "@vue/apollo-composable";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { toast } from "vue3-toastify";
import l18n from "@/l18n";
import { logout } from "@/core/auth/login";
import t from "@/core/util/l18n";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { CREATE_POLL_SUBMIT_ANSWER } from "@/modules/eventUser/graphql/mutation/create-poll-submit-answer";
import { POLL_LIFE_CYCLE_SUBSCRIPTION } from "@/modules/eventUser/graphql/subscription/poll-life-cycle";

const coreStore = useCore();
const emit = defineEmits(["exit"]);
defineProps({
  event: {
    type: Object,
    required: true,
  },
});

// Data.
const eventUser = ref(coreStore.getEventUser);
const event = ref(coreStore.getEvent);
const meetingFrameIsActive = ref(false);
const page = ref(0);
const pageSize = ref(1);
const showMoreEnabled = ref(true);
const voteCounter = ref(1);
const pollState = ref("closed");
const poll = ref(null);
const pollModal = ref(null);
const resultModal = ref(null);
const pollResults = ref([]);
const pollResultId = ref(null);
const lastPollResult = ref(null);
const highlightStatusChange = ref(false);

// Api.

// Fetch poll results.
const pollResultsQuery = useQuery(
  POLLS_RESULTS,
  { eventId: event.value?.id, page, pageSize },
  { fetchPolicy: "cache-and-network" }
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
      (a, b) => b.createDatetime - a.createDatetime
    );
  }
  if (data?.pollResult) {
    lastPollResult.value = data.pollResult[0];
  }
});

// Computed.
const existActivePoll = computed(
  () => poll.value !== null && pollState.value !== "closed"
);
const connectionLost = computed(
  () => !eventUser.value?.online || !eventUser.value?.id
);

// Subscriptions.
const updateEventUserAccessRightsSubscription = useSubscription(
  UPDATE_EVENT_USER_ACCESS_RIGHTS,
  { eventUserId: eventUser.value.id }
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
  { eventId: event.value.id }
);
pollLifeCycleSubscription.onResult(({ data }) => {
  if (!data?.pollLifeCycle) {
    return;
  }

  // Store the pollResultId.
  pollResultId.value = data.pollLifeCycle.pollResultId ?? pollResultId.value;
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

function onLogout() {
  logout()
    .then(() => toast(t("success.logout.eventUser"), { type: "success" }))
    .then(() => emit("exit"));
}

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
  const input = {
    eventUserId: eventUser.value.id,
    pollResultId: pollResultId.value ?? 0,
    type: poll.value.type,
    voteCycle: voteCounter.value,
    answerItemLength: 1,
    answerItemCount: 1,
    multivote: pollFormData.useAllAvailableVotes,
  };
  if (pollFormData.abstain) {
    // Abstain.
    input.answerContent = l18n.global.tc("view.polls.modal.abstain");
    input.possibleAnswerId = null;
    await mutateAnswer(input);
  } else if (pollFormData.multipleAnswers?.length > 0) {
    // Multiple answers to persist.
    let answerCounter = 1;
    for await (const answerId of pollFormData.multipleAnswers) {
      const answer = poll.value.possibleAnswers.find(
        (x) => parseInt(x.id) === parseInt(answerId)
      );
      input.answerContent = answer.content;
      input.possibleAnswerId = answer.id;
      input.answerItemLength = pollFormData.multipleAnswers.length;
      input.answerItemCount = answerCounter;
      await mutateAnswer(input);
      answerCounter++;
    }
  } else if (pollFormData.singleAnswer) {
    // Single answers to persist.
    const answer = poll.value.possibleAnswers.find(
      (x) => parseInt(x.id) === parseInt(pollFormData.singleAnswer)
    );
    input.answerContent = answer.content;
    input.possibleAnswerId = answer.id;

    await mutateAnswer(input);
  } else {
    // Invalid form data. Just ignore that submit.
    console.warn("invalid form data. Submit gets ignored!");
    return;
  }

  if (
    voteCounter.value >= (eventUser.value?.voteAmount || 1) ||
    pollFormData.useAllAvailableVotes
  ) {
    // Finish
    voteCounter.value = 1;
    // Close the poll modal.
    pollModal.value.hideModal();
    return;
  }

  voteCounter.value++;
}

async function mutateAnswer(input) {
  const createPollSubmitAnswerMutation = useMutation(
    CREATE_POLL_SUBMIT_ANSWER,
    {
      variables: { input },
    }
  );
  await createPollSubmitAnswerMutation.mutate();
}
</script>
