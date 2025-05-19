<template>
  <ActivePoll
    v-if="activePoll && activePollEventUser"
    :active-poll="activePoll"
    :active-poll-event-user="activePollEventUser"
    :active-poll-answer-count="activePollAnswerCount"
    :active-poll-max-answer="activePollMaxAnswer"
    :poll-user-count="pollUserCount"
    :poll-user-voted-count="pollUserVotedCount"
    @close="onCloseActivePoll"
  />
  <div
    v-if="!activePoll"
    class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center"
    role="alert"
  >
    <p class="mb-0">
      {{ $t("view.user.verified.noActivePoll") }}
    </p>
  </div>
  <p>
    {{ $t("view.polls.userCountText") }}
    <span
      :class="[
        'badge',
        verifiedUsersCountAllowToVoteOnline > 0
          ? 'text-bg-success'
          : 'text-bg-danger',
      ]"
    >
      {{ verifiedUsersCountAllowToVoteOnline }}
    </span>
  </p>
  <AlertBox
    v-if="verifiedUsersCountAllowToVoteOnline === 0"
    type="danger"
    :message="$t('view.polls.noActiveUser')"
  />

  <hr v-if="pollsWithNoResults?.length > 0" />

  <router-link
    v-if="!activePoll"
    :to="{ name: RouteOrganizerPollsNew }"
    class="btn btn-success my-3 me-3"
  >
    <i class="bi-plus bi--2xl align-middle" />
    <span class="align-middle">
      {{ $t("view.polls.headlines.createTitle") }}
    </span>
  </router-link>
  <AlertBox
    v-else
    type="info"
    :message="$t('view.polls.createNewDisabledInfo')"
  />

  <InactivePollListing
    v-if="!activePoll && pollsWithNoResults?.length > 0"
    :polls="pollsWithNoResults"
    :current-online-user-count="verifiedUsersCountAllowToVoteOnline"
    @copy="onCopyPoll"
    @edit="onEditPoll"
    @remove="onRemovePoll"
    @start="onStartPoll"
  />

  <ResultListing
    v-if="!activePoll && pollResults?.length > 0"
    :poll-results="pollResults"
    :event-record="event"
  />
</template>

<script setup>
import AlertBox from "@/core/components/AlertBox.vue";
import ActivePoll from "@/modules/organizer/components/events/poll/ActivePoll.vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import InactivePollListing from "@/modules/organizer/components/events/poll/InactivePollListing.vue";
import {
  RouteOrganizerPollsCopy,
  RouteOrganizerPollsEdit,
  RouteOrganizerPollsNew,
} from "@/router/routes";
import { useRoute, useRouter } from "vue-router";
import { useMutation, useQuery, useSubscription } from "@vue/apollo-composable";
import { computed, ref } from "vue";
import { EVENT_USERS } from "@/modules/organizer/graphql/queries/event-users";
import { ACTIVE_POLL } from "@/modules/organizer/graphql/queries/active-poll";
import { ACTIVE_POLL_EVENT_USER } from "@/modules/organizer/graphql/queries/active-poll-event-user";
import { POLLS_RESULTS } from "@/modules/organizer/graphql/queries/poll-results";
import { POLLS_WITH_NO_RESULTS } from "@/modules/organizer/graphql/queries/polls-with-no-results";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import t from "@/core/util/l18n";
import { REMOVE_POLL } from "@/modules/organizer/graphql/mutation/remove-poll";
import { toast } from "vue3-toastify";
import { START_POLL } from "@/modules/organizer/graphql/mutation/start-poll";
import { STOP_POLL } from "@/modules/organizer/graphql/mutation/stop-poll";
import { NEW_EVENT_USER } from "@/modules/organizer/graphql/subscription/new-event-user";
import { EVENT_USER_LIFE_CYCLE } from "@/modules/organizer/graphql/subscription/event-user-life-cycle";
import { POLL_ANSWER_LIVE_CYCLE } from "@/modules/organizer/graphql/subscription/poll-answer-life-cycle";
import { POLL_LIFE_CYCLE } from "@/modules/organizer/graphql/subscription/poll-life-cycle";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
const router = useRouter();
const route = useRoute();
const id = route.params.id;

