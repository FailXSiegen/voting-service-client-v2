<template>
  <li class="list-group-item">
    <div class="border p-3">
      <h5 class="mb-1">{{  poll.title }} ({{ localize('view.results.type.' + poll.type) }}) - {{ poll.modifiedDatetime }}</h5>
      <p class="small text-muted">
        {{ localize('view.results.givenVotes') }} {{  poll.amountVotes }} | {{ localize('view.results.voters') }} {{  poll.amountPossibleVotes }}
      </p>
      <hr class="divider my-2" />
      <div class="row">
        <div class="col-12 col-md-6">
          <p>{{ localize('view.results.mainResult') }}</p>
          <div class="result-list">
            <ul class="list-group">
              <li v-for="(answer, index) in poll.answers" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
                {{ answer.content }}
                <span class="badge badge-pill" style="background-color: green;color: white;"> {{ answer.amount }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p>{{ localize('general.member') }}</p>
          <button class="btn btn-primary"
                  type="button"
                  data-toggle="collapse"
                  data-target="#poll-ID-ResultVoters"
                  aria-expanded="false"
                  aria-controls="poll-ID-ResultVoters">
            <i class="bi bi-caret-right-fill"></i>
            {{ localize('view.results.showMemberList') }}
          </button>
          <div class="collapse" id="poll-ID-ResultVoters">
            <div class="card card-body">
              <ul class="list-group">
                <li v-for="participant in poll.participants" :key="participant.publicName" class="list-group-item d-flex justify-content-between align-items-center">
                  {{ participant.publicName }}
                </li>
              </ul>
            </div>
          </div>
          <hr class="divider mx-2" />
          <p v-if="poll.participantsWithAnswers">{{ localize('view.results.detailResult') }}</p>
          <button v-if="poll.participantsWithAnswers" class="btn btn-primary" type="button" data-toggle="collapse" data-target="#poll-ID-ResultDetails"
                  aria-expanded="false" aria-controls="poll-ID-ResultDetails">
            <i class="bi bi-caret-right-fill"></i>
            {{ localize('view.results.showDetailResult') }}
          </button>
          <div class="collapse" id="poll-ID-ResultDetails" v-if="poll.participantsWithAnswers">
            <div class="card card-body">
              <ul class="list-group">
                <li  v-for="participantWithAnswer in poll.participantsWithAnswers" :key="participantWithAnswer.publicName" class="list-group-item d-flex justify-content-between align-items-center">
                  {{ participantWithAnswer.publicName }} - {{ participantWithAnswer.content }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    poll: {
      type: Object,
      required: true
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
