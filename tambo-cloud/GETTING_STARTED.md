# Getting Started with Tambo

A concise guide to set up the Tambo monorepo for local development or self-hosting.

## Prerequisites

- Node.js >= 22 and npm >= 10 (Volta versions are pinned in `package.json`)
- Docker and Docker Compose
- jq (used by some scripts)

## Clone and Install

```bash
# Clone
https://github.com/tambo-ai/tambo-cloud.git
cd tambo-cloud

# Install
npm install
```

## Environment Setup

Create env files from the examples as needed:

- `apps/api/.env`
- `apps/web/.env.local`
- `packages/db/.env`

Ensure values are set before running any app.

## Option A: Quick Start with Docker

Runs API, Web, and Postgres via Docker.

```bash
./scripts/tambo-setup.sh
# edit docker.env with your values
./scripts/tambo-start.sh
./scripts/init-database.sh
```

- Web (Docker): http://localhost:3210
- API (Docker): http://localhost:3211
- Postgres (Docker): 5433

See the detailed guide: [Docker Readme](./DOCKER_README.md).

## Option B: Manual Dev (Local Node, Docker Postgres)

```bash
# start Postgres via Docker
./scripts/tambo-start.sh
# initialize the database
./scripts/init-database.sh

# start dev servers (web + api)
npm run dev
```

- Web (Local): http://localhost:3000
- API (Local): http://localhost:3001

## Common Commands

- `npm run dev` run API and Web in dev
- `npm run build` build all apps and packages
- `npm run lint` lint all workspaces
- `npm run check-types` TypeScript checks
- `npm run db:generate` create Drizzle migrations
- `npm run db:migrate` apply migrations
- `npm run db:studio` open Drizzle Studio

## Get an API Key (Local)

1. Start dev servers: `npm run dev`.
2. Visit `http://localhost:3000/dashboard`, sign in, create a project, and generate an API key.
3. Add to `apps/web/.env.local`:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
```

4. Verify at `http://localhost:3000/internal/smoketest`.

## Repository Structure

- `apps/web` Next.js frontend
- `apps/api` NestJS backend
- `packages/core` shared utilities
- `packages/db` Drizzle schema and migrations
- `packages/backend` backend helpers

## Troubleshooting

- Port conflicts: stop other services or change ports in env files.
- Migration issues: verify `packages/db/.env` and database connectivity.
- Type errors: run `npm run check-types` and address reported issues.

## Helpful Links

- Docs site: `https://docs.tambo.co`
- React SDK: `https://github.com/tambo-ai/tambo`
- Release and SDK notes: see [`RELEASING.md`](./RELEASING.md)
