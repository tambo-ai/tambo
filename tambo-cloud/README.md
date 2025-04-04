# HydraAI Monorepo

## This repo is a monorepo for the HydraAI project.

The main apps are in the [apps](./apps) directory:

- [hydra-ai-client](./apps/web) - The main nextjs app, including the landing page and the project dashboard
- [hydra-ai-api](./apps/api) - The nestjs api server, including the swagger ui and the api routes

There are shared libraries in the [packages](./packages) directory:

- [backend](./packages/backend) - A library for interacting with the LLM
- [@tambo-ai-cloud/core](./packages/core) - A library for basic shared utilities/etc.
- [@tambo-ai-cloud/db](./packages/db) - A library for interacting with the database. This is mostly the drizzle schema and migrations.

There also are some basic supporting packages only used during development:

- [@tambo-ai-cloud/eslint-config](./packages/eslint-config) - All the eslint config files for the project, with specific configs for NextJS apps and libraries
- [@tambo-ai-cloud/typescript-config](./packages/typescript-config) - All the typescript config files for the project, with specific configs for NextJS apps and libraries

## Quick Start

We provide a setup script that will help you get started quickly:

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

## Manual Development Setup

If you prefer to set things up manually, follow these steps:

### Prerequisites

1. Install Node.js and npm
2. Install Supabase CLI
3. Install Turbo globally:

```bash
npm install -g turbo
```

### Environment Setup

Create `.env` files in the following locations using their respective `.env.example` templates:

- `apps/api/.env`
- `apps/web/.env.local`
- `packages/db/.env`

### Basic Commands

- `turbo dev` - Runs the api and web apps in dev mode
- `turbo build` - Builds the api and web apps
- `turbo lint` - Lints the api and web apps
- `turbo check-types` - Checks the types in the api and web apps

These are also available as npm scripts:

- `npm run dev` - Runs the api and web apps in dev mode
- `npm run build` - Builds the api and web apps
- `npm run lint` - Lints the api and web apps
- `npm run check-types` - Checks the types in the api and web apps

### Database Setup

The database is setup with [Drizzle](https://orm.drizzle.team/docs/introduction/getting-started) and [Supabase](https://supabase.com/).

#### Initialize Supabase:

```bash
npx supabase login
npx supabase link
# Ignore the diff that may show up
npx supabase start
```

Configure the database in the `apps/api/.env` and `apps/web/.env` files:

```bash
SUPABASE_ANON_KEY=xxxxxx # get from `supabase start` output
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Run Database Migrations:

```bash
cd packages/db
npm run db:migrate
```

### Hydra API Key Setup

After setting up your local environment, you'll need to configure your Hydra API key:

1. Start your local environment:

```bash
npm run dev
```

2. Get your Hydra API key:

   - Visit: `http://localhost:3000/dashboard`
   - Login with your credentials
   - Create a new Project The key
   - Generate your API key
   - [ ] replace this with the CLI :)

3. Configure the API key:

   - Add the key to `apps/web/.env.local`:

   ```bash
   NEXT_PUBLIC_TAMBO_API_KEY=your_generated_key_here
   ```

4. Verify your setup:
   - Visit: `http://localhost:3000/internal/smoketest`

# Shadcn Landing Page Template

The landing page comes from a [Shadcn Landing Page Template](https://github.com/nobruf/shadcn-landing-page) and is built with [Shadcn](https://ui.shadcn.com/), [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind](https://tailwindcss.com/).
