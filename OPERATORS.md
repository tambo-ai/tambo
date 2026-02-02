# Operators Guide

This guide is for deploying and self-hosting Tambo in production or staging environments.

> **Looking to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development setup.

## Overview

Tambo consists of three services:

| Service        | Technology    | Default Port | Description                  |
| -------------- | ------------- | ------------ | ---------------------------- |
| **Web**        | Next.js       | 3210         | Dashboard and user interface |
| **API**        | NestJS        | 3211         | REST API for client requests |
| **PostgreSQL** | PostgreSQL 17 | 5433         | Database                     |

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (or compatible provider)

### 1. Clone the Repository

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo
```

### 2. Set Up Environment

```bash
./scripts/cloud/tambo-setup.sh
```

This creates `docker.env` from `docker.env.example`.

### 3. Configure Environment Variables

Edit `docker.env` with your values. At minimum, you must set:

```bash
# Required
POSTGRES_PASSWORD=your-secure-password-here
API_KEY_SECRET=your-32-character-api-key-secret
PROVIDER_KEY_SECRET=your-32-character-provider-secret
NEXTAUTH_SECRET=your-nextauth-secret
FALLBACK_OPENAI_API_KEY=your-openai-api-key
```

`docker.env.example` includes placeholder values; replace them with strong secrets before starting the stack.

See [Environment Variables Reference](#environment-variables-reference) for all options.

### 4. Start Services

```bash
./scripts/cloud/tambo-start.sh
```

### 5. Initialize Database

```bash
./scripts/cloud/init-database.sh
```

### 6. Access Your Deployment

- **Web Dashboard**: http://localhost:3210
- **API**: http://localhost:3211

## Environment Variables Reference

### Core Configuration

| Variable              | Required | Description                                                                              |
| --------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`   | Yes      | PostgreSQL password                                                                      |
| `POSTGRES_DB`         | No       | Database name (default: `tambo`)                                                         |
| `POSTGRES_USER`       | No       | Database user (default: `postgres`)                                                      |
| `API_KEY_SECRET`      | Yes      | 32+ character secret for API key encryption                                              |
| `PROVIDER_KEY_SECRET` | Yes      | 32+ character secret for provider key encryption                                         |
| `NEXTAUTH_SECRET`     | Yes      | Secret for NextAuth.js sessions                                                          |
| `NEXTAUTH_URL`        | Yes      | Base URL for auth callbacks (e.g., `http://localhost:3210` or `https://your-domain.com`) |

### OpenAI Configuration

| Variable                  | Required | Description                                             |
| ------------------------- | -------- | ------------------------------------------------------- |
| `OPENAI_API_KEY`          | No       | Primary OpenAI key for generation                       |
| `FALLBACK_OPENAI_API_KEY` | Yes      | Default OpenAI key when projects don't have custom keys |

### Authentication (OAuth or Email)

To sign in to the dashboard, you must configure **either** at least one OAuth provider (Google or GitHub) **or** email login (Resend). If you configure neither, users will not be able to sign in.

Note: If any OAuth provider is configured, the deployment uses OAuth login only (even if email settings are present). Email login is only enabled when no OAuth providers are configured.

#### OAuth (Optional)

Configure at least one of the following providers to enable OAuth login.

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID     |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

#### Email Login (Optional)

Email login requires at minimum `RESEND_API_KEY` and `EMAIL_FROM_DEFAULT`.

| Variable                 | Description                       |
| ------------------------ | --------------------------------- |
| `RESEND_API_KEY`         | Resend API key for sending emails |
| `RESEND_AUDIENCE_ID`     | Resend audience for newsletters   |
| `EMAIL_FROM_DEFAULT`     | Default sender email address      |
| `EMAIL_FROM_PERSONAL`    | Personal/support sender email     |
| `EMAIL_REPLY_TO_SUPPORT` | Support reply-to address          |

### Optional Features

| Variable                   | Description                                |
| -------------------------- | ------------------------------------------ |
| `ALLOWED_LOGIN_DOMAIN`     | Restrict logins to a specific email domain |
| `DISALLOWED_EMAIL_DOMAINS` | Block signups from these domains           |
| `LANGFUSE_PUBLIC_KEY`      | Langfuse analytics public key              |
| `LANGFUSE_SECRET_KEY`      | Langfuse analytics secret key              |
| `LANGFUSE_HOST`            | Langfuse host URL                          |
| `NEXT_PUBLIC_POSTHOG_KEY`  | PostHog analytics key                      |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL                           |
| `SENTRY_DSN`               | Sentry error tracking DSN                  |

### Whitelabeling

