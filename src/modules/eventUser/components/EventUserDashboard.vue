<template>
  <PageLayout>
    <template #actions>
      <DashboardActions @logout="onLogout" />
    </template>
    <template
      v-if="eventUser"
      #content
    >
      <ConnectionLostOverlay v-if="connectionLost" />
      <NotVerifiedWidget
        v-if="eventUser && !eventUser.verified"
        :event-user="eventUser"
      />

      <template v-if="eventUser && eventUser.verified">
        <DashboardStats
          v-if="event && eventUser && eventUser.verified"
          :event="event"
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
          class="btn btn-info my-3 mx-auto py-2 d-flex align-items-center d-print-none mb-3"
          @click="onShowMorePollResults"
        >
          <i class="mr-3 bi bi-plus-square-fill bi--2xl" />
          {{ $t('view.results.showMore') }}
        </button>
        <AlertBox
          v-if="!showMoreEnabled"
          type="info"
          :message="$t('view.results.noMoreResults')"
        />

        <!--              <div class="container-poll-result mt-3" v-if="pollResult">-->
        <!--                <hr class="d-print-none" />-->
        <!--                <app-results :pollResult="pollResult" :eventRecord="eventRecord" />-->
        <!--              </div>-->

        <PollModal
          :poll="poll"
          :event="event"
          :event-user="eventUser"
        />

        <!--              <app-modal-poll-->
        <!--                  v-if="pollState === 'new' && eventUser.allowToVote"-->
        <!--                  :identifier="'poll' + poll.id"-->
        <!--                  :poll="poll"-->
        <!--                  :multivoteType="eventRecord.multivoteType"-->
        <!--                  :voteAmount="eventUser.voteAmount"-->
        <!--                  :trigger="openModal"-->
        <!--                  @onSubmitPoll="submitPoll"-->
        <!--                  ref="pollModal"-->
        <!--              />-->

        <!--              <app-modal-poll-result-->
        <!--                  v-if="lastPollResult && pollState === 'closed'"-->
        <!--                  :identifier="'pollResult' + lastPollResult.id"-->
        <!--                  :pollResult="lastPollResult"-->
        <!--                  :eventRecord="eventRecord"-->
        <!--                  :trigger="openModalResult"-->
        <!--                  ref="pollResultModal"-->
        <!--                  @onCloseResultModal="closeResultModal"-->
        <!--              />-->
      </template>
    </template>
  </PageLayout>
</template>

<script setup>
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

import {useCore} from "@/core/store/core";
import {computed, ref} from "vue";
import {useQuery, useSubscription} from "@vue/apollo-composable";
import {POLLS_RESULTS} from "@/modules/organizer/graphql/queries/poll-results";
import {toast} from "vue3-toastify";
import l18n from "@/l18n";
import {logout} from "@/core/auth/login";
import t from "@/core/util/l18n";
import {useRouter} from "vue-router";
import {
  UPDATE_EVENT_USER_ACCESS_RIGHTS
} from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";

const coreStore = useCore();
const emit = defineEmits(['exit']);
const props = defineProps({
  event: {
    type: Object,
    required: true
  }
});
const router = useRouter();

// Data.
const eventUser = ref(coreStore.getEventUser);
const event = ref(coreStore.getEvent);
const meetingFrameIsActive = ref(false);
const pollState = ref('closed');
// const poll = ref(null);
const poll = ref({
  "id": "8",
  "title": "test23",
  "pollAnswer": "yesNoAbstain",
  "type": "SECRET",
  "list": "",
  "possibleAnswers": [
    {
      "id": "25",
      "content": "Ja"
    },
    {
      "id": "26",
      "content": "Nein"
    },
    {
      "id": "27",
      "content": "Enthaltung"
    }
  ],
  "minVotes": 0,
  "maxVotes": 0,
  "allowAbstain": false
});
const pollResults = ref([]);

const page = ref(0);
const pageSize = ref(1);
const showMoreEnabled = ref(true);
const loaded = ref(false);

// Api.

// Fetch poll results.
const pollResultsQuery = useQuery(
    POLLS_RESULTS,
    {eventId: event.value?.id, page, pageSize},
    {fetchPolicy: "cache-and-network"}
);
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

// Computed.

const existActivePoll = computed(() => poll.value !== null && pollState.value !== 'closed');
const connectionLost = computed(() => !eventUser.value.online);

// Subscriptions.

const updateEventUserAccessRightsSubscription = useSubscription(UPDATE_EVENT_USER_ACCESS_RIGHTS, {eventUserId: eventUser.value.id});
updateEventUserAccessRightsSubscription.onResult(({data}) => {
  if (data.updateEventUserAccessRights) {
    const {verified, voteAmount, allowToVote} = data.updateEventUserAccessRights;
    coreStore.updateEventUserAccessRights(verified, voteAmount, allowToVote);
  }
});

// Events.

function onLogout() {
  logout()
      .then(() => toast(t('success.logout.eventUser'), {type: 'success'}))
      .then(() => emit('exit'));
}

function onJoinMeeting() {
  meetingFrameIsActive.value = true;
}

function onShowMorePollResults() {
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

</script>
