# Milestones

## v1.0 Monorepo Hot Reload DX (Shipped: 2026-02-17)

**Phases completed:** 4 phases, 4 plans, 7 tasks
**Timeline:** 2026-02-17 (single session)
**Files modified:** 6 (excluding .planning/)

**Key accomplishments:**

- Configured transpilePackages for all Next.js apps (web, showcase, docs) enabling instant HMR from workspace packages
- Switched docs from Turbopack to webpack mode to support transpilePackages
- Added turbo watch with interruptible NestJS dev task and workspace input globs for auto-restart
- Updated dev:cloud scripts to use `turbo watch dev` for file-change detection
- Added dev:showcase convenience script
- Documented hot reload architecture in CONTRIBUTING.md and AGENTS.md

**Key decisions:**

- Webpack over Turbopack (Turbopack incompatible with transpilePackages for monorepos)
- turbo watch over native NestJS --watch (NestJS uses nodeExternals, misses workspace deps)
- No TypeScript project references (maintenance overhead outweighs benefits)

---
