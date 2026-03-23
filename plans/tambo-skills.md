# Implementation Plan: Tambo Skills

## Summary

**Date:** 2026-03-23
**Phases:** 4 (coarse granularity)
**Requirements:** 25 v1 requirements across SDK, API, CLI, and dashboard
**Branch:** `avi/tambo-skills`

Tambo Skills is a cross-cutting feature that adds modular capability packs to AI agents. A skill bundles instructions, tools, optional React components, and persistent state into a single unit. Agents use progressive disclosure to pick which skills to activate per message. Skills can be authored in code (`defineSkill()`), created from the dashboard, or installed from GitHub-based marketplace repos.

### Why Skills?

Today, developers wire individual tools and components into Tambo manually. Skills let them install or author packaged capabilities ("Stripe Checkout", "Calendar Scheduling", "Web Search") that the agent activates on demand. This is Tambo's equivalent of a plugin system, but with a unique differentiator: skills can include React components that render UI, not just tool functions. No other AI agent framework does this.

### Key Design Decisions

1. **Two-phase progressive disclosure** -- Agent sees skill descriptions always, full content only when activated
2. **Threshold-based routing** -- <=5 skills: send all (no overhead). >5: Tambo-managed fast model selects relevant skills (<500ms)
3. **Build-time registration** -- `tambo skills push` at deploy. Runtime references skill IDs, not full content
4. **Architectural isolation** -- Skills operate through API boundary + scoped context + pure tool functions. No runtime sandboxing (not framework-agnostic). This means skills only receive explicitly passed data
5. **GitHub marketplace** -- `tambo add skill` clones repos into project (shadcn pattern). No npm registry needed
6. **Thread metadata for state** -- Namespaced key-value pairs (`skillState.<name>.<key>`) on thread object
7. **Generic config table** -- Skills stored as JSONB rows with `type='skill'` in project config. Flexible, avoids schema churn
8. **Extend TamboRegistryProvider** -- No new React context. Skills decompose into existing tool/component registries
9. **Both active for conflicts** -- Dashboard + code skills with same name are treated as separate. Last-wins for tool name collisions

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
   tambo skills push                   Stored in DB
        |                                    |
   POST /projects/:id/skills/push         (source: "dashboard")
        |
   Stored in DB (source: "code")
        |
        +------- Both merged at runtime -------+
                         |
                    Run Request
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

### Where Code Lives

| Component                | Location                                              | New/Modified |
| ------------------------ | ----------------------------------------------------- | ------------ |
| `defineSkill()` + types  | `packages/client/src/model/skill-definition.ts`       | New          |
| Re-export from React SDK | `react-sdk/src/v1/index.ts`                           | Modified     |
| Registry extension       | `react-sdk/src/providers/tambo-registry-provider.tsx` | Modified     |
| DB operations            | `packages/db/src/operations/skills.ts`                | New          |
| DB schema (config table) | `packages/db/src/schema.ts`                           | Modified     |
| API CRUD endpoints       | `apps/api/src/v1/skills/`                             | New module   |
| Skill router             | `packages/backend/src/services/skill-router/`         | New          |
| Context merge            | `packages/backend/src/services/decision-loop/`        | Modified     |
| State manager            | `packages/backend/src/services/skill-state/`          | New          |
| CLI push command         | `cli/src/commands/skills/push.ts`                     | New          |
| CLI add skill            | `cli/src/commands/skills/add.ts`                      | New          |
| CLI scaffold             | `cli/src/commands/skills/new.ts`                      | New          |
| Dashboard pages          | `apps/web/app/(app)/project/[id]/skills/`             | New          |

---

## Phase 1: Skill Definition & Storage

**Goal:** Developers can define skills in code and the API can store/retrieve them.
**Requirements:** SKILL-01, SKILL-04, SKILL-05, SKILL-06, API-01, API-02, API-03, API-04

This is the highest-stakes phase. The `defineSkill()` shape becomes a permanent public API the moment it ships. Design for extension from day one.

### 1.1 Skill Definition Types (`packages/client`)

Create `packages/client/src/model/skill-definition.ts`:

- `SkillDefinition` interface with all fields (name, description, version, instructions, tools, components, stateSchema, config)
- `defineSkill()` function (typed identity function, like `defineTool()`)
- Tools can be `TamboTool[]` (inline) or `string[]` (references to externally defined tools)
- `config: Record<string, unknown>` as escape hatch for future properties without breaking changes
- Re-export from `packages/client/src/index.ts`
- Re-export from `react-sdk/src/v1/index.ts`

### 1.2 Directory Convention

A skill can be organized as a folder:

```
my-skill/
  skill.ts        # exports defineSkill({...})
  instructions.md # loaded as instructions string
```

The CLI will handle loading `instructions.md` content into the skill definition at push time. This is a convention, not enforced at runtime.

### 1.3 DB Schema & Operations (`packages/db`)

