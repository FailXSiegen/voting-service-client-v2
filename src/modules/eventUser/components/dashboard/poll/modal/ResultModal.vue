<template>
  <div class="container-modal d-print-none">
    <div
      id="resultModal"
      ref="modal"
      class="modal fade"
      tabindex="-1"
      data-bs-keyboard="false"
      data-bs-backdrop="static"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
      >
        <div v-if="pollResult" class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ t("view.polls.modal.result") }}
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="hideModal()"
            ></button>
          </div>
          <div class="modal-body">
            <result-item :poll-result="pollResult" :event-record="event" />
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-danger"
              aria-label="Schließen"
              @click="hideModal()"
            >
              <span aria-hidden="true">
                {{ t("view.polls.modal.close") }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import ResultItem from "@/modules/organizer/components/events/poll/ResultItem.vue";
import t from "@/core/util/l18n";

const modal = ref(null);
let bootstrapModal = null;

defineProps({
  pollResult: {
    type: Object,
    required: false,
    default: null,
  },
  event: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  bootstrapModal = new Modal(modal.value);
});

function showModal() {
  bootstrapModal?.show();
}

function hideModal() {
  bootstrapModal?.hide();
}

defineExpose({
  showModal,
  hideModal,
});
</script>