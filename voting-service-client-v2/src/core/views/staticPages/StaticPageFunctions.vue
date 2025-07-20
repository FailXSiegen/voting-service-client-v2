<template>
  <CorePageLayout meta-title="Funktionen">
    <div class="functions">
      <h1>Funktionsübersicht</h1>
      <hr />
      <div class="row">
        <div class="col-12 col-md-6">
          <ul class="list-group list-group-numbered">
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Synchrone Wahl
              </h3>
              <p class="mb-1">
                Begleitend zur laufenden Veranstaltung möglich.
              </p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Asynchrone Wahl
              </h3>
              <p class="mb-1">Digitale Briefwahl - spart Porto und Papier.</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Geheime und
                offene Wahlen
              </h3>
              <p class="mb-1">
                Antrag auf geheime Wahl? Kein Problem; hier bleibt es geheim.
              </p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Teilnehmer- und
                Gästeverwaltung
              </h3>
              <p class="mb-1">
                Delegierter überträgt spontan sein Stimmrecht? Vorstand neu
                gewählt und das Stimmrecht ändert sich? Schnell und einfach für
                jeden Benutzer anpassbar - in Echtzeit.
              </p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Einfacher Export
                der Ergebnisse
              </h3>
              <p class="mb-1">Ergebnisse können als CSV archiviert werden.</p>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i>&nbsp;Integrierte
                Videokonferenz
              </h3>
              <p class="mb-1">
                Zwei Anwendungen gleichzeitig sind zu viel? Integrieren Sie die
                Videokonferenz in digitalwahl.org.
              </p>
              <small>Aktuell unterstützt: Zoom</small>
            </li>
            <li class="list-group-item">
              <h3 class="mb-1">
                <i class="bi bi-check-circle bi--2xl"></i
                >&nbsp;Endgeräte-bezogene Wahl
              </h3>
              <p class="mb-1">
                Pseudonymisieren Sie alles! Nutzer erhalten einen Link zur
                Endgeräte-Registrierung, danach kann nicht mehr nachvollzogen
                werden, wer der Teilnehmer ist. Nur, dass er ein berechtigter
                Teilnehmer ist.
              </p>
              <small
                >E-Mail-Adresse des Teilnehmers wird einmalig benötigt und wird
                nicht gespeichert.</small
              >
            </li>
          </ul>
        </div>
        <div class="col-12 col-md-6">
          <ul class="list-group list-group-numbered">
            <li class="list-group-item">
              <i class="bi bi-github"></i>&nbsp;Open Source;
              <a
                href="https://github.com/FailXSiegen/voting-service-client-v2"
                target="_blank"
                >Client</a
              >&nbsp;|&nbsp;<a
                href="https://github.com/FailXSiegen/voting-service-api"
                target="_blank"
                >Server</a
              >
            </li>
            <li class="list-group-item">
              <i class="bi bi-server"></i>&nbsp;Installierbar auf eigenem
              Hosting
            </li>
            <li class="list-group-item">
              <i class="bi bi-currency-euro"></i>&nbsp;Kostenfrei auf
              digitalwahl.org nutzbar
            </li>
            <li class="list-group-item">
              <i class="bi bi-clipboard-plus"></i>&nbsp;Wünschen Sie sich eine
              bestimmte Funktion?<br /><a href="mailto:info@digitalwahl.org"
                >Schreiben Sie uns Ihren Vorschlag per E-Mail.</a
              >
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <p>
        Die Plattform digitalwahl.org kann aktuell als
        <b>Begleit-Anwendung</b> für digitale, analoge oder hybride
        Versammlungen verwendet werden.
      </p>
      <p>Mit der Anwendung als asynchrones Wahltool lassen sich auch</p>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
</script>
