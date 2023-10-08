<template>
  <!-- TODO ResultModal -->

  <div class="container-modal d-print-none">
    <div
      id="resultModal"
      class="modal fade"
      tabindex="-1"
      role="dialog"
      data-keyboard="false"
      data-backdrop="static"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered"
        role="document"
      >
        <div
          v-if="pollResult"
          class="modal-content"
        >
          <div class="modal-header">
            <h5 class="modal-title">
              {{ t('view.polls.modal.result') }}
            </h5>
            <button
              type="button"
              class="close"
              aria-label="Close"
              @click="hideModal()"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <result-item
              :poll-result="pollResult"
              :event-record="event"
            />
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-danger"
              aria-label="Schließen"
              @click="hideModal()"
            >
              <span aria-hidden="true">
                {{ t('view.polls.modal.close') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// TODO Remove me with bootstrap 5.
import $ from 'jquery';
import ResultItem from "@/modules/organizer/components/events/poll/ResultItem.vue";
import t from "@/core/util/l18n";

defineProps({
  pollResult: {
    type: Object,
    required: true
  },
  event: {
    type: Object,
    required: true
  },
});

function showModal() {
  // TODO Remove me with bootstrap 5.
  $('#resultModal').modal('show');
}

function hideModal() {
  $('#resultModal').modal('hide');
  // TODO Remove me with bootstrap 5.
}

// Make these methods available for the parent component.
defineExpose({
  showModal,
  hideModal
});
</script>
