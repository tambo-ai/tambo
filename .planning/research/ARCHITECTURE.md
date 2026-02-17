# Hot Reload Architecture for Turborepo Monorepo

**Research Type**: Project Research — Architecture dimension for monorepo hot reload DX
**Date**: 2026-02-16
**Status**: Complete

## Executive Summary

Hot reload in a Turborepo monorepo with TypeScript packages consumed by Next.js and NestJS requires coordinating multiple systems: file watchers, transpilers, bundlers, and HMR servers. This document defines the architectural components, data flow, and integration points for implementing hot reload that works across package boundaries.

**Key Insight**: The challenge is not reloading individual apps (Next.js and NestJS handle that), but propagating dependency package changes to trigger consumer reloads.

## Component Architecture

### 1. File Watcher Layer

**Purpose**: Detect source file changes in dependency packages
**Scope**: Watches `packages/*/src/**` directories (core, db, backend, react-sdk)

**Components**:
- **Primary**: `tsc --watch` (built-in TypeScript compiler watcher)
- **Alternative**: `chokidar` (Node.js file watcher library)
- **Turborepo**: Orchestrates watchers via `turbo dev` task pipeline

**Boundaries**:
- INPUT: File system events (create, modify, delete)
- OUTPUT: Change events → Transpiler Layer

**Implementation Notes**:
- Each package runs its own watcher instance
- Turborepo `dev` task with `persistent: true` keeps watchers alive
- Watch mode must respect `turbo.json` dependency graph (`^build` ensures deps build first)

### 2. Transpiler Layer

**Purpose**: Convert TypeScript source to JavaScript in watch mode
**Scope**: Individual package builds (core, db, backend, react-sdk)

**Components**:
- **tsc --watch**: Incremental TypeScript compilation
  - Watches source, outputs to `dist/` (CJS) and `esm/` (ESM)
  - Uses `.tsbuildinfo` for incremental rebuilds
  - Fast: only recompiles changed files + dependents
- **Alternative**: `tsx watch` or `tsup --watch` (faster, but requires config changes)

**Boundaries**:
- INPUT: File change events from File Watcher Layer
- OUTPUT: Updated JS files in `dist/` or `esm/` → Invalidation Layer

**Data Flow**:
```
packages/core/src/utils.ts (change)
  ↓ (File Watcher detects)
  ↓ (tsc --watch recompiles)
  ↓
packages/core/dist/utils.js (updated)
```

**Implementation Notes**:
- Must output to predictable locations (`dist/`, `esm/`)
- Preserve source maps for debugging
- Handle both CJS and ESM outputs for broad compatibility
- Incremental builds critical for performance (300ms vs 5s full rebuild)

### 3. Invalidation Layer

**Purpose**: Notify consumers that dependencies changed
**Scope**: Bridge between package builds and app reloaders

**Approaches** (ordered by complexity):

#### A. Source Resolution (Simplest)
**How**: Apps import directly from `packages/*/src/` instead of built `dist/`

**Pros**:
- No invalidation needed—bundler sees source changes directly
- Next.js `transpilePackages` handles this automatically
- NestJS can use `ts-node` or `tsx` to run source directly

**Cons**:
- Requires apps to transpile dependencies (slower initial load)
- Doesn't test the actual build output (dev ≠ prod)
- NestJS doesn't natively support `transpilePackages`

**Components**:
- Next.js: `next.config.js` → `transpilePackages: ['@tambo-ai/core', ...]`
- NestJS: `tsconfig.json` → path aliases to `packages/*/src/index.ts`

**Boundaries**:
- INPUT: Direct file system access to `src/`
- OUTPUT: Bundler (Next.js/NestJS) handles transpilation + HMR

#### B. Watch + Rebuild (Current Standard)
**How**: Watch mode rebuilds packages, apps detect `dist/` changes and reload

**Pros**:
- Tests actual build output (dev matches prod)
- Standard approach for Turborepo monorepos
- Works with any consumer (Next.js, NestJS, CLI tools)

**Cons**:
- Requires all packages in watch mode simultaneously
- Apps must detect `node_modules` changes (Next.js does by default, NestJS needs help)
- Slightly slower than source resolution (rebuild + reload vs just reload)

**Components**:
- Turborepo: `turbo dev` runs `dev` task for all packages in parallel
- Next.js: Auto-detects `node_modules` changes (workspace symlinks)
- NestJS: Needs custom invalidation (see Component 4)

**Boundaries**:
- INPUT: `dist/` file modifications (from Transpiler Layer)
- OUTPUT: Cache invalidation → HMR Server Layer

