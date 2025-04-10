# Tambo Cloud Monorepo

## Overview

This repository is a monorepo for the Tambo Cloud platform.

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
- **Infrastructure**: Supabase for local development
- **Tools**: Turborepo for monorepo management

## Getting Started

### Quick Start

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The setup script will:

1. Check and install prerequisites (Node.js, npm, Supabase CLI)
2. Install project dependencies
3. Set up Supabase locally
4. Create environment files from templates

You can also preview what the script will do without making any changes:

```bash
./setup.sh --dry-run
```

### Prerequisites

- **Node.js** (v20 or later)
- **npm** (v10 or later)
- **Supabase CLI**
- **Docker** (for running Supabase locally)

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
   # Start Supabase locally (requires Docker)
   npx supabase start

   # Run database migrations
   npm run db:migrate
   ```

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
