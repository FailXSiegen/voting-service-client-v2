<template>
  <div
    id="transferEventModal"
    class="modal fade"
    tabindex="-1"
    data-bs-backdrop="static"
    aria-labelledby="transferEventModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="transferEventModalLabel" class="modal-title">
            {{ $t("view.organizers.events.transfer.title") }}
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
            <div v-if="event" class="mb-4">
              <h6>{{ $t("view.organizers.events.transfer.eventInfo") }}</h6>
              <p class="mb-1"><strong>{{ $t("view.organizers.events.title") }}:</strong> {{ event.title }}</p>
              <p class="mb-0"><strong>{{ $t("view.organizers.events.currentOwner") }}:</strong> {{ event.organizer?.username }} ({{ event.organizer?.email }})</p>
            </div>
            
            <div v-if="organizers.length > 0" class="form-group">
              <label for="targetOrganizer" class="form-label">{{ $t("view.organizers.events.transfer.selectTarget") }}</label>
              <select 
                id="targetOrganizer" 
                v-model="selectedOrganizerId" 
                class="form-select"
                :disabled="transferring"
              >
                <option value="" disabled selected>{{ $t("view.organizers.events.transfer.selectPlaceholder") }}</option>
                <option 
                  v-for="organizer in availableOrganizers" 
                  :key="organizer.id" 
                  :value="organizer.id"
                >
                  {{ organizer.username }} ({{ organizer.email }})
                </option>
              </select>
            </div>
            <div v-else class="alert alert-info">
              {{ $t("view.organizers.events.transfer.noTargets") }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
            :disabled="transferring"
          >
            {{ $t("general.close") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedOrganizerId || transferring"
            @click="transferEvent"
          >
            <span v-if="transferring" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ $t("view.organizers.events.transfer.submit") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useCore } from "@/core/store/core";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import { ORGANIZERS } from "@/modules/organizer/graphql/queries/organizers";
import { TRANSFER_EVENT } from "@/modules/organizer/graphql/mutation/transfer-event";
import { toast } from "vue3-toastify";
import { handleError } from "@/core/error/error-handler";
import { Modal } from "bootstrap";
import t from "@/core/util/l18n";

const props = defineProps({
  event: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['transfer-success', 'transfer-error']);

const loading = ref(false);
const error = ref(null);
const organizers = ref([]);
const selectedOrganizerId = ref("");
const transferring = ref(false);

// Computed property to exclude current organizer from selection
const availableOrganizers = computed(() => {
  if (!props.event) return [];
  
  return organizers.value.filter(organizer => 
    organizer.id !== props.event?.organizer?.id
  );
});

// Define a lazy query to fetch organizers
const { load: loadOrganizers, onResult, onError } = useLazyQuery(
  ORGANIZERS,
  null,
  { fetchPolicy: "network-only" }
);

// Transfer event mutation
const { mutate: transferEventMutation, onDone, onError: onTransferError } = useMutation(TRANSFER_EVENT);

// Watch for when the modal is shown and load organizers
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      selectedOrganizerId.value = "";
      loading.value = true;
      error.value = null;
      loadOrganizers();
    }
  }
);

// Reset selection when event changes
watch(
  () => props.event,
  () => {
    selectedOrganizerId.value = "";
  }
);

// Handle query results
onResult(({ data }) => {
  loading.value = false;
  if (data?.organizers) {
    organizers.value = data.organizers;
  }
});

// Handle query errors
onError((e) => {
  loading.value = false;
  error.value = e;
  console.error("Error loading organizers:", e);
});

// Handle transfer completion
onDone(({ data }) => {
  transferring.value = false;
  
  // Check if the originalOrganizer field was correctly set
  if (data && data.transferEvent) {
    const event = data.transferEvent;
    if (!event.originalOrganizer) {
      // Wenn originalOrganizer nicht gesetzt wurde, geben wir eine Warnung aus
      console.warn("Übertragenes Event hat keinen original_organizer:", event);
    }
  }
  
  // Show success message
  toast(t("view.organizers.events.transfer.success"), {
    type: "success",
  });
  
  // Close modal
  const modalElement = document.getElementById('transferEventModal');
  const bsModal = Modal.getInstance(modalElement);
  if (bsModal) {
    bsModal.hide();
  }
  
  // Emit success event
  emit('transfer-success');
});

// Handle transfer errors
onTransferError((error) => {
  transferring.value = false;
  handleError(error);
  emit('transfer-error', error);
});

// Function to perform the transfer
function transferEvent() {
  if (props.event && selectedOrganizerId.value) {
    transferring.value = true;
    
    transferEventMutation({
      eventId: props.event.id,
      newOrganizerId: selectedOrganizerId.value
    });
  }
}
</script>