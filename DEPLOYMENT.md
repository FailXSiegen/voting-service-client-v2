# VotingTool Deployment Guide

This guide covers deploying the VotingTool to Hetzner Cloud servers using GitLab CI/CD.

## Prerequisites

### 1. Hetzner Cloud Setup

#### Create Servers
- **Staging Server**: 1 vCPU, 2GB RAM, 20GB SSD
- **Production Server**: 2 vCPU, 4GB RAM, 40GB SSD

#### Server Configuration
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directories
mkdir -p /opt/voting-tool-staging
mkdir -p /opt/voting-tool-production
```

### 2. Traefik Setup

Create `/opt/traefik/docker-compose.yml`:

```yaml
version: '3.8'

networks:
  traefik_network:
    external: true

services:
  traefik:
    image: traefik:v2.9
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - traefik_network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./acme.json:/acme.json
    environment:
      - ACME_EMAIL=${ACME_EMAIL}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.your-domain.com`)"
      - "traefik.http.routers.traefik.service=api@internal"
```

Create Traefik configuration `/opt/traefik/traefik.yml`:

```yaml
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

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik_network

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${ACME_EMAIL}
      storage: acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO

accessLog: {}
```

Start Traefik:
```bash
cd /opt/traefik
docker network create traefik_network
touch acme.json
chmod 600 acme.json
docker-compose up -d
```

### 3. GitLab CI/CD Variables

Configure in GitLab Project Settings > CI/CD > Variables:

#### Staging Variables
- `STAGING_HOST`: Your staging server IP
- `STAGING_USER`: SSH username (e.g., root)
- `STAGING_SSH_PRIVATE_KEY`: SSH private key for staging server

#### Production Variables
- `PRODUCTION_HOST`: Your production server IP
- `PRODUCTION_USER`: SSH username (e.g., root)
- `PRODUCTION_SSH_PRIVATE_KEY`: SSH private key for production server
- `PRODUCTION_DOMAIN`: Your production domain

#### Application Secrets
- `JWT_SECRET`: Strong JWT secret key
- `DATABASE_ROOT_PASSWORD`: MariaDB root password
- `DATABASE_USER`: Application database user
- `DATABASE_PASSWORD`: Application database password
- `DATABASE_NAME`: Database name
- `RABBITMQ_USER`: RabbitMQ username
- `RABBITMQ_PASSWORD`: RabbitMQ password
- `EMAIL_HOST`: SMTP server
- `EMAIL_PORT`: SMTP port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password

## Deployment Process

### Automatic Staging Deployment

1. **Push to main branch** triggers automatic staging deployment
2. **Build**: Docker images are built and pushed to GitLab Registry
3. **Test**: Linting and tests are run
4. **Deploy**: Images are deployed to staging server
5. **Access**: https://staging.voting.failx.de

### Manual Production Deployment

1. **Navigate** to GitLab CI/CD > Pipelines
2. **Find** the pipeline for your main branch commit
3. **Click** the manual "deploy-production" job
4. **Monitor** deployment progress
5. **Access**: https://your-production-domain.com

## Environment Configuration

### Staging Environment

Create `/opt/voting-tool-staging/.env`:
```bash
DOMAIN=staging.voting.failx.de
API_IMAGE=gitlab.failx.de/hetzner/voting-tool/api:latest
CLIENT_IMAGE=gitlab.failx.de/hetzner/voting-tool/client:latest
CONSUMER_IMAGE=gitlab.failx.de/hetzner/voting-tool/consumer:latest
DATABASE_ROOT_PASSWORD=staging_root_password
DATABASE_USER=staging_user
DATABASE_PASSWORD=staging_password
DATABASE_NAME=voting_staging
JWT_SECRET=staging-jwt-secret
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### Production Environment

Create `/opt/voting-tool-production/.env`:
```bash
DOMAIN=your-production-domain.com
API_IMAGE=gitlab.failx.de/hetzner/voting-tool/api:latest
CLIENT_IMAGE=gitlab.failx.de/hetzner/voting-tool/client:latest
CONSUMER_IMAGE=gitlab.failx.de/hetzner/voting-tool/consumer:latest
DATABASE_ROOT_PASSWORD=your-strong-root-password
DATABASE_USER=voting_user
DATABASE_PASSWORD=your-strong-database-password
DATABASE_NAME=voting_production
JWT_SECRET=your-very-strong-jwt-secret
RABBITMQ_USER=voting_rabbitmq
RABBITMQ_PASSWORD=your-strong-rabbitmq-password
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
```

## Monitoring and Maintenance

### Health Checks

All services include health checks:
- **API**: HTTP endpoint check
- **Client**: Nginx status check
- **Consumer**: Log activity check
- **Database**: Built-in MariaDB health check
- **RabbitMQ**: Built-in RabbitMQ health check

### Logs

View service logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f consumer
```

### Backups

Database backup script (`/opt/scripts/backup-db.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="voting_db"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER_NAME mysqldump \
  -u root -p$DATABASE_ROOT_PASSWORD \
  $DATABASE_NAME > $BACKUP_DIR/voting_backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "voting_backup_*.sql" -mtime +30 -delete
```

Set up cron job:
```bash
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh
```

### Updates

Update to latest version:
```bash
cd /opt/voting-tool-production
docker-compose pull
docker-compose up -d
docker system prune -f
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**:
   ```bash
   # Check certificate
   docker logs traefik | grep acme
   
   # Reset certificates (if needed)
   docker-compose down
   rm acme.json
   touch acme.json
   chmod 600 acme.json
   docker-compose up -d
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test connection
   docker exec -it voting_api nc -z db 3306
   ```

3. **Memory Issues**:
   ```bash
   # Check resource usage
   docker stats
   
   # Adjust resource limits in docker-compose.yml
   ```

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   # Stop services
   docker-compose down
   
   # Restore from backup
   docker-compose up -d db
   docker exec -i voting_db mysql -u root -p$DATABASE_ROOT_PASSWORD $DATABASE_NAME < backup.sql
   
   # Start all services
   docker-compose up -d
   ```

2. **Complete System Recovery**:
   ```bash
   # Pull latest images
   docker-compose pull
   
   # Recreate containers
   docker-compose up -d --force-recreate
   ```

## Security Considerations

1. **Firewall Configuration**:
   ```bash
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

2. **SSH Hardening**:
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port (optional)

3. **Regular Updates**:
   ```bash
   # System updates
   apt update && apt upgrade -y
   
   # Docker updates
   docker system prune -f
   ```

4. **Secret Management**:
   - Use strong passwords
   - Rotate secrets regularly
   - Store secrets securely in GitLab variables

## Performance Optimization

1. **Database Optimization**:
   - Monitor slow queries
   - Optimize indexes
   - Adjust buffer pool size

2. **Application Optimization**:
   - Monitor resource usage
   - Adjust container limits
   - Use connection pooling

3. **Nginx Optimization**:
   - Enable gzip compression
   - Set proper cache headers
   - Optimize static file serving

## Support

For deployment issues:
1. Check GitLab CI/CD logs
2. Review server logs
3. Check resource usage
4. Contact system administrator if needed