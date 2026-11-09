# server_config – Beispiel-Setup (anonymisiert)

Beispiel, wie digitalwahl zusammen mit GitLab (CI/CD + Registry), Traefik und weiteren
Diensten auf **einem** Docker-Host betrieben werden kann. Das ist **keine** Live-Konfiguration:
Hostnamen, IPs und Zugangsdaten sind Platzhalter (`example.com`, `CHANGE_THIS_…`).

| Datei | Zweck |
|---|---|
| `setup.sh` | Legt `gitlab-setup/` mit `.env`, `docker-compose.yml` und Hilfsskripten an |
| `docker-compose.yaml` | Dienste hinter Traefik; alle Hosts als `<dienst>.${DOMAIN}` |
| `register-runner.sh` | Registriert einen GitLab-Runner im internen Docker-Netz |
| `fix-runner-config.sh` | Schreibt die Runner-`config.toml` neu (Docker-Executor, interne GitLab-URL) |
| `deploy.php` | [Deployer](https://deployer.org)-Rezept zum Hochladen von Compose + `mcp-http-wrapper/` |
| `mcp-http-wrapper/` | Kleiner HTTP/WebSocket-Wrapper für einen n8n-MCP-Server |

## Benutzung

```bash
# 1. Grundgerüst anlegen und .env anpassen (DOMAIN, alle CHANGE_THIS_…-Werte)
./setup.sh
nano gitlab-setup/.env            # Secrets z. B. mit: openssl rand -hex 32

# 2. Runner registrieren – Token aus GitLab: Admin → CI/CD → Runners → New instance runner
RUNNER_TOKEN=glrt-xxxxxxxx ./register-runner.sh

# 3. Optional per Deployer hochladen (composer install holt deployer/deployer nach vendor/)
composer install
DEPLOY_HOST=server.example.com DEPLOY_USER=deploy vendor/bin/dep deploy production
```

## Regeln

- **Keine echten Secrets, Tokens, IPs oder Hostnamen einchecken.** Dieses Repository ist öffentlich,
  auch die Git-Historie. Werte gehören in `.env` (nicht versioniert) oder in CI/CD-Variablen.
- Tokens nur per Umgebungsvariable übergeben (`RUNNER_TOKEN=… ./register-runner.sh`).
- `vendor/` und `composer.lock` sind nicht versioniert (`.gitignore`).
