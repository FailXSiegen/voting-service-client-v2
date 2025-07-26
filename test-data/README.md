# Voting Tool - Test-Szenarien Dokumentation

## Übersicht

Diese Test-Suite ermöglicht umfassende Last- und Performance-Tests des Voting Tools über die GitLab CI/CD Pipeline.

## Verfügbare Test-Szenarien

### Pipeline-Optimierte Tests (GitLab CI)
**⚠️ WICHTIG**: GitLab Runner haben begrenzte Ressourcen! Die Tests wurden für Container optimiert.

#### Ressourcen-Limits:
- Max. 3 Browser gleichzeitig
- 512 MB RAM pro Browser
- Keine parallelen Tests
- Reduzierte Viewport-Größe (640x480)

### 1. Standard Load Test 
- **Pipeline**: 20 Nutzer (optimiert für GitLab Runner)
- **Lokal**: 100 Nutzer (volle Last)
- **Datei**: `voting-service-client-v2/tests/load-test/load-test.spec.js`
- **Konfiguration**: 
  - Pipeline: `config-pipeline.js` (20 User, 3 concurrent)
  - Lokal: `config.js` (100 User, 25 concurrent)

### 2. Stress Test
- **Pipeline**: 30 Nutzer (Maximum für Container)
- **Lokal**: 200 Nutzer
- **Datei**: `voting-service-client-v2/tests/load-test/load-test-stress.spec.js`
- **Warnung**: Kann in Pipeline zu Timeouts führen!

### 3. Weighted Vote Test
- **Pipeline**: 20 Nutzer mit Gewichtung
- **Lokal**: 50 Nutzer
- **Datei**: `voting-service-client-v2/tests/load-test/load-test-weighted.spec.js`
- **Verteilung angepasst für Pipeline:
  - 12 Nutzer mit 1 Stimme
  - 6 Nutzer mit 3 Stimmen  
  - 2 Nutzer mit 5 Stimmen

## Test-Ausführung (Empfohlener Workflow)

### 🎯 **Empfohlen**: Lokaler Client vs. Remote Server

Für realistische Lasttests den Server nicht mit Test-Ausführung belasten:

#### 1. Server vorbereiten (GitLab)
```bash
# In GitLab Pipeline manuell ausführen:
1. backup_database     # Backup erstellen
2. import_test_data    # Testdaten importieren
# ❌ NICHT run_load_tests ausführen!
```

#### 2. Tests lokal ausführen
```bash
# Auf deiner lokalen Maschine:
cd voting-tool/test-data
./run-local-against-server.sh

# Oder manuell:
cd voting-service-client-v2
export TEST_BASE_URL="https://voting.failx.de"
export TEST_EVENT_SLUG="lasttest-2025"
npx playwright test tests/load-test/ --reporter=html
```

#### 3. Server aufräumen (GitLab)
```bash
# Nach Tests in GitLab:
3. restore_database    # Original-DB wiederherstellen
```

### 📊 **Alternative**: Pipeline-Tests (Ressourcen-limitiert)

Nur wenn lokale Tests nicht möglich sind:

#### Pipeline-Jobs (alle manuell):

1. **`backup_database`** - DB-Backup erstellen
2. **`import_test_data`** - Testdaten importieren  
3. **`run_load_tests`** - Tests ausführen (20 Nutzer!)
4. **`run_performance_test`** - Performance-Monitoring
5. **`restore_database`** - DB wiederherstellen

⚠️ **Warnung**: Pipeline-Tests sind auf 20-30 Nutzer limitiert!

## Lokale Test-Ausführung

### Voraussetzungen
```bash
cd voting-service-client-v2
npm install
npx playwright install chromium
```

### Tests lokal ausführen
```bash
# Einzelnen Test ausführen
npx playwright test tests/load-test/load-test.spec.js

# Alle Load-Tests
npx playwright test tests/load-test/

# Mit UI (zum Debuggen)
npx playwright test --ui

# Mit HTML-Report
npx playwright test --reporter=html
```

### Konfiguration anpassen

