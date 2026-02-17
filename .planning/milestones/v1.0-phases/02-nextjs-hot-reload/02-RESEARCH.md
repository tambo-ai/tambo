# Phase 2: Next.js Hot Reload - Research

**Researched:** 2026-02-16
**Domain:** Next.js webpack transpilePackages configuration for monorepo hot reload
**Confidence:** HIGH

## Summary

Next.js provides native support for transpiling workspace packages via the `transpilePackages` configuration option (introduced in Next.js 13.0.0). This feature replaced the legacy `next-transpile-modules` package and enables monorepo packages to be watched and hot-reloaded during development without requiring manual rebuilds.

The Tambo monorepo already exports raw TypeScript source files from internal packages (`@tambo-ai-cloud/core`, `@tambo-ai-cloud/db`, `@tambo-ai-cloud/backend`) and Phase 1 has configured `transpilePackages` for these three packages in `apps/web/next.config.mjs`. Phase 2 requires adding `@tambo-ai/ui-registry` to this list and verifying that HMR works correctly across the dependency chain.

The key insight is that Next.js's webpack bundler can watch source files directly when packages export TypeScript source, triggering Hot Module Replacement (HMR) within 1-2 seconds of file changes. This approach is now considered best practice for monorepos as of 2026, eliminating the need for pre-building packages and watch mode compilation.

**Primary recommendation:** Add `@tambo-ai/ui-registry` to `transpilePackages` in `apps/web/next.config.mjs` and verify that all workspace package changes trigger HMR without manual intervention.

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                     | Research Support                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEXT-01 | All workspace packages listed in transpilePackages in Next.js config            | Context7 docs show transpilePackages accepts array of package names. Phase 1 added 3 packages; Phase 2 adds ui-registry                               |
| NEXT-02 | Editing a file in react-sdk triggers HMR in apps/web without manual rebuild     | react-sdk exports compiled JS, not source TS. This is by design for npm publishing. Changes require rebuild (covered in Phase 4 via Turbo watch mode) |
| NEXT-03 | Editing a file in packages/core triggers HMR in apps/web without manual rebuild | packages/core exports source TS ("import": "./src/index.ts"). With transpilePackages, webpack watches source files and triggers HMR automatically     |

</phase_requirements>

## Standard Stack

### Core

| Library           | Version                     | Purpose                                | Why Standard                                                           |
| ----------------- | --------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Next.js           | 15.5.11 (currently in repo) | React framework with built-in bundling | Industry standard for React SSR/SSG applications with monorepo support |
| Webpack           | Built into Next.js          | Module bundler                         | Default bundler in Next.js, mature HMR support for monorepos           |
| transpilePackages | Next.js 13.0.0+             | Native workspace transpilation         | Official Next.js feature replacing next-transpile-modules              |

### Supporting

| Library        | Version         | Purpose                           | When to Use                                                                            |
| -------------- | --------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| Turbopack      | Next.js default | Rust-based bundler (experimental) | Future replacement for webpack, but lacks full transpilePackages support as of 2026-02 |
| declarationMap | TypeScript core | Source navigation in IDEs         | Already enabled in base tsconfig; required for go-to-definition to source files        |

### Alternatives Considered

| Instead of        | Could Use                     | Tradeoff                                                                                                                                                   |
| ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| webpack mode      | Turbopack (--turbo flag)      | Turbopack is faster but has known issues with transpilePackages in monorepos. GitHub issue #85316 shows it's less mature. Stay with webpack for stability. |
| transpilePackages | TypeScript project references | Next.js uses SWC compiler, not tsc, making project references incompatible. transpilePackages is the supported approach.                                   |

**Installation:**
No additional packages needed. `transpilePackages` is built into Next.js 13.0.0+.

## Architecture Patterns

### Recommended Package Export Structure

Packages should export raw TypeScript source for optimal hot reload:

```json
{
  "name": "@tambo-ai-cloud/core",
  "type": "module",
  "exports": {
    "import": "./src/index.ts"
  }
}
```

**Current state in repo:**

- `@tambo-ai-cloud/core` - exports `./src/index.ts` ✓
- `@tambo-ai-cloud/db` - exports `./src/index.ts` ✓
- `@tambo-ai-cloud/backend` - exports `./src/index.ts` ✓
- `@tambo-ai/ui-registry` - exports specific paths like `./components/canvas-space/index.tsx` ✓
- `@tambo-ai/react` - exports compiled JS (`./esm/index.js` and `./dist/index.js`) - by design for npm publishing

### Pattern 1: transpilePackages Configuration

**What:** List workspace packages that Next.js should transpile and watch

**When to use:** Any internal workspace package consumed by a Next.js app

**Example:**

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tambo-ai-cloud/core",
    "@tambo-ai-cloud/db",
    "@tambo-ai-cloud/backend",
    "@tambo-ai/ui-registry", // Add in Phase 2
  ],
};

