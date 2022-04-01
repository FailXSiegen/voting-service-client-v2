<template>
  <div class="create-poll-container">
    <h2>{{ localize('view.polls.headlines.createTitle') }}</h2>
    <form @submit.prevent="createPoll">
      <div class="form-group">
        <label for="pollTitle">{{
          localize('view.polls.create.labels.title')
        }}</label>
        <input
          v-model="newPoll.title"
          type="text"
          class="form-control"
          id="pollTitle"
          required="required"
          :placeholder="localize('view.polls.create.labels.title')"
        />
      </div>
      <p>{{ localize('view.polls.headlines.answerOptionsTitle') }}</p>
      <div class="poll-basic-type alert alert-secondary">
        <div class="form-check">
          <input
            v-model="newPoll.pollAnswer"
            class="form-check-input"
            type="radio"
            name="pollAnswer"
            id="pollAnswerPossibilities1"
            value="yesNo"
          />
          <label class="form-check-label" for="pollAnswerPossibilities1">
            {{ localize('view.polls.create.labels.yesNo') }}
          </label>
        </div>
        <div class="form-check">
          <input
            v-model="newPoll.pollAnswer"
            class="form-check-input"
            type="radio"
            name="pollAnswer"
            id="pollAnswerPossibilities2"
            value="yesNoAbstain"
          />
          <label class="form-check-label" for="pollAnswerPossibilities2">
            {{ localize('view.polls.create.labels.yesNoAbstain') }}
          </label>
        </div>
        <div class="form-check">
          <input
            v-model="newPoll.pollAnswer"
            class="form-check-input"
            type="radio"
            name="pollAnswer"
            id="pollAnswerPossibilities3"
            value="custom"
          />
          <label class="form-check-label" for="pollAnswerPossibilities3">
            {{ localize('view.polls.create.labels.custom') }}
          </label>
        </div>
      </div>
      <div
        v-if="newPoll.pollAnswer === 'custom'"
        class="individual-options my-4 border ml-4 p-3"
      >
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomList">{{
            localize('view.polls.create.labels.listOfAnswerOptions')
          }}</label>
          <textarea
            v-model="newPoll.list"
            class="form-control"
            id="pollAnswerPossibilitiesCustomList"
            rows="3"
            aria-describedby="pollAnswerPossibilitiesCustomListHelpBlock"
          ></textarea>
          <small
            id="pollAnswerPossibilitiesCustomListHelpBlock"
            class="form-text text-muted"
          >
            {{ localize('view.polls.create.labels.listOfAnswerOptionsInfo') }}
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMaximal">{{
            localize('view.polls.create.labels.maxVotes')
          }}</label>
          <input
            v-model="newPoll.maxVotes"
            type="number"
            min="0"
            class="form-control w-auto"
            id="pollAnswerPossibilitiesCustomListMaximal"
            aria-describedby="pollAnswerPossibilitiesCustomListMaximalHelpBlock"
          />
          <small
            id="pollAnswerPossibilitiesCustomListMaximalHelpBlock"
            class="form-text text-muted"
          >
            {{ localize('view.polls.create.labels.maxVotesInfo') }}
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMinimal">{{
            localize('view.polls.create.labels.minVotes')
          }}</label>
          <input
            v-model="newPoll.minVotes"
            type="number"
            min="0"
            class="form-control w-auto"
            id="pollAnswerPossibilitiesCustomListMinimal"
            aria-describedby="pollAnswerPossibilitiesCustomListMinimalHelpBlock"
          />
          <small
            id="pollAnswerPossibilitiesCustomListMinimalHelpBlock"
            class="form-text text-muted"
          >
            {{ localize('view.polls.create.labels.minVotesInfo') }}
          </small>
        </div>
        <div class="form-check">
          <input
            v-model="newPoll.allowAbstain"
            class="form-check-input"
            type="checkbox"
            id="pollAnswerPossibilitiesCustomListAbstention"
          />
          <label
            class="form-check-label"
            for="pollAnswerPossibilitiesCustomListAbstention"
          >
            {{ localize('view.polls.create.labels.abstention') }}
          </label>
        </div>
      </div>
      <div class="poll-type my-3 alert alert-secondary">
        <div class="form-check">
          <input
            v-model="newPoll.type"
            class="form-check-input"
            type="radio"
            name="pollType"
            id="pollType1"
            value="PUBLIC"
          />
          <label class="form-check-label" for="pollType1">
            {{ localize('view.polls.create.labels.openPoll') }}
          </label>
        </div>
        <div class="form-check">
          <input
            v-model="newPoll.type"
            class="form-check-input"
            type="radio"
            name="pollType"
            id="pollType2"
            value="SECRET"
          />
          <label class="form-check-label" for="pollType2">
            {{ localize('view.polls.create.labels.secretPoll') }}
          </label>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-5">
          <button
            type="submit"
            @click="instantStart = false"
            class="btn btn-primary mr-2 mb-2 mb-lg-0 w-100"
          >
            <i class="bi-plus bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.polls.create.labels.saveOnly')
            }}</span>
          </button>
        </div>
        <div class="col-12 col-md-7 text-right">
          <button
            type="submit"
            @click="instantStart = true"
            :disabled="currentOnlineUserCount === 0"
            class="btn btn-success w-100"
          >
            <i class="bi-play bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.polls.create.labels.saveAndStart')
            }}</span>
          </button>
        </div>
      </div>
      <div class="row mt-5" v-if="newPoll.copy">
        <div class="col-12 col-md-5">
          <button
            type="button"
            @click="updatePoll(false)"
            class="btn btn-primary mr-2 mb-2 mb-lg-0 w-100"
          >
            <i class="bi-plus bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.polls.create.labels.replaceOnly')
            }}</span>
          </button>
        </div>
        <div class="col-12 col-md-7 text-right">
          <button
            type="button"
            @click="updatePoll(true)"
            :disabled="currentOnlineUserCount === 0"
            class="btn btn-success w-100"
          >
            <i class="bi-play bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.polls.create.labels.replaceAndStart')
            }}</span>
          </button>
        </div>
      </div>
      <div class="row mt-5" v-if="newPoll.title">
        <div class="col-12 col-md-5">
          <button
            type="button"
            @click="reset()"
            class="btn btn-danger mr-2 mb-2 mb-lg-0 w-100"
          >
            <span class="align-middle">{{
              localize('view.polls.create.labels.reset')
            }}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { convertPollAnswers } from '@/organizer/converter/poll/convertPollAnswers'
