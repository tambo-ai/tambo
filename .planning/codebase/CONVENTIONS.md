# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**

- kebab-case for all files and directories (e.g., `use-tambo.ts`, `component-registry.ts`)
- React component files use the component name (e.g., `tambo-provider.tsx`)
- Test files end with `.test.ts` or `.test.tsx` - never `.spec.ts`

**Functions:**

- camelCase for all function and method names
- React hooks: prefix with `use` (e.g., `useTambo`, `useTamboQuery`, `useTamboMutation`)
- React components: PascalCase (e.g., `TamboProvider`, `AppController`)
- Helper functions use verb prefixes when appropriate (e.g., `getComponentFromRegistry`, `mapTamboToolToContextTool`, `convertPropsToJsonSchema`)
- Boolean functions: start with `is`, `has`, `can`, or `should` (e.g., `isStandardSchema`)

**Variables:**

- camelCase for all variables and constants (both mutable and immutable)
- Use `const` by default; avoid `let`. Create new functions returning values instead of mutating
- Boolean variables: prefix with `is`, `has`, `can`, or `should`

**Types & Interfaces:**

- PascalCase for all types and interfaces
- Component props interfaces: `{ComponentName}Props` (e.g., `TamboProviderProps`)
- Event handlers in props: `on{Event}` (e.g., `onError`, `onSuccess`)
- Internal handlers within components: `handle{Event}` (e.g., `handleClick`)

**Environment Variables:**

- UPPER_SNAKE_CASE (e.g., `API_KEY`, `DATABASE_URL`, `NODE_ENV`)

## Code Style

**Formatting:**

- Tool: Prettier (`3.8.1`)
- Print width: 80 characters
- Tab width: 2 spaces
- No tabs
- Always include semicolons
- Double quotes for strings
- Trailing commas on all
- Bracket spacing: true
- Arrow function params: always include parens (e.g., `(x) => x + 1`)
- Line endings: LF

**Linting:**

- Tool: ESLint with TypeScript support (typescript-eslint)
- Config: `eslint.config.mjs` (flat config format, ESLint 9+)
- React-specific rules in `react-internal.mjs` for library code
- Base config in `packages/eslint-config/base.mjs`
- Key rules enforced:
  - No floating promises (`@typescript-eslint/no-floating-promises`)
  - Always return async functions (`@typescript-eslint/return-await: always`)
  - Mark async functions correctly (`@typescript-eslint/promise-function-async`)
  - No nested ternaries (`no-nested-ternary`)
  - No unused variables (ignore params/catches starting with `_`)
  - No unnecessary type assertions, template expressions, or qualifiers
  - React hooks dependency array exhaustiveness (`react-hooks/exhaustive-deps`)

**TypeScript:**

- Strict mode enabled (`strict: true`)
- Target: ES2024
- Module resolution: NodeNext
- No `any` types - use `unknown` when type is uncertain and narrow it down
- Use `z.infer<typeof schema>` for Zod-derived types
- Use built-in utility types (`Pick`, `Omit`, `Partial`, `Required`, etc.)
- Use `type-fest` for advanced type utilities
- Avoid type casts (`as`) unless absolutely necessary
- Use `satisfies` operator for compile-time validation of object literals
- No type assertions - prefer narrowing types or updating function signatures

## Import Organization

**Order (enforce in code review):**

1. External packages (e.g., `import React from "react"`)
2. Relative imports from parent/sibling modules (e.g., `import { useTambo } from "../../providers"`)
3. Type-only imports at the end of each group using `import type`

**Path Aliases:**

- `@/` - Maps to `src/` within React SDK and other packages
- Used only for same-package imports; never for cross-package imports
- Example: `import { useRegistry } from "@/hooks"`

**Export Style:**

- Prefer named exports; allow multiple exports when they belong together
- Avoid default exports
- No barrel files (`index.ts`) for internal modules - import directly from source
- Package entry points (`packages/core/src/index.ts`) are fine for re-exporting public API
- Never re-export symbols for backwards compatibility - update consumers instead

## Error Handling

**Strategy: Fail-Fast, No Silent Fallbacks**

- Code must fail immediately when expected conditions aren't met
- Silent fallback behavior masks bugs and creates unpredictable systems
- Throw explicit error messages explaining what failed and what was expected

**Patterns:**

- Guard clauses at function start to validate inputs
  ```typescript
  export function getComponent(name: string) {
    if (!name) {
      throw new Error(`Required component name not provided`);
    }
    if (!components.has(name)) {
      throw new Error(`Required model ${name} not found in registry`);
    }
    return components.get(name)!;
  }
  ```
- Data mapping: explicitly handle all known values, throw for unknowns

  ```typescript
  // Good: explicit handling
  if (role === "user") return "user";
  if (role === "assistant") return "assistant";
  throw new Error(`Unknown message role: ${role}`);

  // Bad: silent fallback masks issues
  const roleMap = { user: "user", assistant: "assistant" };
  return roleMap[role] ?? "unknown";
  ```

