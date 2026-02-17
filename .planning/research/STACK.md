# Hot Reload DX Stack Research

**Research Date:** 2026-02-16
**Target:** Turborepo + tsc + Next.js 15 + NestJS monorepo
**Objective:** Enable seamless hot reloading of local workspace packages in consuming apps

---

## Executive Summary

The standard 2025/2026 approach for hot reloading local monorepo packages involves a **multi-layered strategy** combining Next.js transpilePackages, Turborepo persistent tasks with ^build dependencies, and tsc watch mode. **Conditional exports are not recommended** for this use case. The ecosystem has matured significantly, with Turborepo 2.x providing better watch mode support and Next.js 15's built-in transpilation replacing the need for third-party plugins.

**Key Insight:** The challenge isn't configuration complexity—it's that **persistent tasks cannot depend on other persistent tasks** in Turborepo. The solution is making dev tasks depend on `^build` (non-persistent) while using separate watch processes.

---

## Recommended Stack Configuration

### 1. Next.js 15 Configuration

**Use transpilePackages for all internal packages** ✅

**Confidence: HIGH** (9/10)

```javascript
// apps/web/next.config.mjs
const config = {
  transpilePackages: [
    '@tambo-ai-cloud/db',
    '@tambo-ai-cloud/core',
    '@tambo-ai-cloud/backend',
    '@tambo-ai/ui-registry'
  ],
  // ... rest of config
}
```

**Rationale:**
- Next.js 15's `transpilePackages` automatically transpiles and bundles local packages
- Replaces the deprecated `next-transpile-modules` package
- Works with **source files** (via package.json exports pointing to `./src/index.ts`)
- Enables HMR when source files change in watched packages
- No additional configuration needed for TypeScript paths

**Important:** transpilePackages works best when packages export source TypeScript files (`"exports": { "import": "./src/index.ts" }`), not pre-built dist files. This allows Next.js to watch the actual source and trigger HMR.

