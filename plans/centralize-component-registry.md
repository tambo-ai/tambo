# Centralize Component Registry

**Date:** 2026-01-14
**Status:** Draft
**Type:** Refactor

## Overview

Create `packages/registry/` as a shared internal package that consuming apps import directly at build time. This eliminates code duplication and ensures all apps use identical component code from a single source of truth.

## Goals

1. **Single Source of Truth**: One canonical location for all Tambo components
2. **Direct Imports**: Apps import from `@tambo-ai/registry` at build time - no file copying
3. **Eliminate Drift**: Impossible to have diverged component code across apps

## Non-Goals

- Publishing `@tambo-ai/registry` to npm (internal only)
- Changing how end users consume components via `tambo add`

## Problem Statement

The component registry is duplicated across multiple locations:

| Location                         | Status          | Issues                     |
| -------------------------------- | --------------- | -------------------------- |
| `cli/src/registry/`              | Source of truth | Bundled in CLI npm package |
| `showcase/src/components/tambo/` | Auto-synced     | Working, but still a copy  |
| `apps/web/components/ui/tambo/`  | Manual copy     | **Diverged significantly** |
| `docs/src/components/tambo/`     | Manual copy     | Subset only, minor drift   |

**Why syncing is not enough:**

- Synced files are still copies - easy to accidentally edit the wrong location
- Sync can be skipped or forgotten, leading to drift
- Multiple copies in git history create noise and merge conflicts
- Each app has its own version of "the same" component

**The real problem:** Components should be shared code, not copied code.

## Proposed Solution

Create `packages/registry/` as an internal package. Apps import components directly via workspace dependencies and package exports. The CLI is the only consumer that needs physical copies (for npm distribution).

```
packages/registry/
├── package.json
├── tsconfig.json
├── globals.css
├── src/
│   ├── components/
│   │   ├── message.tsx              # Main components
│   │   ├── message-input.tsx
│   │   ├── markdown-components.tsx  # Helper components (flattened)
│   │   ├── text-editor.tsx
│   │   ├── dictation-button.tsx
│   │   └── ... (all files flat, no nesting)
│   ├── lib/
│   │   └── thread-hooks.ts          # Shared hooks (130+ lines)
│   └── utils.ts                     # cn(), etc.
└── registry/
    ├── message.json                 # CLI metadata (dependencies, files)
    ├── message-input.json
    └── ...
```

**Key principles:**

- **All `.tsx` files flat** in `src/components/` - no nested directories
- Helper components (text-editor, markdown-components) become standalone files
- Main components import siblings: `import { TextEditor } from "./text-editor"`
- `lib/` for shared hooks (too substantial for utils.ts)
- `registry/*.json` for CLI metadata (dependencies, file lists)

## Architecture

### How Apps Consume Components

**Showcase, Web, Docs** - Direct imports via package exports:

```typescript
// In showcase/src/app/page.tsx
import { MessageThreadFull } from "@tambo-ai/registry/components/message-thread-full";
import { cn } from "@tambo-ai/registry/utils";
import { useTamboThreadScroll } from "@tambo-ai/registry/lib/thread-hooks";
import "@tambo-ai/registry/globals.css";
```

Module resolution:

1. Workspace dependency symlinks `@tambo-ai/registry` to `node_modules`
2. Package `exports` field maps import paths to source files
3. Next.js `transpilePackages` compiles the TypeScript

**CLI** - Copies files at build time for npm distribution:

```typescript
// CLI's pre-build step copies packages/registry/ to cli/dist/registry/
// tambo add reads registry/*.json for metadata, src/components/ for code
```

Direct imports mean:

- No sync scripts to run or forget
- IDE "Go to Definition" goes to the real source
- Changes are immediately visible in all apps

## Prerequisites

### Web Component Audit

`apps/web/components/ui/tambo/` has 19 files. Before migration, categorize each:

**Diverged (need reconciliation):**

- `message.tsx` - Uses `useMergedRef` vs `useMergeRefs`, different imports
- `thread-hooks.ts` - 65+ lines of difference in ref handling

**Web-specific (move to `apps/web/components/ui/web-specific/`):**

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

**Shared (move to registry):**

- Remaining files that match CLI registry

**Action:** Diff each file against CLI registry version. Pick the better version for shared components. Move web-specific components out.

## Technical Approach

### Package Structure

```json
// packages/registry/package.json
{
  "name": "@tambo-ai/registry",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./globals.css": "./globals.css",
    "./utils": "./src/utils.ts",
    "./lib/thread-hooks": "./src/lib/thread-hooks.ts",
    "./components/message": "./src/components/message.tsx",
    "./components/message-input": "./src/components/message-input.tsx",
    "./components/message-thread-full": "./src/components/message-thread-full.tsx",
    "./components/markdown-components": "./src/components/markdown-components.tsx",
    "./components/text-editor": "./src/components/text-editor.tsx"
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
// packages/registry/tsconfig.json
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
    "@tambo-ai/registry": "*"
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
  transpilePackages: ["@tambo-ai/registry"],
  // ... other config
};
```

**TypeScript paths are optional.** Test without them first - IDE navigation may work via workspace symlinks. Add paths only if "Go to Definition" doesn't navigate to source.

### CLI Build Pipeline

The CLI needs physical files to bundle in the npm package. A pre-build step copies the registry:

```json
// cli/package.json
{
  "scripts": {
    "prebuild": "tsx scripts/copy-registry.ts",
    "build": "tsc --project tsconfig.build.json"
  }
}
```

