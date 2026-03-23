# Implementation Plan: Tambo Skills

## Summary

**Date:** 2026-03-23
**Phases:** 3 (coarse granularity)
**Requirements:** 23 v1 requirements across SDK, API, CLI, and dashboard
**Branch:** `avi/tambo-skills`

Tambo Skills is a cross-cutting feature that adds modular capability packs to AI agents. A skill bundles instructions, tools, optional React components, and persistent state into a single unit. Agents use progressive disclosure to pick which skills to activate per message. Skills can be authored in code (`defineSkill()`) or created from the dashboard.

### Why Skills?

Today, developers wire individual tools and components into Tambo manually. Skills let them author packaged capabilities ("Stripe Checkout", "Calendar Scheduling", "Web Search") that the agent activates on demand. This is Tambo's equivalent of a plugin system, but with a unique differentiator: skills can include React components that render UI, not just tool functions. No other AI agent framework does this.

### Key Design Decisions

1. **Per-request hybrid** -- Skills follow the same per-request pattern as tools/components. SDK sends skill metadata with every run request. No build-time push, no sync issues.
2. **Two-phase progressive disclosure** -- Metadata (name, description) always sent. Full content (instructions, tools, components) only for activated skills.
3. **Threshold-based routing** -- <=5 skills: send all (no overhead). >5: Tambo-managed fast model selects relevant skills (<500ms).
4. **Architectural isolation** -- Skills operate through API boundary + scoped context + pure tool functions. No runtime sandboxing (not framework-agnostic). Skills only receive explicitly passed data.
5. **Thread metadata for state** -- Namespaced key-value pairs (`skillState.<name>.<key>`) on thread object.
6. **Generic config table** -- Dashboard-created skills stored as JSONB rows with `type='skill'` in project config. Code-defined skills are per-request, not stored in DB.
7. **Extend TamboRegistryProvider** -- No new React context. Skills decompose into existing tool/component registries.
8. **Both active for conflicts** -- Dashboard + code skills with same name are treated as separate. Last-wins for tool name collisions.

---

## Architecture

### Skill Definition Shape

```typescript
// @tambo-ai/client
interface SkillDefinition {
  name: string; // Unique identifier
  description: string; // Used for routing (agent reads this)
  version: string; // Semantic version
  instructions: string; // Injected into system prompt when active
  tools?: TamboTool[]; // Inline or externally referenced
  components?: TamboComponent[]; // Optional, developer opts in
  stateSchema?: StandardSchemaV1; // Schema for skill state (thread metadata)
  config?: Record<string, unknown>; // Escape hatch for future properties
}

function defineSkill(definition: SkillDefinition): SkillDefinition;
```

### Data Flow

```
Developer writes code              Dashboard user creates skill
        |                                    |
   defineSkill()                    POST /projects/:id/skills
        |                                    |
   skills={[...]} on                   Stored in DB
   TamboProvider                     (source: "dashboard")
        |                                    |
   SDK sends metadata               API loads from DB
   per-request                       per-request
        |                                    |
        +------- Both merged at runtime -------+
                         |
                    Run Request
           (SDK skills + DB dashboard skills)
                         |
                 Skill Router (API)
                    /        \
          <=5 skills       >5 skills
          include all      fast model selects
                    \        /
                Context Merge
                         |
            Instructions -> system prompt
            Tools -> tools array
            Components -> available components
                         |
                    LLM Request
                         |
                 Agent Response
                    /        \
            Tool calls      Component renders
                    \        /
              Skill State Updates
              (thread metadata)
```

**How it works:**

1. Developer defines skills in code via `defineSkill()` and passes them to `TamboProvider`
2. Product person creates instruction-only skills from dashboard (stored in DB)
3. On each run request, SDK sends code-defined skill metadata alongside the message
4. API loads dashboard skills from DB and merges with SDK-provided skills
5. Skill router decides which skills to activate (all if <=5, fast model picks if >5)
6. Activated skills' instructions/tools/components are merged into the LLM context
7. No sync issues because there's no separate registration step