**Data Flow**:
```
packages/core/dist/utils.js (updated)
  ↓ (File watcher in app detects node_modules change)
  ↓ (Invalidate module cache)
  ↓
apps/web or apps/api (reload)
```

#### C. Bundler Integration (Most Complex)
**How**: Custom bundler plugin watches dependencies and triggers HMR directly

**Pros**:
- Fastest feedback loop
- Fine-grained control over invalidation
- Can optimize based on import graph

**Cons**:
- Requires custom webpack/esbuild plugin
- Complex to implement and maintain
- Turborepo ecosystem doesn't have standard solution

**Components**:
- Custom webpack plugin for Next.js
- Custom plugin for NestJS (webpack or esbuild)
- Inter-process communication (IPC) between watchers and apps

**Boundaries**:
- INPUT: Custom protocol from package watchers
- OUTPUT: Direct module invalidation in bundler

**Implementation Notes**: Not recommended for this project—complexity exceeds value.

### 4. HMR Server Layer

**Purpose**: Apply changes to running apps without full restart
**Scope**: Next.js app (web), NestJS app (api)

**Components**:

#### Next.js (apps/web)
- **Built-in HMR**: Webpack HMR server on port 8260
- **Capabilities**:
  - Hot Module Replacement for React components
  - Fast Refresh (preserves component state)
  - Auto-detects workspace package changes via symlinks
- **Limitations**:
  - Server-side code (API routes, Server Components) requires full reload
  - Changes to `next.config.js` require restart

#### NestJS (apps/api)
- **No Built-in HMR**: Express doesn't support HMR natively
- **Options**:
  1. **nodemon**: Restart on file changes (simple, works with any changes)
  2. **webpack HMR**: Requires webpack bundling (complex, not standard for NestJS)
  3. **Custom watcher**: Detect dependency changes, restart process

**Recommended for NestJS**: `nodemon` watching both `apps/api/src` and `packages/*/dist`

**Boundaries**:
- INPUT: Invalidation events (from Invalidation Layer)
- OUTPUT: Updated browser/server state (reload or HMR)

**Data Flow (Next.js)**:
```
packages/core/dist/utils.js (updated)
  ↓ (Next.js detects node_modules change)
  ↓ (Webpack invalidates module)
  ↓ (HMR protocol sends update to browser)
  ↓
Browser (hot reload without full refresh)
```

**Data Flow (NestJS)**:
```
packages/db/dist/operations/index.js (updated)
  ↓ (nodemon detects dist/ change)
  ↓ (Process restart)
  ↓
Server (running with new code, ~1-2s downtime)
```

### 5. Orchestration Layer (Turborepo)

**Purpose**: Coordinate all watchers and dev servers
**Scope**: Root-level task execution

**Components**:
- **turbo.json**: Task pipeline configuration
- **turbo dev**: Parallel task runner with persistent processes
- **Task graph**: Ensures `^build` dependencies complete before `dev` starts

**Current Configuration** (from project context):
```json
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

**Problem**: `dependsOn: ["^build"]` runs full build once, then `dev` starts. Package watchers run in `dev` task but don't rebuild on first change—they skip because build already happened.

**Solution**: Make `dev` task for packages run `tsc --watch` directly (no dependency on `build`).

**Boundaries**:
- INPUT: `turbo dev` command
- OUTPUT: Spawns all watchers + dev servers in parallel

## Data Flow: End-to-End

### Scenario: User edits `packages/core/src/utils.ts`

```
1. FILE WATCHER LAYER
   packages/core/src/utils.ts (saved)
     ↓ (chokidar or tsc --watch detects change)

2. TRANSPILER LAYER
   tsc --watch
     ↓ (incremental recompile)
   packages/core/dist/utils.js (updated, ~300ms)
   packages/core/esm/utils.js (updated)

3. INVALIDATION LAYER
   [Approach B: Watch + Rebuild]

   Path A: Next.js Consumer
   packages/core/dist/utils.js
     ↓ (Next.js webpack watcher detects node_modules change via symlink)

   Path B: NestJS Consumer
   packages/core/dist/utils.js
     ↓ (nodemon watcher detects dist/ change)

4. HMR SERVER LAYER
   Path A: Next.js
     ↓ (Webpack invalidates module cache)
     ↓ (HMR protocol)
   Browser: Hot reload (~500ms total)

   Path B: NestJS
     ↓ (nodemon restarts process)
   Server: New code loaded (~1-2s total)

5. DEVELOPER SEES
   - Browser updates (if React component)
   - API responds with new logic (if backend code)
   - Total time: ~1-2s from save to seeing change
