# Phase 3: NestJS Hot Reload - Research

**Researched:** 2026-02-16
**Domain:** NestJS watch mode, webpack configuration, monorepo dependency watching
**Confidence:** HIGH

## Summary

Phase 3 enables automatic NestJS server restart when workspace dependencies (packages/core, packages/backend, packages/db) change. Research reveals three viable approaches: (1) Turborepo's built-in `turbo watch` with interruptible tasks, (2) Custom webpack configuration with node-externals allowlist, and (3) nodemon/tsx watching workspace source directories. Turborepo `turbo watch` is the recommended solution as it's dependency-aware, handles the monorepo task graph automatically, and requires minimal configuration. NestJS's default `nest start --watch` only watches the apps/api directory and treats workspace packages as external node_modules, so explicit configuration is required to trigger restarts on workspace changes.

**Primary recommendation:** Use `turbo watch dev --filter=@tambo-ai-cloud/api` with `interruptible: true` in turbo.json to automatically restart the NestJS server when workspace dependencies change. This leverages existing Turborepo infrastructure without custom webpack or file watcher configuration.

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                       | Research Support                                                                                                                     |
| ------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| NEST-01 | Editing a file in packages/core triggers apps/api server restart automatically    | Turborepo `turbo watch` with interruptible: true restarts tasks when dependency inputs change; covers all three package requirements |
| NEST-02 | Editing a file in packages/backend triggers apps/api server restart automatically | Same as NEST-01 - turbo watch is dependency-aware and monitors all workspace packages in dependency graph                            |
| NEST-03 | Editing a file in packages/db triggers apps/api server restart automatically      | Same as NEST-01 - turbo watch is dependency-aware and monitors all workspace packages in dependency graph                            |

</phase_requirements>

## Standard Stack

### Core

| Library                | Version | Purpose                                              | Why Standard                                                            |
| ---------------------- | ------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| Turborepo              | 2.8.3   | Monorepo task orchestration with built-in watch mode | Already present in monorepo, `turbo watch` available since v2.0.4       |
| NestJS CLI             | 11.0.16 | NestJS compilation and execution                     | Standard NestJS development tool, includes webpack integration          |
| webpack                | 5.104.1 | Module bundler (via NestJS CLI)                      | Bundled with @nestjs/cli, handles TypeScript compilation and hot reload |
| webpack-node-externals | 3.0.0   | External dependencies handling                       | Bundled with @nestjs/cli, prevents bundling node_modules                |

### Supporting

| Library  | Version | Purpose                              | When to Use                                                                   |
| -------- | ------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| chokidar | 5.0.0   | File system watcher                  | Already in repo root, fallback option if turbo watch insufficient             |
| tsx      | 4.21.0  | TypeScript execution with watch mode | Already in apps/api, alternative to nest CLI for simpler watch scenarios      |
| nodemon  | N/A     | Process restart on file changes      | Not currently installed, alternative if turbo watch doesn't meet requirements |

### Alternatives Considered

| Instead of  | Could Use                               | Tradeoff                                                                                   |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| turbo watch | Custom webpack config with watchOptions | More complex, requires maintaining webpack configuration, loses dependency graph awareness |
| turbo watch | nodemon watching packages/\*\*          | Simpler but less integrated with Turborepo caching and task graph                          |
| turbo watch | tsx --watch with custom file paths      | Bypasses NestJS CLI entirely, loses NestJS-specific optimizations                          |

**Installation:**
No new packages required. All tools already present in the monorepo.

## Architecture Patterns

### Recommended Configuration Structure

```
.
├── turbo.json                  # Add interruptible: true to api dev task
├── apps/api/
│   ├── nest-cli.json          # Existing NestJS CLI config
│   ├── tsconfig.json          # paths point to workspace packages
│   └── package.json           # dev script uses nest start --watch
└── packages/
    ├── core/src/              # Watched by turbo
    ├── backend/src/           # Watched by turbo
    └── db/src/                # Watched by turbo
```

