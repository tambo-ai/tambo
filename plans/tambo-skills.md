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

Both Anthropic and OpenAI have real skill APIs:

**Anthropic** (beta: `skills-2025-10-02`): Upload skill files via `POST /v1/skills`, attach to requests via `container.skills`. Skills run inside a code execution container. Supports versioning, multi-turn container reuse. Max 8 skills per request. You specify which skills to include -- no automatic routing.

**OpenAI**: Upload via `POST /v1/skills`, attach via `shell.environment.skills`. Model sees skill name/description and decides whether to use them. Skills run in a shell container.

**Important:** Both APIs are designed for skills that include executable scripts (Python, etc.) running in sandboxed containers. For instruction-only skills (which is what our v1 is), we have two options:

**Option A: Use provider skill APIs.** Upload our skills as SKILL.md files to Anthropic/OpenAI, reference them by ID per request. The provider handles injecting the skill context. Upside: we're using the standard. Downside: tied to providers that support skills, adds API calls for skill management, code execution container overhead for what's just text.

**Option B: System prompt injection.** Load skills from DB, append to system prompt with delimiters. Works with every provider. Simple. No external API dependency.

For v1, we should probably start with **Option B** (system prompt injection) because it works with all providers and our skills are just instruction text. But we should design the DB schema and SKILL.md format to be compatible with the provider APIs so we can switch to Option A later when it makes sense (e.g., when skills include scripts).

```
[Skill: scheduling-assistant]
When a user wants to schedule a meeting:
1. Ask for the participants
...
[End Skill: scheduling-assistant]
```

All enabled skills are included on every request (no routing). If skill count gets high enough to bloat the context window, we can add routing later or switch to provider APIs which handle this more efficiently.

Anthropic also has prompt caching (`cache_control: {"type": "ephemeral"}`) which can cache the skill block across requests so we're not re-tokenizing the same text every time.

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

### Phase 2: System Prompt Injection

- Modify the decision loop to load project skills from DB
- Append enabled skills to the system prompt with clear delimiters
- Add skill injection info to the run stream (for observability)
- Look into Anthropic prompt caching for the skill block

### Phase 3: Dashboard UI

- Skills list page with enable/disable toggles
- Add/edit page with SKILL.md paste and frontmatter parsing
- Frontmatter parsing with `gray-matter`
- Seth designs this

Phase 3 can run in parallel with Phase 2 since it only needs Phase 1 API endpoints.

## Risks

| Risk                              | Mitigation                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Too many skills = too many tokens | Most projects will have a few skills. If it becomes a problem, add routing later. Anthropic prompt caching helps with cost. |
| Skills conflict with each other   | Product person manages this. They can see all skills and disable ones that conflict.                                        |
| Frontmatter parsing edge cases    | If parsing fails, store the whole thing as instructions. Don't block on bad formatting.                                     |
| Agent ignores skill instructions  | This is a prompt engineering problem, not a technical one. We can help with description/instruction quality guidance.       |

## v2 Ideas

- **SDK-side skills** -- `defineSkill()` in code, TamboProvider integration, skills with tools/components
- **Provider skill APIs** -- upload skills to Anthropic/OpenAI directly instead of system prompt injection. Useful when skills include executable scripts.
- **Skill routing** -- lightweight LLM call or embedding match to pick relevant skills when there are many
- **Skill state** -- persistent data scoped to a skill within a thread
- **Marketplace** -- browse and install skills from GitHub repos
- **Slash commands** -- `/` in message input opens skill picker
- **Workflow skills** -- multi-step sequences with tool + UI per step
- **Skill creator** -- AI generates skills by analyzing the app (Claude Code flow)
- **T-stack / intentions** -- skills via npm install (Alec is looking into this)

## Open Questions

1. **Dedicated table vs generic config table?** Leaning dedicated `skills` table since we know the schema and it's easier to query.

2. **System prompt injection vs provider skill APIs?** v1 starts with system prompt injection (works with all providers). But Anthropic and OpenAI both have real skill APIs now (beta). Should we plan the DB/SKILL.md format to be compatible so we can switch later? Probably yes.

3. **Should the skill description be used by the LLM for anything?** Right now it's just for the dashboard UI. But if we add routing later, the description would be what the router reads. Worth storing separately from instructions even if we don't use it in v1.

4. **How do skills show up in observability?** Need to define what "skill was included in this run" looks like in the run stream / thread history.

5. **Skill creation through Claude Code** -- Michael suggested "read my app and generate skills." Could be a strong onboarding flow. Separate from v1 but worth thinking about.