### Where Code Lives

| Component                     | Location                                              | New/Modified |
| ----------------------------- | ----------------------------------------------------- | ------------ |
| `defineSkill()` + types       | `packages/client/src/model/skill-definition.ts`       | New          |
| Re-export from React SDK      | `react-sdk/src/v1/index.ts`                           | Modified     |
| Registry extension            | `react-sdk/src/providers/tambo-registry-provider.tsx` | Modified     |
| Skill metadata in run request | `packages/client/src/utils/send-message.ts`           | Modified     |
| DB operations                 | `packages/db/src/operations/skills.ts`                | New          |
| DB schema (config table)      | `packages/db/src/schema.ts`                           | Modified     |
| API CRUD endpoints            | `apps/api/src/v1/skills/`                             | New module   |
| Skill router                  | `packages/backend/src/services/skill-router/`         | New          |
| Context merge                 | `packages/backend/src/services/decision-loop/`        | Modified     |
| State manager                 | `packages/backend/src/services/skill-state/`          | New          |
| CLI scaffold                  | `cli/src/commands/add/skill.ts`                       | New          |
| Dashboard pages               | `apps/web/app/(app)/project/[id]/skills/`             | New          |

---

## Phase 1: Skill Definition & SDK Integration

**Goal:** Developers can define skills in code, wire them into TamboProvider, and the API can store dashboard-created skills.
**Requirements:** SKILL-01, SKILL-02, SKILL-03, SKILL-04, SKILL-05, SKILL-06, API-02, API-04, CLI-01

This is the highest-stakes phase. The `defineSkill()` shape becomes a permanent public API the moment it ships. Design for extension from day one.

### 1.1 Skill Definition Types (`packages/client`)

Create `packages/client/src/model/skill-definition.ts`:

- `SkillDefinition` interface with all fields (name, description, version, instructions, tools, components, stateSchema, config)
- `defineSkill()` function (typed identity function, like `defineTool()`)
- Tools can be `TamboTool[]` (inline) or `string[]` (references to externally defined tools)
- `config: Record<string, unknown>` as escape hatch for future properties without breaking changes
- Re-export from `packages/client/src/index.ts`
- Re-export from `react-sdk/src/v1/index.ts`

### 1.2 SDK Provider Integration (`react-sdk`)

Extend `TamboRegistryProvider` to accept `skills` prop:

- `TamboProvider` gains `skills?: SkillDefinition[]`
- On mount, decompose each skill into its parts:
  - `skill.tools` -> merge into existing tool registry
  - `skill.components` -> merge into existing component registry (if developer opted in)
  - `skill.instructions` -> stored separately for runtime activation
  - `skill.stateSchema` -> stored for state validation
- Must NOT break existing `tools={[...]}` and `components={[...]}` usage
- `TamboClient` in `packages/client` also accepts `skills` option for non-React usage

### 1.3 Skill Metadata in Run Requests

Modify `packages/client/src/utils/send-message.ts`:

- Include skill metadata (name, description, tool names) in run request payload
- Full skill content (instructions, tool schemas, component schemas) also sent per-request
- Follows the same pattern as `availableComponents` and `tools` arrays
- API uses this data for routing and context merge

### 1.4 Directory Convention

A skill can be organized as a folder:

```
my-skill/
  skill.ts        # exports defineSkill({...})
  instructions.md # developer loads as instructions string
```

This is a convention for code organization, not enforced by the runtime.

### 1.5 DB Schema & Operations (`packages/db`)

For dashboard-created skills only (code-defined skills are per-request, not stored):

- Generic config table: `id`, `projectId`, `type` (='skill'), `name`, `source` ('dashboard'), `enabled` (boolean), `data` (JSONB), `createdAt`, `updatedAt`
- Operations in `packages/db/src/operations/skills.ts`: `createSkill`, `getSkill`, `listSkills`, `updateSkill`, `deleteSkill`

