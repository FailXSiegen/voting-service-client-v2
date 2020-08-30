<template>
  <div class="results-listing">
    <h1>Resultslisting to be defined.</h1>
    <h2>Vergangene Abstimmungen</h2>
    <ul class="created-polls list-group">
      <li class="list-group-item">
        <div class="border p-3">
          <h5 class="mb-1">Titel der Abstimmung (offen)</h5>
          <p class="small text-muted">Anzahl abgegebener Stimmen: 52 | Stimmberechtigte: 51</p>
          <bar-chart></bar-chart>
          <hr class="divider my-2" />
          <div class="row">
            <div class="col-12 col-md-6">
              <p>Gesamtergebnis</p>
              <div class="result-list">
                <ul class="list-group">
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Ja
                    <span class="badge badge-pill" style="background-color: green;color: white;">40</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Nein
                    <span class="badge badge-pill" style="background-color: red; color: white;">10</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Enthaltung
                    <span class="badge badge-primary badge-pill" style="background-color: grey">2</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <p>Teilnehmer</p>
              <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#poll-ID-ResultVoters"
                      aria-expanded="false" aria-controls="poll-ID-ResultVoters">
                <i class="bi bi-caret-right-fill"></i>&nbsp;Teilnehmerliste anzeigen
              </button>
              <div class="collapse" id="poll-ID-ResultVoters">
                <div class="card card-body">
                  <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Felix Meyer
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Superstar of Fistguitar
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Lena Landrut
                    </li>
                  </ul>
                </div>
              </div>
              <hr class="divider mx-2" />
              <p>Detailergebnis</p>
              <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#poll-ID-ResultDetails"
                      aria-expanded="false" aria-controls="poll-ID-ResultDetails">
                <i class="bi bi-caret-right-fill"></i>&nbsp;Ergebnisliste anzeigen
              </button>
              <div class="collapse" id="poll-ID-ResultDetails">
                <div class="card card-body">
                  <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Felix Meyer
                      <span class="badge badge-pill" style="background-color: green;color: white;">Ja</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Felix Meyer
                      <span class="badge badge-pill" style="background-color: green;color: white;">Ja</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Superstar of Fistguitar
                      <span class="badge badge-pill" style="background-color: grey;color: white;">Enthaltung</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Lena Landrut
                      <span class="badge badge-pill" style="background-color: red;color: white;">Nein</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>

    </ul>
  </div>
</template>

<script>

import { localize } from '@/helper/localization-helper'
import Vue from 'vue'
import VueChartJs from 'vue-chartjs'

Vue.component('bar-chart', {
  extends: VueChartJs.HorizontalBar,
  mounted () {
    this.renderChart({
      datasets: [
        {
          label: 'Ja',
          backgroundColor: 'green',
          data: [40]
        },
        {
          label: 'Nein',
          backgroundColor: 'red',
          data: [10]
        },
        {
          label: 'Enthaltung',
          backgroundColor: 'grey',
          data: [2]
        }
      ]
    }, {
      tooltips: {
        enabled: true
      },
      hover: {
        animationDuration: 0
      },
      legend: {
        position: 'bottom'
      },
      scales: {
        xAxes: [{
          ticks: {
            scaleShowLabels: true
          }
        }],
        yAxes: [{
          ticks: {
            scaleShowLabels: true
          }
        }]
      },
      responsive: true,
      maintainAspectRatio: false
    })
  }
})
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
