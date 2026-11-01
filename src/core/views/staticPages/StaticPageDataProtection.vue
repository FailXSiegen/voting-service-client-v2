<template>
  <CorePageLayout meta-title="Datenschutz">
    <div class="dataprotection">
      <h1>Datenschutzerklärung</h1>
      <hr />
      <p>
        digitalwahl.org erfüllt den Anspruch auf eine sichere, einfache und verlässliche digitale
        Wahl. Bei einer Wahl müssen je nach Wahlprozess personenbezogene und vertrauliche Daten
        verarbeitet werden. Wir stellen sicher, dass in allen Verarbeitungsprozessen hohe Standards
        für Sie und Ihre Daten eingehalten werden.
      </p>

      <p>
        Unter
        <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a> können Sie gerne eine Anfrage
        stellen und ausführliche Informationen zu Art, Wege und Speicherdauer der zu verarbeitenden
        Daten erhalten.
      </p>

      <p>&nbsp;</p>
      <hr />
      <h2>zu verarbeitende Daten</h2>

      <p>
        Technisch wird jeder Zugriff systematisch automatisiert und anonymisiert erfasst. Folgende
        Informationen werden erfasst:
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
            <i class="bi-question-circle bi-2xl" /> </a
          >: automatischer Server-Protokoll Eintrag
        </li>
        <li>Zeitpunkt: Datum, Uhrzeit</li>
        <li>Systeminformationen: Betriebssystem, Browser, Version</li>
      </ul>

      <p>
        Diese Daten sind nicht bestimmten Personen zuordenbar. Eine Zusammenführung dieser Daten mit
        anderen Datenquellen wird nicht vorgenommen. Wir behalten uns vor, diese Daten nachträglich
        zu prüfen, wenn uns konkrete Anhaltspunkte für eine rechtswidrige Nutzung bekannt werden.
        Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse der Systemsicherheit).
      </p>
      <p>
        Das Online-Abstimmungssystem verarbeitet davon unabhängig in einer Datenbank folgende
        personenbezogene Daten pro Wahlveranstaltungs-Teilnahme:
      </p>
      <ul>
        <li>
          Selbst angegebener Name, Benutzername (je nach Veranstalter auch eine E-Mail-Adresse oder
          Mitgliedsnummer) und das als Hash gespeicherte Passwort
        </li>
        <li>Abstimmungsteilnahme</li>
        <li>Beim tokenbasierten Zugang: E-Mail-Adresse und Zugangsschlüssel (Token)</li>
        <li>Zugeteilte Stimmen sowie ein Protokoll von Stimmübertragungen und Stimmanpassungen</li>
      </ul>
      <p>
        Organisator*innen haben nach dem Veranstaltungsdatum 180 Tage Zugriff auf die Daten der
        Veranstaltung und die aufgeführten Informationen im Abstimmungssystem. Etwa 3 Tage nach
        einer Hinweis-E-Mail, also rund 183 Tage nach dem Veranstaltungsdatum, werden die
        Informationen unwiderruflich automatisch gelöscht. Die Pflicht zur Nachhaltung der
        Informationen (Wahlergebnisse, Teilnehmer) obliegt dem/der Organisator*in
      </p>
      <p>
        Die benutzerbezogenen Daten werden in einer Datenbank gespeichert. Jeder Teilnehmer einer
        Veranstaltung ist ein individueller Eintrag. Ein Teilnehmerdatensatz ist immer einmalig pro
        Veranstaltung. Es gibt keine Verknüpfung, wenn ein Nutzer mit den gleichen Zugangsdaten bei
        einem anderen Event teilnimmt. Hier wird ein neuer Nutzerdatensatz generiert und die 180
        Tage Löschfrist gilt pro Veranstaltung.
      </p>
      <p>
        Bei einer Veranstaltung werden Abstimmungs-Datensätze erstellt. Wenn ein
        Abstimmungsdatensatz als "offene Abstimmung" definiert wird, werden in der Tabelle
        "Abstimmungergebnis" die Antwort und der Benutzer gespeichert. Zusätzlich wird der Benutzer
        in einer Tabelle "Abstimmungsteilnehmer" gespeichert zur Sicherstellung, dass der Nutzer
        nicht mehrfach abgestimmt hat. Bei einer "geheimen Abstimmung" werden in der
        "Abstimmungsergebnis"-Tabelle nur die Antworten ohne Benutzer gespeichert. Der Benutzer wird
        in der "Abstimmungsteilnehmer" erfasst.
      </p>
      <p>
        Beim tokenbasierten Zugang wird die vom Organisator eingetragene E-Mail-Adresse für den
        Versand des Aktivierungslinks verwendet und bleibt beim Teilnehmerdatensatz gespeichert, bis
        die Veranstaltung gelöscht wird. Der Zugangsschlüssel ist diesem Datensatz zugeordnet. Der
        Zugang ist daher nicht anonym. Bei geheimen Abstimmungen werden die Antworten unabhängig
        davon ohne Benutzer gespeichert.
      </p>
      <p>
        Als Anmeldeprozess zwischen Benutzer und Server werden Tokens verwendet. Die Tokens dienen
        der verschlüsselten Kommunikation zwischen Endgerät und Server.
      </p>
      <p>
        Die Hauptkommunikation zwischen Endgerät und Server findet mittels Websockets statt. Die
        Kommunikation über Websocket wird nicht gespeichert. Es wird keine Protokoll-Datei der
        Websockets erstellt.
      </p>
      <p>
        Zur potentiellen Fehleranalyse werden serverseitig ausgeführte Datenbankverarbeitungen
        (SQL-Queries) protokolliert sowie auftretende Fehlermeldungen der Server-Anwendung. Die
        Protokoll-Dateien können Nutzerinformationen enthalten. Gespeicherte und archivierte
        Protokoll-Dateien werden 14 Tage lang gespeichert.
      </p>
      <p>
        Rechtsgrundlage für unsere Verarbeitung sind Art. 6 Abs. 1 lit. a und c DSGVO (Einwilligung
        der Betroffenen, rechtliche Verpflichtung).
      </p>
      <p>&nbsp;</p>
      <hr />
      <h2>Auftragsverarbeitung</h2>
      <p>
        digitalwahl.org wird von Felix Herrmann (siehe <a href="/impressum">Impressum</a>) auf einem
        eigenen Server betrieben. Der Server wird gemietet bei
      </p>
      <p>
        Hetzner Online GmbH<br />
        Industriestr. 25<br />
        91710 Gunzenhausen
      </p>
      <p>Der Serverstandort ist in Falkenstein/Vogtland, Deutschland.</p>
      <p>&nbsp;</p>
      <hr />
      <h2>Weitergabe personenbezogener Daten an Dritte</h2>
      <p>digitalwahl.org bindet folgende externe Dienste ein:</p>
      <ul>
        <li>
          Zoom: Die Anwendung lädt beim Aufruf eine technische Bibliothek von source.zoom.us. Dabei
          wird Ihre IP-Adresse an Zoom übermittelt. Nutzt ein Organisator eine Zoom-Konferenz,
          gelten beim Beitritt zusätzlich die Bedingungen von Zoom.
        </li>
        <li>
          Jitsi: Nutzt ein Organisator eine Jitsi-Konferenz, wird beim Beitritt eine Verbindung zu
          dem von ihm gewählten Jitsi-Server hergestellt.
        </li>
        <li>
          mosparo: Die Registrierung von Organisatoren wird, sofern aktiviert, mit dem selbst
          betriebenen Spam-Schutz mosparo geprüft (captcha.failx.de). Dabei werden die Eingaben des
          Registrierungsformulars dorthin übermittelt, nicht aber das Passwort. Es werden keine
          Daten an Google übertragen.
        </li>
      </ul>
      <p>
        Daten, die beim Zugriff auf digitalwahl.org protokolliert werden, werden nur an Dritte
        übermittelt, soweit wir gesetzlich oder durch Gerichtsentscheidung dazu verpflichtet sind:
        im Falle von Angriffen auf die Internetinfrastruktur zur Rechts- oder Strafverfolgung. Eine
        Weitergabe zu anderen Zwecken erfolgt nicht.
      </p>

      <p>&nbsp;</p>
      <hr />
      <h2>Verwendung von Cookies</h2>

      <p>Systeme mit Login-Funktionalität erfordern den Einsatz von Cookies.</p>
      <p>
        Cookies im Zusammenhang mit dieser Website werden ausschließlich durch den Server erstellt
        und verarbeitet.
      </p>
      <p>
        Die meisten Browser sind so eingestellt, dass sie Cookies automatisch akzeptieren. Das
        Speichern von Cookies kann jedoch deaktiviert oder der Browser so eingestellt werden, dass
        Cookies nur für die Dauer der jeweiligen Verbindung zum Internet gespeichert werden.
      </p>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
</script>
