<template>
  <div>
    <h2>Feedback und Weiterentwicklung</h2>

    <div class="accordion">
      <FaqCard
        :id="1"
        title="Wie kann Feedback zur Plattform gegeben werden?"
        name="feedback"
      >
        <p>
          Wir freuen uns, wenn Sie Feedback, egal welcher Art, an
          <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a> senden.
        </p>
      </FaqCard>

      <FaqCard
        :id="2"
        title="Werden neue Funktionen basierend auf Nutzerfeedback hinzugefügt?"
        name="feedback"
      >
        <p>
          Wenn Sie spezielle Anforderungen haben, die Funktional eine
          Bereicherung für alle sein können oder auch nur für Ihren speziellen
          Fall gelten, wenden Sie sich gerne an
          <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a>.
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
