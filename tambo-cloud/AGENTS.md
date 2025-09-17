# AGENTS.md — Unified coding instructions for AI agents

## 0) Scope and repository layout

- apps/web — Next.js app (UI)
- apps/api — NestJS app (OpenAPI server)
- packages/db — Drizzle ORM schema + migrations + DB helpers
- packages/core — Shared pure utilities (no DB access)
- packages/backend — LLM/agent-side helpers
- packages/eslint-config, packages/typescript-config — shared tooling configs

## 1) Core principles (always)

- Read the relevant code first; follow existing patterns and naming.
- Keep solutions small and simple; favor functions over classes; avoid unnecessary abstractions.
- Prefer immutability. Don’t mutate inputs; return new values. Use const, toSorted, object/array spreads.
- Handle errors up-front with guard clauses and early returns.
- Use English; meaningful names with widely-recognized standard abbreviations only (API, URL, ctx, req, res, next). Booleans start with is/has/can/should.
- File/dir naming: kebab-case. Classes: PascalCase. Vars/functions/methods: camelCase. ENV vars: UPPER_SNAKE_CASE.
- Exports: prefer named exports; allow multiple exports when they belong together (e.g., component + related types); avoid default exports.

### TypeScript

- Generally use strict TypeScript: no any, no type assertions unless unavoidable; define precise types.
- Do not add unnecessary type annotations when the value is easily inferred, such as:
  - arguments to functions that are well defined, such as event handlers or callback functions
  - return values of functions that have an obvious return type
  - local variables that are well defined
