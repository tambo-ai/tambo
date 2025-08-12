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

- `DATABASE_URL`: Full database connection string. By default, this is derived from `POSTGRES_*` directly in `docker-compose.yml`. You can override it by setting `DATABASE_URL` in `docker.env`.

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

## OAuth Providers (Google and GitHub)

This section is for self‑hosted deployments using Docker. It explains how to configure Google and GitHub as OAuth providers for sign‑in.

### Callback/Redirect URLs

- Google OAuth callback path: `/api/auth/callback/google`
- GitHub OAuth callback path: `/api/auth/callback/github`

The full redirect URI is your deployment base URL plus the callback path. Examples:

- `https://your-domain.com/api/auth/callback/google`
- `https://your-domain.com/api/auth/callback/github`

In general: `<base-url>/api/auth/callback/google` and `<base-url>/api/auth/callback/github`.

Local (Docker) examples using this repo's documented ports:

- `http://localhost:3210/api/auth/callback/google`
- `http://localhost:3210/api/auth/callback/github`

For production deployments, use HTTPS for all redirect URIs (for example, `https://app.example.com/api/auth/callback/google`).

### Environment separation (recommended)

Create separate OAuth clients for local development and for production. Each environment must use its own redirect/callback URL that matches that environment’s base URL plus the correct callback path.

Examples (placeholders — use values that match your setup):

- Google: `<local-base-url>/api/auth/callback/google` and `<prod-base-url>/api/auth/callback/google`
- GitHub: `<local-base-url>/api/auth/callback/github` and `<prod-base-url>/api/auth/callback/github`

Note (NextAuth v4 in this app): Set `NEXTAUTH_URL` to your exact `<base-url>` and `NEXTAUTH_SECRET` for each environment. Avoid a trailing slash in `NEXTAUTH_URL`. See [docker.env.example](./docker.env.example) for the exact variable names used here.

### Environment variables and provider configuration

Set the following variables (see [docker.env.example](./docker.env.example) for placement):

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Provider selection and email fallback

You may configure either Google, GitHub, or both providers. If neither provider is configured, the application falls back to email login. For email login to work in a self‑hosted deployment, you must also configure your email service credentials (see the email settings noted elsewhere in this document and in [docker.env.example](./docker.env.example)).

### Where to configure this in Docker

Supply OAuth client credentials and related settings via your Docker deployment configuration (environment file or compose environment entries). See [docker.env.example](./docker.env.example) for the relevant variables and place your actual values in `docker.env` (or your secrets manager) when running `docker compose`.

### Console setup (high‑level)

- Google: Create an OAuth 2.0 Client ID in the Google Cloud Console Credentials page and add the exact Authorized redirect URIs as described above. Link: https://console.cloud.google.com/apis/credentials
- GitHub: Create an OAuth App in GitHub Developer Settings → OAuth Apps and add the exact Authorization callback URL as described above. Link: https://github.com/settings/developers

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
