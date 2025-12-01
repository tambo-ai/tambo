## Getting Started with Tambo

Tambo combines the React-based generative UI framework with the Tambo Cloud platform (Next.js + NestJS + shared packages). This guide covers local development, Docker workflows, and key scripts.

### Prerequisites

- Node.js ≥ 22 and npm ≥ 11 (versions are pinned via Volta in `package.json`)
- Git
- Docker + Docker Compose (required for the Docker workflow or when running Postgres locally)
- `jq` (used by helper scripts)

Optional: a modern browser for component testing and Loom (or similar) for PR demo videos.

### Clone and Install

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo
npm install
```

### Environment Files

Copy the provided examples and fill in the required values:

- `apps/api/.env`
- `apps/web/.env.local`
- `packages/db/.env`
- `docker.env` (created by the Docker setup script)

See `.env.example` files for the exact keys. Common variables: `DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_TAMBO_API_KEY`, `NEXTAUTH_SECRET`, `LANGFUSE_*`, `SENTRY_DSN`, etc.

### Option A: Quick Start with Docker

Runs API, Web, and Postgres via Docker using the helper scripts in `scripts/cloud/`:

```bash
./scripts/cloud/tambo-setup.sh   # one-time setup and env scaffolding
# edit docker.env with your values
./scripts/cloud/tambo-start.sh
./scripts/cloud/init-database.sh
```

Docker uses alternate ports to avoid local conflicts:

- Web: http://localhost:3210
- API: http://localhost:3211
- Postgres: localhost:5433

See [README.DOCKER.md](./README.DOCKER.md) for the full Docker deployment guide.

### Option B: Manual Dev (Local Node, Docker Postgres)

```bash
# start Postgres via Docker
./scripts/cloud/tambo-start.sh

# initialize the database schema/migrations
./scripts/cloud/init-database.sh

# run the web + API apps
npm run dev
```

Local ports:

- Web: http://localhost:3000
- API: http://localhost:3001

### Common Commands

```bash
npm run dev          # apps/web + apps/api
npm run build        # build all apps/packages
npm run lint         # lint everything (npm run lint:fix to autofix)
npm run check-types  # TypeScript checking
npm test             # run workspace tests
npm run db:generate  # create Drizzle migrations
npm run db:migrate   # apply migrations
npm run db:studio    # open Drizzle Studio
```

Use `npm run <script> -w <workspace>` for package-scoped commands (example: `npm run dev -w cli`).

### Get a Local API Key

1. `npm run dev`
2. Visit http://localhost:3000/dashboard and sign in.
3. Create a project and generate an API key.
4. Add it to `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
   ```

5. Verify with http://localhost:3000/internal/smoketest.

### Repository Structure Highlights

- `apps/web` – Next.js App Router UI (tRPC, Shadcn, Tailwind).
- `apps/api` – NestJS API with Swagger/OpenAPI.
- `apps/*mcp*` – MCP proxy/support services.
- `packages/db` – Drizzle schema + migrations (single source of truth).
- `packages/core` – Pure utilities (no DB access).
- `packages/backend` – LLM/agent helpers and streaming utilities.
- `react-sdk`, `cli`, `showcase`, `docs`, `create-tambo-app` – Framework packages at the Turborepo root.

### Troubleshooting

- Ensure you are running Node 22+ / npm 11+ (Volta will pin versions automatically).
- If install issues appear, run `rm -rf node_modules package-lock.json && npm install`.
- Restart dev servers after editing `.env` files.
- When migrations fail, verify `packages/db/.env` and that Postgres is reachable.
- For Docker port conflicts, stop other services or adjust ports in `docker.env`.

### Next Steps

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow requirements, PR checklist, and doc expectations. Keep [AGENTS.md](./AGENTS.md) handy for coding standards and architecture guidance.
