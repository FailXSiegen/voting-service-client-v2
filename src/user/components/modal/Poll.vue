<template>
  <div class="container-modal d-print-none">
    <button
      v-if="trigger === false"
      type="button"
      class="btn btn-primary"
      data-toggle="modal"
      data-backdrop="static"
      data-keyboard="false"
      :data-target="'#' + identifier"
    >
      {{ localize('view.polls.modal.buttonStart') }}
    </button>
    <div
      class="modal fade"
      :id="identifier"
      tabindex="-1"
      role="dialog"
      data-keyboard="false"
      data-backdrop="static"
      :aria-labelledby="identifier + 'Title'"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <form @submit.prevent="submitPoll">
            <div class="modal-header">
              <h5 class="modal-title" :id="identifier + 'Title'">
                {{ poll.title }}<br /><small
                  >(Stimme {{ voteCounter }} von {{ voteAmount }})</small
                >
              </h5>
            </div>
            <div class="modal-body">
              <p v-if="poll.maxVotes === 1">
                {{ localize('view.polls.modal.maxVote1') }}
              </p>
              <p v-if="poll.maxVotes > 1">
                {{ localize('view.polls.modal.maxVoteGreater1') }}
                {{ poll.maxVotes }}
              </p>
              <p v-if="poll.minVotes > 0">
                {{ localize('view.polls.modal.minVoteGreater0') }}
                {{ poll.minVotes }}
              </p>
              <fieldset class="input-radios" v-if="poll.maxVotes === 1">
                <div
                  v-for="(pollAnswer, index) in poll.possibleAnswers"
                  :key="index"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="radio"
                    v-model="pollSubmitAnswerInput.answerContent"
                    @click="setPossibleAnswerId(pollAnswer.id)"
                    :value="pollAnswer.content"
                    :name="'pollAnswer' + poll.id"
                    :id="'pollAnswer' + poll.id + pollAnswer.id"
                    required="required"
                  />
                  <label
                    class="form-check-label"
                    :for="'pollAnswer' + poll.id + pollAnswer.id"
                  >
                    {{ pollAnswer.content }}
                  </label>
                </div>
              </fieldset>
              <fieldset
                class="input-checkbox"
                v-if="poll.maxVotes > 1 || poll.maxVotes === 0"
              >
                <div
                  v-for="(pollAnswer, index) in poll.possibleAnswers"
                  :key="index"
                  class="form-check"
                >
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="pollSubmitAnswerInput.answerContents"
                    @click="setPossibleAnswerIds(pollAnswer.id)"
                    :value="pollAnswer.content"
                    :name="'pollAnswer' + poll.id"
                    :id="'pollAnswer' + poll.id + pollAnswer.id"
                    :required="poll.minVotes > 0"
                  />
                  <label
                    class="form-check-label"
                    :for="'pollAnswer' + poll.id + pollAnswer.id"
                  >
                    {{ pollAnswer.content }}
                  </label>
                </div>
              </fieldset>
              <hr v-if="poll.allowAbstain" />
              <fieldset class="input-checkbox" v-if="poll.allowAbstain">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    @click="setPossibleAnswerAbstain()"
                    :value="localize('view.polls.modal.abstain')"
                    :name="'pollAllowAbstain' + poll.id"
                    :id="'pollAllowAbstain' + poll.id"
                  />
                  <label
                    class="form-check-label"
                    :for="'pollAllowAbstain' + poll.id"
                  >
                    {{ localize('view.polls.modal.abstain') }}
                  </label>
                  <small
                    :id="'poll' + poll.id + 'AnswerAnswerAnswersAbstainHelp'"
                    class="form-text text-muted"
                    >{{ localize('view.polls.modal.abstainHelptext') }}</small
                  >
                </div>
              </fieldset>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">
                {{ localize('view.polls.modal.submitPoll') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'
import { localize } from '@/frame/lib/localization-helper'
import { addWarnMessage } from '@/frame/lib/alert-helper'

export default {
  props: {
    poll: {
      type: Object,
      required: true
    },
    identifier: {
      type: String,
      required: true
    },
    voteAmount: {
      type: Number,
      default () {
        return 1
      }
    },
    trigger: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      pollSubmitAnswerInput: {
        possibleAnswerId: 0,
        possibleAnswerIds: [],
        answerContent: '',
        answerContents: [],
        type: this.poll.type,
        eventUserId: this.$store.getters.getCurrentUserId,
        voteCycle: 1
      },
      voteCounter: 1,
      abstain: false
    }
  },
  mounted () {
    if (this.trigger === true) {
      this.onTriggerModal()
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    onTriggerModal () {
      $('#' + this.identifier).modal('show')
    },
    validateCheckboxes () {
      if (this.poll.minVotes > 0 && this.poll.maxVotes > 1) {
        const validateCheckbox = $('.form-check-input[name*="pollAnswer"]')
        let checkCounter = 0
        validateCheckbox.each(function (index, element) {
          if ($(element).prop('checked')) {
            checkCounter++
          }
        })
        if (checkCounter === this.poll.minVotes) {
          validateCheckbox.each(function (index, element) {
            if (!$(element).prop('checked')) {
              $(element).removeAttr('required')
            }
          })
        } else {
          validateCheckbox.each(function (index, element) {
            if (!$(element).prop('checked')) {
              $(element).attr('required', 'required')
            }
          })
        }
      }
    },
    submitPoll () {
      if (
        this.poll.minVotes > 0 &&
        this.poll.minVotes > this.pollSubmitAnswerInput.answerContents.length &&
        !this.pollSubmitAnswerInput.answerContent &&
        !this.abstain
      ) {
        addWarnMessage('Hinweis', 'Es fehlt noch eine Auswahl')
        return false
      } else if (
        this.poll.maxVotes < this.pollSubmitAnswerInput.answerContents.length &&
        this.poll.maxVotes > 0 &&
        !this.abstain
      ) {
        addWarnMessage('Hinweis', 'Sie haben noch offene Angaben')
        return false
      } else {
        if (this.abstain) {
          this.pollSubmitAnswerInput.answerContent = localize(
            'view.polls.modal.abstain'
          )
        }
        this.$emit('onSubmitPoll', this.pollSubmitAnswerInput)
        if (this.voteCounter >= this.voteAmount) {
          $('#' + this.identifier).modal('hide')
        }
        if (this.voteCounter < this.voteAmount) {
          this.voteCounter++
          this.pollSubmitAnswerInput.voteCycle++
        }
      }
    },
    setPossibleAnswerAbstain () {
      const validateCheckbox = $('.form-check-input[name*="pollAnswer"]')
      this.pollSubmitAnswerInput.answerContents = []
      this.pollSubmitAnswerInput.answerContent = ''
      if (!this.abstain) {
        validateCheckbox.each(function (index, element) {
          $(element).removeAttr('required')
          $(element).prop('checked', false)
        })
        $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', true)
      } else {
        validateCheckbox.each(function (index, element) {
          $(element).attr('required', 'required')
        })
      }
      this.abstain = !this.abstain
    },
    setPossibleAnswerId (pollAnswerId) {
      this.abstain = false
      $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', false)
      this.pollSubmitAnswerInput.possibleAnswerId = pollAnswerId
    },
    setPossibleAnswerIds (pollAnswerId, pollAnswerContent) {
      this.abstain = false
      $('.form-check-input[name*="pollAllowAbstain"]').prop('checked', false)
      this.validateCheckboxes()
      if (
        this.pollSubmitAnswerInput.possibleAnswerIds.filter(
          possibleAnswerId => {
            return possibleAnswerId.id === pollAnswerId
          }
        ).length > 0
      ) {
        this.pollSubmitAnswerInput.possibleAnswerIds.splice(
          this.pollSubmitAnswerInput.possibleAnswerIds.findIndex(
            possibleAnswerId => possibleAnswerId.id === pollAnswerId
          ),
          1
        )
      } else {
        this.pollSubmitAnswerInput.possibleAnswerIds.push({
          id: pollAnswerId,
          answerContent: pollAnswerContent
        })
      }
    },
    close () {
      $('#' + this.identifier).modal('hide')
    }
  }
}
</script>

<style scoped>
.form-check {
  padding-left: 2.25rem;
}
.form-check-input {
  margin-left: -2.25rem;
  width: 30px;
  height: 30px;
}
.form-check-label {
  height: 30px;
  font-size: 24px;
  margin: 0 0 25px 0;
}
</style>
