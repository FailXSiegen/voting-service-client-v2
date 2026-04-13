<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsEdit')">
    <template #title>
      {{ $t('navigation.views.organizerEventsEdit') }} -
      <span v-if="event?.title">{{ event?.title }}</span>
      <router-link
        :to="{ name: RouteOrganizerEvents }"
        class="btn btn-secondary mb-3 mt-2 float-end d-none d-md-inline-block"
      >
        <i class="bi-arrow-left bi--1xl me-1" />
        <span class="align-middle">
          {{ $t('navigation.backToEvents') }}
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
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import EventForm from '@/modules/organizer/components/events/EventForm.vue';
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
} from '@/router/routes';
import { reactive, ref } from 'vue';
import { handleError } from '@/core/error/error-handler';
import { toast } from 'vue3-toastify';
import t from '@/core/util/l18n';
import { useCore } from '@/core/store/core';
import { useRoute, useRouter } from 'vue-router';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { EVENT } from '@/modules/organizer/graphql/queries/event';
import { NetworkError } from '@/core/error/NetworkError';
import { QUERY_ZOOM_MEETING } from '@/modules/organizer/graphql/queries/zoom-meeting';
import { QUERY_JITSI_MEETING } from '@/modules/organizer/graphql/queries/jitsi-meeting';
import { UPDATE_EVENT } from '@/modules/organizer/graphql/mutation/update-event';
import { VideoConferenceType } from '@/modules/organizer/enum';

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
  title: '',
  slug: '',
  description: '',
  styles: '',
  logo: '',
  scheduledDatetime: Math.floor(Date.now() / 1000),
  lobbyOpen: false,
  allowMagicLink: false,
  publicVoteVisible: false,
  active: false,
  orgnaizerId: coreStore.user?.id ?? 0,
  multivoteType: 1,
  videoConferenceConfig: '{}',
  videoConference: null,
  readOnlyUsername: false,
});

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: 'no-cache' }
);
function prefillFormData(eventData) {
  prefillData.title = eventData?.title ?? '';
  prefillData.slug = eventData?.slug ?? '';
  prefillData.description = eventData?.description ?? '';
  prefillData.styles = eventData?.styles ?? '';
  prefillData.logo = eventData?.logo ?? '';
  prefillData.scheduledDatetime = eventData?.scheduledDatetime ?? 0;
  prefillData.lobbyOpen = eventData?.lobbyOpen ?? false;
  prefillData.active = eventData?.active ?? false;
  prefillData.multivoteType = eventData?.multivoteType ?? 1;
  prefillData.async = eventData?.async ?? false;
  prefillData.allowMagicLink = eventData?.allowMagicLink ?? false;
  prefillData.publicVoteVisible = eventData?.publicVoteVisible ?? true;
  prefillData.endDatetime = eventData?.endDatetime ?? 0;
  prefillData.publicnameReadonly = eventData?.publicnameReadonly ?? false;
}

function fetchVideoConferenceProvider(config) {
  const configType = parseInt(config.type, 10);

  if (configType === VideoConferenceType.JITSI) {
    const query = useQuery(QUERY_JITSI_MEETING, { id: config.id }, { fetchPolicy: 'no-cache' });
    query.onResult(({ data }) => {
      prefillData.videoConference = data.jitsiMeeting ?? null;
      prefillData.videoConferenceConfig = event.value?.videoConferenceConfig ?? '{}';
      loaded.value = true;
    });
  } else {
    const query = useQuery(QUERY_ZOOM_MEETING, { id: config.id }, { fetchPolicy: 'no-cache' });
    query.onResult(({ data }) => {
      prefillData.videoConference = data.zoomMeeting ?? null;
      prefillData.videoConferenceConfig = event.value?.videoConferenceConfig ?? '{}';
      loaded.value = true;
    });
  }
}

eventQuery.onResult(({ data }) => {
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({ name: RouteOrganizerEvents });
    return;
  }

  event.value = data?.event ?? null;
  prefillFormData(event.value);

  let resolvedVideoConferenceConfig;
  try {
    resolvedVideoConferenceConfig = JSON.parse(event.value?.videoConferenceConfig || '{}');
  } catch (error) {
    console.warn('Failed to parse videoConferenceConfig:', error);
    resolvedVideoConferenceConfig = {};
  }

  if (!resolvedVideoConferenceConfig || !resolvedVideoConferenceConfig.id) {
    loaded.value = true;
    return;
  }

  fetchVideoConferenceProvider(resolvedVideoConferenceConfig);
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
        publicnameReadonly: formData.publicnameReadonly,
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
  toast(t('success.organizer.events.updatedSuccessfully'), { type: 'success' });
}
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>
