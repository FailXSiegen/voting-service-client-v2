# Organisator-Workflow Dokumentation

Diese Dokumentation zeigt den kompletten Workflow eines Organisators im Voting-Tool mit Screenshots und Funktionsbeschreibungen für alle Bereiche.

## Inhalt
- [Login und Dashboard](#login-und-dashboard)
- [Veranstaltungsübersicht](#veranstaltungsübersicht)
- [Veranstaltung erstellen](#veranstaltung-erstellen)
- [Veranstaltung bearbeiten](#veranstaltung-bearbeiten)
- [Teilnehmerverwaltung](#teilnehmerverwaltung)
- [Warteraum](#warteraum)
- [Abstimmungsverwaltung](#abstimmungsverwaltung)
- [Abstimmungsergebnisse](#abstimmungsergebnisse)
- [Videokonferenz-Integration](#videokonferenz-integration)
- [Organisatorprofil](#organisatorprofil)

## Login und Dashboard

*Screenshot: login.png*

**Beschreibung:**
Als Organisator loggen Sie sich mit Ihrer E-Mail-Adresse und Passwort ein. Die Startseite zeigt ein Dashboard mit einer Übersicht der aktuellen Aktivitäten und Funktionen.

**Funktionen:**
- Schnellzugriff auf Ihre Veranstaltungen
- Übersicht der neuesten Updates und Funktionen
- Schnellzugriff auf Hilfe und Support

## Veranstaltungsübersicht

*Screenshot: event-overview.png*

**Beschreibung:**
Die Veranstaltungsübersicht zeigt alle Ihre vergangenen und zukünftigen Veranstaltungen. Von hier aus können Sie Veranstaltungen verwalten, neue erstellen oder bestehende bearbeiten.

**Funktionen:**
- Liste aller Veranstaltungen mit Status und Datum
- Schnellfunktionen zum Kopieren des Einladungslinks
- Optionen zum Bearbeiten, Löschen und Verwalten von Veranstaltungen
- Button zum Erstellen einer neuen Veranstaltung

## Veranstaltung erstellen

*Screenshot: create-event.png*

**Beschreibung:**
Hier erstellen Sie eine neue Veranstaltung mit allen notwendigen Einstellungen.

**Funktionen:**
- Titel und Beschreibung festlegen
- Slug für die URL definieren
- Datum und Uhrzeit der Veranstaltung bestimmen
- Lobby/Warteraum aktivieren
- Aktivitätsstatus der Veranstaltung festlegen
- Asynchrone Wahl konfigurieren (mit Start- und Enddatum)
- Videokonferenzsystem auswählen
- Mehrfachstimmenabgabe-Optionen konfigurieren

## Veranstaltung bearbeiten

*Screenshot: edit-event.png*

**Beschreibung:**
Hier können alle Einstellungen einer bestehenden Veranstaltung angepasst werden.

**Funktionen:**
- Ändern aller Veranstaltungsdetails
- Aktualisieren des Status (aktiv/inaktiv)
- Anpassen der Lobby-Einstellung
- Bearbeiten der Videokonferenz-Integration

## Teilnehmerverwaltung

### Teilnehmerübersicht
*Screenshot: member-overview.png*

**Beschreibung:**
Zeigt alle registrierten Teilnehmer und Gäste der Veranstaltung mit ihren Rollen und Stimmenanzahl.

**Funktionen:**
- Liste aller Teilnehmer mit Namen, Status und Rolle
- Überblick über die Gesamtzahl der Teilnehmer und Stimmen
- Filter- und Suchfunktion

### Teilnehmer erstellen - Einzeln
*Screenshot: create-single-participant.png*

**Beschreibung:**
Formular zum Anlegen eines einzelnen Teilnehmers.

**Funktionen:**
- Benutzername und Anzeigename festlegen
- Rolle (Teilnehmer/Gast) bestimmen
- Stimmenanzahl zuweisen

### Teilnehmer erstellen - Mehrere
*Screenshot: create-multiple-participants.png*

**Beschreibung:**
Funktion zum Importieren mehrerer Teilnehmer gleichzeitig.

**Funktionen:**
- Import per Textfeld (z.B. aus Excel/Tabelle kopieren)
- Massenzuweisung der Rolle und Stimmenanzahl
- Vorschau der zu importierenden Teilnehmer

### Teilnehmer erstellen - Token-basiert
*Screenshot: create-token-participants.png*

**Beschreibung:**
Erstellung von Teilnehmern mit E-Mail-Token-Authentifizierung.

**Funktionen:**
- E-Mail-Adressen eingeben oder importieren
- Automatisches Versenden von Authentifizierungslinks
- Übersicht der versendeten Einladungen

### Teilnehmer bearbeiten
*Screenshot: edit-participant.png*

**Beschreibung:**
Bearbeitungsmaske für einen einzelnen Teilnehmer.

**Funktionen:**
- Ändern des Anzeigenamens
- Anpassen der Stimmenanzahl
- Wechseln der Rolle (Teilnehmer/Gast)

## Warteraum

*Screenshot: waiting-room.png*

**Beschreibung:**
Übersicht aller Benutzer, die sich neu angemeldet haben und auf Freischaltung warten.

**Funktionen:**
- Liste der wartenden Benutzer
- Option zur Freischaltung als Teilnehmer oder Gast
- Möglichkeit zur Ablehnung unerwünschter Anmeldungen

## Abstimmungsverwaltung

### Abstimmungsübersicht
*Screenshot: poll-overview.png*

**Beschreibung:**
Liste aller erstellten Abstimmungen mit Status.

**Funktionen:**
- Übersicht aller Abstimmungen (aktiv, beendet, geplant)
- Status und Teilnahmestatistik
- Aktionen zum Starten, Bearbeiten oder Kopieren von Abstimmungen

### Abstimmung erstellen
*Screenshot: create-poll.png*

**Beschreibung:**
Formular zum Erstellen einer neuen Abstimmung.

**Funktionen:**
- Titel und Beschreibung festlegen
- Antwortoptionen definieren (vordefiniert oder individuell)
- Mehrfachauswahl aktivieren/deaktivieren
- Geheime oder offene Abstimmung konfigurieren
- Optionen zum Speichern oder direkten Starten

### Abstimmung bearbeiten
*Screenshot: edit-poll.png*

**Beschreibung:**
Bearbeitung einer bestehenden, noch nicht gestarteten Abstimmung.

**Funktionen:**
- Ändern aller Abstimmungsdetails
- Hinzufügen oder Entfernen von Antwortoptionen
- Anpassen des Abstimmungstyps

### Abstimmung kopieren
*Screenshot: copy-poll.png*

**Beschreibung:**
Erstellen einer Kopie einer bestehenden Abstimmung.

**Funktionen:**
- Übernahme aller Einstellungen
- Option zur Anpassung der Kopie
- Zeitersparnis bei ähnlichen Abstimmungen

### Aktive Abstimmung
*Screenshot: active-poll.png*

**Beschreibung:**
Ansicht während einer laufenden Abstimmung.

**Funktionen:**
- Echtzeit-Übersicht der abgegebenen Stimmen
- Status der Teilnahme (wer hat bereits abgestimmt)
- Option zum manuellen Beenden der Abstimmung

## Abstimmungsergebnisse

*Screenshot: poll-results.png*

**Beschreibung:**
Übersicht und Auswertung aller abgeschlossenen Abstimmungen.

**Funktionen:**
- Detaillierte Ergebnisdarstellung mit Prozentangaben
- Liste aller vergangenen Abstimmungen
- Export-Funktionen (CSV-Format)
  - Abstimmungsübersicht
  - Ergebnisse
  - Detaillierte Ergebnisse
  - Teilnehmerliste mit Stimmabgabe

## Videokonferenz-Integration

### Videokonferenz-Übersicht
*Screenshot: video-conference-overview.png*

**Beschreibung:**
Verwaltung der integrierten Videokonferenzsysteme.

**Funktionen:**
- Liste der konfigurierten Videokonferenzen
- Status der Integrationen
- Optionen zum Bearbeiten oder Erstellen

### Neue Videokonferenz
*Screenshot: create-video-conference.png*

**Beschreibung:**
Einrichtung einer neuen Videokonferenzintegration (aktuell nur Zoom).

**Funktionen:**
- API-Schlüssel und Zugangsdaten hinterlegen
- Konfiguration der Zoom-Integration
- Testfunktion für die Integration

## Organisatorprofil

*Screenshot: profile.png*

**Beschreibung:**
Verwaltung des eigenen Organisatorprofils.

**Funktionen:**
- Ändern der Kontaktdaten
- Passwort aktualisieren
- Benachrichtigungseinstellungen anpassen