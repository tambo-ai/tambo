# Centralize Component Registry

**Date:** 2026-01-14
**Status:** Phase 2 Complete (2026-01-21)
**Type:** Refactor

## Overview

Create `packages/ui-registry/` as a shared internal package that consuming apps import directly at build time. This eliminates code duplication and ensures all apps use identical component code from a single source of truth.

## Goals

1. **Single Source of Truth**: One canonical location for all Tambo components
2. **Direct Imports**: Apps import from `@tambo-ai/ui-registry` at build time - no file copying
3. **Eliminate Drift**: Impossible to have diverged component code across apps

## Non-Goals

- Publishing `@tambo-ai/ui-registry` to npm (internal only)
- Changing how end users consume components via `tambo add`

## Problem Statement

Tambo components serve two different audiences:

1. **End users** - get source files via `tambo add` (CLI copies to their project)
2. **Internal apps** - showcase, web, docs need to use the same components

The current architecture only serves #1. Components live in `cli/src/registry/` and internal apps get copies:

| Location                         | How it gets components | Problem                                    |
| -------------------------------- | ---------------------- | ------------------------------------------ |
| `cli/src/registry/`              | Source of truth        | Designed for CLI distribution, not imports |
| `showcase/src/components/tambo/` | Auto-synced            | Copy - still diverges, git noise           |
| `apps/web/components/ui/tambo/`  | Manual copy            | **Diverged significantly**                 |
| `docs/src/components/tambo/`     | Manual copy            | Subset only, drifted                       |

**The root issue:** There's no proper shared package for internal apps to import from. Everything flows through the CLI's distribution structure, forcing internal apps to use copies.

**Why "just sync better" doesn't fix it:**

- Copies are the wrong abstraction - these are shared dependencies, not vendored files
- IDE "Go to Definition" navigates to copy, not source - devs edit wrong file
- N copies in git = bloat, merge conflicts, blame noise
- CI enforcement catches drift _after_ wasted dev time
- Sync scripts are maintenance burden

**What we actually need:** A workspace package that internal apps import directly, while CLI continues bundling files for end-user distribution.

## Proposed Solution

Create `packages/ui-registry/` as an internal package. Apps import components directly via workspace dependencies and package exports. The CLI is the only consumer that needs physical copies (for npm distribution).

```
packages/ui-registry/
├── package.json                         # Explicit exports for each component
├── tsconfig.json
├── globals.css
└── src/
    ├── components/                      # Components (nested structure preserved)
    │   ├── message/
    │   │   ├── config.json              # Component metadata
    │   │   ├── message.tsx              # Main component
    │   │   ├── markdown-components.tsx  # Helper component
    │   │   └── index.tsx                # Barrel export
    │   ├── message-input/
    │   │   ├── config.json
    │   │   ├── message-input.tsx
    │   │   ├── text-editor.tsx
    │   │   ├── dictation-button.tsx
    │   │   └── index.tsx
    │   └── ... (remaining components follow same pattern)
    ├── config/
    │   └── tailwind.config.ts           # Tailwind configuration for tambo add
    ├── lib/
    │   └── thread-hooks.ts              # Shared hooks (130+ lines)
    └── utils.ts                         # cn(), etc.
```

**Key principles:**

- **Preserve existing nested structure** - each component gets its own directory (e.g., `message/`, `message-input/`)
- Helper files (text-editor, markdown-components) stay with their parent component
- Each component directory has `config.json`, main component file, and `index.tsx` re-export
- `lib/` for shared hooks used across multiple components

## Architecture

### How Apps Consume Components

**Internal apps (showcase, web, docs):**

- Add `"@tambo-ai/ui-registry": "*"` as workspace dependency
- Add `transpilePackages: ["@tambo-ai/ui-registry"]` to Next.js config
- Import directly: `import { Message } from "@tambo-ai/ui-registry/components/message"`

**CLI distribution:**

- Prebuild step copies registry to `cli/dist/registry/` (files bundled with CLI npm package)
- `tambo add` reads bundled files, transforms imports at runtime, writes to user project
- Runtime transformation allows customizing paths based on user's project structure
- Users get TypeScript source files (matches shadcn/ui approach)

