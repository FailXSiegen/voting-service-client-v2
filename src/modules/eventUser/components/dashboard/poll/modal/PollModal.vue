<template>
  <div class="container-modal d-print-none">
    <div
      id="pollModal"
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
          v-if="poll"
          class="modal-content"
        >
          <div class="modal-header">
            <h5
              :id="identifier + 'Title'"
              class="modal-title"
            >
              {{ poll.title }}<br>
              <small
                v-if="props.event.multivoteType !== 2"
                id="pollCounter"
              >
                <b>(Stimme {{ voteCounter }} von {{ eventUser.voteAmount }})</b>
              </small>
            </h5>
          </div>

          <div class="modal-body">
            <p v-if="poll.maxVotes === 1">
              {{ $t('view.polls.modal.maxVote1') }}
            </p>
            <p v-if="poll.maxVotes > 1">
              {{ $t('view.polls.modal.maxVoteGreater1') }}
              {{ poll.maxVotes }}
            </p>
            <p v-if="poll.minVotes > 0">
              {{ $t('view.polls.modal.minVoteGreater0') }}
              {{ poll.minVotes }}
            </p>

            <PollForm
              :key="pollFormKey"
              :event="event"
              :event-user="eventUser"
              :poll="poll"
              :vote-counter="voteCounter"
              @submit="onSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PollForm from "@/modules/eventUser/components/dashboard/poll/PollForm.vue";
import {ref} from "vue";
// TODO Remove me with bootstrap 5.
import $ from 'jquery';

const emit = defineEmits(['submit']);
const props = defineProps({
    poll: {
        type: Object,
        required: true
    },
    event: {
        type: Object,
        required: true
    },
    eventUser: {
        type: Object,
        required: true
    },
    voteCounter: {
        type: Number,
        required: true
    },
});
// This key is only a small hack to force a rerender of this component.
const pollFormKey = ref(1);

// Events.
function onSubmit(data) {
    emit('submit', data);
    pollFormKey.value += 1;
}

function showModal() {
    // TODO Remove me with bootstrap 5.
    $('#pollModal').modal('show');
}

function hideModal() {
    $('#pollModal').modal('hide');
    // TODO Remove me with bootstrap 5.
    pollFormKey.value += 1;
}

// Make these methods available for the parent component.
defineExpose({
    showModal,
    hideModal
});
</script>

<style>
/* TODO do we need this? */
.pulse {
    background: rgba(23, 162, 184, 0.15);
    box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.5);
    transform: scale(1);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(23, 162, 184, 0.4);
    }
    30% {
        transform: scale(0.99);
        box-shadow: 0 0 0 10px rgba(23, 162, 184, 0);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(23, 162, 184, 0);
    }
}
</style>