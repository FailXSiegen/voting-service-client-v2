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
      <PollForm
        :show-submit-and-start-button="showSubmitAndStartButton"
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
import { ref, computed } from "vue";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { CREATE_POLL } from "@/modules/organizer/graphql/mutation/create-poll";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);
const showSubmitAndStartButton = computed(() => !event.value?.async === true);

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
});

async function onSubmit(formData) {
  // Create new poll.
  await createNewPoll(formData, false);
  // Back to polls view.
  await router.push({ name: RouteOrganizerPolls });
  // Show success message.
  toast(t("success.organizer.poll.createdSuccessfully"), { type: "success" });
}

async function onSubmitAndStart(formData) {
  // Create new poll.
  await createNewPoll(formData, true);
  // Back to polls view.
  await router.push({ name: RouteOrganizerPolls });
  // Show success message.
  toast(t("success.organizer.poll.createdAndStartedSuccessfully"), {
    type: "success",
  });
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
