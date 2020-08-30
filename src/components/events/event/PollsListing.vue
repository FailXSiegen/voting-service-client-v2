<template>
  <div class="poll-listing-container mt-2">
    <h2>Neue Abstimmung erstellen</h2>
    <form>
      <div class="form-group">
        <label for="pollTitle">Was soll abgestimmt werden?</label>
        <input type="text" class="form-control" id="pollTitle" placeholder="Entlastung des Vorstands?">
      </div>
      <p>Antwortoptionen für Abstimmung</p>
      <div class="poll-basic-type alert alert-secondary">
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities1" value="1">
          <label class="form-check-label" for="pollAnswerPossibilities1">
            Ja/Nein
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities2" value="2"
                 checked>
          <label class="form-check-label" for="pollAnswerPossibilities2">
            Ja/Nein/Enthaltung
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pollAnswer" id="pollAnswerPossibilities3" value="custom">
          <label class="form-check-label" for="pollAnswerPossibilities3">
            Individuelle Antwortoptionen
          </label>
        </div>
      </div>
      <div class="individual-options my-4 border ml-4 p-3">
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomList">Liste der Antwortoptionen</label>
          <textarea class="form-control" id="pollAnswerPossibilitiesCustomList" rows="3"
                    aria-describedby="pollAnswerPossibilitiesCustomListHelpBlock"></textarea>
          <small id="pollAnswerPossibilitiesCustomListHelpBlock" class="form-text text-muted">
            Ein Eintrag pro Zeile entspricht einer Auswahlmöglichkeit
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMaximal">Maximal auszuwählen</label>
          <input type="number"
                 class="form-control w-auto"
                 value="1"
                 id="pollAnswerPossibilitiesCustomListMaximal"
                 aria-describedby="pollAnswerPossibilitiesCustomListMaximalHelpBlock">
          <small id="pollAnswerPossibilitiesCustomListMaximalHelpBlock" class="form-text text-muted">
            0 = alle auswählbar
          </small>
        </div>
        <div class="form-group">
          <label for="pollAnswerPossibilitiesCustomListMinimal">Minimal auszuwählen</label>
          <input type="number"
                 class="form-control w-auto"
                 value="1"
                 id="pollAnswerPossibilitiesCustomListMinimal"
                 aria-describedby="pollAnswerPossibilitiesCustomListMinimalHelpBlock">
          <small id="pollAnswerPossibilitiesCustomListMinimalHelpBlock" class="form-text text-muted">
            0 = leere Abstimmung möglich
          </small>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="1" id="pollAnswerPossibilitiesCustomListAbstention">
          <label class="form-check-label" for="pollAnswerPossibilitiesCustomListAbstention">
            Enthaltungsfeld anzeigen
          </label>
        </div>
      </div>
      <div class="poll-type my-3 alert alert-secondary">
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pollType" id="pollType1" value="1" checked>
          <label class="form-check-label" for="pollType1">
            Offene Abstimmung
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="pollType" id="pollType2" value="2">
          <label class="form-check-label" for="pollType2">
            Geheime Abstimmung
          </label>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-5">
          <button class="btn btn-primary mr-2 mb-2 mb-lg-0 w-100">
            <i class="bi-plus bi--2xl align-middle"></i>&nbsp;<span class="align-middle">Abstimmung speichern</span>
          </button>
        </div>
        <div class="col-12 col-md-7 text-right">
          <button class="btn btn-secondary w-100">
            <i class="bi-play bi--2xl align-middle"></i>&nbsp;<span class="align-middle">Abstimmung speichern & sofort starten</span>
          </button>
        </div>
      </div>
    </form>
    <hr class="divider my-5" />
    <h2>Vorgefertigte Abstimmungen</h2>
    <ul class="created-polls list-group">
      <li class="list-group-item">
        <h5 class="mb-1">Titel der Abstimmung</h5>
        <button class="btn btn-primary mr-2"><i class="bi-play bi--2xl align-middle"></i>&nbsp;<span
          class="align-middle">Abstimmung starten</span></button>
        <button class="btn btn-danger mr-2" onclick="return confirm('Soll die Abstimmung wirklich gelöscht werden?');">&times;&nbsp;Abstimmung löschen
        </button>
      </li>
    </ul>
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

export default {
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
