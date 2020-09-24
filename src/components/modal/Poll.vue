<template>
  <div class="container-modal">
    <button v-if="trigger === false"
            type="button"
            class="btn btn-primary"
            data-toggle="modal"
            data-backdrop="static"
            data-keyboard="false"
            :data-target="'#' + identifier">
      Abstimmung starten
    </button>
    <div class="modal fade"
         :id="identifier"
         tabindex="-1"
         role="dialog"
         data-keyboard="false"
         data-backdrop="static"
         :aria-labelledby="identifier + 'Title'"
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <form @submit.prevent="onPollSubmit">
            <div class="modal-header">
              <h5 class="modal-title"
                  :id="identifier + 'Title'">{{ poll.title }}<br /><small>(Stimme 1 von {{ voteAmount }})</small></h5>
            </div>
            <div class="modal-body">
              <fieldset class="input-radios" v-if="poll.maxVotes === 1">
                <div v-for="(pollAnswer, index) in poll.possibleAnswers" :key="index" class="form-check">
                  <input class="form-check-input"
                         type="radio"
                         :name="'poll' + poll.id + 'Answers'"
                         :id="'poll' + poll.id + 'Answer' + pollAnswer.id"
                         :required="poll.minVotes > 0" >
                  <label class="form-check-label" :for="'poll' + poll.id + 'Answer' + pollAnswer.id">
                    {{ pollAnswer.content }}
                  </label>
                </div>
              </fieldset>
              <fieldset class="input-checkbox" v-if="poll.maxVotes > 1">
                <div v-for="(pollAnswer, index) in poll.possibleAnswers" :key="index" class="form-check">
                  <input class="form-check-input"
                         type="checkbox"
                         :name="'poll' + poll.id + 'Answers'"
                         :id="'poll' + poll.id + 'Answer' + pollAnswer.id"
                         :required="poll.minVotes > 0">
                  <label class="form-check-label" :for="'poll' + poll.id + 'Answer' + pollAnswer.id">
                    {{ pollAnswer.content }}
                  </label>
                </div>
              </fieldset>
              <fieldset class="input-checkbox" v-if="poll.allowAbstain > 1">
                <input class="form-check-input"
                       type="checkbox"
                       :name="'poll' + poll.id + 'AnswersAbstain'"
                       :id="'poll' + poll.id + 'AnswerAnswersAbstain'"
                       >
                <label class="form-check-label" :for="'poll' + poll.id + 'AnswerAnswerAnswersAbstain'">
                  {{ localize('view.polls.modal.abstain') }}
                </label>
                <small :id="'poll' + poll.id + 'AnswerAnswerAnswersAbstainHelp'" class="form-text text-muted">{{ localize('view.polls.modal.abstainHelptext') }}</small>
              </fieldset>
            </div>
            <div class="modal-footer">
              <button type="submit"
                      class="btn btn-primary">
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
import { localize } from '@/helper/localization-helper'

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
    onPollSubmit () {
      $('#' + this.identifier).modal('toggle')
      this.$emit('updatePollState', 'voted')
    }
  }
}
</script>
