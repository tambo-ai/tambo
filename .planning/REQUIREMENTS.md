# Requirements: Tambo Skills

**Defined:** 2026-03-23
**Core Value:** Developers can give their Tambo agents specialized capabilities without wiring everything manually, and agents intelligently pick which capabilities to use per message.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Skill Definition (SDK)

- [ ] **SKILL-01**: Developer can create a skill using `defineSkill()` with name, description, instructions, tools, and version field
- [ ] **SKILL-02**: Developer can pass skills array to TamboProvider, extending existing TamboRegistryProvider
- [ ] **SKILL-03**: Developer can include optional React components in a skill that are explicitly opted in by the consumer
- [ ] **SKILL-04**: Developer can define tools inline within a skill OR reference externally defined tools
- [ ] **SKILL-05**: Developer can organize a skill as a directory (skill.ts + instructions.md) following a convention
- [ ] **SKILL-06**: `defineSkill()` includes an extensible config escape hatch for future properties without breaking changes

### Runtime Activation

- [ ] **RUNT-01**: SDK sends skill metadata (name, description, tool names) with every run request
- [ ] **RUNT-02**: Agent receives full skill content (instructions, tools, components) only for activated skills
- [ ] **RUNT-03**: When <=5 skills are active, all skills' full content is sent (no routing overhead)
- [ ] **RUNT-04**: When >5 skills are active, Tambo-managed fast model selects relevant skills before main request
- [ ] **RUNT-05**: Skill state persists as namespaced key-value pairs on thread metadata across messages
- [ ] **RUNT-06**: Skills operate within architectural isolation: API boundary, scoped context, pure tool functions
- [ ] **RUNT-07**: Skills only receive explicitly passed data (message, declared state, declared resources)
- [ ] **RUNT-08**: Last-wins conflict resolution when skills overlap

### API & Storage

- [ ] **API-01**: API receives skill metadata per-request from SDK and uses it for routing decisions
- [ ] **API-02**: Dashboard-created skills stored in generic project config table with type='skill' rows
- [ ] **API-03**: API merges per-request code skills and DB-stored dashboard skills at runtime (both active, treated as separate)
- [ ] **API-04**: CRUD endpoints for dashboard skill management (create, read, update, delete, list)

### Dashboard

- [ ] **DASH-01**: Product person can enable/disable skills per project from dashboard
- [ ] **DASH-02**: Product person can view skill details (instructions, tools, components)
- [ ] **DASH-03**: Product person can create instruction-only skills entirely from dashboard
- [ ] **DASH-04**: Product person can edit skill instructions from dashboard

### CLI

- [ ] **CLI-01**: `tambo add skill --new <name>` scaffolds a new empty skill with boilerplate

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Workflow Skills

- **WKFL-01**: Skill can define explicit step sequences (tool call + UI render per step)
- **WKFL-02**: Agent follows step playbook for complex skills, freestyles for simple skills
- **WKFL-03**: Each workflow step can render a component for user confirmation/interaction

### UX Enhancements

- **UX-01**: Typing / in message input opens skill picker menu
- **UX-02**: Slash commands mapped to specific skills for direct invocation

### Distribution & Marketplace

- **DIST-01**: `tambo add skill <github-repo>` clones skill from GitHub into project
- **DIST-02**: Browse/search available skills from CLI or dashboard
- **DIST-03**: Build-time registration via `tambo skills push` for large skill catalogs

### Advanced Execution

- **EXEC-01**: Tambo Cloud serverless execution for skill tools (server-side tool running)
- **EXEC-02**: Skill versioning and migration support
- **EXEC-03**: Cross-thread skill state (state shared across threads in a project)

## Out of Scope

| Feature | Reason |
|---------|--------|
| npm registry for marketplace | Too much infrastructure. Defer marketplace entirely for v1. |
| Runtime sandboxing (iframe/Worker) | Not framework-agnostic. Architectural isolation provides meaningful security. |
| Tambo-hosted MCP servers | MCP and skills are separate concerns. Skills can use MCP but don't require it. |
| Skill-to-skill communication | No use case yet. Defer until patterns emerge. |
| Pricing tiers for skills | Decide after v1 ships and usage patterns are observed. |
| Skill analytics/telemetry | Nice to have but not core. Add after adoption. |
| Build-time push (`tambo skills push`) | Per-request hybrid avoids sync issues. Revisit if payload size becomes a problem. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SKILL-01 | Phase 1 | Pending |
| SKILL-02 | Phase 1 | Pending |
| SKILL-03 | Phase 1 | Pending |
| SKILL-04 | Phase 1 | Pending |
| SKILL-05 | Phase 1 | Pending |
| SKILL-06 | Phase 1 | Pending |
| RUNT-01 | Phase 2 | Pending |
| RUNT-02 | Phase 2 | Pending |
| RUNT-03 | Phase 2 | Pending |
| RUNT-04 | Phase 2 | Pending |
| RUNT-05 | Phase 2 | Pending |
| RUNT-06 | Phase 2 | Pending |
| RUNT-07 | Phase 2 | Pending |
| RUNT-08 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 1 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| CLI-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after switching to per-request hybrid model and cutting marketplace*