module.exports = nextConfig;
```

### Pattern 2: Webpack Mode Flag

**What:** Explicitly use webpack instead of Turbopack

**When to use:** When transpilePackages must work reliably (current recommendation for monorepos)

**Example:**

```json
// Source: https://nextjs.org/docs/app/api-reference/turbopack
{
  "scripts": {
    "dev": "next dev", // No --turbo flag
    "build": "next build" // No --turbo flag
  }
}
```

**Current state:** Phase 1 already removed `--turbo` from docs dev script. apps/web uses default webpack mode.

### Pattern 3: TypeScript declarationMap for IDE Navigation

**What:** Enable source file navigation from compiled code

**When to use:** Always, for go-to-definition to work in IDEs

**Example:**

```json
// Source: https://www.typescriptlang.org/tsconfig#declarationMap
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Current state:** Already enabled in `packages/typescript-config/base.json`. Phase 1 verified this.

### Anti-Patterns to Avoid

- **Using TypeScript project references with Next.js:** Next.js uses SWC compiler, not tsc. Project references don't work. Source: [Next.js Discussion #50866](https://github.com/vercel/next.js/discussions/50866)

- **Pre-building packages in dev mode:** With transpilePackages, Next.js watches source files directly. No need for separate watch mode compilation (that's Phase 4 for packages not consumed by Next.js).

- **Exporting compiled JS from internal packages:** Defeats the purpose of hot reload. Export raw TypeScript source instead.

- **Using invalid package names:** Turbopack is stricter about package naming. Avoid path-alias syntax like `@/utils`. Use proper scoped names like `@org/package`. Source: [GitHub Issue #85316](https://github.com/vercel/next.js/issues/85316)

## Don't Hand-Roll

| Problem                     | Don't Build                        | Use Instead          | Why                                                                                                |
| --------------------------- | ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| Watching workspace packages | Custom file watchers with chokidar | transpilePackages    | Next.js webpack bundler already has robust file watching. Custom watchers add complexity and bugs. |
| Package transpilation       | Custom babel/swc configs           | transpilePackages    | Next.js bundles packages automatically. Manual transpilation creates duplicate work.               |
| Hot reload logic            | Custom websocket/HMR server        | Next.js built-in HMR | Webpack HMR is battle-tested with edge case handling. Custom implementations miss corner cases.    |

**Key insight:** Next.js's webpack bundler with transpilePackages is a mature, complete solution. Don't try to replicate its functionality.

## Common Pitfalls

### Pitfall 1: Hot Reload Not Triggering

**What goes wrong:** Changes in workspace packages don't trigger HMR in the Next.js app.

**Why it happens:** Package not listed in transpilePackages, or package exports compiled JS instead of source TypeScript.

**How to avoid:**

1. Add all internal packages to transpilePackages
2. Verify packages export source TS: `"exports": { "import": "./src/index.ts" }`
3. Check that webpack mode is used (not Turbopack)

**Warning signs:**

- Manual rebuild required after package changes
- HMR works for app code but not package code
- "Cannot find module" errors in browser console

**Source:** [GitHub Issue #62468](https://github.com/vercel/next.js/issues/62468)

### Pitfall 2: Turbopack Doesn't Respect transpilePackages

**What goes wrong:** Switching from webpack to Turbopack breaks hot reload for workspace packages.

**Why it happens:** Turbopack doesn't fully support transpilePackages for monorepos as of 2026-02. This is a known limitation.

**How to avoid:**

1. Use webpack mode (don't use `--turbo` flag)
2. If you accidentally enabled Turbopack, remove the flag and restart dev server

**Warning signs:**

- Hot reload worked, then stopped after adding `--turbo`
- Build works but dev mode requires manual rebuilds

**Source:** [GitHub Issue #85316](https://github.com/vercel/next.js/issues/85316)

### Pitfall 3: TypeScript Type Errors from Transpiled Packages

**What goes wrong:** Build fails with type errors from workspace packages, even though types are correct.

**Why it happens:** Next.js checks types using only the main app's tsconfig, not each package's individual configuration.

**How to avoid:**

1. Use a consistent tsconfig across packages (already done via `@tambo-ai/typescript-config`)
2. If packages have different type strictness, create separate tsconfig for build vs development

**Warning signs:**

- Build fails with type errors from node_modules
- Type errors that don't appear in IDE

**Source:** [GitHub Issue #62468](https://github.com/vercel/next.js/issues/62468)

### Pitfall 4: Transitive Dependencies Not Transpiled

**What goes wrong:** Package A imports Package B (both internal), but only Package A is in transpilePackages. Changes to Package B don't trigger HMR.

**Why it happens:** transpilePackages only watches listed packages, not their dependencies.

**How to avoid:**

1. List ALL internal workspace packages in transpilePackages, not just direct dependencies
2. Verify the dependency chain: if app → ui-registry → core, both ui-registry AND core must be listed

**Warning signs:**

- Changes to deeply nested packages don't trigger HMR
- Some packages hot reload, others don't

**Source:** [GitHub Discussion #42136](https://github.com/vercel/next.js/discussions/42136)

## Code Examples

Verified patterns from official sources:

### Basic transpilePackages Configuration

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tambo-ai-cloud/core",
    "@tambo-ai-cloud/db",
    "@tambo-ai-cloud/backend",
    "@tambo-ai/ui-registry",
  ],
};

module.exports = nextConfig;
```

### Force Webpack Mode

```bash
# Source: https://nextjs.org/docs/app/api-reference/turbopack
# In package.json:
{
  "scripts": {
    "dev": "next dev -p 8260"  # No --turbo flag
  }
}
```

### Package Exports for Source TypeScript

```json
// Source: Best practice from monorepo community, 2026
{
  "name": "@tambo-ai-cloud/core",
  "type": "module",
  "exports": {
    "import": "./src/index.ts"
  },
  "main": "./src/index.ts"
}
```

## State of the Art

| Old Approach                       | Current Approach                             | When Changed                    | Impact                                                          |
| ---------------------------------- | -------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| next-transpile-modules package     | Built-in transpilePackages                   | Next.js 13.0.0 (Oct 2022)       | Eliminates external dependency, better integration with webpack |
| Pre-build packages with watch mode | Export raw TypeScript, let Next.js transpile | ~2024-2025 community shift      | Faster hot reload, simpler workflow, fewer moving parts         |
| TypeScript project references      | transpilePackages with source exports        | Ongoing (incompatible with SWC) | Project references don't work with Next.js's SWC compiler       |
| Turbopack with --turbo flag        | Webpack mode for monorepos                   | Current (2026-02)               | Turbopack lacks stable transpilePackages support                |

**Deprecated/outdated:**

- **next-transpile-modules**: Replaced by native transpilePackages in Next.js 13.0.0. Don't use the npm package.
- **TypeScript project references with Next.js**: Next.js uses SWC, not tsc. References don't work.
- **Pre-building internal packages**: With source exports + transpilePackages, pre-building is unnecessary and slows down development.

## Open Questions

1. **Does react-sdk need transpilePackages?**
   - What we know: react-sdk exports compiled JS (`./esm/index.js`), not source TypeScript
   - What's unclear: Can transpilePackages help with hot reload for compiled packages?
   - Recommendation: No. react-sdk is designed for npm publishing with dual CJS/ESM builds. Changes require rebuild. Phase 4 will handle this with Turbo watch mode, not transpilePackages.

2. **Should we add ALL workspace packages to transpilePackages?**
   - What we know: packages/core, db, backend, ui-registry are consumed by apps/web
   - What's unclear: Are there other internal packages used by apps/web?
   - Recommendation: Only add packages that apps/web imports. Check import statements in apps/web to identify all dependencies.

3. **What's the HMR feedback time target?**
   - What we know: Requirement says "1-2s feedback"
   - What's unclear: Is this realistic for large changes or just small edits?
   - Recommendation: 1-2s is achievable for typical file edits. Large changes (e.g., adding many files) may take longer initially, but incremental changes should be fast.

## Sources

### Primary (HIGH confidence)

- **/vercel/next.js** (Context7) - transpilePackages configuration and webpack mode documentation
- [Next.js transpilePackages Official Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) - Official configuration reference
- [Next.js Turbopack Documentation](https://nextjs.org/docs/app/api-reference/turbopack) - Webpack vs Turbopack guidance
- [Next.js Package Bundling Guide](https://nextjs.org/docs/pages/guides/package-bundling) - Monorepo best practices

### Secondary (MEDIUM confidence)

- [GitHub Issue #85316: Turbopack transpilePackages for monorepos](https://github.com/vercel/next.js/issues/85316) - Known limitation, resolved by proper package naming
- [GitHub Issue #62468: transpilePackages with Yarn Workspaces](https://github.com/vercel/next.js/issues/62468) - Hot reload issues and solutions
- [GitHub Discussion #50866: Next.js TypeScript Monorepo Best Practices](https://github.com/vercel/next.js/discussions/50866) - Community consensus on project references incompatibility
- [Creating a Monorepo with NextJS and Yarn Workspaces](https://radzion.com/blog/monorepo/) - Real-world monorepo patterns
- [GitHub: belgattitude/nextjs-monorepo-example](https://github.com/belgattitude/nextjs-monorepo-example) - Comprehensive monorepo reference
- [GitHub: martpie/monorepo-typescript-next-the-sane-way](https://github.com/martpie/monorepo-typescript-next-the-sane-way) - Simplified monorepo approach

### Tertiary (LOW confidence)

None. All sources verified through official docs or credible GitHub repositories.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - transpilePackages is official Next.js feature, well-documented
- Architecture: HIGH - Context7 and official docs provide clear guidance
- Pitfalls: MEDIUM-HIGH - Derived from GitHub issues and discussions, cross-verified

**Research date:** 2026-02-16
**Valid until:** 30-60 days (Next.js stable, slow-moving feature set)

**Key findings verification:**

- transpilePackages configuration: Verified in Next.js official docs
- Webpack vs Turbopack recommendation: Verified via GitHub issues showing Turbopack limitations
- Source TypeScript export pattern: Verified via community best practices and monorepo examples
- TypeScript project references incompatibility: Verified in official Next.js discussion
