// Single source for the manual page, the video recording and the prerendered SEO HTML.
// Each chapter has a video at /hilfe/<id>.mp4 with poster /hilfe/<id>.jpg.
export const MANUAL_STAND = '2026-11-01';

export const AUDIENCES = [
  { id: 'teilnehmer', title: 'Für Teilnehmer' },
  { id: 'organisator', title: 'Für Organisatoren' },
  { id: 'admin', title: 'Für Super-Admins' },
];

export const CHAPTERS = [
  // ---------------------------------------------------------------- Teilnehmer
  {
    id: 'anmelden',
    audience: 'teilnehmer',
    title: 'An einer Veranstaltung teilnehmen',
    intro:
      'Sie erreichen die Veranstaltung über den Link des Organisators, zum Beispiel digitalwahl.org/event/mitgliederversammlung. Alternativ geben Sie auf der Startseite die Veranstaltungs-ID ein.',
    steps: [
      'Link öffnen oder auf der Startseite die Veranstaltungs-ID eingeben.',
      'Unter „Benutzername, E-Mail oder Mitgliedsnummer“ die Kennung eintragen, die Ihr Organisator vorgibt.',
      'Ein Passwort eingeben. Beim ersten Login legen Sie es damit selbst fest. Notieren Sie es, Sie brauchen es für jede erneute Anmeldung, auch auf einem anderen Gerät.',
      'Unter „Anzeige-Name“ Ihren Namen und am besten auch Ihren Verein oder Verband eintragen, damit Sie eindeutig erkennbar sind.',
      '„In Veranstaltung einloggen“ klicken.',
    ],
    limits: [
      'Es gibt für Teilnehmer keine Funktion „Passwort vergessen“. Auch der Organisator kann Ihr Passwort nicht zurücksetzen oder einsehen.',
      'Solange die Veranstaltung nicht aktiv geschaltet ist, ist kein Login möglich. Sie sehen dann „Die Veranstaltung ist noch nicht freigeschaltet“.',
      'Ist die Lobby geschlossen, kann sich nur anmelden, wen der Organisator vorab angelegt hat.',
    ],
    pitfalls: [
      'Wer sich zuerst mit einer vorab angelegten Kennung anmeldet, legt das Passwort fest. Geben Sie Ihre Kennung nicht weiter.',
      'Das Passwort ist bei falscher Eingabe nicht überschreibbar: Der Login schlägt fehl, bis Sie das ursprüngliche Passwort verwenden.',
      'Der Anzeige-Name wird bei jedem Login neu übernommen. Ein Tippfehler ändert also den Namen, der dem Organisator angezeigt wird.',
    ],
  },
  {
    id: 'personalisierte-links',
    audience: 'teilnehmer',
    title: 'Personalisierter Link und Zugang per E-Mail',
    intro:
      'Viele Organisatoren versenden persönliche Links. Felder sind dann bereits ausgefüllt, oft entfällt das Passwort. Beim tokenbasierten Zugang erhalten Sie stattdessen eine E-Mail und aktivieren Ihr Gerät.',
    steps: [
      'Den persönlichen Link aus der Einladung öffnen. Auch Kurzlinks der Form /s/… führen direkt dorthin.',
      'Vorausgefüllte Angaben prüfen und nur noch fehlende Felder ergänzen.',
      '„In Veranstaltung einloggen“ klicken.',
      'Beim Zugang per E-Mail: den Link in der E-Mail öffnen, Benutzername und Angezeigten Namen eintragen und „Dieses Gerät aktivieren“ klicken.',
    ],
    limits: [
      'Ist der Benutzername über den Link vorgegeben, können Sie ihn nicht ändern. Beim Anzeige-Namen gilt das nur, wenn der Organisator ihn zusätzlich schreibgeschützt hat.',
      'Ein unbekannter Kurzlink zeigt „Link nicht gefunden“. Wenden Sie sich dann an den Organisator.',
    ],
    pitfalls: [
      'Behandeln Sie einen persönlichen Link wie einen Schlüssel. Wenn der Organisator den Magic-Link-Zugang erlaubt hat, kann jeder mit diesem Link als Sie abstimmen.',
      'Beim Zugang per E-Mail ist Ihr Gerät über ein Cookie gebunden. „Abmelden“ ist hier endgültig: Danach können Sie sich auf diesem Gerät nicht mehr anmelden. Auch im privaten Browserfenster oder nach dem Löschen der Cookies geht die Bindung verloren.',
    ],
  },
  {
    id: 'warteraum',
    audience: 'teilnehmer',
    title: 'Warteraum',
    intro:
      'Wenn der Organisator Sie noch nicht freigeschaltet hat, landen Sie im Warteraum. Die Seite aktualisiert sich von selbst, sobald er Sie freigibt.',
    steps: [
      'Nach dem Login erscheint „Vielen Dank für Ihren Login…“.',
      'Warten Sie, Sie müssen nichts neu laden.',
      'Nach der Freigabe sehen Sie automatisch Ihr Dashboard.',
    ],
    limits: [
      'Im Warteraum können Sie nicht abstimmen. Stimmen, die Ihnen später zugeteilt werden, gelten erst ab diesem Zeitpunkt.',
    ],
    pitfalls: [
      'Bleibt die Seite lange unverändert, sprechen Sie den Organisator an. Er sieht Sie unter dem von Ihnen angegebenen Anzeige-Namen, ein unklarer Name verzögert die Freigabe.',
    ],
  },
  {
    id: 'dashboard',
    audience: 'teilnehmer',
    title: 'Ihre Übersicht: Teilnehmer oder Besucher',
    intro:
      'Oben auf dem Dashboard sehen Sie Ihren Namen, Ihren Status, die Anzahl Ihrer Stimmen und ob Sie online sind. Ändert der Organisator etwas, wird das sofort angezeigt und ein Hinweis erscheint.',
    steps: [
      'Status prüfen: „Teilnehmer“ darf abstimmen, „Besucher“ darf nur zusehen.',
      'Bei Teilnehmern steht daneben die „Anzahl Stimmen“.',
      'Der Status „online“ zeigt, dass Ihre Verbindung steht.',
      'Beendete Abstimmungen und Ergebnisse stehen darunter.',
    ],
    limits: [
      'Besucher erhalten kein Abstimmungsfenster. Status und Stimmenzahl kann nur der Organisator ändern.',
    ],
    pitfalls: [
      'Änderungen an Ihrer Stimmenzahl gelten sofort, auch während einer laufenden Abstimmung. Achten Sie auf den Hinweis oben im Bild.',
    ],
  },
  {
    id: 'abstimmen',
    audience: 'teilnehmer',
    title: 'Abstimmen',
    intro:
      'Startet der Organisator eine Abstimmung, öffnet sich automatisch ein Fenster mit der Frage und den Antworten.',
    steps: [
      'Antwort auswählen.',
      '„Jetzt abstimmen“ klicken.',
      'Nach der Bestätigung „Erfolgreich abgestimmt“ schließt sich das Fenster.',
      'Sobald die Abstimmung beendet ist, erscheint das Ergebnis automatisch.',
    ],
    limits: [
      'Eine abgegebene Stimme lässt sich nicht zurücknehmen oder ändern.',
      'Ohne Auswahl lässt sich das Formular nicht absenden. Es erscheint „Bitte treffen Sie eine Auswahl“. Wer sich enthalten möchte, nutzt eine angebotene Enthaltungsoption.',
      'Sie können nicht für andere Personen abstimmen, auch nicht technisch über Ihre Anmeldung.',
    ],
    pitfalls: [
      'Bei einer offenen Abstimmung kann Ihre Antwort für andere sichtbar sein, sogar während sie läuft. Prüfen Sie, ob die Abstimmung offen oder geheim ist.',
      'Bei geheimen Abstimmungen speichert das System nicht, wer wie gestimmt hat. Der Organisator kann aber sehen, wer bereits abgestimmt hat.',
    ],
  },
  {
    id: 'mehrere-stimmen',
    audience: 'teilnehmer',
    title: 'Mit mehreren Stimmen abstimmen',
    intro:
      'Delegierte mit mehreren Stimmen geben diese gemeinsam ab oder verteilen sie auf verschiedene Antworten, falls der Organisator das erlaubt.',
    steps: [
      'Standardmäßig ist „100 % der Stimmzettel verwenden“ aktiviert: Alle Stimmen gehen an die gewählte Antwort.',
      'Zum Verteilen das Häkchen entfernen. Die Anzahl springt auf 1.',
      'Unter „Stimmenverteilung“ per Schieberegler, Zahlenfeld oder 25/50/75/100 % die Anzahl wählen.',
      'Antwort wählen und „Jetzt abstimmen“ klicken.',
      'Das Fenster bleibt für die restlichen Stimmen offen. Vorgang wiederholen, bis alle abgegeben sind.',
    ],
    limits: [
      'Das Verteilen ist nur möglich, wenn der Organisator „unterschiedliche Stimmenabgabe“ erlaubt hat. Sonst gehen immer alle Stimmen auf einmal an eine Antwort.',
      'Die Schnellwahl 25/50/75/100 % erscheint erst ab mehr als 3 verbleibenden Stimmen.',
    ],
    pitfalls: [
      'Wurde Ihre Stimmenzahl gerade reduziert, zählt der Server nur die noch zulässigen Stimmen. Sie erhalten dann den Hinweis „Es wurden x von y Stimmen gezählt“.',
      'Unter „Stimmenhinweise“ sehen Sie übertragene oder erhaltene Stimmen. Das ist praktisch, wenn Sie die Stimmen eines anderen Delegierten getrennt abgeben möchten.',
    ],
  },
  {
    id: 'mehrfachauswahl',
    audience: 'teilnehmer',
    title: 'Mehrere Antworten auswählen und Enthaltung',
    intro:
      'Bei Personenwahlen oder Listen können Sie je nach Einstellung mehrere Antworten ankreuzen.',
    steps: [
      'Bis zur angegebenen Höchstzahl Antworten ankreuzen.',
      'Optional „Enthaltung“ wählen, falls angeboten. Das entwertet oben gewählte Felder.',
      '„Jetzt abstimmen“ klicken.',
    ],
    limits: [
      'Mehr als die angegebene Höchstzahl lässt sich nicht auswählen.',
      'Das Feld „Enthaltung“ gibt es nur, wenn der Organisator es für diese Abstimmung aktiviert hat.',
    ],
    pitfalls: [
      'Mit mehreren Stimmen zählt jede gewählte Antwort einmal je Stimmzettel. Drei Stimmen und zwei Antworten ergeben also je drei Stimmen für beide Antworten.',
    ],
  },
  {
    id: 'verbindung',
    audience: 'teilnehmer',
    title: 'Verbindung unterbrochen',
    intro:
      'Bricht die Verbindung ab, erscheint „Serververbindung unterbrochen“. Das System versucht, sich neu zu verbinden. Ihre bereits abgegebenen Stimmen bleiben erhalten.',
    steps: [
      'Kurz warten, oft verbindet sich die Seite von selbst wieder.',
      'Sonst „Aktualisieren“ klicken.',
      'Falls nötig, mit denselben Zugangsdaten neu anmelden, auch von einem anderen Gerät.',
    ],
    limits: ['Ohne Verbindung kann keine Stimme abgegeben werden.'],
    pitfalls: [
      'Auf dem Handy trennt ein Wechsel in eine andere App oder der Sperrbildschirm die Verbindung. Lassen Sie die Seite während Abstimmungen im Vordergrund.',
      '„Ausloggen“ im Hinweisfenster löscht die lokal gespeicherte Anmeldung. Ohne Ihr Passwort kommen Sie danach nicht wieder hinein.',
    ],
  },
  {
    id: 'briefwahl-teilnehmer',
    audience: 'teilnehmer',
    title: 'Briefwahl (zeitversetzt abstimmen)',
    intro:
      'Bei einer Briefwahl stimmen Sie innerhalb eines Zeitraums ab, wann es Ihnen passt, statt in einer laufenden Sitzung.',
    steps: [
      'Vor dem Start zeigt die Seite „Die Veranstaltung startet am…“.',
      'Im Zeitraum die Liste der Abstimmungen öffnen und je Abstimmung den Start-Knopf klicken.',
      'Antwort wählen und abstimmen.',
      'Ergebnisse erscheinen erst nach dem Ende der Veranstaltung.',
    ],
    limits: [
      'Vor dem Enddatum sehen Sie keine Ergebnisse.',
      'Videokonferenzen sind bei Briefwahl-Veranstaltungen nicht eingebunden.',
    ],
    pitfalls: [
      'Warten Sie nicht bis zur letzten Minute. Die Schließung läuft zeitgesteuert, verlassen Sie sich nicht auf Minuten nach dem Enddatum.',
    ],
  },
  // ---------------------------------------------------------------- Organisator
  {
    id: 'konto',
    audience: 'organisator',
    title: 'Konto anlegen und Profil',
    intro:
      'Als Organisator registrieren Sie sich einmalig. Danach bestätigen Sie Ihre E-Mail-Adresse, und das Konto wird freigegeben.',
    steps: [
      'Auf der Startseite „Als Organisator registrieren“ klicken.',
      'Benutzername, E-Mail-Adresse, Passwort, Ihren Namen und Ihre Organisation eintragen.',
      'Den Bedingungen zustimmen und absenden.',
      'Den Link in der E-Mail bestätigen und auf die Freigabe warten.',
      'Später unter „Mein Profil“ E-Mail, Namen und Passwort ändern.',
    ],
    limits: [
      'Ohne bestätigte E-Mail und Freigabe ist kein Login möglich.',
      'Rechte wie Super-Admin oder Inhaltsbearbeitung können Sie sich nicht selbst geben.',
    ],
    pitfalls: [
      'Prüfen Sie den Spam-Ordner, wenn die Bestätigungs-E-Mail fehlt. Ihr eigenes Passwort setzen Sie über „Passwort vergessen“ auf der Startseite zurück.',
    ],
  },
  {
    id: 'veranstaltung-erstellen',
    audience: 'organisator',
    title: 'Veranstaltung erstellen',
    intro:
      'Unter „Meine Veranstaltungen“ legen Sie eine neue Veranstaltung an. Titel, Slug und Datum sind das Wichtigste. Der Slug bildet die Adresse: digitalwahl.org/event/ihr-slug.',
    steps: [
      '„Neue Veranstaltung erstellen“ klicken.',
      'Veranstaltungstitel, Slug, Beschreibung und Startdatum eintragen.',
      'Optional „Lobby aktivieren“, damit sich Teilnehmer selbst anmelden und im Warteraum warten können.',
      '„Veranstaltung direkt aktiv schalten?“ setzen, sobald sich Teilnehmer anmelden dürfen.',
      '„Speichern und schließen“ klicken und den Einladungs-Link aus der Liste kopieren.',
    ],
    limits: [
      'Ein Slug kann nur einmal vergeben werden.',
      'Eine neue Veranstaltung ist zunächst inaktiv. Bis zur Aktivierung kann sich niemand mit Passwort anmelden.',
      'Löschen ist erst möglich, wenn die Veranstaltung inaktiv ist.',
    ],
    pitfalls: [
      'Aktiv schalten nicht vergessen, das ist die häufigste Ursache für „kein Login möglich“.',
      'Ändern Sie den Slug nach dem Versand nicht mehr, sonst funktionieren versendete Links nicht mehr.',
      'Veranstaltungen werden automatisch gelöscht: 180 Tage nach dem Startdatum erhalten Sie eine E-Mail, etwa 3 Tage später werden alle Daten endgültig entfernt. Exportieren Sie Ergebnisse vorher.',
    ],
  },
  {
    id: 'regeln-design',
    audience: 'organisator',
    title: 'Regeln, Sichtbarkeit und Design',
    intro:
      'Im Bearbeiten-Formular legen Sie auf den Reitern „Regeln“ und „Design“ fest, wie abgestimmt wird und wie die Veranstaltung aussieht.',
    steps: [
      'Reiter „Regeln“ öffnen.',
      'Unter „Mehrfachstimmenabgabe“ wählen: unterschiedliche Stimmenabgabe oder immer alle Stimmen auf einmal.',
      '„Stimmenabgabe bei öffentlichen Abstimmungen für alle sichtbar darstellen“ prüfen.',
      'Bei Bedarf den öffentlichen Namen schreibgeschützt setzen.',
      'Auf dem Reiter „Design“ Logo und Farben anpassen.',
    ],
    limits: ['Das Logo muss ein JPEG oder PNG sein. Es wird verkleinert und komprimiert.'],
    pitfalls: [
      'Das Häkchen zur Sichtbarkeit steuert nur die Live-Liste während der Abstimmung. Nach dem Ende ist bei offenen Abstimmungen über „Ergebnisliste anzeigen“ weiterhin sichtbar, wer wie gestimmt hat. Für vertrauliche Fragen immer „Geheime Abstimmung“ wählen.',
      'Der Schreibschutz des Namens wirkt in der Anmeldemaske. Verlassen Sie sich für die Identitätsprüfung nicht allein darauf.',
    ],
  },
  {
    id: 'teilnehmer-anlegen',
    audience: 'organisator',
    title: 'Teilnehmer anlegen',
    intro:
      'Im Bereich „Teilnehmer“ legen Sie Personen einzeln oder als Liste an. Vorab angelegte Personen sind sofort freigeschaltet und müssen nicht durch den Warteraum.',
    steps: [
      'Für eine Person: „Neuen Benutzer erstellen“, Benutzername, Angezeigter Name und Stimmen eintragen, „Benutzer speichern“.',
      'Für viele: „Mehrere Benutzer erstellen“ öffnen.',
      'Eine Zeile je Person eintragen: benutzername;Name;Stimmen, zum Beispiel m.mueller;Maria Müller;3.',
      'Vorschau prüfen und absenden.',
      'Fehlermeldungen prüfen: Bereits vorhandene Benutzer werden aufgelistet, die übrigen trotzdem angelegt.',
    ],
    limits: [
      'Es gibt keinen Datei-Upload. Sie fügen die Liste als Text ein, zum Beispiel aus einer Tabellenkalkulation.',
      'Kopfzeilen sind nicht vorgesehen, Trennzeichen ist das Semikolon.',
      'Doppelte Einträge in der Liste verhindern das Absenden.',
    ],
    pitfalls: [
      'Eine fehlende Stimmenzahl oder 0 legt die Person als Besucher an, sie kann dann nicht abstimmen.',
      'Prüfen Sie Stimmenzahlen in der Vorschau. Ein Tippfehler wie „5a“ wird als 5 gelesen.',
      'Vorab angelegte Personen haben noch kein Passwort. Das erste beim Login eingegebene Passwort wird zu ihrem Passwort.',
    ],
  },
  {
    id: 'links-versenden',
    audience: 'organisator',
    title: 'Einladungslinks, Kurzlinks und CSV-Export',
    intro:
      'Sie können pro Person einen Link kopieren oder alle Links als CSV exportieren, etwa für einen Serienbrief. Mit „Zugang über Magic-Link erlauben“ entfällt das Passwort.',
    steps: [
      'Bei der Veranstaltung „Zugang über Magic-Link erlauben“ setzen, wenn gewünscht.',
      'Im Bereich „Teilnehmer“ am Eintrag „Link kopieren“ klicken.',
      'Für alle: „CSV mit Login-Links exportieren“. Fehlende Kurzlinks werden dabei erzeugt.',
      'Die CSV enthält Public Name, Username, Stimmberechtigt, Stimmenanzahl und Shortlink, getrennt durch Semikolon.',
    ],
    limits: [
      'Das System versendet über diese Funktion keine E-Mails. Der Versand liegt bei Ihnen. Nur der tokenbasierte Login verschickt selbst E-Mails.',
    ],
    pitfalls: [
      'Magic-Links sind kein Geheimnis-Login: Wer den Link hat, kann als diese Person abstimmen. Versenden Sie sie einzeln, nie in einem gemeinsamen Verteiler.',
      'Die CSV ist wie eine Schlüsselliste zu behandeln.',
    ],
  },
  {
    id: 'token-zugang',
    audience: 'organisator',
    title: 'Tokenbasierter Zugang per E-Mail',
    intro:
      'Beim tokenbasierten Login tragen Sie E-Mail-Adressen ein. Jede Person erhält eine E-Mail mit einem Aktivierungslink und bindet damit ihr Gerät.',
    steps: [
      '„Mehrere Benutzer erstellen“ öffnen und „Tokenbasierter-Login“ wählen.',
      'E-Mail-Adresse und Stimmen je Zeile eintragen.',
      'Absenden. Die Empfänger aktivieren ihr Gerät selbst über den Link.',
    ],
    limits: [
      'Als Kennung sind hier nur E-Mail-Adressen möglich.',
      'Die E-Mail-Adresse bleibt beim Teilnehmer gespeichert, bis die Veranstaltung gelöscht wird. Bei einem Fehlversand gibt es keine verlässliche Rückmeldung in der Oberfläche.',
    ],
    pitfalls: [
      'Prüfen Sie stichprobenartig, ob die E-Mails ankommen, und planen Sie Zeit für Spam-Filter ein.',
      'Teilnehmer sind an ihr Gerät gebunden. Weisen Sie darauf hin, nicht im privaten Fenster zu aktivieren und nicht auf „Abmelden“ zu klicken.',
    ],
  },
  {
    id: 'warteraum-organisator',
    audience: 'organisator',
    title: 'Warteraum: freischalten oder löschen',
    intro:
      'Ist die Lobby aktiv, erscheinen sich selbst anmeldende Personen im Warteraum. Dort entscheiden Sie, wer teilnimmt.',
    steps: [
      'Links „Warteraum“ öffnen.',
      'Anzeige-Namen prüfen.',
      '„Verifizieren als: Teilnehmer“ oder „Verifizieren als: Besucher“ klicken und bestätigen.',
      'Unbekannte Einträge mit „Benutzer löschen“ entfernen.',
    ],
    limits: [
      'Gelöscht werden kann nur im Warteraum und nur, wenn die Person offline ist.',
      'Es gibt keine Passwort-Zurücksetzung für Teilnehmer.',
    ],
    pitfalls: [
      '„Verifizieren als: Teilnehmer“ setzt immer genau 1 Stimme. Delegierten mit mehreren Stimmen teilen Sie danach über „Bearbeiten“ die richtige Zahl zu.',
      'Passwort vergessen? Person in den Warteraum verschieben, löschen, sobald sie offline ist, und neu anlegen. Danach legt sie beim Login ein neues Passwort fest.',
    ],
  },
  {
    id: 'teilnehmer-verwalten',
    audience: 'organisator',
    title: 'Teilnehmer bearbeiten und Status ändern',
    intro:
      'Im Bereich „Teilnehmer“ ändern Sie Status und Stimmen. Jede Änderung erreicht die Person sofort, ohne dass sie die Seite neu laden muss.',
    steps: [
      'Am Eintrag „Bearbeiten“ klicken.',
      '„Anzahl der Stimmen“ oder den Namen ändern und „Benutzer speichern“ klicken.',
      'Über „Setzen auf: Besucher“ oder „Setzen auf: Teilnehmer“ den Status wechseln.',
      'Mit „In den Warteraum“ die Freischaltung zurücknehmen.',
    ],
    limits: [
      'Das Passwort einer Person können Sie nicht sehen oder ändern.',
      'Bereits abgegebene Stimmen werden durch Änderungen nicht gelöscht.',
    ],
    pitfalls: [
      '„Setzen auf: Teilnehmer“ setzt die Stimmen immer auf 1, „Setzen auf: Besucher“ immer auf 0. Prüfen Sie danach die Stimmenzahl.',
      'Während einer laufenden Abstimmung wirkt eine Erhöhung sofort, die Person kann weitere Stimmen abgeben. Eine Reduzierung verhindert nur weitere Stimmen.',
    ],
  },
  {
    id: 'stimmrecht-uebertragen',
    audience: 'organisator',
    title: 'Stimmrecht übertragen',
    intro:
      'Verlässt ein Delegierter die Versammlung, übertragen Sie seine Stimmen auf eine andere Person. Beide sehen die Änderung sofort, der Vorgang wird protokolliert.',
    steps: [
      'Am abgebenden Eintrag „Stimmrecht übertragen“ klicken.',
      'Unter „An Benutzer übertragen“ die Person suchen und auswählen.',
      '„1 Stimme“, „Alle Stimmen“ oder eine Anzahl wählen.',
      'Vorschau prüfen und „Übertragung bestätigen“ klicken.',
    ],
    limits: [
      'Nur innerhalb derselben Veranstaltung und nur zwischen freigeschalteten Personen, nicht an sich selbst.',
      'Bereits abgegebene Stimmen der laufenden Abstimmung lassen sich nicht übertragen. Die Meldung nennt die noch übertragbare Anzahl.',
      'Übertragungen lassen sich nicht rückgängig machen. Übertragen Sie bei Bedarf wieder zurück.',
    ],
    pitfalls: [
      'Wer alle Stimmen abgibt, wird automatisch Besucher. Der Empfänger wird automatisch Teilnehmer.',
      'Übertragen Sie möglichst vor dem Start einer Abstimmung. Das „Stimmen-Anpassungen Log“ in den Ergebnissen dokumentiert jeden Vorgang.',
    ],
  },
  {
    id: 'abstimmung-erstellen',
    audience: 'organisator',
    title: 'Abstimmung erstellen',
    intro:
      'Unter „Abstimmungen“ legen Sie Fragen an, auch im Voraus. Sie wählen Antworten, Auswahlgrenzen und ob die Abstimmung geheim oder offen ist.',
    steps: [
      '„Neue Abstimmung erstellen“ klicken.',
      'Unter „Was soll abgestimmt werden?“ die Frage eintragen.',
      '„Ja/Nein“, „Ja/Nein/Enthalten“ oder „Individuelle Antwortoptionen“ wählen.',
      'Bei individuellen Antworten je Zeile eine Option eintragen und Maximal/Minimal auszuwählen festlegen. 0 bei „Maximal“ bedeutet: alle auswählbar.',
      '„Offene Abstimmung“ oder „Geheime Abstimmung“ wählen.',
      '„Abstimmung speichern“ für später oder „Abstimmung speichern & sofort starten“.',
    ],
    limits: [
      'Gestartete Abstimmungen lassen sich nicht mehr bearbeiten. Nutzen Sie „Kopieren“ für eine angepasste neue Fassung.',
      'Es kann immer nur eine Abstimmung gleichzeitig laufen.',
      'Eine leere Abgabe ist nicht möglich, auch wenn „Minimal auszuwählen“ 0 ist.',
    ],
    pitfalls: [
      'Das Formular prüft nicht, ob Minimal kleiner als Maximal ist. Kontrollieren Sie das selbst.',
      'Voreingestellt ist „Geheime Abstimmung“. Bei einer offenen Abstimmung sind Antworten Personen zugeordnet.',
    ],
  },
  {
    id: 'abstimmung-durchfuehren',
    audience: 'organisator',
    title: 'Abstimmung starten und beenden',
    intro:
      'In der Liste starten Sie eine vorbereitete Abstimmung. Sie sehen den Fortschritt live. Haben alle ihre Stimmen abgegeben, endet sie automatisch.',
    steps: [
      'In der Liste den Start-Knopf klicken und bestätigen.',
      'Den Fortschritt verfolgen: abgegebene Stimmen und wer abgestimmt hat.',
      'Automatisches Ende abwarten oder „Beenden der Abstimmung erzwingen“ klicken und bestätigen.',
      'Das Ergebnis erscheint bei allen Teilnehmern automatisch.',
    ],
    limits: [
      'Ohne aktive Teilnehmer online lässt sich nicht starten.',
      'Beendete Abstimmungen lassen sich nicht wieder öffnen. Für eine Wiederholung kopieren Sie die Abstimmung.',
    ],
    pitfalls: [
      'Wer sich während der Abstimmung anmeldet, darf mitstimmen. Die Höchstzahl der Stimmen wächst dadurch.',
      'Das automatische Ende bleibt aus, solange jemand aus der Liste noch nicht fertig ist, auch wenn die Person inzwischen offline ist. Beenden Sie dann manuell.',
      'Auch bei geheimen Abstimmungen sehen Sie, wer abgestimmt hat, nicht aber wie. Zeigen Sie diese Liste nicht auf einer Leinwand, wenn das unerwünscht ist.',
      'Während einer laufenden Abstimmung gelten Teilnehmer nicht wegen Inaktivität als offline. Außerhalb davon werden sie nach 15 Minuten ohne Aktivität auf offline gesetzt.',
    ],
  },
  {
    id: 'ergebnisse',
    audience: 'organisator',
    title: 'Ergebnisse und Export',
    intro:
      'Unter „Ergebnisse“ finden Sie jede beendete Abstimmung mit Auswertung und Exporten für das Protokoll.',
    steps: [
      'Links „Ergebnisse“ öffnen.',
      'Ergebnisse je Abstimmung ansehen, bei offenen Abstimmungen auch die Ergebnisliste.',
      'Über das Augen-Symbol ein Ergebnis für Teilnehmer ausblenden oder wieder einblenden.',
      'Export wählen: „Übersicht“, „Ergebnisse“, „Ergebnisse mit Details“, „Teilnehmer mit abgegebener Stimmenanzahl“ oder „Stimmen-Anpassungen Log“.',
    ],
    limits: [
      'Bei geheimen Abstimmungen gibt es keine Zuordnung von Personen zu Antworten, auch nicht im Export.',
      'Das „Stimmen-Anpassungen Log“ ist nur verfügbar, wenn es Anpassungen gab.',
    ],
    pitfalls: [
      'Die CSV-Dateien nutzen das Semikolon als Trennzeichen.',
      'Exportieren Sie vor der automatischen Löschung nach rund 180 Tagen. Gelöschte Veranstaltungen lassen sich nicht wiederherstellen.',
      'Ausblenden wirkt nur für Teilnehmer, das Ergebnis bleibt gespeichert.',
    ],
  },
  {
    id: 'briefwahl-organisator',
    audience: 'organisator',
    title: 'Briefwahl einrichten',
    intro:
      'Mit der Option „Die Abstimmungen der Veranstaltung finden asynchron statt (Briefwahl)“ stimmen Teilnehmer in einem festen Zeitraum ab, ohne gemeinsame Sitzung.',
    steps: [
      'Veranstaltung anlegen, die Briefwahl-Option setzen, Start- und Enddatum eintragen.',
      'Teilnehmer anlegen. Mindestens eine Person ist Voraussetzung für Abstimmungen.',
      'Alle Abstimmungen vor dem Startdatum anlegen und prüfen.',
      'Veranstaltung aktiv schalten.',
      'Nach dem Enddatum werden die Abstimmungen automatisch geschlossen und Sie per E-Mail informiert.',
    ],
    limits: [
      'Ab dem Start können Sie Abstimmungen nicht mehr anlegen, bearbeiten, kopieren oder löschen.',
      '„Sofort starten“ gibt es bei der Briefwahl nicht.',
      'Es gibt keine Videokonferenz-Einbindung.',
    ],
    pitfalls: [
      'Testen Sie die Abstimmungen mit einer Testperson vor dem Start.',
      'Die Schließung läuft alle 15 Minuten. Rechnen Sie damit, dass das Ende nicht auf die Minute genau greift, und nennen Sie Teilnehmern eine klare Frist.',
    ],
  },
  {
    id: 'videokonferenz',
    audience: 'organisator',
    title: 'Videokonferenz mit Zoom oder Jitsi',
    intro:
      'Sie können eine Zoom- oder Jitsi-Konferenz direkt einbinden. Teilnehmer sehen dann „An Videokonferenz teilnehmen“ auf dem Dashboard.',
    steps: [
      'Unter „Videokonferenzsysteme einrichten“ auf „Neu anlegen“ klicken und den Anbieter wählen.',
      'Zoom: SDK Key und SDK Secret eintragen. Jitsi: Server URL eintragen.',
      'Speichern.',
      'In der Veranstaltung das System auswählen und Meeting ID und Passwort bzw. den Raumnamen eintragen.',
    ],
    limits: [
      'Keine Einbindung bei Briefwahl-Veranstaltungen.',
      'Für Zoom brauchen Sie eigene Zugangsdaten aus Ihrem Zoom-Konto, das System stellt keine bereit.',
    ],
    pitfalls: [
      'Testen Sie Bild und Ton vor der Versammlung auf Handy und Rechner.',
      'Abstimmen funktioniert unabhängig von der Konferenz. Fällt das Video aus, läuft die Wahl weiter.',
    ],
  },
  {
    id: 'veranstaltung-loeschen',
    audience: 'organisator',
    title: 'Veranstaltung beenden und löschen',
    intro:
      'Nach der Veranstaltung schalten Sie sie inaktiv, exportieren die Ergebnisse und löschen sie bei Bedarf. Spätestens rund 183 Tage nach dem Startdatum geschieht das automatisch.',
    steps: [
      'Ergebnisse exportieren.',
      'Veranstaltung bearbeiten und „aktiv“ entfernen.',
      'In der Liste „Veranstaltung löschen“ klicken und bestätigen.',
    ],
    limits: [
      'Das Löschen ist endgültig. Teilnehmer, Abstimmungen und Ergebnisse werden entfernt.',
      'Aktive Veranstaltungen können nicht gelöscht werden.',
    ],
    pitfalls: [
      'Nach dem Inaktiv-Schalten können sich Teilnehmer mit Passwort nicht mehr anmelden und ihre Ergebnisse nicht mehr einsehen. Stimmen Sie den Zeitpunkt ab.',
      'Die Hinweis-E-Mail vor der automatischen Löschung kommt nur einmal, rund 3 Tage vorher.',
    ],
  },
  // ---------------------------------------------------------------- Super-Admin
  {
    id: 'organisatoren-verwalten',
    audience: 'admin',
    title: 'Organisatoren verwalten',
    intro:
      'Unter „Organisatoren“ geben Sie neue Konten frei, legen selbst welche an oder entfernen sie.',
    steps: [
      '„Organisatoren“ öffnen und über den Filter suchen.',
      'Konten über „aktivieren“ oder „deaktivieren“ steuern.',
      '„Neuer Organisator“ für neue Konten. Optional E-Mail-Verifizierung überspringen und automatisch aktivieren.',
    ],
    limits: ['Diese Verwaltung ist nur für Super-Admins sichtbar.'],
    pitfalls: [
      'Prüfen Sie vor dem Löschen eines Organisators, was mit dessen Veranstaltungen geschehen soll, und übertragen Sie sie gegebenenfalls.',
    ],
  },
  {
    id: 'veranstaltung-uebertragen',
    audience: 'admin',
    title: 'Veranstaltung übertragen (Co-Organisator)',
    intro:
      'Eine Veranstaltung lässt sich an einen anderen Organisator übertragen, zum Beispiel für die Unterstützung bei der Durchführung. Danach haben beide vollen Zugriff.',
    steps: [
      'Unter „Organisatoren“ beim Konto „Veranstaltungen anzeigen“ klicken.',
      'Bei der Veranstaltung „Veranstaltung übertragen“ klicken.',
      '„Ziel-Organisator auswählen“ und „Übertragen“ klicken.',
      'Später über „Auf ursprünglichen Organisator zurücksetzen“ zurückgeben.',
    ],
    limits: [
      'Es gibt immer einen aktuellen und einen ursprünglichen Organisator, keine Liste beliebig vieler Co-Organisatoren.',
      'Andere Organisatoren haben keinen Zugriff.',
    ],
    pitfalls: [
      'Beide Organisatoren können alles, auch die Veranstaltung löschen. Übertragen Sie nur an vertrauenswürdige Konten.',
      'Bereits geöffnete Seiten des neuen Organisators sehen die Live-Updates erst nach einem Neuladen.',
    ],
  },
  {
    id: 'inhalte-einstellungen',
    audience: 'admin',
    title: 'Inhalte, Texte und Systemeinstellungen',
    intro:
      'Super-Admins pflegen Texte, öffentliche Seiten, Medien und globale Einstellungen ohne Programmierung.',
    steps: [
      '„Alle Veranstaltungen“: Veranstaltungen aller Organisatoren ansehen, aktivieren, deaktivieren oder löschen.',
      '„Statische Inhalte“: Seiten, Abschnitte und Adressen pflegen.',
      '„Übersetzungs-Editor“: einzelne Texte der Oberfläche ändern und zurücksetzen.',
      'Medienverwaltung: Bilder hochladen.',
      'Globale Einstellungen: Titel-Suffix, Favicon, Footer-Navigation und mosparo-Spam-Schutz.',
    ],
    limits: [
      'In die Medienverwaltung lassen sich nur Bilder bis 5 MB laden (JPEG, PNG, GIF, WebP, SVG).',
    ],
    pitfalls: [
      'Ein eigener Seiten-Slug wie „anleitung“ oder „impressum“ ersetzt die mitgelieferte Seite vollständig, also auch diese Anleitung mit ihren Videos.',
      'Prüfen Sie nach Änderungen an Impressum und Datenschutz die öffentliche Ansicht.',
    ],
  },
];
