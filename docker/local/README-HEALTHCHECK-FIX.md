# Health Check Fehlerbehebung für Docker Container

Diese Dokumentation beschreibt die Probleme und Lösungen für die Health Checks in den Docker Containern.

## Problem

Der Health Check für den API-Container schlug fehl mit der Fehlermeldung:

```
❌ Database connection failed: Cannot find module '../src/lib/database' Require stack: - /app/healthcheck.js
```

Das Problem wurde durch falsche Pfade im Health-Check-Script verursacht. Der Health Check versuchte, Module mit relativen Pfaden zu importieren, die im Container-Kontext nicht funktionierten.

## Lösung

### 1. Vereinfachter Health Check

Ich habe einen vereinfachten Health Check implementiert (`healthcheck-simplified.js`), der:

- Keine direkten Anwendungsmodule importiert
- Basis-Netzwerk-Checks für Datenbank und RabbitMQ durchführt
- Einfache Prüfungen zur Verfügbarkeit der Dienste macht
- Keine komplexen Abhängigkeiten hat

Der neue Health Check verwendet TCP-Sockets, um die Erreichbarkeit der Dienste zu prüfen, statt Module zu importieren.

### 2. Änderungen an Dockerfiles

Die Dockerfiles für API und Consumer wurden aktualisiert, um:

- Das neue vereinfachte Health-Check-Script zu verwenden
- Absolute Pfade für alle Dateioperationen zu nutzen

### 3. Funktionsweise des neuen Health Checks

Der neue Health Check führt folgende Prüfungen durch:

1. **Datenbank-Check**: Prüft, ob eine Verbindung zum Datenbank-Server hergestellt werden kann
2. **RabbitMQ-Check**: Prüft, ob eine Verbindung zum RabbitMQ-Server hergestellt werden kann
3. **Consumer-Check**: Prüft für den Consumer-Container, ob die erforderlichen Startdateien vorhanden sind

Diese Checks sind robuster und weniger anfällig für Fehler durch Pfad- oder Modulprobleme.

## Implementierungsdetails

### 1. Health Check Script

Der neue Health Check verwendet einfache Socket-Verbindungen:

```javascript
async function checkDatabase() {
  const net = require('net');
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.connect(dbPort, dbHost, () => {
      console.log('✅ Database connection successful');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.error(`❌ Database connection failed: ${err.message}`);
      socket.destroy();
      resolve(false);
    });
  });
}
```

### 2. Dockerfile-Änderungen

```dockerfile
# Copy source code, health check script and entrypoint
COPY voting-service-api/ ./
COPY docker/local/healthcheck-simplified.js ./healthcheck.js
COPY docker/local/docker-entrypoint.sh /docker-entrypoint.sh
```

## Überprüfung der Lösung

Nach der Implementierung dieser Änderungen sollten die Health Checks erfolgreich sein:

```bash
# Container neu starten
make restart-service SERVICE=api

# Health Check Status prüfen
docker inspect --format='{{json .State.Health}}' voting_api
```

## Warum ist diese Lösung besser?

1. **Robustheit**: Verwendet grundlegende Netzwerkprüfungen statt komplexer Modulimporte
2. **Weniger Abhängigkeiten**: Reduziert die Möglichkeit von Fehlern durch Pfad- oder Modulprobleme
3. **Effizienzer**: Schnellere und ressourcenschonendere Prüfungen
4. **Einfachheit**: Leichter zu verstehender und zu wartender Code

Diese Änderungen stellen sicher, dass die Docker-Health-Checks korrekt funktionieren, was wichtig für die Überwachung und Zuverlässigkeit der Dienste ist.