<template>
  <div class="container-modal d-print-none">
    <button
      type="button"
      class="btn btn-primary"
      data-toggle="modal"
      :data-target="'#' + identifier"
    >
      {{ $t('view.polls.modal.buttonStart') }}
    </button>
    <div
      :id="identifier"
      class="modal fade"
      tabindex="-1"
      role="dialog"
      data-keyboard="false"
      data-backdrop="static"
      :aria-labelledby="identifier + 'Title'"
      aria-hidden="true"
    >
      <div
        class="modal-dialog modal-dialog-centered"
        role="document"
      >
        <div class="modal-content">
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
              :event="event"
              :event-user="eventUser"
              :poll="poll"
              :vote-counter="voteCounter"
              @update-vote-counter="onUpdateVoteCounter"
              @submit="onSubmit"
            />
          </div>
          <div class="modal-footer">
            <button
              type="submit"
              class="btn btn-primary"
            >
              {{ $t('view.polls.modal.submitPoll') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PollForm from "@/modules/eventUser/components/dashboard/poll/modal/PollForm.vue";
import {ref} from "vue";

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
});

// Data.

const identifier = `poll-${props.poll.id}`;
const voteCounter = ref(1);

// Events.

function onUpdateVoteCounter(value) {
  voteCounter.value = value;
}

async function onSubmit(data) {
  console.log(data, 'submit');
  emit('submit', data);
}