### Pattern 1: Turborepo Watch with Interruptible Tasks (RECOMMENDED)

**What:** Configure turbo.json to mark the api dev task as interruptible, then use `turbo watch dev --filter=@tambo-ai-cloud/api` to automatically restart the server when workspace dependencies change.

**When to use:** When you want automatic restart on workspace dependency changes with zero custom configuration.

**Example:**

```json
// turbo.json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@tambo-ai-cloud/api#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true,
      "interruptible": true, // NEW: Allow turbo watch to restart this task
      "inputs": [
        "$TURBO_DEFAULT$",
        "../../packages/core/src/**",
        "../../packages/backend/src/**",
        "../../packages/db/src/**"
      ]
    }
  }
}
```

```bash
# Run with turbo watch instead of turbo dev
turbo watch dev --filter=@tambo-ai-cloud/api
```

**Source:** [Turborepo watch mode documentation](https://turborepo.dev/docs/reference/watch)

### Pattern 2: Custom Webpack Configuration with Allowlist

**What:** Create a custom webpack-hmr.config.js that allowlists workspace packages so webpack watches and recompiles them instead of treating them as external node_modules.

**When to use:** When turbo watch doesn't provide sufficient control over watch behavior or if you need webpack-specific HMR features.

**Example:**

```javascript
// apps/api/webpack-hmr.config.js
const nodeExternals = require("webpack-node-externals");
const { RunScriptWebpackPlugin } = require("run-script-webpack-plugin");

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ["webpack/hot/poll?100", options.entry],
    externals: [
      nodeExternals({
        allowlist: [
          "webpack/hot/poll?100",
          // Allowlist workspace packages so webpack watches them
          "@tambo-ai-cloud/core",
          "@tambo-ai-cloud/backend",
          "@tambo-ai-cloud/db",
        ],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
      }),
    ],
  };
};
```

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "nest build --watch --webpack --webpackPath webpack-hmr.config.js"
  }
}
```

**Source:** [NestJS Hot Reload Recipe](https://docs.nestjs.com/recipes/hot-reload) via Context7

**Warning:** This approach bundles workspace packages into the output, increasing build time. Only use if turbo watch is insufficient.

### Pattern 3: Nodemon Watching Workspace Packages

**What:** Use nodemon to watch both apps/api and workspace package directories, restarting the NestJS server when any watched file changes.

**When to use:** When you need fine-grained control over which files trigger restarts and want a simple, well-understood file watcher.

**Example:**

```json
// apps/api/nodemon.json
{
  "watch": [
    "src",
    "../../packages/core/src",
    "../../packages/backend/src",
    "../../packages/db/src"
  ],
  "ext": "ts",
  "ignore": ["**/*.test.ts", "**/*.spec.ts", "node_modules"],
  "exec": "nest start"
}
```

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "nodemon"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

**Source:** [Nodemon TypeScript configuration](https://blog.logrocket.com/configuring-nodemon-typescript/)

**Warning:** Requires installing nodemon. Doesn't integrate with Turborepo's task graph or caching.

### Pattern 4: TSX Watch (Lightweight Alternative)

**What:** Use tsx's built-in watch mode to watch workspace packages and restart the server. Simpler than webpack but bypasses NestJS CLI.

**When to use:** When you want the absolute simplest watch setup and don't need NestJS CLI features.

**Example:**

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "tsx watch --clear-screen=false src/main.ts"
  }
}
```

For watching additional directories with tsx, create a custom wrapper script that uses chokidar to trigger tsx restarts.

**Source:** [tsx vs ts-node comparison](https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-ts-node/)

**Warning:** Bypasses NestJS CLI optimizations, plugins, and configuration. Not recommended unless you're having issues with nest CLI.

### Anti-Patterns to Avoid

