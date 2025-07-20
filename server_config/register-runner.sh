#!/bin/bash
# GitLab Runner Registration Script

echo "Registering GitLab Runner..."

# Registriere GitLab Runner mit internem Docker-Network
docker exec -it gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "http://gitlab/" \
  --token "glrt-VbPX4mSXf4sPXAGiPFq_YHQ6MQp1OjEH.01.0w08bzmwu" \
  --executor "docker" \
  --docker-image "docker:24-cli" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode "gitlab-setup_gitlab" \
  --description "Docker Runner for CI/CD"

echo "Runner registration complete!"
echo "Checking runner status..."

docker exec -it gitlab-runner gitlab-runner list