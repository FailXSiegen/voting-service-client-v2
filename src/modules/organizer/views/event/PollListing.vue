<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPolls')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerPolls') }}
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
          {{ $t('view.user.verified.noActivePoll') }}
        </p>
      </div>
      <p>
        {{ $t('view.polls.userCountText') }}
        <span
          :class="[
            'badge',
            verifiedUsersCountAllowToVoteOnline > 0 ? 'badge-success' : 'badge-danger'
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

      <hr v-if="pollsWithNoResults?.length > 0">

      <router-link
        v-if="!activePoll"
        :to="{ name: RouteOrganizerPollsNew}"
        class="btn btn-success my-3 mr-3"
      >
        <i class="bi-plus bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t('view.polls.headlines.createTitle') }}
        </span>
      </router-link>
      <AlertBox
        v-else
        type="info"
        :message="$t('view.polls.createNewDisabledInfo')"
      />

      <InactivePollListing
        v-if="!activePoll && pollsWithNoResults?.length > 0"
        :polls-with-no-results="pollsWithNoResults"
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
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import EventNavigation from '@/modules/organizer/components/EventNavigation.vue';
import AlertBox from "@/core/components/AlertBox.vue";
import ActivePoll from "@/modules/organizer/components/events/poll/ActivePoll.vue";
import ResultListing from "@/modules/organizer/components/events/poll/ResultListing.vue";
import InactivePollListing from "@/modules/organizer/components/events/poll/InactivePollListing.vue";
import {
  getRoutesByName,
  RouteOrganizerDashboard,
  RouteOrganizerLobbyRoom,
  RouteOrganizerMemberRoom,
  RouteOrganizerPollResults,
  RouteOrganizerPolls, RouteOrganizerPollsCopy, RouteOrganizerPollsEdit,
  RouteOrganizerPollsNew
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";
import {useMutation, useQuery, useSubscription} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {computed, ref} from "vue";
import {EVENT_USERS} from "@/modules/organizer/graphql/queries/event-users";
import {ACTIVE_POLL} from "@/modules/organizer/graphql/queries/active-poll";
import {ACTIVE_POLL_EVENT_USER} from "@/modules/organizer/graphql/queries/active-poll-event-user";
import {POLLS_RESULTS} from "@/modules/organizer/graphql/queries/poll-results";
import {POLLS_WITH_NO_RESULTS} from "@/modules/organizer/graphql/queries/polls-with-no-results";
import {createConfirmDialog} from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import i18n from "@/l18n";
import {REMOVE_POLL} from "@/modules/organizer/graphql/mutation/remove-poll";
import {toast} from "vue3-toastify";
import {START_POLL} from "@/modules/organizer/graphql/mutation/start-poll";
import {STOP_POLL} from "@/modules/organizer/graphql/mutation/stop-poll";
import {NEW_EVENT_USER} from "@/modules/organizer/graphql/subscription/new-event-user";
import {EVENT_USER_LIFE_CYCLE} from "@/modules/organizer/graphql/subscription/event-user-life-cycle";
import {POLL_ANSWER_LIVE_CYCLE} from "@/modules/organizer/graphql/subscription/poll-answer-life-cycle";
import {POLL_LIFE_CYCLE} from "@/modules/organizer/graphql/subscription/poll-life-cycle";

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

let eventUsersQuery;
let activePollQuery;
let activePollEventUserQuery;
let pollResultsQuery;
let pollsWithNoResultsQuery;

// Queries.

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
  loaded.value = true;

  // Fetch event users.
  eventUsersQuery = useQuery(EVENT_USERS, {eventId: event.value?.id}, {fetchPolicy: "cache-and-network"});
  eventUsersQuery.onResult(({data}) => {
    if (data?.eventUsers) {
      eventUsers.value = data?.eventUsers;
    }
  });

  // Fetch active poll.
  activePollQuery = useQuery(ACTIVE_POLL, {eventId: event.value?.id}, {fetchPolicy: "cache-and-network"});
  activePollQuery.onResult(({data}) => {
    if (data?.activePoll) {
      activePoll.value = data?.activePoll;
    }
  });

  // Fetch active poll event user.
  activePollEventUserQuery = useQuery(ACTIVE_POLL_EVENT_USER, {eventId: event.value?.id}, {fetchPolicy: "cache-and-network"});
  activePollEventUserQuery.onResult(({data}) => {

    if (data?.activePollEventUser) {
      activePollEventUser.value = data?.activePollEventUser;
    }

    if (data?.activePollEventUser && data?.activePollEventUser?.pollUserVoted && data.activePollEventUser?.pollUser) {
      // @todo what happens here?!
      data.activePollEventUser.pollUserVoted.forEach((pollUserVoted) => {
        data.activePollEventUser.pollUser.forEach((pollUser, index) => {
          if (parseInt(pollUser.eventUserId, 10) === parseInt(pollUserVoted.eventUserId, 10)) {
            data.activePollEventUser.pollUser[index].voted = true;
          }
        });
      });
    }
  });

  // Fetch poll results.
  pollResultsQuery = useQuery(POLLS_RESULTS, {
    eventId: event.value?.id,
    page,
    pageSize
  }, {fetchPolicy: "cache-and-network"});
  pollResultsQuery.onResult(({data}) => {
    if (data?.pollResult && data?.pollResult?.length === 10) {
      showMoreEnabled.value = true;
    }
    if (data?.pollResult) {
      pollResults.value = data?.pollResult;
    }
  });

  // Fetch polls with no results.
  pollsWithNoResultsQuery = useQuery(POLLS_WITH_NO_RESULTS, {eventId: event.value?.id}, {fetchPolicy: "cache-and-network"});
  pollsWithNoResultsQuery.onResult(({data}) => {
    if (data?.pollsWithNoResults) {
      pollsWithNoResults.value = data?.pollsWithNoResults;
    }
  });
});

