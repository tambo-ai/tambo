# Tambo Cloud Monorepo

## Overview

This repository is a monorepo for the Tambo Cloud platform. Contribute to this repo to modify how Tambo's hosted API works, or use this repo to run Tambo locally for development or self-hosting.

To build AI web applications that use Tambo's hosted API, use our [React SDK](https://github.com/tambo-ai/tambo).

For detailed information about what Tambo is and how it works, check out our [docs site.](https://docs.tambo.co)

For a quick walkthrough of using the fundamental features of Tambo, check out [this page.](https://docs.tambo.co/getting-started/quickstart)

## Repository Structure

The repository is organized into two main directories:

### Applications

The main applications are located in the [apps](./apps) directory:

- [web](./apps/web) - The Next.js frontend application, including the landing page and project dashboard
- [api](./apps/api) - The NestJS API server, including Swagger UI documentation and API routes

### Shared Libraries

Reusable libraries are located in the [packages](./packages) directory:

- [backend](./packages/backend) - A library for interacting with the LLM
- [@tambo-ai-cloud/core](./packages/core) - A library for basic shared utilities/etc.
- [@tambo-ai-cloud/db](./packages/db) - A library for interacting with the database. This is mostly the drizzle schema and migrations.

There also are some basic supporting packages only used during development:

- [eslint-config](./packages/eslint-config) - ESLint configurations for the project, with specific configs for Next.js apps and libraries
- [typescript-config](./packages/typescript-config) - TypeScript configurations with specific settings for Next.js apps and libraries

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: NestJS, TypeScript, Swagger
- **Database**: PostgreSQL, Drizzle ORM
- **Infrastructure**: Docker with PostgreSQL for local development
- **Tools**: Turborepo for monorepo management

## Slack Integration

When a new customer requests a dedicated support channel Tambo Cloud:

1. Creates a public channel (`conversations.create`)
2. Invites the customer’s email (`conversations.inviteShared`)
3. Adds an internal teammate (`conversations.invite`)

By default Slack grants invited external users a **limited** role, which prevents
them from inviting additional teammates.  
We now explicitly set `external_limited: false` so customers receive **full-access**
rights and can manage their own members.

To allow this, the Slack bot token (`SLACK_OAUTH_TOKEN`) must include the
`conversations.connect:write` OAuth scope in addition to the scopes you already
use (e.g. `channels:manage`, `chat:write`).  
Generate or update the token in your Slack app settings, then place it in
`apps/web/.env.local` (see `.env.example`).

## Getting Started

### Quick Start with Docker

```bash
# Setup the Docker environment
./scripts/tambo-setup.sh

# Edit the created docker.env with your actual values

# Start the stack
./scripts/tambo-start.sh

# Initialize the database
./scripts/init-database.sh
```

The setup script will:

1. Check and install prerequisites (Docker, Docker Compose, jq)
2. Create environment files from templates
3. Make all scripts executable

Find detailed instructions on running Tambo through Docker [here.](./DOCKER_README.md)

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js** (v22 or later) and **npm** (for database initialization)
- **jq** command-line tool (for health checks)

### Manual Development Setup

If you prefer to set things up manually, follow these steps:

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Setup**:

   Create `.env` files in the following locations using their respective `.env.example` templates:
   - `apps/api/.env`
   - `apps/web/.env.local`
   - `packages/db/.env`

3. **Database Setup**:

   ```bash
   # Start PostgreSQL locally (requires Docker)
   ./scripts/tambo-start.sh

   # Initialize the database
   ./scripts/init-database.sh
   ```

   **Note**: The Docker stack runs on different ports to avoid conflicts with local development:
   - Docker Web: http://localhost:3210 (vs local:3000)
   - Docker API: http://localhost:3211 (vs local:3001)
   - Docker PostgreSQL: localhost:5433 (vs local:5432)

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Development Commands

#### Core Commands

- `npm run dev` - Runs the API and web apps in development mode
- `npm run build` - Builds all applications
- `npm run hydra-api:start` - Starts the API server in production mode
- `npm run lint` - Runs linting across all applications
- `npm run lint:fix` - Runs linting with automatic fixes
- `npm run format` - Formats code using Prettier
- `npm run prettier-check` - Checks formatting without making changes
- `npm run check-types` - Checks TypeScript types across all applications

#### Database Commands

- `npm run db:generate` - Generates SQL migrations based on schema changes
- `npm run db:migrate` - Applies pending migrations to the database
- `npm run db:check` - Checks migration status
- `npm run db:studio` - Opens Drizzle Studio for database visualization

#### Turborepo Commands

You can also use Turborepo directly:

```bash
turbo dev      # Development mode
turbo build    # Build all packages
turbo lint     # Lint all packages
```

## API Key Setup

After setting up your local environment, configure your Tambo API key:

1. Start your local environment:

   ```bash
   npm run dev
   ```

2. Get your API key:
   - Visit: `http://localhost:3000/dashboard`
   - Login with your credentials
   - Create a new project
   - Generate your API key

3. Configure the API key:
   - Add the key to `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
   ```

4. Verify your setup:
   - Visit: `http://localhost:3000/internal/smoketest`

## Frontend

The landing page and dashboard are built with:

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components

## Tambo Cloud — Architecture Overview

![Tambo Cloud Architecture](./assets/tambo-cloud-architecture.drawio.svg)