### 1.6 API CRUD Endpoints (`apps/api`)

New NestJS module at `apps/api/src/v1/skills/`:

- `GET /v1/projects/:projectId/skills` -- list dashboard skills
- `GET /v1/projects/:projectId/skills/:skillId` -- get single skill
- `POST /v1/projects/:projectId/skills` -- create skill (dashboard)
- `PUT /v1/projects/:projectId/skills/:skillId` -- update skill
- `DELETE /v1/projects/:projectId/skills/:skillId` -- delete skill
- DTOs with class-validator
- ProjectAccessOwnGuard for authorization

### 1.7 CLI Scaffold New Skill (`cli`)

New command: `tambo add skill --new <name>`

- Generates boilerplate skill directory:
  ```
  <name>/
    skill.ts          # defineSkill() with placeholder
    instructions.md   # empty instructions file
  ```

### Success Criteria

1. `defineSkill()` returns typed `SkillDefinition` with all fields
2. `skills` array on TamboProvider decomposes into existing registries without breaking current usage
3. Optional React components in skills appear in component registry
4. Directory convention works (skill.ts + instructions.md)
5. `tambo add skill --new` scaffolds boilerplate
6. API CRUD endpoints for dashboard skills work with JSONB storage

---

## Phase 2: Runtime Activation

**Goal:** Agents intelligently activate relevant skills per message with isolation, progressive disclosure, and persistent state.
**Requirements:** RUNT-01 through RUNT-08, API-01, API-03

This is the core value proposition. The agent picks which skills to use, and activated skills get their full content injected into the LLM context.

### 2.1 Skill Merge at Runtime

On each run request:

1. SDK sends code-defined skills (metadata + full content) in the request payload
2. API loads enabled dashboard skills from DB for the project
3. Both sets are merged into a unified skill list
4. Dashboard + code skills with the same name are treated as separate (both active)

### 2.2 Skill Router (`packages/backend`)

New service: `packages/backend/src/services/skill-router/skill-router-service.ts`

**Threshold logic:**

- Count total active skills (code + dashboard)
- If <=5: include ALL skills' full content. Skip routing. Zero added latency.
- If >5: run Tambo-managed fast model (e.g., claude-haiku or gpt-4o-mini) to select relevant skills based on:
  - User's message
  - Skill names and descriptions
  - Target: <500ms added latency
  - Returns list of selected skill names

### 2.3 Context Merge (`packages/backend`)

Modify decision loop to merge activated skills:

- **Instructions:** Append each skill's `instructions` to the system prompt, clearly delimited:
  ```
  [Skill: calendar-scheduling]
  You can help users schedule meetings...
  [End Skill: calendar-scheduling]
  ```
- **Tools:** Add each skill's tools to the tools array
- **Components:** Add each skill's components to availableComponents
- **Last-wins:** If two skills define a tool with the same name, the later-registered skill's version is used

### 2.4 Architectural Isolation

Skills operate through a defined contract:

- Skills receive: the user's message, their declared state, their declared resources
- Skills do NOT receive: direct TamboClient access, other skills' state, React context, thread internals
- Tool functions are pure: `(input) => output`
- Enforced at the context merge layer, not runtime sandboxing

### 2.5 Skill State (`packages/backend`)

Persistent state as thread metadata:

- Storage: `thread.metadata.skillState.<skillName>.<key>`
- Read: at the start of each run, read current skill state and pass to activated skills
- Write: skill tools can return state updates that are written back to thread metadata
- Namespace enforcement: skills can only read/write their own namespace

### Success Criteria

1. SDK skills and dashboard skills merged correctly at runtime
2. Agent sees descriptions always, full content only for activated skills
3. <=5 skills: all included with zero overhead. >5: fast model selects in <500ms
4. Skill state persists across messages as `skillState.<name>.<key>`
5. Skills only see explicitly passed data. Last-wins for conflicts.

---

## Phase 3: Dashboard

