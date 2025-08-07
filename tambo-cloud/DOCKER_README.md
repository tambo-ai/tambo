# Tambo Docker Setup

This document describes how to run Tambo using Docker with a PostgreSQL database.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm (for database initialization)
- `jq` command-line tool (for health checks)

## Quick Start

1. **Setup the environment:**

   ```bash
   ./scripts/tambo-setup.sh
   ```

2. **Configure environment variables:**

   ```bash
   cp docker.env.example docker.env
   # Edit docker.env with your actual values
   ```

3. **Start the stack:**

   ```bash
   ./scripts/tambo-start.sh
   ```

4. **Initialize the database:**

   ```bash
   ./scripts/init-database.sh
   ```

5. **Access your applications:**
   - Tambo Web: http://localhost:3210
   - Tambo API: http://localhost:3211
   - PostgreSQL Database: localhost:5433

## Services

The Docker stack includes the following services:

- **postgres**: PostgreSQL 15 database (port 5433)
- **web**: Tambo Next.js web application (port 3210)
- **api**: Tambo NestJS API server (port 3211)

### Port Configuration

The Docker stack uses different ports than local development to avoid conflicts:

| Service    | Docker Port | Local Development Port |
| ---------- | ----------- | ---------------------- |
| Web App    | 3210        | 3000                   |
| API        | 3211        | 3001                   |
| PostgreSQL | 5433        | 5432                   |

This allows you to run both the Docker stack and local development simultaneously.

## Environment Variables

Key environment variables in `docker.env`:

### PostgreSQL Configuration

- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name (default: `tambo`)
- `POSTGRES_USER`: Database user (default: `postgres`)

### Database Connection

- `DATABASE_URL`: Full database connection string

### API Keys

- `API_KEY_SECRET`: Secret for API key generation
- `PROVIDER_KEY_SECRET`: Secret for provider key generation
- `OPENAI_API_KEY`: OpenAI API key
- `EXTRACTION_OPENAI_API_KEY`: OpenAI API key for extraction
- `FALLBACK_OPENAI_API_KEY`: Fallback OpenAI API key

### Other Configuration

- `RESEND_API_KEY`: Email service API key
- `SLACK_OAUTH_TOKEN`: Slack integration token
- `WEATHER_API_KEY`: Weather service API key

## Scripts

### `tambo-start.sh`

Starts all services and waits for them to be healthy.

### `tambo-stop.sh`

Stops all services and cleans up the network.

### `tambo-logs.sh`

Shows logs from all services or a specific service.

### `init-database.sh`

Initializes the PostgreSQL database with the required schema using Drizzle migrations.

### `tambo-setup.sh`

Sets up the Docker environment for first-time use.

## Database Management

### Connecting to PostgreSQL

```bash
# Connect using psql
docker compose --env-file docker.env exec postgres psql -U postgres -d tambo

# Or connect from host
psql -h localhost -p 5433 -U postgres -d tambo
```

### Running Migrations

The `init-database.sh` script automatically runs all migrations. To run migrations manually:

```bash
npm run db:migrate
```

### Backup and Restore

```bash
# Backup
docker compose --env-file docker.env exec postgres pg_dump -U postgres tambo > backup.sql

# Restore
docker compose --env-file docker.env exec -T postgres psql -U postgres tambo < backup.sql
```

## Troubleshooting

### Check Service Status

```bash
docker compose --env-file docker.env ps
```

### View Logs

```bash
# All services
./scripts/tambo-logs.sh

# Specific service
./scripts/tambo-logs.sh postgres
./scripts/tambo-logs.sh api
./scripts/tambo-logs.sh web
```

### Reset Everything

```bash
# Stop and remove everything
docker compose --env-file docker.env down -v
docker volume rm tambo-cloud_tambo_postgres_data

# Start fresh
./scripts/tambo-start.sh
./scripts/init-database.sh
```

## Development

For development, you can override the `NODE_ENV` in `docker.env`:

```bash
NODE_ENV=development
```

This will enable hot reloading and development features.

## Security Notes

- Change default passwords in `docker.env`
- Use strong, unique passwords for production
- Consider using Docker secrets for sensitive data in production
- The PostgreSQL port (5432) is exposed for development; consider removing this in production
