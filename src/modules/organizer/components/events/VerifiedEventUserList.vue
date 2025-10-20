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
    <div class="d-flex justify-content-between align-items-center mb-3">
      <small
        class="d-inline-block text-muted"
        v-html="$t('view.event.user.info')"
      />
      <button
        class="btn btn-primary"
        :disabled="isExporting"
        @click="onExportWithShortlinks"
      >
        <span v-if="isExporting">
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Exportiere...
        </span>
        <span v-else>
          <i class="bi-download me-2"></i>
          CSV mit Login-Links exportieren
        </span>
      </button>
    </div>
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
            v-if="eventSlug"
            class="btn btn-outline-primary"
            title="Link kopieren"
            @click="copyUserLink(item)"
          >
            <i class="bi-link-45deg" />
          </button>
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
          <button
            v-if="item.allowToVote && item.voteAmount > 0"
            class="btn btn-info"
            :title="$t('voteTransfer.transferVotes')"
            @click="onTransferVotes(item)"
          >
            <i class="bi-arrow-left-right align-middle" />
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
import { toast } from "vue3-toastify";
import { exportPollResultsCsv } from "@/modules/organizer/requests/export-results-csv";
import { handleError } from "@/core/error/error-handler";

const emit = defineEmits([
  "updateToGuest",
  "updateToParticipant",
  "unverfifyEventUser",
  "transferVotes",
]);

const props = defineProps({
  eventUsers: {
    type: Array,
    required: true,
  },
  eventSlug: {
    type: String,
    required: false,
    default: "",
  },
  eventId: {
    type: Number,
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
const filter = reactive({ search: "" });
const isExporting = ref(false);

function formatTimestamp(timestamp) {
  return createFormattedDateFromTimeStamp(timestamp);
}

function onFilter() {
  const searchTerm = filter.search.toLowerCase().trim();
  if (!searchTerm) {
    eventUsersCopy.value = JSON.parse(JSON.stringify(props.eventUsers));
    return;
  }

  eventUsersCopy.value = props.eventUsers.filter(
    (eventUser) =>
      eventUser.username?.toLowerCase().includes(searchTerm) ||
      eventUser.publicName?.toLowerCase().includes(searchTerm),
  );
}

function onResetFilter() {
  filter.search = "";
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

function onTransferVotes(user) {
  emit("transferVotes", user);
}

async function onExportWithShortlinks() {
  try {
    isExporting.value = true;
    const response = await exportPollResultsCsv(
      props.eventId,
      "eventUsersWithShortlinks"
    );

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `event-users-shortlinks-${props.eventId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast("CSV-Export mit Login-Links erfolgreich heruntergeladen", {
      type: "success",
    });
  } catch (error) {
    handleError(error);
    toast("Fehler beim Export der CSV-Datei", {
      type: "error",
    });
  } finally {
    isExporting.value = false;
  }
}

function copyUserLink(user) {
  // Basis-URL erstellen
  const baseUrl = `${window.location.origin}/event/${props.eventSlug}`;

  // Parameter hinzufügen, falls vorhanden
  const params = new URLSearchParams();
  if (user.publicName) {
    params.append('publicname', user.publicName);
  }
  if (user.username) {
    params.append('username', user.username);
  }

  // Vollständige URL zusammensetzen
  const fullUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  // Erste Versuch: Moderne Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      console.log('Link kopiert (moderne API):', fullUrl);
      // Toast mit kopiertem Link anzeigen
      toast(`Link in Zwischenablage kopiert: ${fullUrl}`, {
        type: "success",
        autoClose: 5000
      });
    }).catch(err => {
      console.warn('Moderne Clipboard API fehlgeschlagen:', err);
      // Fallback verwenden
      fallbackCopyText(fullUrl);
    });
  } else {
    // Fallback für ältere Browser
    fallbackCopyText(fullUrl);
  }
}

function fallbackCopyText(text) {
  try {
    // Textarea-Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      console.log('Link kopiert (Fallback):', text);
      // Toast mit kopiertem Link anzeigen
      toast(`Link in Zwischenablage kopiert: ${text}`, {
        type: "success",
        autoClose: 5000
      });
    } else {
      throw new Error('execCommand copy failed');
    }
  } catch (err) {
    console.error('Alle Kopier-Methoden fehlgeschlagen:', err);
    // Toast mit Fehlermeldung und URL zum manuellen Kopieren
    toast(`Automatisches Kopieren fehlgeschlagen. Bitte manuell kopieren: ${text}`, {
      type: "error",
      autoClose: 10000
    });
  }
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
