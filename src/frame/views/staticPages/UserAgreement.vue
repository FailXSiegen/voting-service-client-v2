<template>
  <div class="user-agreement container min-vh-100">
    <h1>Nutzervereinbarung</h1>
    <div class="alert alert-primary">
      <div class="row">
        <div class="col-1 text-center d-flex align-items-center">
          <i class="bi bi-exclamation-circle display-4"></i>
        </div>
        <div class="col d-flex align-items-center">
          <p class="mb-0">
            Holen Sie sich einen Rechtsbeistand um zu klären, ob Ihr
            Verein/Verband Wahlen digital durchführen darf.<br /><br />digitalwahl.org
            ist eine unterstützende technische Plattform.<br />
            <b>
              digitalwahl.org kann keine Rechtssicherheit für die Gültigkeit der
              durchgeführten Wahlen gewährleisten!
            </b>
          </p>
        </div>
      </div>
    </div>
    <div class="alert alert-success">
      <div class="row">
        <div class="col-1 text-center d-flex align-items-center">
          <span class="h1 mx-auto d-inline-block">&euro;</span>
        </div>
        <div class="col d-flex align-items-center">
          <p class="mb-0">
            Das Angebot von digitalwahl.org erfolgt
            <b>kostenlos für gemeinnützige Vereine und Verbände</b>. Falls
            Funktionen gewünscht werden können Sie sich gerne an
            <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a>
            wenden.
          </p>
        </div>
      </div>
    </div>
    <p>
      <b>Verantwortung:</b> Jeder Veranstalter einer Wahl auf digitalwahl.org
      ist selbst für das erstellte Event verantwortlich. Alle Daten zu dem Event
      obliegen der Datenhoheit des Veranstalters. digitalwahl.org nimmt keinen
      Einfluss auf eingebene und verwendete Daten für ein selbst organisiertes
      Event, außer es wird ein Missbrauch gemeldet. Wir behalten wir uns das
      Recht vor, Informationen nach Meldung eines Missbrauchs zum Zweck des
      Nachweises zu speichern und erst nach Aufforderung zu löschen.
    </p>
    <p>
      <b>Haftung:</b> Veranstalter haften für missbräuchlich verwendete
      Informationen und Daten. Sie versichern, dass keine Inhalte hinterlegt
      werden, die gegen geltende Gesetze verstoßen.
    </p>
    <p>
      <b>Verfügbarkeit:</b> Aufgrund technischer Beschränkungen kann es zu
      Einschränkungen oder Ausfällen kommen. Dies ist der Fall, wenn parallel
      stattfindene Events mit einer größeren Anzahl an Teilnehmer den Server
      überlasten. Wir versuchen durch Updates und technische Verbesserungen der
      Serverstruktur und Software eine automatische Skalierung zu
      implementieren.
    </p>
    <div class="alert alert-info">
      <div class="row">
        <div class="col-1 text-center d-flex align-items-center">
          <i class="bi bi-exclamation-circle display-4"></i>
        </div>
        <div class="col d-flex align-items-center">
          <p class="mb-0">
            Eine Veranstaltungen mit mehr als <b>100 Teilnehmern</b> sollte bei
            <a href="mailto:info@digitalwahl.org">info@digitalwahl.org</a>
            gemeldet werden.
          </p>
        </div>
      </div>
    </div>
    <p>
      <b>Vertraulichkeit:</b> Eingestellte Inhalte wie Abstimmungsergebnisse
      werden vertraulich behandelt und nicht an unbefugte Dritte veröffentlicht.
      Ein standardmäßiges Monitoring von Inhalten durch den Betreiber erfolgt
      nicht. Jedoch können Entwickler im Rahmen von technischen Arbeiten
      zufällig Kenntnis von Inhalten erlangen.
    </p>

    <p>
      <b>Löschfristen:</b> Registierte Organisator:innen ohne E-Mail Bestätigung
      werden automatisch nach 24 Stunden gelöscht. Durchgeführte Events werden
      180 Tage nach angegeben Start-Datum gelöscht. Es obliegt dem Veranstalter,
      alle Ergebnisse und Informationen zur Nachweispflicht zu sichern.
    </p>

    <p>
      <b>Nutzung von Kontaktdaten:</b> digitalwahl.org nutzt ins System
      eingetragene E-Mail- oder Kontaktdaten nur, um systemspezifische Prozesse
      abzuwickeln (z.B. zur Passwortrücksetzung oder um von den Nutzer:innen
      bestellte Zusammenfassungen zu versenden) oder um starke Veränderungen am
      System zu kommunizieren (Ausfallzeiten o.ä.). Die Kontaktdaten werden
      nicht an Dritte weitergegeben. Die Organisator:innen von Veranstaltungen
      in digitalwahl.org sind dazu angehalten, die Daten der Teilnehmenden nicht
      für andere als die vereinbarten Zwecke zu nutzen.
    </p>
    <p>
      <b>Aktualisierungen:</b> Diese Nutzungsbedingungen können jederzeit den
      notwendigen Regelungsbedarfen angepasst werden. Es ist jedoch
      ausgeschlossen, dass die aus der Nutzung erhobenen Daten zum Zweck der
      Monetarisierung weitergegeben (verkauft) werden.
    </p>

    <p>
      (Version: 10. Januar 2021)
    </p>
    <p>&nbsp;</p>
    <app-footer />
  </div>
</template>
<script>
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  created () {
    document.title = 'Nutzungsvereinbarung - digitalwahl.org'
  }
}
</script>
