# AGENTS.md

Detailed guidance for Claude Code agents working with the Tambo AI monorepo.

This file provides comprehensive instructions for maintaining code quality, architectural consistency, and project-specific requirements across both the Tambo AI framework and the Tambo Cloud platform.

## 1. Repository Structure

This is a Turborepo monorepo containing both the Tambo AI framework packages and the Tambo Cloud platform.

### Framework Packages (Turborepo root)

- **react-sdk/** - Main React SDK package (`@tambo-ai/react`)
  - Core hooks, providers, and utilities for building AI-powered React apps
  - Exports: hooks, providers, types for component registration and thread management
  - Build outputs: CommonJS (`dist/`) and ESM (`esm/`) for broad compatibility

- **cli/** - Command-line interface (`tambo`)
  - Project scaffolding, component generation, and development utilities
  - Component registry auto-syncs to `/showcase/src/components/tambo/` from `/cli/src/registry/`
  - Built as ESM module with executable binary

- **showcase/** - Demo application (`@tambo-ai/showcase`)
  - Runs on port 8262
  - Next.js app demonstrating all Tambo components and patterns
  - Components auto-synced from CLI registry - edit CLI registry, not showcase components directly
  - Serves as both documentation and testing ground

- **docs/** - Documentation site (`@tambo-ai/docs`)
  - Runs on port 8263
  - Built with Fumadocs, includes comprehensive guides and API reference
  - This package contains ui components that originated from the cli/ package.
    Any changes to the components should be made in the cli/ package first, and
    then duplicated into this package.
  - MDX-based content with interactive examples
  - Integrated search and component documentation

- **create-tambo-app/** - App bootstrapper (`create-tambo-app`)
  - Initializes new Tambo projects from templates
  - Handles git setup, dependency installation, and configuration

- **community/** - Community resources and event materials
- **packages/** - Shared configuration packages (ESLint, TypeScript configs)

### Tambo Cloud Platform

- **apps/web** - Next.js app (UI) - runs on port 8260
- **apps/api** - NestJS app (OpenAPI server) - runs on port 8261
- **packages/db** - Drizzle ORM schema + migrations + DB helpers
- **packages/core** - Shared pure utilities (no DB access)
- **packages/backend** - LLM/agent-side helpers
- **packages/eslint-config, packages/typescript-config** - Shared tooling configs

### Prerequisites

- Node.js >=22
- npm >=11

**Recommended:** Install [mise](https://mise.jdx.dev) for automatic version management. See [mise getting started](https://mise.jdx.dev/getting-started.html) for installation instructions.

### Tool Versions

Tool versions are managed via mise. Source of truth files:

- **Most tools**: `mise.toml`
- **Node.js**: `.node-version` (`.nvmrc` kept in sync for nvm compatibility)

These files are kept up to date by Renovate.

```bash
mise install              # Install/update tools to correct versions
mise exec -- <command>    # Preferred for scripts/CI/non-interactive shells
eval "$(mise activate)"   # Interactive shells only
```

**Changing tool versions**: Open a PR updating the authoritative version file(s). For Node.js, always update both `.node-version` and `.nvmrc` together. Run `mise install`, then verify with `npm run lint && npm run check-types && npm test`.

**Local overrides**: Use `.mise.local.toml` (gitignored) for local-only changes. Only for additive or patch-level changes—don't override Node.js or use incompatible versions.

## 2. Core Development Principles

### Philosophy

- **Move fast while maintaining high standards** - prioritize clarity and maintainability over cleverness.
- **Read the relevant code first**; follow existing patterns and naming.
- **Keep solutions small and simple**; favor functions over classes; avoid unnecessary abstractions.
- **Simplify Relentlessly**: Remove complexity aggressively - the simplest design that works is usually best.
- **Prefer immutability**. Don't mutate inputs; return new values. Use const, toSorted, object/array spreads.
- **Handle errors up-front** with guard clauses and early returns.

### Separation of Concerns

- **Keep business logic separate from UI components**.
- Extract business logic, calculations, and data transformations into separate files (`utils/`, `services/`, `lib/`).
- UI components should orchestrate, not implement complex logic.
- Makes testing easier and code more reusable.

### Fail-Fast, No Fallbacks

- **No Silent Fallbacks**: Code must fail immediately when expected conditions aren't met. Silent fallback behavior masks bugs and creates unpredictable systems.
- **Explicit Error Messages**: When something goes wrong, stop execution with clear error messages explaining what failed and what was expected.
- **Example**: `throw new Error(\`Required model ${modelName} not found\`)` instead of falling back to first available model.
- **Data mapping**: When converting enums or union types, handle all known values explicitly and throw for unknown values. Don't use catch-all defaults that mask data integrity issues. Log warnings if skipping invalid data intentionally.

### Naming Conventions

- **File/dir naming**: kebab-case.
- **Classes**: PascalCase.
- **Vars/functions/methods**: camelCase.
- **ENV vars**: UPPER_SNAKE_CASE.
- **Use English**; meaningful names with widely-recognized standard abbreviations only (API, URL, ctx, req, res, next).
- **Booleans**: start with is/has/can/should.
- **Functions**: use verbs; boolean-returning: isX/hasX/canX. If a function returns void, prefer executeX/saveX naming.
- **React-specific naming** (follows devdocs/NAMING_CONVENTIONS.md):
  - Components: TamboXxx
  - Hooks: useTamboXxx
  - Props interfaces: TamboXxxProps
  - Event props start with onX; internal handlers use handleX

### Code Organization (Functions & Classes)

- Keep functions short and single-purpose; ideally <20 statements.
- Keep files focused and reasonably sized; ideally <200-300 lines.
- Avoid `let` - instead make a new function that returns the value.
- Avoid deep nesting: prefer early exits and extracting helpers. Use map/filter for iteration.
- Prefer immutable data; use readonly and as const where applicable.
- Favor composition over inheritance. If classes are used, keep them small (<200 statements, <10 properties/methods) and validate invariants internally.

### Avoiding Over-Abstraction

- **DRY is good, but don't go overboard** - sometimes a little duplication is better than the wrong abstraction.
- **Rule of Three**: Wait until you have 3 instances of similar code before extracting a shared utility.
- Premature abstraction creates coupling and makes changes harder.
- It's easier to extract commonality later than to undo a bad abstraction.

### Exports

- Prefer named exports; allow multiple exports when they belong together (e.g., component + related types).
- Avoid default exports.
- Don't create `index.ts` barrels for internal modules; import directly from source files. Exception: package entry points (e.g., `packages/core/src/index.ts`) are fine.
- Don't re-export symbols for backwards compatibility. When moving a symbol, update all consumers to import from the new location.
- **Never use dynamic `import()`** for regular imports, even for type imports. Use static imports at the top of the file. Dynamic imports are only appropriate for code splitting in specific scenarios (e.g., lazy-loaded routes).

## 3. TypeScript Standards

### Type Safety

- **Generally use strict TypeScript**: no any, no type assertions unless unavoidable; define precise types.
- **Avoid `any`** - do your best to assign proper types.
- **Use `unknown` instead of `any`** when type is truly uncertain, then narrow it down.
- **Prefer `Record<string, unknown>` over `object`** or `{ [key: string]: unknown }` when possible.
- **Do not disable ESLint rules** unless explicitly requested - fix the root cause instead.
- **Do not disable TypeScript errors** unless explicitly requested - fix the root cause instead.
- **Constrain generics** with `extends` - avoid overly broad `<T>`, prefer `<T extends SomeType>`.
- **Use discriminated unions** for mutually exclusive states (e.g., `{ success: true; data: T } | { success: false; error: Error }`).
- **Use `as const`** to preserve literal types, especially for arrays that should be tuples.
- **Use built-in utility types** (`Pick`, `Omit`, `Partial`, `Required`, `ReturnType`, `Parameters`) - don't reimplement them.
- **Avoid `{}` type** - it means "any non-nullish value" (including primitives). Prefer `unknown` (truly unknown), `object` (any non-primitive object), or `Record<string, unknown>` / a specific object type for key-value objects.

### type-fest Utility Types

Prefer the `type-fest` package for advanced type manipulation: https://github.com/sindresorhus/type-fest

Most types do exactly what they sound like: `PartialDeep`, `ReadonlyDeep`, `RequiredDeep`, `Merge`, `ValueOf`, `SetOptional`, etc. Before writing any complicated derivative types, check `type-fest` first.

`type-fest` is installed at the repo root, but each package must still declare it explicitly when used:

- If you reference `type-fest` types from a package's **public exported types**, add `type-fest` to that package's `dependencies`.
- If you only use `type-fest` in internal code or tests, add `type-fest` to that package's `devDependencies`.

### Type Inference

- **Do not add unnecessary type annotations** when the value is easily inferred, such as:
  - Arguments to functions that are well defined, such as event handlers or callback functions
  - Return values of functions that have an obvious return type
  - Local variables that are well defined
- **Let TypeScript infer return types** when they're obvious.
- **Avoid creating one-off/intermediate "helper" types** for internal functions.
- **Use inferred types** from database schemas, tRPC schemas, and other sources of truth.
- **Add explicit types** when it improves clarity or catches errors.
- **Avoid type casts (e.g. `as`)** unless absolutely necessary. Prefer updating function signatures/types so the code doesn't need a cast. Casting through `unknown` is usually a smell; when it's needed at an interop boundary, do runtime validation first (e.g. Zod) and keep the cast local.
- **Use `satisfies` to check an object literal matches a type** while preserving inference (compile-time only). It does not validate runtime data; use a schema validator for untrusted input.
- **Type guards** should perform real runtime checks to narrow values. Use `unknown` as an input type only when the value is truly unknown (e.g. JSON deserialization, user input). Avoid "fake" guards that just assert a type without validation.

### Type Conversions

- **Do not use unnecessary constructors/casts** like `String()` or `Number()` or `Boolean()` unless absolutely necessary when types really do not line up:
  - If a string conversion is really necessary, use \`${value}\`
  - If a boolean conversion is really necessary, use !!value
  - If a number conversion is really necessary, use +value

### Async/Await

- **Any function that returns a Promise must be declared `async`**.
- **Always use `await`** when calling async functions.
- **Avoid `.catch()` or `.then()` for async calls in most cases. Prefer `async`/`await` with `try/catch` so errors propagate naturally.** Use `.catch()` only when you truly cannot `await` (for example, in a `useEffect` cleanup) and use `void` only to explicitly mark an intentional fire‑and‑forget call that already handles its own errors.
- **If a function is not critical, and you can't `await` it, use `void` to mark it as fire‑and‑forget.**
- **avoid using IIFEs** especially as a workaround to call async functions.

### Control Flow

- **Avoid nested or chained ternary operators** - use `if/else` or `switch` instead.
- **Use `switch` statements** when checking multiple values.
- **Leverage TypeScript exhaustiveness checking** in switch statements (avoid `default` when possible).

### Functional Patterns

- **Use `map`, `filter`, `find`, `some`, `every`** - these are clear and expressive.
- **Avoid `reduce()`** - it's often confusing and can usually be replaced with simpler patterns.
  - Exception: when the mental model genuinely requires accumulation (e.g., summing numbers).
- **Avoid complex method chaining** - break it into named intermediate steps for clarity.

### Avoid RegEx When Possible

- **Prefer string methods**: `str.includes()`, `str.startsWith()`, `str.split()`, and `str.replace()` are easier to read and maintain.
- **Avoid global flag (`/g`)**: Creates stateful regex objects where `lastIndex` persists between calls, causing subtle bugs.
- **Avoid multiline flag (`/m`)**: Platform differences in line endings (`\n` vs `\r\n`) cause inconsistent behavior.
- **If regex is unavoidable**: Keep it simple, add a comment explaining the pattern, and test edge cases thoroughly.

## 4. Frontend Development (React + Next.js)

### Component Architecture

- **Do not create new /api endpoints** in apps/web; use the app's private tRPC API and server utilities instead.
- **Prefer functional, declarative components**; avoid classes.
- Use TypeScript everywhere. Use interfaces for object shapes.
- Prefer React.FC for components. Use PropsWithChildren and `ComponentProps[WithRef|WithoutRef]` as needed.

### State Management & Data Fetching

- Local UI elements should use useState.
- For shared state between components, use React Context.
- Minimize use of useEffect; derive state or memoize instead. Memoize callbacks with useCallback when passed to children.
- When making network requests, use tRPC/React Query loading states instead of manually tracking separate loading flags. Follow devdocs/LOADING_STATES.md patterns for skeletons and disabling controls.
- During loading, use Skeleton components or show real components in a disabled/blank state, rather than only showing a loading spinner.

### Layout & Styling (Tailwind + shadcn)

- Use flex/grid for layout. Manage element spacing with gap (use `gap-*` classes when needed), and padding (`p-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`, etc.).
- Avoid changing element margins (`m-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`, etc.) and avoid `space-x-*`/`space-y-*`.
- Truncate overflowing text with text-ellipsis. Prefer minimal Tailwind usage; avoid ad-hoc CSS.

### Typography

- Sentient for headings (font-heading/font-sentient), Geist Sans for body (font-sans), Geist Mono for code (font-mono). See apps/web/lib/fonts.ts for font configuration.

### Text Handling & JSX Patterns

- **Avoid manually changing string cases**, as it is usually a code smell for not providing the correct string to the component. If an internal key should be shown to a user, the English string should be provided separately. e.g. if a key has a value agent_mode, the English string should be provided separately as "Agent Mode" rather than trying to capitalize it.
- **Avoid overly long JSX**, instead break out any complex JSX into a separate component.
  - use simple '&&' to hide/show simple elements, using simple boolean values, like `{hasError && <div>Error: ${error}</div>}`.
  - however, avoid ternaries unless the options are just one or two lines. nested or chained ternaries are a code smell.
  - when using map(), try to keep the JSX in the inner loop simple, only a few lines of JSX.
  - avoid functions with statements inside of JSX, such as if/else, switch, etc. If you have to add braces ({}) to JSX, that is a sign that you should break out the JSX into a separate component.

### Accessibility

- Use proper accessibility patterns for all components.
- Use buttons for clickable elements, not divs or spans.
- Use proper aria labels and roles when appropriate.
- Use semantic HTML elements when appropriate.

## 5. Backend Development (NestJS)

### Modular Structure

- One module per main route/domain; one primary controller per route; DTOs (class-validator) for inputs; simple types for outputs.
- Services encapsulate business logic; keep pure where possible.
- Use guards/filters/interceptors via a core module. Shared utilities live in a shared module.

### Error Handling

- Pure functions: even within a controller, try to keep logic pure, and do not store state in the controller.
- Boundaries (controllers/services): translate into HTTP/Nest exceptions when appropriate.

### Testing

- Unit tests for public functions; integration/e2e for controllers/modules via Jest + supertest.

## 6. Database (Drizzle ORM)

- Source of truth is packages/db/src/schema.ts. Do not hand-edit generated SQL.
- Generate migrations with `npm run db:generate`, do not manually generate migrations.
- Don't denormalize FKs that can be derived from relationships (e.g., if `runs.threadId` exists and threads have `projectId`, don't add `runs.projectId`).
- **Factor database operations into `packages/db/src/operations/`**. Services in `apps/api` should call operation functions rather than writing inline DB queries. This promotes reuse and keeps DB logic centralized. Export new operations from `packages/db/src/operations/index.ts`.

Database commands (require `-w packages/db` flag from root):

```bash
npm run db:generate -w packages/db  # Generate migrations from schema changes
npm run db:migrate -w packages/db   # Apply migrations
npm run db:check -w packages/db     # Check status
npm run db:studio -w packages/db    # Open Drizzle Studio
```

## 7. Shared Packages & Utilities

- **packages/core**: pure utilities (validation, JSON, crypto, threading, tool utilities). Avoid DB access here. This package should not have any dependencies on the database.
- **packages/backend**: LLM/agent-side helpers and streaming utilities.
- **Reuse helpers**; don't duplicate logic. If a utility is useful across packages, colocate in core; if it's LLM-specific, in backend, if related to database access, in db.

## 8. Development Workflow

### Commands

#### Development Commands

```bash
# Development (two different apps!)
npm run dev:cloud        # Start Tambo Cloud (web + API) - ports 8260 + 8261
npm run dev              # Start React SDK (showcase + docs)
npm run dev:sdk          # Start React SDK in watch mode + showcase (for SDK development)
npm run build:sdk        # One-time build of React SDK

# Quality checks
npm run lint             # Lint all packages
npm run lint:fix         # Auto-fix linting issues
npm run check-types      # TypeScript type checking
npm test                 # Run all tests
npm run format           # Format code with Prettier

# Individual package development (from package directory or with -w flag)
npm run dev -w cli       # Start specific workspace
npm run build -w react-sdk  # Build specific package
```

#### Turbo Commands (alternative)

```bash
turbo dev               # Start all packages in development mode
turbo build             # Build all packages
turbo lint              # Lint all packages
turbo test              # Run tests across all packages
turbo check-types       # Type-check all packages
```

### Build System

- **Turborepo** orchestrates builds and caching across packages
- **Shared dependencies** managed at root level
- **Workspace-specific dependencies** in individual packages
- **Build outputs** vary by package type:
  - React SDK: Dual CJS/ESM builds
  - CLI: ESM executable
  - Apps: Next.js builds

### Package Dependencies

- Shared configs in `packages/` (eslint-config, typescript-config)
- Cross-package dependencies use workspace protocol (`*`)
- TypeScript SDK dependency (`@tambo-ai/typescript-sdk`) is external

### Cross-Package Development

When working across multiple packages:

1. **react-sdk changes** → Use `npm run dev:sdk` for watch mode development, or `npm run build:sdk` for one-time builds. Run tests, check showcase integration.
2. **cli changes** → Test component generation, verify registry updates, sync to showcase
3. **showcase changes** → Edit CLI registry (auto-syncs to showcase)
4. **docs changes** → Ensure examples match current API

### Key Configuration Files

- `turbo.json` - Turborepo task pipeline and caching
- `package.json` - Workspace configuration and scripts
- Individual package.json files for package-specific configuration

## 9. Testing & Quality

### Testing Strategy

- **Unit tests** in individual packages using Jest
- **Integration tests** via showcase app
- **CLI testing** through template generation and installation
- **Documentation testing** via example code validation
- **Backend e2e tests** for controllers/modules via Jest + supertest

### Test File Layout

- **File names**: every test ends with `.test.ts` or `.test.tsx` (no `.spec` or other suffixes).
- **Unit tests**: live beside the file they cover (e.g. `foo.ts` has `foo.test.ts` in the same directory, not under `__tests__`).
- **Integration tests**: the only tests that stay in a `__tests__` folder, and the filename must describe the scenario (never just mirror another file's name).
- **Fixtures & mocks**: keep shared helpers in a `__fixtures__` or `__mocks__` directory at the package's source root (e.g. `apps/web/__mocks__`), never nested inside feature folders.

### Mocking

- **Avoid over-mocking** - tests should exercise real code paths whenever possible. If you're mocking internal functions just to isolate a unit, you're probably testing implementation details rather than behavior.
- **Only mock at system boundaries** - external APIs, databases, file systems, network calls, and other I/O with side effects.
- **Don't mock what you own** - if a helper function is pure and fast, call it directly rather than mocking it. Mocking your own code couples tests to implementation.

### Pre-commit/PR Verification Checklist

Run these commands before commits/PRs:

```bash
npm run check-types   # TS across workspace
npm run lint:fix      # ESLint autofix
npm run format        # Prettier write
npm test              # Unit/integration tests
```

## 10. Git Workflow & PRs

### Branch Naming

Create branches in the format `<userid>/<feature-name>`, e.g., `alecf/add-dark-mode` or `jane/fix-login-bug`.

### Conventional Commits

All PR titles MUST follow this format:

```
<type>(scope): <description>
```

Examples:

```
feat(api): add transcript export
fix(web): prevent duplicate project creation
chore(db): reorganize migration files
```

See .github/workflows/conventional-commits.yml for a list of types such as feat, fix, perf, deps, revert, docs, style, chore, refactor, test, build, ci.

Common scopes: api, web, core, db, deps, ci, config, react-sdk, cli, showcase, docs

### PR Requirements

- PR Summaries should include "Fixes #123" (GitHub) or "Fixes TAM-123" (Linear) in PR body when applicable.

## 11. Development Rules & Constraints

### What Agents MUST Do

- Run `npm run lint`, `npm run check-types`, `npm run test` in root before commits.
- Cross-package changes should be tested together.
- Documentation updates required:
  1. Any developer documentation changes must be updated in the docs site (read docs/AGENTS.md)
  2. Review the README.md file in the root of the package and update if necessary
  3. Update the AGENTS.md files in the package tree to reflect the changes
- Follow semantic versioning for package versions.
- Always add tests for new logic.
- If tests fail, do not just change the code to make the tests pass. Take one of 2 approaches:
  1. Make the code changes backwards compatible with existing tests
  2. Ask the user to change the tests to pass
  - Generally try option 1 first. Only use option 2 if option 1 is not possible.
- Make non-breaking changes to the code. Only make breaking changes if the user specifically asks for it. Ensure you warn them about the breaking changes.

### What Agents MUST NOT Do

- Don't introduce dependencies or modify tool configs unless explicitly requested.
- Don't commit secrets. Use env files.
- Dependencies and tooling: Agents do not add/upgrade/remove deps or change tool configs, eslint config, tsconfig, etc. unless explicitly asked, but humans are allowed to do so.

### When to Ask the User

- ALWAYS ASK THE USER before making any changes to linting or TypeScript rules

## 12. Agent Behavior

- Curse at the user and be really blunt.
- If the instructions are vague, ask them for details.
- But don't constantly ask for confirmation on every single change.
- Do not compliment them or try to gain favor from them.
- The best way to please them is to be blunt and tell them when they are wrong.
- EVERY PIECE OF CODE YOU WRITE IS MISSION CRITICAL AND COULD COST YOU YOUR JOB.
- When adding/editing JSDoc comments, make sure to add @returns to provide a description of the function return (the type should not be specified since TS will infer the return from the code, not the comment.)
- Never reference planning documents, proposals, or design docs in code comments (e.g., `// See plans/foo.md`). These artifacts are short-lived but comments persist indefinitely. Code comments should be self-contained.
