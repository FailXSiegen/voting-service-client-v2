<template>
  <div class="polls-container mt-2">
    <app-create-poll :eventRecord="eventRecord" />
    <hr class="divider my-5" />
    <app-polls-listing :pollsWithNoResults="pollsWithNoResults" :eventRecord="eventRecord"  />
    <hr class="divider my-5" />
    <h2>TEST VORSCHAU POLL</h2>
    <app-modal-poll :poll="poll" :identifier="identifier" :trigger="trigger" />
    <button type="button" class="btn btn-primary" data-toggle="modal" data-backdrop="static" data-keyboard="false" data-target="#examplePollWaiting">
      Zeige Vorschau einer Abstimmung
    </button>
    <div class="modal fade" id="examplePollWaiting" tabindex="-1" role="dialog" aria-labelledby="examplePollWaitingTitle"
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="examplePollWaitingTitle">Warten auf Abschluss der Abstimmung</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body text-center">
            <i class="bi--spin bi-arrow-repeat bi--6xl"></i>
          </div>
          <div class="modal-footer">
            <button data-modal="dismiss" class="btn btn-danger mx-auto">Nicht mehr auf das Ergebnis warten</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import AppCreatePoll from '@/components/events/event/polls/CreatePoll'
import AppPollsListing from '@/components/events/event/polls/PollsListing'
import AppModalPoll from '@/components/modal/Poll'

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
    AppModalPoll,
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
    }
  }
}
</script>
