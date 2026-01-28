## Turbo Repo Hono + Clerk + Tambo

Monorepo template with:

- **`apps/api`**: Express API with Clerk auth.
- **`apps/web`**: Vite + React app using Clerk and `@tambo-ai/react`.
- **`packages/ui`**: Shared UI primitives.
- **`packages/eslint-config` / `packages/typescript-config`**: Shared tooling config.

Everything is TypeScript and managed with Turborepo.

---

### Prerequisites

- **Node**: `>=18`
- **npm**: `>=11` (this template was built with `npm@11.7.0`)
- A **Clerk** account and application
- A **Tambo** project (if you want the Tambo integration working)

---

### 1. Install dependencies

From the template root (`turbo-repo-hono-clerk`):

```bash
npm install
```

This installs dependencies for all workspaces (`apps/*`, `packages/*`).

---

### 2. Configure environment variables

#### `apps/api/.env`

Copy `.env.example` to `.env`:

```bash
cd apps/api
cp .env.example .env
```

Then set the values:

- **`CLERK_PUBLISHABLE_KEY`**: From your Clerk project.
- **`CLERK_SECRET_KEY`**: From your Clerk project.

#### `apps/web/.env`

Copy `.env.example` to `.env`:

```bash
cd ../web
cp .env.example .env
```

Then set:

- **`VITE_CLERK_PUBLISHABLE_KEY`**: Clerk publishable key (frontend).
- **`VITE_CLERK_SECRET_KEY`**: Clerk secret key (used where required).
- **`VITE_TAMBO_API_KEY`**: API key for your Tambo project.

Do **not** commit real secrets. Use `.env` locally only.

---

### 3. Run the dev servers

From the template root:

```bash
npm run dev
```

This runs `turbo run dev`, which:

- Starts the **API** (`apps/api`) on its configured port.
- Starts the **web** app (`apps/web`) with Vite (defaults to `http://localhost:5173` unless changed).

You can also run each app directly:

```bash
# API
cd apps/api
npm run dev

# Web
cd ../web
npm run dev
```

---

### 4. Build, lint, and type-check

From the root:

```bash
# Build all apps and packages
npm run build

# Lint all apps and packages
npm run lint

# Type-check all apps and packages
npm run check-types
```

For a single app, you can run its local scripts (e.g. `npm run build` in `apps/web`).

---

### 5. Project layout

- **`apps/api`**: Express + Clerk backend, reads `CLERK_*` env vars from `.env`.
- **`apps/web`**: React + Vite frontend using Clerk and Tambo; reads `VITE_*` env vars from `.env`.
- **`packages/ui`**: Shared UI components, import into `apps/web`.
- **`packages/eslint-config` / `packages/typescript-config`**: Shared lint/TS base configs.

---

### 6. Production build

To produce production builds:

```bash
# From root
npm run build
```

This runs the `build` script for each app/package:

- **`apps/api`**: Compiles TypeScript and outputs to `dist/`, run with `node dist/index.js`.
- **`apps/web`**: Builds a Vite bundle in `dist/`.

You are responsible for deploying those artifacts to your hosting of choice.

---

### 7. Useful links

- **Tambo docs**: `https://docs.tambo.co`
- **Clerk docs**: `https://clerk.com/docs`
- **Turborepo docs**: `https://turbo.build/repo/docs`
