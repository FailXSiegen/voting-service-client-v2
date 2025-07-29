<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPollsNew')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerPollsNew") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation />
    </template>
    <template #content>
      <!-- TEST: Diese Warnung wird immer angezeigt -->
      <div class="alert alert-info mb-3" role="alert">
        <strong>TEST:</strong> Event geladen: {{ !!event }}, Async: {{ event?.async }}, User count: {{ eventUsersCount }}
      </div>
      
      <!-- Warnung für asynchrone Events ohne Teilnehmer -->
      <div v-if="showAsyncWarning" class="alert alert-warning mb-3" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Hinweis:</strong> Für asynchrone Veranstaltungen (Briefwahl) muss mindestens ein Teilnehmer vorhanden sein, um Abstimmungen erstellen zu können.
      </div>
      
      <PollForm
        :show-submit-and-start-button="showSubmitAndStartButton"
        :is-submitting="!canSubmit || showAsyncWarning"
        @submit="onSubmit"
        @submit-and-start="onSubmitAndStart"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import PollForm from "@/modules/organizer/components/events/poll/PollForm.vue";
import AlertBox from "@/core/components/AlertBox.vue";
import { RouteOrganizerDashboard, RouteOrganizerPolls } from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { EVENT_USERS } from "@/modules/organizer/graphql/queries/event-users";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { ref, computed } from "vue";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { CREATE_POLL } from "@/modules/organizer/graphql/mutation/create-poll";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);
const eventUsers = ref([]);
const showSubmitAndStartButton = computed(() => !event.value?.async === true);
const canSubmit = ref(true);
const eventUsersCount = computed(() => (eventUsers.value || []).length);
const showAsyncWarning = computed(() => {
  return event.value?.async === true && eventUsersCount.value === 0;
});

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: "no-cache" },
);
eventQuery.onResult(({ data }) => {
  // check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({ name: RouteOrganizerDashboard });
    return;
  }
  event.value = data?.event;
  loaded.value = true;
  
  // Debug logging for async event detection
  if (import.meta.env.DEV) {
    console.log('[DEBUG] NewPoll - Event data:', data?.event);
    console.log('[DEBUG] NewPoll - Is async event?', data?.event?.async);
  }
  
  // Immer event users laden für asynchrone Events
  if (data?.event?.async === true) {
    console.log('[NewPoll] Async event detected, loading users...');
    const eventUsersQuery = useQuery(
      EVENT_USERS,
      { eventId: data.event.id },
      { fetchPolicy: "cache-and-network" }
    );
    eventUsersQuery.onResult(({ data: usersData }) => {
      if (usersData?.eventUsers) {
        eventUsers.value = usersData.eventUsers;
        console.log('[NewPoll] Event users loaded:', usersData.eventUsers.length);
      } else {
        eventUsers.value = [];
        console.log('[NewPoll] No event users found');
      }
    });
  } else {
    console.log('[NewPoll] Not an async event, skipping user load');
  }
});

async function onSubmit(formData) {
  // Prevent submission for async events without participants
  if (showAsyncWarning.value) {
    toast("Abstimmungen können in asynchronen Veranstaltungen nur erstellt werden, wenn mindestens ein Teilnehmer vorhanden ist.", { type: "error" });
    return;
  }
  
  canSubmit.value = false;
  // Create new poll.
  await createNewPoll(formData, false);
  // Back to polls view.
  await router.push({ name: RouteOrganizerPolls });
  // Show success message.
  toast(t("success.organizer.poll.createdSuccessfully"), { type: "success" });
  canSubmit.value = true;
}

async function onSubmitAndStart(formData) {
  // Prevent submission for async events without participants
  if (showAsyncWarning.value) {
    toast("Abstimmungen können in asynchronen Veranstaltungen nur erstellt werden, wenn mindestens ein Teilnehmer vorhanden ist.", { type: "error" });
    return;
  }
  
  canSubmit.value = false;
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.polls.listing.startConfirm"),
  });

  dialog.onConfirm(async () => {
    // Create new poll.
    await createNewPoll(formData, true);
    // Back to polls view.
    await router.push({ name: RouteOrganizerPolls });
    // Show success message.
    toast(t("success.organizer.poll.createdAndStartedSuccessfully"), {
      type: "success",
    });
    canSubmit.value = true;
  });
  dialog.onCancel(() => {
    canSubmit.value = true;
  });

  // Show confirm dialog.
  dialog.reveal();
}

/**
 * @param {Object} data
 * @param  {Boolean} instantStart
 * @returns {MutateResult<TResult>}
 */
function createNewPoll(data, instantStart) {
  const createPollMutation = useMutation(CREATE_POLL, {
    variables: {
      input: {
        eventId: id,
        title: data.title,
        type: data.type,
        pollAnswer: data.pollAnswer,
        list: data.list,
        possibleAnswers: data.possibleAnswers,
        minVotes: data.minVotes,
        maxVotes: data.maxVotes,
        allowAbstain: data.allowAbstain,
      },
      instantStart,
    },
  });
  return createPollMutation.mutate();
}
</script>
