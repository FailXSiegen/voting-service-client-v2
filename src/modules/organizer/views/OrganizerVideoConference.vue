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

      <div
        v-if="zoomvideoConferences?.length > 0"
        class="video-conference-list"
      >
        <div class="list-group-item list-group-item-action active">
          <div class="row">
            <div class="col-1">
              <span>{{ $t('view.videoConference.type') }}</span>
            </div>
            <div class="col-9">
              <span>{{ $t('view.videoConference.title') }}</span>
            </div>
            <div class="col-2" />
          </div>
        </div>
        <div
          v-for="(videoConference, index) in zoomvideoConferences"
          :key="index"
          class="list-group-item list-group-item-action"
        >
          <div class="row">
            <div class="col-1">
              Zoom
            </div>
            <div class="col-9">
              {{ videoConference.title }}
            </div>
            <div class="col-2">
              <div
                class="btn-group float-right"
                role="group"
              >
                <router-link
                  :to="{name: RouteOrganizerVideoConferenceEdit, params: { id: videoConference.id }}"
                  class="btn btn-secondary"
                >
                  <i class="bi-pencil bi--xl" />
                </router-link>
                <button
                  type="button"
                  class="btn btn-danger"
                  @click.prevent="onDelete(videoConference)"
                >
                  <i class="bi-trash bi--xl" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AlertBox
        v-else
        type="info"
      >
        {{ $t('view.videoConference.noRecords') }}
      </AlertBox>

      <div
        class="modal"
        tabindex="-1"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                Modal title
              </h5>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Modal body text goes here.</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                class="btn btn-primary"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
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
import {ref, watch} from "vue";
import {useCore} from "@/core/store/core";
import {storeToRefs} from "pinia";
import AlertBox from "@/core/components/AlertBox.vue";
import {useMutation} from "@vue/apollo-composable";
import {DELETE_ZOOM_MEETING} from "@/modules/organizer/graphql/mutation/delete-zoom-meeting";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import ConfirmModal from '@/core/components/ConfirmModal.vue';
import {createConfirmDialog} from 'vuejs-confirm-dialog';

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

async function onDelete(videoConference) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.videoConference.confirmDelete')
  });
  dialog.onConfirm(async () => {
    // Update new zoom meeting.
    const {mutate: updateZoomMeeting} = useMutation(DELETE_ZOOM_MEETING, {
      variables: {
        id: videoConference?.id,
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
  max-width: 400px;
}
</style>