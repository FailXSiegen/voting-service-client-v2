// minimal-doc.spec.js
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Ensure the screenshots directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

test('capture-login-page', async ({ page }) => {
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Capture login screen
  await page.goto(config.baseUrl);
  await page.waitForLoadState('networkidle');
  console.log('Taking login page screenshot');
  await page.screenshot({ path: path.join(config.outputDir, '01-login.png') });
  
  // Write description
  const loginDesc = `# Organisator-Login
  
**Beschreibung:**
Die Login-Seite ermöglicht Organisatoren den Zugang zu ihrem Dashboard und ihren Veranstaltungen.

**Funktionen:**
- Anmeldung mit E-Mail-Adresse/Benutzername und Passwort
- Zugang zum Organisator-Dashboard
- Link zum Passwort zurücksetzen
`;
  fs.writeFileSync(path.join(config.outputDir, '01-login.md'), loginDesc);
  
  // Create a mock dashboard description without actually logging in
  const dashboardDesc = `# Dashboard

**Beschreibung:**
Das Dashboard bietet einen Überblick über die wichtigsten Funktionen und Veranstaltungen.

**Funktionen:**
- Schnellzugriff auf die Veranstaltungsverwaltung
- Neuigkeiten und Updates zur Plattform
- Übersicht der wichtigsten Funktionen
`;
  fs.writeFileSync(path.join(config.outputDir, '02-dashboard.md'), dashboardDesc);
  
  // Create mock descriptions for other key pages
  const eventsDesc = `# Veranstaltungsübersicht

**Beschreibung:**
Die Veranstaltungsübersicht zeigt alle Ihre vergangenen und zukünftigen Veranstaltungen. Von hier aus können Sie Veranstaltungen verwalten, neue erstellen oder bestehende bearbeiten.

**Funktionen:**
- Liste aller Veranstaltungen mit Status und Datum
- Schnellfunktionen zum Kopieren des Einladungslinks
- Optionen zum Bearbeiten, Löschen und Verwalten von Veranstaltungen
- Button zum Erstellen einer neuen Veranstaltung
`;
  fs.writeFileSync(path.join(config.outputDir, '03-events.md'), eventsDesc);
  
  const newEventDesc = `# Veranstaltung erstellen

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
  fs.writeFileSync(path.join(config.outputDir, '04-new-event.md'), newEventDesc);
  
  const pollsDesc = `# Abstimmungsübersicht

**Beschreibung:**
Liste aller erstellten Abstimmungen mit Status.

**Funktionen:**
- Übersicht aller Abstimmungen (aktiv, beendet, geplant)
- Status und Teilnahmestatistik
- Aktionen zum Starten, Bearbeiten oder Kopieren von Abstimmungen
`;
  fs.writeFileSync(path.join(config.outputDir, '05-polls.md'), pollsDesc);
});