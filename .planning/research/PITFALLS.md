# Monorepo Hot Reload DX: Common Pitfalls

Research findings on what teams commonly get wrong when configuring hot reload for monorepo packages in Next.js and NestJS with Turborepo, including critical mistakes with transpilePackages, task graphs, conditional exports, and tsc watch mode.

**Context**: Tambo AI monorepo with Turborepo, npm workspaces, tsc dual CJS/ESM builds, Next.js 15 (apps/web), NestJS (apps/api), react-sdk with watch mode. Current turbo.json has dev dependsOn: ["^build"] which builds once but doesn't watch. Goal: wire up continuous watch+rebuild via turbo dev.

## 1. Next.js transpilePackages Configuration

### Pitfall 1.1: Turbopack Ignores transpilePackages

**Description**: Turbopack (Next.js 15+ default) does not respect the `transpilePackages` property in next.config. Your monorepo packages won't be transpiled when using Turbopack's dev mode, causing runtime errors or missing updates.

**Warning Signs**:
- Hot reload works with webpack (`next dev`) but fails with Turbopack
- Console errors about ESM/CJS module format mismatches during development
- Changes to local packages don't trigger reloads in Next.js app
- Works in production build but breaks in dev mode

**Prevention Strategy**:
- Ensure all workspace packages ship ESM format natively (set `"type": "module"` in package.json)
- Or explicitly disable Turbopack until support is added: `next dev --no-turbo`
- Test both webpack and Turbopack modes during Phase 1 (feasibility)
- Document which bundler mode is officially supported

**Phase Mapping**: Phase 1 (Research & Feasibility) - critical decision point for bundler choice

