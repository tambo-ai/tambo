# @tambo-ai-cloud/web

Next.js 15 dashboard + marketing surface for Tambo Cloud. Uses App Router, React 18, tRPC, Tailwind/Shadcn UI, and React Query. Read `apps/web/AGENTS.md` for the detailed rules before touching code.

## Quick Start

```bash
cp .env.example .env   # fill required secrets (check turbo.json)
npm install
npm run dev
```

The dev server runs on `http://localhost:8260`.

## Commands

```bash
npm run dev          # Next dev
npm run build        # Production build (SKIP_ENV_VALIDATION=true)
npm start            # Run compiled build
npm run lint         # ESLint
npm run check-types  # tsc --noEmit
npm test             # Jest (jsdom)
npm run test:cov     # Coverage report
npm run clean        # Remove .next/, dist/, coverage/
```

Always run lint + check-types + tests before commits (root AGENTS requirement).

## Architecture

```
app/          # App Router routes + layouts (client/server segments)
components/   # Feature + shared UI (shadcn derivatives)
hooks/        # Client hooks (React Query helpers, form hooks)
lib/          # Pure utilities (formatters, env helpers)
providers/    # Client providers (NextAuth, Tambo, theming)
server/       # Server-only helpers (db access, tRPC routers)
trpc/         # React Query client + provider bindings
styles/       # Tailwind + global CSS
test/         # Jest setup
__fixtures__/ # Shared fixtures for tests
__mocks__/    # Jest mocks
```

- Client components never import from `server/`. If logic needs to be shared, extract it into `lib/`.
- API communication happens through tRPC (`app/trpc/` server handlers + `trpc/react.tsx` client factory).
- Forms use `react-hook-form` + Zod resolvers; shared schemas belong under `lib/`.

## Providers & State

- `app/providers.tsx` wires NextAuth, font loaders, analytics, and global providers.
- `providers/tambo-provider.tsx` wraps any AI-interactive UI. Do not re-implement provider trees per page.
- Use React Query loading states (see `devdocs/LOADING_STATES.md`) instead of bespoke spinners.

## Styling & Components

- Tailwind utility-first. Keep spacing via `gap-*` and avoid arbitrary margins.
- Typography: Sentient for headings, Geist Sans for body, Geist Mono for code (fonts configured in `lib/fonts.ts`).
- Extend Shadcn primitives via `components/ui/` rather than inventing new component patterns.

## Testing

- Jest with Testing Library (configured in `test/jest.setup.ts`).
- Co-locate tests next to components/hooks. Use `__fixtures__`/`__mocks__` for shared helpers.
- When a component has real behavior (async states, form validation, conditionals), add at least one test verifying the user-visible outcome.
- Run `npm run test:cov` to keep the baseline coverage documented.

## Observability

- Sentry configs: `sentry.server.config.ts` + `sentry.edge.config.ts`. Wrap new async boundaries using the provided helpers.
- Client analytics: PostHog helpers in `lib/analytics.ts`. Server logging belongs in `server/logging` utilities (add them there if missing).
- See `devdocs/OBSERVABILITY.md` for expectations and tag conventions shared across apps.

## Reference Docs

- `apps/web/AGENTS.md` – canonical rules for this package.
- `devdocs/NAMING_CONVENTIONS.md` + `devdocs/LOADING_STATES.md`