- **Manually watching node_modules symlinks**: Workspace packages appear as symlinks in node_modules but watching symlinks is unreliable across platforms
- **Using --turbo flag in development**: Similar to Phase 2, but NestJS doesn't have Turbopack, this refers to turborepo watch feature
- **Omitting dependsOn: ["^build"]**: Dev task must wait for initial builds to complete or server will fail to start
- **Not marking task as interruptible**: Without interruptible: true, turbo watch will treat the persistent task as long-running and won't restart it

## Don't Hand-Roll

| Problem                                      | Don't Build                                    | Use Instead                                  | Why                                                                        |
| -------------------------------------------- | ---------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| File watching in monorepo                    | Custom chokidar scripts watching packages/\*\* | Turborepo `turbo watch`                      | Turbo is dependency-aware, handles task graph, integrated with cache       |
| Webpack configuration for workspace packages | Custom webpack config from scratch             | NestJS CLI with custom webpack-hmr.config.js | NestJS CLI provides sensible defaults, plugins, and TypeScript integration |
| Process restart on file change               | Custom child_process spawn/kill logic          | RunScriptWebpackPlugin or nodemon            | Battle-tested, handles edge cases (SIGTERM, cleanup, debouncing)           |
| Watching TypeScript paths                    | Manually resolving tsconfig paths to watch     | Use webpack's tsconfig-paths-webpack-plugin  | Already integrated in NestJS CLI webpack config                            |

**Key insight:** The problem isn't "how to watch files" (solved by chokidar) but "how to watch workspace dependencies in a monorepo task graph." Turborepo's `turbo watch` solves this at the orchestration layer, making file-level watchers unnecessary.

## Common Pitfalls

### Pitfall 1: nest start --watch Doesn't Detect Workspace Changes

**What goes wrong:** Editing a file in packages/core doesn't trigger apps/api restart. NestJS CLI only watches the apps/api directory.

**Why it happens:** NestJS CLI's default watch mode uses webpack with nodeExternals(), which treats all node_modules (including workspace symlinks) as external. Webpack doesn't watch external dependencies.

**How to avoid:** Use one of three solutions:

1. **Turborepo watch** (recommended): `turbo watch dev --filter=@tambo-ai-cloud/api` with `interruptible: true`
2. **Webpack allowlist**: Add workspace packages to nodeExternals allowlist in custom webpack config
3. **Nodemon**: Configure nodemon to watch workspace package directories

**Warning signs:**

- Editing packages/core/src/foo.ts doesn't restart api server
- Console shows "Starting compilation" only when editing apps/api/src/ files
- TypeScript errors appear but server doesn't restart