const eventUsers = ref([]);
const activePoll = ref(null);
const activePollEventUser = ref(null);
const pollResults = ref([]);
const pollsWithNoResults = ref([]);
const activePollAnswerCount = ref(0);
const activePollMaxAnswer = ref(0);
const pollUserCount = ref(0);
const pollUserVotedCount = ref(0);

const page = ref(0);
const pageSize = ref(1);
const showMoreEnabled = ref(false);
const canStartPoll = ref(true);

let eventUsersQuery;
let activePollQuery;
let activePollEventUserQuery;
let pollResultsQuery;
let pollsWithNoResultsQuery;

// Queries.

// Fetch event users.
eventUsersQuery = useQuery(
  EVENT_USERS,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
eventUsersQuery.onResult(({ data }) => {
  if (data?.eventUsers) {
    eventUsers.value = data?.eventUsers;
  }
});
// Fetch active poll.
activePollQuery = useQuery(
  ACTIVE_POLL,
  { eventId: props.event.id },
  { fetchPolicy: "no-cache" },
);
activePollQuery.onResult(({ data }) => {
  if (data?.activePoll) {
    activePoll.value = data?.activePoll;
    
    // IMPORTANT: activePoll query is the source of truth for ALL voting statistics
    // It contains all the data we need directly from the database
    if (data.activePoll) {
      // Update vote counts
      const maxVotes = parseInt(data.activePoll.maxVotes, 10) || 0;
      const answerCount = parseInt(data.activePoll.answerCount, 10) || 0;
      
      // Update user counts too from the same source
      const userCount = parseInt(data.activePoll.pollUserCount, 10) || 0;
      const votedCount = parseInt(data.activePoll.pollUserVotedCount, 10) || 0;
      
      
      // Set all values from the same data source
      activePollMaxAnswer.value = maxVotes;
      activePollAnswerCount.value = answerCount;
      pollUserCount.value = userCount;
      pollUserVotedCount.value = votedCount;
    }
    
    console.log('[ORGANIZER DEBUG] SyncPollListing - Current activePoll:', activePoll.value);
  }
});

// Fetch active poll event user.
activePollEventUserQuery = useQuery(
  ACTIVE_POLL_EVENT_USER,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
activePollEventUserQuery.onResult(({ data }) => {
  
  if (data?.activePollEventUser) {
    activePollEventUser.value = data?.activePollEventUser;
    
    // Always get user counts from activePollEventUser - this is the source of truth
    if (data.activePollEventUser.pollUser && data.activePollEventUser.pollUserVoted) {
      const userCount = data.activePollEventUser.pollUser.length;
      const votedCount = data.activePollEventUser.pollUserVoted.length;
      // ALWAYS update the user count from activePollEventUser
      // This is the most accurate source for total users
      pollUserCount.value = userCount;
      
      // For voted users, always use the value from activePollEventUser
      // This is the authoritative source for which users have voted
      pollUserVotedCount.value = votedCount;
      
    }
  }
});

// Fetch poll results.
pollResultsQuery = useQuery(
  POLLS_RESULTS,
  {
    eventId: props.event.id,
    page,
    pageSize,
  },
  { fetchPolicy: "cache-and-network" },
);
pollResultsQuery.onResult(({ data }) => {
  if (data?.pollResult && data?.pollResult?.length === 10) {
    showMoreEnabled.value = true;
  }
  if (data?.pollResult) {
    pollResults.value = data?.pollResult;
  }
});

// Fetch polls with no results.
pollsWithNoResultsQuery = useQuery(
  POLLS_WITH_NO_RESULTS,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
pollsWithNoResultsQuery.onResult(({ data }) => {
  pollsWithNoResults.value = data?.pollsWithNoResults
    ? data?.pollsWithNoResults
    : [];
});
// computed.

const verifiedUsersCountAllowToVoteOnline = computed(() => {
  if (eventUsers.value?.length === 0) {
    return 0;
  }
  return eventUsers.value.filter((eventUser) => {
    return eventUser?.verified && eventUser?.online && eventUser?.allowToVote;
  }).length;
});

// Events.

function onCloseActivePoll() {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.polls.listing.stopConfirm"),
  });
  dialog.onConfirm(async () => {
    const startPollMutation = useMutation(STOP_POLL, {
      variables: { id: activePoll.value.id },
    });
    await startPollMutation.mutate();
    // Reset state.
    resetActivePoll();
    // Show success message.
    toast(t("success.organizer.poll.stoppedSuccessfully"), { type: "success" });
  });

  // Show confirm dialog.
  dialog.reveal();
}

function onCopyPoll(pollId) {
  router.push({ name: RouteOrganizerPollsCopy, params: { id, pollId } });
}

function onEditPoll(pollId) {
  router.push({ name: RouteOrganizerPollsEdit, params: { id, pollId } });
}

function onRemovePoll(pollId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.polls.listing.deleteConfirm"),
  });
  dialog.onConfirm(async () => {
    const removePollMutation = useMutation(REMOVE_POLL, {
      variables: { pollId },
    });
    await removePollMutation.mutate();
    // Refresh queries.
    await pollsWithNoResultsQuery.refetch();
    // Show success message.
    toast(t("success.organizer.poll.deletedSuccessfully"), { type: "success" });
  });

  // Show confirm dialog.
  dialog.reveal();
}

