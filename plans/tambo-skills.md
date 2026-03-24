# Tambo Skills

**Date:** 2026-03-24
**Branch:** `avi/tambo-skills`

## Problem

When a developer integrates Tambo into their app, they configure the agent with a system prompt (custom instructions). As the app grows, that prompt becomes a dumping ground -- how to handle scheduling, how to talk about pricing, what to do when someone asks for help, how to fill out forms, etc.

This doesn't scale. The context window fills up, instructions conflict, the agent gets confused. And if a product person wants to tweak how the agent handles a specific task, they have to ask an engineer to edit the system prompt and deploy.

**Skills solve this.** A skill is a focused set of instructions for a specific task. Instead of one giant prompt, you have modular pieces. A product person can add, edit, or disable skills from the dashboard without touching code.

### What does "working" look like?

1. Product person goes to the Tambo dashboard, clicks "Add Skill"
2. They paste a SKILL.md file (or we help them generate one)
3. The agent now knows how to do that thing
4. They can see in the observability panel whether the skill was triggered
5. If the agent isn't behaving right, they edit the skill and try again

No code changes, no deploys, no engineer in the loop.

## v1 Scope

**Dashboard-only. No SDK changes.**

A place in the project dashboard to manage skills. Skills are stored in the DB and injected into the system prompt on each request.

### What a skill is

A skill has three fields:

- **Name** -- identifies the skill (e.g., "scheduling-assistant")
- **Description** -- short summary so the team knows what it does
- **Instructions** -- the full text that gets injected into the agent's context

That's it. No version, no tools, no components, no state schema.

### How skills get created

The dashboard has a textarea where you paste the contents of a SKILL.md file. This is the same format used by Claude Code, Codex, Cursor, etc. -- it's the industry standard for agent skills.

A SKILL.md file looks like this:

```yaml
---
name: scheduling-assistant
description: Helps users schedule and manage calendar events
---

When a user wants to schedule a meeting:
1. Ask for the participants
2. Check availability using the calendar tool
3. Propose available time slots
4. Confirm and create the event
```

The part between `---` markers at the top is YAML frontmatter (name and description). Everything after is the instructions.

When you paste this into the dashboard, we parse it and split it into three fields:

- `name` = "scheduling-assistant" (from frontmatter)
- `description` = "Helps users schedule and manage calendar events" (from frontmatter)
- `instructions` = everything after the second `---`

**Why we parse it apart:**

- **Name** is used as the identifier in the skills list, in observability ("Skill triggered: scheduling-assistant"), and as the unique key in the DB
- **Description** is shown in the skills list so the product person knows what each skill does at a glance. If we add routing later, this is what the router reads to decide if a skill is relevant.
- **Instructions** is the text that actually gets injected into the agent's context at runtime. This is the only part the LLM sees.

We store them as separate DB columns so we can list/search/filter skills by name and description without parsing the SKILL.md blob every time. After parsing, all three fields are shown as editable inputs so you can tweak them individually.

### How skills reach the LLM

We use the provider skill APIs directly. Both Anthropic and OpenAI have them:

**Anthropic** (beta: `skills-2025-10-02`): Upload skill files via `POST /v1/skills`, attach to requests via `container.skills`. Supports versioning, multi-turn container reuse. Max 8 skills per request. You specify which skills to include per request.

**OpenAI**: Upload via `POST /v1/skills`, attach via `shell.environment.skills`. Model sees skill name/description and decides whether to use them.

The flow:

1. When a skill is created/updated on the Tambo dashboard, we upload the SKILL.md to the provider's skill API and store the returned skill ID
2. On each run request, we attach the enabled skills by ID
3. The provider handles injecting the skill context into the model

For providers that don't support skill APIs yet, we fall back to appending skill instructions to the system prompt with delimiters. Same content, different delivery mechanism.

All enabled skills are included on every request. No routing for v1 -- we specify all of them and let the provider/model figure out what's relevant.

### Dashboard UI

**Skills list page** (`/project/[id]/skills`)

- List of all skills for the project
- Enable/disable toggle per skill
- "Add Skill" button
- Edit / delete actions

**Add/edit skill page**

- Paste SKILL.md textarea (parses frontmatter into name/description/instructions)
- Name, description, instructions shown as editable fields after parsing
- Save / cancel

Seth will design this.

### DB Storage

