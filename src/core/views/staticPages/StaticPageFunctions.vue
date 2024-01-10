<template>
  <CorePageLayout meta-title="Funktionen">
    <div class="functions">
      <h1>Funktionensübersicht</h1>
      <hr />
      <div class="row">
        <div class="col-12 col-md-6">
          <ul class="list-group list-group-numbered">
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Synchrone Wahl</h3>
              <p class="mb-1">Begleitend zur Ihrer laufenden Veranstaltung</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Asynchrone Wahl</h3>
              <p class="mb-1">Die digitale Briefwahl - sparen Sie sich Porto und Papier</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Geheime und offene Wahlen</h3>
              <p class="mb-1">Antrag zur geheimen Wahl wurde gestellt? Kein Problem; Hier bleibt's geheim</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Teilnehmer- und Gäste-Verwaltung</h3>
              <p class="mb-1">Ein Delegierter überträgt spontan sein Stimmrecht? Der Vorstand ist neu gewählt und das Stimmrecht verändert sich? Schnell und einfach für jeden Benutzer anpassbar. Live.</p>
              
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Einfacher Export der Ergebnisse</h3>
              <p class="mb-1">Archivieren Sie die Ergebnisse als CSV.</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Integrierte Videokonferenz</h3>
              <p class="mb-1">2 Anwendungen gleichzeitig sind eine zu viel? Integrieren Sie die Videokonferenz in digitalwahl.org</p>
              <small>Aktuell Unterstützt: Zoom</small>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1"><i class="bi bi-check-circle bi--2xl"></i>&nbsp;Endgeräte-bezogene Wahl </h3>
              <p class="mb-1">Pseudonymisieren Sie Alles! Nutzer erhalten einen Link zur Endgeräte-Registrierung, danach können Sie nicht mehr nachvollziehen, wer der Teilnehmer ist. Nur, das er berechtigter Teilnehmer ist.</p>
              <small>E-Mail Adresse der Teilnehmer einmalig erforderlich<br />Adresse wird nicht gespeichert</small>
            </li>
          </ul>
        </div>
        <div class="col-12 col-md-6">
          <ul class="list-group list-group-numbered">
            <li class="list-group-item">
              <i class="bi bi-github"></i>&nbsp;Open Source; 
              <a href="https://github.com/FailXSiegen/voting-service-client-v2" target="_blank">Client</a>&nbsp;|&nbsp;<a href="https://github.com/FailXSiegen/voting-service-api" target="_blank">Server</a>
            </li>
            <li class="list-group-item"><i class="bi bi-server"></i>&nbsp;Installierbar auf eigenem Hosting</li>
            <li class="list-group-item"><i class="bi bi-currency-euro"></i>&nbsp;Kostenfrei auf digitalwahl.org nutzbar</li>
            <li class="list-group-item"><i class="bi bi-clipboard-plus"></i>&nbsp;Feature gewünscht? <br /><a href="mailto:info@digitalwahl.org">E-Mail mit Vorschlag schreiben</a></li>
          </ul>
        </div>
      </div>
      <hr />
      <p>
        Die Plattform digitalwahl.org ist aktuell als
        <b>Begleit-Anwendung</b> zur digitalen, analogen oder hybriden Versammlung zu
        verwenden.
      </p>
      <p>Mit der Anwendung als asynchrones Wahltool lassen sich auch </p>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
</script>
