# Organisator-Workflow Dokumentation

Dieses Verzeichnis enthält Skripte und Werkzeuge zum automatischen Generieren einer umfassenden Dokumentation des Organisator-Workflows im VotingTool.

## Überblick

Die Dokumentation besteht aus zwei Hauptkomponenten:

1. **Screenshots aller Organisator-Seiten** - Automatisch erstellt mit Playwright
2. **Beschreibungen der Funktionen** - Markdown-Dateien mit detaillierten Erklärungen

## Voraussetzungen

- Node.js (>= 14)
- Playwright installiert (`npm install -D @playwright/test`)
- Playwright Browser installiert (`npx playwright install`)

## Verzeichnisstruktur

- `README.md` - Diese Datei
- `config.js` - Konfigurationsdatei für Testdaten (Zugangsdaten, Test-Event-ID, etc.)
- `generate-organizer-docs.js` - Playwright-Skript zur Erstellung der Screenshots und MD-Dateien
- `organizer-documentation.md` - Übergeordnete Dokumentationsdatei
- `run-documentation.sh` - Hilfsskript zum Ausführen der Dokumentationserstellung
- `screenshots/` - Ausgabeverzeichnis für Screenshots (wird automatisch erstellt)
- `docs/` - Ausgabeverzeichnis für zusammengeführte Dokumentation (wird automatisch erstellt)

## Konfiguration anpassen

Bevor Sie die Dokumentation generieren, müssen Sie die Datei `config.js` anpassen:

```javascript
module.exports = {
  // Playwright test configuration
  baseUrl: 'http://192.168.178.142:5173', // Update to match your application URL
  
  // Organizer test account credentials
  credentials: {
    email: 'YOUR_ORGANIZER_EMAIL', // Ersetzen mit Test-Organisator-E-Mail
    password: 'YOUR_PASSWORD',      // Ersetzen mit Test-Organisator-Passwort
  },
  
  // Test event ID - an existing event to use for documentation
  eventId: 'YOUR_TEST_EVENT_ID',    // Ersetzen mit einer existierenden Event-ID
  
  // Output directory for screenshots
  outputDir: 'screenshots'
};
```

## Dokumentation generieren

Um die Dokumentation zu generieren, führen Sie folgende Schritte aus:

1. Stellen Sie sicher, dass die VotingTool-Anwendung lokal läuft und unter der in `config.js` angegebenen URL erreichbar ist.

2. Machen Sie das Bash-Skript ausführbar:
   ```bash
   chmod +x run-documentation.sh
   ```

3. Führen Sie das Skript aus:
   ```bash
   ./run-documentation.sh
   ```

Dieses Skript wird:
- Die Playwright-Tests ausführen, um Screenshots zu erstellen
- Markdown-Dateien mit Funktionsbeschreibungen generieren
- Alles in eine vollständige Dokumentationsdatei zusammenführen

## Anpassen der Dokumentation

Die Dokumentation ist modular aufgebaut:

- Jeder Test im Playwright-Skript erzeugt einen entsprechenden Screenshot und eine Markdown-Datei.
- Die Beschreibungen können direkt im Playwright-Skript angepasst werden, indem die entsprechenden Strings geändert werden.
- Für größere strukturelle Änderungen können Sie die Datei `organizer-documentation.md` anpassen, die als Basis für die Dokumentation dient.

## Fehlerbehandlung

Falls bei der Ausführung Fehler auftreten:

1. **Selektoren-Fehler**: Die Selektoren im Playwright-Skript (z.B. `.dashboard-container`, `.events-table`) müssen eventuell an die aktuelle Anwendungsversion angepasst werden.

2. **Timeout-Fehler**: Erhöhen Sie den Timeout-Wert in den `waitForSelector`-Aufrufen, falls Seiten langsamer laden.

3. **Authentifizierungsfehler**: Stellen Sie sicher, dass die Zugangsdaten in `config.js` korrekt sind.

## Weitere Dokumentation

Nach der vollständigen Generierung der Organisator-Dokumentation kann ein ähnlicher Prozess für den Teilnehmer-Workflow implementiert werden.