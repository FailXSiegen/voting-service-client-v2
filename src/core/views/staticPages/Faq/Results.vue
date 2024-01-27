<template>
  <div>
    <h2>Wahlergebnisse und Berichte</h2>
    <div class="accordion">
      <FaqCard
        title="Wie werden die Wahlergebnisse präsentiert?"
        name="results"
        :id="1"
      >
        <p>
          Auf digitalwahl.org werden die Wahlergebnisse auf eine klare und
          übersichtliche Weise präsentiert. Hier sind einige Merkmale der
          Ergebnispräsentation:
        </p>
        <ul>
          <li>
            <strong>Unmittelbare Verfügbarkeit:</strong> Nach Abschluss der Wahl
            sind die Ergebnisse sofort verfügbar und können von den Teilnehmern
            eingesehen werden.
          </li>
          <li>
            <strong>Detaillierte Auswertung:</strong> Die Ergebnisse auch in
            Zahlenform präsentiert, um eine genaue Einsicht in die
            Stimmverteilung zu bieten.
          </li>
          <li>
            <strong>Transparenz:</strong> Die Ergebnisse werden auf eine
            transparente Art und Weise dargestellt, sodass die Teilnehmer die
            Auszählung und die Verteilung der Stimmen klar nachvollziehen
            können.
          </li>
          <li>
            <strong>Datenschutz:</strong> Trotz der Transparenz der Ergebnisse
            wird darauf geachtet, die Anonymität der Wähler zu wahren und
            personenbezogene Daten zu schützen.
          </li>
          <li>
            <strong>Exportfunktion für <u>Organisatoren</u>:</strong> Für
            weitere Analysen oder Archivierungszwecke können die Ergebnisse als
            CSV-Dateien heruntergeladen werden.
          </li>
        </ul>
        <p>
          Diese Art der Ergebnispräsentation trägt dazu bei, dass alle
          Teilnehmer einen klaren und detaillierten Überblick über das
          Wahlergebnis erhalten.
        </p>
      </FaqCard>

      <FaqCard
        title="Bestätigung und Export der Wahlergebnisse"
        name="results"
        :id="2"
      >
        <p>
          Die Gültigkeit der Wahlergebnisse auf digitalwahl.org wird in
          Verbindung mit dem Protokoll der jeweiligen Versammlung oder
          Veranstaltung bestätigt. Sobald das Protokoll veröffentlicht ist und
          keine Einsprüche gegen die Ergebnisse vorliegen, werden diese als
          gültig anerkannt. Dieses Verfahren stellt sicher, dass die Ergebnisse
          offiziell und transparent bestätigt werden.
        </p>
        <p>
          Zusätzlich bietet digitalwahl.org für Organisatoren die Möglichkeit,
          die Wahlergebnisse zu exportieren:
        </p>
        <ul>
          <li>
            <strong>CSV-Export:</strong> Der Organisator der Wahl hat die
            Möglichkeit, die Ergebnisse im CSV-Format zu exportieren. Dieses
            Format ist kompatibel mit Tabellenkalkulationsprogrammen wie Excel
            oder Google Sheets.
          </li>
          <li>
            <strong>Archivierung und Aufbereitung:</strong> Der Export im
            CSV-Format ermöglicht es dem Organisator, die Wahlergebnisse
            effizient zu archivieren und für weitere Analysen oder Berichte
            aufzubereiten.
          </li>
          <li>
            <strong>Einfache Handhabung:</strong> Das CSV-Format ist aufgrund
            seiner Einfachheit und breiten Kompatibilität eine praktische Wahl
            für die Datenspeicherung und -bearbeitung.
          </li>
        </ul>
        <p>
          Durch diese Funktionen gewährleistet digitalwahl.org eine zuverlässige
          und benutzerfreundliche Erfassung und Bestätigung der Wahlergebnisse.
        </p>
      </FaqCard>
    </div>
  </div>
</template>
<script>
import FaqCard from "@/core/components/FaqCard.vue";

export default {
  components: {
    FaqCard,
  },
  mounted() {
    this.$emit("loaded", this.htmlContent);
  },
};
</script>