**References**:
- [Turbopack does not handle transpilePackages for monorepos · Issue #85316](https://github.com/vercel/next.js/issues/85316)
- [Next.js transpilePackages Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)

---

### Pitfall 1.2: TypeScript Configuration Conflicts

**Description**: When using `transpilePackages`, Next.js checks type errors in all listed dependencies using only the main app's tsconfig.json, not each package's individual tsconfig. This causes false positive type errors or misses actual errors in dependencies.

**Warning Signs**:
- Type errors in workspace packages during `next build` that don't appear in package's own `npm run check-types`
- Build fails with errors about stricter options (e.g., strict nullchecks) not enabled in packages
- Conflicting compiler options between app and packages cause build failures
- IDE shows different errors than Next.js build process

**Prevention Strategy**:
- Align all tsconfig compiler options across the monorepo (especially strict flags)
- Use shared tsconfig base via extends from packages/typescript-config
- Run `turbo check-types` before `turbo build` to catch package-level type errors early
- Consider adding a pre-build step that validates all package types independently

**Phase Mapping**: Phase 2 (TypeScript Configuration) - must resolve before watch mode setup

**References**:
- [With transpilePackages, how can I use local tsconfigs? · Discussion #55034](https://github.com/vercel/next.js/discussions/55034)
- [Next.js transpilePackages Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)

---

### Pitfall 1.3: Missing transpilePackages Entries

**Description**: Forgetting to list workspace packages in `transpilePackages` array means Next.js treats them as pre-compiled external modules. Changes won't be picked up, and TypeScript source won't be transpiled properly.

**Warning Signs**:
- Changes to workspace packages don't appear in Next.js app until manual rebuild
- Import errors for workspace packages despite packages building successfully
- Next.js tries to import .ts files directly instead of compiled outputs
- Hot reload only works for app code, not for imported workspace packages

**Prevention Strategy**:
- Create a centralized list of all workspace packages that need transpilation
- Add validation in CI that checks transpilePackages includes all @tambo-ai/* or internal dependencies
- Use a helper function to auto-generate transpilePackages from package.json workspaces
- Document the requirement in package README when creating new workspace packages

**Phase Mapping**: Phase 3 (Implementation) - configure during Next.js app setup

**References**:
- [transpilePackages Not Working Properly with Yarn Workspaces · Issue #62468](https://github.com/vercel/next.js/issues/62468)
- [Next.js Package Bundling Guide](https://nextjs.org/docs/pages/guides/package-bundling)

---

## 2. Turborepo Task Graph Configuration

### Pitfall 2.1: Persistent Tasks Block Dependency Graph

**Description**: Marking tasks as `"persistent": true` (like `dev` tasks that run servers) means they never exit and cannot be depended on in your task graph. Using `dependsOn: ["^build"]` with persistent dev tasks creates a deadlock where dev waits for deps to build, but deps never finish because they're persistent.

**Warning Signs**:
- `turbo dev` hangs indefinitely without starting any tasks
- Tasks listed as dependencies never complete even though they're running
- Circular dependency warnings in turbo output
- Dev servers start but dependent packages never begin watching

**Prevention Strategy**:
- Never use `dependsOn` with `^` prefix on persistent tasks (dev, start, serve)
- Use `dependsOn: ["^build"]` only for one-time tasks (build, test, lint)
- For dev workflows, use one-time build followed by watch: `dependsOn: ["package-name#build"]` then start package watch separately
- Consider using Turborepo's watch mode (`turbo watch`) instead of persistent tasks

**Phase Mapping**: Phase 3 (Implementation) - critical for turbo.json task pipeline design

**References**:
- [Persistent tasks in watch mode don't wait for dependencies · Issue #8673](https://github.com/vercel/turborepo/issues/8673)
- [Turborepo Watch Mode Documentation](https://turborepo.dev/docs/reference/watch)

---

### Pitfall 2.2: Built-in Watchers Don't Track Monorepo Dependencies

**Description**: Bundler watch modes (tsup, rollup, esbuild) only watch files they're bundling, not changes in monorepo dependencies. A change in packages/core won't trigger rebuild in react-sdk even if react-sdk's watcher is running.

**Warning Signs**:
- Making changes to dependency packages doesn't trigger rebuild in consuming package
- Only manual restarts pick up changes from dependencies
- Frontend reloads but backend doesn't when shared package changes
- Watcher runs but only sees local file changes

**Prevention Strategy**:
- Mark tasks as `"interruptible": true` in turbo.json to allow turbo watch to restart them
- Use `turbo watch` wrapper instead of relying on built-in watch modes
- Configure proper input/output globs in turbo.json to track cross-package dependencies
- Test that changes propagate through dependency chain (core → backend → api)

**Phase Mapping**: Phase 3 (Implementation) - configure when setting up watch tasks

**References**:
- [Watch-mode not rebuild dependent packages · Issue #8164](https://github.com/vercel/turborepo/issues/8164)
- [Turborepo Developing Applications Guide](https://turborepo.dev/docs/crafting-your-repository/developing-applications)

---

### Pitfall 2.3: Cache Invalidation Misses Root-level Inputs

**Description**: Turborepo's watch mode may not rerun tasks when root-level config files change (like eslint.config.mjs, tsconfig.json) even though the cache correctly invalidates. This means dev servers continue running with stale configuration.

**Warning Signs**:
- Changing shared configs doesn't restart dev tasks
- `turbo run` cache misses after config change but `turbo watch` doesn't restart
- Lint/type errors appear after manual restart but not during watch mode
- Different behavior between `turbo dev` and `turbo watch`

**Prevention Strategy**:
- Explicitly list root-level configs in task inputs: `"inputs": ["../../tsconfig.base.json", "../../turbo.json"]`
- Use `turbo watch` with explicit task filters rather than relying on `turbo dev`
- Mark dev tasks as interruptible so config changes can restart them
- Document which config changes require manual restart in development docs

**Phase Mapping**: Phase 3 (Implementation) - configure inputs array properly

**References**:
- [Turborepo watch not triggering run on root inputs change](https://community.vercel.com/t/turborepo-watch-not-triggering-run-on-root-inputs-change/10087)
- [Turborepo Caching Documentation](https://turborepo.dev/docs/crafting-your-repository/caching)

---

## 3. TypeScript Watch Mode & Project References

### Pitfall 3.1: Project References Maintenance Overhead

**Description**: TypeScript project references require manually keeping the `references` field in sync with package.json dependencies. The references field is not inherited via extends, so every package needs explicit declaration. This creates maintenance burden and easy-to-miss bugs.

**Warning Signs**:
- Adding a new package dependency but forgetting to update tsconfig references
- Type errors in IDE but successful builds, or vice versa
- Incremental builds not triggering when dependency changes
- Different behavior between `tsc` and `tsc --build` modes

**Prevention Strategy**:
- Avoid TypeScript project references entirely in favor of transpiling source directly
- If using references, create a script to validate references match dependencies
- Use `turbo watch` to manage rebuilds instead of relying on tsc --build --watch
- Consider tools that auto-generate project references from package.json

**Phase Mapping**: Phase 2 (TypeScript Configuration) - decide whether to use project references

**References**:
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [You might not need TypeScript project references](https://turborepo.dev/blog/you-might-not-need-typescript-project-references)

---

### Pitfall 3.2: Build Mode Performance Penalty in Watch Mode

**Description**: Using `tsc --build --watch` (with project references) is significantly slower than plain `tsc --watch` even for small changes. Build mode adds overhead checking all referenced projects even when running inside a single package with zero references.

**Warning Signs**:
- Watch mode recompilation takes 3-4 seconds instead of 300ms
- CPU usage spikes on every file change during watch
- First compilation is fast but subsequent watch rebuilds are slow
- Adding -b flag makes watch mode noticeably slower

**Prevention Strategy**:
- Use plain `tsc --watch` for individual packages during development
- Reserve `tsc --build` for CI and production builds only
- Consider switching to faster build tools (esbuild, swc) for development
- Profile watch mode performance before committing to project references

**Phase Mapping**: Phase 2 (TypeScript Configuration) - benchmark before choosing approach

**References**:
- [Performance issue on watch incremental config when using build mode · Issue #48990](https://github.com/microsoft/TypeScript/issues/48990)
- [Build mode explicitly checks file stamps in watch mode · Issue #45082](https://github.com/microsoft/TypeScript/issues/45082)

---

### Pitfall 3.3: Composite Projects Require Checked-in Build Outputs

**Description**: TypeScript project references with composite:true require .d.ts files from dependencies. You must either check in build outputs to git or run full build after every clone before editor tooling works properly.

**Warning Signs**:
- Fresh clone shows thousands of type errors in IDE
- "Cannot find module" errors for workspace dependencies after git pull
- CI fails with type errors that don't appear locally
- New team members can't get IDE working without manual build steps

**Prevention Strategy**:
- Don't use composite/project references for dev workflow
- Use postinstall hook to run initial build: `"postinstall": "turbo build"`
- Document explicit build requirement in CONTRIBUTING.md
- Or check in dist/ directories (conflicts with .gitignore best practices)

**Phase Mapping**: Phase 2 (TypeScript Configuration) - critical for team DX

**References**:
- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Managing TypeScript Packages in Monorepos | Nx Blog](https://nx.dev/blog/managing-ts-packages-in-monorepos)

---

## 4. Package.json Exports & Dual CJS/ESM

### Pitfall 4.1: Dual Package Hazard - Multiple Instances

**Description**: When compiling ESM and CJS separately with different entrypoints, different parts of the application may load separate instances of the same package. This breaks instanceof checks, singleton patterns, and causes state to diverge between instances.

**Warning Signs**:
- instanceof checks fail even though objects are correct type
- Singleton patterns create multiple instances
- State updates in one part of app don't reflect in another
- Different behavior in development vs production builds

**Prevention Strategy**:
- Prefer single module format (ESM) throughout monorepo for development
- If dual format required, use single-source compilation (same code, different output)
- Add runtime checks to detect multiple instances during development
- Document which packages must use same module format

**Phase Mapping**: Phase 2 (TypeScript Configuration) - decide on module format strategy

**References**:
- [Publishing dual ESM+CJS packages](https://mayank.co/blog/dual-packages/)
- [Node.js Dual Package Hazard Documentation](https://nodejs.org/api/packages.html#dual-package-hazard)

---

### Pitfall 4.2: Conditional Exports Without Runtime Validation

**Description**: Using "development" conditions in exports to point to TypeScript source works for build tools but requires runtime loader support. Node.js doesn't recognize "development" condition by default, causing imports to fail or load wrong files.

**Warning Signs**:
- Works with Next.js/Vite but fails in plain Node.js scripts
- Test runners can't find modules or load wrong versions
- NestJS backend can't import workspace packages
- Different files loaded in different environments

**Prevention Strategy**:
- Use explicit --conditions=development flag when running Node.js tools: `NODE_OPTIONS="--conditions=development"`
- Or avoid conditional exports entirely; compile to single output format
- Test imports in all environments (Next.js, NestJS, tests, scripts)
- Document required Node flags in package README

**Phase Mapping**: Phase 3 (Implementation) - configure package exports carefully

**References**:
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [package.json exports and conditions](https://www.newline.co/courses/bundling-and-automation-in-monorepos/packagejson-exports-and-conditions)

---

### Pitfall 4.3: Type Declaration Colocation Errors

**Description**: When shipping dual CJS/ESM packages, type declarations must be colocated correctly (index.js with index.d.ts, index.cjs with index.d.cts). Incorrect colocation causes TypeScript to load wrong types or fail to find types entirely.

**Warning Signs**:
- TypeScript can't find types for imported modules despite .d.ts files existing
- Wrong types loaded (ESM types for CJS imports or vice versa)
- "Could not find a declaration file" errors in consuming packages
- Types work in some imports but not others

**Prevention Strategy**:
- Generate separate .d.ts and .d.cts files for each module format
- Or use single .d.ts with proper type field in exports conditions
- Validate with "Are the Types Wrong?" tool: `npx @arethetypeswrong/cli`
- Add automated check in CI to validate type exports

**Phase Mapping**: Phase 3 (Implementation) - configure when setting up package builds

**References**:
- [Dual Publishing ESM and CJS Modules with tsup and Are the Types Wrong?](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- [Building an npm package compatible with ESM and CJS in 2024 | Snyk](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/)

---

## 5. NestJS Monorepo Watch Mode

### Pitfall 5.1: NestJS Default Compiler Can't Transpile Dependencies

**Description**: NestJS's default tsc compiler cannot compile TypeScript inside monorepo dependencies out-of-the-box. Changes to workspace packages aren't picked up by NestJS watch mode without additional configuration.

**Warning Signs**:
- NestJS hot reload works for app code but not workspace packages
- Must manually restart NestJS server after changing dependency
- Frontend hot reload works but backend doesn't for shared packages
- Build succeeds but watch mode doesn't see dependency changes

**Prevention Strategy**:
- Switch to webpack-based build in nest-cli.json: `"webpack": true`
- Or configure webpack-hmr for hot module replacement
- Add workspace packages to webpack externals/transpilation config
- Use nodemon to watch dependency outputs and restart on changes

**Phase Mapping**: Phase 3 (Implementation) - configure NestJS build system

**References**:
- [NestJS Hot Reload Documentation](https://docs.nestjs.com/recipes/hot-reload)
- [NestJS Monorepo Documentation](https://docs.nestjs.com/cli/monorepo)

---

### Pitfall 5.2: Nodemon + Turbo Race Conditions

**Description**: Using nodemon to watch dependency changes while Turborepo rebuilds packages can create race conditions. Nodemon may restart the server while Turborepo is mid-build, causing imports to fail or load partial code.

**Warning Signs**:
- Intermittent server startup failures with import errors
- Server restarts multiple times for single change
- "Cannot find module" errors that resolve on second restart
- Server starts before dependencies finish rebuilding

**Prevention Strategy**:
- Configure nodemon delay to wait for builds: `"delay": "1000"`
- Watch turbo outputs (dist directories) not source files
- Use turbo watch to coordinate rebuilds before server restart
- Add health check to ensure dependencies built before server starts

**Phase Mapping**: Phase 3 (Implementation) - configure during watch mode setup

**References**:
- [Efficient Monorepo Development: Boosting Build Performance using Nx, SWC, Nodemon, & PNPM](https://medium.com/@teamforwardnetwork/efficient-monorepo-development-boosting-build-performance-using-nx-swc-nodemon-pnpm-3172ed54d146)
- [NestJS Hot Reload Documentation](https://docs.nestjs.com/recipes/hot-reload)

---

## 6. Development Experience Pitfalls

### Pitfall 6.1: Incomplete Error Messages in Watch Mode

**Description**: Turborepo watch mode shows limited error messages for invalid task configuration. When a watch task fails, the output is truncated or missing context, making debugging difficult.

**Warning Signs**:
- Watch mode fails with generic "invalid task configuration" message
- Can't determine which package or task caused the failure
- Full error only visible when running task individually
- Have to manually run `turbo <task>` to see actual error

**Prevention Strategy**:
- Always test tasks individually (`turbo build`, `turbo dev`) before using `turbo watch`
- Add verbose logging in turbo.json tasks: `"outputMode": "full"`
- Create debugging docs with common watch mode errors and solutions
- Set up structured logging in build scripts to improve error visibility

**Phase Mapping**: Phase 4 (Testing & Validation) - address during rollout

**References**:
- [Watch mode show limited error message for 'invalid task configuration' · Issue #8006](https://github.com/vercel/turborepo/issues/8006)
- [Turborepo Watch Mode Documentation](https://turborepo.dev/docs/reference/watch)

---

### Pitfall 6.2: First-Run Dependency Initialization

**Description**: Persistent tasks in watch mode don't wait for first run of their dependencies to finish before starting. Dev servers can start before required packages are built, causing runtime errors on first load.

**Warning Signs**:
- First page load after starting dev shows import errors
- Server starts but crashes immediately on first request
- Refresh fixes the errors after waiting a few seconds
- CI builds work but local dev requires specific startup order

**Prevention Strategy**:
- Run initial build before starting watch: `turbo build && turbo watch dev`
- Add readiness checks in dev servers to wait for dependencies
- Use turbo's --concurrency flag to limit parallel task starts
- Document required startup sequence in development docs

**Phase Mapping**: Phase 3 (Implementation) - design proper initialization sequence

**References**:
- [Persistent tasks in watch mode don't wait for first run of their dependencies · Issue #8673](https://github.com/vercel/turborepo/issues/8673)
- [Turborepo Watch Mode Documentation](https://turborepo.dev/docs/reference/watch)

---

### Pitfall 6.3: Declaration Map Configuration Breaks Go-to-Definition

**Description**: Incorrect declarationMap and sourceMap configuration causes "Go to Definition" in VS Code to navigate to .d.ts files instead of source .ts files, or to non-existent paths in monorepo structure.

**Warning Signs**:
- Go to Definition jumps to type declarations instead of implementation
- Editor navigation goes to wrong files or shows "file not found"
- Source maps point upwards to directories that don't exist
- Different behavior between app code and workspace packages

**Prevention Strategy**:
- Enable both declarationMap and sourceMap in all packages: `"declarationMap": true, "sourceMap": true`
- Ensure paths in tsconfig resolve correctly relative to monorepo root
- Test Go to Definition from app into workspace packages
- Use composite:true with project references if using declarationMap

**Phase Mapping**: Phase 2 (TypeScript Configuration) - configure during tsconfig setup

**References**:
- [Unclear how to use "sourceMap" or "declarationMap" in NX monorepo · Issue #11179](https://github.com/nrwl/nx/issues/11179)
- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

## Summary: Critical Decision Points by Phase

### Phase 1: Research & Feasibility
- **Turbopack vs Webpack**: Decide bundler choice for Next.js (Pitfall 1.1)
- **Watch Mode Strategy**: Determine if using turbo watch or persistent tasks (Pitfall 2.1)

### Phase 2: TypeScript Configuration
- **Project References**: Decide whether to use composite/references or direct source compilation (Pitfall 3.1, 3.2, 3.3)
- **Module Format**: Choose ESM-only vs dual CJS/ESM output (Pitfall 4.1)
- **Declaration Maps**: Configure source maps and declaration maps correctly (Pitfall 6.3)

### Phase 3: Implementation
- **transpilePackages**: List all workspace packages and test both bundlers (Pitfall 1.3)
- **Task Graph**: Configure dependsOn, persistent, interruptible correctly (Pitfall 2.1, 2.2)
- **Conditional Exports**: Set up package.json exports with proper conditions (Pitfall 4.2, 4.3)
- **NestJS Build**: Choose tsc vs webpack vs nodemon approach (Pitfall 5.1, 5.2)
- **Initialization**: Design proper startup sequence for dev mode (Pitfall 6.2)

### Phase 4: Testing & Validation
- **Cross-Package Changes**: Test that changes propagate through dependency chain
- **Error Handling**: Verify error messages are actionable in watch mode (Pitfall 6.1)
- **Developer Experience**: Ensure fresh clones work without manual intervention (Pitfall 3.3)

## Sources

- [Next.js transpilePackages Documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Turbopack does not handle transpilePackages for monorepos · Issue #85316](https://github.com/vercel/next.js/issues/85316)
- [transpilePackages Not Working Properly with Yarn Workspaces · Issue #62468](https://github.com/vercel/next.js/issues/62468)
- [With transpilePackages, how can I use local tsconfigs? · Discussion #55034](https://github.com/vercel/next.js/discussions/55034)
- [Next.js Package Bundling Guide](https://nextjs.org/docs/pages/guides/package-bundling)
- [Turborepo Watch Mode Documentation](https://turborepo.dev/docs/reference/watch)
- [Persistent tasks in watch mode don't wait for dependencies · Issue #8673](https://github.com/vercel/turborepo/issues/8673)
- [Watch-mode not rebuild dependent packages · Issue #8164](https://github.com/vercel/turborepo/issues/8164)
- [Turborepo Developing Applications Guide](https://turborepo.dev/docs/crafting-your-repository/developing-applications)
- [Turborepo watch not triggering run on root inputs change](https://community.vercel.com/t/turborepo-watch-not-triggering-run-on-root-inputs-change/10087)
- [Turborepo Caching Documentation](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [You might not need TypeScript project references](https://turborepo.dev/blog/you-might-not-need-typescript-project-references)
- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Managing TypeScript Packages in Monorepos | Nx Blog](https://nx.dev/blog/managing-ts-packages-in-monorepos)
- [Performance issue on watch incremental config when using build mode · Issue #48990](https://github.com/microsoft/TypeScript/issues/48990)
- [Build mode explicitly checks file stamps in watch mode · Issue #45082](https://github.com/microsoft/TypeScript/issues/45082)
- [Publishing dual ESM+CJS packages](https://mayank.co/blog/dual-packages/)
- [Node.js Dual Package Hazard Documentation](https://nodejs.org/api/packages.html#dual-package-hazard)
- [package.json exports and conditions](https://www.newline.co/courses/bundling-and-automation-in-monorepos/packagejson-exports-and-conditions)
- [Dual Publishing ESM and CJS Modules with tsup and Are the Types Wrong?](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- [Building an npm package compatible with ESM and CJS in 2024 | Snyk](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/)
- [NestJS Hot Reload Documentation](https://docs.nestjs.com/recipes/hot-reload)
- [NestJS Monorepo Documentation](https://docs.nestjs.com/cli/monorepo)
- [Efficient Monorepo Development: Boosting Build Performance using Nx, SWC, Nodemon, & PNPM](https://medium.com/@teamforwardnetwork/efficient-monorepo-development-boosting-build-performance-using-nx-swc-nodemon-pnpm-3172ed54d146)
- [Watch mode show limited error message for 'invalid task configuration' · Issue #8006](https://github.com/vercel/turborepo/issues/8006)
- [Unclear how to use "sourceMap" or "declarationMap" in NX monorepo · Issue #11179](https://github.com/nrwl/nx/issues/11179)
