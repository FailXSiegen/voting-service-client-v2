# VotingTool

A comprehensive digital voting platform built with Node.js, Vue.js, and Docker.

## Architecture

This application consists of three main services:
- **API Service** (`voting-service-api`): GraphQL API backend with WebSocket support
- **Client Service** (`voting-service-client-v2`): Vue.js frontend application
- **Consumer Service**: Handles asynchronous vote processing via RabbitMQ

## Technology Stack

- **Backend**: Node.js, Express, GraphQL (Apollo Server), WebSocket
- **Frontend**: Vue 3, Vite, Apollo Client, Bootstrap 5
- **Database**: MariaDB
- **Message Queue**: RabbitMQ
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Traefik with Let's Encrypt SSL
- **CI/CD**: GitLab CI/CD

## Quick Start

### Development

1. Clone the repository:
   ```bash
   git clone https://gitlab.failx.de/hetzner/voting-tool.git
   cd voting-tool
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Start development environment:
   ```bash
   cd docker/local
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://local.digitalwahl.org
   - API: http://local.digitalwahl.org/graphql
   - Database Admin: http://db.local.digitalwahl.org
   - RabbitMQ Management: http://rabbitmq.local.digitalwahl.org

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Features

- **Event Management**: Create and manage voting events
- **User Management**: Participant registration and authentication
- **Real-time Voting**: WebSocket-based live voting sessions
- **Multiple Poll Types**: Support for various voting formats
- **Results Export**: CSV export functionality
- **Zoom Integration**: Built-in video conferencing support
- **Responsive Design**: Mobile-friendly interface
- **Internationalization**: Multi-language support
- **Security**: JWT authentication, input validation, SQL injection protection

## Development

### API Service

```bash
cd voting-service-api
npm install
npm run dev
```

### Client Service

```bash
cd voting-service-client-v2
npm install
npm run dev
```

### Testing

```bash
# Linting
npm run lint

# Unit tests (when available)
npm run test:unit

# E2E tests
npm run test:e2e
```

## Environment Variables

Key environment variables for production:

- `DOMAIN`: Your domain name
- `JWT_SECRET`: Secret key for JWT tokens
- `DATABASE_*`: Database connection settings
- `RABBITMQ_*`: RabbitMQ connection settings
- `EMAIL_*`: SMTP email configuration

See `.env.example` for complete list.

## Monitoring and Logs

- Application logs are available in the `logs_volume` Docker volume
- Health checks are configured for all services
- Traefik provides access logs and metrics

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a merge request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please create an issue in the GitLab repository.