### Inter-Component Dependencies

Components may import from each other (e.g., `message-thread-full` imports `message`).

**In the registry package:** Use package imports for all dependencies:

```typescript
// packages/ui-registry/src/components/message-thread-full/message-thread-full.tsx
import { Message } from "@tambo-ai/ui-registry/components/message";
```

**When copied to user projects:** CLI transforms imports at runtime:

```typescript
// After tambo add
import { Message } from "@/components/tambo/message";
```

**Automatic dependency resolution:** The `registry/*.json` metadata files specify which components depend on others. When a user runs `tambo add message-thread-full`, the CLI:

1. Reads `registry/message-thread-full.json`
2. Finds `requires: ["message", "message-input"]`
3. Recursively installs all dependencies

### CSS Handling

**In the registry package:** CSS lives in `globals.css` at package root.

**For internal apps:** Import directly:

```typescript
import "@tambo-ai/ui-registry/globals.css";
```

**For user projects via `tambo add`:**

1. CLI reads user's existing `globals.css` (or `app/globals.css`)
2. Appends Tambo CSS variables and component styles
3. Does NOT overwrite - merges intelligently
4. Handles Tailwind v3 and v4 differences (existing logic in `cli/src/commands/add/tailwind/`)

## Prerequisites

### Web Component Audit

`apps/web/components/ui/tambo/` has diverged. Before migration, audit the files and decide which to keep, reconcile, or move out. Leave existing components in place, but COPY reconciled versions to registry package.

**Diverged (need reconciliation):**

- `message.tsx` - Uses `useMergedRef` vs `useMergeRefs`, different imports
- `thread-hooks.ts` - 65+ lines of difference in ref handling

**Web-specific (move to `apps/web/components/ui/`):**

- `context-attachment-badge.tsx`
- `demo-config.ts`
- `founder-email-component.tsx`
- `message-input-with-interactables.tsx`
- `tambo-email-button.tsx`
- `suggestions-tooltip.tsx`
- `thread-container.tsx`
- `message-generation-stage.tsx`
- `text-editor.tsx`
- `mcp-config-modal.tsx`

**Action:** Diff each file against CLI registry. Pick better version. Move web-specific components out to the higher-level `components/` directory.

## Technical Approach

### Package Structure

```json
// packages/ui-registry/package.json
{
  "name": "@tambo-ai/ui-registry",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./globals.css": "./globals.css",
    "./utils": "./src/utils.ts",
    "./lib/thread-hooks": "./src/lib/thread-hooks.ts",
    "./config/tailwind": "./src/config/tailwind.config.ts",
    "./components/message": "./src/components/message/index.tsx",
    "./components/message-input": "./src/components/message-input/index.tsx",
    "./components/message-thread-full": "./src/components/message-thread-full/index.tsx"
    // ... (all components explicitly listed)
  },
  "peerDependencies": {
    "@tambo-ai/react": "*",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@tambo-ai/react": "*",
    "@tambo-ai/typescript-config": "*",
    "@tambo-ai/eslint-config": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "latest",
    "date-fns": "^4.0.0",
    "react-markdown": "^9.0.0",
    "tailwind-merge": "^2.0.0",
    "clsx": "^2.0.0"
  }
}
```

**Note on exports:** Using explicit exports (not wildcards) for reliability across bundlers. Each component gets an entry. A script can generate this list from `src/components/`.

```json
// packages/ui-registry/tsconfig.json
{
  "extends": "@tambo-ai/typescript-config/base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "registry"]
}
```

### Consumer Configuration

Each app needs two things:

#### 1. Workspace Dependency

```json
// showcase/package.json, apps/web/package.json, docs/package.json
{
  "dependencies": {
    "@tambo-ai/ui-registry": "*"
  }
}
```

npm workspaces symlinks the package. The `exports` field handles module resolution.

#### 2. Next.js transpilePackages

**Required** - Next.js must compile workspace packages:

```typescript
// showcase/next.config.ts
// apps/web/next.config.mjs  (note: .mjs not .ts)
// docs/next.config.mjs
const nextConfig = {
  transpilePackages: ["@tambo-ai/ui-registry"],
  // ... other config
};
```

