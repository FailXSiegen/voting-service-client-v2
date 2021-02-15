<template>
  <div class="dataprotection container min-vh-100">
    <h1>Datenschutzerklärung</h1>
    <hr />
    <p>
      digitalwahl.org erfüllt den Anspruch auf eine sichere, einfache und
      verlässliche digitale Wahl. Bei einer Wahl müssen je nach Wahlprozess
      personenbezogene und vertrauliche Daten verarbeitet werden. Wir stellen
      sicher, dass in allen Verarbeitungsprozessen hohe Standards für Sie und
      Ihre Daten eingehalten werden.
    </p>

    <p>
      Unter
      <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a> könnnen Sie
      gerne eine Anfrage stellen und ausführliche Informationen zu Art, Wege und
      Speicherdauer der vzu verarbeitenden Daten erhalten.
    </p>

    <p>&nbsp;</p>
    <hr />
    <h2>zu verarbeitende Daten</h2>

    <p>
      Technisch wird jeder Zugriff systematisch automatisiert und anonymisiert
      erfasst. Folgende Informationen werden erfasst:
    </p>
    <ul>
      <li>
        IP-Adresse
        <a
          href="https://de.wikipedia.org/wiki/IP-Adresse"
          target="_blank"
          rel="nofollow noopener"
          title="Was ist eine IP-Adresse?"
        >
          <i class="bi-question-circle bi-2xl"></i> </a
        >: automatischer Server-Protokoll Eintrag
      </li>
      <li>Zeitpunkt: Datum, Uhrzeit)</li>
      <li>Systeminformationen: Betriebssystem, Browser, Version</li>
    </ul>

    <p>
      Diese Daten sind nicht bestimmten Personen zuordenbar. Eine
      Zusammenführung dieser Daten mit anderen Datenquellen wird nicht
      vorgenommen. Wir behalten uns vor, diese Daten nachträglich zu prüfen,
      wenn uns konkrete Anhaltspunkte für eine rechtswidrige Nutzung bekannt
      werden. Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. f
      DSGVO (berechtigtes Interesse der Systemsicherheit).
    </p>
    <p>
      Das Online-Abstimmungssystem verarbeitet davon unabhängig in einer
      Datenbank folgende personenbezogene Daten pro
      Wahlveranstaltungs-Teilnahme:
    </p>
    <ul>
      <li>
        Selbst angegebener Name, E-Mail-Adresse und das verschlüsselte Passwort
      </li>
      <li>
        Abstimmungsteilnahme
      </li>
    </ul>
    <p>
      Organisator*innen haben nach der Veranstaltung 180 Tage Zugriff auf die
      Daten der Veranstaltung und den aufgeführten Informationen im
      Abstimmungsystem. Danach werden die Informationen unwiderruflich
      automatisch gelöscht. Die Pflicht zur Nachhaltung der Informationen
      (Wahlergebnisse, Teilnehmer) obliegt dem/der Organisator*in
    </p>
    <p>
      Die benutzerbezogenen Daten werden in einer MySQL Datenbank gespeichert.
      Jeder Teilnehmer einer Veranstaltung ist ein individueller Eintrag. Ein
      Teilnehmerdatensatz ist immer einmalig pro Veranstaltung. Es gibt keine
      Verknüpfung, wenn ein Nutzer mit den gleichen Zugangsdaten bei einem
      anderen Event teilnimmt. Hier wird ein neuer Nutzerdatensatz generiert und
      die 180 Tage Löschfrist gilt pro Veranstaltung.
    </p>
    <p>
      Bei einer Veranstaltung werden Abstimmungs-Datensätze erstellt. Wenn ein
      Abstimmungsdatensatz als "offene Abstimmung" definiert wird, werden in der
      Tabelle "Abstimmungergebnis" die Antwort und der Benutzer gespeichert.
      Zusätzlich wird der Benutzer in einer Tabelle "Abstimmungsteilnehmer"
      gespeichert zur Sicherstellung, dass der Nutzer nicht mehrfach abgestimmt
      hat. Bei einer "geheimen Abstimmung" werden in der
      "Abstimmungsergebnis"-Tabelle nur die Antworten ohne Benutzer gespeichert.
      Der Benutzer wird in der "Abstimmungsteilnehmer" erfasst.
    </p>
    <p>
      Als Anmeldeprozess zwischen Benutzer und Server werden Tokens verwendet.
      Die Tokens dienen der verschlüsselten Kommunikation zwischen Endgerät und
      Server.
    </p>
    <p>
      Die Hauptkommunikation zwischen Endgerät und Server findet mittels
      Websockets statt. Die Kommunikation über Websocket wird nicht gespeichert.
      Es wird keine Protokoll-Datei der Websockets erstellt.
    </p>
    <p>
      Zur potentiellen Fehleranalyse werden serverseitig ausgeführte
      Datenbankverarbeitungen (SQL-Queries) protokolliert sowie auftretebde
      Fehlermeldungen der Server-Anwendung. Die Protokoll-Dateien können
      Nutzerinformationen enthalten. Gespeicherte und archivierte
      Protokoll-Dateien werden 14 Tage lang gespeichert.
    </p>
    <p>
      Rechtsgrundlage für unsere Verarbeitung sind Art. 6 Abs. 1 lit. a und c
      DSGVO (Einwilligung der Betroffenen, rechtliche Verpflichtung).
    </p>
    <p>&nbsp;</p>
    <hr />
    <h2>Auftragsverarbeitung</h2>
    <p>
      Das Hosting liegt bei
    </p>
    <p>
      PSV Digital GmbH<br />
      Martinshardt 5<br />
      57074 Siegen<br /><br />
      Tel.: <a href="tel:+492717700160">+49 271 770016 - 0</a><br />
      E-Mail: <a href="mailto:info@psv-neo.de">info@psv-neo.de</a>
    </p>
    <p>Der Serverstandort ist in Frankfurt am Main/Deutschland.</p>
    <p>&nbsp;</p>
    <hr />
    <h2>Weitergabe personenbezogener Daten an Dritte</h2>
    <p>
      digitalwahl.org bindet keine externen Dienste mit ein.
    </p>
    <p>
      Daten, die beim Zugriff auf digitalwahl.org protokolliert werden, werden
      nur an Dritte übermittelt, soweit wir gesetzlich oder durch
      Gerichtsentscheidung dazu verpflichtet sind: im Falle von Angriffen auf
      die Internetinfrastruktur zur Rechts- oder Strafverfolgung. Eine
      Weitergabe zu anderen Zwecken erfolgt nicht.
    </p>

    <p>&nbsp;</p>
    <hr />
    <h2>Verwendung von Cookies</h2>

    <p>
      Systeme mit Login-Funktionalität erfordern den Einsatz von Cookies.
    </p>
    <p>
      Cookies im Zusammenhang mit dieser Website werden ausschließlich durch den
      Server erstellt und verarbeitet.
    </p>
    <p>
      Die meisten Browser sind so eingestellt, dass sie Cookies automatisch
      akzeptieren. Das Speichern von Cookies kann jedoch deaktiviert oder der
      Browser so eingestellt werden, dass Cookies nur für die Dauer der
      jeweiligen Verbindung zum Internet gespeichert werden.
    </p>
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
    document.title = 'Datenschutz - digitalwahl.org'
  }
}
</script>