- `id`, `projectId`, `name`, `description`, `instructions` (text), `enabled` (boolean), `createdAt`, `updatedAt`
- Unique constraint on (`projectId`, `name`)
- Operations in `packages/db/src/operations/skills.ts`
- CRUD endpoints at `/v1/projects/:projectId/skills`

### Observability

When skills are included in a run, it should show up in the observability/thread history panel:

- Which skills were injected for this run
- The product person can see if the skill instructions are actually reaching the agent
- If the agent isn't behaving right on a specific task, they can check whether the relevant skill was enabled

This is for the team managing the agent, not end users.

## What's NOT in v1

| What                                            | Why not                                                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `defineSkill()` in SDK / TamboProvider          | Dashboard first. SDK integration later after we validate the concept.                                                  |
| Skill routing (picking which skills to include) | Just include all enabled skills. Routing is an optimization for when someone has 20+ skills.                           |
| Skill state                                     | Skills are just text. State adds complexity before we know anyone needs it.                                            |
| Tools/components inside skills                  | If the instructions say "use the calendar tool" and that tool exists, the agent will use it. No formal binding needed. |
| Marketplace / GitHub distribution               | Validate that skills work at all before thinking about sharing them.                                                   |
| End-user skill visibility                       | Skills are config. End users don't see them.                                                                           |
| Slash command picker                            | Needs SDK changes. v2.                                                                                                 |
| Workflow step sequences                         | Complex, unvalidated. v2.                                                                                              |

## Implementation

### Phase 1: DB + API

- Add skills table to `packages/db`
- DB operations: `createSkill`, `getSkill`, `listSkills`, `updateSkill`, `deleteSkill`, `toggleSkill`
- NestJS CRUD endpoints at `/v1/projects/:projectId/skills`
- DTOs with class-validator, ProjectAccessOwnGuard

### Phase 2: LLM Integration

- When a skill is created/updated in the dashboard, upload the SKILL.md to the provider's skill API (Anthropic, OpenAI) and store the returned skill ID
- On each run request, attach enabled skills by provider skill ID
- For providers without skill APIs, fall back to appending instructions to the system prompt with delimiters
- Add skill injection info to the run stream (for observability)

### Phase 3: Dashboard UI

- Skills list page with enable/disable toggles
- Add/edit page with SKILL.md paste and frontmatter parsing
- Frontmatter parsing with `gray-matter`
- Seth designs this

Phase 3 can run in parallel with Phase 2 since it only needs Phase 1 API endpoints.

## Risks

| Risk                                        | Mitigation                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider skill APIs are beta and may change | Store raw SKILL.md in our DB as source of truth. Provider skill IDs are cached references we can re-upload. System prompt fallback for unsupported providers. |
| Too many skills                             | Anthropic caps at 8 per request. Most projects will have a handful. Add routing later if needed.                                                              |
| Skills conflict with each other             | Product person manages this. They can see all skills and disable ones that conflict.                                                                          |
| Frontmatter parsing edge cases              | If parsing fails, store the whole thing as instructions. Don't block on bad formatting.                                                                       |
| Agent ignores skill instructions            | Prompt engineering problem, not technical. We can help with description/instruction quality guidance.                                                         |

## v2 Ideas

- **SDK-side skills** -- `defineSkill()` in code, TamboProvider integration, skills with tools/components
- **Skill routing** -- lightweight LLM call or embedding match to pick relevant skills when there are many
- **Skill state** -- persistent data scoped to a skill within a thread
- **Marketplace** -- browse and install skills from GitHub repos
- **Slash commands** -- `/` in message input opens skill picker
- **Workflow skills** -- multi-step sequences with tool + UI per step
- **Skill creator** -- AI generates skills by analyzing the app (Claude Code flow)
- **T-stack / intentions** -- skills via npm install (Alec is looking into this)

## Open Questions

1. **Dedicated table vs generic config table?** Leaning dedicated `skills` table since we know the schema and it's easier to query.

2. **Provider API sync timing.** When a skill is created/updated in the dashboard, do we upload to the provider immediately (sync) or lazily on next run request? Immediate is simpler but means we need provider credentials at dashboard-write time.

3. **Should the skill description be used by the LLM for anything?** Right now it's just for the dashboard UI. But if we add routing later, the description would be what the router reads. Worth storing separately from instructions even if we don't use it in v1.

4. **How do skills show up in observability?** Need to define what "skill was included in this run" looks like in the run stream / thread history.

5. **Skill creation through Claude Code** -- Michael suggested "read my app and generate skills." Could be a strong onboarding flow. Separate from v1 but worth thinking about.
