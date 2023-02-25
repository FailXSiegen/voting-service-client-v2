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
      <DataTable
        :headers="headers"
        :items="zoomvideoConferences"
      >
        <template #actions="slotProps">
          <div
            class="btn-group float-right"
            role="group"
          >
            <router-link
              :to="{name: RouteOrganizerVideoConferenceEdit, params: { id: slotProps.item.id }}"
              class="btn btn-secondary"
            >
              <i class="bi-pencil bi--xl" />
            </router-link>
            <button
              type="button"
              class="btn btn-danger"
              @click.prevent="onDelete(slotProps.item.id)"
            >
              <i class="bi-trash bi--xl" />
            </button>
          </div>
        </template>
      </DataTable>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import DataTable from '@/core/components/DataTable.vue';
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
import {ref, watch} from "vue";
import {useCore} from "@/core/store/core";
import {storeToRefs} from "pinia";
import {useMutation} from "@vue/apollo-composable";
import {DELETE_ZOOM_MEETING} from "@/modules/organizer/graphql/mutation/delete-zoom-meeting";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import ConfirmModal from '@/core/components/ConfirmModal.vue';
import {createConfirmDialog} from 'vuejs-confirm-dialog';

const headers = [
  {text: i18n.global.tc('view.videoConference.title'), value: "title", sortable: true},
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

const {organizer} = storeToRefs(coreStore);
const zoomvideoConferences = ref(coreStore.getOrganizer?.zoomMeetings ?? []);

// Currently we only support zoom. So this is static
const meetingTypes = [
  {
    id: 1,
    title: 'Zoom Meeting'
  }
];
// Watch changes to organizer in the store.
watch(organizer, ({zoomMeetings}) => {
  zoomvideoConferences.value = zoomMeetings;
});

async function onDelete(id) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.videoConference.confirmDelete')
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
    toast(i18n.global.tc('success.organizer.videoConference.deletedSuccessfully'), {type: 'success'});
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>

<style lang="scss" scoped>
.new-meeting-button-group {
  max-width: 640px;
}
</style>