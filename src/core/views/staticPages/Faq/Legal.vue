
<template>
  <div>
    <h2>Rechtliche Aspekte</h2>


    <div class="accordion">
      <FaqCard
          title="Erfüllt digitalwahl.org die rechtlichen Anforderungen für Vereinswahlen?"
          name="legal"
          :id="1">
          <p>
              digitalwahl.org ist darauf ausgerichtet, die rechtlichen Anforderungen für Vereinswahlen zu erfüllen, indem es geheime und datenschutzkonforme Abstimmungsmöglichkeiten bietet. Die spezifischen rechtlichen Anforderungen können jedoch je nach Land oder Region variieren. Es ist wichtig, dass Vereinsverantwortliche sich mit den lokalen Gesetzen und Vorschriften vertraut machen und bei Bedarf rechtliche Beratung einholen, um die vollständige Konformität mit den anwendbaren rechtlichen Standards sicherzustellen.
          </p>
        </FaqCard>
        <FaqCard
          title="Wie werden Änderungen in gesetzlichen Bestimmungen berücksichtigt?"
          name="legal"
          :id="2">
          <p>
            Änderungen in gesetzlichen Bestimmungen werden auf digitalwahl.org durch regelmäßige Updates und Anpassungen der Plattform berücksichtigt. Das Entwicklerteam von digitalwahl.org überwacht fortlaufend rechtliche Entwicklungen und passt die Funktionen der Plattform entsprechend an, um sicherzustellen, dass sie den aktuellen gesetzlichen Anforderungen entspricht. Nutzer der Plattform sollten jedoch immer auch selbst auf dem neuesten Stand der für sie relevanten Gesetze bleiben und bei Bedarf rechtliche Beratung einholen, um die Konformität ihrer spezifischen Wahlen mit den jeweils gültigen rechtlichen Rahmenbedingungen sicherzustellen.
          </p>
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