import $ from 'jquery'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    newPoll: {
      type: Object
    },
    currentOnlineUserCount: {
      type: Number
    }
  },
  data () {
    return {
      instantStart: false,
      initPoll: {
        eventId: this.eventRecord.id,
        title: '',
        type: 'PUBLIC',
        pollAnswer: 'yesNoAbstain',
        list: '',
        minVotes: 0,
        maxVotes: 1,
        allowAbstain: false,
        possibleAnswers: []
      }
    }
  },
  methods: {
    validateVotesCounter (pollObject) {
      let isValid = true
      if (pollObject.maxVotes < 0) {
        $('#pollAnswerPossibilitiesCustomListMaximal').addClass('is-invalid')
        isValid = false
      }
      if (pollObject.minVotes < 0) {
        $('#pollAnswerPossibilitiesCustomListMinimal').addClass('is-invalid')
        isValid = false
      }
      if (pollObject.maxVotes < pollObject.minVotes) {
        $('#pollAnswerPossibilitiesCustomListMinimal').addClass('is-invalid')
        $('#pollAnswerPossibilitiesCustomListMaximal').addClass('is-invalid')
        isValid = false
      }
      return isValid
    },
    createPoll () {
      let createPollObject = JSON.parse(JSON.stringify(this.newPoll))
      if (!this.validateVotesCounter(createPollObject)) {
        return false
      }
      createPollObject = convertPollAnswers(createPollObject)
      createPollObject.maxVotes = parseInt(createPollObject.maxVotes)
      createPollObject.minVotes = parseInt(createPollObject.minVotes)
      createPollObject.eventId = this.eventRecord.id
      delete createPollObject.__typename
      delete createPollObject.copy
      delete createPollObject.id
      this.$emit('onCreatePoll', createPollObject, this.instantStart)
    },
    updatePoll (instantStart) {
      let updatePollObject = JSON.parse(JSON.stringify(this.newPoll))
      if (!this.validateVotesCounter(instantStart)) {
        return false
      }
      updatePollObject = convertPollAnswers(updatePollObject)
      updatePollObject.maxVotes = parseInt(updatePollObject.maxVotes)
      updatePollObject.minVotes = parseInt(updatePollObject.minVotes)
      updatePollObject.eventId = this.eventRecord.id
      delete updatePollObject.__typename
      delete updatePollObject.copy
      this.$emit('onUpdatePoll', updatePollObject, instantStart)
    },
    localize (path) {
      return localize(path)
    },
    reset () {
      this.$emit('onReset')
    }
  }
}
</script>