```typescript
// cli/scripts/copy-registry.ts
import { cpSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ESM-compatible __dirname (CLI is an ESM module)
const __dirname = dirname(fileURLToPath(import.meta.url));

const REGISTRY_SRC = join(__dirname, "../../packages/registry");
const REGISTRY_DEST = join(__dirname, "../dist/registry");

// Clean and copy
rmSync(REGISTRY_DEST, { recursive: true, force: true });
cpSync(REGISTRY_SRC, REGISTRY_DEST, { recursive: true });

console.log("✓ Registry copied to cli/dist/registry/");
```

### Import Path Strategy

**Critical prerequisite:** Components currently use `@/` imports that must be updated to `@tambo-ai/registry/` imports BEFORE migration:

```typescript
// BEFORE (current cli/src/registry/ components)
import { cn } from "@/lib/utils";
import { useTamboThreadScroll } from "@/lib/thread-hooks";
import { Message } from "@/components/tambo/message";

// AFTER (packages/registry/src/components/)
import { cn } from "@tambo-ai/registry/utils";
import { useTamboThreadScroll } from "@tambo-ai/registry/lib/thread-hooks";
import { Message } from "@tambo-ai/registry/components/message";
```

The CLI's `tambo add` command transforms imports when copying to user projects:

```typescript
// cli/src/commands/add/utils.ts - transformRegistryImports()
function transformRegistryImports(content: string): string {
  return content
    .replace(/@tambo-ai\/registry\/components\//g, "@/components/tambo/")
    .replace(/@tambo-ai\/registry\/lib\//g, "@/lib/")
    .replace(/@tambo-ai\/registry\/utils/g, "@/lib/utils");
}
```

### Turbo Configuration

No sync tasks needed. Apps import directly. Only CLI needs a copy step:

```json
// turbo.json (simplified)
{
  "tasks": {
    "tambo#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

## Acceptance Criteria

- [ ] All shared components exist in `packages/registry/src/components/`
- [ ] Showcase, Web, Docs import from `@tambo-ai/registry` and build successfully
- [ ] CLI copies registry at build time; `tambo add <component>` works
- [ ] Old component directories deleted (showcase, web, docs)
- [ ] `npm run lint && npm run check-types && npm test` all pass
- [ ] HMR works: edit in `packages/registry/`, change appears in running apps

## Implementation Phases

### Phase 1: Create Registry Package

1. **Create `packages/registry/`**
   - `package.json` with explicit exports
   - `tsconfig.json`
   - `globals.css`
   - `src/components/`, `src/lib/`, `src/utils.ts`
   - `registry/` for CLI metadata
   - Add to root `package.json` workspaces

2. **Flatten and move components**
   - Move main components: `cli/src/registry/<name>/<name>.tsx` → `packages/registry/src/components/<name>.tsx`
   - Move helper files to top level: `text-editor.tsx`, `markdown-components.tsx`, `dictation-button.tsx`, etc.
   - Move `lib/thread-hooks.ts` → `packages/registry/src/lib/thread-hooks.ts`
   - Move utilities to `packages/registry/src/utils.ts`
   - Remove `index.tsx` re-export files (not needed with flat structure)

3. **Move CLI metadata**
   - Move `cli/src/registry/<name>/config.json` → `packages/registry/registry/<name>.json`
   - Update file paths in config to reflect new structure

4. **Update imports in moved components**
   - `@/lib/utils` → `@tambo-ai/registry/utils`
   - `@/lib/thread-hooks` → `@tambo-ai/registry/lib/thread-hooks`
   - `@/components/tambo/*` → `@tambo-ai/registry/components/*`
   - Relative imports for siblings: `./text-editor`, `./markdown-components`

5. **Generate exports list**
   - Script to generate explicit exports in package.json from `src/components/`

6. **Move web-specific components**
   - Create `apps/web/components/ui/web-specific/`
   - Move 10+ web-only components there
   - Update web imports

7. **Reconcile diverged files**
   - Diff `message.tsx`, `thread-hooks.ts` between CLI and web
   - Pick best version, update registry

### Phase 2: Migrate Consumers

1. **Configure each consumer** (showcase, web, docs)
   - Add `"@tambo-ai/registry": "*"` to `package.json`
   - Add `transpilePackages: ["@tambo-ai/registry"]` to Next.js config
   - Run `npm install`

2. **Update imports**
   - Showcase: `@/components/tambo/*` → `@tambo-ai/registry/components/*`
   - Web: `@/components/ui/tambo/*` → `@tambo-ai/registry/components/*`
   - Docs: `@/components/tambo/*` → `@tambo-ai/registry/components/*`

3. **Delete old directories**
   - `showcase/src/components/tambo/`
   - `apps/web/components/ui/tambo/` (shared components only)
   - `docs/src/components/tambo/`
   - `scripts/sync-showcase-components.ts`

4. **Verify**
   - All apps build
   - HMR works
   - `npm run check-types` passes

### Phase 3: Update CLI

1. **Add prebuild copy script**
   - Create `cli/scripts/copy-registry.ts`
   - Add `"prebuild": "tsx scripts/copy-registry.ts"` to CLI package.json

2. **Update path resolution**
   - CLI reads metadata from `dist/registry/registry/*.json`
   - CLI reads components from `dist/registry/src/components/`
   - Update `cli/src/commands/add/` to handle new structure

3. **Update import transformation**
   - Add `transformRegistryImports()` to convert `@tambo-ai/registry/*` → `@/*` for user projects

4. **Test**
   - `tambo add message-thread-full` in fresh project
   - Verify transformed imports work
   - Verify dependencies are installed correctly

## References

- [shadcn/ui Monorepo](https://ui.shadcn.com/docs/monorepo)
- [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
