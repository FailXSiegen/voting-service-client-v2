<template>
  <div class="polls-container mt-2">
    <app-create-poll />
    <hr class="divider my-5" />
    <app-polls-listing />
    <hr class="divider my-5" />
    <h2>TEST VORSCHAU POLL</h2>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#examplePoll">
      Zeige Vorschau einer Abstimmung
    </button>
    <div class="modal fade" id="examplePoll" tabindex="-1" role="dialog" aria-labelledby="examplePollTitle"
         aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="examplePollTitle">Sind Sie für die Entlastung des Vorstands? (Stimme 1 von
              1)</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="poll##ID##Answers" id="poll##ID##Answer###ID###1"
                       value="###ID###" required>
                <label class="form-check-label" for="poll##ID##Answer###ID###1">
                  Ja
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="poll##ID##Answers" id="poll##ID##Answer###ID###2"
                       value="###ID###" required>
                <label class="form-check-label" for="poll##ID##Answer###ID###2">
                  Nein
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="poll##ID##Answers" id="poll##ID##Answer###ID###3"
                       value="###ID###" required>
                <label class="form-check-label" for="poll##ID##Answer###ID###3">
                  Enthaltung
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary">Jetzt abstimmen</button>
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
  components: {
    AppCreatePoll,
    AppPollsListing
  },
  data () {
    return {}
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
