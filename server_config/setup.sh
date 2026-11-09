#!/bin/bash
# setup.sh - Komplettes GitLab Docker Setup mit Traefik

set -e

echo "🚀 GitLab Docker Setup mit Traefik wird gestartet..."
echo "================================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion für farbigen Output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# System-Check
print_info "Prüfe System-Voraussetzungen..."

# Root-Check
if [[ $EUID -eq 0 ]]; then
   print_error "Bitte nicht als root ausführen. Verwenden Sie einen User mit sudo-Rechten."
   exit 1
fi

# Docker installieren falls nicht vorhanden
if ! command -v docker &> /dev/null; then
    print_warning "Docker ist nicht installiert. Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    print_status "Docker installiert"
    print_warning "Bitte loggen Sie sich aus und wieder ein, damit Docker-Rechte aktiv werden"
    print_warning "Danach führen Sie das Script erneut aus"
    exit 0
else
    print_status "Docker ist installiert"
fi

# Docker Compose installieren falls nicht vorhanden
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose ist nicht installiert. Installiere Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installiert"
else
    print_status "Docker Compose ist installiert"
fi

# Verzeichnisstruktur erstellen
print_info "Erstelle Verzeichnisstruktur..."
PROJECT_DIR="gitlab-setup"
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Verzeichnis $PROJECT_DIR existiert bereits. Soll es überschrieben werden? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Abgebrochen"
        exit 1
    fi
    rm -rf "$PROJECT_DIR"
fi

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
print_status "Verzeichnis $PROJECT_DIR erstellt"

# .env Datei erstellen
print_info "Erstelle .env Datei..."
cat > .env << 'EOF'
# Domain-Konfiguration
DOMAIN=example.com
EMAIL=admin@example.com

# Datenbank-Passwörter (BITTE ÄNDERN!)
MYSQL_ROOT_PASSWORD=CHANGE_THIS_ROOT_PASSWORD_NOW
TYPO3_DB_PASSWORD=CHANGE_THIS_TYPO3_PASSWORD_NOW

# Weitere Secrets (BITTE ÄNDERN!)
WEBUI_SECRET_KEY=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_AT_LEAST_32_CHARS
GITLAB_ROOT_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD

# Image Namen (anpassen an Ihre Images)
TYPO3_IMAGE=your-typo3-image:latest
DIGITALWAHL_IMAGE=your-digitalwahl-image:latest

# Zeitzone
TZ=Europe/Berlin
EOF
print_status ".env Datei erstellt"

# Traefik Konfiguration erstellen
print_info "Erstelle Traefik Konfiguration..."
cat > traefik.yml << 'EOF'
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik

log:
  level: INFO

accessLog: {}

# Security Headers
api:
  dashboard: true
  insecure: false

# Global redirect to https
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
EOF
print_status "Traefik Konfiguration erstellt"

# Docker Compose Datei erstellen
print_info "Erstelle docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

networks:
  traefik:
    driver: bridge
  gitlab:
    driver: bridge

