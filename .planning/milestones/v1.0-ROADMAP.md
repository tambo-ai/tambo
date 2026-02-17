# Roadmap: Monorepo Hot Reload DX

## Overview

This roadmap transforms the Tambo monorepo developer experience from manual package rebuilds to instant hot reload. We start by auditing current configuration and choosing the right bundler, configure internal packages to export source TypeScript for Next.js transpilation, enable hot reload for web apps, add automatic restart for the NestJS API server, and finish with Turborepo orchestration refinements and convenience scripts. The result: edit any workspace package file and see changes in consuming apps within 1-2 seconds.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation Setup** - Audit config, choose bundler, prepare package exports (completed 2026-02-17)
- [x] **Phase 2: Next.js Hot Reload** - Enable HMR for apps/web, showcase, docs (completed 2026-02-17)
- [x] **Phase 3: NestJS Hot Reload** - Enable auto-restart for apps/api (completed 2026-02-17)
- [x] **Phase 4: Refinement & Validation** - Orchestration polish, convenience scripts, testing (completed 2026-02-17)

## Phase Details

### Phase 1: Foundation Setup

**Goal**: Establish configuration baseline and prepare packages for hot reload
**Depends on**: Nothing (first phase)
**Requirements**: TURBO-03, NEXT-04, DX-02
**Success Criteria** (what must be TRUE):

1. Decision documented on webpack vs Turbopack bundler choice with rationale
2. All internal packages (core, db, backend) have correct package.json exports configuration
3. TypeScript declaration maps enabled so IDE go-to-definition navigates to source files
4. Initial package builds complete before dev servers start accepting requests
   **Plans:** 1/1 plans complete
   Plans:

- [ ] 01-01-PLAN.md — Configure transpilePackages, remove Turbopack, verify declarationMap and build ordering

### Phase 2: Next.js Hot Reload

**Goal**: Enable instant hot reload for Next.js applications when workspace packages change
**Depends on**: Phase 1
**Requirements**: NEXT-01, NEXT-02, NEXT-03
**Success Criteria** (what must be TRUE):

1. Editing a file in react-sdk triggers HMR in apps/web without manual rebuild (1-2s feedback)
2. Editing a file in packages/core triggers HMR in apps/web without full page refresh
3. All internal workspace packages listed in transpilePackages configuration
4. Changes propagate through dependency chain (core → react-sdk → apps/web)
   **Plans:** 1/1 plans complete
   Plans:
   - [ ] 02-01-PLAN.md — Add workspace packages to transpilePackages in showcase and docs

### Phase 3: NestJS Hot Reload

**Goal**: Enable automatic server restart when workspace dependencies change
**Depends on**: Phase 1
**Requirements**: NEST-01, NEST-02, NEST-03
**Success Criteria** (what must be TRUE):

1. Editing a file in packages/core triggers apps/api server restart automatically (under 2s)
2. Editing a file in packages/backend triggers apps/api server restart automatically
3. Editing a file in packages/db triggers apps/api server restart automatically
4. Server restarts preserve terminal output and show clear rebuild status
   **Plans:** 1/1 plans complete
   Plans:
   - [ ] 03-01-PLAN.md — Configure turbo watch with interruptible api dev task and workspace inputs

### Phase 4: Refinement & Validation

**Goal**: Optimize Turborepo orchestration and validate end-to-end hot reload workflows
**Depends on**: Phase 2, Phase 3
**Requirements**: TURBO-01, TURBO-02, DX-01
**Success Criteria** (what must be TRUE):

1. Package dev tasks run in watch mode alongside consuming app dev tasks
2. Running `turbo dev -F @tambo-ai-cloud/web -F @tambo-ai-cloud/api` automatically starts watch tasks for dependencies
3. Convenience scripts exist for common workflows (dev:cloud already exists, verify it works)
4. End-to-end test scenarios documented and verified working
5. CONTRIBUTING.md and AGENTS.md updated with new developer workflows
   **Plans:** 1/1 plans complete
   Plans:
   - [ ] 04-01-PLAN.md — Verify orchestration, add convenience scripts, update docs

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase                      | Plans Complete | Status   | Completed  |
| -------------------------- | -------------- | -------- | ---------- |
| 1. Foundation Setup        | 0/1            | Complete | 2026-02-17 |
| 2. Next.js Hot Reload      | 0/1            | Complete | 2026-02-17 |
| 3. NestJS Hot Reload       | 0/TBD          | Complete | 2026-02-17 |
| 4. Refinement & Validation | 0/TBD          | Complete | 2026-02-17 |
