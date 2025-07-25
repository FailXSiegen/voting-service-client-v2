# Voting Tool Deployment

## Übersicht

Das Voting Tool wird automatisch über GitLab CI/CD gebaut und auf dem Hetzner Server deployed. Bei jedem Commit auf den `main` Branch werden Docker Images gebaut und können manuell deployed werden.

## Architektur

Das Voting Tool besteht aus drei Hauptkomponenten:

1. **API Service** (Node.js/Express/GraphQL)
   - Port: 4000
   - GraphQL Endpoint: `/graphql`
   - WebSocket Support für Echtzeitfunktionen

2. **Client Service** (Vue.js SPA mit Nginx)
   - Port: 80 (intern), 443 (extern über Traefik)
   - Static Files werden von Nginx serviert

3. **Database Service** (MariaDB)
   - Port: 3306
   - Persistente Daten in Docker Volume

## CI/CD Pipeline

### Automatisches Build

Bei jedem Push auf `main` oder bei Merge Requests werden automatisch neue Docker Images gebaut:

- API Image: `registry.failx.de/voting-tool/api:latest`
- Client Image: `registry.failx.de/voting-tool/client:latest`

### Manuelles Deployment

Das Deployment erfolgt manuell über die GitLab Pipeline:

1. Gehe zu GitLab → CI/CD → Pipelines
2. Wähle die gewünschte Pipeline
3. Klicke auf "deploy_voting_tool" → "Play"

## Lokaler Test

Um das Voting Tool lokal zu testen:

```bash
cd voting-tool
./test-local.sh
```

Dies startet alle Container lokal und führt Gesundheitstests durch.

Zugriff:
- Client: http://localhost:8080
- API: http://localhost:4000/graphql
- Database: localhost:3306

Stoppen:
```bash
docker compose -f docker-compose.test.yml down
```

## Umgebungsvariablen

Folgende Variablen müssen in GitLab CI/CD konfiguriert sein:

- `VOTING_DB_USER` - Datenbank Benutzer
- `VOTING_DB_PASSWORD` - Datenbank Passwort
- `VOTING_DB_NAME` - Datenbank Name
- `VOTING_DB_ROOT_PASSWORD` - Root Passwort für MariaDB
- `VOTING_JWT_SECRET` - JWT Secret für Authentication
- `VOTING_EMAIL_HOST` - SMTP Server
- `VOTING_EMAIL_PORT` - SMTP Port
- `VOTING_EMAIL_USER` - SMTP Benutzer
- `VOTING_EMAIL_PASSWORD` - SMTP Passwort

## Netzwerk

Das Voting Tool nutzt zwei Docker Networks:

1. `voting_network` - Internes Netzwerk für Container-Kommunikation
2. `gitlab-setup_traefik` - Externes Netzwerk für Traefik Reverse Proxy

## Traefik Integration

Die Services werden automatisch über Traefik exponiert:

- API Routen: `/api`, `/graphql`, `/login`, `/organizer`, etc.
- Client: Alle anderen Routen
- SSL-Zertifikate werden automatisch über Let's Encrypt generiert

### WebSocket Support

Das Voting Tool nutzt WebSockets für Echtzeitfunktionen (Live-Abstimmungen). Die WebSocket-Verbindung läuft über den gleichen `/graphql` Endpoint mit automatischem Upgrade.

Traefik-Konfiguration für WebSockets:
- Automatisches Protocol-Upgrade von HTTP zu WebSocket
- Keep-Alive Headers für stabile Verbindungen
- SSL/TLS für sichere WebSocket-Verbindungen (wss://)

Test der WebSocket-Verbindung:
```bash
# Basis WebSocket Test
cd voting-tool
npm install ws
node test-websocket.js

# Umfassender Health Check
node healthcheck-websocket.js

# Vollständige Test Suite
./test-websocket-suite.sh

# Mit wscat (manuell)
npm install -g wscat
wscat -c wss://voting.failx.de/graphql -s graphql-ws
```

### WebSocket Tests und Monitoring

Das System verfügt über umfassende WebSocket-Tests:

**Health Checks:**
- HTTP + WebSocket + Datenbank Verbindung
- Automatische Timeouts und Retry-Logik
- Detaillierte Fehleranalyse

**Test-Coverage:**
- API WebSocket Tests (`tests/websocket.test.js`)
- Client Integration Tests (`voting-service-client-v2/tests/websocket-client.test.js`)
- E2E Browser Tests (`tests/e2e-websocket.test.js`)
- Load Testing für mehrere gleichzeitige Verbindungen

**Automatische Tests:**
```bash
# Lokaler Test mit WebSocket-Checks
./test-local.sh

# Vollständige Test-Suite
./test-websocket-suite.sh
```

## Troubleshooting

### Container Status prüfen
```bash
docker ps | grep voting
```

### Logs anzeigen
```bash
docker logs voting_api -f
docker logs voting_client -f
docker logs voting_db -f
```

### Datenbank-Verbindung testen
```bash
docker exec voting_db mysql -uvoting_user -p -e "SELECT 1;" voting_db
```

### Netzwerk-Kommunikation testen
```bash
docker exec voting_api nc -zv db 3306
docker exec voting_api nc -zv client 80
```

### WebSocket-spezifische Troubleshooting

**WebSocket Verbindungsprobleme:**
```bash
# WebSocket Health Check
docker exec voting_api node /app/healthcheck.js api

# Manuelle WebSocket-Verbindung testen
docker exec voting_api node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4000/graphql', {
  headers: { 'Sec-WebSocket-Protocol': 'graphql-ws' }
});
ws.on('open', () => console.log('WebSocket OK'));
ws.on('error', (e) => console.error('WebSocket Error:', e.message));
"
```

**Traefik WebSocket Routing prüfen:**
```bash
# Check Traefik logs for WebSocket upgrades
docker logs traefik | grep -i websocket

# Check container labels
docker inspect voting_api | grep -A 20 Labels
```

**Browser WebSocket Debug:**
```javascript
// In Browser Console
window.websocketEvents // Shows WebSocket events if test page loaded
```

## Rollback

Bei Problemen kann über die GitLab Pipeline ein Rollback durchgeführt werden:

1. GitLab → CI/CD → Pipelines
2. "rollback" Job → "Play"

Alternativ manuell:
```bash
cd /var/www/html/voting-tool
cp docker-compose.yml.backup.* docker-compose.yml
docker compose up -d
```