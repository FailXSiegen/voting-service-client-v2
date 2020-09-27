<template>
  <div class="polls-container mt-2">
    <app-create-poll :eventRecord="eventRecord"
                     @onCreatePoll="createPoll"
    />
    <hr class="divider my-5" />
    <app-polls-listing :pollsWithNoResults="pollsWithNoResults"
                       :eventRecord="eventRecord"
                       @onRemovePoll="removePoll"
                       @onStartPoll="startPoll"
    />
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import AppCreatePoll from '@/components/events/event/polls/CreatePoll'
import AppPollsListing from '@/components/events/event/polls/PollsListing'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    pollsWithNoResults: {
      type: Array
    }
  },
  components: {
    AppCreatePoll,
    AppPollsListing
  },
  data () {
    return {
      poll: {
        id: 1,
        title: 'Test 23',
        maxVotes: 1,
        answers: [
          {
            id: 1,
            content: 'Ja'
          },
          {
            id: 2,
            content: 'Nein'
          }
        ]
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
    },
    removePoll (pollId) {
      this.$emit('onRemovePoll', pollId)
    },
    startPoll (pollId) {
      this.$emit('onStartPoll', pollId)
    }
  }
}
</script>
