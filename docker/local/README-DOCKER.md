# Docker-Umgebung für VotingTool

Diese Dokumentation beschreibt die verbesserte Docker-Umgebung für das VotingTool-Projekt, einschließlich der RabbitMQ-Integration und erweiterten Konfigurationen.

## Überblick

Die Docker-Umgebung bietet:

- **Vollständiges Entwicklungssetup** mit API, Client, Datenbank, RabbitMQ und Vote Consumer
- **Health Checks** für alle Services zur Überwachung der Verfügbarkeit
- **Ressourcenlimits** für Container, um Systemressourcen zu schonen
- **Verbessertes Logging** mit Rotation und zentraler Speicherung
- **Entwicklungs- und Produktionsprofile** durch Override-Dateien
- **Makefile** für einfachere Verwaltung der Docker-Umgebung

## Komponenten

### 1. Services

- **API**: Der Hauptservice für die GraphQL API
- **Consumer**: Verarbeitet Nachrichten aus RabbitMQ-Queues
- **Client**: Das Frontend der Anwendung
- **RabbitMQ**: Message Queue für asynchrone Verarbeitung
- **Datenbank**: MariaDB für die Datenspeicherung
- **Mailhog**: Fake SMTP-Server für E-Mail-Tests
- **Traefik**: Reverse Proxy für Routing und SSL

### 2. Healthchecks

Alle Services verfügen über Health Checks:

- **API & Consumer**: Überprüfen Datenbank- und RabbitMQ-Verbindungen
- **RabbitMQ**: Überprüft die Verbindungsfähigkeit mit rabbitmq-diagnostics
- **Datenbank**: Integrierter MariaDB Health Check

### 3. Ressourcenlimits

Die Services haben definierte Ressourcengrenzen:

- **API**: max. 0.5 CPU, 500MB RAM
- **Consumer**: max. 0.3 CPU, 300MB RAM 
- **RabbitMQ**: max. 0.5 CPU, 500MB RAM

### 4. Logging

Verbesserte Log-Konfiguration:

- **JSON-Format** für bessere Maschinenlesbarkeit
- **Log-Rotation** mit max. 10MB pro Datei und 3 Dateien
- **Zentraler Log-Ordner** durch Volume-Mapping

## Verwendung

### Voraussetzungen

- Docker und Docker Compose installiert
- Mind. 2GB freier RAM
- Mind. 2 CPU-Kerne empfohlen

### Befehle mit Makefile

```bash
# Alles starten
make up

# Alles stoppen
make down

# Alles neu bauen
make build

# Logs anzeigen
make logs

# Logs eines bestimmten Services anzeigen
make logs-service SERVICE=api

# Befehl in einem Container ausführen
make exec SERVICE=api CMD="npm run db:migrate"

# API-Gesundheitscheck
make health-api

# Consumer-Gesundheitscheck
make health-consumer

# RabbitMQ aktivieren
make enable-rabbitmq

# RabbitMQ deaktivieren
make disable-rabbitmq

# Status der Container anzeigen
make status

# RabbitMQ-Status anzeigen
make rabbitmq-status
```

### Manuelles Starten

```bash
cd docker/local
docker-compose up -d
```

### Manuelles Stoppen

```bash
cd docker/local
docker-compose down
```

## Konfiguration

### Umgebungsvariablen für RabbitMQ

In der `docker-compose.yaml` sind folgende Umgebungsvariablen für RabbitMQ definiert:

```yaml
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
```

### Override für Entwicklung

Die `docker-compose.override.yml` Datei enthält entwicklungsspezifische Einstellungen:

- **Live-Reload** durch Volume-Mounts für Quellcode
- **Debug-Modus** für detailliertere Logs
- **Zusätzliche Ports** für direkten Zugriff (z.B. RabbitMQ Management UI)

## Fehlerbehebung

### Allgemeine Probleme

1. **Container startet nicht**:
   ```bash
   docker logs voting_<service_name>
   ```

2. **Nicht genügend Ressourcen**:
   - Erhöhen Sie die für Docker verfügbaren Ressourcen
   - Reduzieren Sie die Ressourcenlimits in der docker-compose.yaml

3. **Portkonflikt**:
   - Prüfen Sie, ob die Ports bereits verwendet werden
   - Ändern Sie die Port-Mappings in der docker-compose.yaml

### RabbitMQ-spezifische Probleme

1. **Verbindungsprobleme**:
   ```bash
   docker exec voting_api node healthcheck.js api
   ```

2. **Consumer verarbeitet keine Nachrichten**:
   ```bash
   docker logs voting_consumer
   make rabbitmq-status
   ```

3. **Queue-Überlauf**:
   - Prüfen Sie den RabbitMQ-Management-UI für Queue-Längen
   - Erhöhen Sie die Ressourcen für den Consumer

## Anpassungen

### Ressourcenlimits anpassen

In der `docker-compose.yaml` können Sie die Ressourcenlimits nach Bedarf anpassen:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'  # 50% eines CPU-Kerns
      memory: 500M  # 500 MB RAM
```

### Logging-Konfiguration anpassen

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Max. Größe pro Log-Datei
    max-file: "3"      # Anzahl der Log-Dateien für Rotation
```

## Best Practices

1. **Verwenden Sie `make` statt direkter docker-compose-Befehle** für Konsistenz
2. **Prüfen Sie Health Checks** vor der Fehlersuche, um grundlegende Probleme auszuschließen
3. **Vermeiden Sie unnötige Rebuilds** durch Verwendung von Volumes für die Entwicklung
4. **Überwachen Sie die Ressourcennutzung** mit `docker stats`
5. **Rotieren Sie Log-Dateien regelmäßig** mit `docker-compose down && docker-compose up -d`