**Goal:** Product people can create and manage skills from the web dashboard.
**Requirements:** DASH-01 through DASH-04
**Can run in parallel with Phase 2** (only depends on Phase 1 API endpoints)

### 3.1 Skills List Page

`apps/web/app/(app)/project/[id]/skills/page.tsx`

- List all skills for the project (dashboard-created + code-defined visible via run telemetry)
- Source labels: "Code" badge (blue) vs "Dashboard" badge (green)
- Enable/disable toggle per skill (dashboard skills only)
- "Create Skill" button

### 3.2 Skill Detail/Edit Page

`apps/web/app/(app)/project/[id]/skills/[skillId]/page.tsx`

- View skill details: name, description, instructions, tools list, components list
- Edit instructions (textarea with markdown preview)
- Edit description
- For dashboard-created skills: full edit access
- For code-defined skills: read-only view with "Edit in code" guidance

### 3.3 Create Skill Flow

- Name (required, validated unique within project+source)
- Description (required, with guidance on quality for routing)
- Instructions (markdown editor)
- No tools or components (dashboard skills are instruction-only)
- Auto-enabled on creation

### Success Criteria

1. Toggle skills on/off per project
2. View details with source labels
3. Create and edit instruction-only skills from dashboard

---

## Risks & Mitigations

| Risk                                                   | Impact                                                    | Mitigation                                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `defineSkill()` API surface freezes on ship            | HIGH -- can't change public API without breaking users    | Version field + config escape hatch from day one. Internal review of types before Phase 1 ships.                         |
| Per-request payload size with many skills              | MEDIUM -- large payloads if skills have long instructions | Threshold routing reduces what's sent to LLM. Monitor payload sizes. Build-time push can be added later as optimization. |
| Skill state namespace collisions                       | MEDIUM -- silent data corruption                          | Nested object structure (`skillState.<name>.<key>`). Validate name uniqueness.                                           |
| Poor descriptions cause bad routing                    | MEDIUM -- wrong skills activated                          | Description quality validation. Routing decision logging.                                                                |
| Threshold oscillation (5 -> 6 skills changes behavior) | LOW -- unexpected behavior change                         | Make threshold configurable. Log mode switches.                                                                          |

## v2 Roadmap (Post-v1)

After v1 ships with working SDK + docs, these features follow based on user feedback:

1. **Workflow skills** -- multi-step sequences with tool call + UI render per step
2. **Slash command picker** -- typing `/` in message input opens skill selector
3. **Marketplace** -- `tambo add skill <github-repo>` for GitHub-based distribution
4. **Build-time push** -- `tambo skills push` for large skill catalogs (optimization)
5. **Tambo Cloud execution** -- run skill tools server-side
6. **Skill versioning** -- manage skill definition updates over time
7. **Cross-thread state** -- skill state shared across threads in a project

---

## Open Questions for Team Feedback

1. **Config table vs dedicated skills table?** The plan uses a generic config table (type='skill') for dashboard skills. Should we use a dedicated `skills` table instead for stronger typing and easier querying?

2. **Threshold value of 5** -- is this right? Should we start lower (3) or higher (10)? We can make it configurable per project.

3. **Fast model for routing** -- which model? Claude Haiku? GPT-4o-mini? Should this be configurable per project or Tambo-managed only?

4. **Skill state API** -- should `useTamboSkillState()` be a new hook, or should we extend `useTamboComponentState()` to handle skill state?

5. **Per-request payload concern** -- skill instructions can be long text. Is there a point where we'd want to cache skills server-side to avoid sending them every request? Or is per-request fine for v1?

6. **Code skills visibility in dashboard** -- code-defined skills are per-request and not stored in DB. How does the dashboard show them? Options: (a) don't show them, (b) show them from run telemetry, (c) add an endpoint that returns "last seen" skills from recent runs.

7. **Breaking change concern** -- does adding `skills` to `TamboProvider` affect the existing `TamboRegistryProvider` in any unexpected way? Need to verify backwards compatibility.
