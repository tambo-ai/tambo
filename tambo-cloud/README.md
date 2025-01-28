# HydraAI Monorepo

## This repo is a monorepo for the HydraAI project.

The main apps are in the [apps](./apps) directory:

- [hydra-ai-client](./apps/web) - The main nextjs app, including the landing page and the project dashboard
- [hydra-ai-api](./apps/api) - The nestjs api server, including the swagger ui and the api routes

There are shared libraries in the [packages](./packages) directory:

- [hydra-ai-server](./packages/hydra-ai-server) - A library for interacting with the LLM
- [@use-hydra-ai/core](./packages/core) - A library for basic shared utilities/etc.
- [@use-hydra-ai/db](./packages/db) - A library for interacting with the database. This is mostly the drizzle schema and migrations.

There also are some basic supporting packages only used during development:

- [@use-hydra-ai/eslint-config](./packages/eslint-config) - All the eslint config files for the project, with specific configs for NextJS apps and libraries
- [@use-hydra-ai/typescript-config](./packages/typescript-config) - All the typescript config files for the project, with specific configs for NextJS apps and libraries

## Development

Everything in this repo is built do run with [Turborepo](https://turbo.build/).

To use, install turbo globally:

```bash
npm install -g turbo
```

Basic commands:

- `turbo dev` - Runs the api and web apps in dev mode
- `turbo build` - Builds the api and web apps
- `turbo lint` - Lints the api and web apps
- `turbo check-types` - Checks the types in the api and web apps

These are also available as npm scripts:

- `npm run dev` - Runs the api and web apps in dev mode
- `npm run build` - Builds the api and web apps
- `npm run lint` - Lints the api and web apps
- `npm run check-types` - Checks the types in the api and web apps

### Environment Variables

To run the apps locally, you need to create a `.env` file in the `apps/api` and `apps/web` directories. You can use the `.env.example` files in each directory as a reference.

- api `.env.example` [here](./apps/api/.env.example)
- web `.env.example` [here](./apps/web/.env.example)

Additionally, when using the `db` package to perform migrations, you need to create a `.env` file in the `packages/db` directory. You can use the `.env.example` file in that directory as a reference.

- db `.env.example` [here](./packages/db/.env.example)

Note: Some values may be identical in all the `.env` files, so remember to change them in all of them when updating.

### Database setup

The database is setup with [Drizzle](https://orm.drizzle.team/docs/introduction/getting-started) and [Supabase](https://supabase.com/). The following instructions will get a local database running and setup the database schema.

The following is a shortened version of the instructions from the supabase docs: https://supabase.com/docs/guides/local-development

#### Initialize supabase:

You generally only need to do this once:

```bash
npx supabase login
npx supabase link
# Ignore the diff that may show up
npx supabase start
```

Now configure the database in the `apps/api/.env` and `apps/web/.env` files:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=xxxxxx # get from `supabase start` output
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Run the database migrations:

This will set up the database schema and run the migrations.

```bash
cd packages/db
npm run db:migrate
```

# Shadcn Landing Page Template

The landing page comes from a [Shadcn Landing Page Template](https://github.com/nobruf/shadcn-landing-page) and is built with [Shadcn](https://ui.shadcn.com/), [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind](https://tailwindcss.com/).
