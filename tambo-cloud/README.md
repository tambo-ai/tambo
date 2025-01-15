# HydraAI Monorepo

## This repo is a monorepo for the HydraAI project. It contains the following packages:

- [hydra-ai-client](./apps/web) - The main nextjs app, including the landing page and the admin dashboard
- [hydra-ai-api](./apps/api) - The nestjs api server, including the swagger ui and the api routes
- [hydra-ai-server](./packages/hydra-ai-server) - A library for interacting with the LLMj

There are some basic supporting packages:

- [hydra-ai-types](./packages/typescript-config) - All the typescript config files for the project, with specific configs for NextJS apps and libraries
- [hydra-ai-eslint-config](./packages/eslint-config) - All the eslint config files for the project, with specific configs for NextJS apps and libraries

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

# Shadcn Landing Page Template

The landing page comes from a [Shadcn Landing Page Template](https://github.com/nobruf/shadcn-landing-page) and is built with [Shadcn](https://ui.shadcn.com/), [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind](https://tailwindcss.com/).