#### Für Pipeline (GitLab CI):
```javascript
// config-pipeline.js wird automatisch verwendet
const CONFIG = {
  MAX_USERS_PER_TEST: 20,     // Reduziert!
  CONCURRENT_LOGINS: 3,       // Max 3 Browser gleichzeitig
  VOTE_BATCH_SIZE: 5,         // Kleine Batches
  // ...
};
```

#### Für lokale Tests:
```javascript
// config.js für volle Last
const CONFIG = {
  MAX_USERS_PER_TEST: 100,    // Volle Anzahl
  CONCURRENT_LOGINS: 25,      // Mehr Browser möglich
  VOTE_BATCH_SIZE: 50,        // Größere Batches
  // ...
};
```

#### Pipeline vs. Lokal:
| Einstellung | Pipeline | Lokal |
|------------|----------|-------|
| Max. Nutzer | 20-30 | 100-200 |
| Gleichzeitige Browser | 3 | 25+ |
| Worker | 1 | CPU-Kerne |
| RAM pro Browser | 512 MB | 2 GB |
| Viewport | 640x480 | 800x600 |

## Test-Datenbank

### SQL-Struktur (`test-data/load-test-scenario.sql`)
1. **Admin-Account**: 
   - Username: `loadtest-admin`
   - Für manuelle Inspektion während Tests

2. **Testnutzer** (200):
   - `testuser1` - `testuser170`: 1 Stimme
   - `testuser171` - `testuser195`: 3-5 Stimmen
   - `testuser196` - `testuser200`: Keine Stimmrechte

3. **Abstimmungen**:
   - Geheime Ja/Nein/Enthaltung
   - Offene Multiple-Choice (5 Optionen)

## Ergebnis-Analyse

### Generierte Reports
Nach Test-Ausführung in GitLab:
- `voting-results/` - Rohdaten als JSON
- `test-reports/` - Formatierte Reports
  - `report.html` - Visueller Report
  - `summary.json` - Zusammenfassung
  - `performance.json` - Performance-Metriken
  - `login-times.csv` - Login-Zeiten
  - `voting-times.csv` - Abstimmungszeiten
  - `junit.xml` - GitLab Test-Report

### Metriken
- **Login-Performance**: P50, P90, P95, P99 Perzentile
- **Voting-Performance**: Erfolgsrate, Durchsatzrate
- **Fehleranalyse**: Fehlertypen und -häufigkeit
- **Timeline**: Chronologischer Ablauf

## Best Practices

1. **Vor jedem Test**:
   - Backup erstellen
   - Sicherstellen, dass keine echten Nutzer online sind

2. **Test-Reihenfolge**:
   - Erst Standard-Test (Baseline)
   - Dann Stress-Test (Grenzen)
   - Zuletzt spezielle Tests

3. **Nach den Tests**:
   - Ergebnisse sichern
   - Datenbank wiederherstellen
   - Logs prüfen

## Troubleshooting

### Häufige Probleme

1. **"Keine Abstimmung gefunden"**
   - Organizer hat Poll nicht gestartet
   - Timing-Problem zwischen Organizer und Nutzern

2. **Hohe Fehlerrate bei Logins**
   - Datenbank-Überlastung
   - `CONCURRENT_LOGINS` reduzieren

3. **Browser-Crashes**
   - Speicher-Limit erreicht
   - Weniger parallele Browser verwenden

### Debug-Optionen
```javascript
// In config.js aktivieren:
DEBUG_MODE: true,
SCREENSHOT_ON_ERROR: true,
VERBOSE_LOGGING: true
```

## Wartung

### Testdaten aktualisieren
1. `test-data/load-test-scenario.sql` bearbeiten
2. Neue Nutzer/Abstimmungen hinzufügen
3. Pipeline-Job testen

### Neue Test-Szenarien
1. Kopiere vorhandenen Test als Vorlage
2. Passe Konfiguration an
3. Füge zu `.gitlab-ci.yml` hinzu

## Kontakt

Bei Fragen oder Problemen:
- GitLab Issues erstellen
- Logs und Screenshots anhängen
- Test-Konfiguration angeben