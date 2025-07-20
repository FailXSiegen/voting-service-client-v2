# Makefile for the VotingTool project Docker environment

# Default environment
ENV ?= local

# Docker compose files
DOCKER_COMPOSE = docker-compose.yaml
DOCKER_COMPOSE_OVERRIDE = docker-compose.override.yml

# Project name
PROJECT_NAME = votingtool

# Services
SERVICES = api consumer client db rabbitmq mailhog

# Helper functions
define check_service
	@if [ -z "$(shell docker ps -q -f name=$(PROJECT_NAME)_$(1))" ]; then \
		echo "Service $(1) is not running. Starting it..."; \
		docker-compose up -d $(1); \
	else \
		echo "Service $(1) is already running."; \
	fi
endef

#
# Main targets
#

# Default target
.PHONY: all
all: up

# Build all services
.PHONY: build
build:
	@echo "Building all services..."
	docker-compose build

# Build a specific service
.PHONY: build-service
build-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make build-service SERVICE=<service_name>"; \
		exit 1; \
	fi
	@echo "Building service $(SERVICE)..."
	docker-compose build $(SERVICE)

# Start all services
.PHONY: up
up:
	@echo "Starting all services..."
	docker-compose up -d

# Start services in the foreground
.PHONY: up-fg
up-fg:
	@echo "Starting all services in foreground..."
	docker-compose up

# Start a specific service
.PHONY: up-service
up-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make up-service SERVICE=<service_name>"; \
		exit 1; \
	fi
	@echo "Starting service $(SERVICE)..."
	docker-compose up -d $(SERVICE)

# Stop all services
.PHONY: down
down:
	@echo "Stopping all services..."
	docker-compose down

# Stop all services and remove volumes
.PHONY: down-v
down-v:
	@echo "Stopping all services and removing volumes..."
	docker-compose down -v

# Restart all services
.PHONY: restart
restart:
	@echo "Restarting all services..."
	docker-compose restart

# Restart a specific service
.PHONY: restart-service
restart-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make restart-service SERVICE=<service_name>"; \
		exit 1; \
	fi
	@echo "Restarting service $(SERVICE)..."
	docker-compose restart $(SERVICE)

# View logs for all services
.PHONY: logs
logs:
	@echo "Showing logs for all services..."
	docker-compose logs -f

# View logs for a specific service
.PHONY: logs-service
logs-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make logs-service SERVICE=<service_name>"; \
		exit 1; \
	fi
	@echo "Showing logs for service $(SERVICE)..."
	docker-compose logs -f $(SERVICE)

# Execute a command in a running container
.PHONY: exec
exec:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Usage: make exec SERVICE=<service_name> [CMD=<command>]"; \
		exit 1; \
	fi
	@if [ -z "$(CMD)" ]; then \
		docker-compose exec $(SERVICE) sh; \
	else \
		docker-compose exec $(SERVICE) $(CMD); \
	fi

# Cleanup everything
.PHONY: clean
clean:
	@echo "Cleaning up everything..."
	docker-compose down -v --rmi all --remove-orphans

#
# Development helpers
#

# Run migrations
.PHONY: migrate
migrate:
	$(call check_service,api)
	@echo "Running database migrations..."
	docker-compose exec api npm run db:migrate

# Run tests
.PHONY: test
test:
	$(call check_service,api)
	@echo "Running tests..."
	docker-compose exec api npm test

# Check API health
.PHONY: health-api
health-api:
	$(call check_service,api)
	@echo "Checking API health..."
	docker-compose exec api node healthcheck.js api

# Check Consumer health
.PHONY: health-consumer
health-consumer:
	$(call check_service,consumer)
	@echo "Checking Consumer health..."
	docker-compose exec consumer node healthcheck.js consumer

# Show Docker status
.PHONY: status
status:
	@echo "Docker containers status:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show RabbitMQ status
.PHONY: rabbitmq-status
rabbitmq-status:
	$(call check_service,rabbitmq)
	@echo "RabbitMQ status:"
	docker-compose exec rabbitmq rabbitmqctl status

# Enable RabbitMQ processing
.PHONY: enable-rabbitmq
enable-rabbitmq:
	$(call check_service,db)
	@echo "Enabling RabbitMQ processing..."
	docker-compose exec db mysql -uuser -p1234 application -e "UPDATE system_settings SET use_rabbitmq = true;"
	@echo "RabbitMQ processing enabled."

# Disable RabbitMQ processing
.PHONY: disable-rabbitmq
disable-rabbitmq:
	$(call check_service,db)
	@echo "Disabling RabbitMQ processing..."
	docker-compose exec db mysql -uuser -p1234 application -e "UPDATE system_settings SET use_rabbitmq = false;"
	@echo "RabbitMQ processing disabled."