services:
  # Traefik Reverse Proxy mit Let's Encrypt
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - traefik
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
      - ./traefik.yml:/traefik.yml:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$10$$K7n1L0XiGHK8v8/XuRTRCO1OhMqJsHyiRnU5Ld0MK3fFG5zJ0FqpC"

  # Portainer für Container-Management
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    networks:
      - traefik
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.portainer.rule=Host(`portainer.${DOMAIN}`)"
      - "traefik.http.routers.portainer.entrypoints=websecure"
      - "traefik.http.routers.portainer.tls.certresolver=letsencrypt"
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"

  # GitLab CE
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab
    hostname: gitlab.${DOMAIN}
    restart: unless-stopped
    networks:
      - traefik
      - gitlab
    volumes:
      - gitlab_config:/etc/gitlab
      - gitlab_logs:/var/log/gitlab
      - gitlab_data:/var/opt/gitlab
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.${DOMAIN}'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
        nginx['listen_port'] = 80
        nginx['listen_https'] = false
        gitlab_rails['gitlab_ssh_host'] = 'gitlab.${DOMAIN}'
        gitlab_rails['initial_root_password'] = '${GITLAB_ROOT_PASSWORD}'
        # Performance optimizations for smaller servers
        puma['worker_processes'] = 2
        sidekiq['max_concurrency'] = 10
        postgresql['shared_buffers'] = "256MB"
        postgresql['max_worker_processes'] = 4
        gitaly['ruby_max_rss'] = 300000000
    ports:
      - "2222:22"  # SSH für Git
    shm_size: '256m'
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gitlab.rule=Host(`gitlab.${DOMAIN}`)"
      - "traefik.http.routers.gitlab.entrypoints=websecure"
      - "traefik.http.routers.gitlab.tls.certresolver=letsencrypt"
      - "traefik.http.services.gitlab.loadbalancer.server.port=80"
      - "traefik.docker.network=traefik"
      - "com.centurylinklabs.watchtower.enable=false"

  # GitLab Runner
  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    container_name: gitlab-runner
    restart: unless-stopped
    networks:
      - gitlab
    volumes:
      - gitlab_runner_config:/etc/gitlab-runner
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - gitlab
    labels:
      - "com.centurylinklabs.watchtower.enable=false"

  # n8n Workflow Automation
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    networks:
      - traefik
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.${DOMAIN}/
      - GENERIC_TIMEZONE=${TZ}
      - N8N_SECURE_COOKIE=true
    volumes:
      - n8n_data:/home/node/.n8n
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.${DOMAIN}`)"
      - "traefik.http.routers.n8n.entrypoints=websecure"
      - "traefik.http.routers.n8n.tls.certresolver=letsencrypt"
      - "traefik.http.services.n8n.loadbalancer.server.port=5678"

  # Open WebUI für LLMs
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: unless-stopped
    networks:
      - traefik
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}
      - WEBUI_URL=https://webui.${DOMAIN}
    volumes:
      - open_webui_data:/app/backend/data
    depends_on:
      - ollama
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.openwebui.rule=Host(`webui.${DOMAIN}`)"
      - "traefik.http.routers.openwebui.entrypoints=websecure"
      - "traefik.http.routers.openwebui.tls.certresolver=letsencrypt"
      - "traefik.http.services.openwebui.loadbalancer.server.port=8080"

  # Ollama für lokale LLM-Inferenz
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    networks:
      - traefik
    volumes:
      - ollama_data:/root/.ollama
    # GPU Support aktivieren falls vorhanden
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # TYPO3 CMS
  typo3:
    image: ${TYPO3_IMAGE}
    container_name: typo3
    restart: unless-stopped
    networks:
      - traefik
      - gitlab
    environment:
      - TYPO3_DB_HOST=typo3-db
      - TYPO3_DB_NAME=typo3
      - TYPO3_DB_USERNAME=typo3
      - TYPO3_DB_PASSWORD=${TYPO3_DB_PASSWORD}
      - TZ=${TZ}
    volumes:
      - typo3_data:/var/www/html
    depends_on:
      - typo3-db
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.typo3.rule=Host(`typo3.${DOMAIN}`)"
      - "traefik.http.routers.typo3.entrypoints=websecure"
      - "traefik.http.routers.typo3.tls.certresolver=letsencrypt"
      - "traefik.http.services.typo3.loadbalancer.server.port=80"
      - "com.centurylinklabs.watchtower.enable=false"

  # TYPO3 Datenbank
  typo3-db:
    image: mysql:8.0
    container_name: typo3-db
    restart: unless-stopped
    networks:
      - gitlab
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=typo3
      - MYSQL_USER=typo3
      - MYSQL_PASSWORD=${TYPO3_DB_PASSWORD}
      - TZ=${TZ}
    volumes:
      - typo3_db_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  # digitalwahl.org
  digitalwahl:
    image: ${DIGITALWAHL_IMAGE}
    container_name: digitalwahl
    restart: unless-stopped
    networks:
      - traefik
    environment:
      - TZ=${TZ}
    volumes:
      - digitalwahl_data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.digitalwahl.rule=Host(`digitalwahl.${DOMAIN}`)"
      - "traefik.http.routers.digitalwahl.entrypoints=websecure"
      - "traefik.http.routers.digitalwahl.tls.certresolver=letsencrypt"
      - "traefik.http.services.digitalwahl.loadbalancer.server.port=80"
      - "com.centurylinklabs.watchtower.enable=false"

volumes:
  traefik_letsencrypt:
  portainer_data:
  gitlab_config:
  gitlab_logs:
  gitlab_data:
  gitlab_runner_config:
  n8n_data:
  open_webui_data:
  ollama_data:
  typo3_data:
  typo3_db_data:
  digitalwahl_data:
EOF
print_status "docker-compose.yml erstellt"

# GitLab Runner Registrierung Script
print_info "Erstelle GitLab Runner Registrierung Script..."
cat > register-runner.sh << 'EOF'
#!/bin/bash
# register-runner.sh - GitLab Runner automatisch registrieren

echo "🔧 GitLab Runner Registrierung"
echo "=============================="

# Warten bis GitLab bereit ist
echo "⏳ Warte auf GitLab startup (kann 2-3 Minuten dauern)..."
sleep 120

GITLAB_URL="http://example.com:8083"

# Prüfen ob GitLab erreichbar ist
echo "🔍 Prüfe GitLab Erreichbarkeit..."
for i in {1..30}; do
    if curl -s "$GITLAB_URL" > /dev/null; then
        echo "✅ GitLab ist erreichbar"
        break
    else
        echo "⏳ Warte auf GitLab... ($i/30)"
        sleep 10
    fi
done

echo ""
echo "📝 GitLab Runner Registrierung"
echo "Bitte gehen Sie zu: $GITLAB_URL"
echo "Loggen Sie sich als root ein (Passwort siehe .env Datei)"
echo "Gehen Sie zu: Admin Area → CI/CD → Runners"
echo "Kopieren Sie den Registration Token"
echo ""
read -p "🔑 Registration Token eingeben: " REGISTRATION_TOKEN

if [ -z "$REGISTRATION_TOKEN" ]; then
    echo "❌ Kein Token eingegeben. Abbruch."
    exit 1
fi

echo "🚀 Registriere GitLab Runner..."
docker exec gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "$GITLAB_URL" \
  --registration-token "$REGISTRATION_TOKEN" \
  --executor "docker" \
  --docker-image alpine:latest \
  --description "docker-runner-$(hostname)" \
  --tag-list "docker,deployment,production" \
  --run-untagged="true" \
  --locked="false" \
  --access-level="not_protected" \
  --docker-network-mode="gitlab-setup_gitlab" \
  --docker-volumes="/var/run/docker.sock:/var/run/docker.sock"

if [ $? -eq 0 ]; then
    echo "✅ GitLab Runner erfolgreich registriert!"
    echo "🔍 Runner Status:"
    docker exec gitlab-runner gitlab-runner list
else
    echo "❌ Runner Registrierung fehlgeschlagen"
    exit 1
fi
EOF
chmod +x register-runner.sh
print_status "GitLab Runner Script erstellt"

# DNS Check Script
print_info "Erstelle DNS Check Script..."
cat > check-dns.sh << 'EOF'
#!/bin/bash
# check-dns.sh - DNS Einträge prüfen

echo "🌐 DNS Einträge Überprüfung"
echo "=========================="

DOMAIN="example.com"

echo "Prüfe DNS-Eintrag für $DOMAIN..."
echo ""

echo -n "🔍 Checking $DOMAIN: "
if nslookup "$DOMAIN" > /dev/null 2>&1; then
    echo "✅ OK"
    
    # IP-Adresse anzeigen
    IP=$(nslookup "$DOMAIN" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
    echo "📍 IP-Adresse: $IP"
    
    # Erreichbarkeit testen
    echo ""
    echo "🔌 Teste Erreichbarkeit der Services..."
    
    ports=("80:TYPO3 (HTTP)" "443:TYPO3 (HTTPS)" "8083:GitLab" "9000:Portainer" "8200:Duplicati")
    
    for port_info in "${ports[@]}"; do
        port=$(echo $port_info | cut -d: -f1)
        service=$(echo $port_info | cut -d: -f2)
        
        echo -n "  Port $port ($service): "
        if nc -z -w3 "$DOMAIN" "$port" 2>/dev/null; then
            echo "✅ Offen"
        else
            echo "❌ Nicht erreichbar"
        fi
    done
    
else
    echo "❌ DNS-Eintrag nicht gefunden"
    echo "💡 Bitte DNS-Eintrag für $DOMAIN erstellen"
fi

echo ""
echo "ℹ️  Hinweis: Bei example.com benötigen Sie nur einen A-Record"
echo "   für die Hauptdomain. Subdomains sind nicht verfügbar."
EOF
chmod +x check-dns.sh
print_status "DNS Check Script erstellt"

# Update Script
print_info "Erstelle Update Script..."
cat > update.sh << 'EOF'
#!/bin/bash
# update.sh - Services aktualisieren

echo "🔄 Service Updates"
echo "=================="

# Backup vor Update
echo "💾 Erstelle Backup..."
docker-compose exec gitlab gitlab-backup create

echo "📥 Ziehe neue Images..."
docker-compose pull

echo "🔄 Starte Services neu..."
docker-compose up -d

echo "🧹 Räume alte Images auf..."
docker system prune -f

echo "✅ Update abgeschlossen!"
echo "📊 Aktuelle Container:"
docker-compose ps
EOF
chmod +x update.sh
print_status "Update Script erstellt"

# Status Script
print_info "Erstelle Status Script..."
cat > status.sh << 'EOF'
#!/bin/bash
# status.sh - System Status anzeigen

echo "📊 GitLab Setup Status"
echo "======================"

echo "🐳 Docker Container:"
docker-compose ps

echo ""
echo "💾 Volume Usage:"
docker system df

echo ""
echo "🌐 Service URLs:"
echo "- TYPO3 (Hauptseite): https://example.com"
echo "- GitLab:             http://example.com:8083"
echo "- Portainer:          http://example.com:9000"
echo "- Duplicati Backup:   http://example.com:8200"
echo "- n8n:                http://example.com:5678"
echo "- Open WebUI:         http://example.com:3000"
echo "- digitalwahl.org:    http://example.com:8082"
echo "- Grafana:            http://example.com:3001"
echo "- Traefik Dashboard:  http://example.com:8080"

echo ""
echo "🔑 GitLab SSH: ssh://git@example.com:2222"
echo "📦 GitLab Registry: http://example.com:5050"

echo ""
echo "📋 Port-Übersicht:"
echo "80/443  → TYPO3 (Hauptseite mit SSL)"
echo "2222    → GitLab SSH"
echo "3000    → Open WebUI"
echo "3001    → Grafana"
echo "5050    → GitLab Registry"
echo "5678    → n8n"
echo "8080    → Traefik Dashboard"
echo "8082    → digitalwahl.org"
echo "8083    → GitLab Web-Interface"
echo "8200    → Duplicati"
echo "9000    → Portainer"

echo ""
echo "📋 Nützliche Befehle:"
echo "- Logs anzeigen:     docker-compose logs -f [service]"
echo "- Service neustarten: docker-compose restart [service]"
echo "- In Container:      docker exec -it [container] bash"
echo "- Backup GitLab:     docker-compose exec gitlab gitlab-backup create"
echo "- GitLab Runner:     ./register-runner.sh"
echo "- DNS prüfen:        ./check-dns.sh"
echo "- Updates:           ./update.sh"
EOF
chmod +x status.sh
print_status "Status Script erstellt"

# README erstellen
print_info "Erstelle README..."
cat > README.md << 'EOF'
# GitLab Docker Setup mit TYPO3 Hauptseite

Komplettes Setup mit TYPO3 als Hauptseite, GitLab für Entwicklung und allen Management-Tools.

## Services

- **TYPO3**: Content Management System (Hauptseite mit SSL)
- **GitLab CE**: Git Repository Management 
- **Portainer**: Docker Container Management
- **Duplicati**: Professionelles Backup Management
- **n8n**: Workflow Automation
- **Open WebUI**: LLM Interface mit Ollama
- **digitalwahl.org**: Custom Application
- **Grafana**: Monitoring (optional)

## Installation

1. **Setup ausführen:**
   ```bash
   ./setup.sh
   ```

2. **Konfiguration anpassen:**
   ```bash
   nano .env  # Passwörter und Image-Namen ändern
   ```

3. **DNS prüfen:**
   ```bash
   ./check-dns.sh
   ```

4. **Services starten:**
   ```bash
   docker-compose up -d
   ```

5. **GitLab Runner registrieren:**
   ```bash
   ./register-runner.sh
   ```

## Service URLs

### Hauptseite
- **TYPO3**: https://example.com (automatisches SSL)

### Entwicklung & Management
- **GitLab**: http://example.com:8083
- **Portainer**: http://example.com:9000
- **Duplicati Backup**: http://example.com:8200

### Anwendungen
- **n8n**: http://example.com:5678
- **Open WebUI**: http://example.com:3000
- **digitalwahl.org**: http://example.com:8082
- **Grafana**: http://example.com:3001

### Git & Registry
- **GitLab SSH**: ssh://git@example.com:2222
- **GitLab Registry**: http://example.com:5050

## Port-Übersicht

```
80/443  → TYPO3 (Hauptseite mit SSL)
2222    → GitLab SSH
3000    → Open WebUI
3001    → Grafana
5050    → GitLab Registry
5678    → n8n
8080    → Traefik Dashboard
8082    → digitalwahl.org
8083    → GitLab Web-Interface
8200    → Duplicati
9000    → Portainer
```

## Wichtige Befehle

```bash
./status.sh          # System Status und URLs
./update.sh          # Updates installieren
./check-dns.sh       # DNS prüfen
docker-compose logs  # Logs anzeigen
```

## Erste Schritte nach Installation

1. **TYPO3 einrichten**: https://example.com
2. **GitLab öffnen**: http://example.com:8083 (root login)
3. **Portainer einrichten**: http://example.com:9000
4. **Duplicati konfigurieren**: http://example.com:8200
5. **GitLab Runner registrieren**: ./register-runner.sh

## Backup-Strategie

- **Duplicati**: Automatische, inkrementelle Backups aller Volumes
- **GitLab Backup**: Integrierte GitLab-Backups
- **Volume Snapshots**: Alle wichtigen Daten werden gesichert

## SSL/HTTPS

- TYPO3 (Hauptseite) bekommt automatisch Let's Encrypt SSL
- Andere Services über HTTP (können später mit eigener Domain SSL bekommen)
- GitLab Registry und SSH funktionieren separat

## Support

Bei Problemen:
1. `./status.sh` für Übersicht
2. `docker-compose logs [service]` für Logs
3. `./check-dns.sh` für DNS-Probleme
EOF
print_status "README erstellt"

# Abschließende Informationen
echo ""
echo "🎉 Setup erfolgreich abgeschlossen!"
echo "===================================="
echo ""
print_warning "WICHTIGE NÄCHSTE SCHRITTE:"
echo ""
echo "1. 📝 Konfiguration anpassen:"
echo "   nano .env"
echo "   (UNBEDINGT Passwörter und Image-Namen ändern!)"
echo ""
echo "2. 🌐 DNS-Einträge prüfen:"
echo "   ./check-dns.sh"
echo ""
echo "3. 🚀 Services starten:"
echo "   docker-compose up -d"
echo ""
echo "4. 🔧 GitLab Runner registrieren:"
echo "   ./register-runner.sh"
echo ""
print_info "Alle Scripts sind einsatzbereit in: $(pwd)"
print_info "Weitere Informationen in der README.md"
echo ""
echo "📊 Verwenden Sie './status.sh' für System-Übersicht"
echo ""
echo "🌐 Nach dem Start werden die Services verfügbar sein unter:"
echo "- TYPO3 (Hauptseite): https://example.com"
echo "- GitLab:              http://example.com:8083"
echo "- Portainer:           http://example.com:9000"
echo "- Duplicati Backup:    http://example.com:8200"
echo "- n8n:                 http://example.com:5678"
echo "- Open WebUI:          http://example.com:3000"
echo "- digitalwahl.org:     http://example.com:8082"
echo "- Grafana:             http://example.com:3001"
echo "- Traefik Dashboard:   http://example.com:8080"
echo ""
echo "🔑 GitLab SSH: ssh://git@example.com:2222"
echo "📦 GitLab Registry: http://example.com:5050"
echo ""
echo "⚠️  Wichtig: TYPO3 bekommt automatisch Let's Encrypt SSL-Zertifikat!"