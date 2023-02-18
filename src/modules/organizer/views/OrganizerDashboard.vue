<template>
  <PageLayout>
    <template #title>
      Dashboard
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
            <dl>
              <dt>Organisator-Ansicht aktualisiert</dt>
              <dd>
                Responsive/mobile Navigation verbessert, Icons in die
                Navigation integriert
              </dd>
              <dt>Filtern nach Benutzernamen</dt>
              <dd>
                In der Teilnehmerliste und im Wartenraum lässt sich jetzt
                nach Benutzernamen filtern für einen schnelleren Zugriff
              </dd>
              <dt>Sortieren von Teilnehmern</dt>
              <dd>
                Im Warteraum und in der Teilnehmerliste lässt sich jetzt
                nach Benutzernamen, Angezeigten Namen, Online oder
                Erstellungsdatum (standard) sortieren. Mit einem 2. Klick
                auf das gleiche Sortierkriterium invertiert die Reihenfolge
              </dd>
            </dl>
            <h2 class="h3">
              <u>Nächste Features</u>
            </h2>
            <dl>
              <dt>Kopieren & Löschen von Veranstaltungen</dt>
              <dd>
                Aktives Löschen seitens Organisatoren und kopieren von
                bereits erstellten Veranstaltungen mit allen erstellten
                (gespeicherten) Abstimmungen
              </dd>
              <dt>Integration von Videokonferenzsystemem</dt>
              <dd>
                Einbettung von Zoom, Jitsi, BBB und weiteren System ist
                langfristig geplant. Den Anfang macht Zoom!
              </dd>
              <dt>OpenSource Veröffentlichung</dt>
              <dd>
                Der Source-Code ist aktuell schon einsehbar und auf eigenen
                System installierbar, jedoch nur was für Profis. Wir wollen
                Anleitungen und Installationshelfer erstellen und
                bereitstellen damit Vereine und Verbände ihre eigene
                Digitalwahl-Plattform verwalten können für 100%ige
                Datenhoheit.
              </dd>
            </dl>
          </div>
        </div>
        <div class="col-12 col-sm-6 order-1 order-sm-2">
          <div class="row">
            <div class="col-6 col-lg-4 col-xl-auto mb-4">
              <router-link
                to="/admin/profile"
                class="btn btn-primary btn-block py-3 px-0 d-flex flex-column align-items-center h-100 px-xl-4"
              >
                <span
                  class="nav-icon bi--6xl bi-person mb-auto"
                  :title="$t('navigation.myProfile')"
                />
                <span class="nav-title mt-1 px-2">
                  {{ $t('navigation.myProfile') }}
                </span>
              </router-link>
            </div>
            <div class="col-6 col-lg-4 col-xl-auto mb-4">
              <router-link
                to="/anleitung"
                target="_blank"
                class="btn btn-primary btn-block py-3 px-0 d-flex flex-column h-100 px-xl-4"
              >
                <span
                  class="nav-icon bi--6xl bi-question-circle  mb-auto"
                  title="Anleitungen"
                />
                <span class="nav-title mt-1 px-2">
                  Anleitungen
                </span>
              </router-link>
            </div>
            <div class="col-12 col-lg-auto mb-4" />
          </div>
        </div>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import {getRoutesByName, RouteMainLogin, RouteOrganizerDashboard} from "@/router/routes";

// Define navigation items.
const routes = getRoutesByName([RouteMainLogin, RouteOrganizerDashboard]);
</script>
