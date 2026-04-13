<template>
  <PageLayout :meta-title="$t('navigation.views.organizerVideoConference')">
    <template #title>
      {{ $t('navigation.views.organizerVideoConference') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div class="input-group new-meeting-button-group mb-5" role="group">
        <select v-model="selectedMeetingType" class="custom-select form-select">
          <option v-for="type in meetingTypes" :key="type.id" :value="type.id">
            {{ type.title }}
          </option>
        </select>
        <div class="input-group-text p-0">
          <router-link :to="{ name: RouteOrganizerVideoConferenceNew }" class="btn btn-secondary">
            <i class="bi-plus bi--1xl align-middle" />
            <span class="align-middle">
              {{ $t('view.videoConference.addNew') }}
            </span>
          </router-link>
        </div>
      </div>

      <EasyDataTable
        v-if="filteredVideoConferences?.length > 0"
        :headers="headers"
        :items="filteredVideoConferences"
        table-class-name="data-table"
        theme-color="#007bff"
      >
        <template #item-id="item">
          <div class="btn-group float-end" role="group">
            <router-link
              :to="{
                name: RouteOrganizerVideoConferenceEdit,
                params: { id: item.id },
                query: { type: item.providerType },
              }"
              class="btn btn-secondary"
            >
              <i class="bi-pencil bi--xl" />
            </router-link>
            <button type="button" class="btn btn-danger" @click.prevent="onDelete(item)">
              <i class="bi-trash bi--xl" />
            </button>
          </div>
        </template>
      </EasyDataTable>
      <AlertBox v-else type="info">
        {{ $t('view.videoConference.noRecords') }}
      </AlertBox>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
  RouteOrganizerVideoConference,
  RouteOrganizerVideoConferenceNew,
  RouteOrganizerVideoConferenceEdit,
} from '@/router/routes';

import { computed, ref } from 'vue';
import { useCore } from '@/core/store/core';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_ZOOM_MEETING } from '@/modules/organizer/graphql/mutation/delete-zoom-meeting';
import { DELETE_JITSI_MEETING } from '@/modules/organizer/graphql/mutation/delete-jitsi-meeting';
import { toast } from 'vue3-toastify';
import t from '@/core/util/l18n';
import ConfirmModal from '@/core/components/ConfirmModal.vue';
import { createConfirmDialog } from 'vuejs-confirm-dialog';
import AlertBox from '@/core/components/AlertBox.vue';

const headers = [
  { text: t('view.videoConference.title'), value: 'title', sortable: true },
  { text: t('view.videoConference.type'), value: 'type' },
  { text: '', value: 'id' },
];

const coreStore = useCore();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
]);

const selectedMeetingType = ref(0);

const allVideoConferences = computed(() => {
  const zoom = (coreStore.getOrganizer?.zoomMeetings ?? []).map((m) => ({
    ...m,
    type: 'Zoom',
    providerType: 'zoom',
  }));
  const jitsi = (coreStore.getOrganizer?.jitsiMeetings ?? []).map((m) => ({
    ...m,
    type: 'Jitsi',
    providerType: 'jitsi',
  }));
  return [...zoom, ...jitsi];
});

const meetingTypes = [
  { id: 0, title: t('view.videoConference.allTypes') },
  { id: 1, title: 'Zoom Meeting' },
  { id: 2, title: 'Jitsi Meeting' },
];

const filteredVideoConferences = computed(() => {
  if (selectedMeetingType.value === 0) return allVideoConferences.value;
  if (selectedMeetingType.value === 1)
    return allVideoConferences.value.filter((c) => c.providerType === 'zoom');
  if (selectedMeetingType.value === 2)
    return allVideoConferences.value.filter((c) => c.providerType === 'jitsi');
  return allVideoConferences.value;
});

async function onDelete(item) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t('view.videoConference.confirmDelete'),
  });
  dialog.onConfirm(async () => {
    if (item.providerType === 'zoom') {
      const { mutate: deleteZoom } = useMutation(DELETE_ZOOM_MEETING, {
        variables: { id: item.id },
      });
      await deleteZoom();
    } else if (item.providerType === 'jitsi') {
      const { mutate: deleteJitsi } = useMutation(DELETE_JITSI_MEETING, {
        variables: { id: item.id },
      });
      await deleteJitsi();
    }
    // Refetch organizer record.
    coreStore.queryOrganizer();

    // Show success message.
    toast(t('success.organizer.videoConference.deletedSuccessfully'), {
      type: 'success',
    });
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>

<style lang="scss" scoped>
.data-table {
  max-width: 640px;
  --easy-table-header-font-size: 1.25rem;
  --easy-table-header-font-color: white;
  --easy-table-header-background-color: #007bff;
  --easy-table-body-row-font-size: 1rem;
  --easy-table-body-item-padding: 1rem;
  --easy-table-header-item-padding: 1rem;
}

.new-meeting-button-group {
  max-width: 640px;
}
</style>
