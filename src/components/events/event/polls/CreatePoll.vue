<template>
  <div class="create-poll-container">
    <h2>{{ localize('view.polls.headlines.createTitle') }}</h2>
    <form @submit.prevent="createPoll">
      <div class="form-group">
        <label for="pollTitle">{{ localize('view.polls.create.labels.title') }}</label>
        <input v-model="newPoll.title" type="text" class="form-control" id="pollTitle" required="required" :placeholder="localize('view.polls.create.labels.title')">
      </div>
      <p>{{ localize('view.polls.headlines.answerOptionsTitle') }}</p>
      <div class="poll-basic-type alert alert-secondary">
        <div class="form-check">
          <input v-model="newPoll.pollAnswer" class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities1" value="yesNo">
          <label class="form-check-label" for="pollAnswerPossibilities1">
            {{ localize('view.polls.create.labels.yesNo') }}
          </label>
        </div>
        <div class="form-check">
          <input v-model="newPoll.pollAnswer" class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities2" value="yesNoAbstain">
          <label class="form-check-label" for="pollAnswerPossibilities2">
            {{ localize('view.polls.create.labels.yesNoAbstain') }}
          </label>
        </div>
        <div class="form-check">
          <input v-model="newPoll.pollAnswer" class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities3" value="custom">
          <label class="form-check-label" for="pollAnswerPossibilities3">
            {{ localize('view.polls.create.labels.custom') }}
          </label>
        </div>
      </div>
      <div v-if="newPoll.pollAnswer === 'custom'" class="individual-options my-4 border ml-4 p-3">
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomList">{{ localize('view.polls.create.labels.listOfAnswerOptions') }}</label>
          <textarea v-model="newPoll.custom.list" class="form-control" id="pollAnswerPossibilitiesCustomList" rows="3"
                    aria-describedby="pollAnswerPossibilitiesCustomListHelpBlock"></textarea>
          <small id="pollAnswerPossibilitiesCustomListHelpBlock" class="form-text text-muted">
            {{ localize('view.polls.create.labels.listOfAnswerOptionsInfo') }}
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMaximal">{{ localize('view.polls.create.labels.maxVotes') }}</label>
          <input v-model="newPoll.custom.maxVotes" type="number"
                 class="form-control w-auto"
                 id="pollAnswerPossibilitiesCustomListMaximal"
                 aria-describedby="pollAnswerPossibilitiesCustomListMaximalHelpBlock">
          <small id="pollAnswerPossibilitiesCustomListMaximalHelpBlock" class="form-text text-muted">
            {{ localize('view.polls.create.labels.maxVotesInfo') }}
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMinimal">{{ localize('view.polls.create.labels.minVotes') }}</label>
          <input v-model="newPoll.custom.minVotes" type="number"
                 class="form-control w-auto"
                 id="pollAnswerPossibilitiesCustomListMinimal"
                 aria-describedby="pollAnswerPossibilitiesCustomListMinimalHelpBlock">
          <small id="pollAnswerPossibilitiesCustomListMinimalHelpBlock" class="form-text text-muted">
            {{ localize('view.polls.create.labels.minVotesInfo') }}
          </small>
        </div>
        <div class="form-check">
          <input v-model="newPoll.custom.allowAbstain" class="form-check-input" type="checkbox" id="pollAnswerPossibilitiesCustomListAbstention">
          <label class="form-check-label" for="pollAnswerPossibilitiesCustomListAbstention">
            {{ localize('view.polls.create.labels.abstention') }}
          </label>
        </div>
      </div>
      <div class="poll-type my-3 alert alert-secondary">
        <div class="form-check">
          <input v-model="newPoll.pollType" class="form-check-input" type="radio" name="pollType" id="pollType1" value="public">
          <label class="form-check-label" for="pollType1">
            {{ localize('view.polls.create.labels.openPoll') }}
          </label>
        </div>
        <div class="form-check">
          <input v-model="newPoll.pollType" class="form-check-input" type="radio" name="pollType" id="pollType2" value="secret">
          <label class="form-check-label" for="pollType2">
            {{ localize('view.polls.create.labels.secretPoll') }}
          </label>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-5">
          <button class="btn btn-primary mr-2 mb-2 mb-lg-0 w-100">
            <i class="bi-plus bi--2xl align-middle"></i>
            <span class="align-middle">{{ localize('view.polls.create.labels.saveOnly') }}</span>
          </button>
        </div>
        <div class="col-12 col-md-7 text-right">
          <button class="btn btn-secondary w-100">
            <i class="bi-play bi--2xl align-middle"></i>
            <span class="align-middle">{{ localize('view.polls.create.labels.saveAndStart') }}</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  data () {
    return {
      newPoll: {
        title: '',
        pollAnswer: 'yesNoAbstain',
        custom: {
          list: '',
          allowAbstain: false,
          minVotes: 1,
          maxVotes: 1
        },
        pollType: 'public'
      }
    }
  },
  methods: {
    createPoll () {
      alert('POLL ERSTELLT')
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
