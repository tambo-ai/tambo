# Monorepo Hot Reload DX

## What This Is

A developer experience enhancement for the Tambo AI monorepo that enables instant hot reload across workspace packages. Edit any file in react-sdk, packages/core, packages/db, or packages/backend and see changes reflected in apps/web or apps/api within 1-2 seconds without manual rebuilds.

## Core Value

Edit a file in any workspace package, see the change in consuming apps within seconds.

## Requirements

### Validated

- ✓ TURBO-01: Package dev tasks run in watch mode alongside consuming app dev tasks — v1.0
- ✓ TURBO-02: `turbo dev` with filters automatically starts watch tasks for depended-upon packages — v1.0
- ✓ TURBO-03: Initial package build completes before dev servers start accepting requests — v1.0
- ✓ NEXT-01: All workspace packages listed in `transpilePackages` in Next.js config — v1.0
- ✓ NEXT-02: Editing a file in react-sdk triggers HMR in apps/web without manual rebuild — v1.0
- ✓ NEXT-03: Editing a file in packages/core triggers HMR in apps/web without manual rebuild — v1.0
- ✓ NEXT-04: Next.js dev uses webpack mode (not Turbopack) to support transpilePackages — v1.0
- ✓ NEST-01: Editing a file in packages/core triggers apps/api server restart automatically — v1.0
- ✓ NEST-02: Editing a file in packages/backend triggers apps/api server restart automatically — v1.0
- ✓ NEST-03: Editing a file in packages/db triggers apps/api server restart automatically — v1.0
- ✓ DX-01: Convenience npm scripts in root package.json for common turbo dev filter combos — v1.0
- ✓ DX-02: Go-to-definition in IDE navigates to source .ts files in workspace packages (declaration maps) — v1.0

### Active

(None — v1.0 complete)

### Out of Scope

- Changing published package format — dist/esm dual output stays for npm consumers
- CI/CD pipeline changes — Purely local DX improvement
- TypeScript project references — Research showed maintenance overhead outweighs benefits
- Turbopack support — Incompatible with transpilePackages until Next.js fixes upstream issue #85316

## Context

Shipped v1.0 with minimal configuration changes (6 files modified). Tech stack: Turborepo + Next.js 15 + NestJS on existing monorepo. The key insight was that transpilePackages + turbo watch covers all hot reload needs without architectural changes.

## Constraints

- **Tech stack**: Must use existing Turborepo + Next.js 15 + NestJS setup
- **Compatibility**: Cannot break existing `npm run dev:cloud` and `npm run dev` scripts
- **Production parity**: Development build process should test same artifacts that ship to production (dual CJS/ESM)
- **No breaking changes**: Published packages (react-sdk, cli) must maintain current export formats
- **Bundler limitation**: Turbopack doesn't support `transpilePackages` for monorepos (Next.js issue #85316), must use webpack mode

## Key Decisions

| Decision                            | Rationale                                                       | Outcome |
| ----------------------------------- | --------------------------------------------------------------- | ------- |
| Use webpack mode, not Turbopack     | Turbopack doesn't respect transpilePackages for monorepos       | ✓ Good  |
| Avoid TypeScript project references | Maintenance overhead outweighs benefits per research            | ✓ Good  |
| Internal packages export source     | Enables Next.js transpilation, faster hot reload                | ✓ Good  |
| turbo watch for NestJS restart      | Native NestJS --watch uses nodeExternals, misses workspace deps | ✓ Good  |

---

_Last updated: 2026-02-17 after v1.0 milestone_
