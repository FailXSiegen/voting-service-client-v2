<template>
  <div>
    <h2>Support und Hilfe</h2>
    <div class="accordion">
      <FaqCard
        :id="1"
        title="Wie können Vereinsverantwortliche technische Unterstützung erhalten?"
        name="support"
      >
        <p>
          Vereinsverantwortliche können auf digitalwahl.org auf verschiedene
          Weise technische Unterstützung erhalten:
        </p>
        <ul>
          <li>
            <strong>Support-Team:</strong> Ein dediziertes Kundensupport-Team
            steht zur Verfügung, um bei technischen Fragen oder Problemen zu
            helfen. Dieses Team kann per E-Mail
            <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a>
            erreicht werden.
          </li>
          <li>
            <strong>Anleitungen und Tutorials:</strong> digitalwahl.org stellt
            detaillierte <a href="/anleitung">Anleitungen</a> und Tutorials
            bereit, die Schritt-für-Schritt-Anweisungen zur Nutzung der
            Plattform enthalten.
          </li>
          <li>
            <strong>Technische Dokumentation:</strong> Umfassende technische
            Dokumentation kann für fortgeschrittene Nutzer und IT-Experten
            innerhalb des Vereins zur Verfügung gestellt werden.
          </li>
        </ul>
      </FaqCard>
      <FaqCard :id="2" title="Auf was muss ich alles achten?" name="support">
        <h3>Planung und Vorbereitung digitaler Mitgliederversammlungen</h3>
        <p>
          Die effektive Durchführung digitaler Mitgliederversammlungen erfordert
          eine gründliche Planung und Vorbereitung. Dies umfasst die inhaltliche
          Vorbereitung, die Einbindung aller relevanten Personen, die
          rechtzeitige Einladung zur Veranstaltung inklusive der Bereitstellung
          aller notwendigen Unterlagen sowie die Planung von Wahl- und
          Abstimmungsprozessen.
          <br/><br/>Für weitere Informationen besuchen Sie bitte
          <a
            href="https://remix.medialepfade.org/ein-demokratie-hotspot/digitale-mitgliederversammlungen/"
            target="_blank"
          >diese Seite</a
          >.
        </p>

        <h3>Unterstützungsmaterialien für digitale Mitgliederversammlungen</h3>
        <p>
          Zur Unterstützung werden verschiedene Materialien, Checklisten,
          Anleitungen und Videos bereitgestellt, die auf Erfahrungen von
          Chorverbänden basieren. Diese Ressourcen können erweitert und
          angepasst werden, um spezifischen Bedürfnissen gerecht zu werden.
          <br/><br/>Weitere Details finden Sie unter
          <a
            href="https://remix.medialepfade.org/ein-demokratie-hotspot/digitale-mitgliederversammlungen/"
            target="_blank"
          >diesem Link</a
          >.
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
