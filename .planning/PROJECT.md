# Monorepo Hot Reload DX

## What This Is

A developer experience enhancement for the Tambo AI monorepo that enables instant hot reload across workspace packages. Edit any file in react-sdk, packages/core, packages/db, or packages/backend and see changes reflected in apps/web or apps/api within 1-2 seconds without manual rebuilds.

## Core Value

Edit a file in any workspace package, see the change in consuming apps within seconds.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] TURBO-01: Package dev tasks run in watch mode alongside consuming app dev tasks
- [ ] TURBO-02: `turbo dev` with filters automatically starts watch tasks for depended-upon packages
- [ ] TURBO-03: Initial package build completes before dev servers start accepting requests
- [ ] NEXT-01: All workspace packages listed in `transpilePackages` in Next.js config
- [ ] NEXT-02: Editing a file in react-sdk triggers HMR in apps/web without manual rebuild
- [ ] NEXT-03: Editing a file in packages/core triggers HMR in apps/web without manual rebuild
- [ ] NEXT-04: Next.js dev uses webpack mode (not Turbopack) to support transpilePackages
- [ ] NEST-01: Editing a file in packages/core triggers apps/api server restart automatically
- [ ] NEST-02: Editing a file in packages/backend triggers apps/api server restart automatically
- [ ] NEST-03: Editing a file in packages/db triggers apps/api server restart automatically
- [ ] DX-01: Convenience npm scripts in root package.json for common turbo dev filter combos
- [ ] DX-02: Go-to-definition in IDE navigates to source .ts files in workspace packages (declaration maps)

### Out of Scope

- Changing published package format — dist/esm dual output stays for npm consumers
- CI/CD pipeline changes — Purely local DX improvement
- TypeScript project references — Research showed maintenance overhead outweighs benefits
- `turbo watch` (experimental) — Persistent dev tasks are more mature and battle-tested
- Turbopack support — Incompatible with transpilePackages until Next.js fixes upstream issue #85316

## Context

The Tambo monorepo uses Turborepo with Next.js 15 (apps/web, showcase, docs) and NestJS (apps/api). Currently developers must manually rebuild packages when making changes, leading to slow feedback loops (10-30 seconds).

Research shows the 2026 standard combines Next.js `transpilePackages`, Turborepo persistent tasks with `dependsOn: ["^build"]`, and TypeScript watch mode. The challenge is not configuration complexity but understanding that persistent tasks cannot depend on other persistent tasks.

The current Tambo setup already follows most best practices. Minor configuration tweaks will enable full hot reload without architectural changes.

## Constraints

- **Tech stack**: Must use existing Turborepo + Next.js 15 + NestJS setup
- **Compatibility**: Cannot break existing `npm run dev:cloud` and `npm run dev` scripts
- **Production parity**: Development build process should test same artifacts that ship to production (dual CJS/ESM)
- **No breaking changes**: Published packages (react-sdk, cli) must maintain current export formats
- **Bundler limitation**: Turbopack doesn't support `transpilePackages` for monorepos (Next.js issue #85316), must use webpack mode

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use webpack mode, not Turbopack | Turbopack doesn't respect transpilePackages for monorepos | — Pending |
| Avoid TypeScript project references | Maintenance overhead outweighs benefits per research | — Pending |
| Internal packages export source | Enables Next.js transpilation, faster hot reload | — Pending |

---
*Last updated: 2026-02-16 after roadmap creation*
