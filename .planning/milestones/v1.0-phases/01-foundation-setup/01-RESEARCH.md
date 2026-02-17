# Phase 1: Foundation Setup - Research

**Researched:** 2026-02-16
**Domain:** Monorepo development tooling (Next.js, TypeScript, Turborepo)
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for hot reload in the Tambo monorepo by addressing three core requirements: bundler choice (webpack vs Turbopack), package.json exports configuration for internal packages, and TypeScript declaration maps for IDE navigation. Research confirms that Turbopack does not respect transpilePackages for monorepo setups with inter-package dependencies, making webpack the clear choice. Internal packages should export TypeScript source files to enable Next.js transpilation. TypeScript declaration maps (declarationMap: true) allow IDE go-to-definition to navigate to source .ts files instead of .d.ts files. Turborepo's dependsOn configuration with ^build ensures initial package builds complete before dev servers start.

**Primary recommendation:** Use webpack mode for Next.js (not Turbopack), configure internal packages to export source via package.json exports field, enable declarationMap in all package tsconfig.json files, and rely on Turborepo's existing dependsOn: ["^build"] to order tasks correctly.

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                 | Research Support                                                                                                  |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| TURBO-03 | Initial package build completes before dev servers start accepting requests | Turborepo's dependsOn: ["^build"] configuration ensures dependency builds complete before dependent tasks run     |
| NEXT-04  | Next.js dev uses webpack mode (not Turbopack) to support transpilePackages  | Turbopack does not respect transpilePackages for monorepo packages with inter-dependencies; webpack mode required |
| DX-02    | Go-to-definition in IDE navigates to source .ts files in workspace packages | TypeScript declarationMap compiler option enables source navigation from .d.ts files                              |

</phase_requirements>

## Standard Stack

### Core

| Library    | Version                    | Purpose                                                 | Why Standard                                                      |
| ---------- | -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| Next.js    | 15.5.11                    | React framework with built-in transpilePackages support | Industry standard for React applications, native monorepo support |
| TypeScript | 5.9.3                      | Type checking and declaration generation                | Required for type-safe monorepo development                       |
| Turborepo  | 2.8.3                      | Monorepo task orchestration and caching                 | De facto standard for TypeScript monorepos                        |
| webpack    | 5.x (bundled with Next.js) | Module bundler for Next.js dev mode                     | Mature monorepo support, respects transpilePackages               |

### Supporting

| Library    | Version | Purpose                           | When to Use                                   |
| ---------- | ------- | --------------------------------- | --------------------------------------------- |
| NestJS CLI | 11.0.16 | NestJS compilation and watch mode | Server-side hot reload via nest start --watch |

### Alternatives Considered