**TypeScript paths are optional.** Test without them first - IDE navigation may work via workspace symlinks. Add paths only if "Go to Definition" doesn't navigate to source.

## Registry Metadata Structure

Each component has a co-located `config.json` file in its directory (existing format preserved):

```json
// packages/ui-registry/src/components/message-thread-full/config.json
{
  "name": "message-thread-full",
  "description": "Displays a complete message thread with all its content and interactions",
  "componentName": "MessageThreadFull",
  "dependencies": ["@tambo-ai/react", "class-variance-authority"],
  "devDependencies": [],
  "requires": [
    "thread-content",
    "message-input",
    "message-suggestions",
    "message"
  ],
  "files": [
    {
      "name": "message-thread-full.tsx",
      "content": "src/components/message-thread-full/message-thread-full.tsx"
    },
    {
      "name": "lib/thread-hooks.ts",
      "content": "src/lib/thread-hooks.ts"
    }
  ]
}
```

### Import Path Strategy/Transformation

Import transformation happens at **runtime** when `tambo add` copies files to user projects. The `@tambo-ai/ui-registry/*` imports in bundled files are just strings—never resolved by Node.

**Default import mapping:**

| Registry Import                      | User Project Import    |
| ------------------------------------ | ---------------------- |
| `@tambo-ai/ui-registry/utils`        | `@/lib/utils`          |
| `@tambo-ai/ui-registry/components/*` | `@/components/tambo/*` |
| `@tambo-ai/ui-registry/lib/*`        | `@/lib/*`              |

**Benefits of runtime transformation:**

- Can detect user's project structure (e.g., `src/` prefix, custom paths)
- Can respect user's existing tsconfig path aliases
- Flexible output paths without requiring CLI rebuild

### TypeScript Configuration

**Required for consumers:** `transpilePackages` in Next.js config. This is mandatory, not optional.

**TypeScript paths:** NOT required. Workspace symlinks handle resolution. Do not add `paths` config - it creates maintenance burden and can conflict with workspace resolution.

### Turbo Configuration

The CLI build depends on registry source files. This ensures registry changes trigger CLI rebuilds even with caching.

```json
// turbo.json (simplified)
{
  "tasks": {
    "tambo#build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        // add registry source files as inputs
        "../../packages/ui-registry/src/**"
      ],
      "outputs": ["dist/**"]
    }
  }
}
```

## Acceptance Criteria

- [x] All shared components exist in `packages/ui-registry/src/components/`
- [x] Showcase, Web, Docs import from `@tambo-ai/ui-registry` and build successfully
- [x] CLI copies registry at build time; `tambo add <component>` works
- [x] Old component directories deleted (showcase, web, docs)
- [x] `npm run lint && npm run check-types && npm test` all pass
- [x] HMR works: edit in `packages/ui-registry/`, change appears in running apps
- [ ] `tambo add` resolves and transforms imports, installs component dependencies
- [ ] `tambo upgrade` works with new structure

## Implementation Phases

### Phase 1: Create Registry Package + Update CLI ✅ COMPLETE

1. **Create `packages/ui-registry/`**
   - `package.json` with explicit exports (no wildcards)
   - `tsconfig.json` extending shared config
   - Add to root workspaces

2. **Move registry files (preserve nested structure)**
   - Move entire component directories from cli folder:
     - `cli/src/registry/<name>/` → `packages/ui-registry/src/components/<name>/`
     - Each directory keeps its `config.json`, main component, helper files, and `index.tsx`
   - Move `cli/src/registry/lib/*` → `packages/ui-registry/src/lib/`
   - Move `cli/src/registry/config/*` → `packages/ui-registry/src/config/` (tailwind config, etc.)
   - Move `cli/src/registry/utils.ts` → `packages/ui-registry/src/utils.ts`

3. **Update imports in moved components**
   - `@/lib/utils` → `@tambo-ai/ui-registry/utils`
   - `@/lib/thread-hooks` → `@tambo-ai/ui-registry/lib/thread-hooks`
   - `@/components/tambo/*` → `@tambo-ai/ui-registry/components/*`
   - Keep relative imports for files within same component directory (e.g., `./text-editor`)

