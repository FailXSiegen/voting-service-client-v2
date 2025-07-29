<template>
  <PageLayout :meta-title="$t('navigation.views.organizerMemberRoom')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerMemberRoom") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation />
    </template>
    <template #content>
      <router-link
        :to="{ name: RouteOrganizerEventUserNew }"
        class="btn btn-success my-3 me-3"
      >
        <i class="bi-plus bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t("view.event.create.labels.eventUser.createNew") }}
        </span>
      </router-link>
      <router-link
        :to="{ name: RouteOrganizerEventUserMultipleNew }"
        class="btn btn-secondary my-3"
      >
        <i class="bi-list bi--2xl align-middle" />
        <span class="align-middle">
          {{ $t("view.event.create.labels.eventMultipleUser.createNew") }}
        </span>
      </router-link>
      <hr />
      <VerifiedEventUserList
        :event-users="verifiedEventUsers"
        @update-to-guest="onUpdateToGuest"
        @update-to-participant="onUpdateToParticipant"
        @unverfify-event-user="onUnverfifyEventUser"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import VerifiedEventUserList from "@/modules/organizer/components/events/VerifiedEventUserList.vue";
import {
  RouteOrganizerDashboard,
  RouteOrganizerEventUserNew,
  RouteOrganizerEventUserMultipleNew,
} from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useMutation, useQuery, useSubscription } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { computed, ref } from "vue";
import { UPDATE_EVENT_USER_TO_PARTICIPANT } from "@/modules/organizer/graphql/mutation/update-event-user-to-participant";
import { UPDATE_EVENT_USER_TO_GUEST } from "@/modules/organizer/graphql/mutation/update-event-user-to-guest";
import { EVENT_USERS } from "@/modules/organizer/graphql/queries/event-users";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import t from "@/core/util/l18n";
import { UPDATE_EVENT_USER } from "@/modules/organizer/graphql/mutation/update-event-user";
import { NEW_EVENT_USER } from "@/modules/organizer/graphql/subscription/new-event-user";
import { UPDATE_EVENT_USER_ACCESS_RIGHTS } from "@/modules/organizer/graphql/subscription/update-event-user-access-rights";
import { EVENT_USER_LIFE_CYCLE } from "@/modules/organizer/graphql/subscription/event-user-life-cycle";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);
const eventUsers = ref([]);
const verifiedEventUsers = computed(() =>
  (eventUsers.value || []).filter((eventUser) => eventUser.verified),
);
let eventUsersQuery;

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

  // Fetch pending event users..
  eventUsersQuery = useQuery(
    EVENT_USERS,
    { eventId: event.value?.id },
    { fetchPolicy: "cache-and-network" },
  );
  eventUsersQuery.onResult(({ data }) => {
    if (data?.eventUsers) {
      eventUsers.value = data?.eventUsers;
    }
  });
});

// Handle new users.
const newEventUserSubscription = useSubscription(NEW_EVENT_USER, {
  eventId: id
});
newEventUserSubscription.onResult(({ data }) => {
  if (parseInt(data?.newEventUser?.eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  // Ensure eventUsers.value is an array before copying
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value || []));
  copyOfEventUsers.push({ ...data?.newEventUser });

  eventUsers.value = copyOfEventUsers;
});

// Handle update of event user access rights.
const updateEventUserAccessRightsSubscription = useSubscription(
  UPDATE_EVENT_USER_ACCESS_RIGHTS,
);
updateEventUserAccessRightsSubscription.onResult(({ data }) => {
  const { eventUserId, eventId, verified, allowToVote, voteAmount } =
    data.updateEventUserAccessRights;

  if (parseInt(eventId, 10) !== parseInt(id, 10)) {
    // This event user does not belong to our event.
    return;
  }

  // We have to make a copy to add a new entry to the event users array.
  // Ensure eventUsers.value is an array before copying
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value || []));
  const eventUser = copyOfEventUsers.find((user) => {
    return user.id === eventUserId;
  });

  if (!eventUser) {
    // No event user found. So we ignore this.
    return;
  }

  eventUser.verified = verified;
  eventUser.allowToVote = allowToVote;
  eventUser.voteAmount = voteAmount;
  eventUsers.value = copyOfEventUsers;
});

// Handle event user life cycle updates.
const eventUserLifeCycleSubscription = useSubscription(EVENT_USER_LIFE_CYCLE, {
  eventId: id
});
eventUserLifeCycleSubscription.onResult(({ data }) => {
  
  if (!data || !data.eventUserLifeCycle) {
    console.warn('[ORGANIZER DEBUG] MemberRoom - No valid data in eventUserLifeCycle event');
    return;
  }

  
  // We have to make a copy to add a new entry to the event users array.
  // Ensure eventUsers.value is an array before copying
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value || []));
  
  const eventUser = copyOfEventUsers.find((user) => {
    return (
      parseInt(user.id, 10) ===
      parseInt(data?.eventUserLifeCycle?.eventUserId, 10)
    );
  });
  
  if (!eventUser) {
    console.warn('[ORGANIZER DEBUG] MemberRoom - No matching user found for ID:', data.eventUserLifeCycle.eventUserId);
    return;
  }
    
  eventUser.online = data?.eventUserLifeCycle?.online;
  eventUsers.value = copyOfEventUsers;
});

async function onUpdateToParticipant(eventUserId) {
  const { mutate: updateEventUserToParticipant } = useMutation(
    UPDATE_EVENT_USER_TO_PARTICIPANT,
    {
      variables: {
        eventUserId,
      },
    },
  );
  await updateEventUserToParticipant();
  await eventUsersQuery.refetch();
}

async function onUpdateToGuest(eventUserId) {
  const { mutate: updateEventUserToGuest } = useMutation(
    UPDATE_EVENT_USER_TO_GUEST,
    {
      variables: {
        eventUserId,
      },
    },
  );
  await updateEventUserToGuest();
  await eventUsersQuery.refetch();
}

async function onUnverfifyEventUser(eventUserId) {
  const eventUser = (eventUsers.value || []).find(
    (eventUser) => parseInt(eventUser?.id, 10) === parseInt(eventUserId, 10),
  );
  if (!eventUser) {
    return;
  }

  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.event.user.confirm.unverify"),
  });
  dialog.onConfirm(async () => {
    const { mutate: updateEventUser } = useMutation(UPDATE_EVENT_USER, {
      variables: {
        input: {
          id: eventUser?.id,
          eventId: id,
          username: eventUser?.username,
          verified: false,
          allowToVote: eventUser?.allowToVote,
        },
      },
    });
    await updateEventUser();
    await eventUsersQuery.refetch();
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>
