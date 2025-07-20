<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPolls')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerPolls") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation />
    </template>
    <template #content>
      <AsyncPollListing v-if="loaded && eventIsAsync" :event="event" />
      <SyncPollListing v-else-if="loaded" :event="event" />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import SyncPollListing from "@/modules/organizer/components/events/poll/SyncPollListing.vue";
import AsyncPollListing from "@/modules/organizer/components/events/poll/AsyncPollListing.vue";

import { RouteOrganizerDashboard } from "@/router/routes";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import { ref, computed } from "vue";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);
const eventIsAsync = computed(
  () => event.value?.async === true || event.value?.async === 1,
);

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
</script>
