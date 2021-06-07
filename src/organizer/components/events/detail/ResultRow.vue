<template>
  <li class="list-group-item">
    <div class="border p-3">
      <h5 class="mb-1">
        {{ pollResult.poll.title }} ({{
          localize('view.results.type.' + pollResult.type)
        }}) -
        {{ getCreateDatetime }}
      </h5>
      <p class="small text-muted">
        {{ localize('view.event.user.member') }}:
        {{ pollResult.pollUser.length }} |
        {{ localize('view.results.givenVotes') }}
        {{ pollResult.pollAnswer.length }} |
        {{ localize('view.results.voters') }}
        {{ pollResult.maxVotes }}
      </p>
      <hr class="divider my-2" />
      <div class="row">
        <div class="col-12 col-md-6">
          <p>{{ localize('view.results.mainResult') }}</p>
          <div class="result-list">
            <ul class="list-group">
              <li
                v-for="(answer, index) in pollAnswerGroups"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                {{ index }}
                <span
                  v-if="index === 'Ja'"
                  class="badge badge-pill"
                  style="background-color: green; color: white"
                >
                  {{ answer.length }}
                </span>
                <span
                  v-else-if="index === 'Nein'"
                  class="badge badge-pill"
                  style="background-color: red; color: white"
                >
                  {{ answer.length }}
                </span>
                <span
                  v-else
                  class="badge badge-pill"
                  style="background-color: grey; color: white"
                >
                  {{ answer.length }}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <p>{{ localize('general.member') }}</p>
          <button
            class="btn btn-primary d-print-none"
            type="button"
            data-toggle="collapse"
            :data-target="'#poll-' + pollResult.id + '-ResultVoters'"
            aria-expanded="false"
            :aria-controls="'poll-' + pollResult.id + '-ResultVoters'"
          >
            <i class="bi bi-caret-right-fill"></i>
            {{ localize('view.results.showMemberList') }}
          </button>
          <div class="collapse" :id="'poll-' + pollResult.id + '-ResultVoters'">
            <div class="card card-body">
              <ul class="list-group">
                <li
                  v-for="(participant, index) in pollResult.pollUser"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ participant.publicName }}
                </li>
              </ul>
            </div>
          </div>
          <hr class="divider mx-2" />
          <p v-if="pollResult.type === 'PUBLIC'">
            {{ localize('view.results.detailResult') }}
          </p>
          <button
            v-if="pollResult.type === 'PUBLIC'"
            class="btn btn-primary d-print-none"
            type="button"
            data-toggle="collapse"
            :data-target="'#poll-' + pollResult.id + '-ResultDetails'"
            aria-expanded="false"
            :aria-controls="'poll-' + pollResult.id + '-ResultDetails'"
          >
            <i class="bi bi-caret-right-fill"></i>
            {{ localize('view.results.showDetailResult') }}
          </button>
          <div
            class="collapse"
            :id="'poll-' + pollResult.id + '-ResultDetails'"
            v-if="pollResult.type === 'PUBLIC'"
          >
            <div class="card card-body">
              <ul class="list-group" v-if="eventRecord.multivoteType == 1">
                <li
                  v-for="(participantWithAnswer,
                  index) in pollResult.pollAnswer"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ getPublicName(participantWithAnswer.pollUserId) }} -
                  {{ participantWithAnswer.answerContent }}
                </li>
              </ul>
              <ul class="list-group" v-if="eventRecord.multivoteType == 2">
                <li
                  v-for="(user, index) in pollAnswerGroupByUser"
                  :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  {{ getPublicName(index) }} - {{ user.length }} x
                  {{ user[0].answerContent }}
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
import { localize } from '@/frame/lib/localization-helper'
import { createFormattedDateFromTimeStamp } from '@/frame/lib/time-stamp'

export default {
  props: {
    eventRecord: {
      type: Object
    },
    pollResult: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      headline: 'Umfrage-Ergebnisse',
      eventUsers: [],
      pollResults: []
    }
  },
  computed: {
    pollAnswerGroups () {
      return this.groupBy(this.pollResult.pollAnswer, 'answerContent')
    },
    getCreateDatetime () {
      return createFormattedDateFromTimeStamp(this.pollResult.createDatetime)
    },
    pollAnswerGroupByUser () {
      return this.groupBy(this.pollResult.pollAnswer, 'pollUserId')
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    groupBy (array, key) {
      const result = {}
      array.forEach(item => {
        if (!result[item[key]]) {
          result[item[key]] = []
        }
        result[item[key]].push(item)
      })
      return result
    },
    getPublicName (pollUserId) {
      const userFound = this.pollResult.pollUser.find(
        user => user.id === pollUserId
      )
      if (!userFound) {
        return 'Unknown'
      }
      return userFound.publicName
    }
  }
}
</script>
<style scoped>
@media print {
  .collapse {
    display: block !important;
    height: auto !important;
  }
  .col-md-9 {
    width: 100% !important;
  }
  .list-group-item {
    position: relative;
    page-break-inside: avoid;
    page-break-after: always;
  }
}
</style>
