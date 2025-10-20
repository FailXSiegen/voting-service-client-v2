<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    aria-labelledby="voteTransferModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="voteTransferModalLabel">
            {{ $t("voteTransfer.modal.title") }}
          </h1>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="sourceUser" class="vote-transfer-form">
            <!-- Source User Info -->
            <div class="alert alert-info">
              <h6>{{ $t("voteTransfer.sourceUser") }}</h6>
              <strong>{{ sourceUser.publicName }}</strong> ({{ sourceUser.username }})
              <br />
              {{ $t("voteTransfer.currentVotes", { count: sourceUser.voteAmount }) }}
            </div>

            <!-- Target User Selection with Search -->
            <div class="mb-3">
              <label for="targetUserSearch" class="form-label">
                {{ $t("voteTransfer.selectTargetUser") }}
              </label>
              <div class="position-relative">
                <input
                  id="targetUserSearch"
                  v-model="searchQuery"
                  type="text"
                  class="form-control"
                  :placeholder="$t('voteTransfer.searchUserPlaceholder')"
                  :disabled="!availableTargetUsers || availableTargetUsers.length === 0"
                  @focus="onInputFocus"
                  @blur="onInputBlur"
                  @input="onInputChange"
                  autocomplete="off"
                />
              </div>
              <div v-if="selectedTargetUser" class="mt-2">
                <small class="text-success">
                  <i class="bi bi-check-circle me-1"></i>
                  {{ $t("voteTransfer.selectedUser") }}:
                  <strong>{{ selectedTargetUser.publicName }}</strong> ({{ selectedTargetUser.username }})
                </small>
              </div>
            </div>

            <!-- Vote Amount Selection -->
            <div v-if="selectedTargetUserId && sourceUser.voteAmount > 1" class="mb-3">
              <label for="voteAmountInput" class="form-label">
                {{ $t("voteTransfer.selectVoteAmount") }}
              </label>
              <div class="row">
                <div class="col-md-6">
                  <input
                    id="voteAmountInput"
                    v-model.number="votesToTransfer"
                    type="number"
                    class="form-control"
                    :min="1"
                    :max="sourceUser.voteAmount"
                  />
                </div>
                <div class="col-md-6">
                  <div class="btn-group w-100" role="group">
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="votesToTransfer = 1"
                    >
                      {{ $t("voteTransfer.transferOne") }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="votesToTransfer = sourceUser.voteAmount"
                    >
                      {{ $t("voteTransfer.transferAll") }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-text">
                {{ $t("voteTransfer.remainingVotes", { count: sourceUser.voteAmount - votesToTransfer }) }}
              </div>
            </div>

            <!-- Result Preview -->
            <div v-if="selectedTargetUserId" class="alert alert-warning">
              <h6>{{ $t("voteTransfer.resultPreview") }}</h6>
              <div class="row">
                <div class="col-md-6">
                  <strong>{{ sourceUser.publicName }}</strong><br />
                  {{ $t("voteTransfer.afterTransfer") }}:
                  {{ sourceUser.voteAmount - votesToTransfer }} {{ $t("voteTransfer.votes") }}
                  <span v-if="sourceUser.voteAmount - votesToTransfer === 0" class="text-danger">
                    ({{ $t("voteTransfer.willBecomeVisitor") }})
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>{{ selectedTargetUser?.publicName }}</strong><br />
                  {{ $t("voteTransfer.afterTransfer") }}:
                  {{ (selectedTargetUser?.voteAmount || 0) + votesToTransfer }} {{ $t("voteTransfer.votes") }}
                  <span v-if="!selectedTargetUser?.allowToVote" class="text-success">
                    ({{ $t("voteTransfer.willBecomeParticipant") }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            {{ $t("general.cancel") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canTransfer"
            @click="onConfirmTransfer"
          >
            {{ $t("voteTransfer.confirmTransfer") }}
          </button>
        </div>
      </div>
    </div>
    <!-- Dropdown positioned outside modal to prevent clipping -->
    <div
      v-if="showDropdown && filteredTargetUsers.length > 0"
      class="dropdown-menu show position-fixed"
      :style="dropdownStyle"
    >
      <button
        v-for="user in filteredTargetUsers"
        :key="user.id"
        type="button"
        class="dropdown-item"
        @mousedown.prevent="selectUser(user)"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>{{ user.publicName }}</strong>
            <small class="text-muted">({{ user.username }})</small>
          </div>
          <span class="badge bg-secondary">
            {{ $t("voteTransfer.currentVotes", { count: user.voteAmount }) }}
          </span>
        </div>
      </button>
    </div>
    <div
      v-else-if="showDropdown && searchQuery && filteredTargetUsers.length === 0"
      class="dropdown-menu show position-fixed"
      :style="dropdownStyle"
    >
      <div class="dropdown-item-text text-muted">
        {{ $t("voteTransfer.noUsersFound") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { Modal } from "bootstrap";

const emit = defineEmits(["transfer", "close"]);

const props = defineProps({
  modalId: {
    type: String,
    default: "voteTransferModal",
  },
  sourceUser: {
    type: Object,
    default: null,
  },
  availableUsers: {
    type: Array,
    default: () => [],
  },
});

const selectedTargetUserId = ref("");
const votesToTransfer = ref(1);
const searchQuery = ref("");
const showDropdown = ref(false);
const dropdownStyle = ref({});

// Computed properties
const availableTargetUsers = computed(() => {
  if (!props.availableUsers || !props.sourceUser) return [];

  return props.availableUsers.filter(user =>
    user.id !== props.sourceUser.id && user.verified
  );
});

const selectedTargetUser = computed(() => {
  if (!selectedTargetUserId.value) return null;
  return availableTargetUsers.value.find(user => user.id === selectedTargetUserId.value);
});

const filteredTargetUsers = computed(() => {
  if (!searchQuery.value) return availableTargetUsers.value;

  const query = searchQuery.value.toLowerCase();
  return availableTargetUsers.value.filter(user =>
    user.publicName.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query)
  );
});

const canTransfer = computed(() => {
  return selectedTargetUserId.value &&
         votesToTransfer.value > 0 &&
         votesToTransfer.value <= (props.sourceUser?.voteAmount || 0);
});


// Watch for source user changes to reset form
watch(() => props.sourceUser, (newUser) => {
  if (newUser) {
    votesToTransfer.value = newUser.voteAmount > 1 ? 1 : newUser.voteAmount;
    selectedTargetUserId.value = "";
    searchQuery.value = ""; // Clear search field when modal opens
  }
});

// Watch for target user changes
watch(selectedTargetUserId, () => {
  if (props.sourceUser) {
    votesToTransfer.value = props.sourceUser.voteAmount > 1 ? 1 : props.sourceUser.voteAmount;
  }
});

function onConfirmTransfer() {
  if (!canTransfer.value) return;

  emit("transfer", {
    sourceUserId: props.sourceUser.id,
    targetUserId: selectedTargetUserId.value,
    voteAmount: votesToTransfer.value,
  });

  // Reset form
  selectedTargetUserId.value = "";
  votesToTransfer.value = 1;

  // Close modal
  const modal = Modal.getInstance(document.getElementById(props.modalId));
  if (modal) {
    modal.hide();
  }
}

// Method to open the modal programmatically
function openModal() {
  const modal = new Modal(document.getElementById(props.modalId));
  modal.show();
}

// Method to close the modal programmatically
function closeModal() {
  const modal = Modal.getInstance(document.getElementById(props.modalId));
  if (modal) {
    modal.hide();
  }
}

// Search functionality
function selectUser(user) {
  selectedTargetUserId.value = user.id;
  searchQuery.value = user.publicName;
  showDropdown.value = false;
}

function onInputFocus() {
  showDropdown.value = true;
  updateDropdownPosition();
}

function onInputBlur() {
  // Delay hiding dropdown to allow click events to fire
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function onInputChange() {
  if (showDropdown.value) {
    updateDropdownPosition();
  }
}

function updateDropdownPosition() {
  const inputElement = document.getElementById('targetUserSearch');
  if (inputElement) {
    const rect = inputElement.getBoundingClientRect();
    dropdownStyle.value = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 9999,
      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(0, 0, 0, 0.15)',
      borderRadius: '0.375rem'
    };
  }
}

// Expose methods for parent components
defineExpose({
  openModal,
  closeModal,
});
</script>

<style scoped>
.vote-transfer-form {
  max-width: 100%;
}

.form-text {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.alert h6 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.btn-group .btn {
  font-size: 0.875rem;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>