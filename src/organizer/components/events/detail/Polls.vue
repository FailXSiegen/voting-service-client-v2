<template>
  <div class="polls-container mt-2">
    <app-create-poll
      :eventRecord="eventRecord"
      :newPoll="poll"
      :currentOnlineUserCount="currentOnlineUserCount"
      @onCreatePoll="createPoll"
      @onUpdatePoll="updatePoll"
      @onReset="reset"
    />
    <hr class="divider my-5" />
    <p v-if="currentOnlineUserCount === 0">
      <u>
        {{ localize('view.polls.noActiveUser') }}
      </u>
    </p>
    <app-polls-listing
      :pollsWithNoResults="pollsWithNoResults"
      :eventRecord="eventRecord"
      :currentOnlineUserCount="currentOnlineUserCount"
      @onRemovePoll="removePoll"
      @onStartPoll="startPoll"
      @onCopyPoll="copyPoll"
    />
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import AppCreatePoll from '@/organizer/components/events/detail/polls/CreatePoll'
import AppPollsListing from '@/organizer/components/events/detail/polls/PollsListing'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    pollsWithNoResults: {
      type: Array
    },
    currentOnlineUserCount: {
      type: Number
    }
  },
  components: {
    AppCreatePoll,
    AppPollsListing
  },
  data () {
    return {
      poll: {
        eventId: this.eventRecord.id,
        title: '',
        type: 'SECRET',
        pollAnswer: 'yesNoAbstain',
        list: '',
        minVotes: 0,
        maxVotes: 1,
        allowAbstain: false,
        possibleAnswers: []
      },
      identifier: 'quickpoll',
      trigger: false
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    createPoll (poll, instantStart) {
      this.$emit('onCreatePoll', poll, instantStart)
      this.reset()
    },
    updatePoll (poll, instantStart) {
      this.$emit('onUpdatePoll', poll, instantStart)
      this.reset()
    },
    removePoll (pollId) {
      this.$emit('onRemovePoll', pollId)
    },
    startPoll (pollId) {
      this.$emit('onStartPoll', pollId)
    },
    copyPoll (copyPoll) {
      copyPoll.copy = true
      this.poll = JSON.parse(JSON.stringify(copyPoll))
    },
    reset () {
      this.poll = {
        eventId: this.eventRecord.id,
        title: '',
        type: 'SECRET',
        pollAnswer: 'yesNoAbstain',
        list: '',
        minVotes: 0,
        maxVotes: 1,
        allowAbstain: false,
        possibleAnswers: []
      }
    }
  }
}
</script>
