<template>
  <div
    v-if="eventUsers?.length > 0"
    class="pending-event-users"
  >
    <div class="form-group">
      <label for="filterByUsername">
        {{ $t('eventUser.filter.byUsername') }}
      </label>
      <div class="input-group">
        <input
          id="event-user-filter-username"
          v-model="filter.username"
          class="form-control"
          :placeholder="$t('eventUser.filter.byUsername')"
          @input="onFilter"
        >
        <div class="input-group-append">
          <button
            class="btn btn-secondary"
            @click.prevent="onResetFilter"
          >
            {{ $t('eventUser.filter.reset') }}
          </button>
        </div>
      </div>
    </div>
    <hr>
    <EasyDataTable
      :headers="headers"
      :items="eventUserFiltered"
      table-class-name="data-table"
      theme-color="#007bff"
    >
      <template #item-createDatetime="item">
        {{ formatTimestamp(item.createDatetime) }}
      </template>
      <template #item-online="item">
        <span
          v-if="item.online"
          class="badge badge-success badge-pill status-indicator"
        >
          {{ $t('eventUser.onlineState.online') }}
        </span>
        <span
          v-else
          class="badge badge-danger badge-pill status-indicator"
        >
          {{ $t('eventUser.onlineState.offline') }}
        </span>
      </template>
      <template #item-id="item">
        <div
          class="btn-group float-right"
          role="group"
        >
          <button
            class="btn btn-success mr-2"
            @click="onUpdateToParticipant(item.id)"
          >
            {{ $t('view.event.user.verifyAs') }}
            {{ $t('view.event.user.member') }}
          </button>
          <button
            class="btn btn-secondary mr-2"
            @click="onUpdateToGuest(item.id)"
          >
            {{ $t('view.event.user.verifyAs') }}
            {{ $t('view.event.user.visitor') }}
          </button>
          <button
            class="btn btn-danger mr-2"
            :disabled="item.online"
            @click="onDelete(item.id)"
          >
            {{ $t('view.event.user.block') }}
          </button>
        </div>
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from "vue";
import t from '@/core/util/l18n';
import {createFormattedDateFromTimeStamp} from "@/core/util/time-stamp";
import {createConfirmDialog} from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";

const emit = defineEmits(['delete', 'updateToGuest', 'updateToParticipant']);

const props = defineProps({
  eventUsers: {
    type: Array,
    required: true
  }
});

const headers = [
  {text: t('eventUser.online'), value: "online", sortable: true},
  {text: t('eventUser.createDatetime'), value: "createDatetime", sortable: true},
  {text: t('eventUser.username'), value: "username", sortable: true},
  {text: t('eventUser.publicName'), value: "publicName", sortable: true},
  {text: '', value: "id", sortable: false},
];

const eventUsersCopy = ref(null);
const eventUserFiltered = computed(() => eventUsersCopy.value ? eventUsersCopy.value : JSON.parse(JSON.stringify(props.eventUsers)));
const filter = reactive({username: ''});

function formatTimestamp(timestamp) {
  return createFormattedDateFromTimeStamp(timestamp);
}

function onFilter() {
  eventUsersCopy.value = props.eventUsers.filter(eventUser => (
    !eventUser.verified &&
        eventUser.username.includes(filter.username)
  ));
}

function onResetFilter() {
  filter.username = '';
  eventUsersCopy.value = JSON.parse(JSON.stringify(props.eventUsers));
}

function onUpdateToParticipant(eventUserId) {
  emit('updateToParticipant', eventUserId);
}

function onUpdateToGuest(eventUserId) {
  emit('updateToGuest', eventUserId);
}

function onDelete(eventUserId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t('view.event.listing.confirm.deleteQuestion')
  });
  dialog.onConfirm(() => {
    emit('delete', eventUserId);
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>

<style lang="scss" scoped>
.data-table {
  --easy-table-header-font-size: 1.25rem;
  --easy-table-header-font-color: white;
  --easy-table-header-background-color: #007bff;
  --easy-table-body-row-font-size: 1rem;
  --easy-table-body-item-padding: 1rem;
  --easy-table-header-item-padding: 1rem;
}

#event-user-filter-username {
  max-width: 440px;
}
</style>