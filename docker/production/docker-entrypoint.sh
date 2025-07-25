#!/bin/sh
set -e

echo "=== DEBUG: API Container Startup ==="
echo "Current time: $(date)"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
echo "Environment variables:"
env | grep -E "(NODE_ENV|DATABASE_|JWT_|EMAIL_|RABBITMQ_|HOST|DOMAIN)" | sort
echo "Command to execute: $@"
echo "Files in app directory:"
ls -la /app
echo "=========================="

# Function to wait for database
wait_for_db() {
    echo "Waiting for database connection..."
    while ! nc -z "$DATABASE_HOST" 3306; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done
    echo "Database is up - executing command"
}

# Function to wait for RabbitMQ
wait_for_rabbitmq() {
    echo "Waiting for RabbitMQ connection..."
    while ! nc -z "$RABBITMQ_HOST" 5672; do
        echo "RabbitMQ is unavailable - sleeping"
        sleep 1
    done
    echo "RabbitMQ is up - executing command"
}

# Wait for dependencies
if [ "${DATABASE_HOST}" ]; then
    wait_for_db
fi

if [ "${RABBITMQ_HOST}" ]; then
    wait_for_rabbitmq
fi

# Run database migrations if needed
if [ "${NODE_ENV}" = "production" ]; then
    echo "Running database migrations..."
    npm run db:migrate || echo "Migration failed or not needed"
fi

# Execute the main command
exec "$@"