<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsEdit')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerEventsEdit') }}
        <router-link
          :to="{name: RouteOrganizerEvents}"
          class="btn btn-secondary mb-3 float-right d-none d-md-inline-block"
        >
          <i class="bi-arrow-left bi--1xl mr-1" />
          <span class="align-middle">
            {{ $t('view.videoConference.backToListView') }}
          </span>
        </router-link>
      </div>
    </template>
    <template #header>
      <EventNavigation :routes="routes" />
    </template>
    <template #content>
      <EventForm
        v-if="loaded"
        :prefill-data="prefillData"
        @submit="onSubmit"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import EventNavigation from '@/modules/organizer/components/EventNavigation.vue';
import EventForm from '@/modules/organizer/components/events/EventForm.vue';
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference
} from "@/router/routes";
import {reactive, ref} from "vue";
import {handleError} from "@/core/error/error-handler";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";
import {useMutation, useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {NetworkError} from "@/core/error/NetworkError";
import {QUERY_ZOOM_MEETING} from "@/modules/organizer/graphql/queries/zoom-meeting";
import {UPDATE_EVENT} from "@/modules/organizer/graphql/mutation/update-event";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);

const prefillData = reactive({
  title: '',
  slug: '',
  description: '',
  scheduledDatetime: Math.floor(Date.now() / 1000),
  lobbyOpen: false,
  active: false,
  orgnaizerId: coreStore.user?.id ?? 0,
  multivoteType: 1,
  videoConferenceConfig: '{}',
  videoConference: null,
});

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(EVENT, {id, organizerId: coreStore.user.id}, {fetchPolicy: "no-cache"});
eventQuery.onResult(({data}) => {
  // check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({name: RouteOrganizerEvents});
    return;
  }

  event.value = data?.event ?? null;

  // Prefill form data with fetched event data.
  prefillData.title = event.value?.title ?? '';
  prefillData.slug = event.value?.slug ?? '';
  prefillData.description = event.value?.description ?? '';
  prefillData.scheduledDatetime = event.value?.scheduledDatetime ?? 0;
  prefillData.lobbyOpen = event.value?.lobbyOpen ?? false;
  prefillData.active = event.value?.active ?? false;
  prefillData.multivoteType = event.value?.multivoteType ?? 1;

  const resolvedVideoConferenceConfig = JSON.parse(event.value?.videoConferenceConfig);
  if (!resolvedVideoConferenceConfig.id) {
    // No config exist.
    loaded.value = true;
    return;
  }

  // Fetch video conference system to edit.
  const queryZoomMeeting = useQuery(QUERY_ZOOM_MEETING, {id: resolvedVideoConferenceConfig.id}, {fetchPolicy: "no-cache"});
  queryZoomMeeting.onResult(({data}) => {
    prefillData.videoConference = data.zoomMeeting ?? null;
    prefillData.videoConferenceConfig = event.value?.videoConferenceConfig ?? '{}';
    loaded.value = true;
  });
});

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents
]);

async function onSubmit(formData) {
  // Update Events.
  const {mutate: updateEvent} = useMutation(UPDATE_EVENT, {
    variables: {
      input: {
        id: event.value?.id,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        scheduledDatetime: formData.scheduledDatetime,
        lobbyOpen: formData.lobbyOpen,
        active: formData.active,
        multivoteType: formData.multivoteType,
        videoConferenceConfig: formData.videoConferenceConfig,
      },
    },
  });
  await updateEvent();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({name: RouteOrganizerEvents});

  // Show success message.
  toast(i18n.global.tc('success.organizer.events.updatedSuccessfully'), {type: 'success'});
}
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>