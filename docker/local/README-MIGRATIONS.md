# Automatische Datenbankmigrationen in der Docker-Umgebung

Die Docker-Umgebung für das VotingTool enthält nun eine automatische Ausführung der Datenbankmigrationen beim Containerstart.

## Implementierung

1. **Docker Entrypoint Script**
   - Datei: `/docker-entrypoint.sh`
   - Wird beim Start des API-Containers ausgeführt
   - Wartet auf die Verfügbarkeit der Datenbank
   - Führt `npm run db:migrate` aus
   - Startet dann den eigentlichen Service-Prozess

2. **Voraussetzungen im Container**
   - `netcat-openbsd` für die Prüfung der Datenbankverfügbarkeit
   - Umgebungsvariablen für die Datenbankverbindung

## Wie es funktioniert

Beim Start des API-Containers:

1. Das Entrypoint-Script wird ausgeführt
2. Es wartet, bis die Datenbank unter `$DATABASE_HOST:3306` erreichbar ist
3. Es führt `npm run db:migrate` aus, um alle ausstehenden Migrationen anzuwenden
4. Danach startet es den API-Service mit `node dist/index.js`

## Vorteile

- **Automatische Migrationen**: Keine manuelle Ausführung von Migrationen notwendig
- **Reihenfolge garantiert**: Migrationen werden immer vor dem Serverstart ausgeführt
- **Fehlerbehandlung**: Der Container startet nicht, wenn Migrationen fehlschlagen
- **Wartezyklus**: Verhindert Fehler durch nicht verfügbare Datenbank

## Manuelle Migration (falls nötig)

Falls Sie eine Migration manuell ausführen möchten:

```bash
# Mit dem Makefile
make migrate

# Oder mit Docker Compose
docker-compose exec api npm run db:migrate
```

## Fehlerbehebung

Wenn die automatische Migration fehlschlägt:

1. **Prüfen Sie die Container-Logs**:
   ```bash
   docker-compose logs api
   ```

2. **Datenbankerreichbarkeit prüfen**:
   ```bash
   docker-compose exec api nc -z -v $DATABASE_HOST 3306
   ```

3. **Manuell Migrationen ausführen**:
   ```bash
   docker-compose exec api npm run db:migrate
   ```

4. **Entrypoint-Script debuggen**:
   ```bash
   docker-compose exec api sh -x /docker-entrypoint.sh
   ```