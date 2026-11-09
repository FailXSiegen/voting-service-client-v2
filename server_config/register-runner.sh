#!/bin/bash
# GitLab Runner Registration Script

echo "Registering GitLab Runner..."

# Registriere GitLab Runner mit internem Docker-Network
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "http://gitlab/" \
  --token "${RUNNER_TOKEN:?RUNNER_TOKEN setzen}" \
  --executor "docker" \
  --docker-image "docker:24-cli" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode "gitlab-setup_gitlab" \
  --description "Docker Runner for CI/CD"

echo "Runner registration complete!"
echo "Checking runner status..."

docker exec -it gitlab-runner gitlab-runner list