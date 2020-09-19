<template>
  <div class="polls-container mt-2">
    <app-create-poll />
    <hr class="divider my-5" />
    <app-polls-listing />
    <hr class="divider my-5" />
    <h2>TEST VORSCHAU POLL</h2>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-backdrop="static" data-keyboard="false" data-target="#examplePoll">
      Zeige Vorschau einer Abstimmung
    </button>
    <div class="modal fade" id="examplePoll" tabindex="-1" role="dialog" aria-labelledby="examplePollTitle"
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="examplePollTitle">Sind Sie für die Entlastung des Vorstands?<br /><small>(Stimme 1 von 1)</small></h5>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-check">
                <input class="form-check-input"
                       type="radio"
                       name="poll##ID##Answers"
                       id="poll##ID##Answer###ID###1"
                       value="###ID###" required>
                <label class="form-check-label" for="poll##ID##Answer###ID###1">
                  Ja
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="poll##ID##Answers" id="poll##ID##Answer###ID###2"
                       value="###ID###">
                <label class="form-check-label" for="poll##ID##Answer###ID###2">
                  Nein
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="poll##ID##Answers" id="poll##ID##Answer###ID###3"
                       value="###ID###">
                <label class="form-check-label" for="poll##ID##Answer###ID###3">
                  Enthaltung
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="submit" data-dismiss="modal" class="btn btn-primary">Jetzt abstimmen</button>
          </div>
        </div>
      </div>
    </div>
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

export default {
  created () {
    this.eventRecord = this.$route.params.eventRecord
  },
  components: {
    AppCreatePoll,
    AppPollsListing
  },
  data () {
    return {
      eventRecord: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
