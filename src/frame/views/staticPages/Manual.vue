<template>
  <div class="manual container min-vh-100">
    <h1>Anleitungen</h1>
    <div class="alert alert-info">
      <div class="row">
        <div class="col-2 text-center">
          <i class="bi bi-exclamation-circle display-2"></i>
        </div>
        <div class="col d-flex align-items-center">
          <p>
            <b>Achtung</b>: Screenshots und Informationen können sich vom
            aktuell verfügbaren Entwicklungsstand unterscheiden. Bei
            Veröffentlichung von neuene Features wird die Anleitung
            schnellstmöglich aktualisiert.
          </p>
        </div>
      </div>
    </div>
    <ul class="list-unstyled">
      <li class="mb-3">
        <a href="#teilnehmer" class="h3">Für Teilnehmer</a>
        <ol class="mt-3">
          <li><a href="#loginmaske">An einem Event teilnehmen</a></li>
          <li><a href="#warteraum">Warteraum</a></li>
          <li><a href="#gast">Gast</a></li>
          <li><a href="#stimmrecht">Teilnehmer</a></li>
          <li><a href="#demoabstimmung">Abstimmung</a></li>
        </ol>
      </li>
      <li>
        <a href="#organisator" class="h3">Für Organisatoren</a>
        <ol class="mt-3">
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#uebersicht">Meine Events</a></li>
          <li><a href="#eventerstellen">Neues Event erstellen</a></li>
          <li><a href="#event-teilnehmer">Event-Details</a></li>
          <li>
            <a href="#teilnehmer-editieren">Einzelnen Teilnehmer editieren</a>
          </li>
          <li><a href="#event-warteraum">Teilnehmer freischalten</a></li>
          <li>
            <a href="#event-abstimmung">Abstimmung erstellen und starten</a>
          </li>
          <li>
            <a href="#event-abstimmung-beenden">Abstimmung manuell beenden</a>
          </li>
          <li><a href="#event-ergebnisse">Ergebnisse</a></li>
        </ol>
      </li>
    </ul>
    <hr />
    <h2 id="teilnehmer" class="mb-3">Für Teilnehmer</h2>
    <div id="loginmaske" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/teilnehmer/loginmaske.png"
          alt="loginmaske"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>An einem Event teilnehmen</h3>
        <p>
          Sie können über einen vom Organisator bereitgestellten Link an dem
          Event teilnehmen.
        </p>
        <p>Für eine Anmeldung sind folgende Informationen erforderlich:</p>
        <ol>
          <li>
            <b>E-Mail Adresse oder Mitgliedsnummer:</b><br />Je nach Verfahren
            wird der Organisator eine vorherige Anmeldung durchgeführt haben.
            Verwenden Sie hier die vom Organisator vorgegebene Möglichkeit.
          </li>
          <li>
            <b>Passwort:</b><br />Geben Sie ein eigenes Kennwort ein, um sich
            nach dem Event erneut anmelden zu können. Das Passwort dient auch
            zur Wiederanmeldung, falls Sie während des Events das Endgerät
            wechseln oder sonstige technische Schwierigkeiten haben und sich neu
            anmelden müssen.
          </li>
          <li>
            <b>Anzeige-Name:</b><br />
            Der Name wird bei der Auswertung der Wahlen angezeigt. Hier sollte
            eine Eindeutigkeit geschaffen werden, also nicht nur Ihr Name,
            sondern am besten auch die Information, für welchen Verein/Verband
            Sie teilnehmen und Ihre Stimme abgeben.
          </li>
        </ol>
      </div>
    </div>
    <hr />
    <div id="warteraum" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/teilnehmer/warteraum.png"
          alt="Warteraum"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Warteraum</h3>
        <p>
          Falls der Organisator keine Teilnehmer im Vorfeld im Event hinterlegt
          hat, Sie andere Anmelde-Information verwenden oder einfach einen
          Rechtschreibfehler in Ihren Anmeldeinformationen haben sind Sie dem
          System nicht bekannt und müssen auf eine Freigabe warten.
        </p>
        <p>
          Der Organisator wird Sie entweder als Teilnehmer oder Gast
          freischalten.
        </p>
      </div>
    </div>
    <hr />
    <div id="gast" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/teilnehmer/gast.png"
          alt="Gast"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Gast</h3>
        <p>
          Als Gast sehen Sie, ob eine Abstimmung in dem Moment stattfindet. Sie
          bekommen die Ergebnisse angezeigt und können auch die vergangenen
          Ergebnisse von vorherigen Wahlen einsehen.
        </p>
      </div>
    </div>
    <hr />
    <div id="stimmrecht" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/teilnehmer/stimmrecht.png"
          alt="Stimmrecht"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Teilnehmer</h3>
        <p>
          Als Teilnehmer haben Sie die gleichen Rechte wie ein Gast. Sie sehen
          neben Ihren Status auch die Anzahl Ihrer Stimmen, die Sie bei Wahlen
          abgeben dprfen. Wenn eine Abstimmung startet, können Sie in der
          erscheinenden Box Ihre Stimme(n) abgeben. Nach Stimmabgabe schließt
          sich die Box und ein Texthinweis mit erfolgreicher Stimmenabgabe
          erscheint.
        </p>
      </div>
    </div>
    <hr />
    <div id="demoabstimmung" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/teilnehmer/demoabstimmung.png"
          alt="Demo-Abstimmung"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Abstimmung</h3>
        <p>
          Als Teilnehmer haben Sie die gleichen Rechte wie ein Gast. Sie sehen
          neben Ihren Status auch die Anzahl Ihrer Stimmen, die Sie bei Wahlen
          abgeben dprfen. Wenn eine Abstimmung startet, können Sie in der
          erscheinenden Box Ihre Stimme(n) abgeben. Nach Stimmabgabe schließt
          sich die Box und ein Texthinweis mit erfolgreicher Stimmenabgabe
          erscheint.
        </p>
        <p>
          <b>Hinweis für Teilnehmer mit mehreren Delegiertenstimmen:</b
          ><br />Sie dürfen nach jeder Stimmenabgabe erneut eine Auswahl treffen
          und "Jetzt abstimmen" drücken. Sie geben nicht mit einer Abgabe alle
          Ihnen zur Verfügung stehenden Stimmen ab. Wenn Sie 3 Stimmen haben und
          3x"Ja" wählen möchten müssen Sie jedes Mal die Auswahl durchführen und
          auf "Jetzt abstimmen" drücken/klicken.
        </p>
      </div>
    </div>
    <hr />
    <h2 id="organisator" class="mb-3">Für Organisatoren</h2>
    <div id="dashboard" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/dashboard.png"
          alt="Dashboard"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Dashboard</h3>
        <p>
          Übersicht aller bevorstehenden Events
        </p>
      </div>
    </div>
    <hr />
    <div id="uebersicht" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/uebersicht.png"
          alt="Event-Übersicht"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Event-Übersicht</h3>
        <p>
          Hier sehen Sie die bevorstehende und vergangenen Events. Zusätzlich
          können Sie Events erstellen mit den Button "Neues Event erstellen".
        </p>
        <p>
          In der Aktionsspalte der erstellten Events können Sie das vorhandene
          Event editieren, den Einladungslink kopieren, in die Detailansicht des
          Events gehen und das Event deaktivieren.
        </p>
      </div>
    </div>
    <hr />
    <div id="eventerstellen" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/eventerstellen.png"
          alt="Event erstellen"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Event erstellen und bearbeiten</h3>
        <p>Folgende Felder werden benötigt:</p>
        <ol>
          <li>
            <b>Titel:</b><br />Beispiel: Jahreshauptversammlung 2025 des
            Musterchors aus Musterstadt
          </li>
          <li>
            <b>Slug:</b><br />Das Slug ist das Pfadsegment für die URL. Das Slug
            muss im System einmalig sein. Falls ein Event nicht erstellt werden
            kann liegt es zu 99% an einem Slug, der schon verwendet wird. Hier
            ist also darauf zu achten, einen kurze, aber prägnante Bezeichnung
            zu verwenden.<br /><br />Beispiel:
            musterchor-musterstadt-jhv-2025<br /><br />Die Eingabe wird
            automatisch umformatiert in Kleinbuchstaben. Sonderzeichen werden
            entfernt und Leerezeilen mit "-" ersetzt.
          </li>
          <li>
            <b>Beschreibung:</b><br />Kurzer Beschreibungstext Ihrer
            Veranstaltung.
          </li>
          <li>
            <b>Start-Datum:</b><br />Zeitpunkt der Durchführung Ihrer
            Veranstaltung.
          </li>
          <li>
            <b>Lobby:</b><br />Falls der Warteraum deaktiviert ist können sich
            die Teilnehmer noch nicht aktivieren. Aktuell muss die Lobby per
            Hand aktiviert oder deaktiviert werden. Es existiert also noch kein
            Automatismus in Bezug zum Start-Zeitpunkt
          </li>
          <li>
            <b>Aktiv:</b><br />Aktiviert das gesamte Event. Wenn ein Event nicht
            mehr aktiv ist können sich keine Teilnehmer oder Gäste unter der
            Event-URL einloggen. Aktuell wird kein Hinweis gegeben, dass das
            Event deaktiviert wurde. Es wird kommentarlos auf die Startseite der
            Plattform umgeleitet.
          </li>
        </ol>
      </div>
    </div>
    <hr />
    <div id="event-teilnehmer" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/event-teilnehmer.png"
          alt="Event Teilnehmer"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Event Details</h3>
        <p>
          Nach Klick auf die Event Details erscheint die Übersicht der Nutzer
        </p>
        <p>
          Im oberen Bereich sehen Sie zusammengefasst Nutzerinformationen.
        </p>
        <p>
          Es besteht die Möglichkeit, Nutzer zu bearbeiten. Sie können die Rolle
          (Teilnehmer/Gast) eines Nutzer mit einem Klick auf den Button "Setzen
          auf" ändern. Wenn man einen Teilnehmer auf Gast umschaltet wird
          automatisch das Stimmrecht entzogen. Bei der nächsten Wahl kann der
          geänderte Nutzer nicht teilnehmern, sieht jedoch wie jeder andere Gast
          auch die Ergebnisse. Man kann auch einen Gast zu einem Teilnehmer
          umwandeln. Der geänderte Teilnehmer erhält Stimmrecht mit einer
          Stimme. Falls der Teilnehmer mehrere Stimmen vertritt muss der Nutzer
          im Detail geändert werden.
        </p>
      </div>
    </div>
    <hr />
    <div id="teilnehmer-editieren" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/teilnehmer-editieren.png"
          alt="Teilnehmer editieren"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Nutzer editieren</h3>
        <p>
          Nach Klick auf den Stift bei einem Nutzer kann man die
          Benutzerinformationen bearbeiten.
        </p>
        <p>
          Man darf jedoch nicht das Passwort eines Nutzers zurücksetzt. Das
          obliegt einzig dem Benutzer selbst.
        </p>
      </div>
    </div>
    <hr />
    <div id="event-warteraum" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/event-warteraum.png"
          alt="Teilnehmer warteraum"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Warteraum</h3>
        <p>
          Alle dem System unbekannten Benutzer landen im Warteraum (falls die
          Lobby aktiviert ist).
        </p>
        <p>
          Die Benutzer können als Teilnehmer oder als Gast freigeschaltet
          werden.
        </p>
        <p><b>Aktuell ist der "Blockieren"-Button noch ohne Funktion.</b></p>
      </div>
    </div>
    <hr />
    <div id="event-abstimmung" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/abstimmung-erstellen.png"
          alt="Abstimmung erstellen"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Abstimmung erstellen und starten</h3>
        <div class="alert alert-primary">
          <div class="row">
            <div class="col-2 text-center">
              <i class="bi bi-exclamation-circle display-4"></i>
            </div>
            <div class="col d-flex align-items-center">
              <p class="mb-0">
                <b>Achtung</b>: Nur Teilnehmer, die zum Zeitpunkt des Startens
                im System eingeloggt sind und als "Online" im System markiert
                sind dürfen abstimmen
              </p>
            </div>
          </div>
        </div>
        <p>
          Es kann ein Titel einer Abstimmung definiert werden und aus einer
          Vorauswahl von Antwortmöglichkeiten ausgewählt werden.
        </p>
        <p>
          Falls Sie Personen wählen möchten sonstige individuelle
          Antwortoptionen vorgeben möchten können Sie "individuelle
          Antwortoption" auswählen. Es erscheint ein Freitextfeld, wo jede Zeile
          eine Antwortoption darstellt. Im unteren Bereich können Sie
          definieren, ob Teilnehmer mehr als eine Antwortoption auswählen
          dürfen.
        </p>
        <p>
          Als letztes ist die Einstellung der offenen oder geheimen Wahl zu
          treffen.
        </p>
        <p>
          Sie können die Wahlen mit den eingebenen Optionen abspeichern und zu
          einem späteren Zeitpunkt starten oder auch direkt starten.
        </p>
        <p class="alert alert-secondary">
          Bei Problemen während der Wahl prüfen Sie bitte die Seite
          <a href="/haeufige-fragen#organisator">Häufige Fragen</a>
        </p>
      </div>
    </div>
    <hr />
    <div id="event-abstimmung-beenden" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/abstimmung-beenden.png"
          alt="Abstimmung beenden"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Abstimmung beenden</h3>
        <p>
          Nach dem Starten einer Abstimmung sehen Sie die Anzahl der abgegebenen
          Stimmen und die Anzahl der Personen, die gewählt haben und wie viel
          Stimmen/Personen insgesamt möglich sind.
        </p>
        <p>
          Falls ein Teilnehmer verhindert ist, die Stimme abzugeben bzw. Sie
          nach einer längeren Wartezeit keine Veränderung wahrnehmen können Sie
          die aktuell stattfindende Abstimmung auch manuell beenden.
        </p>
      </div>
    </div>
    <hr />
    <div id="event-ergebnisse" class="media">
      <span class="btn pop">
        <img
          src="../../../assets/images/organisator/ergebnisliste.png"
          alt="Ergebnisliste"
          class="mr-3 click-enlarge img-thumbnail"
          width="300"
        />
      </span>
      <div class="media-body">
        <h3>Ergebnisliste</h3>
        <p>
          Hier sehen Sie alle vergangenen Abstimmungen und deren Ergebnisse. Mit
          der Browserseitigen Druckfunktion können Sie die Ergebnisse auch auf
          Ihrem PC abspeichern.
        </p>
      </div>
    </div>
    <span class="alert alert-info text-center h4 w-100 mt-3 d-inline-block">
      Diese Seite befindet sich noch im Aufbau und wird laufend aktualisiert
    </span>
    <app-footer />
    <div
      class="modal fade"
      id="imagemodal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="popLoginLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span
              ><span class="sr-only">Schließen</span>
            </button>
            <h4 class="modal-title" id="popLoginLabel">
              Vergrößerung
            </h4>
          </div>
          <div class="modal-body text-center">
            <img src="" alt="" id="imagepreview" class="img img-fluid" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import AppFooter from '@/frame/components/Footer'
import $ from 'jquery'

export default {
  components: {
    AppFooter
  },
  created () {
    document.title = 'Anleitung - digitalwahl.org'
  },
  mounted () {
    $('.pop').on('click', function () {
      $('#imagepreview').attr(
        'src',
        $(this)
          .find('.img-thumbnail')
          .attr('src')
      )
      $('#imagemodal').modal('show')
    })
  }
}
</script>