**Source:** [NestJS CLI watch mode](https://docs.nestjs.com/cli/overview) and [webpack-node-externals documentation](https://www.npmjs.com/package/webpack-node-externals)

### Pitfall 2: Infinite Restart Loop

**What goes wrong:** Server restarts continuously every few seconds even when no files are being edited.

**Why it happens:**

- Watching output directories (dist/) causes restarts when webpack writes compiled files
- Watching .js and .d.ts files generated during compilation
- File system polling issues on Windows/WSL

**How to avoid:**

- Use webpack's WatchIgnorePlugin to ignore compiled files: `paths: [/\.js$/, /\.d\.ts$/]`
- Exclude dist/, .next/, and coverage/ from watch paths
- For turbo watch, ensure outputs are listed in turbo.json outputs field

**Warning signs:**

- Terminal shows continuous "Restarting..." messages
- Server never fully starts before restarting again
- High CPU usage from file system polling

**Source:** [NestJS watch mode loops endlessly issue](https://github.com/nestjs/nest/issues/11038)

### Pitfall 3: Slow Restart Times (>2s)

**What goes wrong:** Server takes >2 seconds to restart after workspace package changes, missing the success criteria.

**Why it happens:**

- Webpack rebundles workspace packages instead of using pre-built outputs
- TypeScript recompilation of workspace packages on every change
- Large node_modules causing slow webpack externals processing

**How to avoid:**

- Ensure Phase 1 is complete: workspace packages export source TS and declarationMap is enabled
- Use turbo watch which leverages existing built outputs
- If using webpack allowlist, ensure workspace packages are built (dependsOn: ["^build"])
- Consider tsx watch for sub-500ms restarts if NestJS CLI is bottleneck

**Warning signs:**

- Restart takes 3-5+ seconds
- Console shows "Compiling..." for workspace packages
- Webpack output shows bundling workspace package source

**Source:** [tsx vs ts-node performance comparison](https://medium.com/modernnerd-code/tsx-vs-ts-node-and-nodemon-0ec60d21c5e1)

### Pitfall 4: Missing Type Updates After Workspace Changes

**What goes wrong:** Editing a TypeScript type in packages/core doesn't update type checking in apps/api until manual restart.

**Why it happens:**

- Watch mode uses transpileOnly: true for speed, skipping type checking
- Type checking only runs at build time, not during watch
- IDE and terminal TypeScript servers are out of sync

**How to avoid:**

- Accept that type errors won't appear in watch mode console (this is expected behavior)
- Rely on IDE type checking with declarationMap from Phase 1
- Run `npm run check-types` before commits to catch type errors
- Use fork-ts-checker-webpack-plugin if you need type checking in watch mode (slower)

**Warning signs:**

- IDE shows type errors but server still runs
- Type errors only appear after killing and restarting server
- Confusion about whether type errors are "real"

**Source:** [NestJS webpack defaults](https://github.com/nestjs/nest-cli/blob/master/lib/compiler/defaults/webpack-defaults.ts) - transpileOnly: true by default

## Code Examples

Verified patterns from official sources:

### Turborepo Watch Configuration (RECOMMENDED)

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "@tambo-ai-cloud/api#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true,
      "interruptible": true,
      "inputs": [
        "$TURBO_DEFAULT$",
        "../../packages/core/src/**",
        "../../packages/backend/src/**",
        "../../packages/db/src/**"
      ]
    }
  }
}
```

```json
// package.json (root)
{
  "scripts": {
    "dev:api": "turbo watch dev --filter=@tambo-ai-cloud/api"
  }
}
```

**Source:** [Turborepo watch documentation](https://turborepo.dev/docs/reference/watch)

### Custom Webpack HMR Configuration

```javascript
// apps/api/webpack-hmr.config.js
const nodeExternals = require("webpack-node-externals");
const { RunScriptWebpackPlugin } = require("run-script-webpack-plugin");

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ["webpack/hot/poll?100", options.entry],
    externals: [
      nodeExternals({
        allowlist: [
          "webpack/hot/poll?100",
          "@tambo-ai-cloud/core",
          "@tambo-ai-cloud/backend",
          "@tambo-ai-cloud/db",
        ],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
      }),
    ],
  };
};
```

```json
// apps/api/package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--experimental-require-module --trace-warnings' nest build --watch --webpack --webpackPath webpack-hmr.config.js"
  }
}
```

**Source:** [NestJS Hot Reload Recipe](https://docs.nestjs.com/recipes/hot-reload) via Context7 /nestjs/docs.nestjs.com

### Nodemon Configuration for Monorepo

```json
// apps/api/nodemon.json
{
  "watch": [
    "src",
    "../../packages/core/src",
    "../../packages/backend/src",
    "../../packages/db/src"
  ],
  "ext": "ts,json",
  "ignore": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**",
    "**/dist/**"
  ],
  "exec": "NODE_OPTIONS='--experimental-require-module --trace-warnings' nest start",
  "delay": 500
}
```

**Source:** [Nodemon TypeScript configuration guide](https://blog.logrocket.com/configuring-nodemon-typescript/)

### Existing NestJS CLI Configuration (Reference)

```json
// apps/api/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "entryFile": "apps/api/src/main",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": ["@nestjs/swagger"]
  }
}
```

No changes needed to nest-cli.json for turbo watch approach.

**Source:** Current repo configuration

## State of the Art

| Old Approach                    | Current Approach          | When Changed          | Impact                                                          |
| ------------------------------- | ------------------------- | --------------------- | --------------------------------------------------------------- |
| nodemon + ts-node               | tsx --watch               | 2024-2025             | 10-20x faster compilation (20ms vs 500ms+)                      |
| Manual webpack config for watch | NestJS CLI built-in watch | NestJS 7+ (2020)      | Simplified configuration, integrated with CLI                   |
| ts-node-dev                     | tsx or NestJS CLI watch   | 2024                  | ts-node-dev maintenance issues, tsx is faster and more reliable |
| Custom monorepo watch scripts   | Turborepo turbo watch     | Turborepo 2.0+ (2024) | Dependency-aware watching, integrated with task graph           |

**Deprecated/outdated:**

- **ts-node-dev**: Maintenance issues, unreliable for production use. Use tsx or NestJS CLI instead.
- **Manual bash scripts for watching**: Replaced by Turborepo `turbo watch` with dependency awareness
- **Webpack watch without HMR**: Basic watch mode slower than HMR setup with RunScriptWebpackPlugin

## Open Questions

1. **Does turbo watch work reliably with NestJS persistent tasks?**
   - What we know: turbo watch supports interruptible: true for persistent tasks since v2.0.4
   - What's unclear: Whether NestJS CLI's webpack watch mode plays well with SIGTERM signals from turbo watch
   - Recommendation: Test in implementation; if issues arise, fall back to nodemon or custom webpack config

2. **Should we use HMR or full restart for NestJS?**
   - What we know: HMR with webpack can reload modules without full restart, faster iteration
   - What's unclear: Whether NestJS decorators and dependency injection properly reinitialize with HMR
   - Recommendation: Start with turbo watch (full restart), add HMR only if restart time exceeds 2s requirement

3. **Do we need to watch declarationMap outputs (.d.ts.map files)?**
   - What we know: Phase 1 enables declarationMap for IDE navigation
   - What's unclear: Whether changes to .d.ts.map files should trigger restart
   - Recommendation: No, .d.ts.map files are for IDE only. Use WatchIgnorePlugin to ignore them.

## Sources

### Primary (HIGH confidence)

- [Turborepo watch mode](https://turborepo.dev/docs/reference/watch) - Official Turborepo documentation
- [NestJS Hot Reload Recipe](https://docs.nestjs.com/recipes/hot-reload) - Context7 library /nestjs/docs.nestjs.com
- [webpack-node-externals package](https://www.npmjs.com/package/webpack-node-externals) - Official npm package documentation
- [NestJS CLI monorepo documentation](https://docs.nestjs.com/cli/monorepo) - Official NestJS documentation

### Secondary (MEDIUM confidence)

- [Turborepo watch GitHub issue](https://github.com/vercel/turborepo/issues/8164) - Community discussion on watch-mode dependencies
- [NestJS watch mode endless loop issue](https://github.com/nestjs/nest/issues/11038) - Known pitfall documentation
- [nodemon workspace packages issue](https://github.com/remy/nodemon/issues/1798) - Monorepo watch configuration patterns
- [tsx vs ts-node performance](https://medium.com/modernnerd-code/tsx-vs-ts-node-and-nodemon-0ec60d21c5e1) - Community benchmarks

### Tertiary (LOW confidence)

- [chokidar TypeScript wrapper](https://github.com/poppinss/chokidar-ts) - Alternative watch solution (not needed for recommended approach)
- [Turborepo prepare tasks blog](https://www.luisball.com/blog/turborepo-prepare-tasks) - Community patterns for dev pipelines

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All tools verified present in current monorepo package.json/turbo.json
- Architecture: HIGH - Turborepo watch documented officially, webpack config patterns from NestJS docs
- Pitfalls: HIGH - Sourced from GitHub issues with clear reproduction cases

**Research date:** 2026-02-16
**Valid until:** Estimated 60 days (Turborepo and NestJS are stable, but watch mode features can evolve)
