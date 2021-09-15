<template>
  <div class="dashboard-container">
    <app-navigation />
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <app-event-listing
            v-if="upcomingEvents"
            :headline="localize('view.event.upcoming')"
            :events-detail="true"
            :events="upcomingEvents"
          />
          <hr class="mb-5" />
          <div class="row">
            <div class="col-12 col-sm-6 order-2 order-sm-1">
              <div class="border border-secondary p-2 p-sm-4">
                <h2 class="h3"><u>Neuigkeiten</u></h2>
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
                <h2 class="h3"><u>Nächste Features</u></h2>
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
                      :title="localize('navigation.myProfile')"
                    ></span>
                    <span class="nav-title mt-1 px-2">
                      {{ localize('navigation.myProfile') }}
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
                    ></span>
                    <span class="nav-title mt-1 px-2">
                      Anleitungen
                    </span>
                  </router-link>
                </div>
                <div class="col-12 col-lg-auto mb-4">
                  <router-link to="/admin/video-conference"
                    class="btn btn-primary btn-block py-3 px-0 d-flex flex-column align-items-center h-100 px-xl-4">
                    <span class="btn btn-primary btn-block py-3 px-0 d-flex flex-column h-100">
                      <span
                        class="nav-icon bi--6xl bi-camera-video-fill mb-auto"
                        title="Videokonferenzsystem einrichten"
                      ></span>
                      <span class="nav-title mt-1 px-2">
                        Videokonferenzsysteme einrichten
                      </span>
                    </span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppEventListing from '@/organizer/components/events/Listing'
import { localize } from '@/frame/lib/localization-helper'
import {
  EXPIRED_EVENTS,
  UPCOMING_EVENTS
} from '@/organizer/api/graphql/gql/queries'

export default {
  components: {
    AppNavigation,
    AppEventListing
  },
  apollo: {
    upcomingEvents: {
      query: UPCOMING_EVENTS,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
    },
    expiredEvents: {
      query: EXPIRED_EVENTS,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
    }
  },
  created () {
    document.title = 'Übersicht - digitalwahl.org'
  },
  data () {
    return {
      headline: 'Dashboard',
      expiredEvents: [],
      upcomingEvents: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
