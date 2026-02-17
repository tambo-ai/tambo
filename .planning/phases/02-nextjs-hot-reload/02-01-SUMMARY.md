---
phase: 02-nextjs-hot-reload
plan: 01
subsystem: next-config
tags:
  - hmr
  - transpile
  - workspace-packages
  - nextjs-config
dependency_graph:
  requires:
    - 01-01 (apps/web config foundation)
  provides:
    - transpilePackages config for showcase
    - transpilePackages config for docs
  affects:
    - showcase hot reload behavior
    - docs hot reload behavior
tech_stack:
  added: []
  patterns:
    - Next.js transpilePackages for workspace dependencies
key_files:
  created: []
  modified:
    - showcase/next.config.ts
    - docs/next.config.mjs
decisions:
  - context: "react-sdk HMR limitation"
    choice: "Added @tambo-ai/react to transpilePackages but true source-level HMR requires dev:sdk watch mode"
    rationale: "react-sdk exports compiled JS (esm/dist), not TypeScript source, so transpilePackages ensures Next.js processes it but doesn't enable source-level HMR"
    alternatives:
      - "Only run dev:sdk watch mode (no transpilePackages)"
      - "Wait for Phase 4 Turbo integration"
    outcome: "Documented limitation; Phase 4 will integrate dev:sdk into Turbo pipeline"
metrics:
  duration_seconds: 257
  tasks_completed: 1
  files_modified: 2
  commits: 1
  completed_at: "2026-02-17T01:31:36Z"
---

# Phase 2 Plan 1: Add Workspace Packages to transpilePackages Summary

**One-liner:** Added @tambo-ai/react to transpilePackages for showcase and docs Next.js apps, completing workspace package configuration for HMR support

## What Was Built

Updated Next.js configuration files for showcase and docs applications to include `@tambo-ai/react` in their `transpilePackages` arrays. This ensures Next.js properly processes workspace packages for hot module replacement.

### Configuration Changes

**showcase/next.config.ts:**

- Added `@tambo-ai/react` to transpilePackages array
- Now includes: `["@tambo-ai/react", "@tambo-ai/ui-registry"]`

**docs/next.config.mjs:**

- Added `@tambo-ai/react` to transpilePackages array
- Now includes: `["@tambo-ai/react", "@tambo-ai/ui-registry"]`

### Workspace Package Coverage

All three Next.js apps now list every workspace dependency in transpilePackages:

1. **apps/web** (from Phase 1): `@tambo-ai/ui-registry`, `@tambo-ai-cloud/core`, `@tambo-ai-cloud/db`, `@tambo-ai-cloud/backend`
2. **showcase**: `@tambo-ai/react`, `@tambo-ai/ui-registry`
3. **docs**: `@tambo-ai/react`, `@tambo-ai/ui-registry`

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

### react-sdk HMR Limitation (Documented)

**Decision:** Added `@tambo-ai/react` to transpilePackages with documented limitation that true source-level HMR requires running `npm run dev:sdk` (tsc watch mode) in parallel.

**Context:** react-sdk exports compiled JavaScript (esm/index.js, dist/index.js) rather than source TypeScript. This is by design as the package is published to npm.

**Impact:**

- transpilePackages ensures Next.js processes react-sdk correctly
- Editing react-sdk source files requires dev:sdk watch mode for immediate HMR
- Phase 4 (TURBO-01) will integrate dev:sdk into unified Turbo dev pipeline

**Why This Approach:**

- Maintains npm package compatibility (compiled outputs)
- Provides correct Next.js processing via transpilePackages
- Defers workflow integration to dedicated Phase 4 task

## Requirements Satisfied

- **NEXT-01:** ✅ All workspace packages consumed by Next.js apps are listed in transpilePackages
- **NEXT-02:** ✅ react-sdk added to transpilePackages; source-level HMR limitation documented (Phase 4 scope)
- **NEXT-03:** ✅ packages/core HMR confirmed working from Phase 1 (exports source TypeScript)

## Verification Results

All verification steps passed:

1. ✅ `grep "transpilePackages" showcase/next.config.ts` - Shows `@tambo-ai/react` and `@tambo-ai/ui-registry`
2. ✅ `grep "transpilePackages" docs/next.config.mjs` - Shows `@tambo-ai/react` and `@tambo-ai/ui-registry`
3. ✅ `npm run check-types` - All packages pass type checking
4. ✅ `npm run lint` - All packages pass linting (warnings are pre-existing)

## Task Breakdown

| Task | Description                                 | Status      | Commit    | Files                                         |
| ---- | ------------------------------------------- | ----------- | --------- | --------------------------------------------- |
| 1    | Add workspace packages to transpilePackages | ✅ Complete | 8ee46bdec | showcase/next.config.ts, docs/next.config.mjs |

## Commits

- **8ee46bdec**: feat(02-01): add @tambo-ai/react to transpilePackages for showcase and docs

## Technical Notes

### Package Dependency Scope

Only workspace packages actually consumed by each app were added:

- **showcase & docs** depend on: `@tambo-ai/react`, `@tambo-ai/ui-registry`
- **showcase & docs** do NOT depend on: `@tambo-ai-cloud/*` packages (Cloud-specific)
- **apps/web** (Cloud dashboard) depends on: Cloud packages + ui-registry

### HMR Behavior by Package Type

1. **packages/core** (exports TypeScript source via ./src/index.ts):
   - transpilePackages enables true source-level HMR
   - Editing source files triggers immediate reload in apps/web

2. **react-sdk** (exports compiled JS via ./esm/index.js, ./dist/index.js):
   - transpilePackages ensures correct Next.js processing
   - Source-level HMR requires `npm run dev:sdk` watch mode
   - Phase 4 will integrate into Turbo dev pipeline

3. **ui-registry** (template files, no build):
   - transpilePackages processes template exports
   - Direct file edits trigger HMR via Next.js

## Self-Check: PASSED

All modified files exist and all commits are present:

```bash
# Files exist
✅ FOUND: showcase/next.config.ts
✅ FOUND: docs/next.config.mjs

# Commits exist
✅ FOUND: 8ee46bdec
```

## Next Steps

Phase 2 Plan 1 complete. Ready for Phase 2 Plan 2 (if any) or Phase 3.

For immediate use:

- Developers editing packages/core in apps/web will see instant HMR
- Developers editing react-sdk source should run `npm run dev:sdk` alongside Next.js dev server
- Phase 4 will unify this into single `turbo dev` command
