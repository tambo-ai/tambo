# AGENTS.md

Detailed guidance for Claude Code agents working inside `apps/web`, the Next.js dashboard for Tambo Cloud.

## Overview

- **Framework**: Next.js 15 App Router with React 18, strict TypeScript, Tailwind + Shadcn UI.
- **Data layer**: tRPC 11 with React Query, server actions under `app/`, and server utilities in `server/`.
- **Auth**: NextAuth.js (see `app/api/auth/[...nextauth]/route.ts`), project sessions stored via the API.
- **Styling & Fonts**: Tailwind configured in `tailwind.config.ts`; fonts wired via `apps/web/lib/fonts.ts`.
- **Instrumentation**: Sentry (edge + server configs) and PostHog analytics; keep telemetry hooks intact.

## Essential Commands

```bash
npm run dev          # Next dev server with turbo hot reload
npm run build        # Production build (SKIP_ENV_VALIDATION=true set in script)
npm start            # Run compiled build
npm run lint         # ESLint via @tambo-ai config
npm run check-types  # Strict tsc --noEmit
npm test             # Jest (jsdom) component/unit tests
npm run test:cov     # Coverage for dashboard components
npm run clean        # Remove .next/, dist/, coverage/
```

Always run lint + type-check + tests before committing; PRs must keep everything passing.

## Directory Structure

```
apps/web
├── app/             # App Router routes, layouts, metadata
├── components/      # Feature + shared UI (shadcn derivatives live here)
├── hooks/           # Client hooks (React Query wrappers, short-lived UI state)
├── lib/             # Pure utilities (formatters, environment, analytics helpers)
├── providers/       # Client-side providers (NextAuth, Tambo, theming)
├── server/          # Server-only helpers (drizzle queries, tRPC routers, auth guards)
├── styles/          # Tailwind + global CSS
├── test/            # Jest setup (jest.setup.ts) + testing utils
├── __fixtures__/    # Shared test fixtures
└── __mocks__/       # Jest mocks for browser APIs/modules
```

### App Router Layout

- `app/layout.tsx` defines the root font + analytics providers.
- Segments such as `app/(authed)/` wrap authenticated dashboard routes; `app/login` and `app/oauth` handle entry flows.
- API routes under `app/api/` proxy to backend services (keep these thin; business logic belongs in `server/`).
- Marketing/demos live alongside dashboard routes, so always scope imports to avoid bundling unnecessary admin code in public pages.

## State & Data Patterns

- **tRPC**: Client entrypoints live in `trpc/react.tsx`; server contexts live in `app/trpc/`. Always define new procedures in the API router and derive hooks via `trpc.<procedure>.useQuery()`.
- **React Query**: Follow loading-state guidance from `devdocs/LOADING_STATES.md`. Use derived booleans instead of manual `useState` spinners.
- **Server utilities**: Anything hitting the database (`@tambo-ai-cloud/db`) belongs under `server/`. Never import server modules into client components.
- **Forms**: Use `react-hook-form` + Zod resolvers from `@hookform/resolvers`. Define shared schemas under `lib/validations` when forms are reused.

## Styling & Components

- Stick to Tailwind utility classes with `clsx` or `class-variance-authority` helpers in `components/ui/`.
- Prefer `gap-*` for spacing. Avoid arbitrary margins unless aligning with existing patterns.
- Typography: Sentient for headings, Geist Sans for body, Geist Mono for code.
- Reuse shadcn primitives under `components/ui/`. When adding a new primitive, update `components.json` and run the generator via CLI rather than copying markup ad hoc.

## Providers

- `providers/tambo-provider.tsx` bootstraps the React SDK for dashboard UIs—wrap any AI-interactive pages with it.
- `providers/nextauth-provider.tsx` exposes the session client-side; call `useSession()` only through this provider.
- Keep provider trees minimal. If you need local context, create it near the feature instead of mutating the global provider set.

## Testing

- Use Jest with Testing Library (see `test/jest.setup.ts`). All DOM utilities are already registered there.
- Co-locate component tests beside the component (e.g., `components/foo/foo.test.tsx`). Shared fixtures belong in `__fixtures__`.
- Avoid mocking React Query manually—prefer rendering providers via helpers located in `__mocks__/test-wrapper.tsx` (create one if missing rather than repeating setup).
- Always add at least one test when you introduce new hooks or non-trivial UI state transitions.

## Accessibility & UX

- Use semantic HTML and Radix primitives for keyboard support.
- Buttons must be `<button>` elements; links should be Next.js `<Link>` components.
- When displaying user-facing labels, provide explicit strings (never transform `snake_case` keys in the UI).
- Loading states should either render skeletons or disabled real controls. Avoid standalone spinners.

## Observability & Analytics

- Sentry configs live in `sentry.server.config.ts` and `sentry.edge.config.ts`. When adding async boundaries, wrap them with `withSentryConfig`.
- Client analytics go through PostHog helpers in `lib/analytics.ts` (read before emitting new events).
- Server-side logging should rely on utilities in `server/logging.ts` (or add them there if missing) instead of `console.log`.

## Development Workflow

1. **Read the relevant route/component** and confirm whether it's a client or server component.
2. **Document** any significant UX or API behavior in this AGENTS file (and docs site) before writing code.
3. **Update schemas** under `lib/` or `server/` when backend contracts change; keep tRPC routers and forms in sync.
4. **Write tests** for hooks/components as you add logic. Snapshots are discouraged; assert actual behavior.
5. **Run npm run dev** locally and validate flows manually (especially auth + AI interactions).
6. **Lint, check types, and run tests** before commits. Visual changes require a ≤90s demo video when opening a PR.

## Common Pitfalls

- Importing server-only utilities into client components (Next.js will throw). If you must share logic, extract a pure helper into `lib/`.
- Calling APIs directly from client components. Always go through tRPC or server actions so credentials stay on the server.
- Creating bespoke styling when a shadcn primitive already exists. Extend the design system instead.
- Forgetting to wrap pages with the required providers (NextAuth, Tambo). Missing providers manifest as runtime errors; follow `app/providers.tsx`.

Use this guide every time you touch `apps/web` so the dashboard stays consistent with the rest of the monorepo.
