<template>
  <div
    class="modal fade"
    id="organizerEventsModal"
    tabindex="-1"
    data-bs-backdrop="static"
    aria-labelledby="organizerEventsModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="organizerEventsModalLabel">
            {{ $t("view.organizers.events.title") }} - {{ organizer?.username }}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ $t("general.loading") }}</span>
            </div>
          </div>
          <div v-else-if="error" class="alert alert-danger">
            {{ $t("errors.loadingFailed") }}
          </div>
          <div v-else>
            <div v-if="hasEvents">
              <!-- Upcoming Events -->
              <div v-if="upcomingEvents.length > 0" class="mb-4">
                <h6 class="fw-bold mb-3">{{ $t("view.organizers.events.upcoming") }}</h6>
                <div class="list-group">
                  <div
                    v-for="event in upcomingEvents"
                    :key="event.id"
                    class="list-group-item list-group-item-action"
                    :class="{ 'transferred-event': event.originalOrganizer && event.organizer?.id === props.organizer?.id }"
                  >
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">{{ event.title }}</h6>
                      <small>
                        {{ createFormattedDateFromTimeStamp(event.scheduledDatetime) }}
                      </small>
                    </div>
                    <p class="mb-1 text-truncate">{{ event.description }}</p>
                    <div class="d-flex flex-wrap justify-content-between mt-2">
                      <div class="d-flex flex-wrap mb-2">
                        <div class="me-2">
                          <span 
                            class="badge"
                            :class="event.active ? 'text-bg-success' : 'text-bg-secondary'"
                          >
                            {{ event.active ? $t("view.organizers.events.active") : $t("view.organizers.events.inactive") }}
                          </span>
                        </div>
                        <div class="me-2">
                          <span 
                            class="badge"
                            :class="event.lobbyOpen ? 'text-bg-success' : 'text-bg-secondary'"
                          >
                            {{ event.lobbyOpen ? $t("view.organizers.events.open") : $t("view.organizers.events.closed") }}
                          </span>
                        </div>
                        <div v-if="event.async" class="me-2">
                          <span class="badge text-bg-info">
                            {{ $t("view.organizers.events.async") }}
                          </span>
                        </div>
                        <div v-if="event.originalOrganizer" class="me-2">
                          <span 
                            class="badge original-owner-badge" 
                            :class="event.organizer?.id === props.organizer?.id ? 'text-bg-warning' : 'text-bg-info'"
                            :title="`${$t('view.organizers.events.originalOwner')}: ${event.originalOrganizer.username} (${event.originalOrganizer.email})`"
                          >
                            {{ event.organizer?.id === props.organizer?.id ? $t("view.organizers.events.transferred-to") : $t("view.organizers.events.transferred-from") }}
                          </span>
                        </div>
                      </div>
                      <div class="d-flex">
                        <button 
                          class="btn btn-sm btn-primary me-2"
                          @click.prevent="openTransferModal(event)"
                          :title="$t('view.organizers.events.transfer.title')"
                        >
                          <i class="bi-arrow-right"></i>
                        </button>
                        <button 
                          v-if="event.originalOrganizer"
                          class="btn btn-sm btn-warning"
                          @click.prevent="resetEventOrganizer(event)"
                          :title="$t('view.organizers.events.reset.title')"
                        >
                          <i class="bi-arrow-counterclockwise"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Past Events -->
              <div v-if="expiredEvents.length > 0">
                <h6 class="fw-bold mb-3">{{ $t("view.organizers.events.past") }}</h6>
                <div class="list-group">
                  <div
                    v-for="event in expiredEvents"
                    :key="event.id"
                    class="list-group-item list-group-item-action"
                    :class="{ 'transferred-event': event.originalOrganizer && event.organizer?.id === props.organizer?.id }"
                  >
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">{{ event.title }}</h6>
                      <small>
                        {{ createFormattedDateFromTimeStamp(event.scheduledDatetime) }}
                      </small>
                    </div>
                    <p class="mb-1 text-truncate">{{ event.description }}</p>
                    <div class="d-flex flex-wrap justify-content-between mt-2">
                      <div class="d-flex flex-wrap mb-2">
                        <div class="me-2">
                          <span 
                            class="badge text-bg-secondary"
                          >
                            {{ $t("view.organizers.events.expired") }}
                          </span>
                        </div>
                        <div v-if="event.finished" class="me-2">
                          <span class="badge text-bg-dark">
                            {{ $t("view.organizers.events.finished") }}
                          </span>
                        </div>
                        <div v-if="event.originalOrganizer" class="me-2">
                          <span 
                            class="badge original-owner-badge" 
                            :class="event.organizer?.id === props.organizer?.id ? 'text-bg-warning' : 'text-bg-info'"
                            :title="`${$t('view.organizers.events.originalOwner')}: ${event.originalOrganizer.username} (${event.originalOrganizer.email})`"
                          >
                            {{ event.organizer?.id === props.organizer?.id ? $t("view.organizers.events.transferred-to") : $t("view.organizers.events.transferred-from") }}
                          </span>
                        </div>
                      </div>
                      <div class="d-flex">
                        <button 
                          class="btn btn-sm btn-primary me-2"
                          @click.prevent="openTransferModal(event)"
                          :title="$t('view.organizers.events.transfer.title')"
                        >
                          <i class="bi-arrow-right"></i>
                        </button>
                        <button 
                          v-if="event.originalOrganizer"
                          class="btn btn-sm btn-warning"
                          @click.prevent="resetEventOrganizer(event)"
                          :title="$t('view.organizers.events.reset.title')"
                        >
                          <i class="bi-arrow-counterclockwise"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Transferred Events (Events, bei denen der aktuelle Organizer der ursprüngliche Besitzer ist) -->
              <div v-if="transferredEvents.length > 0" class="mt-5">
                <h6 class="fw-bold mb-3 text-warning">{{ $t("view.organizers.events.transferredEvents") }}</h6>
                <div class="list-group">
                  <div
                    v-for="event in transferredEvents"
                    :key="event.id"
                    class="list-group-item list-group-item-action transferred-from-event"
                  >
                    <div class="d-flex w-100 justify-content-between">
                      <h6 class="mb-1">{{ event.title }}</h6>
                      <small>
                        {{ createFormattedDateFromTimeStamp(event.scheduledDatetime) }}
                      </small>
                    </div>
                    <p class="mb-1 text-truncate">{{ event.description }}</p>
                    <div class="d-flex flex-wrap justify-content-between mt-2">
                      <div class="d-flex flex-wrap mb-2">
                        <div class="me-2">
                          <span 
                            class="badge text-bg-secondary"
                            v-if="createFormattedDateFromTimeStamp(event.scheduledDatetime) < getCurrentFormattedDate()"
                          >
                            {{ $t("view.organizers.events.expired") }}
                          </span>
                          <span 
                            class="badge"
                            :class="event.active ? 'text-bg-success' : 'text-bg-secondary'"
                            v-else
                          >
                            {{ event.active ? $t("view.organizers.events.active") : $t("view.organizers.events.inactive") }}
                          </span>
                        </div>
                        <div class="me-2">
                          <span 
                            class="badge"
                            :class="event.lobbyOpen ? 'text-bg-success' : 'text-bg-secondary'"
                          >
                            {{ event.lobbyOpen ? $t("view.organizers.events.open") : $t("view.organizers.events.closed") }}
                          </span>
                        </div>
                        <div v-if="event.finished" class="me-2">
                          <span class="badge text-bg-dark">
                            {{ $t("view.organizers.events.finished") }}
                          </span>
                        </div>
                        <div class="me-2">
                          <span class="badge text-bg-info current-owner-badge" :title="`${$t('view.organizers.events.currentOwner')}: ${event.organizer.username} (${event.organizer.email})`">
                            {{ $t("view.organizers.events.transferredTo") }}
                          </span>
                        </div>
                      </div>
                      <div class="d-flex">
                        <button 
                          class="btn btn-sm btn-warning"
                          @click.prevent="resetEventOrganizer(event)"
                          :title="$t('view.organizers.events.reset.title')"
                        >
                          <i class="bi-arrow-counterclockwise"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="alert alert-info">
              {{ $t("view.organizers.events.noEvents") }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            {{ $t("general.close") }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Transfer Event Modal -->
  <TransferEventModal
    :event="selectedEvent"
    :show="showTransferModal"
    @transfer-success="onTransferSuccess"
    @transfer-error="onTransferError"
  />
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import { EVENTS_BY_ORGANIZER } from "@/modules/organizer/graphql/queries/events-by-organizer";
import { ALL_EVENTS_WITH_ORIGINAL_OWNER } from "@/modules/organizer/graphql/queries/all-events-with-original-owner";
import { RESET_EVENT_ORGANIZER } from "@/modules/organizer/graphql/mutation/reset-event-organizer";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";
import TransferEventModal from "./TransferEventModal.vue";
import { toast } from "vue3-toastify";
import { handleError } from "@/core/error/error-handler";
import { Modal, Tooltip } from "bootstrap";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";

const props = defineProps({
  organizer: {
    type: Object,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const error = ref(null);
const upcomingEvents = ref([]);
const expiredEvents = ref([]);
const transferredEvents = ref([]); // Events, bei denen der Organizer original_organizer ist
const selectedEvent = ref(null);
const showTransferModal = ref(false);

const coreStore = useCore();
const isSuperAdmin = computed(() => coreStore?.user?.superAdmin === true);

const hasEvents = computed(() => {
  return upcomingEvents.value.length > 0 || 
         expiredEvents.value.length > 0 || 
         transferredEvents.value.length > 0;
});

// Lazy query für normale Organizer-Events
const { load: loadRegularEvents, onResult: onRegularResult, onError: onRegularError } = useLazyQuery(
  EVENTS_BY_ORGANIZER,
  () => ({ organizerId: props.organizer.id }),
  { fetchPolicy: "network-only" }
);

// Lazy query für Superadmin, um alle Events zu holen
const { load: loadAllEvents, onResult: onAllResult, onError: onAllError } = useLazyQuery(
  ALL_EVENTS_WITH_ORIGINAL_OWNER,
  null,
  { fetchPolicy: "network-only" }
);

// Define reset event organizer mutation
const { mutate: resetEventOrganizerMutation, onDone, onError: onResetError } = useMutation(RESET_EVENT_ORGANIZER);

// Watch for when the modal is shown and load events
watch(
  () => props.show,
  (newValue) => {
    if (newValue && props.organizer?.id) {
      loading.value = true;
      error.value = null;
      
      // Immer alle Events laden und dann filtern, wenn wir Superadmin sind
      if (isSuperAdmin.value) {
        loadAllEvents();
      } else {
        loadRegularEvents();
      }
    }
  }
);

// Ergebnisse für reguläre Organizer-Events
onRegularResult(({ data }) => {
  loading.value = false;
  if (data) {
    // Aufteilung der Events in direkte Events und übertragene Events (bei denen der Organizer der originalOrganizer ist)
    const directUpcomingEvents = [];
    const transferredUpcomingEvents = [];
    const directExpiredEvents = [];
    const transferredExpiredEvents = [];
    
    (data.upcomingEvents || []).forEach(event => {   
      if (event.originalOrganizer && event.originalOrganizer.id === props.organizer.id && event.organizer.id !== props.organizer.id) {
        transferredUpcomingEvents.push(event);
      } else {
        directUpcomingEvents.push(event);
      }
    });
    
    // Expired kategorisieren
    console.log("Prüfe expiredEvents:", data.expiredEvents);
    (data.expiredEvents || []).forEach(event => {         
      if (event.originalOrganizer && event.originalOrganizer.id === props.organizer.id && event.organizer.id !== props.organizer.id) {
        transferredExpiredEvents.push(event);
      } else {
        directExpiredEvents.push(event);
      }
    });
    
    upcomingEvents.value = directUpcomingEvents;
    expiredEvents.value = directExpiredEvents;
    
    // Alle übertragenen Events zusammenfassen
    transferredEvents.value = [...transferredUpcomingEvents, ...transferredExpiredEvents];
    
    // Initialize tooltips after data is loaded
    setTimeout(() => {
      initializeTooltips();
    }, 100);
  }
});

// Ergebnisse für alle Events (SuperAdmin)
onAllResult(({ data }) => {
  loading.value = false;
  if (data) {
    // Events filtern, die diesem Organizer direkt gehören
    upcomingEvents.value = (data.allUpcomingEvents || [])
      .filter(event => event.organizer?.id === props.organizer?.id);
    
    expiredEvents.value = (data.allPastEvents || [])
      .filter(event => event.organizer?.id === props.organizer?.id);
    
    // WICHTIG: Wir betrachten zwei Fälle für übertragene Events:
    // 1. Events, bei denen das original_organizer Feld gesetzt ist
    // 2. Events, die ursprünglich zum Organizer gehörten (durch OrganizerID identifiziert)
    
    // 1. Fall: originalOrganizer ist gesetzt und stimmt mit diesem Organizer überein
    const upcomingWithOriginalOrganizer = (data.allUpcomingEvents || [])
      .filter(event => 
        event.originalOrganizer?.id === props.organizer?.id && 
        event.organizer?.id !== props.organizer?.id
      );
    
    const expiredWithOriginalOrganizer = (data.allPastEvents || [])
      .filter(event => 
        event.originalOrganizer?.id === props.organizer?.id && 
        event.organizer?.id !== props.organizer?.id
      );
    
    // 2. Fall: Wir manuell ermitteln, ob das Event zu diesem Organizer gehören könnte
    // Hier könnten wir z.B. durch Event-Namen oder andere Attribute filtern
    // oder eine spezielle Flag im Event setzen, wenn es übertragen wurde.
    
    // Als einfachen Heuristik könnten wir Events mit ähnlichem Titel suchen
    // oder wir könnten die Event-Creation-Zeit betrachten, etc.
    
    // Für diesen Test nehmen wir nur die Events mit gesetztem originalOrganizer
    transferredEvents.value = [
      ...upcomingWithOriginalOrganizer, 
      ...expiredWithOriginalOrganizer
    ];
    
    console.log(`Gefundene übertragene Events für Organizer ${props.organizer?.id}:`, 
                transferredEvents.value.length);
                
    // Debug-Info
    console.log("Events struktur:", {
      upcomingEvents: upcomingEvents.value.map(e => ({
        id: e.id,
        title: e.title,
        isTransferred: !!e.originalOrganizer,
        organizer: e.organizer?.id,
        originalOrganizer: e.originalOrganizer?.id
      })),
      expiredEvents: expiredEvents.value.map(e => ({
        id: e.id,
        title: e.title,
        isTransferred: !!e.originalOrganizer,
        organizer: e.organizer?.id,
        originalOrganizer: e.originalOrganizer?.id
      })),
      transferredEvents: transferredEvents.value.map(e => ({
        id: e.id,
        title: e.title,
        organizer: e.organizer?.id,
        originalOrganizer: e.originalOrganizer?.id
      }))
    });
    
    // Initialize tooltips after data is loaded
    setTimeout(() => {
      initializeTooltips();
    }, 100);
  }
});

// Handle query errors
onRegularError((e) => {
  loading.value = false;
  error.value = e;
  console.error("Error loading regular events:", e);
});

onAllError((e) => {
  loading.value = false;
  error.value = e;
  console.error("Error loading all events:", e);
});

// Handle reset success
onDone(() => {
  // Show success message
  toast(t("view.organizers.events.reset.success"), {
    type: "success",
  });
  
  // Refresh events
  if (isSuperAdmin.value) {
    loadAllEvents();
  } else {
    loadRegularEvents();
  }
});

// Handle reset errors
onResetError((error) => {
  handleError(error);
});

// Function to open transfer modal
function openTransferModal(event) {
  selectedEvent.value = event;
  showTransferModal.value = true;
  
  // Use Bootstrap modal API to show the modal
  setTimeout(() => {
    const modalElement = document.getElementById('transferEventModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
      
      // Reset flag when modal is hidden
      modalElement.addEventListener('hidden.bs.modal', () => {
        showTransferModal.value = false;
      });
    }
  }, 100);
}

// Function to reset event back to original organizer
function resetEventOrganizer(event) {
  if (event && event.originalOrganizer) {
    resetEventOrganizerMutation({
      eventId: event.id
    });
  }
}

// Function called after successful transfer
function onTransferSuccess() {
  // Refresh events list
  if (isSuperAdmin.value) {
    loadAllEvents();
  } else {
    loadRegularEvents();
  }
}

// Get current formatted date for comparison
function getCurrentFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString();
}

// Function called after transfer error
function onTransferError() {
  // Error is handled by the TransferEventModal component
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      container: 'body'
    });
  });
  
  // Alternative method to initialize tooltips for badges with title attribute
  const badgesTooltipList = [].slice.call(document.querySelectorAll('.original-owner-badge[title]'));
  badgesTooltipList.map(function(badgeEl) {
    return new bootstrap.Tooltip(badgeEl, {
      container: 'body'
    });
  });
}

// Log when modal is shown
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      console.log("Modal is shown with organizer:", props.organizer);
    }
  }
);
</script>

<style lang="scss" scoped>
.badge {
  font-size: 0.75rem;
}

.transferred-event {
  background-color: rgba(255, 193, 7, 0.1);
  border-left: 4px solid #ffc107;
}

.original-owner-badge, .current-owner-badge {
  cursor: help;
}

.transferred-from-event {
  background-color: rgba(0, 123, 255, 0.05);
  border-left: 4px solid #007bff;
}
</style>