**Sources:**
- [Next.js transpilePackages documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Next.js Package Bundling guide](https://nextjs.org/docs/pages/guides/package-bundling)

---

### 2. Turborepo Task Configuration

**Use `dependsOn: ["^build"]` for dev tasks** ✅

**Confidence: HIGH** (9/10)

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "esm/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@tambo-ai/react#dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Rationale:**
- Persistent tasks **cannot depend on other persistent tasks** in Turborepo
- `dependsOn: ["^build"]` ensures dependencies are built once before dev starts
- React SDK watch mode runs independently (doesn't block)
- Apps consume source files via transpilePackages, not built artifacts
- This pattern is documented in Turborepo best practices

**Why NOT `dependsOn: ["^dev"]`:**
- Persistent tasks never exit, so they block dependent tasks forever
- Turborepo will throw an error or deadlock
- Even with `turbo watch`, persistent dependencies are ignored

**Sources:**
- [Turborepo Development Tasks handbook](https://turbo.build/repo/docs/handbook/dev)
- [Turborepo persistent task limitations](https://github.com/vercel/turborepo/issues/8484)
- [Creating dependency-aware dev pipelines](https://www.luisball.com/blog/turborepo-prepare-tasks)

---

### 3. Package Build Strategy

**Keep dual tsc builds (CJS + ESM) in watch mode for published packages** ✅
**Use source exports for internal packages consumed by Next.js** ✅

**Confidence: HIGH** (8/10)

```json
// react-sdk/package.json (published package)
{
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "concurrently \"npm run dev:cjs\" \"npm run dev:esm\"",
    "dev:cjs": "tsc -p tsconfig.cjs.json --watch",
    "dev:esm": "tsc -p tsconfig.esm.json --watch"
  }
}
```

```json
// packages/db/package.json (internal package)
{
  "exports": {
    "import": "./src/index.ts"
  },
  "scripts": {
    // No dev script needed - Next.js transpiles source directly
  }
}
```

**Rationale:**
- **For published npm packages** (react-sdk, cli): Build artifacts matter for external consumers
- **For internal packages** (db, core, backend): Source files are fine, Next.js transpiles them
- `concurrently` runs multiple tsc processes efficiently for dual builds
- TypeScript's `--watch` is battle-tested and fast
- No need for additional tooling like tsup unless you need bundling (you don't)

**Why NOT TypeScript Project References:**
- Adds complexity with composite: true and reference declarations
- Doesn't integrate well with Turborepo's task graph
- TypeScript 5.9's watch mode is already fast enough

**Why NOT tsup:**
- Known issues with .d.ts generation in watch mode
- Unnecessary bundling for internal packages
- tsc is simpler and more reliable for library code
- Current setup (dual tsc) works fine

**Sources:**
- [TypeScript watch mode limitations with tsup](https://github.com/egoist/tsup/issues/970)
- [mtsc for concurrent TypeScript compilation](https://www.npmjs.com/package/mtsc)
- [TypeScript project references guide](https://blog.logrocket.com/boost-your-productivity-with-typescript-project-references/)

---

### 4. NestJS Watch Configuration

**Use NestJS CLI's built-in watch mode** ✅

**Confidence: HIGH** (9/10)

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--experimental-require-module --trace-warnings' nest start --watch"
  }
}
```

```json
// apps/api/nest-cli.json
{
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": ["@nestjs/swagger"]
  }
}
```

**Rationale:**
- NestJS CLI has built-in watch mode that handles TypeScript compilation
- Automatically watches local packages referenced via workspace protocol
- Uses webpack under the hood for fast rebuilds
- No additional configuration needed for monorepo setup
- HMR support available via webpack-hmr config if needed

**Optional HMR Setup:**
```javascript
// apps/api/webpack-hmr.config.js
module.exports = (options) => ({
  ...options,
  entry: ['webpack/hot/poll?100', options.entry],
  externals: [],
  plugins: [
    ...options.plugins,
    new webpack.HotModuleReplacementPlugin(),
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
  ],
});
```

Then use: `nest build --watch --webpack --webpackPath webpack-hmr.config.js`

**Sources:**
- [NestJS monorepo documentation](https://docs.nestjs.com/cli/monorepo)
- [NestJS hot reload guide](https://docs.nestjs.com/recipes/hot-reload)

---

### 5. Package.json Conditional Exports

**DO NOT use development/production conditions** ❌

**Confidence: HIGH** (9/10)

**Why NOT conditional exports:**

```json
// ❌ DO NOT DO THIS
{
  "exports": {
    "development": "./src/index.ts",
    "production": "./dist/index.js"
  }
}
```

**Rationale:**
- `development`/`production` conditions are **semi-standard** and not universally supported
- Node.js runtime only recognizes `node`, `import`, `require`, and `default` conditions
- Bundlers (webpack, Vite) have inconsistent support
- Next.js doesn't respect these conditions reliably
- NestJS/webpack don't use these conditions
- Creates confusion: which environment sets `process.env.NODE_ENV`? When?
- **Simpler solution:** Use transpilePackages + source exports, let Next.js handle transpilation

**The community consensus is clear:** Conditional development/production exports are not the solution for monorepo hot reload. They're meant for different build outputs (like minified vs. unminified), not development workflow optimization.

**Sources:**
- [Conditional exports NPM guide](https://tolgee.io/blog/conditional-export)
- [Node.js packages documentation](https://nodejs.org/api/packages.html)
- [Package exports webpack guide](https://webpack.js.org/guides/package-exports/)

---

## Implementation Strategy

### Phase 1: Package Export Configuration

**Current state analysis:**

Looking at the current package.json files:

1. **react-sdk** - Already has dual build exports (CJS/ESM) ✅
2. **packages/db** - Exports source `./src/index.ts` ✅
3. **packages/core** - Exports source `./src/index.ts` ✅
4. **packages/backend** - Exports source `./src/index.ts` ✅

**Actions needed:**
- ✅ No changes needed to package exports
- ✅ Keep internal packages exporting source TypeScript
- ✅ Keep react-sdk building to dist/ and esm/

### Phase 2: Next.js Configuration

**Current state:**
- apps/web/next.config.mjs already has `transpilePackages: ["@tambo-ai/ui-registry"]`

**Actions needed:**
1. Add all internal packages to transpilePackages:
```javascript
transpilePackages: [
  '@tambo-ai-cloud/db',
  '@tambo-ai-cloud/core',
  '@tambo-ai-cloud/backend',
  '@tambo-ai/ui-registry',
  '@tambo-ai/react' // if consuming from source during SDK development
]
```

2. **Important decision:** Should react-sdk be transpiled from source or built artifacts?
   - **Option A (current):** Transpile from dist/esm (requires build step)
   - **Option B (dev-optimized):** Add conditional logic to transpile from src/ in dev
   - **Recommendation:** Keep Option A, use separate `dev:sdk` script for SDK development

### Phase 3: Turborepo Configuration

**Current state:**
```json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],  // ✅ Already correct
      "cache": false,
      "persistent": true
    },
    "@tambo-ai/react#dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Actions needed:**
- ✅ No changes needed - already following best practices
- Current setup ensures dependencies build before dev starts
- react-sdk dev task runs independently without blocking

### Phase 4: Watch Mode Setup

**For SDK development workflow:**

```bash
# Terminal 1: Watch react-sdk builds
npm run dev:sdk

# Terminal 2: Run showcase (consumes react-sdk builds)
# Already starts via dev:sdk's dependsOn
```

**For Cloud platform development:**

```bash
# Terminal 1: Start both apps (packages auto-transpiled)
npm run dev:cloud
```

**For full-stack development:**

```bash
npm run dev:cloud:full
```

### Phase 5: Verification Steps

1. **Test package changes propagate:**
   - Edit `packages/db/src/schema.ts`
   - Verify Next.js HMR triggers in apps/web
   - Verify NestJS recompiles in apps/api

2. **Test SDK changes propagate:**
   - Run `npm run dev:sdk`
   - Edit `react-sdk/src/hooks/use-tambo.ts`
   - Verify showcase HMR updates

3. **Test type checking works:**
   - Introduce a type error in packages/core
   - Verify apps/web and apps/api catch it

---

## What NOT to Use

### ❌ TypeScript Project References

**Why not:**
- Requires adding `composite: true` to every tsconfig
- Requires explicit `references` arrays in dependent packages
- Doesn't integrate well with Turborepo's task model
- Adds complexity for marginal benefit
- Your current setup is simpler and works

**When to consider:**
- If you have 50+ packages and tsc build times become unbearable
- If you need strict build ordering guarantees for non-Turborepo reasons
- Not needed for your scale (10 packages)

### ❌ tsup in Watch Mode

**Why not:**
- Known bugs with .d.ts generation in watch mode
- Unnecessary bundling overhead for library code
- Less mature than tsc for TypeScript compilation
- Your dual tsc setup is simpler and more reliable

**When to use:**
- Publishing packages that need tree-shaking
- Bundling for browsers (non-library code)
- When you need minification/code splitting
- Not applicable to your internal packages

### ❌ Nx Instead of Turborepo

**Why not:**
- You're already committed to Turborepo
- Nx has different mental models (affected, task pipeline)
- Migration would be expensive
- Turborepo 2.x has caught up in features

**When to consider:**
- Greenfield projects
- Need Nx's code generation capabilities
- Want integrated testing/linting orchestration

### ❌ pnpm or yarn Workspaces Instead of npm

**Why not:**
- You're standardized on npm@11 (volta, mise configs)
- npm workspaces are mature and fast enough
- Switching now has no clear benefit
- pnpm's symlink model can cause issues with some tools

**When to consider:**
- Disk space is critical (pnpm's content-addressable store)
- Need faster install times in CI (though npm is pretty fast now)
- Starting a new monorepo

### ❌ SWC Instead of tsc

**Why not:**
- tsc is the source of truth for type checking
- tsc generates correct .d.ts files
- SWC doesn't do type checking
- Your build times are not currently a bottleneck

**When to use:**
- Application bundling (Next.js already uses SWC internally)
- If tsc build times exceed 30+ seconds
- When you need ESM/CJS transpilation only (no types)

---

## Turborepo 2.x Specific Considerations

### turbo watch Command

**Confidence: MEDIUM** (6/10)

Turborepo 2.0.4+ introduced `turbo watch [tasks]` which re-runs tasks when dependencies change.

```bash
turbo watch dev --filter=@tambo-ai-cloud/web
```

**Pros:**
- Intelligently ignores persistent tasks
- Single watcher for entire monorepo
- Can restart interruptible tasks

**Cons:**
- Still experimental (released June 2024, ~8 months old)
- Limited documentation
- Not widely adopted yet
- Doesn't solve the "persistent depends on persistent" problem

**Recommendation:**
- **Don't adopt yet** - stick with `turbo dev` for now
- Revisit in 6 months when ecosystem matures
- Current approach (dev depends on ^build) is battle-tested

**Sources:**
- [Turborepo watch command reference](https://turborepo.dev/docs/reference/watch)
- [turbo watch discussion](https://github.com/vercel/turborepo/discussions/8095)

### Persistent Task Best Practices

**Mark tasks that need restart as interruptible:**

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "interruptible": true  // Allows turbo watch to restart it
    }
  }
}
```

**When to use:**
- Tools that don't hot-reload monorepo dependencies
- Tasks that need full restart on config changes
- Not needed for your setup (NestJS + Next.js have good HMR)

---

## Performance Optimization Tips

### 1. Exclude node_modules from tsc watch

```json
// tsconfig.json
{
  "exclude": ["node_modules", "dist", "build"]
}
```

### 2. Use incremental compilation

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### 3. Optimize Next.js for monorepo

```javascript
// next.config.mjs
{
  experimental: {
    webpackMemoryOptimizations: true,
  }
}
```

(Already configured ✅)

### 4. Ignore build artifacts in file watchers

```json
// turbo.json
{
  "tasks": {
    "dev": {
      "inputs": ["src/**", "!dist/**", "!esm/**"]
    }
  }
}
```

---

## Common Pitfalls to Avoid

### 1. Circular Dependencies

**Problem:** Package A imports from Package B which imports from Package A

**Solution:**
- Extract shared code to a new package
- Use dependency injection patterns
- Review package boundaries

### 2. Mixed Source/Dist Imports

**Problem:** Some imports reference `./src/`, others reference `./dist/`

**Solution:**
- Always import via package name: `import { foo } from '@tambo-ai-cloud/db'`
- Never use relative paths across package boundaries
- Let package.json exports handle resolution

### 3. Stale Type Definitions

**Problem:** TypeScript sees old .d.ts files from previous builds

**Solution:**
- Use `deleteOutDir: true` in nest-cli.json (already configured ✅)
- Add `clean` scripts that remove all build artifacts
- Run `npm run clean` when types seem wrong

### 4. Turborepo Cache Confusion

**Problem:** Turborepo serves stale outputs from cache

**Solution:**
- Disable cache for dev tasks: `"cache": false` (already done ✅)
- Use `turbo run build --force` to bypass cache
- Ensure `outputs` array is correct

### 5. NODE_ENV=production Breaks Watch Mode

**Problem:** Some tools disable watch mode in production

**Solution:**
- Never set `NODE_ENV=production` for dev tasks
- Use separate env files for dev/prod
- Let Next.js/NestJS set NODE_ENV automatically

---

## Migration Checklist

- [ ] Add all internal packages to Next.js transpilePackages
- [ ] Verify turbo.json has `dev: { dependsOn: ["^build"] }`
- [ ] Test editing packages/db/src/schema.ts triggers HMR in apps/web
- [ ] Test editing packages/core/src/util.ts triggers HMR in apps/api
- [ ] Test react-sdk dev mode with `npm run dev:sdk`
- [ ] Run `npm run check-types` across all packages
- [ ] Run `npm run lint` across all packages
- [ ] Document new dev workflow in CONTRIBUTING.md
- [ ] Update AGENTS.md with hot reload expectations
- [ ] Consider adding watch mode tests to CI (optional)

---

## References

### Official Documentation

- [Next.js 15 transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Next.js Package Bundling guide](https://nextjs.org/docs/pages/guides/package-bundling)
- [Turborepo Development Tasks](https://turbo.build/repo/docs/handbook/dev)
- [Turborepo Configuration Reference](https://turborepo.dev/docs/reference/configuration)
- [NestJS Monorepo Support](https://docs.nestjs.com/cli/monorepo)
- [NestJS Hot Reload](https://docs.nestjs.com/recipes/hot-reload)
- [Node.js Package Exports](https://nodejs.org/api/packages.html)
- [TypeScript Configuring Watch](https://www.typescriptlang.org/docs/handbook/configuring-watch.html)

### Community Resources

- [Creating dependency-aware dev pipelines in Monorepos](https://www.luisball.com/blog/turborepo-prepare-tasks)
- [Turborepo persistent task limitations (Issue #8484)](https://github.com/vercel/turborepo/issues/8484)
- [Persistent tasks in watch mode (Issue #8673)](https://github.com/vercel/turborepo/issues/8673)
- [NPM Package Conditional Exports Guide](https://tolgee.io/blog/conditional-export)
- [Guide to package.json exports field](https://hirok.io/posts/package-json-exports)
- [TypeScript Project References Guide](https://blog.logrocket.com/boost-your-productivity-with-typescript-project-references/)

### GitHub Issues & Discussions

- [transpilePackages not working with Yarn Workspaces](https://github.com/vercel/next.js/issues/62468)
- [Turbopack transpilePackages for monorepos](https://github.com/vercel/next.js/issues/85316)
- [turbo watch discussion](https://github.com/vercel/turborepo/discussions/8095)
- [tsup watch mode and D.TS generation](https://github.com/egoist/tsup/issues/970)

---

## Confidence Summary

| Component | Confidence | Rationale |
|-----------|-----------|-----------|
| Next.js transpilePackages | 9/10 | Official Next.js 15 feature, well-documented, stable |
| Turborepo dependsOn ^build | 9/10 | Standard pattern, documented in Turborepo handbook |
| tsc watch for dual builds | 8/10 | Battle-tested, current setup works, minor edge cases |
| NestJS CLI watch mode | 9/10 | Built-in feature, handles monorepos automatically |
| Avoid conditional exports | 9/10 | Clear community consensus, not needed for this use case |
| turbo watch command | 6/10 | Experimental, released 8 months ago, limited adoption |
| TypeScript project references | 4/10 | Adds complexity, not needed at current scale |
| tsup in watch mode | 3/10 | Known issues, not recommended for libraries |

**Overall Stack Confidence: HIGH (8.5/10)**

The recommended approach combines mature, documented patterns with clear rationale for avoiding newer experimental features. The ecosystem has stabilized around transpilePackages + persistent tasks + watch mode as the standard solution for 2025/2026.

---

## Next Steps

1. **Review this document with the team** - Ensure alignment on approach
2. **Implement Phase 1-3** - Low-risk configuration changes
3. **Test Phase 4** - Verify hot reload works as expected
4. **Document in CONTRIBUTING.md** - Update contributor workflows
5. **Monitor for issues** - Watch for edge cases in first week
6. **Revisit in 6 months** - Check if turbo watch has matured enough to adopt

---

**Research completed:** 2026-02-16
**Researcher:** Claude (Sonnet 4.5)
**Confidence in recommendations:** HIGH (8.5/10)