- do not use unnecessary constructors/casts like `String()` or `Number()` or `Boolean()` unless absolutely necessary when types really do not line up:
  - if a string conversion is really necessary, use \`${value}\`
  - if a boolean conversion is really necessary, use !!value
  - if a number conversion is really necessary, use +value
- prefer `unknown` over `any` when possible
- prefer `Record<string, unknown>` over `object` or `{ [key: string]: unknown }` when possible.

## 2) Workspace commands and verification

Run locally before opening/updating a PR:

```bash
npm run check-types   # TS across workspace
npm run lint:fix # ESLint autofix
npm run format        # Prettier write
npm test              # Unit/integration tests
```

Database (Drizzle):

```bash
# Generate migrations from schema changes
npm run db:generate
# Apply migrations
npm run db:migrate
# Check status / open studio
npm run db:check
npm run db:studio
```

Conventional commits:

All PR titles MUST follow the following format:

```
<type>(scope):<description>
```

Examples:

```
feat(api): add transcript export
fix(web): prevent duplicate project creation
chore(db): reorganize migration files
```

See .github/workflows/conventional-commits.yml for a list of types such as feat, fix, perf, deps, revert, docs, style, chore, refactor, test, build, ci.

Common scopes: api, web, core, db, deps, ci, config

PR Summaries should include "Fixes #123" (GitHub) or "Fixes TAM-123" (Linear) in PR body when applicable.

Dependencies and tooling: Agents do not add/upgrade/remove deps or change tool
configs, eslint config, tsconfig, etc. unless explicitly asked, but humans are
allowed to do so.

## 3) Frontend (React + Next.js)

- Do not create new /api endpoints in apps/web; use the app’s private tRPC API and server utilities instead.
- Prefer functional, declarative components; avoid classes.
- Types
  - Use TypeScript everywhere. Use interfaces for object shapes.
  - Prefer React.FC for components. Use PropsWithChildren and `ComponentProps[WithRef|WithoutRef]` as needed.
  - Exports: prefer named exports; allow multiple exports when they belong together (e.g., component + related types); avoid default exports.
- State & data
  - Local UI elements should use useState.
  - For shared state between components, use React Context.
  - Minimize use of useEffect; derive state or memoize instead. Memoize callbacks with useCallback when passed to children.
  - When making network request, use tRPC/React Query loading states instead of
    manually tracking separate loading flags. Follow devdocs/LOADING_STATES.md
    patterns for skeletons and disabling controls.
- Layout & styling (Tailwind + shadcn)
  - Use flex/grid for layout. Manage element spacing with gap (use `gap-*`
    classes when needed), and padding (`p-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`,
    etc.).
  - Avoid changing element margins (`m-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`, etc.) and avoid `space-x-*`/`space-y-*`.
  - Truncate overflowing text with text-ellipsis. Prefer minimal Tailwind usage; avoid ad-hoc CSS.
- Typography
  - Sentient for headings (font-heading/font-sentient), Geist Sans for body (font-sans), Geist Mono for code (font-mono). See apps/web/lib/fonts.ts and tailwind.config.ts.
- Text
  - avoid manually changing string cases, as it is usually a code smell for not
    providing the correct string to the component. If a internal key should be
    shown to a user, the english string should be provided separately. e.g. if a
    key has a value agent_mode, the english string should be provided separately
    as "Agent Mode" rather than trying to capitalize it.
  - Avoid overly long JSX, instead break out any complex JSX into a separate component.
    - use simple '&&' to hide/show simple elements, using simple boolean values, like `{hasError && <div>Error: ${error}</div>}`.
    - however, avoid ternaries unless the options are just one or two lines. nested or chained ternaries are a code smell.
    - when using map(), try to keep the JSX in the inner loop simple, only a few lines of JSX.
    - avoid functions with statements inside of JSX, such as if/else, switch, etc. If you have to
      add braces ({}) to JSX, that is a sign that you should break out the JSX
      into a separate component.
- Use loading states provided by react-query or tRPC, e.g. `isFetching`,
  `isError`, `isSuccess`, etc.
- When using loading states, use the Skeleton components or show the real
  components in a disabled/blank state, rather than showing only loading spinner
  or not showing any content.

## 4) Backend (NestJS in apps/api)

- Modular structure
  - One module per main route/domain; one primary controller per route; DTOs (class-validator) for inputs; simple types for outputs.
  - Services encapsulate business logic; keep pure where possible.
  - Use guards/filters/interceptors via a core module. Shared utilities live in a shared module.
- Error handling
  - Pure functions: even within a controller, try to keep logic pure, and do not store state in the controller.
  - Boundaries (controllers/services): translate into HTTP/Nest exceptions when appropriate.
- Testing
  - Unit tests for public functions; integration/e2e for controllers/modules via Jest + supertest.

## 5) Database (Drizzle ORM)

- Source of truth is packages/db/src/schema.ts. Do not hand-edit generated SQL.
- Generate migrations with `npm run db:generate`, do not manually generate migrations.

## 6) Shared utilities and packages

- packages/core: pure utilities (validation, JSON, crypto, threading, tool utilities). Avoid DB access here. This package should not have any dependencies on the database.
- packages/backend: LLM/agent-side helpers and streaming utilities.
- Reuse helpers; don’t duplicate logic. If a utility is useful across packages, colocate in core; if it’s LLM-specific, in backend, if related to database access, in db.

## 7) Functions and classes (design rules)

- Keep functions short and single-purpose; ideally <20 statements.
- Avoid `let` - instead make a new function that returns the value.
- Use verbs for functions; boolean-returning: isX/hasX/canX. If a function returns void, prefer executeX/saveX naming.
- Avoid deep nesting: prefer early exits and extracting helpers. Use map/filter for iteration.
- Prefer immutable data; use readonly and as const where applicable.
- Favor composition over inheritance. If classes are used, keep them small (<200 statements, <10 properties/methods) and validate invariants internally.

## 8) Documentation authoring (when adding docs)

Every concept page should follow this structure:

0. Title + one-line description
1. How Does It Work? (start with a simple code example)
2. Why Use X? (2–4 bullets)
3. Progressive feature sections (basic → advanced)
4. Usage patterns/examples
5. Integrations with other features

Include multiple TS examples with comments and good/poor markers (✅/❌) when helpful. Use callouts for cross-links and warnings.

## 9) Naming conventions (React-specific additions)

- React SDK naming in this repo follows devdocs/NAMING_CONVENTIONS.md. Common patterns:
  - Components: TamboXxx; Hooks: useTamboXxx; Props interfaces: TamboXxxProps.
  - Event props start with onX; internal handlers use handleX.

## 10) What agents must not do

- Don’t introduce dependencies or modify tool configs unless explicitly requested.
- Don’t create generic index.ts barrels for internal modules; import directly from concrete files.
- Don’t commit secrets. Use env files.

---
