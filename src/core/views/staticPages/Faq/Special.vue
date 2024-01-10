<template>
  <div>
    <h2>Spezielle Funktionen und Anpassungen</h2>
    <div class="bg-secondary text-white p-3 border-start border-primary">
      <p>
        Ja, digitalwahl.org bietet spezielle Funktionen für verschiedene Arten von Wahlen an.
      </p>
      <p>
        Diese Funktionen sind darauf ausgerichtet, den unterschiedlichen Bedürfnissen und Anforderungen von Vereinswahlen, Verbandsabstimmungen oder
        anderen spezifischen Wahlformaten gerecht zu werden.
      </p>
      <p>
        Dazu gehören beispielsweise Anpassungsmöglichkeiten für Stimmzettel, verschiedene Abstimmungsmodi (wie geheime oder offene Wahlen)
        und spezielle Funktionen zur Verwaltung und Authentifizierung der Teilnehmer.
      </p>
      <p>
        Um die genauen Funktionen und ihre Anwendungsmöglichkeiten zu erfahren,
        ist es ratsam, die Plattform direkt zu erkunden oder den Support von digitalwahl.org zu kontaktieren.
      </p>
    </div>
  </div>
</template>
<script>
export default {
  mounted() {
    this.$emit('loaded', this.htmlContent);
  },
};
</script>
