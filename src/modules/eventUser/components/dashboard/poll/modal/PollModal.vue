<template>
  <div class="container-modal d-print-none">
    <div
      id="pollModal"
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
        <div v-if="poll" class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ poll.title }}<br />
              <small v-if="props.event.multivoteType !== 2" id="pollCounter">
                <b>(Stimme {{ voteCounter }} von {{ eventUser.voteAmount }})</b>
              </small>
            </h5>
          </div>

          <div class="modal-body">
            <VotingDetails
              v-if="poll.type === 'PUBLIC' && activePollEventUser"
              :active-poll-event-user="activePollEventUser"
            />

            <p v-if="poll.maxVotes === 1">
              {{ $t("view.polls.modal.maxVote1") }}
            </p>
            <p v-if="poll.maxVotes > 1">
              {{ $t("view.polls.modal.maxVoteGreater1") }}
              {{ poll.maxVotes }}
            </p>
            <p v-if="poll.minVotes > 0">
              {{ $t("view.polls.modal.minVoteGreater0") }}
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
import { ref, onMounted } from "vue";
import { Modal } from "bootstrap";
import PollForm from "@/modules/eventUser/components/dashboard/poll/PollForm.vue";
import VotingDetails from "@/modules/eventUser/components/dashboard/poll/VotingDetails.vue";

const emit = defineEmits(["submit"]);
const modal = ref(null);
let bootstrapModal = null;

const props = defineProps({
  poll: {
    type: Object,
    required: false,
    default: null,
  },
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
  activePollEventUser: {
    type: Object,
    required: false,
    default: null,
  },
  voteCounter: {
    type: Number,
    required: true,
  },
});

const pollFormKey = ref(1);

onMounted(() => {
  bootstrapModal = new Modal(modal.value);
});

function onSubmit(data) {
  emit("submit", data);
  pollFormKey.value += 1;
}

function showModal() {
  bootstrapModal?.show();
}

function hideModal() {
  bootstrapModal?.hide();
  pollFormKey.value += 1;
}

defineExpose({
  showModal,
  hideModal,
});
</script>

<style>
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
