# Tambo Skills

## What This Is

A skills system for Tambo that lets developers create modular capability packs for their AI agents. Skills bundle instructions, tools, optional components, and persistent state into units that agents can activate on demand. Skills can be authored in code, created from the dashboard, or installed from a GitHub-based marketplace. This is a first-class feature that touches the React SDK, client package, API, CLI, and web dashboard.

## Core Value

Developers can give their Tambo agents specialized capabilities (like scheduling meetings, managing payments, or searching data) without wiring everything manually -- and agents intelligently pick which capabilities to use per message.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] defineSkill() API for creating skills in code with instructions, tools, optional components, and state schema
- [ ] Skills passed as array prop on TamboProvider, extending existing TamboRegistryProvider
- [ ] Skills registered with Tambo Cloud at build/deploy time via CLI (tambo skills push), runtime references skill IDs
- [ ] Two-phase progressive disclosure: agent sees skill descriptions, activates relevant ones, gets full content
- [ ] Threshold-based routing: <=5 skills send all, >5 uses Tambo-managed fast model for selection
- [ ] Skills can define tools inline (defineTool inside defineSkill) or reference externally defined tools
- [ ] Skills can optionally include React components that developers explicitly opt in to using
- [ ] Skill state persisted as thread metadata (key-value pairs on thread object, persists across messages)
- [ ] Dashboard: create instruction-only skills entirely from dashboard (no code needed)
- [ ] Dashboard: enable/disable skills, edit instructions, view tools
- [ ] Dashboard: browse/install skills from GitHub-based marketplace
- [ ] Dashboard-created and code-defined skills with same name are treated as separate (both active)
- [ ] CLI: tambo add skill clones skill files from GitHub repos into project (like shadcn pattern)
- [ ] CLI: tambo skills push registers skills with Tambo Cloud at build time
- [ ] Architectural isolation for all skills: API boundary + scoped context + pure tool functions
- [ ] Skills only see explicitly passed data (message, declared state, declared resources), no ambient access
- [ ] Slash command integration: typing / in message input opens skill picker menu
- [ ] Workflow skills: complex skills can define explicit step sequences (tool call + UI render per step)
- [ ] Simple skills: agent figures out tool order from instructions (freestyle mode)
- [ ] Last-wins conflict resolution for overlapping skill definitions
- [ ] Execution is flexible: client-side tool execution and MCP server connections supported

### Out of Scope

- Tambo Cloud serverless execution (running skill tools on Tambo's servers) -- significant infra work, defer
- npm registry for marketplace -- too much work, GitHub-based distribution is sufficient
- Pricing tiers for skills -- decide after v1 ships and usage patterns emerge
- Skill versioning -- defer until marketplace matures
- Runtime sandboxing (iframe/Worker) -- not framework-agnostic, architectural isolation is sufficient
- Tambo-hosted MCP servers for skills -- MCP and skills are separate concerns
- Skill-to-skill communication -- defer until use cases emerge

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

### Skills Change This Flow

- Skills are registered once at build time (not per-request)
- API stores skill definitions (generic config table with type='skill')
- Runtime requests reference skill IDs, keeping payloads small
- Two-phase activation means not all skill content is sent to LLM every time
- Skill picker UI in message input component builds on existing slash command detection from MCP work

### Industry Context

The "skills" concept has standardized across AI coding tools via Anthropic's Agent Skills open standard (SKILL.md). skills.sh is the primary directory (GitHub repos, 680K+ top installs). Tambo skills are different -- they're for runtime AI agents in production apps, not coding agents. But the marketplace model (GitHub-based, clone into project) is proven.

## Constraints

- **Framework agnostic:** Skills architecture must work beyond React (Node.js, Vue, Svelte via @tambo-ai/client). No browser-specific sandboxing.
- **Backwards compatible:** Adding skills must not break existing defineTool/TamboComponent usage. Skills are additive.
- **Existing DB patterns:** Use Drizzle ORM, follow packages/db/src/operations/ pattern. Generic config table approach.
- **Build system:** CLI changes must work with existing tambo init/add patterns. Skills push integrates with build pipeline.
- **Performance:** Threshold-based routing must not add latency for small skill counts (<=5). Fast model selection for >5 must be <500ms.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-phase progressive disclosure for skill activation | Sending all skills every request wastes tokens. Agent picking from descriptions is proven (Claude Code model). | -- Pending |
| Threshold-based routing (<=5 send all, >5 use fast model) | Avoids latency for small configs. Most users start with few skills. Tambo-managed model avoids custom LLM quality issues. | -- Pending |
| Build-time registration via CLI (not per-request) | Keeps runtime payloads small. API has full skill knowledge for routing. Clean separation of deploy vs runtime. | -- Pending |
| Architectural isolation (not runtime sandboxing) | iframe/Worker sandbox is browser-specific, breaks framework-agnostic goal. API boundary + scoped context + pure functions provides meaningful security without runtime enforcement. | -- Pending |
| GitHub-based marketplace (not npm registry) | Proven model (skills.sh). Much less infrastructure. Clone into project = developer owns code, can customize. Like shadcn. | -- Pending |
| Generic config table for DB model | More flexible than dedicated skills table. Aligns with existing project configuration patterns. | -- Pending |
| Thread metadata for skill state | Avoids new table. Reuses existing thread infrastructure. Simple key-value model sufficient for v1. | -- Pending |
| Both active for dashboard/code overlap | Avoids complex merge logic. Developer can see both and manage. Simpler mental model than priority-based resolution. | -- Pending |
| Extend TamboRegistryProvider (not new provider) | Keeps architecture simple. Skills are another entity type alongside tools and components. No new React context needed. | -- Pending |
| Workflow steps = tool call + UI render | Covers the calendar scheduling use case. Agent can show a component at each step for user confirmation/interaction. | -- Pending |

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
