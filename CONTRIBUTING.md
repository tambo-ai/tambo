# Contributing to Tambo

> **Using an AI coding assistant?** Read [@AGENTS.md](./AGENTS.md) for agent-specific instructions.

Thanks for helping! This guide covers development setup and workflow expectations.

> **Looking to self-host Tambo?** See [OPERATORS.md](./OPERATORS.md) for deployment instructions.

## Development Setup

### Prerequisites

- Node.js >= 22
- npm >= 11
- Docker (for either database option below)

### 1. Clone and Install

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo
npm install
```

### 2. Set Up Environment Files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
```

### 3. Start Database

Choose **one** of these options:

#### Option A: Supabase (Recommended)

Supabase provides PostgreSQL with additional features. The `.env.example` files are pre-configured for this option.

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Start Supabase (includes PostgreSQL on port 54322)
supabase start
```

The default `DATABASE_URL` in `.env.example` files already points to Supabase:

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Option B: Docker PostgreSQL

If you prefer plain PostgreSQL without Supabase:

```bash
# One-time setup (creates docker.env)
./scripts/cloud/tambo-setup.sh

# Start PostgreSQL container
docker compose --env-file docker.env up postgres -d
```

Then update `DATABASE_URL` in all three env files:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tambo
```

Use the password from your `docker.env` file.

> **Note**: Don't use `tambo-start.sh` for local development - it starts all services in Docker, which conflicts with running apps locally via `npm run dev:cloud`.

### 4. Initialize Database

```bash
npm run db:migrate -w packages/db
```

### 5. Start Development Servers

For Tambo Cloud (web dashboard + API):

```bash
npm run dev:cloud
```

- **Web App**: http://localhost:8260
- **API**: http://localhost:8261

For the React SDK framework (showcase + docs):

```bash
npm run dev
```

For React SDK development (SDK in watch mode + showcase):

```bash
npm run dev:sdk
```

This runs the React SDK in watch mode (automatically rebuilds on changes) alongside the showcase app, making it easy to develop and test SDK changes.

### 6. Get a Local API Key

1. Start the dev servers: `npm run dev:cloud`
2. Visit http://localhost:8260/dashboard and sign in
3. Create a project and generate an API key
4. Add to `apps/web/.env.local`: `NEXT_PUBLIC_TAMBO_API_KEY=your_key`
5. Verify with http://localhost:8260/internal/smoketest

## Common Commands

```bash
# Development
npm run dev:cloud        # Start web + API for Tambo Cloud
npm run dev              # Start showcase + docs for React SDK
npm run dev:sdk          # Start React SDK watch mode + showcase

# Quality (required before PRs)
npm run lint
npm run check-types
npm test

# Database
npm run db:generate -w packages/db  # Generate migrations
npm run db:migrate -w packages/db   # Apply migrations
npm run db:studio -w packages/db    # Open Drizzle Studio

# React SDK
npm run build:sdk        # One-time build of React SDK
npm run dev:sdk          # SDK watch mode + showcase (for SDK development)
```

## Environment Variables

### Required

| Variable              | Location                                                   | Description                  |
| --------------------- | ---------------------------------------------------------- | ---------------------------- |
| `DATABASE_URL`        | `packages/db/.env`, `apps/api/.env`, `apps/web/.env.local` | PostgreSQL connection string |
| `API_KEY_SECRET`      | `apps/api/.env`, `apps/web/.env.local`                     | API key encryption secret    |
| `PROVIDER_KEY_SECRET` | `apps/api/.env`, `apps/web/.env.local`                     | Provider key encryption      |
| `NEXTAUTH_SECRET`     | `apps/web/.env.local`                                      | NextAuth.js session secret   |
| `NEXTAUTH_URL`        | `apps/web/.env.local`                                      | http://localhost:8260        |

### Optional

| Variable                  | Location              | Description                                                                   |
| ------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `OPENAI_API_KEY`          | `apps/api/.env`       | To allow Tambo Cloud to use AI features                                       |
| `FALLBACK_OPENAI_API_KEY` | `apps/api/.env`       | Used as a fallback API key for OpenAI if others are not set                   |
| `GOOGLE_CLIENT_ID`        | `apps/web/.env.local` | Google App Client ID for OAuth login (https://console.cloud.google.com/)      |
| `GOOGLE_CLIENT_SECRET`    | `apps/web/.env.local` | As above                                                                      |
| `GITHUB_CLIENT_ID`        | `apps/web/.env.local` | GitHub App Client ID for OAuth login (https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET`    | `apps/web/.env.local` | As above                                                                      |

## Repository Structure

| Directory          | Description                     |
| ------------------ | ------------------------------- |
| `apps/web`         | Next.js web application         |
| `apps/api`         | NestJS API server               |
| `packages/db`      | Drizzle schema + migrations     |
| `packages/core`    | Shared utilities (no DB access) |
| `packages/backend` | LLM/agent helpers               |
| `react-sdk/`       | React SDK (`@tambo-ai/react`)   |
| `cli/`             | CLI tools                       |
| `showcase/`        | Demo application                |
| `docs/`            | Documentation site              |

## Troubleshooting

### Database Connection Issues

**For Supabase:**

1. Verify Supabase is running: `supabase status`
2. Check `DATABASE_URL` uses port `54322`
3. Restart if needed: `supabase stop && supabase start`

**For Docker PostgreSQL:**

1. Verify container is running: `docker compose --env-file docker.env ps postgres`
2. Check `DATABASE_URL` uses port `5433` (not `5432`)
3. Ensure password in `DATABASE_URL` matches `docker.env`

### Port Conflicts

Stop conflicting services or modify ports in `docker.env` / `docker-compose.yml`.

### Clean Install

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Pull Request Workflow

1. Pick or file an issue, branch from `main`
2. Build the feature/fix with tests
3. Run `npm run lint && npm run check-types && npm test`
4. Open a PR with a [Conventional Commit](https://www.conventionalcommits.org/) title

### PR Title Format

```
<type>(scope): description
```

- `feat(scope): ...` → Minor release
- `fix|perf|refactor(scope): ...` → Patch release
- Breaking change → add `!`: `feat(scope)!: ...`

Scopes: `api`, `web`, `core`, `cli`, `docs`, `react-sdk`

### PR Checklist

- [ ] Conventional Commit title
- [ ] Linked issue or context
- [ ] Tests added/updated
- [ ] Docs updated (if user-facing)
- [ ] Screen recording attached (if visual change)
- [ ] All checks pass locally

## Related Documentation

| Document                       | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| [AGENTS.md](./AGENTS.md)       | Coding standards, architecture, naming conventions |
| [OPERATORS.md](./OPERATORS.md) | Self-hosting and deployment                        |
| [RELEASING.md](./RELEASING.md) | Release workflow                                   |

## Links

- Discord: https://discord.gg/dJNvPEHth6
- Docs: https://docs.tambo.co

Thanks for contributing!
