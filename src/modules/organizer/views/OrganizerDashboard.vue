<template>
  <PageLayout :meta-title="$t('navigation.views.organizerDashboard')">
    <template #title>
      {{ $t("navigation.views.organizerDashboard") }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div class="row">
        <div class="col-12 col-sm-6 order-2 order-sm-1">
          <div class="card border-secondary p-2 p-sm-4">
            <h2 class="h3">
              <u>Neuigkeiten</u>
            </h2>
            <dl class="mb-1">
              <dt>Asynchrone Abstimmungen</dt>
              <dd>
                Definieren Sie einen Start- und Endzeitpunkt für Ihre
                Veranstaltung. Alle Teilnehmer können dann innerhalb dieses
                Zeitraums abstimmen. Die Ergebnisse werden erst nach Ablauf des
                Endzeitpunkts angezeigt.
              </dd>
              <dt>
                Neue Pseudonymisierte Zugriffsart für Teilnehmer:
                Token-basierter Zugang
              </dt>
              <dd>
                Als Organisator tragen Sie bei den Teilnehmern E-Mail Adressen
                ein. Die Teilnehmer erhalten dann einen Link per E-Mail, mit dem
                sie sich anmelden können. Bei der Anmeldung wird ein Schlüssel
                (Token) auf dem verwendeten Endgerät gespeichert. Es wird kein
                Zusammenhang zwischen E-Mail Adresse und Token vom System
                gespeichert. Der Token wird als Zugangsschlüssel zur
                Veranstaltung verwendet.<br />
                <u>Wichtig:</u><br />
                Teilnehmer müssen das gleiche Endgerät verwenden, mit dem sie
                sich angemeldet haben. Ansonsten ist der Zugang nicht möglich.
              </dd>
              <dt>Technisches Update</dt>
              <dd>
                Dank einem technischen Update ist die Anwendung nun noch
                schneller und stabiler. Einige Funktionen wurden verbessert und
                Fehler behoben.
              </dd>
            </dl>
            <hr />
            <p>
              Sie benötigen ein neue Funktion? Schreiben Sie Ihren Vorschlag an
              <a href="mailto:info@digitalwahl.de">info@digitalwahl.de</a>
            </p>
            <p>
              Der komplette Quellcode ist öffentlich verfügbar unter: <br />
              <a
                href="https://github.com/FailXSiegen/voting-service-client-v2"
                target="_blank"
              >
                https://github.com/FailXSiegen/voting-service-client-v2
              </a>
              <br />
              <a
                href="https://github.com/FailXSiegen/voting-service-api"
                target="_blank"
              >
                https://github.com/FailXSiegen/voting-service-api
              </a>
            </p>
            <p>
              Der Quellcode und die Funktion wurden von der Firma amexus
              Informationstechnik GmbH & Co. KG geprüft. Stand 23.12.2021. Auf
              Anfrage können Sie das Ergebnis per E-Mail als PDF erhalten.
            </p>
          </div>
        </div>
        <div class="col-12 col-sm-6 order-1 order-sm-2">
          <div class="row">
            <div class="col-6 col-lg-4 col-xl-auto mb-4">
              <router-link
                :to="{ name: RouteOrganizerProfile }"
                class="btn btn-primary tn-block py-3 px-0 d-flex flex-column align-items-center h-100 px-xl-4"
              >
                <span
                  class="nav-icon bi--6xl bi-person mb-auto"
                  :title="$t('navigation.views.' + RouteOrganizerProfile)"
                />
                <span class="nav-title mt-1 px-2">
                  {{ $t("navigation.views." + RouteOrganizerProfile) }}
                </span>
              </router-link>
            </div>
            <div class="col-6 col-lg-4 col-xl-auto mb-4">
              <router-link
                :to="{ name: RouteStaticManual }"
                target="_blank"
                class="btn btn-primary btn-block py-3 px-0 d-flex flex-column h-100 px-xl-4"
              >
                <span
                  class="nav-icon bi--6xl bi-question-circle mb-auto"
                  title="Anleitungen"
                />
                <span class="nav-title mt-1 px-2"> Anleitungen </span>
              </router-link>
            </div>
            <div class="col-12 col-lg-auto mb-4">
              <router-link
                :to="{ name: RouteOrganizerVideoConference }"
                class="btn btn-primary btn-block py-3 px-0 d-flex flex-column align-items-center h-100 px-xl-4"
              >
                <span
                  class="btn btn-primary btn-block py-3 px-0 d-flex flex-column h-100"
                >
                  <span
                    class="nav-icon bi--6xl bi-camera-video-fill mb-auto"
                    title="Videokonferenzsystem einrichten"
                  />
                  <span class="nav-title mt-1 px-2">
                    Videokonferenzsysteme einrichten
                  </span>
                </span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Editor for SuperOrganizer -->
      <div v-if="coreStore.isSuperOrganizer" class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h3 class="h5 mb-0">
                <i class="bi bi-translate me-2"></i>
                {{ $t('navigation.views.organizerMessageEditor') }}
              </h3>
            </div>
            <div class="card-body">
              <p>
                Hier können Sie die System-Texte anpassen und überschreiben.
                Die Änderungen werden in einer separaten Datei gespeichert und überschreiben die Standard-Texte.
              </p>
              <router-link
                :to="{ name: RouteOrganizerMessageEditor }"
                class="btn btn-primary"
              >
                <i class="bi bi-translate me-2"></i>
                {{ $t('navigation.views.organizerMessageEditor') }} öffnen
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import {
  getRoutesByName,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteStaticManual,
  RouteOrganizerAllEvents,
  RouteOrganizerManagement,
  RouteOrganizerProfile,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
} from "@/router/routes";
import { useCore } from "@/core/store/core";

const coreStore = useCore();
const user = coreStore.user;

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
]);
</script>
