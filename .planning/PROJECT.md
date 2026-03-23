# Tambo Skills

## What This Is

A skills system for Tambo that lets developers create modular capability packs for their AI agents. Skills bundle instructions, tools, optional components, and persistent state into units that agents can activate on demand. Skills can be authored in code or created from the dashboard. This is a first-class feature that touches the React SDK, client package, API, CLI, and web dashboard.

## Core Value

Developers can give their Tambo agents specialized capabilities (like scheduling meetings, managing payments, or searching data) without wiring everything manually -- and agents intelligently pick which capabilities to use per message.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] defineSkill() API for creating skills in code with instructions, tools, optional components, and state schema
- [ ] Skills passed as array prop on TamboProvider, extending existing TamboRegistryProvider
- [ ] SDK sends skill metadata per-request (like tools/components today), no build-time registration needed
- [ ] Two-phase progressive disclosure: metadata (name, description) always sent, full content only for activated skills
- [ ] Threshold-based routing: <=5 skills send all, >5 uses Tambo-managed fast model for selection
- [ ] Skills can define tools inline (defineTool inside defineSkill) or reference externally defined tools
- [ ] Skills can optionally include React components that developers explicitly opt in to using
- [ ] Skill state persisted as thread metadata (key-value pairs on thread object, persists across messages)
- [ ] Dashboard: create instruction-only skills entirely from dashboard (no code needed)
- [ ] Dashboard: enable/disable skills, edit instructions, view tools
- [ ] Dashboard-created and code-defined skills with same name are treated as separate (both active)
- [ ] CLI: tambo add skill --new scaffolds a new empty skill with boilerplate
- [ ] Architectural isolation for all skills: API boundary + scoped context + pure tool functions
- [ ] Skills only see explicitly passed data (message, declared state, declared resources), no ambient access
- [ ] Last-wins conflict resolution for overlapping skill definitions
- [ ] Execution is flexible: client-side tool execution and MCP server connections supported

### Out of Scope

- Tambo Cloud serverless execution (running skill tools on Tambo's servers) -- significant infra work, defer
- Marketplace / GitHub-based skill distribution -- defer until core skills feature is validated
- Pricing tiers for skills -- decide after v1 ships and usage patterns emerge
- Skill versioning -- defer until needed
- Runtime sandboxing (iframe/Worker) -- not framework-agnostic, architectural isolation is sufficient
- Tambo-hosted MCP servers for skills -- MCP and skills are separate concerns
- Skill-to-skill communication -- defer until use cases emerge
- Build-time registration (`tambo skills push`) -- per-request hybrid is simpler and avoids sync issues
- Slash command skill picker -- defer to v2
- Workflow skills (multi-step sequences) -- defer to v2

## Context

### Existing Architecture

Tambo is a Turborepo monorepo with React SDK, client package, CLI, API (NestJS), web dashboard (Next.js), and shared packages (db, core, backend). The existing configuration model has two surfaces:

- **Dashboard (policy layer):** system prompt (customInstructions), LLM model, override permissions
- **Code (capability layer):** tools (defineTool), components (TamboComponent), context helpers, MCP servers

Both merge at the API on each run request. Skills follow this same dual-surface model.

### Current Tool/Component Flow

- Tools and components are registered via TamboRegistryProvider in the React SDK
- Sent per-run request to the API as availableComponents and tools arrays
- Decision loop in packages/backend processes them for the LLM
- Tool execution happens client-side via tool-executor.ts

### Skills Follow This Same Flow

- Code-defined skills are sent per-request from SDK, just like tools and components (hybrid approach)
- SDK sends skill metadata (name, description) on every request for routing
- Full skill content (instructions, tools, components) sent only for activated skills
- Dashboard-created skills are stored in DB (generic config table with type='skill')
- API merges both sources at runtime -- no sync issues, no build-time registration needed

### Industry Context

The "skills" concept has standardized across AI coding tools via Anthropic's Agent Skills open standard (SKILL.md). skills.sh is the primary directory (GitHub repos, 680K+ top installs). Tambo skills are different -- they're for runtime AI agents in production apps, not coding agents.

## Constraints

- **Framework agnostic:** Skills architecture must work beyond React (Node.js, Vue, Svelte via @tambo-ai/client). No browser-specific sandboxing.
- **Backwards compatible:** Adding skills must not break existing defineTool/TamboComponent usage. Skills are additive.
- **Existing DB patterns:** Use Drizzle ORM, follow packages/db/src/operations/ pattern. Generic config table approach.
- **Per-request pattern:** Skills follow the same per-request pattern as tools and components. No separate sync/push step.
- **Performance:** Threshold-based routing must not add latency for small skill counts (<=5). Fast model selection for >5 must be <500ms.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-phase progressive disclosure for skill activation | Sending all skills every request wastes tokens. Agent picking from descriptions is proven (Claude Code model). | -- Pending |
| Threshold-based routing (<=5 send all, >5 use fast model) | Avoids latency for small configs. Most users start with few skills. Tambo-managed model avoids custom LLM quality issues. | -- Pending |
| Per-request hybrid (not build-time push) | Follows same pattern as tools/components. No sync issues. Metadata always sent, full content only for activated skills. Simpler DX than a separate push step. | -- Pending |
| Architectural isolation (not runtime sandboxing) | iframe/Worker sandbox is browser-specific, breaks framework-agnostic goal. API boundary + scoped context + pure functions provides meaningful security without runtime enforcement. | -- Pending |
| Generic config table for DB model | More flexible than dedicated skills table. Aligns with existing project configuration patterns. | -- Pending |
| Thread metadata for skill state | Avoids new table. Reuses existing thread infrastructure. Simple key-value model sufficient for v1. | -- Pending |
| Both active for dashboard/code overlap | Avoids complex merge logic. Developer can see both and manage. Simpler mental model than priority-based resolution. | -- Pending |
| Extend TamboRegistryProvider (not new provider) | Keeps architecture simple. Skills are another entity type alongside tools and components. No new React context needed. | -- Pending |
| Defer marketplace and workflow skills to v2 | Focus v1 on core skills (define, activate, state). Marketplace and workflows add complexity before core is validated. | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