- Log warnings when intentionally skipping invalid data
  ```typescript
  for (const item of items) {
    if (!item.required) {
      logger.warn(`Skipping invalid item: ${item.id}`);
      continue;
    }
    // process item
  }
  ```

## Logging

**Framework:** console methods or Logger service in NestJS

- Use appropriate levels: `log`, `warn`, `error`
- Include context in messages (e.g., operation name, resource ID)
- Use structured logging with objects when helpful
- Never log secrets or API keys

**Patterns:**

- Log warnings when skipping or falling back
- Log errors with full context before throwing
- Log timing/performance data for long operations

## Comments

**When to Comment:**

- Explain WHY, not WHAT - code should be self-documenting
- Comment complex algorithms or non-obvious logic
- Explain trade-offs or gotchas
- Never comment out code - delete it or create an issue
- Avoid referencing planning docs or designs in comments - document in `devdocs/` instead

**JSDoc/TSDoc:**

- Use for all public functions and exports
- Include `@param` for parameters and `@returns` for return values
- Type annotations in JSDoc are optional (TypeScript infers from code)
- Example:
  ```typescript
  /**
   * Resolves component dependencies recursively
   * @param componentName - The name of the component to resolve
   * @returns List of component names including dependencies
   */
  export async function resolveComponentDependencies(
    componentName: string,
  ): Promise<string[]> {
    // implementation
  }
  ```

## Function Design

**Size:**

- Prefer functions under 20 statements
- Keep files focused and reasonably sized (ideally <200-300 lines)
- Extract helpers for complex or repeated logic

**Parameters:**

- Use object parameters for functions with 3+ params
- Use rest parameters `...args` when collecting arbitrary items
- Destructure object params to show intent

**Return Values:**

- Return immutable values - don't modify inputs
- Use discriminated unions for mutually exclusive results:
  ```typescript
  type Result<T> =
    | { success: true; data: T }
    | { success: false; error: Error };
  ```
- For void-returning functions, prefer verb names: `executeX`, `saveX`, `setupX`

**Async/Await:**

- All async functions must be declared `async`
- Always use `await` when calling async functions
- Use `async/await` with `try/catch` for natural error propagation
- Only use `.catch()` when you can't `await` (e.g., fire-and-forget in `useEffect`)
- Mark fire-and-forget calls with `void` prefix to document intent
- Avoid IIFEs (Immediately Invoked Function Expressions)

## Module Design

**Exports:**

- Prefer named exports over default
- Group related exports together (e.g., component + prop types)
- Don't create unnecessary intermediate types

**Barrel Files:**

- No barrel files (`index.ts`) for internal modules - import directly from source files
- Exception: package entry points are fine for public APIs

**File Organization (typical package structure):**

- `src/` - source code
- `src/hooks/` - React hooks
- `src/providers/` - Context providers
- `src/model/` - TypeScript interfaces and types
- `src/util/` or `src/utils/` - utility functions
- `src/services/` - business logic services
- `src/__tests__/` - integration tests (not co-located)
- `src/__mocks__/` or `src/__fixtures__/` - test fixtures and mocks
- `test/` - e2e tests at package root

## Control Flow

- Avoid nested or chained ternary operators - use `if/else` or `switch` instead
- Use `switch` statements for checking multiple values
- Leverage TypeScript exhaustiveness checking in switch statements
- Prefer early returns and guard clauses over nested if/else
- Use map, filter, find, some, every instead of reduce when possible
- Avoid reduce - it's often confusing; use simpler patterns instead

## Immutability & Mutation

- **Prefer immutability**: don't mutate inputs, return new values
- Use `const` for all declarations
- Use spread operators for object/array copies: `{ ...obj }`, `[...arr]`
- Use `toSorted()`, `toSpliced()` instead of `.sort()`, `.splice()`
- Use `Object.assign()` or spread for shallow updates
- Mark object properties `readonly` when appropriate

## Specific Language Features

**Regex:**

- Avoid regex when possible - use string methods (`includes()`, `startsWith()`, `split()`, `replace()`)
- Never use global flag (`/g`) - creates stateful regex with `lastIndex` persistence
- Avoid multiline flag (`/m`) - line ending differences cause inconsistent behavior
- If regex is unavoidable: keep it simple, add comments, test edge cases

**Type Conversions:**

- Avoid unnecessary constructors: `String()`, `Number()`, `Boolean()`
- String conversion: use template literals `` `${value}` ``
- Number conversion: use unary plus `+value` (only when necessary)
- Boolean conversion: use double negation `!!value` (only when necessary)

**Utility Types from type-fest:**

- Check `type-fest` before writing complex derivative types
- Common utilities: `PartialDeep`, `ReadonlyDeep`, `RequiredDeep`, `Merge`, `ValueOf`, `SetOptional`

---

_Convention analysis: 2026-02-11_