Add to generic project config table (or create one if it doesn't exist):

- `id`, `projectId`, `type` (='skill'), `name`, `source` ('code' | 'dashboard'), `enabled` (boolean), `data` (JSONB -- full skill definition), `createdAt`, `updatedAt`
- Unique constraint on (`projectId`, `type`, `name`, `source`) -- allows same name from different sources
- Operations in `packages/db/src/operations/skills.ts`: `createSkill`, `getSkill`, `listSkills`, `updateSkill`, `deleteSkill`, `upsertSkill` (for CLI push)

### 1.4 API CRUD Endpoints (`apps/api`)

New NestJS module at `apps/api/src/v1/skills/`:

- `GET /v1/projects/:projectId/skills` -- list all skills (both sources)
- `GET /v1/projects/:projectId/skills/:skillId` -- get single skill
- `POST /v1/projects/:projectId/skills` -- create skill (dashboard source)
- `PUT /v1/projects/:projectId/skills/:skillId` -- update skill
- `DELETE /v1/projects/:projectId/skills/:skillId` -- delete skill
- `POST /v1/projects/:projectId/skills/push` -- bulk upsert from CLI (code source)
- DTOs with class-validator
- ProjectAccessOwnGuard for authorization

### Success Criteria

1. `defineSkill()` returns typed `SkillDefinition` with all fields
2. Directory convention (skill.ts + instructions.md) recognized by the system
3. API CRUD endpoints work with JSONB storage
4. Same-name skills from different sources (code vs dashboard) coexist

---

## Phase 2: Registration Pipeline

**Goal:** Developers can wire skills into their app and push them to Tambo Cloud.
**Requirements:** SKILL-02, SKILL-03, CLI-01, CLI-02, CLI-03

### 2.1 SDK Provider Integration (`react-sdk`)

Extend `TamboRegistryProvider` to accept `skills` prop:

- `TamboProvider` gains `skills?: SkillDefinition[]`
- On mount, decompose each skill into its parts:
  - `skill.tools` -> merge into existing tool registry
  - `skill.components` -> merge into existing component registry (if developer opted in)
  - `skill.instructions` -> stored separately for runtime activation
  - `skill.stateSchema` -> stored for state validation
- Must NOT break existing `tools={[...]}` and `components={[...]}` usage
- Skills and standalone tools/components coexist
- `TamboClient` in `packages/client` also accepts `skills` option for non-React usage

### 2.2 CLI Push Command (`cli`)

New command: `tambo skills push`

- Scans project for skill definitions (imported from entry points or configured paths)
- Serializes `SkillDefinition` to JSON (Zod schemas converted to JSON Schema)
- Uploads to `POST /v1/projects/:projectId/skills/push` endpoint
- Idempotent: creates or updates based on skill name
- Runs at build/deploy time (integrate into CI/CD pipeline)
- Outputs summary: "Pushed 3 skills: search, checkout, calendar"

**Known pitfall:** Zod refinements/transforms are lost in JSON Schema conversion. Document this. Tool execution still uses client-side Zod schemas (safe). Write round-trip tests.

### 2.3 CLI Add Skill from GitHub (`cli`)

New command: `tambo add skill <github-repo>`

- Clones skill files from GitHub repo into project (like shadcn `npx shadcn add`)
- Detects skill directory structure in repo
- Copies into project (developer owns the code)
- Installs any npm dependencies declared in skill metadata

### 2.4 CLI Scaffold New Skill (`cli`)

New command: `tambo add skill --new <name>`

- Generates boilerplate skill directory:
  ```
  skills/<name>/
    skill.ts          # defineSkill() with placeholder
    instructions.md   # empty instructions file
  ```
- Adds import to project's skill registry

### Success Criteria

1. `skills` array on TamboProvider works alongside existing tools/components
2. Optional React components in skills appear in component registry
3. `tambo skills push` uploads skills to Tambo Cloud
4. `tambo add skill <repo>` clones from GitHub
5. `tambo add skill --new` scaffolds boilerplate

---

## Phase 3: Runtime Activation

**Goal:** Agents intelligently activate relevant skills per message with isolation and persistent state.
**Requirements:** RUNT-01 through RUNT-08

This is the core value proposition. The agent picks which skills to use, and activated skills get their full content injected into the LLM context.

### 3.1 Skill Router (`packages/backend`)

New service: `packages/backend/src/services/skill-router/skill-router-service.ts`

**Threshold logic:**

- Count active skills for the project (code + dashboard, where enabled=true)
- If <=5: include ALL skills' full content (instructions, tools, components). Skip routing. Zero added latency.
- If >5: run Tambo-managed fast model (e.g., claude-haiku or gpt-4o-mini) to select relevant skills based on:
  - User's message
  - Skill names and descriptions
  - Target: <500ms added latency
  - Returns list of selected skill names

**Output:** List of `SkillDefinition` objects to activate for this run.

### 3.2 Context Merge (`packages/backend`)

Modify decision loop to merge activated skills:

- **Instructions:** Append each skill's `instructions` to the system prompt, clearly delimited:
  ```
  [Skill: calendar-scheduling]
  You can help users schedule meetings. When a user wants to schedule...
  [End Skill: calendar-scheduling]
  ```
- **Tools:** Add each skill's tools to the tools array. Skill tools are namespaced internally but appear flat to the LLM.
- **Components:** Add each skill's components to availableComponents.
- **Last-wins:** If two skills define a tool with the same name, the later-registered skill's version is used.

### 3.3 Architectural Isolation

Skills operate through a defined contract:

- Skills receive: the user's message, their declared state, their declared resources
- Skills do NOT receive: direct TamboClient access, other skills' state, React context, thread internals
- Tool functions are pure: `(input) => output`. Side effects only through declared channels (state updates, component renders)
- Enforced at the context merge layer, not runtime sandboxing

### 3.4 Skill State (`packages/backend`)

Persistent state as thread metadata:

- Storage: `thread.metadata.skillState.<skillName>.<key>`
- Read: at the start of each run, read current skill state and pass to activated skills
- Write: skill tools can return state updates that are written back to thread metadata
- Namespace enforcement: skills can only read/write their own namespace
- Schema validation: validate against `stateSchema` if defined (client-side)

### Success Criteria

1. Agent sees descriptions always, full content only for activated skills
2. <=5 skills: all included with zero overhead. >5: fast model selects in <500ms
3. Skill state persists across messages as `skillState.<name>.<key>`
4. Skills only see explicitly passed data. Last-wins for conflicts.

---

## Phase 4: Dashboard

**Goal:** Product people can create and manage skills from the web dashboard.
**Requirements:** DASH-01 through DASH-04
**Can run in parallel with Phase 3** (only depends on Phase 1 API endpoints)

### 4.1 Skills List Page

`apps/web/app/(app)/project/[id]/skills/page.tsx`

- List all skills for the project
- Source labels: "Code" badge (blue) vs "Dashboard" badge (green)
- Enable/disable toggle per skill
- Search/filter
- "Create Skill" button

### 4.2 Skill Detail/Edit Page

`apps/web/app/(app)/project/[id]/skills/[skillId]/page.tsx`

- View skill details: name, description, instructions, tools list, components list
- Edit instructions (textarea with markdown preview)
- Edit description
- For dashboard-created skills: full edit access
- For code-pushed skills: read-only view with "Edit in code" guidance

### 4.3 Create Skill Flow

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

| Risk                                                         | Impact                                                 | Mitigation                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `defineSkill()` API surface freezes on ship                  | HIGH -- can't change public API without breaking users | Version field + config escape hatch from day one. Internal review of types before Phase 1 ships. |
| Schema serialization loss (Zod -> JSON Schema)               | MEDIUM -- dashboard/API see lossy schema               | Document limitation. Round-trip tests in Phase 2. Tool execution uses client-side Zod (safe).    |
| Skill state namespace collisions                             | MEDIUM -- silent data corruption                       | Nested object structure (`skillState.<name>.<key>`). Validate name uniqueness at registration.   |
| Stale skills after code changes (forgot `tambo skills push`) | MEDIUM -- runtime diverges from code                   | Hash comparison with client-side warning. CI/CD integration docs.                                |
| Poor descriptions cause bad routing                          | MEDIUM -- wrong skills activated                       | Description quality validation at registration. Routing decision logging.                        |
| Threshold oscillation (5 -> 6 skills changes behavior)       | LOW -- unexpected behavior change                      | Make threshold configurable. Log mode switches.                                                  |

## v2 Roadmap (Post-v1)

After v1 ships with working SDK + docs, these features follow based on user feedback:

1. **Workflow skills** -- multi-step sequences with tool call + UI render per step
2. **Slash command picker** -- typing `/` in message input opens skill selector
3. **Marketplace browsing from CLI** -- `tambo skills search`
4. **Tambo Cloud execution** -- run skill tools server-side
5. **Skill versioning** -- manage skill definition updates over time
6. **Cross-thread state** -- skill state shared across threads in a project

---

## Open Questions for Team Feedback

1. **Config table vs dedicated skills table?** The plan uses a generic config table (type='skill'). Should we use a dedicated `skills` table instead for stronger typing and easier querying?

2. **Threshold value of 5** -- is this right? Research suggests it's reasonable, but should we start lower (3) or higher (10)? We can make it configurable per project.

3. **Fast model for routing** -- which model? Claude Haiku? GPT-4o-mini? Should this be configurable per project or Tambo-managed only?

4. **Directory convention** -- should the CLI enforce a `skills/` directory or let developers put skills anywhere?

5. **Dashboard skill editing** -- should dashboard-created skills support tools (not just instructions)? This would require a tool builder UI.

6. **Skill state API** -- should `useTamboSkillState()` be a new hook, or should we extend `useTamboComponentState()` to handle skill state?

7. **Breaking change concern** -- does adding `skills` to `TamboProvider` affect the existing `TamboRegistryProvider` in any unexpected way? Need to verify backwards compatibility before Phase 2.