| Variable                    | Description                       |
| --------------------------- | --------------------------------- |
| `TAMBO_WHITELABEL_ORG_NAME` | Organization name displayed in UI |
| `TAMBO_WHITELABEL_ORG_LOGO` | URL to organization logo          |

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI:
   - Local: `http://localhost:3210/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to `docker.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - Local: `http://localhost:3210/api/auth/callback/github`
   - Production: `https://your-domain.com/api/auth/callback/github`
4. Copy Client ID and Secret to `docker.env`

## Production Deployment

### Self-hosting with npm (Convenience Scripts)

These npm scripts are **convenience aliases** for Docker-based commands.  
They require **bash**, so Windows users should run them in **WSL** or **Git Bash**.

```bash
npm run tambo:setup   # Initial setup
npm run tambo:start   # Start services
npm run tambo:stop    # Stop services
```

### Using Docker Compose

For production, update `docker.env`:

```bash
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
```

Add a reverse proxy (nginx, Caddy, Traefik) for HTTPS termination.

### Kubernetes Deployment

The Docker images can be deployed to Kubernetes. Example deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tambo-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tambo-web
  template:
    metadata:
      labels:
        app: tambo-web
    spec:
      containers:
        - name: web
          image: tambo-web:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: tambo-secrets
```

Build images:

```bash
./scripts/cloud/tambo-build.sh
```

Tag and push to your container registry:

```bash
docker tag tambo-web:latest your-registry/tambo-web:latest
docker tag tambo-api:latest your-registry/tambo-api:latest
docker push your-registry/tambo-web:latest
docker push your-registry/tambo-api:latest
```

### Security Recommendations

1. **Change all default passwords** - Use strong, unique values for all secrets
2. **Use HTTPS** - Always use TLS in production
3. **Restrict database access** - Don't expose PostgreSQL port publicly
4. **Use secrets management** - Consider Docker secrets or Kubernetes secrets
5. **Set `ALLOWED_LOGIN_DOMAIN`** - Restrict access to your organization's domain

## Operations

### Helper Scripts

| Script                             | Description                         |
| ---------------------------------- | ----------------------------------- |
| `./scripts/cloud/tambo-setup.sh`   | First-time environment setup        |
| `./scripts/cloud/tambo-start.sh`   | Start all services                  |
| `./scripts/cloud/tambo-stop.sh`    | Stop all services                   |
| `./scripts/cloud/tambo-logs.sh`    | View logs (all or specific service) |
| `./scripts/cloud/tambo-build.sh`   | Build Docker images                 |
| `./scripts/cloud/init-database.sh` | Run database migrations             |
| `./scripts/cloud/tambo-psql.sh`    | PostgreSQL CLI access               |

### Database Management

```bash
# Connect to PostgreSQL
./scripts/cloud/tambo-psql.sh

# Or via docker compose
docker compose --env-file docker.env exec postgres psql -U postgres -d tambo

# Run migrations
./scripts/cloud/init-database.sh

# Backup
docker compose --env-file docker.env exec postgres pg_dump -U postgres tambo > backup.sql

# Restore
docker compose --env-file docker.env exec -T postgres psql -U postgres tambo < backup.sql
```

### Viewing Logs

```bash
# All services
./scripts/cloud/tambo-logs.sh

# Specific service
./scripts/cloud/tambo-logs.sh postgres
./scripts/cloud/tambo-logs.sh api
./scripts/cloud/tambo-logs.sh web
```

### Health Checks

All services include Docker health checks. Check status:

```bash
docker compose --env-file docker.env ps
```

## Troubleshooting

### Services Won't Start

1. Check Docker is running: `docker info`
2. Check `docker.env` exists and has required variables
3. View logs: `./scripts/cloud/tambo-logs.sh`

### Database Connection Errors

1. Verify PostgreSQL is healthy: `docker compose --env-file docker.env ps postgres`
2. Check `DATABASE_URL` is correctly set (auto-derived from `POSTGRES_*` variables)

### OAuth Not Working

1. Verify `NEXTAUTH_URL` matches your deployment URL exactly (no trailing slash)
2. Check OAuth callback URLs in provider settings match your deployment
3. Ensure both `_CLIENT_ID` and `_CLIENT_SECRET` are set

### Reset Everything

```bash
# Stop and remove containers + volumes
docker compose --env-file docker.env down -v
docker volume rm tambo_tambo_postgres_data

# Start fresh
./scripts/cloud/tambo-start.sh
./scripts/cloud/init-database.sh
```

## Upgrading

1. Pull latest changes: `git pull`
2. Rebuild images: `./scripts/cloud/tambo-build.sh`
3. Restart services: `./scripts/cloud/tambo-stop.sh && ./scripts/cloud/tambo-start.sh`
4. Run migrations: `./scripts/cloud/init-database.sh`
