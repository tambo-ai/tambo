# Roadmap: Tambo Skills

## Overview

The skills system is a cross-cutting feature that adds modular capability packs to Tambo agents. Skills follow the same per-request pattern as tools and components -- SDK sends skill data with each run request, no build-time registration needed. Dashboard-created skills are stored in DB and merged at runtime. Three phases deliver all 23 v1 requirements.

## Phases

- [ ] **Phase 1: Skill Definition & SDK Integration** - defineSkill() types, TamboProvider extension, DB schema for dashboard skills, CLI scaffold
- [ ] **Phase 2: Runtime Activation** - Skill router, context merge, progressive disclosure, state persistence, isolation
- [ ] **Phase 3: Dashboard** - Skill management UI for creating, editing, and toggling skills

## Phase Details

### Phase 1: Skill Definition & SDK Integration
**Goal**: Developers can define skills in code, wire them into TamboProvider, and the API can store dashboard-created skills
**Depends on**: Nothing (first phase)
**Requirements**: SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05, SKILL-06, API-02, API-04, CLI-01
**Success Criteria** (what must be TRUE):
  1. Developer can call `defineSkill()` in `@tambo-ai/client` with name, description, instructions, tools (inline or external), version, and config escape hatch, and get back a typed SkillDefinition object
  2. Developer can pass `skills` array to TamboProvider and have skill tools/components decomposed into existing registries without breaking current defineTool/TamboComponent usage
  3. Developer can include optional React components in a skill and have them available in the component registry
  4. Developer can organize a skill as a directory with skill.ts + instructions.md
  5. `tambo add skill --new <name>` scaffolds a new empty skill with boilerplate
  6. API CRUD endpoints for dashboard skills persist data as JSONB in the generic config table

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Runtime Activation
**Goal**: Agents intelligently activate relevant skills per message, with isolation, progressive disclosure, and persistent state
**Depends on**: Phase 1
**Requirements**: RUNT-01, RUNT-02, RUNT-03, RUNT-04, RUNT-05, RUNT-06, RUNT-07, RUNT-08, API-01, API-03
**Success Criteria** (what must be TRUE):
  1. SDK sends skill metadata (name, description, tool names) with every run request; API uses this plus DB-stored dashboard skills to build the full skill set
  2. Agent sees skill descriptions always, receives full content (instructions, tools, components) only for activated skills
  3. When 5 or fewer skills are active, all skills' full content is included with no routing overhead; when more than 5 are active, a Tambo-managed fast model selects relevant skills in under 500ms
  4. Skill state persists as namespaced key-value pairs on thread metadata across messages (nested structure: `skillState.<name>.<key>`)
  5. Skills only receive explicitly passed data with no ambient access, and last-wins conflict resolution applies when skills overlap
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Dashboard
**Goal**: Product people can create and manage skills from the web dashboard without writing code
**Depends on**: Phase 1 (can run in parallel with Phase 2)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Product person can enable/disable skills per project from the dashboard
  2. Product person can view skill details including instructions, tools, and components with clear source labels ("code" vs "dashboard")
  3. Product person can create an instruction-only skill entirely from the dashboard and edit its instructions later
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3
Note: Phase 3 depends only on Phase 1 and can execute in parallel with Phase 2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skill Definition & SDK Integration | 0/2 | Not started | - |
| 2. Runtime Activation | 0/2 | Not started | - |
| 3. Dashboard | 0/1 | Not started | - |
