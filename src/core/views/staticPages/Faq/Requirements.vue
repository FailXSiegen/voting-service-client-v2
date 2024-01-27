<template>
  <div>
    <h2>Technische Anforderungen</h2>
    <div class="accordion">
      <FaqCard
        title="Welche technischen Voraussetzungen sind nötig, um digitalwahl.org zu nutzen?"
        name="requirement"
        :id="1"
      >
        <p>
          Um digitalwahl.org effektiv nutzen zu können, sind folgende technische
          Voraussetzungen erforderlich:
        </p>
        <ul>
          <li>
            <strong>Internetverbindung:</strong> Eine stabile Internetverbindung
            ist erforderlich, um auf die Plattform zuzugreifen und die Wahlen
            durchzuführen.
          </li>
          <li>
            <strong>Webbrowser:</strong> Ein aktueller Webbrowser (wie Chrome,
            Firefox, Safari oder Edge) wird benötigt, um die Website von
            digitalwahl.org zu öffnen und zu navigieren.
          </li>
          <li>
            <strong>Endgerät:</strong> Die Plattform kann auf verschiedenen
            Endgeräten wie Computern, Laptops, Tablets oder Smartphones genutzt
            werden.
          </li>
          <li>
            <strong>JavaScript:</strong> JavaScript sollte im Webbrowser
            aktiviert sein, da viele Funktionen der Plattform darauf basieren.
          </li>
          <li>
            <strong>Sicherheitseinstellungen:</strong> Eventuell müssen
            Sicherheitseinstellungen im Browser angepasst werden, um den vollen
            Funktionsumfang von digitalwahl.org zu ermöglichen.
          </li>
        </ul>
        <p>
          Diese technischen Anforderungen stellen sicher, dass Benutzer die
          Plattform reibungslos und effizient für ihre Wahlen nutzen können.
        </p>
      </FaqCard>

      <FaqCard
        title="Integration von Video-Konferenzen (aktuell Zoom)"
        name="requirement"
        :id="2"
      >
        <p>
          digitalwahl.org bietet eine nahtlose und benutzerfreundliche
          Erfahrung, indem es eine direkte Integration mit
          Videokonferenz-Systemen (aktuell Zoom) umfasst. Dieser Ansatz ist
          besonders vorteilhaft für ältere Nutzer oder Personen, die weniger
          Erfahrung mit Technologie haben. Hier sind einige Highlights dieser
          Integration:
        </p>
        <ul>
          <li>
            <strong>Alles an einem Ort:</strong> Nutzer müssen nur die Webseite
            von digitalwahl.org besuchen, um sowohl an Wahlen teilzunehmen als
            auch die Video-Konferenz zu betreten. Dies vereinfacht den Prozess
            erheblich, da kein Wechsel zwischen verschiedenen Apps oder Fenstern
            notwendig ist.
          </li>
          <li>
            <strong>Benutzerfreundlichkeit:</strong> Die Integration ist so
            gestaltet, dass sie intuitiv und leicht zu bedienen ist, selbst für
            Personen, die nicht regelmäßig mit digitalen Technologien arbeiten.
          </li>
          <li>
            <strong>Optimiert für Tablets und Smartphones:</strong> Die
            Plattform ist speziell für eine problemlose Nutzung auf Tablets und
            Smartphones optimiert, was ideal für Nutzer ist, die bevorzugt
            mobile Geräte verwenden.
          </li>
        </ul>
        <p>
          Die Kombination aus einfachem Zugang zu digitalen Wahlen und der
          direkten Einbindung von Video-Konferenzen macht digitalwahl.org zu
          einer umfassenden und zugänglichen Plattform für alle Nutzer.
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
