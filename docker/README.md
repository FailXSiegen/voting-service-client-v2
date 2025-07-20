# VotingTool Docker Setup

This directory contains Docker configurations for running the VotingTool application in different environments.

## Directory Structure

- `local/`: Configuration for local development environment
- `test/`: Configuration for test/staging environment
- `live/`: Configuration for production environment

## Setup Instructions

### Local Development

1. Navigate to the local directory:
   ```
   cd docker/local
   ```

2. Create an empty acme.json file with proper permissions:
   ```
   touch acme.json
   chmod 600 acme.json
   ```

3. Start the services:
   ```
   docker-compose up -d
   ```

4. Add the following entries to your hosts file:
   ```
   127.0.0.1 local.digitalwahl.org
   127.0.0.1 mail.local.digitalwahl.org
   127.0.0.1 db.local.digitalwahl.org
   127.0.0.1 traefik.local.digitalwahl.org
   ```

5. Access the application at http://local.digitalwahl.org

### Test Environment

1. Navigate to the test directory:
   ```
   cd docker/test
   ```

2. Copy the example environment file and edit with your settings:
   ```
   cp .env.example .env
   nano .env
   ```

3. Create an empty acme.json file with proper permissions:
   ```
   touch acme.json
   chmod 600 acme.json
   ```

4. Start the services:
   ```
   docker-compose up -d
   ```

5. Access the application at https://test.digitalwahl.org

### Production Environment

1. Navigate to the live directory:
   ```
   cd docker/live
   ```

2. Copy the example environment file and edit with secure values:
   ```
   cp .env.example .env
   nano .env
   ```

3. Create a backups directory:
   ```
   mkdir -p backups
   ```

4. Start the services:
   ```
   docker-compose up -d
   ```

5. Access the application at https://digitalwahl.org

## Manual Deployment without Docker Registry

You can build Docker images locally and deploy them manually to a target server without using a Docker registry:

1. Build the images locally:
   ```bash
   # In the project root directory
   docker build -t voting-api:latest -f docker/local/Dockerfile.api .
   docker build -t voting-client:latest -f docker/local/Dockerfile.client .
   ```

2. Export the images to files:
   ```bash
   docker save voting-api:latest | gzip > voting-api.tar.gz
   docker save voting-client:latest | gzip > voting-client.tar.gz
   ```

3. Transfer the files to the target server:
   ```bash
   scp voting-api.tar.gz voting-client.tar.gz user@server:/path/to/destination/
   ```

4. On the target server, import the images:
   ```bash
   docker load < voting-api.tar.gz
   docker load < voting-client.tar.gz
   ```

5. Use the images with environment variables from the target environment:
   ```bash
   # Run with environment variables from a file
   docker run -d --name voting_api --env-file /path/to/.env --network voting_network voting-api:latest
   
   # Or modify the docker-compose.yaml to use the local images
   # Replace the build section with:
   # image: voting-api:latest
   ```

## Database Migration

After starting the services for the first time, you need to run the database migration:

```
docker exec -it voting_api npm run db:migrate
```

## Backup and Restore

### Manual Backup

```
docker-compose exec backup /bin/sh -c "mysqldump -h db -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME | gzip > /backups/manual_backup_\$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Restore from Backup

```
# Stop the services
docker-compose down

# Start only the database
docker-compose up -d db

# Restore the database
gunzip -c /path/to/backup.sql.gz | docker exec -i voting_db mysql -u root -p<rootpassword> voting_db

# Start the remaining services
docker-compose up -d
```