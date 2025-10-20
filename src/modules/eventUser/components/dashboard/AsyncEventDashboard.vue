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
    <template v-if="eventIsRunning && !eventIsFinish">
      <PollList
        v-if="availablePolls?.length > 0"
        :polls="availablePolls"
        @play="onClickPlayPoll"
      />
      <PollModal
        ref="pollModal"
        :poll="activePoll"
        :event="event"
        :event-user="eventUser"
        :vote-counter="voteCounter"
        @submit="onSubmitPoll"
      />
    </template>

    <AlertBox
      v-if="!eventIsRunning && !eventIsFinish"
      type="warning"
      :message="
        $t('view.polls.eventIsNotRunning', {
          date: eventStartDate,
          time: eventStartTime,
        })
      "
    />

    <AlertBox
      v-if="eventIsFinish"
      type="info"
      :message="$t('view.polls.eventIsFinish')"
    />

    <ResultListing
      v-if="eventIsFinish && pollResults?.length > 0"
      :event-record="event"
      :poll-results="pollResults"
    />
  </template>
</template>

<script setup>
import NotVerifiedWidget from "@/modules/eventUser/components/dashboard/NotVerifiedWidget.vue";
import ConnectionLostOverlay from "@/modules/eventUser/components/dashboard/ConnectionLostOverlay.vue";
import DashboardStats from "@/modules/eventUser/components/dashboard/DashboardStats.vue";
import PollModal from "@/modules/eventUser/components/dashboard/poll/modal/PollModal.vue";
import PollList from "@/modules/eventUser/components/dashboard/poll/PollList.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";

import { useCore } from "@/core/store/core";
import { computed, ref } from "vue";
import { useQuery, useSubscription } from "@vue/apollo-composable";
import { toast } from "vue3-toastify";
import l18n from "@/l18n";

import { POLLS_WITH_VOTE_STATUS } from "@/modules/eventUser/graphql/queries/polls-with-vote-status";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { useVotingProcess } from "@/modules/eventUser/composable/voting-process";
import {
  getCurrentUnixTimeStamp,
  convertTimeStampToDateString,
  convertTimeStampToTimeString,
} from "@/core/util/time-stamp";
import { usePollStatePersistence } from "@/core/composable/poll-state-persistence";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const coreStore = useCore();
const eventUser = ref(coreStore.getEventUser);
const activePoll = ref(null);
const pollModal = ref(null);
const highlightStatusChange = ref(false);
const availablePolls = ref([]);
const pollResults = ref([]);
const pollStatePersistence = usePollStatePersistence();
const { canVote } = pollStatePersistence;
const votingProcess = useVotingProcess(eventUser, props.event);
const voteCounter = votingProcess.voteCounter;
votingProcess.setVotingCompletedCallback(onVotingCompleted);
const connectionLost = computed(
  () => !eventUser.value?.online || !eventUser.value?.id,
);
const eventIsRunning = computed(
  () =>
    (props.event?.active === true || props.event?.active === 1) &&
    props.event?.scheduledDatetime > 0 &&
    props.event?.scheduledDatetime <= getCurrentUnixTimeStamp(),
);
const eventIsFinish = computed(
  () => props.event?.finished === true || props.event?.finished === 1,
);
const eventStartDate = computed(() =>
  convertTimeStampToDateString(props.event?.scheduledDatetime),
);
const eventStartTime = computed(() =>
  convertTimeStampToTimeString(props.event?.scheduledDatetime),
);

const pollsQuery = useQuery(
  POLLS_WITH_VOTE_STATUS,
  { eventId: props.event.id, eventUserId: eventUser.value.id },
  { fetchPolicy: "cache-and-network" },
);
pollsQuery.onResult(({ data }) => {
  availablePolls.value = data?.polls || [];
  if (availablePolls.value.length == 0) {
    return;
  }

  if (activePoll.value === null && availablePolls.value.length > 0) {
    votingProcess.resetVoteCounts && votingProcess.resetVoteCounts();
  }

  // Keine completedPolls mehr - Vote-Status wird direkt aus userVoteCycle gelesen
});

const pollResultsQuery = useQuery(
  POLLS_RESULTS,
  { eventId: props.event.id, page: 0, pageSize: 99999 },
  { fetchPolicy: "cache-and-network" },
);
pollResultsQuery.onResult(({ data }) => {
  if (!data?.pollResult?.length > 0) {
    return;
  }
  pollResults.value = data.pollResult;
});

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

function onClickPlayPoll(poll) {
  if (activePoll.value?.id !== poll.id) {
    votingProcess.resetVoteCounts && votingProcess.resetVoteCounts();
    voteCounter.value = 1;
  }
  
  activePoll.value = poll;
  pollModal.value.showModal();
}

async function onSubmitPoll(pollFormData) {
  try {
    if (pollFormData.votesToUse && parseInt(pollFormData.votesToUse, 10) > 0) {
      const votesToUse = parseInt(pollFormData.votesToUse, 10);
      
      if (votesToUse === eventUser.value.voteAmount) {
        pollFormData.useAllAvailableVotes = true;
        await votingProcess.handleFormSubmit(pollFormData, activePoll);
      } else {
        await votingProcess.handleFormSubmit(pollFormData, activePoll, votesToUse);
      }
    } else {
      await votingProcess.handleFormSubmit(pollFormData, activePoll);
    }
  } catch (error) {
    toast(l18n.global.tc("view.polls.error.submission"), { type: "error" });
  }
}

async function onVotingCompleted() {
  if (activePoll.value) {
    pollStatePersistence.saveVote(activePoll.value.id, eventUser.value, props.event);
    
    pollModal.value.hideModal();
    activePoll.value = null;
    
    // Polls neu laden, um aktuellen Vote-Status zu holen
    pollsQuery.refetch();
  }

  toast(l18n.global.t("view.user.verified.voted"), {
    type: "success",
    autoClose: 3000,
    hideProgressBar: false,
    closeButton: true,
    position: "top-right",
  });
}
</script>