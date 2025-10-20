<template>
  <div v-if="eventUsers?.length > 0" class="pending-event-users">
    <div class="mb-3">
      <label for="filterByUsername">
        {{ $t("eventUser.filter.byUsername") }}
      </label>
      <div class="input-group">
        <input
          id="event-user-filter-username"
          v-model="filter.username"
          class="form-control"
          :placeholder="$t('eventUser.filter.byUsername')"
          @input="onFilter"
        />
        <div class="input-group-text p-0">
          <button class="btn btn-secondary" @click.prevent="onResetFilter">
            {{ $t("eventUser.filter.reset") }}
          </button>
        </div>
      </div>
    </div>
    <hr />
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
            class="btn btn-outline-primary me-2"
            title="Link kopieren"
            @click="copyUserLink(item)"
          >
            <i class="bi-link-45deg" />
          </button>
          <button
            class="btn btn-success me-2"
            @click="onUpdateToParticipant(item.id)"
          >
            {{ $t("view.event.user.verifyAs") }}
            {{ $t("view.event.user.member") }}
          </button>
          <button
            class="btn btn-secondary me-2"
            @click="onUpdateToGuest(item.id)"
          >
            {{ $t("view.event.user.verifyAs") }}
            {{ $t("view.event.user.visitor") }}
          </button>
          <button
            class="btn btn-danger me-2"
            :disabled="item.online"
            @click="onDelete(item.id)"
          >
            {{ $t("view.event.user.block") }}
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
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import { toast } from "vue3-toastify";

const emit = defineEmits(["delete", "updateToGuest", "updateToParticipant"]);

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
      !eventUser.verified && eventUser.username.includes(filter.username) ||
      !eventUser.verified && eventUser.publicName.includes(filter.username),
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

function onDelete(eventUserId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.event.listing.confirm.deleteQuestion"),
  });
  dialog.onConfirm(() => {
    emit("delete", eventUserId);
  });

  // Show confirm dialog.
  dialog.reveal();
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
