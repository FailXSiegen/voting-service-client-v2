<template>
  <CorePageLayout meta-title="Anleitung">
    <div class="manual">
      <div class="alert alert-danger">
        <div class="row align-items-center">
          <div class="col-2 text-center">
            <i class="bi bi-exclamation-circle bi--6xl" />
          </div>
          <div class="col text-center">
            <p class="display-4 mb-3">HINWEIS</p>
            <p>Aufgrund einer technischen Aktualisierung hat sich die Link/URL Struktur von Veranstaltungen geändert!</p>
            <p>digitalwahl.org/<b>event/</b>meine-veranstaltung</p>
            <p class="mb-0">Bitte aktualisieren Sie vorhandene Anleitungen und Vorlagen.</p>
          </div>
        </div>
      </div>
      <h1>Anleitungen</h1>

      <ul class="list-unstyled">
        <li class="mb-3">
          <a href="#teilnehmer" class="h3">Für Teilnehmer</a>
          <ol class="mt-3">
            <li><a href="#loginmaske">An einer Veranstaltung teilnehmen</a></li>
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
            <li><a href="#uebersicht">Meine Veranstaltungen</a></li>
            <li><a href="#eventerstellen">Neue Veranstaltung erstellen</a></li>
            <li><a href="#event-teilnehmer">Veranstaltungs-Details</a></li>
            <li>
              <a href="#teilnehmer-erstellen">Teilnehmer erstellen</a>
            </li>
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
            <li><a href="#zoom-integration">Zoom Integration</a></li>
          </ol>
        </li>
      </ul>
      <hr />
      <div class="bg-secondary text-white p-3 mb-3 rounded">
        <h2 id="teilnehmer">Für Teilnehmer</h2>
      </div>
      <div id="loginmaske" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/teilnehmer/loginmaske.png"
            alt="loginmaske"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>An einer Veranstaltung teilnehmen</h3>
          <p>
            Sie können über einen vom Organisator bereitgestellten Link an dem
            Event teilnehmen.
          </p>
          <p>Für eine Anmeldung sind folgende Informationen erforderlich:</p>
          <ol>
            <li>
              <b>Benutzername, E-Mail Adresse oder Mitgliedsnummer:</b><br />Je
              nach Verfahren wird der Organisator eine vorherige Anmeldung
              durchgeführt haben. Verwenden Sie hier die vom Organisator
              vorgegebene Möglichkeit.
            </li>
            <li>
              <b>Passwort:</b><br />Geben Sie ein eigenes Kennwort ein, um sich
              nach der Veranstaltung erneut anmelden zu können. Das Passwort
              dient auch zur Wiederanmeldung, falls Sie während der
              Veranstaltung das Endgerät wechseln oder sonstige technische
              Schwierigkeiten haben und sich neu anmelden müssen.
            </li>
            <li>
              <b>Anzeige-Name:</b><br />
              Der Name wird bei der Auswertung der Wahlen angezeigt. Hier sollte
              eine Eindeutigkeit geschaffen werden, also nicht nur Ihr Name,
              sondern am besten auch die Information, für welchen Verein/Verband
              Sie teilnehmen und Ihre Stimme abgeben.
            </li>
          </ol>
          <div class="alert alert-info">
            <div class="row">
              <div class="col-2 text-center">
                <i class="bi bi-exclamation-circle bi--6xl" />
              </div>
              <div class="col d-flex align-items-center">
                <p class="mb-0">
                  Der Organisator hat die Möglichkeit,
                  <b>personalisierte</b> Links zu versenden. Falls also Felder
                  nach Aufrufen der Seite schon vorausgefüllt sind tagen Sie nur
                  noch fehlende Informationen ein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div id="warteraum" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/teilnehmer/warteraum.png"
            alt="Warteraum"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Warteraum</h3>
          <p>
            Falls der Organisator keine Teilnehmer im Vorfeld der Veranstaltung
            hinterlegt hat, Sie andere Anmelde-Information verwenden oder
            einfach einen Rechtschreibfehler in Ihren Anmeldeinformationen haben
            sind Sie dem System nicht bekannt und müssen auf eine Freigabe
            warten.
          </p>
          <p>
            Der Organisator wird Sie entweder als Teilnehmer oder Gast
            freischalten.
          </p>
        </div>
      </div>
      <hr />
      <div id="gast" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/teilnehmer/gast.png"
            alt="Gast"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Gast</h3>
          <p>
            Als Gast sehen Sie, ob eine Abstimmung in dem Moment stattfindet.
            Sie bekommen die Ergebnisse angezeigt und können auch die
            vergangenen Ergebnisse von vorherigen Wahlen einsehen.
          </p>
        </div>
      </div>
      <hr />
      <div id="stimmrecht" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/teilnehmer/stimmrecht.png"
            alt="Stimmrecht"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
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
      <div id="demoabstimmung" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/teilnehmer/demoabstimmung.png"
            alt="Demo-Abstimmung"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
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
            ><br />Sie dürfen bei der ersten Stimmenabgabe auswählen, ob Sie
            alle Ihre Stimmen auf einmal mit der ausgewählten Antwort
            abgeben.<br /><br />
            Die Organisatoren haben die Möglichkeit, die Mehrfachstimmenabgabe
            zu erzwingen, wenn es die Satzung/Ordnung der Mitgliederversammlung
            vorsieht.
          </p>
        </div>
      </div>
      <hr />
      <div class="bg-secondary text-white p-3 mb-3 rounded">
        <h2 id="organisator">Für Organisatoren</h2>
      </div>
      <div id="dashboard" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/dashboard.png"
            alt="Dashboard"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Dashboard</h3>
          <p>
            Übersicht der aktuellsten Entwicklungen sowie geplanter Funktionen.
          </p>
        </div>
      </div>
      <hr />
      <div id="uebersicht" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/uebersicht.png"
            alt="Event-Übersicht"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Veranstaltungsübersicht</h3>
          <p>
            Hier sehen Sie die bevorstehende und vergangenen Veranstaltungen.
            Zusätzlich können Sie Veranstaltungen erstellen mit den Button
            "Neues Veranstaltung erstellen".
          </p>
          <p>
            In der Aktionsspalte der erstellten Veranstaltungen können Sie die
            vorhandene Veranstaltung editieren, den Einladungslink kopieren, in
            die Detailansicht der Veranstaltung gehen und die Veranstaltung
            löschen. Das Löschen ist nur möglich, wenn die Veranstaltung vorher
            auf "Inaktiv" geschaltet wurde in der Bearbeitungsansicht.
          </p>
          <div class="alert alert-danger">
            <div class="row">
              <div class="col-2 text-center">
                <i class="bi bi-exclamation-circle bi--6xl" />
              </div>
              <div class="col d-flex align-items-center">
                <p class="mb-0">
                  <b
                    >Die Veranstaltung und alle damit verbundenen Informationen
                    werden automatisch nach 180 Tagen des geplanten Datums
                    gelöscht.<br /><br />Als Organisator erhalten Sie 3 Tage vor
                    dem Löschen eine Hinweis-E-Mail der bevorstehenden
                    Löschung.</b
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div id="eventerstellen" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/eventerstellen.png"
            alt="Event erstellen"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Veranstaltungen erstellen und bearbeiten</h3>
          <p>Folgende Felder werden benötigt:</p>
          <ol>
            <li>
              <b>Titel:</b><br />Beispiel: Jahreshauptversammlung 2025 des
              Musterchors aus Musterstadt
            </li>
            <li>
              <b>Slug:</b><br />Das Slug ist das Pfadsegment für die URL. Das
              Slug muss im System einmalig sein. Falls eine Veranstaltungen
              nicht erstellt werden kann liegt es zu 99% an einem Slug, der
              schon verwendet wird. Hier ist also darauf zu achten, einen kurze,
              aber prägnante Bezeichnung zu verwenden.<br /><br />Beispiel:
              musterchor-musterstadt-jhv-2025<br /><br />Die Eingabe wird
              automatisch umformatiert in Kleinbuchstaben. Sonderzeichen werden
              entfernt und Leerezeilen mit "-" ersetzt.
            </li>
            <li>
              <b>Beschreibung:</b><br />Kurzer Beschreibungstext Ihrer
              Veranstaltung.
            </li>
            <li>
              <b>Startdatum:</b><br />Zeitpunkt der Durchführung Ihrer
              Veranstaltung.
            </li>
            <li>
              <b>Lobby aktivieren:</b><br />Personen können, falls dem System
              schon bekannt, sich im Vorfeld einloggen.<br />Alle unbekannten
              Personen werden als Nutzer erstellt und in eine Warteraum-Position
              gespeichert. Der Organisator muss den Nutzer als Teilnehmer oder
              Gast freischalten (siehe
              <a href="#event-warteraum">Warteraum</a>).<br />
              Der Warteraum lässt sich auch als vorzeitige
              Authentifizierungslogik nutzen: Senden Sie als Organisator den
              Link zur Veranstaltung frühzeitig zu mit der Bitte, sich als
              Nutzer einzutragen. Als Organisator können Sie alle Teilnehmer an
              einem Tag vorher entsprechend der Delegationsart freischalten.
            </li>
            <li>
              <b>Veranstaltung aktiv schalten?:</b><br />Solange die
              Veranstaltung als Aktiv markiert ist, können Teilnehmer und Gäste
              sich nach der Veranstaltung mit ihren Zugangsdaten erneut
              anmelden.<br />

              Erst, wenn Sie den Haken entfernen und damit die Veranstaltung als
              Inaktiv schalten, dürfen Sie die Veranstaltung manuell löschen.
            </li>
            <li>
              <b>Asynchrone Wahl:</b><br />
              Als Organisator müssen Sie neben dem Start- auch ein Enddatum
              angeben. Alle freigeschalteten Teilnehmer mit Stimmrecht dürfen ab
              dem Startdatum alle im Vorfeld hinterlegten Abstimmungen
              bearbeiten. Sobald das Enddatum überschritten ist, werden
              automatisch nur die Ergebnisse ausgegeben und es kann nicht weiter
              abgestimmt werden.<br /><br />
              <div class="alert alert-danger">
                Als Organisator dürfen Sie auch <u>keine</u> neuen Abstimmungen
                ab dem Startdatum <br />erstellen oder die vorhandenen
                Abstimmungen editieren.
              </div>
            </li>
            <li>
              <b>Videokonferenz-System:</b><br />
              Hier können Sie auswählen, welche Video-Konferenzsoftware
              eingebettet verwendet werden soll. Aktuell wird nur Zoom
              unterstützt.<br />
              Siehe <a href="#zoom-integration">Zoom-Integration</a>
            </li>
            <li>
              <b>Mehrfachstimmenabgabe:</b><br />
              Als Organisator bestimmen Sie, ob Delegierte mit mehreren Stimmen
              alternierend abstimmen dürfen oder alle Stimmen auf einmal abgeben
              müssen.
            </li>
          </ol>
        </div>
      </div>
      <hr />
      <div id="event-teilnehmer" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/event-teilnehmer.png"
            alt="Event Teilnehmer"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Veranstaltungs-Details<br />Nutzer anlegen</h3>
          <p>
            Nach Klick auf die Veranstaltungens-Details erscheint die Übersicht
            der Nutzer
          </p>
          <p>
            Im oberen Bereich sehen Sie zusammengefasst Nutzerinformationen.
          </p>
          <p>
            Es besteht die Möglichkeit, Nutzer zu bearbeiten. Sie können die
            Rolle (Teilnehmer/Gast) eines Nutzer mit einem Klick auf den Button
            "Setzen auf" ändern. Wenn man einen Teilnehmer auf Gast umschaltet
            wird automatisch das Stimmrecht entzogen. Bei der nächsten Wahl kann
            der geänderte Nutzer nicht teilnehmern, sieht jedoch wie jeder
            andere Gast auch die Ergebnisse. Man kann auch einen Gast zu einem
            Teilnehmer umwandeln. Der geänderte Teilnehmer erhält Stimmrecht mit
            einer Stimme. Falls der Teilnehmer mehrere Stimmen vertritt muss der
            Nutzer im Detail geändert werden.
          </p>
        </div>
      </div>
      <div class="alert alert-primary">
        <div class="row">
          <div class="col-1 text-center d-flex align-items-center">
            <i class="bi bi-exclamation-circle bi--6xl" />
          </div>
          <div class="col d-flex flex-column">
            <p>
              <b>Tipp</b>:<br />Um den Nutzern einen komfortablen Einstieg zu
              ermöglichen kann man den Link zum Versenden individualisieren.
              Nutzen Sie hierzu die Serienmail-Funktion von Google oder
              Microsoft mit einer Tabelle aller Empfänger.
            </p>
            <ul>
              <li>Parameter username - Füllt das Feld "Benutzername" aus</li>
              <li>Parameter publicname - Füllt das Feld "Anzeige-Name" aus</li>
            </ul>
            <code class="py-3 align-self-center">
              digitalwahl.org/event/meine-veranstaltung?username=0123456789&publicname=Felix%20Herrmann
            </code>
            <p>
              Die Links können in eine, Tabellenverarbeitungsprogramm wie
              Microsoft Excel oder Google Sheets automatisiert mit den
              Informationen erweitert werden. Diese Automatisierung lässt sicht
              auch auf verkürzte Links (tinyUrl) anwenden und auch auf die
              Generierung von QR Codes in einem Serienbrief zur Personalisierung
              einer Tagungsmappe.
            </p>
          </div>
        </div>
      </div>
      <hr />
      <div id="teilnehmer-erstellen" class="media flex-column flex-lg-row">
        <span class="btn pop flex-column">
          <img
            src="../../../assets/images/organisator/teilnehmer-erstellen-buttons.png"
            alt="Event Teilnehmer erstellen Buttons"
            class="me-3 me-3 click-enlarge img-thumbnail mb-3"
            width="300"
            @click="onClickImage"
          />
          <br />
          <img
            src="../../../assets/images/organisator/teilnehmer-erstellen-default.png"
            alt="Event Teilnehmer"
            class="me-3 me-3 click-enlarge img-thumbnail mb-3"
            width="300"
            @click="onClickImage"
          /><br />
          <img
            src="../../../assets/images/organisator/teilnehmer-erstellen-token.png"
            alt="Event Teilnehmer"
            class="me-3 me-3 click-enlarge img-thumbnail mb-3"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Teilnehmer anlegen</h3>
          <h4>Einfache Anlage</h4>
          <p>
            Die Anlegen einzelner Nutzer ist für kleine Veranstaltungen oder
            nachzügler geeignet. Sie geben als Organisator den Benutzernamen und
            den Anzeige-Namen sowie die mögliche Stimmenanzahl an.
          </p>
          <h4>Mehrere Teilnehmer anlegen</h4>
          <p>
            Das Anlegen mehrerer Nutzer ist für große Veranstaltungen geeignet,
            wenn Sie die Teilnehmer lokal in einer Tabelle vorliegen haben.
            Kopieren Sie hierzu einfach die Spalte mit dem Benutzernamen, den
            die Teilnehmer als Login verwenden sollen. Achten Sie darauf, dass
            die Spalte keine Überschrift enthält und dass es möglichst keine
            doppelten Eintragungen oder Leerzeilen gibt.<br /><br />
            Sie tragen immer alle Teilnehmer gleichzeitig mit einer definierten
            Stimmenanzahl ein. Falls Sie Teilnehmer mit unterschiedlichen
            Stimmenanzahlen haben, müssen Sie diese nacheinander anlegen in
            Gruppen. Hierzu können Sie die Daten mit Ihrem lokalen
            Tabellenverarbeitungsprogramm filtern.
          </p>
          <h4>Token-basierter Login</h4>
          <p>
            Nutzer erhalten per E-Mail einen Anmelde-Link zur Veranstaltung.
            Beim Aufrufen des Links wird der Nutzer aufgefordert, Zugangsdaten
            einzutragen. Diese Zugangsdaten werden nicht mit der E-Mail Adresse
            in Verbindung gespeichert. Beim verwendeten Endgerät des Nutzers
            wird ein Schlüssel (token) gespeichert. Mit diesem Token wird der
            Nutzer automatisch beim Aufrufen des Veranstaltungslinks
            angemeldet.<br /><br />
            <b
              >Der Authentifizierungslink kann nur einmalig auf einem einzelnen
              Endgerät genutzt werden.</b
            ><br /><br />
            Der Veranstaltungslink wird nicht mit der E-Mail versendet. Nach dem
            erfolgreichen Authentifizieren des Endgerätes wird der Nutzer
            automatisch angemeldet und zur Veranstaltungsseite
            weitergeleitet.<br />
            Sobald der Teilnehmer sich abmeldet über den Abmelden Button, wird
            der Token gelöscht und der Nutzer muss sich erneut authentifizieren.
            Dies kann nicht mit der gleichen E-Mail durchgeführt werden.
          </p>
        </div>
      </div>
      <hr />
      <div id="teilnehmer-editieren" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/teilnehmer-editieren.png"
            alt="Teilnehmer editieren"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Nutzer editieren</h3>
          <p>
            Nach Klick auf den Stift bei einem Nutzer kann man die
            Benutzerinformationen bearbeiten.
          </p>
          <p>
            Man darf jedoch nicht das Passwort eines Nutzers zurücksetzt. Sollte
            ein Nutzer sein Passwort vergessen haben, muss er dies dem
            Organisator mitteilen und sich entweder einen neuen Zugangsnamen
            geben lassen oder falls der Warteraum aktiv ist, mit einem
            alternativen neuen Zugang anmelden und vom Organisator
            freigeschaltet werden.
          </p>
        </div>
      </div>
      <hr />
      <div id="event-warteraum" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/event-warteraum.png"
            alt="Teilnehmer warteraum"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Warteraum</h3>
          <p>
            Alle dem System unbekannten Benutzer landen im Warteraum (falls die
            Lobby aktiviert ist).
          </p>
          <p>
            Die Benutzer können als Teilnehmer (Standard mit einer Stimme) oder
            als Gast freigeschaltet werden.
          </p>
        </div>
      </div>
      <hr />
      <div id="event-abstimmung" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/abstimmung-erstellen.png"
            alt="Abstimmung erstellen"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Abstimmung erstellen und starten</h3>
          <div class="alert alert-primary">
            <div class="row">
              <div class="col-1 text-center d-flex align-items-center">
                <i class="bi bi-exclamation-circle bi--3xl" />
              </div>
              <div class="col d-flex align-items-center">
                <p class="mb-0">
                  <b>Achtung</b>:<br />
                  Nur Teilnehmer, die zum Zeitpunkt des Startens im System
                  eingeloggt sind und als "Online" im System markiert sind
                  dürfen abstimmen
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
            Antwortoption" auswählen. Es erscheint ein Freitextfeld, wo jede
            Zeile eine Antwortoption darstellt. Im unteren Bereich können Sie
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
      <div id="event-abstimmung-beenden" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/abstimmung-beenden.png"
            alt="Abstimmung beenden"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Abstimmung beenden</h3>
          <p>
            Nach dem Starten einer Abstimmung sehen Sie die Anzahl der
            abgegebenen Stimmen und die Anzahl der Personen, die gewählt haben
            und wie viel Stimmen/Personen insgesamt möglich sind.
          </p>
          <p>
            Falls ein Teilnehmer verhindert ist, die Stimme abzugeben bzw. Sie
            nach einer längeren Wartezeit keine Veränderung wahrnehmen können
            Sie die aktuell stattfindende Abstimmung auch manuell beenden.
          </p>
        </div>
      </div>
      <hr />
      <div id="event-ergebnisse" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/ergebnisliste.png"
            alt="Ergebnisliste"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Ergebnisliste</h3>
          <p>
            Hier sehen Sie alle vergangenen Abstimmungen und deren Ergebnisse.
            Die Seite verfügt über eine optimierte Druckansicht.<br />
          </p>
          <p>
            <b>Export:</b><br />Es können folgende CSV Dateien heruntergeladen
            werden:
          </p>
          <ul>
            <li>Übersicht</li>
            <li>Ergebnisse</li>
            <li>Ergebnisse mit Details</li>
            <li>Teilnehmer mit abgegebener Stimmenanzahl</li>
          </ul>
        </div>
      </div>
      <hr />
      <div id="zoom-integration" class="media flex-column flex-lg-row">
        <span class="btn pop">
          <img
            src="../../../assets/images/organisator/zoom-anleitung.png"
            alt="Zoom Anleitung"
            class="me-3 me-3 click-enlarge img-thumbnail"
            width="300"
            @click="onClickImage"
          />
        </span>
        <div class="media-body">
          <h3>Zoom Anleitung</h3>
          <p>
            Die Voraussetzung ist ein Zoom Pro Account oder höher. Zoom Lizenz
            auf der
            <a href="https://zoom.us/de/pricing" target="_blank"
              >Zoom-Website</a
            >
            vergleichen und kaufen
          </p>
          <p>
            <a
              href="/download/pdf/anleitung-zoom-integration-v2.pdf"
              class="btn btn-primary"
              target="_blank"
              >Anleitung als PDF herunterladen</a
            >
          </p>
        </div>
      </div>
      <div
        id="imagemodal"
        class="modal fade"
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
              <h4 id="popLoginLabel" class="modal-title d-none d-print-block">
                Vergrößerung
              </h4>
            </div>
            <div class="modal-body text-center">
              <img
                id="imagepreview"
                :src="modalImageSrc"
                alt=""
                class="img img-fluid"
              />
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
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import * as bootstrap from "bootstrap";
import { onMounted, ref } from "vue";

let modal;
const modalImageSrc = ref("");

function onClickImage({ target }) {
  modalImageSrc.value = target?.src;
  modal?.show();
}

onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("imagemodal"), {});
});
</script>
