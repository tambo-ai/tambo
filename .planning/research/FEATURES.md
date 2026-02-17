# FEATURES.md

## Monorepo Hot Reload DX Features

**Research Goal**: Identify table stakes vs. differentiating DX features for hot reloading local packages in TypeScript monorepos.

**Context**: Tambo AI uses Turborepo + npm workspaces + tsc builds. Next.js 15 (apps/web, showcase, docs) and NestJS (apps/api) consume internal packages. Current pain: manual rebuilds when editing packages like `@tambo-ai/core`, `@tambo-ai/backend`, or `@tambo-ai/react`.

**Date**: 2026-02-16

---

## Table Stakes Features

These are **must-have** capabilities. Every well-configured monorepo provides these or developers abandon the tooling.

### 1. Dependency-Aware Watch Mode

**Description**: When a source file changes in a dependency package, automatically rebuild that package AND restart/reload consuming apps.

**Why Table Stakes**: Without this, developers must manually rebuild packages after every change. This breaks flow state and makes monorepo DX worse than separate repos.

**Current State of Art**:
- `turbo watch` in Turborepo 2.0+ provides this natively
- Follows task graph from `turbo.json` to determine rebuild order
- Watches all packages in dependency tree automatically

**Complexity**: Low (Turborepo provides this out-of-box)

**Implementation Pattern**:
```json
// turbo.json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**References**:
- [Turborepo Watch Mode](https://turborepo.dev/docs/reference/watch)
- [Developing Applications](https://turborepo.dev/docs/crafting-your-repository/developing-applications)

---

### 2. TypeScript Project References

**Description**: Configure TypeScript to understand package dependencies and enable incremental compilation with `tsc --build --watch`.

**Why Table Stakes**: Without this, TypeScript type-checks entire monorepo on every change. Project references enable:
- Faster incremental builds (only rebuild changed packages)
- Proper type checking across package boundaries
- IDE "Go to Definition" navigates to source, not `.d.ts`

**Current State of Art**:
- Standard TypeScript feature since TS 3.0
- Combined with npm workspaces for optimal DX
- Recommended by Nx, Turborepo, and modern monorepo guides

**Complexity**: Medium (requires `tsconfig.json` configuration across all packages)

**Implementation Pattern**:
```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}

// apps/web/tsconfig.json
{
  "references": [
    { "path": "../../packages/core" },
    { "path": "../../packages/db" }
  ]
}
```

**References**:
- [How to Configure TypeScript Project References](https://oneuptime.com/blog/post/2026-01-24-typescript-project-references/view)
- [Managing TypeScript Packages in Monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos)

---

### 3. Next.js transpilePackages for Hot Reload

**Description**: Configure Next.js to directly transpile and hot-reload local workspace packages without intermediate build step.

**Why Table Stakes**: Next.js doesn't natively watch `node_modules`. Without `transpilePackages`, changes to local packages require manual rebuilds and full page refreshes.

**Current State of Art**:
- Native `transpilePackages` option since Next.js 13.1
- Replaces older `next-transpile-modules` package
- Works with npm/yarn/pnpm workspaces

**Complexity**: Low (single config option)

**Known Issues** (as of 2026):
- Turbopack doesn't respect `transpilePackages` in monorepos ([Issue #85316](https://github.com/vercel/next.js/issues/85316))
- Some Yarn workspace setups don't trigger hot reload ([Issue #62468](https://github.com/vercel/next.js/issues/62468))

**Implementation Pattern**:
```javascript
// next.config.js
module.exports = {
  transpilePackages: [
    '@tambo-ai/core',
    '@tambo-ai/backend',
    '@tambo-ai/react'
  ]
}
```

**References**:
- [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Next.js Package Bundling Guide](https://nextjs.org/docs/pages/guides/package-bundling)

---

### 4. Source Maps for Debugging

**Description**: Generate source maps in package builds so debuggers (VSCode, Chrome DevTools) show original TypeScript source, not compiled JavaScript.

**Why Table Stakes**: Without source maps, developers debug transpiled code. Breakpoints fail or hit wrong lines. Makes debugging local packages nearly impossible.

**Current State of Art**:
- TypeScript generates source maps with `"sourceMap": true`
- VSCode requires `outFiles` configuration in `launch.json`
- Modern bundlers (Vite, esbuild, tsup) generate source maps by default

**Complexity**: Low (enable in tsconfig.json + build tools)

**Known Issues**:
- Monorepo source maps often break due to incorrect paths
- Tools like SWC may not map correctly in workspaces
- Requires proper `sourceRoot` configuration

**Implementation Pattern**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "declarationMap": true
  }
}

// .vscode/launch.json
{
  "configurations": [{
    "type": "node",
    "outFiles": ["${workspaceFolder}/**/*.js"],
    "sourceMaps": true
  }]
}
```

