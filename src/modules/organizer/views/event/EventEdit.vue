<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsEdit')">
    <template #title>
      {{ $t("navigation.views.organizerEventsEdit") }} -
      <span v-if="event?.title">{{ event?.title }}</span>
      <router-link
        :to="{ name: RouteOrganizerEvents }"
        class="btn btn-secondary mb-3 mt-2 float-end d-none d-md-inline-block"
      >
        <i class="bi-arrow-left bi--1xl me-1" />
        <span class="align-middle">
          {{ $t("navigation.backToEvents") }}
        </span>
      </router-link>
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <EventForm v-if="loaded" :prefill-data="prefillData" @submit="onSubmit" />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import EventForm from "@/modules/organizer/components/events/EventForm.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
} from "@/router/routes";
import { reactive, ref } from "vue";
import { handleError } from "@/core/error/error-handler";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";
import { useRoute, useRouter } from "vue-router";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { NetworkError } from "@/core/error/NetworkError";
import { QUERY_ZOOM_MEETING } from "@/modules/organizer/graphql/queries/zoom-meeting";
import { UPDATE_EVENT } from "@/modules/organizer/graphql/mutation/update-event";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
]);

const prefillData = reactive({
  title: "",
  slug: "",
  description: "",
  styles: "",
  logo: "",
  scheduledDatetime: Math.floor(Date.now() / 1000),
  lobbyOpen: false,
  allowMagicLink: false,
  publicVoteVisible: false,
  active: false,
  orgnaizerId: coreStore.user?.id ?? 0,
  multivoteType: 1,
  videoConferenceConfig: "{}",
  videoConference: null,
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
    router.push({ name: RouteOrganizerEvents });
    return;
  }

  event.value = data?.event ?? null;

  // Prefill form data with fetched event data.
  prefillData.title = event.value?.title ?? "";
  prefillData.slug = event.value?.slug ?? "";
  prefillData.description = event.value?.description ?? "";
  prefillData.styles = event.value?.styles ?? "";
  prefillData.logo = event.value?.logo ?? "";
  prefillData.scheduledDatetime = event.value?.scheduledDatetime ?? 0;
  prefillData.lobbyOpen = event.value?.lobbyOpen ?? false;
  prefillData.active = event.value?.active ?? false;
  prefillData.multivoteType = event.value?.multivoteType ?? 1;
  prefillData.async = event.value?.async ?? false;
  prefillData.allowMagicLink = event.value?.allowMagicLink ?? false;
  prefillData.publicVoteVisible = event.value?.publicVoteVisible ?? true;
  prefillData.endDatetime = event.value?.endDatetime ?? 0;

  // WICHTIGER FIX: Defensive Programmierung für JSON.parse und null-safety
  let resolvedVideoConferenceConfig;
  try {
    resolvedVideoConferenceConfig = JSON.parse(event.value?.videoConferenceConfig || "{}");
  } catch (error) {
    console.warn("Failed to parse videoConferenceConfig:", error);
    resolvedVideoConferenceConfig = {};
  }
  
  if (!resolvedVideoConferenceConfig || !resolvedVideoConferenceConfig.id) {
    // No config exist.
    loaded.value = true;
    return;
  }

  // Fetch video conference system to edit.
  const queryZoomMeeting = useQuery(
    QUERY_ZOOM_MEETING,
    { id: resolvedVideoConferenceConfig.id },
    { fetchPolicy: "no-cache" },
  );
  queryZoomMeeting.onResult(({ data }) => {
    prefillData.videoConference = data.zoomMeeting ?? null;
    prefillData.videoConferenceConfig =
      event.value?.videoConferenceConfig ?? "{}";
    loaded.value = true;
  });
});

async function onSubmit({ formData, action }) {
  // Update Events.
  const { mutate: updateEvent } = useMutation(UPDATE_EVENT, {
    variables: {
      input: {
        id: event.value?.id,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        styles: formData.styles,
        logo: formData.logo,
        scheduledDatetime: formData.scheduledDatetime,
        lobbyOpen: formData.lobbyOpen,
        active: formData.active,
        multivoteType: formData.multivoteType,
        videoConferenceConfig: formData.videoConferenceConfig,
        async: formData.async,
        allowMagicLink: formData.allowMagicLink,
        publicVoteVisible: formData.publicVoteVisible,
        endDatetime: formData.endDatetime,
      },
    },
  });
  await updateEvent();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  if (action === 'save_and_continue') {
    // Stay on the current page
    // Optionally refetch the event data
    await eventQuery.refetch();
  } else {
    // Back to list
    await router.push({ name: RouteOrganizerEvents });
  }
  // Show success message.
  toast(t("success.organizer.events.updatedSuccessfully"), { type: "success" });
}
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>