// computed.

const verifiedUsersCountAllowToVoteOnline = computed(() => {
  if (eventUsers.value?.length === 0) {
    return 0;
  }
  return eventUsers.value.filter(eventUser => {
    return eventUser?.verified && eventUser?.online && eventUser?.allowToVote;
  }).length;
});

// Events.

function onCloseActivePoll() {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.polls.listing.stopConfirm')
  });
  dialog.onConfirm(async () => {
    const startPollMutation = useMutation(STOP_POLL, {variables: {id: activePoll.value.id}});
    await startPollMutation.mutate();
    // Reset state.
    resetActivePoll();
    // Show success message.
    toast(i18n.global.tc('success.organizer.poll.stoppedSuccessfully'), {type: 'success'});
  });

  // Show confirm dialog.
  dialog.reveal();
}

function onCopyPoll(pollId) {
  router.push({name: RouteOrganizerPollsCopy, params: {id, pollId}});
}

function onEditPoll(pollId) {
  router.push({name: RouteOrganizerPollsEdit, params: {id, pollId}});
}

function onRemovePoll(pollId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.polls.listing.deleteConfirm')
  });
  dialog.onConfirm(async () => {
    const removePollMutation = useMutation(REMOVE_POLL, {variables: {pollId}});
    await removePollMutation.mutate();
    // Refresh queries.
    await pollsWithNoResultsQuery.refetch();
    // Show success message.
    toast(i18n.global.tc('success.organizer.poll.deletedSuccessfully'), {type: 'success'});
  });

  // Show confirm dialog.
  dialog.reveal();
}

function onStartPoll(pollId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.polls.listing.startConfirm')
  });
  dialog.onConfirm(async () => {
    const startPollMutation = useMutation(START_POLL, {variables: {pollId}});
    await startPollMutation.mutate();
    // Refresh queries.
    await activePollQuery.refetch();
    await activePollEventUserQuery.refetch();
    await pollsWithNoResultsQuery.refetch();
    // Show success message.
    toast(i18n.global.tc('success.organizer.poll.startedSuccessfully'), {type: 'success'});
  });

  // Show confirm dialog.
  dialog.reveal();
}

// Subscriptions.

const newEventUserSubscription = useSubscription(NEW_EVENT_USER);
newEventUserSubscription.onResult(({data}) => {
  if (parseInt(data?.newEventUser?.eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  copyOfEventUsers.push({...data?.newEventUser});
  eventUsers.value = copyOfEventUsers;
});

const eventUserLifeCycleSubscription = useSubscription(EVENT_USER_LIFE_CYCLE);
eventUserLifeCycleSubscription.onResult(({data}) => {
  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  const eventUser = copyOfEventUsers.find(user => {
    return parseInt(user.id, 10) === parseInt(data?.eventUserLifeCycle?.eventUserId, 10);
  });
  if (!eventUser) {
    // No event user found. So we ignore this.
    return;
  }
  eventUser.online = data?.eventUserLifeCycle?.online;
  eventUsers.value = copyOfEventUsers;
});

const pollAnswerLifeCycleSubscription = useSubscription(POLL_ANSWER_LIVE_CYCLE);
pollAnswerLifeCycleSubscription.onResult(({data}) => {
  if (parseInt(data?.pollAnswerLifeCycle.eventId) === parseInt(id)) {
    activePollAnswerCount.value = data?.pollAnswerLifeCycle?.pollAnswersCount;
    activePollMaxAnswer.value = data?.pollAnswerLifeCycle?.maxVotes;
    pollUserCount.value = data?.pollAnswerLifeCycle?.pollUserCount;
    pollUserVotedCount.value = data?.pollAnswerLifeCycle?.pollUserVotedCount;
  }
});

const pollLifeCycleSubscription = useSubscription(POLL_LIFE_CYCLE);
pollLifeCycleSubscription.onResult(({data}) => {
  if (data?.pollLifeCycle?.poll && data?.pollLifeCycle?.state !== 'closed') {
    activePoll.value = data.pollLifeCycle.poll;
    activePollEventUserQuery.refetch();
  }
  if (data?.pollLifeCycle?.state === 'closed') {
    resetActivePoll();
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
