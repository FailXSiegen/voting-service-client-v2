<template>
  <div v-if="eventUsers?.length > 0" class="pending-event-users">
    <div class="mb-3">
      <label for="filterByUsername">
        {{ $t("eventUser.filter.byUsername") }}
      </label>
      <div class="input-group">
        <input
          id="event-user-filter-username"
          v-model="filter.search"
          class="form-control"
          :placeholder="$t('eventUser.filter.byUsername')"
          @input="onFilter"
        />
        <div class="input-group-text p-0">
          <button class="btn btn-transparent" @click.prevent="onResetFilter">
            {{ $t("eventUser.filter.reset") }}
          </button>
        </div>
      </div>
    </div>
    <hr />
    <VerifiedEventUserLegend :event-users="eventUsers" />
    <hr />
    <small
      class="d-inline-block text-muted mb-3"
      v-html="$t('view.event.user.info')"
    />
    <EasyDataTable
      buttons-pagination
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
          class="badge text-bg-success badge-pill status-indicator"
        >
          {{ $t("eventUser.onlineState.online") }}
        </span>
        <span v-else class="badge text-bg-danger badge-pill status-indicator">
          {{ $t("eventUser.onlineState.offline") }}
        </span>
      </template>
      <template #item-id="item">
        <div class="btn-group float-end" role="group">
          <button
            v-if="!item.allowToVote"
            class="h-100 btn btn-success"
            @click="onUpdateToParticipant(item.id)"
          >
            {{ $t("view.event.user.setTo") }}
            {{ $t("view.event.user.member") }}
          </button>
          <button
            v-else-if="item.allowToVote"
            class="btn btn-secondary"
            @click="onUpdateToGuest(item.id)"
          >
            {{ $t("view.event.user.setTo") }}
            {{ $t("view.event.user.visitor") }}
          </button>
          <router-link
            :to="{
              name: RouteOrganizerEventUserEdit,
              params: { eventUserId: item.id },
            }"
            :title="$t('view.event.user.edit')"
            class="btn btn-warning d-flex justify-content-center align-items-center"
          >
            <i class="bi-pencil align-middle" />
          </router-link>
          <button
            class="btn btn-danger"
            :title="$t('view.event.user.unverfify')"
            @click="onUnverfifyEventUser(item.id)"
          >
            <i class="bi-person-x align-middle" />
          </button>
        </div>
      </template>
    </EasyDataTable>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import t from "@/core/util/l18n";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";
import VerifiedEventUserLegend from "@/modules/organizer/components/events/VerifiedEventUserLegend.vue";
import { RouteOrganizerEventUserEdit } from "@/router/routes";

const emit = defineEmits([
  "updateToGuest",
  "updateToParticipant",
  "unverfifyEventUser",
]);

const props = defineProps({
  eventUsers: {
    type: Array,
    required: true,
  },
});

const headers = [
  { text: t("eventUser.online"), value: "online", sortable: true },
  {
    text: t("eventUser.createDatetime"),
    value: "createDatetime",
    sortable: true,
  },
  { text: t("eventUser.username"), value: "username", sortable: true },
  { text: t("eventUser.publicName"), value: "publicName", sortable: true },
  { text: t("eventUser.voteAmount"), value: "voteAmount", sortable: true },
  { text: "", value: "id", sortable: false },
];

const eventUsersCopy = ref(null);
const eventUserFiltered = computed(() =>
  eventUsersCopy.value
    ? eventUsersCopy.value
    : JSON.parse(JSON.stringify(props.eventUsers)),
);
const filter = reactive({ username: "" });

function formatTimestamp(timestamp) {
  return createFormattedDateFromTimeStamp(timestamp);
}

function onFilter() {
  eventUsersCopy.value = props.eventUsers.filter(
    (eventUser) =>
      eventUser.username.includes(filter.search) ||
      eventUser.publicName.includes(filter.search),
  );
}

function onResetFilter() {
  filter.username = "";
  eventUsersCopy.value = JSON.parse(JSON.stringify(props.eventUsers));
}

function onUpdateToParticipant(eventUserId) {
  emit("updateToParticipant", eventUserId);
}

function onUpdateToGuest(eventUserId) {
  emit("updateToGuest", eventUserId);
}

function onUnverfifyEventUser(eventUserId) {
  emit("unverfifyEventUser", eventUserId);
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