```

## Architectural Approaches: Comparison

| Approach | Complexity | Speed | Prod Parity | Next.js Support | NestJS Support |
|----------|-----------|-------|-------------|----------------|----------------|
| **Source Resolution** | Low | Fastest (~200ms) | ❌ Dev transpiles, prod uses built | ✅ `transpilePackages` | ⚠️ Requires ts-node |
| **Watch + Rebuild** | Medium | Fast (~1-2s) | ✅ Both use dist/ | ✅ Auto-detects | ✅ Via nodemon |
| **Bundler Integration** | High | Fastest (~200ms) | ✅ | ⚠️ Custom plugin | ⚠️ Custom plugin |

**Recommendation**: **Watch + Rebuild (Approach B)**
- Best balance of simplicity, performance, and prod parity
- Standard pattern in Turborepo community
- Works reliably with both Next.js and NestJS
- Turborepo natively supports this workflow

## Component Dependencies & Build Order

### Phase 1: Package Watch Mode (Foundation)
**Goal**: Get packages rebuilding on change
**Components**: File Watcher Layer + Transpiler Layer

**Implementation Order**:
1. Update package `dev` scripts to `tsc --watch` (parallel builds)
2. Update `turbo.json` to remove `^build` dependency from `dev` (or add separate `watch` task)
3. Test: `turbo dev -F @tambo-ai/core` → edit file → see `dist/` update

**Dependencies**: None (foundational layer)

### Phase 2: Next.js Integration
**Goal**: Get Next.js app reloading on package changes
**Components**: Invalidation Layer (Next.js) + HMR Server Layer (Next.js)

**Implementation Order**:
1. Verify `next.config.js` doesn't disable webpack watching
2. Test: `turbo dev -F apps/web` (includes package watchers via Turborepo)
3. Edit `packages/core/src/utils.ts` → verify browser updates

**Dependencies**: Phase 1 (needs package watch mode working)

**Notes**:
- Next.js already supports this via workspace symlinks
- Should work out-of-box once package watchers run
- If not working, check `next.config.js` → `webpack.watchOptions`

### Phase 3: NestJS Integration
**Goal**: Get NestJS app restarting on package changes
**Components**: Invalidation Layer (NestJS) + HMR Server Layer (NestJS)

**Implementation Order**:
1. Add `nodemon` to `apps/api` devDependencies
2. Create `nodemon.json` config to watch both `src/` and `../../packages/*/dist/`
3. Update `apps/api` dev script to use nodemon
4. Test: `turbo dev -F apps/api` → edit package → verify server restarts

**Dependencies**: Phase 1 (needs package watch mode working)

**Config Example** (`apps/api/nodemon.json`):
```json
{
  "watch": [
    "src",
    "../../packages/core/dist",
    "../../packages/db/dist",
    "../../packages/backend/dist"
  ],
  "ext": "js,json",
  "exec": "node dist/main.js"
}
```

### Phase 4: Orchestration Refinement
**Goal**: Optimize Turborepo task pipeline
**Components**: Orchestration Layer

**Implementation Order**:
1. Test `turbo dev` (no filter) → all packages + apps in watch mode
2. Test `turbo dev -F apps/web` → only web + its dependencies
3. Optimize `turbo.json` caching (disable for `dev` task)
4. Add `persistent: true` to prevent Turbo from killing long-running tasks

**Dependencies**: Phases 1-3 (all components working individually)

## Integration Points

### Turborepo ↔ Package Watchers
- **Protocol**: Task execution (spawns `tsc --watch` as child process)
- **Configuration**: `turbo.json` → `dev` task with `persistent: true`
- **Data**: Task graph determines which packages to watch

### Package Watchers ↔ Next.js
- **Protocol**: File system (Next.js webpack watches `node_modules/`)
- **Configuration**: Workspace symlinks (`node_modules/@tambo-ai/core` → `packages/core`)
- **Data**: Webpack detects `dist/` modifications, invalidates module cache

### Package Watchers ↔ NestJS
- **Protocol**: File system (nodemon watches `packages/*/dist/`)
- **Configuration**: `nodemon.json` → watch paths
- **Data**: nodemon detects file changes, restarts process

### Next.js Webpack ↔ Browser
- **Protocol**: WebSocket (HMR protocol)
- **Configuration**: Built-in Next.js dev server
- **Data**: Module updates, component patches

## Performance Characteristics

### Incremental Build Times (tsc --watch)
- **First build**: 5-10s (full compile)
- **Subsequent changes**: 300-500ms (incremental)
- **Scales**: O(changed files + dependents), not O(all files)

### Propagation Times (total latency)
- **Next.js HMR**: 1-2s (rebuild + invalidation + HMR)
- **NestJS restart**: 2-3s (rebuild + detect + restart)
- **Theoretical minimum**: ~500ms (if using source resolution)

### Bottlenecks
1. **TypeScript compilation**: Unavoidable, but incremental builds help
2. **NestJS restart**: Process spawn overhead (~1s)
3. **Multiple consumers**: Each app watches independently (no deduplication)

### Optimizations
- Use `.tsbuildinfo` for incremental compilation
- Enable webpack persistent caching in Next.js
- Consider `swc` instead of `tsc` for 10x faster transpilation (breaking change)
- Run only needed packages with `turbo dev -F <app>` (filters dependencies)

## Risk Assessment

### Technical Risks
1. **Symlink issues**: Windows/Linux differences in workspace symlinks
   - **Mitigation**: Test on multiple platforms, use `workspace:*` protocol
2. **Watch mode instability**: File watcher resource exhaustion on large repos
   - **Mitigation**: Use `tsc --watch` (built-in), not custom watchers
3. **Cache invalidation bugs**: Stale imports after package changes
   - **Mitigation**: Test thoroughly, document clearing steps (`rm -rf .next`)

### Operational Risks
1. **Developer confusion**: Multiple terminals vs single `turbo dev`
   - **Mitigation**: Document preferred workflow, provide `npm run dev:cloud` script
2. **Performance degradation**: Watching too many files
   - **Mitigation**: Use `turbo dev -F` to filter, exclude `dist/` from watchers
3. **Debugging difficulty**: HMR hides errors, hard to trace package boundaries
   - **Mitigation**: Preserve source maps, log rebuild events, provide `--inspect` flag

## Recommended Implementation Path

### Start Here (Phase 1)
- Modify `packages/core/package.json` → `dev: "tsc --watch"`
- Test: `npm run dev -w packages/core` → edit file → verify `dist/` updates
- Repeat for `packages/db`, `packages/backend`

### Then (Phase 2)
- Run `turbo dev -F apps/web` (includes package watchers via dependency graph)
- Edit `packages/core/src/utils.ts`
- Verify browser hot reloads (~1-2s)

### Then (Phase 3)
- Add `nodemon` to `apps/api`
- Configure watching `packages/*/dist/`
- Test similar to Phase 2, verify server restarts

### Finally (Phase 4)
- Optimize `turbo.json` (remove `^build` from `dev`, add `persistent: true`)
- Create convenience scripts (`npm run dev:cloud`, `npm run dev:sdk`)
- Document in README/CONTRIBUTING

## Open Questions

1. **Should `dev` task depend on `^build`?**
   - Current: Yes (builds once, then watches)
   - Proposed: No (watch from start, skip initial build)
   - **Answer needed before Phase 1**

2. **Should we use source resolution for faster feedback?**
   - Pro: ~500ms faster (no rebuild step)
   - Con: Dev ≠ prod (testing source, not built output)
   - **Recommend**: No (prod parity more valuable)

3. **Should NestJS use webpack HMR instead of nodemon?**
   - Pro: Faster restarts, true HMR
   - Con: Complex setup, not standard NestJS pattern
   - **Recommend**: No (nodemon is simpler, 2s restart acceptable)

## References

- [Turborepo Docs: Development Tasks](https://turbo.build/repo/docs/crafting-your-repository/running-tasks#running-development-tasks)
- [Next.js Docs: Turbo Mode](https://nextjs.org/docs/architecture/turbopack)
- [TypeScript Docs: Watch Mode](https://www.typescriptlang.org/docs/handbook/configuring-watch.html)
- [NestJS Docs: Hot Reload (webpack)](https://docs.nestjs.com/recipes/hot-reload)
- [nodemon Docs](https://nodemon.io/)

## Conclusion

**Hot reload in this monorepo requires coordinating 5 layers**: File Watcher → Transpiler → Invalidation → HMR Server → Orchestration.

**Recommended architecture**: Watch + Rebuild (Approach B)
- Each package runs `tsc --watch` to rebuild on change
- Next.js auto-detects rebuilt `dist/` files via workspace symlinks
- NestJS uses `nodemon` to watch `dist/` and restart
- Turborepo orchestrates all watchers via `turbo dev`

**Implementation order**: Phase 1 (package watchers) → Phase 2 (Next.js) → Phase 3 (NestJS) → Phase 4 (optimization)

**Expected outcome**: 1-2s feedback loop from source edit to seeing changes in browser/server.
