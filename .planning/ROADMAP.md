# Roadmap: Tambo Skills

## Overview

The skills system is a cross-cutting feature that adds modular capability packs to Tambo agents. The roadmap follows the dependency chain: types and storage first (everything depends on SkillDefinition and API endpoints), then registration pipelines (CLI push + SDK provider), then runtime activation (router, context merge, state), with dashboard running in parallel once API endpoints exist. Four phases deliver all 25 v1 requirements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Skill Definition & Storage** - defineSkill() API, DB schema, and CRUD endpoints
- [ ] **Phase 2: Registration Pipeline** - SDK provider integration and CLI commands
- [ ] **Phase 3: Runtime Activation** - Skill router, context merge, state persistence, and isolation
- [ ] **Phase 4: Dashboard** - Skill management UI for creating, editing, and toggling skills

## Phase Details

### Phase 1: Skill Definition & Storage
**Goal**: Developers can define skills in code and the API can store/retrieve them
**Depends on**: Nothing (first phase)
**Requirements**: SKILL-01, SKILL-04, SKILL-05, SKILL-06, API-01, API-02, API-03, API-04
**Success Criteria** (what must be TRUE):
  1. Developer can call `defineSkill()` in `@tambo-ai/client` with name, description, instructions, tools (inline or external), version, and config escape hatch, and get back a typed SkillDefinition object
  2. Developer can organize a skill as a directory with skill.ts + instructions.md and have it recognized by the system
  3. API accepts skill definitions via CRUD endpoints (`/projects/:id/skills`) and persists them as JSONB in the generic config table
  4. API correctly merges dashboard-created and code-registered skills with the same name (both active, treated as separate by source label)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Registration Pipeline
**Goal**: Developers can wire skills into their app and push them to Tambo Cloud
**Depends on**: Phase 1
**Requirements**: SKILL-02, SKILL-03, CLI-01, CLI-02, CLI-03
**Success Criteria** (what must be TRUE):
  1. Developer can pass a `skills` array to TamboProvider and have skill tools/components decomposed into existing registries without breaking current defineTool/TamboComponent usage
  2. Developer can include optional React components in a skill and have them available in the component registry
  3. `tambo skills push` serializes local skill definitions and uploads them to Tambo Cloud, with the API storing them for runtime reference
  4. `tambo add skill <github-repo>` clones skill files from a GitHub repo into the developer's project (shadcn-style)
  5. `tambo add skill --new <name>` scaffolds a new empty skill with boilerplate
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Runtime Activation
**Goal**: Agents intelligently activate relevant skills per message and skills operate in isolation with persistent state
**Depends on**: Phase 2
**Requirements**: RUNT-01, RUNT-02, RUNT-03, RUNT-04, RUNT-05, RUNT-06, RUNT-07, RUNT-08
**Success Criteria** (what must be TRUE):
  1. Agent sees skill names and descriptions on every request, and receives full content (instructions, tools, components) only for activated skills
  2. When 5 or fewer skills are active, all skills' full content is included with no routing overhead; when more than 5 are active, a Tambo-managed fast model selects relevant skills in under 500ms
  3. Skill state persists as namespaced key-value pairs on thread metadata across messages (nested structure: `skillState.<name>.<key>`)
  4. Skills only receive explicitly passed data (message, declared state, declared resources) with no ambient access, and last-wins conflict resolution applies when skills overlap
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Dashboard
**Goal**: Product people can create and manage skills from the web dashboard without writing code
**Depends on**: Phase 1 (can run in parallel with Phase 3)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Product person can enable/disable skills per project from the dashboard
  2. Product person can view skill details including instructions, tools, and components with clear source labels ("code" vs "dashboard")
  3. Product person can create an instruction-only skill entirely from the dashboard and edit its instructions later
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
Note: Phase 4 depends only on Phase 1 and can execute in parallel with Phase 3.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skill Definition & Storage | 0/2 | Not started | - |
| 2. Registration Pipeline | 0/2 | Not started | - |
| 3. Runtime Activation | 0/2 | Not started | - |
| 4. Dashboard | 0/1 | Not started | - |
