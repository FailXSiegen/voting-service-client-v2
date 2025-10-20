<template>
  <div>
    <h2>Registrierung und Einrichtung</h2>
    <div class="accordion">
      <FaqCard
        :id="1"
        title="Wie können sich Vereine und Verbände auf digitalwahl.org registrieren?"
        name="registration"
      >
        <p>
          Vereine und Verbände können sich auf digitalwahl.org wie folgt
          registrieren:
        </p>
        <ol>
          <li>Zunächst besuchen Sie die Website von digitalwahl.org.</li>
          <li>Auf der Startseite finden Sie einen Registrierungsbutton.</li>
          <li>
            Klicken Sie auf diesen Button oder Link, um zum
            Registrierungsformular zu gelangen.
          </li>
          <li>
            Füllen Sie das Formular mit den erforderlichen Informationen über
            Ihren Verein oder Verband aus.
          </li>
          <li>
            Akzeptieren Sie die Nutzungsbedingungen und Datenschutzrichtlinien.
          </li>
          <li>
            Schließen Sie den Registrierungsprozess ab, indem Sie auf den Button
            zur Bestätigung Ihrer Registrierung klicken.
          </li>
          <li>
            Sie erhalten eine Bestätigungs-E-Mail, um Ihre E-Mail Adresse zu
            bestätigen.
          </li>
          <li>
            Die Administration von digitalwahl.org erhält eine E-Mail und prüft
            Ihre Registrierung.
          </li>
        </ol>
        <p>
          Nach erfolgreicher Registrierung und Aktivierung des Accounts können
          Sie die Funktionen von digitalwahl.org kostenfrei nutzen.
        </p>
      </FaqCard>

      <FaqCard
        :id="2"
        title="Welche Voraussetzungen müssen für die Registrierung erfüllt sein?"
        name="registration"
      >
        <p>
          Für die Registrierung eines Vereins oder Verbands auf digitalwahl.org
          müssen folgende Voraussetzungen erfüllt sein:
        </p>
        <ul>
          <li>
            Offizieller Status als Verein oder Verband: Die Organisation muss
            rechtlich anerkannt und registriert sein.
          </li>
          <li>
            Gültige Kontaktinformationen: Es müssen aktuelle und gültige
            Kontaktinformationen des Vereins oder Verbands bereitgestellt
            werden.
          </li>
          <li>
            Zustimmung zu den Nutzungsbedingungen: Die Nutzungsbedingungen von
            digitalwahl.org müssen akzeptiert werden.
          </li>
          <li>
            Datenschutzkonformität: Die Organisation muss die
            Datenschutzrichtlinien akzeptieren und sicherstellen, dass sie im
            Einklang mit den Datenschutzgesetzen agiert.
          </li>
          <li>
            Bestätigung der Gemeinnützigkeit: Falls Rückfragen zur
            Gemeinnützigkeit bestehen wird im Freischaltungsprozess seitens der
            Administration Kontakt aufgenommen. Nach dem Nachweis wird der
            Registrierungsprozess abgeschlossen.
          </li>
        </ul>
        <p>
          Diese Voraussetzungen stellen sicher, dass die Plattform sicher und im
          Einklang mit rechtlichen Bestimmungen genutzt wird.
        </p>
      </FaqCard>

      <FaqCard
        :id="3"
        title="Wie erstellt man eine Wahl oder Abstimmung?"
        name="registration"
      >
        <p>
          Erfahren Sie hierzu mehr in der <a href="/anleitung">Anleitung</a>
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
  emits: ["loaded"],
  mounted() {
    this.$emit("loaded", this.htmlContent);
  },
};
</script>
