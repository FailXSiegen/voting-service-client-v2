# Docker Container Approach für GitLab CI

## 🐳 **Brillante Lösung!**

Statt Shell-Executor verwenden wir temporäre Container mit Docker Volumes für DB-Operationen.

## ⚙️ **Wie es funktioniert**:

### **1. Backup erstellen** (`backup_database`):
```bash
# Erstelle persistentes Volume
docker volume create voting-test-backups

# Finde DB-Netzwerk
VOTING_NETWORK=$(docker network ls | grep voting-tool)

# Backup über temporären MySQL-Client Container
docker run --rm \
  --network ${VOTING_NETWORK} \
  -v voting-test-backups:/backups \
  mysql:8.0 \
  mysqldump -h db -u root -pPASSWORD voting_db > /backups/backup.sql
```

### **2. Testdaten importieren** (`import_test_data`):
```bash
# SQL-Datei in temporäres Volume kopieren
docker run --rm \
  -v "$(pwd)/test-data:/source:ro" \
  -v voting-test-sql:/sql \
  alpine:latest \
  cp /source/load-test-scenario.sql /sql/

# Import über temporären Container
docker run --rm \
  --network ${VOTING_NETWORK} \
  -v voting-test-sql:/sql \
  mysql:8.0 \
  mysql -h db -u root -pPASSWORD voting_db < /sql/load-test-scenario.sql
```

### **3. Backup wiederherstellen** (`restore_database`):
```bash
# Wiederherstellung über temporären Container
docker run --rm \
  --network ${VOTING_NETWORK} \
  -v voting-test-backups:/backups \
  mysql:8.0 \
  mysql -h db -u root -pPASSWORD voting_db < /backups/backup.sql
```

## 🎯 **Vorteile**:

1. **✅ Funktioniert mit Docker-Executor**: Kein Shell-Zugriff nötig
2. **🔒 Isoliert**: Temporäre Container werden automatisch gelöscht
3. **💾 Persistent**: Backup-Volume bleibt für Wiederherstellung erhalten
4. **🚀 Standard GitLab Runner**: Läuft auf jedem Docker-fähigen Runner
5. **🛡️ Sicher**: Keine Dateisystem-Zugriffe nötig

## 🔧 **Technische Details**:

### **Docker Volumes**:
- `voting-test-backups`: Persistente Backup-Speicherung
- `voting-test-sql`: Temporär für SQL-Import

### **Netzwerk-Discovery**:
```bash
# Automatische Erkennung des DB-Netzwerks
VOTING_NETWORK=$(docker network ls --format "table {{.Name}}" | grep voting-tool)
```

### **Container-Kommunikation**:
- Temporäre Container verbinden sich mit `--network ${VOTING_NETWORK}`
- DB-Host ist immer `db` (Docker Compose Service-Name)
- Keine Port-Mappings nötig

## 🎪 **Workflow**:

1. **GitLab Runner** (Docker) startet temporären MySQL-Client
2. **Temporärer Container** verbindet sich mit bestehender DB
3. **Volume-Mount** für persistente Backup-Speicherung
4. **Automatisches Cleanup** nach Job-Ende

## 🔍 **Debugging**:

### Volume-Inhalt prüfen:
```bash
docker run --rm -v voting-test-backups:/backups alpine:latest ls -la /backups/
```

### Netzwerk-Status:
```bash
docker network ls | grep voting
```

### Container-Logs:
```bash
# Werden automatisch in GitLab Job-Logs angezeigt
```

## 🚀 **Deployment-Ready**:

Die Lösung funktioniert auf **jedem GitLab Runner** mit Docker-Support:
- ✅ Shared GitLab.com Runners
- ✅ Self-hosted Docker Runners  
- ✅ Kubernetes Runners
- ✅ Shell Runners (als Fallback)

**Keine spezielle Runner-Konfiguration nötig!** 🎉