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
         :aria-labelledby="identifier + 'Title'"
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <form @submit.prevent="onPollSubmit">
            <div class="modal-header">
              <h5 class="modal-title"
                  :id="identifier + 'Title'">{{ poll.title }}<br /><small>(Stimme 1 von 1)</small></h5>
            </div>
            <div class="modal-body">
              <fieldset class="input-radios" v-if="poll.maxVotes === 1">
                <div v-for="(pollAnswer, index) in poll.possibleAnswers" :key="index" class="form-check">
                  <input class="form-check-input"
                         type="radio"
                         :name="'poll' + poll.id + 'Answers'"
                         :id="'poll' + poll.id + 'Answer' + pollAnswer.id"
                         required>
                  <label class="form-check-label" :for="'poll' + poll.id + 'Answer' + pollAnswer.id">
                    {{ pollAnswer.content }}
                  </label>
                </div>
              </fieldset>
            </div>
            <div class="modal-footer">
              <button type="submit"
                      class="btn btn-primary">
                Jetzt abstimmen
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
