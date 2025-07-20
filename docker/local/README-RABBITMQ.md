# RabbitMQ Setup für die lokale Docker-Umgebung

Diese Anleitung beschreibt die Integration von RabbitMQ in die lokale Docker-Entwicklungsumgebung des Voting-Tools.

## Überblick

Die lokale Docker-Umgebung umfasst nun:

1. **RabbitMQ Service**: Läuft als separater Container für die Message-Queue-Verarbeitung
2. **API Service**: Verwendet RabbitMQ für die asynchrone Verarbeitung von Votes bei aktiviertem Feature Flag
3. **Vote Consumer Service**: Separater Container, der Nachrichten aus den RabbitMQ Queues verarbeitet 

## Komponenten

### RabbitMQ Container

- Image: `rabbitmq:management`
- Management UI: http://rabbitmq.local.digitalwahl.org
- Ports: 5672 (AMQP), 15672 (Management Interface)
- Standard-Zugangsdaten: guest/guest

### Vote Consumer Container

- Basiert auf demselben Code wie der API-Service
- Führt nur den Vote Consumer Prozess aus
- Verarbeitet Nachrichten aus den Queue `poll_user_voted` und `poll_answer`
- Stellt sicher, dass Abstimmungen auch bei hoher Last zuverlässig verarbeitet werden

## Konfiguration

### Umgebungsvariablen

Beide Services (API und Consumer) verwenden diese Umgebungsvariablen für die RabbitMQ-Verbindung:

```
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
```

### Docker Compose

Die Konfiguration ist in der `docker-compose.yaml` Datei definiert:

1. **RabbitMQ Service**: Registriert sich bei Traefik und stellt das Management Interface bereit
2. **Consumer Service**: Startet automatisch und hängt von der API, Datenbank und RabbitMQ ab
3. **API Service**: Wurde aktualisiert, um RabbitMQ als Abhängigkeit zu berücksichtigen

## Aktivierung der RabbitMQ-Verarbeitung

Um die RabbitMQ-basierte Vote-Verarbeitung zu aktivieren, muss das Feature Flag in der Datenbank gesetzt werden:

1. Zugriff auf Adminer unter http://db.local.digitalwahl.org
2. Verbinden zur Datenbank als user/1234
3. Ausführen des SQL-Befehls: `UPDATE system_settings SET use_rabbitmq = true;`

## Überwachung

1. **RabbitMQ Management Console**: http://rabbitmq.local.digitalwahl.org
   - Überwachung der Queues und Messages
   - Prüfen des Message Throughputs
   - Diagnose von Verbindungsproblemen
   
2. **Logs**:
   - API Logs: `docker logs voting_api`
   - Consumer Logs: `docker logs voting_consumer`
   - RabbitMQ Logs: `docker logs voting_rabbitmq`

## Fehlerbehebung

### Consumer startet nicht

1. Prüfen, ob das Startskript im Build richtig kopiert wurde:
   ```
   docker exec -it voting_consumer ls -la /app/dist/bin
   ```

2. Überprüfen der Consumer-Logs auf Fehler:
   ```
   docker logs voting_consumer
   ```

### Verbindungsprobleme zu RabbitMQ

1. Sicherstellen, dass RabbitMQ läuft:
   ```
   docker ps | grep rabbitmq
   ```

2. Verbindungsstatus in der Management UI überprüfen:
   http://rabbitmq.local.digitalwahl.org/#/connections

3. Netzwerkverbindung testen:
   ```
   docker exec -it voting_api ping rabbitmq
   docker exec -it voting_consumer ping rabbitmq
   ```

### Keine Nachrichten werden verarbeitet

1. Prüfen, ob Nachrichten in den Queues vorhanden sind:
   http://rabbitmq.local.digitalwahl.org/#/queues

2. Prüfen, ob das Feature Flag aktiviert ist:
   ```sql
   SELECT * FROM system_settings;
   ```

3. Überprüfen der API-Logs auf Fehler beim Senden von Nachrichten:
   ```
   docker logs voting_api | grep RABBITMQ
   ```

## Zurücksetzen auf direkte Verarbeitung

Um zur direkten Datenbankverarbeitung zurückzukehren (ohne RabbitMQ):

```sql
UPDATE system_settings SET use_rabbitmq = false;
```