# Abstimmungs-Loadtest

Dieses Projekt enthält einen Loadtest für ein Abstimmungssystem, optimiert für die gleichzeitige Verwendung durch viele Benutzer. Der Test verwendet Playwright, um einen Organisator und mehrere Teilnehmer zu simulieren, die bei einer Abstimmung teilnehmen.

## Hauptmerkmale

- **Batch-Abstimmung**: Abstimmungen werden in konfigurierbaren Batches von 25 Benutzern ausgeführt, um Systemüberlastungen zu vermeiden
- **Robustes Fehlerhandling**: Umfangreiche Strategien zur Erkennung und Fehlerbehandlung
- **Parallele Tests**: Mehrere Tests werden parallel ausgeführt, um die Gesamtlast zu erhöhen
- **Automatische Screenshots**: Wichtige Schritte und Fehler werden mit Screenshots dokumentiert
- **Detaillierte Ergebnisberichte**: Alle Teilergebnisse werden für die spätere Analyse gespeichert

## Projektstruktur

Das Projekt ist in mehrere Module aufgeteilt:

- `config.js` - Zentrale Konfigurationsdatei
- `utils.js` - Gemeinsam genutzte Hilfsfunktionen
- `loginOrganizer.js` - Funktionen zum Einloggen des Organisators und Erstellen von Abstimmungen# Abstimmungs-Loadtest

Dieses Projekt enthält einen Loadtest für ein Abstimmungssystem, optimiert für die gleichzeitige Verwendung durch viele Benutzer. Der Test verwendet Playwright, um einen Organisator und mehrere Teilnehmer zu simulieren, die bei einer Abstimmung teilnehmen.

## Hauptmerkmale

- **Batch-Abstimmung**: Abstimmungen werden in konfigurierbaren Batches von 25 Benutzern ausgeführt, um Systemüberlastungen zu vermeiden
- **Robustes Fehlerhandling**: Umfangreiche Strategien zur Erkennung und Fehlerbehandlung
- **Parallele Tests**: Mehrere Tests werden parallel ausgeführt, um die Gesamtlast zu erhöhen
- **Automatische Screenshots**: Wichtige Schritte und Fehler werden mit Screenshots dokumentiert
- **Detaillierte Ergebnisberichte**: Alle Teilergebnisse werden für die spätere Analyse gespeichert

## Projektstruktur

Das Projekt ist in mehrere Module aufgeteilt:

- `config.js` - Zentrale Konfigurationsdatei
- `utils.js` - Gemeinsam genutzte Hilfsfunktionen
- `loginOrganizer.js` - Funktionen zum Einloggen des Organisators und Erstellen von Abstimmungen
- `loginUser.js` - Funktionen zum Einloggen der Benutzer
- `votingFunctions.js` - Funktionen für die Abstimmung in Batches
- `load-test.spec.js` - Haupttestskript

## Konfigurationsoptionen

Die wichtigsten Konfigurationsparameter in `config.js`:

- `MAX_USERS_PER_TEST`: Gesamtzahl der Teilnehmer (Standard: 150)
- `VOTE_BATCH_SIZE`: Anzahl der gleichzeitigen Abstimmungen pro Batch (Standard: 25)
- `BATCH_VOTE_DELAY`: Verzögerung zwischen Abstimmungsbatches in ms (Standard: 5000)
- `CONCURRENT_LOGINS`: Anzahl gleichzeitiger Logins pro Gruppe (Standard: 25)
- `API_URL` und `CLIENT_URL`: URLs für den API-Server und Client
- `EVENT_SLUG` und `EVENT_ID`: Veranstaltungsinformationen

## Ausführung

Um den Test auszuführen:

```bash
npx playwright test load-test.spec.js --workers=4
```

## Ergebnisse

- Ergebnisdateien werden im Verzeichnis `voting-results` gespeichert
- Screenshots werden im Verzeichnis `test-results` gespeichert

## Optimierungen

1. **Gestaffelte Abstimmung**: Benutzer stimmen in konfigurierbaren Batches ab, um die Serverlast zu reduzieren
2. **Verbesserte Modalerkennung**: Mehrere Strategien zur Erkennung des Abstimmungs-Modals
3. **Umfangreiche Selektoren**: Verschiedene Selektoren für Formularfelder und Buttons, um mit Änderungen umzugehen
4. **Mehrstufige Erfolgsvalidierung**: Mehrere Methoden zur Überprüfung erfolgreicher Abstimmungen
5. **Automatische Wiederholungsversuche**: Fehlgeschlagene Abstimmungen werden automatisch wiederholt