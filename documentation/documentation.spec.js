// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * This script captures screenshots of all organizer workflows and generates
 * documentation for the VotingTool application.
 */

// Ensure the screenshots directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

test.describe('Organizer Documentation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('01-login-and-dashboard', async ({ page }) => {
    // Capture login screen
    await page.goto(`${config.baseUrl}/`);
    await page.screenshot({ path: path.join(config.outputDir, '01-login.png') });
    
    // Login as organizer
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Verify we're at dashboard and capture screenshot
    await expect(page).toHaveURL(/.*\/admin/);
    await page.waitForSelector('.dashboard-container', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '02-dashboard.png') });

    // Write description to a text file
    const dashboardDesc = `# Dashboard

**Beschreibung:**
Das Dashboard bietet einen Überblick über Ihre Veranstaltungen, aktuelle Funktionen und Neuigkeiten.

**Funktionen:**
- Schnellzugriff auf Ihre Veranstaltungen
- Übersicht der neuesten Updates und Funktionen
- Schnellzugriff auf Hilfe und Support
`;
    fs.writeFileSync(path.join(config.outputDir, '02-dashboard.md'), dashboardDesc);
  });

  test('02-event-overview', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to event overview
    await page.goto(`${config.baseUrl}/admin/event`);
    await page.waitForSelector('.events-table', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '03-event-overview.png') });

    // Write description to a text file
    const eventOverviewDesc = `# Veranstaltungsübersicht

**Beschreibung:**
Die Veranstaltungsübersicht zeigt alle Ihre vergangenen und zukünftigen Veranstaltungen. Von hier aus können Sie Veranstaltungen verwalten, neue erstellen oder bestehende bearbeiten.

**Funktionen:**
- Liste aller Veranstaltungen mit Status und Datum
- Schnellfunktionen zum Kopieren des Einladungslinks
- Optionen zum Bearbeiten, Löschen und Verwalten von Veranstaltungen
- Button zum Erstellen einer neuen Veranstaltung
`;
    fs.writeFileSync(path.join(config.outputDir, '03-event-overview.md'), eventOverviewDesc);
  });

  test('03-create-event', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to create new event
    await page.goto(`${config.baseUrl}/admin/event/new`);
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '04-create-event.png') });

    // Write description to a text file
    const createEventDesc = `# Veranstaltung erstellen

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
`;
    fs.writeFileSync(path.join(config.outputDir, '04-create-event.md'), createEventDesc);
  });

  test('04-edit-event', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to edit event (using the eventId from config)
    await page.goto(`${config.baseUrl}/admin/event/edit/${config.eventId}`);
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '05-edit-event.png') });

    // Write description to a text file
    const editEventDesc = `# Veranstaltung bearbeiten

**Beschreibung:**
Hier können alle Einstellungen einer bestehenden Veranstaltung angepasst werden.

**Funktionen:**
- Ändern aller Veranstaltungsdetails
- Aktualisieren des Status (aktiv/inaktiv)
- Anpassen der Lobby-Einstellung
- Bearbeiten der Videokonferenz-Integration
`;
    fs.writeFileSync(path.join(config.outputDir, '05-edit-event.md'), editEventDesc);
  });

  test('05-member-management', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to member room (using the eventId from config)
    await page.goto(`${config.baseUrl}/admin/event/member-room/${config.eventId}`);
    await page.waitForSelector('.participant-list', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '06-member-overview.png') });

    // Write description to a text file
    const memberOverviewDesc = `# Teilnehmerverwaltung

**Beschreibung:**
Die Teilnehmerverwaltung zeigt alle registrierten Teilnehmer und Gäste der Veranstaltung mit ihren Rollen und Stimmenanzahl.

**Funktionen:**
- Liste aller Teilnehmer mit Namen, Status und Rolle
- Überblick über die Gesamtzahl der Teilnehmer und Stimmen
- Filter- und Suchfunktion
- Schnellaktionen zum Ändern der Teilnehmerrolle
`;
    fs.writeFileSync(path.join(config.outputDir, '06-member-overview.md'), memberOverviewDesc);

    // Click on "Neuer Teilnehmer" button to capture that screen
    await page.click('a:has-text("Neuer Teilnehmer")');
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '07-create-single-participant.png') });

    // Write description for single participant creation
    const createSingleParticipantDesc = `# Einzelnen Teilnehmer erstellen

**Beschreibung:**
Formular zum Anlegen eines einzelnen Teilnehmers.

**Funktionen:**
- Benutzername und Anzeigename festlegen
- Rolle (Teilnehmer/Gast) bestimmen
- Stimmenanzahl zuweisen
`;
    fs.writeFileSync(path.join(config.outputDir, '07-create-single-participant.md'), createSingleParticipantDesc);

    // Go back to member room
    await page.goto(`${config.baseUrl}/admin/event/member-room/${config.eventId}`);
    
    // Click on "Mehrere Teilnehmer" button to capture that screen
    await page.click('a:has-text("Mehrere Teilnehmer")');
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '08-create-multiple-participants.png') });

    // Write description for multiple participant creation
    const createMultipleParticipantsDesc = `# Mehrere Teilnehmer erstellen

**Beschreibung:**
Funktion zum Importieren mehrerer Teilnehmer gleichzeitig.

**Funktionen:**
- Import per Textfeld (z.B. aus Excel/Tabelle kopieren)
- Massenzuweisung der Rolle und Stimmenanzahl
- Vorschau der zu importierenden Teilnehmer
`;
    fs.writeFileSync(path.join(config.outputDir, '08-create-multiple-participants.md'), createMultipleParticipantsDesc);

    // Go back to member room
    await page.goto(`${config.baseUrl}/admin/event/member-room/${config.eventId}`);
    
    // Click on first participant's edit button
    await page.click('.participant-list .edit-button:first-child');
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '09-edit-participant.png') });

    // Write description for participant editing
    const editParticipantDesc = `# Teilnehmer bearbeiten

**Beschreibung:**
Bearbeitungsmaske für einen einzelnen Teilnehmer.

**Funktionen:**
- Ändern des Anzeigenamens
- Anpassen der Stimmenanzahl
- Wechseln der Rolle (Teilnehmer/Gast)
`;
    fs.writeFileSync(path.join(config.outputDir, '09-edit-participant.md'), editParticipantDesc);
  });

  test('06-lobby-room', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to lobby room (using the eventId from config)
    await page.goto(`${config.baseUrl}/admin/event/lobby-room/${config.eventId}`);
    await page.waitForSelector('.lobby-container', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '10-waiting-room.png') });

    // Write description for waiting room
    const waitingRoomDesc = `# Warteraum

**Beschreibung:**
Übersicht aller Benutzer, die sich neu angemeldet haben und auf Freischaltung warten.

**Funktionen:**
- Liste der wartenden Benutzer
- Option zur Freischaltung als Teilnehmer oder Gast
- Möglichkeit zur Ablehnung unerwünschter Anmeldungen
`;
    fs.writeFileSync(path.join(config.outputDir, '10-waiting-room.md'), waitingRoomDesc);
  });

  test('07-poll-management', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to polls overview (using the eventId from config)
    await page.goto(`${config.baseUrl}/admin/event/polls/${config.eventId}`);
    await page.waitForSelector('.polls-container', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '11-poll-overview.png') });

    // Write description for poll overview
    const pollOverviewDesc = `# Abstimmungsübersicht

**Beschreibung:**
Liste aller erstellten Abstimmungen mit Status.

**Funktionen:**
- Übersicht aller Abstimmungen (aktiv, beendet, geplant)
- Status und Teilnahmestatistik
- Aktionen zum Starten, Bearbeiten oder Kopieren von Abstimmungen
`;
    fs.writeFileSync(path.join(config.outputDir, '11-poll-overview.md'), pollOverviewDesc);

    // Go to create new poll
    await page.click('a:has-text("Neue Abstimmung")');
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '12-create-poll.png') });

    // Write description for poll creation
    const createPollDesc = `# Abstimmung erstellen

**Beschreibung:**
Formular zum Erstellen einer neuen Abstimmung.

**Funktionen:**
- Titel und Beschreibung festlegen
- Antwortoptionen definieren (vordefiniert oder individuell)
- Mehrfachauswahl aktivieren/deaktivieren
- Geheime oder offene Abstimmung konfigurieren
- Optionen zum Speichern oder direkten Starten
`;
    fs.writeFileSync(path.join(config.outputDir, '12-create-poll.md'), createPollDesc);

    // Add description for active poll (we won't capture this in the test as it requires starting a poll)
    const activePollDesc = `# Aktive Abstimmung

**Beschreibung:**
Ansicht während einer laufenden Abstimmung.

**Funktionen:**
- Echtzeit-Übersicht der abgegebenen Stimmen
- Status der Teilnahme (wer hat bereits abgestimmt)
- Option zum manuellen Beenden der Abstimmung
`;
    fs.writeFileSync(path.join(config.outputDir, '13-active-poll.md'), activePollDesc);
  });

  test('08-poll-results', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to poll results (using the eventId from config)
    await page.goto(`${config.baseUrl}/admin/event/poll-results/${config.eventId}`);
    await page.waitForSelector('.results-container', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '14-poll-results.png') });

    // Write description for poll results
    const pollResultsDesc = `# Abstimmungsergebnisse

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
`;
    fs.writeFileSync(path.join(config.outputDir, '14-poll-results.md'), pollResultsDesc);
  });

  test('09-video-conference', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to video conference overview
    await page.goto(`${config.baseUrl}/admin/video-conference`);
    await page.waitForSelector('.video-conferences', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '15-video-conference-overview.png') });

    // Write description for video conference overview
    const videoConferenceDesc = `# Videokonferenz-Integration

**Beschreibung:**
Verwaltung der integrierten Videokonferenzsysteme.

**Funktionen:**
- Liste der konfigurierten Videokonferenzen
- Status der Integrationen
- Optionen zum Bearbeiten oder Erstellen
`;
    fs.writeFileSync(path.join(config.outputDir, '15-video-conference-overview.md'), videoConferenceDesc);

    // Go to create new video conference
    await page.goto(`${config.baseUrl}/admin/video-conference/new`);
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '16-create-video-conference.png') });

    // Write description for creating video conference
    const createVideoConferenceDesc = `# Neue Videokonferenz

**Beschreibung:**
Einrichtung einer neuen Videokonferenzintegration (aktuell nur Zoom).

**Funktionen:**
- API-Schlüssel und Zugangsdaten hinterlegen
- Konfiguration der Zoom-Integration
- Testfunktion für die Integration
`;
    fs.writeFileSync(path.join(config.outputDir, '16-create-video-conference.md'), createVideoConferenceDesc);
  });

  test('10-profile', async ({ page }) => {
    // Login first
    await page.goto(`${config.baseUrl}/`);
    await page.fill('input[name="email"]', config.credentials.email);
    await page.fill('input[name="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Go to profile page
    await page.goto(`${config.baseUrl}/admin/profile`);
    await page.waitForSelector('.profile-form', { timeout: 5000 });
    await page.screenshot({ path: path.join(config.outputDir, '17-profile.png') });

    // Write description for profile
    const profileDesc = `# Organisatorprofil

**Beschreibung:**
Verwaltung des eigenen Organisatorprofils.

**Funktionen:**
- Ändern der Kontaktdaten
- Passwort aktualisieren
- Benachrichtigungseinstellungen anpassen
`;
    fs.writeFileSync(path.join(config.outputDir, '17-profile.md'), profileDesc);
  });
});