<template>
  <PageLayout :meta-title="$t('navigation.views.organizerVideoConference')">
    <template #title>
      {{ $t('navigation.views.organizerVideoConference') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div
        class="input-group new-meeting-button-group mb-5"
        role="group"
      >
        <select
          class="custom-select"
        >
          <option
            v-for="type in meetingTypes"
            :key="type.id"
            :value="type.id"
          >
            {{ type.title }}
          </option>
        </select>
        <div class="input-group-append">
          <router-link
            :to="{name: RouteOrganizerVideoConferenceNew}"
            class="btn btn-secondary"
          >
            <i class="bi-plus bi--1xl align-middle" />
            <span class="align-middle">
              {{ $t('view.videoConference.addNew') }}
            </span>
          </router-link>
        </div>
      </div>

      <EasyDataTable
        v-if="zoomvideoConferences?.length > 0"
        :headers="headers"
        :items="zoomvideoConferences"
        table-class-name="data-table"
        theme-color="#007bff"
      >
        <template #item-id="item">
          <div
            class="btn-group float-right"
            role="group"
          >
            <router-link
              :to="{name: RouteOrganizerVideoConferenceEdit, params: { id: item.id }}"
              class="btn btn-secondary"
            >
              <i class="bi-pencil bi--xl" />
            </router-link>
            <button
              type="button"
              class="btn btn-danger"
              @click.prevent="onDelete(item.id)"
            >
              <i class="bi-trash bi--xl" />
            </button>
          </div>
        </template>
      </EasyDataTable>
      <AlertBox
        v-else
        type="info"
      >
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
  RouteOrganizerVideoConference,
  RouteOrganizerVideoConferenceNew,
  RouteOrganizerVideoConferenceEdit,
} from "@/router/routes";

import {computed, ref, watch} from "vue";
import {useCore} from "@/core/store/core";
import {storeToRefs} from "pinia";
import {useMutation} from "@vue/apollo-composable";
import {DELETE_ZOOM_MEETING} from "@/modules/organizer/graphql/mutation/delete-zoom-meeting";
import {toast} from "vue3-toastify";
import t from '@/core/util/l18n';
import ConfirmModal from '@/core/components/ConfirmModal.vue';
import {createConfirmDialog} from 'vuejs-confirm-dialog';
import AlertBox from "@/core/components/AlertBox.vue";

const headers = [
  {text: t('view.videoConference.title'), value: "title", sortable: true},
  {text: "", value: "id"},
];

const coreStore = useCore();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents
]);

const zoomvideoConferences = computed(() => coreStore.getOrganizer?.zoomMeetings ?? []);

// Currently we only support zoom. So this is static
const meetingTypes = [
  {
    id: 1,
    title: 'Zoom Meeting'
  }
];

async function onDelete(id) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t('view.videoConference.confirmDelete')
  });
  dialog.onConfirm(async () => {
    // Update new zoom meeting.
    const {mutate: updateZoomMeeting} = useMutation(DELETE_ZOOM_MEETING, {
      variables: {
        id,
      },
    });
    await updateZoomMeeting();
    // Refetch organizer record.
    coreStore.queryOrganizer();

    // Show success message.
    toast(t('success.organizer.videoConference.deletedSuccessfully'), {type: 'success'});
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