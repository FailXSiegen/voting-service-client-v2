<template>
  <PageLayout
    :meta-title="$t('navigation.views.organizerEventUserMultipleNew')"
  >
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerEventUserMultipleNew") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation :routes="routes" />
    </template>
    <template #content>
      <MultipleNewEventUserForm @submit="onSubmit" />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import MultipleNewEventUserForm from "@/modules/organizer/components/events/event-user/MultipleNewEventUserForm.vue";
import {
  RouteOrganizerDashboard,
  RouteOrganizerMemberRoom,
} from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { ref } from "vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { CREATE_EVENT_USER } from "@/modules/organizer/graphql/mutation/create-event-user";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { CREATE_EVENT_USER_AUTH_TOKEN } from "@/modules/organizer/graphql/mutation/create-event-user-auth-token";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: "no-cache" },
);
eventQuery.onResult(({ data }) => {
  // Check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({ name: RouteOrganizerDashboard });
    return;
  }
  event.value = data?.event;
  loaded.value = true;
});

async function onSubmit({
  usernames,
  allowToVote,
  voteAmount,
  tokenBasedLogin,
}) {
  const mutation = tokenBasedLogin
    ? CREATE_EVENT_USER_AUTH_TOKEN
    : CREATE_EVENT_USER;
  // Create new Event users.
  for (const username of usernames) {
    const input = {
      eventId: id,
      verified: true,
      allowToVote,
      voteAmount: voteAmount || 0,
    };
    input[tokenBasedLogin ? "email" : "username"] = username;
    const { mutate: createEventUser } = useMutation(mutation, {
      variables: { input },
    });
    await createEventUser();
  }

  // Back to member room.
  await router.push({ name: RouteOrganizerMemberRoom });

  // Show success message.
  toast(t("success.organizer.eventUser.createdSuccessfully"), {
    type: "success",
  });
}
</script>