| Instead of     | Could Use                 | Tradeoff                                                                                                                                                                  |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| webpack        | Turbopack                 | Turbopack is faster but does not respect transpilePackages for monorepo packages with inter-dependencies ([Issue #63230](https://github.com/vercel/next.js/issues/63230)) |
| Source exports | Pre-compiled dist exports | Pre-compilation requires rebuild step, defeats instant hot reload goal                                                                                                    |

**Installation:**
No new packages required. All tools already present in the monorepo.

## Architecture Patterns

### Recommended Package Configuration Structure

```
packages/
├── core/
│   ├── src/
│   │   └── index.ts              # Source files
│   ├── package.json              # exports: { ".": { "import": "./src/index.ts" } }
│   └── tsconfig.json             # declarationMap: true
├── db/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── backend/
    ├── src/
    ├── package.json
    └── tsconfig.json
```

### Pattern 1: Package Source Exports

**What:** Internal packages export TypeScript source files directly via package.json exports field
**When to use:** Development-only monorepo packages consumed by apps/web and apps/api
**Example:**

```json
// packages/core/package.json
{
  "name": "@tambo-ai-cloud/core",
  "type": "module",
  "exports": {
    "import": "./src/index.ts"
  },
  "main": "./src/index.ts"
}
```

**Source:** [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) - Custom export conditions pattern

### Pattern 2: TypeScript Declaration Maps

**What:** Enable declarationMap compiler option to create .d.ts.map files alongside .d.ts outputs
**When to use:** All packages that generate declaration files
**Example:**

```json
// packages/core/tsconfig.json
{
  "extends": "@tambo-ai/typescript-config/base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}
```

**Source:** [TypeScript 2.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9) - declarationMap feature

### Pattern 3: Turborepo Task Dependencies

**What:** Use dependsOn: ["^build"] to ensure dependency builds complete before dependent tasks
**When to use:** Dev tasks that depend on compiled outputs from other packages
**Example:**

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**Source:** [Turborepo Documentation](https://turbo.build/guides/tools/playwright) - Task dependency configuration

### Pattern 4: Next.js Webpack Mode

**What:** Force webpack mode by avoiding --turbo flag and ensuring transpilePackages configuration
**When to use:** Next.js apps in monorepos that depend on internal packages
**Example:**

```javascript
// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    "@tambo-ai-cloud/core",
    "@tambo-ai-cloud/db",
    "@tambo-ai-cloud/backend",
  ],
  // Do NOT add experimental.turbo config
};
```

**Source:** [Next.js transpilePackages documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)

### Anti-Patterns to Avoid

- **Exporting pre-compiled dist/**: Defeats hot reload by requiring manual rebuild step
- **Using Turbopack with transpilePackages**: Turbopack ignores transpilePackages in monorepos with inter-package dependencies
- **Omitting declarationMap**: IDE go-to-definition jumps to .d.ts files instead of source
- **Running dev without initial build**: Turborepo's dependsOn: ["^build"] handles this, but manual npm run dev:web would fail without building dependencies first

## Don't Hand-Roll

| Problem                      | Don't Build                               | Use Instead                       | Why                                                                     |
| ---------------------------- | ----------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| Monorepo task orchestration  | Custom bash scripts for parallel builds   | Turborepo with dependsOn          | Handles caching, task graph, parallel execution, and incremental builds |
| TypeScript source watching   | Custom file watchers with chokidar        | tsc --watch or nest start --watch | TypeScript compiler has optimized incremental compilation               |
| Module transpilation         | Custom Babel config for monorepo packages | Next.js transpilePackages         | Built-in, optimized, integrates with Next.js bundler                    |
| Declaration file source maps | Custom .d.ts.map generation               | TypeScript declarationMap option  | Standard compiler feature, works with all IDEs                          |

**Key insight:** Modern tooling (Next.js, TypeScript, Turborepo) has built-in monorepo support. Custom solutions introduce maintenance burden and miss optimizations.

## Common Pitfalls

### Pitfall 1: Turbopack with transpilePackages

**What goes wrong:** Turbopack ignores transpilePackages configuration for monorepo packages with dependencies on other monorepo packages, causing "Module not found" errors.

**Why it happens:** Turbopack has different module resolution strategy than webpack and doesn't yet support transpilePackages in all scenarios ([Issue #63230](https://github.com/vercel/next.js/issues/63230), [Issue #85316](https://github.com/vercel/next.js/issues/85316)).

**How to avoid:** Use webpack mode by ensuring next dev script does NOT include --turbo flag. Verify with: `next dev -p 8260` (no --turbo).

**Warning signs:**

- "Module not found: Can't resolve '@tambo-ai-cloud/core'" in Next.js dev server
- Changes to internal packages don't trigger HMR
- next dev uses Turbopack (check console output for "Turbopack" mention)

### Pitfall 2: Missing declarationMap in Published Packages

**What goes wrong:** IDE go-to-definition jumps to .d.ts files instead of source .ts files for workspace packages.

**Why it happens:** Without declarationMap: true, TypeScript doesn't generate .d.ts.map files that map declarations back to source.

**How to avoid:** Ensure all internal packages (core, db, backend) have declarationMap: true in their tsconfig.json compilerOptions.

**Warning signs:**

- Cmd+Click on imported symbols opens .d.ts file instead of .ts source
- IDE shows type definitions but not implementation code

### Pitfall 3: Incorrect package.json exports

**What goes wrong:** Next.js transpilePackages fails to find source files if exports field points to dist/ instead of src/.

**Why it happens:** transpilePackages expects to transpile source TypeScript, but if exports points to pre-compiled JavaScript, transpilation is skipped.

**How to avoid:** For internal packages, ensure exports field points to src/ TypeScript files: `"exports": { "import": "./src/index.ts" }`

**Warning signs:**

- No HMR when editing internal package files
- Module resolution errors in Next.js dev mode
- TypeScript errors about missing source files

### Pitfall 4: Dev tasks starting before build completes

**What goes wrong:** Next.js dev server starts before internal packages are built, causing import errors on first load.

**Why it happens:** Without proper dependsOn configuration, Turborepo runs dev tasks in parallel without waiting for builds.

**How to avoid:** Ensure dev tasks in turbo.json have dependsOn: ["^build"] to guarantee builds complete first.

**Warning signs:**

- First page load in Next.js dev server shows import errors
- Errors disappear after manual package rebuild
- Intermittent module resolution failures

## Code Examples

Verified patterns from official sources:

### Next.js transpilePackages Configuration

```javascript
// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    "@tambo-ai-cloud/core",
    "@tambo-ai-cloud/db",
    "@tambo-ai-cloud/backend",
  ],
  // Additional Next.js config...
};

export default config;
```

**Source:** [Next.js transpilePackages API Reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)

### Internal Package Source Exports

```json
// packages/core/package.json
{
  "name": "@tambo-ai-cloud/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "import": "./src/index.ts"
  },
  "main": "./src/index.ts",
  "files": ["src"]
}
```

**Source:** [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

### TypeScript Declaration Maps

```json
// packages/core/tsconfig.json
{
  "extends": "@tambo-ai/typescript-config/base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

**Source:** [TypeScript 2.9 declarationMap](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9)

### Turborepo Task Dependencies

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "esm/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

**Source:** [Turborepo Task Configuration](https://turbo.build/guides/tools/playwright)

## State of the Art

| Old Approach                        | Current Approach                               | When Changed         | Impact                                                                        |
| ----------------------------------- | ---------------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| next-transpile-modules package      | Built-in transpilePackages option              | Next.js 13.1 (2022)  | Native support, better performance, no external dependency                    |
| TypeScript project references       | Direct source exports with transpilePackages   | 2023-2024            | Simpler configuration, faster builds, less maintenance overhead               |
| Manual build scripts for watch mode | Turborepo persistent dev tasks                 | Turborepo 1.x (2022) | Automatic dependency tracking, parallel execution                             |
| Turbopack (experimental)            | Turbopack stable but with monorepo limitations | Next.js 15 (2024)    | Stable but transpilePackages incompatible, webpack still needed for monorepos |

**Deprecated/outdated:**

- **next-transpile-modules**: Replaced by built-in transpilePackages configuration
- **TypeScript project references for monorepos**: Research showed maintenance overhead outweighs benefits (documented in REQUIREMENTS.md)
- **Turbopack for monorepos with transpilePackages**: Does not work with inter-package dependencies ([GitHub Issues #63230](https://github.com/vercel/next.js/issues/63230), [#85316](https://github.com/vercel/next.js/issues/85316))

## Open Questions

1. **Does NestJS watch mode detect changes in workspace packages automatically?**
   - What we know: NestJS uses tsc --watch for compilation, which should detect changes in node_modules symlinks
   - What's unclear: Whether nest start --watch needs additional configuration to watch linked workspace packages
   - Recommendation: Test in Phase 3 implementation; if not automatic, investigate nest-cli.json watchAssets or custom watch paths

2. **Should published packages (react-sdk) use source exports or dist exports?**
   - What we know: react-sdk is published to npm and consumed externally, so dist exports are required for publication
   - What's unclear: Whether to use dual exports (source for internal, dist for external) or different package.json for publishing
   - Recommendation: Out of scope for Phase 1; react-sdk already has correct dist exports for npm

3. **Does the showcase app need transpilePackages for react-sdk?**
   - What we know: showcase consumes @tambo-ai/react package, which may export dist or source
   - What's unclear: Whether showcase should use transpilePackages or consume pre-built react-sdk
   - Recommendation: Check react-sdk package.json exports; if pointing to dist, no transpilePackages needed for showcase

## Sources

### Primary (HIGH confidence)

- [Next.js transpilePackages documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) - Context7 library /llmstxt/nextjs_llms_txt
- [TypeScript declarationMap documentation](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9) - Context7 library /websites/typescriptlang
- [Turborepo task dependencies](https://turbo.build/guides/tools/playwright) - Context7 library /llmstxt/turbo_build_llms_txt
- [TypeScript Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html) - Official TypeScript documentation

### Secondary (MEDIUM confidence)

- [Turbopack transpilePackages Issue #63230](https://github.com/vercel/next.js/issues/63230) - Confirmed via WebFetch, closed issue with reproduction case
- [Turbopack monorepo Issue #85316](https://github.com/vercel/next.js/issues/85316) - Confirmed via WebFetch, workaround is webpack mode
- [Live types in TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) - Verified via WebFetch, custom export conditions pattern
- [Package.json exports guide](https://hirok.io/posts/package-json-exports) - WebSearch result, verified with TypeScript official docs

### Tertiary (LOW confidence)

None - all critical findings verified with official sources or GitHub issues.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All tools already in monorepo, versions confirmed from package.json files
- Architecture: HIGH - Patterns verified with official documentation (Next.js, TypeScript, Turborepo)
- Pitfalls: HIGH - Confirmed via GitHub issues and official documentation

**Research date:** 2026-02-16
**Valid until:** Estimated 90 days (stable tooling, no fast-moving features)