**References**:
- [Debugging TypeScript in VSCode](https://code.visualstudio.com/docs/typescript/typescript-debugging)
- [Monorepo Source Map Debugging](https://github.com/minheq/monorepo-cra-source-map)

---

### 5. Fast Rebuilds (<2s for typical change)

**Description**: Package rebuilds complete in under 2 seconds for typical single-file changes.

**Why Table Stakes**: Slow rebuilds break developer flow. If every change takes 5+ seconds, developers avoid refactoring and lose productivity.

**Current State of Art**:
- Plain `tsc` is often too slow (3-10s for medium packages)
- Modern bundlers (esbuild, SWC, tsup) rebuild in <500ms
- Incremental builds via `tsc --build` improve subsequent rebuilds

**Complexity**: Medium (may require switching from `tsc` to faster bundlers)

**Trade-offs**:
- esbuild/SWC faster but skip type checking
- Must run separate type check step (`tsc --noEmit`)
- May need different build configs for dev vs. production

**Benchmark Targets**:
- Small package (<50 files): <500ms
- Medium package (50-200 files): <2s
- Large package (200+ files): <5s

---

### 6. Clear Error Messages on Build Failure

**Description**: When package build fails, show clear error with:
- Which package failed
- The actual error (TS error, syntax error, etc.)
- File path and line number
- Suggested fix when possible

**Why Table Stakes**: Cryptic errors waste developer time. "Build failed" without context forces manual investigation.

**Current State of Art**:
- Turborepo shows package name + stdout/stderr
- Modern bundlers provide formatted error output
- TypeScript compiler has decent built-in error messages

**Complexity**: Low (mostly about not suppressing tool output)

**Anti-Pattern**: Silent failures or generic "Build failed" messages

---

## Differentiating Features

These are **nice-to-have** capabilities that provide competitive DX advantage but aren't expected everywhere.

### 7. Interruptible Tasks (Kill & Restart on Change)

**Description**: When dependency changes, kill the currently running dev server and restart it immediately rather than waiting for graceful shutdown.

**Why Differentiating**: Most setups wait for graceful shutdown or ignore mid-build changes. Interruptible tasks provide faster feedback for tools that can't hot-reload (e.g., NestJS).

**Current State of Art**:
- Turborepo 2.0+ supports `"interruptible": true` task flag
- Requires explicit opt-in (can break tools expecting clean shutdown)
- Turbowatch provides similar capability for complex scenarios

**Complexity**: Low (Turborepo flag) to Medium (custom implementation)

**Implementation Pattern**:
```json
// turbo.json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "interruptible": true  // <-- Enable kill on change
    }
  }
}
```

**References**:
- [Turborepo Interruptible Tasks](https://turborepo.dev/docs/reference/watch)
- [Interruptible Tasks PR](https://github.com/vercel/turborepo/pull/9228)

---

### 8. Parallel Package Rebuilds

**Description**: When multiple packages change simultaneously, rebuild them in parallel rather than serially.

**Why Differentiating**: Rare for single developer to edit multiple packages at once. More relevant for CI or team environments.

**Current State of Art**:
- Turborepo rebuilds in parallel by default (respects dependency graph)
- `turbo watch` triggers parallel rebuilds for independent packages
- Tools like `tsc --build` can parallelize with `--parallel` flag

**Complexity**: Low (Turborepo handles this)

**Tambo Context**: Less valuable given typical workflow edits one package at a time.

---

### 9. Selective Watch Mode (Only Watch Active Packages)

**Description**: Allow developers to watch only the packages they're actively editing, ignoring others to save system resources.

**Why Differentiating**: Large monorepos (50+ packages) may strain file watcher limits. Most monorepos are small enough that watching everything is fine.

**Current State of Art**:
- `turbo dev -F` already filters to specific packages
- Some tools (e.g., Nx) allow disabling watch for specific packages
- Manual `--filter` flags provide ad-hoc selection

**Complexity**: Low (already exists via Turborepo filters)

**Tambo Context**: Current setup (`turbo dev -F @package`) already provides this.

---

### 10. Visual Progress Indicators

**Description**: Show real-time progress for rebuilds with spinners, progress bars, or status messages in terminal/UI.

**Why Differentiating**: Nice for long builds, but if builds are fast (<2s), progress indicators just add noise.

**Current State of Art**:
- Turborepo UI shows task status with colors/spinners
- Tools like Nx provide fancy terminal UI with timers
- Can be overwhelming in watch mode (constant updates)

**Complexity**: Low to Medium (depends on tool)

**Trade-offs**: Can clutter output; prefer clean logs for watch mode.

---

### 11. Build Caching Across Team Members

**Description**: Share build outputs via remote cache (Vercel, custom S3) so team members skip rebuilds for unchanged packages.

**Why Differentiating**: Primarily CI/onboarding benefit. Local dev already has local cache. Remote cache adds complexity.

**Current State of Art**:
- Turborepo Remote Cache (paid Vercel feature or self-hosted)
- Nx Cloud provides similar capability
- Requires CI/CD integration and network setup

**Complexity**: High (infrastructure required)

**Tambo Context**: More relevant for CI than local hot reload DX.

---

### 12. Automatic Dependency Graph Visualization

**Description**: Generate and display package dependency graph to help developers understand rebuild cascades.

**Why Differentiating**: Useful for debugging but not needed for day-to-day work once dependencies are understood.

**Current State of Art**:
- `turbo graph` generates dependency visualization
- Nx provides interactive graph UI
- VSCode extensions can show workspace structure

**Complexity**: Low (Turborepo provides this)

**Implementation**: `turbo graph --filter=@tambo-ai/react`

---

### 13. Watch Mode for Tests

**Description**: Automatically re-run tests when package source or test files change.

**Why Differentiating**: Standard for application development (Jest watch mode) but less common for library packages in monorepos.

**Current State of Art**:
- Jest/Vitest have built-in watch modes
- Can combine with `turbo watch` for dependency-aware test runs
- Most monorepos don't auto-run tests in watch mode (too slow/noisy)

**Complexity**: Low (built into test runners)

**Trade-offs**: Test runs can slow down feedback loop; better as opt-in.

---

### 14. Multi-Tool Watch Orchestration

**Description**: Coordinate multiple watch processes (e.g., `tsc --watch` + Vite + Storybook + test runner) with shared dependency awareness.

**Why Differentiating**: Most projects need at most 2-3 simultaneous watch processes. Full orchestration adds complexity.

**Current State of Art**:
- Turbowatch designed for complex multi-tool scenarios
- `concurrently` or `npm-run-all` for simple parallel execution
- Most monorepos use simple `turbo dev -F` + multiple terminal tabs

**Complexity**: High (requires tool like Turbowatch)

**Tambo Context**: Current setup is simple enough; not needed yet.

**Reference**: [Turbowatch](https://www.npmjs.com/package/turbowatch)

---

## Anti-Features

These are things we should deliberately **NOT** build or support.

### ❌ Hot Module Replacement for Server-Side Packages

**Why Not**: Node.js packages (`@tambo-ai/core`, `@tambo-ai/backend`) don't support HMR. Attempting to inject HMR adds enormous complexity and still requires server restart for many changes.

**Better Alternative**: Fast rebuilds (<2s) + interruptible tasks (instant restart)

---

### ❌ Automatic Package Version Bumping on Change

**Why Not**: Watch mode should not trigger version bumps. Versions are semantic and require human judgment (patch vs minor vs major).

**Better Alternative**: Manual versioning with changesets or release scripts.

---

### ❌ AI-Powered Change Detection

**Why Not**: File system watchers + dependency graph analysis is sufficient and deterministic. AI adds complexity and unpredictability.

**Better Alternative**: Trust Turborepo's task graph and watch mode.

---

### ❌ Build Output Deduplication Across Packages

**Why Not**: Attempting to dedupe outputs (e.g., sharing node_modules builds) adds complexity and breaks isolated builds. Modern bundlers handle this efficiently.

**Better Alternative**: Let each package build independently; rely on build caching.

---

### ❌ Watch Mode for Database Migrations

**Why Not**: DB migrations are stateful operations that shouldn't run automatically on file changes. Risk of data loss or corruption.

**Better Alternative**: Manual migration commands (`npm run db:migrate -w packages/db`)

---

## Dependencies Between Features

```
TypeScript Project References
  └─> Fast Rebuilds (enables incremental compilation)
  └─> Source Maps (enables declarationMap)

Dependency-Aware Watch
  └─> Fast Rebuilds (required to be tolerable)
  └─> Interruptible Tasks (optional enhancement)

Next.js transpilePackages
  └─> Fast Rebuilds (must rebuild quickly for hot reload)

Source Maps
  └─> Fast Rebuilds (must regenerate maps on rebuild)
```

---

## Complexity Summary

| Feature | Complexity | Priority | Tambo Relevance |
|---------|-----------|----------|-----------------|
| Dependency-Aware Watch | Low | Must Have | High - core pain point |
| TypeScript Project References | Medium | Must Have | High - enables incremental builds |
| Next.js transpilePackages | Low | Must Have | High - Next.js apps need this |
| Source Maps | Low | Must Have | High - debugging is critical |
| Fast Rebuilds | Medium | Must Have | High - current rebuilds too slow |
| Clear Error Messages | Low | Must Have | Medium - already decent |
| Interruptible Tasks | Low | Nice to Have | High - NestJS can't hot reload |
| Parallel Rebuilds | Low | Nice to Have | Medium - Turbo already does this |
| Selective Watch Mode | Low | Nice to Have | Low - already have via `-F` |
| Visual Progress | Low | Nice to Have | Low - prefer clean logs |
| Remote Cache | High | Nice to Have | Low - more relevant for CI |
| Dependency Graph | Low | Nice to Have | Low - debugging aid only |
| Test Watch Mode | Low | Nice to Have | Medium - useful for TDD |
| Multi-Tool Orchestration | High | Nice to Have | Low - overkill for current needs |

---

## Recommended Implementation Order for Tambo

Based on complexity, impact, and current pain points:

1. **TypeScript Project References** - Foundation for everything else
2. **Fast Rebuilds** - Switch packages/core, packages/backend to tsup/unbuild
3. **Next.js transpilePackages** - Enable hot reload for apps/web, showcase, docs
4. **Dependency-Aware Watch** - Configure `turbo watch` for proper cascading
5. **Interruptible Tasks** - Enable for apps/api (NestJS) to restart on changes
6. **Source Maps** - Ensure all build tools generate maps correctly

---

## Research Sources

- [Turborepo Watch Mode](https://turborepo.dev/docs/reference/watch)
- [Developing Applications - Turborepo](https://turborepo.dev/docs/crafting-your-repository/developing-applications)
- [Creating Dependency Aware Dev Pipelines](https://www.luisball.com/blog/turborepo-prepare-tasks)
- [How to Configure TypeScript Project References (2026)](https://oneuptime.com/blog/post/2026-01-24-typescript-project-references/view)
- [Managing TypeScript Packages in Monorepos - Nx](https://nx.dev/blog/managing-ts-packages-in-monorepos)
- [Next.js transpilePackages Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [TypeScript Monorepo with NPM Workspaces](https://yieldcode.blog/post/npm-workspaces/)
- [Complete Monorepo Guide 2025](https://jsdev.space/complete-monorepo-guide/)
- [Debugging TypeScript - VSCode](https://code.visualstudio.com/docs/typescript/typescript-debugging)
- [Add TypeScript Library with tsup](https://egghead.io/lessons/npm-add-a-typescript-library-to-your-monorepo-using-tsup)
- [My Quest for the Perfect TS Monorepo](https://thijs-koerselman.medium.com/my-quest-for-the-perfect-ts-monorepo-62653d3047eb)
- [Turbowatch Documentation](https://www.npmjs.com/package/turbowatch)
- [Turborepo Interruptible Tasks PR](https://github.com/vercel/turborepo/pull/9228)

---

## Quality Gate Checklist

- [x] Categories clearly separated (table stakes vs differentiators vs anti-features)
- [x] Complexity noted for each feature (Low/Medium/High)
- [x] Dependencies between features identified (graph + table)
- [x] Current state of art researched and documented
- [x] Known issues and trade-offs called out
- [x] Tambo-specific relevance assessed
- [x] Implementation patterns provided where applicable
- [x] All sources cited with hyperlinks
