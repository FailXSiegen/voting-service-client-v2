<template>
  <div>
    <h2>Allgmeine Informationen</h2>
    <div class="accordion">
      <FaqCard
        title="Was ist digitalwahl.org?"
        name="generalInfo"
        :id="1">
        <p>digitalwahl.org ist eine Plattform, die Vereinen und Verbänden eine Lösung zur Durchführung digitaler Wahlen bietet. Der Fokus liegt darauf, den Nutzern eine Möglichkeit zu geben, Wahlen und Abstimmungen online durchzuführen, wobei der Schwerpunkt auf Benutzerfreundlichkeit, Sicherheit und Datenschutz liegt. Die Plattform ermöglicht es, geheime Wahlen durchzuführen, bei denen die Anonymität der Teilnehmer gewahrt bleibt.</p>
      </FaqCard>

      <FaqCard
        title="Für wen ist digitalwahl.org geeignet?"
        name="generalInfo"
        :id="2">
        <p>Digitalwahl.org ist eine Online-Plattform, die speziell für <strong>gemeinnützige Organisationen</strong> und <strong>Vereine</strong> entwickelt wurde. Sie bietet eine effiziente und sichere Lösung für digitale Wahlen und Abstimmungen. Hier sind einige Gruppen, die von dieser Plattform profitieren können:</p>
        <ul>
            <li><strong>Gemeinnützige Vereine:</strong> Sie können die Plattform nutzen, um Vorstandswahlen oder wichtige Beschlüsse effizient und transparent online durchzuführen.</li>
            <li><strong>Bildungseinrichtungen:</strong> Schulen und Universitäten können sie für studentische Wahlen und Abstimmungen einsetzen.</li>
            <li><strong>Berufsverbände:</strong> Für Berufsverbände stellt digitalwahl.org eine Möglichkeit dar, Mitgliederentscheidungen einfach und sicher online zu organisieren.</li>
            <li><strong>Sportvereine:</strong> Sportvereine können die Plattform nutzen, um ihre internen Wahlen und Abstimmungen zu verwalten.</li>
            <li><strong>Öffentliche Einrichtungen:</strong> Sie könnten die Plattform für interne Entscheidungsprozesse nutzen, sofern sie im Rahmen ihrer Richtlinien für Gemeinnützigkeit agieren.</li>
        </ul>
        <p>Digitalwahl.org legt einen besonderen Schwerpunkt auf <strong>Sicherheit, Datenschutz und Benutzerfreundlichkeit</strong>, um sicherzustellen, dass die Wahlen und Abstimmungen vertrauenswürdig, transparent und zugänglich sind.</p>
      </FaqCard>

      <FaqCard
        title="Ist die Nutzung von digitalwahl.org wirklich kostenlos?"
        name="generalInfo"
        :id="3">
        <p>Ja, die Nutzung der Plattform <strong>digitalwahl.org</strong> ist für gemeinnützige Vereine und Verbände <strong>kostenlos</strong>. Dies ermöglicht es gemeinnützigen Organisationen, ihre Wahlen und Abstimmungen effizient und ohne zusätzliche finanzielle Belastung durchzuführen.</p>
      </FaqCard>

    </div>
  </div>
</template>
<script>
import FaqCard from '@/core/components/FaqCard.vue';

export default {
  components: {
    FaqCard
  },
  mounted() {
    this.$emit('loaded', this.htmlContent);
  },
};
</script>
