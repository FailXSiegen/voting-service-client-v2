<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPollsEdit')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerPollsEdit") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation />
    </template>
    <template #content>
      <PollForm
        v-if="loaded"
        :prefill-data="prefillData"
        :show-submit-and-start-button="showSubmitAndStartButton"
        :is-submitting="!canSubmit"
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
import { RouteOrganizerDashboard, RouteOrganizerPolls } from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { reactive, ref, computed } from "vue";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { POLL } from "@/modules/organizer/graphql/queries/poll";
import { UPDATE_POLL } from "@/modules/organizer/graphql/mutation/update-poll";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const eventId = route.params.id;
const pollId = route.params.pollId;
const canSubmit = ref(true);

const loaded = ref(false);
const event = ref(null);
const poll = ref(null);
const prefillData = reactive({
  title: "",
  type: "PUBLIC",
  pollAnswer: "yesNoAbstain",
  list: "",
  minVotes: 0,
  maxVotes: 1,
  allowAbstain: false,
  possibleAnswers: [],
});
const showSubmitAndStartButton = computed(() => !event.value?.async === true);

let pollQuery;

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(
  EVENT,
  { id: eventId, organizerId: coreStore.user.id },
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

  // Fetch poll to edit.
  pollQuery = useQuery(POLL, { id: pollId }, { fetchPolicy: "no-cache" });
  pollQuery.onResult(({ data }) => {
    // Check if the poll could be fetched successfully. redirect to list if not.
    if (null === data?.poll) {
      handleError(new NetworkError());
      router.push({ name: RouteOrganizerPolls });
      return;
    }

    poll.value = data?.poll;

    prefillData.title = data?.poll?.title ?? "";
    prefillData.type = data?.poll?.type ?? "PUBLIC";
    prefillData.pollAnswer = data?.poll?.pollAnswer ?? "yesNoAbstain";
    prefillData.list = data?.poll?.list ?? "";
    prefillData.minVotes = data?.poll?.minVotes ?? 0;
    prefillData.maxVotes = data?.poll?.maxVotes ?? 1;
    prefillData.allowAbstain = data?.poll?.allowAbstain ?? false;
    prefillData.possibleAnswers = data?.poll?.possibleAnswers ?? [];

    loaded.value = true;
  });
});

// Events.

async function onSubmit(formData) {
  canSubmit.value = false;
  // Update poll.
  await updatePoll(formData, false);
  // Back to polls view.
  await router.push({ name: RouteOrganizerPolls });
  // Show success message.
  toast(t("success.organizer.poll.updatedSuccessfully"), { type: "success" });
  canSubmit.value = true;
}

async function onSubmitAndStart(formData) {
  canSubmit.value = false;
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.polls.listing.startConfirm"),
  });

  dialog.onConfirm(async () => {
    // Update poll.
    await updatePoll(formData, true);
    // Back to polls view.
    await router.push({ name: RouteOrganizerPolls });
    // Show success message.
    toast(t("success.organizer.poll.updatedAndStartedSuccessfully"), {
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
function updatePoll(data, instantStart) {
  const updatePollMutation = useMutation(UPDATE_POLL, {
    variables: {
      input: {
        id: pollId,
        eventId: eventId,
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
  return updatePollMutation.mutate();
}
</script>
