---
phase: 01-foundation-setup
plan: 01
subsystem: build-config
tags:
  - webpack
  - transpilePackages
  - declarationMap
  - hot-reload
dependency-graph:
  requires: []
  provides:
    - webpack-mode-for-all-apps
    - transpilePackages-cloud-packages
    - declarationMap-enabled
  affects:
    - apps/web
    - docs
    - packages/core
    - packages/db
    - packages/backend
tech-stack:
  added: []
  patterns:
    - Next.js transpilePackages for monorepo hot reload
    - TypeScript declarationMap for IDE source navigation
key-files:
  created: []
  modified:
    - apps/web/next.config.mjs
    - docs/package.json
decisions:
  - id: transpile-cloud-packages
    what: Added @tambo-ai-cloud/core, db, and backend to transpilePackages
    why: Enable webpack hot module replacement for internal packages
    alternatives: []
  - id: remove-turbo-flag-docs
    what: Removed --turbo flag from docs dev script
    why: Turbopack ignores transpilePackages for inter-package dependencies
    alternatives: []
metrics:
  duration: 189
  completed: 2026-02-17T01:14:26Z
  tasks-completed: 2
  files-changed: 2
  tests-added: 0
  deviations: 0
---

# Phase 1 Plan 1: Monorepo Foundation Configuration

**One-liner:** Configured Next.js apps to use webpack mode with transpilePackages for internal cloud packages, verified TypeScript declarationMap inheritance for IDE source navigation.

## What Was Built

This plan established the foundational build configuration needed for hot reload in the monorepo:

1. **Next.js Webpack Mode**: Removed Turbopack flag from docs and ensured all apps use webpack mode, which properly respects transpilePackages for monorepo dependencies.

2. **TranspilePackages Configuration**: Added @tambo-ai-cloud/core, @tambo-ai-cloud/db, and @tambo-ai-cloud/backend to apps/web transpilePackages array, enabling hot module replacement when editing these packages.

3. **TypeScript Declaration Maps**: Verified all internal packages inherit declarationMap: true from base config, enabling IDE go-to-definition to navigate to source .ts files instead of compiled .d.ts files.

4. **Build Ordering**: Confirmed turbo.json dev task has dependsOn: ["^build"], ensuring dependencies are built before dev servers start.

## Tasks Completed

| Task                                                            | Status      | Commit    | Files Changed                               |
| --------------------------------------------------------------- | ----------- | --------- | ------------------------------------------- |
| 1. Add cloud packages to transpilePackages and remove Turbopack | ✅ Complete | 5d1f334ae | apps/web/next.config.mjs, docs/package.json |
| 2. Verify declarationMap and build ordering                     | ✅ Verified | 851cda7f3 | (verification only)                         |

## Verification Results

All verification steps passed:

- ✅ `grep -c "tambo-ai-cloud" apps/web/next.config.mjs` returns 3
- ✅ docs/package.json dev script has no --turbo flag
- ✅ `npm run check-types` passes (18 packages)
- ✅ `npm run lint` passes (17 packages, warnings only)
- ✅ `npm test` passes (all test suites)
- ✅ base.json has declarationMap: true
- ✅ No package overrides declarationMap to false
- ✅ turbo.json dev task has dependsOn: ["^build"]

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Details

### TranspilePackages Configuration

Added to apps/web/next.config.mjs:

```javascript
transpilePackages: [
  "@tambo-ai/ui-registry",
  "@tambo-ai-cloud/core",
  "@tambo-ai-cloud/db",
  "@tambo-ai-cloud/backend",
];
```

This tells Next.js to transpile these packages from source, enabling HMR when their code changes.

### Webpack Mode Requirement

Removed `--turbo` flag from docs dev script because:

- Turbopack ignores transpilePackages for inter-package dependencies
- Webpack mode is required for monorepo hot reload to work correctly
- This aligns with apps/web and showcase which already use webpack mode

### DeclarationMap Inheritance

All internal packages (core, db, backend) extend from `@tambo-ai/typescript-config/base.json` which defines:

```json
{
  "declaration": true,
  "declarationMap": true
}
```

No packages override these settings, so IDE go-to-definition will navigate to source files.

## Impact

This plan unblocks Phase 2 (Next.js HMR verification) and Phase 3 (NestJS restart testing) by ensuring:

1. All Next.js apps use webpack mode (not Turbopack)
2. Internal cloud packages are configured for transpilation
3. TypeScript declaration maps are enabled for development
4. Build ordering is correct in Turborepo

## Next Steps

Ready for Phase 1 Plan 2: Next.js hot reload verification and optimization.

## Self-Check: PASSED

**Commits verified:**

- ✅ 5d1f334ae exists: `git log --oneline --all | grep -q "5d1f334ae"`
- ✅ 851cda7f3 exists: `git log --oneline --all | grep -q "851cda7f3"`

**Files verified:**

- ✅ apps/web/next.config.mjs contains all 3 cloud packages in transpilePackages
- ✅ docs/package.json dev script has no --turbo flag
- ✅ All quality checks pass
