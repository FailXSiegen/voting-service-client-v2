<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsNew')">
    <template #title>
      {{ $t("navigation.views.organizerEventsNew") }}
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
      <EventForm :prefill-data="null" @submit="onSubmit" />
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
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";
import { useRouter } from "vue-router";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_EVENT } from "@/modules/organizer/graphql/mutation/create-event";

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
]);

const coreStore = useCore();
const router = useRouter();

async function onSubmit(formData) {
  // Create new Events.
  const { mutate: createEvent } = useMutation(CREATE_EVENT, {
    variables: {
      input: {
        organizerId: coreStore.getOrganizer?.id,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
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
  await createEvent();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({ name: RouteOrganizerEvents });

  // Show success message.
  toast(t("success.organizer.events.createdSuccessfully"), { type: "success" });
}
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>
