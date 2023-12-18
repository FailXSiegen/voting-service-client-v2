<template>
  <router-link
    v-if="!eventIsRunning"
    :to="{ name: RouteOrganizerPollsNew }"
    class="btn btn-success my-3 mr-3"
  >
    <i class="bi-plus bi--2xl align-middle" />
    <span class="align-middle">
      {{ $t("view.polls.headlines.createTitle") }}
    </span>
  </router-link>
  <AlertBox
    v-else
    type="info"
    :message="$t('view.polls.listing.async.eventActiveCantCreatePoll')"
  />

  <InactivePollListing
    v-if="polls?.length > 0"
    :polls="polls"
    :current-online-user-count="verifiedUsersCountAllowToVoteOnline"
    :show-start-button="false"
    :disabled="eventIsRunning"
    @copy="onCopyPoll"
    @edit="onEditPoll"
    @remove="onRemovePoll"
    @start="onStartPoll"
  />
</template>

<script setup>
import AlertBox from "@/core/components/AlertBox.vue";
import InactivePollListing from "@/modules/organizer/components/events/poll/InactivePollListing.vue";
import { ref, computed } from "vue";
import {
  RouteOrganizerPollsCopy,
  RouteOrganizerPollsEdit,
  RouteOrganizerPollsNew,
} from "@/router/routes";
import { POLLS } from "@/modules/eventUser/graphql/queries/polls";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import t from "@/core/util/l18n";
import { REMOVE_POLL } from "@/modules/organizer/graphql/mutation/remove-poll";
import { toast } from "vue3-toastify";
import { getCurrentUnixTimeStamp } from "@/core/util/time-stamp";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
const route = useRoute();
const id = route.params.id;
const router = useRouter();
const eventIsRunning = computed(
  () =>
    (props.event?.active === true || props.event?.active === 1) &&
    props.event?.scheduledDatetime > 0 &&
    props.event?.scheduledDatetime <= getCurrentUnixTimeStamp(),
);
const polls = ref([]);

// Fetch polls with no results.
const pollsQuery = useQuery(
  POLLS,
  { eventId: props.event.id },
  { fetchPolicy: "cache-and-network" },
);
pollsQuery.onResult(({ data }) => {
  polls.value = data?.polls ? data?.polls : [];
});

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
    await pollsQuery.refetch();
    // Show success message.
    toast(t("success.organizer.poll.deletedSuccessfully"), { type: "success" });
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>
