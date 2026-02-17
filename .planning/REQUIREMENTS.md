# Requirements: Monorepo Hot Reload DX

**Defined:** 2026-02-16
**Core Value:** Edit a file in any workspace package, see the change in consuming apps within seconds

## v1 Requirements

### Turborepo Task Wiring

- [ ] **TURBO-01**: Package dev tasks run in watch mode alongside consuming app dev tasks
- [ ] **TURBO-02**: `turbo dev -F @tambo-ai-cloud/web -F @tambo-ai-cloud/api` automatically starts watch tasks for depended-upon packages
- [ ] **TURBO-03**: Initial package build completes before dev servers start accepting requests

### Next.js Hot Reload

- [ ] **NEXT-01**: All workspace packages listed in `transpilePackages` in Next.js config
- [ ] **NEXT-02**: Editing a file in react-sdk triggers HMR in apps/web without manual rebuild
- [ ] **NEXT-03**: Editing a file in packages/core triggers HMR in apps/web without manual rebuild
- [ ] **NEXT-04**: Next.js dev uses webpack mode (not Turbopack) to support transpilePackages

### NestJS Hot Reload

- [ ] **NEST-01**: Editing a file in packages/core triggers apps/api server restart automatically
- [ ] **NEST-02**: Editing a file in packages/backend triggers apps/api server restart automatically
- [ ] **NEST-03**: Editing a file in packages/db triggers apps/api server restart automatically

### Developer Convenience

- [ ] **DX-01**: Convenience npm scripts in root package.json for common turbo dev filter combos
- [ ] **DX-02**: Go-to-definition in IDE navigates to source .ts files in workspace packages (declaration maps)

## v2 Requirements

### Advanced Hot Reload

- **ADV-01**: Turbopack support for transpilePackages when available upstream
- **ADV-02**: Webpack HMR for NestJS (faster than full restart)
- **ADV-03**: Auto-generated transpilePackages list from workspace config

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing published package format | dist/esm dual output stays for npm consumers |
| CI/CD pipeline changes | Purely local DX improvement |
| TypeScript project references | Research showed maintenance overhead outweighs benefits |
| `turbo watch` (experimental) | Persistent dev tasks are more mature and battle-tested |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TURBO-01 | Phase 4 | Pending |
| TURBO-02 | Phase 4 | Pending |
| TURBO-03 | Phase 1 | Pending |
| NEXT-01 | Phase 2 | Pending |
| NEXT-02 | Phase 2 | Pending |
| NEXT-03 | Phase 2 | Pending |
| NEXT-04 | Phase 1 | Pending |
| NEST-01 | Phase 3 | Pending |
| NEST-02 | Phase 3 | Pending |
| NEST-03 | Phase 3 | Pending |
| DX-01 | Phase 4 | Pending |
| DX-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after roadmap creation*
