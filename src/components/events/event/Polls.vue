<template>
  <div class="polls-container mt-2">
    <app-create-poll @createPollSuccess="createPollSuccess" :eventRecord="eventRecord" />
    <hr class="divider my-5" />
    <app-polls-listing :pollsWithNoResults="pollsWithNoResults" :eventRecord="eventRecord"  />
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
    createPollSuccess (newPoll) {
      this.$emit('createPollSuccess', {
        poll: newPoll.poll
      })
    }
  }
}
</script>