4. **Move web-specific components**
   - Move non-tambo components up to `apps/web/components/ui/` or migrate to registry deemed valuable to all apps
   - Update web imports

5. **Reconcile diverged files**
   - Review and reconcile differences in all the different applications (web, showcase, docs)
   - Pick best implementation for registry and COPY to registry package (existing file will be removed once all apps use registry)

6. **Create prebuild script** (`cli/scripts/copy-registry.ts`)
   - Copy `packages/ui-registry/src/` → `cli/dist/registry/`
     - Only include `.ts` and `.tsx` files, exclude `.test.ts` and `.test.tsx` files
     - Include `config.json` files for component metadata
   - No transformation at build time - files keep `@tambo-ai/ui-registry/*` imports
   - Run as part of `npm run build` in CLI package

7. **Update CLI to read from new location**
   - Update path resolution in `cli/src/commands/add/` to read from `dist/registry/`
   - Implement runtime import transformation using existing logic, updated for new import patterns
   - Update Turbo config with registry inputs for cache invalidation

### Phase 2: Migrate Remaining Consumers ✅ COMPLETE

1. **Configure each consumer** (showcase, web, docs)
   - Add `"@tambo-ai/ui-registry": "*"` to dependencies
   - Add `transpilePackages: ["@tambo-ai/ui-registry"]` to Next.js config

2. **Update imports**
   - Showcase: `@/components/tambo/*` → `@tambo-ai/ui-registry/components/*`
   - Web: `@/components/ui/tambo/*` → `@tambo-ai/ui-registry/components/*`
   - Docs: `@/components/tambo/*` → `@tambo-ai/ui-registry/components/*`

3. **Verify before deleting**
   - All apps build successfully
   - HMR works
   - Type checking passes
   - Manual smoke test in each app

4. **Delete old directories** (only after verification) ✅ DONE
   - `showcase/src/components/tambo/` - deleted (kept `message-thread-panel-with-mcp.tsx` as showcase-specific)
   - `apps/web/components/ui/tambo/` - deleted shared components (kept web-specific: `context-attachment-badge.tsx`, `demo-config.ts`, `edit-with-tambo-button.tsx`, `founder-email-component.tsx`, `message-input-with-interactables.tsx`, `message-thread-full.tsx`, `message-thread-panel.tsx`, `tambo-email-button.tsx`)
   - `docs/src/components/tambo/` - deleted entirely
   - `scripts/sync-showcase-components.ts` - deleted
   - `scripts/README.md` - deleted
   - Removed `sync:showcase` from turbo.json and package.json
   - Removed sync trigger from `lint-staged.config.mjs`

### Phase 3: Verification & Cleanup (TO DO)

1. **Integration testing**
   - `tambo add message` in fresh project
   - `tambo add message-thread-full` (component with dependencies)
   - Verify transformed imports work
   - Verify CSS merges correctly

2. **HMR verification**
   - Start each consumer in dev mode
   - Edit component in `packages/ui-registry/`
   - Confirm change appears without restart

3. **CI enforcement**
   - Add lint step to verify exports match filesystem
   - Ensure all apps build in CI

## Testing Requirements

**Import transformation (runtime):**

- Transforms `@tambo-ai/ui-registry/*` imports to user project paths
- Preserves non-registry imports
- Handles multiple imports per file

**`tambo add` scenarios:**

| Scenario                    | Validates                        |
| --------------------------- | -------------------------------- |
| Single component            | Basic flow                       |
| Component with dependencies | Recursive install via `requires` |
| Multiple components         | No duplicate installs            |
| Re-add existing component   | Idempotent, no errors            |
| Component with CSS          | globals.css merge                |

**`tambo upgrade` scenarios:**

| Scenario                    | Validates                     |
| --------------------------- | ----------------------------- |
| Upgrade single component    | Updates to latest version     |
| Upgrade multiple components | All updated without conflicts |

## References

- [shadcn/ui Monorepo](https://ui.shadcn.com/docs/monorepo)
- [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
