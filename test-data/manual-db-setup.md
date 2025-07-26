# Manuelle Datenbank-Setup Alternative

Falls die GitLab Pipeline-Jobs nicht funktionieren (wegen Shell-Executor), hier die manuellen Befehle:

## 🔧 Direkt auf dem Server ausführen

### 1. Backup erstellen
```bash
# SSH auf den Server
ssh user@voting.failx.de

# Ins Deployment-Verzeichnis
cd /var/www/html/voting-tool

# Backup-Verzeichnis erstellen
mkdir -p /var/www/html/voting-tool-backups

# Backup erstellen
BACKUP_FILE="/var/www/html/voting-tool-backups/voting-db-backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T db mysqldump -u root -p'YOUR_ROOT_PASSWORD' voting_db > $BACKUP_FILE

# Prüfen
ls -lah $BACKUP_FILE
echo "Backup erstellt: $BACKUP_FILE"
```

### 2. Testdaten importieren
```bash
# SQL-Datei auf Server kopieren (via git pull oder scp)
cd /var/www/html/voting-tool

# Wenn git repo vorhanden:
git pull origin main

# Testdaten importieren
docker compose exec -T db mysql -u root -p'YOUR_ROOT_PASSWORD' voting_db < test-data/load-test-scenario.sql

# Prüfen ob Import erfolgreich
docker compose exec -T db mysql -u root -p'YOUR_ROOT_PASSWORD' voting_db -e "
SELECT 
  'Organizer' as Type, COUNT(*) as Count 
FROM organizer 
WHERE username LIKE 'loadtest%'
UNION ALL
SELECT 
  'Event' as Type, COUNT(*) as Count 
FROM event 
WHERE slug = 'lasttest-2025'
UNION ALL
SELECT 
  'Users' as Type, COUNT(*) as Count 
FROM event_user 
WHERE event_id = (SELECT id FROM event WHERE slug = 'lasttest-2025')
UNION ALL
SELECT 
  'Polls' as Type, COUNT(*) as Count 
FROM poll 
WHERE event_id = (SELECT id FROM event WHERE slug = 'lasttest-2025');
"
```

### 3. Nach Tests: Backup wiederherstellen
```bash
# Backup wiederherstellen
cd /var/www/html/voting-tool
docker compose exec -T db mysql -u root -p'YOUR_ROOT_PASSWORD' voting_db < $BACKUP_FILE

# Prüfen ob Testdaten weg sind
docker compose exec -T db mysql -u root -p'YOUR_ROOT_PASSWORD' voting_db -e "
SELECT COUNT(*) as remaining_test_users 
FROM event_user 
WHERE event_id = (SELECT id FROM event WHERE slug = 'lasttest-2025');
"
```

## 🚀 Lokale Tests ausführen

Nach dem Import auf dem Server:

```bash
# Auf deiner lokalen Maschine:
cd voting-tool/test-data
./run-local-against-server.sh

# Oder manuell:
cd voting-service-client-v2
export TEST_BASE_URL="https://voting.failx.de"
export TEST_EVENT_SLUG="lasttest-2025"

# Standard Test (100 Nutzer)
npx playwright test tests/load-test/load-test.spec.js --reporter=html

# Stress Test (200 Nutzer)  
npx playwright test tests/load-test/load-test-stress.spec.js --reporter=html

# Weighted Test (50 Nutzer)
npx playwright test tests/load-test/load-test-weighted.spec.js --reporter=html

# Reports anzeigen
npx playwright show-report
```

## 🔍 Test-Monitoring

### Während der Tests auf dem Server:
```bash
# CPU/RAM überwachen
htop

# Docker Container überwachen  
docker stats

# Netzwerk-Verbindungen
netstat -tuln | grep :80
netstat -tuln | grep :443

# Logs überwachen
docker compose logs -f api
docker compose logs -f db

# MySQL-Prozesse
docker compose exec db mysql -u root -p'YOUR_ROOT_PASSWORD' -e "SHOW PROCESSLIST;"
```

### Test-Ergebnisse
Nach dem Test findest du die Ergebnisse lokal in:
- `voting-results/` - JSON-Rohdaten
- `playwright-report/` - HTML-Report
- `test-results/` - Screenshots bei Fehlern

## ⚠️ Wichtige Hinweise

1. **Passwörter anpassen**: Ersetze `YOUR_ROOT_PASSWORD` mit dem echten Passwort
2. **Backup-Pfad merken**: Notiere dir den `$BACKUP_FILE` Pfad für später
3. **Tests beobachten**: Überwache Server-Ressourcen während der Tests
4. **Cleanup**: Vergiss nicht das Backup nach den Tests wiederherzustellen

## 🐛 Troubleshooting

### DB-Verbindung fehlgeschlagen:
```bash
# Docker Container Status prüfen
docker compose ps

# DB Container neustarten
docker compose restart db

# DB Logs prüfen
docker compose logs db
```

### Import-Fehler:
```bash
# SQL-Syntax prüfen
head -20 test-data/load-test-scenario.sql

# Manuell importieren und Fehler anzeigen
docker compose exec -i db mysql -u root -p'YOUR_ROOT_PASSWORD' voting_db < test-data/load-test-scenario.sql
```

### Tests schlagen fehl:
```bash
# Event-URL prüfen
curl -I https://voting.failx.de/#/register/lasttest-2025

# DNS/Netzwerk prüfen
ping voting.failx.de
```