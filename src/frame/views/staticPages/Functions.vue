<template>
  <div class="functions container min-vh-100">
    <h1>Funktionen und Planung</h1>
    <hr />
    <h2>Aktuell verfügbare Funktionen</h2>
    <ul>
      <li>Synchrone Wahl</li>
      <li>Geheime und offene Wahlen</li>
      <li>Teilnehmer- und Gäste-Verwaltung</li>
      <li>Einfacher Export der Ergebnisse</li>
    </ul>
    <p>
      Die Plattform digitalwahl.org ist aktuell als <b>Begleit-Anwendung</b> zur
      digitalen oder hybriden Versammlung zu verwenden.
    </p>
    <hr />
    <h2>In Planung</h2>
    <ul>
      <li>Dokumentation und Installer</li>
      <li>Docker-Image</li>
      <li>OpenSource-Veröffentlichung</li>
      <li>Integrierte Videokonferenz</li>
      <li>Asynchrone Wahlen (digitale Briefwahl)</li>
      <li>
        Endgeräte-bezogene Wahl (nach E-Mail basiertem Anmeldeprozess ohne
        Namen, Token wird auf Endgerät gespeichert)
      </li>
    </ul>
    <span class="alert alert-info text-center h4 w-100 mt-3 d-inline-block">
      Diese Seite befindet sich noch im Aufbau und wird laufend aktualisiert
    </span>
    <app-footer />
  </div>
</template>
<script>
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  created () {
    document.title = 'Funktionen - digitalwahl.org'
  }
}
</script>