// export default {
//   props: {
//     poll: {
//       type: Object,
//       required: true
//     },
//     identifier: {
//       type: String,
//       required: true
//     },
//     voteAmount: {
//       type: Number,
//       default () {
//         return 1
//       }
//     },
//     trigger: {
//       type: Boolean,
//       required: true
//     },
//     multivoteType: {
//       type: Number,
//       required: true
//     }
//   },
//   data () {
//     return {
//       pollSubmitAnswerInput: {
//         possibleAnswerId: 0,
//         possibleAnswerIds: [],
//         answerContent: '',
//         answerContents: [],
//         type: this.poll.type,
//         eventUserId: this.$store.getters.getCurrentUserId,
//         voteCycle: 1,
//         multivote: false
//       },
//       voteCounter: 1,
//       abstain: false
//     }
//   },
//   mounted () {
//     if (this.trigger === true) {
//       this.onTriggerModal()
//     }
//   },
//   methods: {
//     localize (path) {
//       return localize(path, this.$store.state.language)
//     },
//     onTriggerModal () {
//       if ($('#zmmtg-root .root-inner').length > 0) {
//         $('#' + this.identifier).removeClass('fade')
//       }
//       $('#' + this.identifier).modal('show')
//     },
//     validateCheckboxes () {
//       if (this.poll.minVotes > 0 && this.poll.maxVotes > 1) {
//         const validateCheckbox = $('.form-check-input[name*="pollAnswer"]')
//         let checkCounter = 0
//         validateCheckbox.each(function (index, element) {
//           $(element).removeAttr('disabled')
//           if ($(element).prop('checked')) {
//             checkCounter++
//           }
//         })
//         if (
//             checkCounter >= this.poll.minVotes &&
//             checkCounter < this.poll.maxVotes
//         ) {
//           validateCheckbox.each(function (index, element) {
//             if (!$(element).prop('checked')) {
//               $(element).removeAttr('required')
//             }
//           })
//         } else {
//           if (checkCounter > 0 && checkCounter >= this.poll.maxVotes) {
//             validateCheckbox.each(function (index, element) {
//               if (!$(element).prop('checked')) {
//                 $(element).attr('disabled', 'disabled')
//               }
//             })
//           } else {
//             validateCheckbox.each(function (index, element) {
//               if (!$(element).prop('checked')) {
//                 $(element).attr('required', 'required')
//               }
//             })
//           }
//         }
//       }
//     },
//     submitPoll () {
//       const form = $('#poll-form')
//       if (form.get(0).checkValidity() === false) {
//         form.addClass('was-validated')
//         return false
//       }
//
//       if (
//           this.poll.minVotes > 0 &&
//           this.poll.minVotes > this.pollSubmitAnswerInput.answerContents.length &&
//           !this.pollSubmitAnswerInput.answerContent &&
//           !this.abstain
//       ) {
//         addWarnMessage('Hinweis', 'Es fehlt noch eine Auswahl')
//         return false
//       } else if (
//           this.poll.maxVotes < this.pollSubmitAnswerInput.answerContents.length &&
//           this.poll.maxVotes > 0 &&
//           !this.abstain
//       ) {
//         addWarnMessage(
//             'Hinweis',
//             'Bitte beachten Sie die Anzahl der ausgewählten Positionen'
//         )
//         return false
//       } else {
//         if (this.abstain) {
//           this.pollSubmitAnswerInput.answerContent = localize(
//               'view.polls.modal.abstain'
//           )
//         }
//         this.$emit('onSubmitPoll', this.pollSubmitAnswerInput)
//         if (
//             this.voteCounter >= this.voteAmount ||
//             this.multivoteType === 2 ||
//             this.pollSubmitAnswerInput.multivote
//         ) {
//           $('#' + this.identifier).modal('hide')
//         }
//         if (this.voteCounter < this.voteAmount) {
//           this.voteCounter++
//           this.pollSubmitAnswerInput.voteCycle++
//           $(function () {
//             $('.modal-header').addClass('pulse')
//             $('.modal-footer .btn').addClass('btn-success')
//             setTimeout(function () {
//               $('.modal-header').removeClass('pulse')
//               $('.modal-footer .btn').removeClass('btn-success')
//             }, 1500)
//           })
//         }
//       }
//     },
//     setPossibleAnswerAbstain () {
//       const validateCheckbox = $('.form-check-input[name*="pollAnswer"]')
//       this.pollSubmitAnswerInput.answerContents = []
//       this.pollSubmitAnswerInput.answerContent = ''
//       if (!this.abstain) {
//         validateCheckbox.each(function (index, element) {
//           $(element).removeAttr('required')
//           $(element).prop('checked', false)
//         })
//         $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', true)
//       } else {
//         validateCheckbox.each(function (index, element) {
//           $(element).attr('required', 'required')
//         })
//       }
//       this.abstain = !this.abstain
//     },
//     setPossibleAnswerId (pollAnswerId) {
//       this.abstain = false
//       $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', false)
//       this.pollSubmitAnswerInput.possibleAnswerId = pollAnswerId
//     },
//     setPossibleAnswerIds (pollAnswerId, pollAnswerContent) {
//       this.abstain = false
//       $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', false)
//       this.validateCheckboxes()
//       if (
//           this.pollSubmitAnswerInput.possibleAnswerIds.filter(
//               (possibleAnswerId) => {
//                 return possibleAnswerId.id === pollAnswerId
//               }
//           ).length > 0
//       ) {
//         this.pollSubmitAnswerInput.possibleAnswerIds.splice(
//             this.pollSubmitAnswerInput.possibleAnswerIds.findIndex(
//                 (possibleAnswerId) => possibleAnswerId.id === pollAnswerId
//             ),
//             1
//         )
//       } else {
//         this.pollSubmitAnswerInput.possibleAnswerIds.push({
//           id: pollAnswerId,
//           answerContent: pollAnswerContent
//         })
//       }
//     },
//     close () {
//       $('#' + this.identifier).modal('hide')
//     }
//   }
// }
</script>

<style scoped>
.form-check {
  padding-left: 2.25rem;
}

.form-check-input {
  margin-left: -2.25rem;
  width: 30px;
  min-height: 30px;
}

.form-check-label {
  min-height: 30px;
  font-size: 24px;
  margin: 0 0 25px 0;
}

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