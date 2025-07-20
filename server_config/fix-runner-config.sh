#!/bin/bash
# Fix GitLab Runner Config für lokale Docker-Kommunikation

echo "Fixing GitLab Runner configuration..."

# Runner Config anpassen
docker exec -it gitlab-runner bash -c 'cat > /etc/gitlab-runner/config.toml << EOF
concurrent = 1
check_interval = 0
log_level = "info"

[session_server]
  session_timeout = 1800

[[runners]]
  name = "Docker Runner for CI/CD"
  url = "http://gitlab/"
  id = 1
  token = "glrt-VbPX4mSXf4sPXAGiPFq_YHQ6MQp1OjEH.01.0w08bzmwu"
  token_obtained_at = 2025-07-20T20:00:00Z
  token_expires_at = 0001-01-01T00:00:00Z
  executor = "docker"
  clone_url = "http://gitlab/"
  [runners.docker]
    tls_verify = false
    image = "docker:24-cli"
    privileged = false
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/var/www/html/gitlab-setup:/var/www/html/gitlab-setup", "/cache"]
    network_mode = "gitlab-setup_gitlab"
    shm_size = 0
    links = ["gitlab:gitlab"]
    extra_hosts = ["gitlab.failx.de:172.19.0.4"]
EOF'

echo "Restarting GitLab Runner..."
docker restart gitlab-runner

echo "Configuration updated!"
docker exec -it gitlab-runner gitlab-runner list