function onStartPoll(pollId) {
  canStartPoll.value = false;
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.polls.listing.startConfirm"),
  });
  dialog.onConfirm(async () => {
    const startPollMutation = useMutation(START_POLL, {
      variables: { pollId },
    });
    await startPollMutation.mutate();
    // Refresh queries.
    await activePollQuery.refetch();
    await activePollEventUserQuery.refetch();
    await pollsWithNoResultsQuery.refetch();
    // Show success message.
    toast(t("success.organizer.poll.startedSuccessfully"), { type: "success" });
    canStartPoll.value = true;
  });
  dialog.onCancel(() => {
    canStartPoll.value = true;
  });

  // Show confirm dialog.
  dialog.reveal();
}

// Subscriptions.

const newEventUserSubscription = useSubscription(NEW_EVENT_USER);
newEventUserSubscription.onResult(({ data }) => {
  if (parseInt(data?.newEventUser?.eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  copyOfEventUsers.push({ ...data?.newEventUser });
  eventUsers.value = copyOfEventUsers;
});

const eventUserLifeCycleSubscription = useSubscription(EVENT_USER_LIFE_CYCLE, {
  variables: { eventId: props.event.id }
});
eventUserLifeCycleSubscription.onResult(({ data }) => {
  if (!data || !data.eventUserLifeCycle) {
    console.warn('[ORGANIZER DEBUG] SyncPollListing - No valid data in eventUserLifeCycle event');
    return;
  }
  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  const eventUser = copyOfEventUsers.find((user) => {
    return (
      parseInt(user.id, 10) ===
      parseInt(data?.eventUserLifeCycle?.eventUserId, 10)
    );
  });
  
  if (!eventUser) {
    console.warn('[ORGANIZER DEBUG] SyncPollListing - No matching user found for ID:', data.eventUserLifeCycle.eventUserId);
    return;
  }
  eventUser.online = data?.eventUserLifeCycle?.online;
  eventUsers.value = copyOfEventUsers;

  // todo update active poll values
});

const pollAnswerLifeCycleSubscription = useSubscription(
  POLL_ANSWER_LIVE_CYCLE,
  { eventId: props.event.id }
);
pollAnswerLifeCycleSubscription.onResult(({ data }) => {
  if (!data?.pollAnswerLifeCycle) {
    console.warn('[ORGANIZER DEBUG] SyncPollListing - No valid data in pollAnswerLifeCycle event');
    return;
  }

  // IMPORTANT: Make sure we have valid numeric values for all fields
  const newAnswerCount = parseInt(data?.pollAnswerLifeCycle?.pollAnswersCount, 10) || 0;
  const newMaxVotes = parseInt(data?.pollAnswerLifeCycle?.maxVotes, 10) || 0;
  const newUserCount = parseInt(data?.pollAnswerLifeCycle?.pollUserCount, 10) || 0;
  const newVotedCount = parseInt(data?.pollAnswerLifeCycle?.pollUserVotedCount, 10) || 0;
  
  // CRITICAL: For the first PubSub update, we need to be careful about overwriting user counts
  // Only update vote-related counts from PubSub, keep the user counts from activePollEventUser
  // unless there are updates with votes
  
  // ONLY update answer count from PubSub if it's not zero (which would overwrite valid data)
  if (newAnswerCount > 0 || activePollAnswerCount.value === 0) {
    activePollAnswerCount.value = newAnswerCount;
  } 
  
  // Only update maxVotes if it's a real value (> 0) to avoid overwriting with zero
  if (newMaxVotes > 0 && newMaxVotes !== activePollMaxAnswer.value) {
    activePollMaxAnswer.value = newMaxVotes;
  }
  
  // UPDATE user counts from PubSub IF they're greater than 0
  // This ensures we get correct voted counts when answers are submitted
  if (newUserCount > 0) {
    pollUserCount.value = newUserCount;
  }
  
  if (newVotedCount > 0) {
    pollUserVotedCount.value = newVotedCount;
  }
  
  // CRITICAL: If there are answers, there must be at least one user who voted
  // Fix logical inconsistency where we have votes but no voted users
  if (activePollAnswerCount.value > 0 && pollUserVotedCount.value === 0) {
    pollUserVotedCount.value = 1;
  }
  
});

const pollLifeCycleSubscription = useSubscription(POLL_LIFE_CYCLE, {
  eventId: props.event.id  // Make sure we specify the correct eventId!
});
pollLifeCycleSubscription.onResult(({ data }) => {
  console.log('[ORGANIZER] Received POLL_LIFE_CYCLE event:', data?.pollLifeCycle);
  
  if (data?.pollLifeCycle?.poll && data?.pollLifeCycle?.state !== "closed") {
    console.log('[ORGANIZER] Setting active poll from subscription:', data.pollLifeCycle.poll);
    
    // For a new poll, only reset vote counters (not user counters)
    if (data?.pollLifeCycle?.state === "new") {
      console.log('[ORGANIZER] New poll detected, resetting vote counters only');
      
      // We don't reset activePollAnswerCount here anymore
      // Instead, we get its value from the activePoll query
      
      // For a new poll, we don't need to reset vote counts here
      // Instead, we'll get the proper values from activePollQuery
      
      // Trigger activePollQuery refetch to get the correct values from poll_result
      activePollQuery.refetch().then(result => {
        if (result?.data?.activePoll) {
          const poll = result.data.activePoll;
          
          // Update maxVotes from poll_result
          if (poll.maxVotes !== undefined) {
            const maxVotes = parseInt(poll.maxVotes, 10) || 0;
            activePollMaxAnswer.value = maxVotes;
          }
          
          // Also update answerCount from poll_result
          if (poll.answerCount !== undefined) {
            const answerCount = parseInt(poll.answerCount, 10) || 0;
            activePollAnswerCount.value = answerCount;
          }
        }
      });
      
      // Do NOT reset pollUserCount and pollUserVotedCount here!
      // These values should come from activePollEventUser
    }
    
    // Set the new active poll
    activePoll.value = data.pollLifeCycle.poll;
    
    // Always refetch poll user data when a new poll starts
    // But with a small delay to ensure things settle
    setTimeout(() => {
      activePollEventUserQuery.refetch();
    }, 200);
  }
  
  if (data?.pollLifeCycle?.state === "closed") {
    console.log('[ORGANIZER] Poll closed notification received, resetting active poll');
    resetActivePoll();
    // Force refetch all poll data to update UI
    pollResultsQuery.refetch();
    pollsWithNoResultsQuery.refetch();
    toast(t("success.organizer.poll.stoppedSuccessfully"), { type: "info" });
  }
});

// Functions.

function resetActivePoll() {
  activePoll.value = null;
  activePollEventUser.value = null;
  activePollAnswerCount.value = 0;
  activePollMaxAnswer.value = 0;
  pollUserCount.value = 0;
  pollUserVotedCount.value = 0;
  pollsWithNoResultsQuery.refetch();
  pollResultsQuery.refetch();
}
</script>
