# RabbitMQ Berechtigungsproblem - Behebung

Bei der Integration von RabbitMQ in die Docker-Umgebung trat ein Berechtigungsproblem beim Zugriff auf die Log-Dateien auf. Diese Dokumentation beschreibt das Problem und die implementierte Lösung.

## Problem

RabbitMQ konnte nicht starten, mit folgender Fehlermeldung:

```
failed to open log file at '/var/log/rabbitmq/rabbit.log', reason: permission denied
```

Der Fehler tritt auf, weil der RabbitMQ-Container standardmäßig nicht über ausreichende Berechtigungen verfügt, um in das `/var/log/rabbitmq/` Verzeichnis zu schreiben.

## Lösung

Die Lösung umfasst mehrere Komponenten:

1. **Benutzerdefiniertes Docker-Image für RabbitMQ**:
   - Erstellung eines eigenen Dockerfile.rabbitmq
   - Explizites Erstellen des Log-Verzeichnisses
   - Setzen von Berechtigungen (chmod 777) für das Log-Verzeichnis

2. **Angepasste RabbitMQ-Konfiguration**:
   - Definieren der Log-Pfade in einer eigenen Konfigurationsdatei
   - Vereinfachte Logging-Konfiguration für den Container-Betrieb

3. **Volume-Konfiguration**:
   - Verwendung eines benannten Volumes für Log-Dateien (statt Bind-Mount)
   - Docker behält so die Kontrolle über die Dateiberechtigungen

## Implementierungsdetails

### 1. Dockerfile.rabbitmq

```dockerfile
FROM rabbitmq:management

# Create and set permissions for log directory
RUN mkdir -p /var/log/rabbitmq && \
    chmod -R 777 /var/log/rabbitmq

# Copy configuration
COPY docker/local/rabbitmq/config/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
```

### 2. RabbitMQ-Konfiguration

Eine spezielle Konfigurationsdatei (`rabbitmq.conf`) wurde erstellt mit:

```
# Logging configuration
log.dir = /var/log/rabbitmq
log.file = rabbit.log
log.file.level = info
log.console = true
log.console.level = info
```

### 3. Docker Compose Änderungen

In der `docker-compose.yaml`:
```yaml
rabbitmq:
  build:
    context: ../..
    dockerfile: docker/local/Dockerfile.rabbitmq
  # ... weitere Konfiguration ...
```

Und in der `docker-compose.override.yml`:
```yaml
rabbitmq:
  volumes:
    # Mount logs volume
    - rabbitmq_logs:/var/log/rabbitmq
    # Mount custom configuration
    - ./rabbitmq/config:/etc/rabbitmq/conf.d:ro
```

## Überprüfung der Lösung

Nach der Implementierung dieser Änderungen sollte RabbitMQ erfolgreich starten. Sie können dies überprüfen mit:

```bash
# Container neu starten
docker-compose up -d rabbitmq

# Logs prüfen
docker-compose logs rabbitmq

# RabbitMQ Status prüfen
docker-compose exec rabbitmq rabbitmqctl status
```

Die RabbitMQ Management UI sollte jetzt unter http://rabbitmq.local.digitalwahl.org oder http://localhost:15672 (falls Sie den Port exportiert haben) verfügbar sein.