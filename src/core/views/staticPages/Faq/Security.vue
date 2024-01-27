<template>
  <div>
    <h2>Sicherheit und Datenschutz</h2>
    <div class="accordion">
      <FaqCard
        title="Wie wird die Sicherheit der Wahl gewährleistet?"
        name="security"
        :id="1"
      >
        <p>
          Die Sicherheit der Wahl auf digitalwahl.org wird durch mehrere
          Maßnahmen gewährleistet:
        </p>
        <ul>
          <li>
            <strong>SSL-Verschlüsselung:</strong> Die Kommunikation zwischen
            Nutzern und der Plattform wird durch SSL-Verschlüsselung gesichert,
            um den Datentransfer zu schützen.
          </li>
          <li>
            <strong>Anonymität:</strong> Die Anonymität der Wähler wird auf
            Wunsch bzw. nach Vorgabe des Organisators gewahrt, um eine
            unbeeinflusste Stimmabgabe zu ermöglichen.
          </li>
          <li>
            <strong>Server-Sicherheit:</strong> Die Server, auf denen
            digitalwahl.org gehostet wird, sind gegen unbefugten Zugriff und
            Angriffe gesichert.
          </li>
          <li>
            <strong>Regelmäßige Sicherheitsüberprüfungen:</strong> Regelmäßige
            Überprüfungen und Updates sorgen dafür, dass Sicherheitslücken
            schnell erkannt und behoben werden.
          </li>
          <li>
            <strong>Datenschutzkonforme Datenverarbeitung:</strong> Alle
            personenbezogenen Daten werden gemäß den Datenschutzgesetzen
            verarbeitet und gespeichert.
          </li>
        </ul>
        <p>
          Diese Sicherheitsmaßnahmen tragen dazu bei, dass die Wahlen auf
          digitalwahl.org vertrauenswürdig und sicher sind.
        </p>
      </FaqCard>

      <FaqCard
        title="Wie wird der Datenschutz auf digitalwahl.org gehandhabt?"
        name="security"
        :id="2"
      >
        <p>
          Der Datenschutz ist ein wesentlicher Bestandteil der Plattform
          Digitalwahl.org. Folgende Maßnahmen werden zur Sicherstellung des
          Datenschutzes umgesetzt:
        </p>
        <ul>
          <li>
            <strong>Datenschutzkonforme Verarbeitung:</strong> Alle
            personenbezogenen Daten werden gemäß den aktuellen
            Datenschutzgesetzen verarbeitet.
          </li>
          <li>
            <strong>Minimierung der Datenerfassung:</strong> Es werden nur die
            notwendigen Daten erhoben, die für die Durchführung der Wahlen
            erforderlich sind.
          </li>
          <li>
            <strong>Sichere Datenspeicherung:</strong> Gespeicherte Daten werden
            auf sicheren Servern aufbewahrt, die gegen unbefugten Zugriff
            geschützt sind.
          </li>
          <li>
            <strong>Transparenz:</strong> Nutzer werden klar über die Verwendung
            ihrer Daten informiert und haben Zugriff auf ihre gespeicherten
            Informationen.
          </li>
          <li>
            <strong>Recht auf Datenlöschung:</strong> Nutzer können die Löschung
            ihrer Daten beantragen, sofern keine rechtlichen
            Aufbewahrungspflichten entgegenstehen.
          </li>
          <li>
            <strong>Anonymität bei der Wahl:</strong> Die Identität der Wähler
            bleibt während der Abstimmung anonym, um die Privatsphäre zu
            schützen.
          </li>
        </ul>
        <p>
          Diese Datenschutzmaßnahmen sorgen dafür, dass die Privatsphäre der
          Nutzer respektiert und geschützt wird, während sie die Dienste von
          Digitalwahl.org nutzen.
        </p>
      </FaqCard>

      <FaqCard
        title="Werden persönliche Daten der Teilnehmer*innen gespeichert?"
        name="security"
        :id="3"
      >
        <p>
          Auf Digitalwahl.org werden die persönlichen Daten der Teilnehmer unter
          Berücksichtigung folgender Richtlinien gehandhabt:
        </p>
        <ul>
          <li>
            <strong>Daten des Organisators:</strong> Persönliche Daten werden
            hauptsächlich vom Organisator der Wahl erfasst.
          </li>
          <li>
            <strong>Teilnehmerdaten:</strong> Der Organisator entscheidet, ob
            Teilnehmer richtige Namen oder E-Mail Adressen verwenden sollen. Es
            ist nicht erforderlich, dass Teilnehmer ihre E-Mail-Adressen
            angeben, um an einer Wahl teilzunehmen.
          </li>
          <li>
            <strong>Token-basierte Authentifizierung:</strong> Bei Verwendung
            der token-basierten Authentifizierungsmethode trägt der Organisator
            die E-Mail-Adressen der Teilnehmer ein. Teilnehmer erhalten eine
            Einladungs-E-Mail um auf dem verwendeten Endgerät einen
            Zugangschlüssel für die Veranstaltung zu speichern.
          </li>
        </ul>
        <p>
          Diese Maßnahmen sorgen dafür, dass digitalwahl.org die Privatsphäre
          der Teilnehmer schützt, während eine effiziente und sichere
          Wahlumgebung bereitgestellt wird.
        </p>
      </FaqCard>

      <FaqCard
        title="Token-basierte Authentifizierung auf digitalwahl.org"
        name="security"
        :id="4"
      >
        <p>
          Die token-basierte Authentifizierung ist ein Verfahren, das auf
          Digitalwahl.org verwendet wird, um eine sichere und
          benutzerfreundliche Teilnahme an Wahlen zu ermöglichen. Hier ist, wie
          es funktioniert:
        </p>
        <ul>
          <li>
            <strong>Was ist ein Token?</strong> Ein Token ist eine Art digitaler
            Schlüssel, der es einem Benutzer erlaubt, auf bestimmte Daten oder
            Dienste zuzugreifen. In diesem Fall wird der Token verwendet, um an
            einer Wahl teilzunehmen.
          </li>
          <li>
            <strong>Erstellung des Tokens:</strong> Der Organisator der Wahl
            erstellt Tokens für jeden Teilnehmer. Dies geschieht, indem die
            E-Mail-Adressen der Teilnehmer in eine spezielle, verschlüsselte
            Form (einen Hash) umgewandelt werden.
          </li>
          <li>
            <strong>Sicherheit durch Hashing:</strong> Ein Hash ist eine
            einzigartige Zeichenfolge, die aus den E-Mail-Adressen generiert
            wird. Da der Hash nicht rückwärts in die ursprüngliche
            E-Mail-Adresse umgewandelt werden kann, bleibt die Identität des
            Teilnehmers geschützt.
          </li>
          <li>
            <strong>Speicherung des Tokens:</strong> Der Token wird auf dem
            Endgerät des Teilnehmers gespeichert. Wenn sich der Teilnehmer an
            der Wahl beteiligt, wird dieser Token verwendet, um seine
            Berechtigung zur Teilnahme zu bestätigen.
          </li>
          <li>
            <strong>Pseudonymisierung:</strong> Durch die Verwendung von Tokens
            können Teilnehmer an einer Wahl teilnehmen, ohne ihre wahre
            Identität offenlegen zu müssen. Dies unterstützt die Anonymität und
            Privatsphäre.
          </li>
          <li>
            <strong>Pseudonymisierung bei Anmeldung:</strong> Bei der Anmeldung
            können Teilnehmer einen Zufalls-Knop drücken, da das System einen
            Benutzernamen und einen Anzeigenamen für die Veranstaltung benötigt.
            Zur echten Pseudonymisierung sollten hier keine identifizierbaren
            Merkmale verwendet werden.
          </li>
        </ul>
        <p>
          Diese Methode stellt sicher, dass nur berechtigte Personen an der Wahl
          teilnehmen können, während die persönlichen Daten der Teilnehmer
          geschützt bleiben.
        </p>
      </FaqCard>

      <FaqCard title="Geheime Wahlen" name="security" :id="5">
        <p>
          Bei der Durchführung geheimer Wahlen auf digitalwahl.org wird
          besonderes Augenmerk auf die Anonymität und Privatsphäre der
          Teilnehmer gelegt. Hier ist der Prozess, wie er für Laien verständlich
          ist:
        </p>
        <ul>
          <li>
            <strong>Teilnehmerliste:</strong> Zu Beginn einer Wahl wird eine
            Liste der anwesenden Stimmberechtigten erstellt. Diese Liste enthält
            die Namen der Personen, die berechtigt sind, an der Wahl
            teilzunehmen.
          </li>
          <li>
            <strong>Erfassung der Stimmabgabe:</strong> Wenn ein Teilnehmer
            seine Stimme abgibt, wird dies in der Teilnehmerliste vermerkt. Es
            wird jedoch nicht festgehalten, wie die Person abgestimmt hat.
          </li>
          <li>
            <strong>Trennung von Teilnehmer und Stimme:</strong> In der
            Datenbank, in der die Wahlergebnisse gespeichert werden, gibt es
            einen Verweis auf jeden Teilnehmer. Bei einer geheimen Wahl bleibt
            das Feld, das die konkrete Stimmabgabe des Teilnehmers zeigen würde,
            jedoch leer.
          </li>
          <li>
            <strong>Geheimhaltung der Wahl:</strong> Dies stellt sicher, dass,
            obwohl verzeichnet wird, wer an der Wahl teilgenommen hat, die
            abgegebene Stimme jedes Einzelnen geheim bleibt. Niemand kann sehen,
            für welche Option sich ein bestimmter Teilnehmer entschieden hat.
          </li>
        </ul>
        <p>
          Diese Methode garantiert, dass die Integrität der geheimen Wahl
          gewahrt bleibt und die Stimmen der Teilnehmer anonym behandelt werden.
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
